"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import RefreshButton from '@/components/ui/RefreshButton';
import { getWeeklyData, getWeekComparison } from '@/utils/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function WeeklyPage() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [error, setError] = useState(null);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      
      // Fetch weekly aggregated data
      const weeklyResponse = await getWeeklyData();
      if (weeklyResponse.error) {
        throw new Error(weeklyResponse.error);
      }
      
      setWeeklyData(weeklyResponse.weekly_data || []);
      
      // Fetch week comparisons
      const comparisonResponse = await getWeekComparison();
      if (!comparisonResponse.error) {
        setComparisons(comparisonResponse.comparisons || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch weekly data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Group weekly data by room
  const roomGroups = {};
  weeklyData.forEach(week => {
    if (!roomGroups[week.room_id]) {
      roomGroups[week.room_id] = [];
    }
    roomGroups[week.room_id].push(week);
  });

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <Loading />
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer wide>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Weekly Performance</h1>
            <p className="text-gray-600 mt-1">
              Week-by-week analysis and trends across all rooms
            </p>
          </div>
          <RefreshButton onRefresh={fetchWeeklyData} />
        </div>

        {error && (
          <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">⚠️ {error}</p>
          </Card>
        )}

        {/* Weekly Summary Cards */}
        {Object.entries(roomGroups).map(([roomId, weeks]) => (
          <div key={roomId} className="mb-10 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Room {roomId}
            </h2>

            {/* Weekly Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {weeks.map((week, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-indigo-600">
                      Week {week.week}
                    </h3>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                      {week.birds_start} → {week.birds_end} birds
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Avg Weight</p>
                      <p className="text-xl font-bold text-gray-900">{week.avg_weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Eggs</p>
                      <p className="text-xl font-bold text-gray-900">{week.total_eggs.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">FCR</p>
                      <p className="text-xl font-bold text-gray-900">{week.fcr}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mortality</p>
                      <p className="text-xl font-bold text-red-600">{week.mortality_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Feed</p>
                      <p className="text-lg font-semibold text-gray-800">{week.total_feed} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Water</p>
                      <p className="text-lg font-semibold text-gray-800">{week.total_water} L</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Temp: </span>
                      <span className="font-semibold">{week.avg_temp}°C</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Humidity: </span>
                      <span className="font-semibold">{week.avg_humidity}%</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Week-over-Week Comparison Table */}
        {comparisons.length > 0 && (
          <div className="mt-10 animate-fade-in-up animate-delay-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📈</span>
              Week-over-Week Comparison
            </h2>

            <Card className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Egg Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FCR Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mortality Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisons.map((comp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comp.room_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        W{comp.prev_week} → W{comp.week}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center gap-2 ${getTrendColor(comp.weight_change_pct)}`}>
                          {getTrendIcon(comp.weight_change_pct)}
                          <span className="font-semibold">{comp.weight_change_pct > 0 ? '+' : ''}{comp.weight_change_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center gap-2 ${getTrendColor(comp.egg_change_pct)}`}>
                          {getTrendIcon(comp.egg_change_pct)}
                          <span className="font-semibold">{comp.egg_change_pct > 0 ? '+' : ''}{comp.egg_change_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center gap-2 ${getTrendColor(-comp.fcr_change_pct)}`}>
                          {getTrendIcon(-comp.fcr_change_pct)}
                          <span className="font-semibold">{comp.fcr_change_pct > 0 ? '+' : ''}{comp.fcr_change_pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center gap-2 ${getTrendColor(-comp.mortality_change_pct)}`}>
                          {getTrendIcon(-comp.mortality_change_pct)}
                          <span className="font-semibold">{comp.mortality_change_pct > 0 ? '+' : ''}{comp.mortality_change_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {weeklyData.length === 0 && !loading && (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">
              📂 No weekly data available. Upload a CSV file to see weekly aggregations.
            </p>
          </Card>
        )}
      </PageContainer>
    </Layout>
  );
}
