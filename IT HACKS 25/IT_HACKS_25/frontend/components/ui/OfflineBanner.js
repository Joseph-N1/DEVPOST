/**
 * Offline Banner - Phase 9
 * Shows connection status and sync progress
 */

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { usePWAStatus } from '../../hooks/usePWAStatus';
import { useOfflineData } from '../../hooks/useOfflineData';

export default function OfflineBanner() {
  const { isOnline } = usePWAStatus();
  const { pendingUploads } = useOfflineData();
  const [syncing, setSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setSyncComplete(false);
    } else if (pendingUploads.length > 0) {
      setShow(true);
      setSyncing(true);
      
      // Simulate sync completion (replace with actual sync listener)
      const timer = setTimeout(() => {
        setSyncing(false);
        setSyncComplete(true);
        setTimeout(() => setShow(false), 3000);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // Hide banner after coming online
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingUploads]);

  if (!show) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300 ease-in-out
        ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={20} />
            <span className="font-medium">Offline Mode</span>
            <span className="text-sm opacity-90">- You can still view cached data</span>
          </div>
        </div>
      )}

      {isOnline && syncing && (
        <div className="bg-blue-500 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin" />
            <span className="font-medium">Syncing...</span>
            <span className="text-sm opacity-90">
              ({pendingUploads.length} {pendingUploads.length === 1 ? 'item' : 'items'})
            </span>
          </div>
        </div>
      )}

      {isOnline && syncComplete && !syncing && (
        <div className="bg-green-500 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            <span className="font-medium">Sync Complete</span>
            <span className="text-sm opacity-90">- All data is up to date</span>
          </div>
        </div>
      )}
    </div>
  );
}
