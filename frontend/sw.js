/* Sonora — service worker: cache leve para funcionar offline ao reabrir */
const CACHE = 'sonora-v1';
const CORE = ['./', './index.html', './css/style.css', './js/api.js', './js/player.js', './js/app.js', './manifest.json', './assets/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

/* Rede primeiro para a API; cache para o app em si */
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if(url.includes('itunes.apple.com') || url.includes('applemarketingtools') || url.includes('mzstatic')) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
