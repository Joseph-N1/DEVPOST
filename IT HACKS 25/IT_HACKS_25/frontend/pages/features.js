'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import FeatureImportanceDashboard from '@/components/Analytics/FeatureImportance';

/**
 * Features Analytics Page
 * 
 * Displays comprehensive feature importance analysis including:
 * - Top features by global importance
 * - Room-specific feature rankings
 * - Temporal trends and stability
 * - Seasonal variations
 * - Side-by-side room comparisons
 */
export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [comparison, setComparison] = useState(null);
  const [room1, setRoom1] = useState(null);
  const [room2, setRoom2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60);

  useEffect(() => {
    fetchRooms();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (activeTab === 'compare' && room1 && room2) {
        fetchComparison(room1, room2);
      }
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, activeTab, room1, room2]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const fetchComparison = async (r1, r2) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/monitor/feature-importance/comparison?room_id_1=${r1}&room_id_2=${r2}&n_features=20`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setComparison(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (room1 && room2) {
      fetchComparison(room1, room2);
    }
  };

  const exportToCSV = () => {
    if (!comparison) return;

    const csv = [
      ['Feature', `Room ${room1}`, `Room ${room2}`, 'Difference'],
      ...comparison.map(item => [
        item.feature,
        item.score_1.toFixed(4),
        item.score_2.toFixed(4),
        item.difference.toFixed(4)
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-comparison-${room1}-${room2}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToJSON = () => {
    if (!comparison) return;

    const json = JSON.stringify({
      timestamp: new Date().toISOString(),
      room_1: room1,
      room_2: room2,
      comparison_data: comparison
    }, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-comparison-${room1}-${room2}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📊 Feature Importance Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and analyze which features are most important for model predictions
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Compare Rooms
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Global feature importance analysis showing which features contribute most to predictions.
                </p>
                <FeatureImportanceDashboard />
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="space-y-6">
                {/* Comparison Controls */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Compare Feature Importance Between Rooms
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Room 1
                      </label>
                      <select
                        value={room1 || ''}
                        onChange={(e) => setRoom1(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select a room...</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} (Room #{room.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Room 2
                      </label>
                      <select
                        value={room2 || ''}
                        onChange={(e) => setRoom2(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select a room...</option>
                        {rooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name} (Room #{room.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleCompare}
                        disabled={!room1 || !room2 || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {loading ? 'Loading...' : 'Compare'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comparison Results */}
                {comparison && (
                  <div className="space-y-4">
                    {/* Export Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export CSV
                      </button>
                      <button
                        onClick={exportToJSON}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export JSON
                      </button>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Feature
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Room {room1}
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Room {room2}
                            </th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                              Difference
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {comparison.slice(0, 15).map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {item.feature}
                              </td>
                              <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                {(item.score_1 * 100).toFixed(2)}%
                              </td>
                              <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                {(item.score_2 * 100).toFixed(2)}%
                              </td>
                              <td className="px-6 py-3 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                                {(item.difference * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {comparison.length > 15 && (
                        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-400">
                          Showing 15 of {comparison.length} features
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!comparison && !loading && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Select two rooms and click Compare to see feature importance differences
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Display Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          Auto-Refresh
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Automatically refresh data at intervals
                        </p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </label>
                    </div>

                    {autoRefresh && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Refresh Interval (seconds): {refreshInterval}
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="300"
                          step="10"
                          value={refreshInterval}
                          onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📖 About Feature Importance
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Feature importance shows how much each input variable contributes to model predictions.
                    Higher importance scores indicate features that have more influence on the prediction output.
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                    <li>Trends: Watch for increasing/decreasing importance over time</li>
                    <li>Stability: High stability means consistent feature relevance</li>
                    <li>Seasonal: Compare importance across different seasons</li>
                    <li>Room-Specific: Different rooms may have different important features</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    💡 Tips
                  </h4>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                    <li>Focus monitoring on top 3-5 features</li>
                    <li>Investigate sudden importance changes</li>
                    <li>Compare rooms to identify local differences</li>
                    <li>Use seasonal data to plan interventions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
