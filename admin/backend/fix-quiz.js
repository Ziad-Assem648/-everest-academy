import { initDb, execute } from "./db.js";
await initDb();
// Fix lesson quiz - set type to "lesson" and lesson_id
await execute("UPDATE quizzes SET type = 'lesson', lesson_id = '1519d072-eca5-4c87-8236-dcad43ea0e28' WHERE id = '7e3e5c09-7717-435a-977f-56767aa270de'");
// Delete old quizzes from previous test courses
await execute("DELETE FROM quizzes WHERE topic_id = '888de47f-7223-4fdb-a620-f9a735e4d7bb'");
console.log("Fixed quiz data");
process.exit();
