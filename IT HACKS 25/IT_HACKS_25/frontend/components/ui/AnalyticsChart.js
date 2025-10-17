"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsChart({
  title = "Performance Trends",
  labels = [],
  data = [],
  datasetLabel = "Metric",
}) {
  const gradientColors = {
    start: 'rgba(52, 211, 153, 0.2)',  // Light green
    mid: 'rgba(14, 165, 233, 0.15)',   // Light blue
    end: 'rgba(5, 150, 105, 0.1)'      // Emerald
  };

  const chartData = {
    labels,
    datasets: [{
      label: datasetLabel,
      data: data,
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, gradientColors.start);
        gradient.addColorStop(0.5, gradientColors.mid);
        gradient.addColorStop(1, gradientColors.end);
        return gradient;
      },
      borderColor: '#059669',
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: '#059669',
      pointHoverBackgroundColor: '#047857',
      pointHoverRadius: 8,
      pointHoverBorderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} ${datasetLabel}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          padding: 10
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          padding: 10
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-lg border border-green-100 
                    hover:shadow-xl transition-all duration-300">
      <h3 className="text-xl font-semibold text-green-800 mb-4">{title}</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}
