/* ============================================================
   Service worker — caches app shell for offline loading
   ============================================================ */

const CACHE_VERSION = "inkwell-v2";
const APP_SHELL = [
  "/css/style.css",
  "/js/supabase-client.js",
  "/js/utils.js",
  "/js/auth.js",
  "/js/shell.js",
  "/js/dashboard.js",
  "/js/entry.js",
  "/js/calendar.js",
  "/js/search.js",
  "/js/favorites.js",
  "/js/profile.js",
  "/js/pwa.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept Supabase calls
  if (url.hostname.includes("supabase.co")) return;

  // Never intercept navigation requests — let browser handle HTML pages directly
  if (request.mode === "navigate") return;

  // Cache-first for static assets (CSS, JS, icons)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && !response.redirected) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => null);
    })
  );
});
