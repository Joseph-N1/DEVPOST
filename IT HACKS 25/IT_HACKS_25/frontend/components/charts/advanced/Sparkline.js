"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';

/**
 * Sparkline - Micro chart for KPI cards
 * Minimal, compact visualization showing trends
 */
export default function Sparkline({ 
  data = [], 
  color = '#3b82f6',
  height = 40,
  width = 100,
  showDots = false
}) {
  if (!data || data.length === 0) {
    return <div style={{ height, width }} className="bg-gray-100 rounded" />;
  }

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [{
      data: data,
      borderColor: color,
      backgroundColor: `${color}33`,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: showDots ? 2 : 0,
      pointHoverRadius: showDots ? 4 : 0,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: showDots }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      line: { borderWidth: 2 }
    }
  };

  return (
    <div style={{ height, width }} className="relative">
      <Line data={chartData} options={options} />
    </div>
  );
}
