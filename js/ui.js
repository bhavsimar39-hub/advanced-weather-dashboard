/* ============================================================
   ATMOS — UI RENDERING + WEATHER ANIMATION ENGINE
   ============================================================ */

let useFahrenheit = false;

// ─── UNIT ────────────────────────────────────────────────────
export function setUnit(fahrenheit) { useFahrenheit = fahrenheit; }

function temp(c) {
  if (useFahrenheit) return `${Math.round(c * 9 / 5 + 32)}°F`;
  return `${Math.round(c)}°C`;
}

// ─── REFS ────────────────────────────────────────────────────
const $  = (id)  => document.getElementById(id);
const $$ = (sel) => document.querySelector(sel);

// ─── TOAST ───────────────────────────────────────────────────
export function showToast(message, type = "info") {
  const container = $("toast-container");
  const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `<i class="toast-icon fa-solid ${icons[type]}"></i><span>${message}</span>`;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add("out");
    div.addEventListener("transitionend", () => div.remove());
  }, 3400);
}

/* ============================================================
   WEATHER ANIMATION ENGINE
   ============================================================ */

let animationId   = null;   // current rAF id — cancel before starting new
let lightningTimer = null;  // thunder interval handle

function stopAnimation() {
  if (animationId)    { cancelAnimationFrame(animationId); animationId = null; }
  if (lightningTimer) { clearTimeout(lightningTimer); lightningTimer = null; }
}

// ── Classify condition string ────────────────────────────────
function classify(condition) {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm"))          return "thunder";
  if (c.includes("blizzard") || c.includes("heavy snow"))    return "blizzard";
  if (c.includes("snow") || c.includes("sleet") || c.includes("ice")) return "snow";
  if (c.includes("heavy rain") || c.includes("torrential"))  return "heavyrain";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "rain";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze"))  return "fog";
  if (c.includes("overcast") || c.includes("cloud"))         return "cloudy";
  if (c.includes("sunny") || c.includes("clear"))            return "sunny";
  return "clear";
}

// ── Day/night-aware classifier for background photos ────────
function classifyWithTime(condition, isDay) {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm"))           return "thunder";
  if (c.includes("blizzard") || c.includes("heavy snow"))     return "blizzard";
  if (c.includes("snow") || c.includes("sleet") || c.includes("ice")) return "snow";
  if (c.includes("heavy rain") || c.includes("torrential"))   return "heavyrain";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "rain";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "fog";
  if (c.includes("overcast") || c.includes("cloud"))          return "cloudy";
  // For clear/sunny: use is_day to pick day photo vs night photo
  if (c.includes("sunny") || c.includes("clear"))
    return isDay ? "sunny" : "clear";
  return isDay ? "sunny" : "clear";
}

// ── Base background gradient per type ───────────────────────
const BG = {
  thunder:   ["#050912", "#091325", "#0a0c1a"],
  blizzard:  ["#0d1626", "#1a2a44", "#0f1c30"],
  snow:      ["#0e1628", "#1c2a42", "#111e34"],
  heavyrain: ["#060b18", "#0b1528", "#070d1c"],
  rain:      ["#080e1e", "#0d1930", "#080e1c"],
  fog:       ["#0d1018", "#161e26", "#101520"],
  cloudy:    ["#0d1117", "#151c24", "#0f161e"],
  sunny:     ["#080f22", "#0e1c3a", "#081832"],
  clear:     ["#060c20", "#0d1838", "#060c1e"],
};

function drawBaseGradient(ctx, W, H, colors) {
  // With real photo backgrounds the canvas is an atmospheric overlay only.
  // Very subtle colour tints let the photo show through.
  const g1 = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, W * 0.75);
  g1.addColorStop(0, colors[1] + "55");
  g1.addColorStop(1, colors[0] + "33");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.85, H * 0.75, W * 0.45);
  g2.addColorStop(0, colors[2] + "44");
  g2.addColorStop(1, "transparent");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}

// ──────────────────────────────────────────────────────────────
//  RAIN
// ──────────────────────────────────────────────────────────────
function animateRain(canvas, ctx, count = 120, speed = 14, opacity = 0.45, angle = 12) {
  const W = canvas.width, H = canvas.height;
  const type = classify("rain");
  const drops = Array.from({ length: count }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    len:   Math.random() * 18 + 10,
    speed: Math.random() * speed * 0.5 + speed * 0.5,
    op:    Math.random() * opacity * 0.5 + opacity * 0.3,
  }));
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad), dy = Math.cos(rad);

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.rain);
    ctx.strokeStyle = `rgba(174, 214, 241, ${opacity})`;
    ctx.lineWidth = 1;
    drops.forEach((d) => {
      ctx.globalAlpha = d.op;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + dx * d.len, d.y + dy * d.len);
      ctx.stroke();
      d.x += dx * d.speed * 0.3;
      d.y += dy * d.speed * 0.6;
      if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; }
      if (d.x > W + 20) { d.x = -20; }
    });
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  SNOW
// ──────────────────────────────────────────────────────────────
function animateSnow(canvas, ctx, count = 140, heavy = false) {
  const W = canvas.width, H = canvas.height;
  const flakes = Array.from({ length: count }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    r:     Math.random() * (heavy ? 4 : 3) + 1,
    speed: Math.random() * (heavy ? 2.5 : 1.2) + 0.4,
    drift: (Math.random() - 0.5) * 0.6,
    op:    Math.random() * 0.5 + 0.3,
    wave:  Math.random() * Math.PI * 2,
  }));

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.snow);
    flakes.forEach((f) => {
      f.wave += 0.02;
      f.x += f.drift + Math.sin(f.wave) * 0.4;
      f.y += f.speed;
      if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
      if (f.x > W + 10) f.x = -10;
      if (f.x < -10)    f.x = W + 10;

      ctx.globalAlpha = f.op;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = heavy ? "rgba(200,220,255,0.9)" : "rgba(220,235,255,0.85)";
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  THUNDER
// ──────────────────────────────────────────────────────────────
function animateThunder(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  // Heavy rain underneath
  const drops = Array.from({ length: 200 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    len:   Math.random() * 22 + 14,
    speed: Math.random() * 20 + 12,
    op:    Math.random() * 0.4 + 0.2,
  }));

  let flashAlpha = 0;      // current flash brightness
  let flashDecay = false;

  function triggerLightning() {
    flashAlpha = Math.random() * 0.35 + 0.25;
    flashDecay = true;

    // Draw jagged bolt on a temporary overlay
    drawBolt(ctx, W, H);

    // Schedule double-flash
    lightningTimer = setTimeout(() => {
      flashAlpha = Math.random() * 0.25 + 0.15;
      flashDecay = true;
      // Next lightning in 3–8 seconds
      lightningTimer = setTimeout(triggerLightning, 3000 + Math.random() * 5000);
    }, 100 + Math.random() * 150);
  }

  function drawBolt(ctx, W, H) {
    const startX = W * (0.2 + Math.random() * 0.6);
    let   x = startX, y = 0;
    ctx.save();
    ctx.strokeStyle = "rgba(200,230,255,0.9)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(150,200,255,1)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < H * 0.65) {
      x += (Math.random() - 0.5) * 80;
      y += Math.random() * 50 + 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  const rad = (15 * Math.PI) / 180;
  const dx = Math.sin(rad), dy = Math.cos(rad);

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.thunder);

    // Flash overlay
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(180,210,255,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
      if (flashDecay) flashAlpha = Math.max(0, flashAlpha - 0.025);
    }

    // Rain
    ctx.lineWidth = 1.2;
    drops.forEach((d) => {
      ctx.globalAlpha = d.op;
      ctx.strokeStyle = "rgba(150,190,220,0.7)";
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + dx * d.len, d.y + dy * d.len);
      ctx.stroke();
      d.x += dx * 0.5;
      d.y += dy * d.speed * 0.6;
      if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; }
    });
    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(frame);
  }

  frame();
  lightningTimer = setTimeout(triggerLightning, 1200 + Math.random() * 1000);
}

// ──────────────────────────────────────────────────────────────
//  SUNNY / CLEAR DAY
// ──────────────────────────────────────────────────────────────
function animateSunny(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  let t = 0;

  // Floating light particles
  const particles = Array.from({ length: 40 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    r:     Math.random() * 2.5 + 0.5,
    speed: Math.random() * 0.4 + 0.1,
    op:    Math.random() * 0.4 + 0.1,
    phase: Math.random() * Math.PI * 2,
  }));

  function frame() {
    t += 0.008;
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.sunny);

    // Animated sun glow in top-right
    const sunX = W * 0.82, sunY = H * 0.12;
    const glowSize = W * 0.38 + Math.sin(t) * W * 0.02;
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowSize);
    glow.addColorStop(0,   "rgba(255,210,80,0.18)");
    glow.addColorStop(0.4, "rgba(255,180,40,0.08)");
    glow.addColorStop(1,   "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Rotating light rays
    const rayCount = 10;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + t * 0.3;
      const len = W * 0.5 + Math.sin(t + i) * W * 0.05;
      const x2 = sunX + Math.cos(angle) * len;
      const y2 = sunY + Math.sin(angle) * len;
      const ray = ctx.createLinearGradient(sunX, sunY, x2, y2);
      ray.addColorStop(0,   "rgba(255,220,100,0.07)");
      ray.addColorStop(1,   "rgba(255,220,100,0)");
      ctx.strokeStyle = ray;
      ctx.lineWidth = 18;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Floating particles
    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += Math.sin(t + p.phase) * 0.4;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.globalAlpha = p.op * (0.5 + 0.5 * Math.sin(t * 2 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,220,120,0.9)";
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  CLEAR NIGHT  (stars)
// ──────────────────────────────────────────────────────────────
function animateClearNight(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  let t = 0;
  const stars = Array.from({ length: 180 }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H * 0.75,
    r:     Math.random() * 1.4 + 0.2,
    base:  Math.random() * 0.6 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
  }));

  function frame() {
    t += 0.01;
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.clear);

    // Moon glow
    const moonX = W * 0.78, moonY = H * 0.1;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, W * 0.22);
    moonGlow.addColorStop(0,   "rgba(200,220,255,0.12)");
    moonGlow.addColorStop(0.5, "rgba(160,190,255,0.04)");
    moonGlow.addColorStop(1,   "transparent");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, W, H);

    // Stars
    stars.forEach((s) => {
      const alpha = s.base * (0.5 + 0.5 * Math.sin(t * s.speed * 100 + s.phase));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,235,255,1)";
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  CLOUDY / OVERCAST
// ──────────────────────────────────────────────────────────────
function animateCloudy(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  let t = 0;
  const particles = Array.from({ length: 60 }, () => ({
    x:     Math.random() * W * 1.4 - W * 0.2,
    y:     Math.random() * H * 0.5,
    r:     Math.random() * 60 + 30,
    speed: Math.random() * 0.15 + 0.05,
    op:    Math.random() * 0.06 + 0.02,
  }));

  function frame() {
    t += 0.003;
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.cloudy);

    particles.forEach((p) => {
      p.x += p.speed;
      if (p.x > W + p.r * 2) p.x = -p.r * 2;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0,   `rgba(180,200,220,${p.op})`);
      g.addColorStop(1,   "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  FOG / MIST
// ──────────────────────────────────────────────────────────────
function animateFog(canvas, ctx) {
  const W = canvas.width, H = canvas.height;
  let t = 0;
  const layers = Array.from({ length: 5 }, (_, i) => ({
    y:     H * (0.1 + i * 0.18),
    speed: 0.06 + i * 0.02,
    op:    0.04 + i * 0.015,
    offset: Math.random() * W,
  }));

  function frame() {
    t += 0.004;
    ctx.clearRect(0, 0, W, H);
    drawBaseGradient(ctx, W, H, BG.fog);

    // Drifting fog bands
    layers.forEach((l) => {
      l.offset += l.speed;
      if (l.offset > W) l.offset -= W;
      const g = ctx.createLinearGradient(0, l.y - 80, 0, l.y + 80);
      g.addColorStop(0,   "transparent");
      g.addColorStop(0.5, `rgba(190,210,225,${l.op})`);
      g.addColorStop(1,   "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, l.y - 80, W, 160);
    });

    // Fine mist particles
    ctx.globalAlpha = 0.15 + 0.05 * Math.sin(t);
    const mist = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    mist.addColorStop(0, "rgba(180,200,215,0.12)");
    mist.addColorStop(1, "transparent");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, W, H * 0.6);
    ctx.globalAlpha = 1;

    animationId = requestAnimationFrame(frame);
  }
  frame();
}

// ──────────────────────────────────────────────────────────────
//  CSS GRADIENT BACKGROUNDS  — no external images, instant,
//  pixel-perfect weather moods exactly like Apple Weather.
//  Each type has multiple gradient variants picked randomly.
// ──────────────────────────────────────────────────────────────

const BG_GRADIENTS = {
  // ☀️ Sunny day — warm sky blue fading to golden horizon
  sunny: [
    `linear-gradient(175deg, #1a6fa8 0%, #2e9fdb 25%, #fbb142 70%, #f97316 100%)`,
    `linear-gradient(175deg, #0e5f9a 0%, #1e8ac8 30%, #f9a825 65%, #fb8c00 100%)`,
    `linear-gradient(175deg, #1565c0 0%, #42a5f5 35%, #ffcc02 65%, #ff8f00 100%)`,
  ],

  // 🌙 Clear night — deep navy, stars twinkling
  clear: [
    `linear-gradient(180deg, #020818 0%, #050f2e 30%, #0a1a4a 65%, #0d2060 100%)`,
    `linear-gradient(180deg, #010610 0%, #030d28 35%, #071540 65%, #0c1e55 100%)`,
    `linear-gradient(180deg, #000510 0%, #040b22 30%, #081230 60%, #102050 100%)`,
  ],

  // 🌅 Partly cloudy day — soft blue with white cloud tones
  cloudy: [
    `linear-gradient(180deg, #4a6580 0%, #6b8fa8 25%, #8aafc5 55%, #b0c8d8 100%)`,
    `linear-gradient(180deg, #3d5a72 0%, #5c7d96 30%, #7fa0b8 60%, #a8c2d2 100%)`,
    `linear-gradient(180deg, #4e6b84 0%, #6e8fa6 30%, #8daec4 60%, #b2cad8 100%)`,
  ],

  // 🌧️ Rain — moody blue-grey
  rain: [
    `linear-gradient(180deg, #1a2a3a 0%, #243545 30%, #2e4055 65%, #1e3048 100%)`,
    `linear-gradient(180deg, #162230 0%, #20303e 30%, #28404e 65%, #1c2e40 100%)`,
    `linear-gradient(180deg, #1c2e3e 0%, #263a4a 30%, #304858 65%, #223040 100%)`,
  ],

  // ⛈️ Heavy rain — near black storm
  heavyrain: [
    `linear-gradient(180deg, #0e1520 0%, #161e2a 30%, #1c2535 65%, #101820 100%)`,
    `linear-gradient(180deg, #0a1018 0%, #121820 30%, #181f28 65%, #0e1520 100%)`,
    `linear-gradient(180deg, #0c1218 0%, #141c24 30%, #1a2230 65%, #0e1520 100%)`,
  ],

  // ⚡ Thunder — purple-black dramatic
  thunder: [
    `linear-gradient(180deg, #080510 0%, #120a20 30%, #1a0f30 55%, #240a20 100%)`,
    `linear-gradient(180deg, #06040e 0%, #0e0818 30%, #180d28 55%, #200818 100%)`,
    `linear-gradient(180deg, #0a0612 0%, #140a1e 30%, #1c1030 55%, #260c22 100%)`,
  ],

  // ❄️ Snow — pale icy blue-white
  snow: [
    `linear-gradient(180deg, #a8c4dc 0%, #c0d8ec 30%, #d8ecf8 65%, #e8f4fc 100%)`,
    `linear-gradient(180deg, #9ab8d4 0%, #b4ceE4 30%, #cce0f0 65%, #dff0fa 100%)`,
    `linear-gradient(180deg, #b0c8e0 0%, #c8dcea 30%, #daeef8 65%, #ecf8ff 100%)`,
  ],

  // 🌨️ Blizzard — white-grey whiteout
  blizzard: [
    `linear-gradient(180deg, #8898a8 0%, #a0b2c0 30%, #c0cfd8 65%, #d8e5ec 100%)`,
    `linear-gradient(180deg, #7a8c9c 0%, #96a8b6 30%, #b4c4cc 65%, #ccd8e0 100%)`,
    `linear-gradient(180deg, #8090a0 0%, #98aab8 30%, #b8c8d0 65%, #d0dce4 100%)`,
  ],

  // 🌫️ Fog — muted grey-green, flat visibility
  fog: [
    `linear-gradient(180deg, #5a6458 0%, #6e7868 30%, #828c7a 65%, #9aa490 100%)`,
    `linear-gradient(180deg, #525c50 0%, #666e60 30%, #7a8272 65%, #909888 100%)`,
    `linear-gradient(180deg, #5c6660 0%, #707a70 30%, #848e84 65%, #9ca89a 100%)`,
  ],
};

function pickGradient(type) {
  const arr = BG_GRADIENTS[type] || BG_GRADIENTS.clear;
  return arr[Math.floor(Math.random() * arr.length)];
}

let _bgPhotoEl   = null;  // current visible photo div
let _bgPhotoEl2  = null;  // incoming photo div (for crossfade)
let _bgTintEl    = null;  // tint overlay div
let _bgContainer = null;  // wrapper

function ensureBgElements() {
  if (_bgContainer) return;

  _bgContainer = document.createElement("div");
  _bgContainer.id = "weather-bg-container";
  document.body.prepend(_bgContainer);

  _bgPhotoEl  = document.createElement("div");
  _bgPhotoEl.className = "weather-bg-photo";
  _bgContainer.appendChild(_bgPhotoEl);

  _bgPhotoEl2 = document.createElement("div");
  _bgPhotoEl2.className = "weather-bg-photo";
  _bgContainer.appendChild(_bgPhotoEl2);

  _bgTintEl = document.createElement("div");
  _bgTintEl.id = "weather-bg-tint";
  _bgContainer.appendChild(_bgTintEl);
}

function setBgPhoto(type) {
  ensureBgElements();
  const gradient = pickGradient(type);

  // Apply gradient directly — instant, no network, always correct
  _bgPhotoEl.style.background  = gradient;
  _bgPhotoEl.style.opacity     = "1";
  _bgPhotoEl2.style.background = gradient;
  _bgPhotoEl2.style.opacity    = "0";

  // No tint needed — gradient IS the background
  _bgTintEl.style.background = "transparent";
  document.body.style.setProperty("--weather-bg", gradient);
}

// ──────────────────────────────────────────────────────────────
//  PUBLIC: updateBackground
// ──────────────────────────────────────────────────────────────
export function updateBackground(condition, isDay = true) {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Stop any running animation
  stopAnimation();

  // Resize canvas to viewport
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // Handle resize — restart on window resize
  window._weatherCondition = condition;
  window._weatherIsDay     = isDay;
  window.onresize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    updateBackground(window._weatherCondition || condition, window._weatherIsDay ?? true);
  };

  // Pass is_day into classify so clear night ≠ sunny
  const type = classifyWithTime(condition, isDay);

  // ── Tag body with weather type for CSS accent tints ──
  document.body.dataset.weather = type;

  // ── Set photo background first ──
  setBgPhoto(type);

  // ── Then layer canvas animation on top ──
  switch (type) {
    case "thunder":   animateThunder(canvas, ctx);          break;
    case "blizzard":  animateSnow(canvas, ctx, 220, true);  break;
    case "snow":      animateSnow(canvas, ctx, 140, false); break;
    case "heavyrain": animateRain(canvas, ctx, 220, 20, 0.55, 18); break;
    case "rain":      animateRain(canvas, ctx, 130, 14, 0.42, 12); break;
    case "fog":       animateFog(canvas, ctx);              break;
    case "cloudy":    animateCloudy(canvas, ctx);           break;
    case "sunny":     animateSunny(canvas, ctx);            break;
    default:          animateClearNight(canvas, ctx);       break;
  }
}

/* ============================================================
   MAIN UI UPDATE
   ============================================================ */
export function updateUI(data) {
  const { location, current, forecast } = data;

  $("city-name").textContent        = `${location.name}, ${location.country}`;
  $("temperature").textContent      = Math.round(current.temp_c);
  $("weather-condition").textContent = current.condition.text;

  // Weather icon hidden — background gradient shows the weather mood

  const today = forecast.forecastday[0].day;
  $("temp-max").textContent = temp(today.maxtemp_c);
  $("temp-min").textContent = temp(today.mintemp_c);

  $("humidity").textContent     = `${current.humidity}%`;
  $("humidity-bar").style.width = `${current.humidity}%`;
  $("wind-speed").textContent   = `${current.wind_kph} km/h`;
  $("feels-like").textContent   = temp(current.feelslike_c);
  $("pressure").textContent     = `${current.pressure_mb} hPa`;
  $("visibility").textContent   = `${current.vis_km} km`;

  const needle = $("wind-needle");
  if (needle) needle.style.transform = `translate(-50%, -100%) rotate(${current.wind_degree}deg)`;

  if (current.air_quality) {
    const pm25   = current.air_quality.pm2_5;
    const aqiEl  = $("aqi");
    aqiEl.textContent = pm25.toFixed(1);
    aqiEl.style.color = pm25 < 12 ? "var(--success)" : pm25 < 35 ? "var(--accent-warm)" : "var(--danger)";
  } else {
    $("aqi").textContent = "--";
  }

  const uv     = today.uv;
  $("uv-index").textContent = uv ?? "--";
  const uvFill = $("uv-bar-fill");
  if (uvFill && uv != null) uvFill.style.width = `${Math.min((uv / 11) * 100, 100)}%`;

  const astro = forecast.forecastday[0].astro;
  $("sunrise").textContent = astro.sunrise;
  $("sunset").textContent  = astro.sunset;
  updateSunArc(astro.sunrise, astro.sunset);

  renderForecast(forecast.forecastday);
  renderHourly(forecast.forecastday[0].hour);
  renderLifestyleTips(data);
  updateBackground(current.condition.text, current.is_day === 1);
}

/* ============================================================
   SUN ARC
   ============================================================ */
function parseTime(str) {
  const [time, mer] = str.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function updateSunArc(riseStr, setStr) {
  const arcFill = $("arc-fill");
  const arcSun  = $("arc-sun");
  if (!arcFill || !arcSun) return;

  const now  = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const rise = parseTime(riseStr);
  const set  = parseTime(setStr);

  const progress    = Math.max(0, Math.min(1, (nowM - rise) / (set - rise)));
  const circumference = 283;
  arcFill.style.strokeDashoffset = circumference - progress * circumference;

  const angle = Math.PI - progress * Math.PI;
  const cx = 110, cy = 110, r = 90;
  arcSun.setAttribute("cx", (cx + r * Math.cos(angle)).toFixed(1));
  arcSun.setAttribute("cy", (cy - r * Math.sin(angle)).toFixed(1));
}

/* ============================================================
   FORECAST
   ============================================================ */
function renderForecast(days) {
  const container = $("forecast-container");
  container.innerHTML = "";
  days.forEach((day) => {
    const card    = document.createElement("div");
    card.className = "forecast-card";
    const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
    card.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <img src="https:${day.day.condition.icon}" alt="forecast" />
      <span class="forecast-condition">${day.day.condition.text}</span>
      <div class="forecast-temp-range">
        <span class="forecast-temp-high">${temp(day.day.maxtemp_c)}</span>
        <span class="forecast-temp-low">${temp(day.day.mintemp_c)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ============================================================
   HOURLY
   ============================================================ */
function renderHourly(hours) {
  const container = $("hourly-container");
  container.innerHTML = "";
  const nowH = new Date().getHours();
  hours.forEach((hour) => {
    const h    = parseInt(hour.time.split(" ")[1]);
    const card = document.createElement("div");
    card.className = "hour-card" + (h === nowH ? " now" : "");
    const label = h === nowH ? "Now" : hour.time.split(" ")[1];
    card.innerHTML = `
      <span class="hour-time">${label}</span>
      <img src="https:${hour.condition.icon}" alt="hour" />
      <span class="hour-temp">${temp(hour.temp_c)}</span>
      <span class="hour-rain">💧 ${hour.chance_of_rain}%</span>
    `;
    container.appendChild(card);
  });
}

/* ============================================================
   FAVORITES
   ============================================================ */
export function renderFavorites(cities, onOpen, onRemove) {
  const container = $("favorites-container");
  if (!cities || cities.length === 0) {
    container.innerHTML = '<p class="empty-state">No favorites yet. Add a city!</p>';
    return;
  }
  container.innerHTML = "";
  cities.forEach((city) => {
    const card = document.createElement("div");
    card.className = "fav-city-card";
    card.innerHTML = `
      <span class="fav-city-name">📍 ${city}</span>
      <div class="fav-actions">
        <button class="open-btn"   title="Open"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
        <button class="remove-btn" title="Remove"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    card.querySelector(".open-btn").addEventListener("click",   () => onOpen(city));
    card.querySelector(".remove-btn").addEventListener("click", () => onRemove(city));
    container.appendChild(card);
  });
}

/* ============================================================
   RECENT SEARCHES
   ============================================================ */
export function renderRecent(searches, onSearch, loggedIn = false) {
  const container = $("recent-container");
  if (!container) return;
  container.innerHTML = "";

  if (!loggedIn) {
    container.innerHTML = `
      <div class="empty-auth-state">
        <i class="fa-regular fa-clock"></i>
        <p>Sign in to see your search history</p>
      </div>`;
    return;
  }

  if (!searches || searches.length === 0) {
    container.innerHTML = '<p class="empty-state">No recent searches yet</p>';
    return;
  }

  searches.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = "recent-btn";
    btn.innerHTML = `<span>${s.city || s}</span><small>${s.country || ""}</small>`;
    btn.addEventListener("click", () => onSearch(s.city || s));
    container.appendChild(btn);
  });
}


/* ============================================================
   LIFESTYLE TIPS ENGINE
   ============================================================ */

const TIPS = {
  // ── CLOTHING ─────────────────────────────────────────────
  clothing: {
    icon: "fa-shirt",
    label: "What to Wear",
    color: "#818cf8",
    get: (data) => {
      const t = data.current.temp_c;
      const rain = data.forecast.forecastday[0].day.daily_chance_of_rain;
      const wind = data.current.wind_kph;
      const tips = [];
      if (t >= 35)        tips.push("Light, loose cotton or linen clothing");
      else if (t >= 28)   tips.push("Breathable, light-coloured clothes");
      else if (t >= 20)   tips.push("Light layers — a t-shirt should do");
      else if (t >= 12)   tips.push("A light jacket or sweatshirt");
      else if (t >= 4)    tips.push("Warm layers — coat recommended");
      else                tips.push("Heavy winter coat, thermals inside");
      if (rain > 60)      tips.push("Carry a waterproof jacket or umbrella");
      else if (rain > 30) tips.push("Keep an umbrella handy just in case");
      if (wind > 40)      tips.push("Avoid loose scarves or hats outdoors");
      if (t >= 30)        tips.push("Wear sunscreen SPF 30+");
      return tips;
    },
  },

  // ── OUTDOOR ACTIVITY ─────────────────────────────────────
  activity: {
    icon: "fa-person-running",
    label: "Outdoor Activity",
    color: "#34d399",
    get: (data) => {
      const t = data.current.temp_c;
      const cond = data.current.condition.text.toLowerCase();
      const rain = data.forecast.forecastday[0].day.daily_chance_of_rain;
      const uv = data.forecast.forecastday[0].day.uv;
      const wind = data.current.wind_kph;
      const tips = [];

      if (cond.includes("thunder") || cond.includes("storm")) {
        tips.push("Stay indoors — thunderstorm risk");
        tips.push("Avoid open fields and tall trees");
      } else if (rain > 70) {
        tips.push("Heavy rain expected — best to stay in");
        tips.push("Good day for indoor workouts");
      } else if (rain > 40) {
        tips.push("Outdoor plans may get rained out");
        tips.push("Morning hours might be drier");
      } else if (t >= 38) {
        tips.push("Avoid strenuous activity between 11am–4pm");
        tips.push("Exercise early morning or after sunset");
      } else if (t >= 28) {
        tips.push("Great for outdoor activities — stay hydrated");
        tips.push("Ideal for swimming or water sports");
      } else if (t >= 15) {
        tips.push("Perfect weather for running, cycling, hiking");
        tips.push("Great conditions for all outdoor sports");
      } else if (t >= 5) {
        tips.push("Cool but fine for jogging or brisk walks");
        tips.push("Warm up properly before exercising");
      } else {
        tips.push("Very cold — limit outdoor exposure");
        tips.push("Layer up well if you must go out");
      }
      if (uv >= 8)  tips.push("High UV — reapply sunscreen every 2 hrs");
      if (wind > 50) tips.push("Strong winds — avoid cycling or hiking");
      return tips;
    },
  },

  // ── HEALTH ───────────────────────────────────────────────
  health: {
    icon: "fa-kit-medical",
    label: "Health & Wellness",
    color: "#f87171",
    get: (data) => {
      const t = data.current.temp_c;
      const humidity = data.current.humidity;
      const aqi = data.current.air_quality?.pm2_5;
      const cond = data.current.condition.text.toLowerCase();
      const tips = [];

      if (aqi != null) {
        if (aqi > 55)       tips.push("Poor air quality — limit outdoor exposure");
        else if (aqi > 35)  tips.push("Moderate air quality — sensitive groups be cautious");
        else                tips.push("Air quality is good today");
      }
      if (t >= 35)          tips.push("High heat risk — drink 3–4L of water");
      else if (t >= 28)     tips.push("Stay well hydrated throughout the day");
      if (humidity > 80)    tips.push("High humidity — watch for heat exhaustion signs");
      else if (humidity < 25) tips.push("Very dry air — use a moisturiser and lip balm");
      if (cond.includes("fog") || cond.includes("mist"))
                            tips.push("Foggy conditions may worsen asthma symptoms");
      if (cond.includes("snow") || t < 2)
                            tips.push("Hypothermia risk — cover extremities");
      if (t >= 30)          tips.push("Check on elderly neighbours in the heat");
      if (!tips.length)     tips.push("Conditions are comfortable — enjoy the day!");
      return tips;
    },
  },

  // ── TRAVEL ───────────────────────────────────────────────
  travel: {
    icon: "fa-car",
    label: "Travel & Commute",
    color: "#fbbf24",
    get: (data) => {
      const cond = data.current.condition.text.toLowerCase();
      const vis = data.current.vis_km;
      const wind = data.current.wind_kph;
      const rain = data.forecast.forecastday[0].day.daily_chance_of_rain;
      const t = data.current.temp_c;
      const tips = [];

      if (cond.includes("thunder") || cond.includes("storm"))
                            tips.push("Avoid travel if possible — storm conditions");
      if (cond.includes("snow") || cond.includes("blizzard")) {
        tips.push("Roads may be icy — drive slowly, extra distance");
        tips.push("Allow extra travel time — delays likely");
      }
      if (cond.includes("fog") || vis < 2) {
        tips.push("Very low visibility — use fog lights, slow down");
        tips.push("Keep safe following distance in fog");
      } else if (vis < 5)   tips.push("Reduced visibility — drive carefully");
      if (rain > 60)        tips.push("Wet roads — increase braking distance");
      if (wind > 60)        tips.push("High winds — avoid bridges and exposed roads");
      if (t >= 38)          tips.push("Check tyre pressure — heat causes expansion");
      if (!tips.length) {
        tips.push("Good travel conditions today");
        tips.push("Roads should be clear and safe");
      }
      return tips;
    },
  },

  // ── FOOD & DRINK ─────────────────────────────────────────
  food: {
    icon: "fa-utensils",
    label: "Food & Drink",
    color: "#fb923c",
    get: (data) => {
      const t = data.current.temp_c;
      const cond = data.current.condition.text.toLowerCase();
      const tips = [];

      if (t >= 35) {
        tips.push("Cold drinks, smoothies, and salads are ideal");
        tips.push("Avoid heavy meals — your appetite may be low");
        tips.push("Coconut water or electrolyte drinks recommended");
      } else if (t >= 26) {
        tips.push("Light meals — grilled food, fresh salads");
        tips.push("Stay extra hydrated with water and juices");
      } else if (t >= 16) {
        tips.push("Perfect weather for a coffee or tea outdoors");
        tips.push("Balanced meals — hearty but not too heavy");
      } else if (t >= 6) {
        tips.push("Great day for soups, stews, or hot drinks");
        tips.push("Warm oats or porridge for breakfast");
      } else {
        tips.push("Hot comfort food to stay warm");
        tips.push("Herbal teas and broths are great today");
      }
      if (cond.includes("rain") || cond.includes("drizzle"))
        tips.push("Cosy day — perfect for baking or cooking at home");
      return tips;
    },
  },
};

export function renderLifestyleTips(data) {
  const grid = document.getElementById("lifestyle-grid");
  const loc  = document.getElementById("lifestyle-location");
  if (!grid) return;

  if (loc) loc.textContent = `${data.location.name}, ${data.location.country}`;

  grid.innerHTML = "";

  Object.values(TIPS).forEach((tip) => {
    const items = tip.get(data);
    if (!items.length) return;

    const card = document.createElement("div");
    card.className = "lifestyle-card";
    card.style.setProperty("--tip-color", tip.color);

    card.innerHTML = `
      <div class="lifestyle-card-header">
        <div class="lifestyle-icon" style="background:${tip.color}22; color:${tip.color}">
          <i class="fa-solid ${tip.icon}"></i>
        </div>
        <span class="lifestyle-card-title">${tip.label}</span>
      </div>
      <ul class="lifestyle-tips-list">
        ${items.map(t => `<li><i class="fa-solid fa-circle-dot"></i>${t}</li>`).join("")}
      </ul>
    `;
    grid.appendChild(card);
  });
}
/* ============================================================
   LIVE CLOCK
   ============================================================ */
export function startClock() {
  function tick() {
    const now   = new Date();
    const clock = $("live-clock");
    const date  = $("live-date");
    if (clock) clock.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    if (date)  date.textContent  = now.toLocaleDateString("en-US",  { weekday: "long", month: "short", day: "numeric" });
  }
  tick();
  setInterval(tick, 1000);
}