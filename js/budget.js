/* ============================================================
   SmartStudent Hub — Budget Tracker
   Add income/expenses, see your balance, track a savings goal
   (focus-ring), and a category breakdown. Vanilla JS + localStorage.
   Currency: Sri Lankan Rupees (Rs).
   ============================================================ */
(function () {
  "use strict";

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const money = n => "Rs " + Math.round(n).toLocaleString("en-US");

  const CATS = {
    income: ["Allowance", "Part-time", "Scholarship", "Other"],
    expense: ["Food", "Transport", "Books & Supplies", "Rent", "Phone & Data", "Entertainment", "Other"]
  };
  const CAT_COLOR = {
    "Food": "#FF9F45", "Transport": "#6246EA", "Books & Supplies": "#16B98A",
    "Rent": "#E5484D", "Phone & Data": "#8B78FF", "Entertainment": "#F76FB3", "Other": "#7C89A0"
  };

  const SEED = [
    { id: uid(), type: "income", amount: 15000, category: "Allowance", label: "Monthly allowance", ts: Date.now() - 6 * 864e5 },
    { id: uid(), type: "income", amount: 6000, category: "Part-time", label: "Weekend tutoring", ts: Date.now() - 4 * 864e5 },
    { id: uid(), type: "expense", amount: 3500, category: "Food", label: "Groceries & lunches", ts: Date.now() - 3 * 864e5 },
    { id: uid(), type: "expense", amount: 2200, category: "Transport", label: "Bus & train", ts: Date.now() - 2 * 864e5 },
    { id: uid(), type: "expense", amount: 1800, category: "Books & Supplies", label: "Lab printouts", ts: Date.now() - 2 * 864e5 },
    { id: uid(), type: "expense", amount: 1200, category: "Phone & Data", label: "Data pack", ts: Date.now() - 1 * 864e5 },
    { id: uid(), type: "expense", amount: 1500, category: "Entertainment", label: "Movie night", ts: Date.now() - 1 * 864e5 }
  ];

  let txns = store.get("ssh-budget", SEED);
  let goal = store.get("ssh-budget-goal", 15000);
  let formType = "expense";

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("txnForm")) return;
    initForm();
    initGoal();
    render();
  });

  /* ---------- form ---------- */
  function initForm() {
    document.querySelectorAll(".type-seg").forEach(b =>
      b.addEventListener("click", () => setType(b.dataset.type)));
    setType("expense");

    document.getElementById("txnForm").addEventListener("submit", e => {
      e.preventDefault();
      const amtEl = document.getElementById("txnAmount");
      const amt = parseFloat(amtEl.value);
      const ok = amt > 0;
      amtEl.closest(".field").classList.toggle("invalid", !ok);
      if (!ok) return;

      txns.push({
        id: uid(), type: formType, amount: amt,
        category: document.getElementById("txnCat").value,
        label: document.getElementById("txnLabel").value.trim() || document.getElementById("txnCat").value,
        ts: Date.now()
      });
      store.set("ssh-budget", txns);
      e.target.reset();
      setType(formType);
      render();
    });

    document.getElementById("txnList").addEventListener("click", e => {
      const li = e.target.closest("[data-id]"); if (!li) return;
      if (!e.target.closest(".t-del")) return;
      txns = txns.filter(t => t.id !== li.dataset.id);
      store.set("ssh-budget", txns);
      render();
    });
  }

  function setType(type) {
    formType = type;
    document.querySelectorAll(".type-seg").forEach(b => b.classList.toggle("active", b.dataset.type === type));
    document.getElementById("txnCat").innerHTML = CATS[type].map(c => `<option>${c}</option>`).join("");
  }

  /* ---------- savings goal ---------- */
  function initGoal() {
    const input = document.getElementById("goalInput");
    input.value = goal;
    input.addEventListener("input", () => {
      goal = Math.max(0, parseFloat(input.value) || 0);
      store.set("ssh-budget-goal", goal);
      renderGoal();
    });
  }

  /* ---------- render ---------- */
  function totals() {
    const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }

  function render() {
    const { income, expense, balance } = totals();
    document.getElementById("sumIncome").textContent = money(income);
    document.getElementById("sumExpense").textContent = money(expense);
    const balEl = document.getElementById("sumBalance");
    balEl.textContent = money(balance);
    balEl.classList.toggle("neg", balance < 0);

    renderGoal();
    renderBreakdown(expense);
    renderList();
  }

  function renderGoal() {
    const { balance } = totals();
    const saved = Math.max(0, balance);
    const pct = goal > 0 ? Math.min(100, Math.round(saved / goal * 100)) : 0;
    const ring = document.getElementById("ringGoal");
    if (ring && window.SSH) { ring.dataset.pct = pct; window.SSH.renderRing(ring); }
    document.getElementById("goalMeta").textContent = money(saved) + " / " + money(goal);
  }

  function renderBreakdown(expense) {
    const wrap = document.getElementById("breakdown");
    const byCat = {};
    txns.filter(t => t.type === "expense").forEach(t => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
    const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (!rows.length) { wrap.innerHTML = '<p class="muted-note">No expenses yet — add one to see where your money goes.</p>'; return; }
    wrap.innerHTML = rows.map(([cat, amt]) => {
      const pct = expense ? Math.round(amt / expense * 100) : 0;
      const color = CAT_COLOR[cat] || "#7C89A0";
      return `<div class="cat-row">
          <div class="cat-top"><span><span class="cat-dot" style="background:${color}"></span>${cat}</span>
            <span class="cat-amt">${money(amt)} · ${pct}%</span></div>
          <div class="cat-track"><div class="cat-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
    }).join("");
  }

  function renderList() {
    const list = document.getElementById("txnList");
    const meta = document.getElementById("txnMeta");
    if (!txns.length) { list.innerHTML = '<li class="muted-note" style="padding:20px;text-align:center">No transactions yet.</li>'; meta.textContent = ""; return; }
    meta.textContent = txns.length + " transaction(s)";
    const sorted = txns.slice().sort((a, b) => b.ts - a.ts);
    list.innerHTML = sorted.map(t => {
      const sign = t.type === "income" ? "+" : "−";
      const color = CAT_COLOR[t.category] || "#7C89A0";
      return `<li class="t-item" data-id="${t.id}">
          <span class="t-dot" style="background:${t.type === 'income' ? 'var(--positive)' : color}"></span>
          <div class="t-body"><span class="t-label">${esc(t.label)}</span>
            <span class="t-cat">${t.category}</span></div>
          <span class="t-amt ${t.type}">${sign} ${money(t.amount)}</span>
          <button class="t-del" aria-label="Delete">✕</button>
        </li>`;
    }).join("");
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
