import { v4 as uuidv4 } from "uuid";
import { createClient } from "@libsql/client";
import initSqlJs from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "everest.db");

const ziadassemId = "e0dce3fd-daf5-4c3e-8aca-03d3021b7db0";

async function run() {
  const isTurso = !!(process.env.TURSO_URL && process.env.TURSO_TOKEN);
  let db;
  if (isTurso) {
    db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
  } else {
    const SQL = await initSqlJs();
    const buffer = existsSync(DB_PATH) ? readFileSync(DB_PATH) : null;
    db = new SQL.Database(buffer);
    db.run("PRAGMA foreign_keys = ON");
  }

  async function q(sql, params = []) {
    const safe = params.map(p => p === undefined ? null : p);
    if (isTurso) {
      const r = await db.execute({ sql, args: safe, rowMode: "object" });
      return r.rows;
    }
    const stmt = db.prepare(sql);
    if (safe.length) stmt.bind(safe);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  async function e(sql, params = []) {
    const safe = params.map(p => p === undefined ? null : p);
    if (isTurso) { await db.execute({ sql, args: safe }); return; }
    db.run(sql, safe);
  }

  function save() {
    if (!isTurso && db) {
      const data = db.export();
      writeFileSync(DB_PATH, Buffer.from(data));
    }
  }

  // Create 10 first-level users under Ziadassem
  const firstLevel = [];
  for (let i = 1; i <= 10; i++) {
    const id = uuidv4();
    firstLevel.push({ id, idx: i - 1 });
    await e("INSERT INTO users (id, full_name, email, password, role, referral_code, referred_by, rank, status, direct_count, total_team_sales, e_money) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, "User" + i, "user" + i + "@test.com", "123", "student", "EVR-" + id.slice(0,6).toUpperCase(), ziadassemId, "Star", "active", 0, 0, 1000]);
  }

  // Create 5 second-level: 3 under User1, 2 under User2
  const subParents = [firstLevel[0].id, firstLevel[0].id, firstLevel[0].id, firstLevel[1].id, firstLevel[1].id];
  for (let i = 1; i <= 5; i++) {
    const id = uuidv4();
    await e("INSERT INTO users (id, full_name, email, password, role, referral_code, referred_by, rank, status, direct_count, total_team_sales, e_money) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, "SubUser" + i, "subuser" + i + "@test.com", "123", "student", "EVR-" + id.slice(0,6).toUpperCase(), subParents[i-1], "Star", "active", 0, 0, 500]);
  }

  // Update direct_count for Ziadassem and first-level parents with children
  await e("UPDATE users SET direct_count = (SELECT COUNT(*) FROM users WHERE referred_by = ?) WHERE id = ?", [ziadassemId, ziadassemId]);
  await e("UPDATE users SET direct_count = 3 WHERE id = ?", [firstLevel[0].id]);
  await e("UPDATE users SET direct_count = 2 WHERE id = ?", [firstLevel[1].id]);

  // Build closure table for all users
  const allUsers = await q("SELECT id, referred_by FROM users WHERE role != 'admin'");
  for (const u of allUsers) {
    await e("INSERT OR IGNORE INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, 0)", [u.id, u.id]);
  }
  for (const u of allUsers) {
    if (!u.referred_by) continue;
    const stack = [{ id: u.referred_by, depth: 1 }];
    while (stack.length) {
      const cur = stack.shift();
      await e("INSERT OR IGNORE INTO user_closure (ancestor, descendant, depth) VALUES (?, ?, ?)", [cur.id, u.id, cur.depth]);
      const parent = (await q("SELECT referred_by FROM users WHERE id = ?", [cur.id]))[0];
      if (parent?.referred_by) stack.push({ id: parent.referred_by, depth: cur.depth + 1 });
    }
  }

  // Distribute 1000 E-Money to all upline levels for each new user (MLM commission)
  for (const u of allUsers) {
    if (u.id === ziadassemId || u.id === "admin-001") continue;
    const ancestors = await q("SELECT ancestor FROM user_closure WHERE descendant = ? AND depth > 0 ORDER BY depth ASC", [u.id]);
    for (const a of ancestors) {
      await e("UPDATE users SET e_money = e_money + 1000 WHERE id = ?", [a.ancestor]);
    }
  }

  // Run rank update
  const updateRes = await q("SELECT id FROM users WHERE role != 'admin' AND id != 'admin-001'");
  for (const u of updateRes) {
    const teamCount = (await q("SELECT COUNT(*) - 1 as cnt FROM user_closure WHERE ancestor = ?", [u.id]))[0]?.cnt || 0;
    const allRanks = await q("SELECT * FROM ranks WHERE is_active = 1 ORDER BY sort_order ASC");
    let rank = "Star";
    for (const r of allRanks) {
      const req = r.sales_required !== undefined ? r.sales_required : r.min_direct;
      if (teamCount >= req) rank = r.name;
      else break;
    }
    const bonusAmt = (allRanks.find(r => r.name === rank)?.bonus || allRanks.find(r => r.name === rank)?.weekly_bonus || 0);
    await e("UPDATE users SET rank = ?, rank_progress = ? WHERE id = ?", [rank, teamCount >= 600 ? 100 : 0, u.id]);
  }

  save();

  const result = await q("SELECT id, full_name, email, referred_by, rank, direct_count, e_money FROM users WHERE role != 'admin' ORDER BY full_name");
  console.log(JSON.stringify(result, null, 2));
  console.log("Total users:", result.length);
}

run().catch(e => { console.error(e); process.exit(1); });
