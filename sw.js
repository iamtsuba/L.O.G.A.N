// Minimal service worker for L.O.G.A.N sub-apps PWA installability.
// Registering a service worker (even a no-op one) is required by Chrome/Edge
// on Android/desktop for the beforeinstallprompt event to fire. This worker
// does not cache anything — each app stays fully online-only and always
// fetches fresh content; it exists purely to satisfy the PWA install criteria.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch: no caching, always hit the network.
self.addEventListener('fetch', () => {
  // Intentionally empty — default browser network handling applies.
});
