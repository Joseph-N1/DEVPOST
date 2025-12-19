'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, CheckCircle2, AlertTriangle, Info, Plus, X } from 'lucide-react';
import useFeatureStore from '@/store/featureStore';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * FeatureSelectionPanel - Multi-select component for choosing 3-5 features to investigate
 */
export const FeatureSelectionPanel = ({ features, onSelectionChange }) => {
  const { 
    selectedFeatures, 
    toggleFeature, 
    clearSelectedFeatures,
    minFeatures,
    maxFeatures,
    isSelectionValid 
  } = useFeatureStore();
  
  const { currentTheme } = useTheme();
  
  const getSeasonalAccent = () => {
    const accents = {
      spring: 'border-pink-400 bg-pink-50 dark:bg-pink-900/20',
      summer: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      autumn: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
      winter: 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
      light: 'border-green-400 bg-green-50 dark:bg-green-900/20',
      dark: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
    };
    return accents[currentTheme] || accents.light;
  };
  
  const isSelected = (featureName) => selectedFeatures.includes(featureName);
  const canAddMore = selectedFeatures.length < maxFeatures;
  const valid = selectedFeatures.length >= minFeatures;
  
  // Sort features by importance
  const sortedFeatures = [...(features || [])].sort((a, b) => 
    (b.importance_score || 0) - (a.importance_score || 0)
  );

  // Handle empty features state
  if (!features || features.length === 0) {
    return (
      <div className={`rounded-xl border-2 ${getSeasonalAccent()} p-6 mb-6 transition-all duration-300`}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          🔍 Feature Investigation Panel
        </h3>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">No features available yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Feature importance data will appear once the ML models have processed enough data.
            Make sure you have uploaded farm data and the system has had time to analyze it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${getSeasonalAccent()} p-6 mb-6 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🔍 Feature Investigation Panel
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select {minFeatures}-{maxFeatures} features to investigate importance changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            valid 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {selectedFeatures.length}/{maxFeatures} selected
          </span>
          {selectedFeatures.length > 0 && (
            <button
              onClick={clearSelectedFeatures}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Selection status message */}
      {!valid && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Select at least {minFeatures} features to enable analysis and sync to monitor dashboard
          </span>
        </div>
      )}
      
      {valid && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Selection complete! These features are now being tracked on the Monitor Dashboard.
          </span>
        </div>
      )}
      
      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedFeatures.slice(0, 15).map((feature, idx) => {
          const selected = isSelected(feature.feature_name);
          const disabled = !selected && !canAddMore;
          
          return (
            <button
              key={feature.feature_name}
              onClick={() => !disabled && toggleFeature(feature.feature_name)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/50'
                  : disabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {feature.feature_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      {((feature.importance_score || 0) * 100).toFixed(1)}%
                    </span>
                    {feature.trend === 'increasing' && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    {feature.trend === 'decreasing' && (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    {feature.trend === 'stable' && (
                      <Activity className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {selected && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Selected features summary */}
      {selectedFeatures.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Selected for Investigation:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedFeatures.map(name => {
              const feature = features?.find(f => f.feature_name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {name}
                  <button
                    onClick={() => toggleFeature(name)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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
 * SeasonalImportance - Show feature importance by season with intervention planning
 */
export const SeasonalImportance = ({ data, loading, error }) => {
  const { 
    seasonalInterventions, 
    addSeasonalIntervention, 
    removeSeasonalIntervention 
  } = useFeatureStore();
  const { currentTheme } = useTheme();
  
  const [showAddForm, setShowAddForm] = useState(null); // season name or null
  const [newIntervention, setNewIntervention] = useState({ title: '', description: '', priority: 'medium' });
  
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
  const seasonKeys = { Spring: 'spring', Summer: 'summer', Fall: 'autumn', Winter: 'winter' };
  const seasonColors = {
    Spring: '#ec4899',
    Summer: '#f59e0b',
    Fall: '#ea580c',
    Winter: '#06b6d4'
  };
  const seasonEmojis = {
    Spring: '🌸',
    Summer: '🌻',
    Fall: '🍂',
    Winter: '❄️'
  };
  
  const handleAddIntervention = (season) => {
    if (newIntervention.title.trim()) {
      addSeasonalIntervention(seasonKeys[season], newIntervention);
      setNewIntervention({ title: '', description: '', priority: 'medium' });
      setShowAddForm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seasonal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasons.map(season => {
          const seasonKey = seasonKeys[season];
          const interventions = seasonalInterventions[seasonKey] || [];
          
          return (
            <div 
              key={season} 
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg"
            >
              <div 
                className="h-1.5 rounded-full mb-3"
                style={{ backgroundColor: seasonColors[season] }}
              />
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>{seasonEmojis[season]}</span>
                  {season}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {interventions.length} interventions
                </span>
              </div>
              
              {/* Feature importance for season */}
              <div className="space-y-2 mb-4">
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">No data available</p>
              )}
              
              {/* Planned Interventions */}
              {interventions.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                    Planned Interventions
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {interventions.map(int => (
                      <div 
                        key={int.id}
                        className={`p-2 rounded text-xs ${
                          int.priority === 'high' 
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                            : int.priority === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                              : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{int.title}</span>
                          <button
                            onClick={() => removeSeasonalIntervention(seasonKey, int.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {int.description && (
                          <p className="text-gray-500 dark:text-gray-400 mt-1">{int.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add Intervention Button */}
              {showAddForm === season ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Intervention title..."
                    value={newIntervention.title}
                    onChange={(e) => setNewIntervention({ ...newIntervention, title: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <textarea
                    placeholder="Description (optional)..."
                    value={newIntervention.description}
                    onChange={(e) => setNewIntervention({ ...newIntervention, description: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={2}
                  />
                  <select
                    value={newIntervention.priority}
                    onChange={(e) => setNewIntervention({ ...newIntervention, priority: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddIntervention(season)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddForm(null); setNewIntervention({ title: '', description: '', priority: 'medium' }); }}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(season)}
                  className="w-full mt-3 px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Plan Intervention
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Seasonal Intervention Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Using Seasonal Data to Plan Interventions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h5 className="font-semibold text-green-700 dark:text-green-400 mb-1">🌸 Spring Considerations</h5>
            <p>Monitor temperature-related features as weather transitions. Focus on humidity control and ventilation adjustments.</p>
          </div>
          <div>
            <h5 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">🌻 Summer Considerations</h5>
            <p>Heat stress indicators become critical. Watch feed intake patterns and water consumption closely.</p>
          </div>
          <div>
            <h5 className="font-semibold text-orange-700 dark:text-orange-400 mb-1">🍂 Autumn Considerations</h5>
            <p>Prepare for lighting changes affecting production. Review feed formulation for cooler temperatures.</p>
          </div>
          <div>
            <h5 className="font-semibold text-cyan-700 dark:text-cyan-400 mb-1">❄️ Winter Considerations</h5>
            <p>Energy efficiency features gain importance. Monitor heating costs vs. production output trade-offs.</p>
          </div>
        </div>
      </div>
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
  const [rooms, setRooms] = useState([]);
  
  // Feature store for syncing with monitor dashboard
  const { 
    setFeatureImportanceData, 
    setSeasonalData: setStoreSeasonalData,
    selectedFeatures,
    addFeatureAlert,
    featureAlerts
  } = useFeatureStore();

  useEffect(() => {
    fetchRooms();
    fetchFeatureImportance();
  }, [days, selectedRoom, selectedFeature]);

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
  
  // Sync data to store when topFeatures change
  useEffect(() => {
    if (topFeatures.length > 0) {
      setFeatureImportanceData(topFeatures);
    }
  }, [topFeatures, setFeatureImportanceData]);
  
  // Sync seasonal data to store
  useEffect(() => {
    if (Object.keys(seasonalData).length > 0) {
      setStoreSeasonalData(seasonalData);
    }
  }, [seasonalData, setStoreSeasonalData]);
  
  // Check for sudden importance changes and create alerts
  useEffect(() => {
    if (topFeatures.length > 0) {
      topFeatures.forEach(feature => {
        // Check for significant trend changes
        if (feature.trend === 'increasing' && feature.importance_score > 0.15) {
          const existingAlert = featureAlerts.find(
            a => a.featureName === feature.feature_name && !a.acknowledged
          );
          if (!existingAlert) {
            addFeatureAlert({
              featureName: feature.feature_name,
              type: 'importance_increase',
              message: `${feature.feature_name} has increased significantly in importance (${(feature.importance_score * 100).toFixed(1)}%)`,
              severity: 'medium'
            });
          }
        }
      });
    }
  }, [topFeatures]);

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
      {/* Feature Selection Panel */}
      <FeatureSelectionPanel features={topFeatures} />
      
      {/* Feature Alerts */}
      {featureAlerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Feature Importance Alerts
          </h4>
          <div className="space-y-2">
            {featureAlerts.filter(a => !a.acknowledged).slice(0, 3).map(alert => (
              <div key={alert.id} className="text-sm text-amber-700 dark:text-amber-300">
                • {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}
      
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
              Room Filter
            </label>
            <select
              value={selectedRoom || ''}
              onChange={(e) => setSelectedRoom(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Rooms</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name || `Room #${room.id}`}
                </option>
              ))}
            </select>
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

      {/* Seasonal Analysis with Intervention Planning */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Seasonal Feature Importance & Intervention Planning
        </h3>
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
