/* ============================================================
   SmartStudent Hub — Wellness
   Tools (vanilla JS + localStorage):
     1) Mood check-in + 7-day history
     2) Hydration tracker (focus-ring)
     3) Box-breathing exercise (animated)
     4) Break reminder + wellness tips
   ============================================================ */
(function () {
  "use strict";

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  document.addEventListener("DOMContentLoaded", function () {
    initMood();
    initWater();
    initBreathing();
    initBreak();
    initTips();
  });

  /* ---------- Toast helper (used by break reminder) ---------- */
  function toast(msg) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 400); }, 5000);
  }

  /* ==========================================================
     1) MOOD CHECK-IN
     ========================================================== */
  const MOODS = [
    { emoji: "😞", label: "Rough", score: 1 },
    { emoji: "😕", label: "Low", score: 2 },
    { emoji: "😐", label: "Okay", score: 3 },
    { emoji: "🙂", label: "Good", score: 4 },
    { emoji: "😄", label: "Great", score: 5 }
  ];
  let moodLog = store.get("ssh-mood", []); // [{date, score, note}]

  function todayMood() { return moodLog.find(e => e.date === todayISO()); }

  function initMood() {
    const btns = document.getElementById("moodBtns");
    if (!btns) return;

    btns.innerHTML = MOODS.map(m =>
      `<button class="mood-btn" data-score="${m.score}" title="${m.label}">
         <span class="mood-emoji">${m.emoji}</span><span class="mood-lbl">${m.label}</span></button>`).join("");

    btns.addEventListener("click", e => {
      const b = e.target.closest(".mood-btn"); if (!b) return;
      const score = +b.dataset.score;
      let entry = todayMood();
      if (entry) entry.score = score;
      else { entry = { date: todayISO(), score, note: "" }; moodLog.push(entry); }
      store.set("ssh-mood", moodLog);
      renderMood();
    });

    const note = document.getElementById("moodNote");
    note.addEventListener("input", () => {
      let entry = todayMood();
      if (!entry) { entry = { date: todayISO(), score: 3, note: "" }; moodLog.push(entry); }
      entry.note = note.value;
      store.set("ssh-mood", moodLog);
    });

    renderMood();
  }

  function renderMood() {
    const entry = todayMood();
    // highlight selected
    document.querySelectorAll(".mood-btn").forEach(b =>
      b.classList.toggle("active", entry && +b.dataset.score === entry.score));
    // note
    const note = document.getElementById("moodNote");
    if (entry && document.activeElement !== note) note.value = entry.note || "";
    // status + supportive line
    const status = document.getElementById("moodStatus");
    const care = document.getElementById("moodCare");
    if (entry) {
      const m = MOODS.find(x => x.score === entry.score);
      status.textContent = `Checked in today: ${m.emoji} ${m.label}`;
      care.style.display = entry.score <= 2 ? "block" : "none";
    } else {
      status.textContent = "How are you feeling today?";
      care.style.display = "none";
    }
    renderMoodHistory();
  }

  function renderMoodHistory() {
    const chart = document.getElementById("moodChart");
    if (!chart) return;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const entry = moodLog.find(e => e.date === iso);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" })[0], score: entry ? entry.score : 0 });
    }
    chart.innerHTML = days.map(d => {
      const h = d.score ? d.score / 5 * 100 : 4;
      const cls = d.score === 0 ? "empty" : d.score <= 2 ? "low" : d.score === 3 ? "mid" : "high";
      return `<div class="mc-col"><div class="mc-bar ${cls}" style="height:${h}%"></div><span>${d.label}</span></div>`;
    }).join("");

    const logged = moodLog.filter(e => days.length && new Date(e.date) >= new Date(days[0] ? Date.now() - 6 * 864e5 : 0));
    const scored = moodLog.filter(e => e.score);
    const avg = scored.length ? (scored.reduce((s, e) => s + e.score, 0) / scored.length) : 0;
    const avgEl = document.getElementById("moodAvg");
    if (avgEl) avgEl.textContent = avg ? avg.toFixed(1) + " / 5 avg" : "No check-ins yet";
  }

  /* ==========================================================
     2) HYDRATION TRACKER
     ========================================================== */
  const WATER_GOAL = 8;
  let water = loadWater();
  function loadWater() {
    const w = store.get("ssh-water", { date: todayISO(), count: 0 });
    return w.date === todayISO() ? w : { date: todayISO(), count: 0 };
  }
  function initWater() {
    const ring = document.getElementById("ringWater");
    if (!ring) return;
    document.getElementById("waterAdd").addEventListener("click", () => bump(1));
    document.getElementById("waterSub").addEventListener("click", () => bump(-1));
    renderWater();
  }
  function bump(n) {
    water.count = Math.max(0, Math.min(16, water.count + n));
    store.set("ssh-water", water);
    if (water.count === WATER_GOAL && n > 0) toast("Nice — you hit your water goal for today! 💧");
    renderWater();
  }
  function renderWater() {
    const ring = document.getElementById("ringWater");
    const pct = Math.min(100, Math.round(water.count / WATER_GOAL * 100));
    ring.dataset.pct = pct;
    if (window.SSH) window.SSH.renderRing(ring);
    document.getElementById("waterCount").textContent = water.count;
    document.getElementById("waterGoal").textContent = "of " + WATER_GOAL + " glasses";
  }

  /* ==========================================================
     3) BOX-BREATHING EXERCISE
     ========================================================== */
  const PHASES = [
    { label: "Breathe in", dur: 4, scale: 1.35 },
    { label: "Hold", dur: 4, scale: 1.35 },
    { label: "Breathe out", dur: 4, scale: 0.72 },
    { label: "Hold", dur: 4, scale: 0.72 }
  ];
  let bRun = false, bIdx = 0, bPhaseTimer = null, bSecTimer = null;

  function initBreathing() {
    const btn = document.getElementById("breathBtn");
    if (!btn) return;
    btn.addEventListener("click", () => bRun ? stopBreath() : startBreath());
  }
  function startBreath() {
    bRun = true; bIdx = 0;
    document.getElementById("breathBtn").textContent = "Stop";
    document.querySelector(".breath-circle").classList.add("active");
    runPhase();
  }
  function runPhase() {
    if (!bRun) return;
    const p = PHASES[bIdx];
    const circle = document.querySelector(".breath-circle");
    circle.style.transitionDuration = p.dur + "s";
    circle.style.transform = "scale(" + p.scale + ")";
    document.getElementById("breathLabel").textContent = p.label;
    let c = p.dur;
    document.getElementById("breathCount").textContent = c;
    clearInterval(bSecTimer);
    bSecTimer = setInterval(() => { c--; document.getElementById("breathCount").textContent = Math.max(0, c); if (c <= 0) clearInterval(bSecTimer); }, 1000);
    bPhaseTimer = setTimeout(() => { bIdx = (bIdx + 1) % PHASES.length; runPhase(); }, p.dur * 1000);
  }
  function stopBreath() {
    bRun = false;
    clearTimeout(bPhaseTimer); clearInterval(bSecTimer);
    const circle = document.querySelector(".breath-circle");
    circle.style.transitionDuration = ".6s";
    circle.style.transform = "scale(1)";
    circle.classList.remove("active");
    document.getElementById("breathLabel").textContent = "Ready?";
    document.getElementById("breathCount").textContent = "";
    document.getElementById("breathBtn").textContent = "Start";
  }

  /* ==========================================================
     4) BREAK REMINDER + TIPS
     ========================================================== */
  let breakTimer = null;
  function initBreak() {
    const toggle = document.getElementById("breakToggle");
    const sel = document.getElementById("breakInterval");
    if (!toggle) return;

    const saved = store.get("ssh-break", { on: false, mins: 45 });
    toggle.checked = saved.on; sel.value = String(saved.mins);
    if (saved.on) arm(saved.mins);

    toggle.addEventListener("change", () => {
      const mins = +sel.value;
      store.set("ssh-break", { on: toggle.checked, mins });
      if (toggle.checked) { arm(mins); toast(`Break reminders on — every ${mins} min.`); }
      else { clearInterval(breakTimer); }
    });
    sel.addEventListener("change", () => {
      const mins = +sel.value;
      store.set("ssh-break", { on: toggle.checked, mins });
      if (toggle.checked) arm(mins);
    });
    document.getElementById("breakPreview").addEventListener("click", () =>
      toast("Time for a quick break — stand up, look away from the screen, and hydrate. 🌿"));
  }
  function arm(mins) {
    clearInterval(breakTimer);
    breakTimer = setInterval(() =>
      toast("Time for a quick break — stand up, look away from the screen, and hydrate. 🌿"), mins * 60000);
  }

  const TIPS = [
    { t: "Study in 25-minute focus blocks with short breaks — your brain retains more than in long marathons.", tag: "Focus" },
    { t: "Aim for 7–9 hours of sleep before an exam. Sleep consolidates what you studied better than an all-nighter.", tag: "Sleep" },
    { t: "Drink a glass of water when you sit down to study. Mild dehydration quietly drains concentration.", tag: "Body" },
    { t: "Write tomorrow's top 3 tasks before bed. It clears your head and makes mornings calmer.", tag: "Mind" },
    { t: "Step outside for 10 minutes between study sessions. Daylight resets focus and mood.", tag: "Reset" },
    { t: "Feeling stuck? Explain the problem out loud as if teaching it. Gaps become obvious fast.", tag: "Study" },
    { t: "Silence non-essential notifications while you work. Each interruption costs minutes to recover from.", tag: "Focus" },
    { t: "Talk to someone if stress is piling up — a friend, family, or your campus counselling service. Reaching out is strength.", tag: "Support" }
  ];
  let lastTip = -1;
  function initTips() {
    const btn = document.getElementById("tipNext");
    if (!btn) return;
    btn.addEventListener("click", showTip);
    showTip();
  }
  function showTip() {
    let i; do { i = Math.floor(Math.random() * TIPS.length); } while (i === lastTip && TIPS.length > 1);
    lastTip = i;
    document.getElementById("tipText").textContent = TIPS[i].t;
    document.getElementById("tipTag").textContent = TIPS[i].tag;
  }
})();
