/* Noor extras, all working offline: prayer times (calculated on the phone), Qibla, Hijri date and Ramadan mode,
   listening with downloads, morning/evening adhkar, and a memorization tracker. */
"use strict";
(() => {
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const fixA = a => (a % 360 + 360) % 360, fixH = h => (h % 24 + 24) % 24;

/* ---------- prayer times (the standard astronomical method, as in PrayTimes) ---------- */
const METHODS = {
  mwl: { en: "Muslim World League", ar: "رابطة العالم الإسلامي", fajr: 18, isha: 17 },
  egypt: { en: "Egyptian Authority", ar: "الهيئة المصرية العامة للمساحة", fajr: 19.5, isha: 17.5 },
  makkah: { en: "Umm al-Qura, Makkah", ar: "أم القرى، مكة", fajr: 18.5, ishaMin: 90 },
  karachi: { en: "Karachi", ar: "كراتشي", fajr: 18, isha: 18 },
  isna: { en: "North America (ISNA)", ar: "أمريكا الشمالية", fajr: 15, isha: 15 },
  dubai: { en: "Dubai", ar: "دبي", fajr: 18.2, isha: 18.2 },
  kuwait: { en: "Kuwait", ar: "الكويت", fajr: 18, isha: 17.5 },
  qatar: { en: "Qatar", ar: "قطر", fajr: 18, ishaMin: 90 },
  jordan: { en: "Jordan", ar: "الأردن", fajr: 18, isha: 18 },
};
function sun(jd) {
  const D = jd - 2451545.0, g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
  const Lm = fixA(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g))), e = 23.439 - 0.00000036 * D;
  const RA = fixH(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(Lm)), Math.cos(rad(Lm)))) / 15);
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(Lm)))), eqt: q / 15 - RA };
}
function julian(y, m, d) { if (m <= 2) { y--; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
function prayerTimes(date, lat, lng, methodKey = "mwl", asrFactor = 1) {
  const M = METHODS[methodKey] || METHODS.mwl;
  const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
  const mid = t => fixH(12 - sun(jd + t).eqt);
  const angleTime = (angle, t, ccw) => {
    const { decl } = sun(jd + t), noon = mid(t);
    const x = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat)));
    if (x < -1 || x > 1) return NaN;                                        // far north in summer: the sun never gets that low
    const T = deg(Math.acos(x)) / 15; return noon + (ccw ? -T : T);
  };
  const asrTime = (f, t) => { const { decl } = sun(jd + t); const a = -deg(Math.atan(1 / (f + Math.tan(rad(Math.abs(lat - decl)))))); return angleTime(a, t); };
  const p = { fajr: 5 / 24, sunrise: 6 / 24, dhuhr: 12 / 24, asr: 13 / 24, maghrib: 18 / 24, isha: 18 / 24 };
  let r = {};
  for (let pass = 0; pass < 2; pass++) {                                   // a second pass uses the first pass's times for better sun positions
    r = { fajr: angleTime(M.fajr, p.fajr, true), sunrise: angleTime(0.833, p.sunrise, true), dhuhr: mid(p.dhuhr), asr: asrTime(asrFactor, p.asr),
      maghrib: angleTime(0.833, p.maghrib), isha: M.ishaMin ? NaN : angleTime(M.isha, p.isha) };
    for (const k in r) if (!isNaN(r[k])) p[k] = r[k] / 24;
  }
  if (M.ishaMin) r.isha = r.maghrib + M.ishaMin / 60 + (isRamadan() && methodKey === "makkah" ? 0.5 : 0);
  r.dhuhr += 1 / 60;                                                        // a minute after the sun passes the middle
  const tz = -date.getTimezoneOffset() / 60, out = {};
  for (const k in r) {
    const h = r[k] + tz - lng / 15;
    out[k] = isNaN(h) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, Math.round(h * 60));
  }
  return out;
}
const PRAYERS = [["fajr", "Fajr", "الفجر"], ["sunrise", "Sunrise", "الشروق"], ["dhuhr", "Dhuhr", "الظهر"], ["asr", "Asr", "العصر"], ["maghrib", "Maghrib", "المغرب"], ["isha", "Isha", "العشاء"]];
const pname = k => { const p = PRAYERS.find(x => x[0] === k); return isAr() ? p[2] : p[1]; };
const hm = d => d ? d.toLocaleTimeString(isAr() ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
function todayTimes(d = new Date()) { return S.loc ? prayerTimes(d, S.loc.lat, S.loc.lng, S.method, S.asr === "hanafi" ? 2 : 1) : null; }
function nextPrayer() {
  if (!S.loc) return null;
  const now = new Date(), tt = todayTimes(now);
  for (const [k] of PRAYERS) if (k !== "sunrise" && tt[k] && tt[k] > now) return { k, at: tt[k], tt };
  const tm = todayTimes(new Date(now.getTime() + 864e5)); return { k: "fajr", at: tm.fajr, tt };
}
const left = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return isAr() ? `${arNum(h)}:${arNum(String(m % 60).padStart(2, "0"))}` : `${h}:${String(m % 60).padStart(2, "0")}`; };
function locate(done) {
  if (!navigator.geolocation) return toast(L("This device cannot share its location", "هذا الجهاز لا يدعم تحديد الموقع"));
  toast(L("Finding your location…", "جارٍ تحديد موقعك…"));
  navigator.geolocation.getCurrentPosition(p => {
    S.loc = { lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4), at: Date.now() };
    if (!store.get("methodSet", false)) S.method = guessMethod(S.loc);
    saveS(); toast(L("Location saved on this device", "تم حفظ الموقع على هذا الجهاز")); done && done();
  }, () => toast(L("Location is off. Allow it, or pick a city.", "الموقع مغلق. اسمح به أو اختر مدينة.")), { enableHighAccuracy: false, timeout: 15000, maximumAge: 6 * 3600e3 });
}
function guessMethod({ lat, lng }) {                                       // the usual method for the region
  if (lat > 22 && lat < 32 && lng > 24 && lng < 37) return "egypt";
  if (lat > 16 && lat < 32 && lng > 34 && lng < 56) return lng > 50 && lat > 24 ? (lng > 51.8 ? "dubai" : "qatar") : lat > 29 && lng < 39 ? "jordan" : "makkah";
  if (lat > 23 && lat < 38 && lng > 60 && lng < 78) return "karachi";
  if (lng < -50 && lat > 15) return "isna";
  return "mwl";
}
const CITIES = [["Makkah", "مكة", 21.4225, 39.8262], ["Madinah", "المدينة", 24.4672, 39.6111], ["Riyadh", "الرياض", 24.7136, 46.6753], ["Cairo", "القاهرة", 30.0444, 31.2357],
  ["Amman", "عمّان", 31.9454, 35.9284], ["Jerusalem", "القدس", 31.7683, 35.2137], ["Dubai", "دبي", 25.2048, 55.2708], ["Doha", "الدوحة", 25.2854, 51.531], ["Kuwait", "الكويت", 29.3759, 47.9774],
  ["Istanbul", "إسطنبول", 41.0082, 28.9784], ["London", "لندن", 51.5072, -0.1276], ["New York", "نيويورك", 40.7128, -74.006], ["Toronto", "تورونتو", 43.6532, -79.3832], ["Karachi", "كراتشي", 24.8607, 67.0011]];

/* ---------- Hijri date and Ramadan ----------
   The Arabian Peninsula follows the Umm al-Qura calendar; elsewhere the months start by moon sighting, which the astronomical
   calendar follows more closely. The calendar is picked from the saved location, and a ±2 day adjustment matches the local announcement. */
const GULF = ({ lat, lng }) => lat > 12 && lat < 32.5 && lng > 34.5 && lng < 60 && !(lat > 29.6 && lng < 47.6) && !(lng < 37 && lat > 27.5);
function hijriCal() {
  if (S.hcal && S.hcal !== "auto") return S.hcal;
  return !S.loc || GULF(S.loc) ? "islamic-umalqura" : "islamic";
}
const HCAL_NAMES = { "islamic-umalqura": ["Umm al-Qura (Saudi Arabia)", "أم القرى (السعودية)"], "islamic": ["Astronomical (moon sighting)", "فلكي (رؤية الهلال)"], "islamic-civil": ["Tabular (civil)", "الحسابي"] };
function hijriParts(d, cal) {
  const f = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { day: "numeric", month: "numeric", year: "numeric" });
  const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value])); return { d: +p.day, m: +p.month, y: parseInt(p.year) };
}
function hijri(d = new Date()) {
  try {
    const cal = hijriCal(), shifted = new Date(d.getTime() + (S.hadj || 0) * 864e5);
    const parts = hijriParts(shifted, cal);
    const text = new Intl.DateTimeFormat(isAr() ? `ar-SA-u-ca-${cal}` : `en-u-ca-${cal}`, { day: "numeric", month: "long", year: "numeric" }).format(shifted);
    return { ...parts, text, cal };
  } catch { return { d: 0, m: 0, y: 0, text: "" }; }
}
window.noorHijri = { hijri, hijriCal, hijriParts, HCAL_NAMES };
function isRamadan() { return S.ramadan === "on" || (S.ramadan === "auto" && hijri().m === 9); }
function ramadanDay() { const h = hijri(); return h.m === 9 ? h.d : Math.min(30, Math.max(1, store.get("ramDayManual", 1))); }

/* ---------- home hero card ---------- */
let heroTimer = null;
window.heroCard = () => {
  const box = $("#hero"); if (!box) return;
  clearInterval(heroTimer);
  const draw = () => {
    if (!document.body.contains(box)) return clearInterval(heroTimer);
    const h = hijri(), now = new Date();
    const greg = now.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
    let main = "";
    if (!S.loc) main = `<div class="next"><div><div class="l">${L("Prayer times", "مواقيت الصلاة")}</div><div class="n" style="font-size:19px">${L("Works offline", "تعمل دون إنترنت")}</div></div>
      <button class="btn" onclick="noorLocate()">${ICON.pin}${L("Set location", "حدد موقعك")}</button></div>`;
    else if (isRamadan()) {
      const tt = todayTimes(now), fasting = tt.fajr <= now && now < tt.maghrib;
      const target = fasting ? tt.maghrib : (now < tt.fajr ? tt.fajr : todayTimes(new Date(now.getTime() + 864e5)).fajr);
      main = `<div class="next"><div><div class="l">🌙 ${L("Ramadan day", "اليوم")} ${num(ramadanDay())} · ${fasting ? L("Iftar in", "الإفطار بعد") : L("Suhoor ends in", "ينتهي السحور بعد")}</div>
        <div class="c">${left(target - now)}</div></div><div style="text-align:end"><div class="l">${fasting ? pname("maghrib") : pname("fajr")}</div><div class="n">${hm(target)}</div></div></div>`;
    } else {
      const n = nextPrayer();
      main = `<div class="next"><div><div class="l">${L("Next prayer", "الصلاة القادمة")}</div><div class="n">${pname(n.k)} ${hm(n.at)}</div></div>
        <div style="text-align:end"><div class="l">${L("in", "بعد")}</div><div class="c">${left(n.at - now)}</div></div></div>`;
    }
    box.innerHTML = `<a class="hero" href="${isRamadan() ? "#/ramadan" : "#/prayer"}" style="display:block"><div class="d1">${greg}</div><div class="d2">${h.text}</div>${main}</a>`;
  };
  draw(); heroTimer = setInterval(draw, 30000);
};
window.noorLocate = () => locate(() => route());

/* ---------- prayer page ---------- */
async function viewPrayer() {
  const now = new Date();
  if (!S.loc) {
    app.innerHTML = topbar(`<h1>${t("prayer")}</h1>`, false) + `<div class="wrap"><h2 class="big">${L("Prayer times", "مواقيت الصلاة")}</h2>
      <p class="lead">${L("Noor calculates the times on your phone, so they work with no internet. Your location stays on this device.", "يحسب نور المواقيت على جهازك، فتعمل دون إنترنت. موقعك يبقى على هذا الجهاز.")}</p>
      <button class="btn wide" style="margin-top:16px" onclick="noorLocate()">${ICON.pin}${L("Use my location", "استخدم موقعي")}</button>
      <div class="sec">${L("Or pick a city", "أو اختر مدينة")}</div><div class="card listcard"><div class="list">${CITIES.map((c, i) => `<button class="row" onclick="noorCity(${i})" style="width:100%"><div class="mid"><div class="t1">${isAr() ? c[1] : c[0]}</div></div></button>`).join("")}</div></div></div>`;
    return nav("prayer");
  }
  const tt = todayTimes(now), n = nextPrayer();
  const M = METHODS[S.method] || METHODS.mwl;
  const prayed = store.get("prayed-" + today(), {});
  const weekCount = Array.from({ length: 7 }, (_, i) => Object.values(store.get("prayed-" + dayKey(new Date(Date.now() - i * 864e5)), {})).filter(Boolean).length).reduce((a, b) => a + b, 0);
  app.innerHTML = topbar(`<h1>${t("prayer")}</h1>`, false) + `<div class="wrap"><div id="hero"></div>
    <div class="card ptimes" style="margin-top:12px;padding:6px 10px"><div class="list">${PRAYERS.map(([k]) => `<div class="row ${n && n.k === k && tt[k] > now ? "now" : ""}"><div class="mid"><div class="t1">${pname(k)}</div></div><div class="tm">${hm(tt[k])}</div>
      ${k === "sunrise" ? `<span style="width:50px"></span>` : `<button class="pdone ${prayed[k] ? "on" : ""}" onclick="noorPrayed('${k}')" aria-label="${L("Prayed", "صليت")}">${ICON.check}</button>`}</div>`).join("")}</div></div>
    <div class="sec">${L("Prayers this week", "صلوات هذا الأسبوع")}<a>${num(weekCount)} / ${num(35)}</a></div>
    <div class="card"><div class="pweek">${Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.now() - (6 - i) * 864e5), P = store.get("prayed-" + dayKey(d), {});
      const c = ["fajr", "dhuhr", "asr", "maghrib", "isha"].filter(k => P[k]).length; return `<span><i style="height:${8 + c * 10}px;opacity:${c ? 1 : .35}"></i>${num(c)}</span>`; }).join("")}</div></div>
    <div class="sec">${L("Settings", "الإعدادات")}</div>
    <div class="card" style="padding:4px 14px">
      <div class="opt"><span class="l">${L("Method", "طريقة الحساب")}</span><select class="sel" onchange="S.method=this.value; store.set('methodSet', true); saveS(); route()">${Object.entries(METHODS).map(([k, m]) => `<option value="${k}" ${k === S.method ? "selected" : ""}>${isAr() ? m.ar : m.en}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${L("Asr", "العصر")}</span><div class="seg"><button class="${S.asr !== "hanafi" ? "on" : ""}" onclick="S.asr='std'; saveS(); route()">${L("Standard", "الجمهور")}</button><button class="${S.asr === "hanafi" ? "on" : ""}" onclick="S.asr='hanafi'; saveS(); route()">${L("Hanafi", "الحنفي")}</button></div></div>
      <div class="opt"><span class="l">${L("Location", "الموقع")}<div class="d">${S.loc.name || `${S.loc.lat}, ${S.loc.lng}`}</div></span><button class="btn soft" onclick="noorLocate()">${ICON.pin}${L("Update", "تحديث")}</button></div>
    </div>
    <a class="card cont" href="#/qibla" style="margin-top:12px"><span class="tile" style="padding:0;border:0;box-shadow:none"><span class="ic">${ICON.compass}</span></span><div class="t"><div class="n" style="font-size:16px">${L("Qibla direction", "اتجاه القبلة")}</div>
      <div class="s">${num(Math.round(qibla(S.loc.lat, S.loc.lng)))}° ${L("from north", "من الشمال")}</div></div></a>
    <p class="lead" style="margin-top:12px;font-size:12.5px">${L("Calculated with", "محسوبة بطريقة")} ${isAr() ? M.ar : M.en}. ${L("Times can differ by a few minutes from your local mosque.", "قد تختلف بدقائق عن مسجدك.")}</p></div>`;
  nav("prayer"); heroCard();
}
window.noorPrayed = k => { const key = "prayed-" + today(), P = store.get(key, {}); P[k] = !P[k]; store.set(key, P); if (P[k] && navigator.vibrate) navigator.vibrate(30); const y = scrollY; route().then(() => scrollTo(0, y)); };
window.noorCity = i => { const c = CITIES[i]; S.loc = { lat: c[2], lng: c[3], name: isAr() ? c[1] : c[0] }; if (!store.get("methodSet", false)) S.method = guessMethod(S.loc); saveS(); route(); };

/* ---------- Qibla ---------- */
function qibla(lat, lng) {
  const k = { lat: rad(21.4225), lng: rad(39.8262) }, p = { lat: rad(lat), lng: rad(lng) };
  return fixA(deg(Math.atan2(Math.sin(k.lng - p.lng), Math.cos(p.lat) * Math.tan(k.lat) - Math.sin(p.lat) * Math.cos(k.lng - p.lng))));
}
let compassOff = null;
async function viewQibla() {
  if (compassOff) compassOff();
  if (!S.loc) { app.innerHTML = topbar(`<h1>${L("Qibla", "القبلة")}</h1>`) + `<div class="wrap"><p class="lead">${L("Set your location first.", "حدد موقعك أولًا.")}</p><button class="btn wide" onclick="noorLocate()">${ICON.pin}${L("Use my location", "استخدم موقعي")}</button></div>`; return nav("prayer"); }
  const q = qibla(S.loc.lat, S.loc.lng);
  app.innerHTML = topbar(`<h1>${L("Qibla", "القبلة")}</h1>`) + `<div class="wrap" style="text-align:center">
    <h2 class="big">${num(Math.round(q))}°</h2><p class="lead">${L("Hold the phone flat. Turn until the green line points up.", "ضع الهاتف بشكل مستوٍ، ودُر حتى يشير الخط الأخضر إلى الأعلى.")}</p>
    <div class="compass"><div class="dial" id="dial"><span>N</span></div><div class="kaaba" id="kaaba"><b>🕋</b><i></i></div><div class="center"></div></div>
    <p class="lead" id="cmpNote">${L("Waiting for the compass…", "بانتظار البوصلة…")}</p>
    <button class="btn soft" id="cmpGo" hidden>${L("Turn on the compass", "شغّل البوصلة")}</button></div>`;
  nav("prayer");
  const setHeading = hd => {
    $("#dial") && ($("#dial").style.transform = `rotate(${-hd}deg)`);
    $("#kaaba") && ($("#kaaba").style.transform = `rotate(${q - hd}deg)`);
    const off = Math.abs(((q - hd + 540) % 360) - 180);
    const note = $("#cmpNote"); if (note) note.textContent = off < 5 ? L("You are facing the Qibla ✓", "أنت متجه إلى القبلة ✓") : `${L("Turn", "دُر")} ${num(Math.round(off))}°`;
  };
  setHeading(0);
  const onOri = e => { let hd = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute || e.type === "deviceorientationabsolute") && e.alpha != null ? 360 - e.alpha : null; if (hd != null) setHeading(hd); };
  const start = () => { window.addEventListener("deviceorientationabsolute", onOri); window.addEventListener("deviceorientation", onOri); };
  compassOff = () => { window.removeEventListener("deviceorientationabsolute", onOri); window.removeEventListener("deviceorientation", onOri); compassOff = null; };
  if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) { const b = $("#cmpGo"); b.hidden = false; b.onclick = () => DeviceOrientationEvent.requestPermission().then(r => r === "granted" && start()); }
  else start();
}
window.addEventListener("hashchange", () => { if (compassOff && !location.hash.startsWith("#/qibla")) compassOff(); });

/* ---------- listen: reciters and downloads ---------- */
const dl = () => store.get("dl", {});                                       // {"reciter:surah": true}
async function viewListen() {
  const idx = await index();
  const have = dl(), r = reciter();
  const mine = Object.keys(have).filter(k => k.startsWith(r.id + ":")).map(k => +k.split(":")[1]);
  app.innerHTML = topbar(`<h1>${t("listen")}</h1>`, false) + `<div class="wrap">
    <div class="sec" style="margin-top:6px">${L("Reciter", "القارئ")}</div>
    ${RECITERS.map(x => `<button class="rec ${x.id === r.id ? "on" : ""}" onclick="S.reciter='${x.id}'; saveS(); route()"><span class="av">${x.i}</span><span class="mid"><div class="t1">${isAr() ? x.ar : x.en}</div>
      <div class="t2">${x.id === "ar.mahermuaiqly" ? L("Default · ", "الافتراضي · ") : ""}${x.kbps === 128 ? L("High quality", "جودة عالية") : L("Standard quality", "جودة عادية")}</div></span>${x.id === r.id ? `<span style="color:var(--green)">${ICON.check}</span>` : ""}</button>`).join("")}
    <div class="sec">${L("Surahs", "السور")} · ${isAr() ? r.ar : r.en}<a>${num(mine.length)} ${L("saved offline", "محفوظة")}</a></div>
    <p class="lead" style="margin:-4px 2px 10px">${L("Tap ↓ to keep a surah on this device and listen with no internet.", "اضغط ↓ لحفظ السورة على جهازك والاستماع دون إنترنت.")}</p>
    <div class="card listcard"><div class="list">${idx.surahs.map(s => {
      const k = r.id + ":" + s.n, ok = have[k];
      return `<div class="row"><div class="num"><span>${num(s.n)}</span></div><a class="mid" href="#/s/${s.n}"><div class="t1">${esc(sName(s))}</div><div class="t2">${num(s.count)} ${t("ayahs")}${ok ? " · " + L("Offline ✓", "محفوظة ✓") : ""}</div></a>
        <button class="ib" onclick="player.start(${s.n},1)" aria-label="${t("playSurah")}">${ICON.play}</button>
        <button class="ib" id="dl${s.n}" onclick="noorDl(${s.n})" aria-label="Download" style="color:${ok ? "var(--green)" : "var(--quiet)"}">${ok ? ICON.check : ICON.down}</button></div>`;
    }).join("")}</div></div></div>`;
  nav("listen");
}
window.noorDl = async n => {
  const r = reciter(), k = r.id + ":" + n, have = dl(), btn = $("#dl" + n);
  const c = await audioCache(), data = await surah(n);
  if (have[k]) {
    if (!confirm(L("Remove this surah's audio from the device?", "حذف صوت هذه السورة من الجهاز؟"))) return;
    for (const a of data.ayahs) await c.delete(localUrl(r.id, a.g));
    delete have[k]; store.set("dl", have); return route();
  }
  let done = 0; btn.disabled = true;
  try {
    for (let i = 0; i < data.ayahs.length; i += 4) {
      await Promise.all(data.ayahs.slice(i, i + 4).map(async a => {
        const u = localUrl(r.id, a.g);
        if (!(await c.match(u))) { const res = await fetch(u); if (!res.ok) throw new Error("dl"); await c.put(u, res); }
        done++; btn.textContent = Math.round(done / data.ayahs.length * 100) + "%";
      }));
    }
    have[k] = true; store.set("dl", have); toast(L("Saved for offline listening", "تم الحفظ للاستماع دون إنترنت"));
  } catch { toast(L("Download stopped. Check the internet and try again.", "توقف التحميل. تحقق من الإنترنت وحاول مرة أخرى.")); }
  route();
};

/* ---------- more ---------- */
function viewMore() {
  app.innerHTML = topbar(`<h1>${t("more")}</h1>`, false) + `<div class="wrap"><div class="tiles" style="margin-top:6px">
    ${tile("#/recite/1/1", ICON.mic, L("Recite", "التسميع"))}${tile("#/hifz", ICON.brain, L("Memorize", "الحفظ"))}${tile("#/ramadan", ICON.moon, L("Ramadan", "رمضان"))}
    ${tile("#/adhkar/morning", ICON.sun, L("Morning adhkar", "أذكار الصباح"))}${tile("#/adhkar/evening", ICON.moon, L("Evening adhkar", "أذكار المساء"))}${tile("#/tasbih", ICON.beads, t("tasbih"))}
    ${tile("#/qibla", ICON.compass, L("Qibla", "القبلة"))}${tile("#/names", ICON.star, L("99 Names", "الأسماء الحسنى"))}${tile("#/duas", ICON.book, L("Quran duas", "أدعية قرآنية"))}
    ${tile("#/khatma", ICON.quran, L("Khatma plan", "خطة الختمة"))}${tile("#/notes", ICON.mark, L("My notes", "ملاحظاتي"))}${tile("#/calendar", ICON.moon, L("Hijri calendar", "التقويم الهجري"))}
    ${tile("#/game", ICON.play, L("Noor Quest game", "لعبة رحلة نور"))}${tile("#/quiz", ICON.brain, L("Quiz", "مسابقة"))}${tile("#/zakat", ICON.grid, L("Zakat", "الزكاة"))}${tile("#/prayer", ICON.mosque, L("Prayer tracker", "متابعة الصلوات"))}<a class="tile" href="javascript:openSettings()"><span class="ic">${ICON.gear}</span>${t("settings")}</a></div>
    <div class="sec">${L("Works without internet", "يعمل دون إنترنت")}</div>
    <div class="card" style="color:var(--muted);font-size:14.5px;line-height:1.8">${L("Reading, tafsir, prayer times, Qibla, adhkar, tasbih, memorizing, Ramadan mode and your streak all work offline. Save the whole Quran in Settings, and download surahs in Listen to hear them offline. Reciting and full-text search need the internet.",
      "القراءة والتفسير ومواقيت الصلاة والقبلة والأذكار والمسبحة والحفظ ووضع رمضان وسلسلة الأيام تعمل كلها دون إنترنت. احفظ القرآن كاملًا من الإعدادات، وحمّل السور من صفحة الاستماع. التسميع والبحث في الآيات يحتاجان إلى إنترنت.")}</div>
    <div class="foot"><b>${t("made")} Awsaa</b><br>Noor ${NOOR.version}<br>${t("text")}</div></div>`;
  nav("more");
}

/* ---------- Ramadan ---------- */
async function viewRamadan() {
  const v185 = await quranText([2, 185, 185]);
  const R = store.get("ramadan", { fast: {}, tarawih: {}, juz: {} }), day = ramadanDay(), on = isRamadan(), h = hijri();
  const count = o => Object.values(o).filter(Boolean).length;
  const grid = (key, label) => `<div class="sec">${label}<a>${num(count(R[key]))} / ${num(30)}</a></div><div class="card"><div class="grid30">${Array.from({ length: 30 }, (_, i) => {
    const d = i + 1; return `<button class="${R[key][d] ? "on" : ""} ${on && d === day ? "today" : ""} ${d >= 21 && d % 2 ? "odd10" : ""}" onclick="noorRam('${key}', ${d})">${num(d)}</button>`; }).join("")}</div></div>`;
  const tt = todayTimes();
  app.innerHTML = topbar(`<h1>${L("Ramadan", "رمضان")}</h1>`) + `<div class="wrap">
    <div class="hero"><div class="d1">${h.text}</div><div class="n" style="font-size:24px;font-weight:800;margin-top:6px">🌙 ${on ? `${L("Ramadan day", "اليوم")} ${num(day)}` : L("Ramadan mode", "وضع رمضان")}</div>
      ${tt ? `<div class="row2"><span class="chipw">${L("Suhoor ends", "السحور حتى")} ${hm(tt.fajr)}</span><span class="chipw">${L("Iftar", "الإفطار")} ${hm(tt.maghrib)}</span></div>` : `<div class="row2"><button class="chipw" onclick="noorLocate()">${L("Set location for suhoor and iftar", "حدد موقعك لمعرفة السحور والإفطار")}</button></div>`}</div>
    <div class="card" style="margin-top:12px;padding:4px 14px"><div class="opt"><span class="l">${L("Ramadan mode", "وضع رمضان")}<div class="d">${L("Auto turns on in Ramadan by the Hijri calendar", "التلقائي يعمل في رمضان حسب التقويم الهجري")}</div></span>
      <div class="seg">${[["auto", L("Auto", "تلقائي")], ["on", L("On", "تشغيل")], ["off", L("Off", "إيقاف")]].map(([v, l]) => `<button class="${S.ramadan === v ? "on" : ""}" onclick="S.ramadan='${v}'; saveS(); route()">${l}</button>`).join("")}</div></div></div>
    <div class="stat3" style="margin-top:12px"><div class="card"><div class="v">${num(count(R.fast))}</div><div class="l">${L("days fasted", "أيام الصيام")}</div></div>
      <div class="card"><div class="v">${num(count(R.juz))}</div><div class="l">${L("juz read", "أجزاء مقروءة")}</div></div><div class="card"><div class="v">${num(count(R.tarawih))}</div><div class="l">${L("taraweeh", "التراويح")}</div></div></div>
    <div class="sec">${L("Khatma: one juz a day", "الختمة: جزء كل يوم")}<a href="#/s/${INDEXJ(day).s}/${INDEXJ(day).a}">${L("Read today's juz", "اقرأ جزء اليوم")} ${num(day)}</a></div>
    <div class="card"><div class="grid30">${Array.from({ length: 30 }, (_, i) => { const d = i + 1; return `<button class="${R.juz[d] ? "on" : ""} ${on && d === day ? "today" : ""}" onclick="noorRam('juz', ${d})">${num(d)}</button>`; }).join("")}</div>
      <div class="goal" style="margin-top:14px"><div style="width:${count(R.juz) / 30 * 100}%"></div></div></div>
    ${grid("fast", L("Fasting", "الصيام"))}${grid("tarawih", L("Taraweeh", "التراويح"))}
    <p class="lead" style="font-size:12.5px">✦ ${L("The odd nights of the last ten: seek Laylat al-Qadr.", "الليالي الوترية من العشر الأواخر: تحرَّ ليلة القدر.")}</p>
    <div class="sec">${L("Duas", "أدعية")}</div>
    ${dua("اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", L("Laylat al-Qadr dua · Tirmidhi", "دعاء ليلة القدر · الترمذي"))}
    ${dua("ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", L("When breaking the fast · Abu Dawud", "عند الإفطار · أبو داود"))}
    ${dua(v185, L("Al-Baqarah 2:185", "البقرة ١٨٥"), true)}
    </div>`;
  nav("more");
}
const dua = (ar, src, q) => `<div class="card dhikr"><div class="ar ${q ? "q" : ""}">${ar}</div><div class="src">${src}</div></div>`;
let JUZ = null; index().then(i => JUZ = i.juz);
const INDEXJ = d => (JUZ && JUZ[d - 1]) || { s: 1, a: 1 };
window.noorRam = (key, d) => { const R = store.get("ramadan", { fast: {}, tarawih: {}, juz: {} }); R[key][d] = !R[key][d]; store.set("ramadan", R); route(); };

/* ---------- adhkar (well-known, with their sources) ---------- */
const ADHKAR = {
  both: [
    { ref: [2, 255, 255], n: 1, src: ["Ayat al-Kursi · Al-Baqarah 2:255", "آية الكرسي · البقرة ٢٥٥"] },
    { ref: [112, 1, 4], n: 3, src: ["Al-Ikhlas · Abu Dawud, Tirmidhi", "الإخلاص · أبو داود والترمذي"] },
    { ref: [113, 1, 5], n: 3, src: ["Al-Falaq", "الفلق"] },
    { ref: [114, 1, 6], n: 3, src: ["An-Nas", "الناس"] },
    { ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", n: 1, src: ["Sayyid al-Istighfar · Bukhari", "سيد الاستغفار · البخاري"] },
    { ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", n: 3, src: ["Abu Dawud, Tirmidhi", "أبو داود والترمذي"] },
    { ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", n: 3, src: ["Abu Dawud", "أبو داود"] },
    { ar: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", n: 7, src: ["Abu Dawud", "أبو داود"] },
    { ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", n: 100, src: ["Muslim", "مسلم"] },
    { ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 100, src: ["Bukhari, Muslim (100 times a day)", "البخاري ومسلم (مئة مرة في اليوم)"] },
  ],
  morning: [{ ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 1, src: ["Muslim", "مسلم"] },
    { ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", n: 1, src: ["Tirmidhi", "الترمذي"] }],
  evening: [{ ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", n: 1, src: ["Muslim", "مسلم"] },
    { ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", n: 1, src: ["Tirmidhi", "الترمذي"] }],
};
async function quranText(ref) {
  const [s, a, b] = ref, data = await surah(s);
  return data.ayahs.slice(a - 1, b).map(x => x.ar + (b > a ? ` <span class="mark">﴿${arNum(x.n)}﴾</span>` : "")).join(" ");
}
async function viewAdhkar(m) {
  const which = m && m[1] === "evening" ? "evening" : "morning";
  const list = [...ADHKAR[which], ...ADHKAR.both];
  for (const x of list) if (x.ref && !x.ar) { x.ar = await quranText(x.ref); x.q = true; }
  const key = "adhkar-" + which + "-" + today(), done = store.get(key, {});
  app.innerHTML = topbar(`<h1>${which === "morning" ? L("Morning adhkar", "أذكار الصباح") : L("Evening adhkar", "أذكار المساء")}</h1>`) + `<div class="wrap">
    <div class="tabs"><button class="${which === "morning" ? "on" : ""}" onclick="location.hash='#/adhkar/morning'">${L("Morning", "الصباح")}</button><button class="${which === "evening" ? "on" : ""}" onclick="location.hash='#/adhkar/evening'">${L("Evening", "المساء")}</button></div>
    <div class="goal" style="margin:8px 0 14px"><div style="width:${list.filter((x, i) => (done[i] || 0) >= x.n).length / list.length * 100}%"></div></div>
    ${list.map((x, i) => { const c = done[i] || 0; return `<div class="card dhikr ${c >= x.n ? "done" : ""}"><div class="ar ${x.q ? "q" : ""}">${x.ar}</div><div class="src">${isAr() ? x.src[1] : x.src[0]}</div>
      <div class="cnt"><button class="btn ${c >= x.n ? "soft" : ""}" onclick="noorDhikr('${key}', ${i}, ${x.n})">${c >= x.n ? ICON.check + L("Done", "تم") : `${num(c)} / ${num(x.n)}`}</button></div></div>`; }).join("")}</div>`;
  nav("more");
}
window.noorDhikr = (key, i, n) => { const d = store.get(key, {}); d[i] = Math.min(n, (d[i] || 0) + 1); store.set(key, d); if (d[i] === n && navigator.vibrate) navigator.vibrate(40); const y = scrollY; route().then(() => scrollTo(0, y)); };

/* ---------- memorization (hifz) ---------- */
async function viewHifz() {
  const idx = await index(), H = store.get("hifz", {});                     // {surah: "learning" | "done"}
  const total = 6236, doneAyahs = idx.surahs.filter(s => H[s.n] === "done").reduce((a, s) => a + s.count, 0);
  const pct = Math.round(doneAyahs / total * 1000) / 10;
  const best = store.get("reciteBest", {});
  const bestFor = n => { const v = Object.entries(best).filter(([k]) => k.startsWith(n + ":")).map(([, v]) => v); return v.length ? Math.max(...v) : null; };
  const label = st => st === "done" ? L("Memorized", "محفوظة") : st === "learning" ? L("Learning", "أحفظها") : L("Not yet", "لم أبدأ");
  app.innerHTML = topbar(`<h1>${L("Memorize", "الحفظ")}</h1>`) + `<div class="wrap">
    <div class="rscore"><div class="ring" style="--p:${pct}"><div><b>${num(pct)}</b><span>%</span></div></div>
      <div class="d">${num(doneAyahs)} ${L("of", "من")} ${num(total)} ${t("ayahs")} · ${num(Object.values(H).filter(v => v === "done").length)} ${L("surahs memorized", "سورة محفوظة")}</div></div>
    <p class="lead">${L("Tap a surah's status to change it. Test yourself with Tasmi': the text is hidden and Noor scores you.", "اضغط على حالة السورة لتغييرها. اختبر نفسك بالتسميع: النص مخفي ونور يقيّمك.")}</p>
    <div class="card listcard" style="margin-top:12px"><div class="list">${[...idx.surahs].reverse().map(s => { const st = H[s.n], b = bestFor(s.n);
      return `<div class="row"><div class="num"><span>${num(s.n)}</span></div><a class="mid" href="#/s/${s.n}"><div class="t1">${esc(sName(s))}</div><div class="t2">${num(s.count)} ${t("ayahs")}${b != null ? ` · ${L("best", "أفضل")} ${num(b)}%` : ""}</div></a>
        <button class="hstate ${st || ""}" onclick="noorHifz(${s.n})">${label(st)}</button><a class="ib" href="#/recite/${s.n}/1" aria-label="Test">${ICON.mic}</a></div>`; }).join("")}</div></div></div>`;
  nav("more");
}
window.noorHifz = n => { const H = store.get("hifz", {}); H[n] = !H[n] ? "learning" : H[n] === "learning" ? "done" : undefined; if (!H[n]) delete H[n]; store.set("hifz", H); const y = scrollY; route().then(() => scrollTo(0, y)); };

VIEWS.push([/^\/prayer/, viewPrayer], [/^\/qibla/, viewQibla], [/^\/listen/, viewListen], [/^\/more/, viewMore], [/^\/ramadan/, viewRamadan],
  [/^\/adhkar(?:\/(\w+))?/, viewAdhkar], [/^\/hifz/, viewHifz]);
window.noorPrayer = { prayerTimes, qibla, hijri, METHODS };                // for tests
})();
