#!/bin/bash
mysql -u chatbot_user -p123456789 chatbot <<'SQL'
UPDATE employees SET name = 'Syed Ayan', email = 'syed.ayan@emids.com', avatar_url = 'https://i.pravatar.cc/80?u=syedayan' WHERE name = 'Ayan Khan';
UPDATE portal_users SET username = 'syedayan' WHERE username = 'ayankhan';
SELECT id, name, email FROM employees;
SELECT username FROM portal_users;
SQL
