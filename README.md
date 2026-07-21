# Smart Student Hub 🎓

A modern, interactive **student life platform** that brings study planning, wellbeing, budgeting and campus community into one distraction-free hub.

> **Module:** EEI3346 – Web Application Development · Mini Project 2026
> **Programme:** BEng (Hons) Software Engineering — The Open University of Sri Lanka
> **Student:** _[Your name]_ · _[Registration number]_

---

## ✨ Overview

Being a student means juggling assignments, deadlines, money, wellbeing and campus
life across a dozen browser tabs. **Smart Student Hub** solves that by pulling the
essentials into a single, responsive web app with a consistent design language —
built entirely from scratch with **HTML5, CSS, JavaScript and Vue.js**, with no
backend required.

## 🧩 Features

| Page | What it does |
|------|--------------|
| **Home** | Hero dashboard, rotating campus announcements, feature overview, live stats |
| **Study Planner** | Assignment tracker, Pomodoro focus timer, study-progress rings, GPA calculator |
| **Community** | Vue.js discussion/comment forum, quick poll, searchable FAQ |
| **Wellness** | Mood check-in, hydration & break reminders, wellbeing tips |
| **Budget** | Income/expense tracker with category breakdown and savings-goal ring |
| **Support** | Validated feedback form, contact details, FAQ accordion |

**Cross-cutting:** responsive navigation · dark/light theme (saved in `localStorage`) ·
scroll-reveal animations · loading animation · reusable **focus-ring** progress motif.

## 🛠️ Tech Stack

- **HTML5** — semantic, multi-page structure
- **CSS** — custom design system (CSS variables, theming, responsive grid), no frameworks/templates
- **JavaScript** — smart tools, form validation, dynamic content, `localStorage` persistence
- **Vue.js 3** (via CDN) — the interactive discussion forum

_No backend, database, authentication or paid APIs — per the project brief._

## ▶️ Run locally

No build step needed. Either:

1. Open `index.html` directly in a browser, **or**
2. (Recommended) In VS Code, right-click `index.html` → **Open with Live Server**
   so relative paths and the theme toggle behave exactly as in production.

## 🚀 Live demo (GitHub Pages)

Enable **Settings → Pages → Deploy from branch → `main` / root**.
The site publishes to: `https://<username>.github.io/smart-campus-hub/`

## 📁 Structure

```
smart-campus-hub/
├── index.html          # Home
├── planner.html        # Study Planner + smart tools
├── community.html      # Vue.js forum
├── wellness.html
├── budget.html
├── support.html
├── css/style.css       # Shared design system
├── js/                 # main.js (shared) + per-page scripts
├── assets/images/
└── docs/               # Task 02 documentation
```

---

_Built for the EEI3346 mini project. Design and layout are original — no templates used._
