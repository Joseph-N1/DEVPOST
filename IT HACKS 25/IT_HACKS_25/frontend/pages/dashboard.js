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
        
        // Try to fetch the most recent CSV file
        const filesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/files`
        );
        
        if (!filesResponse.data.files || filesResponse.data.files.length === 0) {
          setMessage("No CSV uploaded yet. Upload a file to see room data.");
          setLoading(false);
          return;
        }

        // Get the most recent file
        const sortedFiles = filesResponse.data.files.sort(
          (a, b) => new Date(b.modified) - new Date(a.modified)
        );
        const latestFile = sortedFiles[0];

        // Fetch full data from the CSV
        const dataResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/preview/${encodeURIComponent(latestFile.name)}?rows=1000`
        );

        const csvData = dataResponse.data.data || [];
        
        // Extract unique rooms and compute per-room stats
        const roomIds = [...new Set(csvData.map(row => row.room_id))].sort();
        setRooms(roomIds);

        // Compute latest stats per room
        const roomStats = roomIds.map(roomId => {
          const roomRows = csvData.filter(row => row.room_id === roomId);
          const latestRow = roomRows.reduce((latest, current) => {
            const latestAge = latest.age_days || 0;
            const currentAge = current.age_days || 0;
            return currentAge > latestAge ? current : latest;
          }, roomRows[0]);

          const avgMortality = roomRows.reduce((sum, row) => sum + (parseFloat(row.mortality_count) || 0), 0) / roomRows.length;
          const mortalityRate = (avgMortality / (latestRow.current_birds || 1)) * 100;

          const totalEggs = roomRows.reduce((sum, row) => sum + (parseFloat(row.eggs_produced) || 0), 0);
          const avgWeight = roomRows.reduce((sum, row) => sum + (parseFloat(row.avg_weight_kg) || 0), 0) / roomRows.length;
          
          // Calculate trend (compare last 7 days vs previous 7 days)
          const recentRows = roomRows.slice(-7);
          const previousRows = roomRows.slice(-14, -7);
          const recentAvgEggs = recentRows.reduce((sum, row) => sum + (parseFloat(row.eggs_produced) || 0), 0) / (recentRows.length || 1);
          const previousAvgEggs = previousRows.reduce((sum, row) => sum + (parseFloat(row.eggs_produced) || 0), 0) / (previousRows.length || 1);
          const trend = previousAvgEggs > 0 ? ((recentAvgEggs - previousAvgEggs) / previousAvgEggs) * 100 : 0;

          return {
            id: roomId,
            title: `Room ${roomId}`,
            birds: Math.round(latestRow.current_birds || 0),
            avgWeight: `${avgWeight.toFixed(2)} kg`,
            mortality: `${mortalityRate.toFixed(2)}%`,
            eggsCollected: Math.round(totalEggs),
            trend: Math.round(trend)
          };
        });

        setRoomsData(roomStats);

        // Compute farm-wide metrics
        const totalBirds = csvData.reduce((sum, row) => sum + (parseFloat(row.current_birds) || 0), 0) / csvData.length;
        const avgFCR = csvData.reduce((sum, row) => sum + (parseFloat(row.feed_conversion_ratio) || 0), 0) / csvData.length;
        const avgMortalityRate = csvData.reduce((sum, row) => sum + (parseFloat(row.mortality_count) || 0), 0) / csvData.length;
        const avgWaterConsumption = csvData.reduce((sum, row) => sum + (parseFloat(row.feed_intake_kg) || 0), 0) / csvData.length * 2.5; // Estimate
        
        setFarmMetrics({
          avgWeightGain: (csvData.reduce((sum, row) => sum + (parseFloat(row.avg_weight_kg) || 0), 0) / csvData.length).toFixed(2),
          fcr: avgFCR.toFixed(2),
          mortalityRate: ((avgMortalityRate / totalBirds) * 100).toFixed(2),
          waterConsumption: avgWaterConsumption.toFixed(1),
          energyEfficiency: 92, // Placeholder
          sustainabilityScore: 8.5 // Placeholder
        });

        setLoading(false);
      } catch (error) {
        console.error(error);
        setMessage("Error fetching rooms. Please check backend connection.");
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const metrics = farmMetrics ? [
    { title: "Average Weight Gain", value: `${farmMetrics.avgWeightGain} kg`, trend: 8, icon: "🐔" },
    { title: "Feed Conversion Ratio", value: farmMetrics.fcr, trend: -3, icon: "🌾" },
    { title: "Mortality Rate", value: `${farmMetrics.mortalityRate}%`, trend: 0, icon: "💚" },
    { title: "Water Consumption", value: `${farmMetrics.waterConsumption}L`, trend: 5, icon: "💧" },
    { title: "Energy Efficiency", value: `${farmMetrics.energyEfficiency}%`, trend: 2, icon: "⚡" },
    { title: "Sustainability Score", value: farmMetrics.sustainabilityScore, trend: 3, icon: "🌿" },
  ] : [
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
          <div className="text-yellow-700 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            ⚠️ {message}
          </div>
        )}

        {/* ✅ Dynamic Room Summary Section */}
        {roomsData.length > 0 && (
          <>
            <SectionTitle
              title="Room Performance Summary"
              subtitle={`Overview of all ${roomsData.length} active rooms`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {roomsData.map((room) => (
                <RoomCard key={room.id} {...room} />
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

        {/* ✅ Feed Efficiency Overview */}
        <SectionTitle
          title="Feed Efficiency Overview"
          subtitle="Monitor conversion ratios and cost performance"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeedEfficiencyCard
            feedType="Starter Feed"
            fcr={farmMetrics ? parseFloat(farmMetrics.fcr) + 0.13 : 1.78}
            costPerBird="$2.15"
            trend={+5}
          />
          <FeedEfficiencyCard
            feedType="Grower Feed"
            fcr={farmMetrics ? parseFloat(farmMetrics.fcr) : 1.65}
            costPerBird="$1.95"
            trend={+3}
          />
          <FeedEfficiencyCard
            feedType="Layer Feed"
            fcr={farmMetrics ? parseFloat(farmMetrics.fcr) - 0.1 : 1.55}
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
