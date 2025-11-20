/**
 * PWA Install Prompt - Phase 9
 * Prompts users to install the PWA
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAStatus } from '../../hooks/usePWAStatus';

export default function PWAInstallPrompt() {
  const { isInstalled, canInstall, promptInstall } = usePWAStatus();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    setDismissed(isDismissed);

    // Show prompt after 10 seconds if conditions are met
    const timer = setTimeout(() => {
      if (!isInstalled && canInstall && !isDismissed) {
        setShow(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInstalled, canInstall]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!show || isInstalled || !canInstall || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Download size={24} className="text-green-600" />
          </div>
          
          <div className="flex-1">
            <h3 id="pwa-install-title" className="font-semibold text-gray-900 mb-1">
              Install ECO FARM App
            </h3>
            <p id="pwa-install-description" className="text-sm text-gray-600 mb-3">
              Install our app for faster access, offline support, and a better experience.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px]"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Dismiss install prompt"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
