# emids Portal — full-stack company portal

Modern internal portal for emids built from the UX-Pilot reference design:
dark emids-branded icon rail, live greeting header, "Global Update" hero with
countdown, app *Ecosystem* launcher, and six data-connected widget cards
(Briefings, Actions, Calendar, Meeting Sync, Bulletin, Support) — plus a
data-aware in-house chatbot (floating logo button, bottom-right → opens a
chat sidebar) and **privacy mode** for shared screens.

## Stack

| Layer     | Tech                                                          |
|-----------|---------------------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS 3 (Node 20, in WSL)            |
| Backend   | Python 3.14 · FastAPI · PyMySQL (local) / psycopg (Postgres)  |
| Database  | Dual dialect: MySQL 8.4 (local dev) or PostgreSQL 17 (Render) |
| Auth      | JWT in an HttpOnly cookie, PBKDF2 password hashing            |

## Design notes (v3)

- **Banner slider** — the Global Update banner rotates through the company
  update, the next two company events and the latest bulletin: arrows, dot
  indicators, 7-second auto-rotate that pauses on hover.
- **"All portals" menu (left rail grid button)** — flyout with portal tiles
  (Projects, Timesheets, Refer Another You RAY, Learning & Development,
  Wellness Hub, Support Hub) plus every ecosystem app. Tiles without a
  live URL show a "coming with the next release" toast; the Projects tile
  opens the Projects module.
- **Projects module** — nav icon next to Home (replaces the duplicate
  Assistant icon; the assistant lives on the bottom rail button). Modal
  cards with status chips (Active/Paused/At Risk/Planning/Done), progress
  bars and due dates, employee-scoped (`portal_projects` table — additive).
  The assistant answers "my projects" too.

## Data sources

Every card reads the employee's real rows from MySQL:

| Card         | Table(s)                    |
|--------------|-----------------------------|
| Briefings    | `briefings`                 |
| Actions      | `todos` (per employee)      |
| Calendar     | `events` + `meetings`       |
| Meeting Sync | `meetings` (per employee)   |
| Bulletin     | `announcements`             |
| Support      | `tickets` (per employee)    |
| Ecosystem    | `quick_links`               |
| Hero banner  | next company `events` row   |
| Chat history | `portal_chat_messages` (new, additive) |
| Login        | `portal_users` (new, additive) |

Only two **new** tables were added (`portal_users`, `portal_chat_messages`);
existing tables were never altered or reseeded.

## Run it

Backend (WSL, port **8010**):

```bash
cd backend
pip3 install --break-system-package -r requirements.txt
python3 portal_setup.py                                  # creates portal_* tables + demo logins
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010
```

Frontend (WSL, port **5180**):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5180

Demo logins (password for both: `emids123`)

- `syedayan` — Syed Ayan, AI Engineer (rich demo data)
- `saramalik` — Sara Malik, Data Scientist
- company email works too: `syed.ayan@emids.com`

Or start both with:

```bash
bash scripts/dev.sh
```

## Design notes (v2)

- **Target hardware: 1920×1080 laptops.** These usually run 125–150% Windows
  scaling (plus a classic scrollbar), so the effective viewport is ~1263px.
  The desktop layout therefore (a) engages all breakpoints from ~1024px up,
  and (b) locks the team's preferred **90%-zoom density** via
  `html { zoom: 0.9 }` at ≥1024px (see `index.css`). Do not raise or "fix"
  these without checking a 1263×900 viewport at 100% browser zoom.
- **App dock** — quick links live on a slim ~50px dock pinned to the right
  screen edge (tooltips + an "all apps" popover). The big Ecosystem card is
  gone; the dock appears from a 1280px-wide viewport up. Below that, apps
  are reachable from the command palette.
- **Command palette (⌘K / Ctrl+K, or click the search pill)** — one searchable
  surface fronts every action: add an action, toggle privacy mode, open the
  full schedule, ask the assistant, jump to any app, sign out.
  Arrow-key driven; Enter to run; personal commands hide during privacy mode.
- **Hero banner** — ~380px tall with large typography and the countdown chip
  on the right; content stays a calm 3×2 card grid, centered between the
  rail and the dock on wide screens.

## Privacy mode (shared-screen safety)

- **Eye toggle in the top bar** — collapses *all* personal cards at once,
  hides the user's name and disables search. Persisted in localStorage.
- **Per-card chevron** — collapse/expand any single card (Briefings,
  Actions, Calendar, Meeting Sync, Bulletin, Support).
- While privacy mode is on, cards show a "Personal info hidden" placeholder
  instead of raw data.

## Chatbot ("emids Assistant")

- Floating round emids-gradient logo, bottom-right; click → chat sidebar.
- Answers live from MySQL: pending actions, today/tomorrow/upcoming
  meetings, briefings, bulletin news, tickets, ecosystem apps, your profile.
- `add task <title>` creates an action — it appears in the Actions card.
- History persists per user (`portal_chat_messages`), eraser icon clears it.
- No external API keys required.

## Deployment (Render / Vercel)

Three pieces, two shells — pick a lane:

### Option A — everything on Render (recommended, one URL)

The frontend build is served by the API itself (SPA fallback in `app/main.py`),
so auth cookies stay same-origin and there is no CORS setup.

1. Push this repo to GitHub (`git init && git add -A && git commit && git push`).
2. Render dashboard → **Blueprint** → point at the repo. `render.yaml` creates:
   - `emids-portal-db` — managed MySQL, and
   - `emids-portal` — Docker web service (multi-stage build: node for Vite,
     python for FastAPI).
   `JWT_SECRET` is generated; DB env vars sync automatically.
3. First boot runs `seed_full.py` → creates all tables and fresh demo data
   (dates are generated relative to deploy day, so demos stay current) and
   logins `ayankhan` / `saramalik` (`emids123`).
4. Open the service URL. Later: Settings → Environment for changes; deploys
   are automatic on push.

Free instances sleep (~50s cold start). Keep-alive pings to `/api/health`
(UptimeRobot every 10min) prevent the sleep.

### Option B — split: Vercel (frontend) + Render (backend)

1. Deploy the backend on Render first, as in Option A but with the MySQL
   database as its datastore. Note the service URL, e.g.
   `https://emids-portal-api.onrender.com`.
2. Vercel → **Add New Project** → import the repo → set **Root Directory** to
   `frontend`. Framework auto-detects as Vite.
3. In `frontend/vercel.json` replace
   `https://REPLACE-WITH-YOUR-BACKEND.onrender.com` with the Render URL.
   The rewrite routes `/api/*` through Vercel so the browser stays
   same-origin — cookies and code need no changes.
4. Deploy. `https://<your-app>.vercel.app` serves the UI and proxies APIs.

### Database options

- **Render managed PostgreSQL** (Option A default, Postgres 17) — the
  blueprint wires `DATABASE_URL` automatically.
- **Any public MySQL** still works (Aiven free tier, RDS…): set the
  `DB_HOST/PORT/USER/PASSWORD/NAME` env vars instead (+ `DB_SSL_CA` = path
  to the provider's CA cert file when TLS is mandatory). `seed_full.py`
  prepares the MySQL schema on first boot in that mode too.
- **On-prem company MySQL**: only works from a host that can reach it; cloud
  platforms can't see your LAN. If the company DB is on VPN/RDS, deploy from
  a VPS with private connectivity instead, or schedule a data sync.
- Data lives in the deployment DB; the local WSL MySQL is only your dev copy.

### Migration from existing data

To carry your current `chatbot` DB's rows into a cloud **MySQL** instead of
the fresh demo set: `mysqldump -u chatbot_user -p123456789 chatbot > dump.sql`
from WSL, then `mysql -h <cloud-host> -u <user> -p <db> < dump.sql`. To load
it into the Render **Postgres** instead, do the same dump and convert types
(SERIAL/TIMESTAMP per `seed_full.py`'s Postgres DDL) — or simply start with
the seeded demo set and import real records through the APIs.

## Configuration

**Local dev (MySQL):** `backend/.env` — DB connection (host 127.0.0.1, user
`chatbot_user`), JWT secret, ports. Update the values here if your MySQL
credentials change.

**Render (Postgres):** no `.env` needed — set one environment variable on the
service, `DATABASE_URL` (Render's Blueprint syncs it automatically from the
database resource). When `DATABASE_URL` is set the backend uses psycopg and
ignores the `DB_*` MySQL settings; `seed_full.py` + `portal_setup.py`
auto-create the schema on first boot.

## Ports in use on this machine

| Port | Who                                    |
|------|----------------------------------------|
| 8000 | *Another project of yours* (ARC_portal API) — untouched |
| 8010 | This portal's FastAPI API               |
| 5173 | Another project's Vite dev server       |
| 5180 | This portal's Vite dev server           |
