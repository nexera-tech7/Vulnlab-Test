const router = require("express").Router();
const { getDb } = require("../db");
const crypto = require("crypto");

router.get("/", (req, res) => {
  res.redirect("/");
});

// ── SQL Injection Lab ──
router.get("/sqli", (req, res) => {
  res.render("labs/sqli", { results: null, error: null, query: "", sqlQuery: "" });
});

router.post("/sqli", async (req, res) => {
  const { search, mode } = req.body;
  const db = await getDb();

  if (mode === "fixed") {
    const stmt = db.prepare("SELECT id, username, email, role FROM users WHERE username LIKE ?");
    const rows = [];
    stmt.bind([`%${search}%`]);
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return res.render("labs/sqli", {
      results: rows,
      error: null,
      query: search,
      sqlQuery: `SELECT id, username, email, role FROM users WHERE username LIKE '%[parameterized]%'`,
    });
  }

  // VULNERABLE: string interpolation
  const sql = `SELECT id, username, email, role, password FROM users WHERE username LIKE '%${search}%'`;
  try {
    const result = db.exec(sql);
    const rows = [];
    if (result.length > 0) {
      result[0].values.forEach((vals) => {
        const row = {};
        result[0].columns.forEach((c, i) => (row[c] = vals[i]));
        rows.push(row);
      });
    }
    res.render("labs/sqli", { results: rows, error: null, query: search, sqlQuery: sql });
  } catch (e) {
    res.render("labs/sqli", { results: null, error: e.message, query: search, sqlQuery: sql });
  }
});

// ── XSS Lab ──
router.get("/xss", (req, res) => {
  res.render("labs/xss", { output: null, query: "" });
});

router.post("/xss", (req, res) => {
  const { comment, mode } = req.body;

  if (mode === "fixed") {
    // FIXED: output is escaped by EJS <%=  %> in the template
    return res.render("labs/xss", { output: comment, query: comment, escaped: true });
  }

  // VULNERABLE: raw output via <%- %>
  res.render("labs/xss", { output: comment, query: comment, escaped: false });
});

// reflected XSS via query param
router.get("/xss/search", (req, res) => {
  const q = req.query.q || "";
  const mode = req.query.mode || "vulnerable";
  res.render("labs/xss-reflected", { query: q, mode });
});

// ── CSRF Lab ──
router.get("/csrf", (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.render("labs/csrf", { csrfToken: req.session.csrfToken });
});

// ── IDOR Lab ──
router.get("/idor", (req, res) => {
  res.render("labs/idor");
});

// ── Path Traversal Lab ──
router.get("/path-traversal", (req, res) => {
  res.render("labs/path-traversal");
});

// ── Broken Auth Lab ──
router.get("/broken-auth", (req, res) => {
  res.render("labs/auth", { error: null, result: null });
});

// ── Security Misconfiguration Lab ──
router.get("/misconfig", (req, res) => {
  res.render("labs/misconfig");
});

module.exports = router;
