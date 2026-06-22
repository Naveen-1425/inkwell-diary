/* ============================================================
   Service worker — caches the app shell (HTML/CSS/JS/icons) so
   the app opens instantly and loads offline. Diary entries
   themselves still need a connection (they live in Supabase),
   but the interface itself works without one.
   ============================================================ */

const CACHE_VERSION = "inkwell-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/login.html",
  "/signup.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/dashboard.html",
  "/entry.html",
  "/calendar.html",
  "/search.html",
  "/favorites.html",
  "/profile.html",
  "/offline.html",
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
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Supabase API/auth/storage calls — always go to network.
  if (url.hostname.includes("supabase.co") || url.hostname.includes("supabase.in")) {
    return;
  }

  // App shell files: cache-first, falling back to network, then offline page.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && url.origin === location.origin) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});
