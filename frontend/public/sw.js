/**
 * ClearPay Service Worker (PWA App Shell Precaching)
 *
 * CRITICAL PRIVACY & SECURITY INVARIANT:
 * - NEVER cache API responses (/api/*, /check*, /analyze*, /feedback, etc.)
 * - NEVER cache POST, PUT, DELETE requests or any requests with bodies
 * - NEVER cache sensitive user messages, decoded QR payloads, or private analysis results
 * - Volatile RAM processing is strictly maintained; only static web assets are cached
 */

const CACHE_NAME = 'clearpay-app-shell-v1';

const STATIC_APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/logo-symbol.png',
  '/logo-horizontal.png',
  '/logo-full.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event: Pre-cache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_APP_SHELL).catch((err) => {
        // Non-blocking in local development if some asset URLs are hashed
        console.warn('ClearPay SW: Pre-cache partial warning', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Strict bypass for APIs, cache fallback for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. SECURITY INVARIANT: Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. SECURITY INVARIANT: Strictly bypass cache for API routes, live safety checks, and telemetry
  const isApiRequest = (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/check') ||
    url.pathname.startsWith('/analyze') ||
    url.pathname.startsWith('/feedback') ||
    url.pathname.startsWith('/health') ||
    url.pathname.startsWith('/directory') ||
    url.pathname.startsWith('/subscriptions') ||
    url.pathname.startsWith('/scam-guide') ||
    url.pathname.startsWith('/reporting-guide') ||
    url.port === '8000' // Local FastAPI dev server port
  );

  if (isApiRequest) {
    // Network-only for all dynamic analysis and backend APIs
    return;
  }

  // 3. Static Asset Handling: Stale-While-Revalidate for app shell
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache if connected
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {
          // Offline, cachedResponse already served
        });
        return cachedResponse;
      }

      // Not in cache: fetch from network
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache static JS, CSS, and image assets
        const isStaticAsset = (
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.svg') ||
          url.pathname.endsWith('.ico') ||
          url.pathname.endsWith('.woff2') ||
          url.pathname.endsWith('.woff')
        );

        if (isStaticAsset) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Offline navigation fallback to index.html if navigating
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
