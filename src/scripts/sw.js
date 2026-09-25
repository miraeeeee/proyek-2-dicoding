// src/scripts/sw.js
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 0. UPDATE STRATEGY: Skip waiting & claim clients
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. PRECACHE APP SHELL
precacheAndRoute(self.__WB_MANIFEST || []);

// 2. NAVIGATION ROUTE (SPA Navigation Fallback)
const PUBLIC_PATH = process.env.PUBLIC_PATH || '/';
const handler = createHandlerBoundToURL(PUBLIC_PATH + 'index.html');

const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
  ],
});
registerRoute(navigationRoute);

// 3. RUNTIME CACHING: DICODING STORY API (NetworkFirst for offline support)
registerRoute(
  ({ url }) => url.href.includes('story-api.dicoding.dev'),
  new NetworkFirst({
    cacheName: 'stories-api-cache-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Hari
      }),
    ],
  })
);

// 4. RUNTIME CACHING: IMAGES (StaleWhileRevalidate)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Hari
      }),
    ],
  })
);

// 5. RUNTIME CACHING: EXTERNAL ASSETS (Fonts & Leaflet Map Tiles)
registerRoute(
  ({ url }) => url.origin.includes('googleapis') || 
               url.origin.includes('gstatic') ||
               url.origin.includes('openstreetmap') ||
               url.origin.includes('stadiamaps') ||
               url.origin.includes('cartocdn'),
  new CacheFirst({
    cacheName: 'external-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Tahun
      }),
    ],
  })
);

// 6. PUSH NOTIFICATION (Kriteria 2: Skilled & Advanced)
self.addEventListener('push', (event) => {
  let title = 'Story App - Berbagi Cerita';
  let options = {
    body: 'Ada cerita baru yang dibagikan!',
    icon: './images/logo-192.png',
    badge: './images/logo-192.png',
    vibrate: [100, 50, 100],
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.title) title = payload.title;
      if (payload.options) {
        options = {
          ...options,
          ...payload.options,
          icon: payload.options.icon || './images/logo-192.png',
          badge: payload.options.badge || './images/logo-192.png',
        };
      } else if (payload.message || payload.body) {
        options.body = payload.message || payload.body;
        if (payload.id || payload.storyId) {
          options.data = { id: payload.id || payload.storyId };
        }
      }
    } catch (e) {
      console.warn('Push payload not JSON, using text fallback:', e);
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 7. NOTIFICATION CLICK ACTION (Kriteria 2 Advanced: Action ke detail page)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const storyId = event.notification.data ? event.notification.data.id : null;
  let targetUrl = PUBLIC_PATH;
  if (storyId) {
    targetUrl = `${PUBLIC_PATH}#/detail/${storyId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (storyId && client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});