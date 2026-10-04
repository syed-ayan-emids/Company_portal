#!/bin/bash
mysql -u chatbot_user -p123456789 chatbot -e "DELETE FROM todos WHERE title = 'Share pillar demo feedback with team'; SELECT COUNT(*) AS ayan_pending FROM todos t JOIN employees e ON e.id=t.employee_id WHERE t.status <> 'COMPLETED' AND e.name='Ayan Khan';" 2>/dev/null
