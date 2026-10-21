/* Noor daily: the ayah of the day (its own page, past days, a reflection, a reminder), a "Today" card with a dua and one of
   the 99 Names, and Al-Kahf on Friday. Reminders come as phone notifications in the Android app, even when it is closed. */
"use strict";
(() => {
const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function refFor(idx, d) {                                                     // the same ayah for everyone on the same day
  const seed = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  const g = (seed * 7919) % 6236 + 1;
  let s = 0, left = g; while (left > idx.surahs[s].count) { left -= idx.surahs[s].count; s++; }
  return { s: s + 1, a: left };
}
const dayNum = d => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
const parseDay = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
window.noorDailyRef = async (d = new Date()) => refFor(await index(), d);

/* ---------- the Today card on Home (replaces the plain ayah of the day) ---------- */
window.daily = async idx => {
  const box = $("#daily"); if (!box) return;
  const now = new Date(), r = refFor(idx, now), ay = (await surah(r.s)).ayahs[r.a - 1];
  const read = store.get("dailyRead", {})[dk(now)];
  const names = window.noorMore ? noorMore.NAMES : null, name = names ? names[dayNum(now) % names.length] : null;
  const duas = window.noorMore && noorMore.DUAS, du = duas ? duas[dayNum(now) % duas.length] : null;
  let duaHtml = "";
  if (du) { const d = await surah(du[0]), t = d.ayahs.slice(du[1] - 1, du[2]); duaHtml = `<a class="today-row" href="#/s/${du[0]}/${du[1]}"><span class="k">🤲 ${L("Dua of the day", "دعاء اليوم")}</span><span class="q t">${t.map(x => x.ar).join(" ")}</span></a>`; }
  box.innerHTML = `<div class="card daily"><a href="#/daily" style="display:block"><div class="k" style="color:var(--green);font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px">${read ? "✓ " : ""}${L("Ayah of the day", "آية اليوم")}</div>
      <div class="ar q">${ay.ar}</div>${S.en ? `<div class="en">${esc(ay.en)}</div>` : ""}<div class="ref">${esc(sName(idx.surahs[r.s - 1]))} ${num(r.s)}:${num(r.a)}</div></a>
    <div class="cnt" style="margin-top:10px"><button class="btn soft" onclick="player.start(${r.s}, ${r.a})">${ICON.play}${L("Listen", "استمع")}</button><a class="btn soft" href="#/daily">${ICON.book}${L("Reflect", "تدبّر")}</a>
      <button class="btn ghost" onclick="noorShareImage(${r.s}, ${r.a})">${ICON.star}${L("Share", "شارك")}</button></div>
    ${duaHtml}${name ? `<a class="today-row" href="#/names"><span class="k">✨ ${L("Name of the day", "اسم اليوم")}</span><span class="t"><b class="q">${name[0]}</b> · ${esc(name[1])}, ${esc(name[2])}</span></a>` : ""}</div>`;
};

/* ---------- Friday: Al-Kahf (from Thursday's Maghrib, when Friday begins) ---------- */
function isJumuah(now = new Date()) {
  if (now.getDay() === 5) return true;
  if (now.getDay() !== 4) return false;
  try { const t = S.loc && window.noorPrayer ? noorPrayer.prayerTimes(now, S.loc.lat, S.loc.lng, S.method, 1) : null; return now >= (t && t.maghrib ? t.maghrib : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18)); } catch { return false; }
}
window.noorFridayCard = () => {
  if (!isJumuah()) return "";
  const p = store.get("progress", {}), seen = (p.day === today() ? p.seen || [] : []).filter(k => Math.floor(k / 1000) === 18).length;
  return `<a class="card cont friday" href="#/s/18/${Math.min(110, seen + 1)}" style="margin-top:12px"><span class="sav big" style="background:linear-gradient(135deg,#7a4a0e,#c9892c)">١٨</span>
    <div class="t"><div class="k" style="color:#b7791f">${L("Jumu'ah Mubarak", "جمعة مباركة")}</div><div class="n" style="font-size:16px">${L("Read Surah Al-Kahf today", "اقرأ سورة الكهف اليوم")}</div>
    <div class="goal" style="margin-top:6px"><div style="width:${Math.min(100, seen / 110 * 100)}%;background:#c9892c"></div></div><div class="s">${num(seen)} / ${num(110)} ${t("ayahs")}</div></div></a>`;
};

/* ---------- the Ayah of the day page ---------- */
async function viewDaily(m) {
  const idx = await index(), now = new Date(), day = m && m[1] ? parseDay(m[1]) : now, key = dk(day), isToday = key === dk(now);
  const r = refFor(idx, day), d = await surah(r.s), ay = d.ayahs[r.a - 1], ref = `${sName(idx.surahs[r.s - 1])} ${num(r.s)}:${num(r.a)}`;
  const reflect = store.get("reflect", {}), done = store.get("dailyRead", {});
  if (isToday && !done[key]) { done[key] = 1; store.set("dailyRead", done); markRead(r.s, r.a); }
  const past = Array.from({ length: 14 }, (_, i) => new Date(now.getTime() - (i + 1) * 864e5));
  const rem = S.dailyAt || "";
  app.innerHTML = topbar(`<h1>${isToday ? L("Ayah of the day", "آية اليوم") : day.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { day: "numeric", month: "long" })}</h1>`) + `<div class="wrap">
    <div class="card" style="margin-top:6px"><div class="src" style="margin:0 0 6px;color:var(--green);font-weight:700">${day.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${esc(ref)}</div>
      <div class="q" style="font-size:calc(var(--ar)*1.05);line-height:2.1;direction:rtl;text-align:right">${ay.ar} <span class="mark">﴿${arNum(r.a)}﴾</span></div>
      ${S.tr ? `<div class="ayah" style="padding:0;border:0;box-shadow:none;background:none"><div class="tr">${esc(ay.tr)}</div></div>` : ""}
      <div style="color:var(--muted);font-size:16.5px;line-height:1.65;margin-top:8px">${esc(ay.en)}</div>
      <div class="cnt" style="margin-top:12px"><button class="btn" onclick="player.start(${r.s}, ${r.a})">${ICON.play}${L("Listen", "استمع")}</button><button class="btn soft" onclick="noorWbw(${r.s}, ${r.a}, this.closest('.card'))">${L("Word by word", "كلمة كلمة")}</button>
        <button class="btn ghost" onclick="noorShareImage(${r.s}, ${r.a})">${ICON.star}${L("Share", "شارك")}</button><a class="btn ghost" href="#/s/${r.s}/${r.a}">${L("In its surah", "في سورتها")}</a></div></div>
    <div class="tfbox" style="margin-top:12px"><b>${L("Tafsir (Al-Muyassar)", "التفسير الميسر")}</b>${esc(ay.tf)}</div>
    <div class="sec">${L("My reflection", "تدبّري")}</div>
    <div class="card"><textarea id="refl" rows="4" style="width:100%;border:0;outline:0;resize:vertical;background:none;font:inherit;color:var(--ink)" placeholder="${L("What does this ayah mean to you today?", "ماذا تعني لك هذه الآية اليوم؟")}">${esc(reflect[key] || "")}</textarea>
      <div style="text-align:end"><button class="btn soft" onclick="noorSaveReflect('${key}')">${L("Save", "حفظ")}</button></div></div>
    <div class="sec">${L("Remind me every day", "ذكّرني كل يوم")}</div>
    <div class="card" style="padding:4px 14px"><div class="opt"><span class="l">${L("Ayah of the day", "آية اليوم")}<div class="d">${window.AwsaaNative ? L("A notification with the ayah, even when Noor is closed", "إشعار بالآية حتى لو كان نور مغلقًا") : L("While Noor is open here. The Android app reminds you even when it is closed.", "ما دام نور مفتوحًا هنا. تطبيق أندرويد يذكّرك حتى لو كان مغلقًا.")}</div></span>
      <select class="sel" onchange="noorSetDaily(this.value)">${[["", L("Off", "إيقاف")], ["fajr", L("After Fajr", "بعد الفجر")], ["07:00", "7:00"], ["08:00", "8:00"], ["12:00", "12:00"], ["17:00", "17:00"], ["isha", L("After Isha", "بعد العشاء")], ["21:00", "21:00"]]
        .map(([v, l]) => `<option value="${v}" ${rem === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${L("Al-Kahf on Friday", "الكهف يوم الجمعة")}<div class="d">${L("A reminder on Friday morning", "تذكير صباح الجمعة")}</div></span><button class="sw ${S.kahf !== false ? "on" : ""}" onclick="S.kahf = ${S.kahf === false}; saveS(); if (window.noorAdhanSync) noorAdhanSync(); route()"></button></div></div>
    <div class="sec">${L("The last two weeks", "آخر أسبوعين")}</div>
    <div class="card listcard"><div class="list">${(await Promise.all(past.map(async p => { const q = refFor(idx, p), k = dk(p), sa = (await surah(q.s)).ayahs[q.a - 1];
      return `<a class="row" href="#/daily/${k}"><div class="num"><span>${done[k] ? "✓" : num(p.getDate())}</span></div><div class="mid"><div class="t1">${esc(sName(idx.surahs[q.s - 1]))} ${num(q.s)}:${num(q.a)}${reflect[k] ? " ✎" : ""}</div>
        <div class="t2">${p.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${esc(sa.en.slice(0, 60))}…</div></div></a>`; }))).join("")}</div></div></div>`;
  nav("home");
}
window.noorSaveReflect = k => { const r = store.get("reflect", {}); const v = $("#refl").value.trim(); if (v) r[k] = v; else delete r[k]; store.set("reflect", r); toast(L("Saved", "تم الحفظ")); };
window.noorSetDaily = v => { S.dailyAt = v; saveS(); if (window.noorAdhanSync) noorAdhanSync(); if (v && !window.AwsaaNative && "Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => { }); toast(v ? L("Reminder set", "تم ضبط التذكير") : L("Reminder off", "تم إيقاف التذكير")); };

/* ---------- reminders: handed to the phone in the Android app, checked by the page elsewhere ---------- */
function reminderTime(d) {
  const v = S.dailyAt; if (!v) return null;
  if (v === "fajr" || v === "isha") {
    if (!S.loc || !window.noorPrayer) return null;
    const t = noorPrayer.prayerTimes(d, S.loc.lat, S.loc.lng, S.method, 1)[v]; return t ? new Date(t.getTime() + 20 * 6e4) : null;
  }
  const [h, mm] = v.split(":").map(Number); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mm);
}
let IDX = null; index().then(i => IDX = i);
window.noorExtraAlarms = () => {
  const out = []; if (!IDX) return out;
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 864e5), at = reminderTime(d);
    if (at && at > Date.now()) {
      const r = refFor(IDX, d), s = cache2[r.s], text = s ? s.ayahs[r.a - 1].en : "";
      out.push({ at: at.getTime(), kind: "note", title: (isAr() ? "آية اليوم · " : "Ayah of the day · ") + `${sName(IDX.surahs[r.s - 1])} ${r.s}:${r.a}`, body: text || L("Open Noor to read today's ayah", "افتح نور لقراءة آية اليوم"), url: location.origin + "/#/daily" });
    }
    if (S.kahf !== false && d.getDay() === 5) { const at2 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0); if (at2 > Date.now()) out.push({ at: at2.getTime(), kind: "note", title: L("Jumu'ah Mubarak", "جمعة مباركة"), body: L("Read Surah Al-Kahf today", "اقرأ سورة الكهف اليوم"), url: location.origin + "/#/s/18" }); }
  }
  return out;
};
const cache2 = {};                                                           // the next week's ayahs, so the notification can show the words
index().then(async idx => { for (let i = 0; i < 7; i++) { const r = refFor(idx, new Date(Date.now() + i * 864e5)); cache2[r.s] = await surah(r.s); } if (window.noorAdhanSync) noorAdhanSync(); });
setInterval(() => {
  if (window.AwsaaNative) return;
  const at = reminderTime(new Date()); if (!at) return;
  const k = "dailyNote:" + today(), dt = Date.now() - at.getTime();
  if (dt >= 0 && dt < 120000 && !store.get(k, false)) {
    store.set(k, true);
    try { if ("Notification" in window && Notification.permission === "granted") new Notification(L("Ayah of the day", "آية اليوم"), { body: L("Tap to read today's ayah", "اضغط لقراءة آية اليوم"), icon: "/static/icon-192.png" }); } catch { }
    toast("📖 " + L("Ayah of the day is ready", "آية اليوم جاهزة"));
  }
}, 30000);

VIEWS.push([/^\/daily(?:\/(\d{4}-\d{2}-\d{2}))?/, viewDaily]);
})();
