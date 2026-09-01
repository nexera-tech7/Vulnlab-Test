const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "vulnlab.db");

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      role TEXT DEFAULT 'user',
      bio TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user INTEGER,
      to_user INTEGER,
      subject TEXT,
      body TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const userCount = db.exec("SELECT COUNT(*) as c FROM users");
  if (userCount[0].values[0][0] === 0) {
    db.run("INSERT INTO users (username, password, email, role, bio) VALUES ('admin', 'admin123', 'admin@vulnlab.io', 'admin', 'System administrator')");
    db.run("INSERT INTO users (username, password, email, role, bio) VALUES ('alice', 'password1', 'alice@example.com', 'user', 'Security researcher')");
    db.run("INSERT INTO users (username, password, email, role, bio) VALUES ('bob', 'letmein', 'bob@example.com', 'user', 'Full-stack developer')");
    db.run("INSERT INTO users (username, password, email, role, bio) VALUES ('charlie', 'qwerty', 'charlie@example.com', 'editor', 'Content writer')");

    db.run("INSERT INTO posts (user_id, title, content, is_public) VALUES (1, 'Welcome to VulnLab', 'This is a deliberately vulnerable application for learning.', 1)");
    db.run("INSERT INTO posts (user_id, title, content, is_public) VALUES (2, 'My Research Notes', 'Found a critical SQLi in the login endpoint...', 0)");
    db.run("INSERT INTO posts (user_id, title, content, is_public) VALUES (3, 'Hello World', 'Just getting started with web security!', 1)");
    db.run("INSERT INTO posts (user_id, title, content, is_public) VALUES (1, 'Internal: Server Credentials', 'DB_PASSWORD=SuperSecret123, API_KEY=sk-abc123xyz', 0)");

    db.run("INSERT INTO messages (from_user, to_user, subject, body) VALUES (1, 2, 'Welcome', 'Welcome to the platform, Alice!')");
    db.run("INSERT INTO messages (from_user, to_user, subject, body) VALUES (2, 3, 'Collaboration', 'Hey Bob, want to work on a project?')");
    db.run("INSERT INTO messages (from_user, to_user, subject, body) VALUES (1, 3, 'Credentials', 'Here are the staging server creds: admin/St4g1ng!')");

    save();
  }

  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, save };
