import json
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from . import db
from .r_auth import get_current_employee

router = APIRouter(prefix="/api", tags=["portal"])


def _dt_key(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.isoformat()
    return value


def serialize(rows):
    out = []
    for row in rows:
        out.append({k: _dt_key(v) for k, v in row.items()})
    return out


@router.get("/dashboard")
def dashboard(employee: dict = Depends(get_current_employee)):
    emp_id = employee["id"]
    now = datetime.now()

    briefings = db.query(
        """SELECT b.id, b.title, b.description, b.category, b.priority, b.source, b.action_url, b.due_date, b.created_at
           FROM briefings b
           ORDER BY COALESCE(b.due_date, DATE(b.created_at)), b.created_at DESC
           LIMIT 6"""
    )
    actions = db.query(
        """SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.source_type, t.source_id
           FROM todos t
           WHERE t.employee_id = %s
           ORDER BY (t.status = 'COMPLETED'), COALESCE(t.due_date, DATE '9999-12-31'), t.created_at
           LIMIT 9""",
        (emp_id,),
    )
    done_count = db.one(
        "SELECT COUNT(*) AS c FROM todos WHERE employee_id = %s AND status = 'COMPLETED'", (emp_id,)
    )["c"]

    meetings = db.query(
        """SELECT m.id, m.title, m.platform, m.meeting_url, m.start_datetime, m.end_datetime
           FROM meetings m
           WHERE m.employee_id = %s AND m.start_datetime >= %s
           ORDER BY m.start_datetime
           LIMIT 5""",
        (emp_id, now),
    )
    events = db.query(
        """SELECT e.id, e.title, e.description, e.category, e.location, e.start_datetime, e.end_datetime
           FROM events e
           WHERE e.start_datetime >= %s AND e.end_datetime >= %s
           ORDER BY e.start_datetime
           LIMIT 8""",
        (now, now),
    )
    bulletins = db.query(
        "SELECT id, title, description, category, importance, published_at FROM announcements ORDER BY published_at DESC LIMIT 3"
    )
    tickets = db.query(
        """SELECT id, ticket_number, title, category, status, created_at
           FROM tickets WHERE employee_id = %s AND status <> 'RESOLVED'
           ORDER BY created_at DESC LIMIT 4""",
        (emp_id,),
    )
    # resolved shown first for the design's "Resolved" example
    resolved = db.query(
        """SELECT id, ticket_number, title, category, status, created_at
           FROM tickets WHERE employee_id = %s AND status = 'RESOLVED'
           ORDER BY updated_at DESC LIMIT 1""",
        (emp_id,),
    )
    apps = db.query(
        "SELECT id, name, icon, url, display_order FROM quick_links ORDER BY display_order"
    )

    # hero: nearest company-wide event, else nearest event, else latest announcement
    hero_event = db.one(
        """SELECT title, description, category, location, start_datetime
           FROM events WHERE end_datetime >= %s AND category LIKE '%%Company%%'
           ORDER BY start_datetime LIMIT 1""",
        (now,),
    )
    if not hero_event:
        hero_event = db.one(
            "SELECT title, description, category, location, start_datetime FROM events WHERE end_datetime >= %s ORDER BY start_datetime LIMIT 1",
            (now,),
        )
    hero_announcement = None
    if not hero_event:
        hero_announcement = db.one(
            "SELECT title, description, category, published_at FROM announcements ORDER BY published_at DESC LIMIT 1"
        )
    coming_events = db.query(
        """SELECT id, title, category, location, start_datetime, end_datetime
           FROM events WHERE end_datetime >= %s ORDER BY start_datetime""",
        (now,),
    )

    next_meeting = db.one(
        "SELECT title, platform, meeting_url, start_datetime FROM meetings WHERE employee_id = %s AND start_datetime >= %s ORDER BY start_datetime LIMIT 1",
        (emp_id, now),
    )

    calendar_events = db.query(
        """SELECT id, title, start_datetime FROM (
                SELECT id, title, start_datetime FROM events WHERE start_datetime BETWEEN %s AND %s
                UNION ALL
                SELECT id, title, start_datetime FROM meetings WHERE employee_id = %s AND start_datetime BETWEEN %s AND %s
           ) c
           ORDER BY start_datetime""",
        (now.replace(day=1), now + timedelta(days=62), emp_id, now.replace(day=1), now + timedelta(days=62)),
    )

    return {
        "me": employee,
        "server_time": now.isoformat(),
        "hero": {
            "title": hero_event["title"] if hero_event else (hero_announcement or {}).get("title", "Company update"),
            "description": hero_event["description"] if hero_event else (hero_announcement or {}).get("description", ""),
            "location": hero_event["location"] if hero_event else "",
            "category": hero_event["category"] if hero_event else (hero_announcement or {}).get("category", ""),
            "cta": "Join Live Stream",
            "starts_at": (hero_event or {}).get("start_datetime") or (hero_announcement or {}).get("published_at"),
        },
        "coming_events": serialize(coming_events),
        "briefings": serialize(briefings),
        "briefings_total": len(briefings),
        "actions": serialize(actions),
        "actions_done_count": done_count,
        "meeting_queue": serialize(meetings),
        "events": serialize(events),
        "bulletins": serialize(bulletins),
        "tickets": serialize(tickets + resolved),
        "apps": serialize(apps),
        "calendar_events": serialize(calendar_events),
    }


@router.get("/projects")
def projects(employee: dict = Depends(get_current_employee)):
    rows = db.query(
        """SELECT id, employee_id, name, description, role, status, progress, due_date, created_at
           FROM portal_projects
           WHERE employee_id = %s OR employee_id IS NULL
           ORDER BY FIELD(status, 'AT RISK', 'ACTIVE', 'PAUSED', 'PLANNING', 'DONE'), progress DESC
           LIMIT 12""",
        (employee["id"],),
    )
    return {"projects": serialize(rows)}


class ActionBody(BaseModel):
    title: str
    source_type: str = "MANUAL"
    source_id: int | None = None
    due_date: str | None = None


@router.post("/actions")
def add_action(body: ActionBody, employee: dict = Depends(get_current_employee)):
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    if body.source_type not in ("MANUAL", "BRIEFING"):
        raise HTTPException(status_code=422, detail="source_type must be MANUAL or BRIEFING")
    due = None
    if body.due_date:
        try:
            due = datetime.fromisoformat(body.due_date).date()
        except ValueError:
            due = None
    db.execute(
        """INSERT INTO todos (employee_id, title, description, priority, status, due_date, source_type, source_id, created_at, updated_at)
           VALUES (%s, %s, '', 'LOW', 'TODO', %s, %s, %s, NOW(), NOW())""",
        (employee["id"], title[:255], due, body.source_type, body.source_id),
    )
    return {"ok": True}


@router.patch("/actions/{action_id}")
def toggle_action(action_id: int, body: dict, employee: dict = Depends(get_current_employee)):
    status = body.get("status")
    if status not in ("TODO", "COMPLETED"):
        raise HTTPException(status_code=422, detail="status must be TODO or COMPLETED")
    rowcount = db.execute(
        "UPDATE todos SET status = %s, updated_at = NOW() WHERE id = %s AND employee_id = %s",
        (status, action_id, employee["id"]),
    )
    if not rowcount:
        raise HTTPException(status_code=404, detail="Action not found")
    return {"ok": True}
