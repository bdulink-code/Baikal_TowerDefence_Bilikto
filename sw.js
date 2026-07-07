// Оборона Байкала — минимальный SW. Кэш версионируется: смена имени = полное обновление.
const CACHE = 'baikal-v1.8.3';
const PRECACHE = ['./', './index.html', './strings.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Страница и скрипты — сеть в приоритете (свежие релизы), кэш как офлайн-фолбэк
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r;
      }).catch(() => caches.match(e.request, {ignoreSearch:true}).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Статика (assets) — кэш в приоритете
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r;
    }))
  );
});
