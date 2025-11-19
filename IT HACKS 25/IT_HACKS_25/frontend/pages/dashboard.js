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
import RefreshButton from "@/components/ui/RefreshButton";
import { getAllRoomsPredictions, getFeedRecommendations, getAIAnalysis, getAnomalies } from "@/utils/api";

export default function DashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [farmMetrics, setFarmMetrics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [feedRecommendations, setFeedRecommendations] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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

            // Fetch AI Intelligence Analysis
            const aiInsights = await getAIAnalysis();
            if (!aiInsights.error) {
              setAiAnalysis(aiInsights);
            }

            // Fetch Anomaly Detection Results
            const anomalyResults = await getAnomalies();
            if (!anomalyResults.error) {
              setAnomalies(anomalyResults.anomalies || []);
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

  useEffect(() => {
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

          <div className="flex justify-between items-center">
            <DashboardHeader
              title="Farm Dashboard"
              subtitle="Monitor live farm performance and key metrics"
              actionLabel="Upload CSV"
              actionHref="/upload"
            />
            <RefreshButton onRefresh={fetchDashboardData} />
          </div>

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
              { title: "Average Weight Gain", value: `${farmMetrics.avgWeightGain} kg`, icon: "🐔", metricKey: "avg_weight_kg" },
              { title: "Feed Conversion Ratio", value: farmMetrics.fcr, icon: "🌾", metricKey: "fcr" },
              { title: "Mortality Rate", value: `${farmMetrics.mortalityRate}%`, icon: "💚", metricKey: "mortality_rate" },
              { title: "Water Consumption", value: `2.5L`, icon: "💧", metricKey: "water_liters_total" },
              { title: "Energy Efficiency", value: `92%`, icon: "⚡" },
              { title: "Sustainability Score", value: `8.5`, icon: "🌿" },
            ].map(m => <MetricCard key={m.title} {...m} />)}
          </div>

          {/* AI INTELLIGENCE INSIGHTS */}
          {aiAnalysis && (
            <>
              <SectionTitle 
                title="🧠 AI Intelligence Insights" 
                subtitle="Real-time recommendations and risk analysis"
              />
              
              {/* Critical Alerts - Anomalies */}
              {anomalies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🚨 Detected Anomalies</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      {anomalies.length} Alert{anomalies.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {anomalies.slice(0, 4).map((anomaly, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          anomaly.severity === 'critical' ? 'bg-red-50 border-red-500' :
                          anomaly.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                          'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{anomaly.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900">{anomaly.metric}</h4>
                              <span className="text-xs text-gray-600">Room {anomaly.room_id}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{anomaly.explanation}</p>
                            <div className="bg-white px-2 py-1 rounded text-xs text-gray-600">
                              <strong>Action:</strong> {anomaly.actions[0]}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feed Optimization */}
                {aiAnalysis.feed_optimization && aiAnalysis.feed_optimization.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-green-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🌾</span> Feed Optimization
                    </h3>
                    <div className="space-y-3">
                      {aiAnalysis.feed_optimization.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">Room {rec.room_id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              rec.severity === 'high' ? 'bg-red-100 text-red-700' :
                              rec.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {rec.emoji} {rec.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{rec.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mortality Risks */}
                {aiAnalysis.mortality_risks && aiAnalysis.mortality_risks.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-red-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>💊</span> Health & Mortality Risks
                    </h3>
                    <div className="space-y-3">
                      {aiAnalysis.mortality_risks.slice(0, 3).map((risk, idx) => (
                        <div key={idx} className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">Room {risk.room_id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              risk.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                              risk.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {risk.emoji} {risk.risk_level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{risk.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Environmental Warnings */}
                {aiAnalysis.environmental_warnings && aiAnalysis.environmental_warnings.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🌡️</span> Environmental Conditions
                    </h3>
                    <div className="space-y-3">
                      {aiAnalysis.environmental_warnings.slice(0, 3).map((warning, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">Room {warning.room_id}</span>
                            <span className="text-xs text-gray-600">
                              {warning.temperature}°C | {warning.humidity}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{warning.warnings[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Summary */}
                {aiAnalysis.health_summary && (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-purple-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>{aiAnalysis.health_summary.emoji}</span> Farm Health Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Overall Status:</span>
                        <span className="font-bold text-lg">{aiAnalysis.health_summary.health_status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Birds:</span>
                        <span className="font-semibold">{aiAnalysis.health_summary.total_birds}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mortality Rate:</span>
                        <span className="font-semibold">{aiAnalysis.health_summary.avg_mortality_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Eggs (7 days):</span>
                        <span className="font-semibold">{aiAnalysis.health_summary.total_eggs_produced}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-3 pt-3 border-t">{aiAnalysis.health_summary.summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

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
