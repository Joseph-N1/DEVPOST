import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChartWrapper from './ChartWrapper';
import { X, Maximize2 } from 'lucide-react';

/**
 * MultiChartGrid - Renders multiple charts in a responsive grid
 * @param {Object} props
 * @param {Array} props.charts - Array of chart configurations
 * @param {boolean} props.showExport - Show export buttons on charts
 */
export default function MultiChartGrid({ charts = [], showExport = false }) {
  const { t } = useTranslation();
  const [expandedChart, setExpandedChart] = useState(null);

  if (!charts || charts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('analytics.no_charts', 'No charts available')}
      </div>
    );
  }

  const handleExpand = (chart) => {
    setExpandedChart(chart);
  };

  const handleClose = () => {
    setExpandedChart(null);
  };

  return (
    <>
      <div className="multi-chart-grid">
        {charts.map((chart, index) => (
          <div
            key={index}
            className="responsive-card bg-white shadow-md rounded-lg hover-lift animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                <span aria-hidden="true">{chart.emoji || '📊'}</span>
                {chart.title}
              </h3>
              <button
                onClick={() => handleExpand(chart)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label={t('analytics.expand_chart', 'Expand chart')}
              >
                <Maximize2 size={16} className="text-gray-500" />
              </button>
            </div>
            <ChartWrapper
              type={chart.type}
              data={chart.data}
              options={chart.options}
              showExport={showExport}
            />
          </div>
        ))}
      </div>

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span aria-hidden="true">{expandedChart.emoji || '📊'}</span>
                {expandedChart.title}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('common.close', 'Close')}
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div style={{ height: '500px' }}>
                <ChartWrapper
                  type={expandedChart.type}
                  data={expandedChart.data}
                  options={expandedChart.options}
                  showExport={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
