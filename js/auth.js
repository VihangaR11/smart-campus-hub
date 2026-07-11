/* ============================================================
   SmartStudent Hub — Auth (client-side demo, no backend)
   Sign up / sign in with validation. Accounts live in
   localStorage; passwords are hashed with the Web Crypto API
   (SHA-256) rather than stored in plain text.
   Per the brief: no backend / database / external auth API.
   ============================================================ */
(function () {
  "use strict";

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const accounts = () => store.get("ssh-accounts", {});
  const saveAccounts = a => store.set("ssh-accounts", a);
  const startSession = email => store.set("ssh-session", email);

  // SHA-256 via Web Crypto (secure contexts: https / localhost); safe fallback otherwise.
  async function hash(str) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381; for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); h |= 0; }
    return "x" + (h >>> 0).toString(16);
  }

  // Per-account random salt, so identical passwords never share a hash.
  function randSalt() {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      return [...a].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".auth-tab");
    const panes = { signin: document.getElementById("pane-signin"), signup: document.getElementById("pane-signup") };
    tabs.forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
    function switchTab(name) {
      tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
      panes.signin.classList.toggle("hidden", name !== "signin");
      panes.signup.classList.toggle("hidden", name !== "signup");
      clearErrors();
    }

    /* ---- Sign up ---- */
    document.getElementById("signupForm").addEventListener("submit", async e => {
      e.preventDefault();
      const name = get("suName"), email = get("suEmail"), pass = get("suPass"), conf = get("suConfirm");
      let ok = true;
      ok = field("suName", name.trim().length >= 2, "Enter your full name.") && ok;
      ok = field("suEmail", EMAIL.test(email.trim()), "Enter a valid email address.") && ok;
      ok = field("suPass", pass.length >= 6, "Password must be at least 6 characters.") && ok;
      ok = field("suConfirm", conf === pass && conf.length > 0, "Passwords don't match.") && ok;
      if (!ok) return;

      const em = email.trim().toLowerCase();
      const accs = accounts();
      if (accs[em]) { formMsg("signup", "An account with this email already exists — try signing in.", true); return; }

      const salt = randSalt();
      accs[em] = { name: name.trim(), email: em, salt: salt, passHash: await hash(salt + pass) };
      saveAccounts(accs);
      startSession(em);
      go();
    });

    /* ---- Sign in ---- */
    document.getElementById("signinForm").addEventListener("submit", async e => {
      e.preventDefault();
      const email = get("siEmail"), pass = get("siPass");
      let ok = true;
      ok = field("siEmail", EMAIL.test(email.trim()), "Enter a valid email address.") && ok;
      ok = field("siPass", pass.length > 0, "Enter your password.") && ok;
      if (!ok) return;

      const acc = accounts()[email.trim().toLowerCase()];
      const salted = acc && await hash((acc.salt || "") + pass);
      const legacy = acc && await hash(pass); // backward-compat for any pre-salt account
      if (!acc || (acc.passHash !== salted && acc.passHash !== legacy)) {
        formMsg("signin", "Invalid email or password.", true); return;
      }
      startSession(acc.email);
      go();
    });

    // live-clear a field's error as the user fixes it
    document.querySelectorAll("#login-card input").forEach(inp =>
      inp.addEventListener("input", () => {
        const f = inp.closest(".field"); if (f) f.classList.remove("invalid");
      }));

    function go() { window.location.href = "index.html"; }
  });

  /* helpers */
  function get(id) { return document.getElementById(id).value; }
  function field(id, cond, msg) {
    const el = document.getElementById(id), f = el.closest(".field");
    f.classList.toggle("invalid", !cond);
    const err = f.querySelector(".err"); if (err) err.textContent = msg;
    return cond;
  }
  function formMsg(which, text, isErr) {
    const box = document.getElementById(which + "Msg");
    if (!box) return;
    box.textContent = text;
    box.className = "auth-msg " + (isErr ? "err-msg" : "ok-msg");
    box.style.display = "block";
  }
  function clearErrors() {
    document.querySelectorAll("#login-card .field.invalid").forEach(f => f.classList.remove("invalid"));
    document.querySelectorAll(".auth-msg").forEach(m => m.style.display = "none");
  }
})();
