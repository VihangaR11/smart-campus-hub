/* ============================================================
   SmartStudent Hub — Study Planner
   Four smart tools (all vanilla JS + localStorage):
     1) Assignment tracker   2) Pomodoro focus timer
     3) Study-progress rings 4) GPA calculator
   Vue is intentionally NOT used here — it is reserved for the
   Community forum, so the two marking areas stay distinct.
   ============================================================ */
(function () {
  "use strict";

  /* ---- tiny localStorage helper (safe) ---- */
  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  document.addEventListener("DOMContentLoaded", function () {
    initAssignments();
    initPomodoro();
    initGPA();
    updateRings();
  });

  /* ==========================================================
     1) ASSIGNMENT TRACKER
     ========================================================== */
  let assignments = store.get("ssh-assignments", []);

  function initAssignments() {
    const form = document.getElementById("assignForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("aTitle");
      const module = document.getElementById("aModule");
      const due = document.getElementById("aDue");
      const prio = document.getElementById("aPrio");

      // simple JS validation
      let ok = true;
      ok = validate(title, title.value.trim().length > 0) && ok;
      ok = validate(due, !!due.value) && ok;
      if (!ok) return;

      assignments.push({
        id: uid(),
        title: title.value.trim(),
        module: module.value.trim() || "General",
        due: due.value,
        prio: prio.value,
        done: false
      });
      store.set("ssh-assignments", assignments);
      form.reset();
      renderAssignments();
      updateRings();
    });

    document.getElementById("assignList").addEventListener("click", function (e) {
      const li = e.target.closest("[data-id]");
      if (!li) return;
      const id = li.dataset.id;
      if (e.target.closest(".a-check")) {
        const a = assignments.find(x => x.id === id); if (a) a.done = !a.done;
      } else if (e.target.closest(".a-del")) {
        assignments = assignments.filter(x => x.id !== id);
      } else return;
      store.set("ssh-assignments", assignments);
      renderAssignments();
      updateRings();
    });

    renderAssignments();
  }

  function daysLeft(due) {
    const d = Math.ceil((new Date(due) - new Date(todayISO())) / 86400000);
    return d;
  }

  function renderAssignments() {
    const list = document.getElementById("assignList");
    const bar = document.getElementById("assignBar");
    const meta = document.getElementById("assignMeta");
    if (!list) return;

    if (!assignments.length) {
      list.innerHTML = '<li class="empty-state"><span class="es-ic">📋</span><b>No assignments yet</b><span>Add your first deadline above and it\'ll appear here, sorted by due date.</span></li>';
    } else {
      const sorted = assignments.slice().sort((a, b) =>
        (a.done - b.done) || (new Date(a.due) - new Date(b.due)));
      list.innerHTML = sorted.map(a => {
        const d = daysLeft(a.due);
        const state = a.done ? "done" : d < 0 ? "overdue" : d <= 2 ? "soon" : "ok";
        const when = a.done ? "Completed"
          : d < 0 ? `${Math.abs(d)}d overdue`
          : d === 0 ? "Due today" : d === 1 ? "Due tomorrow" : `Due in ${d}d`;
        return `<li class="a-item ${state}" data-id="${a.id}">
            <button class="a-check" aria-label="Toggle complete">${a.done ? "✓" : ""}</button>
            <div class="a-body">
              <span class="a-title">${esc(a.title)}</span>
              <span class="a-sub"><span class="chip">${esc(a.module)}</span>
                <span class="a-when">${when}</span>
                <span class="a-prio p-${a.prio}">${a.prio}</span></span>
            </div>
            <button class="a-del" aria-label="Delete">✕</button>
          </li>`;
      }).join("");
    }

    const total = assignments.length;
    const done = assignments.filter(a => a.done).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    if (bar) bar.style.width = pct + "%";
    if (meta) meta.textContent = total ? `${done} of ${total} done · ${pct}%` : "Nothing tracked yet";
  }

  /* ==========================================================
     2) POMODORO FOCUS TIMER
     ========================================================== */
  const DURS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const LABELS = { focus: "Focus", short: "Short break", long: "Long break" };
  let mode = "focus", remaining = DURS.focus, running = false, ticker = null, cycle = 0;
  let today = loadToday();
  let audioCtx = null;

  function loadToday() {
    const t = store.get("ssh-pomodoro", { date: todayISO(), sessions: 0, minutes: 0 });
    if (t.date !== todayISO()) { return { date: todayISO(), sessions: 0, minutes: 0 }; }
    return t;
  }

  function initPomodoro() {
    const disp = document.getElementById("timerDisp");
    if (!disp) return;

    document.getElementById("timerStart").addEventListener("click", toggle);
    document.getElementById("timerReset").addEventListener("click", reset);
    document.getElementById("timerSkip").addEventListener("click", () => complete(true));
    document.querySelectorAll(".mode-pill").forEach(p =>
      p.addEventListener("click", () => setMode(p.dataset.mode, true)));

    paint();
  }

  function toggle() {
    running = !running;
    if (running && !audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (running) { ticker = setInterval(step, 1000); }
    else { clearInterval(ticker); }
    paint();
  }
  function step() {
    remaining--;
    if (remaining <= 0) complete(false);
    paint();
  }
  function complete(skipped) {
    clearInterval(ticker);
    if (mode === "focus" && !skipped) {
      today.sessions++; today.minutes += 25; cycle++;
      store.set("ssh-pomodoro", today);
      updateRings();
      beep();
    }
    // decide next mode
    const next = mode === "focus" ? (cycle % 4 === 0 ? "long" : "short") : "focus";
    setMode(next, false);
    // auto-flow: keep running unless the user skipped manually
    if (!skipped && running) { ticker = setInterval(step, 1000); }
    else { running = false; }
    paint();
  }
  function setMode(m, stop) {
    mode = m; remaining = DURS[m];
    if (stop) { running = false; clearInterval(ticker); }
    paint();
  }
  function reset() {
    running = false; clearInterval(ticker); remaining = DURS[mode]; paint();
  }
  function paint() {
    const disp = document.getElementById("timerDisp");
    if (!disp) return;
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    disp.textContent = mm + ":" + ss;
    document.getElementById("timerMode").textContent = LABELS[mode];
    document.getElementById("timerStart").textContent = running ? "Pause" : "Start";
    document.title = running ? `${mm}:${ss} · ${LABELS[mode]} — Planner` : "Study Planner — SmartStudent Hub";
    document.querySelectorAll(".mode-pill").forEach(p => p.classList.toggle("active", p.dataset.mode === mode));
    // session dots (out of 4 in the current long-break cycle)
    const dots = document.getElementById("timerDots");
    if (dots) dots.innerHTML = Array.from({ length: 4 }, (_, i) =>
      `<span class="${i < (cycle % 4 || (cycle && mode === 'long' ? 4 : 0)) ? 'on' : ''}"></span>`).join("");
    const sc = document.getElementById("sessionCount");
    if (sc) sc.textContent = today.sessions;
    document.querySelector(".timer-card")?.classList.toggle("is-break", mode !== "focus");
  }
  function beep() {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = "sine"; o.frequency.value = 660;
      g.gain.setValueAtTime(.001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.2, audioCtx.currentTime + .02);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .5);
      o.start(); o.stop(audioCtx.currentTime + .5);
    } catch (e) {}
  }

  /* ==========================================================
     3) SUMMARY RINGS (signature motif, computed from real data)
     ========================================================== */
  function updateRings() {
    const total = assignments.length;
    const done = assignments.filter(a => a.done).length;
    setRing("ringAssign", total ? Math.round(done / total * 100) : 0);
    setRing("ringFocus", Math.min(100, Math.round(today.sessions / 8 * 100)));  // goal: 8 sessions
    setRing("ringTime", Math.min(100, Math.round(today.minutes / 180 * 100)));  // goal: 3h
  }
  function setRing(id, pct) {
    const el = document.getElementById(id);
    if (!el || !window.SSH) return;
    el.dataset.pct = pct;
    window.SSH.renderRing(el);
  }

  /* ==========================================================
     4) GPA CALCULATOR (Sri Lankan / UGC-aligned scale)
     ========================================================== */
  const SCALE = { "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "E": 0.0 };

  function initGPA() {
    const body = document.getElementById("gpaBody");
    if (!body) return;
    let rows = store.get("ssh-gpa", [
      { name: "Web Application Development", credits: 3, grade: "A" },
      { name: "Software Architecture", credits: 4, grade: "B+" }
    ]);

    function save() { store.set("ssh-gpa", rows); }
    function gradeOptions(sel) {
      return Object.keys(SCALE).map(g => `<option ${g === sel ? "selected" : ""}>${g}</option>`).join("");
    }
    function render() {
      body.innerHTML = rows.map((r, i) => `
        <tr data-i="${i}">
          <td><input class="g-name" value="${esc(r.name)}" placeholder="Module name" /></td>
          <td><input class="g-cr" type="number" min="0" step="0.5" value="${r.credits}" /></td>
          <td><select class="g-gr">${gradeOptions(r.grade)}</select></td>
          <td><button class="g-del" aria-label="Remove row">✕</button></td>
        </tr>`).join("");
      compute();
    }
    function compute() {
      let pts = 0, cr = 0;
      rows.forEach(r => { const c = parseFloat(r.credits) || 0; pts += (SCALE[r.grade] ?? 0) * c; cr += c; });
      const gpa = cr ? pts / cr : 0;
      document.getElementById("gpaValue").textContent = gpa.toFixed(2);
      document.getElementById("gpaCredits").textContent = cr + (cr === 1 ? " credit" : " credits");
      const cls = classify(gpa, cr);
      const badge = document.getElementById("gpaClass");
      badge.textContent = cls.label; badge.className = "gpa-class " + cls.cls;
      setRing("ringGpa", Math.round(gpa / 4 * 100));
    }
    function classify(g, cr) {
      if (!cr) return { label: "Add modules to see class", cls: "" };
      if (g >= 3.70) return { label: "First Class", cls: "c-first" };
      if (g >= 3.30) return { label: "Second Class (Upper)", cls: "c-upper" };
      if (g >= 3.00) return { label: "Second Class (Lower)", cls: "c-lower" };
      if (g >= 2.00) return { label: "Pass", cls: "c-pass" };
      return { label: "Below pass", cls: "c-fail" };
    }

    body.addEventListener("input", function (e) {
      const tr = e.target.closest("tr"); if (!tr) return;
      const i = +tr.dataset.i;
      if (e.target.classList.contains("g-name")) rows[i].name = e.target.value;
      if (e.target.classList.contains("g-cr")) rows[i].credits = e.target.value;
      if (e.target.classList.contains("g-gr")) rows[i].grade = e.target.value;
      save(); compute();
    });
    body.addEventListener("click", function (e) {
      if (!e.target.classList.contains("g-del")) return;
      const i = +e.target.closest("tr").dataset.i;
      rows.splice(i, 1); save(); render();
    });
    document.getElementById("gpaAdd").addEventListener("click", function () {
      rows.push({ name: "", credits: 3, grade: "A" }); save(); render();
    });

    render();
  }

  /* ---- shared helpers ---- */
  function validate(field, condition) {
    field.closest(".field").classList.toggle("invalid", !condition);
    return condition;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
