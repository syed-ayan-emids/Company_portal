#!/bin/bash
# Starts (or stops) the emids Portal backend + frontend.
#   bash scripts/dev.sh        -> start both
#   bash scripts/dev.sh stop   -> stop the two portal processes (only ports 8010/5180)

ROOT=/mnt/c/Users/syeda2/Desktop/Arc_new

if [ "$1" = "stop" ]; then
  pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8010" | xargs -r kill
  pgrep -f "vite$" | head -20 > /dev/null 2>&1
  for pid in $(pgrep -f "node .*Arc_new/frontend.*vite"); do kill "$pid"; done
  echo "portal stopped"
  exit 0
fi

cd "$ROOT/backend" || exit 1
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &

cd "$ROOT/frontend" || exit 1
setsid nohup node node_modules/vite/bin/vite.js > /tmp/portal_vite.log 2>&1 < /dev/null &

sleep 3
echo "API  : http://localhost:5180  (health: curl http://127.0.0.1:8010/api/health)"
echo "UI   : http://localhost:5180"
curl -s http://127.0.0.1:8010/api/health && echo " <- api ok"
