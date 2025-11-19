"use client";

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { getAnomalies, getMetricExplanation } from '@/utils/api';

/**
 * DrillDownModal - Interactive deep-dive into clicked chart elements
 * Shows:
 * - Raw values
 * - AI explanations
 * - Anomalies
 * - Historical comparison
 * - Recommendations
 */
export default function DrillDownModal({ 
  isOpen, 
  onClose, 
  data = null, 
  metric = null,
  room = null,
  allData = []
}) {
  const [aiExplanation, setAiExplanation] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data && metric) {
      fetchDrillDownData();
    }
  }, [isOpen, data, metric, room]);

  const fetchDrillDownData = async () => {
    setLoading(true);
    
    try {
      // Fetch AI explanation
      if (metric && data[metric]) {
        const explanation = await getMetricExplanation(
          metric,
          data[metric],
          0, // We'll calculate change
          room
        );
        setAiExplanation(explanation);
      }

      // Fetch anomalies for this room/metric
      const anomalyResults = await getAnomalies(null, 0.1);
      if (anomalyResults && anomalyResults.anomalies) {
        const relevantAnomalies = anomalyResults.anomalies.filter(
          a => a.room_id === room && a.metric.toLowerCase().includes(metric.replace(/_/g, ' '))
        );
        setAnomalies(relevantAnomalies);
      }

      // Extract historical data for this room and metric
      if (allData && allData.length > 0 && room) {
        const roomData = allData
          .filter(d => d.room_id === room)
          .sort((a, b) => new Date(a.date || a.age_days) - new Date(b.date || b.age_days))
          .slice(-30); // Last 30 data points
        setHistoricalData(roomData);
      }
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate statistics
  const calculateStats = () => {
    if (!historicalData || historicalData.length === 0 || !metric) return null;

    const values = historicalData
      .map(d => parseFloat(d[metric]))
      .filter(v => !isNaN(v));

    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Calculate trend
    const recent = values.slice(-7);
    const older = values.slice(-14, -7);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

    return { mean, min, max, median, trend, current: values[values.length - 1] };
  };

  const stats = calculateStats();

  // Historical chart data
  const historicalChartData = {
    labels: historicalData.map(d => d.date || d.age_days || '').slice(-15),
    datasets: [{
      label: metric.replace(/_/g, ' ').toUpperCase(),
      data: historicalData.map(d => d[metric]).slice(-15),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info size={24} />
              Drill-Down Analysis
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              {room} • {metric?.replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Current</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.current.toFixed(2)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Average</p>
                  <p className="text-2xl font-bold text-green-600">{stats.mean.toFixed(2)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Range</p>
                  <p className="text-lg font-bold text-purple-600">
                    {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
                  </p>
                </div>
                
                <div className={`bg-gradient-to-br p-4 rounded-lg border ${
                  stats.trend > 0 
                    ? 'from-green-50 to-white border-green-200' 
                    : 'from-red-50 to-white border-red-200'
                }`}>
                  <p className="text-xs text-gray-600 uppercase font-semibold">7-Day Trend</p>
                  <p className={`text-2xl font-bold flex items-center gap-1 ${
                    stats.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {Math.abs(stats.trend).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Historical Chart */}
            {historicalData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Historical Trend (Last 15 Points)</h3>
                <div style={{ height: '250px' }}>
                  <Line 
                    data={historicalChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          titleFont: { size: 14 },
                          bodyFont: { size: 13 },
                          cornerRadius: 8
                        }
                      },
                      scales: {
                        y: { beginAtZero: true },
                        x: { ticks: { maxTicksLimit: 10 } }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <Info size={20} />
                  AI Insights
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">What This Means:</p>
                    <p className="text-sm text-gray-700 mt-1">{aiExplanation.meaning}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Analysis:</p>
                    <p className="text-sm text-gray-700 mt-1">{aiExplanation.explanation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Recommended Action:</p>
                    <p className="text-sm text-gray-700 mt-1">{aiExplanation.recommended_action}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Anomalies */}
            {anomalies.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Detected Anomalies ({anomalies.length})
                </h3>
                <div className="space-y-3">
                  {anomalies.slice(0, 3).map((anomaly, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{anomaly.date}</span>
                      </div>
                      <p className="text-sm text-gray-700">{anomaly.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data */}
            {data && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Raw Values</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(data).map(([key, value]) => {
                    if (typeof value === 'number' || !isNaN(value)) {
                      return (
                        <div key={key} className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-600 uppercase">{key.replace(/_/g, ' ')}</p>
                          <p className="text-lg font-semibold text-gray-800">{value}</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
