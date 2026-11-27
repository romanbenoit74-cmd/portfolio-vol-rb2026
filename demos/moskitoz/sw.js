// Minimal service worker: makes the game installable ("Add to Home Screen"). It caches nothing, so every launch gets the latest version.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
