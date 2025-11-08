import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import SectionTitle from "@/components/ui/SectionTitle";
import { LoadingCard } from "@/components/ui/Loading";
import { 
  BarChart3, DollarSign, LineChart, TrendingUp, 
  AlertTriangle, Egg, Thermometer, Droplets 
} from "lucide-react";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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
      <DashboardLayout>
        <DashboardHeader title={t('analytics.title', 'Analytics Dashboard')} />
        <LoadingCard />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardHeader title={t('analytics.title', 'Analytics Dashboard')} />
        <GlassCard>
          <div className="p-6 text-center text-red-600">
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" />
            <p>{t('common.error', 'Error')}: {error}</p>
          </div>
        </GlassCard>
      </DashboardLayout>
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ✅ Header */}
        <DashboardHeader
          title={t('analytics.overview', 'Analytics Overview')}
          subtitle={t('analytics.subtitle', 'Visualize farm performance, profits, and efficiency')}
          actionLabel={t('common.uploadData', 'Upload New Data')}
          actionHref="/upload"
        />

        {/* ✅ Summary Metrics */}
        <DashboardSection 
          title={t('analytics.sections.financial.title', 'Key Financial Metrics')} 
          subtitle={t('analytics.sections.financial.subtitle', 'Overall farm performance at a glance')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryMetrics.map((metric, idx) => (
              <GlassCard key={idx}>
                <div className="flex items-center gap-3 p-4">
                  <div className="bg-white/70 backdrop-blur-sm p-2 rounded-full border border-green-100 shadow-sm">
                    {metric.icon}
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-600">{metric.label}</h4>
                    <p className="text-xl font-semibold text-green-800">{metric.value}</p>
                    <span className="text-xs text-green-600 font-medium">{metric.trend}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </DashboardSection>

        {/* Performance Charts Section */}
        <DashboardSection title="Performance Metrics" subtitle="Key performance indicators over time">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <AnalyticsChart
                title="Weight Progression"
                labels={chartData.weight.labels}
                data={chartData.weight.data}
                datasetLabel={chartData.weight.label}
                type="line"
              />
            </GlassCard>
            <GlassCard>
              <AnalyticsChart
                title="Feed Consumption"
                labels={chartData.feed.labels}
                data={chartData.feed.data}
                datasetLabel={chartData.feed.label}
                type="bar"
              />
            </GlassCard>
          </div>
        </DashboardSection>

        {/* Cost and Mortality Trends */}
        <DashboardSection title="Cost & Health Metrics" subtitle="Track expenses and bird health">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <AnalyticsChart
                title="Weekly Costs"
                labels={chartData.costs.labels}
                data={chartData.costs.data}
                datasetLabel={chartData.costs.label}
                type="line"
              />
            </GlassCard>
            <GlassCard>
              <AnalyticsChart
                title="Mortality Rate"
                labels={chartData.mortality.labels}
                data={chartData.mortality.data}
                datasetLabel={chartData.mortality.label}
                type="line"
              />
            </GlassCard>
          </div>
        </DashboardSection>

        {/* ✅ Room-Level Insights */}
        <DashboardSection title="Room Performance Insights" subtitle="Breakdown of room-based production, eggs, and mortality rates">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomPerformance.map((r, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${r.color} rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-green-100`}
              >
                <h3 className="text-lg font-semibold text-green-700 mb-2">{r.room}</h3>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Profit:</strong> {r.profit}
                </p>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Birds:</strong> {r.birds}
                </p>
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Weight:</strong> {r.weight}
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>Mortality:</strong> {r.mortality}
                </p>
              </div>
            ))}
          </div>
        </DashboardSection>

        {/* ✅ Forecast Section */}
        <DashboardSection title="Forecast & Projections" subtitle="Anticipate future yield and egg production rates">
          <GlassCard>
            <div className="p-6 text-center space-y-4">
              <BarChart3 className="w-10 h-10 text-green-700 mx-auto" />
              <p className="text-lg text-gray-700">
                Projected growth indicates a <span className="font-semibold text-green-600">10-15%</span> increase in profitability
                with optimized feeding schedules.
              </p>
              <p className="text-sm text-gray-500">
                Use insights from the previous 4 weeks to fine-tune your next feeding and production plan.
              </p>
            </div>
          </GlassCard>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
