#!/bin/bash
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend || exit 1
python3 portal_setup.py
sleep 1
# restart only OUR api (8010)
pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8010" | xargs -r kill -9 2>/dev/null
sleep 1
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &
sleep 3
curl -s http://127.0.0.1:8010/api/health
echo
curl -s -c /tmp/cookies.txt -X POST http://127.0.0.1:8010/api/auth/login -H "Content-Type: application/json" -d '{"username":"ayankhan","password":"emids123"}' > /dev/null
echo "=== projects api ==="
curl -s -b /tmp/cookies.txt http://127.0.0.1:8010/api/projects | head -c 700
echo
echo "=== bot projects ==="
curl -s -b /tmp/cookies.txt -X POST http://127.0.0.1:8010/api/chat -H "Content-Type: application/json" -d '{"message":"my projects"}'
echo
