from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel

from . import config, db, security

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


def cookie_from_header(cookie_header: str) -> str | None:
    for part in cookie_header.split(";"):
        name, _, value = part.strip().partition("=")
        if name == config.COOKIE_NAME:
            return value
    return None


def get_current_employee(cookie: str = Header(default="")) -> dict:
    token = cookie_from_header(cookie) if cookie else None
    employee_id = security.decode_token(token) if token else None
    if not employee_id:
        raise HTTPException(status_code=401, detail="Not signed in")
    employee = db.one(
        """SELECT e.id, e.name, e.email, e.job_title, e.department, e.avatar_url, u.role
           FROM employees e JOIN portal_users u ON u.employee_id = e.id
           WHERE e.id = %s""",
        (employee_id,),
    )
    if not employee:
        raise HTTPException(status_code=401, detail="Account no longer exists")
    return employee


@router.post("/login")
def login(body: LoginBody, response: Response):
    user = db.one(
        """SELECT u.id, u.employee_id, u.password_hash FROM portal_users u
           WHERE u.username = %s""",
        (body.username.strip().lower(),),
    )
    if not user and "@" in body.username:
        user = db.one(
            """SELECT u.id, u.employee_id, u.password_hash FROM portal_users u
               JOIN employees e ON e.id = u.employee_id
               WHERE e.email = %s""",
            (body.username.strip().lower(),),
        )
    if not user or not security.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = security.create_token(user["employee_id"])
    response.set_cookie(
        config.COOKIE_NAME,
        token,
        max_age=7 * 24 * 3600,
        httponly=True,
        samesite="lax",
        path="/",
    )
    employee = db.one("SELECT id, name, email FROM employees WHERE id = %s", (user["employee_id"],))
    return {"ok": True, "employee": employee}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(config.COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
def me(employee: dict = Depends(get_current_employee)):
    return {"employee": employee}
