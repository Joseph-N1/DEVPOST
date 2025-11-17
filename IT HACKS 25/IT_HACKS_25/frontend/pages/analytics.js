import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Layout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import MultiChartGrid from '@/components/ui/MultiChartGrid';
import ComparisonSelector from '@/components/ui/ComparisonSelector';
import Loading from '@/components/ui/Loading';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch uploaded CSV data
      const filesResponse = await axios.get(`${apiBase}/upload/files`);
      const files = filesResponse.data || [];
      
      if (files.length > 0) {
        // Get the most recently uploaded file
        const latestFile = files.sort((a, b) => b.modified - a.modified)[0];
        
        // Fetch full preview to get data
        const previewResponse = await axios.get(
          `${apiBase}/upload/preview/${encodeURIComponent(latestFile.path)}?rows=100`
        );
        
        const previewData = previewResponse.data;
        setCsvData(previewData.preview_rows);
        
        // Extract unique rooms
        const uniqueRooms = [...new Set(previewData.preview_rows.map(row => row.room_id))];
        setRooms(uniqueRooms);
      } else {
        // Fallback to sample data
        loadSampleData();
      }
      
      setError(null);
    } catch (err) {
      console.error('Analytics data fetch error:', err);
      setError(err.message);
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    // Generate sample data for demonstration
    const sampleRooms = ['R001', 'R002', 'R003', 'R004'];
    const sampleData = [];
    
    for (let day = 0; day < 50; day++) {
      sampleRooms.forEach(room => {
        sampleData.push({
          room_id: room,
          date: `2025-11-${String(day + 1).padStart(2, '0')}`,
          age_days: day,
          current_birds: 2500 - (day * 2) - Math.floor(Math.random() * 5),
          eggs_produced: day > 20 ? Math.floor(200 + Math.random() * 50) : 0,
          avg_weight_kg: 0.04 + (day * 0.05) + (Math.random() * 0.01),
          feed_intake_kg: 0.01 + (day * 0.002),
          mortality_count: Math.floor(Math.random() * 3),
          mortality_rate: (Math.random() * 0.2).toFixed(3),
          temperature_c: 28 + Math.random() * 4,
          humidity_pct: 60 + Math.random() * 10,
          feed_conversion_ratio: 1.5 + (Math.random() * 0.5)
        });
      });
    }
    
    setCsvData(sampleData);
    setRooms(sampleRooms);
  };

  const generateCharts = () => {
    if (!csvData || csvData.length === 0) return [];

    const aggregateByAge = (dataKey) => {
      const aggregated = {};
      csvData.forEach(row => {
        const age = row.age_days;
        if (!aggregated[age]) {
          aggregated[age] = { sum: 0, count: 0 };
        }
        aggregated[age].sum += parseFloat(row[dataKey] || 0);
        aggregated[age].count += 1;
      });
      
      return Object.keys(aggregated)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(age => ({
          age: parseInt(age),
          value: aggregated[age].sum / aggregated[age].count
        }));
    };

    const createChartData = (aggregatedData, label, color) => ({
      labels: aggregatedData.map(d => `Day ${d.age}`),
      datasets: [{
        label,
        data: aggregatedData.map(d => d.value),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.4,
        fill: true
      }]
    });

    const charts = [
      {
        title: t('analytics.eggs_production', 'Egg Production Over Time'),
        emoji: '🥚',
        type: 'line',
        data: createChartData(
          aggregateByAge('eggs_produced'),
          t('analytics.eggs_per_day', 'Eggs per Day'),
          'rgb(34, 197, 94)'
        )
      },
      {
        title: t('analytics.avg_weight', 'Average Bird Weight'),
        emoji: '⚖️',
        type: 'line',
        data: createChartData(
          aggregateByAge('avg_weight_kg'),
          t('analytics.weight_kg', 'Weight (kg)'),
          'rgb(59, 130, 246)'
        )
      },
      {
        title: t('analytics.feed_consumption', 'Feed Consumption'),
        emoji: '🌾',
        type: 'line',
        data: createChartData(
          aggregateByAge('feed_intake_kg'),
          t('analytics.feed_kg', 'Feed (kg/bird)'),
          'rgb(249, 115, 22)'
        )
      },
      {
        title: t('analytics.mortality', 'Mortality Rate'),
        emoji: '💔',
        type: 'line',
        data: createChartData(
          aggregateByAge('mortality_rate'),
          t('analytics.mortality_percent', 'Mortality (%)'),
          'rgb(239, 68, 68)'
        )
      },
      {
        title: t('analytics.temperature', 'Temperature'),
        emoji: '🌡️',
        type: 'line',
        data: createChartData(
          aggregateByAge('temperature_c'),
          t('analytics.temp_celsius', 'Temperature (°C)'),
          'rgb(234, 88, 12)'
        )
      },
      {
        title: t('analytics.fcr', 'Feed Conversion Ratio'),
        emoji: '📊',
        type: 'line',
        data: createChartData(
          aggregateByAge('feed_conversion_ratio'),
          t('analytics.fcr_value', 'FCR'),
          'rgb(168, 85, 247)'
        )
      }
    ];

    return charts;
  };

  const features = [
    { key: 'eggs_produced', label: t('analytics.eggs', 'Eggs Produced'), emoji: '🥚' },
    { key: 'avg_weight_kg', label: t('analytics.weight', 'Avg Weight'), emoji: '⚖️' },
    { key: 'feed_intake_kg', label: t('analytics.feed', 'Feed Intake'), emoji: '🌾' },
    { key: 'mortality_rate', label: t('analytics.mortality', 'Mortality'), emoji: '💔' },
    { key: 'temperature_c', label: t('analytics.temperature', 'Temperature'), emoji: '🌡️' },
    { key: 'humidity_pct', label: t('analytics.humidity', 'Humidity'), emoji: '💧' }
  ];

  if (loading) {
    return (
      <Layout>
        <main className="page-container py-8">
          <Loading />
        </main>
      </Layout>
    );
  }

  const charts = generateCharts();

  return (
    <Layout>
      <main className="page-container py-8">
        {/* Header */}
        <header className="mb-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span aria-hidden="true">📊</span>
                {t('analytics.title', 'Analytics Dashboard')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('analytics.subtitle', 'Comprehensive farm performance analytics')}
              </p>
            </div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="btn-primary touch-target"
            >
              {showComparison 
                ? t('analytics.hide_comparison', 'Hide Comparison')
                : t('analytics.show_comparison', 'Show Comparison')}
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              ⚠️ {t('analytics.using_sample', 'Using sample data')}: {error}
            </p>
          </Card>
        )}

        {/* Comparison Selector */}
        {showComparison && csvData && (
          <div className="mb-8 animate-fade-in-up">
            <ComparisonSelector
              rooms={rooms}
              features={features}
              data={csvData}
            />
          </div>
        )}

        {/* Multi-Chart Grid */}
        <section className="animate-fade-in-up animate-delay-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span aria-hidden="true">📈</span>
            {t('analytics.overview_charts', 'Performance Overview')}
          </h2>
          {charts.length > 0 ? (
            <MultiChartGrid charts={charts} showExport={true} />
          ) : (
            <Card className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">📂</p>
              <p>{t('analytics.no_data', 'No data available. Please upload a CSV file.')}</p>
            </Card>
          )}
        </section>
      </main>
    </Layout>
  );
}
