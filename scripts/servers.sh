#!/bin/bash
# Restore the ARC_portal app the user had running on 8000
setsid nohup /mnt/c/Users/syeda2/Desktop/ARC_portal/backend/myenv/bin/python3.11 \
  /mnt/c/Users/syeda2/Desktop/ARC_portal/backend/myenv/bin/uvicorn app.main:app \
  --reload --port 8000 > /tmp/arc_portal_8000.log 2>&1 < /dev/null &
cd /mnt/c/Users/syeda2/Desktop/ARC_portal/backend || exit 1
cd - > /dev/null

# Start our portal API fresh on 8010
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend || exit 1
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &
sleep 4
echo "=== processes ==="
pgrep -af uvicorn
echo "=== ours health ==="
curl -s http://127.0.0.1:8010/api/health
echo
echo "=== theirs health ==="
curl -s http://127.0.0.1:8000/api/health | head -c 200
