const CACHE_NAME = 'clash-arena-v1';

// Список файлов, которые нужно сохранить на телефон для быстрого запуска
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.PNG',
  './icon-512.PNG'
];

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

// Активация: удаляем старые версии кэша, если мы обновили игру (поменяли CACHE_NAME)
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
        // Если файл найден в кэше — отдаем его моментально
        if (response) {
          return response;
        }
        // Иначе скачиваем из сети
        return fetch(event.request);
      })
  );
});
