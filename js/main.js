/* ============================================================
   SmartStudent Hub — Shared behaviour (runs on every page)
   Theme toggle, responsive nav, scroll reveal, loader, ring helper
   ============================================================ */
(function () {
  "use strict";

  /* ---- 1. Theme: load saved preference, else follow system ---- */
  const THEME_KEY = "ssh-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    const btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
    }
  }
  function savedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(savedTheme());

  function moonIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }
  function sunIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  }

  /* ---- 2. Wire up controls once the DOM is ready ---- */
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(savedTheme()); // re-apply so the toggle icon renders

    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }

    /* Responsive nav */
    const burger = document.querySelector(".nav-burger");
    const links = document.querySelector(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", function () {
        const open = links.classList.toggle("open");
        burger.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", String(open));
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("open");
          burger.classList.remove("open");
        });
      });
    }

    /* Highlight the current page in the nav */
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      if (a.getAttribute("href") === here) a.classList.add("active");
    });

    /* Scroll reveal */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }

    /* Hide loader after paint */
    const loader = document.querySelector(".page-loader");
    if (loader) {
      window.addEventListener("load", function () {
        setTimeout(function () { loader.classList.add("hide"); }, 350);
      });
    }
  });

  /* ---- 3. Focus-ring helper (shared signature component) ----
     Usage in HTML:
       <div class="focus-ring" data-pct="72" data-label="Study"></div>
     Then call SSH.renderRings() (auto-runs on load).                     */
  function renderRing(el) {
    const size = parseInt(getComputedStyle(el).getPropertyValue("--size")) || 120;
    const stroke = Math.max(8, Math.round(size * 0.09));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, parseFloat(el.dataset.pct) || 0));
    const label = el.dataset.label || "";
    el.innerHTML =
      '<svg viewBox="0 0 ' + size + ' ' + size + '">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="var(--primary)"/><stop offset="100%" stop-color="var(--secondary)"/>' +
      '</linearGradient></defs>' +
      '<circle class="track" cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
      '<circle class="fill"  cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" stroke-width="' + stroke +
      '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '"/></svg>' +
      '<div class="ring-label"><b>' + Math.round(pct) + '%</b>' + (label ? '<small>' + label + '</small>' : '') + '</div>';
    // animate on next frame
    const fill = el.querySelector(".fill");
    requestAnimationFrame(function () {
      fill.style.strokeDashoffset = String(c - (pct / 100) * c);
    });
  }
  function renderRings(scope) {
    (scope || document).querySelectorAll(".focus-ring").forEach(renderRing);
  }
  document.addEventListener("DOMContentLoaded", function () { renderRings(); });

  /* ---- 4. Shared identity + usage streak (used across pages) ---- */
  function lsGet(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  const isoOf = d => d.toISOString().slice(0, 10);
  const todayISO = () => isoOf(new Date());
  function offsetISO(n) { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d); }

  function getName() { const u = getUser(); return u ? u.name : lsGet("ssh-name", ""); }
  function setName(n) { lsSet("ssh-name", String(n || "").trim()); return getName(); }

  /* account/session (client-side demo auth — no backend, per the brief) */
  function getUser() {
    const email = lsGet("ssh-session", null);
    if (!email) return null;
    const accs = lsGet("ssh-accounts", {});
    return accs[email] || null;
  }
  function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function logout() { try { localStorage.removeItem("ssh-session"); } catch (e) {} location.href = "index.html"; }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // Inject a sign-in / user chip into the nav (full-nav pages only)
  function renderAuthNav() {
    const actions = document.querySelector(".nav-actions");
    if (!actions || !document.querySelector(".nav-links")) return;
    const old = actions.querySelector(".auth-ctl"); if (old) old.remove();
    const wrap = document.createElement("div");
    wrap.className = "auth-ctl";
    const user = getUser();
    if (user) {
      wrap.innerHTML = '<span class="auth-hi">Hi, ' + esc(firstName(user.name)) + '</span>' +
        '<button class="auth-btn" id="logoutBtn">Log out</button>';
    } else {
      wrap.innerHTML = '<a class="auth-btn" href="login.html">Sign in</a>';
    }
    actions.insertBefore(wrap, actions.firstChild);
    const lo = wrap.querySelector("#logoutBtn");
    if (lo) lo.addEventListener("click", logout);
  }
  document.addEventListener("DOMContentLoaded", renderAuthNav);

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Working late";
  }

  // Update the streak once per calendar day (runs on any page).
  function updateStreak() {
    const s = lsGet("ssh-streak", { last: null, count: 0 });
    const today = todayISO();
    if (s.last === today) return s;                 // already counted today
    s.count = (s.last === offsetISO(-1)) ? s.count + 1 : 1; // consecutive day, else reset
    s.last = today;
    lsSet("ssh-streak", s);
    return s;
  }
  function getStreak() { return lsGet("ssh-streak", { last: null, count: 0 }); }

  document.addEventListener("DOMContentLoaded", updateStreak);

  /* Expose a tiny API for page scripts */
  window.SSH = {
    renderRing: renderRing, renderRings: renderRings,
    getName: getName, setName: setName,
    greeting: greeting, getStreak: getStreak, updateStreak: updateStreak,
    getUser: getUser, firstName: firstName, logout: logout
  };
})();
