// frontend/components/ui/Card.js
/**
 * Unified Card Component with Variants
 * Provides consistent card styling across the application
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {'default'|'glass'|'gradient'|'interactive'|'accent'|'elevated'} props.variant - Card style variant
 * @param {string} props.as - HTML element to render (default: 'div')
 * @param {Object} props.rest - Additional props passed to the element
 */

const variantStyles = {
  default: 'card-base',
  glass: 'card-base card-glass',
  gradient: 'card-base card-gradient',
  interactive: 'card-base card-interactive card-elevated',
  accent: 'card-base card-accent',
  elevated: 'card-base card-elevated',
};

export default function Card({ 
  children, 
  className = '', 
  variant = 'default',
  as: Component = 'div',
  ...props 
}) {
  const baseStyles = 'p-4 sm:p-6 transition-all duration-200';
  const variantClass = variantStyles[variant] || variantStyles.default;

  return (
    <Component 
      className={`${baseStyles} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

// Export variant styles for reference
Card.variants = Object.keys(variantStyles);

// Named exports for convenience
export function GlassCard({ children, className = '', ...props }) {
  return <Card variant="glass" className={className} {...props}>{children}</Card>;
}

export function InteractiveCard({ children, className = '', onClick, ...props }) {
  return (
    <Card 
      variant="interactive" 
      className={className} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      {...props}
    >
      {children}
    </Card>
  );
}

export function GradientCard({ children, className = '', ...props }) {
  return <Card variant="gradient" className={className} {...props}>{children}</Card>;
}

export function AccentCard({ children, className = '', ...props }) {
  return <Card variant="accent" className={className} {...props}>{children}</Card>;
}
