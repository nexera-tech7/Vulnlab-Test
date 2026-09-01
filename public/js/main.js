function copyPayload(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "Copied!";
    btn.style.color = "var(--green)";
    btn.style.borderColor = "var(--green)";
    setTimeout(() => {
      btn.textContent = original;
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 1500);
  });
}

function setMode(mode) {
  document.querySelectorAll(".mode-toggle button").forEach((b) => {
    b.classList.remove("active", "fixed");
  });
  const btn = document.querySelector(`.mode-toggle button[data-mode="${mode}"]`);
  if (btn) {
    btn.classList.add("active");
    if (mode === "fixed") btn.classList.add("fixed");
  }
  const modeInput = document.getElementById("mode-input");
  if (modeInput) modeInput.value = mode;

  document.querySelectorAll("[data-show-mode]").forEach((el) => {
    el.style.display = el.dataset.showMode === mode ? "" : "none";
  });
}

async function fetchApi(url, outputId) {
  const output = document.getElementById(outputId);
  output.textContent = "Loading...";
  try {
    const res = await fetch(url);
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    output.textContent = "Error: " + e.message;
  }
}

async function submitCsrf(mode) {
  const email = document.getElementById("csrf-email").value;
  const bio = document.getElementById("csrf-bio").value;
  const csrfToken = document.getElementById("csrf-token")?.value || "";
  const output = document.getElementById("csrf-output");

  const body = { email, bio, mode };
  if (mode === "fixed") body.csrf_token = csrfToken;

  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    output.textContent = "Error: " + e.message;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const initial = document.getElementById("mode-input")?.value || "vulnerable";
  setMode(initial);
});
