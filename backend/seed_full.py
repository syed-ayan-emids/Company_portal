"""Bootstraps a FRESH database (Render/Aiven/local) — creates every table and
demo data for the portal idempotently: tables are CREATE IF NOT EXISTS, rows
only inserted when a table is empty. Demo dates are generated relative to the
seed day, so the demo always looks current.

Works with both dialects:
    * MySQL  (default)          - configured via DB_HOST/DB_USER/...
    * Postgres (Render)         - configured via DATABASE_URL=postgresql://...
"""
import datetime as _dt
import sys
from datetime import timedelta

from app import config, security


def today_plus(days):
    return None if days is None else (config_now().date() + timedelta(days=days))


def rel(days, hour, minute=0):
    return (config_now() + timedelta(days=days)).replace(hour=hour, minute=minute, second=0, microsecond=0)


def config_now():
    return _dt.datetime.now()


MYSQL_TABLES = {
    "employees": """
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            job_title VARCHAR(120) NOT NULL,
            department VARCHAR(120) NOT NULL,
            avatar_url VARCHAR(500) NOT NULL DEFAULT ''
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "quick_links": """
        CREATE TABLE IF NOT EXISTS quick_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            icon VARCHAR(120) NOT NULL,
            url VARCHAR(500) NOT NULL,
            display_order INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "briefings": """
        CREATE TABLE IF NOT EXISTS briefings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            priority VARCHAR(40) NOT NULL,
            source VARCHAR(120) NOT NULL,
            action_url VARCHAR(500) NOT NULL DEFAULT '',
            due_date DATE NULL,
            created_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "events": """
        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            location VARCHAR(255) NOT NULL,
            start_datetime DATETIME NOT NULL,
            end_datetime DATETIME NOT NULL,
            INDEX idx_events_start (start_datetime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "meetings": """
        CREATE TABLE IF NOT EXISTS meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            platform VARCHAR(120) NOT NULL,
            meeting_url VARCHAR(500) NOT NULL DEFAULT '',
            start_datetime DATETIME NOT NULL,
            end_datetime DATETIME NOT NULL,
            CONSTRAINT fk_meet_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "todos": """
        CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
            status VARCHAR(40) NOT NULL DEFAULT 'TODO',
            due_date DATE NULL,
            source_type VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
            source_id INT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            CONSTRAINT fk_todos_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "tickets": """
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            ticket_number VARCHAR(40) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(120) NOT NULL,
            status VARCHAR(40) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            CONSTRAINT fk_tickets_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "announcements": """
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            importance VARCHAR(40) NOT NULL,
            published_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "portal_users": """
        CREATE TABLE IF NOT EXISTS portal_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(40) NOT NULL DEFAULT 'employee',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_pu_employee (employee_id),
            CONSTRAINT fk_pu_emp2 FOREIGN KEY (employee_id) REFERENCES employees(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "portal_chat_messages": """
        CREATE TABLE IF NOT EXISTS portal_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            role VARCHAR(16) NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_pcm_emp2 FOREIGN KEY (employee_id) REFERENCES employees(id),
            INDEX idx_pcm_emp_time (employee_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """,
    "portal_projects": """
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
}

POSTGRES_TABLES = {
    "employees": """
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            job_title VARCHAR(120) NOT NULL,
            department VARCHAR(120) NOT NULL,
            avatar_url VARCHAR(500) NOT NULL DEFAULT ''
        )
    """,
    "quick_links": """
        CREATE TABLE IF NOT EXISTS quick_links (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            icon VARCHAR(120) NOT NULL,
            url VARCHAR(500) NOT NULL,
            display_order INT NOT NULL DEFAULT 0
        )
    """,
    "briefings": """
        CREATE TABLE IF NOT EXISTS briefings (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            priority VARCHAR(40) NOT NULL,
            source VARCHAR(120) NOT NULL,
            action_url VARCHAR(500) NOT NULL DEFAULT '',
            due_date DATE NULL,
            created_at TIMESTAMP NOT NULL
        )
    """,
    "events": """
        CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            location VARCHAR(255) NOT NULL,
            start_datetime TIMESTAMP NOT NULL,
            end_datetime TIMESTAMP NOT NULL
        )
    """,
    "meetings": """
        CREATE TABLE IF NOT EXISTS meetings (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL REFERENCES employees(id),
            title VARCHAR(255) NOT NULL,
            platform VARCHAR(120) NOT NULL,
            meeting_url VARCHAR(500) NOT NULL DEFAULT '',
            start_datetime TIMESTAMP NOT NULL,
            end_datetime TIMESTAMP NOT NULL
        )
    """,
    "todos": """
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL REFERENCES employees(id),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
            status VARCHAR(40) NOT NULL DEFAULT 'TODO',
            due_date DATE NULL,
            source_type VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
            source_id INT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """,
    "tickets": """
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL REFERENCES employees(id),
            ticket_number VARCHAR(40) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(120) NOT NULL,
            status VARCHAR(40) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """,
    "announcements": """
        CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(120) NOT NULL,
            importance VARCHAR(40) NOT NULL,
            published_at TIMESTAMP NOT NULL
        )
    """,
    "portal_users": """
        CREATE TABLE IF NOT EXISTS portal_users (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL UNIQUE REFERENCES employees(id),
            username VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(40) NOT NULL DEFAULT 'employee',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "portal_chat_messages": """
        CREATE TABLE IF NOT EXISTS portal_chat_messages (
            id SERIAL PRIMARY KEY,
            employee_id INT NOT NULL REFERENCES employees(id),
            role VARCHAR(16) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """,
    "portal_projects": """
        CREATE TABLE IF NOT EXISTS portal_projects (
            id SERIAL PRIMARY KEY,
            employee_id INT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            role VARCHAR(120) NOT NULL DEFAULT '',
            status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
            progress SMALLINT NOT NULL DEFAULT 0,
            due_date DATE NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """,
}

POSTGRES_INDEXES = {
    "events": "CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime)",
    "meetings": "CREATE INDEX IF NOT EXISTS idx_meetings_emp_start ON meetings(employee_id, start_datetime)",
    "todos": "CREATE INDEX IF NOT EXISTS idx_todos_emp ON todos(employee_id)",
    "tickets": "CREATE INDEX IF NOT EXISTS idx_tickets_emp ON tickets(employee_id)",
    "portal_chat_messages": "CREATE INDEX IF NOT EXISTS idx_pcm_emp_time ON portal_chat_messages(employee_id, created_at)",
    "portal_projects": "CREATE INDEX IF NOT EXISTS idx_pp_emp ON portal_projects(employee_id)",
    "portal_users": "CREATE INDEX IF NOT EXISTS idx_pu_emp ON portal_users(employee_id)",
    "briefings": "CREATE INDEX IF NOT EXISTS idx_briefings_cat ON briefings(category)",
}

EMPLOYEES = [
    ("Syed Ayan", "syed.ayan@emids.com", "AI Engineer", "Artificial Intelligence", "https://i.pravatar.cc/80?u=syedayan"),
    ("Sara Malik", "sara.malik@emids.com", "Data Scientist", "Data & Analytics", "https://i.pravatar.cc/80?u=sara"),
]

BRIEFINGS = [
    ("Prepare Monthly AI Lab Demo", "Prepare a working prototype to showcase during the upcoming monthly AI Lab meeting.", "Engineering", "HIGH", "AI Lab", "/workhub/demo", 2),
    ("Complete Security Awareness Module", "Complete the mandatory security training module before the deadline.", "Security", "HIGH", "Security", "/workhub/training", 4),
    ("Submit Weekly Timesheet", "Complete and submit this week's timesheet before Friday.", "Work", "MEDIUM", "HR", "/timesheets", 3),
    ("Review PR #428 before release meeting", "Reviewing Customer API refactor before the release planning meeting.", "Meeting", "MEDIUM", "Engineering", "/workhub/pr/428", 1),
    ("Update project status for weekly sync", "Update your project status card before the weekly team sync.", "Work", "LOW", "General", "/workhub/status", None),
]


def seed(conn):
    cur = conn.cursor()
    backend = config.DB_BACKEND
    tables = POSTGRES_TABLES if backend == "postgres" else MYSQL_TABLES

    for name, sql in tables.items():
        cur.execute(sql)
    if backend == "postgres":
        seen = set()
        for _, sql in POSTGRES_INDEXES.items():
            if sql not in seen:
                cur.execute(sql)
                seen.add(sql)

    def insert_if_empty(table, sql, rows):
        cur.execute(f"SELECT COUNT(*) AS c FROM {table}")
        if cur.fetchone()["c"] > 0:
            return 0
        cur.executemany(sql, rows)
        return len(rows)

    n = insert_if_empty(
        "employees",
        "INSERT INTO employees (name, email, job_title, department, avatar_url) VALUES (%s, %s, %s, %s, %s)",
        EMPLOYEES,
    )
    cur.execute("SELECT id, name FROM employees ORDER BY id")
    emps = {row["name"]: row["id"] for row in cur.fetchall()}
    if len(emps) < 2:
        print("Employees missing after seed — abort")
        sys.exit(1)
    ayan, sara = emps["Syed Ayan"], emps["Sara Malik"]

    n += insert_if_empty(
        "quick_links",
        "INSERT INTO quick_links (name, icon, url, display_order) VALUES (%s, %s, %s, %s)",
        [
            ("Email", "mail", "https://outlook.com", 1),
            ("Microsoft Teams", "teams", "https://teams.microsoft.com", 2),
            ("Documents", "folder", "https://sharepoint.com", 3),
            ("HR Portal", "users", "https://hr.example.com", 4),
            ("PACCA AI", "sparkles", "https://pacca.example.com", 5),
            ("Timesheets", "clock", "/timesheets", 6),
        ],
    )

    n += insert_if_empty(
        "briefings",
        """INSERT INTO briefings (title, description, category, priority, source, action_url, due_date, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
        [(t, d, c, p, s, u, today_plus(dd)) for (t, d, c, p, s, u, dd) in BRIEFINGS],
    )

    n += insert_if_empty(
        "events",
        """INSERT INTO events (title, description, category, location, start_datetime, end_datetime)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [
            ("Company Town Hall", "Quarterly all-hands with leadership Q&A.", "Company", "Auditorium, Building A", rel(4, 11, 0), rel(4, 12, 30)),
            ("AI Lab Monthly Meetup", "Monthly showcase of in-progress AI experiments.", "Learning", "Online", rel(1, 15, 0), rel(1, 16, 0)),
            ("Technical Workshop: Vector Databases", "A hands-on session covering embeddings and retrieval.", "Engineering", "Online", rel(8, 10, 0), rel(8, 12, 0)),
            ("Internal Hackathon", "Two-day hackathon focused on internal tooling.", "Engineering", "Innovation Hub, Floor 4", rel(13, 9, 0), rel(14, 18, 0)),
        ],
    )

    now = config_now()
    lived = (now + timedelta(hours=2)).replace(second=0, microsecond=0)
    n += insert_if_empty(
        "meetings",
        """INSERT INTO meetings (employee_id, title, platform, meeting_url, start_datetime, end_datetime)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [
            (ayan, "Model Review: RAG Pipeline", "Microsoft Teams", "https://teams.microsoft.com/l/rag-review", lived, lived + timedelta(minutes=45)),
            (ayan, "Platform Stand-up", "Zoom", "https://zoom.us/j/123456", rel(1, 9, 30), rel(1, 10, 0)),
            (ayan, "1:1 with Manager", "Microsoft Teams", "https://teams.microsoft.com/l/1-1", rel(2, 16, 0), rel(2, 16, 30)),
            (sara, "Analytics Review", "Microsoft Teams", "", rel(1, 10, 0), rel(1, 11, 0)),
        ],
    )

    n += insert_if_empty(
        "todos",
        """INSERT INTO todos (employee_id, title, description, priority, status, due_date, source_type, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())""",
        [
            (ayan, "Review PR #428", "Review the customer API refactor", "HIGH", "TODO", today_plus(1), "MANUAL"),
            (ayan, "Prepare Monthly AI Lab Demo", "Prepare a working prototype for the AI Lab.", "HIGH", "TODO", today_plus(2), "BRIEFING"),
            (ayan, "Review PR #428 before release meeting", "Reviewing Customer API refactor before release planning.", "MEDIUM", "TODO", today_plus(1), "BRIEFING"),
            (ayan, "Update project status for weekly sync", "Update your status card.", "LOW", "TODO", None, "BRIEFING"),
            (ayan, "Submit timesheet", "Weekly timesheet", "MEDIUM", "COMPLETED", today_plus(3), "BRIEFING"),
            (ayan, "Book travel for Hackathon", "Hackathon logistics", "LOW", "COMPLETED", None, "MANUAL"),
            (sara, "Sara's task", "Sample task for the Data & Analytics team.", "LOW", "TODO", None, "MANUAL"),
        ],
    )

    n += insert_if_empty(
        "tickets",
        """INSERT INTO tickets (employee_id, ticket_number, title, category, status, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [
            (ayan, "HD-1048", "Laptop VPN connection issue", "IT Hardware", "IN_PROGRESS", now - timedelta(days=4), now - timedelta(days=2)),
            (ayan, "HD-1039", "Access to data warehouse", "Access", "WAITING", now - timedelta(days=7), now - timedelta(days=5)),
            (ayan, "HD-1021", "Email client not syncing", "Software", "RESOLVED", now - timedelta(days=13), now - timedelta(days=10)),
            (ayan, "HD-1055", "Requesting a second monitor", "IT Hardware", "OPEN", now - timedelta(days=2), now - timedelta(days=2)),
            (sara, "HD-2001", "Sara's ticket", "Access", "OPEN", now - timedelta(days=2), now - timedelta(days=2)),
        ],
    )

    n += insert_if_empty(
        "announcements",
        """INSERT INTO announcements (title, description, category, importance, published_at)
           VALUES (%s, %s, %s, %s, %s)""",
        [
            ("Q4 AI Lab registrations now open", "Registration for the Q4 AI Lab cohort is open until the end of the month. Join to work on applied LLM projects with the platform team.", "Engineering", "HIGH", now - timedelta(hours=45)),
            ("New hybrid work policy effective next month", "Employees can now choose up to three remote days per week. Review the updated policy in the HR portal for full details.", "HR", "HIGH", now - timedelta(hours=68)),
            ("Scheduled infrastructure maintenance", "The shared analytics cluster will be unavailable on Saturday between 02:00 and 04:00 AM for a scheduled upgrade.", "IT", "MEDIUM", now - timedelta(hours=96)),
            ("Employee benefits open enrollment", "Annual benefits enrollment is live. Review health, dental and wellness options before the enrollment deadline.", "Benefits", "MEDIUM", now - timedelta(hours=120)),
            ("Office closed for public holiday", "The office will be closed next Monday for a public holiday. Remote work support remains available.", "General", "LOW", now - timedelta(hours=300)),
        ],
    )

    n += insert_if_empty(
        "portal_projects",
        """INSERT INTO portal_projects (employee_id, name, description, role, status, progress, due_date, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
        [
            (None, "Customer API Refactor", "Modernising the customer-facing API platform for v2 rollout.", "Engineer", "ACTIVE", 72, today_plus(44)),
            (ayan, "RAG Pipeline Upgrade", "Replacing the retrieval layer with hybrid search and reranking.", "Owner", "ACTIVE", 45, today_plus(23)),
            (ayan, "AI Lab Demo Automation", "Auto-running the demo environment for the monthly AI Lab.", "Contributor", "AT RISK", 30, today_plus(8)),
            (sara, "Data Warehouse Migration", "Lift-and-shift of the analytics warehouse to the new cluster.", "Analyst", "ACTIVE", 38, today_plus(61)),
            (sara, "Clinical NLP PoC", "Proof-of-concept summarisation for clinical notes.", "Data Scientist", "PAUSED", 20, None),
            (None, "Portal v3 Redesign", "Redesigning the company portal experience for all teams.", "Team", "PLANNING", 12, today_plus(106)),
        ],
    )

    for emp_id, uname in ((ayan, "syedayan"), (sara, "saramalik")):
        cur.execute("SELECT id FROM portal_users WHERE employee_id = %s", (emp_id,))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO portal_users (employee_id, username, password_hash) VALUES (%s, %s, %s)",
                (emp_id, uname, security.hash_password("emids123")),
            )

    conn.commit()
    print(f"seed_full[{backend}]: created {len(tables)} tables, sent {n} demo rows (existing data untouched)")


def main():
    from app import db as appdb
    conn = appdb.get_connection()
    try:
        seed(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
