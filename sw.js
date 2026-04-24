const CACHE_NAME = 'clash-arena-v2'; // Сменили версию, чтобы принудительно сбросить старый сломанный кэш!

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.PNG',
  './icon-512.PNG'
];

let notifTimeout;

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Немедленно устанавливаем новую версию
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      })
    ))
  );
  self.clients.claim(); // Захватываем управление
});

// === СТРАТЕГИЯ "СЕТЬ В ПРИОРИТЕТЕ" (АВТООБНОВЛЕНИЕ И ФИКС OFFLINE) ===
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если интернет есть, качаем свежий файл и обновляем кэш в фоне
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Если интернета нет вообще, достаем игру из кэша
        return caches.match(event.request);
      })
  );
});

// === PUSH-УВЕДОМЛЕНИЯ И ФОН ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'HIDDEN') {
    // Игрок свернул игру. Запускаем таймер на 3 часа
    notifTimeout = setTimeout(() => {
      self.registration.showNotification('Clash Arena', {
        body: 'Король ждёт твоих распоряжений на арене! 👑⚔️',
        icon: './icon-192.PNG',
        badge: './icon-192.PNG',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      });
    }, 3 * 60 * 60 * 1000); 
  } 
  else if (event.data && event.data.type === 'VISIBLE') {
    if (notifTimeout) clearTimeout(notifTimeout);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
