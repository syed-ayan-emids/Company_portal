#!/bin/bash
# Kill every vite process running from OUR project (user's vite on 5173 is untouched)
for pid in $(pgrep -f "vite.js" 2>/dev/null); do
  cwd=$(readlink -f /proc/$pid/cwd 2>/dev/null)
  echo "kill $pid ($cwd)"
  if [[ "$cwd" == *Arc_new* ]]; then kill -9 "$pid" 2>/dev/null; fi
done
sleep 2
echo "--- listeners 5180/5181 now:"
ss -ltnp 2>/dev/null | grep -E ":5180|:5181" || echo "none"
