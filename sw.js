const CACHE = 'challenge-v3'; // bump version to bust old cache

const STATIC = [
  '/challenge/',
  '/challenge/index.html',
  '/challenge/manifest.json'
];

// On install — cache static files and activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting()) // activate new SW immediately
  );
});

// On activate — delete ALL old caches and take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // take control of all open tabs
  );
});

// Network first — always try network, fall back to cache only if offline
self.addEventListener('fetch', e => {
  // Only handle same-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Got fresh response — update cache in background
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(e.request);
      })
  );
});