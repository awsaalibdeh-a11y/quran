// Noor offline: the app shell is cached on install; the Quran files are kept once read (or all at once from Settings).
const SHELL = "noor-shell-v11", DATA = "noor-data-v1";
const FILES = ["/", "/static/app.css?v=2.7.1", "/static/app.js?v=2.7.1", "/static/extras.js?v=2.7.1", "/static/recite.js?v=2.7.1", "/static/more.js?v=2.7.1", "/static/game.js?v=2.7.1", "/static/sheikh.js?v=2.7.1", "/static/account.js?v=2.7.1", "/static/plus.js?v=2.7.1", "/static/life.js?v=2.7.1", "/static/icon-192.png", "/static/icon-512.png", "/manifest.webmanifest", "/static/q/index.json?v=1", "/static/q/pages.json?v=1", "/static/adhan/adhan.mp3"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== DATA && !k.startsWith("noor-font") && !k.startsWith("noor-audio") && !k.startsWith("noor-extra")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname.includes("islamic.network")) return;                                  // recitations stream; not cached
  if (u.hostname.includes("fonts.g")) {                                                // fonts: cache first, so Arabic looks right offline
    e.respondWith(caches.open("noor-font-v1").then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.startsWith("/audio/")) return;
  if (u.pathname.startsWith("/static/q/")) {                                           // Quran text never changes: cache first
    e.respondWith(caches.open(DATA).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { if (r.ok) caches.open(SHELL).then(c => c.put(e.request, r.clone())); return r; })     // network first for the app itself
    .catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
});
