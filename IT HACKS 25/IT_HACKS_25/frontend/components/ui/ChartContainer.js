// frontend/components/ui/ChartContainer.js
import React from "react";

export default function ChartContainer({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 ${className}`}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      <div className="chart-container">{children}</div>
    </div>
  );
}
