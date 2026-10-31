
const CACHE_NAME = "casa-pepe-v1";
const APP_URL = new URL("index.html", self.registration.scope).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(APP_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // No interceptar conexiones a otros sitios.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copia = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(APP_URL, copia));
          }
          return response;
        })
        .catch(() => caches.match(APP_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copia = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copia));
        }
        return response;
      });
    })
  );
});
