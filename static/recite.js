/* Noor recite: you read aloud, Noor follows word by word.
   "Correct me" shows the text and marks each word right or wrong; "Tasmi'" hides it and shows each word only once you have said it.
   Listening uses the browser's own speech recognition where it has one (Chrome, Edge); elsewhere (the Android app) short recordings
   go to the server, which asks a speech-to-text model what was said. */
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
// A heard word counts as the expected one when it is close: speech-to-text often drops a letter of a long Quranic word.
function same(heard, word) {
  for (const v of word.forms) { if (heard === v) return true; const d = lev(heard, v); if (d <= Math.max(1, Math.floor(v.length * 0.28))) return true; }
  // "وَٱلْكِتَٰبِ" is sometimes heard as two words, or the joined article differently: compare without a leading wa/fa
  const h2 = heard.replace(/^[وف]/, ""); return word.forms.some(v => v.replace(/^[وف]/, "") === h2 && h2.length > 2);
}

const R = { words: [], i: 0, mode: "correct", running: false, rec: null, media: null, errors: [], hints: 0, s: 0, from: 1, to: 1, startAt: 0, heard: "" };

function buildWords(data, from, to) {
  const out = [];
  for (const a of data.ayahs.slice(from - 1, to)) {
    for (const tok of a.ar.split(/\s+/)) {
      const f1 = norm(tok), f2 = norm(tok, "ا");
      if (!f1) { if (out.length) out[out.length - 1].after = (out[out.length - 1].after || "") + " " + tok; continue; }   // stop marks stay with the word before
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
  nav("more");
  app.innerHTML = topbar(`<h1>${ar ? "التسميع" : "Recite"} · ${esc(sName(info))}</h1>`) + `<div class="wrap">
    <div class="hero"><h2>${ar ? "اقرأ، ونور يصحّح لك" : "Recite, and Noor checks you"}</h2>
      <div class="hi" style="margin-top:6px">${ar ? "اقرأ بصوت واضح. نور يتابع كلمة كلمة ويخبرك بالأخطاء، ويعطيك تقييمًا في النهاية." : "Read aloud clearly. Noor follows you word by word, marks mistakes, and scores you at the end."}</div></div>
    <div class="card" style="margin-top:16px">
      <div class="opt" style="padding-top:0"><span class="l">${ar ? "الطريقة" : "Mode"}</span><div class="seg" id="rMode">
        <button class="on" data-m="correct">${ar ? "صحّح لي" : "Correct me"}</button><button data-m="tasmi">${ar ? "تسميع (النص مخفي)" : "Tasmi' (hidden)"}</button></div></div>
      <div class="opt"><span class="l">${ar ? "من آية" : "From ayah"}</span><select class="sel" id="rFrom">${opt(from, data.count)}</select></div>
      <div class="opt" style="border:0"><span class="l">${ar ? "إلى آية" : "To ayah"}</span><select class="sel" id="rTo">${opt(to, data.count)}</select></div>
      <button class="btn" style="width:100%;margin-top:6px;padding:14px" id="rGo">🎙 ${ar ? "ابدأ التسميع" : "Start reciting"}</button>
      <div class="d" style="color:var(--muted);font-size:13px;margin-top:10px" id="rBest"></div></div>
    <div class="d" style="color:var(--quiet);font-size:12px;margin-top:14px;line-height:1.7">${ar ? "يحتاج إلى الميكروفون والإنترنت. التقييم مساعدة، وليس بديلًا عن شيخ أو معلّم." : "Needs the microphone and the internet. The score is a helper, not a replacement for a teacher."}</div></div>`;
  let mode = "correct";
  const showBest = () => { const k = `${s}:${$("#rFrom").value}-${$("#rTo").value}`; $("#rBest").textContent = best[k] != null ? (ar ? `أفضل نتيجة لك هنا: ${num(best[k])}٪` : `Your best here: ${best[k]}%`) : ""; };
  $("#rMode").onclick = e => { const b = e.target.closest("button"); if (!b) return; mode = b.dataset.m; $("#rMode").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
  $("#rFrom").onchange = () => { if (+$("#rTo").value < +$("#rFrom").value) $("#rTo").value = $("#rFrom").value; showBest(); };
  $("#rTo").onchange = () => { if (+$("#rTo").value < +$("#rFrom").value) $("#rFrom").value = $("#rTo").value; showBest(); };
  showBest();
  $("#rGo").onclick = () => startSession(s, +$("#rFrom").value, +$("#rTo").value, mode, data, info);
};

function wordHtml(w, k) {
  const cls = R.mode === "tasmi" && !w.state && k !== R.i ? "hid" : "";
  const shown = R.mode === "tasmi" && !w.state ? "•".repeat(Math.min(5, Math.max(2, w.forms[0].length - 1))) : w.text;
  return `<span class="rw ${w.state} ${k === R.i ? "cur" : ""} ${cls}" id="w${k}">${shown}${w.end ? `<span class="mark">﴿${arNum(w.end)}﴾</span>` : ""}</span>`;
}
function paint() {
  const box = $("#rText"); if (!box) return;
  box.innerHTML = R.words.map(wordHtml).join(" ");
  const done = R.words.filter(w => w.state).length;
  $("#rProg").style.width = (done / R.words.length * 100) + "%";
  $("#rCount").textContent = `${num(done)} / ${num(R.words.length)}`;
  $("#rErr").textContent = num(R.errors.length);
  document.getElementById("w" + R.i)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

async function startSession(s, from, to, mode, data, info) {
  Object.assign(R, { s, from, to, mode, words: buildWords(data, from, to), i: 0, errors: [], hints: 0, startAt: Date.now(), heard: "", wrongTries: 0 });
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
  paint();
  $("#rHint").onclick = () => { const w = R.words[R.i]; if (!w) return; R.hints++; toast(w.text); if (R.mode === "tasmi") { w.state = "hint"; R.errors.push({ w, kind: "hint" }); R.i++; paint(); check(); } };
  $("#rSkip").onclick = () => { const w = R.words[R.i]; if (!w) return; w.state = "missed"; R.errors.push({ w, kind: "missed" }); R.i++; R.wrongTries = 0; paint(); check(); };
  $("#rStop").onclick = () => finish();
  listen();
}

function onWords(text) {
  if (!R.running) return;
  const heard = text.split(/\s+/).map(x => norm(x)).filter(Boolean);
  for (const h of heard) {
    if (R.i >= R.words.length) break;
    const w = R.words[R.i];
    if (same(h, w)) { w.state = w.state === "tried" ? "fixed" : "ok"; R.i++; R.wrongTries = 0; continue; }
    // a skipped word or two: the reader went ahead
    let jumped = false;
    for (let k = 1; k <= 2 && R.i + k < R.words.length; k++) {
      if (same(h, R.words[R.i + k]) && h.length > 2) {
        for (let j = 0; j < k; j++) { const m = R.words[R.i + j]; m.state = "missed"; R.errors.push({ w: m, kind: "missed" }); }
        R.i += k; R.words[R.i].state = "ok"; R.i++; R.wrongTries = 0; jumped = true; break;
      }
    }
    if (jumped) continue;
    // repeating the word already said is fine (people go back to restart a phrase)
    if (R.i > 0 && same(h, R.words[R.i - 1])) continue;
    if (h.length < 2) continue;
    R.wrongTries++;
    if (w.state !== "tried") { w.state = "tried"; R.errors.push({ w, kind: "wrong", heard: h }); }
    if (R.wrongTries >= 2 && R.mode === "correct") toast((S.lang === "ar" ? "الصواب: " : "It is: ") + w.text);
  }
  paint(); check();
}
function check() { if (R.i >= R.words.length) finish(); }

/* ---------- listening ---------- */
function listen() {
  R.running = true;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR(); R.rec = rec;
    rec.lang = "ar-SA"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    let used = {};                                             // words of each result already given to the matcher
    rec.onresult = e => {
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k], txt = r[0].transcript.trim(), words = txt.split(/\s+/);
        $("#rHeard").textContent = txt;
        // take interim words except the last one (it may still change), all words once final
        const ready = r.isFinal ? words.length : Math.max(0, words.length - 1);
        const prev = used[k] || 0;
        if (ready > prev) { onWords(words.slice(prev, ready).join(" ")); used[k] = ready; }
      }
    };
    rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { R.running = false; micDenied(); } };
    rec.onend = () => { if (R.running) { used = {}; try { rec.start(); } catch { } } };
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
      fd.append("hint", R.words.slice(R.i, R.i + 30).map(w => w.text).join(" "));
      try {
        const r = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (r.status === 503) { R.running = false; stopListening(); return noEngine(); }
        const j = await r.json(); if (j.text) { $("#rHeard").textContent = j.text; onWords(j.text); }
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
window.noorRecite = { R, onWords };
VIEWS.push([/^\/recite\/(\d+)(?:\/(\d+))?/, m => viewRecite(+m[1], +(m[2] || 1))]);                                     // for tests

/* ---------- the score ---------- */
function finish() {
  if (!R.words.length || !document.getElementById("rText")) return;
  stopListening();
  const total = R.words.length;
  const wrong = R.words.filter(w => w.state === "tried" || w.state === "missed" || w.state === "hint" || w.state === "fixed").length;
  const unsaid = R.words.filter(w => !w.state).length;
  const said = total - unsaid;
  const score = said ? Math.max(0, Math.round(((said - wrong) - R.hints * 0.5) / total * 100)) : 0;
  const ar = S.lang === "ar";
  const grade = score >= 95 ? (ar ? "ممتاز" : "Excellent") : score >= 85 ? (ar ? "جيد جدًا" : "Very good") : score >= 70 ? (ar ? "جيد" : "Good") : (ar ? "يحتاج مراجعة" : "Needs review");
  const k = `${R.s}:${R.from}-${R.to}`; const best = store.get("reciteBest", {}); const was = best[k];
  if (was == null || score > was) { best[k] = score; store.set("reciteBest", best); }
  const hist = store.get("reciteLog", []); hist.push({ s: R.s, from: R.from, to: R.to, score, mode: R.mode, at: Date.now() }); store.set("reciteLog", hist.slice(-100));
  for (let a = R.from; a <= R.to; a++) markRead(R.s, a);
  const mins = Math.max(1, Math.round((Date.now() - R.startAt) / 60000));
  const errs = R.errors.filter((e, i, arr) => arr.findIndex(x => x.w === e.w) === i);
  const why = e => e.kind === "missed" ? (ar ? "فاتتك" : "missed") : e.kind === "hint" ? (ar ? "تلميح" : "hint") : (ar ? "قرأتها خطأ" : "said wrong");
  app.innerHTML = topbar(`<h1>${ar ? "النتيجة" : "Your score"}</h1>`) + `<div class="wrap"><div class="rscore">
    <div class="ring" style="--p:${score}"><div><b>${num(score)}</b><span>%</span></div></div>
    <div class="g">${grade}</div><div class="d">${num(said)} / ${num(total)} ${ar ? "كلمة" : "words"} · ${num(errs.length)} ${ar ? "أخطاء" : "mistakes"} · ${num(mins)} ${ar ? "دقيقة" : "min"}
      ${was != null && score > was ? `<br><b style="color:var(--gold)">${ar ? "رقم قياسي جديد!" : "New personal best!"}</b>` : ""}</div></div>
    ${errs.length ? `<h3 style="margin:22px 0 8px">${ar ? "راجع هذه الكلمات" : "Words to review"}</h3><div class="card">${errs.slice(0, 40).map(e => `<a class="rerr" href="#/s/${R.s}/${e.w.ayah}"><span class="w">${e.w.text}</span><span class="k">${why(e)} · ${num(R.s)}:${num(e.w.ayah)}</span></a>`).join("")}</div>` : ""}
    <div class="rtext small" style="margin-top:18px">${R.words.map((w, i) => `<span class="rw ${w.state || "missed"}">${w.text}${w.end ? `<span class="mark">﴿${arNum(w.end)}﴾</span>` : ""}</span>`).join(" ")}</div>
    <div class="rbtns"><a class="btn ghost" href="#/s/${R.s}/${R.from}">${ar ? "اقرأ المقطع" : "Read the passage"}</a><button class="btn" onclick="location.hash='#/recite/${R.s}/${R.from}'; route()">${ar ? "حاول مرة أخرى" : "Try again"}</button></div></div>`;
  R.words = [];
  if (window.noorReciteDone) noorReciteDone(R.s, R.from, R.to, score);
}
})();
