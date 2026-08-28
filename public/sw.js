const CACHE = "caption-placement-check-v3";
const SHELL = ["/", "/check/", "/demo/", "/privacy/", "/terms/", "/assets/hero-projection-room.webp", "/demo/sample.webm", "/demo/sample.srt"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const sameOrigin = new URL(event.request.url).origin === location.origin;
  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response.ok && sameOrigin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    });
  }).catch(() => event.request.mode === "navigate" ? caches.match("/") : Response.error()));
});
