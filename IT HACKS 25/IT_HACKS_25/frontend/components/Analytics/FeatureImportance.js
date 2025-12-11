'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * TopFeaturesChart - Horizontal bar chart of top features by importance
 */
export const TopFeaturesChart = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading top features...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Error loading features: {error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No feature importance data available</p>
      </div>
    );
  }

  // Sort by importance descending
  const sortedData = [...data].sort((a, b) => b.importance_score - a.importance_score);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Features by Importance</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" domain={[0, 1]} />
          <YAxis dataKey="feature_name" type="category" width={180} tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value) => value ? value.toFixed(4) : 'N/A'}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f3f4f6' }}
          />
          <Bar dataKey="importance_score" fill="#3b82f6" radius={[0, 8, 8, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.trend === 'increasing' ? '#10b981' : entry.trend === 'decreasing' ? '#ef4444' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {sortedData.slice(0, 3).map((feature, idx) => (
          <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Rank #{feature.rank}</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{feature.feature_name}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">{(feature.importance_score * 100).toFixed(2)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * FeatureImportanceTrend - Line chart showing feature importance over time
 */
export const FeatureImportanceTrend = ({ data, loading, error, featureName }) => {
  if (loading) {
    return (
      <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading trend data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Error loading trend: {error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Importance Trend: {featureName}
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} label={{ value: 'Importance Score', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value) => value ? value.toFixed(4) : 'N/A'}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f3f4f6' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * FeatureComparison - Compare feature importance across rooms or time periods
 */
export const FeatureComparison = ({ data, loading, error, label1, label2 }) => {
  if (loading) {
    return (
      <div className="h-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Error loading comparison: {error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No comparison data available</p>
      </div>
    );
  }

  // Get top differences
  const topDifferences = [...data]
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Feature Comparison: {label1} vs {label2}
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={topDifferences}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="feature" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
          <YAxis label={{ value: 'Difference', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value) => value ? value.toFixed(4) : 'N/A'}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#f3f4f6' }}
          />
          <Legend wrapperStyle={{ color: '#6b7280' }} />
          <Bar dataKey="score_1" fill="#3b82f6" name={`${label1} Score`} />
          <Bar dataKey="score_2" fill="#ef4444" name={`${label2} Score`} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Showing top {topDifferences.length} features by difference</p>
      </div>
    </div>
  );
};

/**
 * SeasonalImportance - Show feature importance by season
 */
export const SeasonalImportance = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="h-80 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading seasonal data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">Error loading seasonal data: {error}</p>
      </div>
    );
  }

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const seasonColors = {
    Spring: '#10b981',
    Summer: '#fbbf24',
    Fall: '#f97316',
    Winter: '#3b82f6'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {seasons.map(season => (
        <div key={season} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div 
            className="h-1 rounded-full mb-3"
            style={{ backgroundColor: seasonColors[season] }}
          />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{season}</h4>
          
          <div className="space-y-2">
            {(data[season] || []).slice(0, 5).map((feature, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate">{feature.feature_name}</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(feature.importance_score || 0) * 100}%`,
                        backgroundColor: seasonColors[season]
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                    {((feature.importance_score || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {(!data[season] || data[season].length === 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">No data available</p>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * FeatureStabilityIndicator - Show stability and trend for a feature
 */
export const FeatureStabilityIndicator = ({ feature, stability, trend }) => {
  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-blue-500" />;
  };

  const getTrendLabel = () => {
    const labels = {
      'increasing': 'Growing in importance',
      'decreasing': 'Declining in importance',
      'stable': 'Stable importance'
    };
    return labels[trend] || 'Unknown trend';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{feature}</h4>
        {getTrendIcon()}
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Stability Score</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {(stability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${stability * 100}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400">
          {getTrendLabel()}
        </div>
      </div>
    </div>
  );
};

/**
 * FeatureImportanceMetrics - Summary metrics for feature importance
 */
export const FeatureImportanceMetrics = ({ topFeatures, stability, trend }) => {
  const topFeature = topFeatures && topFeatures.length > 0 ? topFeatures[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Feature</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
          {topFeature?.feature_name || 'N/A'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Importance: {topFeature ? (topFeature.importance_score * 100).toFixed(2) : 0}%
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Features</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {topFeatures?.length || 0}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tracked</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stability</p>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {stability ? (stability * 100).toFixed(1) : 0}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Consistency</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trend</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
          {trend || 'Stable'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Direction</p>
      </div>
    </div>
  );
};

/**
 * FeatureImportanceDashboard - Main component combining all views
 */
export default function FeatureImportanceDashboard() {
  const [topFeatures, setTopFeatures] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [seasonalData, setSeasonalData] = useState({});
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeatureImportance();
  }, [days, selectedRoom, selectedFeature]);

  const fetchFeatureImportance = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top features
      const featuresRes = await fetch(
        `/api/monitor/feature-importance?room_id=${selectedRoom || ''}&days=${days}&n_features=20`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setTopFeatures(featuresData.data || []);
        if (featuresData.data?.length > 0 && !selectedFeature) {
          setSelectedFeature(featuresData.data[0].feature_name);
        }
      }

      // Fetch trend for selected feature
      if (selectedFeature) {
        const trendRes = await fetch(
          `/api/monitor/feature-importance/history?feature_name=${selectedFeature}&days=${Math.max(90, days * 3)}&room_id=${selectedRoom || ''}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (trendRes.ok) {
          const trendDataRes = await trendRes.json();
          setTrendData(trendDataRes.data || []);
        }
      }

      // Fetch seasonal
      const seasonalRes = await fetch(
        `/api/monitor/feature-importance/seasonal?room_id=${selectedRoom || ''}&n_features=10`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (seasonalRes.ok) {
        const seasonalDataRes = await seasonalRes.json();
        setSeasonalData(seasonalDataRes.data || {});
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const featureMetadata = topFeatures.find(f => f.feature_name === selectedFeature) || {};

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Feature
            </label>
            <select
              value={selectedFeature || ''}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select a feature...</option>
              {topFeatures.map(f => (
                <option key={f.feature_name} value={f.feature_name}>
                  {f.feature_name} ({(f.importance_score * 100).toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room Filter (Optional)
            </label>
            <input
              type="number"
              value={selectedRoom || ''}
              onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="All rooms"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <FeatureImportanceMetrics
        topFeatures={topFeatures}
        stability={featureMetadata.stability}
        trend={featureMetadata.trend}
      />

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopFeaturesChart data={topFeatures} loading={loading} error={error} />
        {selectedFeature && (
          <FeatureImportanceTrend
            data={trendData}
            loading={loading}
            error={error}
            featureName={selectedFeature}
          />
        )}
      </div>

      {/* Seasonal Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Seasonal Feature Importance</h3>
        <SeasonalImportance data={seasonalData} loading={loading} error={error} />
      </div>

      {/* Feature Stability */}
      {selectedFeature && (
        <FeatureStabilityIndicator
          feature={selectedFeature}
          stability={featureMetadata.stability || 0}
          trend={featureMetadata.trend || 'stable'}
        />
      )}
    </div>
  );
}
