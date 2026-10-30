// Free Plate Check service worker. Deliberately minimal: it makes the site
// installable and shows an offline page when a page can't load. It caches
// nothing a user searched for: no API responses, no result pages, no plates
// (plates live in #vrm= and never reach the network anyway). Everything else
// goes straight to the network as if there were no service worker.
const CACHE = "fpc-shell-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Only page navigations, and only to answer a failed one with the offline page.
  if (event.request.mode !== "navigate") return;
  // Partner hand-offs (/go/*, a server redirect that reads the plate cookie)
  // and API routes stay untouched by the worker.
  const path = new URL(event.request.url).pathname;
  if (path.startsWith("/go/") || path.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())),
  );
});
