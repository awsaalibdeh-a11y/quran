/* Noor plus: tajweed colours, word by word, more translations, the mushaf by page, a memorization loop, badges and statistics.
   Tajweed, translations and word-by-word come from free Quran APIs the first time and are kept on the device after that. */
"use strict";
(() => {
/* ---------- translations in more languages (alquran.cloud) ---------- */
const LANGS = [["", "English only", "الإنجليزية فقط"], ["ur.jalandhry", "اردو · Urdu", "الأردية"], ["fr.hamidullah", "Français", "الفرنسية"], ["tr.diyanet", "Türkçe", "التركية"],
  ["id.indonesian", "Bahasa Indonesia", "الإندونيسية"], ["ms.basmeih", "Bahasa Melayu", "الملايوية"], ["es.cortes", "Español", "الإسبانية"], ["de.bubenheim", "Deutsch", "الألمانية"],
  ["bn.bengali", "বাংলা · Bengali", "البنغالية"], ["ru.kuliev", "Русский", "الروسية"], ["fa.makarem", "فارسی · Persian", "الفارسية"], ["hi.farooq", "हिन्दी · Hindi", "الهندية"],
  ["zh.jian", "中文 · Chinese", "الصينية"], ["so.abduh", "Soomaali", "الصومالية"], ["sw.barwani", "Kiswahili", "السواحيلية"], ["bs.korkut", "Bosanski", "البوسنية"],
  ["sq.ahmeti", "Shqip · Albanian", "الألبانية"], ["nl.siregar", "Nederlands", "الهولندية"], ["it.piccardo", "Italiano", "الإيطالية"], ["ta.tamil", "தமிழ் · Tamil", "التاميلية"], ["ha.gumi", "Hausa", "الهوسا"]];
const RTL_LANGS = /^(ur|fa)\./;
const trCache = {};
async function apiSurah(n, ed) {
  const key = `${ed}:${n}`; if (trCache[key]) return trCache[key];
  const u = `https://api.alquran.cloud/v1/surah/${n}/${ed}`;
  let res = null;
  try { const c = await caches.open("noor-extra-v1"); res = await c.match(u); if (!res) { const r = await fetch(u); if (r.ok) { await c.put(u, r.clone()); res = r; } } } catch { }
  if (!res) { try { res = await fetch(u); } catch { return null; } }
  try { const j = await res.json(); return trCache[key] = j.data.ayahs.map(a => a.text); } catch { return null; }
}
window.noorTr = async n => S.tl ? apiSurah(n, S.tl) : null;
window.noorTrDir = () => RTL_LANGS.test(S.tl || "") ? "rtl" : "ltr";

/* ---------- tajweed colours ---------- */
const TJ = { h: ["#9aa1a6", "Hamzat al-wasl (not said)", "همزة وصل"], s: ["#9aa1a6", "Silent letter", "حرف لا يُنطق"], l: ["#9aa1a6", "Lam shamsiyyah", "لام شمسية"],
  n: ["#537fff", "Madd, 2 counts", "مد طبيعي"], p: ["#4050ff", "Madd, 2/4/6 counts", "مد جائز"], m: ["#000ebc", "Madd lazim, 6 counts", "مد لازم"], o: ["#2144c1", "Madd wajib, 4-5 counts", "مد واجب"],
  q: ["#dd0008", "Qalqalah", "قلقلة"], c: ["#d500b7", "Ikhfa shafawi", "إخفاء شفوي"], f: ["#9400a8", "Ikhfa", "إخفاء"], w: ["#58b800", "Idgham shafawi", "إدغام شفوي"],
  i: ["#26bffd", "Iqlab", "إقلاب"], a: ["#169777", "Idgham with ghunnah", "إدغام بغنة"], u: ["#169200", "Idgham without ghunnah", "إدغام بلا غنة"],
  d: ["#a1a1a1", "Idgham mutajanisayn", "إدغام متجانسين"], b: ["#a1a1a1", "Idgham mutaqaribayn", "إدغام متقاربين"], g: ["#ff7e1e", "Ghunnah, 2 counts", "غنة"] };
const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function tajweedHtml(t) {
  return esc2(t).replace(/\[([a-z])(?::\d+)?\[([^\]]*)\]/g, (m, k, txt) => TJ[k] ? `<span style="color:${TJ[k][0]}">${txt}</span>` : txt);
}
const bare = w => w.replace(/[ؐ-ًؚ-ٰٟۖ-ۭ\[\]:a-z0-9]/g, "").replace(/ٱ/g, "ا");
window.noorTajweed = async n => {
  if (!S.tajweed) return null;
  const list = await apiSurah(n, "quran-tajweed"); if (!list) return null;
  return list.map((t, i) => {
    if (i === 0 && n !== 1 && n !== 9) { const w = t.split(" "); if (bare(w.slice(0, 4).join(" ")).startsWith("بسم الله الرحمن الرحيم".slice(0, 6))) t = w.slice(4).join(" "); }
    return tajweedHtml(t);
  });
};
window.noorTajweedKey = () => sheet(`<h3>${L("Tajweed colours", "ألوان التجويد")}</h3>${Object.entries(TJ).filter(([k], i, a) => a.findIndex(x => x[1][1] === TJ[k][1]) === i)
  .map(([, v]) => `<div class="opt"><span style="width:18px;height:18px;border-radius:50%;background:${v[0]};flex:none"></span><span class="l">${isAr() ? v[2] : v[1]}</span></div>`).join("")}`);

/* ---------- word by word (quran.com) ---------- */
const wbwCache = {};
async function words(s, a) {
  const key = `${s}:${a}`; if (wbwCache[key]) return wbwCache[key];
  const u = `https://api.quran.com/api/v4/verses/by_key/${key}?words=true&word_fields=text_uthmani&language=${["ur", "id", "bn", "tr", "fa", "hi"].find(x => (S.tl || "").startsWith(x)) || "en"}`;
  let res = null;
  try { const c = await caches.open("noor-extra-v1"); res = await c.match(u); if (!res) { const r = await fetch(u); if (r.ok) { await c.put(u, r.clone()); res = r; } } } catch { }
  if (!res) res = await fetch(u);
  const j = await res.json();
  return wbwCache[key] = j.verse.words.filter(w => w.char_type_name === "word").map(w => ({ ar: w.text_uthmani, en: (w.translation || {}).text || "", tr: (w.transliteration || {}).text || "", audio: w.audio_url }));
}
window.noorWbw = async (s, a, el) => {
  const old = el.querySelector(".wbw"); if (old) return old.remove();
  el.insertAdjacentHTML("beforeend", `<div class="wbw"><div class="empty" style="padding:10px">…</div></div>`);
  const box = el.querySelector(".wbw");
  try {
    const ws = await words(s, a);
    box.innerHTML = ws.map((w, i) => `<button class="wd" data-i="${i}"><span class="a q">${w.ar}</span><span class="t">${esc2(w.tr)}</span><span class="m">${esc2(w.en)}</span></button>`).join("");
    box.onclick = e => { const b = e.target.closest(".wd"); if (!b) return; const w = ws[+b.dataset.i]; if (w.audio) { const au = new Audio("https://audio.qurancdn.com/" + w.audio); au.play().catch(() => { }); }
      box.querySelectorAll(".wd").forEach(x => x.classList.toggle("on", x === b)); };
  } catch { box.innerHTML = `<div class="empty" style="padding:10px">${L("Word by word needs the internet the first time.", "معاني الكلمات تحتاج إلى إنترنت أول مرة.")}</div>`; }
};

/* ---------- the mushaf by page (1-604) ---------- */
let PAGES = null;                                                           // page -> [[surah, from, to], ...]
async function pageMap() {
  if (!PAGES) PAGES = await (await fetch("/static/q/pages.json?v=1")).json();
  return PAGES;
}
async function viewPage(m) {
  const n = Math.min(604, Math.max(1, +(m && m[1]) || store.get("lastPage", 1)));
  store.set("lastPage", n);
  app.innerHTML = topbar(`<h1>${L("Page", "صفحة")} ${num(n)}</h1>`, true, `<button class="ib" onclick="noorPageJump()" aria-label="Go to page">${ICON.search}</button>`) + `<div class="wrap" id="pgw0"><div class="empty">…</div></div>`;
  nav("quran");
  const P = await pageMap(), idx = await index(), rows = [];
  for (const [sn, a, b] of P[n - 1] || []) { const d = await surah(sn); for (let i = a; i <= b; i++) rows.push([sn, d.ayahs[i - 1]]); }
  const tj = {}; if (S.tajweed) for (const sn of [...new Set(rows.map(r => r[0]))]) tj[sn] = await noorTajweed(sn);
  let html = "", cur = 0;
  for (const [sn, a] of rows) {
    if (sn !== cur) { cur = sn; if (a.n === 1) html += `${html ? "</div>" : ""}<div class="pghead q">${idx.surahs[sn - 1].name}</div>${sn !== 1 && sn !== 9 ? `<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ""}<div class="mushaf pg">`; else if (!html) html += `<div class="mushaf pg">`; }
    html += `<span class="w" data-s="${sn}" data-a="${a.n}">${tj[sn] ? tj[sn][a.n - 1] : a.ar}<span class="mark">﴿${arNum(a.n)}﴾</span></span> `;
  }
  html += "</div>";
  const first = rows[0], juz = first ? first[1].juz : 1;
  $("#pgw0").outerHTML = `<div class="wrap" id="pgw"><div class="pgbar"><span>${first ? esc(sName(idx.surahs[first[0] - 1])) : ""}</span><span>${L("Juz", "الجزء")} ${num(juz)}</span></div>
    <div id="pgbody">${html}</div>
    <div class="pager"><a class="btn ghost" href="#/page/${Math.max(1, n - 1)}">${L("Previous page", "الصفحة السابقة")}</a><a class="btn" href="#/page/${Math.min(604, n + 1)}">${L("Next page", "الصفحة التالية")}</a></div>
    <div class="goal"><div style="width:${n / 604 * 100}%"></div></div><p class="lead" style="text-align:center;font-size:12.5px">${num(n)} / ${num(604)}</p></div>`;
  for (const [sn, a] of rows) markRead(sn, a.n);
  $("#pgbody").onclick = e => { const w = e.target.closest(".w"); if (w) player.start(+w.dataset.s, +w.dataset.a); };
  // swipe: in Arabic the next page is to the left, as in a printed mushaf
  let x0 = null; const body = $("#pgw");
  body.ontouchstart = e => { x0 = e.touches[0].clientX; };
  body.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) < 70) return; location.hash = `#/page/${Math.min(604, Math.max(1, n + (dx > 0 ? 1 : -1)))}`; };
}
window.noorPageJump = () => { const v = prompt(L("Go to page (1-604)", "اذهب إلى الصفحة (١-٦٠٤)"), store.get("lastPage", 1)); if (v && +v >= 1 && +v <= 604) location.hash = "#/page/" + (+v); };

/* ---------- memorization loop ---------- */
window.noorLoop = async n => {
  const d = await surah(n);
  sheet(`<h3>${L("Memorization loop", "تكرار للحفظ")}</h3><p class="lead">${L("Listen to a few ayahs again and again until they stay with you.", "استمع إلى بضع آيات مرة بعد مرة حتى تحفظها.")}</p>
    <div class="opt"><span class="l">${L("From ayah", "من آية")}</span><input id="lpA" class="sel" inputmode="numeric" value="1" style="width:80px"></div>
    <div class="opt"><span class="l">${L("To ayah", "إلى آية")}</span><input id="lpB" class="sel" inputmode="numeric" value="${Math.min(d.count, 5)}" style="width:80px"></div>
    <div class="opt"><span class="l">${L("Each ayah", "كل آية")}</span><div class="seg" id="lpE">${[1, 2, 3, 5].map((v, i) => `<button class="${i === 2 ? "on" : ""}" data-v="${v}">${num(v)}×</button>`).join("")}</div></div>
    <div class="opt"><span class="l">${L("The whole range", "المقطع كله")}</span><div class="seg" id="lpR">${[1, 3, 5, 10].map((v, i) => `<button class="${i === 1 ? "on" : ""}" data-v="${v}">${num(v)}×</button>`).join("")}</div></div>
    <button class="btn wide" style="margin-top:12px" id="lpGo">${ICON.play}${L("Start", "ابدأ")}</button>`);
  for (const id of ["#lpE", "#lpR"]) $(id).onclick = e => { const b = e.target.closest("button"); if (b) $(id).querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
  $("#lpGo").onclick = () => {
    const a = Math.max(1, Math.min(d.count, +$("#lpA").value || 1)), b = Math.max(a, Math.min(d.count, +$("#lpB").value || a));
    player.loop = { s: n, a, b, each: +$("#lpE .on").dataset.v, times: +$("#lpR .on").dataset.v, done: 0 };
    player.repeat = player.loop.each; closeSheet(); player.start(n, a);
    toast(L(`Ayahs ${a}–${b}, ${player.loop.times} times`, `الآيات ${a}–${b}، ${player.loop.times} مرات`));
  };
};

/* ---------- badges and statistics ---------- */
const BADGES = [
  ["streak3", "🔥", "3 days in a row", "٣ أيام متتالية", s => s.best >= 3], ["streak7", "🔥", "A week in a row", "أسبوع متواصل", s => s.best >= 7],
  ["streak30", "🏆", "30 days in a row", "٣٠ يومًا متتالية", s => s.best >= 30], ["streak100", "👑", "100 days in a row", "١٠٠ يوم متتالية", s => s.best >= 100],
  ["read100", "📖", "100 ayahs read", "١٠٠ آية", s => s.total >= 100], ["read1000", "📚", "1,000 ayahs read", "١٠٠٠ آية", s => s.total >= 1000],
  ["khatma", "🌙", "Finished a khatma", "أتممت ختمة", s => s.khatma], ["hifz1", "🧠", "First surah memorized", "أول سورة محفوظة", s => s.memo >= 1],
  ["hifz10", "🌟", "10 surahs memorized", "١٠ سور محفوظة", s => s.memo >= 10], ["amma", "💎", "Juz Amma memorized", "حفظت جزء عمّ", s => s.amma],
  ["perfect", "🎯", "A perfect recitation", "تسميع بلا أخطاء", s => s.perfect], ["recite10", "🎙", "10 recitations", "١٠ تسميعات", s => s.recites >= 10],
  ["quiz", "🧩", "10/10 in the quiz", "١٠/١٠ في المسابقة", s => s.quiz >= 10], ["game3", "🎮", "Reached level 3 in Noor Quest", "المرحلة ٣ في رحلة نور", s => s.game >= 3],
  ["tasbih", "📿", "1,000 tasbih", "١٠٠٠ تسبيحة", s => s.tasbih >= 1000], ["names", "✨", "Learned the 99 Names", "تعلمت الأسماء الحسنى", s => s.names >= 99],
  ["prayed", "🕌", "All five prayers in a day", "الصلوات الخمس في يوم", s => s.five], ["notes", "✎", "Wrote 5 reflections", "٥ تأملات", s => s.notes >= 5],
];
function myStats() {
  const days = store.get("days", {}), H = store.get("hifz", {}), log = store.get("reciteLog", []), K = store.get("khatma", null);
  const memo = Object.entries(H).filter(([, v]) => v === "done").map(([s]) => +s);
  let five = false; for (let i = 0; i < 60 && !five; i++) { const P = store.get("prayed-" + dayKey(new Date(Date.now() - i * 864e5)), {}); five = ["fajr", "dhuhr", "asr", "maghrib", "isha"].every(k => P[k]); }
  return { best: Math.max(store.get("bestStreak", 0), streakNow()), total: Object.values(days).reduce((a, b) => a + b, 0), khatma: !!(K && Object.keys(K.done || {}).length >= K.days),
    memo: memo.length, amma: Array.from({ length: 37 }, (_, i) => 78 + i).every(s => H[s] === "done"), perfect: log.some(x => x.score === 100), recites: log.length,
    quiz: (store.get("quiz", {}).best || 0), game: store.get("gameLevel", 0), tasbih: (store.get("tasbih", {}).total || 0), names: Object.keys(store.get("names", {})).length, five,
    notes: Object.values(store.get("marks", {})).filter(m => m.note).length, days };
}
function checkBadges() {
  const s = myStats(), have = store.get("badges", {});
  for (const [id, ic, en, ar, ok] of BADGES) if (!have[id] && ok(s)) { have[id] = Date.now(); store.set("badges", have); toast(`${ic} ${L("New badge", "وسام جديد")}: ${isAr() ? ar : en}`); break; }
}
window.addEventListener("hashchange", () => setTimeout(checkBadges, 800));
function viewStats() {
  const s = myStats(), have = store.get("badges", {});
  const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 864e5); return [d, s.days[dayKey(d)] || 0]; });
  const max = Math.max(5, ...last30.map(x => x[1])), active = last30.filter(x => x[1]).length;
  app.innerHTML = topbar(`<h1>${L("My progress", "تقدمي")}</h1>`) + `<div class="wrap">
    <div class="stat3" style="margin-top:6px"><div class="card"><div class="v">${num(s.total)}</div><div class="l">${L("ayahs read", "آية مقروءة")}</div></div>
      <div class="card"><div class="v">${num(s.best)}</div><div class="l">${L("best streak", "أطول سلسلة")}</div></div><div class="card"><div class="v">${num(s.memo)}</div><div class="l">${L("surahs memorized", "سورة محفوظة")}</div></div></div>
    <div class="sec">${L("Last 30 days", "آخر ٣٠ يومًا")}<a>${num(active)} ${L("active days", "يوم نشط")}</a></div>
    <div class="card"><div class="bars">${last30.map(([d, v]) => `<span title="${d.toLocaleDateString()}: ${v}"><i style="height:${Math.max(3, v / max * 100)}%;opacity:${v ? 1 : .25}"></i></span>`).join("")}</div>
      <div style="display:flex;justify-content:space-between;color:var(--quiet);font-size:11.5px;margin-top:6px"><span>${last30[0][0].toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })}</span><span>${L("today", "اليوم")}</span></div></div>
    <div class="sec">${L("Badges", "الأوسمة")}<a>${num(Object.keys(have).length)} / ${num(BADGES.length)}</a></div>
    <div class="badges">${BADGES.map(([id, ic, en, ar]) => `<div class="bdg ${have[id] ? "on" : ""}"><span class="i">${have[id] ? ic : "🔒"}</span><span>${isAr() ? ar : en}</span></div>`).join("")}</div></div>`;
  nav("more");
}

VIEWS.push([/^\/page(?:\/(\d+))?/, viewPage], [/^\/stats/, viewStats]);
window.noorPlus = { LANGS, myStats, BADGES, tajweedHtml };
setTimeout(checkBadges, 2500);
})();
