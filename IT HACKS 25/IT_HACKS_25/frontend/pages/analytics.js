import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import SectionTitle from "@/components/ui/SectionTitle";
import { BarChart3, DollarSign, LineChart, TrendingUp, AlertTriangle, Egg } from "lucide-react";

export default function AnalyticsPage() {
  const summaryMetrics = [
    { label: "Total Revenue", value: "$12,450", icon: <DollarSign className="w-6 h-6 text-green-700" />, trend: "+12%" },
    { label: "Total Expenses", value: "$7,800", icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />, trend: "-5%" },
    { label: "Profit", value: "$4,650", icon: <TrendingUp className="w-6 h-6 text-green-600" />, trend: "+18%" },
    { label: "Eggs Sold", value: "1,230 crates", icon: <Egg className="w-6 h-6 text-amber-600" />, trend: "+10%" },
  ];

  const roomPerformance = [
    { room: "Room A", profit: "$1,850", eggs: 420, mortality: "0.5%", color: "from-green-200 to-green-50" },
    { room: "Room B", profit: "$1,300", eggs: 380, mortality: "0.8%", color: "from-blue-200 to-blue-50" },
    { room: "Room C", profit: "$1,500", eggs: 410, mortality: "0.4%", color: "from-amber-200 to-amber-50" },
  ];

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    data: [2800, 3200, 3900, 4650],
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ✅ Header */}
        <DashboardHeader
          title="Analytics Overview"
          subtitle="Visualize farm performance, profits, and efficiency"
          actionLabel="Upload New Data"
          actionHref="/upload"
        />

        {/* ✅ Summary Metrics */}
        <DashboardSection title="Key Financial Metrics" subtitle="Overall farm performance at a glance">
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

        {/* ✅ Profit Chart Section */}
        <DashboardSection title="Profit Growth" subtitle="Weekly profit trends across the farm">
          <GlassCard>
            <AnalyticsChart
              title="Weekly Profit Growth"
              labels={chartData.labels}
              data={chartData.data}
              datasetLabel="Profit ($)"
            />
          </GlassCard>
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
                  <strong>Eggs Collected:</strong> {r.eggs}
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
