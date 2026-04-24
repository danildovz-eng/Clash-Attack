const CACHE_NAME = 'clash-arena-v1';

// Список файлов, которые нужно сохранить на телефон для быстрого запуска
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.PNG',
  './icon-512.PNG'
];

// Переменная для таймера уведомлений
let notifTimeout;

// Установка: кэшируем основные файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Открыт кэш');
        return cache.addAll(urlsToCache);
      })
  );
  // Заставляем Service Worker активироваться сразу
  self.skipWaiting();
});

// Активация: удаляем старые версии кэша, если мы обновили игру
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов: сначала ищем в кэше, если нет — качаем из интернета
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});


// === НОВАЯ ЛОГИКА ДЛЯ PUSH-УВЕДОМЛЕНИЙ ===

// Слушаем сообщения из нашей игры (когда игрок сворачивает или открывает игру)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'HIDDEN') {
    // Игрок свернул игру. Запускаем таймер на 3 часа (3 * 60 * 60 * 1000 = 10 800 000 мс)
    notifTimeout = setTimeout(() => {
      self.registration.showNotification('Clash Arena', {
        body: 'Король ждёт твоих распоряжений на арене! 👑⚔️',
        icon: './icon-192.PNG', // Используем вашу локальную иконку!
        badge: './icon-192.PNG',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      });
    }, 3 * 60 * 60 * 1000); 
  } 
  else if (event.data && event.data.type === 'VISIBLE') {
    // Игрок вернулся в игру до истечения 3 часов — отменяем пуш
    if (notifTimeout) {
      clearTimeout(notifTimeout);
    }
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Пытаемся развернуть уже открытую вкладку с игрой
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Если вкладка закрыта - открываем новую
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
