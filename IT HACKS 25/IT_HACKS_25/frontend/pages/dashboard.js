import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageContainer from "@/components/ui/PageContainer";
import ChartCard from "@/components/ui/ChartCard";
import MetricCard from "@/components/ui/MetricCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import SectionTitle from "@/components/ui/SectionTitle";
import ChartContainer from "@/components/ui/ChartContainer";
import RoomCard from "@/components/ui/RoomCard";
import FeedEfficiencyCard from "@/components/ui/FeedEfficiencyCard";
import DashboardHeader from "@/components/ui/DashboardHeader";
import Loading from "@/components/ui/Loading";

export default function DashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [farmMetrics, setFarmMetrics] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const filesResponse = await axios.get(`${api}/upload/files`);
        const files = filesResponse.data || [];

        if (!files.length) {
          setMessage("No CSV uploaded yet. Upload a file to see room data.");
          setLoading(false);
          return;
        }

        const latestFile = files.sort(
          (a, b) => new Date(b.modified) - new Date(a.modified)
        )[0];

        const dataResponse = await axios.get(
          `${api}/upload/preview/${encodeURIComponent(latestFile.path)}?rows=3000`
        );

        const csvData = dataResponse.data.preview_rows || [];

        const roomIds = [...new Set(csvData.map(r => r.room_id))].sort();
        setRooms(roomIds);

        const roomStats = roomIds.map(roomId => {
          const roomRows = csvData.filter(r => r.room_id === roomId);

          const latest = roomRows.reduce((acc, row) =>
            (row.age_days || 0) > (acc.age_days || 0) ? row : acc,
          roomRows[0]);

          const avgMort = roomRows.reduce((s, r) => s + (parseFloat(r.mortality_count) || 0), 0)
            / roomRows.length;

          const mortalityRate = (avgMort / (latest.current_birds || 1)) * 100;

          const totalEggs = roomRows.reduce((s, r) => s + (parseFloat(r.eggs_produced) || 0), 0);
          const avgWeight = roomRows.reduce((s, r) => s + (parseFloat(r.avg_weight_kg) || 0), 0)
            / roomRows.length;

          return {
            id: roomId,
            title: `Room ${roomId}`,
            birds: Math.round(latest.current_birds),
            avgWeight: `${avgWeight.toFixed(2)} kg`,
            mortality: `${mortalityRate.toFixed(2)}%`,
            eggsCollected: Math.round(totalEggs),
          };
        });

        setRoomsData(roomStats);

        const totalBirds = csvData.reduce((s, r) => s + (parseFloat(r.current_birds) || 0), 0)
          / csvData.length;

        setFarmMetrics({
          avgWeightGain: (
            csvData.reduce((s, r) => s + (parseFloat(r.avg_weight_kg) || 0), 0)
            / csvData.length
          ).toFixed(2),
          fcr: (
            csvData.reduce((s, r) => s + (parseFloat(r.feed_conversion_ratio) || 0), 0)
            / csvData.length
          ).toFixed(2),
          mortalityRate: (
            csvData.reduce((s, r) => s + (parseFloat(r.mortality_count) || 0), 0)
            / totalBirds
          ).toFixed(2),
          waterConsumption: 2.5,
          energyEfficiency: 92,
          sustainabilityScore: 8.5
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setMessage("Error fetching rooms. Please check backend connection.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [2.1, 2.3, 2.5, 2.4, 2.6, 2.8, 3.0],
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loading />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer wide>
        <div className="space-y-10">

          <DashboardHeader
            title="Farm Dashboard"
            subtitle="Monitor live farm performance and key metrics"
            actionLabel="Upload CSV"
            actionHref="/upload"
          />

          {message && (
            <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              ⚠️ {message}
            </div>
          )}

          {/* ROOM SUMMARY */}
          {roomsData.length > 0 && (
            <>
              <SectionTitle
                title="Room Performance Summary"
                subtitle={`Overview of all ${roomsData.length} active rooms`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {roomsData.map(room => <RoomCard key={room.id} {...room} />)}
              </div>
            </>
          )}

          {/* METRIC CARDS */}
          <SectionTitle title="Farm Metrics" subtitle="Daily health and performance insights" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Average Weight Gain", value: `${farmMetrics.avgWeightGain} kg`, icon: "🐔" },
              { title: "Feed Conversion Ratio", value: farmMetrics.fcr, icon: "🌾" },
              { title: "Mortality Rate", value: `${farmMetrics.mortalityRate}%`, icon: "💚" },
              { title: "Water Consumption", value: `2.5L`, icon: "💧" },
              { title: "Energy Efficiency", value: `92%`, icon: "⚡" },
              { title: "Sustainability Score", value: `8.5`, icon: "🌿" },
            ].map(m => <MetricCard key={m.title} {...m} />)}
          </div>

          {/* WEEKLY TREND CHART */}
          <SectionTitle title="Performance Trends" subtitle="Weekly weight gain and efficiency overview" />

          <ChartContainer title="Weekly Performance Trends">
            <AnalyticsChart labels={chartData.labels} data={chartData.data} datasetLabel="Weight (kg)" />
          </ChartContainer>

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
