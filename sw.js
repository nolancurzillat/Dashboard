/* Dashboard en ligne : la page est demandée au réseau d'abord (toujours la dernière version),
   avec une copie gardée pour ouvrir l'appli sans connexion. Rien d'autre n'est mis en cache
   (ni les données du compte, ni les images externes). */
const CACHE = 'dashboard-v6'; // v6 : icônes regroupées (seulement les icon-v3)
const FILES = ['dashboard.html', 'manifest.webmanifest', 'icon-v3-192.png', 'icon-v3-512.png', 'icon-v3-maskable-192.png', 'icon-v3-maskable-512.png', 'icon-v3-apple-180.png'];

/* Notifications envoyées par la fonction Supabase « dashboard-notifs » (même appli fermée) */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Dashboard', {
    body: d.body || '', icon: 'icon-v3-192.png', badge: 'icon-v3-maskable-192.png',
    tag: d.tag || 'dashboard', renotify: true, data: { view: d.view || '' }, vibrate: [80, 40, 80]
  }));
});
/* Un appui sur la notification ouvre le Dashboard sur la bonne page */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const view = (e.notification.data && e.notification.data.view) || '';
  const url = new URL('dashboard.html' + (view ? '#' + view : ''), self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { if (view && 'navigate' in c) c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  }));
});

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
