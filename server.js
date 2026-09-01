const express = require("express");
const session = require("express-session");
const path = require("path");
const { getDb } = require("./db");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "hardcoded-secret-key-123",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: false, secure: false },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.mode = req.query.mode || "vulnerable";
  next();
});

app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/labs", require("./routes/labs"));
app.use("/api", require("./routes/api"));

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`\n  VulnLab running at http://localhost:${PORT}\n`);
    console.log("  Default accounts:");
    console.log("    admin / admin123");
    console.log("    alice / password1");
    console.log("    bob   / letmein\n");
  });
}

start();
