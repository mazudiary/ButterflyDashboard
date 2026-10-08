/* ═══════════════════════════════════════════════════
   OUR CUTE FOREVER - Digital Love Timeline
   script.js
   ─────────────────────────────────────────────────
   WHAT'S NEW IN THIS VERSION
   ① Unlock times are fixed to Bangladesh time (UTC+6). A memory opens at the
     same real moment for everyone. links.json may use an optional
     "availableAt": "YYYY-MM-DDTHH:mm" for an exact opening time; without it
     the memory opens at 00:00 on its "date".
   ② Cards are always shown in date order (oldest → newest, stable for ties).
   ③ Cards unlock by themselves when their time arrives - no reload needed.
   ④ The locked popup countdown and the card lock now use the SAME instant
     (before, the popup counted to 06:00 while the card opened at 00:00).
   ⑤ "Open" is a real link (never popup-blocked); progress ring + filters.
   ⑥ Opening sequence kept: loader -> initApp(); links.json now downloads
     while the loader plays, so the cards appear sooner.
═══════════════════════════════════════════════════ */

"use strict";

/* ─────────────────────────────────────────────────
   CONFIGURATION  ← Edit these to personalise
───────────────────────────────────────────────── */
const CONFIG = {
  relationshipStart: "2026-10-02",   // YYYY-MM-DD (Bangladesh time)
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

  timezone: "Asia/Dhaka",
  tzOffset: "+06:00",
  minLoaderMs: 1600,                 // loader stays at least this long (counted from page start)
};

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─────────────────────────────────────────────────
   DOM SHORTCUTS
───────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────────
   0.  START DOWNLOADING THE MEMORIES IMMEDIATELY
       (runs while the loader animation plays)
───────────────────────────────────────────────── */
const linksPromise = fetch("links.json")
  .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
  .catch(err => { console.warn("Could not load links.json - using demo data.", err); return null; });

/* ─────────────────────────────────────────────────
   1.  PAGE LOADER
───────────────────────────────────────────────── */
window.addEventListener("load", () => {
  // Wait only for what is left of the minimum loader time (not an extra 1.6s on top of a slow load)
  const wait = Math.max(0, CONFIG.minLoaderMs - performance.now());
  setTimeout(() => {
    $("#loader").classList.add("hidden");
    initApp();
  }, wait);
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
  initScrollSpy();
  initPopup();
  initChips();
  loadMemories();
  initFooterYear();
  const name = $("#heroName");
  if (name && CONFIG.wifeName) name.textContent = CONFIG.wifeName;
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

/* highlight the nav link of the section currently on screen */
function initScrollSpy() {
  if (!("IntersectionObserver" in window)) return;
  const links = $$(".nav-links a[data-spy]");
  const sections = ["hero", "love-story", "timeline", "message"].map(id => document.getElementById(id)).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle("active", a.dataset.spy === e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => observer.observe(s));
}

/* ─────────────────────────────────────────────────
   3.  THEME TOGGLE
───────────────────────────────────────────────── */
function initThemeToggle() {
  const btn = $("#themeToggle");
  const root = document.documentElement;
  const meta = $('meta[name="theme-color"]');
  let saved = "dark";
  try { saved = localStorage.getItem("theme") || "dark"; } catch (e) { /* storage blocked */ }

  const apply = theme => {
    root.setAttribute("data-theme", theme);
    btn.textContent = theme === "dark" ? "🌙" : "☀️";
    if (meta) meta.setAttribute("content", theme === "dark" ? "#06040f" : "#fdf4ff");
  };
  apply(saved);

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
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
    if (playing) {
      audio.pause();
      btn.textContent = "🎵";
      btn.setAttribute("aria-pressed", "false");
      playing = false;
    } else {
      audio.play().then(() => {
        btn.textContent = "🔇";
        btn.setAttribute("aria-pressed", "true");
        playing = true;
      }).catch(() => { /* autoplay/network blocked - leave the button as "off" */ });
    }
  });
}

/* ─────────────────────────────────────────────────
   5.  HAMBURGER / MOBILE DRAWER
───────────────────────────────────────────────── */
function initHamburger() {
  const hamburger = $("#hamburger");
  const drawer    = $("#mobileDrawer");
  const backdrop  = $("#drawerBackdrop");

  const setOpen = open => {
    drawer.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
  };

  hamburger.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
  backdrop.addEventListener("click", () => setOpen(false));
  $$("#mobileDrawer a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) setOpen(false); }, { passive: true });
}

/* ─────────────────────────────────────────────────
   6.  TYPING ANIMATION
───────────────────────────────────────────────── */
function initTypingAnimation() {
  const el = $("#typingText");
  if (!el) return;
  const phrases = CONFIG.typingPhrases;

  if (REDUCED_MOTION) { el.textContent = phrases[0]; return; }

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
  const startDate = parseDhaka(CONFIG.relationshipStart) || new Date();

  function update() {
    const diff       = Math.max(0, Date.now() - startDate);   // never negative
    const totalSecs  = Math.floor(diff / 1000);
    const totalMins  = Math.floor(totalSecs  / 60);
    const totalHours = Math.floor(totalMins  / 60);
    const totalDays  = Math.floor(totalHours / 24);
    const years      = Math.floor(totalDays  / 365.25);
    const days       = Math.floor(totalDays  % 365.25);
    const hours      = totalHours % 24;
    const mins       = totalMins  % 60;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, "0"); };
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
  if (REDUCED_MOTION) { canvas.style.display = "none"; return; }

  let butterflies = [], W = 0, H = 0, dpr = 1;
  const MAX_TOTAL = 40;
  const targetCount = () => (W < 640 ? Math.min(8, CONFIG.butterflyCount) : CONFIG.butterflyCount);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);   // crisp on phones, capped for speed
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
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
      this.size      = (W < 640 ? 11 : 14) + Math.random() * (W < 640 ? 12 : 18);
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
      ctx.shadowBlur = W < 640 ? 6 : 14; ctx.shadowColor = this.color1;
      this._drawWing(-1, wf, s); this._drawWing(1, wf, s);
      ctx.shadowBlur = 0; ctx.fillStyle = this.color2; ctx.globalAlpha = op * 0.85;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.07, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    _drawWing(side, foldFactor, s) {
      const grad = ctx.createRadialGradient(side*s*.25,-s*.1,0, side*s*.5,s*.1,Math.max(1, s*foldFactor*.9));
      grad.addColorStop(0, this.color1); grad.addColorStop(0.6, this.color2); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side*s*.6*foldFactor,-s*.55, side*s*.9*foldFactor,-s*.15, side*s*.6*foldFactor, s*.3);
      ctx.bezierCurveTo(side*s*.3*foldFactor, s*.5, 0, s*.25, 0, 0);
      ctx.fill();
    }
  }

  for (let i = 0; i < targetCount(); i++) butterflies.push(new Butterfly());

  document.addEventListener("click", e => {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count && butterflies.length < MAX_TOTAL; i++) {
      const b = new Butterfly(e.clientX, e.clientY);
      b.maxAge = 200 + Math.random() * 120;
      butterflies.push(b);
    }
  });

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    butterflies = butterflies.filter(b => b.life > 0);
    while (butterflies.length < targetCount()) butterflies.push(new Butterfly());
    butterflies.forEach(b => { b.update(); b.draw(); });
    requestAnimationFrame(loop);
  })();
}

/* ─────────────────────────────────────────────────
   9.  CLICK BURST
───────────────────────────────────────────────── */
function initClickBurst() {
  if (REDUCED_MOTION) return;
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
  if (!("IntersectionObserver" in window)) { targets.forEach(el => el.classList.add("visible")); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  targets.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────
   TIME HELPERS  (everything is Bangladesh time)
───────────────────────────────────────────────── */
function parseDhaka(str) {
  if (!str || typeof str !== "string") return null;
  const v = str.trim();
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) d = new Date(`${v}T00:00:00${CONFIG.tzOffset}`);
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v)) d = new Date(`${v}${v.length === 16 ? ":00" : ""}${CONFIG.tzOffset}`);
  else if (/(Z|[+-]\d{2}:?\d{2})$/i.test(v) && v.includes("T")) d = new Date(v);  // explicit offset given
  else return null;
  return Number.isNaN(d.getTime()) ? null : d;
}

const fmtDate = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timezone, year: "numeric", month: "long", day: "numeric" });
const fmtDateLong = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timezone, weekday: "long", year: "numeric", month: "long", day: "numeric" });
const fmtTime = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timezone, hour: "numeric", minute: "2-digit" });

function hasClockTime(mem) {
  return !!mem.availableAt && !/T00:00(:00)?$/.test(mem.availableAt);
}

function formatMemDate(mem, long = false) {
  if (!mem._at) return mem.date || "";
  const day = (long ? fmtDateLong : fmtDate).format(mem._at);
  return hasClockTime(mem) ? `${day} · ${fmtTime.format(mem._at)}` : day;
}

function isLockedNow(mem) {
  return !mem._at || mem._at.getTime() > Date.now();   // no/invalid date = stays a secret
}

function shortEta(ms) {
  const mins  = Math.max(1, Math.ceil(ms / 60000));
  const days  = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const m     = mins % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${m}m`;
  return `${m}m`;
}

/* ─────────────────────────────────────────────────
   11. MEMORY SYSTEM
───────────────────────────────────────────────── */
const LS_VIEWED     = "love_viewed_ids";
const LS_FAVOURITES = "love_favourite_ids";
const LS_NOTIF_DATE = "love_notif_date";
const LS_KNOWN_IDS  = "love_known_ids";

// In-memory cache (already sorted by opening time)
let memoriesCache = [];
let activeFilter  = "all";
let unlockTimer   = null;

function getSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key)) || []); }
  catch { return new Set(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* storage blocked */ }
}
function lsGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); } catch { /* ignore */ } }

/* Attach the real unlock moment and keep a stable, date-ordered sequence */
function prepareMemories(list) {
  return (Array.isArray(list) ? list : [])
    .filter(m => m && m.title)
    .map((m, i) => ({
      ...m,
      id: m.id || `memory-${String(i + 1).padStart(3, "0")}`,
      _i: i,
      _at: parseDhaka(m.availableAt) || parseDhaka(m.date),
    }))
    .sort((a, b) => {
      const ta = a._at ? a._at.getTime() : Infinity;
      const tb = b._at ? b._at.getTime() : Infinity;
      return ta === tb ? a._i - b._i : ta - tb;     // oldest first, JSON order for ties
    });
}

async function loadMemories() {
  const data = await linksPromise;
  memoriesCache = prepareMemories(data || getDemoMemories());
  renderMemoryCards();
  checkForNewMemories(memoriesCache);
  renderFavourites();
  updateProgress();
  scheduleUnlockRefresh();
  setInterval(() => { refreshUnlockChips(); updateProgress(); }, 30_000);
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

/* ── 11a. Filter chips ─────────────────────────── */
function initChips() {
  const chips = $$(".chip");
  chips.forEach(chip => chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter;
    chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    renderMemoryCards();
  }));
}

/* ── 11b. Render cards ─────────────────────────── */
function renderMemoryCards() {
  const grid      = $("#memoryGrid");
  const viewedIds = getSet(LS_VIEWED);
  const favIds    = getSet(LS_FAVOURITES);

  grid.innerHTML = "";

  const visible = memoriesCache.filter(mem => {
    const locked = isLockedNow(mem);
    if (activeFilter === "open")   return !locked;
    if (activeFilter === "locked") return locked;
    if (activeFilter === "hearts") return favIds.has(mem.id);
    return true;
  });

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "grid-empty";
    empty.textContent = {
      open:   "Nothing is open yet - the first surprise is on its way! 💫",
      locked: "Everything is unlocked. You've seen all my secrets, sweetheart 💖",
      hearts: "No hearts saved yet - tap 🤍 on a memory you love.",
    }[activeFilter] || "No memories yet.";
    grid.appendChild(empty);
    return;
  }

  visible.forEach((mem, i) => {
    const isLocked = isLockedNow(mem);
    const isViewed = viewedIds.has(mem.id);
    const isFav    = favIds.has(mem.id);
    const url      = safeUrl(mem.url);

    const card = document.createElement("article");
    card.classList.add("memory-card");
    if (isLocked) card.classList.add("locked");
    card.dataset.id = mem.id;
    card.style.animationDelay = `${Math.min(i, 8) * 0.07}s`;

    const categoryHTML = mem.category
      ? `<div class="card-category-badge">✦ ${escHtml(mem.category)}</div>`
      : "";

    const openControl = isLocked || !url
      ? `<button type="button" class="card-open-btn locked-btn" data-id="${escAttr(mem.id)}">🔒 Wait for the surprise!</button>`
      : `<a class="card-open-btn" href="${escAttr(url)}" target="_blank" rel="noopener noreferrer" data-id="${escAttr(mem.id)}">Open &amp; Smile →</a>`;

    card.innerHTML = `
      ${isViewed ? `<div class="viewed-badge">Yay! Seen 💫</div>` : ""}
      <div class="card-body">
        ${categoryHTML}
        <div class="card-date-badge">📅 ${escHtml(formatMemDate(mem))}</div>
        <h3 class="card-title">${escHtml(mem.title)}</h3>
        <p class="card-desc">${escHtml(mem.description || "")}</p>
        <div class="card-actions">
          ${openControl}
          <button type="button"
                  class="fav-btn ${isFav ? "active" : ""}"
                  title="${isFav ? "Remove from your heart" : "Save to your heart"}"
                  aria-label="${isFav ? "Remove from your heart" : "Save to your heart"}"
                  aria-pressed="${isFav}"
                  data-id="${escAttr(mem.id)}">${isFav ? "💖" : "🤍"}</button>
        </div>
      </div>
      ${isLocked ? `
        <div class="lock-overlay">
          <div class="lock-icon">🔒</div>
          <span class="lock-label">Opens soon, cutie! 💕</span>
          <span class="unlock-chip" data-unlock="${mem._at ? mem._at.getTime() : ""}"></span>
        </div>` : ""}
    `;

    const openBtn = $(".card-open-btn", card);
    openBtn.addEventListener("click", e => {
      e.stopPropagation();
      const m = memoriesCache.find(x => x.id === mem.id);
      if (m) handleCardOpen(m, isLockedNow(m), card);   // re-check: it may have unlocked meanwhile
    });

    const favBtn = $(".fav-btn", card);
    favBtn.addEventListener("click", e => {
      e.stopPropagation();
      const m = memoriesCache.find(x => x.id === mem.id);
      if (m) toggleFavourite(m, favBtn);
    });

    grid.appendChild(card);
  });

  refreshUnlockChips();
}

/* live "Opens in …" label on locked cards */
function refreshUnlockChips() {
  $$(".unlock-chip").forEach(chip => {
    const ts = Number(chip.dataset.unlock);
    chip.textContent = ts ? `Opens in ${shortEta(ts - Date.now())}` : "Date to be announced";
  });
}

/* ── 11c. Handle card open ─────────────────────── */
function handleCardOpen(mem, isLocked, cardEl) {
  if (isLocked) {
    showLockedPopup(mem);
    return;
  }

  /* Unlocked cards are real <a target="_blank"> links, so the browser opens them natively
     (no popup-blocker issues). Here we only record that she has seen it.            */
  const viewedIds = getSet(LS_VIEWED);
  viewedIds.add(mem.id);
  saveSet(LS_VIEWED, viewedIds);

  if (cardEl && !$(".viewed-badge", cardEl)) {
    const badge = document.createElement("div");
    badge.className   = "viewed-badge";
    badge.textContent = "Yay! Seen 💫";
    cardEl.insertBefore(badge, cardEl.firstChild);
  }
}

/* ── 11d. Favourites ───────────────────────────── */
function toggleFavourite(mem, btn) {
  const favIds = getSet(LS_FAVOURITES);
  const nowFav = !favIds.has(mem.id);
  if (nowFav) favIds.add(mem.id); else favIds.delete(mem.id);

  btn.textContent = nowFav ? "💖" : "🤍";
  btn.classList.toggle("active", nowFav);
  btn.title = nowFav ? "Remove from your heart" : "Save to your heart";
  btn.setAttribute("aria-label", btn.title);
  btn.setAttribute("aria-pressed", String(nowFav));

  if (nowFav && !REDUCED_MOTION) {
    const rect = btn.getBoundingClientRect();
    spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ["❤️","💖","💕"], 4);
  }
  saveSet(LS_FAVOURITES, favIds);
  renderFavourites();                       // update favs panel
  if (activeFilter === "hearts") renderMemoryCards();   // keep the "Hearts" chip accurate
}

function renderFavourites() {
  const favIds = getSet(LS_FAVOURITES);
  const grid   = $("#favsGrid");
  const empty  = $("#favsEmpty");
  const favMems = memoriesCache.filter(m => favIds.has(m.id));

  $$(".fav-mini-card", grid).forEach(c => c.remove());

  if (favMems.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  favMems.forEach(m => {
    const locked = isLockedNow(m);
    const url = safeUrl(m.url);
    const card = document.createElement(!locked && url ? "a" : "div");
    card.classList.add("fav-mini-card");
    if (card.tagName === "A") { card.href = url; card.target = "_blank"; card.rel = "noopener noreferrer"; }
    if (locked) {
      // keep the surprise a surprise: don't reveal the title of a still-locked memory
      card.classList.add("is-locked");
      card.innerHTML = `
        <strong>🔒 A secret surprise</strong>
        <small>Opens ${escHtml(formatMemDate(m))}</small>
      `;
    } else {
      card.innerHTML = `
        <strong>${escHtml(m.title)}</strong>
        ${m.category ? `<span class="fav-category">✦ ${escHtml(m.category)}</span>` : ""}
        <small>${escHtml(formatMemDate(m))}</small>
      `;
    }
    grid.appendChild(card);
  });
}

/* ── 11e. Progress ring + "next surprise" ─────── */
function nextLockedMemory() {
  const now = Date.now();
  return memoriesCache.find(m => m._at && m._at.getTime() > now) || null;   // list is date-sorted
}

function updateProgress() {
  const total = memoriesCache.length;
  const open  = memoriesCache.filter(m => !isLockedNow(m)).length;
  const ring  = $("#progressRing");
  if (ring) ring.style.setProperty("--p", total ? Math.round((open / total) * 100) : 0);
  const txt = $("#progressText");
  if (txt) txt.textContent = `${open}/${total}`;

  const nextEl = $("#nextSurprise");
  if (!nextEl) return;
  const next = nextLockedMemory();
  if (!total) nextEl.textContent = "";
  else if (next) nextEl.textContent = `Next surprise opens in ${shortEta(next._at - Date.now())} 🎁`;
  else if (open === total) nextEl.textContent = "Everything is unlocked. I love you! 💖";
  else nextEl.textContent = "More surprises are coming soon 💫";
}

/* When the next memory's moment arrives, unlock it live (no page reload) */
function scheduleUnlockRefresh() {
  clearTimeout(unlockTimer);
  const next = nextLockedMemory();
  if (!next) return;
  const delay = Math.min(next._at.getTime() - Date.now() + 400, 2147483647);
  unlockTimer = setTimeout(() => {
    const stillFuture = next._at.getTime() > Date.now();
    renderMemoryCards();
    renderFavourites();
    updateProgress();
    if (!stillFuture) {
      showNotification("🔓 A new memory just opened!", "Scroll down - a fresh surprise is waiting, cutie! 💖", "#timeline");
    }
    scheduleUnlockRefresh();
  }, Math.max(delay, 400));
}

/* ── 11f. Notification system ─────────────────── */
function checkForNewMemories(memories) {
  const knownIds  = getSet(LS_KNOWN_IDS);
  const viewedIds = getSet(LS_VIEWED);
  const today     = new Date().toLocaleDateString("en-CA", { timeZone: CONFIG.timezone });  // YYYY-MM-DD (Dhaka)
  const lastNotif = lsGet(LS_NOTIF_DATE) || "";

  const newIds = memories.map(m => m.id).filter(id => !knownIds.has(id));
  saveSet(LS_KNOWN_IDS, new Set(memories.map(m => m.id)));

  // Only memories she can actually open count as "waiting" (locked ones are still secrets)
  const unseenIds = memories.filter(m => !isLockedNow(m) && !viewedIds.has(m.id)).map(m => m.id);

  if (newIds.length > 0) {
    showNotification(
      `💌 ${newIds.length} new memor${newIds.length > 1 ? "ies" : "y"} added just for you!`,
      "Scroll down to discover what's waiting, cutie! 💖",
      "#timeline"
    );
    lsSet(LS_NOTIF_DATE, today);
  } else if (unseenIds.length > 0 && lastNotif !== today) {
    showNotification(
      `💖 You have ${unseenIds.length} memor${unseenIds.length > 1 ? "ies" : "y"} waiting today…`,
      "A gentle reminder from someone who loves you! 🦋",
      "#timeline"
    );
    lsSet(LS_NOTIF_DATE, today);
  }

  requestBrowserNotification(unseenIds.length);
}

let notifTimer = null;
function showNotification(title, sub, scrollTarget) {
  const notif = $("#notification");
  $(".notification-title", notif).textContent = title;
  $("#notificationSub").textContent = sub;
  notif.classList.remove("hidden");

  $("#notificationViewBtn").onclick = () => {
    notif.classList.add("hidden");
    document.querySelector(scrollTarget)?.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth" });
    // Browsers only allow the permission prompt after a tap - so we ask here, not on page load
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  };
  $("#notificationCloseBtn").onclick = () => notif.classList.add("hidden");
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => notif.classList.add("hidden"), 8000);
}

function requestBrowserNotification(count) {
  if (!("Notification" in window) || count === 0) return;
  if (Notification.permission === "granted") {
    new Notification("💌 Memories await you!", {
      body: `You have ${count} unread memor${count > 1 ? "ies" : "y"} on your Love Timeline.`,
    });
  }
}

/* ─────────────────────────────────────────────────
   12. LOCKED POPUP with countdown
───────────────────────────────────────────────── */
let countdownInterval = null;
let popupPrevFocus = null;

function initPopup() {
  const overlay = $("#lockedPopup");
  $("#popupCloseBtn").addEventListener("click", closePopup);
  overlay.addEventListener("click", e => { if (e.target === overlay) closePopup(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closePopup();
  });
}

function showLockedPopup(mem) {
  const overlay = $("#lockedPopup");
  popupPrevFocus = document.activeElement;
  $("#popupMessage").textContent    = `"${mem.title}" will be unlocked on:`;
  $("#popupUnlockDate").textContent = mem._at
    ? `📅 ${formatMemDate(mem, true)} (Bangladesh time)`
    : "📅 Date to be announced";
  overlay.classList.remove("hidden");
  document.body.classList.add("modal-open");

  clearInterval(countdownInterval);
  if (mem._at) {
    // the SAME instant that locks the card is used for the countdown
    countdownInterval = setInterval(() => updateCountdown(mem._at), 1000);
    updateCountdown(mem._at);
  } else {
    ["cdDays", "cdHours", "cdMins", "cdSecs"].forEach(id => { document.getElementById(id).textContent = "--"; });
  }
  $("#popupCloseBtn").focus();
}

function closePopup() {
  $("#lockedPopup").classList.add("hidden");
  document.body.classList.remove("modal-open");
  clearInterval(countdownInterval);
  if (popupPrevFocus && popupPrevFocus.focus) popupPrevFocus.focus();
  popupPrevFocus = null;
}

function updateCountdown(unlockDate) {
  const diff = unlockDate - new Date();
  if (diff <= 0) { closePopup(); renderMemoryCards(); renderFavourites(); updateProgress(); return; }
  const s   = Math.floor(diff / 1000);
  const pad = n => String(n).padStart(2, "0");
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
// Only allow http(s) links
function safeUrl(link) {
  try {
    const u = new URL(link, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch { return ""; }
}
