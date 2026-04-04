/* ═══════════════════════════════════════════════════
   OUR CUTE FOREVER - Digital Love Timeline
   script.js  |  All features, well-commented
   ─────────────────────────────────────────────────
   BUG FIXES vs. previous version
   ① handleCardOpen - removed loadMemories() call before window.open().
     Browsers treat window.open() as a popup (and block it) when async
     work runs between the user click and the open() call. Now we update
     the DOM badge directly and open the URL in the same synchronous tick.
   ② renderMemoryCards - card-body wraps all content so z-index layering
     (fixed in CSS) keeps buttons always on top of decorative layers.
   ③ toggleFavourite - fetchAndRenderFavs() is fire-and-forget; no longer
     re-renders the whole memory grid as a side-effect.
═══════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────────
   CONFIGURATION  ← Edit these to personalise
───────────────────────────────────────────────── */
const CONFIG = {
  relationshipStart: "2026-07-17",   // YYYY-MM-DD
  wifeName: "My Sweetheart",

  typingPhrases: [
    "You are my favorite person!",
    "Every day with you is a cute adventure.",
    "I love you more than all the stars.",
    "You make my heart go boom-boom!",
    "Let's make more sweet memories together.",
  ],

  butterflyCount: 14,
  burstEmojis: ["💖", "✨", "🦋", "💫", "🌸", "💕", "⭐"],
};

/* ─────────────────────────────────────────────────
   DOM SHORTCUTS
───────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────
   1.  PAGE LOADER
───────────────────────────────────────────────── */
window.addEventListener("load", () => {
  setTimeout(() => {
    $("#loader").classList.add("hidden");
    initApp();
  }, 1600);
});

function initApp() {
  initNavbar();
  initThemeToggle();
  initMusicToggle();
  initHamburger();
  initTypingAnimation();
  initRelationshipTimer();
  initButterflies();
  initClickBurst();
  initRevealObserver();
  loadMemories();
  initFooterYear();
}

/* ─────────────────────────────────────────────────
   2.  NAVBAR
───────────────────────────────────────────────── */
function initNavbar() {
  const nav = $("#navbar");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ─────────────────────────────────────────────────
   3.  THEME TOGGLE
───────────────────────────────────────────────── */
function initThemeToggle() {
  const btn = $("#themeToggle");
  const root = document.documentElement;
  const saved = localStorage.getItem("theme") || "dark";
  root.setAttribute("data-theme", saved);
  btn.textContent = saved === "dark" ? "🌙" : "☀️";

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    btn.textContent = next === "dark" ? "🌙" : "☀️";
    localStorage.setItem("theme", next);
  });
}

/* ─────────────────────────────────────────────────
   4.  MUSIC TOGGLE
───────────────────────────────────────────────── */
function initMusicToggle() {
  const btn   = $("#musicToggle");
  const audio = $("#bgMusic");
  let playing = false;
  audio.volume = 0.25;

  btn.addEventListener("click", () => {
    if (playing) { audio.pause(); btn.textContent = "🎵"; }
    else { audio.play().catch(() => {}); btn.textContent = "🔇"; }
    playing = !playing;
  });
}

/* ─────────────────────────────────────────────────
   5.  HAMBURGER / MOBILE DRAWER
───────────────────────────────────────────────── */
function initHamburger() {
  const hamburger = $("#hamburger");
  const drawer    = $("#mobileDrawer");

  hamburger.addEventListener("click", () => drawer.classList.toggle("open"));
  $$(".drawer-link").forEach(link => link.addEventListener("click", () => drawer.classList.remove("open")));
  document.addEventListener("click", e => {
    if (!drawer.contains(e.target) && !hamburger.contains(e.target)) drawer.classList.remove("open");
  });
}

/* ─────────────────────────────────────────────────
   6.  TYPING ANIMATION
───────────────────────────────────────────────── */
function initTypingAnimation() {
  const el = $("#typingText");
  if (!el) return;
  const phrases = CONFIG.typingPhrases;
  let phraseIdx = 0, charIdx = 0, deleting = false;

  function tick() {
    const phrase = phrases[phraseIdx];
    if (!deleting) {
      el.textContent = phrase.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) { deleting = true; setTimeout(tick, 2400); return; }
    } else {
      el.textContent = phrase.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; }
    }
    setTimeout(tick, deleting ? 45 : 80);
  }
  tick();
}

/* ─────────────────────────────────────────────────
   7.  RELATIONSHIP TIMER
───────────────────────────────────────────────── */
function initRelationshipTimer() {
  const startDate = new Date(CONFIG.relationshipStart);

  function update() {
    const diff       = Date.now() - startDate;
    const totalSecs  = Math.floor(diff / 1000);
    const totalMins  = Math.floor(totalSecs  / 60);
    const totalHours = Math.floor(totalMins  / 60);
    const totalDays  = Math.floor(totalHours / 24);
    const years      = Math.floor(totalDays  / 365.25);
    const days       = Math.floor(totalDays  % 365.25);
    const hours      = totalHours % 24;
    const mins       = totalMins  % 60;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2,"0"); };
    set("rYears", years); set("rDays", days); set("rHours", hours); set("rMins", mins);
  }
  update();
  setInterval(update, 60_000);
}

/* ─────────────────────────────────────────────────
   8.  BUTTERFLY CANVAS
───────────────────────────────────────────────── */
function initButterflies() {
  const canvas = $("#butterflyCanvas");
  const ctx    = canvas.getContext("2d");
  let butterflies = [], W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  class Butterfly {
    constructor(x, y) {
      this.x = x ?? Math.random() * W;
      this.y = y ?? Math.random() * H;
      this.angle    = Math.random() * Math.PI * 2;
      this.speed    = 0.4 + Math.random() * 0.7;
      this.wingPhase = Math.random() * Math.PI * 2;
      this.wingSpeed = 0.06 + Math.random() * 0.05;
      this.size      = 14 + Math.random() * 18;
      this.turnSpeed = (Math.random() - 0.5) * 0.04;
      this.opacity   = 0.55 + Math.random() * 0.4;
      const palettes = [["#ff6eb4","#b06afc"],["#b06afc","#38d9f5"],["#f5c842","#ff6eb4"],["#38d9f5","#ff6eb4"],["#ffa8d4","#7a3fbf"]];
      const p = palettes[Math.floor(Math.random() * palettes.length)];
      this.color1 = p[0]; this.color2 = p[1];
      this.life   = 1; this.age = 0;
      this.maxAge = 600 + Math.random() * 600;
    }
    update() {
      this.age++;
      this.wingPhase += this.wingSpeed;
      this.angle     += this.turnSpeed + Math.sin(this.age * 0.02) * 0.03;
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed - 0.15;
      if (this.x < -60) this.x = W + 60;
      if (this.x > W + 60) this.x = -60;
      if (this.y < -60) this.y = H + 60;
      if (this.y > H + 60) this.y = -60;
      if (this.age > this.maxAge - 80) this.life = Math.max(0, this.life - 0.012);
    }
    draw() {
      const wf = Math.abs(Math.sin(this.wingPhase)), s = this.size, op = this.opacity * this.life;
      ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = op;
      ctx.shadowBlur = 14; ctx.shadowColor = this.color1;
      this._drawWing(-1, wf, s); this._drawWing(1, wf, s);
      ctx.shadowBlur = 0; ctx.fillStyle = this.color2; ctx.globalAlpha = op * 0.85;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.07, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    _drawWing(side, foldFactor, s) {
      const grad = ctx.createRadialGradient(side*s*.25,-s*.1,0, side*s*.5,s*.1,s*foldFactor*.9);
      grad.addColorStop(0, this.color1); grad.addColorStop(0.6, this.color2); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side*s*.6*foldFactor,-s*.55, side*s*.9*foldFactor,-s*.15, side*s*.6*foldFactor, s*.3);
      ctx.bezierCurveTo(side*s*.3*foldFactor, s*.5, 0, s*.25, 0, 0);
      ctx.fill();
    }
  }

  for (let i = 0; i < CONFIG.butterflyCount; i++) butterflies.push(new Butterfly());

  document.addEventListener("click", e => {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const b = new Butterfly(e.clientX, e.clientY);
      b.maxAge = 200 + Math.random() * 120;
      butterflies.push(b);
    }
  });

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    butterflies = butterflies.filter(b => b.life > 0);
    while (butterflies.length < CONFIG.butterflyCount) butterflies.push(new Butterfly());
    butterflies.forEach(b => { b.update(); b.draw(); });
    requestAnimationFrame(loop);
  })();
}

/* ─────────────────────────────────────────────────
   9.  CLICK BURST
───────────────────────────────────────────────── */
function initClickBurst() {
  const container = $("#burstContainer");
  document.addEventListener("click", e => {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.classList.add("burst-particle");
      span.textContent = CONFIG.burstEmojis[Math.floor(Math.random() * CONFIG.burstEmojis.length)];
      const angle = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 90;
      span.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
      span.style.setProperty("--by", `${Math.sin(angle) * dist - 30}px`);
      span.style.left = `${e.clientX - 12}px`;
      span.style.top  = `${e.clientY - 12}px`;
      container.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
    }
  });
}

/* ─────────────────────────────────────────────────
   10. SCROLL REVEAL
───────────────────────────────────────────────── */
function initRevealObserver() {
  const targets = $$(".reveal, .reveal-left, .reveal-right, .section-label");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
  }, { threshold: 0.15 });
  targets.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────
   11. MEMORY SYSTEM
───────────────────────────────────────────────── */
const LS_VIEWED     = "love_viewed_ids";
const LS_FAVOURITES = "love_favourite_ids";
const LS_NOTIF_DATE = "love_notif_date";
const LS_KNOWN_IDS  = "love_known_ids";

// In-memory cache so we can access memories without refetching
let memoriesCache = [];

function getSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key)) || []); }
  catch { return new Set(); }
}
function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

async function loadMemories() {
  try {
    const res = await fetch("links.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    memoriesCache = await res.json();
  } catch (e) {
    console.warn("Could not load links.json - using demo data.", e);
    memoriesCache = getDemoMemories();
  }
  renderMemoryCards(memoriesCache);
  checkForNewMemories(memoriesCache);
  renderFavourites(memoriesCache);
}

function getDemoMemories() {
  return [
    { id:"memory-001", title:"How She Is 🌸",            description:"A personal digital tribute exploring her essence and the special way she lights up the world.",    url:"https://mazudiary.github.io/HowSheIs/",                  date:"2024-01-14", category:"Personal Reflection" },
    { id:"memory-002", title:"LoveLight Canvas 💖",       description:"An interactive glowing canvas of hearts and romantic words - a digital embrace of love.",          url:"https://github.com/mazudiary/LoveLightCanvas",            date:"2024-06-20", category:"Digital Love Letter" },
    { id:"memory-003", title:"Heart in Code 💕",          description:"Romantic love letters blending technical metaphors with deep poetic expressions of eternal love.", url:"https://basharulalammazu.github.io/heartincode/",          date:"2025-03-08", category:"Soulmate Tribute" },
    { id:"memory-004", title:"When You Came Into My Life 📽️", description:"A heartfelt video memory celebrating the transformative moment you entered my life.",        url:"https://drive.google.com/file/d/19cAJUo4EKpX7mab45i4Gbr4hCD5kxE96/view?usp=sharing", date:"2025-12-25", category:"Video Memory" },
    { id:"memory-005", title:"Wish Upon A Cake 🎂",       description:"A magical birthday wish page with vibrant emojis and loving messages to make your day extraordinary.", url:"https://mazudiary.github.io/WishUponACake",           date:"2026-06-14", category:"Birthday Wish" },
    { id:"memory-006", title:"Birthday Gift Prank 🥳",   description:"Playful interactive birthday surprise with animated GIFs, teasing choices, and loving gestures.",   url:"https://mazudiary.github.io/BirthdayGiftPrank/",         date:"2027-01-01", category:"Birthday Surprise" },
    { id:"memory-007", title:"Could Be Us 🌟",            description:"A romantic visualization of our shared future - dancing under stars, holding hands, living our dream.", url:"https://mazudiary.github.io/CloudBeUs",               date:"2027-01-01", category:"Future Vision" },
    { id:"memory-008", title:"Butterfly Serenade 🦋",     description:"Poetic love letters and promises featuring a Nikkah countdown, shared dreams, and vows of eternal love.", url:"https://mazudiary.github.io/ButterflySerenade/",   date:"2027-01-01", category:"Eternal Promise" },
    { id:"memory-009", title:"Our Love Languages 💞",     description:"A guide to expressing love through the five love languages with personal examples and deep affirmations.", url:"https://mazudiary.github.io/OurLoveLanguage/",      date:"2027-01-01", category:"Love Languages" },
    { id:"memory-010", title:"The Finest Soul 🌟",        description:"A proud and encouraging message celebrating resilience, growth, and the incredible person you are becoming.", url:"https://mazudiary.github.io/TheFinestSoul/",       date:"2027-01-01", category:"Encouragement" },
    { id:"memory-011", title:"Luminescent Forest of Tomorrow 🌲✨", description:"Our love journey as a glowing forest path - trust, growth, green flags, and commitment forever.", url:"https://mazudiary.github.io/luminescentforestoftomorrow/", date:"2027-01-01", category:"Future Vision" },
    { id:"memory-012", title:"Eid Mubarak Financial Harmony 🕌💰", description:"Eid ul-Adha blessings woven with accounting metaphors for spiritual growth, love, and barakah.", url:"https://mazudiary.github.io/EidMubarak-FinancialHarmony/", date:"2027-01-01", category:"Festive Message" },
    { id:"memory-013", title:"Butterfly Birthday Magic 🦋🎉", description:"Enchanting birthday celebration with magical elements and loving surprises for my Butterfly.",  url:"https://mazudiary.github.io/ButterflyBirthdayMagic/",    date:"2027-01-01", category:"Birthday Celebration" },
    { id:"memory-014", title:"Our Love Story Flipbook 📖", description:"An interactive flipbook narrating the beautiful chapters of our love story through heartfelt moments.", url:"https://mazudiary.github.io/LoveStoryFlipbook/",       date:"2027-01-01", category:"Love Story" },
    { id:"memory-015", title:"Butterfly Never Fly 🦋",    description:"A tender promise that our butterfly love will stay forever, never flying away from each other.",    url:"https://mazudiary.github.io/ButterflyNeverrFly/",        date:"2027-01-01", category:"Eternal Love" },
    { id:"memory-016", title:"Transformation Story 🌺",   description:"The inspiring story of personal transformation and growth through the power of our love.",          url:"https://mazudiary.github.io/TransformationStory/",       date:"2027-01-01", category:"Personal Growth" },
  ];
}

/* ── 11a. Render cards ─────────────────────────── */
function renderMemoryCards(memories) {
  const grid      = $("#memoryGrid");
  const viewedIds = getSet(LS_VIEWED);
  const favIds    = getSet(LS_FAVOURITES);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  grid.innerHTML = "";

  memories.forEach((mem, i) => {
    const unlockDate = new Date(mem.date);
    unlockDate.setHours(0, 0, 0, 0);
    const isLocked = unlockDate > today;
    const isViewed = viewedIds.has(mem.id);
    const isFav    = favIds.has(mem.id);

    const card = document.createElement("div");
    card.classList.add("memory-card");
    if (isLocked) card.classList.add("locked");
    card.style.animationDelay = `${i * 0.08}s`;

    const formattedDate = new Date(mem.date).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    // Category badge (only if JSON has the field)
    const categoryHTML = mem.category
      ? `<div class="card-category-badge">✦ ${escHtml(mem.category)}</div>`
      : "";

    card.innerHTML = `
      ${isViewed ? `<div class="viewed-badge">Yay! Seen 💫</div>` : ""}
      <div class="card-body">
        ${categoryHTML}
        <div class="card-date-badge">📅 ${formattedDate}</div>
        <h3 class="card-title">${escHtml(mem.title)}</h3>
        <p class="card-desc">${escHtml(mem.description)}</p>
        <div class="card-actions">
          <button type="button"
                  class="card-open-btn ${isLocked ? "locked-btn" : ""}"
                  data-id="${escAttr(mem.id)}"
                  data-url="${isLocked ? "" : escAttr(mem.url)}"
                  data-date="${escAttr(mem.date)}"
                  data-locked="${isLocked}">
            ${isLocked ? "🔒 Wait for the surprise!" : "Open & Smile →"}
          </button>
          <button type="button"
                  class="fav-btn ${isFav ? "active" : ""}"
                  title="${isFav ? "Remove from your heart" : "Save to your heart"}"
                  data-id="${escAttr(mem.id)}">
            ${isFav ? "💖" : "🤍"}
          </button>
        </div>
      </div>
      ${isLocked ? `
        <div class="lock-overlay">
          <div class="lock-icon">🔒</div>
          <span class="lock-label">Opens soon, cutie! 💕</span>
        </div>` : ""}
    `;

    /* ── Wire Open button ─────────────────────────
       We look up the memory from memoriesCache inside the handler
       so the closure never accidentally captures a stale reference. */
    const openBtn = card.querySelector(".card-open-btn");
    openBtn.addEventListener("click", e => {
      e.stopPropagation();
      const id  = openBtn.dataset.id;
      const mem = memoriesCache.find(m => m.id === id);
      if (mem) handleCardOpen(mem, isLocked, card);
    });

    /* ── Wire Favourite button ─────────────────── */
    const favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", e => {
      e.stopPropagation();
      const id  = favBtn.dataset.id;
      const mem = memoriesCache.find(m => m.id === id);
      if (mem) toggleFavourite(mem, favBtn);
    });

    grid.appendChild(card);
  });
}

/* ── 11b. Handle card open ─────────────────────── */
function handleCardOpen(mem, isLocked, cardEl) {
  if (isLocked) {
    showLockedPopup(mem);
    return;
  }

  /* ── FIX: mark as viewed and open URL in the SAME synchronous call.
     Previously loadMemories() (an async fetch) was called here first,
     which made browsers treat window.open() as not a direct user
     gesture and silently block it as a popup.                         */

  // 1. Persist to localStorage
  const viewedIds = getSet(LS_VIEWED);
  viewedIds.add(mem.id);
  saveSet(LS_VIEWED, viewedIds);

  // 2. Update "Viewed" badge directly on the card (no full re-render needed)
  if (cardEl && !cardEl.querySelector(".viewed-badge")) {
    const badge = document.createElement("div");
    badge.className   = "viewed-badge";
    badge.textContent = "Yay! Seen 💫";
    cardEl.insertBefore(badge, cardEl.firstChild);
  }

  // 3. Open the link - same synchronous tick as the click event ✓
  window.open(mem.url, "_blank", "noopener,noreferrer");
}

/* ── 11c. Favourites ───────────────────────────── */
function toggleFavourite(mem, btn) {
  const favIds = getSet(LS_FAVOURITES);
  if (favIds.has(mem.id)) {
    favIds.delete(mem.id);
    btn.textContent = "🤍";
    btn.classList.remove("active");
    btn.title = "Save to your heart";
  } else {
    favIds.add(mem.id);
    btn.textContent = "💖";
    btn.classList.add("active");
    btn.title = "Remove from your heart";
    const rect = btn.getBoundingClientRect();
    spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ["❤️","💖","💕"], 4);
  }
  saveSet(LS_FAVOURITES, favIds);
  renderFavourites(memoriesCache);   // update favs panel only - no card re-render
}

function renderFavourites(memories) {
  const favIds = getSet(LS_FAVOURITES);
  const grid   = $("#favsGrid");
  const empty  = $("#favsEmpty");
  const favMems = memories.filter(m => favIds.has(m.id));

  $$(".fav-mini-card", grid).forEach(c => c.remove());

  if (favMems.length === 0) {
    empty.style.display = "";
  } else {
    empty.style.display = "none";
    favMems.forEach(m => {
      const card = document.createElement("div");
      card.classList.add("fav-mini-card");
      card.innerHTML = `
        <strong>${escHtml(m.title)}</strong>
        ${m.category ? `<span class="fav-category">✦ ${escHtml(m.category)}</span>` : ""}
        <small>${new Date(m.date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</small>
      `;
      grid.appendChild(card);
    });
  }
}

/* ── 11d. Notification system ─────────────────── */
function checkForNewMemories(memories) {
  const knownIds  = getSet(LS_KNOWN_IDS);
  const viewedIds = getSet(LS_VIEWED);
  const today     = new Date().toISOString().split("T")[0];
  const lastNotif = localStorage.getItem(LS_NOTIF_DATE) || "";

  const newIds = memories.map(m => m.id).filter(id => !knownIds.has(id));
  saveSet(LS_KNOWN_IDS, new Set(memories.map(m => m.id)));

  const unseenIds = memories.map(m => m.id).filter(id => !viewedIds.has(id));

  if (newIds.length > 0) {
    showNotification(
      `💌 ${newIds.length} new memor${newIds.length > 1 ? "ies" : "y"} added just for you!`,
      "Scroll down to discover what's waiting, cutie! 💖",
      "#timeline"
    );
    localStorage.setItem(LS_NOTIF_DATE, today);
  } else if (unseenIds.length > 0 && lastNotif !== today) {
    showNotification(
      `💖 You have ${unseenIds.length} memor${unseenIds.length > 1 ? "ies" : "y"} waiting today…`,
      "A gentle reminder from someone who loves you! 🦋",
      "#timeline"
    );
    localStorage.setItem(LS_NOTIF_DATE, today);
  }

  requestBrowserNotification(unseenIds.length);
}

function showNotification(title, sub, scrollTarget) {
  const notif   = $("#notification");
  $(".notification-title", notif).textContent = title;
  $("#notificationSub").textContent = sub;
  notif.classList.remove("hidden");

  $("#notificationViewBtn").onclick = () => {
    notif.classList.add("hidden");
    document.querySelector(scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  };
  $("#notificationCloseBtn").onclick = () => notif.classList.add("hidden");
  setTimeout(() => notif.classList.add("hidden"), 8000);
}

function requestBrowserNotification(count) {
  if (!("Notification" in window) || count === 0) return;
  const send = () => new Notification("💌 Memories await you!", {
    body: `You have ${count} unread memor${count > 1 ? "ies" : "y"} on your Love Timeline.`,
  });
  if (Notification.permission === "granted") send();
  else if (Notification.permission !== "denied") Notification.requestPermission().then(p => { if (p === "granted") send(); });
}

/* ─────────────────────────────────────────────────
   12. LOCKED POPUP with countdown
───────────────────────────────────────────────── */
let countdownInterval = null;

function showLockedPopup(mem) {
  const overlay = $("#lockedPopup");
  const formattedDate = new Date(mem.date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  $("#popupMessage").textContent    = `"${mem.title}" will be unlocked on:`;
  $("#popupUnlockDate").textContent = `📅 ${formattedDate}`;
  overlay.classList.remove("hidden");

  clearInterval(countdownInterval);
  const target = new Date(mem.date);
  countdownInterval = setInterval(() => updateCountdown(target), 1000);
  updateCountdown(target);

  $("#popupCloseBtn").onclick = closePopup;
  overlay.addEventListener("click", e => { if (e.target === overlay) closePopup(); });
}

function closePopup() {
  $("#lockedPopup").classList.add("hidden");
  clearInterval(countdownInterval);
}

function updateCountdown(unlockDate) {
  const diff = unlockDate - new Date();
  if (diff <= 0) { closePopup(); return; }
  const s     = Math.floor(diff / 1000);
  const pad   = n => String(n).padStart(2, "0");
  document.getElementById("cdDays").textContent  = pad(Math.floor(s / 86400));
  document.getElementById("cdHours").textContent = pad(Math.floor((s % 86400) / 3600));
  document.getElementById("cdMins").textContent  = pad(Math.floor((s % 3600)  / 60));
  document.getElementById("cdSecs").textContent  = pad(s % 60);
}

/* ─────────────────────────────────────────────────
   13. FOOTER YEAR
───────────────────────────────────────────────── */
function initFooterYear() {
  const el = $("#footerYear");
  if (el) el.textContent = new Date().getFullYear();
}

/* ─────────────────────────────────────────────────
   14. BURST HELPER
───────────────────────────────────────────────── */
function spawnBurst(x, y, emojis, count = 5) {
  const container = $("#burstContainer");
  for (let i = 0; i < count; i++) {
    const span  = document.createElement("span");
    span.classList.add("burst-particle");
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
    span.style.setProperty("--bx", `${Math.cos(angle) * dist}px`);
    span.style.setProperty("--by", `${Math.sin(angle) * dist - 25}px`);
    span.style.left = `${x - 12}px`;
    span.style.top  = `${y - 12}px`;
    container.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  }
}

/* ─────────────────────────────────────────────────
   15. UTILITIES
───────────────────────────────────────────────── */
// Escape for innerHTML text nodes
function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
// Escape for HTML attribute values (handles single quotes too)
function escAttr(str) {
  return String(str).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
