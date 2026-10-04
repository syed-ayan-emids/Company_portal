#!/bin/bash
for t in briefings events meetings todos tickets announcements employees quick_links; do
  echo "=== $t ==="
  mysql -u chatbot_user -p123456789 -h 127.0.0.1 chatbot -e "DESCRIBE $t; SELECT COUNT(*) AS rows_ FROM $t;" 2>/dev/null
done
