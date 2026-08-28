const CACHE = "caption-placement-check-v4";
const SHELL = ["/", "/check/", "/demo/", "/privacy/", "/terms/", "/assets/hero-projection-room.webp", "/demo/sample.webm", "/demo/sample.srt"];
async function cacheAppShell(cache, route) {
  const response = await fetch(route, { cache: "reload" });
  if (!response.ok) throw new Error(`Could not precache ${route}`);
  const html = await response.clone().text();
  await cache.put(route, response);
  const assets = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)]
    .map((match) => new URL(match[1], new URL(route, self.location.origin)).pathname)
    .filter((path) => path.includes("/assets/"));
  await cache.addAll(assets);
}
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then(async (cache) => {
  await cache.addAll(SHELL);
  await Promise.all([cacheAppShell(cache, "/check/"), cacheAppShell(cache, "/demo/")]);
}).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const sameOrigin = new URL(event.request.url).origin === location.origin;
  // A page can still be controlled by the previous worker during activation.
  // Search all versioned shell caches so that update hand-offs never drop a
  // hashed CSS/JS request between two reloads.
  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response.ok && sameOrigin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    });
  }).catch(() => event.request.mode === "navigate" ? caches.match("/") : Response.error()));
});
