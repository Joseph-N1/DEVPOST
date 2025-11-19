"use client";

import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import useFilterStore from '@/store/filterStore';

/**
 * GlobalFilterPanel - Sliding panel for cross-filtering system
 */
export default function GlobalFilterPanel() {
  const {
    isFilterPanelOpen,
    toggleFilterPanel,
    dateRange,
    setDateRange,
    anomalySeverity,
    setAnomalySeverity,
    productionThresholds,
    setProductionThresholds,
    resetFilters
  } = useFilterStore();

  if (!isFilterPanelOpen) {
    return (
      <button
        onClick={toggleFilterPanel}
        className="fixed right-4 top-24 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        aria-label="Open Filters"
      >
        <Filter size={20} />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={toggleFilterPanel}
      />

      {/* Sliding Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} />
            Global Filters
          </h2>
          <button
            onClick={toggleFilterPanel}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => setDateRange(e.target.value, dateRange.end)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => setDateRange(dateRange.start, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Anomaly Severity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Anomaly Severity
            </label>
            <select
              value={anomalySeverity}
              onChange={(e) => setAnomalySeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
            </select>
          </div>

          {/* Production Thresholds */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Production Thresholds
            </label>
            
            {/* Eggs */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 block mb-1">Eggs Produced</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={productionThresholds.minEggs}
                  onChange={(e) => setProductionThresholds({ minEggs: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={productionThresholds.maxEggs}
                  onChange={(e) => setProductionThresholds({ maxEggs: parseInt(e.target.value) || 1000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 block mb-1">Avg Weight (kg)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={productionThresholds.minWeight}
                  onChange={(e) => setProductionThresholds({ minWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={productionThresholds.maxWeight}
                  onChange={(e) => setProductionThresholds({ maxWeight: parseFloat(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* FCR */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 block mb-1">Feed Conversion Ratio</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={productionThresholds.minFCR}
                  onChange={(e) => setProductionThresholds({ minFCR: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={productionThresholds.maxFCR}
                  onChange={(e) => setProductionThresholds({ maxFCR: parseFloat(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reset All Filters
          </button>
        </div>
      </div>
    </>
  );
}
