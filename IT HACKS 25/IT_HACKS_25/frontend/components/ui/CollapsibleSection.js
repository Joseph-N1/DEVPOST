/**
 * CollapsibleSection Component
 * Provides collapsible dashboard sections with smooth animations
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  badge,
  badgeColor = 'blue',
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggle
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : 0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setHeight('auto'), 300);
        return () => clearTimeout(timer);
      } else {
        setHeight(contentRef.current.scrollHeight);
        // Force reflow
        contentRef.current.offsetHeight;
        setHeight(0);
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggle?.(!isOpen);
  };

  const badgeColors = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <div className={`collapsible-section ${className}`}>
      <button
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between p-4 
          bg-white dark:bg-gray-800 
          hover:bg-gray-50 dark:hover:bg-gray-750
          border border-gray-200 dark:border-gray-700 
          rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${isOpen ? 'rounded-b-none border-b-0' : ''}
          ${headerClassName}
        `}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title?.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          )}
          <span className="font-semibold text-gray-900 dark:text-white">
            {title}
          </span>
          {badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeColors[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </span>
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </button>
      
      <div
        id={`section-content-${title?.replace(/\s+/g, '-').toLowerCase()}`}
        ref={contentRef}
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          overflow: 'hidden'
        }}
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div 
          className={`
            p-4 bg-white dark:bg-gray-800 
            border border-t-0 border-gray-200 dark:border-gray-700 
            rounded-b-lg
            ${contentClassName}
          `}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Simplified header-only collapsible for inline use
export function CollapsibleHeader({
  title,
  isOpen,
  onToggle,
  className = ''
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 text-sm font-medium 
        text-gray-700 dark:text-gray-300
        hover:text-gray-900 dark:hover:text-white
        transition-colors duration-200
        focus:outline-none focus:underline
        ${className}
      `}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
      {title}
    </button>
  );
}

// Dashboard section with collapsible functionality
export function DashboardCollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  actions,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 group focus:outline-none"
          aria-expanded={isOpen}
        >
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </div>
          {Icon && <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h2>
        </button>
        {actions && isOpen && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}
        `}
      >
        {children}
      </div>
    </section>
  );
}

export default CollapsibleSection;
