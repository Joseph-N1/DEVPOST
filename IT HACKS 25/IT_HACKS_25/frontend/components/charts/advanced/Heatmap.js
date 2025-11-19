"use client";

import React from 'react';

/**
 * Heatmap - Day vs Metric intensity visualization
 * Shows performance intensity across days and metrics
 */
export default function Heatmap({ data = [], title = "Performance Heatmap", metrics = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for heatmap
      </div>
    );
  }

  // Prepare heatmap grid: rows = metrics, columns = days
  const days = [...new Set(data.map(d => d.date || d.day))].slice(0, 30); // Limit to 30 days
  const metricsToShow = metrics.length > 0 ? metrics : ['eggs_produced', 'avg_weight_kg', 'fcr', 'mortality_rate'];

  // Calculate normalized values (0-100) for color intensity
  const getNormalizedValue = (metric, value) => {
    const values = data.map(d => parseFloat(d[metric]) || 0).filter(v => v > 0);
    if (values.length === 0) return 0;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  // Get color based on intensity
  const getColor = (intensity) => {
    if (intensity === null || intensity === 0) return '#f3f4f6';
    if (intensity < 20) return '#dbeafe';
    if (intensity < 40) return '#93c5fd';
    if (intensity < 60) return '#3b82f6';
    if (intensity < 80) return '#1d4ed8';
    return '#1e3a8a';
  };

  // Build grid data
  const gridData = metricsToShow.map(metric => {
    return {
      metric: metric.replace(/_/g, ' ').toUpperCase(),
      values: days.map(day => {
        const dayData = data.find(d => (d.date || d.day) === day);
        if (!dayData || !dayData[metric]) return null;
        const value = parseFloat(dayData[metric]);
        return {
          value,
          intensity: getNormalizedValue(metric, value)
        };
      })
    };
  });

  return (
    <div className="w-full overflow-x-auto">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <div className="inline-block min-w-full">
        {/* Header: Days */}
        <div className="flex">
          <div className="w-32 flex-shrink-0 py-2 px-2 bg-gray-100 border-b border-r border-gray-300">
            <span className="text-xs font-semibold text-gray-600">METRIC / DAY</span>
          </div>
          {days.map((day, index) => (
            <div
              key={index}
              className="w-12 flex-shrink-0 py-2 px-1 bg-gray-50 border-b border-gray-200 text-center"
            >
              <span className="text-xs text-gray-600 transform -rotate-45 inline-block w-full">
                {String(day).slice(-5)}
              </span>
            </div>
          ))}
        </div>

        {/* Grid: Metrics x Days */}
        {gridData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex hover:bg-gray-50">
            <div className="w-32 flex-shrink-0 py-3 px-2 bg-gray-50 border-b border-r border-gray-200">
              <span className="text-xs font-medium text-gray-700">{row.metric}</span>
            </div>
            {row.values.map((cell, colIndex) => (
              <div
                key={colIndex}
                className="w-12 h-12 flex-shrink-0 border-b border-r border-gray-200 relative group cursor-pointer transition-transform hover:scale-110"
                style={{ backgroundColor: cell ? getColor(cell.intensity) : '#f3f4f6' }}
                title={cell ? `${row.metric}: ${cell.value.toFixed(2)}` : 'No data'}
              >
                {/* Tooltip on hover */}
                {cell && (
                  <div className="absolute hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
                    {cell.value.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          <span className="text-xs text-gray-600">Low</span>
          <div className="flex gap-1">
            {[0, 20, 40, 60, 80].map(intensity => (
              <div
                key={intensity}
                className="w-8 h-4 rounded"
                style={{ backgroundColor: getColor(intensity) }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">High</span>
        </div>
      </div>
    </div>
  );
}
