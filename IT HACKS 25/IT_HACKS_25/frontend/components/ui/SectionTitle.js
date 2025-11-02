// frontend/components/ui/SectionTitle.js
import React from "react";

export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-green-700 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      )}
      <div className="mt-2 w-16 h-[3px] bg-green-400 rounded-full"></div>
    </div>
  );
}
