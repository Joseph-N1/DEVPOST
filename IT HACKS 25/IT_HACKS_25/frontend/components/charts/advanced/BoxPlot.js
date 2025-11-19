"use client";

import React from 'react';

/**
 * BoxPlot - Statistical distribution visualization
 * Shows min, Q1, median, Q3, max, and outliers for each room
 */
export default function BoxPlot({ data = [], metric = 'eggs_produced', title = "Statistical Distribution" }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for box plot
      </div>
    );
  }

  // Group data by room
  const roomGroups = {};
  data.forEach(row => {
    const room = row.room_id || 'Unknown';
    if (!roomGroups[room]) roomGroups[room] = [];
    const value = parseFloat(row[metric]);
    if (!isNaN(value)) roomGroups[room].push(value);
  });

  // Calculate statistics for each room
  const calculateStats = (values) => {
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const min = sorted[0];
    const max = sorted[n - 1];
    const median = n % 2 === 0 
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    
    return { min, q1, median, q3, max, outliers, mean, lowerFence, upperFence };
  };

  const boxPlotData = Object.entries(roomGroups).map(([room, values]) => ({
    room,
    stats: calculateStats(values),
    count: values.length
  })).filter(d => d.stats !== null);

  if (boxPlotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Insufficient data for box plot
      </div>
    );
  }

  // Find global min/max for scaling
  const allValues = boxPlotData.flatMap(d => [
    d.stats.min,
    d.stats.q1,
    d.stats.median,
    d.stats.q3,
    d.stats.max,
    ...d.stats.outliers
  ]);
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const range = globalMax - globalMin || 1;

  // Convert value to pixel position
  const valueToPosition = (value) => {
    return ((value - globalMin) / range) * 100;
  };

  const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6'];

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>
      )}
      
      <div className="space-y-8">
        {boxPlotData.map((item, index) => {
          const color = colors[index % colors.length];
          const stats = item.stats;
          
          return (
            <div key={item.room} className="relative">
              {/* Room label */}
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-gray-700 w-24">{item.room}</span>
                <span className="text-xs text-gray-500">n={item.count}</span>
              </div>
              
              {/* Box plot visualization */}
              <div className="relative h-16 bg-gray-50 rounded-lg border border-gray-200">
                {/* Whisker line (min to max) */}
                <div 
                  className="absolute top-1/2 h-0.5 bg-gray-400"
                  style={{
                    left: `${valueToPosition(stats.min)}%`,
                    width: `${valueToPosition(stats.max) - valueToPosition(stats.min)}%`
                  }}
                />
                
                {/* Box (Q1 to Q3) */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 h-12 rounded border-2 flex items-center"
                  style={{
                    left: `${valueToPosition(stats.q1)}%`,
                    width: `${valueToPosition(stats.q3) - valueToPosition(stats.q1)}%`,
                    backgroundColor: `${color}33`,
                    borderColor: color
                  }}
                >
                  {/* Median line */}
                  <div 
                    className="absolute h-full w-1 bg-white border-l-2"
                    style={{
                      left: `${((stats.median - stats.q1) / (stats.q3 - stats.q1)) * 100}%`,
                      borderColor: color
                    }}
                  />
                </div>
                
                {/* Mean marker */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white"
                  style={{
                    left: `${valueToPosition(stats.mean)}%`,
                    borderColor: color
                  }}
                  title={`Mean: ${stats.mean.toFixed(2)}`}
                />
                
                {/* Outliers */}
                {stats.outliers.map((outlier, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      left: `${valueToPosition(outlier)}%`,
                      backgroundColor: color
                    }}
                    title={`Outlier: ${outlier.toFixed(2)}`}
                  />
                ))}
              </div>
              
              {/* Statistics labels */}
              <div className="flex justify-between text-xs text-gray-600 mt-2 px-2">
                <span>Min: {stats.min.toFixed(1)}</span>
                <span>Q1: {stats.q1.toFixed(1)}</span>
                <span className="font-semibold">Median: {stats.median.toFixed(1)}</span>
                <span>Q3: {stats.q3.toFixed(1)}</span>
                <span>Max: {stats.max.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-12 h-6 border-2 border-blue-600 bg-blue-100 rounded"></div>
          <span>Box (Q1-Q3 range)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-6 bg-blue-600"></div>
          <span>Median line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white"></div>
          <span>Mean</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <span>Outlier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-0.5 bg-gray-400"></div>
          <span>Whiskers (min-max)</span>
        </div>
      </div>
    </div>
  );
}
