const CACHE = "caption-placement-check-v7";
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
  const route = new URL(event.request.url).pathname;
  // Always serve the exact cached route for a navigation. A generic cache
  // lookup can select the checker shell while an install is still settling,
  // which silently drops demo mode on an offline reload.
  if (event.request.mode === "navigate") {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const shell = await cache.match(route);
      if (shell) {
        // Keep demo mode explicit even when the same app document is served
        // from a cache while the browser has an unusual navigation base URL.
        if (route === "/demo/") {
          const body = (await shell.text()).replace("<html", '<html data-demo-shell="true"');
          return new Response(body, { status: shell.status, statusText: shell.statusText, headers: shell.headers });
        }
        return shell;
      }
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(route, response.clone());
        return response;
      } catch { return await cache.match("/") || Response.error(); }
    }));
    return;
  }
  // A page can still be controlled by the previous worker during activation.
  // Search all versioned shell caches so that update hand-offs never drop a
  // hashed CSS/JS request between two reloads.
  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response.ok && sameOrigin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    });
  }).catch(async () => {
    if (event.request.mode !== "navigate") return Response.error();
    // Navigation requests can carry browser-added headers that prevent a
    // direct Request match. Match the precached pathname before falling back
    // to the landing shell so an offline /demo/ reload stays in demo mode.
    return await caches.match(route) || await caches.match("/");
  }));
});
