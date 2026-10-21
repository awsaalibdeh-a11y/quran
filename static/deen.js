/* Noor deen: the 40 Hadith of an-Nawawi (with a hadith of the day), listening playlists, a Sunnah tracker with the sunnah
   fasting days, the night (midnight and the last third) with a tahajjud reminder, and mosques near you. */
"use strict";
(() => {
const dk = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const dayNum = d => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);

/* ---------- 40 Hadith of an-Nawawi (bundled, works offline) ---------- */
let HAD = null;
async function hadith() { if (!HAD) HAD = await (await fetch("/static/hadith/nawawi.json?v=1")).json(); return HAD; }
window.noorHadithOfDay = async () => { const h = await hadith(); return h[dayNum(new Date()) % h.length]; };
async function viewHadith(m) {
  const list = await hadith(), n = m && m[1] ? +m[1] : 0, fav = store.get("hadFav", {});
  if (n) {
    const h = list.find(x => x.n === n) || list[0], i = list.indexOf(h);
    app.innerHTML = topbar(`<h1>${L("Hadith", "الحديث")} ${num(h.n)}</h1>`) + `<div class="wrap">
      <div class="card" style="margin-top:6px"><div style="font-family:'Noto Naskh Arabic',serif;font-size:21px;line-height:2;direction:rtl;text-align:right">${esc(h.ar)}</div></div>
      <div class="card" style="margin-top:10px;font-size:16px;line-height:1.7">${esc(h.en)}</div>
      <div class="cnt" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn soft" onclick="noorHadFav(${h.n})">${fav[h.n] ? ICON.mark : ICON.markO}${fav[h.n] ? L("Saved", "محفوظ") : L("Save", "حفظ")}</button>
        <button class="btn ghost" onclick="navigator.clipboard && navigator.clipboard.writeText(${JSON.stringify(h.ar + "\n\n" + h.en).replace(/"/g, "&quot;")}).then(() => toast('${L("Copied", "تم النسخ")}'))">${L("Copy", "نسخ")}</button>
        <a class="btn ghost" href="#/sheikh" onclick="store.set('sheikhDraft', ${JSON.stringify(L("Explain the lessons of hadith " + h.n + " of the 40 Hadith of an-Nawawi", "اشرح دروس الحديث " + h.n + " من الأربعين النووية")).replace(/"/g, "&quot;")})">ش ${L("Ask Sheikh Aws", "اسأل الشيخ أوس")}</a></div>
      <div class="pager">${i > 0 ? `<a class="btn ghost" href="#/hadith/${list[i - 1].n}">${L("Previous", "السابق")}</a>` : ""}${i < list.length - 1 ? `<a class="btn" href="#/hadith/${list[i + 1].n}">${L("Next", "التالي")}</a>` : ""}</div>
      <p class="lead" style="font-size:12px">${L("From the 40 Hadith of Imam an-Nawawi. Text: hadith-api (fawazahmed0).", "من الأربعين النووية للإمام النووي. النص: hadith-api.")}</p></div>`;
    return nav("adhkar");
  }
  const today = list[dayNum(new Date()) % list.length];
  app.innerHTML = topbar(`<h1>${L("40 Hadith", "الأربعون النووية")}</h1>`) + `<div class="wrap">
    <a class="card" href="#/hadith/${today.n}" style="display:block;margin-top:6px"><div class="k" style="color:var(--green);font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase">${L("Hadith of the day", "حديث اليوم")} · ${num(today.n)}</div>
      <div style="font-family:'Noto Naskh Arabic',serif;font-size:19px;line-height:1.9;direction:rtl;text-align:right;margin-top:6px">${esc(today.ar.slice(0, 220))}${today.ar.length > 220 ? "…" : ""}</div></a>
    <div class="card listcard" style="margin-top:12px"><div class="list">${list.map(h => `<a class="row" href="#/hadith/${h.n}"><div class="num"><span>${num(h.n)}</span></div><div class="mid"><div class="t2" style="color:var(--ink)">${esc(h.en.replace(/^.*?(said|say)[:,]?\s*/i, "").slice(0, 90))}…</div></div>${fav[h.n] ? `<span style="color:var(--green)">${ICON.mark}</span>` : ""}</a>`).join("")}</div></div></div>`;
  nav("adhkar");
}
window.noorHadFav = n => { const f = store.get("hadFav", {}); if (f[n]) delete f[n]; else f[n] = 1; store.set("hadFav", f); route(); };

/* ---------- playlists ---------- */
const PLAYLISTS = [
  ["sleep", "🌙", "Before sleep", "قبل النوم", [[2, 255, 255], [2, 285, 286], [32, 1, 30], [67, 1, 30], [109, 1, 6], [112, 1, 4], [113, 1, 5], [114, 1, 6]]],
  ["ruqyah", "🛡", "Ruqyah: verses for protection", "الرقية الشرعية", [[1, 1, 7], [2, 1, 5], [2, 255, 257], [2, 284, 286], [3, 18, 19], [7, 54, 56], [7, 117, 122], [10, 79, 82], [20, 65, 70], [23, 115, 118], [37, 1, 10], [59, 21, 24], [72, 1, 9], [109, 1, 6], [112, 1, 4], [113, 1, 5], [114, 1, 6]]],
  ["kahf", "🕌", "Friday: Al-Kahf", "الجمعة: الكهف", [[18, 1, 110]]],
  ["amma", "📗", "Juz Amma", "جزء عمّ", Array.from({ length: 37 }, (_, i) => [78 + i, 1, 999])],
  ["short", "🤲", "Short surahs for prayer", "قصار السور للصلاة", Array.from({ length: 22 }, (_, i) => [93 + i, 1, 999])],
  ["mulk", "⭐", "Al-Mulk every night", "الملك كل ليلة", [[67, 1, 30]]],
  ["baqarah", "🏠", "Al-Baqarah for the home", "البقرة للبيت", [[2, 1, 286]]],
];
async function viewPlaylists() {
  const idx = await index();
  const label = q => q.map(([s, a, b]) => `${sName(idx.surahs[s - 1])}${b < 999 && !(a === 1 && b >= idx.surahs[s - 1].count) ? ` ${a === b ? a : a + "–" + Math.min(b, idx.surahs[s - 1].count)}` : ""}`).slice(0, 4).join(" · ") + (q.length > 4 ? ` +${q.length - 4}` : "");
  app.innerHTML = topbar(`<h1>${L("Playlists", "قوائم الاستماع")}</h1>`) + `<div class="wrap"><p class="lead" style="margin-top:4px">${L("Plays one after another with your reciter", "تُشغّل متتابعة بصوت قارئك")}: <b>${esc(reciter()[isAr() ? "ar" : "en"])}</b></p>
    ${PLAYLISTS.map(([id, ic, en, ar, q]) => `<button class="rec" style="margin-top:8px" onclick="noorPlayList('${id}')"><span class="av" style="font-size:20px">${ic}</span><span class="mid"><div class="t1">${isAr() ? ar : en}</div><div class="t2">${esc(label(q))}</div></span><span style="color:var(--green)">${ICON.play}</span></button>`).join("")}
    <p class="lead" style="font-size:12.5px;margin-top:12px">${L("Tip: the sleep timer (⏾) on the player stops it when you fall asleep.", "نصيحة: مؤقت النوم (⏾) في المشغل يوقفه عندما تنام.")}</p></div>`;
  nav("listen");
}
window.noorPlayList = async id => {
  const p = PLAYLISTS.find(x => x[0] === id); if (!p) return;
  const idx = await index();
  player.queue = p[4].map(([s, a, b]) => [s, a, Math.min(b, idx.surahs[s - 1].count)]); player.qi = 0;
  toast(L("Playing: ", "يُشغّل: ") + (isAr() ? p[3] : p[2]));
  player.start(player.queue[0][0], player.queue[0][1]);
};

/* ---------- Sunnah tracker and sunnah fasting days ---------- */
const HABITS = [["fajr2", "🌅", "2 rak'ahs before Fajr", "سنة الفجر"], ["rawatib", "🕌", "The other sunnah prayers", "السنن الرواتب"], ["duha", "☀️", "Duha prayer", "صلاة الضحى"],
  ["witr", "🌙", "Witr", "الوتر"], ["tahajjud", "✨", "Night prayer", "قيام الليل"], ["istighfar", "📿", "Istighfar 100 times", "الاستغفار ١٠٠ مرة"],
  ["salawat", "💚", "Salawat on the Prophet ﷺ", "الصلاة على النبي ﷺ"], ["sadaqah", "🤝", "Sadaqah or a kind deed", "صدقة أو عمل طيب"], ["parents", "👪", "Kindness to parents", "بر الوالدين"]];
function fastDays(n = 60) {
  const out = [], H = window.noorHijri;
  for (let i = 1; i <= n && out.length < 12; i++) {
    const d = new Date(Date.now() + i * 864e5); d.setHours(12, 0, 0, 0);
    const h = H ? H.hijri(d) : { d: 0, m: 0 }, wd = d.getDay();
    const forbidden = (h.m === 10 && h.d === 1) || (h.m === 12 && h.d >= 10 && h.d <= 13);    // Eid al-Fitr, Eid al-Adha and the days of tashreeq
    if (forbidden || h.m === 9) continue;                                                     // Ramadan is already fasted
    let why = "";
    if (h.m === 12 && h.d === 9) why = L("Day of Arafah", "يوم عرفة");
    else if (h.m === 1 && (h.d === 9 || h.d === 10)) why = h.d === 10 ? L("Ashura", "عاشوراء") : L("Tasu'a (9 Muharram)", "تاسوعاء");
    else if (h.d >= 13 && h.d <= 15) why = L("The white days (13–15)", "الأيام البيض");
    else if (h.m === 10 && h.d >= 2 && h.d <= 7) why = L("Six days of Shawwal", "ست من شوال");
    else if (wd === 1) why = L("Monday", "الاثنين"); else if (wd === 4) why = L("Thursday", "الخميس");
    if (why) out.push({ d, why, h });
  }
  return out;
}
function viewSunnah() {
  const day = today(), T = store.get("sunnah-" + day, {}), done = HABITS.filter(([k]) => T[k]).length;
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5), t = store.get("sunnah-" + dayKey(d), {}); return [d, HABITS.filter(([k]) => t[k]).length]; });
  const fasts = fastDays();
  app.innerHTML = topbar(`<h1>${L("Sunnah tracker", "متابعة السنن")}</h1>`) + `<div class="wrap">
    <div class="card" style="margin-top:6px"><div class="sk"><span class="v">${num(done)}</span><span class="l">/ ${num(HABITS.length)} ${L("today", "اليوم")}</span></div><div class="goal" style="margin:8px 0 4px"><div style="width:${done / HABITS.length * 100}%"></div></div>
      <div class="pweek" style="height:60px;margin-top:10px">${week.map(([d, c]) => `<span><i style="height:${6 + c * 6}px;opacity:${c ? 1 : .3}"></i>${num(c)}</span>`).join("")}</div></div>
    <div class="card listcard" style="margin-top:12px"><div class="list">${HABITS.map(([k, ic, en, ar]) => `<div class="row"><span style="font-size:22px">${ic}</span><div class="mid"><div class="t1" style="font-size:15px">${isAr() ? ar : en}</div></div>
      <button class="pdone ${T[k] ? "on" : ""}" onclick="noorHabit('${k}')">${ICON.check}</button></div>`).join("")}</div></div>
    <div class="sec">${L("Coming sunnah fasts", "صيام السنة القادم")}<a onclick="noorFastRem()" style="cursor:pointer">${S.fastRem ? "🔔 " + L("Reminders on", "التذكير مفعّل") : "🔕 " + L("Remind me", "ذكّرني")}</a></div>
    <div class="card listcard"><div class="list">${fasts.map(f => `<div class="row"><div class="mid"><div class="t1" style="font-size:15px">${esc(f.why)}</div><div class="t2">${f.d.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${esc(f.h.text || "")}</div></div></div>`).join("")}</div></div>
    <p class="lead" style="font-size:12.5px;margin-top:10px">${L("Eid days and the days of tashreeq are left out, as fasting is not allowed on them.", "استُبعدت أيام العيد وأيام التشريق لأن صيامها لا يجوز.")}</p></div>`;
  nav("prayer");
}
window.noorHabit = k => { const key = "sunnah-" + today(), t = store.get(key, {}); t[k] = !t[k]; store.set(key, t); if (t[k] && navigator.vibrate) navigator.vibrate(25); const y = scrollY; route().then(() => scrollTo(0, y)); };
window.noorFastRem = () => { S.fastRem = !S.fastRem; saveS(); if (window.noorAdhanSync) noorAdhanSync(); toast(S.fastRem ? L("You'll be reminded the evening before", "سيصلك تذكير في المساء قبلها") : L("Reminders off", "تم إيقاف التذكير")); route(); };

/* ---------- the night: midnight and the last third ---------- */
function night(d = new Date()) {
  if (!S.loc || !window.noorPrayer) return null;
  const t = noorPrayer.prayerTimes(d, S.loc.lat, S.loc.lng, S.method, 1), n = noorPrayer.prayerTimes(new Date(d.getTime() + 864e5), S.loc.lat, S.loc.lng, S.method, 1);
  if (!t.maghrib || !n.fajr) return null;
  const len = n.fajr - t.maghrib;
  return { midnight: new Date(t.maghrib.getTime() + len / 2), third: new Date(t.maghrib.getTime() + len * 2 / 3), fajr: n.fajr };
}
window.noorNightCard = () => {
  const nt = night(); if (!nt) return "";
  const hm = x => x.toLocaleTimeString(isAr() ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  return `<div class="sec">${L("The night", "الليل")}</div><div class="card" style="padding:4px 14px">
    <div class="opt"><span class="l">🌗 ${L("Midnight (for Isha)", "منتصف الليل (لوقت العشاء)")}</span><b>${hm(nt.midnight)}</b></div>
    <div class="opt"><span class="l">✨ ${L("Last third begins", "بداية الثلث الأخير")}<div class="d">${L("The best time for night prayer and dua", "أفضل وقت لقيام الليل والدعاء")}</div></span><b>${hm(nt.third)}</b></div>
    <div class="opt"><span class="l">🔔 ${L("Wake me for tahajjud", "أيقظني للتهجد")}</span><button class="sw ${S.tahajjud ? "on" : ""}" onclick="S.tahajjud=!S.tahajjud; saveS(); if (window.noorAdhanSync) noorAdhanSync(); route()"></button></div></div>`;
};

/* ---------- extra reminders for the phone: sunnah fasts and tahajjud ---------- */
const prevExtra = window.noorExtraAlarms;
window.noorExtraAlarms = () => {
  const out = prevExtra ? prevExtra() : [];
  if (S.fastRem) for (const f of fastDays(14)) { const eve = new Date(f.d.getTime() - 864e5); eve.setHours(21, 0, 0, 0); if (eve > Date.now()) out.push({ at: eve.getTime(), kind: "note", title: L("Tomorrow: ", "غدًا: ") + f.why, body: L("A sunnah fast. Remember suhoor before Fajr.", "صيام سنة. لا تنسَ السحور قبل الفجر."), url: location.origin + "/#/sunnah" }); }
  if (S.tahajjud) for (let i = 0; i < 7; i++) { const nt = night(new Date(Date.now() + (i - 1) * 864e5)); if (nt && nt.third > Date.now()) out.push({ at: nt.third.getTime(), kind: "note", title: L("The last third of the night", "الثلث الأخير من الليل"), body: L("A time when duas are answered. Pray tahajjud and witr.", "وقت إجابة الدعاء. صلِّ التهجد والوتر."), url: location.origin + "/#/sunnah" }); }
  return out;
};

/* ---------- mosques near you (OpenStreetMap) ---------- */
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
async function viewMosques() {
  app.innerHTML = topbar(`<h1>${L("Mosques near me", "مساجد قريبة")}</h1>`) + `<div class="wrap" id="mq"><div class="empty">${S.loc ? L("Looking for mosques…", "جارٍ البحث عن المساجد…") : ""}</div></div>`;
  nav("prayer");
  const box = $("#mq");
  if (!S.loc) { box.innerHTML = `<p class="lead">${L("Set your location first.", "حدد موقعك أولًا.")}</p><button class="btn wide" onclick="noorLocate()">${ICON.pin}${L("Use my location", "استخدم موقعي")}</button>`; return; }
  const { lat, lng } = S.loc, maps = `https://www.google.com/maps/search/mosque/@${lat},${lng},15z`;
  const q = `[out:json][timeout:20];nwr(around:3000,${lat},${lng})["amenity"="place_of_worship"]["religion"="muslim"];out center 40;`;
  let data = store.get("mosques", null);
  if (!data || Math.abs(data.lat - lat) > 0.01 || Math.abs(data.lng - lng) > 0.01 || Date.now() - data.at > 7 * 864e5) {
    data = null;
    for (const u of OVERPASS) { try { const r = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } }); if (r.ok) { const j = await r.json(); data = { lat, lng, at: Date.now(), els: j.elements }; store.set("mosques", data); break; } } catch { } }
  }
  if (!data) { box.innerHTML = `<p class="lead">${L("The free map service is busy right now. Try again in a minute, or open your maps app.", "خدمة الخرائط المجانية مشغولة الآن. حاول بعد دقيقة، أو افتح تطبيق الخرائط.")}</p><div class="rbtns"><button class="btn ghost" onclick="route()">${L("Try again", "حاول مرة أخرى")}</button><a class="btn" href="${maps}" target="_blank" rel="noopener">${ICON.pin}${L("Open in maps", "افتح في الخرائط")}</a></div>`; return; }
  const rad = x => x * Math.PI / 180, dist = (a, b, c, d) => 6371e3 * 2 * Math.asin(Math.sqrt(Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2));
  const list = data.els.map(e => { const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon; return la == null ? null : { name: (e.tags || {})["name:" + S.lang] || (e.tags || {}).name || L("Mosque", "مسجد"), la, lo, m: dist(lat, lng, la, lo), jumuah: /friday|جمعة/i.test(JSON.stringify(e.tags || {})) }; }).filter(Boolean).sort((a, b) => a.m - b.m).slice(0, 30);
  box.innerHTML = list.length ? `<p class="lead" style="margin-top:4px">${num(list.length)} ${L("within 3 km, from OpenStreetMap", "ضمن ٣ كم، من OpenStreetMap")}</p><div class="card listcard"><div class="list">${list.map(x => `<a class="row" href="https://www.google.com/maps/dir/?api=1&destination=${x.la},${x.lo}" target="_blank" rel="noopener">
      <span style="font-size:22px">🕌</span><div class="mid"><div class="t1" style="font-size:15px">${esc(x.name)}</div><div class="t2">${x.m < 1000 ? num(Math.round(x.m / 10) * 10) + L(" m", " م") : num((x.m / 1000).toFixed(1)) + L(" km", " كم")} · ${L("about", "حوالي")} ${num(Math.max(1, Math.round(x.m / 80)))} ${L("min walk", "دقيقة مشيًا")}</div></div><span style="color:var(--green)">${ICON.pin}</span></a>`).join("")}</div></div>`
    : `<p class="lead">${L("No mosques are mapped within 3 km.", "لا توجد مساجد مسجلة ضمن ٣ كم.")}</p><a class="btn wide" href="${maps}" target="_blank" rel="noopener">${L("Open in maps", "افتح في الخرائط")}</a>`;
}

VIEWS.push([/^\/hadith(?:\/(\d+))?/, viewHadith], [/^\/playlists/, viewPlaylists], [/^\/sunnah/, viewSunnah], [/^\/mosques/, viewMosques]);
window.noorDeen = { fastDays, night, PLAYLISTS, HABITS };
})();
