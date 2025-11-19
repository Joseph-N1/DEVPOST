// frontend/components/ui/MetricCard.js
import React from "react";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AITooltip from './AITooltip';

export default function MetricCard({ title, value, trend, icon, metricKey, roomId }) {
  const trendColor =
    trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-gray-500";
  const trendBg =
    trend > 0 ? "bg-green-100" : trend < 0 ? "bg-red-100" : "bg-gray-100";
  
  // Use icons instead of symbols
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-white via-green-50 to-sky-50 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            {metricKey && (
              <AITooltip 
                metric={metricKey} 
                value={parseFloat(value) || 0} 
                change={trend}
                roomId={roomId}
              />
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1 break-words">{value}</p>
        </div>
        <div className="text-2xl sm:text-3xl ml-2 flex-shrink-0">{icon}</div>
      </div>

      <div
        className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-full text-xs font-semibold ${trendBg} ${trendColor} w-fit`}
      >
        <TrendIcon className="w-3.5 h-3.5" />
        <span>{Math.abs(trend)}%</span>
      </div>
    </div>
  );
}
