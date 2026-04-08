from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from database import get_db
from security import rate_limit, cached
from scheduler import fetch_sport_if_stale

odds_bp = Blueprint("odds", __name__)

SPORT_MAP = {
    "nfl": "americanfootball_nfl",
    "nba": "basketball_nba",
    "mlb": "baseball_mlb",
    "nhl": "icehockey_nhl",
}
SPORT_MAP_INV = {v: k for k, v in SPORT_MAP.items()}

RANGE_HOURS = {"90m": 1.5, "6h": 6, "24h": 24, "all": 720}
SHARP_THRESHOLD = 2.0   # points of movement in spread
SHARP_WINDOW_H  = 3     # hours to look back


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _better_price(new_price: int, cur_price: int) -> bool:
    """American odds: less negative / more positive = better for bettor."""
    def dec(p):
        return p / 100 if p > 0 else 100 / abs(p)
    return dec(new_price) > dec(cur_price)


def _find_best_odds(home: str, away: str, books_data: dict) -> dict:
    best: dict = {"spread": {}, "h2h": {}, "totals": {}}

    for book, markets in books_data.items():
        # Spread
        if "spreads" in markets:
            for team, data in markets["spreads"].items():
                side = "home" if team == home else "away"
                cur = best["spread"].get(side)
                if cur is None or _better_price(data["price"], cur["price"]):
                    best["spread"][side] = {**data, "bookmaker": book, "team": team}

        # Moneyline
        if "h2h" in markets:
            for team, data in markets["h2h"].items():
                side = "home" if team == home else "away"
                cur = best["h2h"].get(side)
                if cur is None or _better_price(data["price"], cur["price"]):
                    best["h2h"][side] = {**data, "bookmaker": book, "team": team}

        # Totals
        if "totals" in markets:
            for name, data in markets["totals"].items():
                side = name.lower()  # "over" / "under"
                cur = best["totals"].get(side)
                if cur is None or _better_price(data["price"], cur["price"]):
                    best["totals"][side] = {**data, "bookmaker": book}

    return best


def _get_line_movement(conn, game_id: str, hours: int = 1) -> dict:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S")

    rows = conn.execute(
        """SELECT ls.outcome_name, ls.point, ls.recorded_at, ls.home_team
           FROM line_snapshots ls
           WHERE ls.game_id = ? AND ls.market = 'spreads' AND ls.recorded_at >= ?
           ORDER BY ls.recorded_at""",
        (game_id, cutoff),
    ).fetchall()

    if len(rows) < 2:
        return {"spread_change": 0, "direction": "none"}

    home_team = rows[0]["home_team"]
    home_rows = [r for r in rows if r["outcome_name"] == home_team and r["point"] is not None]

    if len(home_rows) < 2:
        return {"spread_change": 0, "direction": "none"}

    change = round(home_rows[-1]["point"] - home_rows[0]["point"], 1)
    return {
        "spread_change": change,
        "direction": "up" if change > 0 else ("down" if change < 0 else "none"),
    }


def _check_sharp_action(conn, game_id: str) -> bool:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=SHARP_WINDOW_H)).strftime("%Y-%m-%dT%H:%M:%S")

    rows = conn.execute(
        """SELECT outcome_name, point FROM line_snapshots
           WHERE game_id = ? AND market = 'spreads' AND recorded_at >= ? AND point IS NOT NULL""",
        (game_id, cutoff),
    ).fetchall()

    by_team = {}
    for row in rows:
        by_team.setdefault(row["outcome_name"], []).append(row["point"])

    return any(
        (max(pts) - min(pts)) >= SHARP_THRESHOLD
        for pts in by_team.values()
        if len(pts) >= 2
    )


def _build_books_data(rows) -> dict:
    books_data: dict = {}
    for row in rows:
        bk, mkt, name = row["bookmaker"], row["market"], row["outcome_name"]
        books_data.setdefault(bk, {}).setdefault(mkt, {})[name] = {
            "price": row["price"],
            "point": row["point"],
        }
    return books_data


def _build_game_summary(conn, game: dict, latest_ts: str) -> dict:
    rows = conn.execute(
        """SELECT bookmaker, market, outcome_name, price, point
           FROM line_snapshots
           WHERE game_id = ? AND recorded_at = ?""",
        (game["game_id"], latest_ts),
    ).fetchall()

    books_data = _build_books_data(rows)
    best = _find_best_odds(game["home_team"], game["away_team"], books_data)
    movement = _get_line_movement(conn, game["game_id"], hours=1)
    is_sharp = _check_sharp_action(conn, game["game_id"])

    # Normalize bookmakers: {bk: {market: {home/away/over/under: {price, point}}}}
    normalized = {}
    for bk, markets in books_data.items():
        normalized[bk] = {}
        home = game["home_team"]
        away = game["away_team"]
        if "spreads" in markets:
            normalized[bk]["spreads"] = {
                "away": markets["spreads"].get(away),
                "home": markets["spreads"].get(home),
            }
        if "h2h" in markets:
            normalized[bk]["h2h"] = {
                "away": markets["h2h"].get(away),
                "home": markets["h2h"].get(home),
            }
        if "totals" in markets:
            normalized[bk]["totals"] = {
                "over":  markets["totals"].get("Over"),
                "under": markets["totals"].get("Under"),
            }

    return {
        "id":            game["game_id"],
        "sport":         game["sport"],
        "home_team":     game["home_team"],
        "away_team":     game["away_team"],
        "commence_time": game["commence_time"],
        "best_odds":     best,
        "bookmakers":    normalized,
        "line_movement": movement,
        "is_sharp":      is_sharp,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@odds_bp.route("/games")
@rate_limit(max_requests=60, window=60)
def get_games():
    sport_filter = request.args.get("sport", "all").lower()

    # Free-plan-safe behavior:
    # - selected sport pages may refresh stale data
    # - the "all sports" board serves cached data only
    if sport_filter != "all":
        sport_key = SPORT_MAP.get(sport_filter)
        if sport_key:
            fetch_sport_if_stale(sport_key)

    with get_db() as conn:
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

        # Group by game_id+sport+teams only (not commence_time) so games with
        # slightly different stored commence_time values don't produce duplicates.
        base_query = """
            SELECT game_id, sport, home_team, away_team,
                   MAX(commence_time) AS commence_time,
                   MAX(recorded_at)   AS latest_ts
            FROM line_snapshots
            WHERE commence_time > ?
        """
        params: list = [now_iso]

        if sport_filter != "all":
            sport_key = SPORT_MAP.get(sport_filter)
            if sport_key:
                base_query += " AND sport = ?"
                params.append(sport_key)

        base_query += " GROUP BY game_id, sport, home_team, away_team"
        base_query += " ORDER BY commence_time ASC LIMIT 100"

        games = conn.execute(base_query, params).fetchall()
        if not games:
            return jsonify([])

        return jsonify([
            _build_game_summary(conn, dict(g), g["latest_ts"])
            for g in games
        ])


@odds_bp.route("/game/<game_id>/history")
@rate_limit(max_requests=60, window=60)
def get_game_history(game_id: str):
    market = request.args.get("market", "spreads")
    range_param = request.args.get("range", "24h")
    hours = RANGE_HOURS.get(range_param, 24)

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S")

    with get_db() as conn:
        game_info = conn.execute(
            """SELECT DISTINCT home_team, away_team, sport, commence_time
               FROM line_snapshots WHERE game_id = ? LIMIT 1""",
            (game_id,),
        ).fetchone()

        if not game_info:
            return jsonify({"error": "Game not found"}), 404

        rows = conn.execute(
            """SELECT bookmaker, outcome_name, price, point, recorded_at
               FROM line_snapshots
               WHERE game_id = ? AND market = ? AND recorded_at >= ?
               ORDER BY recorded_at ASC""",
            (game_id, market, cutoff),
        ).fetchall()

        snapshots: dict = {}
        for row in rows:
            ts = row["recorded_at"]
            bk = row["bookmaker"]
            name = row["outcome_name"]
            snapshots.setdefault(ts, {}).setdefault(bk, {})[name] = {
                "price": row["price"],
                "point": row["point"],
            }

        history = [
            {"recorded_at": ts, "bookmakers": bks}
            for ts, bks in sorted(snapshots.items())
        ]

        return jsonify({
            "game_id":      game_id,
            "home_team":    game_info["home_team"],
            "away_team":    game_info["away_team"],
            "sport":        game_info["sport"],
            "commence_time": game_info["commence_time"],
            "market":       market,
            "history":      history,
        })


@odds_bp.route("/game/<game_id>/books")
@rate_limit(max_requests=60, window=60)
@cached(ttl=60)
def get_game_books(game_id: str):
    with get_db() as conn:
        latest = conn.execute(
            "SELECT MAX(recorded_at) AS ts FROM line_snapshots WHERE game_id = ?",
            (game_id,),
        ).fetchone()["ts"]

        if not latest:
            return jsonify({"error": "Game not found"}), 404

        game_info = conn.execute(
            """SELECT DISTINCT home_team, away_team, sport, commence_time
               FROM line_snapshots WHERE game_id = ? LIMIT 1""",
            (game_id,),
        ).fetchone()

        rows = conn.execute(
            """SELECT bookmaker, market, outcome_name, price, point
               FROM line_snapshots
               WHERE game_id = ? AND recorded_at = ?""",
            (game_id, latest),
        ).fetchall()

        books_data = _build_books_data(rows)

        return jsonify({
            "game_id":      game_id,
            "home_team":    game_info["home_team"],
            "away_team":    game_info["away_team"],
            "sport":        game_info["sport"],
            "commence_time": game_info["commence_time"],
            "bookmakers":   books_data,
            "as_of":        latest,
        })
