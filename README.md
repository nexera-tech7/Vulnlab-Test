# VulnLab

A deliberately vulnerable web application built for security education and portfolio demonstration. Explore real-world vulnerabilities, understand how they work, and learn the fixes.

## Features

- **7 OWASP Vulnerability Labs** — each with a vulnerable and fixed implementation
- **Side-by-side code comparison** — see the vulnerable code next to the fix
- **Interactive exploitation** — test payloads in vulnerable mode, verify they're blocked in fixed mode
- **Sample payloads included** — one-click copy for common attack vectors

## Vulnerability Labs

| Lab | OWASP Category | Severity |
|-----|---------------|----------|
| SQL Injection | A03:2021 – Injection | Critical |
| Cross-Site Scripting (XSS) | A03:2021 – Injection | Critical |
| Broken Authentication | A07:2021 – Identification Failures | Critical |
| Cross-Site Request Forgery | A01:2021 – Broken Access Control | High |
| Insecure Direct Object Reference | A01:2021 – Broken Access Control | High |
| Path Traversal | A01:2021 – Broken Access Control | High |
| Security Misconfiguration | A05:2021 – Security Misconfiguration | Medium |

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** sql.js (SQLite in pure JS)
- **Templating:** EJS
- **Auth:** express-session
- **Frontend:** Vanilla CSS, Lucide SVG icons, IBM Plex Sans + JetBrains Mono

## Getting Started

npm install
node server.js

Open http://localhost:3000. Default credentials: admin / admin123

## Disclaimer

This application is intentionally vulnerable. It is designed for authorized security testing and education only. Do not deploy to production or expose to the public internet.