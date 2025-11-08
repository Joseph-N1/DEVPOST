import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilterControls from '@/components/ui/FilterControls';
import ComparisonView from '@/components/ui/ComparisonView';
import ChartControls from '@/components/ui/ChartControls';

export default function DashboardContent({
  children,
  enableFilters = true,
  enableComparison = true,
  dateRange,
  onDateRangeChange,
  selectedRooms,
  onRoomChange,
  availableMetrics,
  selectedMetrics,
  onMetricChange,
  onRefresh,
  rooms = [],
  comparisonData = null
}) {
  const { t } = useTranslation();
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonOrientation, setComparisonOrientation] = useState('horizontal');

  return (
    <div className="dashboard-content">
      {/* Filters Section */}
      {enableFilters && (
        <FilterControls
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          selectedRooms={selectedRooms}
          onRoomChange={onRoomChange}
          availableMetrics={availableMetrics}
          selectedMetrics={selectedMetrics}
          onMetricChange={onMetricChange}
          onRefresh={onRefresh}
          rooms={rooms}
        />
      )}

      {/* Main Content */}
      <div className="dashboard-main-content">
        {!showComparison ? (
          children
        ) : (
          <ComparisonView
            title={t('comparison.title', 'Data Comparison')}
            subtitle={t('comparison.subtitle', 'Compare metrics across rooms or time periods')}
            leftContent={comparisonData?.left}
            rightContent={comparisonData?.right}
            leftTitle={comparisonData?.leftTitle || t('comparison.baseline', 'Baseline')}
            rightTitle={comparisonData?.rightTitle || t('comparison.comparison', 'Comparison')}
            onClose={() => setShowComparison(false)}
            orientation={comparisonOrientation}
            onOrientationChange={setComparisonOrientation}
          />
        )}
      </div>

      {/* Comparison Toggle */}
      {enableComparison && !showComparison && (
        <button
          onClick={() => setShowComparison(true)}
          className="fixed bottom-6 right-6 bg-green-600 text-white rounded-full px-4 py-2 shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1h6v8H7V6z" clipRule="evenodd" />
          </svg>
          {t('actions.compare', 'Compare')}
        </button>
      )}
    </div>
  );
}