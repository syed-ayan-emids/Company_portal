#!/bin/bash
for t in employees briefings events meetings todos tickets announcements quick_links; do
  echo "=== $t ==="
  mysql -u chatbot_user -p123456789 -h 127.0.0.1 chatbot -e "SELECT * FROM $t\G" 2>/dev/null
done
