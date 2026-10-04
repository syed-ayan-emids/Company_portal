#!/bin/bash
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend || exit 1
python3 -c "from app import main; print('app import OK - spa mount active:', 'frontend' in main.spa.__doc__ or False)"
python3 seed_full.py
sleep 1
# restart our api to confirm nothing broke
pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8010" | xargs -r kill -9 2>/dev/null
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &
sleep 3
curl -s http://127.0.0.1:8010/api/health
echo
curl -s -c /tmp/cookies.txt -X POST http://127.0.0.1:8010/api/auth/login -H "Content-Type: application/json" -d '{"username":"ayankhan","password":"emids123"}' > /dev/null
curl -s -b /tmp/cookies.txt http://127.0.0.1:8010/api/projects | head -c 200
echo
mysql -u chatbot_user -p123456789 chatbot -e "SELECT COUNT(*) AS employees FROM employees; SELECT COUNT(*) AS projects FROM portal_projects;" 2>/dev/null
