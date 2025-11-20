/**
 * Service Worker Registration for ECO FARM PWA
 * Phase 9: Handles SW lifecycle, updates, and offline detection
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New Service Worker installing');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to update
              console.log('[PWA] New version available! Reload to update.');
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[PWA] Message from SW:', event.data);

      if (event.data && event.data.type === 'UPLOAD_SYNCED') {
        showNotification('Upload Complete', 'Your file has been uploaded successfully');
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }
  });
}

function showUpdateNotification() {
  // Dispatch custom event for app to show update UI
  window.dispatchEvent(new CustomEvent('sw-update-available'));
}

function handleOnline() {
  console.log('[PWA] Back online');
  window.dispatchEvent(new CustomEvent('connection-online'));

  // Trigger background sync if supported
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register('sync-uploads');
      registration.sync.register('sync-analytics');
    });
  }
}

function handleOffline() {
  console.log('[PWA] Gone offline');
  window.dispatchEvent(new CustomEvent('connection-offline'));
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png'
    });
  }
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('[PWA] Notification permission:', permission);
    });
  }
}

// Unregister service worker (for development/testing)
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[PWA] Service Worker unregistered');
      })
      .catch((error) => {
        console.error('[PWA] Error unregistering SW:', error);
      });
  }
}

// Clear all caches
export function clearAllCaches() {
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[PWA] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
}

// Update service worker
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      const waitingWorker = registration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }
}
