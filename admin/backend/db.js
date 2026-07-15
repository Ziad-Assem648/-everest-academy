import { createClient } from "@libsql/client";
import initSqlJs from "sql.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "everest.db");

let db = null;
let turso = null;
let isTurso = !!(process.env.TURSO_URL && process.env.TURSO_TOKEN);

export async function initDb() {
  if (isTurso) {
    try {
      turso = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
      await createSchema(turso, true);
      return turso;
    } catch (e) {
      console.warn("Turso connection failed, falling back to local sql.js:", e.message);
      isTurso = false;
    }
  }

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run("PRAGMA foreign_keys = ON");
  createSchema(db, false);
  saveDb();
  startAutoSave();
  return db;
}

function createSchema(driver, isTursoDb) {
  const exec = isTursoDb
    ? async (sql) => { const r = await driver.execute(sql); return r.rows; }
    : (sql) => driver.exec(sql);

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      phone TEXT, address TEXT, password TEXT NOT NULL, role TEXT DEFAULT 'registration',
      avatar TEXT, bio TEXT, referral_code TEXT UNIQUE, referred_by TEXT,
      rank TEXT DEFAULT '', e_money REAL DEFAULT 0, academic_points REAL DEFAULT 0,
      total_team_sales REAL DEFAULT 0, direct_count INTEGER DEFAULT 0,
      blocked INTEGER DEFAULT 0, status TEXT DEFAULT 'active',
      membership_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      title_ar TEXT, description_ar TEXT, category_ar TEXT,
      difficulty TEXT DEFAULT 'beginner', is_public INTEGER DEFAULT 1,
      price REAL DEFAULT 0, is_free INTEGER DEFAULT 1, category TEXT,
      tags TEXT, featured_image TEXT, intro_video TEXT, status TEXT DEFAULT 'draft',
      author_id TEXT, created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, title TEXT NOT NULL,
      summary TEXT, title_ar TEXT, summary_ar TEXT, sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY, topic_id TEXT NOT NULL, title TEXT NOT NULL,
      content TEXT, title_ar TEXT, content_ar TEXT, video_url TEXT,
      duration INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, is_free INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY, topic_id TEXT, lesson_id TEXT, course_id TEXT,
      type TEXT DEFAULT 'topic', quiz_type TEXT DEFAULT 'mixed',
      title TEXT NOT NULL,
      questions TEXT, total_marks INTEGER DEFAULT 0, pass_mark INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL, user_id TEXT NOT NULL,
      total_marks INTEGER DEFAULT 0, earned_marks REAL DEFAULT 0,
      correct_answers INTEGER DEFAULT 0, incorrect_answers INTEGER DEFAULT 0,
      result TEXT DEFAULT 'fail',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS quiz_leaderboard (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT,
      email TEXT,
      avatar TEXT,
      course_id TEXT,
      course_title TEXT,
      total_attempts INTEGER DEFAULT 0,
      avg_score REAL DEFAULT 0,
      passed INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      best_score REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, course_id TEXT NOT NULL,
      progress REAL DEFAULT 0, status TEXT DEFAULT 'approved',
      payment_method TEXT DEFAULT 'emoney', payment_proof TEXT, expires_at TEXT,
      enrolled_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount REAL NOT NULL,
      type TEXT NOT NULL, description TEXT, payment_method TEXT,
      payment_proof TEXT, status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS commissions (
      id TEXT PRIMARY KEY, from_user_id TEXT NOT NULL, to_user_id TEXT NOT NULL,
      level INTEGER NOT NULL, amount REAL DEFAULT 1000,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS ranks (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, sales_required INTEGER DEFAULT 0,
      bonus REAL DEFAULT 0, sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS rank_bonuses (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, rank_name TEXT NOT NULL,
      amount REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, message TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS top_up_requests (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount REAL NOT NULL,
      payment_method TEXT, payment_proof TEXT, phone_number TEXT,
      admin_id TEXT, reviewed_at TEXT, status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS upgrade_requests (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, status TEXT DEFAULT 'pending',
      admin_id TEXT, reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS leaders (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, rank TEXT NOT NULL,
      avatar TEXT, icon TEXT DEFAULT '🏆', sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
      message TEXT, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0,
      related_id TEXT, created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payment_gateways (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, value TEXT NOT NULL,
      label TEXT, is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS proofs (
      id TEXT PRIMARY KEY, image TEXT NOT NULL, caption TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, admin_name TEXT NOT NULL,
      action TEXT NOT NULL, target_user_id TEXT, target_user_name TEXT,
      details TEXT, created_at TEXT DEFAULT (datetime('now','localtime'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    // --- MLM Tables ---
    `CREATE TABLE IF NOT EXISTS user_closure (
      ancestor TEXT NOT NULL,
      descendant TEXT NOT NULL,
      depth INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ancestor, descendant),
      FOREIGN KEY (ancestor) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (descendant) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY, from_user_id TEXT NOT NULL, to_user_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      status TEXT DEFAULT 'completed' CHECK(status IN ('pending','completed','failed','cancelled')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS weekly_commissions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, rank_name TEXT NOT NULL,
      amount REAL NOT NULL, week_start TEXT NOT NULL, week_end TEXT NOT NULL,
      calculated_at TEXT DEFAULT (datetime('now','localtime')),
      status TEXT DEFAULT 'paid' CHECK(status IN ('paid','pending','cancelled')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS commission_exclusions (
      id TEXT PRIMARY KEY, commission_id TEXT NOT NULL, excluded_user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      FOREIGN KEY (commission_id) REFERENCES weekly_commissions(id) ON DELETE CASCADE,
      FOREIGN KEY (excluded_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS course_reviews (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, user_id TEXT NOT NULL,
      rating INTEGER DEFAULT 5, comment TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(course_id, user_id),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_token TEXT NOT NULL,
      device_type TEXT NOT NULL CHECK(device_type IN ('desktop','mobile')),
      device_info TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  if (isTursoDb) {
    return (async () => {
      await Promise.all(tables.map(sql => driver.execute(sql)));
      // Add new columns to existing users table (safe to run even if exists)
      try { await driver.execute("ALTER TABLE users ADD COLUMN negative_allowed INTEGER DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN qualified_direct_count INTEGER DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN membership_days INTEGER DEFAULT 365"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN membership_progress REAL DEFAULT 65"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN session_token TEXT"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN total_sales INTEGER DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN rank_progress INTEGER DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN commission_per_sale REAL DEFAULT 1000"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN membership_expires_at TEXT"); } catch(e) {}
      try { await driver.execute("ALTER TABLE ranks ADD COLUMN sales_required INTEGER DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE ranks ADD COLUMN bonus REAL DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE quizzes ADD COLUMN lesson_id TEXT"); } catch(e) {}
      try { await driver.execute("ALTER TABLE quizzes ADD COLUMN course_id TEXT"); } catch(e) {}
      try { await driver.execute("ALTER TABLE quizzes ADD COLUMN type TEXT DEFAULT 'topic'"); } catch(e) {}
      try { await driver.execute("ALTER TABLE quizzes ADD COLUMN pass_mark INTEGER DEFAULT 50"); } catch(e) {}
      try { await driver.execute("ALTER TABLE quizzes ADD COLUMN quiz_type TEXT DEFAULT 'mixed'"); } catch(e) {}
      try { await driver.execute("ALTER TABLE courses ADD COLUMN price_egp REAL DEFAULT 0"); } catch(e) {}
      try { await driver.execute("ALTER TABLE ranks ADD COLUMN image TEXT"); } catch(e) {}
      try { await driver.execute("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'student'"); } catch(e) {}
      try {
        await driver.execute("UPDATE users SET account_type = 'registration', role = 'registration' WHERE account_type = 'registration_sponsor'");
        await driver.execute("UPDATE users SET account_type = 'registration' WHERE role = 'registration' AND account_type = 'student'");
        await driver.execute("UPDATE users SET account_type = 'student' WHERE role NOT IN ('registration', 'admin', 'ghost') AND account_type = 'student'");
      } catch(e) {}
      try { await driver.execute("UPDATE ranks SET sales_required = 2 WHERE name = 'Star' AND sales_required = 0"); } catch(e) {}
      await seedDataTurso(driver, exec);
    })();
  }
  tables.forEach(sql => driver.run(sql));
  // Add new columns to existing users table (safe to run even if exists)
  try { driver.run("ALTER TABLE users ADD COLUMN negative_allowed INTEGER DEFAULT 0"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN qualified_direct_count INTEGER DEFAULT 0"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN membership_days INTEGER DEFAULT 365"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN membership_progress REAL DEFAULT 65"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN session_token TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN total_sales INTEGER DEFAULT 0"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN rank_progress INTEGER DEFAULT 0"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN commission_per_sale REAL DEFAULT 1000"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN membership_expires_at TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE quizzes ADD COLUMN lesson_id TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE quizzes ADD COLUMN course_id TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE quizzes ADD COLUMN type TEXT DEFAULT 'topic'"); } catch(e) {}
  try { driver.run("ALTER TABLE quizzes ADD COLUMN pass_mark INTEGER DEFAULT 50"); } catch(e) {}
  try { driver.run("ALTER TABLE quizzes ADD COLUMN quiz_type TEXT DEFAULT 'mixed'"); } catch(e) {}
  try { driver.run("ALTER TABLE courses ADD COLUMN price_egp REAL DEFAULT 0"); } catch(e) {}
  try { driver.run("ALTER TABLE ranks ADD COLUMN image TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE user_sessions ADD COLUMN device_type TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE user_sessions ADD COLUMN device_info TEXT"); } catch(e) {}
  try { driver.run("ALTER TABLE user_sessions ADD COLUMN last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch(e) {}
  try { driver.run("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'student'"); } catch(e) {}
  try {
    driver.run("UPDATE users SET account_type = 'registration', role = 'registration' WHERE account_type = 'registration_sponsor'");
    driver.run("UPDATE users SET account_type = 'registration' WHERE role = 'registration' AND account_type = 'student'");
    driver.run("UPDATE users SET account_type = 'student' WHERE role NOT IN ('registration', 'admin', 'ghost') AND account_type = 'student'");
  } catch(e) {}
  try { driver.run("UPDATE ranks SET sales_required = 2 WHERE name = 'Star' AND sales_required = 0"); } catch(e) {}
  seedDataLocal(driver);
}

async function seedDataTurso(driver, exec) {
  const rankRes = await exec("SELECT COUNT(*) as c FROM ranks");
  if (!rankRes.length || rankRes[0].c === 0) {
    const ranks = [
      ["r1","Star",2,0,0],["r2","Executive",5,1500,1],["r3","Executive Star",10,3000,2],
      ["r4","Team Leader",20,5000,3],["r5","Senior Leader",40,8000,4],
      ["r6","Regional Leader",70,12000,5],["r7","Everest Elite",120,18000,6],
      ["r8","Everest Master",200,28000,7],["r9","Everest Legend",350,45000,8],
      ["r10","Everest Ambassador",600,75000,9],
    ];
    for (const r of ranks) {
      await driver.execute({ sql: "INSERT INTO ranks (id,name,sales_required,bonus,sort_order) VALUES (?,?,?,?,?)", args: r });
    }
  }
  const adminRes = await exec("SELECT id FROM users WHERE email = 'admin@everest.com'");
  if (!adminRes.length) {
    await driver.execute({ sql: "INSERT INTO users (id,full_name,email,password,role,referral_code,rank,status) VALUES (?,?,?,?,?,?,?,'active')",
      args: ["admin-001","Admin Everest","admin@everest.com","admin123","admin","EVEREST-ADMIN","Star"] });
  }
}

function seedDataLocal(driver) {
  const rankExists = driver.exec("SELECT COUNT(*) as c FROM ranks");
  if (!rankExists.length || !rankExists[0].values.length || rankExists[0].values[0][0] === 0) {
    const ranks = [
      ["r1","Star",2,0,0],["r2","Executive",5,1500,1],["r3","Executive Star",10,3000,2],
      ["r4","Team Leader",20,5000,3],["r5","Senior Leader",40,8000,4],
      ["r6","Regional Leader",70,12000,5],["r7","Everest Elite",120,18000,6],
      ["r8","Everest Master",200,28000,7],["r9","Everest Legend",350,45000,8],
      ["r10","Everest Ambassador",600,75000,9],
    ];
    const stmt = driver.prepare("INSERT INTO ranks (id,name,sales_required,bonus,sort_order) VALUES (?,?,?,?,?)");
    for (const r of ranks) stmt.run(r);
    stmt.free();
  }
  const adminExists = driver.exec("SELECT id FROM users WHERE email = 'admin@everest.com'");
  if (!adminExists.length || !adminExists[0].values.length) {
    driver.run("INSERT INTO users (id,full_name,email,password,role,referral_code,rank,status) VALUES (?,?,?,?,?,?,?,'active')",
      ["admin-001","Admin Everest","admin@everest.com","admin123","admin","EVEREST-ADMIN","Star"]);
  }
}

export function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    // Save backup copy
    try {
      const backupDir = join(__dirname, "backups");
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.writeFileSync(join(backupDir, `everest-${timestamp}.db`), Buffer.from(data));
      // Keep only latest 5 backups
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith(".db")).sort().reverse();
      for (let i = 5; i < files.length; i++) fs.unlinkSync(join(backupDir, files[i]));
    } catch (e) {}
  }
}

// Auto-save every 10 minutes (started after init)
let autoSaveTimer = null;
export function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => { if (db) saveDb(); }, 600000);
}

export async function query(sql, params = []) {
  if (isTurso) {
    const safeParams = params.map(p => p === undefined ? null : p);
    const result = await turso.execute({ sql, args: safeParams, rowMode: 'object' });
    return result.rows;
  }
  const stmt = db.prepare(sql);
  const safeParams = params.map(p => p === undefined ? null : p);
  if (safeParams.length) stmt.bind(safeParams);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

export async function execute(sql, params = []) {
  const safeParams = params.map(p => p === undefined ? null : p);
  if (isTurso) {
    await turso.execute({ sql, args: safeParams });
    return;
  }
  db.run(sql, safeParams);
  saveDb();
}

export default null;