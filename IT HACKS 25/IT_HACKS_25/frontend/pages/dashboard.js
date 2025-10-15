import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import ChartCard from '../components/ui/ChartCard'
import DashboardLayout from "../components/layout/DashboardLayout";
import MetricCard from "../components/ui/MetricCard";
import AnalyticsChart from "../components/ui/AnalyticsChart";

export default function DashboardPage() {
  const [rooms, setRooms] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analysis/rooms`)
        setRooms(r.data.rooms || [])
      } catch (e) {
        setMessage('Error fetching rooms')
      }
    }
    fetch()
  }, [])

  const mockMetrics = [
    { title: "Average Weight Gain", value: "2.4 kg", trend: 8 },
    { title: "Feed Conversion Ratio", value: "1.78", trend: -3 },
    { title: "Mortality Rate", value: "0.5%", trend: 0 },
  ];

  const mockChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [2.1, 2.3, 2.5, 2.4, 2.6, 2.8, 3.0],
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-700">Farm Dashboard</h1>
          <Link href="/upload" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
            Upload CSV
          </Link>
        </div>
        {message && <div className="text-red-500 mb-4">{message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((r) => (
            <ChartCard key={r} title={r} />
          ))}
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMetrics.map((m) => (
            <MetricCard key={m.title} title={m.title} value={m.value} trend={m.trend} />
          ))}
        </div>

        {/* Chart area */}
        <div className="grid grid-cols-1 gap-6">
          <div className="col-span-1">
            <AnalyticsChart
              title="Weekly Weight Gain Trend"
              labels={mockChartData.labels}
              data={mockChartData.data}
              datasetLabel="Weight (kg)"
              type="line"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
