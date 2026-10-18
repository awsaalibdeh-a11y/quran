/* Noor account = your Mellow (Homebase) account. Linking shares a short summary of your reading with your family,
   brings in reading and memorizing tasks from your parents, and keeps a copy of your progress for a new phone. */
"use strict";
(() => {
const HB = (window.NOOR && NOOR.hb) || "https://homebase-family.onrender.com";
const acct = () => store.get("hb", null);                                   // {token, me, family}
async function hb(path, method = "GET", body) {
  const a = acct(); if (!a) throw new Error("not linked");
  const r = await fetch(HB + path, { method, headers: { Authorization: "Bearer " + a.token, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { store.set("hb", null); throw new Error(L("Your Mellow link ended. Link again.", "انتهى ربط ميلو. اربط مرة أخرى.")); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || L("Something went wrong", "حدث خطأ"));
  return j;
}
const SURAH_COUNT = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

/* ---------- what we share ---------- */
function stats() {
  const days = store.get("days", {}), k = store.get("khatma", null), H = store.get("hifz", {}), log = store.get("reciteLog", []);
  const week = Array.from({ length: 7 }, (_, i) => days[dayKey(new Date(Date.now() - (6 - i) * 864e5))] || 0);
  const memo = Object.entries(H).filter(([, v]) => v === "done").map(([s]) => +s);
  const lastR = store.get("last", null);
  return { streak: streakNow(), best: Math.max(store.get("bestStreak", 0), streakNow()), today: todayCount(), day: today(), week, goal: S.goal || 10,
    last: lastR ? { s: lastR.s, a: lastR.a, at: lastR.at } : null, khatma: k ? { days: k.days, done: Object.keys(k.done || {}).length } : null,
    hifz: { surahs: memo.length, ayahs: memo.reduce((a, s) => a + SURAH_COUNT[s - 1], 0) }, recite: log.length ? { score: log.at(-1).score, s: log.at(-1).s } : null };
}
const KEEP = ["bookmarks", "marks", "hifz", "khatma", "reciteBest", "reciteLog", "days", "bestStreak", "progress", "last", "names", "duaFav", "tasbih", "ramadan", "gameBest"];
const backup = () => Object.fromEntries(KEEP.map(k => [k, store.get(k, null)]).filter(([, v]) => v != null));
let syncT = null, lastSync = 0;
async function sync(now) {
  if (!acct() || !navigator.onLine) return;
  clearTimeout(syncT);
  if (!now && Date.now() - lastSync < 25000) { syncT = setTimeout(() => sync(true), 25000); return; }
  lastSync = Date.now();
  try { await hb("/api/noor-app/sync", "POST", { stats: stats(), data: backup() }); } catch { }
}
window.addEventListener("hashchange", () => sync());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sync(true); });

/* ---------- tasks ---------- */
let FAM = null;
async function family() { try { FAM = await hb("/api/noor-app/family"); store.set("hbFam", FAM); } catch { FAM = store.get("hbFam", null); } return FAM; }
const KIND = { read: ["Read", "اقرأ"], memorize: ["Memorize", "احفظ"], revise: ["Revise", "راجع"] };
const kindWord = k => (KIND[k] || KIND.read)[isAr() ? 1 : 0];
function taskRow(k, idx, mine) {
  const s = idx.surahs[k.surah - 1];
  return `<div class="card dhikr"><div style="display:flex;align-items:center;gap:10px"><span class="hstate ${k.done ? "done" : k.kind === "memorize" ? "learning" : ""}">${kindWord(k.kind)}</span>
      <b style="flex:1">${esc(sName(s))} ${num(k.from)}–${num(k.upto)}</b>${k.done ? `<span style="color:var(--green)">${ICON.check}</span>` : ""}</div>
    <div class="src" style="margin-top:6px">${esc([mine ? L("from ", "من ") + k.by : L("for ", "إلى ") + k.to_name, k.note, k.due ? L("by ", "قبل ") + k.due : "", k.done && k.score >= 0 ? k.score + "%" : ""].filter(Boolean).join(" · "))}</div>
    ${!k.done && mine ? `<div class="cnt"><a class="btn soft" href="#/s/${k.surah}/${k.from}">${ICON.book}${t("read")}</a><a class="btn soft" href="#/recite/${k.surah}/${k.from}?task=${k.id}">${ICON.mic}${L("Recite", "سمّع")}</a>
      <button class="btn" onclick="noorTaskDone(${k.id})">${ICON.check}${L("Done", "تم")}</button></div>` : ""}
    ${!k.done && !mine && FAM && FAM.role === "parent" ? `<div class="cnt"><button class="btn ghost" onclick="noorTaskDel(${k.id})">${ICON.trash}${L("Remove", "حذف")}</button></div>` : ""}</div>`;
}
window.noorTaskDone = async (id, score) => {
  try { await hb(`/api/noor-app/tasks/${id}/done`, "POST", score != null ? { score } : {}); toast(L("Done! Your family can see it.", "أحسنت! عائلتك ترى ذلك.")); sync(true); } catch (e) { toast(e.message); }
  route();
};
window.noorTaskDel = async id => { if (!confirm(L("Remove this task?", "حذف هذه المهمة؟"))) return; try { await hb(`/api/noor-app/tasks/${id}`, "DELETE"); } catch (e) { toast(e.message); } route(); };

/* ---------- the account page ---------- */
async function viewAccount(m) {
  const code = (location.hash.match(/[?&]c=([\w-]+)/) || [])[1];
  if (code) {
    history.replaceState(null, "", "#/account");                              // the code is used once; keep it out of the address bar
    app.innerHTML = topbar(`<h1>${L("Account", "الحساب")}</h1>`) + `<div class="wrap"><div class="empty">${L("Linking…", "جارٍ الربط…")}</div></div>`;
    try {
      const r = await fetch(HB + "/api/noor-app/exchange", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "");
      store.set("hb", { token: j.token, me: j.me, family: j.family });
      toast(L("Linked with Mellow ✓", "تم الربط مع ميلو ✓"));
      try { const d = await hb("/api/noor-app/data"); if (d.data && !store.get("last", null) && confirm(L("Bring back your saved progress from your account?", "هل تريد استعادة تقدمك المحفوظ في حسابك؟"))) { for (const [k, v] of Object.entries(d.data)) store.set(k, v); } } catch { }
      sync(true);
    } catch (e) { toast(e.message || L("Could not link. Try again from Mellow.", "تعذّر الربط. حاول مرة أخرى من ميلو.")); }
  }
  const a = acct();
  if (!a) {
    app.innerHTML = topbar(`<h1>${L("Account", "الحساب")}</h1>`) + `<div class="wrap" style="text-align:center">
      <div class="sbig" style="margin-top:20px">👪</div><h2 class="big">${L("Read together as a family", "اقرؤوا معًا كعائلة")}</h2>
      <p class="lead">${L("Use your Mellow account in Noor. Your family sees your streak and what you read, parents can give reading and memorizing tasks, and your progress is saved for a new phone.",
        "استخدم حسابك في ميلو داخل نور. ترى عائلتك سلسلة أيامك وما تقرؤه، ويمكن للوالدين إعطاء مهام قراءة وحفظ، ويُحفظ تقدمك لهاتف جديد.")}</p>
      <a class="btn wide" style="margin-top:18px" href="${HB}/app#noorlink" target="_blank" rel="noopener">${L("Link with Mellow", "اربط مع ميلو")}</a>
      <p class="lead" style="font-size:13px;margin-top:12px">${L("Mellow opens. Sign in there if you need to, and it sends you straight back here, linked.", "سيفتح ميلو. سجّل الدخول إن لزم، وسيعيدك إلى هنا مربوطًا.")}<br>
        ${L("In the Mellow app: More → Family → Quran (Noor) → Link Noor.", "في تطبيق ميلو: المزيد ← العائلة ← القرآن (نور) ← اربط نور.")}</p>
      <p class="lead" style="font-size:13px">${L("No Mellow account?", "ليس لديك حساب ميلو؟")} <a style="color:var(--green);font-weight:700" href="${HB}/" target="_blank" rel="noopener">${L("Get Mellow", "احصل على ميلو")}</a> · ${L("Noor works fine without it.", "نور يعمل جيدًا بدونه.")}</p></div>`;
    return nav("more");
  }
  app.innerHTML = topbar(`<h1>${L("Account", "الحساب")}</h1>`) + `<div class="wrap" id="accw"><div class="empty">…</div></div>`;
  nav("more");
  const f = await family(), idx = await index();
  if (!f) { $("#accw").innerHTML = `<div class="empty">${L("Connect to the internet to see your family.", "اتصل بالإنترنت لرؤية عائلتك.")}</div>`; return; }
  const me = f.my || a.me, isPar = f.role === "parent";
  const mine = f.tasks.filter(t => t.to_id === me.id), given = f.tasks.filter(t => t.to_id !== me.id);
  const person = p => { const s = p.stats || {}, l = s.last && s.last.s ? `${sName(idx.surahs[s.last.s - 1])} ${num(s.last.s)}:${num(s.last.a)}` : "";
    return `<div class="row"><div class="num" style="transform:none;border-radius:50%"><span style="transform:none;font-size:20px">${esc(p.emoji || "🙂")}</span></div><div class="mid"><div class="t1">${esc(p.name)}${p.id === me.id ? L(" (you)", " (أنت)") : ""}</div>
      <div class="t2">${p.linked ? `🔥 ${num(s.streak || 0)} · ${num(s.today || 0)} ${t("ayahs")} ${L("today", "اليوم")}${s.hifz && s.hifz.surahs ? ` · ${num(s.hifz.surahs)} ${L("surahs memorized", "سورة محفوظة")}` : ""}${l ? `<br>${L("Last read", "آخر قراءة")}: ${esc(l)}` : ""}` : L("Not using Noor yet", "لا يستخدم نور بعد")}</div></div></div>`; };
  $("#accw").outerHTML = `<div class="wrap">
    <div class="hero" style="margin-top:6px"><div class="d1">${L("Linked with Mellow", "مربوط مع ميلو")}</div><div class="n" style="font-size:24px;font-weight:800;margin-top:4px">${esc(me.emoji || "")} ${esc(me.name)}</div>
      <div class="row2"><span class="chipw">👪 ${esc(f.family || a.family || "")}</span><span class="chipw">${isPar ? L("Parent", "والد/ة") : L("Family member", "فرد من العائلة")}</span></div></div>
    <div class="sec">${L("My tasks", "مهامي")}</div>${mine.filter(x => !x.done).map(x => taskRow(x, idx, true)).join("") || `<div class="card" style="color:var(--muted)">${L("No tasks right now.", "لا توجد مهام الآن.")}</div>`}
    ${isPar ? `<div class="sec">${L("Give a task", "أعطِ مهمة")}</div><div class="card" style="padding:4px 14px">
      <div class="opt"><span class="l">${L("For", "إلى")}</span><select class="sel" id="tTo">${f.members.filter(p => p.id !== me.id).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${L("Task", "المهمة")}</span><div class="seg" id="tKind">${["read", "memorize", "revise"].map((k, i) => `<button class="${i ? "" : "on"}" data-k="${k}">${kindWord(k)}</button>`).join("")}</div></div>
      <div class="opt"><span class="l">${L("Surah", "السورة")}</span><select class="sel" id="tS">${idx.surahs.map(s => `<option value="${s.n}" ${s.n === 67 ? "selected" : ""}>${num(s.n)}. ${esc(sName(s))}</option>`).join("")}</select></div>
      <div class="opt"><span class="l">${L("Ayahs", "الآيات")}</span><span><input id="tA" inputmode="numeric" value="1" style="width:64px" class="sel"> – <input id="tB" inputmode="numeric" value="30" style="width:64px" class="sel"></span></div>
      <div class="opt"><span class="l">${L("Note", "ملاحظة")}</span><input id="tNote" maxlength="200" class="sel" style="max-width:none;flex:1" placeholder="${L("Optional", "اختياري")}"></div>
      <button class="btn wide" style="margin:10px 0" onclick="noorGive()">${L("Send the task", "أرسل المهمة")}</button></div>` : ""}
    ${given.length ? `<div class="sec">${L("Family tasks", "مهام العائلة")}</div>${given.slice(0, 20).map(x => taskRow(x, idx, false)).join("")}` : ""}
    ${mine.some(x => x.done) ? `<div class="sec">${L("Finished", "المنجزة")}</div>${mine.filter(x => x.done).slice(0, 8).map(x => taskRow(x, idx, true)).join("")}` : ""}
    <div class="sec">${L("Who read what", "من قرأ ماذا")}</div><div class="card listcard"><div class="list">${f.members.map(person).join("")}</div></div>
    <div style="text-align:center;margin:20px 0"><button class="btn ghost" onclick="noorUnlink()">${L("Unlink Mellow", "إلغاء الربط مع ميلو")}</button></div></div>`;
  const sel = $("#tS"); if (sel) { const fix = () => { $("#tB").value = SURAH_COUNT[+sel.value - 1]; $("#tA").value = 1; }; sel.onchange = fix; fix(); }
  const tk = $("#tKind"); if (tk) tk.onclick = e => { const b = e.target.closest("button"); if (!b) return; tk.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
}
window.noorGive = async () => {
  const kind = $("#tKind .on").dataset.k;
  try { await hb("/api/noor-app/tasks", "POST", { to: +$("#tTo").value, kind, surah: +$("#tS").value, from: +$("#tA").value || 1, to_ayah: +$("#tB").value || 999, note: $("#tNote").value });
    toast(L("Task sent ✓", "تم إرسال المهمة ✓")); } catch (e) { toast(e.message); }
  route();
};
window.noorUnlink = async () => { if (!confirm(L("Unlink your Mellow account from Noor?", "إلغاء ربط حساب ميلو من نور؟"))) return; try { await hb("/api/noor-app/link", "DELETE"); } catch { } store.set("hb", null); route(); };

/* ---------- on the home page: open tasks, and after a recitation: send the score ---------- */
window.noorHomeTasks = async () => {
  const box = $("#homeTasks"); if (!box || !acct()) return;
  const f = await family(); if (!f || !document.body.contains(box)) return;
  const idx = await index(), me = (f.my || acct().me).id, open = f.tasks.filter(x => x.to_id === me && !x.done);
  if (open.length) box.innerHTML = `<div class="sec">${L("Tasks from your family", "مهام من عائلتك")}<a href="#/account">${L("All", "الكل")}</a></div>${open.slice(0, 3).map(x => taskRow(x, idx, true)).join("")}`;
};
window.noorReciteDone = async (s, from, to, score) => {
  if (!acct()) return;
  const f = await family(); if (!f) return;
  const me = (f.my || acct().me).id;
  const want = (location.hash.match(/task=(\d+)/) || [])[1];
  const tk = f.tasks.find(x => !x.done && x.to_id === me && x.surah === s && (want ? x.id === +want : from <= x.upto && to >= x.from));
  const box = $(".rscore"); if (!tk || !box) return;
  box.insertAdjacentHTML("beforeend", `<div class="card" style="margin-top:14px"><b>${L("This was a task from", "هذه مهمة من")} ${esc(tk.by)}</b>
    <div class="lead">${kindWord(tk.kind)} ${num(tk.from)}–${num(tk.upto)}</div><button class="btn wide" style="margin-top:10px" onclick="noorTaskDone(${tk.id}, ${score})">${ICON.check}${L("Mark done and send my score", "سجّلها منجزة وأرسل نتيجتي")} (${num(score)}%)</button></div>`);
};
VIEWS.push([/^\/account/, viewAccount]);
window.noorAccount = { stats, backup, acct, sync };
if (acct()) setTimeout(() => sync(true), 3000);
})();
