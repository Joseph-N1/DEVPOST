
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function Dashboard() {
  const [rooms, setRooms] = useState([])
  const [message, setMessage] = useState('')

  useEffect(()=>{
    const fetch = async () => {
      try {
        const r = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analysis/rooms`)
        setRooms(r.data.rooms || [])
      } catch (e) {
        setMessage('Error fetching rooms')
      }
    }
    fetch()
  },[])

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Rooms</h1>
          <Link href="/upload" className="px-3 py-1 bg-blue-600 text-white rounded">
  Upload CSV
</Link>

        </div>
        {message && <div className="text-red-500">{message}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map((r)=> (
            <div key={r} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{r}</h3>
              <p className="text-sm text-gray-600">Click to view details</p>
              <div className="mt-2">
                <a className="text-blue-600" href={`/rooms/${encodeURIComponent(r)}`}>Open</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
