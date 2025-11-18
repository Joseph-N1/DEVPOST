import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Layout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import MultiChartGrid from '@/components/ui/MultiChartGrid';
import ComparisonSelector from '@/components/ui/ComparisonSelector';
import Loading from '@/components/ui/Loading';
import AnalyticsChart from '@/components/ui/AnalyticsChart';
import ChartContainer from '@/components/ui/ChartContainer';
import { getWeightForecast, getWeeklyForecast, getModelMetrics, getAccuracyHistory } from '@/utils/api';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [forecasts, setForecasts] = useState({});
  const [weeklyForecasts, setWeeklyForecasts] = useState({});
  const [modelMetrics, setModelMetrics] = useState(null);
  const [accuracyHistory, setAccuracyHistory] = useState(null);
  const [showWeekly, setShowWeekly] = useState(false);

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
          `${apiBase}/upload/preview/${encodeURIComponent(latestFile.path)}?rows=3000`
        );
        
        const previewData = previewResponse.data;
        setCsvData(previewData.preview_rows);
        
        // Extract unique rooms
        const uniqueRooms = [...new Set(previewData.preview_rows.map(row => row.room_id))];
        setRooms(uniqueRooms);
        
        // Fetch forecasts for all rooms
        const forecastData = {};
        const weeklyForecastData = {};
        for (const roomId of uniqueRooms.slice(0, 3)) { // Limit to first 3 rooms
          const forecast = await getWeightForecast(roomId, 7);
          if (forecast) {
            forecastData[roomId] = forecast;
          }
          const weeklyForecast = await getWeeklyForecast(roomId, 4);
          if (weeklyForecast) {
            weeklyForecastData[roomId] = weeklyForecast;
          }
        }
        setForecasts(forecastData);
        setWeeklyForecasts(weeklyForecastData);
        
        // Fetch model metrics and accuracy history with error handling
        try {
          const metrics = await getModelMetrics();
          if (metrics && !metrics.error) {
            setModelMetrics(metrics);
          }
        } catch (metricsErr) {
          console.warn('Model metrics not available:', metricsErr);
        }
        
        try {
          const history = await getAccuracyHistory();
          if (history && !history.error) {
            setAccuracyHistory(history);
          }
        } catch (historyErr) {
          console.warn('Accuracy history not available:', historyErr);
        }
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
          aggregateByAge('feed_kg_total'),
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
          aggregateByAge('fcr'),
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
    { key: 'feed_kg_total', label: t('analytics.feed', 'Feed Intake'), emoji: '🌾' },
    { key: 'mortality_rate', label: t('analytics.mortality', 'Mortality'), emoji: '💔' },
    { key: 'temperature_c', label: t('analytics.temperature', 'Temperature'), emoji: '🌡️' },
    { key: 'humidity_pct', label: t('analytics.humidity', 'Humidity'), emoji: '💧' }
  ];

  if (loading) {
    return (
      <Layout>
        <PageContainer wide>
          <Loading />
        </PageContainer>
      </Layout>
    );
  }

  const charts = generateCharts();

  return (
    <Layout>
      <PageContainer wide>
        {/* Header */}
        <header className="mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-2">
                <span aria-hidden="true">📊</span>
                {t('analytics.title', 'Analytics Dashboard')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">
                {t('analytics.subtitle', 'Comprehensive farm performance analytics')}
              </p>
            </div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="btn-primary touch-target whitespace-nowrap"
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
            <p className="text-yellow-700 text-sm sm:text-base">
              ⚠️ {t('analytics.using_sample', 'Using sample data')}: {error}
            </p>
          </Card>
        )}

        {/* Comparison Selector */}
        {showComparison && csvData && (
          <div className="mb-10 animate-fade-in-up">
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

        {/* AI Weight Forecast Section */}
        {Object.keys(forecasts).length > 0 && (
          <section className="mt-10 animate-fade-in-up animate-delay-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span aria-hidden="true">🔮</span>
                {showWeekly ? 'Weekly Weight Forecast (4 Weeks)' : '7-Day Weight Forecast (AI Predictions)'}
              </h2>
              <button
                onClick={() => setShowWeekly(!showWeekly)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                {showWeekly ? 'Show Daily' : 'Show Weekly'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(showWeekly ? weeklyForecasts : forecasts).map(([roomId, forecast]) => {
                const hasConfidence = forecast.upper_bound && forecast.lower_bound;
                return (
                  <ChartContainer 
                    key={roomId} 
                    title={`Room ${roomId} - Predicted Growth`}
                    subtitle={
                      <div className="space-y-1">
                        <div>Base weight: {forecast.base_weight} kg</div>
                        <div>Growth rate: {forecast.growth_rate_percent ? forecast.growth_rate_percent.toFixed(1) : forecast.weekly_growth_rate_percent.toFixed(1)}% per {showWeekly ? 'week' : 'day'}</div>
                        {hasConfidence && (
                          <div className="text-sm text-gray-500">Confidence: ±{forecast.confidence_interval_percent}%</div>
                        )}
                      </div>
                    }
                  >
                    {hasConfidence ? (
                      <div className="relative">
                        <AnalyticsChart
                          labels={forecast.labels}
                          datasets={[
                            {
                              label: 'Predicted Weight (kg)',
                              data: forecast.predicted_weights,
                              borderColor: 'rgb(99, 102, 241)',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              fill: true
                            },
                            {
                              label: 'Upper Bound (+10%)',
                              data: forecast.upper_bound,
                              borderColor: 'rgba(99, 102, 241, 0.3)',
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                              borderDash: [5, 5],
                              fill: false
                            },
                            {
                              label: 'Lower Bound (-10%)',
                              data: forecast.lower_bound,
                              borderColor: 'rgba(99, 102, 241, 0.3)',
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                              borderDash: [5, 5],
                              fill: false
                            }
                          ]}
                        />
                      </div>
                    ) : (
                      <AnalyticsChart
                        labels={forecast.labels}
                        data={forecast.predicted_weights}
                        datasetLabel="Predicted Weight (kg)"
                        borderColor="rgb(99, 102, 241)"
                        backgroundColor="rgba(99, 102, 241, 0.1)"
                      />
                    )}
                  </ChartContainer>
                );
              })}
            </div>
          </section>
        )}
        
        {/* Model Performance Metrics Section */}
        {modelMetrics && (
          <section className="mt-10 animate-fade-in-up animate-delay-400">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span aria-hidden="true">📊</span>
              Model Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Test MAE</h3>
                <p className="text-3xl font-bold text-blue-600">{modelMetrics.test_mae?.toFixed(3)}</p>
                <p className="text-xs text-gray-500 mt-2">Mean Absolute Error</p>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-green-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Test R² Score</h3>
                <p className="text-3xl font-bold text-green-600">{(modelMetrics.test_r2 * 100)?.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">Model Accuracy</p>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Test RMSE</h3>
                <p className="text-3xl font-bold text-purple-600">{modelMetrics.test_rmse?.toFixed(3)}</p>
                <p className="text-xs text-gray-500 mt-2">Root Mean Squared Error</p>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Training Samples</h3>
                <p className="text-3xl font-bold text-orange-600">{modelMetrics.n_samples}</p>
                <p className="text-xs text-gray-500 mt-2">Data points used</p>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-pink-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Features</h3>
                <p className="text-3xl font-bold text-pink-600">{modelMetrics.n_features}</p>
                <p className="text-xs text-gray-500 mt-2">Input variables</p>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Last Trained</h3>
                <p className="text-lg font-bold text-indigo-600">
                  {modelMetrics.trained_at ? new Date(modelMetrics.trained_at).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {modelMetrics.trained_at ? new Date(modelMetrics.trained_at).toLocaleTimeString() : ''}
                </p>
              </Card>
            </div>
          </section>
        )}
        
        {/* Historical Accuracy Section */}
        {accuracyHistory && accuracyHistory.history && (
          <section className="mt-10 animate-fade-in-up animate-delay-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span aria-hidden="true">📈</span>
              Historical Model Accuracy
            </h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Trainings</p>
                  <p className="text-2xl font-bold text-indigo-600">{accuracyHistory.total_trainings}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average Test MAE</p>
                  <p className="text-2xl font-bold text-blue-600">{accuracyHistory.avg_test_mae?.toFixed(3)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average Test R²</p>
                  <p className="text-2xl font-bold text-green-600">{(accuracyHistory.avg_test_r2 * 100)?.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test MAE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test R²</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Train MAE</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accuracyHistory.history.slice(-10).reverse().map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {entry.test_mae?.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {(entry.test_r2 * 100)?.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {entry.train_mae?.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}
      </PageContainer>
    </Layout>
  );
}
