// Run once: node setup-groq.js
// Inserts the Groq API key into the settings table

const GROQ_KEY = process.argv[2];
if (!GROQ_KEY) {
  console.log("Usage: node setup-groq.js YOUR_GROQ_API_KEY");
  process.exit(1);
}

import { initDb, execute, query } from "./db.js";

initDb().then(async () => {
  const existing = await query("SELECT value FROM settings WHERE key = 'groq_api_key'");
  if (existing.length > 0 && existing[0].value) {
    await execute("UPDATE settings SET value = ? WHERE key = 'groq_api_key'", [GROQ_KEY]);
    console.log("✅ Groq API key updated in settings DB");
  } else {
    await execute("INSERT INTO settings (key, value) VALUES ('groq_api_key', ?)", [GROQ_KEY]);
    console.log("✅ Groq API key inserted into settings DB");
  }
  process.exit(0);
}).catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
