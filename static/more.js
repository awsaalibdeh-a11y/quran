/* Noor: more pages, all offline. Names of Allah, Quranic duas, notes and highlights, a personal khatma plan,
   the Hijri calendar with Islamic days, a "which surah?" quiz, a zakat calculator, and sharing an ayah as a picture. */
"use strict";
(() => {
/* ---------- the 99 Names (the list in Tirmidhi) ---------- */
const NAMES = [["الرَّحْمَٰنُ", "Ar-Rahman", "The Most Merciful"], ["الرَّحِيمُ", "Ar-Rahim", "The Especially Merciful"], ["الْمَلِكُ", "Al-Malik", "The King"], ["الْقُدُّوسُ", "Al-Quddus", "The Most Holy"],
  ["السَّلَامُ", "As-Salam", "The Source of Peace"], ["الْمُؤْمِنُ", "Al-Mu'min", "The Giver of Safety"], ["الْمُهَيْمِنُ", "Al-Muhaymin", "The Guardian"], ["الْعَزِيزُ", "Al-Aziz", "The Almighty"],
  ["الْجَبَّارُ", "Al-Jabbar", "The Compeller"], ["الْمُتَكَبِّرُ", "Al-Mutakabbir", "The Supreme"], ["الْخَالِقُ", "Al-Khaliq", "The Creator"], ["الْبَارِئُ", "Al-Bari'", "The Maker"],
  ["الْمُصَوِّرُ", "Al-Musawwir", "The Fashioner"], ["الْغَفَّارُ", "Al-Ghaffar", "The Ever-Forgiving"], ["الْقَهَّارُ", "Al-Qahhar", "The Subduer"], ["الْوَهَّابُ", "Al-Wahhab", "The Bestower"],
  ["الرَّزَّاقُ", "Ar-Razzaq", "The Provider"], ["الْفَتَّاحُ", "Al-Fattah", "The Opener"], ["الْعَلِيمُ", "Al-Alim", "The All-Knowing"], ["الْقَابِضُ", "Al-Qabid", "The Withholder"],
  ["الْبَاسِطُ", "Al-Basit", "The Extender"], ["الْخَافِضُ", "Al-Khafid", "The Abaser"], ["الرَّافِعُ", "Ar-Rafi'", "The Exalter"], ["الْمُعِزُّ", "Al-Mu'izz", "The Giver of Honour"],
  ["الْمُذِلُّ", "Al-Mudhill", "The Humiliator"], ["السَّمِيعُ", "As-Sami'", "The All-Hearing"], ["الْبَصِيرُ", "Al-Basir", "The All-Seeing"], ["الْحَكَمُ", "Al-Hakam", "The Judge"],
  ["الْعَدْلُ", "Al-Adl", "The Just"], ["اللَّطِيفُ", "Al-Latif", "The Subtle, the Kind"], ["الْخَبِيرُ", "Al-Khabir", "The All-Aware"], ["الْحَلِيمُ", "Al-Halim", "The Forbearing"],
  ["الْعَظِيمُ", "Al-Azim", "The Magnificent"], ["الْغَفُورُ", "Al-Ghafur", "The All-Forgiving"], ["الشَّكُورُ", "Ash-Shakur", "The Appreciative"], ["الْعَلِيُّ", "Al-Ali", "The Most High"],
  ["الْكَبِيرُ", "Al-Kabir", "The Most Great"], ["الْحَفِيظُ", "Al-Hafiz", "The Preserver"], ["الْمُقِيتُ", "Al-Muqit", "The Sustainer"], ["الْحَسِيبُ", "Al-Hasib", "The Reckoner"],
  ["الْجَلِيلُ", "Al-Jalil", "The Majestic"], ["الْكَرِيمُ", "Al-Karim", "The Most Generous"], ["الرَّقِيبُ", "Ar-Raqib", "The Watchful"], ["الْمُجِيبُ", "Al-Mujib", "The Responsive"],
  ["الْوَاسِعُ", "Al-Wasi'", "The All-Encompassing"], ["الْحَكِيمُ", "Al-Hakim", "The All-Wise"], ["الْوَدُودُ", "Al-Wadud", "The Most Loving"], ["الْمَجِيدُ", "Al-Majid", "The Glorious"],
  ["الْبَاعِثُ", "Al-Ba'ith", "The Resurrector"], ["الشَّهِيدُ", "Ash-Shahid", "The Witness"], ["الْحَقُّ", "Al-Haqq", "The Truth"], ["الْوَكِيلُ", "Al-Wakil", "The Trustee"],
  ["الْقَوِيُّ", "Al-Qawiyy", "The All-Strong"], ["الْمَتِينُ", "Al-Matin", "The Firm"], ["الْوَلِيُّ", "Al-Waliyy", "The Protecting Friend"], ["الْحَمِيدُ", "Al-Hamid", "The Praiseworthy"],
  ["الْمُحْصِي", "Al-Muhsi", "The Counter"], ["الْمُبْدِئُ", "Al-Mubdi'", "The Originator"], ["الْمُعِيدُ", "Al-Mu'id", "The Restorer"], ["الْمُحْيِي", "Al-Muhyi", "The Giver of Life"],
  ["الْمُمِيتُ", "Al-Mumit", "The Bringer of Death"], ["الْحَيُّ", "Al-Hayy", "The Ever-Living"], ["الْقَيُّومُ", "Al-Qayyum", "The Self-Sustaining"], ["الْوَاجِدُ", "Al-Wajid", "The Finder"],
  ["الْمَاجِدُ", "Al-Majid", "The Noble"], ["الْوَاحِدُ", "Al-Wahid", "The One"], ["الْأَحَدُ", "Al-Ahad", "The Unique"], ["الصَّمَدُ", "As-Samad", "The Eternal Refuge"],
  ["الْقَادِرُ", "Al-Qadir", "The Able"], ["الْمُقْتَدِرُ", "Al-Muqtadir", "The All-Powerful"], ["الْمُقَدِّمُ", "Al-Muqaddim", "The Expediter"], ["الْمُؤَخِّرُ", "Al-Mu'akhkhir", "The Delayer"],
  ["الْأَوَّلُ", "Al-Awwal", "The First"], ["الْآخِرُ", "Al-Akhir", "The Last"], ["الظَّاهِرُ", "Az-Zahir", "The Manifest"], ["الْبَاطِنُ", "Al-Batin", "The Hidden"],
  ["الْوَالِي", "Al-Wali", "The Governor"], ["الْمُتَعَالِي", "Al-Muta'ali", "The Most Exalted"], ["الْبَرُّ", "Al-Barr", "The Source of Goodness"], ["التَّوَّابُ", "At-Tawwab", "The Accepter of Repentance"],
  ["الْمُنْتَقِمُ", "Al-Muntaqim", "The Avenger"], ["الْعَفُوُّ", "Al-Afuww", "The Pardoner"], ["الرَّءُوفُ", "Ar-Ra'uf", "The Most Kind"], ["مَالِكُ الْمُلْكِ", "Malik al-Mulk", "Owner of All Sovereignty"],
  ["ذُو الْجَلَالِ وَالْإِكْرَامِ", "Dhul-Jalali wal-Ikram", "Lord of Majesty and Generosity"], ["الْمُقْسِطُ", "Al-Muqsit", "The Equitable"], ["الْجَامِعُ", "Al-Jami'", "The Gatherer"],
  ["الْغَنِيُّ", "Al-Ghaniyy", "The Self-Sufficient"], ["الْمُغْنِي", "Al-Mughni", "The Enricher"], ["الْمَانِعُ", "Al-Mani'", "The Preventer"], ["الضَّارُّ", "Ad-Darr", "The Distresser"],
  ["النَّافِعُ", "An-Nafi'", "The Benefactor"], ["النُّورُ", "An-Nur", "The Light"], ["الْهَادِي", "Al-Hadi", "The Guide"], ["الْبَدِيعُ", "Al-Badi'", "The Incomparable Originator"],
  ["الْبَاقِي", "Al-Baqi", "The Everlasting"], ["الْوَارِثُ", "Al-Warith", "The Inheritor"], ["الرَّشِيدُ", "Ar-Rashid", "The Guide to the Right Path"], ["الصَّبُورُ", "As-Sabur", "The Patient"]];
function viewNames() {
  const seen = store.get("names", {});
  app.innerHTML = topbar(`<h1>${L("99 Names of Allah", "أسماء الله الحسنى")}</h1>`) + `<div class="wrap">
    <p class="lead">${L("Tap a name to mark that you have learned it.", "اضغط على الاسم لتعلّمه.")} · ${num(Object.keys(seen).length)} / ${num(NAMES.length)}</p>
    <div class="names">${NAMES.map((n, i) => `<button class="nm ${seen[i] ? "on" : ""}" onclick="noorName(${i})"><span class="i">${num(i + 1)}</span><span class="a">${n[0]}</span>
      <span class="e">${n[1]}</span><span class="m">${n[2]}</span></button>`).join("")}</div>
    <p class="lead" style="font-size:12.5px;margin-top:14px">${L("Order as narrated in Tirmidhi.", "بالترتيب الوارد عند الترمذي.")}</p></div>`;
  nav("more");
}
window.noorName = i => { const s = store.get("names", {}); if (s[i]) delete s[i]; else s[i] = 1; store.set("names", s); const y = scrollY; route().then(() => scrollTo(0, y)); };

/* ---------- duas from the Quran (the text comes from the Quran data) ---------- */
const DUAS = [[2, 201, 201], [2, 286, 286], [3, 8, 9], [3, 16, 16], [3, 147, 147], [3, 193, 194], [7, 23, 23], [10, 85, 86], [14, 40, 41], [17, 24, 24], [17, 80, 80],
  [18, 10, 10], [20, 25, 28], [20, 114, 114], [21, 83, 83], [21, 87, 87], [21, 89, 89], [23, 97, 98], [23, 118, 118], [25, 65, 66], [25, 74, 74], [26, 83, 85], [27, 19, 19],
  [28, 16, 16], [28, 24, 24], [46, 15, 15], [59, 10, 10], [66, 8, 8], [71, 28, 28], [2, 127, 128]];
async function viewDuas() {
  const idx = await index(), fav = store.get("duaFav", {});
  const cards = [];
  for (const [s, a, b] of DUAS) {
    const d = await surah(s), ay = d.ayahs.slice(a - 1, b), key = `${s}:${a}`;
    cards.push(`<div class="card dhikr"><div class="ar q">${ay.map(x => x.ar).join(" ")}</div>${S.en ? `<div style="color:var(--muted);margin-top:6px">${esc(ay.map(x => x.en).join(" "))}</div>` : ""}
      <div class="cnt" style="justify-content:space-between"><a class="src" href="#/s/${s}/${a}">${esc(sName(idx.surahs[s - 1]))} ${num(s)}:${num(a)}${b > a ? "–" + num(b) : ""}</a>
      <span><button class="ib" onclick="player.start(${s}, ${a})" aria-label="${t("listen")}">${ICON.play}</button><button class="ib" style="color:${fav[key] ? "var(--green)" : "var(--quiet)"}" onclick="noorDuaFav('${key}')">${fav[key] ? ICON.mark : ICON.markO}</button></span></div></div>`);
  }
  app.innerHTML = topbar(`<h1>${L("Duas from the Quran", "أدعية من القرآن")}</h1>`) + `<div class="wrap"><p class="lead" style="margin-bottom:12px">${L("Prayers the prophets and believers made in the Quran.", "أدعية الأنبياء والمؤمنين في القرآن الكريم.")}</p>${cards.join("")}</div>`;
  nav("more");
}
window.noorDuaFav = k => { const f = store.get("duaFav", {}); if (f[k]) delete f[k]; else f[k] = 1; store.set("duaFav", f); const y = scrollY; route().then(() => scrollTo(0, y)); };

/* ---------- notes and highlights (kept on this device) ---------- */
const COLORS = { green: "#2fa36b", yellow: "#e3b341", blue: "#3b82c4", pink: "#d65f8a" };
window.noorMarks = () => store.get("marks", {});                            // {"s:a": {c: colour, note, at}}
window.noorMarkSheet = async (s, a) => {
  const m = noorMarks()[`${s}:${a}`] || {};
  sheet(`<h3>${L("Note and highlight", "ملاحظة وتظليل")} · ${num(s)}:${num(a)}</h3>
    <div style="display:flex;gap:10px;margin-bottom:12px">${Object.entries(COLORS).map(([k, c]) => `<button onclick="noorPick('${k}')" id="c-${k}" style="width:42px;height:42px;border-radius:50%;background:${c};border:3px solid ${m.c === k ? "var(--ink)" : "transparent"}"></button>`).join("")}
      <button onclick="noorPick('')" class="btn ghost" style="padding:8px 14px">${L("None", "بدون")}</button></div>
    <textarea id="noteTx" rows="5" style="width:100%;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card2);font:inherit;color:var(--ink)" placeholder="${L("Your reflection on this ayah…", "تأملك في هذه الآية…")}">${esc(m.note || "")}</textarea>
    <button class="btn wide" style="margin-top:12px" onclick="noorSaveMark(${s}, ${a})">${L("Save", "حفظ")}</button>`);
  window.noorPick = k => { window._pick = k; Object.keys(COLORS).forEach(x => { const b = document.getElementById("c-" + x); if (b) b.style.borderColor = x === k ? "var(--ink)" : "transparent"; }); };
  window._pick = m.c || "";
};
window.noorSaveMark = (s, a) => {
  const all = noorMarks(), k = `${s}:${a}`, note = $("#noteTx").value.trim();
  if (!note && !window._pick) delete all[k]; else all[k] = { c: window._pick, note, at: Date.now() };
  store.set("marks", all); closeSheet(); toast(L("Saved", "تم الحفظ")); route();
};
async function viewNotes() {
  const idx = await index(), all = Object.entries(noorMarks()).sort((x, y) => y[1].at - x[1].at);
  const rows = [];
  for (const [k, m] of all) { const [s, a] = k.split(":").map(Number), ay = (await surah(s)).ayahs[a - 1];
    rows.push(`<a class="card dhikr" href="#/s/${s}/${a}" style="display:block;border-inline-start:6px solid ${COLORS[m.c] || "var(--line)"}"><div class="src" style="margin:0 0 6px">${esc(sName(idx.surahs[s - 1]))} ${num(s)}:${num(a)}</div>
      <div class="ar q" style="font-size:22px">${ay.ar}</div>${m.note ? `<div style="margin-top:8px;white-space:pre-wrap">${esc(m.note)}</div>` : ""}</a>`); }
  app.innerHTML = topbar(`<h1>${L("Notes & highlights", "الملاحظات والتظليل")}</h1>`) + `<div class="wrap">${rows.join("") || `<div class="empty">${L("Open any ayah's menu (…) and choose Note and highlight.", "افتح قائمة أي آية (…) واختر ملاحظة وتظليل.")}</div>`}</div>`;
  nav("more");
}

/* ---------- personal khatma plan, by mushaf pages (604) ---------- */
let PAGES = null;                                                            // page -> first [surah, ayah]
async function pages() {
  if (PAGES) return PAGES;
  const list = await (await fetch("/static/q/pages.json?v=1")).json(); PAGES = {};
  list.forEach((rows, i) => { PAGES[i + 1] = [rows[0][0], rows[0][1]]; });
  return PAGES;
}
async function viewKhatma() {
  const K = store.get("khatma", null);
  if (!K) {
    app.innerHTML = topbar(`<h1>${L("Khatma plan", "خطة الختمة")}</h1>`) + `<div class="wrap"><h2 class="big">${L("Finish the whole Quran", "اختم القرآن كاملًا")}</h2>
      <p class="lead">${L("Pick how many days. Noor splits the 604 pages and shows you each day's portion.", "اختر عدد الأيام، ونور يقسّم الصفحات الـ٦٠٤ ويعرض لك ورد كل يوم.")}</p>
      <div class="tiles" style="margin-top:16px">${[7, 10, 15, 30, 60, 90].map(d => `<button class="tile" onclick="noorKhatma(${d})"><b style="font-size:24px">${num(d)}</b>${L("days", "يومًا")}<span style="color:var(--muted);font-size:12px">${num(Math.ceil(604 / d))} ${L("pages a day", "صفحة يوميًا")}</span></button>`).join("")}</div></div>`;
    return nav("more");
  }
  const P = await pages(), per = Math.ceil(604 / K.days);
  const dayN = Math.min(K.days, Math.floor((Date.now() - K.start) / 864e5) + 1);
  const read = Object.keys(K.done).length;
  const from = (dayN - 1) * per + 1, to = Math.min(604, dayN * per);
  const [fs, fa] = P[from];
  const ahead = read - dayN;
  app.innerHTML = topbar(`<h1>${L("Khatma plan", "خطة الختمة")}</h1>`) + `<div class="wrap">
    <div class="rscore"><div class="ring" style="--p:${Math.round(read / K.days * 100)}"><div><b>${num(read)}</b><span>/ ${num(K.days)}</span></div></div>
      <div class="d">${L("Day", "اليوم")} ${num(dayN)} · ${ahead >= 0 ? L("on track ✓", "على المسار ✓") : `${num(-ahead)} ${L("days behind", "أيام متأخر")}`}</div></div>
    <div class="card cont" style="margin-top:12px"><div class="t"><div class="k">${L("Today's portion", "ورد اليوم")}</div><div class="n">${L("Pages", "الصفحات")} ${num(from)}–${num(to)}</div>
      <div class="s">${L("starts at", "يبدأ من")} ${num(fs)}:${num(fa)}</div></div><a class="btn" href="#/s/${fs}/${fa}">${t("read")}</a></div>
    <div class="sec">${L("Days", "الأيام")}</div><div class="card"><div class="grid30">${Array.from({ length: K.days }, (_, i) => `<button class="${K.done[i + 1] ? "on" : ""} ${i + 1 === dayN ? "today" : ""}" onclick="noorKDay(${i + 1})">${num(i + 1)}</button>`).join("")}</div></div>
    <div style="text-align:center;margin:18px 0"><button class="btn ghost" onclick="if(confirm('${L("Start a new plan?", "بدء خطة جديدة؟")}')){store.set('khatma', null); route()}">${L("New plan", "خطة جديدة")}</button></div></div>`;
  nav("more");
}
window.noorKhatma = d => { store.set("khatma", { days: d, start: new Date().setHours(0, 0, 0, 0), done: {} }); route(); };
window.noorKDay = d => { const K = store.get("khatma"); K.done[d] = !K.done[d]; if (!K.done[d]) delete K.done[d]; store.set("khatma", K); route(); };

/* ---------- Hijri calendar with the Islamic days ---------- */
const EVENTS = [[1, 1, "Islamic New Year", "رأس السنة الهجرية"], [1, 10, "Ashura", "عاشوراء"], [9, 1, "Ramadan begins", "بداية رمضان"], [9, 21, "Last ten nights", "العشر الأواخر"],
  [10, 1, "Eid al-Fitr", "عيد الفطر"], [12, 1, "First ten days of Dhul Hijjah", "العشر من ذي الحجة"], [12, 9, "Day of Arafah", "يوم عرفة"], [12, 10, "Eid al-Adha", "عيد الأضحى"]];
const hparts = d => { const h = noorHijri.hijri(d); return { d: h.d, m: h.m, y: h.y }; };
function viewCalendar() {
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const up = [];                                                              // the next year of Islamic days, found by walking day by day
  for (let i = 0; i < 400 && up.length < 10; i++) {
    const d = new Date(now.getTime() + i * 864e5), h = hparts(d);
    const e = EVENTS.find(([m, dd]) => m === h.m && dd === h.d); if (e) up.push([d, e, i]);
  }
  // this Hijri month as a grid
  const h0 = hparts(now); let start = new Date(now.getTime() - (h0.d - 1) * 864e5);
  const days = []; for (let i = 0; i < 31; i++) { const d = new Date(start.getTime() + i * 864e5), h = hparts(d); if (h.m !== h0.m) break; days.push([d, h]); }
  const cal = noorHijri.hijriCal(), month = new Intl.DateTimeFormat(isAr() ? `ar-SA-u-ca-${cal}` : `en-u-ca-${cal}`, { month: "long", year: "numeric" }).format(new Date(now.getTime() + (S.hadj || 0) * 864e5));
  const wk = isAr() ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const pad = days[0][0].getDay();
  app.innerHTML = topbar(`<h1>${L("Hijri calendar", "التقويم الهجري")}</h1>`) + `<div class="wrap">
    <div class="sec" style="margin-top:6px">${month}</div>
    <div class="card"><div class="cal">${wk.map(w => `<b>${w}</b>`).join("")}${"<span></span>".repeat(pad)}${days.map(([d, h]) => {
      const ev = EVENTS.find(([m, dd]) => m === h.m && dd === h.d), tod = h.d === h0.d;
      return `<span class="${tod ? "tod" : ""} ${ev ? "ev" : ""}"><i>${num(h.d)}</i><small>${num(d.getDate())}</small></span>`; }).join("")}</div></div>
    <div class="sec">${L("Coming up", "القادم")}</div>
    <div class="card listcard"><div class="list">${up.map(([d, e, i]) => `<div class="row"><div class="mid"><div class="t1">${isAr() ? e[3] : e[2]}</div>
      <div class="t2">${d.toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div></div>
      <span class="hstate ${i < 30 ? "done" : ""}">${i === 0 ? L("Today", "اليوم") : `${L("in", "بعد")} ${num(i)} ${L("days", "يومًا")}`}</span></div>`).join("")}</div></div>
    <div class="sec">${L("Calendar", "التقويم")}</div>
    <div class="card" style="padding:4px 14px">
      <div class="opt"><span class="l">${L("Based on", "حسب")}<div class="d">${S.loc ? (S.loc.name || L("your location", "موقعك")) : L("no location set", "لم يُحدَّد الموقع")} · ${noorHijri.HCAL_NAMES[cal][isAr() ? 1 : 0]}</div></span>
        <select class="sel" onchange="S.hcal=this.value; saveS(); route()">${[["auto", L("Automatic (by location)", "تلقائي (حسب الموقع)")], ["islamic-umalqura", noorHijri.HCAL_NAMES["islamic-umalqura"][isAr() ? 1 : 0]], ["islamic", noorHijri.HCAL_NAMES.islamic[isAr() ? 1 : 0]], ["islamic-civil", noorHijri.HCAL_NAMES["islamic-civil"][isAr() ? 1 : 0]]]
          .map(([v, l]) => `<option value="${v}" ${(S.hcal || "auto") === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${L("Adjust by days", "تعديل بالأيام")}<div class="d">${L("If your country announced the month a day earlier or later", "إذا أعلن بلدك بداية الشهر قبل أو بعد يوم")}</div></span>
        <div class="seg">${[-2, -1, 0, 1, 2].map(v => `<button class="${(S.hadj || 0) === v ? "on" : ""}" onclick="S.hadj=${v}; saveS(); route()">${v > 0 ? "+" : ""}${num(v)}</button>`).join("")}</div></div>
      ${S.loc ? "" : `<div class="opt"><span class="l">${L("Set your location for the right calendar", "حدد موقعك للتقويم الصحيح")}</span><button class="btn soft" onclick="noorLocate()">${ICON.pin}${L("Set", "حدد")}</button></div>`}</div></div>`;
  nav("more");
}

/* ---------- quiz: which surah is this ayah from? ---------- */
async function viewQuiz() {
  const idx = await index(), Q = store.get("quiz", { best: 0, played: 0 });
  const pool = store.get("quizPool", "juz30");
  const range = pool === "juz30" ? idx.surahs.filter(s => s.n >= 78) : pool === "short" ? idx.surahs.filter(s => s.count <= 50) : idx.surahs;
  let score = 0, round = 0, cur = null;
  const next = async () => {
    round++;
    const s = range[Math.floor(Math.random() * range.length)], d = await surah(s.n), a = d.ayahs[Math.floor(Math.random() * d.ayahs.length)];
    const opts = [s]; while (opts.length < 4) { const o = range[Math.floor(Math.random() * range.length)]; if (!opts.includes(o)) opts.push(o); }
    opts.sort(() => Math.random() - .5); cur = { s, a };
    app.innerHTML = topbar(`<h1>${L("Quiz", "مسابقة")}</h1>`) + `<div class="wrap">
      <div class="quick" style="margin-top:4px">${[["juz30", L("Juz Amma", "جزء عمّ")], ["short", L("Short surahs", "السور القصيرة")], ["all", L("Whole Quran", "القرآن كله")]].map(([k, l]) => `<button class="pill ${pool === k ? "on" : ""}" onclick="store.set('quizPool','${k}'); route()">${l}</button>`).join("")}</div>
      <div class="rstat"><div><b>${num(score)}</b><span>${L("correct", "صحيح")}</span></div><div><b>${num(round)}/10</b><span>${L("question", "سؤال")}</span></div><div><b>${num(Q.best)}</b><span>${L("best", "الأفضل")}</span></div></div>
      <p class="lead">${L("Which surah is this ayah from?", "من أي سورة هذه الآية؟")}</p>
      <div class="rtext" style="font-size:calc(var(--ar)*.9)">${a.ar}</div>
      <div style="display:grid;gap:8px;margin-top:14px">${opts.map(o => `<button class="rec" data-n="${o.n}"><span class="av">${num(o.n)}</span><span class="mid"><div class="t1">${esc(sName(o))}</div><div class="t2 q" style="font-size:18px">${o.name}</div></span></button>`).join("")}</div></div>`;
    nav("more");
    app.querySelectorAll("[data-n]").forEach(b => b.onclick = () => {
      const ok = +b.dataset.n === cur.s.n; if (ok) score++;
      app.querySelectorAll("[data-n]").forEach(x => { x.disabled = true; if (+x.dataset.n === cur.s.n) x.classList.add("on"); else if (x === b) x.style.borderColor = "var(--bad)"; });
      if (navigator.vibrate) navigator.vibrate(ok ? 30 : [40, 40, 40]);
      setTimeout(() => round >= 10 ? done() : next(), 1100);
    });
  };
  const done = () => {
    Q.played++; if (score > Q.best) Q.best = score; store.set("quiz", Q);
    app.innerHTML = topbar(`<h1>${L("Quiz", "مسابقة")}</h1>`) + `<div class="wrap"><div class="rscore"><div class="ring" style="--p:${score * 10}"><div><b>${num(score)}</b><span>/ ${num(10)}</span></div></div>
      <div class="g">${score >= 9 ? L("Excellent!", "ممتاز!") : score >= 6 ? L("Well done", "أحسنت") : L("Keep going", "واصل")}</div></div>
      <div class="rbtns"><button class="btn" onclick="route()">${L("Play again", "العب مرة أخرى")}</button></div></div>`;
  };
  next();
}

/* ---------- zakat calculator ---------- */
function viewZakat() {
  const Z = store.get("zakat", { gold: "", cash: "", goldOwned: "", silverOwned: "", invest: "", owed: "", debts: "", cur: "" });
  const f = (k, l) => `<div class="opt"><span class="l">${l}</span><input inputmode="decimal" value="${esc(Z[k])}" data-k="${k}" style="width:130px;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--card2);text-align:end"></div>`;
  app.innerHTML = topbar(`<h1>${L("Zakat calculator", "حاسبة الزكاة")}</h1>`) + `<div class="wrap">
    <p class="lead">${L("Zakat is 2.5% of wealth you have held for a lunar year, once it reaches the nisab (the value of 85 g of gold). Use one currency for everything.", "الزكاة ٢٫٥٪ من المال الذي حال عليه الحول إذا بلغ النصاب (قيمة ٨٥ غرامًا من الذهب). استخدم عملة واحدة لكل شيء.")}</p>
    <div class="card" style="margin-top:12px;padding:4px 14px">
      ${f("gold", L("Gold price per gram", "سعر غرام الذهب"))}${f("cash", L("Cash and bank savings", "النقد والمدخرات"))}${f("goldOwned", L("Value of gold and silver you own", "قيمة ما تملك من ذهب وفضة"))}
      ${f("invest", L("Investments and trade goods", "الاستثمارات وعروض التجارة"))}${f("owed", L("Money owed to you (expected back)", "ديون لك مرجوّة"))}${f("debts", L("Debts you must pay now", "ديون عليك حالّة"))}</div>
    <div class="card" style="margin-top:12px;text-align:center" id="zOut"></div>
    <p class="lead" style="font-size:12.5px;margin-top:10px">${L("A guide only. Ask a scholar about your own case.", "للاسترشاد فقط. اسأل أهل العلم عن حالتك.")}</p></div>`;
  nav("more");
  const calc = () => {
    const n = k => parseFloat(String(Z[k]).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/,/g, "")) || 0;
    const wealth = n("cash") + n("goldOwned") + n("invest") + n("owed") - n("debts"), nisab = n("gold") * 85;
    const fmt = v => v.toLocaleString(isAr() ? "ar-EG" : "en-GB", { maximumFractionDigits: 2 });
    $("#zOut").innerHTML = !n("gold") ? `<div class="lead">${L("Enter today's gold price to find the nisab.", "أدخل سعر الذهب اليوم لمعرفة النصاب.")}</div>`
      : `<div class="t2" style="color:var(--muted)">${L("Your zakatable wealth", "مالك الخاضع للزكاة")}: <b>${fmt(wealth)}</b> · ${L("Nisab", "النصاب")}: <b>${fmt(nisab)}</b></div>
        <div style="font-size:34px;font-weight:800;color:var(--green);margin-top:6px">${wealth >= nisab ? fmt(wealth * 0.025) : "0"}</div>
        <div class="lead">${wealth >= nisab ? L("Zakat due", "الزكاة الواجبة") : L("Below the nisab: no zakat due", "دون النصاب: لا زكاة")}</div>`;
  };
  app.querySelectorAll("input[data-k]").forEach(i => i.oninput = () => { Z[i.dataset.k] = i.value; store.set("zakat", Z); calc(); });
  calc();
}

/* ---------- share an ayah as a picture ---------- */
window.noorShareImage = async (s, a) => {
  const idx = await index(), ay = (await surah(s)).ayahs[a - 1];
  const font = getComputedStyle(document.documentElement).getPropertyValue("--qf").trim() || '"Scheherazade New"';
  await document.fonts.load(`48px ${font}`).catch(() => { });
  const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, "#0b5c3b"); grad.addColorStop(1, "#17975f"); g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 2;
  for (let x = 60; x < W; x += 120) for (let y = 60; y < H; y += 120) { g.strokeRect(x - 22, y - 22, 44, 44); g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.strokeRect(-22, -22, 44, 44); g.restore(); }
  g.fillStyle = "#fff"; g.textAlign = "center"; g.direction = "rtl";
  const wrap = (text, size, maxW, fam, lh) => { g.font = `${size}px ${fam}`; const words = text.split(" "), lines = []; let line = "";
    for (const w of words) { const tst = line ? line + " " + w : w; if (g.measureText(tst).width > maxW && line) { lines.push(line); line = w; } else line = tst; } if (line) lines.push(line); return lines.map(l => [l, lh]); };
  // shrink until the Arabic and the translation fit above the reference
  let size = 64, ens = 30, lines, en, total;
  for (;;) {
    lines = wrap(ay.ar, size, W - 160, font, size * 1.75);
    en = S.en ? wrap(ay.en, ens, W - 200, "Inter, sans-serif", ens * 1.45) : [];
    total = lines.length * lines[0][1] + (en.length ? 40 + en.length * en[0][1] : 0);
    if (total <= H - 330 || size <= 28) break;
    size -= 3; ens = Math.max(20, ens - 1);
  }
  let y = 120 + (H - 330 - total) / 2 + lines[0][1] * .7;
  g.font = `${size}px ${font}`; for (const [l, lh] of lines) { g.fillText(l, W / 2, y); y += lh; }
  if (en.length) { y += 20; g.direction = "ltr"; g.fillStyle = "rgba(255,255,255,.85)"; g.font = `${ens}px Inter, sans-serif`; for (const [l, lh] of en) { g.fillText(l, W / 2, y); y += lh; } }
  g.fillStyle = "rgba(255,255,255,.95)"; g.direction = "rtl"; g.font = `600 40px ${font}`; g.fillText(idx.surahs[s - 1].name, W / 2, H - 150);
  g.direction = "ltr"; g.font = "600 28px Inter, sans-serif"; g.fillStyle = "rgba(255,255,255,.8)"; g.fillText(`${idx.surahs[s - 1].en} ${s}:${a}  ·  Noor`, W / 2, H - 95);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  const file = new File([blob], `noor-${s}-${a}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch { return; } }
  const u = URL.createObjectURL(blob); sheet(`<h3>${L("Your picture", "صورتك")}</h3><img src="${u}" style="width:100%;border-radius:16px"><a class="btn wide" style="margin-top:12px" href="${u}" download="noor-${s}-${a}.png">${ICON.down}${L("Save picture", "حفظ الصورة")}</a>`);
};

VIEWS.push([/^\/names/, viewNames], [/^\/duas/, viewDuas], [/^\/notes/, viewNotes], [/^\/khatma/, viewKhatma], [/^\/calendar/, viewCalendar], [/^\/quiz/, viewQuiz], [/^\/zakat/, viewZakat]);
window.noorMore = { NAMES };
})();
