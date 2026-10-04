"""Creates the portal's additive tables (existing portal tables are untouched)
and seeds login accounts for existing employees. Idempotent: safe to run again.

Works on both dialects: MySQL (default, DB_*) and PostgreSQL (DATABASE_URL).
"""
import sys

from app import config, db, security

SETUP_SQL = {
    "mysql": [
        """
        CREATE TABLE IF NOT EXISTS portal_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(40) NOT NULL DEFAULT 'employee',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_employee (employee_id),
            CONSTRAINT fk_pu_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS portal_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            role VARCHAR(16) NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_pcm_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
            INDEX idx_pcm_emp_time (employee_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
    ],
    "postgres": [
        """
        CREATE TABLE IF NOT EXISTS portal_users (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL UNIQUE REFERENCES employees(id),
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(40) NOT NULL DEFAULT 'employee',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS portal_chat_messages (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL REFERENCES employees(id),
            role VARCHAR(16) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_pcm_emp_time ON portal_chat_messages(employee_id, created_at)",
    ],
}

USERNAMES = {
    "mysql": "SELECT id, LOWER(REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', '')) AS uname FROM employees",
    "postgres": "SELECT id, LOWER(REPLACE(split_part(email, '@', 1), '.', '')) AS uname FROM employees",
}


def main():
    conn = db.get_connection()
    try:
        cur = conn.cursor()
        for sql in SETUP_SQL[config.DB_BACKEND]:
            cur.execute(sql)

        cur.execute(USERNAMES[config.DB_BACKEND])
        employees = {row["id"]: row["uname"] for row in cur.fetchall()}
        if not employees:
            print("No employees found — check the employees table.")
            sys.exit(1)
        for emp_id, uname in employees.items():
            password = "emids123"
            cur.execute("SELECT id FROM portal_users WHERE employee_id = %s", (emp_id,))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO portal_users (employee_id, username, password_hash) VALUES (%s, %s, %s)",
                (emp_id, uname, security.hash_password(password)),
            )
        conn.commit()
        print(f"portal_users ready [{config.DB_BACKEND}]: {list(employees.values())} (password: emids123)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
