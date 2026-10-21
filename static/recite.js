/* Noor recite: you read aloud, Noor follows word by word.
   "Correct me" shows the text and marks each word right or wrong; "Tasmi'" hides it and shows each word only once you have said it.
   Listening uses the browser's own speech recognition where it has one (Chrome, Edge); elsewhere (the Android app) short recordings
   go to the server, which asks a speech-to-text model what was said.

   Following the reader: everything heard so far is lined up against the passage (like a diff), every time more is heard.
   Skipping ahead costs a lot, so one word that happens to sound like a later ayah cannot drag the reader there; saying
   something extra (a repeat, the isti'adha, a cough) costs little; small speech-to-text slips still count as right; and a word
   only turns red once the recognizer has finished with it. */
"use strict";
(() => {
const MARKS = /[ؐ-ًؚ-ٟۖ-ۭـ]/g;
function norm(w, dagger = "") {
  return w.replace(/ٰ/g, dagger).replace(MARKS, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ءا/g, "ا").replace(/[^ء-ي]/g, "");
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
// how alike a heard word and an expected word are (0..1), forgiving a dropped letter, the joined article or a leading wa/fa/bi/li
const PFX = /^(وال|فال|بال|كال|لل|ال|و|ف|ب|ل)/;
const sim1 = (a, b) => !a || !b ? 0 : a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length);
const simCache = new Map();
function sim(h, w) {
  const key = h + "|" + w.forms[0]; if (simCache.has(key)) return simCache.get(key);
  let best = 0;
  for (const v of w.forms) {
    best = Math.max(best, sim1(h, v), sim1(h.replace(PFX, ""), v.replace(PFX, "")) - 0.05);
    if (h.length > 2 && v.length > 2 && (v.includes(h) || h.includes(v))) best = Math.max(best, 0.75);
  }
  if (simCache.size > 20000) simCache.clear();
  simCache.set(key, best); return best;
}

const R = { words: [], i: 0, mode: "correct", running: false, rec: null, media: null, hints: 0, s: 0, from: 1, to: 1, startAt: 0,
  finals: [], interim: [], everWrong: new Set(), forced: {} };

function buildWords(data, from, to) {
  const out = [];
  for (const a of data.ayahs.slice(from - 1, to)) {
    for (const tok of a.ar.split(/\s+/)) {
      const f1 = norm(tok), f2 = norm(tok, "ا");
      if (!f1) continue;                                                           // stop marks are not words
      out.push({ text: tok, forms: [...new Set([f1, f2])], ayah: a.n, state: "" });
    }
    out[out.length - 1].end = a.n;
  }
  return out;
}

window.viewRecite = async (s, a) => {
  const idx = await index(); const data = await surah(s); const info = idx.surahs[s - 1];
  const from = Math.max(1, Math.min(a || 1, data.count));
  const to = Math.min(data.count, from + (data.count - from < 15 ? data.count : 9));
  const best = store.get("reciteBest", {});
  const opt = (sel, max) => Array.from({ length: max }, (_, i) => `<option value="${i + 1}" ${i + 1 === sel ? "selected" : ""}>${num(i + 1)}</option>`).join("");
  const ar = S.lang === "ar";
  app.innerHTML = topbar(`<h1>${ar ? "التسميع" : "Recite"} · ${esc(sName(info))}</h1>`) + `<div class="wrap">
    <div class="hero"><h2>${ar ? "اقرأ، ونور يصحّح لك" : "Recite, and Noor checks you"}</h2>
      <div class="hi" style="margin-top:6px">${ar ? "اقرأ بصوت واضح وبهدوء. نور يتابعك كلمة كلمة ويخبرك بالأخطاء، ويعطيك تقييمًا في النهاية." : "Read aloud, clearly and calmly. Noor follows you word by word, marks mistakes, and scores you at the end."}</div></div>
    <div class="card" style="margin-top:16px">
      <div class="opt" style="padding-top:0"><span class="l">${ar ? "الطريقة" : "Mode"}</span><div class="seg" id="rMode">
        <button class="on" data-m="correct">${ar ? "صحّح لي" : "Correct me"}</button><button data-m="tasmi">${ar ? "تسميع (النص مخفي)" : "Tasmi' (hidden)"}</button></div></div>
      <div class="opt"><span class="l">${ar ? "السورة" : "Surah"}</span><select class="sel" id="rSurah">${idx.surahs.map(x => `<option value="${x.n}" ${x.n === s ? "selected" : ""}>${num(x.n)}. ${esc(sName(x))}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${ar ? "من آية" : "From ayah"}</span><select class="sel" id="rFrom">${opt(from, data.count)}</select></div>
      <div class="opt" style="border:0"><span class="l">${ar ? "إلى آية" : "To ayah"}</span><select class="sel" id="rTo">${opt(to, data.count)}</select></div>
      <button class="btn wide" style="margin-top:6px" id="rGo">🎙 ${ar ? "ابدأ التسميع" : "Start reciting"}</button>
      <div class="d" style="color:var(--muted);font-size:13px;margin-top:10px" id="rBest"></div></div>
    <div class="card" style="margin-top:12px;font-size:13.5px;color:var(--muted);line-height:1.7">${ar ? "نصائح: اقرأ بصوت واضح وليس بسرعة كبيرة، في مكان هادئ. لا بأس أن تعيد الكلمة أو تبدأ بالاستعاذة والبسملة." : "Tips: read clearly and not too fast, somewhere quiet. It is fine to repeat a word, or to start with the isti'adha and the basmala."}
      <br>${ar ? "يحتاج إلى الميكروفون والإنترنت. التقييم مساعدة، وليس بديلًا عن شيخ أو معلّم." : "Needs the microphone and the internet. The score is a helper, not a replacement for a teacher."}</div></div>`;
  nav("recite");
  let mode = "correct";
  const showBest = () => { const k = `${s}:${$("#rFrom").value}-${$("#rTo").value}`; $("#rBest").textContent = best[k] != null ? (ar ? `أفضل نتيجة لك هنا: ${num(best[k])}٪` : `Your best here: ${best[k]}%`) : ""; };
  $("#rMode").onclick = e => { const b = e.target.closest("button"); if (!b) return; mode = b.dataset.m; $("#rMode").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
  $("#rSurah").onchange = () => { location.hash = `#/recite/${$("#rSurah").value}/1`; };
  $("#rFrom").onchange = () => { if (+$("#rTo").value < +$("#rFrom").value) $("#rTo").value = $("#rFrom").value; showBest(); };
  $("#rTo").onchange = () => { if (+$("#rTo").value < +$("#rFrom").value) $("#rFrom").value = $("#rTo").value; showBest(); };
  showBest();
  $("#rGo").onclick = () => startSession(s, +$("#rFrom").value, +$("#rTo").value, mode, data, info);
};

/* ---------- drawing: the words are made once, then only their colours change ---------- */
let lastCur = -1;
function paintWord(el, w, k) {
  const hidden = R.mode === "tasmi" && !w.state;
  const cls = `rw ${w.state || ""} ${k === R.i ? "cur" : ""} ${hidden && k !== R.i ? "hid" : ""}`;
  const html = (hidden ? "•".repeat(Math.min(5, Math.max(2, w.forms[0].length - 1))) : w.text) + (w.end ? `<span class="mark">﴿${arNum(w.end)}﴾</span>` : "");
  if (el.className !== cls) el.className = cls;
  if (el._h !== html) { el.innerHTML = html; el._h = html; }
}
function paint() {
  const box = $("#rText"); if (!box) return;
  if (box.children.length !== R.words.length) box.innerHTML = R.words.map((w, k) => `<span class="rw" id="w${k}"></span>`).join(" ");
  R.words.forEach((w, k) => paintWord(box.children[k], w, k));
  const done = R.words.filter(w => w.state).length, errs = R.words.filter(w => ["tried", "missed", "hint", "fixed"].includes(w.state)).length;
  $("#rProg").style.width = (done / R.words.length * 100) + "%";
  $("#rCount").textContent = `${num(done)} / ${num(R.words.length)}`;
  $("#rErr").textContent = num(errs);
  if (R.i !== lastCur) { lastCur = R.i; box.children[Math.min(R.i, R.words.length - 1)]?.scrollIntoView({ block: "center", behavior: "smooth" }); }
}

async function startSession(s, from, to, mode, data, info) {
  Object.assign(R, { s, from, to, mode, words: buildWords(data, from, to), i: 0, hints: 0, startAt: Date.now(), finals: [], interim: [], everWrong: new Set(), forced: {} });
  lastCur = -1;
  const ar = S.lang === "ar";
  app.innerHTML = topbar(`<h1>${mode === "tasmi" ? (ar ? "تسميع" : "Tasmi'") : (ar ? "صحّح لي" : "Correct me")} · ${esc(sName(info))} ${num(from)}–${num(to)}</h1>`) + `<div class="wrap">
    <div class="rstat"><div><b id="rCount"></b><span>${ar ? "كلمة" : "words"}</span></div><div><b id="rErr">0</b><span>${ar ? "أخطاء" : "mistakes"}</span></div>
      <div class="rlive" id="rLive"><i></i>${ar ? "يستمع…" : "Listening…"}</div></div>
    <div class="prog"><div id="rProg"></div></div>
    ${from === 1 && s !== 1 && s !== 9 ? `<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ""}
    <div class="rtext" id="rText"></div>
    <div class="rheard" id="rHeard"></div>
    <div class="rbtns"><button class="btn ghost" id="rHint">${ar ? "تلميح" : "Hint"}</button><button class="btn ghost" id="rSkip">${ar ? "تخطَّ الكلمة" : "Skip word"}</button>
      <button class="btn" id="rStop">${ar ? "إنهاء وتقييم" : "Finish & score"}</button></div></div>`;
  nav("recite");
  paint();
  $("#rHint").onclick = () => { const w = R.words[R.i]; if (!w) return; R.hints++; toast(w.text); R.forced[R.i] = "hint"; align(); };
  $("#rSkip").onclick = () => { if (!R.words[R.i]) return; R.forced[R.i] = "missed"; align(); };
  $("#rStop").onclick = () => finish();
  listen();
}

/* ---------- the alignment ---------- */
const SKIP = 1.0, EXTRA = 0.35, OK = 0.5, WRONG = 0.3;
function align() {
  if (!R.words.length) return;
  const heard = [...R.finals.map(w => ({ w, fin: true })), ...R.interim.map(w => ({ w, fin: false }))].slice(-500);
  const E = R.words, H = heard.length;
  let lastOk = -1; E.forEach((w, k) => { if (w.state === "ok" || w.state === "fixed") lastOk = k; });
  const N = Math.min(E.length, Math.max(R.i, lastOk + 1) + 45);              // only a little ahead of where the reader is
  const skipCost = k => R.forced[k] ? 0 : E[k].forms[0].length <= 2 ? 0.45 : SKIP;   // short words (min, fi, la) are often not heard
  const W = H + 1, dp = new Float32Array((N + 1) * W), bt = new Uint8Array((N + 1) * W), sc = new Float32Array((N + 1) * W);
  for (let i = 1; i <= N; i++) { dp[i * W] = dp[(i - 1) * W] - skipCost(i - 1); bt[i * W] = 2; }     // heard nothing yet for these
  for (let j = 1; j <= H; j++) bt[j] = 3;                                                              // free: things said before starting
  for (let i = 1; i <= N; i++) for (let j = 1; j <= H; j++) {
    const s0 = R.forced[i - 1] ? 1 : sim(heard[j - 1].w, E[i - 1]);
    const m = dp[(i - 1) * W + j - 1] + (s0 >= OK ? 2 * s0 : s0 >= WRONG ? 0.2 : -0.8);
    const sk = dp[(i - 1) * W + j] - skipCost(i - 1), ex = dp[i * W + j - 1] - EXTRA;
    let best = m, b = 1; if (sk > best) { best = sk; b = 2; } if (ex > best) { best = ex; b = 3; }
    dp[i * W + j] = best; bt[i * W + j] = b; sc[i * W + j] = s0;
  }
  // the end of the passage not reached yet is free: pick how far the reader has got
  let bi = 0, bv = -1e9; for (let i = 0; i <= N; i++) { const v = dp[i * W + H]; if (v > bv + 1e-6 || (Math.abs(v - bv) <= 1e-6 && i > bi)) { bv = Math.max(v, bv); bi = i; } }
  const got = new Array(N).fill(null);
  let i = bi, j = H;
  while (i > 0) {
    const b = j > 0 ? bt[i * W + j] : 2;
    if (b === 1) { got[i - 1] = { s: sc[i * W + j], fin: heard[j - 1].fin }; i--; j--; }
    else if (b === 2) { got[i - 1] = "gap"; i--; }
    else j--;
  }
  while (bi > 0 && got[bi - 1] === "gap") bi--;                              // the reader is after the last word actually heard
  const after = new Array(N + 1).fill(0);
  for (let k = N - 1; k >= 0; k--) after[k] = after[k + 1] + (got[k] && got[k] !== "gap" && got[k].s >= OK ? 1 : 0);
  E.forEach((w, k) => {
    const f = R.forced[k];
    if (f === "hint") { w.state = "hint"; return; }
    if (f === "missed") { w.state = "missed"; return; }
    if (k >= bi) { w.state = ""; return; }
    const g = got[k];
    if (g === "gap") w.state = w.forms[0].length <= 2 && after[k] ? "ok" : after[k] >= 2 ? "missed" : "";
    else if (g.s >= WRONG) w.state = R.everWrong.has(k) ? "fixed" : "ok";
    else if (!g.fin) w.state = "";                                            // still being heard: do not judge yet
    else { w.state = "tried"; if (after[k] >= 2) R.everWrong.add(k); }     // it only counts once the reader has clearly moved on
  });
  R.i = bi;
  paint(); check();
}
function heardText(text, final) {
  const words = text.split(/\s+/).map(x => norm(x)).filter(Boolean);
  if (final) { R.finals.push(...words); R.interim = []; } else R.interim = words;
  align();
}
function onWords(text) { if (!R.running) return; heardText(text, true); }
function check() { if (R.words.length && R.i >= R.words.length && R.words.every(w => w.state)) setTimeout(() => R.words.length && R.words.every(w => w.state) && finish(), 700); }

/* ---------- listening ---------- */
function listen() {
  R.running = true;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR(); R.rec = rec;
    rec.lang = "ar-SA"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 4;
    const done = new Set();
    rec.onresult = e => {
      let interim = "";
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k];
        if (r.isFinal) {
          if (done.has(k)) continue; done.add(k);
          let best = r[0].transcript, bs = -1;                                // of the recognizer's guesses, take the one that fits the passage
          const win = R.words.slice(Math.max(0, R.i - 3), R.i + 25);
          for (let x = 0; x < r.length; x++) {
            const ws = r[x].transcript.split(/\s+/).map(t => norm(t)).filter(Boolean);
            const fit = ws.reduce((acc, h) => acc + Math.max(0, ...win.map(w => sim(h, w))), 0) / Math.max(1, ws.length);
            if (fit > bs) { bs = fit; best = r[x].transcript; }
          }
          heardText(best, true);
        } else interim += " " + r[0].transcript;
      }
      if (interim.trim()) { $("#rHeard").textContent = interim.trim(); heardText(interim, false); }
    };
    rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { R.running = false; micDenied(); } };
    rec.onend = () => { if (R.running) { done.clear(); R.interim = []; try { rec.start(); } catch { } } };
    try { rec.start(); } catch { }
    return;
  }
  serverListen();
}
async function serverListen() {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { R.running = false; return micDenied(); }
  R.media = stream;
  const chunk = () => {
    if (!R.running) return;
    const mr = new MediaRecorder(stream); const parts = [];
    mr.ondataavailable = e => parts.push(e.data);
    mr.onstop = async () => {
      if (R.running) chunk();
      const blob = new Blob(parts, { type: mr.mimeType || "audio/webm" }); if (blob.size < 2500) return;
      const fd = new FormData(); fd.append("audio", blob, "a.webm");
      fd.append("hint", R.words.slice(Math.max(0, R.i - 2), R.i + 30).map(w => w.text).join(" "));
      try {
        const r = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (r.status === 503) { R.running = false; stopListening(); return noEngine(); }
        const j = await r.json(); if (j.text && R.running) { $("#rHeard").textContent = j.text; heardText(j.text, true); }
      } catch { toast(S.lang === "ar" ? "تحقق من الإنترنت" : "Check the internet"); }
    };
    mr.start(); setTimeout(() => mr.state !== "inactive" && mr.stop(), 4500);
  };
  chunk();
}
function stopListening() {
  R.running = false;
  try { R.rec && R.rec.stop(); } catch { } R.rec = null;
  if (R.media) { R.media.getTracks().forEach(t => t.stop()); R.media = null; }
}
function micDenied() { if (!R.words.length) return; sheet(`<h3>${S.lang === "ar" ? "الميكروفون مغلق" : "The microphone is off"}</h3><p style="color:var(--muted)">${S.lang === "ar" ? "اسمح لنور باستخدام الميكروفون من إعدادات المتصفح أو الهاتف، ثم حاول مرة أخرى." : "Allow Noor to use the microphone in your browser or phone settings, then try again."}</p>`); }
function noEngine() { sheet(`<h3>${S.lang === "ar" ? "التسميع غير متاح هنا بعد" : "Reciting isn't available here yet"}</h3><p style="color:var(--muted)">${S.lang === "ar" ? "افتح نور في متصفح Chrome أو Edge ليعمل التسميع." : "Open Noor in Chrome or Edge to recite."}</p>`); }
window.addEventListener("hashchange", () => { if (R.running) stopListening(); });
window.noorRecite = { R, onWords, heardText, sim, norm, align };
VIEWS.push([/^\/recite\/(\d+)(?:\/(\d+))?/, m => viewRecite(+m[1], +(m[2] || 1))]);

/* ---------- the score ---------- */
function finish() {
  if (!R.words.length || !document.getElementById("rText")) return;
  stopListening();
  const total = R.words.length;
  const errs = R.words.map(w => ({ w, kind: w.state === "missed" ? "missed" : w.state === "hint" ? "hint" : (w.state === "tried" || w.state === "fixed") ? "wrong" : null })).filter(e => e.kind);
  const said = R.words.filter(w => w.state).length;
  const score = said ? Math.max(0, Math.round((said - errs.length - R.hints * 0.5) / total * 100)) : 0;
  const ar = S.lang === "ar";
  const grade = score >= 95 ? (ar ? "ممتاز" : "Excellent") : score >= 85 ? (ar ? "جيد جدًا" : "Very good") : score >= 70 ? (ar ? "جيد" : "Good") : (ar ? "يحتاج مراجعة" : "Needs review");
  const k = `${R.s}:${R.from}-${R.to}`; const best = store.get("reciteBest", {}); const was = best[k];
  if (was == null || score > was) { best[k] = score; store.set("reciteBest", best); }
  const hist = store.get("reciteLog", []); hist.push({ s: R.s, from: R.from, to: R.to, score, mode: R.mode, at: Date.now() }); store.set("reciteLog", hist.slice(-100));
  for (let a = R.from; a <= R.to; a++) markRead(R.s, a);
  const mins = Math.max(1, Math.round((Date.now() - R.startAt) / 60000));
  const why = e => e.kind === "missed" ? (ar ? "فاتتك" : "missed") : e.kind === "hint" ? (ar ? "تلميح" : "hint") : (ar ? "قرأتها خطأ" : "said wrong");
  app.innerHTML = topbar(`<h1>${ar ? "النتيجة" : "Your score"}</h1>`) + `<div class="wrap"><div class="rscore">
    <div class="ring" style="--p:${score}"><div><b>${num(score)}</b><span>%</span></div></div>
    <div class="g">${grade}</div><div class="d">${num(said)} / ${num(total)} ${ar ? "كلمة" : "words"} · ${num(errs.length)} ${ar ? "أخطاء" : "mistakes"} · ${num(mins)} ${ar ? "دقيقة" : "min"}
      ${was != null && score > was ? `<br><b style="color:var(--gold)">${ar ? "رقم قياسي جديد!" : "New personal best!"}</b>` : ""}</div></div>
    ${errs.length ? `<h3 style="margin:22px 0 8px">${ar ? "راجع هذه الكلمات" : "Words to review"}</h3><div class="card">${errs.slice(0, 40).map(e => `<a class="rerr" href="#/s/${R.s}/${e.w.ayah}"><span class="w">${e.w.text}</span><span class="k">${why(e)} · ${num(R.s)}:${num(e.w.ayah)}</span></a>`).join("")}</div>` : ""}
    <div class="rtext small" style="margin-top:18px">${R.words.map(w => `<span class="rw ${w.state || "missed"}">${w.text}${w.end ? `<span class="mark">﴿${arNum(w.end)}﴾</span>` : ""}</span>`).join(" ")}</div>
    <div class="rbtns"><a class="btn ghost" href="#/s/${R.s}/${R.from}">${ar ? "اقرأ المقطع" : "Read the passage"}</a><button class="btn" onclick="location.hash='#/recite/${R.s}/${R.from}'; route()">${ar ? "حاول مرة أخرى" : "Try again"}</button></div></div>`;
  const s = R.s, from = R.from, to = R.to;
  R.words = [];
  if (window.noorReciteDone) noorReciteDone(s, from, to, score);
}
})();
