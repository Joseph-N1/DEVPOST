
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-3xl w-full p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Poultry Performance Tracker - Demo</h1>
        <p className="mb-4">Quick demo dashboard for IT HACKS 25. Use the Upload page to send CSV data to the backend.</p>
        <div className="flex gap-4">
          <Link
  href="/upload"
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Upload CSV
</Link>

<Link
  href="/dashboard"
  className="px-4 py-2 bg-green-600 text-white rounded"
>
  Dashboard
</Link>

        </div>
      </div>
    </div>
  )
}
