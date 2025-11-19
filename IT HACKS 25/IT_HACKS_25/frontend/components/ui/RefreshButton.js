"use client";

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * RefreshButton - A button that triggers data refresh with animation
 * Props:
 * - onRefresh: callback function to trigger data refresh
 * - className: additional CSS classes
 */
export default function RefreshButton({ onRefresh, className = '' }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Call the refresh callback
    if (onRefresh) {
      await onRefresh();
    }
    
    // Show spinner for at least 1 second
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow
        flex items-center gap-2 transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <RefreshCw 
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
      />
      <span className="hidden sm:inline">
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </span>
    </button>
  );
}
