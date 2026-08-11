"""
Tiny SQLite data-access layer.
Two tables:
  - location: the single saved user location + alert radius
  - settings: key/value store used for the Gemini API key
No ORM — plain sqlite3 keeps this beginner-friendly and dependency-light.
"""
import sqlite3
from config import DB_PATH


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist yet. Safe to call on every startup."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS location (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            place_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            radius_km INTEGER NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    conn.commit()
    conn.close()


def save_location(place_name, latitude, longitude, radius_km):
    """Store the single active location (id is always 1 — one user, one location)."""
    conn = get_connection()
    conn.execute("""
        INSERT INTO location (id, place_name, latitude, longitude, radius_km)
        VALUES (1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            place_name = excluded.place_name,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            radius_km = excluded.radius_km
    """, (place_name, latitude, longitude, radius_km))
    conn.commit()
    conn.close()


def get_location():
    conn = get_connection()
    row = conn.execute("SELECT * FROM location WHERE id = 1").fetchone()
    conn.close()
    return dict(row) if row else None


def save_setting(key, value):
    conn = get_connection()
    conn.execute("""
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """, (key, value))
    conn.commit()
    conn.close()


def get_setting(key):
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else None
