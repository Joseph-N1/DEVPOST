import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChartCard from "@/components/ui/ChartCard";
import MetricCard from "@/components/ui/MetricCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import SectionTitle from "@/components/ui/SectionTitle";
import ChartContainer from "@/components/ui/ChartContainer";
import RoomCard from "@/components/ui/RoomCard";
import FeedEfficiencyCard from "@/components/ui/FeedEfficiencyCard";
import DashboardHeader from "@/components/ui/DashboardHeader";

export default function DashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analysis/rooms`
        );
        setRooms(response.data.rooms || []);
      } catch (error) {
        console.error(error);
        setMessage("Error fetching rooms. Please check backend connection.");
      }
    };
    fetchRooms();
  }, []);

  const metrics = [
    { title: "Average Weight Gain", value: "2.4 kg", trend: 8, icon: "🐔" },
    { title: "Feed Conversion Ratio", value: "1.78", trend: -3, icon: "🌾" },
    { title: "Mortality Rate", value: "0.5%", trend: 0, icon: "💚" },
    { title: "Water Consumption", value: "2.5L", trend: 5, icon: "💧" },
    { title: "Energy Efficiency", value: "92%", trend: 2, icon: "⚡" },
    { title: "Sustainability Score", value: "8.5", trend: 3, icon: "🌿" },
  ];

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [2.1, 2.3, 2.5, 2.4, 2.6, 2.8, 3.0],
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* ✅ Dashboard Header */}
        <DashboardHeader
          title="Farm Dashboard"
          subtitle="Monitor live farm performance and key metrics"
          actionLabel="Upload CSV"
          actionHref="/upload"
        />

        {/* ✅ Error Message */}
        {message && (
          <div className="text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
            {message}
          </div>
        )}

        {/* ✅ Dynamic Active Rooms Section */}
        {rooms.length > 0 && (
          <>
            <SectionTitle
              title="Active Farm Rooms"
              subtitle="Room-specific growth and performance analytics"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rooms.map((r) => (
                <ChartCard key={r} title={r} />
              ))}
            </div>
          </>
        )}

        {/* ✅ Metrics Section */}
        <SectionTitle
          title="Farm Metrics"
          subtitle="Daily health and performance insights"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((m) => (
            <MetricCard key={m.title} {...m} />
          ))}
        </div>

        {/* ✅ Room Summary Section */}
        <SectionTitle
          title="Room Performance Summary"
          subtitle="Overview of all active rooms"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RoomCard
            title="Room A"
            birds={1000}
            avgWeight="2.4 kg"
            mortality="0.5%"
            eggsCollected={320}
            trend={+8}
          />
          <RoomCard
            title="Room B"
            birds={980}
            avgWeight="2.3 kg"
            mortality="0.8%"
            eggsCollected={310}
            trend={-2}
          />
          <RoomCard
            title="Room C"
            birds={995}
            avgWeight="2.5 kg"
            mortality="0.4%"
            eggsCollected={350}
            trend={+5}
          />
        </div>

        {/* ✅ Feed Efficiency Overview */}
        <SectionTitle
          title="Feed Efficiency Overview"
          subtitle="Monitor conversion ratios and cost performance"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeedEfficiencyCard
            feedType="Starter Feed"
            fcr={1.78}
            costPerBird="$2.15"
            trend={+5}
          />
          <FeedEfficiencyCard
            feedType="Grower Feed"
            fcr={1.65}
            costPerBird="$1.95"
            trend={+3}
          />
          <FeedEfficiencyCard
            feedType="Layer Feed"
            fcr={1.55}
            costPerBird="$1.80"
            trend={+7}
          />
        </div>

        {/* ✅ Weekly Performance Chart */}
        <SectionTitle
          title="Performance Trends"
          subtitle="Weekly weight gain and efficiency overview"
        />

        <ChartContainer title="Weekly Performance Trends">
          <AnalyticsChart
            labels={chartData.labels}
            data={chartData.data}
            datasetLabel="Weight (kg)"
          />
        </ChartContainer>
      </div>
    </DashboardLayout>
  );
}
