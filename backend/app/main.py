from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import r_auth, r_chat, r_data

app = FastAPI(title="emids Portal API", version="1.0.0")


@app.get("/api/health")
def health():
    return {"ok": True}


app.include_router(r_auth.router)
app.include_router(r_data.router)
app.include_router(r_chat.router)

# In production (Docker/Render all-in-one build) the API also serves the
# built SPA from frontend/dist so one service hosts everything and
# auth cookies stay same-origin.
REPO_ROOT = Path(__file__).resolve().parents[2]
DIST = REPO_ROOT / "frontend" / "dist"
if (DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target = DIST / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST / "index.html")
