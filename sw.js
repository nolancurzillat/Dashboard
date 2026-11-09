/* Dashboard en ligne : la page est demandée au réseau d'abord (toujours la dernière version),
   avec une copie gardée pour ouvrir l'appli sans connexion. Rien d'autre n'est mis en cache
   (ni les données du compte, ni les images externes). */
const CACHE = 'dashboard-v1';
const FILES = ['dashboard.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const page = e.request.mode === 'navigate' || /\/(dashboard\.html|index\.html)?$/.test(u.pathname);
  if (page) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('dashboard.html', copy)); return r; })
        .catch(() => caches.match('dashboard.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
