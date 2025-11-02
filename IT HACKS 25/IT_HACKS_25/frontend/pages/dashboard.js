import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChartCard from "@/components/ui/ChartCard";
import MetricCard from "@/components/ui/MetricCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import SectionTitle from "@/components/ui/SectionTitle";
import ChartContainer from "@/components/ui/ChartContainer";

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
        {/* 🔹 Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-green-700 tracking-tight">
            Farm Dashboard
          </h1>
          <Link
            href="/upload"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
          >
            Upload CSV
          </Link>
        </div>

        {/* 🔹 Error message */}
        {message && (
          <div className="text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
            {message}
          </div>
        )}

        {/* 🔹 Room Charts Section */}
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

        {/* 🔹 Metrics Section */}
        <SectionTitle
          title="Farm Metrics"
          subtitle="Daily health and performance insights"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((m) => (
            <MetricCard key={m.title} {...m} />
          ))}
        </div>

        {/* 🔹 Weekly Chart Section */}
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
