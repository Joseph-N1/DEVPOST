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
    if (!file) return setMessage("Please select a CSV file first.");
    const form = new FormData();
    form.append("file", file);
    try {
      await axios.post(`${apiBaseUrl}/upload/csv`, form);
      setMessage("✅ Upload successful!");
      fetchFiles();
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handlePreview = async (file) => {
    setPreviewLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/upload/preview/${file.path}`);
      setPreviewData(res.data);
    } catch (err) {
      setError("Failed to load preview: " + err.message);
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
            <button
              onClick={handleUpload}
              className="mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Upload
            </button>
            {message && (
              <div className="mt-4 text-green-700 font-medium">{message}</div>
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
