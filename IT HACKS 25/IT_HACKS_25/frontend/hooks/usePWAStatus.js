/**
 * PWA Status Hook - Phase 9
 * Detects if app is installed, online/offline status, and SW updates
 */

import { useState, useEffect } from 'react';

export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstalled = () => {
      if (typeof window === 'undefined') return false;
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone // iOS
        || document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    checkInstalled();

    // Listen for display mode changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const handler = (e) => setIsInstalled(e.matches);
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial online status
    setIsOnline(window.navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[PWA] Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[PWA] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom connection events from service worker
    window.addEventListener('connection-online', handleOnline);
    window.addEventListener('connection-offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connection-online', handleOnline);
      window.removeEventListener('connection-offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for service worker updates
    const handleSWUpdate = () => {
      console.log('[PWA] Service worker update available');
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Capture install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('[PWA] Install prompt available');
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    
    return outcome === 'accepted';
  };

  const updateApp = () => {
    if (typeof window === 'undefined') return;
    
    // Trigger service worker update
    if (window.updateServiceWorker) {
      window.updateServiceWorker();
    } else {
      // Fallback: reload page
      window.location.reload();
    }
  };

  return {
    isInstalled,
    isOnline,
    updateAvailable,
    canInstall: deferredPrompt !== null,
    promptInstall,
    updateApp,
  };
}
