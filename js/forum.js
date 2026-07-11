/* ============================================================
   SmartStudent Hub — Community (Vue.js 3)
   The discussion/comment forum + live polls are built with Vue.
   No backend: everything is kept in the browser via localStorage.
   ============================================================ */
const { createApp } = Vue;

/* small helpers */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };

/* seed content so the forum isn't empty on first visit */
const now = Date.now();
const SEED_POSTS = [
  {
    id: uid(), author: "Nethmi", tag: "Study Help", ts: now - 1000 * 60 * 22, likes: 7, liked: false,
    body: "Anyone else doing the EEI3346 mini project? Struggling to decide between a study planner and a budget tool as my main feature 😅",
    replies: [
      { id: uid(), author: "Kavinda", ts: now - 1000 * 60 * 15, likes: 3, liked: false, body: "Do the planner — the smart-tools marks are easier to hit with a timer + tracker." },
      { id: uid(), author: "Anonymous Student", ts: now - 1000 * 60 * 8, likes: 1, liked: false, body: "You can do both as separate pages, the brief needs six anyway!" }
    ]
  },
  {
    id: uid(), author: "Ishara", tag: "Events", ts: now - 1000 * 60 * 60 * 3, likes: 12, liked: false,
    body: "Reminder: the inter-faculty coding meetup is this Friday at 4 PM in the CS lab. Bring your laptops ⚡",
    replies: []
  },
  {
    id: uid(), author: "Anonymous Student", tag: "Wellbeing", ts: now - 1000 * 60 * 60 * 26, likes: 9, liked: false,
    body: "Gentle reminder to take breaks during assignment season. The Pomodoro timer on the Planner page actually helped me stop doom-scrolling.",
    replies: [
      { id: uid(), author: "Sadeepa", ts: now - 1000 * 60 * 60 * 20, likes: 2, liked: false, body: "Same! 25 min on, 5 min off is underrated." }
    ]
  }
];

const SEED_POLLS = [
  { id: uid(), q: "How are you revising for end-of-semester?", voted: null,
    options: [ { text: "Past papers", votes: 14 }, { text: "Group study", votes: 9 }, { text: "Re-watching lectures", votes: 6 }, { text: "Pure panic 😭", votes: 21 } ] },
  { id: uid(), q: "Best place to focus on campus?", voted: null,
    options: [ { text: "Library", votes: 18 }, { text: "Empty lecture hall", votes: 7 }, { text: "Canteen corner", votes: 11 }, { text: "At home", votes: 15 } ] }
];

createApp({
  data() {
    return {
      // new-post form (pre-filled with the remembered name, if any)
      author: (window.SSH && SSH.getName()) || "",
      newTag: "General",
      newBody: "",
      postError: false,
      // filters
      tags: ["General", "Study Help", "Events", "Housing", "Wellbeing"],
      activeTag: "All",
      search: "",
      sortBy: "new",
      // data
      posts: load("ssh-forum-posts", SEED_POSTS),
      polls: load("ssh-forum-polls", SEED_POLLS),
      // per-post reply state (keyed by post id)
      replyOpen: {},
      replyAuthor: {},
      replyBody: {}
    };
  },

  computed: {
    filterTabs() { return ["All", ...this.tags]; },
    totalReplies() { return this.posts.reduce((n, p) => n + p.replies.length, 0); },
    filteredPosts() {
      let list = this.posts.slice();
      if (this.activeTag !== "All") list = list.filter(p => p.tag === this.activeTag);
      const q = this.search.trim().toLowerCase();
      if (q) list = list.filter(p => p.body.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
      list.sort((a, b) => this.sortBy === "top" ? b.likes - a.likes : b.ts - a.ts);
      return list;
    }
  },

  methods: {
    addPost() {
      if (!this.newBody.trim()) { this.postError = true; return; }
      this.postError = false;
      this.posts.unshift({
        id: uid(), author: this.author.trim() || "Anonymous Student",
        tag: this.newTag, body: this.newBody.trim(),
        likes: 0, liked: false, ts: Date.now(), replies: []
      });
      this.newBody = "";
      this.save();
    },
    toggleReply(post) { this.replyOpen[post.id] = !this.replyOpen[post.id]; },
    addReply(post) {
      const body = (this.replyBody[post.id] || "").trim();
      if (!body) return;
      post.replies.push({
        id: uid(), author: (this.replyAuthor[post.id] || "").trim() || "Anonymous Student",
        body, likes: 0, liked: false, ts: Date.now()
      });
      this.replyBody[post.id] = "";
      this.replyOpen[post.id] = false;
      this.save();
    },
    likePost(post) { post.liked = !post.liked; post.likes += post.liked ? 1 : -1; this.save(); },
    likeReply(reply) { reply.liked = !reply.liked; reply.likes += reply.liked ? 1 : -1; this.save(); },

    vote(poll, i) {
      if (poll.voted !== null) return;
      poll.options[i].votes++;
      poll.voted = i;
      this.save();
    },
    pollTotal(poll) { return poll.options.reduce((n, o) => n + o.votes, 0); },
    pct(poll, i) { const t = this.pollTotal(poll); return t ? Math.round(poll.options[i].votes / t * 100) : 0; },

    timeAgo(ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return "just now";
      const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
      const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
      const d = Math.floor(h / 24); return d + "d ago";
    },
    initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); },
    avatarColor(name) {
      let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
      return `hsl(${Math.abs(h) % 360} 62% 55%)`;
    },

    save() {
      try {
        localStorage.setItem("ssh-forum-posts", JSON.stringify(this.posts));
        localStorage.setItem("ssh-forum-polls", JSON.stringify(this.polls));
      } catch (e) {}
    }
  },

  mounted() {
    // hide the "loading" fallback once Vue has taken over
    const fb = document.getElementById("forum-fallback");
    if (fb) fb.style.display = "none";
  }
}).mount("#community-app");
