#!/bin/bash
cd /mnt/c/Users/syeda2/Desktop/Arc_new/frontend || exit 1
npm run build 2>&1 | tail -6
cd /mnt/c/Users/syeda2/Desktop/Arc_new/backend || exit 1
pgrep -f "uvicorn app.main:app --host 0.0.0.0 --port 8010" | xargs -r kill -9 2>/dev/null
sleep 1
setsid nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8010 > /tmp/portal_api.log 2>&1 < /dev/null &
sleep 3
echo "--- root serve:"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:8010/
echo "--- assets serve:"
ASSET=$(curl -s http://127.0.0.1:8010/ | grep -o 'assets/index-[^"]*\.js' | head -1)
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://127.0.0.1:8010/$ASSET"
echo "--- api still works:"
curl -s http://127.0.0.1:8010/api/health
echo
echo "--- unknown api route:"
curl -s http://127.0.0.1:8010/api/none
echo
