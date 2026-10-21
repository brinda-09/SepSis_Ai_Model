import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "sepsis_system.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        title TEXT,
        employee_id TEXT,
        department TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS github_oauth_states (
        state TEXT PRIMARY KEY,
        created_at REAL NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS github_oauth_exchange_codes (
        code TEXT PRIMARY KEY,
        user_json TEXT NOT NULL,
        created_at REAL NOT NULL
    );
    """)

    # Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        room TEXT NOT NULL,
        status TEXT DEFAULT 'Monitoring',
        admitted_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        probability REAL NOT NULL,
        prediction INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        message TEXT,
        reviewed_by TEXT,
        review_time TEXT,
        date_time TEXT NOT NULL
    );
    """)

    # Prediction History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL,
        probability REAL NOT NULL,
        prediction INTEGER NOT NULL,
        message TEXT,
        date_time TEXT NOT NULL
    );
    """)

    # Seed Default Accounts if Empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        default_users = [
            ("USR-001", "Dr. Alex Vance", "alex.vance@icu-hospital.org", "password123", "Doctor", "Lead ICU Clinician", "DOC-9021", "Intensive Care Unit", "Active"),
            ("USR-002", "Sarah Jenkins, RN", "sarah.j@icu-hospital.org", "password123", "Nurse", "Senior ICU Staff Nurse", "NUR-4412", "Critical Care Nursing", "Active"),
            ("USR-003", "Marcus Thorne", "admin.thorne@icu-hospital.org", "password123", "Administrator", "Clinical Systems Admin", "ADM-1001", "Medical IT & AI Engineering", "Active")
        ]
        cursor.executemany("""
        INSERT INTO users (id, name, email, password, role, title, employee_id, department, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_users)

    # Seed Default Patients if Empty
    cursor.execute("SELECT COUNT(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        default_patients = [
            ("ICU-104", "Eleanor Vance", 64, "Female", "Bed 04", "Monitoring", "Dr. Alex Vance"),
            ("ICU-902", "Robert Chen", 58, "Male", "Bed 12", "Monitoring", "Sarah Jenkins, RN")
        ]
        cursor.executemany("""
        INSERT INTO patients (patient_id, name, age, gender, room, status, admitted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, default_patients)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
