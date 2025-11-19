"use client";

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

/**
 * ScatterPlot - Shows relationship between two metrics with regression line
 */
export default function ScatterPlot({ 
  data = [], 
  xKey = 'feed_kg_total',
  yKey = 'avg_weight_kg',
  xLabel = 'Feed Intake (kg)',
  yLabel = 'Average Weight (kg)',
  title = "Scatter Plot",
  showRegressionLine = true
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for scatter plot
      </div>
    );
  }

  // Prepare data for scatter plot
  const scatterData = data
    .map(d => ({
      x: parseFloat(d[xKey]),
      y: parseFloat(d[yKey]),
      room: d.room_id || 'Unknown',
      date: d.date || ''
    }))
    .filter(d => !isNaN(d.x) && !isNaN(d.y));

  // Calculate linear regression
  const calculateRegression = () => {
    if (scatterData.length < 2) return null;

    const n = scatterData.length;
    const sumX = scatterData.reduce((sum, p) => sum + p.x, 0);
    const sumY = scatterData.reduce((sum, p) => sum + p.y, 0);
    const sumXY = scatterData.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = scatterData.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const regression = showRegressionLine ? calculateRegression() : null;

  // Generate regression line points
  const regressionLine = regression ? [
    { x: Math.min(...scatterData.map(d => d.x)), y: 0 },
    { x: Math.max(...scatterData.map(d => d.x)), y: 0 }
  ].map(point => ({
    x: point.x,
    y: regression.slope * point.x + regression.intercept
  })) : [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-800">{data.room}</p>
          <p className="text-sm text-gray-600">{xLabel}: {data.x.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{yLabel}: {data.y.toFixed(2)}</p>
          {data.date && <p className="text-xs text-gray-500 mt-1">{data.date}</p>}
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
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xLabel}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#374151' } }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={yLabel}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#374151' } }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          
          {/* Scatter points */}
          <Scatter 
            name="Data Points" 
            data={scatterData} 
            fill="#3b82f6"
            fillOpacity={0.6}
            stroke="#1e40af"
            strokeWidth={1}
          />
          
          {/* Regression line */}
          {showRegressionLine && regressionLine.length > 0 && (
            <Scatter 
              name={`Trend (y = ${regression.slope.toFixed(2)}x + ${regression.intercept.toFixed(2)})`}
              data={regressionLine}
              fill="none"
              line={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' }}
              shape={() => null}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
      
      {regression && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            <span className="font-semibold">Regression Equation:</span> y = {regression.slope.toFixed(3)}x + {regression.intercept.toFixed(3)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {regression.slope > 0 ? 'Positive' : 'Negative'} correlation: 
            As {xLabel.toLowerCase()} increases, {yLabel.toLowerCase()} {regression.slope > 0 ? 'increases' : 'decreases'}
          </p>
        </div>
      )}
    </div>
  );
}
