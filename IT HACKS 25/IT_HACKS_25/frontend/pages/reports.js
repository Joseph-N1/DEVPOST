import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from '@/components/layout/DashboardLayout';
import PageContainer from "@/components/ui/PageContainer";
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { useTranslation } from 'react-i18next';
import { Download, Trophy, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [roomReports, setRoomReports] = useState([]);
  const [rankings, setRankings] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [selectedKPI, setSelectedKPI] = useState('eggs');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch the most recent CSV file
        const filesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/files`
        );
        
        const files = filesResponse.data || [];
        
        if (!files || files.length === 0) {
          setLoading(false);
          return;
        }

        const sortedFiles = files.sort(
          (a, b) => new Date(b.modified) - new Date(a.modified)
        );
        const latestFile = sortedFiles[0];

        // Fetch full data
        const dataResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/preview/${encodeURIComponent(latestFile.path)}?rows=3000`
        );

        const csvData = dataResponse.data.preview_rows || [];
        const roomIds = [...new Set(csvData.map(row => row.room_id))].sort();

        // Compute per-room statistics
        const reports = roomIds.map(roomId => {
          const roomRows = csvData.filter(row => row.room_id === roomId);
          
          const totalEggs = roomRows.reduce((sum, row) => sum + (parseFloat(row.eggs_produced) || 0), 0);
          const avgWeight = roomRows.reduce((sum, row) => sum + (parseFloat(row.avg_weight_kg) || 0), 0) / roomRows.length;
          const avgFCR = roomRows.reduce((sum, row) => sum + (parseFloat(row.feed_conversion_ratio) || 0), 0) / roomRows.length;
          const totalMortality = roomRows.reduce((sum, row) => sum + (parseFloat(row.mortality_count) || 0), 0);
          const avgTemp = roomRows.reduce((sum, row) => sum + (parseFloat(row.temperature_c) || 0), 0) / roomRows.length;
          const avgHumidity = roomRows.reduce((sum, row) => sum + (parseFloat(row.humidity_pct) || 0), 0) / roomRows.length;
          const totalFeed = roomRows.reduce((sum, row) => sum + (parseFloat(row.feed_intake_kg) || 0), 0);
          
          const latestRow = roomRows[roomRows.length - 1];
          const currentBirds = latestRow.current_birds || 0;
          const mortalityRate = (totalMortality / (currentBirds + totalMortality)) * 100;

          // Peak production day
          const peakEggs = Math.max(...roomRows.map(row => parseFloat(row.eggs_produced) || 0));
          const peakDay = roomRows.find(row => parseFloat(row.eggs_produced) === peakEggs)?.age_days || 0;

          return {
            roomId,
            totalEggs: Math.round(totalEggs),
            avgWeight: avgWeight.toFixed(2),
            avgFCR: avgFCR.toFixed(2),
            totalMortality: Math.round(totalMortality),
            mortalityRate: mortalityRate.toFixed(2),
            avgTemp: avgTemp.toFixed(1),
            avgHumidity: avgHumidity.toFixed(1),
            totalFeed: totalFeed.toFixed(1),
            peakEggs: Math.round(peakEggs),
            peakDay: Math.round(peakDay),
            currentBirds,
            daysTracked: roomRows.length
          };
        });

        setRoomReports(reports);

        // Compute rankings
        const rankByEggs = [...reports].sort((a, b) => b.totalEggs - a.totalEggs);
        const rankByWeight = [...reports].sort((a, b) => parseFloat(b.avgWeight) - parseFloat(a.avgWeight));
        const rankByFCR = [...reports].sort((a, b) => parseFloat(a.avgFCR) - parseFloat(b.avgFCR)); // Lower is better
        const rankByMortality = [...reports].sort((a, b) => parseFloat(a.mortalityRate) - parseFloat(b.mortalityRate)); // Lower is better

        setRankings({
          eggs: rankByEggs,
          weight: rankByWeight,
          fcr: rankByFCR,
          mortality: rankByMortality
        });

        // Generate recommendations
        const recs = [];
        reports.forEach(report => {
          // High mortality
          if (parseFloat(report.mortalityRate) > 2.0) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Health',
              message: `Room ${report.roomId} has high mortality rate (${report.mortalityRate}%). Review biosecurity measures and ventilation.`
            });
          }

          // High temperature
          if (parseFloat(report.avgTemp) > 28) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Environment',
              message: `Room ${report.roomId} average temperature is ${report.avgTemp}°C. Consider improving cooling systems.`
            });
          }

          // Low egg production
          if (report.totalEggs < reports[0].totalEggs * 0.7) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Production',
              message: `Room ${report.roomId} egg production (${report.totalEggs}) is below average. Check feed quality and lighting schedule.`
            });
          }

          // Poor FCR
          if (parseFloat(report.avgFCR) > 2.5) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Feed Efficiency',
              message: `Room ${report.roomId} FCR is ${report.avgFCR}. Review feed formulation and feeding schedule.`
            });
          }

          // Good performance
          if (parseFloat(report.mortalityRate) < 1.0 && parseFloat(report.avgFCR) < 2.0) {
            recs.push({
              roomId: report.roomId,
              type: 'success',
              category: 'Performance',
              message: `Room ${report.roomId} shows excellent performance! Maintain current management practices.`
            });
          }
        });

        setRecommendations(recs);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const exportReport = () => {
    // Generate CSV export
    let csvContent = "Room ID,Total Eggs,Avg Weight (kg),Avg FCR,Total Mortality,Mortality Rate (%),Avg Temp (°C),Avg Humidity (%),Peak Eggs,Peak Day\n";
    
    roomReports.forEach(report => {
      csvContent += `${report.roomId},${report.totalEggs},${report.avgWeight},${report.avgFCR},${report.totalMortality},${report.mortalityRate},${report.avgTemp},${report.avgHumidity},${report.peakEggs},${report.peakDay}\n`;
    });

    csvContent += "\n\nRecommendations\n";
    csvContent += "Room ID,Category,Message\n";
    recommendations.forEach(rec => {
      csvContent += `${rec.roomId},${rec.category},"${rec.message}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer wide>
          <div className="flex items-center justify-center h-screen">
            <Loading />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  if (roomReports.length === 0) {
    return (
      <Layout>
        <PageContainer wide>
          <Card className="p-8 text-center">
            <p className="text-gray-500 text-sm sm:text-base">No CSV data available. Please upload a file to generate reports.</p>
          </Card>
        </PageContainer>
      </Layout>
    );
  }

  const currentRanking = rankings[selectedKPI] || [];

  return (
    <Layout>
      <PageContainer wide>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">📊 Farm Performance Reports</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base leading-relaxed">Comprehensive analytics, rankings, and recommendations</p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>

        {/* Rankings Selector */}
        <Card className="p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Room Rankings
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedKPI('eggs')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'eggs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🥚 Egg Production
            </button>
            <button
              onClick={() => setSelectedKPI('weight')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'weight' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚖️ Average Weight
            </button>
            <button
              onClick={() => setSelectedKPI('fcr')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'fcr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌾 Feed Efficiency (FCR)
            </button>
            <button
              onClick={() => setSelectedKPI('mortality')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'mortality' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💚 Lowest Mortality
            </button>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Room</th>
                  <th className="text-left py-3 px-4">
                    {selectedKPI === 'eggs' && 'Total Eggs'}
                    {selectedKPI === 'weight' && 'Avg Weight (kg)'}
                    {selectedKPI === 'fcr' && 'Feed Conversion Ratio'}
                    {selectedKPI === 'mortality' && 'Mortality Rate (%)'}
                  </th>
                  <th className="text-left py-3 px-4">Performance</th>
                </tr>
              </thead>
              <tbody>
                {currentRanking.map((report, index) => (
                  <tr key={report.roomId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="text-yellow-500" size={20} />}
                        {index === 1 && <Trophy className="text-gray-400" size={18} />}
                        {index === 2 && <Trophy className="text-orange-600" size={16} />}
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">Room {report.roomId}</td>
                    <td className="py-3 px-4">
                      {selectedKPI === 'eggs' && report.totalEggs.toLocaleString()}
                      {selectedKPI === 'weight' && `${report.avgWeight} kg`}
                      {selectedKPI === 'fcr' && report.avgFCR}
                      {selectedKPI === 'mortality' && `${report.mortalityRate}%`}
                    </td>
                    <td className="py-3 px-4">
                      {index === 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp size={16} /> Excellent
                        </span>
                      )}
                      {index > 0 && index < currentRanking.length - 1 && (
                        <span className="text-gray-600">Average</span>
                      )}
                      {index === currentRanking.length - 1 && currentRanking.length > 2 && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <TrendingDown size={16} /> Needs Attention
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Per-Room Summary */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">📋 Per-Room Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roomReports.map(report => (
              <Card key={report.roomId} className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-700">Room {report.roomId}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Eggs</p>
                    <p className="font-semibold text-lg">{report.totalEggs.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Peak Production</p>
                    <p className="font-semibold text-lg">{report.peakEggs} eggs (Day {report.peakDay})</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Weight</p>
                    <p className="font-semibold text-lg">{report.avgWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Feed Conversion</p>
                    <p className="font-semibold text-lg">{report.avgFCR}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mortality Rate</p>
                    <p className="font-semibold text-lg">{report.mortalityRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Birds</p>
                    <p className="font-semibold text-lg">{report.currentBirds.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Temperature</p>
                    <p className="font-semibold text-lg">{report.avgTemp}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Humidity</p>
                    <p className="font-semibold text-lg">{report.avgHumidity}%</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💡 Recommendations & Insights
          </h2>
          <div className="space-y-3">
            {recommendations.length === 0 && (
              <p className="text-gray-500">No specific recommendations at this time. All rooms performing well!</p>
            )}
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {rec.type === 'warning' ? (
                    <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                  ) : (
                    <TrendingUp className="text-green-600 mt-1" size={20} />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-gray-700">{rec.category}</p>
                    <p className="text-gray-800 mt-1">{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </Layout>
  );
}
