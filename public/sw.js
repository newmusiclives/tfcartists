// Service Worker for TrueFans RADIO PWA
// BUILD_TIMESTAMP is replaced at build time by stamp-sw.js
const CACHE_NAME = "tfr-cache-mn3apekh";
const OFFLINE_URL = "/offline.html";
const SYNC_TAG = "tfr-offline-sync";
const PERIODIC_SYNC_TAG = "tfr-now-playing";

// App shell resources to cache on install
const APP_SHELL = [
  "/",
  "/player",
  "/schedule",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  OFFLINE_URL,
];

// Network-first cache duration for now-playing (5 minutes)
const NOW_PLAYING_CACHE_MAX_AGE = 5 * 60 * 1000;

// --- IndexedDB helpers (mirror of offline-store.ts for SW context) ---
const DB_NAME = "tfr-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-actions";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getPendingActions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function clearAction(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function replayQueue() {
  const actions = await getPendingActions();
  let synced = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action.body,
      });

      if (response.ok && action.id !== undefined) {
        await clearAction(action.id);
        synced++;
      } else if (response.status >= 400 && response.status < 500) {
        if (action.id !== undefined) await clearAction(action.id);
      }
    } catch {
      // Still offline — stop trying
      break;
    }
  }

  return synced;
}

// Install: cache the app shell and offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // Non-critical: some shell resources may not exist yet
        console.warn("[SW] App shell caching partially failed:", err);
      });
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// Fetch: strategy depends on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For POST requests: attempt network, register background sync on failure
  if (request.method === "POST" && url.origin === self.location.origin) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        // Request failed (offline) — register background sync
        try {
          await self.registration.sync.register(SYNC_TAG);
        } catch {
          // Background Sync API not supported — client will handle via syncAll()
        }
        return new Response(
          JSON.stringify({ queued: true, offline: true }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (CDN streams, external APIs)
  if (url.origin !== self.location.origin) return;

  // Network-first for /api/now-playing with 5-minute cache fallback
  if (url.pathname === "/api/now-playing") {
    event.respondWith(networkFirstWithExpiry(request));
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for HTML pages (with offline fallback)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkFirst(request));
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "TrueFans RADIO", body: "New update available" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/player",
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/player";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Background Sync: replay queued offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      replayQueue().then((count) => {
        if (count > 0) {
          console.log(`[SW] Background sync replayed ${count} actions`);
        }
      })
    );
  }
});

// Periodic Background Sync: refresh now-playing data
self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(
      (async () => {
        try {
          const response = await fetch("/api/now-playing");
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            const headers = new Headers(response.headers);
            headers.set("sw-cached-at", Date.now().toString());
            const cachedResponse = new Response(await response.clone().blob(), {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            await cache.put(new Request("/api/now-playing"), cachedResponse);
            console.log("[SW] Periodic sync updated now-playing cache");
          }
        } catch {
          // Network unavailable — skip this cycle
        }
      })()
    );
  }
});

// --- Strategy helpers ---

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/.test(pathname) ||
    pathname.startsWith("/_next/static/");
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithExpiry(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and store with timestamp header
      const cache = await caches.open(CACHE_NAME);
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const cachedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    // Fallback to cache if within max age
    const cached = await caches.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get("sw-cached-at") || "0", 10);
      if (Date.now() - cachedAt < NOW_PLAYING_CACHE_MAX_AGE) {
        return cached;
      }
    }
    return new Response(
      JSON.stringify({ error: "Offline", cached: true }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    return offlinePage || new Response(
      "<html><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>",
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }
}
