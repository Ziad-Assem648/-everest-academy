import Database from "better-sqlite3";
const db = new Database("everest.db");
const users = db.prepare("SELECT id, full_name, rank, e_money, direct_count FROM users WHERE role NOT IN ('admin','manager') AND rank IS NOT NULL AND rank != ''").all();
console.log("Users with ranks:", users.map(u => `${u.id} | ${u.full_name} | ${u.rank} | ${u.direct_count} directs | ${u.e_money} EM`));

const icons = {"Star":"⭐","Executive":"🚀","Executive Star":"💎","Team Leader":"🏆","Senior Leader":"🌍","Regional Leader":"⚡","Everest Elite":"🔱","Everest Master":"🔥","Everest Legend":"🌟","Everest Ambassador":"👑"};

db.prepare("DELETE FROM leaders").run();
for (const u of users) {
  db.prepare("INSERT INTO leaders (id, name, rank, avatar, icon) VALUES (?, ?, ?, ?, ?)").run(u.id, u.full_name, u.rank, null, icons[u.rank] || "🏆");
  console.log(`Added: ${u.full_name} as ${u.rank}`);
}
db.close();
console.log("Done!");
