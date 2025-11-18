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
import 'chart.js/auto';

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
  datasets = null, // Support multiple datasets for confidence intervals
  datasetLabel = "Metric",
  borderColor = '#059669',
  backgroundColor = 'rgba(5,150,105,0.08)',
}) {
  const chartData = {
    labels,
    datasets: datasets || [{
      label: datasetLabel,
      data: data,
      fill: true,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      tension: 0.4,
      pointRadius: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // parent aspect-ratio handles sizing
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    plugins: { 
      legend: { 
        display: datasets ? true : false,
        position: 'top'
      } 
    }
  };

  return (
    <div className="chart-card responsive-card">
      {title && <h3 className="text-base md:text-lg font-semibold mb-3">{title}</h3>}
      <div className="chart-container chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
