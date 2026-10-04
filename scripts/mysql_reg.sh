#!/bin/bash
# regression: make sure the ported queries still work on the local MySQL
pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8010" | xargs -r kill -9 2>/dev/null
sleep 1
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend || exit 1
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &
sleep 4
curl -s http://127.0.0.1:8010/api/health; echo
curl -s -c /tmp/cookies.txt -X POST http://127.0.0.1:8010/api/auth/login -H "Content-Type: application/json" -d '{"username":"syedayan","password":"emids123"}' | head -c 120; echo
curl -s -b /tmp/cookies.txt http://127.0.0.1:8010/api/dashboard | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('me:', d['me']['name'])
print('briefings:', len(d['briefings']), '| actions:', len(d['actions']), '| statuses:', [a['status'] for a in d['actions']])
print('hero:', d['hero']['title'], '| calendar:', len(d['calendar_events']))
"
curl -s -b /tmp/cookies.txt http://127.0.0.1:8010/api/projects | python3 -c "
import json, sys
for p in json.load(sys.stdin)['projects']: print(' ', p['status'], '|', p['name'])
"
curl -s -b /tmp/cookies.txt -X POST http://127.0.0.1:8010/api/chat -H "Content-Type: application/json" -d '{"message":"my projects"}' | head -c 200; echo
