const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const gateScreen = $("#gate-screen");
const choiceNo = $("#choice-no");
const choiceYes = $("#choice-yes");
const giftApp = $("#gift-app");
const audio = $("#bg-music");
const musicToggle = $("#music-toggle");
const lightbox = $("#lightbox");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ---------- Confetti ---------- */
const canvas = $("#confetti-canvas");
const ctx = canvas.getContext("2d");
let pieces = [];
let rafId = null;

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
sizeCanvas();
window.addEventListener("resize", sizeCanvas);

function spawnConfetti(count) {
  const colors = [
    "#f082ac",
    "#ffd9ba",
    "#d9d0ff",
    "#c9f3d7",
    "#f0b34f",
    "#ffffff",
  ];
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 160,
      vx: (Math.random() - 0.5) * 5,
      vy: 2 + Math.random() * 4,
      size: 6 + Math.random() * 8,
      tilt: Math.random() * 360,
      spin: (Math.random() - 0.5) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  if (!rafId) rafId = requestAnimationFrame(tickConfetti);
}

function tickConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces = pieces.filter((p) => p.y < canvas.height + 40);
  for (const p of pieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.tilt += p.spin;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.tilt * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
  rafId = pieces.length ? requestAnimationFrame(tickConfetti) : null;
}

function burstConfetti(ms = 1800) {
  if (reduceMotion) return;
  spawnConfetti(70);
  const timer = setInterval(() => spawnConfetti(14), 250);
  setTimeout(() => clearInterval(timer), ms);
}

/* ---------- Tiny pop sound ---------- */
let audioCtx = null;
function pop(freq = 700) {
  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch (e) {
    /* audio blocked */
  }
}

/* ---------- Music ---------- */
function setAudioState(playing) {
  musicToggle.classList.toggle("is-playing", playing);
  musicToggle.textContent = playing ? "❚❚ Pause" : "▶ Play";
  musicToggle.setAttribute(
    "aria-label",
    playing ? "Pause music" : "Play music",
  );
}

function playMusic() {
  audio.volume = 0.7;
  const p = audio.play();
  if (p) p.then(() => setAudioState(true)).catch(() => setAudioState(false));
}

musicToggle.addEventListener("click", () => {
  if (audio.paused) playMusic();
  else {
    audio.pause();
    setAudioState(false);
  }
});

/* ---------- Gate ---------- */
const maxYesScale = 2.4;
const choiceRow = choiceYes.parentElement;
let noCount = 0;
const maxNo = 3;

// Offset width ignores transforms, so this is the button's unscaled size
function growYes() {
  const wanted = 1 + (noCount * (maxYesScale - 1)) / maxNo;
  const room = choiceRow.clientWidth / choiceYes.offsetWidth;
  choiceYes.style.transform = `scale(${Math.max(1, Math.min(wanted, room))})`;
}
window.addEventListener("resize", growYes);

choiceNo.addEventListener("click", () => {
  noCount = Math.min(noCount + 1, maxNo);
  pop(520);
  choiceNo.style.transform = `scale(${Math.max(0.3, 1 - noCount * 0.25)})`;
  if (noCount >= maxNo) {
    choiceNo.classList.add("hidden");
    choiceNo.setAttribute("aria-hidden", "true");
    choiceYes.textContent = "Definitely yes";
  }
  growYes();
  choiceYes.focus({ preventScroll: true });
});

choiceYes.addEventListener("click", () => {
  pop(780);
  gateScreen.classList.add("hidden");
  document.body.classList.remove("locked");
  giftApp.hidden = false;
  window.scrollTo(0, 0);
  setupReveals();
  playMusic();
  burstConfetti(2400);
});

/* ---------- Reveals ---------- */
function setupReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
  );
  $$(".rv").forEach((el) => io.observe(el));
}

/* ---------- Stars ---------- */
(function makeStars() {
  const box = $("#stars");
  for (let i = 0; i < 42; i++) {
    const s = document.createElement("i");
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
    box.appendChild(s);
  }
})();

/* ---------- Days counter ---------- */
(function daysTalking() {
  const el = $("#days-count");
  const since = new Date(el.dataset.since + "T00:00:00");
  const days = Math.max(
    0,
    Math.floor((Date.now() - since.getTime()) / 86400000),
  );
  el.textContent = days.toLocaleString();
})();

/* ---------- Scroll progress ---------- */
const bar = $("#progress-bar");
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
}
window.addEventListener("scroll", updateProgress, { passive: true });

/* ---------- Hero buttons ---------- */
$("#start-story").addEventListener("click", () => {
  pop(620);
  $(".bridge").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#skip-notes").addEventListener("click", () => {
  pop(900);
  $("#love-notes").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- Photo strips (swipeable) ---------- */
const exhibitCaptions = [
  "city lights. Brightest thing in the frame? Not them.",
  "the 'accidentally pretty' defence",
  "festival mode: dupatta did its job",
  "'I look bad.' Objection. Lies.",
  "fairy lights borrowed your glow",
  "pink wall, pink cheeks, my heart in a pretzel",
  "red was invented for you",
  "hand on cheek. Fozu: down.",
  "bunting everywhere, you the main event",
  "saree. My brain: error 404",
  "a glow you can't fake",
  "green saree, red lips, zero chance",
  "the earrings tried. You won.",
  "lights, drapes, the fit. And still: you.",
  "the twirl. The court is in love.",
];

$$(".strip").forEach((strip) => {
  const count = Number(strip.dataset.count);
  const isExhibit = strip.dataset.label === "exhibit";
  for (let i = 1; i <= count; i++) {
    const fig = document.createElement("figure");
    fig.className = "polaroid";
    fig.style.setProperty("--r", `${i % 2 ? -2 : 2.2}deg`);
    const label = isExhibit
      ? `Exhibit ${String.fromCharCode(64 + i)}`
      : `Frame ${i} of ${count}`;
    const note = isExhibit ? exhibitCaptions[i - 1] : "";
    fig.dataset.title = label;
    fig.dataset.text = note || "One of twelve. Zero bad ones. I checked twice.";
    fig.innerHTML = `<div class="ph"><img src="assets/photos/${strip.dataset.prefix}${i}.jpg" alt="Debjani, ${label.toLowerCase()}" loading="lazy" /></div><figcaption>${
      isExhibit
        ? `${label.replace("Exhibit ", "")}: ${note}`
        : `frame ${i}/${count}`
    }</figcaption>`;
    strip.appendChild(fig);
  }
});

/* ---------- Photos: placeholder when file missing + lightbox ---------- */
$$("img[data-photo]").forEach((img) => {
  const ph = img.closest(".ph");
  const markMissing = () => {
    ph.classList.add("missing");
    ph.dataset.file = img.getAttribute("src").split("/").pop();
  };
  if (img.complete && img.naturalWidth === 0) markMissing();
  img.addEventListener("error", markMissing);
});

/* ---------- Pencil-sketch overlays built from the photo itself ---------- */
$$(".ph.sketch, .sketch-circle").forEach((host) => {
  if ($(".sketch-layer", host)) return;
  const src = $("img", host).getAttribute("src");
  const layer = document.createElement("div");
  layer.className = "sketch-layer sketch-gen";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `<img src="${src}" alt="" /><img src="${src}" alt="" />`;
  host.appendChild(layer);
});

/* ---------- Locks: couple photos (unlock-all) + private photo (confirm) ---------- */
$$('img:not(.sketch-layer)[src*="/photos/"][src*="-us-"]').forEach((img) => {
  const fig = img.closest(".polaroid, .sketch-circle");
  const host = img.closest(".ph, .sketch-circle");
  fig.classList.add("locked");
  fig.dataset.couple = "true";
  host.insertAdjacentHTML(
    "beforeend",
    '<span class="lock"><b>🔒</b>tap to unlock</span>',
  );
});

function isLocked(el) {
  return el.classList.contains("locked") && !el.classList.contains("unlocked");
}

$$(".unlock-all").forEach((btn) =>
  btn.addEventListener("click", () => {
    const items = $$("[data-couple]", btn.closest(".chap")).filter(isLocked);
    items.forEach((el) => el.classList.add("unlocked"));
    btn.disabled = true;
    btn.textContent = "Unlocked 💕";
    pop(900);
    burstConfetti(900);
  }),
);

const lbImg = $("#lightbox-image");
function openLightbox(fig) {
  const ph = $(".ph", fig);
  if (ph.classList.contains("missing")) return;
  const img = $("img:not(.sketch-layer)", fig);
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  $("#lightbox-title").textContent = fig.dataset.title || "";
  $("#lightbox-text").textContent = fig.dataset.text || "";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}
const unlockModal = $("#unlock-modal");
let pendingFig = null;
function unlockFig(fig) {
  fig.classList.add("unlocked");
  pop(900);
  burstConfetti(900);
}
function openUnlockModal(fig) {
  pendingFig = fig;
  unlockModal.classList.add("open");
  unlockModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  $("#unlock-no").focus({ preventScroll: true });
}
function closeUnlockModal() {
  pendingFig = null;
  unlockModal.classList.remove("open");
  unlockModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}
document.addEventListener("click", (e) => {
  const fig = e.target.closest(".polaroid");
  if (!fig || fig.classList.contains("mini")) return;
  if (isLocked(fig)) {
    if (fig.dataset.couple) unlockFig(fig);
    else openUnlockModal(fig);
    return;
  }
  openLightbox(fig);
});
lightbox.addEventListener("click", (e) => {
  if (e.target.dataset.close) closeLightbox();
});
$(".lightbox-close").addEventListener("click", closeLightbox);
unlockModal.addEventListener("click", (e) => {
  if (e.target.dataset.close) closeUnlockModal();
});
$("#unlock-no").addEventListener("click", closeUnlockModal);
$("#unlock-yes").addEventListener("click", () => {
  if (pendingFig) unlockFig(pendingFig);
  closeUnlockModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeLightbox();
  closeUnlockModal();
});

/* ---------- Envelopes ---------- */
$$(".envelope").forEach((btn) =>
  btn.addEventListener("click", () => {
    const open = btn.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    pop(open ? 840 : 600);
  }),
);

/* ---------- Candle ---------- */
$("#sketch-circle").addEventListener("click", (e) => {
  const on = e.currentTarget.classList.toggle("colored");
  pop(on ? 880 : 640);
  if (on) burstConfetti(900);
});
const candle = $("#candle");
function blowCandle() {
  if (candle.classList.contains("out")) return;
  candle.classList.add("out");
  $("#cake-hint").textContent = "wish received. Fozu is on it. 🤍";
  pop(980);
  burstConfetti(3200);
}
candle.addEventListener("click", blowCandle);
candle.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    blowCandle();
  }
});

/* ---------- Cursor sparkles (mouse only) ---------- */
if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
  let last = 0;
  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - last < 70) return;
    last = now;
    const s = document.createElement("div");
    s.className = "cursor-sparkle";
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 800);
  });
}

setAudioState(false);
