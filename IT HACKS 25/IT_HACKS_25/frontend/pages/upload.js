import { useState } from 'react'
import axios from 'axios'
import UploadBox from '../components/ui/UploadBox'

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
      setMessage('✅ Upload successful!')
    } catch (err) {
      setMessage('❌ Error: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-sky-50 p-8">
      <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Upload CSV</h2>
        <UploadBox onFileSelect={setFile} />
        <button
          onClick={handleUpload}
          className="mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
        >
          Upload
        </button>
        {message && <div className="mt-4 text-green-700 font-medium">{message}</div>}
      </div>
    </div>
  )
}
