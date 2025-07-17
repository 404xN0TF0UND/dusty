const CACHE_NAME = 'dusty-chores-v1';
const STATIC_CACHE_NAME = 'dusty-chores-static-v1';
const DYNAMIC_CACHE_NAME = 'dusty-chores-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Listen for waiting service worker and notify clients
self.addEventListener('statechange', (event) => {
  if (event.target.state === 'installed' && self.registration.waiting) {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
      });
    });
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(
      event.data.notification.title,
      event.data.notification
    );
  }
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (Firebase)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for Firebase requests
    if (request.url.includes('firebase')) {
      return new Response(JSON.stringify({ offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static asset requests with stale-while-revalidate
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately, update in background
  return cachedResponse || fetchPromise;
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html');
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-chores') {
    event.waitUntil(syncOfflineChores());
  }
});

// Handle push notifications with enhanced payload support
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: 'Dusty\'s Chores',
    body: 'Dusty has a message for you!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Chores',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        data: {
          ...notificationData.data,
          ...pushData.data
        },
        actions: pushData.actions || notificationData.actions,
        tag: pushData.tag, // Group notifications
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false
      };
    } catch (error) {
      console.error('Failed to parse push data:', error);
      // Fallback to text data
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks with enhanced action support
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  // Handle different actions
  switch (event.action) {
    case 'explore':
      event.waitUntil(
        clients.openWindow('/')
      );
      break;
    case 'add_chore':
      event.waitUntil(
        clients.openWindow('/?section=add')
      );
      break;
    case 'view_stats':
      event.waitUntil(
        clients.openWindow('/?section=stats')
      );
      break;
    case 'complete_chore':
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'COMPLETE_CHORE_FROM_NOTIFICATION',
              choreId: event.notification.data?.choreId
            });
          });
        })
      );
      break;
    case 'snooze':
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SNOOZE_CHORE_FROM_NOTIFICATION',
              choreId: event.notification.data?.choreId
            });
          });
        })
      );
      break;
    case 'snooze_1d':
    case 'snooze_3d':
    case 'snooze_1w': {
      let snoozeDays = 1;
      if (event.action === 'snooze_3d') snoozeDays = 3;
      if (event.action === 'snooze_1w') snoozeDays = 7;
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SNOOZE_CHORE_FROM_NOTIFICATION',
              choreId: event.notification.data?.choreId,
              snoozeDays
            });
          });
        })
      );
      break;
    }
    case 'close':
    default:
      // Just close the notification
      break;
  }

  // Focus existing window if available
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Sync offline chores when back online
async function syncOfflineChores() {
  try {
    const offlineData = await getOfflineData();
    if (offlineData.chores && offlineData.chores.length > 0) {
      console.log('Syncing offline chores:', offlineData.chores.length);
      
      // Send sync message to main thread
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_OFFLINE_DATA',
          data: offlineData
        });
      });
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}

// Helper function to get offline data from IndexedDB
async function getOfflineData() {
  // This would be implemented in the main app
  // For now, return empty object
  return { chores: [] };
} 