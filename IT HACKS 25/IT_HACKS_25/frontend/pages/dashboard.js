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
import { getAllRoomsPredictions, getFeedRecommendations } from "@/utils/api";

export default function DashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [farmMetrics, setFarmMetrics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [feedRecommendations, setFeedRecommendations] = useState([]);
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

          const mortalityRate = parseFloat(latest.mortality_rate) || 0;

          const totalEggs = roomRows.reduce((s, r) => s + (parseFloat(r.eggs_produced) || 0), 0);
          const avgWeight = roomRows.reduce((s, r) => s + (parseFloat(r.avg_weight_kg) || 0), 0)
            / roomRows.length;

          return {
            id: roomId,
            title: `Room ${roomId}`,
            birds: Math.round(latest.birds_end),
            avgWeight: `${avgWeight.toFixed(2)} kg`,
            mortality: `${mortalityRate.toFixed(2)}%`,
            eggsCollected: Math.round(totalEggs),
          };
        });

        setRoomsData(roomStats);

        const latestRows = roomIds.map(roomId => {
          const roomRows = csvData.filter(r => r.room_id === roomId);
          return roomRows.reduce((acc, row) =>
            (row.age_days || 0) > (acc.age_days || 0) ? row : acc,
          roomRows[0]);
        });

        const totalBirds = latestRows.reduce((s, r) => s + (parseFloat(r.birds_end) || 0), 0);
        const totalMortality = latestRows.reduce((s, r) => s + (parseFloat(r.cumulative_mortality) || 0), 0);

        setFarmMetrics({
          avgWeightGain: (
            csvData.reduce((s, r) => s + (parseFloat(r.avg_weight_kg) || 0), 0)
            / csvData.length
          ).toFixed(2),
          fcr: (
            csvData.reduce((s, r) => s + (parseFloat(r.fcr) || 0), 0)
            / csvData.length
          ).toFixed(2),
          mortalityRate: (
            (totalMortality / (totalBirds + totalMortality)) * 100
          ).toFixed(2),
          waterConsumption: 2.5,
          energyEfficiency: 92,
          sustainabilityScore: 8.5
        });

        setLoading(false);

        // Fetch AI predictions for all rooms
        if (roomIds.length > 0) {
          try {
            const aiPredictions = await getAllRoomsPredictions();
            setPredictions(aiPredictions);
            
            // Get feed recommendations for the first room as example
            if (roomIds[0]) {
              const feedRecs = await getFeedRecommendations(roomIds[0]);
              setFeedRecommendations(feedRecs);
            }
          } catch (error) {
            console.error('Failed to load AI predictions:', error);
          }
        }
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

          {/* AI PREDICTIONS SECTION */}
          {predictions.length > 0 && (
            <>
              <SectionTitle 
                title="🤖 AI Predictions" 
                subtitle="Machine learning insights for optimal performance"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {predictions.slice(0, 6).map(pred => (
                  <div key={pred.room_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Room {pred.room_id}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        AI Forecast
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Predicted Weight:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {pred.predicted_avg_weight_kg} kg
                        </span>
                      </div>
                      {pred.recommendations && pred.recommendations.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Top Recommendation:</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {pred.recommendations[0].feed}
                            </span>
                            <span className="text-sm text-green-600">
                              {pred.recommendations[0].expected_avg_weight} kg
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FEED RECOMMENDATIONS */}
          {feedRecommendations.length > 0 && (
            <>
              <SectionTitle 
                title="🌾 Top Feed Recommendations" 
                subtitle="Optimized feed selection based on AI analysis"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {feedRecommendations.map((rec, idx) => (
                  <div key={rec.feed} className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all">
                    <div className="absolute top-4 right-4 text-4xl">{rec.emoji}</div>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                          #{rec.rank}
                        </span>
                        <span className="text-sm font-semibold text-gray-500">RECOMMENDED</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{rec.feed}</h3>
                      <p className="text-sm text-gray-600">{rec.benefit}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Performance Score:</span>
                        <span className="font-bold text-green-600">{(rec.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${rec.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
