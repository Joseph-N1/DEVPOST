// frontend/components/ui/MetricCard.js
import React from "react";

export default function MetricCard({ title, value, trend, icon }) {
  const trendColor =
    trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-gray-500";
  const trendBg =
    trend > 0 ? "bg-green-100" : trend < 0 ? "bg-red-100" : "bg-gray-100";
  const trendSymbol = trend > 0 ? "▲" : trend < 0 ? "▼" : "—";

  return (
    <div className="bg-gradient-to-br from-white via-green-50 to-sky-50 rounded-2xl p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>

      <div
        className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-xs font-semibold ${trendBg} ${trendColor}`}
      >
        {trendSymbol} {Math.abs(trend)}%
      </div>
    </div>
  );
}
