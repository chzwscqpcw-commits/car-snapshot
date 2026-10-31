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

// Saved-car alerts (MOT due, tax due, a new recall, the monthly value check)
// arrive here as push messages: { title, body, url, tag, stop }. The plate is
// in the url's fragment, which never leaves the device. "Stop alerts" calls
// the same link the emails carry.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const options = {
    body: data.body || "",
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/", stop: data.stop || null },
    actions: data.stop ? [{ action: "open", title: "Open" }, { action: "stop", title: "Stop alerts" }] : [],
  };
  event.waitUntil(self.registration.showNotification(data.title || "Free Plate Check", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, stop } = event.notification.data || {};
  if (event.action === "stop" && stop) {
    event.waitUntil(fetch(stop, { credentials: "omit" }).catch(() => {}));
    return;
  }
  const target = new URL(url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => "focus" in c);
      if (open && "navigate" in open) return open.navigate(target).then((c) => c && c.focus());
      return self.clients.openWindow(target);
    }),
  );
});
