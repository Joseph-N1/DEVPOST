import { Line } from 'react-chartjs-2'

export default function ChartCard({ title }) {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Performance',
      data: [65, 59, 80, 81],
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      tension: 0.3
    }]
  }

  return (
    <div className="bg-white/70 backdrop-blur-md p-5 rounded-xl shadow-md hover:shadow-lg transition">
      <h2 className="text-lg font-semibold text-green-700 mb-3">{title}</h2>
      <Line data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  )
}
