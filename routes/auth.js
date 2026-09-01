const router = require("express").Router();
const { getDb, save } = require("../db");
const crypto = require("crypto");

// ── VULNERABLE: Broken Authentication ──
// No rate limiting, plaintext passwords, predictable session, no account lockout

router.get("/login", (req, res) => {
  res.render("labs/auth", { error: null, result: null });
});

router.post("/login", async (req, res) => {
  const { username, password, mode } = req.body;
  const db = await getDb();

  if (mode === "fixed") {
    // FIXED: parameterized query (also prevents SQLi on login)
    const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");
    stmt.bind([username, password]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      req.session.user = { id: row.id, username: row.username, role: row.role };
      req.session.cookie.httpOnly = true;
      stmt.free();
      return res.redirect("/");
    }
    stmt.free();
    // FIXED: generic error message
    return res.render("labs/auth", { error: "Invalid credentials", result: null });
  }

  // VULNERABLE: string concatenation → SQL injection on login
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  try {
    const rows = db.exec(sql);
    if (rows.length > 0 && rows[0].values.length > 0) {
      const cols = rows[0].columns;
      const vals = rows[0].values[0];
      const user = {};
      cols.forEach((c, i) => (user[c] = vals[i]));
      // VULNERABLE: stores password in session, no httpOnly
      req.session.user = { id: user.id, username: user.username, role: user.role, password: user.password };
      return res.redirect("/");
    }
    // VULNERABLE: reveals whether the username exists
    const checkUser = db.exec(`SELECT id FROM users WHERE username = '${username}'`);
    const error = checkUser.length > 0 ? "Wrong password for this account" : "No account with that username";
    return res.render("labs/auth", { error, result: null });
  } catch (e) {
    // VULNERABLE: leaks SQL error details
    return res.render("labs/auth", { error: e.message, result: null });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
