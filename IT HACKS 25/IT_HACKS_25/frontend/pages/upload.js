import { useState, useEffect } from 'react'
import axios from 'axios'
import UploadBox from '../components/ui/UploadBox'
import FileList from '../components/ui/FileList'
import FilePreview from '../components/ui/FilePreview'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(null)

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiBaseUrl}/upload/files`)
      setFiles(res.data)
      setError(null)
    } catch (err) {
      setError('Failed to load files: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return setMessage('Please select a CSV file')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await axios.post(`${apiBaseUrl}/upload/csv`, form, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
      setMessage('✅ Upload successful!')
      fetchFiles() // Refresh file list after upload
    } catch (err) {
      setMessage('❌ Error: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handlePreview = async (file) => {
    setPreviewLoading(true)
    try {
      const res = await axios.get(`${apiBaseUrl}/upload/preview/${file.path}`)
      setPreviewData(res.data)
      setError(null)
    } catch (err) {
      setError('Failed to load preview: ' + err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-sky-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow">
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

        {/* Available Files Section */}
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Available Files</h2>
          <FileList 
            files={files}
            onFileSelect={handlePreview}
            loading={loading}
            error={error}
          />
          {previewData && (
            <FilePreview
              preview={previewData}
              loading={previewLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
}
