import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, Download, RefreshCw, 
  ChevronLeft, ChevronRight, MoreHorizontal 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ChartControls({
  onZoomIn,
  onZoomOut,
  onDownload,
  onRefresh,
  onNext,
  onPrevious,
  chartType,
  onChartTypeChange,
  availableTypes = ['line', 'bar', 'area'],
  disableNavigation,
  className = ''
}) {
  const { t } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className={`chart-controls ${className}`}>
      {/* Navigation Controls */}
      {!disableNavigation && (
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevious}
            className="chart-control-btn"
            title={t('chart.previous', 'Previous Period')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="chart-control-btn"
            title={t('chart.next', 'Next Period')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomIn}
          className="chart-control-btn"
          title={t('chart.zoomIn', 'Zoom In')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="chart-control-btn"
          title={t('chart.zoomOut', 'Zoom Out')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Chart Type Selection */}
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="chart-control-btn"
          title={t('chart.options', 'Chart Options')}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        
        {showOptions && (
          <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  onChartTypeChange(type);
                  setShowOptions(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                  chartType === type ? 'text-green-600 bg-green-50' : 'text-gray-700'
                }`}
              >
                {t(`chart.types.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onDownload}
          className="chart-control-btn"
          title={t('chart.download', 'Download Chart')}
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onRefresh}
          className="chart-control-btn"
          title={t('chart.refresh', 'Refresh Data')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}