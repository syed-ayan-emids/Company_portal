#!/bin/bash
# restart just OUR vite (port 5180) — leave the user's vite (5173) alone
for pid in $(pgrep -f "Arc_new/frontend"); do kill "$pid" 2>/dev/null; done
sleep 1
cd /mnt/c/Users/syeda2/Desktop/Arc_new/frontend || exit 1
setsid nohup node node_modules/vite/bin/vite.js > /tmp/portal_vite.log 2>&1 < /dev/null &
sleep 3
grep -E "ready|Local|error" /tmp/portal_vite.log | head -4
