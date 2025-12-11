import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import apiClient from '../lib/apiClient';
import TrainingMetrics from '../components/Monitoring/TrainingMetrics';
import ModelComparison from '../components/Monitoring/ModelComparison';
import SystemHealth from '../components/Monitoring/SystemHealth';
import PredictionStats from '../components/Monitoring/PredictionStats';
import { TopFeaturesChart, FeatureImportanceMetrics } from '../components/Analytics/FeatureImportance';

export default function MonitorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds
  const [lastUpdate, setLastUpdate] = useState(null);

  const [trainingHistory, setTrainingHistory] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [predictionStats, setPredictionStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [modelComparison, setModelComparison] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);

  // Fetch all monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [historyRes, activeRes, statsRes, healthRes, comparisonRes, featuresRes] = await Promise.all([
        apiClient.get('/monitor/training-history?limit=10'),
        apiClient.get('/monitor/active-model'),
        apiClient.get('/monitor/prediction-stats?hours=24'),
        apiClient.get('/monitor/system-health'),
        apiClient.get('/monitor/model-comparison?limit=5'),
        apiClient.get('/monitor/feature-importance?days=7&n_features=10'),
      ]);

      setTrainingHistory(historyRes.data?.data || []);
      setActiveModel(activeRes.data?.model || null);
      setPredictionStats(statsRes.data?.data || null);
      setSystemHealth(healthRes.data?.data || null);
      setModelComparison(comparisonRes.data?.data || null);
      setFeatureImportance(featuresRes.data?.data || []);
      setLastUpdate(new Date());
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch monitoring data');
      }
      setLoading(false);
    }
  }, [router]);

  // Initial data fetch
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  // Keyboard shortcut for refresh
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        fetchMonitoringData();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fetchMonitoringData]);

  if (loading && !trainingHistory.length) {
    return (
      <>
        <Head>
          <title>Model Monitoring Dashboard - ECO FARM</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-green-500 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading monitoring data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Model Monitoring Dashboard - ECO FARM</title>
        <meta name="description" content="Real-time model monitoring and performance dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Model Monitoring Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Real-time performance metrics and system health
                </p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdate && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
                <button
                  onClick={() => fetchMonitoringData()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                  title="Refresh (Ctrl+R)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Active Model Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Model
              </h3>
              {activeModel ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {activeModel.version}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {activeModel.model_type?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">R² Score:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {(activeModel.metrics?.r2 * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No active model</p>
              )}
            </div>

            {/* Avg MAE Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Avg MAE
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {activeModel?.metrics?.mae?.toFixed(4) || '0'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Mean Absolute Error
              </p>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Success Rate
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {predictionStats?.success_rate?.toFixed(1) || '0'}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Last 24 hours
              </p>
            </div>
          </div>

          {/* Middle Row - Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Training Metrics */}
            <TrainingMetrics data={trainingHistory} />

            {/* Model Comparison */}
            <ModelComparison data={modelComparison} />
          </div>

          {/* Bottom Row - System Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* System Health */}
            <SystemHealth data={systemHealth} />

            {/* Prediction Stats */}
            <PredictionStats data={predictionStats} />
          </div>

          {/* Feature Importance Section */}
          <div className="mt-8">
            <FeatureImportanceMetrics topFeatures={featureImportance} />
          </div>
          
          <div className="mt-8 mb-8">
            <TopFeaturesChart data={featureImportance} loading={false} error={null} />
          </div>
        </div>
      </div>
    </>
  );
}
