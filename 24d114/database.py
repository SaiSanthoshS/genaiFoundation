import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "carbon_footprint.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region TEXT NOT NULL DEFAULT 'US',
            diet_preference TEXT NOT NULL DEFAULT 'mixed',
            travel_preference TEXT NOT NULL DEFAULT 'mixed'
        )
    """)

    # Create activities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            subtype TEXT NOT NULL,
            quantity REAL NOT NULL,
            fuel_type TEXT,
            co2e_kg REAL NOT NULL,
            calculation_method TEXT NOT NULL,
            emission_factor_used REAL NOT NULL,
            region_source TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Create offset purchases table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS offset_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL,
            project_name TEXT NOT NULL,
            amount_usd REAL NOT NULL,
            tonnes_offset REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Check if we need to seed a default user
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (region, diet_preference, travel_preference) VALUES ('US', 'mixed', 'mixed')")
    
    conn.commit()
    conn.close()

def get_user(user_id=1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def update_user(user_id=1, region='US', diet_preference='mixed', travel_preference='mixed'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users 
        SET region = ?, diet_preference = ?, travel_preference = ?
        WHERE id = ?
    """, (region, diet_preference, travel_preference, user_id))
    conn.commit()
    conn.close()
    return get_user(user_id)

def add_activity(user_id, date, type, subtype, quantity, fuel_type, co2e_kg, calculation_method, emission_factor_used, region_source):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO activities (
            user_id, date, type, subtype, quantity, fuel_type, co2e_kg, calculation_method, emission_factor_used, region_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, date, type, subtype, quantity, fuel_type, co2e_kg, calculation_method, emission_factor_used, region_source))
    activity_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return activity_id

def get_activities(user_id=1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC, timestamp DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_activity(activity_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
    conn.commit()
    conn.close()

def add_purchase(project_id, project_name, amount_usd, tonnes_offset):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO offset_purchases (
            project_id, project_name, amount_usd, tonnes_offset
        ) VALUES (?, ?, ?, ?)
    """, (project_id, project_name, amount_usd, tonnes_offset))
    conn.commit()
    conn.close()

def get_purchases():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM offset_purchases ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
