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
import { Line, Bar } from "react-chartjs-2";

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
  type = "line",
  title = "Performance Trends",
  labels = [],
  datasetLabel = "Metric",
  data = [],
  color = "rgba(34,197,94,0.7)", // Tailwind green-500
}) {
  const chartData = {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data,
        backgroundColor: color,
        borderColor: color.replace("0.7", "1"),
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: title, color: "#166534", font: { size: 16 } },
    },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.05)" } },
      y: { grid: { color: "rgba(0,0,0,0.05)" } },
    },
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-md hover:shadow-lg border border-green-100">
      {type === "bar" ? <Bar data={chartData} options={options} /> : <Line data={chartData} options={options} />}
    </div>
  );
}
