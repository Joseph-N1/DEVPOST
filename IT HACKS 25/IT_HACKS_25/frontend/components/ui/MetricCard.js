"use client";

export default function MetricCard({ title, value, trend, icon }) {
  const getTrendIcon = (trend) => {
    if (trend > 0) return '🌱';
    if (trend < 0) return '📉';
    return '⚖️';
  };

  return (
    <div className="group p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-green-100 
                    hover:shadow-xl transition-all duration-300 hover:scale-102">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-green-700 group-hover:scale-105 transition-transform">
          {value}
        </span>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 ${
            trend > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            <span className="text-lg">{getTrendIcon(trend)}</span>
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
