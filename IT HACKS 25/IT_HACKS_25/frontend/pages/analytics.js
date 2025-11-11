import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Layout from '@/components/layout/DashboardLayout';
import AnalyticsChart from '@/components/ui/AnalyticsChart';
import Card from '@/components/ui/Card';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [sample, setSample] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch('/api/analytics/summary');
        const data = await response.json();
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // fallback: load sample CSV or mock if API not ready
    // fetch('/api/data/preview/sample_upload_expanded.csv') ...
  }, []);

  // Sample data structure based on sample_upload_expanded.csv
  const sampleData = {
    productionMetrics: {
      totalBirds: 7500, // Sum of current birds across rooms
      avgWeight: 3.2,   // Average latest weight across rooms
      feedConversion: 2.1,
      mortality: 0.8    // Average mortality rate
    },
    environmentMetrics: {
      temperature: 24.0,  // Average temperature
      humidity: 63.5,     // Average humidity
      lightHours: 16,
      waterConsumption: 520 // Average daily water consumption
    },
    trends: {
      weekly: {
        weight: [2.5, 2.8, 3.0, 3.2],
        feed: [0.15, 0.18, 0.22, 0.25],
        mortality: [0.08, 0.07, 0.06, 0.05],
        costs: [850, 920, 1100, 1250]
      }
    },
    rooms: [
      { id: "R001", birds: 2640, mortality: 0.07, weight: 3.2 },
      { id: "R002", birds: 2320, mortality: 0.08, weight: 3.1 },
      { id: "R003", birds: 2540, mortality: 0.06, weight: 3.3 }
    ]
  };

  if (loading) {
    return (
      <Layout>
        <main className="page-container">
          <header className="dashboard-header mb-4">
            <h1 className="text-xl md:text-2xl font-bold">{t('analytics.title', 'Analytics Dashboard')}</h1>
          </header>
          <Card className="card-min-h">
            {/* Loading state can be a spinner or skeleton component */}
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <main className="page-container">
          <header className="dashboard-header mb-4">
            <h1 className="text-xl md:text-2xl font-bold">{t('analytics.title', 'Analytics Dashboard')}</h1>
          </header>
          <Card className="card-min-h">
            <div className="p-6 text-center text-red-600">
              <p>{t('common.error', 'Error')}: {error}</p>
            </div>
          </Card>
        </main>
      </Layout>
    );
  }

  // Use sample data if API data is not available
  const displayData = data || sampleData;
  const summaryMetrics = [
    { 
      label: "Total Birds", 
      value: displayData.productionMetrics.totalBirds.toLocaleString(), 
      icon: <Egg className="w-6 h-6 text-green-700" />, 
      trend: "+2%" 
    },
    { 
      label: "Average Weight", 
      value: `${displayData.productionMetrics.avgWeight} kg`, 
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />, 
      trend: "+0.2kg" 
    },
    { 
      label: "Feed Conversion", 
      value: displayData.productionMetrics.feedConversion.toFixed(2), 
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />, 
      trend: "-0.1" 
    },
    { 
      label: "Water Usage", 
      value: `${displayData.environmentMetrics.waterConsumption}L`, 
      icon: <Droplets className="w-6 h-6 text-blue-600" />, 
      trend: "+5%" 
    },
  ];

  const roomPerformance = displayData.rooms.map((room, index) => ({
    room: `Room ${room.id}`,
    profit: `$${(room.birds * 2.5).toFixed(2)}`, // Estimated profit based on bird count
    birds: room.birds,
    mortality: `${(room.mortality * 100).toFixed(1)}%`,
    weight: `${room.weight.toFixed(1)} kg`,
    color: [
      "from-green-200 to-green-50",
      "from-blue-200 to-blue-50",
      "from-amber-200 to-amber-50"
    ][index % 3]
  }));

  const chartData = {
    weight: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: displayData.trends.weekly.weight,
      label: "Average Weight (kg)"
    },
    feed: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: displayData.trends.weekly.feed,
      label: "Daily Feed (kg/bird)"
    },
    mortality: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: displayData.trends.weekly.mortality.map(m => m * 100),
      label: "Mortality Rate (%)"
    },
    costs: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      data: displayData.trends.weekly.costs,
      label: "Weekly Costs ($)"
    }
  };

  return (
    <Layout>
      <main className="page-container">
        <header className="dashboard-header mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{t('analytics.title', 'Analytics Dashboard')}</h1>
          {/* filter controls will be responsive */}
        </header>

        <section className="dashboard-grid">
          <Card className="card-min-h">
            {/* small metrics */}
          </Card>

          <div className="responsive-card chart-card">
            <AnalyticsChart title="Weight over time" labels={[]} data={[]} datasetLabel="Avg weight" />
          </div>

          {/* more cards/charts */}
        </section>
      </main>
    </Layout>
  );
}
