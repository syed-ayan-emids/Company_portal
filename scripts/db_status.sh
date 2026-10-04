#!/bin/bash
mysql -u chatbot_user -p123456789 chatbot <<'SQL'
SELECT t.id, t.title, t.status FROM todos t WHERE t.employee_id = 1 ORDER BY t.id;
SQL
