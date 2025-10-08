
import { useState } from 'react'
import axios from 'axios'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')

  const handleUpload = async () => {
    if (!file) return setMessage('Please select a CSV file')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload/csv`, form, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
      setMessage('Uploaded: ' + JSON.stringify(res.data))
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>
        <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files[0])} className="mb-4"/>
        <div className="flex gap-2">
          <button onClick={handleUpload} className="px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
        </div>
        <div className="mt-4 text-sm text-gray-700">{message}</div>
      </div>
    </div>
  )
}
