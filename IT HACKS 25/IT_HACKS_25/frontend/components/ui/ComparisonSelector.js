import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ChartWrapper from './ChartWrapper';

/**
 * ComparisonSelector - Multi-select UI for comparing features across rooms
 * @param {Object} props
 * @param {Array} props.rooms - Available rooms
 * @param {Array} props.features - Available features to compare
 * @param {Object} props.data - Full dataset
 * @param {Function} props.onCompare - Callback when comparison is triggered
 */
export default function ComparisonSelector({ rooms = [], features = [], data = null, onCompare }) {
  const { t } = useTranslation();
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [independentAxis, setIndependentAxis] = useState(false);

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const toggleRoom = (room) => {
    setSelectedRooms(prev =>
      prev.includes(room)
        ? prev.filter(r => r !== room)
        : [...prev, room]
    );
  };

  const selectAllRooms = () => {
    setSelectedRooms(rooms.map(r => (typeof r === 'object' ? r.room_id : r)));
  };

  const clearSelection = () => {
    setSelectedFeatures([]);
    setSelectedRooms([]);
    setChartData(null);
  };

  const generateComparisonChart = () => {
    if (selectedFeatures.length === 0 || selectedRooms.length === 0 || !data) {
      return;
    }

    const colors = [
      'rgb(34, 197, 94)', // green
      'rgb(59, 130, 246)', // blue
      'rgb(249, 115, 22)', // orange
      'rgb(168, 85, 247)', // purple
      'rgb(236, 72, 153)', // pink
      'rgb(20, 184, 166)', // teal
    ];

    const datasets = [];
    let datasetIndex = 0;

    selectedFeatures.forEach((feature) => {
      selectedRooms.forEach((room) => {
        const roomData = data.filter(row => row.room_id === room);
        if (roomData.length > 0) {
          const color = colors[datasetIndex % colors.length];
          datasets.push({
            label: `${room} - ${feature.label}`,
            data: roomData.map(row => row[feature.key]),
            borderColor: color,
            backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.4,
            yAxisID: independentAxis && selectedFeatures.length > 1 ? `y${selectedFeatures.indexOf(feature)}` : 'y'
          });
          datasetIndex++;
        }
      });
    });

    const labels = data
      .filter(row => row.room_id === selectedRooms[0])
      .map(row => row.date || row.age_days || '');

    const chartConfig = {
      labels: labels.slice(0, 50), // Limit to 50 points for performance
      datasets: datasets.map(ds => ({
        ...ds,
        data: ds.data.slice(0, 50)
      }))
    };

    const options = {
      scales: {}
    };

    if (independentAxis && selectedFeatures.length > 1) {
      selectedFeatures.forEach((feature, index) => {
        options.scales[`y${index}`] = {
          type: 'linear',
          position: index === 0 ? 'left' : 'right',
          title: {
            display: true,
            text: feature.label
          },
          grid: {
            drawOnChartArea: index === 0
          }
        };
      });
    } else {
      options.scales.y = {
        beginAtZero: true,
        title: {
          display: true,
          text: t('analytics.value', 'Value')
        }
      };
    }

    options.scales.x = {
      title: {
        display: true,
        text: t('analytics.time', 'Time / Age')
      }
    };

    setChartData({ data: chartConfig, options });

    if (onCompare) {
      onCompare(chartConfig, selectedFeatures, selectedRooms);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span aria-hidden="true">↔️</span>
          {t('analytics.comparison_selector', 'Feature Comparison')}
        </h3>
        {(selectedFeatures.length > 0 || selectedRooms.length > 0) && (
          <button
            onClick={clearSelection}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {t('common.clear', 'Clear')}
          </button>
        )}
      </div>

      {/* Feature Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('analytics.select_features', 'Select Features')} ({selectedFeatures.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <button
              key={feature.key}
              onClick={() => toggleFeature(feature)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all touch-target ${
                selectedFeatures.includes(feature)
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {feature.emoji && <span aria-hidden="true" className="mr-1">{feature.emoji}</span>}
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('analytics.select_rooms', 'Select Rooms')} ({selectedRooms.length})
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {rooms.map((room) => {
            const roomId = typeof room === 'object' ? room.room_id : room;
            return (
              <button
                key={roomId}
                onClick={() => toggleRoom(roomId)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all touch-target ${
                  selectedRooms.includes(roomId)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {roomId}
              </button>
            );
          })}
        </div>
        <button
          onClick={selectAllRooms}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('analytics.select_all_rooms', 'Select All Rooms')}
        </button>
      </div>

      {/* Options */}
      {selectedFeatures.length > 1 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="independent-axis"
            checked={independentAxis}
            onChange={(e) => setIndependentAxis(e.target.checked)}
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
          />
          <label htmlFor="independent-axis" className="text-sm text-gray-700">
            {t('analytics.independent_axis', 'Use independent Y-axes for each feature')}
          </label>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateComparisonChart}
        disabled={selectedFeatures.length === 0 || selectedRooms.length === 0}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          selectedFeatures.length > 0 && selectedRooms.length > 0
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {t('analytics.generate_comparison', 'Generate Comparison Chart')}
      </button>

      {/* Chart Display */}
      {chartData && (
        <div className="mt-6 animate-fade-in-up">
          <ChartWrapper
            type="line"
            data={chartData.data}
            options={chartData.options}
            title={t('analytics.comparison_chart', 'Feature Comparison Chart')}
            showExport={true}
          />
        </div>
      )}
    </div>
  );
}
