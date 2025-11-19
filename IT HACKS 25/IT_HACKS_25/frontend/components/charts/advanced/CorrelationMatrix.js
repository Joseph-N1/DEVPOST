"use client";

import React from 'react';

/**
 * CorrelationMatrix - Shows relationships between metrics
 * Useful for identifying which metrics influence each other
 */
export default function CorrelationMatrix({ data = [], metrics = [], title = "Metric Correlations" }) {
  if (!data || data.length === 0 || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for correlation matrix
      </div>
    );
  }

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (metric1, metric2) => {
    const pairs = data
      .map(d => ({ x: parseFloat(d[metric1]), y: parseFloat(d[metric2]) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    if (pairs.length < 2) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
    const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
    const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;
    return numerator / denominator;
  };

  // Build correlation matrix
  const correlationMatrix = metrics.map(metric1 => 
    metrics.map(metric2 => calculateCorrelation(metric1, metric2))
  );

  // Get color based on correlation value (-1 to 1)
  const getColor = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs < 0.2) return '#f3f4f6'; // Very weak
    if (abs < 0.4) return correlation > 0 ? '#dbeafe' : '#fee2e2'; // Weak
    if (abs < 0.6) return correlation > 0 ? '#93c5fd' : '#fca5a5'; // Moderate
    if (abs < 0.8) return correlation > 0 ? '#3b82f6' : '#f87171'; // Strong
    return correlation > 0 ? '#1e3a8a' : '#dc2626'; // Very strong
  };

  return (
    <div className="w-full overflow-x-auto">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <div className="inline-block">
        {/* Header row */}
        <div className="flex">
          <div className="w-32 h-12 flex-shrink-0 border-b-2 border-r-2 border-gray-300 bg-gray-100"></div>
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="w-24 h-12 flex-shrink-0 border-b-2 border-gray-200 bg-gray-50 flex items-center justify-center"
            >
              <span className="text-xs font-semibold text-gray-600 transform -rotate-45 text-center">
                {metric.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Correlation grid */}
        {metrics.map((metric1, i) => (
          <div key={i} className="flex">
            <div className="w-32 h-20 flex-shrink-0 border-b border-r-2 border-gray-200 bg-gray-50 flex items-center px-2">
              <span className="text-xs font-medium text-gray-700">
                {metric1.replace(/_/g, ' ')}
              </span>
            </div>
            {metrics.map((metric2, j) => {
              const correlation = correlationMatrix[i][j];
              const isStrong = Math.abs(correlation) >= 0.6;
              
              return (
                <div
                  key={j}
                  className="w-24 h-20 flex-shrink-0 border-b border-r border-gray-200 flex flex-col items-center justify-center relative group cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: getColor(correlation) }}
                >
                  <span className={`text-sm font-bold ${isStrong ? 'text-white' : 'text-gray-800'}`}>
                    {correlation.toFixed(2)}
                  </span>
                  <span className={`text-xs ${isStrong ? 'text-white opacity-80' : 'text-gray-600'}`}>
                    {Math.abs(correlation) < 0.2 ? 'Weak' : 
                     Math.abs(correlation) < 0.6 ? 'Moderate' : 'Strong'}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute hidden group-hover:block bg-black text-white text-xs rounded px-3 py-2 -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10 shadow-lg">
                    <div className="font-semibold mb-1">{metric1} vs {metric2}</div>
                    <div>Correlation: {correlation.toFixed(3)}</div>
                    <div>{correlation > 0 ? 'Positive' : 'Negative'} relationship</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#dc2626' }}></div>
            <span>Strong Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gray-200"></div>
            <span>No Correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1e3a8a' }}></div>
            <span>Strong Positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
