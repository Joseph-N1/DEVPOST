import { useState, useEffect } from "react";
import axios from "axios";
import apiClient from "@/lib/apiClient";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import UploadBox from "@/components/ui/UploadBox";
import FileList from "@/components/ui/FileList";
import FilePreview from "@/components/ui/FilePreview";
import PageContainer from "@/components/ui/PageContainer";

export default function Upload() {
  const { currentTheme } = useTheme();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);
  
  // Model management state
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [trainingType, setTrainingType] = useState('random_forest');
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    fetchFiles();
    fetchModels();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/upload/files`);
      setFiles(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load files: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const res = await apiClient.get('/ml/models');
      setModels(res.data.models || []);
      setActiveModel(res.data.active_model || null);
      setSelectedModel(res.data.active_model?.id || null);
    } catch (err) {
      console.error("Failed to load models:", err);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setMessage("");
    try {
      const res = await apiClient.post(`/ml/train?model_type=${trainingType}`);
      setMessage(`✅ Model trained successfully! Version: ${res.data.version}, R²: ${res.data.metrics?.test_r2 != null ? (res.data.metrics.test_r2 * 100).toFixed(2) : 'N/A'}%`);
      await fetchModels();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`❌ Training failed: ${errorMsg}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleActivateModel = async (modelId) => {
    try {
      await apiClient.post(`/ml/models/${modelId}/activate`);
      setMessage(`✅ Model ${modelId} activated successfully!`);
      await fetchModels();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`❌ Failed to activate model: ${errorMsg}`);
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
      const response = await apiClient.post(`/upload/csv?clear_existing=${clearExisting}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`✅ Upload successful! Imported ${response.data.metrics_inserted} metrics into ${response.data.farm_name}`);
      setFile(null);
      await fetchFiles();
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
      const res = await apiClient.get(
        `/upload/preview/${encodeURIComponent(file.path)}`
      );
      setPreviewData(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Failed to load preview: ${errorMsg}`);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStatusBadge = (model) => {
    if (model.is_active) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
          ✓ Active
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        Inactive
      </span>
    );
  };

  return (
    <DashboardLayout>
      <PageContainer wide>
        <div className="py-10 space-y-10">

          {/* 🔹 Page Header */}
          <DashboardHeader
            title="Upload & Model Management"
            subtitle="Upload farm data and manage ML models"
            actionLabel="Go to Dashboard"
            actionHref="/dashboard"
          />

          {/* 🔹 Model Selection Section */}
          <DashboardSection title="🤖 ML Models" subtitle="Select or train prediction models">
            <GlassCard>
              <div className="space-y-6">
                {/* Current Active Model */}
                {activeModel && (
                  <div className={`p-4 rounded-lg border ${
                    currentTheme === 'dark' 
                      ? 'bg-emerald-900/30 border-emerald-700' 
                      : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          Currently Active Model
                        </p>
                        <p className={`text-lg font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {activeModel.name || activeModel.version}
                        </p>
                        <div className={`text-sm mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          R²: {activeModel.test_r2 != null ? (activeModel.test_r2 * 100).toFixed(2) : 'N/A'}% | MAE: {activeModel.test_mae?.toFixed(4) || 'N/A'} | Type: {activeModel.model_type || 'Unknown'}
                        </div>
                      </div>
                      <div className="text-4xl">🎯</div>
                    </div>
                  </div>
                )}

                {/* Model List */}
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Available Models ({models.length})
                  </h4>
                  {modelsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                  ) : models.length === 0 ? (
                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No models trained yet. Train your first model below!
                    </p>
                  ) : (
                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            model.is_active
                              ? currentTheme === 'dark'
                                ? 'bg-green-900/30 border-green-600'
                                : 'bg-green-50 border-green-300'
                              : currentTheme === 'dark'
                                ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                : 'bg-white border-gray-200 hover:border-gray-400'
                          }`}
                          onClick={() => !model.is_active && handleActivateModel(model.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {model.name || model.version}
                                </span>
                                {getStatusBadge(model)}
                              </div>
                              <div className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {model.model_type || 'Unknown'} • R²: {model.test_r2 != null ? (model.test_r2 * 100).toFixed(1) : 'N/A'}% • MAE: {model.test_mae?.toFixed(4) || 'N/A'}
                              </div>
                            </div>
                            {!model.is_active && (
                              <button
                                className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Train New Model */}
                <div className={`pt-4 border-t ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Train New Model
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={trainingType}
                      onChange={(e) => setTrainingType(e.target.value)}
                      className={`px-4 py-2 rounded-lg border transition ${
                        currentTheme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="random_forest">Random Forest</option>
                      <option value="gradient_boosting">Gradient Boosting</option>
                    </select>
                    <button
                      onClick={handleTrainModel}
                      disabled={isTraining}
                      className={`px-6 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-2 ${
                        isTraining
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {isTraining ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Training...
                        </>
                      ) : (
                        <>🚀 Train Model</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </DashboardSection>

          {/* 🔹 Upload Section */}
          <DashboardSection title="📤 Upload Data" subtitle="Add new CSV files for analysis">
            <GlassCard>
              <UploadBox onFileSelect={setFile} />

              {/* Clear Existing Data Checkbox */}
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    Clear existing data before upload 
                    <span className="text-red-600 font-medium"> (⚠️ This will delete all farms, rooms, and metrics)</span>
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
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
                <div
                  className={`mt-4 p-3 rounded-lg ${
                    message.startsWith("✅")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : message.startsWith("⚠️")
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
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
      </PageContainer>
    </DashboardLayout>
  );
}
