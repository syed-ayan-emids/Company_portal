#!/bin/bash
mysql -u chatbot_user -p123456789 -h 127.0.0.1 -e "CREATE DATABASE IF NOT EXISTS emids_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON emids_portal.* TO 'chatbot_user'@'%'; FLUSH PRIVILEGES;" 2>&1 | grep -v "Using a password"
mysql -u chatbot_user -p123456789 -h 127.0.0.1 -e "SHOW DATABASES;" 2>/dev/null
