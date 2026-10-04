#!/bin/bash
mysql -u chatbot_user -p123456789 chatbot <<'SQL'
DELETE FROM todos WHERE id = 17 AND employee_id = 1 AND source_type = 'BRIEFING';
SELECT id, title, status FROM todos WHERE employee_id = 1 ORDER BY id;
SQL
