import { initDb, query } from "./db.js";
initDb().then(async () => {
  const cols = await query("PRAGMA table_info(quizzes)");
  console.log("Quizzes columns:", JSON.stringify(cols, null, 2));
  const sample = await query("SELECT id, course_id, topic_id, lesson_id, type, quiz_type, title FROM quizzes LIMIT 5");
  console.log("Sample quizzes:", JSON.stringify(sample, null, 2));
  process.exit();
}).catch(e => { console.error(e); process.exit(1); });
