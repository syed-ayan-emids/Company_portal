#!/bin/bash
echo "--- node/npm ---"
node --version 2>/dev/null || echo "node: MISSING"
npm --version 2>/dev/null || echo "npm: MISSING"

echo "--- mysql client ---"
mysql --version 2>/dev/null || echo "mysql client: MISSING"

echo "--- mysql connection as chatbot_user ---"
mysql -u chatbot_user -p123456789 -h 127.0.0.1 -e "SELECT VERSION(); SHOW DATABASES;" 2>&1 | head -20 || echo "CONNECT FAILED"

echo "--- mysqld running? ---"
sudo -n systemctl is-active mysql 2>/dev/null || service mysql status 2>/dev/null | head -3 || pgrep -a mysqld | head -3 || echo "status unknown"
