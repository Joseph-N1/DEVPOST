import React from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FilterControls({
  dateRange,
  onDateRangeChange,
  selectedRooms,
  onRoomChange,
  availableMetrics,
  selectedMetrics,
  onMetricChange,
  onRefresh,
  rooms = []
}) {
  const { t } = useTranslation();

  const presetRanges = [
    { label: t('filters.today', 'Today'), days: 0 },
    { label: t('filters.week', 'This Week'), days: 7 },
    { label: t('filters.month', 'This Month'), days: 30 },
    { label: t('filters.quarter', 'This Quarter'), days: 90 }
  ];

  const handlePresetRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="filter-control">
      {/* Date Range Section */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {t('filters.dateRange', 'Date Range')}
          </span>
        </div>
        <div className="date-range">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="date-picker"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="date-picker"
          />
        </div>
        <div className="flex gap-2">
          {presetRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => handlePresetRange(range.days)}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room Selection */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {t('filters.rooms', 'Rooms')}
          </span>
        </div>
        <div className="room-select-container">
          <select
            multiple
            value={selectedRooms}
            onChange={(e) => onRoomChange([...e.target.selectedOptions].map(opt => opt.value))}
            className="room-select"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Selection */}
      {availableMetrics && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('filters.metrics', 'Metrics')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => onMetricChange(metric.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedMetrics.includes(metric.id)
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                } border hover:bg-green-50`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-auto p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
          title={t('actions.refresh', 'Refresh Data')}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}