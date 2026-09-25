// const CACHE_NAME = 'berbagi-cerita-v1';
// const CONFIG = {
//   BASE_URL: '/berbagi-cerita', // Sesuaikan dengan nama repo GitHub Anda
// };

// const urlsToCache = [
//   `${CONFIG.BASE_URL}/`,
//   `${CONFIG.BASE_URL}/index.html`,
//   `${CONFIG.BASE_URL}/app.bundle.js`,
//   `${CONFIG.BASE_URL}/manifest.json`,
//   `${CONFIG.BASE_URL}/images/logo.png`,
//   `${CONFIG.BASE_URL}/images/leaf-green.png`,
//   `${CONFIG.BASE_URL}/images/leaf-shadow.png`,
//   `${CONFIG.BASE_URL}/images/marker-icon.png`,
//   `${CONFIG.BASE_URL}/images/marker-icon-2x.png`,
//   `${CONFIG.BASE_URL}/images/marker-shadow.png`,
//   `${CONFIG.BASE_URL}/images/logo-192.png`,
//   `${CONFIG.BASE_URL}/images/logo-512.png`,
// ];

// // Install: Cache statis
// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(
//         urlsToCache.map((url) => new Request(url, { cache: 'reload' }))
//       );
//     })
//   );
//   self.skipWaiting();
// });

// // Activate: Hapus cache lama
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches
//       .keys()
//       .then((cacheNames) => {
//         return Promise.all(
//           cacheNames.map((cacheName) => {
//             if (cacheName !== CACHE_NAME) {
//               return caches.delete(cacheName);
//             }
//           })
//         );
//       })
//       .then(() => clients.claim())
//   );
// });

// // Handle Message
// self.addEventListener('message', (event) => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
//   if (event.data?.title) {
//     self.registration.showNotification(event.data.title, event.data.options || {});
//   }
// });

// // Fetch Strategy
// self.addEventListener('fetch', (event) => {
//   // 1. Handle request navigasi (HTML) -> Network First, Fallback to Cache
//   if (event.request.mode === 'navigate') {
//     event.respondWith(
//       fetch(event.request)
//         .catch(() => {
//           // Jika offline, kembalikan index.html dari cache yang sudah ada prefix-nya
//           return caches.match(`${CONFIG.BASE_URL}/index.html`);
//         })
//     );
//     return;
//   }

//   // 2. Handle request aset lainnya (JS, CSS, Images) -> Cache First
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return (
//         response ||
//         fetch(event.request).then((networkResponse) => {
//           // Cache dinamis untuk app.bundle.js
//           if (networkResponse.ok && event.request.url.includes('app.bundle.js')) {
//             caches.open(CACHE_NAME).then((cache) => {
//               cache.put(event.request, networkResponse.clone());
//             });
//           }
//           return networkResponse;
//         })
//       );
//     })
//   );
// });

// // Push Notification
// self.addEventListener('push', (event) => {
//   let data = { title: 'Notifikasi', options: { body: 'Ada cerita baru!' } };
//   if (event.data) {
//     try {
//       data = event.data.json();
//     } catch (e) {}
//   }
//   event.waitUntil(
//     self.registration.showNotification(data.title, data.options)
//   );
// });