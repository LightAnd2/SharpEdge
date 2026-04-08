import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", "sharpedge.db")


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS line_snapshots (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id        TEXT NOT NULL,
                sport          TEXT NOT NULL,
                home_team      TEXT NOT NULL,
                away_team      TEXT NOT NULL,
                bookmaker      TEXT NOT NULL,
                market         TEXT NOT NULL,
                outcome_name   TEXT NOT NULL,
                price          INTEGER NOT NULL,
                point          REAL,
                commence_time  TEXT NOT NULL,
                recorded_at    TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_snap_game_recorded
                ON line_snapshots(game_id, recorded_at);
            CREATE INDEX IF NOT EXISTS idx_snap_game_market
                ON line_snapshots(game_id, market, bookmaker);
            CREATE INDEX IF NOT EXISTS idx_snap_sport_recorded
                ON line_snapshots(sport, recorded_at);
        """)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
