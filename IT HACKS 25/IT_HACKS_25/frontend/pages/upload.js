import { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import UploadBox from "@/components/ui/UploadBox";
import FileList from "@/components/ui/FileList";
import FilePreview from "@/components/ui/FilePreview";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/upload/files`);
      setFiles(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load files: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ Please select a CSV file first.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError(null);
    
    const form = new FormData();
    form.append("file", file);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/upload/csv`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`✅ Upload successful! File saved as: ${response.data.filename}`);
      setFile(null); // Clear the selected file
      await fetchFiles(); // Refresh the file list
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`❌ Upload failed: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (file) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiBaseUrl}/upload/preview/${encodeURIComponent(file.path)}`);
      setPreviewData(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Failed to load preview: ${errorMsg}`);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* 🔹 Page Header */}
        <DashboardHeader
          title="Upload CSV"
          subtitle="Upload or manage your farm data files for analysis"
          actionLabel="Go to Dashboard"
          actionHref="/dashboard"
        />

        {/* 🔹 Upload Section */}
        <DashboardSection title="Upload Data" subtitle="Add new CSV files for analysis">
          <GlassCard>
            <UploadBox onFileSelect={setFile} />
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
                  loading || !file
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? "⏳ Uploading..." : "📤 Upload File"}
              </button>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setMessage("");
                    setError(null);
                  }}
                  className="px-4 py-3 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
                >
                  Clear
                </button>
              )}
            </div>
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.startsWith('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : message.startsWith('⚠️')
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </GlassCard>
        </DashboardSection>

        {/* 🔹 File List Section */}
        <DashboardSection
          title="Available Files"
          subtitle="Manage your uploaded CSV files"
        >
          <GlassCard>
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
          </GlassCard>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
