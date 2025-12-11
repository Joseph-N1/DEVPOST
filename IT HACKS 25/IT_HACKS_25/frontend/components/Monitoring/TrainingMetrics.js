import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrainingMetrics({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Training History (Last 7 Days)
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No training data available
        </div>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = data.map((item, idx) => ({
    name: item.version || `Model ${idx + 1}`,
    mae: item.metrics?.mae || 0,
    rmse: item.metrics?.rmse || 0,
    r2: (item.metrics?.r2 || 0) * 100,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Training History
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis yAxisId="left" label={{ value: 'MAE / RMSE', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'R² %', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              color: '#f3f4f6'
            }}
            formatter={(value) => value.toFixed(4)}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="mae" stroke="#ef4444" strokeWidth={2} name="MAE" />
          <Line yAxisId="left" type="monotone" dataKey="rmse" stroke="#f97316" strokeWidth={2} name="RMSE" />
          <Line yAxisId="right" type="monotone" dataKey="r2" stroke="#22c55e" strokeWidth={2} name="R² %" />
        </LineChart>
      </ResponsiveContainer>

      {/* Metrics Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data[0] && (
          <>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Latest MAE</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data[0].metrics?.mae?.toFixed(4)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Latest RMSE</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data[0].metrics?.rmse?.toFixed(4)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Latest R²</p>
              <p className="text-lg font-bold text-green-600">
                {(data[0].metrics?.r2 * 100).toFixed(1)}%
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
