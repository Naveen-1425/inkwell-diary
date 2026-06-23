/* service-worker.js — cache static assets only, never intercept navigation */

const CACHE = "inkwell-v3";
const ASSETS = [
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

self.addEventListener("install",(e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate",(e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",(e)=>{
  const req=e.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  // Never intercept: navigation, Supabase, CDN
  if(req.mode==="navigate") return;
  if(url.hostname.includes("supabase.co")) return;
  if(url.hostname.includes("jsdelivr.net")||url.hostname.includes("googleapis.com")) return;

  e.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res&&res.status===200&&!res.redirected&&url.origin===location.origin){
          caches.open(CACHE).then(c=>c.put(req,res.clone()));
        }
        return res;
      }).catch(()=>null);
    })
  );
});
