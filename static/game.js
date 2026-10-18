/* Noor Quest: a small platform game. Run, jump, stomp the blobs, collect stars, and hit the ؟ blocks:
   each one asks a question about the Quran. Right answers give points and hearts; wrong answers cost a heart.
   Works offline (questions are made from the Quran data on the device). */
"use strict";
(() => {
const TS = 32, ROWS = 14;
const GRAV = 1900, RUN = 260, ACC = 1800, FRIC = 2200, JUMP = 640;

/* ---------- questions ---------- */
let POOL = null;                                                            // surahs loaded for questions
async function loadPool(level) {
  const idx = await index();
  const want = level < 3 ? idx.surahs.filter(s => s.n >= 78 || s.n === 1) : level < 6 ? idx.surahs.filter(s => s.n >= 50 || s.n === 1 || s.n === 36 || s.n === 18) : idx.surahs;
  const out = []; for (const s of want) out.push(await surah(s.n));
  POOL = { idx, list: out }; return POOL;
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const bare = w => w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ]/g, "");
function words(t) { return t.split(/\s+/).filter(w => bare(w).replace(/[^ء-ي]/g, "").length > 0); }
function makeQuestion(level) {
  const { idx, list } = POOL, sn = s => isAr() ? s.name : s.en;
  const types = level < 2 ? ["which", "which", "complete", "type"] : ["which", "complete", "complete", "count", "type", "next"];
  const type = pick(types);
  if (type === "which") {
    const s = pick(list), a = pick(s.ayahs);
    const opts = new Set([s.n]); while (opts.size < 4) opts.add(pick(list).n);
    return { q: L("Which surah is this ayah from?", "من أي سورة هذه الآية؟"), ar: a.ar, opts: shuffle([...opts]).map(n => ({ t: sn(idx.surahs[n - 1]), ok: n === s.n })) };
  }
  if (type === "complete") {
    let s, a, w; do { s = pick(list); a = pick(s.ayahs); w = words(a.ar); } while (w.length < 4);
    const ans = w[w.length - 1], seen = new Set([bare(ans)]), opts = [{ t: ans, ok: true }];
    while (opts.length < 4) { const o = pick(words(pick(pick(list).ayahs).ar).slice(-1)); if (o && !seen.has(bare(o))) { seen.add(bare(o)); opts.push({ t: o, ok: false }); } }
    return { q: L("Complete the ayah", "أكمل الآية"), ar: w.slice(0, -1).join(" ") + " …", opts: shuffle(opts), arOpts: true, ref: `${sn(idx.surahs[s.n - 1])} ${s.n}:${a.n}` };
  }
  if (type === "count") {
    const s = pick(list), c = s.count, opts = new Set([c]);
    while (opts.size < 4) { const v = Math.max(3, c + pick([-3, -2, -1, 1, 2, 3, 5, -5, 7])); opts.add(v); }
    return { q: L(`How many ayahs are in Surah ${s.en}?`, `كم عدد آيات سورة ${idx.surahs[s.n - 1].name}؟`), opts: shuffle([...opts]).map(v => ({ t: num(v), ok: v === c })) };
  }
  if (type === "next") {
    const s = pick(list.filter(x => x.n < 114)), nx = idx.surahs[s.n], opts = new Set([nx.n]);
    while (opts.size < 4) { const o = Math.min(114, Math.max(1, s.n + pick([-2, -1, 2, 3, 4, 10, -6]))); if (o !== s.n) opts.add(o); }
    return { q: L(`Which surah comes after ${s.en}?`, `ما السورة التي بعد سورة ${idx.surahs[s.n - 1].name}؟`), opts: shuffle([...opts]).map(n => ({ t: sn(idx.surahs[n - 1]), ok: n === nx.n })) };
  }
  const s = pick(list), mec = s.type === "Meccan";
  return { q: L(`Is Surah ${s.en} Meccan or Medinan?`, `هل سورة ${idx.surahs[s.n - 1].name} مكية أم مدنية؟`), opts: [{ t: L("Meccan", "مكية"), ok: mec }, { t: L("Medinan", "مدنية"), ok: !mec }] };
}

/* ---------- level ---------- */
function makeLevel(n) {
  const W = 110 + n * 25, G = Array.from({ length: ROWS }, () => Array(W).fill(" "));
  const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < ROWS) G[y][x] = c; };
  for (let x = 0; x < W; x++) { set(x, 12, "#"); set(x, 13, "#"); }
  const enemies = [];
  let x = 12, qs = 0;
  while (x < W - 16) {
    const r = Math.random();
    if (r < 0.22) {                                                            // a gap
      const w = 2 + Math.floor(Math.random() * Math.min(3, 1 + n / 2));
      for (let i = 0; i < w; i++) { set(x + i, 12, " "); set(x + i, 13, " "); }
      for (let i = -1; i <= w; i++) set(x + i, 8, Math.random() < .5 ? "o" : " ");
      x += w + 3;
    } else if (r < 0.52) {                                                     // bricks with a question block
      const y = 8, w = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < w; i++) set(x + i, y, "B");
      set(x + Math.floor(w / 2), y, "?"); qs++;
      if (Math.random() < .5) for (let i = 0; i < w; i++) set(x + i, y - 3, "o");
      if (Math.random() < .5 + n * .05) enemies.push({ x: (x + w + 1) * TS, y: 11 * TS });
      x += w + 3;
    } else if (r < 0.68) {                                                     // stairs
      const h = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < h; i++) for (let j = 0; j <= i; j++) set(x + i, 11 - j, "#");
      for (let i = 0; i < h; i++) for (let j = 0; j <= h - 1 - i; j++) set(x + h + 1 + i, 11 - j, "#");
      set(x + h, 11 - h - 2, "?"); qs++;
      x += 2 * h + 4;
    } else if (r < 0.82) {                                                     // a lone question block and coins
      set(x + 1, 8, "?"); qs++; for (let i = 0; i < 4; i++) set(x + 4 + i, 10, "o");
      enemies.push({ x: (x + 6) * TS, y: 11 * TS });
      x += 9;
    } else {                                                                   // a high platform
      const w = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < w; i++) { set(x + i, 9, "B"); set(x + 2 + i, 5, Math.random() < .6 ? "B" : " "); }
      set(x + 2 + Math.floor(w / 2), 5, "?"); qs++; for (let i = 0; i < w; i++) set(x + 2 + i, 3, "o");
      x += w + 5;
    }
  }
  for (let y = 0; y < 12; y++) for (let i = W - 14; i < W; i++) if (G[y][i] !== " ") G[y][i] = " ";
  set(W - 6, 11, "F");
  return { G, W, enemies: enemies.map(e => ({ ...e, vx: -60 - n * 8, vy: 0, alive: true, squash: 0 })), qs };
}

/* ---------- the game ---------- */
let G = null;
function viewGame() {
  const best = store.get("gameBest", 0);
  app.innerHTML = topbar(`<h1>${L("Noor Quest", "رحلة نور")}</h1>`) + `<div class="wrap">
    <div class="gwrap" id="gwrap"><canvas id="gc"></canvas><div class="gover" id="gover"></div></div>
    <div class="gpad"><button data-k="left" aria-label="Left">◀</button><button data-k="right" aria-label="Right">▶</button><span></span><button data-k="jump" class="j" aria-label="Jump">⤒</button></div>
    <p class="lead" style="font-size:12.5px;margin-top:10px">${L("Arrows or A/D to run, Space or ↑ to jump. Hit the ؟ blocks from below to get a Quran question.", "الأسهم أو A/D للجري، والمسافة أو ↑ للقفز. اضرب صناديق ؟ من الأسفل لتظهر أسئلة عن القرآن.")} · ${L("Best", "الأفضل")}: ${num(best)}</p></div>`;
  nav("more");
  startScreen();
}
function overlay(html) { const o = $("#gover"); o.innerHTML = html; o.style.display = html ? "flex" : "none"; }
function startScreen() {
  overlay(`<div class="gcard"><div style="font-size:44px">🌙</div><h2>${L("Noor Quest", "رحلة نور")}</h2>
    <p>${L("Run to the green flag. Every ؟ block is a question about the Quran: answer right for points and hearts.", "اركض حتى العلم الأخضر. كل صندوق ؟ سؤال عن القرآن: أجب صحيحًا لتربح النقاط والقلوب.")}</p>
    <button class="btn wide" id="gStart">${ICON.play}${L("Play", "العب")}</button></div>`);
  $("#gStart").onclick = () => newGame();
}
async function newGame(level = 1, keep) {
  overlay(`<div class="gcard"><h2>${L("Level", "المرحلة")} ${num(level)}</h2><p>${L("Loading questions…", "جارٍ تجهيز الأسئلة…")}</p></div>`);
  await loadPool(level);
  const L0 = makeLevel(level);
  G = Object.assign({ level, score: 0, hearts: 3, stars: 0, right: 0, asked: 0 }, keep || {}, {
    map: L0.G, W: L0.W, enemies: L0.enemies, qTotal: L0.qs, right: 0, asked: 0,
    p: { x: 3 * TS, y: 10 * TS, vx: 0, vy: 0, w: 22, h: 28, ground: false, face: 1, coyote: 0, inv: 0 }, cam: 0, keys: {}, pause: false, done: false,
    parts: [], pops: [], check: 3 * TS, time: 0,
  });
  overlay("");
  bindInput(); loop();
}
function bindInput() {
  const k = G.keys;
  const map = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowUp: "jump", KeyW: "jump", Space: "jump" };
  const down = e => { const m = map[e.code]; if (!m || !G) return; e.preventDefault(); if (m === "jump" && !k.jump) k.jumpPressed = true; k[m] = true; };
  const up = e => { const m = map[e.code]; if (m && G) k[m] = false; };
  window.onkeydown = down; window.onkeyup = up;
  app.querySelectorAll(".gpad button").forEach(b => {
    const m = b.dataset.k;
    b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); if (m === "jump") k.jumpPressed = true; k[m] = true; };
    b.onpointerup = b.onpointercancel = () => { k[m] = false; };
  });
}
window.addEventListener("hashchange", () => { if (G && !location.hash.startsWith("#/game")) { G.done = true; G = null; window.onkeydown = window.onkeyup = null; } });

const solid = c => c === "#" || c === "B" || c === "?" || c === "U";
const tileAt = (tx, ty) => (!G || ty < 0 || ty >= ROWS || tx < 0 || tx >= G.W) ? (ty >= ROWS ? " " : tx < 0 ? "#" : " ") : G.map[ty][tx];

let raf = 0, last = 0;
function loop() {
  cancelAnimationFrame(raf); last = performance.now();
  const step = now => {
    if (!G || G.done) return;
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (!G.pause) update(dt);
    draw(); raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function update(dt) {
  const p = G.p, k = G.keys; G.time += dt;
  // run
  const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  if (dir) { p.vx += dir * ACC * dt; p.face = dir; } else { const f = FRIC * dt; p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f; }
  p.vx = Math.max(-RUN, Math.min(RUN, p.vx));
  // jump (with a little grace after leaving a ledge, and a lower jump when the button is let go)
  p.coyote = p.ground ? 0.1 : Math.max(0, p.coyote - dt);
  if (k.jumpPressed && p.coyote > 0) { p.vy = -JUMP; p.coyote = 0; p.ground = false; sfx("jump"); }
  k.jumpPressed = false;
  if (!k.jump && p.vy < -220) p.vy = -220;
  p.vy = Math.min(900, p.vy + GRAV * dt);
  // move and collide, x then y
  p.x += p.vx * dt; collide(p, "x");
  p.y += p.vy * dt; p.ground = false; collide(p, "y");
  if (p.x < G.cam) { p.x = G.cam; p.vx = 0; }
  p.inv = Math.max(0, p.inv - dt);
  // coins
  for (let ty = Math.floor(p.y / TS); ty <= Math.floor((p.y + p.h) / TS); ty++) for (let tx = Math.floor(p.x / TS); tx <= Math.floor((p.x + p.w) / TS); tx++)
    if (tileAt(tx, ty) === "o") { G.map[ty][tx] = " "; G.stars++; G.score += 10; sfx("coin"); burst(tx * TS + 16, ty * TS + 16, "#f2c14e", 6); }
  // checkpoint and flag
  if (p.ground && p.x > G.check + 20 * TS) G.check = Math.floor(p.x / TS) * TS;
  const fx = (G.W - 6) * TS; if (p.x + p.w > fx) return levelDone();
  // fell in a pit
  if (p.y > ROWS * TS + 60) { hurt(true); }
  // enemies
  for (const e of G.enemies) {
    if (!e.alive) { e.squash -= dt; continue; }
    if (e.x > G.cam + 900) continue;
    e.vy = Math.min(900, e.vy + GRAV * dt); e.x += e.vx * dt;
    const ahead = Math.floor((e.vx < 0 ? e.x - 1 : e.x + 25) / TS), row = Math.floor((e.y + 12) / TS);
    if (solid(tileAt(ahead, row)) || !solid(tileAt(ahead, row + 1))) e.vx = -e.vx;
    e.y += e.vy * dt; const ty = Math.floor((e.y + 24) / TS);
    if (solid(tileAt(Math.floor((e.x + 12) / TS), ty))) { e.y = ty * TS - 24; e.vy = 0; }
    if (e.y > ROWS * TS + 50) e.alive = false;
    if (p.x < e.x + 24 && p.x + p.w > e.x && p.y < e.y + 24 && p.y + p.h > e.y) {
      if (p.vy > 60 && p.y + p.h - e.y < 18) { e.alive = false; e.squash = 0.4; p.vy = -420; G.score += 50; sfx("stomp"); burst(e.x + 12, e.y + 12, "#8b5cf6", 10); pop(e.x, e.y, "+50"); }
      else if (!p.inv) hurt(false);
    }
  }
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt; q.t -= dt; }
  G.parts = G.parts.filter(q => q.t > 0);
  for (const q of G.pops) { q.y -= 40 * dt; q.t -= dt; }
  G.pops = G.pops.filter(q => q.t > 0);
  // camera
  const cv = $("#gc"); const viewW = cv ? cv.width / viewScale(cv) : 800;
  G.cam = Math.max(G.cam, Math.min(G.W * TS - viewW, p.x - viewW * 0.38));
}
function collide(o, axis) {
  const x0 = Math.floor(o.x / TS), x1 = Math.floor((o.x + o.w - 0.01) / TS), y0 = Math.floor(o.y / TS), y1 = Math.floor((o.y + o.h - 0.01) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = tileAt(tx, ty); if (!solid(c)) continue;
    if (axis === "x") { if (o.vx > 0) o.x = tx * TS - o.w; else if (o.vx < 0) o.x = (tx + 1) * TS; o.vx = 0; return; }
    if (o.vy > 0) { o.y = ty * TS - o.h; o.vy = 0; o.ground = true; return; }
    if (o.vy < 0) {
      o.y = (ty + 1) * TS; o.vy = 0;
      if (c === "?") { G.map[ty][tx] = "U"; sfx("block"); burst(tx * TS + 16, ty * TS, "#f2c14e", 8); ask(); }
      else if (c === "B") { sfx("bump"); burst(tx * TS + 16, ty * TS + 30, "#d9b98c", 4); }
      return;
    }
  }
}
function hurt(fell) {
  const p = G.p;
  G.hearts--; sfx("hurt");
  if (G.hearts <= 0) return gameOver();
  if (fell) { p.x = G.check; p.y = 9 * TS; p.vx = p.vy = 0; G.cam = Math.max(0, G.check - 4 * TS); }
  else { p.vy = -380; p.vx = -p.face * 200; }
  p.inv = 1.6;
}
function burst(x, y, c, n) { for (let i = 0; i < n; i++) G.parts.push({ x, y, vx: (Math.random() - .5) * 300, vy: -Math.random() * 320, t: .6, c }); }
function pop(x, y, txt) { G.pops.push({ x, y, txt, t: .9 }); }

/* ---------- a question ---------- */
function ask() {
  G.pause = true; G.asked++;
  const Q = makeQuestion(G.level);
  overlay(`<div class="gcard ask"><div class="gq">${Q.q}</div>${Q.ar ? `<div class="gar q">${Q.ar}</div>` : ""}${Q.ref ? `<div class="src">${esc(Q.ref)}</div>` : ""}
    <div class="gopts">${Q.opts.map((o, i) => `<button class="${Q.arOpts ? "q" : ""}" data-i="${i}">${o.t}</button>`).join("")}</div></div>`);
  app.querySelectorAll(".gopts button").forEach(b => b.onclick = () => {
    const o = Q.opts[+b.dataset.i];
    app.querySelectorAll(".gopts button").forEach((x, i) => { x.disabled = true; if (Q.opts[i].ok) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); });
    if (o.ok) { G.right++; G.score += 100; if (G.hearts < 5) G.hearts++; sfx("right"); pop(G.p.x, G.p.y - 20, "+100 ❤"); }
    else { sfx("wrong"); G.hearts--; }
    setTimeout(() => { overlay(""); if (G.hearts <= 0) return gameOver(); G.pause = false; G.keys.left = G.keys.right = G.keys.jump = false; last = performance.now(); }, o.ok ? 900 : 1800);
  });
}

function levelDone() {
  G.pause = true; sfx("win");
  const bonus = G.right * 50 + G.stars * 2; G.score += bonus;
  const best = Math.max(store.get("gameBest", 0), G.score); store.set("gameBest", best);
  store.set("gameLevel", Math.max(store.get("gameLevel", 0), G.level + 1));
  overlay(`<div class="gcard"><div style="font-size:44px">🏁</div><h2>${L("Level", "المرحلة")} ${num(G.level)} ${L("complete!", "اكتملت!")}</h2>
    <p>${L("Questions right", "إجابات صحيحة")}: <b>${num(G.right)} / ${num(G.asked)}</b> · ${L("Stars", "النجوم")}: <b>${num(G.stars)}</b><br>${L("Score", "النقاط")}: <b>${num(G.score)}</b> · ${L("Best", "الأفضل")}: ${num(best)}</p>
    <button class="btn wide" id="gNext">${L("Next level", "المرحلة التالية")}</button></div>`);
  $("#gNext").onclick = () => newGame(G.level + 1, { score: G.score, hearts: Math.max(G.hearts, 3), stars: G.stars });
}
function gameOver() {
  G.pause = true;
  const best = Math.max(store.get("gameBest", 0), G.score); store.set("gameBest", best);
  overlay(`<div class="gcard"><div style="font-size:44px">💫</div><h2>${L("Game over", "انتهت اللعبة")}</h2>
    <p>${L("Level", "المرحلة")} ${num(G.level)} · ${L("Score", "النقاط")}: <b>${num(G.score)}</b> · ${L("Best", "الأفضل")}: ${num(best)}</p>
    <button class="btn wide" id="gAgain">${L("Play again", "العب مرة أخرى")}</button></div>`);
  $("#gAgain").onclick = () => newGame(1);
}

/* ---------- drawing ---------- */
function draw() {
  const cv = $("#gc"); if (!cv || !G) return;
  const box = cv.parentElement, dpr = Math.min(2, devicePixelRatio || 1);
  const cw = box.clientWidth, ch = box.clientHeight;
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  const g = cv.getContext("2d"), sc = viewScale(cv), vw = cv.width / sc, offY = cv.height - ROWS * TS * sc;   // at least 17 tiles across, ground at the bottom
  g.setTransform(1, 0, 0, 1, 0, 0);
  const sky = g.createLinearGradient(0, 0, 0, cv.height); sky.addColorStop(0, "#9fd8c4"); sky.addColorStop(1, "#e8f6ee"); g.fillStyle = sky; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(sc, 0, 0, sc, 0, offY);
  const cam = G.cam;
  // far hills and a city of domes (parallax)
  g.fillStyle = "#cfe9dc"; for (let i = -1; i < vw / 300 + 2; i++) { const x = i * 300 - (cam * 0.15) % 300; g.beginPath(); g.ellipse(x + 150, 330, 220, 120, 0, Math.PI, 0); g.fill(); }
  g.fillStyle = "#b5ddc9";
  for (let i = -1; i < vw / 260 + 2; i++) {
    const x = i * 260 - (cam * 0.3) % 260;
    g.fillRect(x + 40, 250, 70, 90); g.beginPath(); g.arc(x + 75, 250, 35, Math.PI, 0); g.fill();
    g.fillRect(x + 128, 200, 12, 140); g.beginPath(); g.moveTo(x + 126, 200); g.lineTo(x + 134, 182); g.lineTo(x + 142, 200); g.fill();
    g.fillRect(x + 160, 280, 60, 60); g.beginPath(); g.arc(x + 190, 280, 26, Math.PI, 0); g.fill();
  }
  g.fillStyle = "rgba(255,255,255,.85)";
  for (let i = -1; i < vw / 420 + 2; i++) { const x = i * 420 - (cam * 0.5) % 420; cloud(g, x + 80, 70 + (i % 2) * 30); }
  g.translate(-Math.round(cam), 0);
  const tx0 = Math.max(0, Math.floor(cam / TS) - 1), tx1 = Math.min(G.W - 1, Math.ceil((cam + vw) / TS) + 1);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = tx0; tx <= tx1; tx++) tile(g, G.map[ty][tx], tx * TS, ty * TS, tx, ty);
  // flag
  const fx = (G.W - 6) * TS;
  g.fillStyle = "#6b7c74"; g.fillRect(fx + 14, 2 * TS, 4, 10 * TS);
  g.fillStyle = "#0e6a44"; g.beginPath(); g.moveTo(fx + 18, 2 * TS + 4); g.lineTo(fx + 70, 2 * TS + 22); g.lineTo(fx + 18, 2 * TS + 40); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(fx + 38, 2 * TS + 22, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = "#0e6a44"; g.beginPath(); g.arc(fx + 41, 2 * TS + 20, 6, 0, Math.PI * 2); g.fill();
  // enemies
  for (const e of G.enemies) {
    if (!e.alive && e.squash <= 0) continue;
    const sq = !e.alive;
    g.fillStyle = "#7c4dcc"; g.beginPath(); g.ellipse(e.x + 12, e.y + (sq ? 20 : 13), 13, sq ? 5 : 12, 0, 0, Math.PI * 2); g.fill();
    if (!sq) { g.fillStyle = "#fff"; g.fillRect(e.x + 5, e.y + 8, 5, 6); g.fillRect(e.x + 14, e.y + 8, 5, 6); g.fillStyle = "#1b1030"; g.fillRect(e.x + (e.vx < 0 ? 5 : 7), e.y + 10, 3, 4); g.fillRect(e.x + (e.vx < 0 ? 14 : 16), e.y + 10, 3, 4);
      const st = Math.sin(G.time * 12) > 0; g.fillStyle = "#4b2a85"; g.fillRect(e.x + (st ? 2 : 5), e.y + 22, 7, 3); g.fillRect(e.x + (st ? 15 : 12), e.y + 22, 7, 3); }
  }
  // player
  const p = G.p;
  if (!(p.inv > 0 && Math.floor(p.inv * 12) % 2)) hero(g, p);
  for (const q of G.parts) { g.fillStyle = q.c; g.fillRect(q.x, q.y, 4, 4); }
  g.font = "bold 16px Inter, sans-serif"; g.textAlign = "center"; for (const q of G.pops) { g.fillStyle = `rgba(14,106,68,${Math.min(1, q.t * 2)})`; g.fillText(q.txt, q.x + 12, q.y); }
  // HUD
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "rgba(255,255,255,.85)"; roundRect(g, 10, 10, 250, 34, 17); g.fill();
  g.font = "700 15px Inter, sans-serif"; g.textAlign = "left"; g.fillStyle = "#c4352b";
  g.fillText("❤".repeat(Math.max(0, G.hearts)), 22, 33);
  g.fillStyle = "#0b1a13"; g.fillText(`★ ${G.stars}   ${G.score}`, 22 + 16 * Math.max(1, G.hearts) + 8, 33);
  g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,.85)"; roundRect(g, cw - 120, 10, 110, 34, 17); g.fill(); g.fillStyle = "#0e6a44";
  g.fillText(`${L("Level", "مرحلة")} ${G.level}`, cw - 22, 33);
}
function viewScale(cv) { return Math.min(cv.height / (ROWS * TS), cv.width / (17 * TS)); }
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function cloud(g, x, y) { g.beginPath(); g.arc(x, y, 22, 0, 7); g.arc(x + 26, y - 10, 28, 0, 7); g.arc(x + 56, y, 22, 0, 7); g.fill(); }
function tile(g, c, x, y, tx, ty) {
  if (c === "#") {
    const top = ty === 0 || !solid(G.map[ty - 1][tx]);
    g.fillStyle = "#c9a26b"; g.fillRect(x, y, TS, TS); g.fillStyle = "#b88f57"; g.fillRect(x + 4, y + 12, 6, 4); g.fillRect(x + 18, y + 22, 8, 4);
    if (top) { g.fillStyle = "#2fa36b"; g.fillRect(x, y, TS, 9); g.fillStyle = "#1f8a57"; g.fillRect(x, y + 9, TS, 3); }
  } else if (c === "B") {
    g.fillStyle = "#e3c28f"; g.fillRect(x, y, TS, TS); g.fillStyle = "#c9a26b";
    g.fillRect(x, y + 15, TS, 2); g.fillRect(x + 15, y, 2, 15); g.fillRect(x + 7, y + 17, 2, 15); g.fillRect(x + 23, y + 17, 2, 15); g.strokeStyle = "#b88f57"; g.strokeRect(x + .5, y + .5, TS - 1, TS - 1);
  } else if (c === "?" || c === "U") {
    const used = c === "U", bob = used ? 0 : Math.sin(G.time * 4 + tx) * 1.5;
    g.fillStyle = used ? "#b9a88a" : "#f2c14e"; g.fillRect(x, y + bob, TS, TS); g.fillStyle = used ? "#9c8c70" : "#d99a1e"; g.fillRect(x, y + TS - 4 + bob, TS, 4); g.fillRect(x + TS - 4, y + bob, 4, TS);
    if (!used) { g.fillStyle = "#fff"; g.font = "bold 22px 'Noto Naskh Arabic', serif"; g.textAlign = "center"; g.fillText("؟", x + 15, y + 24 + bob); }
  } else if (c === "o") {
    const s = Math.abs(Math.sin(G.time * 3 + tx)); g.fillStyle = "#f2c14e"; g.save(); g.translate(x + 16, y + 16); g.scale(0.4 + s * 0.6, 1);
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 6 : 11; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore();
  }
}
function hero(g, p) {
  const x = p.x, y = p.y, f = p.face, run = p.ground && Math.abs(p.vx) > 20, ph = Math.sin(G.time * 18);
  g.fillStyle = "#0b3d29"; g.fillRect(x + 4, y + 22, 6, run ? 6 + ph * 2 : 6); g.fillRect(x + 12, y + 22, 6, run ? 6 - ph * 2 : 6);
  g.fillStyle = "#0e6a44"; roundRect(g, x + 1, y + 10, 20, 15, 5); g.fill();
  g.fillStyle = "#f1c9a0"; g.beginPath(); g.arc(x + 11, y + 7, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x + 11, y + 1, 8.5, 4.5, 0, Math.PI, 0); g.fill();
  g.fillStyle = "#1b1b1b"; g.fillRect(x + 11 + f * 3, y + 6, 2, 3);
  g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(x + 11, y + 17, 2.5, 0, Math.PI * 2); g.fill();
}

/* ---------- little sounds ---------- */
let AC = null;
function sfx(kind) {
  if (store.get("gameMute", false)) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { jump: [[520, .08]], coin: [[988, .06], [1319, .1]], stomp: [[220, .08], [160, .08]], block: [[660, .07], [880, .09]], bump: [[140, .06]],
      hurt: [[300, .1], [200, .16]], right: [[660, .09], [880, .09], [1175, .16]], wrong: [[260, .14], [190, .22]], win: [[523, .1], [659, .1], [784, .1], [1047, .25]] }[kind] || [];
    let t = AC.currentTime;
    for (const [f, d] of notes) { const o = AC.createOscillator(), v = AC.createGain(); o.type = kind === "hurt" || kind === "wrong" ? "sawtooth" : "square"; o.frequency.value = f;
      v.gain.setValueAtTime(.06, t); v.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(v).connect(AC.destination); o.start(t); o.stop(t + d); t += d * .9; }
  } catch { }
}

VIEWS.push([/^\/game/, viewGame]);
window.noorGame = { makeQuestion, loadPool, makeLevel, get state() { return G; } };      // for tests
})();
