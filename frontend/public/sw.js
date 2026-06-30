const STATIC_CACHE = "friday-static-v2";
const SHELL_CACHE = "friday-shell-v2";

const SHELL_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(SHELL_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== SHELL_CACHE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const isApi =
    url.port === "8000" ||
    url.port === "11434" ||
    url.hostname === "localhost" ||
    url.pathname.startsWith("/api/");

  if (isApi) return;

  const isNextStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?)$/) ||
    (url.pathname.startsWith("/_next/") && !url.pathname.includes("/data/"));

  const isStatic =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "manifest" ||
    request.destination === "document" ||
    url.pathname.match(/\.(js|css|woff2?|svg|png|jpg|ico|json|webp)$/);

  if (isNextStatic) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const net = await fetch(request);
          if (net.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, net.clone());
          }
          return net;
        } catch {
          return new Response("", { status: 200 });
        }
      })()
    );
    return;
  }

  if (isStatic || url.pathname === "/") {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(request);
          if (net.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, net.clone());
          }
          return net;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>FRIDAY AI - Offline</title><style>body{background:#030712;color:#f4f4f5;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;max-width:400px;padding:2rem}.orb{width:48px;height:48px;margin:0 auto 1rem;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#6366f1);box-shadow:0 0 20px rgba(6,182,212,.4);animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}h1{font-size:1.25rem;font-weight:700;margin:0 0 .5rem;background:linear-gradient(90deg,#06b6d4,#a5f3fc,#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}p{color:#a1a1aa;font-size:.875rem;line-height:1.5}.status{display:inline-block;margin-top:1rem;padding:.25rem .75rem;border-radius:999px;border:1px solid rgba(6,182,212,.3);background:rgba(6,182,212,.1);color:#06b6d4;font-size:.75rem}</style></head><body><div class='card'><div class='orb'></div><h1>FRIDAY AI</h1><p>Your offline AI assistant is cached and ready.<br>Start the local backend to resume full functionality.</p><div class='status'>Offline Mode</div></div></body></html>",
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            }
          );
        }
      })()
    );
  }
});
