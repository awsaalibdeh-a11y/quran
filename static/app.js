/* Noor: Quran app. Routes: #/ home, #/quran, #/s/<surah>[/<ayah>], #/search?q=, #/listen, #/prayer, #/more,
   #/recite/<s>/<a>, #/tasbih, #/ramadan, #/adhkar/<morning|evening>, #/hifz, #/qibla */
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const app = $("#app");
const AUDIO = "https://cdn.islamic.network/quran/audio";
const RECITERS = [
  { id: "ar.mahermuaiqly", en: "Maher Al-Muaiqly", ar: "ماهر المعيقلي", kbps: 128, i: "م" },
  { id: "ar.alafasy", en: "Mishary Alafasy", ar: "مشاري العفاسي", kbps: 128, i: "ع" },
  { id: "ar.abdulbasitmurattal", en: "Abdul Basit", ar: "عبد الباسط عبد الصمد", kbps: 64, i: "ب" },
  { id: "ar.husary", en: "Mahmoud Al-Husary", ar: "محمود خليل الحصري", kbps: 128, i: "ح" },
  { id: "ar.minshawi", en: "Mohamed Al-Minshawi", ar: "محمد صديق المنشاوي", kbps: 128, i: "ن" },
  { id: "ar.abdurrahmaansudais", en: "Abdurrahman As-Sudais", ar: "عبد الرحمن السديس", kbps: 64, i: "س" },
  { id: "ar.saoodshuraym", en: "Saud Ash-Shuraim", ar: "سعود الشريم", kbps: 64, i: "ش" },
  { id: "ar.hudhaify", en: "Ali Al-Hudhaify", ar: "علي الحذيفي", kbps: 128, i: "ذ" },
  { id: "ar.muhammadayyoub", en: "Muhammad Ayyub", ar: "محمد أيوب", kbps: 128, i: "أ" },
  { id: "ar.shaatree", en: "Abu Bakr Ash-Shatri", ar: "أبو بكر الشاطري", kbps: 128, i: "ط" },
  { id: "ar.ahmedajamy", en: "Ahmed Al-Ajamy", ar: "أحمد بن علي العجمي", kbps: 128, i: "ج" },
  { id: "ar.muhammadjibreel", en: "Muhammad Jibreel", ar: "محمد جبريل", kbps: 128, i: "ج" },
  { id: "ar.husarymujawwad", en: "Al-Husary (Mujawwad)", ar: "الحصري (مجوّد)", kbps: 128, i: "ح" },
  { id: "ar.minshawimujawwad", en: "Al-Minshawi (Mujawwad)", ar: "المنشاوي (مجوّد)", kbps: 64, i: "ن" },
  { id: "ar.abdulsamad", en: "Abdul Basit (Mujawwad)", ar: "عبد الباسط (مجوّد)", kbps: 64, i: "ب" },
  { id: "ar.abdullahbasfar", en: "Abdullah Basfar", ar: "عبد الله بصفر", kbps: 64, i: "ص" },
  { id: "ar.hanirifai", en: "Hani Ar-Rifai", ar: "هاني الرفاعي", kbps: 64, i: "ر" },
  { id: "ar.aymanswoaid", en: "Ayman Suwaid", ar: "أيمن سويد", kbps: 64, i: "ي" },
  { id: "ar.ibrahimakhbar", en: "Ibrahim Al-Akhdar", ar: "إبراهيم الأخضر", kbps: 32, i: "خ" },
  { id: "ar.parhizgar", en: "Shahriar Parhizgar", ar: "شهريار پرهيزگار", kbps: 48, i: "پ" },
];
const FONTS = { scheherazade: '"Scheherazade New"', amiri: '"Amiri Quran"', naskh: '"Noto Naskh Arabic"' };

/* ---------- saved settings (this device only) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("noor." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("noor." + k, JSON.stringify(v)); } catch { } },
};
const S = Object.assign({ lang: "en", theme: "light", ar: 32, font: "scheherazade", en: true, tr: false, mushaf: false, reciter: "ar.mahermuaiqly",
  speed: 1, goal: 10, sky: true, ramadan: "auto", method: "mwl", asr: "std", loc: null }, store.get("settings", {}));
if (!store.get("v2", false)) { S.reciter = "ar.mahermuaiqly"; if (S.ar < 32) S.ar = 32; store.set("v2", true); }        // 2.0: Maher by default, bigger text
const saveS = () => store.set("settings", S);
let bookmarks = store.get("bookmarks", []);
let last = store.get("last", null);

/* ---------- words ---------- */
const T = {
  en: { hi: ["Good morning", "Good afternoon", "Good evening"], cont: "Continue reading", start: "Start reading", fatiha: "Begin with Al-Fatihah",
    surahs: "Surahs", juz: "Juz", saved: "Saved", search: "Search in Arabic or English", ayahs: "ayahs", meccan: "Meccan", medinan: "Medinan",
    daily: "Ayah of the day", streak: "days in a row", listen: "Listen", tafsir: "Tafsir (Al-Muyassar)", bookmark: "Save", saved1: "Saved", copy: "Copy",
    share: "Share", copied: "Copied", settings: "Settings", next: "Next surah", prev: "Previous surah", noSaved: "Nothing saved yet. Tap the bookmark on any ayah.",
    results: "results", noRes: "Nothing found", juzN: "Juz", tasbih: "Tasbih", reset: "Reset", tap: "Tap", page: "Page", made: "Made by",
    text: "Text: Tanzil Uthmani. Translation: Saheeh International. Tafsir: Al-Muyassar. Audio: Islamic Network.", playingAyah: "Ayah", ofS: "of",
    from: "Play from here", playSurah: "Play", sajda: "Sajdah", home: "Home", quran: "Quran", prayer: "Prayer", more: "More", read: "Read" },
  ar: { hi: ["صباح الخير", "مساء الخير", "مساء الخير"], cont: "تابع القراءة", start: "ابدأ القراءة", fatiha: "ابدأ بالفاتحة",
    surahs: "السور", juz: "الأجزاء", saved: "المحفوظ", search: "ابحث بالعربية أو الإنجليزية", ayahs: "آية", meccan: "مكية", medinan: "مدنية",
    daily: "آية اليوم", streak: "أيام متتالية", listen: "استمع", tafsir: "التفسير الميسر", bookmark: "حفظ", saved1: "محفوظة", copy: "نسخ",
    share: "مشاركة", copied: "تم النسخ", settings: "الإعدادات", next: "السورة التالية", prev: "السورة السابقة", noSaved: "لا شيء محفوظ بعد. اضغط على علامة الحفظ في أي آية.",
    results: "نتيجة", noRes: "لا توجد نتائج", juzN: "الجزء", tasbih: "المسبحة", reset: "تصفير", tap: "اضغط", page: "صفحة", made: "صنعه",
    text: "النص: تنزيل (الرسم العثماني). الترجمة: صحيح إنترناشونال. التفسير: الميسر. الصوت: Islamic Network.", playingAyah: "آية", ofS: "من",
    from: "شغّل من هنا", playSurah: "تشغيل", sajda: "سجدة", home: "الرئيسية", quran: "القرآن", prayer: "الصلاة", more: "المزيد", read: "اقرأ" },
};
const t = k => (T[S.lang] || T.en)[k] ?? T.en[k];
const isAr = () => S.lang === "ar";
const L = (en, ar) => isAr() ? ar : en;
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const arNum = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
const num = n => isAr() ? arNum(n) : String(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const P = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
const ICON = {
  back: '<svg class="flip" viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
  gear: P("M19.4 13a7.7 7.7 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L4.6 11a7.7 7.7 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"),
  play: P("M8 5v14l11-7z"), pause: P("M6 5h4v14H6zm8 0h4v14h-4z"),
  mark: P("M6 3h12v18l-6-4-6 4z"), markO: P("M6 3h12v18l-6-4-6 4zm2 2v12.3l4-2.7 4 2.7V5z"),
  book: P("M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zm16 0h-4a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h4z"),
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  search: P("M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"),
  home: P("M12 3 3 10v11h6v-6h6v6h6V10z"), quran: P("M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2zm2 14v2h10v-2zm4-11-2 3 2 3 2-3z"),
  head: P("M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9z"),
  mosque: P("M12 2c-.8 1.6-3 2.8-3 5h6c0-2.2-2.2-3.4-3-5zM5 9v12h4v-4a3 3 0 0 1 6 0v4h4V9zM2 11h2v10H2zm18 0h2v10h-2z"),
  grid: P("M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"),
  mic: P("M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1a7 7 0 0 0 6-6.9z"),
  beads: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="20" cy="13" r="2"/><circle cx="6" cy="7" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="12" cy="20" r="2.4"/></svg>',
  moon: P("M14 2a10 10 0 1 0 8 15.9A8 8 0 0 1 14 2z"), sun: P("M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3z"),
  compass: P("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.5 6.5-2 5-5 2 2-5z"), star: P("M12 2l2.9 6.9L22 9.6l-5.5 4.8 1.7 7.1L12 17.8 5.8 21.5l1.7-7.1L2 9.6l7.1-.7z"),
  brain: P("M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h2V3zm6 0h-2v16h2a3 3 0 0 0 3-3 3 3 0 0 0 2-5 3 3 0 0 0-2-5 3 3 0 0 0-3-3z"),
  down: P("M11 4h2v9l3.5-3.5 1.4 1.4L12 16.8l-5.9-5.9 1.4-1.4L11 13zM5 18h14v2H5z"), check: P("M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"),
  trash: P("M6 7h12l-1 14H7zm3-4h6l1 2h4v2H4V5h4z"), pin: P("M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"),
};

function applyLook() {
  const r = document.documentElement;
  r.dataset.theme = S.theme; r.lang = S.lang; r.dir = isAr() ? "rtl" : "ltr";
  r.style.setProperty("--ar", S.ar + "px"); r.style.setProperty("--qf", FONTS[S.font] || FONTS.scheherazade);
  $('meta[name="theme-color"]').content = S.theme === "dark" ? "#0b110e" : S.theme === "sepia" ? "#f5efe1" : "#f4f7f5";
}

/* ---------- data ---------- */
let INDEX = null;
const cache = {};
async function index() { if (!INDEX) INDEX = await (await fetch("/static/q/index.json?v=1")).json(); return INDEX; }
async function surah(n) { if (!cache[n]) cache[n] = await (await fetch(`/static/q/${n}.json?v=1`)).json(); return cache[n]; }
const sName = s => isAr() ? s.name : s.en;

/* ---------- reading progress ---------- */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const today = () => dayKey();
function markRead(s, a) {
  last = { s, a, at: Date.now() }; store.set("last", last);
  const p = store.get("progress", { day: "", count: 0, seen: [], streak: 0, lastDay: "" });
  const d = today();
  if (p.day !== d) { p.streak = p.lastDay === dayKey(new Date(Date.now() - 864e5)) ? p.streak + 1 : 1; p.day = d; p.count = 0; p.seen = []; p.lastDay = d; }
  const key = s * 1000 + a;
  if (!p.seen.includes(key)) { p.seen.push(key); p.count++; if (p.seen.length > 800) p.seen = p.seen.slice(-800); }
  const days = store.get("days", {}); days[d] = p.count; store.set("days", days);
  if (p.streak > store.get("bestStreak", 0)) store.set("bestStreak", p.streak);
  store.set("progress", p);
}
function streakNow() { const p = store.get("progress", {}); return p.lastDay === today() || p.lastDay === dayKey(new Date(Date.now() - 864e5)) ? p.streak || 0 : 0; }
function todayCount() { const p = store.get("progress", {}); return p.day === today() ? p.count : 0; }

/* ---------- frame: top bar + bottom nav ---------- */
function topbar(title, back = true, extra = "") {
  return `<div class="top"><div class="wrap">${back ? `<button class="ib" onclick="goBack()" aria-label="Back">${ICON.back}</button>` : ""}
    ${title}${extra}<button class="ib" onclick="openSettings()" aria-label="${t("settings")}">${ICON.gear}</button></div></div>`;
}
let hops = 0;
window.goBack = () => { if (hops > 0) history.back(); else location.hash = "#/"; };
const TABS = [
  ["home", "/", "Home", "الرئيسية", () => ICON.home, [/^\/$/, /^\/daily/]],
  ["quran", "/quran", "Quran", "القرآن", () => ICON.quran, [/^\/quran/, /^\/s\//, /^\/search/, /^\/page/, /^\/notes/]],
  ["sheikh", "/sheikh", "Sheikh Aws", "الشيخ أوس", () => `<span style="font-family:'Noto Naskh Arabic',serif;font-weight:700;font-size:19px;line-height:1">ش</span>`, [/^\/sheikh/]],
  ["listen", "/listen", "Listen", "استمع", () => ICON.head, [/^\/listen/, /^\/playlists/]],
  ["prayer", "/prayer", "Prayer", "الصلاة", () => ICON.mosque, [/^\/prayer/, /^\/qibla/, /^\/calendar/, /^\/zakat/, /^\/sunnah/, /^\/mosques/]],
  ["recite", "/recite/1/1", "Recite", "التسميع", () => ICON.mic, [/^\/recite/]],
  ["hifz", "/hifz", "Memorize", "الحفظ", () => ICON.brain, [/^\/hifz/, /^\/khatma/]],
  ["adhkar", "/adhkar/morning", "Adhkar", "الأذكار", () => ICON.sun, [/^\/adhkar/, /^\/duas/, /^\/names/, /^\/feel/, /^\/tasbih/, /^\/hadith/]],
  ["ramadan", "/ramadan", "Ramadan", "رمضان", () => ICON.moon, [/^\/ramadan/]],
  ["learn", "/letters", "Learn", "تعلّم", () => `<span style="font-family:'Noto Naskh Arabic',serif;font-weight:700;font-size:15px;line-height:1">أب</span>`, [/^\/letters/, /^\/quiz/, /^\/game/]],
  ["family", "/account", "Family", "العائلة", () => `<span style="font-size:19px;line-height:1">👪</span>`, [/^\/account/]],
  ["progress", "/stats", "Progress", "تقدمي", () => ICON.star, [/^\/stats/]],
];
// the buttons along the top of a tab that holds more than one page
const SUBS = {
  quran: [["/quran", "Surahs", "السور"], ["/page", "Mushaf pages", "صفحات المصحف"], ["/notes", "My notes", "ملاحظاتي"], ["/daily", "Ayah of the day", "آية اليوم"]],
  prayer: [["/prayer", "Times", "المواقيت"], ["/sunnah", "Sunnah tracker", "السنن"], ["/mosques", "Mosques", "المساجد"], ["/qibla", "Qibla", "القبلة"], ["/calendar", "Hijri calendar", "التقويم"], ["/zakat", "Zakat", "الزكاة"]],
  listen: [["/listen", "Reciters and surahs", "القراء والسور"], ["/playlists", "Playlists", "قوائم الاستماع"]],
  hifz: [["/hifz", "Memorize", "الحفظ"], ["/khatma", "Khatma plan", "خطة الختمة"]],
  adhkar: [["/adhkar/morning", "Morning", "الصباح"], ["/adhkar/evening", "Evening", "المساء"], ["/duas", "Quran duas", "أدعية قرآنية"], ["/hadith", "40 Hadith", "الأربعون النووية"], ["/names", "99 Names", "الأسماء الحسنى"], ["/feel", "How I feel", "كيف أشعر"], ["/tasbih", "Tasbih", "المسبحة"]],
  learn: [["/letters", "Letters", "الحروف"], ["/quiz", "Quiz", "مسابقة"], ["/game", "Noor Quest", "رحلة نور"]],
};
function tabOf(h) { return (TABS.find(tb => tb[5].some(re => re.test(h))) || TABS[0])[0]; }
function subnav() {
  const h = location.hash.slice(1) || "/", g = tabOf(h), list = SUBS[g];
  const old = $("#subnav"); if (old) old.remove();
  if (!list) return;
  const top = app.querySelector(".top"); if (!top) return;
  const el = document.createElement("div"); el.id = "subnav"; el.className = "subnav";
  el.innerHTML = `<div class="wrap">${list.map(([to, en, ar]) => `<a href="#${to}" class="${h === to || (to !== "/" && h.startsWith(to)) ? "on" : ""}">${isAr() ? ar : en}</a>`).join("")}</div>`;
  top.after(el);
}
function nav(on) {
  let n = $("#nav"); if (!n) { n = document.createElement("nav"); n.id = "nav"; n.className = "nav"; document.body.appendChild(n); }
  const cur = tabOf(location.hash.slice(1) || "/");
  n.innerHTML = `<div class="tabsrow">${TABS.map(([k, to, en, ar, ic]) => `<a href="#${to}" data-tab="${k}" class="${cur === k ? "on" : ""} ${k === "sheikh" ? "sk-tab" : ""}"><span class="pip">${ic()}</span>${isAr() ? ar : en}</a>`).join("")}</div>`;
  const a = n.querySelector("a.on"); if (a) requestAnimationFrame(() => a.scrollIntoView({ inline: "center", block: "nearest" }));
  subnav();
}

/* ---------- home ---------- */
async function viewHome() {
  const idx = await index();
  const h = new Date().getHours();
  const lastS = last && idx.surahs[last.s - 1];
  const linked = store.get("hb", null);
  app.innerHTML = topbar(`<div class="brand"><img src="/static/icon-192.png" alt="">Noor</div>`, false, `<a class="ib" href="#/account" aria-label="Account" style="font-size:20px">${linked ? esc(linked.me.emoji || "👤") : "👤"}</a>`) + `<div class="wrap">
    <div id="hero"></div>
    ${window.noorFridayCard ? noorFridayCard() : ""}
    <div id="homeTasks"></div>
    <div class="sec">${t("hi")[h < 12 ? 0 : h < 17 ? 1 : 2]}</div>
    <a class="card cont" href="${lastS ? `#/s/${last.s}/${last.a}` : "#/s/1"}"><div class="t"><div class="k">${lastS ? t("cont") : t("start")}</div>
      <div class="n">${esc(lastS ? sName(lastS) : t("fatiha"))}</div>${lastS ? `<div class="s">${t("playingAyah")} ${num(last.a)} ${t("ofS")} ${num(lastS.count)}</div>` : ""}</div>
      <span class="btn">${t("read")}</span></a>
    <a class="card sheikhcard" href="#/sheikh"><span class="sav big">ش</span><div><b>${L("Ask Sheikh Aws", "اسأل الشيخ أوس")}</b>
      <span>${L("Your AI helper for Islamic rules, duas and the Quran", "مساعدك الذكي في الأحكام والأدعية والقرآن")}</span></div><span class="btn">${L("Ask", "اسأل")}</span></a>
    <div style="height:10px"></div>${streakCard()}
    <div class="sec">${L("Tools", "أدوات")}</div>
    <div class="tiles">
      ${tile("#/recite/" + (lastS ? last.s + "/" + last.a : "1/1"), ICON.mic, L("Recite", "التسميع"))}
      ${tile("#/adhkar/" + (h < 15 ? "morning" : "evening"), ICON.sun, L("Adhkar", "الأذكار"))}
      ${tile("#/tasbih", ICON.beads, t("tasbih"))}
      ${tile("#/qibla", ICON.compass, L("Qibla", "القبلة"))}
      ${tile("#/ramadan", ICON.moon, L("Ramadan", "رمضان"))}
      ${tile("#/hifz", ICON.brain, L("Memorize", "الحفظ"))}
      ${tile("#/duas", ICON.book, L("Quran duas", "أدعية قرآنية"))}
      ${tile("#/game", ICON.play, L("Noor Quest", "رحلة نور"))}
      ${tile("#/account", ICON.home, L("Family", "العائلة"))}
      ${tile("#/hadith", ICON.book, L("40 Hadith", "الأربعون"))}
      ${tile("#/playlists", ICON.head, L("Playlists", "قوائم الاستماع"))}
      ${tile("#/sunnah", ICON.check, L("Sunnah tracker", "متابعة السنن"))}
    </div>
    <a class="card gamecard" href="#/game"><span class="gc-art">🌙</span><div><b>${L("Noor Quest", "رحلة نور")}</b><span>${L("A jump-and-run game with Quran questions", "لعبة قفز وجري مع أسئلة عن القرآن")}</span></div><span class="btn">${L("Play", "العب")}</span></a>
    <div class="sec">${t("daily")}</div><div id="daily"></div>
    <div class="sec">${L("Popular", "سور مختارة")}</div>
    <div class="quick">${[[18, 1, "Al-Kahf", "الكهف"], [36, 1, "Ya-Sin", "يس"], [67, 1, "Al-Mulk", "الملك"], [2, 255, "Ayat al-Kursi", "آية الكرسي"], [55, 1, "Ar-Rahman", "الرحمن"], [56, 1, "Al-Waqi'ah", "الواقعة"], [2, 285, "End of Al-Baqarah", "خواتيم البقرة"]]
      .map(([s, a, en, ar]) => `<a class="pill" href="#/s/${s}/${a}">${isAr() ? ar : en}</a>`).join("")}</div>
    <div class="foot"><b>${t("made")} Awsaa</b><br>${t("text")}${NOOR.apk ? `<br><a href="/noor.apk" style="color:var(--green);font-weight:700">${L("Get the Android app", "حمّل تطبيق أندرويد")}</a>` : ""}</div></div>`;
  nav("home"); heroCard(); daily(idx); if (window.noorHomeTasks) noorHomeTasks();
}
const tile = (href, ic, label) => `<a class="tile" href="${href}"><span class="ic">${ic}</span>${label}</a>`;
function streakCard() {
  const streak = streakNow(), count = todayCount(), goal = S.goal || 10, days = store.get("days", {});
  const names = isAr() ? ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] : ["S", "M", "T", "W", "T", "F", "S"];
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5);
    return `<span class="${days[dayKey(d)] ? "on" : ""} ${i === 6 ? "today" : ""}"><i></i>${names[d.getDay()]}</span>`; }).join("");
  const best = Math.max(store.get("bestStreak", 0), streak);
  return `<div class="card"><div class="sk"><span style="font-size:24px">🔥</span><span class="v">${num(streak)}</span><span class="l">${t("streak")}</span>
    <span class="b">${L("Best", "الأفضل")}: ${num(best)}</span></div><div class="week">${week}</div>
    <div class="sk" style="margin-top:12px"><span class="l">${L("Today's goal", "هدف اليوم")}: ${num(Math.min(count, goal))} / ${num(goal)} ${t("ayahs")}${count >= goal ? " ✓" : ""}</span>
    <button class="b" style="color:var(--green);font-weight:700" onclick="S.goal=[5,10,20,50][([5,10,20,50].indexOf(S.goal||10)+1)%4]; saveS(); route()">${L("Change goal", "غيّر الهدف")}</button></div>
    <div class="goal"><div style="width:${Math.min(100, count / goal * 100)}%"></div></div></div>`;
}
async function daily(idx) {
  const d = new Date(); const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  const g = (seed * 7919) % 6236 + 1;
  let s = 0, left = g; while (left > idx.surahs[s].count) { left -= idx.surahs[s].count; s++; }
  const data = await surah(s + 1); const a = data.ayahs[left - 1];
  const box = $("#daily"); if (!box) return;
  box.innerHTML = `<a class="card daily" href="#/s/${s + 1}/${left}" style="display:block"><div class="ar q">${a.ar}</div>${S.en ? `<div class="en">${esc(a.en)}</div>` : ""}
    <div class="ref">${esc(sName(idx.surahs[s]))} ${num(s + 1)}:${num(left)}</div></a>`;
}

/* ---------- Quran tab ---------- */
async function viewQuran() {
  const idx = await index();
  const tab = store.get("tab", "surahs");
  app.innerHTML = topbar(`<h1>${t("quran")}</h1>`, false) + `<div class="wrap">
    <form class="search" onsubmit="event.preventDefault(); const q=this.q.value.trim(); if(q) location.hash='#/search?q='+encodeURIComponent(q)">${ICON.search}
      <input name="q" placeholder="${t("search")}" autocomplete="off" enterkeyhint="search"></form>
    <a class="card cont" href="#/page/${store.get("lastPage", 1)}" style="margin-top:12px"><span class="tile" style="padding:0;border:0;box-shadow:none"><span class="ic">${ICON.quran}</span></span><div class="t"><div class="n" style="font-size:16px">${L("Mushaf by page", "المصحف بالصفحات")}</div>
      <div class="s">${L("Page", "صفحة")} ${num(store.get("lastPage", 1))} ${L("of", "من")} ${num(604)} · ${L("swipe to turn", "اسحب للتقليب")}</div></div></a>
    <div class="tabs">${["surahs", "juz", "saved"].map(k => `<button class="${tab === k ? "on" : ""}" onclick="store.set('tab','${k}'); route()">${t(k)}</button>`).join("")}</div>
    <div class="card listcard"><div class="list" id="list"></div></div></div>`;
  nav("quran");
  const list = $("#list");
  if (tab === "surahs") list.innerHTML = idx.surahs.map(surahRow).join("");
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
  return `<a class="row" href="#/s/${s.n}"><div class="num"><span>${num(s.n)}</span></div><div class="mid"><div class="t1">${esc(isAr() ? s.name : s.en)}</div>
    <div class="t2">${isAr() ? "" : esc(s.meaning) + " · "}${t(s.type === "Meccan" ? "meccan" : "medinan")} · ${num(s.count)} ${t("ayahs")}</div></div>
    ${isAr() ? "" : `<div class="arn">${s.name}</div>`}</a>`;
}

/* ---------- reader ---------- */
let observer = null;
async function viewSurah(n, focus) {
  const idx = await index();
  n = Math.min(114, Math.max(1, n | 0));
  const data = await surah(n);
  const info = idx.surahs[n - 1];
  const isMarked = a => bookmarks.some(b => b.s === n && b.a === a);
  let juzSeen = data.ayahs[0].juz;
  const marks = window.noorMarks ? noorMarks() : {};
  const [tj, tl] = await Promise.all([window.noorTajweed ? noorTajweed(n) : null, window.noorTr ? noorTr(n) : null]);
  const arText = a => tj && tj[a.n - 1] ? tj[a.n - 1] : a.ar;
  const body = S.mushaf
    ? `<div class="mushaf">${data.ayahs.map(a => `<span class="w" id="a${a.n}" data-a="${a.n}">${arText(a)}<span class="mark">﴿${arNum(a.n)}﴾</span></span>`).join(" ")}</div>`
    : data.ayahs.map(a => {
      let jh = ""; if (a.juz !== juzSeen) { juzSeen = a.juz; jh = `<div class="juzh">— ${t("juzN")} ${num(a.juz)} —</div>`; }
      const mk = marks[`${n}:${a.n}`];
      return `${jh}<div class="ayah ${mk && mk.c ? "hl-" + mk.c : ""}" id="a${a.n}" data-a="${a.n}"><div class="bar"><span class="ref">${num(n)}:${num(a.n)}</span>${a.sajda ? `<span class="sajda">۩ ${t("sajda")}</span>` : ""}<span class="sp"></span>
        <button class="ib" data-act="play" aria-label="${t("listen")}">${ICON.play}</button>
        <button class="ib" data-act="tafsir" aria-label="${t("tafsir")}">${ICON.book}</button>
        <button class="ib" data-act="wbw" aria-label="${L("Word by word", "كلمة كلمة")}" style="font-weight:800;font-size:13px">${L("Aa", "كلمة")}</button>
        <button class="ib ${isMarked(a.n) ? "on" : ""}" data-act="mark" aria-label="${t("bookmark")}">${isMarked(a.n) ? ICON.mark : ICON.markO}</button>
        <button class="ib" data-act="more" aria-label="More">${ICON.more}</button></div>
        <div class="ar">${arText(a)}<span class="mark">﴿${arNum(a.n)}﴾</span></div>
        ${S.tr ? `<div class="tr">${esc(a.tr)}</div>` : ""}${S.en ? `<div class="en">${esc(a.en)}</div>` : ""}${tl && tl[a.n - 1] ? `<div class="en tl" dir="${noorTrDir()}">${esc(tl[a.n - 1])}</div>` : ""}${mk && mk.note ? `<div class="note">✎ ${esc(mk.note)}</div>` : ""}</div>`;
    }).join("");
  app.innerHTML = topbar(`<h1>${esc(sName(info))}</h1>`) + `<div class="wrap">
    <div class="shead"><div class="arn">${info.name}</div><div class="t">${esc(info.en)}${isAr() ? "" : " · " + esc(info.meaning)}</div>
      <div class="s">${t(info.type === "Meccan" ? "meccan" : "medinan")} · ${num(info.count)} ${t("ayahs")} · ${t("juzN")} ${num(info.juz)} · ${t("page")} ${num(info.page)}</div>
      <div class="acts"><button class="btn" onclick="player.start(${n}, 1)">${ICON.play}${t("playSurah")}</button>
        <a class="btn soft" href="#/recite/${n}/1">${ICON.mic}${L("Recite", "سمّع")}</a>
        <button class="btn soft" onclick="noorLoop(${n})">🔁 ${L("Loop", "تكرار")}</button>
        ${S.tajweed ? `<button class="btn ghost" onclick="noorTajweedKey()">🎨 ${L("Colours", "الألوان")}</button>` : ""}
        <button class="btn ghost" onclick="S.mushaf=!S.mushaf; saveS(); route()">${S.mushaf ? L("Ayah by ayah", "آية آية") : L("Mushaf", "مصحف")}</button></div></div>
    ${n !== 1 && n !== 9 ? `<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ""}
    <div id="ayahs">${body}</div>
    <div class="pager">${n > 1 ? `<a class="btn ghost" href="#/s/${n - 1}">${t("prev")}</a>` : ""}${n < 114 ? `<a class="btn" href="#/s/${n + 1}">${t("next")}</a>` : ""}</div></div>`;
  nav("quran");
  $("#ayahs").onclick = e => {
    const el = e.target.closest("[data-a]"); if (!el) return;
    const a = +el.dataset.a, act = e.target.closest("[data-act]")?.dataset.act;
    if (S.mushaf || act === "more") return ayahSheet(n, a);
    if (act === "play") player.start(n, a);
    else if (act === "tafsir") toggleTafsir(el, data.ayahs[a - 1]);
    else if (act === "wbw") noorWbw(n, a, el);
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
  sheet(`<h3>${esc(ref)}</h3><div style="padding:0 0 10px"><div class="q" style="font-size:calc(var(--ar)*.9);line-height:2;direction:rtl;text-align:right">${ay.ar}</div>${S.en ? `<div style="color:var(--muted)">${esc(ay.en)}</div>` : ""}</div>
    <button class="opt" onclick="closeSheet(); player.start(${n}, ${a})"><span class="ico">${ICON.play}</span><span class="l">${t("from")}</span></button>
    <a class="opt" href="#/recite/${n}/${a}"><span class="ico">${ICON.mic}</span><span class="l">${L("Recite from here", "سمّع من هنا")}</span></a>
    <button class="opt" onclick="closeSheet(); toggleMark(${n}, ${a}); route()"><span class="ico">${marked ? ICON.mark : ICON.markO}</span><span class="l">${marked ? t("saved1") : t("bookmark")}</span></button>
    <button class="opt" onclick="closeSheet(); noorMarkSheet(${n}, ${a})"><span class="ico">✎</span><span class="l">${L("Note and highlight", "ملاحظة وتظليل")}</span></button>
    <button class="opt" onclick="closeSheet(); noorShareImage(${n}, ${a})"><span class="ico">${ICON.star}</span><span class="l">${L("Share as a picture", "شارك كصورة")}</span></button>
    <button class="opt" id="shCopy"><span class="ico">${ICON.book}</span><span class="l">${t("copy")}</span></button>
    ${navigator.share ? `<button class="opt" id="shShare"><span class="ico">${ICON.more}</span><span class="l">${t("share")}</span></button>` : ""}
    <div class="tfbox"><b>${t("tafsir")}</b>${esc(ay.tf)}</div>`);
  const text = `${ay.ar}\n\n${ay.en}\n\n— ${ref}`;
  $("#shCopy").onclick = () => { navigator.clipboard?.writeText(text).then(() => toast(t("copied"))); closeSheet(); };
  const sh = $("#shShare"); if (sh) sh.onclick = () => { navigator.share({ text }).catch(() => { }); closeSheet(); };
}

async function viewSearch(q) {
  app.innerHTML = topbar(`<h1>${esc(q)}</h1>`) + `<div class="wrap"><form class="search" onsubmit="event.preventDefault(); const v=this.q.value.trim(); if(v) location.hash='#/search?q='+encodeURIComponent(v)">${ICON.search}
    <input name="q" value="${esc(q)}" autocomplete="off" enterkeyhint="search"></form><div id="res" class="list" style="margin-top:10px"><div class="empty">…</div></div></div>`;
  nav("quran");
  const idx = await index();
  const qn = q.toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, "");
  const named = idx.surahs.filter(s => String(s.n) === qn || s.en.toLowerCase().replace(/[^a-z]/g, "").includes(qn) && qn.length > 2 || s.name.replace(/[ً-ٰٟ]/g, "").includes(q.replace(/[ً-ٰٟ]/g, "")) && q.length > 1);
  let html = named.slice(0, 5).map(surahRow).join("");
  try {
    const r = await (await fetch("/api/search?q=" + encodeURIComponent(q))).json();
    const hl = s => { const e = esc(s); if (/[؀-ۿ]/.test(q)) return e; const w = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return e.replace(new RegExp(w, "gi"), m => `<mark>${m}</mark>`); };
    html += `<div style="color:var(--muted);padding:12px 4px 0;font-size:13px">${num(r.total)} ${t("results")}</div>` + r.results.map(x => `<a class="res" href="#/s/${x.s}/${x.a}">
      <div class="ref">${esc(isAr() ? x.name : x.surah)} ${num(x.s)}:${num(x.a)}</div><div class="ar">${x.ar}</div><div class="en">${hl(x.en)}</div></a>`).join("");
    if (!r.total && !named.length) html = `<div class="empty">${t("noRes")}</div>`;
  } catch { html += `<div class="empty">${L("Searching all ayahs needs the internet. Surah names work offline.", "البحث في الآيات يحتاج إلى إنترنت. أسماء السور تعمل دون إنترنت.")}</div>`; }
  $("#res").innerHTML = html;
}

function viewTasbih() {
  const words = ["سُبْحَانَ ٱللَّهِ", "ٱلْحَمْدُ لِلَّهِ", "ٱللَّهُ أَكْبَرُ", "لَا إِلَٰهَ إِلَّا ٱللَّهُ", "أَسْتَغْفِرُ ٱللَّهَ", "سُبْحَانَ ٱللَّهِ وَبِحَمْدِهِ"];
  const st = store.get("tasbih", { w: 0, c: 0, total: 0 });
  const draw = () => {
    app.innerHTML = topbar(`<h1>${t("tasbih")}</h1>`) + `<div class="wrap tasbih"><div class="quick" style="justify-content:flex-start">${words.map((w, i) =>
      `<button class="pill q ${i === st.w ? "on" : ""}" style="font-size:18px" onclick="tz(${i})">${w}</button>`).join("")}</div>
      <div class="w">${words[st.w]}</div><div class="c">${num(st.c)}</div><div style="color:var(--muted);margin-bottom:22px">${st.c % 33 === 0 && st.c ? "✓ " : ""}${num(st.c % 33)} / ${num(33)} · ${L("total", "المجموع")} ${num(st.total)}</div>
      <button class="tap" id="tap">${t("tap")}</button><div style="margin-top:22px"><button class="btn ghost" onclick="tz(-1)">${t("reset")}</button></div></div>`;
    nav("more");
    $("#tap").onclick = () => { st.c++; st.total++; store.set("tasbih", st); if (st.c % 33 === 0 && navigator.vibrate) navigator.vibrate(60); draw(); };
  };
  window.tz = i => { if (i < 0) st.c = 0; else { st.w = i; st.c = 0; } store.set("tasbih", st); draw(); };
  draw();
}

/* ---------- player: one ayah at a time, from the saved copy when there is one ---------- */
const reciter = () => RECITERS.find(x => x.id === S.reciter) || RECITERS[0];
const audioCache = () => caches.open("noor-audio-v1");
const localUrl = (r, g) => `/audio/${r}/${g}.mp3`;
const player = {
  audio: new Audio(), s: 0, a: 0, count: 0, repeat: 1, left: 1, playing: false, blob: null,
  async src(g) {
    const r = reciter();
    try { const hit = await (await audioCache()).match(localUrl(r.id, g)); if (hit) { if (this.blob) URL.revokeObjectURL(this.blob); this.blob = URL.createObjectURL(await hit.blob()); return this.blob; } } catch { }
    return `${AUDIO}/${r.kbps}/${r.id}/${g}.mp3`;
  },
  async start(s, a) {
    const data = await surah(s); this.s = s; this.a = a; this.count = data.count; this.left = this.repeat;
    $("#player").hidden = false; document.body.classList.add("playing"); await this.load(); this.audio.play().catch(() => { }); },
  async load() {
    const data = await surah(this.s); const ay = data.ayahs[this.a - 1];
    this.audio.src = await this.src(ay.g); this.audio.playbackRate = S.speed;
    const idx = await index(); const name = sName(idx.surahs[this.s - 1]);
    $("#plTitle").textContent = `${name} · ${num(this.s)}:${num(this.a)}`;
    $("#plSub").textContent = reciter()[isAr() ? "ar" : "en"];
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: `${name} ${this.s}:${this.a}`, artist: $("#plSub").textContent, album: "Noor",
      artwork: [{ src: "/static/icon-512.png", sizes: "512x512", type: "image/png" }] });
    this.paint(true);
  },
  paint(scroll) {
    document.querySelectorAll(".playing").forEach(e => { if (e !== document.body) e.classList.remove("playing"); });
    if (!this.s || !location.hash.startsWith(`#/s/${this.s}`)) return;
    const el = document.getElementById("a" + this.a);
    if (el) { el.classList.add("playing"); if (scroll && this.playing) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  },
  toggle() { if (this.audio.paused) this.audio.play().catch(() => { }); else this.audio.pause(); },
  async step(d) {
    const qu = this.queue;
    if (qu && d > 0 && this.queue[this.qi] && this.a >= qu[this.qi][2] && this.s === qu[this.qi][0]) {
      this.qi++;
      if (this.qi >= qu.length) { this.queue = null; toast(L("Playlist finished", "انتهت القائمة")); return this.stop(); }
      const [s, a] = qu[this.qi]; this.s = s; this.a = a; this.count = (await surah(s)).count; this.left = this.repeat;
      if (location.hash.startsWith("#/s/")) location.hash = `#/s/${s}/${a}`;
      await this.load(); this.audio.play().catch(() => { }); return;
    }
    const lp = this.loop;
    if (lp && lp.s === this.s && d > 0 && this.a >= lp.b) {
      lp.done++;
      if (lp.done < lp.times) { this.a = lp.a; this.left = this.repeat; await this.load(); this.audio.play().catch(() => { }); toast(L(`Round ${lp.done + 1} of ${lp.times}`, `المرة ${lp.done + 1} من ${lp.times}`)); return; }
      this.loop = null; this.repeat = 1; toast(L("Loop finished. May Allah make it stay with you.", "انتهى التكرار. ثبّته الله في قلبك.")); return this.stop();
    }
    const a = this.a + d; if (a < 1) return;
    if (a > this.count) {
      if (this.s >= 114 || sleepEnd) { sleepEnd = false; const b = $("#plSleep"); b.dataset.v = 0; b.textContent = "⏾"; b.classList.remove("on"); return this.stop(); }
      this.s++; this.a = 1; this.count = (await surah(this.s)).count; this.left = this.repeat;
      if (location.hash.startsWith("#/s/")) location.hash = `#/s/${this.s}`;
    } else { this.a = a; this.left = this.repeat; }
    await this.load(); this.audio.play().catch(() => { });
  },
  stop() { this.loop = null; this.queue = null; this.audio.pause(); this.playing = false; $("#player").hidden = true; document.body.classList.remove("playing"); this.s = 0; this.paint(); },
};
player.audio.addEventListener("play", () => { player.playing = true; $("#plIcon").innerHTML = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'; player.paint(true); });
player.audio.addEventListener("pause", () => { player.playing = false; $("#plIcon").innerHTML = '<path d="M8 5v14l11-7z"/>'; });
player.audio.addEventListener("timeupdate", () => { const a = player.audio; $("#plFill").style.width = a.duration ? (a.currentTime / a.duration * 100) + "%" : "0"; });
player.audio.addEventListener("ended", () => {
  const gap = player.loop && player.loop.gap ? Math.min(30, (player.audio.duration || 4) * 1.1) * 1000 : 0;          // listen and repeat: a quiet turn to say it back
  const next = () => { if (!player.s) return; if (--player.left > 0) { player.audio.currentTime = 0; player.audio.play(); } else player.step(1); };
  if (gap) { $("#plSub").textContent = L("Your turn: repeat it…", "دورك: كرّرها…"); setTimeout(next, gap); } else next();
});
player.audio.addEventListener("error", () => { if (player.s) toast(L("Could not play: check the internet, or download this surah in Listen", "تعذّر التشغيل: تحقق من الإنترنت، أو حمّل السورة من صفحة الاستماع")); });
$("#plPlay").onclick = () => player.toggle();
$("#plNext").onclick = () => player.step(1);
$("#plPrev").onclick = () => player.step(-1);
$("#plClose").onclick = () => player.stop();
$("#plRepeat").onclick = e => { player.repeat = player.repeat === 1 ? 3 : player.repeat === 3 ? 5 : player.repeat === 5 ? 10 : 1; player.left = player.repeat;
  e.target.textContent = player.repeat + "×"; e.target.classList.toggle("on", player.repeat > 1); toast(L("Repeat each ayah ", "تكرار كل آية ") + player.repeat + "×"); };
$("#plSpeed").onclick = e => { const v = [1, 1.25, 1.5, 0.75]; S.speed = v[(v.indexOf(S.speed) + 1) % v.length]; saveS(); player.audio.playbackRate = S.speed; e.target.textContent = S.speed + "×"; e.target.classList.toggle("on", S.speed !== 1); };
$("#plSpeed").textContent = S.speed + "×";
let sleepT = null, sleepEnd = false;
$("#plSleep").onclick = e => {
  const b = e.currentTarget, steps = [0, 15, 30, 60, -1], cur = +(b.dataset.v || 0), nx = steps[(steps.indexOf(cur) + 1) % steps.length];
  b.dataset.v = nx; clearTimeout(sleepT); sleepEnd = nx === -1;
  b.textContent = nx === 0 ? "⏾" : nx === -1 ? L("end", "نهاية") : nx + "m"; b.classList.toggle("on", nx !== 0);
  if (nx > 0) sleepT = setTimeout(() => { player.audio.pause(); toast(L("Sleep timer: stopped", "مؤقت النوم: توقف")); }, nx * 60000);
  toast(nx === 0 ? L("Sleep timer off", "مؤقت النوم متوقف") : nx === -1 ? L("Stops at the end of this surah", "يتوقف في نهاية السورة") : L(`Stops in ${nx} minutes`, `يتوقف بعد ${nx} دقيقة`));
};
if ("mediaSession" in navigator) { navigator.mediaSession.setActionHandler("nexttrack", () => player.step(1)); navigator.mediaSession.setActionHandler("previoustrack", () => player.step(-1)); }

/* ---------- sheet, toast, settings ---------- */
function sheet(html) { $("#sheetBody").innerHTML = `<div class="grab"></div>${html}`; $("#sheet").hidden = false; }
window.closeSheet = () => { $("#sheet").hidden = true; };
$("#sheet").onclick = e => { if (e.target.id === "sheet") closeSheet(); };
let toastT; function toast(m) { const el = $("#toast"); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2200); }

window.openSettings = () => {
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${S[k] === v ? "on" : ""}" onclick='setS("${k}", ${JSON.stringify(v)})'>${l}</button>`).join("")}</div>`;
  const sw = k => `<button class="sw ${S[k] ? "on" : ""}" onclick="setS('${k}', ${!S[k]})" aria-label="${k}"></button>`;
  const offline = store.get("offline", false);
  sheet(`<h3>${t("settings")}</h3>
    <div class="opt"><span class="l">${L("Language", "اللغة")}</span>${seg("lang", [["en", "English"], ["ar", "العربية"]])}</div>
    <div class="opt"><span class="l">${L("Look", "المظهر")}</span>${seg("theme", [["light", L("Light", "فاتح")], ["sepia", L("Sepia", "ورقي")], ["dark", L("Dark", "داكن")], ["auto", L("Auto", "تلقائي")]])}</div>
    <div class="opt"><span class="l">${L("Sun and moon sky", "سماء الشمس والقمر")}<div class="d">${L("On the home card, where the sun or moon really is now", "في بطاقة الرئيسية، حيث الشمس أو القمر الآن")}</div></span>${sw("sky")}</div>
    <div class="opt" style="display:block"><div style="display:flex;align-items:center;gap:12px"><span class="l">${L("Quran font", "خط المصحف")}</span>${seg("font", [["scheherazade", L("Clear", "واضح")], ["amiri", L("Classic", "كلاسيكي")], ["naskh", L("Simple", "بسيط")]])}</div>
      <div class="q" style="font-size:${S.ar}px;line-height:1.9;text-align:center;direction:rtl;margin-top:8px" id="arPrev">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
      <div style="display:flex;align-items:center;gap:12px"><span class="l d">${L("Size", "الحجم")}</span><input type="range" min="24" max="54" value="${S.ar}" style="flex:1"
        oninput="S.ar=+this.value; saveS(); applyLook(); $('#arPrev').style.fontSize=this.value+'px'" onchange="route()"></div></div>
    <div class="opt"><span class="l">${L("English translation", "الترجمة الإنجليزية")}</span>${sw("en")}</div>
    <div class="opt"><span class="l">${L("Transliteration", "النطق باللاتينية")}</span>${sw("tr")}</div>
    <div class="opt"><span class="l">${L("Tajweed colours", "ألوان التجويد")}<div class="d">${L("Colours the rules of recitation. Needs the internet once per surah.", "تلوين أحكام التلاوة. يحتاج إلى إنترنت مرة لكل سورة.")}</div></span>${sw("tajweed")}</div>
    <div class="opt"><span class="l">${L("Another translation", "ترجمة أخرى")}</span><select class="sel" onchange="setS('tl', this.value)">${(window.noorPlus ? noorPlus.LANGS : [["", "—", "—"]]).map(([v, en, ar]) => `<option value="${v}" ${(S.tl || "") === v ? "selected" : ""}>${isAr() ? ar : en}</option>`).join("")}</select></div>
    <div class="opt"><span class="l">${L("Reading mode", "طريقة القراءة")}</span>${seg("mushaf", [[false, L("Ayah by ayah", "آية آية")], [true, L("Mushaf", "مصحف")]])}</div>
    <div class="opt"><span class="l">${L("Reciter", "القارئ")}</span><select class="sel" onchange="setS('reciter', this.value)">${RECITERS.map(r => `<option value="${r.id}" ${r.id === S.reciter ? "selected" : ""}>${isAr() ? r.ar : r.en}</option>`).join("")}</select></div>
    <div class="opt" style="display:block"><div style="display:flex;align-items:center;gap:12px"><span class="l"><div>${L("Save the text for offline", "حفظ النص دون إنترنت")}</div>
      <div class="d" id="offD">${offline ? L("Saved: the whole Quran works offline", "تم الحفظ: القرآن كله يعمل دون إنترنت") : L("All 114 surahs with translation and tafsir, about 6 MB.", "السور الـ114 مع الترجمة والتفسير، حوالي 6 ميغابايت.")}</div></span>
      <button class="btn" id="offBtn" ${offline ? "disabled" : ""}>${offline ? ICON.check : L("Save", "حفظ")}</button></div><div class="prog" id="offP" hidden><div></div></div></div>
    <div class="foot" style="padding:16px 0 0"><b>Noor ${NOOR.version}</b> · ${t("made")} Awsaa</div>`);
  $("#offBtn").onclick = saveOffline;
};
window.setS = (k, v) => { S[k] = v; saveS(); applyLook(); openSettings(); route(); };

async function saveOffline() {
  const btn = $("#offBtn"), bar = $("#offP"); btn.disabled = true; bar.hidden = false;
  const files = ["/static/q/index.json?v=1", "/static/q/pages.json?v=1", ...Array.from({ length: 114 }, (_, i) => `/static/q/${i + 1}.json?v=1`)];
  let done = 0;
  try {
    const c = await caches.open("noor-data-v1");
    for (let i = 0; i < files.length; i += 6) {
      await Promise.all(files.slice(i, i + 6).map(async f => { if (!(await c.match(f))) await c.add(f); done++; bar.firstChild.style.width = (done / files.length * 100) + "%"; }));
    }
    store.set("offline", true); $("#offD").textContent = L("Saved: the whole Quran works offline", "تم الحفظ: القرآن كله يعمل دون إنترنت"); btn.innerHTML = ICON.check;
  } catch { btn.disabled = false; toast(L("Could not save, try again", "تعذّر الحفظ، حاول مرة أخرى")); }
}

/* ---------- router ---------- */
const VIEWS = [];                                     // other files add [pattern, view] pairs
async function route() {
  const h = location.hash.slice(1) || "/";
  const m = h.match(/^\/s\/(\d+)(?:\/(\d+))?/);
  try {
    if (m) await viewSurah(+m[1], +(m[2] || 1));
    else if (h.startsWith("/search")) await viewSearch(decodeURIComponent((h.split("q=")[1] || "").replace(/\+/g, " ")));
    else if (h.startsWith("/quran")) await viewQuran();
    else if (h.startsWith("/tasbih")) viewTasbih();
    else if (h.startsWith("/more")) { location.replace("#/"); return; }
    else {
      const v = VIEWS.find(([re]) => re.test(h));
      if (v) await v[1](h.match(v[0])); else await viewHome();
    }
  } catch (e) {
    console.error(e);
    app.innerHTML = topbar("<h1>Noor</h1>") + `<div class="wrap"><div class="empty">${L("Could not load this page. Check the internet, or save the Quran for offline use in Settings.", "تعذّر تحميل الصفحة. تحقق من الإنترنت، أو احفظ القرآن للاستخدام دون إنترنت من الإعدادات.")}</div></div>`;
  }
}
window.addEventListener("hashchange", () => { hops = location.hash.length > 2 ? hops + 1 : 0; closeSheet(); route(); });
Object.assign(window, { store, player, S, saveS, route, applyLook, toggleMark, $, index, surah, sName, topbar, esc, num, arNum, toast, sheet, markRead, app, nav, ICON, L, isAr, t,
  RECITERS, reciter, audioCache, localUrl, VIEWS, dayKey, today, streakNow, todayCount, tile, surahRow });
window.heroCard = () => { };                           // extras.js draws the dates and prayer times
applyLook();
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", route); else setTimeout(route, 0);   // after the other files have added their pages
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => { });
