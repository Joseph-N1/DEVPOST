// frontend/components/ui/Button.js
import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-1';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base'
  };
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-50'
  };

  return (
    <button {...props} className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
