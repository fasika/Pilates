// Pilates Curriculum — Service Worker
// Caches all app assets for full offline use

const CACHE_NAME = ‘pilates-curriculum-v1’;
const ASSETS = [
‘./pilates-curriculum.html’,
‘./manifest.json’,
‘https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap’
];

// Install: cache core assets
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return cache.addAll(ASSETS).catch(() => {
// Fonts may fail in some environments — that’s OK
return cache.addAll([’./pilates-curriculum.html’, ‘./manifest.json’]);
});
}).then(() => self.skipWaiting())
);
});

// Activate: clean up old caches
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(
keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
)
).then(() => self.clients.claim())
);
});

// Fetch: cache-first for local assets, network-first for API calls
self.addEventListener(‘fetch’, event => {
const url = new URL(event.request.url);

// Never cache Anthropic API calls (translation)
if (url.hostname === ‘api.anthropic.com’) {
event.respondWith(fetch(event.request));
return;
}

// Cache-first strategy for everything else
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;
return fetch(event.request).then(response => {
// Cache successful GET responses
if (event.request.method === ‘GET’ && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
}
return response;
}).catch(() => {
// If offline and no cache, return the main app shell
if (event.request.destination === ‘document’) {
return caches.match(’./pilates-curriculum.html’);
}
});
})
);
});
