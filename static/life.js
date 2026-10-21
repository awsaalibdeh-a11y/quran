/* Noor life: the sky (sun and moon where they really are), ayahs for how you feel, learning the Arabic letters,
   the family khatma, reading time and a progress card to share. All offline except the family khatma. */
"use strict";
(() => {
/* ---------- the sky: sun by day, the moon (in its real phase) by night, from your location and the time ---------- */
function sunTimes(d = new Date()) {
  const loc = S.loc;
  if (loc && window.noorPrayer) { const t = noorPrayer.prayerTimes(d, loc.lat, loc.lng, S.method, 1); if (t.sunrise && t.maghrib) return t; }
  const at = (h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
  return { fajr: at(4, 45), sunrise: at(6, 0), dhuhr: at(12, 0), maghrib: at(18, 0), isha: at(19, 20) };
}
function moonPhase(d = new Date()) {                                          // 0 = new moon, 0.5 = full
  const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14) / 864e5;
  return (((d.getTime() / 864e5 - ref) / syn) % 1 + 1) % 1;
}
function skyState(now = new Date()) {
  const t = sunTimes(now);
  const yest = sunTimes(new Date(now.getTime() - 864e5)), tom = sunTimes(new Date(now.getTime() + 864e5));
  let phase, frac;
  if (now >= t.sunrise && now < t.maghrib) { phase = "day"; frac = (now - t.sunrise) / (t.maghrib - t.sunrise); }
  else {
    const start = now >= t.maghrib ? t.maghrib : yest.maghrib, end = now >= t.maghrib ? tom.sunrise : t.sunrise;
    frac = (now - start) / (end - start);
    phase = now >= t.maghrib && now < (t.isha || t.maghrib) ? "dusk" : now < t.sunrise && now >= (t.fajr || t.sunrise) ? "dawn" : "night";
  }
  return { phase, frac: Math.min(1, Math.max(0, frac)), moon: moonPhase(now) };
}
window.noorIsNight = () => { const s = skyState(); return s.phase === "night" || s.phase === "dusk"; };
const SKY = { day: ["#8ccff0", "#d7f0f8"], dawn: ["#3b4a7a", "#f2b28a"], dusk: ["#3a2f5c", "#f08a6a"], night: ["#0a1430", "#1d2c52"] };
window.noorSkySvg = () => {
  if (S.sky === false) return "";
  const st = skyState(), [c1, c2] = SKY[st.phase], W = 400, H = 200;
  const x = 40 + st.frac * (W - 80), y = H - 34 - Math.sin(st.frac * Math.PI) * (H - 80);
  let body = "";
  if (st.phase === "day") body = `<circle cx="${x}" cy="${y}" r="44" fill="#fff6c8" opacity=".35"/><circle cx="${x}" cy="${y}" r="24" fill="#ffe17a"/><circle cx="${x}" cy="${y}" r="18" fill="#ffd34d"/>`;
  else {
    const p = st.moon, lit = p <= 0.5 ? p * 2 : (1 - p) * 2, r = 16, off = (1 - lit) * 2 * r * (p < 0.5 ? -1 : 1);   // a dark disc slid over the bright one makes the phase
    const stars = Array.from({ length: 36 }, (_, i) => `<circle cx="${(i * 97) % W}" cy="${(i * 53) % (H - 50)}" r="${i % 5 ? 0.8 : 1.3}" fill="#fff" opacity="${((i % 3) * 0.25 + 0.35) * (st.phase === "night" ? 1 : 0.4)}"/>`).join("");
    body = `${stars}<defs><mask id="mk"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${x + off}" cy="${y}" r="${r + 0.5}" fill="#000"/></mask></defs>
      <circle cx="${x}" cy="${y}" r="${r + 14}" fill="#fff" opacity=".07"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f4f1de" opacity=".16"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f7f3df" mask="url(#mk)"/>`;
  }
  const land = st.phase === "day" ? "#2f8f5c" : "#0d1830";
  return `<div class="skybg" data-phase="${st.phase}" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".7" stop-color="#000" stop-opacity=".05"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sg)"/>${body}
    <path d="M0 ${H - 24} Q 80 ${H - 50} 160 ${H - 28} T 320 ${H - 32} T 400 ${H - 24} V ${H} H 0 Z" fill="${land}" opacity=".6"/>
    <g fill="${land}"><rect x="300" y="${H - 62}" width="28" height="38"/><path d="M300 ${H - 62} a14 14 0 0 1 28 0z"/><rect x="334" y="${H - 84}" width="6" height="60"/><path d="M333 ${H - 84} l4 -10 l4 10z"/></g>
    <rect width="${W}" height="${H}" fill="url(#sh)"/></svg></div>`;
};
function drawSky() { if (S.theme === "auto") applyLook(); }
const _apply = window.applyLook;
window.applyLook = () => { const keep = S.theme; if (keep === "auto") S.theme = noorIsNight() ? "dark" : "light"; _apply(); if (keep === "auto") { document.documentElement.dataset.auto = "1"; S.theme = keep; } };
setInterval(drawSky, 60000);
window.addEventListener("hashchange", drawSky);
setTimeout(() => { applyLook(); drawSky(); }, 50);
window.noorSky = { skyState, moonPhase };

/* ---------- ayahs for how you feel (references checked against the translation) ---------- */
const FEEL = [
  ["anxious", "😟", "Anxious", "قلق", [[13, 28, 28], [94, 5, 6], [65, 3, 3], [2, 286, 286]]],
  ["sad", "😢", "Sad", "حزين", [[93, 3, 5], [12, 86, 86], [9, 40, 40], [2, 155, 157]]],
  ["grateful", "🤲", "Grateful", "شاكر", [[14, 7, 7], [2, 152, 152], [55, 13, 13]]],
  ["angry", "😠", "Angry", "غاضب", [[3, 134, 134], [41, 34, 34], [42, 37, 37]]],
  ["lonely", "🫂", "Lonely", "وحيد", [[2, 186, 186], [50, 16, 16], [20, 46, 46]]],
  ["hopeless", "🌧", "Lost hope", "يائس", [[39, 53, 53], [12, 87, 87], [15, 56, 56]]],
  ["afraid", "😨", "Afraid", "خائف", [[3, 173, 173], [9, 51, 51], [10, 62, 62]]],
  ["guilty", "💔", "Need forgiveness", "أريد المغفرة", [[4, 110, 110], [3, 135, 135], [25, 70, 70]]],
  ["tired", "😮‍💨", "Need patience", "أحتاج الصبر", [[2, 153, 153], [39, 10, 10], [16, 127, 127]]],
  ["family", "👪", "About family", "عن الأسرة", [[17, 23, 24], [25, 74, 74], [30, 21, 21]]],
  ["sick", "🤒", "Unwell", "مريض", [[26, 80, 80], [17, 82, 82], [10, 57, 57]]],
  ["lost", "🧭", "Need guidance", "أحتاج الهداية", [[1, 6, 7], [29, 69, 69], [2, 2, 2]]],
];
async function viewFeel(m) {
  const pick = FEEL.find(f => f[0] === (m && m[1]));
  if (!pick) {
    app.innerHTML = topbar(`<h1>${L("How do you feel?", "كيف تشعر؟")}</h1>`) + `<div class="wrap"><p class="lead">${L("Pick a feeling, and Noor shows ayahs that speak to it.", "اختر شعورك، ويعرض لك نور آيات تخاطبه.")}</p>
      <div class="tiles" style="margin-top:14px">${FEEL.map(f => `<a class="tile" href="#/feel/${f[0]}"><span class="ic" style="font-size:24px">${f[1]}</span>${isAr() ? f[3] : f[2]}</a>`).join("")}</div></div>`;
    return nav("more");
  }
  const idx = await index(), cards = [];
  for (const [s, a, b] of pick[4]) {
    const ay = (await surah(s)).ayahs.slice(a - 1, b);
    cards.push(`<div class="card dhikr"><div class="ar q">${ay.map(x => `${x.ar} <span class="mark">﴿${arNum(x.n)}﴾</span>`).join(" ")}</div>${S.en ? `<div style="color:var(--muted);margin-top:6px">${esc(ay.map(x => x.en).join(" "))}</div>` : ""}
      <div class="cnt" style="justify-content:space-between"><a class="src" href="#/s/${s}/${a}">${esc(sName(idx.surahs[s - 1]))} ${num(s)}:${num(a)}${b > a ? "–" + num(b) : ""}</a>
      <span><button class="ib" onclick="player.start(${s}, ${a})">${ICON.play}</button><button class="ib" onclick="noorShareImage(${s}, ${a})">${ICON.star}</button></span></div></div>`);
  }
  app.innerHTML = topbar(`<h1>${pick[1]} ${isAr() ? pick[3] : pick[2]}</h1>`) + `<div class="wrap" style="margin-top:6px">${cards.join("")}
    <a class="card cont" href="#/sheikh" style="margin-top:6px"><span class="sav">ش</span><div class="t"><div class="n" style="font-size:15px">${L("Want to talk it through?", "تريد أن تتحدث عن ذلك؟")}</div><div class="s">${L("Ask Sheikh Aws", "اسأل الشيخ أوس")}</div></div></a></div>`;
  nav("more");
}

/* ---------- learn the Arabic letters ---------- */
const LETTERS = [["ا", "Alif", "ألف", 1], ["ب", "Ba", "باء"], ["ت", "Ta", "تاء"], ["ث", "Tha", "ثاء"], ["ج", "Jim", "جيم"], ["ح", "Ha (deep)", "حاء"], ["خ", "Kha", "خاء"],
  ["د", "Dal", "دال", 1], ["ذ", "Dhal", "ذال", 1], ["ر", "Ra", "راء", 1], ["ز", "Zay", "زاي", 1], ["س", "Sin", "سين"], ["ش", "Shin", "شين"], ["ص", "Sad", "صاد"],
  ["ض", "Dad", "ضاد"], ["ط", "Ta (heavy)", "طاء"], ["ظ", "Za (heavy)", "ظاء"], ["ع", "Ayn", "عين"], ["غ", "Ghayn", "غين"], ["ف", "Fa", "فاء"], ["ق", "Qaf", "قاف"],
  ["ك", "Kaf", "كاف"], ["ل", "Lam", "لام"], ["م", "Mim", "ميم"], ["ن", "Nun", "نون"], ["ه", "Ha", "هاء"], ["و", "Waw", "واو", 1], ["ي", "Ya", "ياء"]];
const ZWJ = "‍";
function say(text) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = "ar-SA"; const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.startsWith("ar")); if (v) u.voice = v; u.rate = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { }
}
window.noorSay = say;
function viewLetters(m) {
  const mode = m && m[1] === "quiz" ? "quiz" : "learn", learned = store.get("letters", {});
  if (mode === "learn") {
    app.innerHTML = topbar(`<h1>${L("Learn the letters", "تعلّم الحروف")}</h1>`) + `<div class="wrap">
      <p class="lead">${L("Tap a letter to hear its name and see how it looks at the start, middle and end of a word.", "اضغط على الحرف لتسمع اسمه وترى شكله في أول الكلمة ووسطها وآخرها.")} · ${num(Object.keys(learned).length)} / ${num(28)}</p>
      <a class="btn wide" style="margin-top:12px" href="#/letters/quiz">🧩 ${L("Test yourself", "اختبر نفسك")}</a>
      <div class="letters">${LETTERS.map((l, i) => `<button class="lt ${learned[i] ? "on" : ""}" onclick="noorLetter(${i})"><span class="a">${l[0]}</span><span class="n">${isAr() ? l[2] : l[1]}</span></button>`).join("")}</div>
      <div class="sec">${L("The short vowels", "الحركات")}</div>
      <div class="card"><div class="vow">${[["بَ", "ba", "فتحة"], ["بِ", "bi", "كسرة"], ["بُ", "bu", "ضمة"], ["بْ", "b", "سكون"], ["بّ", "bb", "شدة"], ["بًا", "ban", "تنوين"]].map(v => `<button onclick="noorSay('${v[0]}')"><span class="a q">${v[0]}</span><span>${isAr() ? v[2] : v[1]}</span></button>`).join("")}</div></div></div>`;
    return nav("more");
  }
  let score = 0, q = 0;
  const ask = () => {
    q++; const i = Math.floor(Math.random() * 28), opts = new Set([i]); while (opts.size < 4) opts.add(Math.floor(Math.random() * 28));
    const form = ["", ZWJ, ZWJ][q % 3], tail = ["", "", ZWJ][q % 3], letter = LETTERS[i][3] ? LETTERS[i][0] : form + LETTERS[i][0] + (q % 3 === 2 ? "" : tail);
    app.innerHTML = topbar(`<h1>${L("Letter quiz", "اختبار الحروف")}</h1>`) + `<div class="wrap"><div class="rstat"><div><b>${num(score)}</b><span>${L("right", "صحيح")}</span></div><div><b>${num(q)}/10</b><span>${L("question", "سؤال")}</span></div></div>
      <div class="card" style="text-align:center"><div class="q" style="font-size:96px;line-height:1.6">${letter}</div><div class="lead">${L("Which letter is this?", "ما هذا الحرف؟")}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">${[...opts].sort(() => Math.random() - .5).map(o => `<button class="rec" style="justify-content:center" data-o="${o}"><b>${isAr() ? LETTERS[o][2] : LETTERS[o][1]}</b></button>`).join("")}</div></div>`;
    nav("more");
    app.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      const ok = +b.dataset.o === i; if (ok) { score++; const l = store.get("letters", {}); l[i] = 1; store.set("letters", l); }
      app.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (+x.dataset.o === i) x.classList.add("on"); else if (x === b) x.style.borderColor = "var(--bad)"; });
      say(LETTERS[i][2]); setTimeout(() => q >= 10 ? done() : ask(), 1200);
    });
  };
  const done = () => { app.innerHTML = topbar(`<h1>${L("Letter quiz", "اختبار الحروف")}</h1>`) + `<div class="wrap"><div class="rscore"><div class="ring" style="--p:${score * 10}"><div><b>${num(score)}</b><span>/ ${num(10)}</span></div></div>
    <div class="g">${score >= 9 ? L("Excellent!", "ممتاز!") : score >= 6 ? L("Well done", "أحسنت") : L("Keep practising", "واصل التدريب")}</div></div><div class="rbtns"><a class="btn ghost" href="#/letters">${L("Back to letters", "العودة للحروف")}</a><button class="btn" onclick="route()">${L("Again", "مرة أخرى")}</button></div></div>`; };
  ask();
}
window.noorLetter = i => {
  const l = LETTERS[i], solo = l[3], f = l[0];
  const forms = solo ? [[L("Alone", "منفصل"), f], [L("End", "آخر"), ZWJ + f]] : [[L("Alone", "منفصل"), f], [L("Start", "أول"), f + ZWJ], [L("Middle", "وسط"), ZWJ + f + ZWJ], [L("End", "آخر"), ZWJ + f]];
  const learned = store.get("letters", {}); learned[i] = 1; store.set("letters", learned);
  say(l[2]);
  sheet(`<div style="text-align:center"><div class="q" style="font-size:110px;line-height:1.5">${f}</div><h3>${l[1]} · ${l[2]}</h3>
    <div class="vow" style="margin-top:10px">${forms.map(([n, x]) => `<div><span class="a q">${x}</span><span>${n}</span></div>`).join("")}</div>
    <button class="btn wide" style="margin-top:14px" onclick="noorSay('${l[2]}')">🔊 ${L("Hear it again", "استمع مرة أخرى")}</button>
    <p class="lead" style="font-size:12px;margin-top:8px">${L("The sound uses your device's Arabic voice, if it has one.", "الصوت من صوت جهازك العربي إن وُجد.")}</p></div>`);
};

/* ---------- family khatma (through Mellow) ---------- */
window.noorKhatmaHtml = (k, meId) => {
  if (!k || k.done_at) return `<div class="card"><p class="lead" style="margin:0 0 10px">${k && k.done_at ? L("🎉 Your family finished a khatma together. Start another?", "🎉 أتمّت عائلتك ختمة معًا. هل تبدؤون أخرى؟") : L("Read the whole Quran together: everyone takes a juz.", "اقرؤوا القرآن كاملًا معًا: كل واحد يأخذ جزءًا.")}</p>
    <button class="btn wide" onclick="noorFamK('start')">${L("Start a family khatma", "ابدأ ختمة عائلية")}</button></div>`;
  return `<div class="card"><div class="sk"><span class="v" style="font-size:24px">${num(k.finished)}</span><span class="l">/ ${num(30)} ${L("juz read", "جزءًا مقروءًا")}</span></div>
    <div class="goal" style="margin:8px 0 12px"><div style="width:${k.finished / 30 * 100}%"></div></div>
    <div class="grid30">${k.juz.map(j => `<button class="${j.done ? "on" : ""} ${j.who === meId && !j.done ? "today" : ""}" onclick="noorFamK('tap', ${j.juz})" title="${esc(j.name || "")}">${num(j.juz)}<small style="display:block;font-size:9px;font-weight:600;line-height:1.1;overflow:hidden;white-space:nowrap">${j.done ? "✓" : esc((j.name || "").slice(0, 5))}</small></button>`).join("")}</div>
    <p class="lead" style="font-size:12.5px;margin-top:10px">${L("Tap a free juz to take it. Tap yours to read it, then mark it done.", "اضغط على جزء متاح لتأخذه. اضغط على جزئك لتقرأه ثم سجّله منجزًا.")}</p></div>`;
};
window.noorFamK = async (what, juz) => {
  const a = store.get("hb", null); if (!a) return;
  const call = body => fetch(NOOR.hb + "/api/noor-app/khatma", { method: "POST", headers: { Authorization: "Bearer " + a.token, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Error"); return j; });
  try {
    if (what === "start") { await call({ action: "start" }); toast(L("Family khatma started", "بدأت الختمة العائلية")); }
    else {
      const fam = store.get("hbFam", {}), j = ((fam.khatma || {}).juz || [])[juz - 1] || {}, me = (fam.my || a.me).id;
      if (!j.who) { await call({ action: "take", juz }); toast(L(`Juz ${juz} is yours`, `الجزء ${juz} لك`)); }
      else if (j.who === me) {
        const idx = await index(), start = idx.juz[juz - 1];
        sheet(`<h3>${L("Juz", "الجزء")} ${num(juz)}</h3><a class="btn wide" href="#/s/${start.s}/${start.a}">${ICON.book}${L("Read it", "اقرأه")}</a>
          <button class="btn wide soft" style="margin-top:8px" onclick="noorFamK('${j.done ? "undo" : "done"}', ${juz})">${j.done ? L("Not finished yet", "لم أنتهِ بعد") : "✓ " + L("I finished it", "أنهيته")}</button>
          ${j.done ? "" : `<button class="btn wide ghost" style="margin-top:8px" onclick="noorFamK('drop', ${juz})">${L("Give it back", "أعده")}</button>`}`);
        return;
      } else return toast(L(`Juz ${juz} is ${j.name}'s`, `الجزء ${juz} مع ${j.name}`));
    }
  } catch (e) { return toast(e.message); }
  route();
};
const _famk = window.noorFamK;
window.noorFamK = async (what, juz) => {
  if (["done", "undo", "drop"].includes(what)) {
    const a = store.get("hb", null);
    try { const r = await fetch(NOOR.hb + "/api/noor-app/khatma", { method: "POST", headers: { Authorization: "Bearer " + a.token, "Content-Type": "application/json" }, body: JSON.stringify({ action: what, juz }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || "Error"); if (what === "done") toast(L("Masha'Allah! Your family can see it.", "ما شاء الله! عائلتك ترى ذلك.")); } catch (e) { toast(e.message); }
    closeSheet(); return route();
  }
  return _famk(what, juz);
};

/* ---------- reading time ---------- */
setInterval(() => {
  if (document.visibilityState !== "visible" || !/^#\/(s|page)\//.test(location.hash)) return;
  const k = "readSec", d = store.get(k, {}), day = today(); d[day] = (d[day] || 0) + 15; store.set(k, d);
}, 15000);
window.noorReadMinutes = (days = 1) => { const d = store.get("readSec", {}); let s = 0; for (let i = 0; i < days; i++) s += d[dayKey(new Date(Date.now() - i * 864e5))] || 0; return Math.round(s / 60); };

/* ---------- a progress card to share ---------- */
window.noorShareProgress = async () => {
  const st = window.noorPlus ? noorPlus.myStats() : {}, W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#0b5c3b"); gr.addColorStop(1, "#17975f"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff"; g.textAlign = "center";
  g.font = "700 64px Inter, sans-serif"; g.fillText(L("My Quran journey", "رحلتي مع القرآن"), W / 2, 200);
  const rows = [["🔥", streakNow(), L("days in a row", "أيام متتالية")], ["📖", st.total || 0, L("ayahs read", "آية مقروءة")], ["⏱", noorReadMinutes(7), L("minutes this week", "دقيقة هذا الأسبوع")], ["🧠", st.memo || 0, L("surahs memorized", "سورة محفوظة")]];
  rows.forEach(([e, v, l], i) => { const y = 380 + i * 210; g.font = "90px sans-serif"; g.fillText(e, 230, y + 30); g.textAlign = "left"; g.font = "800 96px Inter, sans-serif"; g.fillText(String(v), 330, y + 20); g.font = "500 40px Inter, sans-serif"; g.fillStyle = "rgba(255,255,255,.8)"; g.fillText(l, 330, y + 80); g.fillStyle = "#fff"; g.textAlign = "center"; });
  g.font = "700 34px Inter, sans-serif"; g.fillStyle = "rgba(255,255,255,.7)"; g.fillText("Noor · noor-quran-xuzt.onrender.com", W / 2, H - 90);
  const blob = await new Promise(r => c.toBlob(r, "image/png")), file = new File([blob], "noor-progress.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch { } return; }
  const u = URL.createObjectURL(blob); sheet(`<h3>${L("Your progress card", "بطاقة تقدمك")}</h3><img src="${u}" style="width:100%;border-radius:16px"><a class="btn wide" style="margin-top:12px" href="${u}" download="noor-progress.png">${ICON.down}${L("Save picture", "حفظ الصورة")}</a>`);
};

VIEWS.push([/^\/feel(?:\/(\w+))?/, viewFeel], [/^\/letters(?:\/(\w+))?/, viewLetters]);
})();

/* ---------- the adhan at prayer time: by the phone itself in the Android app (even when closed), by the page elsewhere ---------- */
(() => {
  const P5 = [["fajr", "Fajr", "الفجر"], ["dhuhr", "Dhuhr", "الظهر"], ["asr", "Asr", "العصر"], ["maghrib", "Maghrib", "المغرب"], ["isha", "Isha", "العشاء"]];
  const native = () => window.AwsaaNative && typeof AwsaaNative.setAlarms === "function";
  const on = () => S.adhan || {};
  let audio = null;
  function plan(days = 7) {
    if (!S.loc || !window.noorPrayer) return [];
    const out = [], A = on();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() + i * 864e5), t = noorPrayer.prayerTimes(d, S.loc.lat, S.loc.lng, S.method, S.asr === "hanafi" ? 2 : 1);
      for (const [k, en, ar] of P5) if (A[k] && t[k] && t[k] > Date.now()) out.push({ at: t[k].getTime(), title: isAr() ? `حان وقت ${ar}` : `Time for ${en}`, body: isAr() ? "حيّ على الصلاة" : "Hayya 'ala as-salah · Come to prayer", k });
    }
    return out;
  }
  window.noorAdhanSync = () => { if (native()) { try { AwsaaNative.setAlarms(JSON.stringify(plan(7).concat(window.noorExtraAlarms ? noorExtraAlarms() : []).sort((a, b) => a.at - b.at))); } catch { } } };
  function play(title) {
    try { audio = audio || new Audio("/static/adhan/adhan.mp3"); audio.currentTime = 0; audio.volume = 1; audio.play().catch(() => { }); } catch { }
    try { if ("Notification" in window && Notification.permission === "granted") new Notification("🕌 " + title, { body: isAr() ? "حيّ على الصلاة" : "Come to prayer", icon: "/static/icon-192.png", tag: "adhan" }); } catch { }
    toast("🕌 " + title);
  }
  window.noorAdhanStop = () => { if (native()) { try { AwsaaNative.stop(); } catch { } } if (audio) audio.pause(); };
  window.noorAdhanTest = () => { if (native()) { try { AwsaaNative.test(); } catch { } } else play(L("This is how the adhan will sound", "هكذا سيكون صوت الأذان")); };
  window.noorAdhanToggle = async k => {
    const A = { ...on() };
    if (k === "all") { const any = P5.some(([p]) => A[p]); P5.forEach(([p]) => A[p] = !any); } else A[k] = !A[k];
    S.adhan = A; saveS();
    if (!native() && "Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch { } }
    noorAdhanSync(); route();
  };
  // in the page (web and Windows): check twice a minute while Noor is open
  setInterval(() => {
    if (native() || !S.loc) return;
    const now = Date.now(), played = store.get("adhanPlayed", {});

    const t = noorPrayer.prayerTimes(new Date(), S.loc.lat, S.loc.lng, S.method, S.asr === "hanafi" ? 2 : 1);
    for (const [k, en, ar] of P5) {
      if (!on()[k] || !t[k]) continue;
      const key = today() + ":" + k, dt = now - t[k].getTime();
      if (dt >= 0 && dt < 120000 && !played[key]) { played[key] = 1; store.set("adhanPlayed", played); play(isAr() ? `حان وقت ${ar}` : `Time for ${en}`); }
    }
  }, 20000);
  window.noorAdhanCard = () => {
    const A = on(), any = P5.some(([p]) => A[p]);
    return `<div class="sec">${L("Adhan", "الأذان")}<a onclick="noorAdhanToggle('all')" style="cursor:pointer">${any ? L("Turn all off", "إيقاف الكل") : L("Turn all on", "تشغيل الكل")}</a></div>
      <div class="card" style="padding:4px 14px">${P5.map(([k, en, ar]) => `<div class="opt"><span class="l">🕌 ${isAr() ? ar : en}</span><button class="sw ${A[k] ? "on" : ""}" onclick="noorAdhanToggle('${k}')" aria-label="${en}"></button></div>`).join("")}
      <div class="opt" style="gap:8px"><button class="btn soft" onclick="noorAdhanTest()">▶ ${L("Hear it", "استمع")}</button><button class="btn ghost" onclick="noorAdhanStop()">■ ${L("Stop", "إيقاف")}</button></div></div>
      <p class="lead" style="font-size:12.5px">${native() ? L("Plays out loud at prayer time, even when Noor is closed. Stop it from the notification.", "يُرفع الأذان بصوت عالٍ في وقت الصلاة حتى لو كان نور مغلقًا. أوقفه من الإشعار.")
        : L("Plays while Noor is open in this browser. For the adhan with the app closed, use the Android app.", "يعمل ما دام نور مفتوحًا في هذا المتصفح. للأذان والتطبيق مغلق استخدم تطبيق أندرويد.")}
        ${L("Recording: Aaqib Azeez, CC BY-SA 4.0, Wikimedia Commons.", "التسجيل: عاقب عزيز، CC BY-SA 4.0، ويكيميديا.")}</p>`;
  };
  setTimeout(() => noorAdhanSync(), 1500);
})();
