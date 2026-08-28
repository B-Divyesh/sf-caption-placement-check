const CACHE = "caption-placement-check-v9";
const SHELL = ["/", "/privacy/", "/terms/", "/404.html", "/icon.svg", "/apple-touch-icon.png", "/assets/hero-projection-room.webp", "/demo/sample.webm", "/demo/sample.srt"];

// Cache Storage exposes a decoded body for compressed development and hosting
// responses. Keeping Content-Encoding on that decoded body makes Chromium try
// to decompress the JavaScript again during an offline reload. Copy only
// representation-safe headers before placing a network response in the cache.
async function cacheSafeResponse(response) {
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function cacheNetworkResponse(cache, request) {
  const response = await fetch(request, { cache: "reload" });
  if (!response.ok) throw new Error(`Could not precache ${request}`);
  await cache.put(request, await cacheSafeResponse(response.clone()));
  return response;
}

async function cacheAppShell(cache, route) {
  const response = await cacheNetworkResponse(cache, route);
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)]
    .map((match) => new URL(match[1], new URL(route, self.location.origin)).pathname)
    .filter((path) => path.includes("/assets/"));
  await Promise.all(assets.map((asset) => cacheNetworkResponse(cache, asset)));
}

self.addEventListener("install", (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await Promise.all(SHELL.map((asset) => cacheNetworkResponse(cache, asset)));
  await Promise.all([cacheAppShell(cache, "/check/"), cacheAppShell(cache, "/demo/")]);
  await self.skipWaiting();
})()));

self.addEventListener("activate", (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  const route = url.pathname;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request) || await cache.match(route);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, await cacheSafeResponse(response.clone()));
      return response;
    } catch {
      if (event.request.mode === "navigate") return await cache.match(route) || await cache.match("/") || Response.error();
      return Response.error();
    }
  })());
});
