/* ============================================================
   SmartStudent Hub — Support
   Feedback/contact form with full JavaScript validation:
   per-field, real-time, on submit. Plus a star rating widget.
   No backend — a successful submit shows a confirmation.
   ============================================================ */
(function () {
  "use strict";

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let rating = 0;

  const FIELDS = [
    { id: "sName", test: v => v.trim().length >= 2, msg: "Please enter your name (at least 2 characters)." },
    { id: "sEmail", test: v => EMAIL.test(v.trim()), msg: "Please enter a valid email address." },
    { id: "sCategory", test: v => !!v, msg: "Please choose what this is about." },
    { id: "sMessage", test: v => v.trim().length >= 10, msg: "Your message needs at least 10 characters." }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("supportForm");
    if (!form) return;

    // pre-fill name if the student set one on the Home page
    const savedName = window.SSH && SSH.getName();
    if (savedName) document.getElementById("sName").value = savedName;

    // real-time validation
    FIELDS.forEach(f => {
      const el = document.getElementById(f.id);
      el.addEventListener("blur", () => validateField(f, el));
      el.addEventListener("input", () => {
        if (el.closest(".field").classList.contains("invalid")) validateField(f, el);
      });
    });

    // message char counter
    const msg = document.getElementById("sMessage");
    const counter = document.getElementById("msgCount");
    const updateCount = () => {
      const n = msg.value.trim().length;
      counter.textContent = n + " / 10 min";
      counter.classList.toggle("ok", n >= 10);
    };
    msg.addEventListener("input", updateCount);
    updateCount();

    initStars();

    // submit
    form.addEventListener("submit", e => {
      e.preventDefault();
      let allOk = true;
      FIELDS.forEach(f => { if (!validateField(f, document.getElementById(f.id))) allOk = false; });
      if (!allOk) {
        const firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      // success (no backend — we just confirm + count locally)
      showSuccess(document.getElementById("sName").value.trim());
      store.set("ssh-support-count", (store.get("ssh-support-count", 0) || 0) + 1);
      form.reset();
      rating = 0; paintStars(); updateCount();
      FIELDS.forEach(f => document.getElementById(f.id).closest(".field").classList.remove("invalid"));
    });
  });

  function validateField(f, el) {
    const ok = f.test(el.value);
    const field = el.closest(".field");
    field.classList.toggle("invalid", !ok);
    const err = field.querySelector(".err");
    if (err) err.textContent = f.msg;
    return ok;
  }

  /* star rating */
  function initStars() {
    const wrap = document.getElementById("stars");
    if (!wrap) return;
    wrap.innerHTML = [1, 2, 3, 4, 5].map(n =>
      `<button type="button" class="star" data-n="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("");
    wrap.addEventListener("click", e => { const b = e.target.closest(".star"); if (b) { rating = +b.dataset.n; paintStars(); } });
    wrap.addEventListener("mouseover", e => { const b = e.target.closest(".star"); if (b) paintStars(+b.dataset.n); });
    wrap.addEventListener("mouseleave", () => paintStars());
    paintStars();
  }
  function paintStars(preview) {
    const n = preview || rating;
    document.querySelectorAll("#stars .star").forEach(s => s.classList.toggle("on", +s.dataset.n <= n));
    const lbl = document.getElementById("ratingLabel");
    if (lbl) lbl.textContent = rating ? rating + "/5" : "optional";
  }

  function showSuccess(name) {
    const box = document.getElementById("formSuccess");
    box.querySelector(".fs-text").textContent =
      `Thanks${name ? ", " + name : ""}! Your message has been recorded. We'll get back to you within 2 working days.`;
    box.style.display = "flex";
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    clearTimeout(showSuccess._t);
    showSuccess._t = setTimeout(() => { box.style.display = "none"; }, 7000);
  }
})();
