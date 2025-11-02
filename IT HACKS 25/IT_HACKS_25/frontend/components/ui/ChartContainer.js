// frontend/components/ui/ChartContainer.js
import React from "react";

export default function ChartContainer({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
      {title && (
        <h3 className="text-lg font-semibold text-green-700 mb-4">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
