/* Sheikh Aws: an AI helper for Islamic questions, rules and duas. Quran references in answers ([2:255]) become links that
   show the exact text from the app's own Quran, so no verse is ever quoted from the AI's memory. Needs the internet. */
"use strict";
(() => {
const SUGGEST = [["How do I pray Witr?", "كيف أصلي الوتر؟"], ["A dua for anxiety and worry", "دعاء للهم والقلق"], ["What breaks the fast?", "ما هي مفطرات الصيام؟"],
  ["How do I make ghusl?", "كيف أغتسل الغسل الواجب؟"], ["Duas before sleeping", "أذكار النوم"], ["How do I pray when travelling?", "كيف أصلي في السفر؟"],
  ["What is the meaning of Ayat al-Kursi?", "ما معنى آية الكرسي؟"], ["How do I calculate zakat on savings?", "كيف أحسب زكاة المدخرات؟"]];
let busy = false;
const chat = () => store.get("sheikh", []);
function md(text) {
  // a small, safe markdown: escape everything, then bold, lists and Quran references
  const lines = esc(text).split(/\n/);
  let out = "", list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (let l of lines) {
    l = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\]/g, (m, s, a, b) => +s >= 1 && +s <= 114 ? `<button class="qref" data-s="${s}" data-a="${a}" data-b="${b || a}">${num(s)}:${num(a)}${b ? "–" + num(b) : ""}</button>` : m);
    if (/^\s*[-•*]\s+/.test(l)) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${l.replace(/^\s*[-•*]\s+/, "")}</li>`; }
    else if (/^\s*\d+[.)]\s+/.test(l)) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${l.replace(/^\s*\d+[.)]\s+/, "")}</li>`; }
    else if (/^\s*#{1,4}\s+/.test(l)) { close(); out += `<p><b>${l.replace(/^\s*#{1,4}\s+/, "")}</b></p>`; }
    else if (l.trim()) { close(); out += `<p>${l}</p>`; }
    else close();
  }
  close(); return out;
}
function bubble(m) {
  return m.role === "user" ? `<div class="msg me"><div>${esc(m.content)}</div></div>`
    : `<div class="msg ai"><span class="sav">ش</span><div class="body">${md(m.content)}</div></div>`;
}
function viewSheikh() {
  const msgs = chat();
  app.innerHTML = topbar(`<h1>${L("Sheikh Aws", "الشيخ أوس")}</h1>`, false, msgs.length ? `<button class="ib" onclick="noorSheikhClear()" aria-label="New chat">${ICON.trash}</button>` : "") + `<div class="wrap">
    <div id="chat">${msgs.length ? msgs.map(bubble).join("") : `<div class="sintro"><div class="sbig">ش</div><h2 class="big">${L("Assalamu alaykum", "السلام عليكم")}</h2>
      <p class="lead">${L("I'm Sheikh Aws, an AI helper. Ask me about prayer, fasting, duas, the Quran and everyday Islamic rules. For serious personal rulings, please ask a qualified scholar too.",
        "أنا الشيخ أوس، مساعد بالذكاء الاصطناعي. اسألني عن الصلاة والصيام والأدعية والقرآن والأحكام اليومية. وفي المسائل الشخصية المهمة، اسأل عالمًا مؤهلًا أيضًا.")}</p>
      <div class="ssug">${SUGGEST.map(([en, ar]) => `<button class="pill" onclick="noorAsk(this.textContent)">${isAr() ? ar : en}</button>`).join("")}</div></div>`}</div>
    <form class="askbar" onsubmit="event.preventDefault(); noorAsk(this.q.value); this.q.value=''"><textarea name="q" rows="1" placeholder="${L("Ask Sheikh Aws…", "اسأل الشيخ أوس…")}"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault(); this.form.requestSubmit()}" oninput="this.style.height='auto'; this.style.height=Math.min(140,this.scrollHeight)+'px'"></textarea>
      <button class="btn" aria-label="Send">${L("Ask", "اسأل")}</button></form>
    <p class="sdisc">${L("AI answers can be wrong. Check important matters with a scholar.", "قد يخطئ الذكاء الاصطناعي. تحقّق من المسائل المهمة مع أهل العلم.")}</p></div>`;
  nav("sheikh");
  $("#chat").onclick = refClick;
  const draft = store.get("sheikhDraft", ""); if (draft) { store.set("sheikhDraft", ""); setTimeout(() => noorAsk(draft), 200); }
  setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 30);
}
async function refClick(e) {
  const b = e.target.closest(".qref"); if (!b) return;
  const s = +b.dataset.s, a = +b.dataset.a, z = +b.dataset.b, next = b.nextElementSibling;
  if (next && next.classList.contains("qbox")) return next.remove();
  const d = await surah(s), idx = await index(), ay = d.ayahs.slice(a - 1, Math.min(z, d.count));
  if (!ay.length) return;
  b.insertAdjacentHTML("afterend", `<span class="qbox"><span class="ar q">${ay.map(x => `${x.ar} <span class="mark">﴿${arNum(x.n)}﴾</span>`).join(" ")}</span>
    ${S.en ? `<span class="en">${esc(ay.map(x => x.en).join(" "))}</span>` : ""}<a href="#/s/${s}/${a}">${esc(sName(idx.surahs[s - 1]))} ${num(s)}:${num(a)} →</a></span>`);
}
window.noorSheikhClear = () => { if (confirm(L("Start a new chat?", "بدء محادثة جديدة؟"))) { store.set("sheikh", []); route(); } };
window.noorAsk = async text => {
  text = (text || "").trim(); if (!text || busy) return;
  if (!navigator.onLine) return toast(L("Sheikh Aws needs the internet", "الشيخ أوس يحتاج إلى إنترنت"));
  const msgs = chat(); msgs.push({ role: "user", content: text }); store.set("sheikh", msgs);
  if (!$("#chat .msg")) $("#chat").innerHTML = "";
  $("#chat").insertAdjacentHTML("beforeend", bubble(msgs.at(-1)) + `<div class="msg ai" id="live"><span class="sav">ش</span><div class="body"><span class="typing"><i></i><i></i><i></i></span></div></div>`);
  window.scrollTo(0, document.body.scrollHeight);
  busy = true; let answer = "";
  try {
    const r = await fetch(`${(window.NOOR && NOOR.api) || ""}/api/sheikh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs.slice(-12) }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); answer = r.status === 503 ? L("Sheikh Aws isn't switched on yet. The app owner needs to add the AI key.", "الشيخ أوس غير مفعّل بعد. يحتاج صاحب التطبيق إلى إضافة مفتاح الذكاء الاصطناعي.") : (j.error || L("Something went wrong. Try again.", "حدث خطأ. حاول مرة أخرى.")); }
    else {
      const rd = r.body.getReader(), dec = new TextDecoder();
      for (;;) { const { value, done } = await rd.read(); if (done) break; answer += dec.decode(value, { stream: true });
        const live = $("#live .body"); if (live) { live.innerHTML = md(answer); } window.scrollTo(0, document.body.scrollHeight); }
    }
  } catch { answer = answer || L("I couldn't connect. Check the internet and try again.", "تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى."); }
  busy = false;
  const all = chat(); all.push({ role: "assistant", content: answer }); store.set("sheikh", all.slice(-40));
  const live = $("#live"); if (live) { live.removeAttribute("id"); live.querySelector(".body").innerHTML = md(answer); }
};
VIEWS.push([/^\/sheikh/, viewSheikh]);
})();
