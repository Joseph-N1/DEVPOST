import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-white to-sky-100">
      <div className="max-w-3xl w-full p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-green-100">
        <h1 className="text-3xl font-extrabold text-green-700 mb-4">Poultry Performance Tracker 🌾</h1>
        <p className="mb-6 text-gray-700">
          Track and visualize poultry farm performance effortlessly. Upload your CSV data to view analytics dashboards powered by AI.
        </p>
        <div className="flex gap-4">
          <Link href="/upload" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all">
            Upload CSV
          </Link>
          <Link href="/dashboard" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-all">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}