const CACHE_NAME = "rotation-tracker-cache-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./google-sheets.js",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Don't cache Google Apps Script requests - always fetch from network (GET or POST)
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Network First strategy - try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request succeeds, update cache and return response
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // If cache also fails, return index.html for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
