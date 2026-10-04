#!/bin/bash
# Throwaway Postgres to verify the port end-to-end, then removed.
set -e
docker rm -f pgtest >/dev/null 2>&1 || true
docker run --rm -d --name pgtest -e POSTGRES_PASSWORD=portalpw -e POSTGRES_DB=emidsportal -p 5433:5432 postgres:17-alpine
for i in $(seq 1 30); do
  docker exec pgtest pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
docker exec pgtest pg_isready -U postgres || { echo "pg never came up"; exit 1; }

export DATABASE_URL="postgresql://postgres:portalpw@127.0.0.1:5433/emidsportal"
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend
echo "=== seed (postgres) ==="
python3 seed_full.py

echo "=== restart API on 8011 against postgres ==="
pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8011" | xargs -r kill -9 2>/dev/null || true
DATABASE_URL="$DATABASE_URL" setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8011 > /tmp/portal_pg.log 2>&1 < /dev/null &
sleep 4

echo "=== smoke ==="
curl -s http://127.0.0.1:8011/api/health; echo
curl -s -c /tmp/pgcookies.txt -X POST http://127.0.0.1:8011/api/auth/login -H "Content-Type: application/json" -d '{"username":"syedayan","password":"emids123"}' | head -c 120; echo
curl -s -b /tmp/pgcookies.txt http://127.0.0.1:8011/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('me:', d['me']['name'])
print('hero:', d['hero']['title'])
print('briefings:', len(d['briefings']), '| actions:', len(d['actions']), '| statuses:', [a['status'] for a in d['actions']])
print('meetings:', len(d['meeting_queue']), '| tickets:', len(d['tickets']), '| apps:', len(d['apps']), '| calendar:', len(d['calendar_events']), '| events:', len(d['events']), '| bulletins:', len(d['bulletins']))
"
echo "=== projects ordering (CASE) ==="
curl -s -b /tmp/pgcookies.txt http://127.0.0.1:8011/api/projects | python3 -c "
import json, sys
for p in json.load(sys.stdin)['projects']: print(' ', p['status'], '|', p['name'])
"
echo "=== chat ==="
curl -s -b /tmp/pgcookies.txt -X POST http://127.0.0.1:8011/api/chat -H "Content-Type: application/json" -d '{"message":"my projects"}' | head -c 300; echo
curl -s -b /tmp/pgcookies.txt -X POST http://127.0.0.1:8011/api/actions -H "Content-Type: application/json" -d '{"title":"pg smoke test","source_type":"BRIEFING","source_id":1,"due_date":"2026-10-06"}' > /dev/null
echo "added pg smoke action ok"
curl -s -b /tmp/pgcookies.txt -X PATCH http://127.0.0.1:8011/api/actions/1 -H "Content-Type: application/json" -d '{"status":"COMPLETED"}'; echo
mysql -u chatbot_user -p123456789 chatbot -e "SELECT COUNT(*) AS mysql_todos FROM todos WHERE title='pg smoke test';" 2>/dev/null
curl -s -b /tmp/pgcookies.txt -X PATCH http://127.0.0.1:8011/api/actions/1 -H "Content-Type: application/json" -d '{"status":"TODO"}' > /dev/null
echo "=== SPA serving ==="
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8011/

echo "=== cleanup ==="
pgrep -f "uvicorn app.main:app.*--port 8011" | xargs -r kill -9 2>/dev/null || true
docker rm -f pgtest > /dev/null
echo OK
