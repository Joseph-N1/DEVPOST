"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

/**
 * StackedAreaChart - Shows how multiple metrics contribute to total over time
 */
export default function StackedAreaChart({ 
  data = [], 
  metrics = [],
  xKey = 'date',
  title = "Stacked Area Chart",
  showLegend = true
}) {
  if (!data || data.length === 0 || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for stacked area chart
      </div>
    );
  }

  const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.reverse().map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">{entry.name}:</span>
              </div>
              <span className="font-semibold text-gray-800">{entry.value.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-semibold">
            <span>Total:</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey={xKey}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(value) => {
              // Format date if it looks like a date
              if (value && typeof value === 'string' && value.includes('-')) {
                return value.slice(-5); // Show last 5 chars (MM-DD)
              }
              return value;
            }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          
          {metrics.map((metric, index) => (
            <Area
              key={metric.key || metric}
              type="monotone"
              dataKey={metric.key || metric}
              name={metric.label || metric}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.7}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
