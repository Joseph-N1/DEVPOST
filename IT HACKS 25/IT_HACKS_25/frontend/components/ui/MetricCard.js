"use client";

export default function MetricCard({ title, value, trend }) {
  const trendColor =
    trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600";

  const trendSymbol = trend > 0 ? "↑" : trend < 0 ? "↓" : "→";

  return (
    <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-md hover:shadow-lg transition duration-300 border border-green-100">
      <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-green-700">{value}</p>
        <span className={`text-sm font-semibold ${trendColor}`}>
          {trendSymbol} {Math.abs(trend)}%
        </span>
      </div>
    </div>
  );
}
