import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-md hover:shadow-lg transition ${className}`}>
      {children}
    </div>
  );
}
