
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function RoomDetail() {
  const router = useRouter()
  const { id } = router.query
  const [kpis, setKpis] = useState(null)
  const [pred, setPred] = useState(null)

  useEffect(()=>{
    if (!id) return
    const fetch = async () => {
      try {
        const r = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analysis/rooms/${id}/kpis`)
        setKpis(r.data)
        const p = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analysis/rooms/${id}/predict`)
        setPred(p.data)
      } catch(e){
        console.error(e)
      }
    }
    fetch()
  },[id])

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Room: {id}</h2>
        {kpis ? (
          <div>
            <p>Avg Weight: {kpis.avg_weight_kg}</p>
            <p>FCR: {kpis.fcr}</p>
            <p>Mortality Rate: {kpis.mortality_rate}</p>
          </div>
        ) : <p>Loading KPIs...</p>}
        <div className="mt-4">
          <h3 className="font-semibold">Prediction</h3>
          {pred ? (
            <div>
              <p>Predicted Avg Weight: {pred.predicted_avg_weight_kg}</p>
              {pred.error ? (
                <p className="text-red-500">{pred.error}</p>
              ) : (
                <>
                  <p>Top Recommendations:</p>
                  <ul className="list-disc ml-6">
                    {pred.recommendations && pred.recommendations.length > 0 ? (
                      pred.recommendations.map((r, idx)=>(<li key={idx}>
                        {`${r.feed} -> expected avg weight ${r.expected_avg_weight}`}
                      </li>
                      ))
                    ) : (
                      <li>No recommendations available</li>
                    )}
                  </ul>
                </>
              )}
            </div>
          ) : <p>Loading prediction...</p>}
        </div>
      </div>
    </div>
  )
}
