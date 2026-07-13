import { query } from "./db.js";
const users = await query("SELECT id, full_name, role, account_type, status FROM users WHERE role != 'admin' ORDER BY created_at DESC LIMIT 10");
console.log(JSON.stringify(users, null, 2));
process.exit(0);
