import React, { useRef } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useTranslation } from 'react-i18next';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ChartWrapper - Abstraction layer for chart.js with export functionality
 * @param {Object} props
 * @param {string} props.type - Chart type: 'line', 'bar', 'pie'
 * @param {Object} props.data - Chart data (labels and datasets)
 * @param {Object} props.options - Chart options
 * @param {string} props.title - Chart title
 * @param {boolean} props.showExport - Show export buttons
 * @param {Function} props.onExport - Custom export handler
 */
export default function ChartWrapper({
  type = 'line',
  data,
  options = {},
  title,
  showExport = false,
  onExport,
  className = ''
}) {
  const { t } = useTranslation();
  const chartRef = useRef(null);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 16 / 9,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 8,
        enabled: true,
        mode: 'index',
        intersect: false
      }
    },
    scales: type !== 'pie' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    } : undefined,
    ...options
  };

  const exportToPNG = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${title || 'chart'}-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  const exportToCSV = () => {
    if (!data || !data.datasets) return;
    
    let csv = 'Label,' + data.datasets.map(ds => ds.label).join(',') + '\n';
    
    data.labels.forEach((label, index) => {
      const row = [label];
      data.datasets.forEach(ds => {
        row.push(ds.data[index] || '');
      });
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${title || 'chart'}-data-${Date.now()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format) => {
    if (onExport) {
      onExport(format, chartRef.current);
    } else {
      if (format === 'png') exportToPNG();
      else if (format === 'csv') exportToCSV();
    }
  };

  const ChartComponent = type === 'line' ? Line : type === 'bar' ? Bar : Pie;

  return (
    <div className={`chart-container-wrapper ${className}`}>
      {showExport && (
        <div className="flex justify-end gap-2 mb-2">
          <button
            onClick={() => handleExport('png')}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            aria-label={t('analytics.export_png', 'Export as PNG')}
          >
            📷 PNG
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            aria-label={t('analytics.export_csv', 'Export as CSV')}
          >
            📊 CSV
          </button>
        </div>
      )}
      <div className="chart-container">
        <ChartComponent ref={chartRef} data={data} options={defaultOptions} />
      </div>
    </div>
  );
}
