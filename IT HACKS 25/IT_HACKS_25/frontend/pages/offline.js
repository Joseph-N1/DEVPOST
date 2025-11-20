/**
 * Offline Page - Phase 9
 * Fallback page when user is offline and no cache is available
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    checkOnline();
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Automatically retry when connection is restored
      window.location.reload();
    }
  }, [isOnline]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
            <WifiOff size={48} className="text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. 
          Please check your network settings and try again.
        </p>

        {/* Status */}
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8
          ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        `}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-600' : 'bg-red-600'}`} />
          <span className="font-medium">
            {isOnline ? 'Connection Restored' : 'No Internet Connection'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={!isOnline}
            className="
              w-full bg-green-600 text-white px-6 py-3 rounded-lg
              font-medium hover:bg-green-700 transition-colors
              disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              min-h-[48px]
            "
          >
            <RefreshCw size={20} className={isOnline ? 'animate-spin' : ''} />
            {isOnline ? 'Reconnecting...' : 'Retry Connection'}
          </button>

          <button
            onClick={handleGoHome}
            className="
              w-full bg-white text-gray-700 px-6 py-3 rounded-lg
              font-medium border-2 border-gray-300 hover:border-gray-400
              transition-colors flex items-center justify-center gap-2
              min-h-[48px]
            "
          >
            <Home size={20} />
            Go to Dashboard
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 text-left bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">
            Troubleshooting Tips
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>Check if airplane mode is disabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>Verify your Wi-Fi or mobile data is enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>Try moving to an area with better signal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>Restart your router if using Wi-Fi</span>
            </li>
          </ul>
        </div>

        {/* Cache Info */}
        <p className="mt-6 text-sm text-gray-500">
          Some pages may be available from cache. Try navigating to the dashboard to see cached data.
        </p>
      </div>
    </div>
  );
}
