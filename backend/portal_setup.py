"""Creates the portal's additive tables (existing portal tables are untouched)
and seeds login accounts for existing employees.

Idempotent: safe to run again.
"""
import sys

import pymysql

from app import config, security

SETUP_SQL = [
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
    """
    CREATE TABLE IF NOT EXISTS portal_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        role VARCHAR(120) NOT NULL DEFAULT '',
        status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
        progress TINYINT NOT NULL DEFAULT 0,
        due_date DATE NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pp_emp (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
]

PROJECT_SEED = [
    # (employee_id NULL = company-wide, name, description, role, status, progress, due_date)
    (None, "Customer API Refactor", "Modernising the customer-facing API platform for v2 rollout.", "Engineer", "ACTIVE", 72, "2026-11-14"),
    (1, "RAG Pipeline Upgrade", "Replacing the retrieval layer with hybrid search and reranking.", "Owner", "ACTIVE", 45, "2026-10-24"),
    (1, "AI Lab Demo Automation", "Auto-running the demo environment for the monthly AI Lab.", "Contributor", "AT RISK", 30, "2026-10-09"),
    (2, "Data Warehouse Migration", "Lift-and-shift of the analytics warehouse to the new cluster.", "Analyst", "ACTIVE", 38, "2026-12-01"),
    (2, "Clinical NLP PoC", "Proof-of-concept summarisation for clinical notes.", "Data Scientist", "PAUSED", 20, None),
    (None, "Portal v3 Redesign", "Redesigning the company portal experience for all teams.", "Team", "PLANNING", 12, "2027-01-15"),
]

DEMO_ACCOUNTS = [
    # (username, password)
    ("ayan", "emids123"),
    ("sara", "emids123"),
]


def main():
    conn = pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )

    cur = conn.cursor()
    for sql in SETUP_SQL:
        cur.execute(sql)

    # attach a login to every existing employee that has none yet
    cur.execute("SELECT id, LOWER(SUBSTRING_INDEX(email, '@', 1)) AS uname FROM employees")
    employees = {row["id"]: row["uname"].replace(".", "") for row in cur.fetchall()}
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

    # seed demo projects once (purely additive; skips if any rows already exist)
    cur.execute("SELECT COUNT(*) AS c FROM portal_projects")
    if cur.fetchone()["c"] == 0:
        for emp_id, name, desc, role, status, progress, due in PROJECT_SEED:
            cur.execute(
                """INSERT INTO portal_projects (employee_id, name, description, role, status, progress, due_date, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
                (emp_id, name, desc, role, status, progress, due or None),
            )
        print(f"portal_projects seeded: {len(PROJECT_SEED)} rows")

    conn.commit()
    conn.close()
    print(f"portal_users ready: {list(employees.values())} (password: emids123)")


if __name__ == "__main__":
    main()
