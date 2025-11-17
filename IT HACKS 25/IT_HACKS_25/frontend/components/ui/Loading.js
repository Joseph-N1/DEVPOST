import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-green-600 ${sizeClasses[size]}`} />
    </div>
  );
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

const LoadingCard = ({ message = 'Loading data...', className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 flex items-center justify-center ${className}`}>
      <LoadingSpinner size="md" className="mr-3" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
};

// Default export for common usage
export default LoadingSpinner;
export { LoadingSpinner, LoadingOverlay, LoadingCard };