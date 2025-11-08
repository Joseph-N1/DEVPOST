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

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMetrics, setSelectedMetrics] = useState([
    'birds', 'weight', 'mortality', 'feed', 'water', 'temperature'
  ]);

  const availableMetrics = [
    { id: 'birds', label: 'Bird Count', unit: '' },
    { id: 'weight', label: 'Average Weight', unit: 'kg' },
    { id: 'mortality', label: 'Mortality Rate', unit: '%' },
    { id: 'feed', label: 'Feed Consumption', unit: 'kg/bird' },
    { id: 'water', label: 'Water Usage', unit: 'L' },
    { id: 'temperature', label: 'Temperature', unit: '°C' }
  ];

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const exportData = (format) => {
    if (!reports.length) {
      setMessage("No data available to export");
      return;
    }

    // TODO: Implement actual export functionality
    const filename = `poultry_report_${new Date().toISOString().split('T')[0]}.${format}`;
    setMessage(`Exported data as ${filename}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <DashboardHeader
          title="Reports & Analytics"
          subtitle="Generate reports, filter data, and export analytics"
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

        {/* Filters Section */}
        <DashboardSection
          title="Report Filters"
          subtitle="Customize your data view and export options"
        >
          <GlassCard>
            <div className="p-6 space-y-6">
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date Range</label>
                <div className="flex gap-4">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {availableMetrics.map((metric) => (
                    <button
                      key={metric.id}
                      onClick={() => handleMetricToggle(metric.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedMetrics.includes(metric.id)
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      } border hover:bg-opacity-80 transition-colors`}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </DashboardSection>

        {/* Recent Uploads Section */}
        <DashboardSection
          title="Available Reports"
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

        {/* Export Options */}
        <DashboardSection
          title="Export Options"
          subtitle="Download your filtered data in different formats"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => exportData('csv')}
            >
              <div className="p-6 text-center space-y-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto" />
                <h3 className="font-medium">CSV Export</h3>
                <p className="text-sm text-gray-600">Raw data in spreadsheet format</p>
              </div>
            </GlassCard>

            <GlassCard 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => exportData('json')}
            >
              <div className="p-6 text-center space-y-3">
                <Download className="w-8 h-8 text-blue-600 mx-auto" />
                <h3 className="font-medium">JSON Export</h3>
                <p className="text-sm text-gray-600">Structured data format</p>
              </div>
            </GlassCard>

            <GlassCard 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => exportData('pdf')}
            >
              <div className="p-6 text-center space-y-3">
                <BarChart2 className="w-8 h-8 text-red-600 mx-auto" />
                <h3 className="font-medium">PDF Report</h3>
                <p className="text-sm text-gray-600">Formatted report with charts</p>
              </div>
            </GlassCard>
          </div>
        </DashboardSection>

        {/* Upload Trends Chart */}
        <DashboardSection
          title="Upload Analytics"
          subtitle="Visual breakdown of data uploads and processing"
        >
          <GlassCard>
            <AnalyticsChart
              title="Report Upload Trends"
              labels={chartData.labels}
              data={chartData.data}
              datasetLabel="Files Processed"
            />
          </GlassCard>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
