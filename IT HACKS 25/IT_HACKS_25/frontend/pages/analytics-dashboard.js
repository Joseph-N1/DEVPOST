import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Navbar from '../components/ui/Navbar';
import TrendAnalysis from '../components/Analytics/TrendAnalysis';
import AnomalyStats from '../components/Analytics/AnomalyStats';
import PerformanceMetrics from '../components/Analytics/PerformanceMetrics';
import CorrelationMatrix from '../components/Analytics/CorrelationMatrix';
import TimeSeriesForecast from '../components/Analytics/TimeSeriesForecast';
import ExportReport from '../components/Analytics/ExportReport';

export default function AnalyticsDashboard() {
  const [farmId, setFarmId] = useState(1);
  const [roomId, setRoomId] = useState(null);
  const [days, setDays] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [trends, setTrends] = useState(null);
  const [anomalyStats, setAnomalyStats] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [correlations, setCorrelations] = useState(null);
  const [forecast, setForecast] = useState(null);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      // Build query parameters
      let params = `days=${days}`;
      if (farmId) params += `&farm_id=${farmId}`;
      if (roomId) params += `&room_id=${roomId}`;

      // Parallel requests
      const [trendsRes, anomalyRes, perfRes, corrRes, forecastRes] = await Promise.all([
        fetch(`/api/analytics/trends?${params}`, { headers }),
        fetch(`/api/analytics/anomaly-stats?${params}`, { headers }),
        fetch(`/api/analytics/performance?${params}`, { headers }),
        fetch(`/api/analytics/correlations?${params}`, { headers }),
        fetch(`/api/analytics/forecasts?room_id=${roomId || 1}&metric_name=temperature_c&periods=7&${params}`, { headers })
      ]);

      if (!trendsRes.ok || !anomalyRes.ok || !perfRes.ok || !corrRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [trendsData, anomalyData, perfData, corrData, forecastData] = await Promise.all([
        trendsRes.json(),
        anomalyRes.json(),
        perfRes.json(),
        corrRes.json(),
        forecastRes.json().catch(() => ({ forecast: null }))
      ]);

      setTrends(trendsData);
      setAnomalyStats(anomalyData);
      setPerformance(perfData);
      setCorrelations(corrData);
      setForecast(forecastData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [farmId, roomId, days]);

  // Initial load
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalyticsData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        fetchAnalyticsData();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fetchAnalyticsData]);

  const handleExportCSV = () => {
    // Export data to CSV
    const data = {
      trends,
      anomalyStats,
      performance,
      correlations
    };
    const csv = JSON.stringify(data, null, 2);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced insights and trend analysis
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Farm ID
              </label>
              <input
                type="number"
                value={farmId}
                onChange={(e) => setFarmId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room ID (Optional)
              </label>
              <input
                type="number"
                value={roomId || ''}
                onChange={(e) => setRoomId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days
              </label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Refresh
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enabled</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interval (sec)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                disabled={!autoRefresh}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Export Data
            </button>
          </div>

          {lastUpdate && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Last updated: {format(lastUpdate, 'PPpp')}
            </p>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {/* Analytics Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trends */}
          {trends && <TrendAnalysis data={trends} />}

          {/* Anomaly Stats */}
          {anomalyStats && <AnomalyStats data={anomalyStats} />}

          {/* Performance Metrics */}
          {performance && <PerformanceMetrics data={performance} />}

          {/* Correlations */}
          {correlations && <CorrelationMatrix data={correlations} />}
        </div>

        {/* Full-width components */}
        <div className="grid grid-cols-1 gap-8">
          {/* Forecast */}
          {forecast && <TimeSeriesForecast data={forecast} />}

          {/* Export Report */}
          <ExportReport
            farmId={farmId}
            roomId={roomId}
            days={days}
            onRefresh={fetchAnalyticsData}
          />
        </div>
      </div>
    </div>
  );
}
