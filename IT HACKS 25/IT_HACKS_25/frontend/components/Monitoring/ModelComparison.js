import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModelComparison({ data = {} }) {
  const models = data?.models || [];
  
  if (!models || models.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Model Comparison
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No models available for comparison
        </div>
      </div>
    );
  }

  // Prepare data for chart (top 5 models)
  const chartData = models.slice(0, 5).map((model) => ({
    name: model.version || 'Unknown',
    mae: model.metrics?.mae || 0,
    rmse: model.metrics?.rmse || 0,
    r2: (model.metrics?.r2 || 0) * 100,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Model Comparison (Top {models.length} Models)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
            formatter={(value) => value.toFixed(2)}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="mae" fill="#ef4444" name="MAE" radius={[8, 8, 0, 0]} />
          <Bar yAxisId="left" dataKey="rmse" fill="#f97316" name="RMSE" radius={[8, 8, 0, 0]} />
          <Bar yAxisId="right" dataKey="r2" fill="#22c55e" name="R² %" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Models List */}
      <div className="mt-6 space-y-2">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Ranked Models
        </div>
        {models.slice(0, 5).map((model, idx) => (
          <div
            key={idx}
            className={`p-3 rounded flex justify-between items-center ${
              model.is_active 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900 dark:text-white w-6">#{model.rank}</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{model.version}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {model.type?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  R²: {(model.metrics?.r2 * 100).toFixed(1)}%
                </p>
              </div>
              {model.is_active && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                  ACTIVE
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {models.length > 5 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Showing top 5 of {models.length} models
        </p>
      )}
    </div>
  );
}
