/**
 * Skeleton Loading Components
 * Provides consistent loading states across the application
 */

// Base skeleton with shimmer animation
export function Skeleton({ className = '', width, height, rounded = 'md' }) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }[rounded] || 'rounded-md';

  return (
    <div
      className={`skeleton-shimmer bg-gray-200 dark:bg-gray-700 ${roundedClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Skeleton for card components
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card-base p-4 space-y-3 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="1.25rem" />
        <Skeleton width="2rem" height="2rem" rounded="full" />
      </div>
      <Skeleton width="60%" height="2rem" />
      <Skeleton width="80%" height="0.875rem" />
      <div className="flex gap-2 pt-2">
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
      </div>
    </div>
  );
}

// Skeleton for room cards (matches RoomCard layout)
export function SkeletonRoomCard({ className = '' }) {
  return (
    <div className={`card-base p-4 ${className}`} aria-hidden="true">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton width="2.5rem" height="2.5rem" rounded="lg" />
          <div className="space-y-1">
            <Skeleton width="6rem" height="1rem" />
            <Skeleton width="4rem" height="0.75rem" />
          </div>
        </div>
        <Skeleton width="3rem" height="1.5rem" rounded="full" />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton width="100%" height="0.75rem" />
            <Skeleton width="60%" height="1.25rem" />
          </div>
        ))}
      </div>
      
      <Skeleton width="100%" height="0.5rem" rounded="full" />
    </div>
  );
}

// Skeleton for charts
export function SkeletonChart({ className = '', height = '16rem' }) {
  return (
    <div className={`card-base p-4 ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="30%" height="1.25rem" />
        <div className="flex gap-2">
          <Skeleton width="4rem" height="2rem" rounded="md" />
          <Skeleton width="4rem" height="2rem" rounded="md" />
        </div>
      </div>
      <div 
        className="flex items-end justify-between gap-2 px-4"
        style={{ height }}
      >
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
          <Skeleton 
            key={i} 
            width="100%" 
            height={`${h}%`} 
            rounded="sm"
            className="flex-1"
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} width="2rem" height="0.75rem" />
        ))}
      </div>
    </div>
  );
}

// Skeleton for metric/stat cards
export function SkeletonMetricCard({ className = '' }) {
  return (
    <div className={`card-base p-4 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton width="1.5rem" height="1.5rem" rounded="md" />
        <Skeleton width="50%" height="0.875rem" />
      </div>
      <Skeleton width="70%" height="2rem" className="mb-1" />
      <div className="flex items-center gap-2">
        <Skeleton width="3rem" height="1rem" rounded="full" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
  );
}

// Grid of skeleton cards
export function SkeletonCardGrid({ 
  count = 4, 
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  CardComponent = SkeletonCard,
  className = ''
}) {
  return (
    <div className={`grid ${columns} gap-4 ${className}`} aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

// Skeleton for table rows
export function SkeletonTableRow({ columns = 5, className = '' }) {
  return (
    <tr className={className} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton width={i === 0 ? '80%' : '60%'} height="1rem" />
        </td>
      ))}
    </tr>
  );
}

// Skeleton for full table
export function SkeletonTable({ rows = 5, columns = 5, className = '' }) {
  return (
    <div className={`card-base overflow-hidden ${className}`} aria-hidden="true">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton width="8rem" height="2rem" rounded="md" />
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton width="70%" height="0.75rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Skeleton for list items
export function SkeletonListItem({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`} aria-hidden="true">
      <Skeleton width="2.5rem" height="2.5rem" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
      <Skeleton width="4rem" height="1.5rem" rounded="md" />
    </div>
  );
}

// Skeleton for text blocks
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '70%' : '100%'} 
          height="0.875rem" 
        />
      ))}
    </div>
  );
}

// Wrapper for conditional skeleton loading
export function SkeletonWrapper({ 
  isLoading, 
  skeleton, 
  children,
  minHeight 
}) {
  if (isLoading) {
    return (
      <div style={{ minHeight }} aria-busy="true">
        {skeleton}
      </div>
    );
  }
  return children;
}

export default Skeleton;
