import { useTheme } from '@/contexts/ThemeContext';

/**
 * GradientCard - A beautiful animated gradient card component
 * Inspired by Uiverse.io designs with seasonal theme support
 */
export default function GradientCard({
  children,
  title,
  subtitle,
  icon,
  value,
  trend,
  trendDirection = 'up', // 'up', 'down', 'neutral'
  className = '',
  variant = 'default', // 'default', 'stats', 'feature', 'alert'
  onClick,
  animated = true,
}) {
  const { theme, currentTheme } = useTheme();

  // Get theme-specific gradient classes
  const getGradientClass = () => {
    const gradients = {
      light: 'from-emerald-400 via-teal-500 to-cyan-500',
      dark: 'from-emerald-600 via-teal-700 to-cyan-800',
      spring: 'from-pink-400 via-rose-500 to-fuchsia-500',
      summer: 'from-yellow-400 via-orange-500 to-red-500',
      autumn: 'from-amber-500 via-orange-600 to-red-600',
      winter: 'from-blue-400 via-cyan-500 to-teal-500',
    };
    return gradients[currentTheme] || gradients.light;
  };

  // Get background class based on theme
  const getBackgroundClass = () => {
    if (currentTheme === 'dark') {
      return 'bg-gray-800/90 backdrop-blur-sm';
    }
    return 'bg-white/90 backdrop-blur-sm';
  };

  // Get text color based on theme
  const getTextClass = () => {
    if (currentTheme === 'dark') {
      return 'text-white';
    }
    return 'text-gray-800';
  };

  // Trend indicator colors
  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-500';
    if (trendDirection === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '↑';
    if (trendDirection === 'down') return '↓';
    return '→';
  };

  // Default card variant
  if (variant === 'default') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded-2xl
          ${getBackgroundClass()}
          border border-gray-200/50 dark:border-gray-700/50
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          ${animated ? 'hover:-translate-y-1 hover:scale-[1.02]' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
        style={{
          boxShadow: animated ? `0 4px 20px ${theme?.cardGlow || 'rgba(5, 150, 105, 0.15)'}` : undefined,
        }}
      >
        {/* Animated gradient border */}
        <div
          className={`
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            bg-gradient-to-r ${getGradientClass()}
            ${animated ? 'animate-gradient' : ''}
          `}
          style={{ backgroundSize: '200% 200%', padding: '2px' }}
        />

        {/* Inner content container */}
        <div className={`relative ${getBackgroundClass()} rounded-2xl m-[2px] p-6 h-full`}>
          {/* Header with icon */}
          {(icon || title) && (
            <div className="flex items-center gap-3 mb-4">
              {icon && (
                <div className={`
                  p-2 rounded-xl bg-gradient-to-br ${getGradientClass()}
                  text-white shadow-md
                `}>
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className={`font-semibold ${getTextClass()}`}>{title}</h3>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={getTextClass()}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Stats card variant
  if (variant === 'stats') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded-2xl
          ${getBackgroundClass()}
          border border-gray-200/50 dark:border-gray-700/50
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          ${animated ? 'hover:-translate-y-1' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
        style={{
          boxShadow: `0 4px 20px ${theme?.cardGlow || 'rgba(5, 150, 105, 0.15)'}`,
        }}
      >
        {/* Gradient accent bar */}
        <div className={`h-1 bg-gradient-to-r ${getGradientClass()} ${animated ? 'animate-gradient' : ''}`} 
             style={{ backgroundSize: '200% 200%' }} />

        <div className="p-6">
          {/* Icon and title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {icon && (
                <span className={`text-2xl`}>{icon}</span>
              )}
              {title && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {title}
                </span>
              )}
            </div>
            {trend && (
              <span className={`text-sm font-semibold ${getTrendColor()}`}>
                {getTrendIcon()} {trend}
              </span>
            )}
          </div>

          {/* Value */}
          {value !== undefined && (
            <div className={`text-3xl font-bold ${getTextClass()} mb-1`}>
              {value}
            </div>
          )}

          {/* Subtitle/description */}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}

          {/* Additional content */}
          {children}
        </div>
      </div>
    );
  }

  // Feature card variant (for features/capabilities display)
  if (variant === 'feature') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded-2xl p-6
          ${getBackgroundClass()}
          border border-gray-200/50 dark:border-gray-700/50
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          ${animated ? 'hover:-translate-y-2 hover:scale-[1.01]' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        {/* Animated background glow */}
        <div
          className={`
            absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30
            transition-opacity duration-500 blur-xl
            bg-gradient-to-r ${getGradientClass()}
          `}
        />

        {/* Icon */}
        {icon && (
          <div className={`
            relative w-14 h-14 mb-4 rounded-xl
            bg-gradient-to-br ${getGradientClass()}
            flex items-center justify-center
            text-white text-2xl shadow-lg
            ${animated ? 'group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300' : ''}
          `}>
            {icon}
          </div>
        )}

        {/* Title */}
        {title && (
          <h3 className={`relative text-lg font-bold ${getTextClass()} mb-2`}>
            {title}
          </h3>
        )}

        {/* Subtitle/description */}
        {subtitle && (
          <p className="relative text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Additional content */}
        {children && (
          <div className="relative mt-4">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Alert card variant
  if (variant === 'alert') {
    const alertColors = {
      up: 'from-green-400 to-emerald-500',
      down: 'from-red-400 to-rose-500',
      neutral: 'from-yellow-400 to-amber-500',
    };

    return (
      <div
        className={`
          group relative overflow-hidden rounded-2xl
          ${getBackgroundClass()}
          border-l-4 border-l-current
          shadow-lg
          transition-all duration-300
          ${onClick ? 'cursor-pointer hover:shadow-xl' : ''}
          ${className}
        `}
        onClick={onClick}
        style={{
          borderLeftColor: trendDirection === 'up' ? '#22c55e' : trendDirection === 'down' ? '#ef4444' : '#eab308',
        }}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Alert icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full
            bg-gradient-to-br ${alertColors[trendDirection]}
            flex items-center justify-center text-white
            ${animated ? 'animate-pulse-slow' : ''}
          `}>
            {icon || (
              <span className="text-lg">
                {trendDirection === 'up' ? '✓' : trendDirection === 'down' ? '!' : '?'}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-semibold ${getTextClass()} truncate`}>{title}</h4>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
            {children}
          </div>

          {/* Value/time */}
          {value && (
            <span className="text-sm text-gray-400 flex-shrink-0">{value}</span>
          )}
        </div>
      </div>
    );
  }

  // Fallback to default
  return (
    <div className={`p-6 rounded-2xl ${getBackgroundClass()} ${className}`}>
      {children}
    </div>
  );
}

// Additional utility components for card content

export function CardDivider() {
  return <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />;
}

export function CardBadge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function CardProgress({ value, max = 100, showLabel = true }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(percentage)}%</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
