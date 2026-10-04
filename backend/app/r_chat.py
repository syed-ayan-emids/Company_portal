from fastapi import APIRouter, Depends
from pydantic import BaseModel

from . import bot, db
from .r_auth import get_current_employee

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatBody(BaseModel):
    message: str


@router.post("")
def chat(body: ChatBody, employee: dict = Depends(get_current_employee)):
    text = body.message.strip()
    if not text:
        return {"reply": "Say something and I will dig into your data."}
    reply = bot.reply(employee, text)
    db.execute(
        "INSERT INTO portal_chat_messages (employee_id, role, content) VALUES (%s, %s, %s)",
        (employee["id"], "user", text[:2000]),
    )
    db.execute(
        "INSERT INTO portal_chat_messages (employee_id, role, content) VALUES (%s, %s, %s)",
        (employee["id"], "bot", reply[:4000]),
    )
    return {"reply": reply}


@router.get("/history")
def history(employee: dict = Depends(get_current_employee)):
    rows = db.query(
        """SELECT role, content, created_at FROM portal_chat_messages
           WHERE employee_id = %s ORDER BY id DESC LIMIT 40""",
        (employee["id"],),
    )
    rows.reverse()
    return {"messages": [{"role": r["role"], "content": r["content"]} for r in rows]}


@router.delete("/history")
def clear_history(employee: dict = Depends(get_current_employee)):
    db.execute("DELETE FROM portal_chat_messages WHERE employee_id = %s", (employee["id"],))
    return {"ok": True}
