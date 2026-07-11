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
      '<stop offset="0%" stop-color="var(--primary)"/><stop offset="100%" stop-color="var(--accent)"/>' +
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

  /* Expose a tiny API for page scripts */
  window.SSH = { renderRing: renderRing, renderRings: renderRings };
})();
