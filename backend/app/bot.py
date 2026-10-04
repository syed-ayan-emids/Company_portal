"""Portal chatbot: answers questions from the user's own MySQL data.

Rule/intent based so it works without any external API key, and it always has
real data to show (todos, meetings, briefings, announcements, tickets, apps).
"""
import re
from datetime import datetime, timedelta

from . import db


def _fmt_dt(dt: datetime) -> str:
    today = datetime.now().date()
    if dt.date() == today:
        day = "today"
    elif dt.date() == today + timedelta(days=1):
        day = "tomorrow"
    else:
        day = dt.strftime("%a %d %b")
    return f"{day} at {dt.strftime('%H:%M')}"


def _humanize(value, is_dt=True):
    if not value:
        return ""
    if isinstance(value, str) and is_dt:
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    if isinstance(value, datetime):
        return _fmt_dt(value)
    return str(value)


HELP_TEXT = (
    "Here is what I can help with:\n"
    "• **My tasks** — your pending actions\n"
    "• **Add task <title>** — create a new action\n"
    "• **Meetings / today / tomorrow** — your meeting queue\n"
    "• **Briefings** — the latest briefings\n"
    "• **News** — company bulletin announcements\n"
    "• **Tickets** — your support tickets\n"
    "• **Apps** — the ecosystem quick links\n"
    "Tip: use the collapse chevrons on each card for privacy on shared screens."
)


def greet(employee: dict) -> str:
    hour = datetime.now().hour
    if hour < 12:
        part = "morning"
    elif hour < 17:
        part = "afternoon"
    else:
        part = "evening"
    first = employee["name"].split()[0]
    return f"Good {part}, {first}! I am the emids portal assistant. Ask me about your tasks, meetings, briefings, ticket status or the news. Type **help** to see everything I can do."


def _reply_tasks(employee) -> str:
    rows = db.query(
        """SELECT title, priority, due_date, status FROM todos
           WHERE employee_id = %s AND status <> 'COMPLETED'
           ORDER BY COALESCE(due_date, '9999-12-31') LIMIT 8""",
        (employee["id"],),
    )
    if not rows:
        return "You are all clear — no pending actions right now. Let me know if you want to add one."
    lines = ["You have **{} pending action(s)**:".format(len(rows))]
    for i, r in enumerate(rows, 1):
        due = _humanize(r["due_date"])
        lines.append(f"{i}. {r['title']}" + (f"  ·  due {due}" if due else ""))
    return "\n".join(lines)


def _reply_add_task(employee, message) -> str:
    m = re.search(r"add task[:\"]?\s*(.+)", message, re.IGNORECASE)
    title = (m.group(1) if m else "").strip()
    if not title:
        return "Tell me the task title, e.g. **add task prepare demo notes**."
    db.execute(
        """INSERT INTO todos (employee_id, title, description, priority, status, due_date, source_type, created_at, updated_at)
           VALUES (%s, %s, '', 'LOW', 'TODO', NULL, 'MANUAL', NOW(), NOW())""",
        (employee["id"], title[:255]),
    )
    return f"Added **{title}** to your actions. It will appear in the Actions card."


_EMPTY_MEETING_TEXT = {
    "upcoming": "No upcoming meetings on your calendar — enjoy the focus time.",
    "still ahead today": "No more meetings today — the rest of the day is yours.",
    "tomorrow": "No meetings scheduled tomorrow.",
}

def _format_meetings(rows, scope):
    """scope is one of: 'upcoming', 'still ahead today', 'tomorrow'"""
    if not rows:
        return _EMPTY_MEETING_TEXT.get(scope, f"No meetings {scope}")
    noun = "meeting" if len(rows) == 1 else "meetings"
    lines = [f"You have **{len(rows)} {noun} {scope}**:"]
    for i, r in enumerate(rows, 1):
        platform = r.get("platform") or ""
        lines.append(f"{i}. **{r['title']}**  ·  {_humanize(r['start_datetime'])}" + (f"  ·  {platform}" if platform else ""))
    return "\n".join(lines)


def _reply_meetings_dispatch(employee, message) -> str:
    low = message.lower()
    now = datetime.now()
    if re.search(r"\btomorrow\b", low):
        t0 = now + timedelta(days=1)
        t0 = t0.replace(hour=0, minute=0, second=0, microsecond=0)
        t1 = t0 + timedelta(days=1)
        rows = db.query(
            """SELECT title, platform, start_datetime FROM meetings
               WHERE employee_id = %s AND start_datetime BETWEEN %s AND %s ORDER BY start_datetime""",
            (employee["id"], t0, t1),
        )
        return _format_meetings(rows, "tomorrow")
    if re.search(r"\btoday\b", low):
        end = now.replace(hour=23, minute=59, second=59, microsecond=0)
        rows = db.query(
            """SELECT title, platform, start_datetime FROM meetings
               WHERE employee_id = %s AND start_datetime BETWEEN %s AND %s ORDER BY start_datetime""",
            (employee["id"], now, end),
        )
        return _format_meetings(rows, "still ahead today")
    rows = db.query(
        """SELECT title, platform, start_datetime FROM meetings
           WHERE employee_id = %s AND start_datetime >= %s ORDER BY start_datetime LIMIT 6""",
        (employee["id"], now),
    )
    return _format_meetings(rows, "upcoming")


def _reply_briefings() -> str:
    rows = db.query(
        "SELECT title, source, priority, due_date FROM briefings ORDER BY created_at DESC LIMIT 5"
    )
    if not rows:
        return "There are no briefings in the archive yet."
    lines = ["Latest briefings:"]
    for i, r in enumerate(rows, 1):
        due = _humanize(r["due_date"])
        lines.append(f"{i}. **{r['title']}**  ·  {r['source']}" + (f"  ·  due {due}" if due else ""))
    return "\n".join(lines)


def _reply_announcements() -> str:
    rows = db.query(
        "SELECT title, category, published_at FROM announcements ORDER BY published_at DESC LIMIT 4"
    )
    if not rows:
        return "No announcements posted yet."
    lines = ["Latest announcements:"]
    for i, r in enumerate(rows, 1):
        lines.append(f"{i}. **{r['title']}**  ·  {r['category']}  ·  {_humanize(r['published_at'])}")
    return "\n".join(lines)


def _reply_tickets(employee) -> str:
    rows = db.query(
        "SELECT ticket_number, title, status, category FROM tickets WHERE employee_id = %s ORDER BY created_at DESC LIMIT 6",
        (employee["id"],),
    )
    if not rows:
        return "You have no support tickets — smooth sailing."
    lines = ["Your support tickets:"]
    for i, r in enumerate(rows, 1):
        status = r["status"].replace("_", " ").title()
        lines.append(f"{i}. **{r['title']}** (#{r['ticket_number']})  ·  {status}")
    return "\n".join(lines)


def _reply_apps() -> str:
    rows = db.query("SELECT name, url FROM quick_links ORDER BY display_order")
    if not rows:
        return "No quick links registered in the ecosystem."
    lines = ["Your ecosystem apps:"]
    for i, r in enumerate(rows, 1):
        lines.append(f"{i}. **{r['name']}** — {r['url']}")
    return "\n".join(lines)


def _reply_events() -> str:
    now = datetime.now()
    rows = db.query(
        """SELECT title, category, location, start_datetime FROM events
           WHERE end_datetime >= %s ORDER BY start_datetime LIMIT 6""",
        (now,),
    )
    if not rows:
        return "No company events coming up."
    lines = ["Company events ahead:"]
    for i, r in enumerate(rows, 1):
        where = r["location"] or "location TBD"
        lines.append(f"{i}. **{r['title']}**  ·  {_humanize(r['start_datetime'])}  ·  {where}")
    return "\n".join(lines)


def _reply_projects(employee) -> str:
    rows = db.query(
        """SELECT name, status, progress, role, due_date FROM portal_projects
           WHERE employee_id = %s OR employee_id IS NULL
           ORDER BY CASE WHEN status = 'AT RISK' THEN 0 WHEN status = 'ACTIVE' THEN 1 WHEN status = 'PAUSED' THEN 2 WHEN status = 'PLANNING' THEN 3 WHEN status = 'DONE' THEN 4 ELSE 5 END, progress DESC
           LIMIT 6""",
        (employee["id"],),
    )
    if not rows:
        return "No projects assigned to your teams yet."
    lines = ["Your workstreams:"]
    for i, r in enumerate(rows, 1):
        due = _humanize(r["due_date"])
        lines.append(
            f"{i}. **{r['name']}**  ·  {r['status']} · {r['progress']}%"
            + (f" · due {due}" if due else "")
        )
    return "\n".join(lines)


def reply(employee: dict, message: str) -> str:
    low = message.lower().strip()

    if re.search(r"\bhelp\b|what can you|capabilities", low):
        return HELP_TEXT
    if re.search(r"hello|hi\b|hey\b|good (morning|afternoon|evening)", low):
        return greet(employee)
    if re.search(r"^add task", low) or re.search(r"add (a )?task", low):
        return _reply_add_task(employee, message)
    if re.search(r"my tasks|my todos|my actions|to-?do|pending actions|what.*(tasks|todos|actions)", low):
        return _reply_tasks(employee)
    if re.search(r"meeting", low):
        return _reply_meetings_dispatch(employee, message)
    if re.search(r"briefing", low):
        return _reply_briefings()
    if re.search(r"news|announcement|bulletin", low):
        return _reply_announcements()
    if re.search(r"ticket|support", low):
        return _reply_tickets(employee)
    if re.search(r"apps?|link|tool|ecosystem", low):
        return _reply_apps()
    if re.search(r"event|town hall|townhall", low):
        return _reply_events()
    if re.search(r"project|workstream|initiative", low):
        return _reply_projects(employee)
    if re.search(r"thanks|thank you", low):
        return "Happy to help! Anything else — tasks, meetings, tickets?"
    if re.search(r"where.*work|who am i|my (department|role|title|profile)", low):
        return (
            f"You are **{employee['name']}**, {employee['job_title']} in {employee['department']}. "
            "Your contact is " + employee["email"] + "."
        )
    return (
        "I did not quite catch that. Ask me about **your tasks, meetings, briefings, "
        "tickets, news or apps** — or type **help**."
    )
