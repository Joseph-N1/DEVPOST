import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';

export const TrendAnalysis = ({ data }) => {
  if (!data?.metrics || Object.keys(data.metrics).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trend Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trend Analysis</h2>

      <div className="space-y-4">
        {Object.entries(data.metrics).map(([metric, trend]) => (
          <div key={metric} className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {metric.replace(/_/g, ' ')}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Direction</p>
                <p className="font-bold text-gray-900 dark:text-white capitalize">
                  {trend.direction}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Slope</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {trend.slope?.toFixed(3) || 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">R²</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {(trend.r_squared * 100)?.toFixed(1) || 0}%
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Velocity</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {trend.velocity?.toFixed(2) || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnomalyStats = ({ data }) => {
  const stats = data?.statistics || {};

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Anomaly Statistics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Anomalies</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total_count || 0}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Frequency</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {stats.frequency || 'N/A'}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(stats.average_score * 100)?.toFixed(1) || 0}%
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 rounded p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Top Metric</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {stats.top_metric || 'N/A'}
          </p>
        </div>
      </div>

      {/* Severity Distribution */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">By Severity</h3>
        <div className="space-y-2">
          {['high', 'medium', 'low'].map((level) => (
            <div key={level} className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                level === 'high' ? 'bg-red-500' :
                level === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <span className="capitalize text-gray-700 dark:text-gray-300 flex-1">
                {level}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {stats.by_severity?.[level] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PerformanceMetrics = ({ data }) => {
  const metrics = data?.metrics || {};

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Performance Metrics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {metrics.mae !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">MAE</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.mae?.toFixed(3) || 0}
            </p>
          </div>
        )}

        {metrics.rmse !== undefined && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">RMSE</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.rmse?.toFixed(3) || 0}
            </p>
          </div>
        )}

        {metrics.r_squared !== undefined && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">R²</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(metrics.r_squared * 100)?.toFixed(1) || 0}%
            </p>
          </div>
        )}

        {metrics.mape !== undefined && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">MAPE</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metrics.mape?.toFixed(1) || 0}%
            </p>
          </div>
        )}

        {metrics.success_rate !== undefined && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.success_rate?.toFixed(1) || 0}%
            </p>
          </div>
        )}

        {metrics.avg_latency_ms !== undefined && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Latency</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.avg_latency_ms?.toFixed(0) || 0}ms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CorrelationMatrix = ({ data }) => {
  const pairs = data?.correlations?.pairs || [];

  if (pairs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Metric Correlations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">No strong correlations found (|r| &gt; 0.5)</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Metric Correlations
      </h2>

      <div className="space-y-3">
        {pairs.map((pair, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {pair.metric1?.replace(/_/g, ' ')} ↔ {pair.metric2?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className={`text-lg font-bold ${
              pair.correlation > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(pair.correlation * 100)?.toFixed(0) || 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimeSeriesForecast = ({ data }) => {
  const forecast = data?.forecast;

  if (!forecast?.forecast || forecast.forecast.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Time Series Forecast</h2>
        <p className="text-gray-600 dark:text-gray-400">No forecast data available</p>
      </div>
    );
  }

  const chartData = forecast.forecast.map((value, idx) => ({
    period: `+${idx + 1}d`,
    forecast: value,
    lower: forecast.confidence_interval?.lower?.[idx] || value,
    upper: forecast.confidence_interval?.upper?.[idx] || value
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {data.metric_name?.replace(/_/g, ' ')} Forecast
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="period" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#3b82f6"
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Forecast"
          />
          <Line
            type="monotone"
            dataKey="upper"
            stroke="#9ca3af"
            strokeDasharray="5 5"
            dot={false}
            name="Upper Bound"
          />
          <Line
            type="monotone"
            dataKey="lower"
            stroke="#9ca3af"
            strokeDasharray="5 5"
            dot={false}
            name="Lower Bound"
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Method: {forecast.method || 'exponential_smoothing'}
      </p>
    </div>
  );
};

export const ExportReport = ({ farmId, roomId, days, onRefresh }) => {
  const handleExport = async (format) => {
    try {
      const response = await fetch(
        `/api/analytics/export?farm_id=${farmId}&room_id=${roomId}&days=${days}&format=${format}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().getTime()}.${format}`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Export Report</h2>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Generate and download a comprehensive report in your preferred format.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          📊 Export as CSV
        </button>

        <button
          onClick={() => handleExport('json')}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          📄 Export as JSON
        </button>

        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          📋 Export as PDF
        </button>
      </div>
    </div>
  );
};

export default {
  TrendAnalysis,
  AnomalyStats,
  PerformanceMetrics,
  CorrelationMatrix,
  TimeSeriesForecast,
  ExportReport
};
