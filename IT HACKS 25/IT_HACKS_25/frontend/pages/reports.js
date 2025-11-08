import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import AnalyticsChart from "@/components/ui/AnalyticsChart";
import AnalyticsEmptyState from "@/components/ui/AnalyticsEmptyState";
import { FileSpreadsheet, Download, Trash2, BarChart2, RefreshCcw } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/upload/files`);
      setReports(response.data || []);
    } catch (err) {
      setMessage("❌ Could not fetch reports. Check backend or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (path) => {
    window.open(`${apiBase}/upload/download/${path}`, "_blank");
  };

  const handleDelete = async (path) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await axios.delete(`${apiBase}/upload/delete/${path}`);
      fetchReports();
    } catch (err) {
      setMessage("⚠️ Failed to delete file. Please retry.");
    }
  };

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    data: [500, 850, 1200, 980],
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <DashboardHeader
          title="Reports"
          subtitle="View, download, and analyze your uploaded CSV files"
          actionLabel="Upload New CSV"
          actionHref="/upload"
        />

        {message && (
          <div className="text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Recent Uploads Section */}
        <DashboardSection
          title="Recent Uploads"
          subtitle="All CSV reports currently available"
        >
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading reports...</p>
          ) : reports.length === 0 ? (
            <AnalyticsEmptyState
              message="No reports available yet. Upload your first CSV to get started!"
              onAction={() => (window.location.href = "/upload")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((file, index) => (
                <GlassCard key={index} className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-green-700">{file.filename}</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {file.size ? (file.size / 1024).toFixed(2) + " KB" : "Unknown size"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(file.path)}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-green-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.path)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm">
                    <p>Uploaded: {new Date(file.modified * 1000).toLocaleDateString()}</p>
                    <p>Type: {file.type || "CSV Data"}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </DashboardSection>

        {/* Upload Trends Chart */}
        <DashboardSection
          title="Upload Trends"
          subtitle="Visual breakdown of upload frequency and report volume"
        >
          <GlassCard>
            <AnalyticsChart
              title="Report Upload Trends"
              labels={chartData.labels}
              data={chartData.data}
              datasetLabel="Files Uploaded"
            />
          </GlassCard>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
