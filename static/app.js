/* Noor: Quran reader. Routes: #/ home, #/s/<surah>[/<ayah>], #/juz/<n>, #/search?q=, #/bookmarks, #/tasbih */
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const app = $("#app");
const AUDIO = "https://cdn.islamic.network/quran/audio";
const RECITERS = [
  { id: "ar.alafasy", en: "Mishary Alafasy", ar: "مشاري العفاسي", kbps: 128 },
  { id: "ar.abdulbasitmurattal", en: "Abdul Basit (Murattal)", ar: "عبد الباسط عبد الصمد", kbps: 64 },
  { id: "ar.husary", en: "Mahmoud Khalil Al-Husary", ar: "محمود خليل الحصري", kbps: 128 },
  { id: "ar.minshawi", en: "Mohamed Siddiq Al-Minshawi", ar: "محمد صديق المنشاوي", kbps: 128 },
  { id: "ar.mahermuaiqly", en: "Maher Al-Muaiqly", ar: "ماهر المعيقلي", kbps: 128 },
  { id: "ar.abdurrahmaansudais", en: "Abdurrahman As-Sudais", ar: "عبد الرحمن السديس", kbps: 64 },
  { id: "ar.saoodshuraym", en: "Saud Ash-Shuraim", ar: "سعود الشريم", kbps: 64 },
  { id: "ar.hudhaify", en: "Ali Al-Hudhaify", ar: "علي الحذيفي", kbps: 128 },
  { id: "ar.muhammadayyoub", en: "Muhammad Ayyub", ar: "محمد أيوب", kbps: 128 },
];

/* ---------- saved settings (this device only) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("noor." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("noor." + k, JSON.stringify(v)); } catch { } },
};
const S = Object.assign({ lang: "en", theme: "dark", ar: 30, en: true, tr: false, mushaf: false, reciter: "ar.alafasy", speed: 1 }, store.get("settings", {}));
const saveS = () => store.set("settings", S);
let bookmarks = store.get("bookmarks", []);          // [{s, a, at}]
let last = store.get("last", null);                  // {s, a, at}

/* ---------- words ---------- */
const T = {
  en: { hi: ["Good morning", "Good afternoon", "Good evening"], cont: "Continue reading", start: "Start reading", fatiha: "Begin with Al-Fatihah",
    surahs: "Surahs", juz: "Juz", saved: "Saved", search: "Search the Quran, in Arabic or English", ayahs: "ayahs", meccan: "Meccan", medinan: "Medinan",
    daily: "Ayah of the day", streak: "days in a row", readToday: "ayahs today", play: "Play", pause: "Pause", listen: "Listen", tafsir: "Tafsir (Al-Muyassar)",
    bookmark: "Save", saved1: "Saved", copy: "Copy", share: "Share", copied: "Copied", settings: "Settings", lang: "Language", theme: "Look",
    dark: "Dark", light: "Light", arsize: "Arabic size", trans: "English translation", translit: "Transliteration", mode: "Reading mode",
    cards: "Ayah by ayah", mushafm: "Mushaf", reciter: "Reciter", offline: "Save for offline", offlineD: "Keep all 114 surahs on this device (about 6 MB) to read without internet.",
    offlineDone: "Saved: the whole Quran works offline", download: "Save", next: "Next surah", prev: "Previous surah", noSaved: "Nothing saved yet. Tap the bookmark on any ayah.",
    results: "results", noRes: "Nothing found", juzN: "Juz", tasbih: "Tasbih", reset: "Reset", tap: "Tap", app: "Get the Android app",
    page: "Page", made: "Made by", text: "Text: Tanzil Uthmani. Translation: Saheeh International. Tafsir: Al-Muyassar. Audio: Islamic Network.",
    repeatOff: "1×", stopped: "Stopped", playingAyah: "Ayah", ofS: "of", from: "Play from here", playSurah: "Play surah", sajda: "Sajdah" },
  ar: { hi: ["صباح الخير", "مساء الخير", "مساء الخير"], cont: "تابع القراءة", start: "ابدأ القراءة", fatiha: "ابدأ بالفاتحة",
    surahs: "السور", juz: "الأجزاء", saved: "المحفوظ", search: "ابحث في القرآن بالعربية أو الإنجليزية", ayahs: "آية", meccan: "مكية", medinan: "مدنية",
    daily: "آية اليوم", streak: "أيام متتالية", readToday: "آية اليوم", play: "تشغيل", pause: "إيقاف", listen: "استمع", tafsir: "التفسير الميسر",
    bookmark: "حفظ", saved1: "محفوظة", copy: "نسخ", share: "مشاركة", copied: "تم النسخ", settings: "الإعدادات", lang: "اللغة", theme: "المظهر",
    dark: "داكن", light: "فاتح", arsize: "حجم الخط", trans: "الترجمة الإنجليزية", translit: "النطق باللاتينية", mode: "طريقة القراءة",
    cards: "آية آية", mushafm: "مصحف", reciter: "القارئ", offline: "حفظ للاستخدام دون إنترنت", offlineD: "احفظ السور الـ114 على هذا الجهاز (حوالي 6 ميغابايت) للقراءة دون إنترنت.",
    offlineDone: "تم الحفظ: القرآن كله يعمل دون إنترنت", download: "حفظ", next: "السورة التالية", prev: "السورة السابقة", noSaved: "لا شيء محفوظ بعد. اضغط على علامة الحفظ في أي آية.",
    results: "نتيجة", noRes: "لا توجد نتائج", juzN: "الجزء", tasbih: "المسبحة", reset: "تصفير", tap: "اضغط", app: "حمّل تطبيق أندرويد",
    page: "صفحة", made: "صنعه", text: "النص: تنزيل (الرسم العثماني). الترجمة: صحيح إنترناشونال. التفسير: الميسر. الصوت: Islamic Network.",
    repeatOff: "1×", stopped: "توقف", playingAyah: "آية", ofS: "من", from: "شغّل من هنا", playSurah: "تشغيل السورة", sajda: "سجدة" },
};
const t = k => (T[S.lang] || T.en)[k] ?? T.en[k];
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arNum = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
const num = n => S.lang === "ar" ? arNum(n) : String(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ICON = {
  back: '<svg class="flip" viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  mark: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  markO: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4zm2 2v12.3l4-2.7 4 2.7V5z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zm16 0h-4a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h4z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>',
  beads: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="20" cy="13" r="2"/><circle cx="6" cy="7" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="12" cy="20" r="2.4"/></svg>',
};

function applyLook() {
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
  document.documentElement.style.setProperty("--ar", S.ar + "px");
  $('meta[name="theme-color"]').content = S.theme === "light" ? "#f5f5f3" : "#0b0b0c";
}

/* ---------- data ---------- */
let INDEX = null;
const cache = {};
async function index() { if (!INDEX) INDEX = await (await fetch("/static/q/index.json?v=1")).json(); return INDEX; }
async function surah(n) { if (!cache[n]) cache[n] = await (await fetch(`/static/q/${n}.json?v=1`)).json(); return cache[n]; }
const sName = s => S.lang === "ar" ? s.name : s.en;

/* ---------- reading progress: streak and today's count ---------- */
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function markRead(s, a) {
  last = { s, a, at: Date.now() }; store.set("last", last);
  const p = store.get("progress", { day: "", count: 0, seen: [], streak: 0, lastDay: "" });
  const d = today();
  if (p.day !== d) {
    const y = new Date(Date.now() - 864e5); const yd = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    p.streak = p.lastDay === yd ? p.streak + 1 : 1; p.day = d; p.count = 0; p.seen = []; p.lastDay = d;
  }
  const key = s * 1000 + a;
  if (!p.seen.includes(key)) { p.seen.push(key); p.count++; if (p.seen.length > 800) p.seen = p.seen.slice(-800); }
  store.set("progress", p);
}

/* ---------- views ---------- */
function topbar(title, back = true, extra = "") {
  return `<div class="top"><div class="wrap">${back ? `<button class="ib" onclick="goBack()" aria-label="Back">${ICON.back}</button>` : ""}
    ${title}${extra}<button class="ib" onclick="openSettings()" aria-label="${t("settings")}">${ICON.gear}</button></div></div>`;
}
let hops = 0;                                                          // pages opened inside the app since it started
window.goBack = () => { if (hops > 0) history.back(); else location.hash = "#/"; };

async function viewHome() {
  const idx = await index();
  const h = new Date().getHours();
  const p = store.get("progress", { day: "", count: 0, streak: 0 });
  const streak = p.day === today() || p.lastDay === today() ? p.streak : 0;
  const lastS = last && idx.surahs[last.s - 1];
  const tab = store.get("tab", "surahs");
  app.innerHTML = topbar(`<div class="brand"><img src="/static/icon-192.png" alt="">Noor</div>`, false,
    `<button class="ib" onclick="location.hash='#/tasbih'" aria-label="${t("tasbih")}">${ICON.beads}</button>`) + `<div class="wrap">
    <div class="hero"><div class="hi">${t("hi")[h < 12 ? 0 : h < 17 ? 1 : 2]}</div><h2>${S.lang === "ar" ? "القرآن الكريم" : "The Holy Quran"}</h2></div>
    <a class="card cont" href="${lastS ? `#/s/${last.s}/${last.a}` : "#/s/1"}"><div class="t"><div class="k">${lastS ? t("cont") : t("start")}</div>
      <div class="n">${lastS ? esc(sName(lastS)) : t("fatiha")}</div>${lastS ? `<div class="s">${t("playingAyah")} ${num(last.a)} ${t("ofS")} ${num(lastS.count)}</div>` : ""}</div>
      <span class="btn">${S.lang === "ar" ? "اقرأ" : "Read"}</span></a>
    <div class="streak"><div class="card"><div class="v">${num(streak)}</div><div class="l">${t("streak")}</div></div>
      <div class="card"><div class="v">${num(p.day === today() ? p.count : 0)}</div><div class="l">${t("readToday")}</div></div></div>
    <div id="daily"></div>
    <div class="quick">${[[18, 1, "Al-Kahf", "الكهف"], [36, 1, "Ya-Sin", "يس"], [67, 1, "Al-Mulk", "الملك"], [2, 255, "Ayat al-Kursi", "آية الكرسي"], [55, 1, "Ar-Rahman", "الرحمن"], [56, 1, "Al-Waqi'ah", "الواقعة"], [2, 285, "End of Al-Baqarah", "خواتيم البقرة"]]
      .map(([s, a, en, ar]) => `<a class="pill" href="#/s/${s}/${a}">${S.lang === "ar" ? ar : en}</a>`).join("")}</div>
    <form class="search" onsubmit="event.preventDefault(); const q=this.q.value.trim(); if(q) location.hash='#/search?q='+encodeURIComponent(q)">${ICON.search}
      <input name="q" placeholder="${t("search")}" autocomplete="off" enterkeyhint="search"></form>
    <div class="tabs">${["surahs", "juz", "saved"].map(k => `<button class="${tab === k ? "on" : ""}" onclick="store.set('tab','${k}'); viewHome()">${t(k)}</button>`).join("")}</div>
    <div class="list" id="list"></div>
    <div class="foot"><b>${t("made")} Awsaa</b><br>${t("text")}${NOOR.apk ? `<br><a href="/noor.apk" style="color:var(--gold)">${t("app")}</a>` : ""}</div></div>`;
  daily(idx);
  const list = $("#list");
  if (tab === "surahs") list.innerHTML = idx.surahs.map(s => surahRow(s)).join("");
  else if (tab === "juz") list.innerHTML = idx.juz.map((j, i) => { const s = idx.surahs[j.s - 1];
    return `<a class="row" href="#/s/${j.s}/${j.a}"><div class="num"><span>${num(i + 1)}</span></div><div class="mid"><div class="t1">${t("juzN")} ${num(i + 1)}</div>
      <div class="t2">${esc(sName(s))} ${num(j.s)}:${num(j.a)}</div></div><div class="arn">${s.name}</div></a>`; }).join("");
  else {
    const rows = [...bookmarks].sort((a, b) => b.at - a.at);
    list.innerHTML = rows.length ? rows.map(b => { const s = idx.surahs[b.s - 1];
      return `<a class="row" href="#/s/${b.s}/${b.a}"><div class="num"><span>${num(b.a)}</span></div><div class="mid"><div class="t1">${esc(sName(s))}</div>
        <div class="t2">${t("playingAyah")} ${num(b.a)} · ${new Date(b.at).toLocaleDateString(S.lang)}</div></div><div class="arn">${s.name}</div></a>`; }).join("")
      : `<div class="empty">${t("noSaved")}</div>`;
  }
}
function surahRow(s) {
  return `<a class="row" href="#/s/${s.n}"><div class="num"><span>${num(s.n)}</span></div><div class="mid"><div class="t1">${esc(S.lang === "ar" ? s.name : s.en)}</div>
    <div class="t2">${S.lang === "ar" ? "" : esc(s.meaning) + " · "}${t(s.type === "Meccan" ? "meccan" : "medinan")} · ${num(s.count)} ${t("ayahs")}</div></div>
    ${S.lang === "ar" ? "" : `<div class="arn">${s.name}</div>`}</a>`;
}
async function daily(idx) {
  const d = new Date(); const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  const g = (seed * 7919) % 6236 + 1;                                    // a different ayah every day, the same for everyone
  let s = 0, left = g; while (left > idx.surahs[s].count) { left -= idx.surahs[s].count; s++; }
  const data = await surah(s + 1); const a = data.ayahs[left - 1];
  const box = $("#daily"); if (!box) return;
  box.innerHTML = `<a class="card daily" href="#/s/${s + 1}/${left}" style="display:block"><div class="cont" style="margin:0 0 6px"><div class="k" style="color:var(--gold);font-size:12px;font-weight:600;letter-spacing:.8px;text-transform:uppercase">${t("daily")}</div></div>
    <div class="ar">${a.ar}</div>${S.en ? `<div class="en">${esc(a.en)}</div>` : ""}<div class="ref">${esc(sName(idx.surahs[s]))} ${num(s + 1)}:${num(left)}</div></a>`;
}

let observer = null;
async function viewSurah(n, focus) {
  const idx = await index();
  n = Math.min(114, Math.max(1, n | 0));
  const data = await surah(n);
  const info = idx.surahs[n - 1];
  const isMarked = a => bookmarks.some(b => b.s === n && b.a === a);
  let juzSeen = data.ayahs[0].juz;
  const body = S.mushaf
    ? `<div class="mushaf">${data.ayahs.map(a => `<span class="w" id="a${a.n}" data-a="${a.n}">${a.ar}<span class="mark">﴿${arNum(a.n)}﴾</span></span>`).join(" ")}</div>`
    : data.ayahs.map(a => {
      let jh = ""; if (a.juz !== juzSeen) { juzSeen = a.juz; jh = `<div class="juzh">${t("juzN")} ${num(a.juz)}</div>`; }
      return `${jh}<div class="ayah" id="a${a.n}" data-a="${a.n}"><div class="bar"><span class="ref">${num(n)}:${num(a.n)}</span>${a.sajda ? `<span class="sajda">۩ ${t("sajda")}</span>` : ""}<span class="sp"></span>
        <button class="ib" data-act="play" aria-label="${t("listen")}">${ICON.play}</button>
        <button class="ib" data-act="tafsir" aria-label="${t("tafsir")}">${ICON.book}</button>
        <button class="ib ${isMarked(a.n) ? "on" : ""}" data-act="mark" aria-label="${t("bookmark")}">${isMarked(a.n) ? ICON.mark : ICON.markO}</button>
        <button class="ib" data-act="more" aria-label="More">${ICON.more}</button></div>
        <div class="ar">${a.ar}<span class="mark">﴿${arNum(a.n)}﴾</span></div>
        ${S.tr ? `<div class="tr">${esc(a.tr)}</div>` : ""}${S.en ? `<div class="en">${esc(a.en)}</div>` : ""}</div>`;
    }).join("");
  app.innerHTML = topbar(`<h1>${esc(sName(info))}</h1>`) + `<div class="wrap">
    <div class="shead"><div class="arn">${info.name}</div><div class="t">${esc(info.en)}${S.lang === "ar" ? "" : " · " + esc(info.meaning)}</div>
      <div class="s">${t(info.type === "Meccan" ? "meccan" : "medinan")} · ${num(info.count)} ${t("ayahs")} · ${t("juzN")} ${num(info.juz)} · ${t("page")} ${num(info.page)}</div>
      <div class="acts"><button class="btn" onclick="player.start(${n}, 1)">${t("playSurah")}</button>
        <button class="btn ghost" onclick="S.mushaf=!S.mushaf; saveS(); route()">${S.mushaf ? t("cards") : t("mushafm")}</button></div></div>
    ${n !== 1 && n !== 9 ? `<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ""}
    <div id="ayahs">${body}</div>
    <div class="pager">${n > 1 ? `<a class="btn ghost" href="#/s/${n - 1}">${t("prev")}</a>` : ""}${n < 114 ? `<a class="btn" href="#/s/${n + 1}">${t("next")}</a>` : ""}</div></div>`;
  $("#ayahs").onclick = e => {
    const el = e.target.closest("[data-a]"); if (!el) return;
    const a = +el.dataset.a, act = e.target.closest("[data-act]")?.dataset.act;
    if (S.mushaf || act === "more") return ayahSheet(n, a);
    if (act === "play") player.start(n, a);
    else if (act === "tafsir") toggleTafsir(el, data.ayahs[a - 1]);
    else if (act === "mark") { toggleMark(n, a); const b = e.target.closest("[data-act]"); const on = isMarked(a); b.classList.toggle("on", on); b.innerHTML = on ? ICON.mark : ICON.markO; }
  };
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(es => { for (const x of es) if (x.isIntersecting) markRead(n, +x.target.dataset.a); }, { rootMargin: "-40% 0px -55% 0px" });
  app.querySelectorAll("[data-a]").forEach(el => observer.observe(el));
  if (focus > 1) requestAnimationFrame(() => document.getElementById("a" + focus)?.scrollIntoView({ block: "start" }));
  else { window.scrollTo(0, 0); markRead(n, 1); }
  player.paint();
}
function toggleTafsir(el, a) {
  const old = el.querySelector(".tf"); if (old) return old.remove();
  el.insertAdjacentHTML("beforeend", `<div class="tf"><b>${t("tafsir")}</b>${esc(a.tf)}</div>`);
}
function toggleMark(s, a) {
  const i = bookmarks.findIndex(b => b.s === s && b.a === a);
  if (i >= 0) bookmarks.splice(i, 1); else bookmarks.push({ s, a, at: Date.now() });
  store.set("bookmarks", bookmarks); toast(i >= 0 ? "✓" : t("saved1"));
}
async function ayahSheet(n, a) {
  const data = await surah(n), ay = data.ayahs[a - 1], idx = await index();
  const marked = bookmarks.some(b => b.s === n && b.a === a);
  const ref = `${sName(idx.surahs[n - 1])} ${n}:${a}`;
  sheet(`<h3>${esc(ref)}</h3><div class="ayah" style="border:0;padding:0 0 10px"><div class="ar">${ay.ar}</div>${S.en ? `<div class="en">${esc(ay.en)}</div>` : ""}</div>
    <button class="opt" onclick="closeSheet(); player.start(${n}, ${a})"><span class="l">${t("from")}</span>${ICON.play}</button>
    <button class="opt" onclick="closeSheet(); toggleMark(${n}, ${a}); route()"><span class="l">${marked ? t("saved1") : t("bookmark")}</span>${marked ? ICON.mark : ICON.markO}</button>
    <button class="opt" id="shCopy"><span class="l">${t("copy")}</span></button>
    ${navigator.share ? `<button class="opt" id="shShare"><span class="l">${t("share")}</span></button>` : ""}
    <div class="ayah" style="border:0;padding:6px 0"><div class="tf"><b>${t("tafsir")}</b>${esc(ay.tf)}</div></div>`);
  const text = `${ay.ar}\n\n${ay.en}\n\n— ${ref}`;
  $("#shCopy").onclick = () => { navigator.clipboard?.writeText(text).then(() => toast(t("copied"))); closeSheet(); };
  const sh = $("#shShare"); if (sh) sh.onclick = () => { navigator.share({ text }).catch(() => { }); closeSheet(); };
}

async function viewSearch(q) {
  app.innerHTML = topbar(`<h1>${esc(q)}</h1>`) + `<div class="wrap"><form class="search" onsubmit="event.preventDefault(); const v=this.q.value.trim(); if(v) location.hash='#/search?q='+encodeURIComponent(v)">${ICON.search}
    <input name="q" value="${esc(q)}" autocomplete="off" enterkeyhint="search"></form><div id="res" class="list" style="margin-top:10px"><div class="empty">…</div></div></div>`;
  const idx = await index();
  // A surah name or number jumps straight to it
  const qn = q.toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "");
  const named = idx.surahs.filter(s => String(s.n) === qn || s.en.toLowerCase().replace(/[^a-z]/g, "").includes(qn) && qn.length > 2 || s.name.replace(/[ً-ٰٟ]/g, "").includes(q.replace(/[ً-ٰٟ]/g, "")) && q.length > 1);
  let html = named.slice(0, 5).map(surahRow).join("");
  try {
    const r = await (await fetch("/api/search?q=" + encodeURIComponent(q))).json();
    const hl = s => { const e = esc(s); if (/[؀-ۿ]/.test(q)) return e; const w = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return e.replace(new RegExp(w, "gi"), m => `<mark>${m}</mark>`); };
    html += `<div class="t2" style="color:var(--muted);padding:12px 4px 0">${num(r.total)} ${t("results")}</div>` + r.results.map(x => `<a class="res" href="#/s/${x.s}/${x.a}">
      <div class="ref">${esc(S.lang === "ar" ? x.name : x.surah)} ${num(x.s)}:${num(x.a)}</div><div class="ar">${x.ar}</div><div class="en">${hl(x.en)}</div></a>`).join("");
    if (!r.total && !named.length) html = `<div class="empty">${t("noRes")}</div>`;
  } catch { html += `<div class="empty">${S.lang === "ar" ? "البحث يحتاج إلى إنترنت" : "Search needs the internet"}</div>`; }
  $("#res").innerHTML = html;
}

function viewTasbih() {
  const words = ["سُبْحَانَ ٱللَّهِ", "ٱلْحَمْدُ لِلَّهِ", "ٱللَّهُ أَكْبَرُ", "لَا إِلَٰهَ إِلَّا ٱللَّهُ", "أَسْتَغْفِرُ ٱللَّهَ"];
  const st = store.get("tasbih", { w: 0, c: 0, total: 0 });
  const draw = () => {
    app.innerHTML = topbar(`<h1>${t("tasbih")}</h1>`) + `<div class="wrap tasbih"><div class="quick" style="justify-content:center;margin:10px 0 0">${words.map((w, i) =>
      `<button class="pill" style="${i === st.w ? "border-color:var(--gold);color:var(--gold)" : ""}" onclick="tz(${i})">${w}</button>`).join("")}</div>
      <div class="w">${words[st.w]}</div><div class="c">${num(st.c)}</div><div class="t2" style="color:var(--muted);margin-bottom:22px">${st.c % 33 === 0 && st.c ? "✓ " : ""}${num(st.c % 33)} / ${num(33)} · ${num(st.total)}</div>
      <button class="tap" id="tap">${t("tap")}</button><div style="margin-top:22px"><button class="btn ghost" onclick="tz(-1)">${t("reset")}</button></div></div>`;
    $("#tap").onclick = () => { st.c++; st.total++; store.set("tasbih", st); if (st.c % 33 === 0 && navigator.vibrate) navigator.vibrate(60); draw(); };
  };
  window.tz = i => { if (i < 0) st.c = 0; else { st.w = i; st.c = 0; } store.set("tasbih", st); draw(); };
  draw();
}

/* ---------- player: one ayah at a time, continuing through the surah ---------- */
const player = {
  audio: new Audio(), s: 0, a: 0, count: 0, repeat: 1, left: 1, playing: false, next: new Audio(),
  url(g) { const r = RECITERS.find(x => x.id === S.reciter) || RECITERS[0]; return `${AUDIO}/${r.kbps}/${r.id}/${g}.mp3`; },
  async start(s, a) {
    const data = await surah(s); this.s = s; this.a = a; this.count = data.count; this.left = this.repeat;
    $("#player").hidden = false; this.load(); this.audio.play().catch(() => { }); },
  async load() {
    const data = await surah(this.s); const ay = data.ayahs[this.a - 1];
    this.audio.src = this.url(ay.g); this.audio.playbackRate = S.speed;
    const nx = data.ayahs[this.a]; if (nx) { this.next.src = this.url(nx.g); this.next.preload = "auto"; }
    const idx = await index(); const name = sName(idx.surahs[this.s - 1]);
    $("#plTitle").textContent = `${name} · ${num(this.s)}:${num(this.a)}`;
    $("#plSub").textContent = (RECITERS.find(x => x.id === S.reciter) || RECITERS[0])[S.lang === "ar" ? "ar" : "en"];
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: `${name} ${this.s}:${this.a}`, artist: $("#plSub").textContent, album: "Noor",
      artwork: [{ src: "/static/icon-512.png", sizes: "512x512", type: "image/png" }] });
    this.paint(true);
  },
  paint(scroll) {
    document.querySelectorAll(".playing").forEach(e => e.classList.remove("playing"));
    if (!this.s || !location.hash.startsWith(`#/s/${this.s}`) && !(location.hash === "#/s/" + this.s)) return;
    const el = document.getElementById("a" + this.a);
    if (el) { el.classList.add("playing"); if (scroll && this.playing) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  },
  toggle() { if (this.audio.paused) this.audio.play().catch(() => { }); else this.audio.pause(); },
  step(d) { const a = this.a + d; if (a < 1) return; if (a > this.count) { if (this.s < 114) { this.s++; this.a = 1; surah(this.s).then(x => { this.count = x.count; this.left = this.repeat; this.load().then(() => this.audio.play()); if (location.hash.startsWith("#/s/")) location.hash = `#/s/${this.s}`; }); } return; }
    this.a = a; this.left = this.repeat; this.load().then(() => this.audio.play().catch(() => { })); },
  stop() { this.audio.pause(); this.playing = false; $("#player").hidden = true; this.s = 0; this.paint(); },
};
player.audio.addEventListener("play", () => { player.playing = true; $("#plIcon").innerHTML = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'; player.paint(true); });
player.audio.addEventListener("pause", () => { player.playing = false; $("#plIcon").innerHTML = '<path d="M8 5v14l11-7z"/>'; });
player.audio.addEventListener("timeupdate", () => { const a = player.audio; $("#plFill").style.width = a.duration ? (a.currentTime / a.duration * 100) + "%" : "0"; });
player.audio.addEventListener("ended", () => { if (--player.left > 0) { player.audio.currentTime = 0; player.audio.play(); } else player.step(1); });
player.audio.addEventListener("error", () => { if (player.s) toast(S.lang === "ar" ? "تعذّر تشغيل الصوت، تحقق من الإنترنت" : "Could not play: check the internet"); });
$("#plPlay").onclick = () => player.toggle();
$("#plNext").onclick = () => player.step(1);
$("#plPrev").onclick = () => player.step(-1);
$("#plClose").onclick = () => player.stop();
$("#plRepeat").onclick = e => { player.repeat = player.repeat === 1 ? 3 : player.repeat === 3 ? 5 : player.repeat === 5 ? 10 : 1; player.left = player.repeat;
  e.target.textContent = player.repeat + "×"; e.target.classList.toggle("on", player.repeat > 1); toast((S.lang === "ar" ? "تكرار كل آية " : "Repeat each ayah ") + player.repeat + "×"); };
$("#plSpeed").onclick = e => { const v = [1, 1.25, 1.5, 0.75]; S.speed = v[(v.indexOf(S.speed) + 1) % v.length]; saveS(); player.audio.playbackRate = S.speed; e.target.textContent = S.speed + "×"; e.target.classList.toggle("on", S.speed !== 1); };
$("#plSpeed").textContent = S.speed + "×";
if ("mediaSession" in navigator) { navigator.mediaSession.setActionHandler("nexttrack", () => player.step(1)); navigator.mediaSession.setActionHandler("previoustrack", () => player.step(-1)); }

/* ---------- sheet, toast, settings ---------- */
function sheet(html) { $("#sheetBody").innerHTML = `<div class="grab"></div>${html}`; $("#sheet").hidden = false; }
window.closeSheet = () => { $("#sheet").hidden = true; };
$("#sheet").onclick = e => { if (e.target.id === "sheet") closeSheet(); };
let toastT; function toast(m) { const el = $("#toast"); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 1800); }

window.openSettings = () => {
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${S[k] === v ? "on" : ""}" onclick="setS('${k}', ${JSON.stringify(v).replace(/"/g, "'")})">${l}</button>`).join("")}</div>`;
  const sw = k => `<button class="sw ${S[k] ? "on" : ""}" onclick="setS('${k}', ${!S[k]})" aria-label="${k}"></button>`;
  const offline = store.get("offline", false);
  sheet(`<h3>${t("settings")}</h3>
    <div class="opt"><span class="l">${t("lang")}</span>${seg("lang", [["en", "English"], ["ar", "العربية"]])}</div>
    <div class="opt"><span class="l">${t("theme")}</span>${seg("theme", [["dark", t("dark")], ["light", t("light")]])}</div>
    <div class="opt"><span class="l">${t("arsize")}<div class="d" style="font-family:'Amiri Quran';font-size:${S.ar}px;line-height:1.6" id="arPrev">بِسْمِ ٱللَّهِ</div></span>
      <input type="range" min="22" max="48" value="${S.ar}" oninput="S.ar=+this.value; saveS(); applyLook(); $('#arPrev').style.fontSize=this.value+'px'" onchange="route()"></div>
    <div class="opt"><span class="l">${t("trans")}</span>${sw("en")}</div>
    <div class="opt"><span class="l">${t("translit")}</span>${sw("tr")}</div>
    <div class="opt"><span class="l">${t("mode")}</span>${seg("mushaf", [[false, t("cards")], [true, t("mushafm")]])}</div>
    <div class="opt"><span class="l">${t("reciter")}</span><select class="sel" onchange="setS('reciter', this.value)">${RECITERS.map(r => `<option value="${r.id}" ${r.id === S.reciter ? "selected" : ""}>${S.lang === "ar" ? r.ar : r.en}</option>`).join("")}</select></div>
    <div class="opt" style="display:block"><div style="display:flex;align-items:center;gap:12px"><span class="l"><div>${t("offline")}</div><div class="d" id="offD">${offline ? t("offlineDone") : t("offlineD")}</div></span>
      <button class="btn" id="offBtn" ${offline ? "disabled" : ""}>${offline ? "✓" : t("download")}</button></div><div class="prog" id="offP" hidden><div></div></div></div>
    <div class="foot" style="padding:16px 0 0"><b>Noor ${NOOR.version}</b> · ${t("made")} Awsaa</div>`);
  $("#offBtn").onclick = saveOffline;
};
window.setS = (k, v) => { S[k] = v; saveS(); applyLook(); openSettings(); route(); };

async function saveOffline() {
  const btn = $("#offBtn"), bar = $("#offP"); btn.disabled = true; bar.hidden = false;
  const files = ["/static/q/index.json?v=1", ...Array.from({ length: 114 }, (_, i) => `/static/q/${i + 1}.json?v=1`)];
  let done = 0;
  try {
    const c = await caches.open("noor-data-v1");
    for (let i = 0; i < files.length; i += 6) {
      await Promise.all(files.slice(i, i + 6).map(async f => { if (!(await c.match(f))) await c.add(f); done++; bar.firstChild.style.width = (done / files.length * 100) + "%"; }));
    }
    store.set("offline", true); $("#offD").textContent = t("offlineDone"); btn.textContent = "✓"; toast(t("offlineDone"));
  } catch { btn.disabled = false; toast(S.lang === "ar" ? "تعذّر الحفظ، حاول مرة أخرى" : "Could not save, try again"); }
}

/* ---------- router ---------- */
async function route() {
  const h = location.hash.slice(1) || "/";
  const m = h.match(/^\/s\/(\d+)(?:\/(\d+))?/);
  try {
    if (m) await viewSurah(+m[1], +(m[2] || 1));
    else if (h.startsWith("/search")) await viewSearch(decodeURIComponent((h.split("q=")[1] || "").replace(/\+/g, " ")));
    else if (h.startsWith("/tasbih")) viewTasbih();
    else { await viewHome(); }
  } catch (e) { app.innerHTML = topbar("<h1>Noor</h1>") + `<div class="wrap"><div class="empty">${S.lang === "ar" ? "تعذّر التحميل. تحقق من الإنترنت، أو احفظ القرآن للاستخدام دون إنترنت من الإعدادات." : "Could not load. Check the internet, or save the Quran for offline use in Settings."}</div></div>`; }
}
window.addEventListener("hashchange", () => { hops = location.hash.length > 2 ? hops + 1 : 0; closeSheet(); route(); });
window.store = store; window.player = player; window.S = S; window.saveS = saveS; window.route = route; window.applyLook = applyLook; window.toggleMark = toggleMark; window.viewHome = viewHome; window.$ = $;
applyLook(); route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => { });
