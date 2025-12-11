import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PredictionStats({ data = {} }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Prediction Statistics (24h)
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No prediction data available
        </div>
      </div>
    );
  }

  const byEndpoint = data.by_endpoint || {};
  const successRate = data.success_rate || 0;
  const avgLatency = data.avg_latency_ms || 0;
  const p95Latency = data.p95_latency_ms || 0;
  const totalPredictions = data.total_predictions || 0;

  // Prepare endpoint data for pie chart
  const endpointData = Object.entries(byEndpoint).map(([endpoint, stats]) => ({
    name: endpoint.charAt(0).toUpperCase() + endpoint.slice(1),
    value: stats.count || 0,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Prediction Statistics (Last 24h)
      </h3>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">Total Predictions</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{totalPredictions.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">Success Rate</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-200">{successRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Latency Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-semibold">Avg Latency</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">{avgLatency.toFixed(0)}ms</p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold">P95 Latency</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-200">{p95Latency.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Endpoint Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">By Endpoint</h4>
        <div className="space-y-2">
          {Object.entries(byEndpoint).map(([endpoint, stats], idx) => (
            <div
              key={endpoint}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></div>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {endpoint}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {stats.count} requests
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stats.avg_latency?.toFixed(0)}ms avg
                  </p>
                </div>
                <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded">
                  {stats.success_rate?.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart */}
      {endpointData.length > 0 && (
        <div className="mt-6 flex justify-center">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              <Pie
                data={endpointData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {endpointData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  color: '#f3f4f6'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
