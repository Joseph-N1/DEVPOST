"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react';
import useFilterStore from '@/store/filterStore';
import RadarChart from '@/components/charts/advanced/RadarChart';
import { Line, Bar } from 'react-chartjs-2';

/**
 * MultiRoomComparison - Major Feature: Interactive Multi-Room Comparison Dashboard
 * Features:
 * - Multi-select room dropdown
 * - Dynamic chart generator  
 * - Comparison table with trends
 * - Metric correlation section
 * - Room ranking widgets
 */
export default function MultiRoomComparison({ data = [] }) {
  const {
    selectedRooms,
    selectedMetrics,
    availableRooms,
    availableMetrics,
    toggleRoom,
    toggleMetric,
    selectAllRooms,
    clearRoomSelection
  } = useFilterStore();

  const [comparisonData, setComparisonData] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'radar'
  const [showRankings, setShowRankings] = useState(true);

  useEffect(() => {
    if (selectedRooms.length > 0 && selectedMetrics.length > 0 && data.length > 0) {
      generateComparisonData();
    }
  }, [selectedRooms, selectedMetrics, data]);

  const generateComparisonData = () => {
    const chartData = {
      labels: [],
      datasets: []
    };

    const colors = [
      '#3b82f6', // blue
      '#22c55e', // green
      '#f97316', // orange
      '#a855f7', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#eab308', // yellow
      '#f43f5e'  // rose
    ];

    // For each selected metric and room, create a dataset
    selectedMetrics.forEach((metricKey, metricIndex) => {
      selectedRooms.forEach((room, roomIndex) => {
        const roomData = data.filter(d => d.room_id === room).slice(-30); // Last 30 points
        
        if (roomData.length > 0) {
          const colorIndex = (metricIndex * selectedRooms.length + roomIndex) % colors.length;
          
          chartData.datasets.push({
            label: `${room} - ${availableMetrics.find(m => m.key === metricKey)?.label || metricKey}`,
            data: roomData.map(d => d[metricKey]),
            borderColor: colors[colorIndex],
            backgroundColor: `${colors[colorIndex]}33`,
            fill: chartType === 'line',
            tension: 0.4
          });

          if (chartData.labels.length === 0) {
            chartData.labels = roomData.map(d => d.date || d.age_days || '');
          }
        }
      });
    });

    setComparisonData(chartData);
  };

  // Generate radar chart data for performance profile
  const generateRadarData = () => {
    if (selectedRooms.length === 0) return [];

    const radarMetrics = ['eggs_produced', 'avg_weight_kg', 'fcr', 'mortality_rate'];
    
    return radarMetrics.map(metric => {
      const metricData = { metric: metric.replace(/_/g, ' ').toUpperCase() };
      
      selectedRooms.forEach(room => {
        const roomData = data.filter(d => d.room_id === room);
        if (roomData.length > 0) {
          const values = roomData.map(d => parseFloat(d[metric])).filter(v => !isNaN(v));
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          
          // Normalize to 0-100 scale
          const normalized = metric === 'mortality_rate' 
            ? Math.max(0, 100 - (avg * 20)) // Lower is better
            : Math.min(100, (avg / (metric === 'fcr' ? 5 : metric === 'avg_weight_kg' ? 3 : 300)) * 100);
          
          metricData[room] = normalized;
        }
      });
      
      return metricData;
    });
  };

  // Calculate room rankings
  const calculateRankings = () => {
    if (selectedRooms.length === 0) return [];

    const rankings = selectedRooms.map(room => {
      const roomData = data.filter(d => d.room_id === room);
      
      if (roomData.length === 0) return { room, score: 0, metrics: {} };

      const recent = roomData.slice(-7); // Last 7 days
      
      const metrics = {
        eggs: recent.reduce((sum, d) => sum + (d.eggs_produced || 0), 0) / recent.length,
        weight: recent.reduce((sum, d) => sum + (d.avg_weight_kg || 0), 0) / recent.length,
        fcr: recent.reduce((sum, d) => sum + (d.fcr || 0), 0) / recent.length,
        mortality: recent.reduce((sum, d) => sum + (d.mortality_rate || 0), 0) / recent.length
      };

      // Calculate overall score (0-100)
      const score = (
        (metrics.eggs / 300) * 30 +
        (metrics.weight / 3) * 25 +
        (Math.max(0, 5 - metrics.fcr) / 5) * 25 +
        (Math.max(0, 10 - metrics.mortality) / 10) * 20
      );

      return { room, score, metrics };
    });

    return rankings.sort((a, b) => b.score - a.score);
  };

  const rankings = calculateRankings();
  const radarData = generateRadarData();

  // Calculate trend direction for table
  const getTrend = (room, metric) => {
    const roomData = data.filter(d => d.room_id === room);
    if (roomData.length < 7) return 0;

    const recent = roomData.slice(-3).reduce((sum, d) => sum + (d[metric] || 0), 0) / 3;
    const older = roomData.slice(-7, -3).reduce((sum, d) => sum + (d[metric] || 0), 0) / 4;
    
    if (Math.abs(recent - older) < 0.1) return 0;
    return recent > older ? 1 : -1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Multi-Room Comparison Dashboard</h2>
        <p className="text-blue-100">Compare performance metrics across all rooms simultaneously</p>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        {/* Room Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">
              Select Rooms ({selectedRooms.length} selected)
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAllRooms}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearRoomSelection}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableRooms.map(room => (
              <button
                key={room}
                onClick={() => toggleRoom(room)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRooms.includes(room)
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Metrics ({selectedMetrics.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map(metric => (
              <button
                key={metric.key}
                onClick={() => toggleMetric(metric.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedMetrics.includes(metric.key)
                    ? 'bg-green-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{metric.emoji}</span>
                <span>{metric.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Chart Type:</span>
          <div className="flex gap-2">
            {['line', 'bar', 'radar'].map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  chartType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {selectedRooms.length > 0 && selectedMetrics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Comparison Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Performance Comparison Chart
            </h3>
            {comparisonData && chartType !== 'radar' && (
              <div style={{ height: '400px' }}>
                {chartType === 'line' ? (
                  <Line
                    data={comparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                          mode: 'index',
                          intersect: false
                        }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                ) : (
                  <Bar
                    data={comparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                )}
              </div>
            )}
            {chartType === 'radar' && radarData.length > 0 && (
              <RadarChart data={radarData} title="Performance Profile Comparison" />
            )}
          </div>

          {/* Room Rankings */}
          {showRankings && rankings.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                Room Rankings
              </h3>
              <div className="space-y-3">
                {rankings.map((rank, index) => (
                  <div
                    key={rank.room}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? 'bg-yellow-50 border-yellow-400' :
                      index === 1 ? 'bg-gray-50 border-gray-400' :
                      index === 2 ? 'bg-orange-50 border-orange-400' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-gray-800">{rank.room}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {rank.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Eggs:</span> 
                        <span className="font-semibold ml-1">{rank.metrics.eggs.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Weight:</span> 
                        <span className="font-semibold ml-1">{rank.metrics.weight.toFixed(2)}kg</span>
                      </div>
                      <div>
                        <span className="text-gray-600">FCR:</span> 
                        <span className="font-semibold ml-1">{rank.metrics.fcr.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mortality:</span> 
                        <span className="font-semibold ml-1">{rank.metrics.mortality.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Metric Comparison Table</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                    {selectedMetrics.slice(0, 4).map(metric => (
                      <th key={metric} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        {availableMetrics.find(m => m.key === metric)?.label || metric}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedRooms.map(room => {
                    const roomData = data.filter(d => d.room_id === room);
                    const recent = roomData.slice(-7);
                    
                    return (
                      <tr key={room} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-800">{room}</td>
                        {selectedMetrics.slice(0, 4).map(metric => {
                          const avg = recent.reduce((sum, d) => sum + (d[metric] || 0), 0) / recent.length;
                          const trend = getTrend(room, metric);
                          
                          return (
                            <td key={metric} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">{avg.toFixed(2)}</span>
                                {trend === 1 && <TrendingUp size={16} className="text-green-600" />}
                                {trend === -1 && <TrendingDown size={16} className="text-red-600" />}
                                {trend === 0 && <Minus size={16} className="text-gray-400" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-lg">
            Please select at least one room and one metric to generate comparison charts
          </p>
        </div>
      )}
    </div>
  );
}
