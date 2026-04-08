"""
On-demand fetcher — NO background scheduler.

Credits are burned only when a user actually requests data AND the cached
snapshot is older than STALE_MINUTES. Idle time = zero credits.

Free-plan-safe default:
  - selected sport pages can refresh stale data
  - the "all sports" page should prefer cached data
  - default stale window is intentionally conservative
"""
import os
import logging
import threading
import requests
from datetime import datetime, timezone, timedelta

from database import get_db, init_db

logger = logging.getLogger(__name__)

ODDS_API_KEY   = os.getenv("ODDS_API_KEY", "")
ODDS_API_BASE  = "https://api.the-odds-api.com/v4"
STALE_MINUTES  = int(os.getenv("STALE_MINUTES", "180"))

ACTIVE_SPORTS = [
    "americanfootball_nfl",
    "basketball_nba",
    "baseball_mlb",
    "icehockey_nhl",
]

# Track last successful fetch per sport key
_last_fetched = {}  # type: dict
_fetch_lock = threading.Lock()


def _is_stale(sport: str) -> bool:
    last = _last_fetched.get(sport)
    if last is None:
        return True
    return datetime.now(timezone.utc) - last > timedelta(minutes=STALE_MINUTES)


def fetch_sport(sport: str):
    """
    Fetch odds for one sport key and store snapshots.
    Returns remaining API credits, or None on failure.
    """
    if not ODDS_API_KEY:
        logger.warning("ODDS_API_KEY not set — cannot fetch")
        return None

    try:
        resp = requests.get(
            f"{ODDS_API_BASE}/sports/{sport}/odds",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "us",
                "markets": "h2h,spreads,totals",
                "oddsFormat": "american",
                "dateFormat": "iso",
            },
            timeout=15,
        )
        if resp.status_code == 422:
            logger.info("No active events for %s", sport)
            _last_fetched[sport] = datetime.now(timezone.utc)
            return int(resp.headers.get("x-requests-remaining", 0))

        resp.raise_for_status()
        games = resp.json()
        _store_snapshots(sport, games)
        _last_fetched[sport] = datetime.now(timezone.utc)

        remaining = int(resp.headers.get("x-requests-remaining", -1))
        used      = resp.headers.get("x-requests-used", "?")
        logger.info(
            "Fetched %d games for %-30s | used: %-4s remaining: %s",
            len(games), sport, used, remaining,
        )
        if remaining != -1 and remaining < 50:
            logger.warning("⚠️  Only %d API credits remaining this month!", remaining)
        return remaining

    except requests.RequestException as exc:
        logger.error("Error fetching %s: %s", sport, exc)
        return None


def _store_snapshots(sport: str, games: list):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    rows = []
    for game in games:
        game_id = game["id"]
        home = game["home_team"]
        away = game["away_team"]
        commence = game["commence_time"]
        for book in game.get("bookmakers", []):
            bookmaker = book["key"]
            for market in book.get("markets", []):
                mkt_key = market["key"]
                for outcome in market.get("outcomes", []):
                    rows.append((
                        game_id, sport, home, away,
                        bookmaker, mkt_key,
                        outcome["name"],
                        int(outcome["price"]),
                        outcome.get("point"),
                        commence,
                        now,
                    ))
    if not rows:
        return
    with get_db() as conn:
        conn.executemany(
            """INSERT INTO line_snapshots
               (game_id, sport, home_team, away_team, bookmaker, market,
                outcome_name, price, point, commence_time, recorded_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            rows,
        )
    logger.debug("Inserted %d snapshots at %s", len(rows), now)


def fetch_sport_if_stale(sport: str) -> bool:
    """
    Fetch a single sport if its snapshot is stale. Thread-safe.
    Returns True if a fetch was performed.
    """
    if not _is_stale(sport):
        return False
    with _fetch_lock:
        # Re-check inside lock to avoid double-fetch from concurrent requests
        if not _is_stale(sport):
            return False
        fetch_sport(sport)
        return True


def fetch_all_if_stale():
    """Fetch all active sports that are stale. Returns list of sports fetched."""
    return [s for s in ACTIVE_SPORTS if fetch_sport_if_stale(s)]


def startup():
    """Call once on app startup — just initialises the DB."""
    init_db()
    logger.info(
        "Fetcher ready. Stale threshold: %d min. Credits budget: 500/month.",
        STALE_MINUTES,
    )
