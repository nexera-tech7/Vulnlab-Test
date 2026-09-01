const router = require("express").Router();
const { getDb, save } = require("../db");
const path = require("path");
const fs = require("fs");

// ── VULNERABLE: IDOR – any user can read any message by ID ──
router.get("/messages/:id", async (req, res) => {
  const db = await getDb();
  const mode = req.query.mode || "vulnerable";
  const msgId = req.params.id;

  if (mode === "fixed") {
    if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
    const stmt = db.prepare("SELECT * FROM messages WHERE id = ? AND (to_user = ? OR from_user = ?)");
    stmt.bind([parseInt(msgId), req.session.user.id, req.session.user.id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return res.json(row);
    }
    stmt.free();
    return res.status(403).json({ error: "Access denied" });
  }

  // VULNERABLE: no auth check, no ownership check
  const rows = db.exec(`SELECT * FROM messages WHERE id = ${msgId}`);
  if (rows.length > 0) {
    const cols = rows[0].columns;
    const vals = rows[0].values[0];
    const msg = {};
    cols.forEach((c, i) => (msg[c] = vals[i]));
    return res.json(msg);
  }
  res.status(404).json({ error: "Not found" });
});

// ── VULNERABLE: Path Traversal ──
router.get("/files", async (req, res) => {
  const mode = req.query.mode || "vulnerable";
  const filename = req.query.file;

  if (!filename) return res.status(400).json({ error: "file parameter required" });

  if (mode === "fixed") {
    // FIXED: sanitize - strip path components, only allow from uploads/
    const safeName = path.basename(filename);
    const safePath = path.join(__dirname, "..", "uploads", safeName);
    const uploadsDir = path.resolve(path.join(__dirname, "..", "uploads"));
    const resolvedPath = path.resolve(safePath);

    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: "Access denied: path traversal blocked" });
    }
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    return res.sendFile(resolvedPath);
  }

  // VULNERABLE: directly uses user input in file path
  const filePath = path.join(__dirname, "..", "uploads", filename);
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(path.resolve(filePath));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── VULNERABLE: Security Misconfiguration ──
router.get("/debug", async (req, res) => {
  const mode = req.query.mode || "vulnerable";

  if (mode === "fixed") {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    return res.json({ status: "ok", uptime: process.uptime() });
  }

  // VULNERABLE: debug endpoint exposes everything, no auth check
  const db = await getDb();
  const users = db.exec("SELECT * FROM users");
  res.json({
    node_version: process.version,
    env: process.env,
    cwd: process.cwd(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    users: users.length > 0 ? users[0] : [],
    db_path: path.join(__dirname, "..", "vulnlab.db"),
    session_secret: "hardcoded-secret-key-123",
    stack_trace: new Error("debug").stack,
  });
});

// ── Profile update (CSRF target) ──
router.post("/profile", async (req, res) => {
  const mode = req.body.mode || "vulnerable";
  const db = await getDb();

  if (mode === "fixed") {
    // FIXED: check CSRF token
    if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
    if (!req.body.csrf_token || req.body.csrf_token !== req.session.csrfToken) {
      return res.status(403).json({ error: "CSRF token invalid" });
    }
    const stmt = db.prepare("UPDATE users SET email = ?, bio = ? WHERE id = ?");
    stmt.run([req.body.email, req.body.bio, req.session.user.id]);
    stmt.free();
    save();
    return res.json({ success: true, message: "Profile updated (CSRF-protected)" });
  }

  // VULNERABLE: no CSRF check, trusts session cookie alone
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  const stmt = db.prepare("UPDATE users SET email = ?, bio = ? WHERE id = ?");
  stmt.run([req.body.email, req.body.bio, req.session.user.id]);
  stmt.free();
  save();
  res.json({ success: true, message: "Profile updated (no CSRF protection)" });
});

module.exports = router;
