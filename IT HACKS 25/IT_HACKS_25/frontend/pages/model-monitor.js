/**
 * Phase 7: ML Model Monitor Dashboard
 * View model performance, training history, and trigger retraining
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageContainer from '@/components/ui/PageContainer';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { 
  getMLModels, 
  getActiveModel, 
  activateModel, 
  trainModel, 
  getMLStatus, 
  getMLPerformance 
} from '@/utils/api';

export default function ModelMonitorPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState(null);
  const [status, setStatus] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [modelsData, activeData, statusData, perfData] = await Promise.all([
        getMLModels().catch(() => ({ models: [] })),
        getActiveModel().catch(() => null),
        getMLStatus().catch(() => null),
        getMLPerformance().catch(() => null)
      ]);

      setModels(modelsData.models || []);
      setActiveModel(activeData);
      setStatus(statusData);
      setPerformance(perfData);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load model data:', error);
      setMessage('Failed to load model information');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrainModel = async (modelType = 'random_forest') => {
    try {
      setTraining(true);
      setMessage('Training new model... This may take 1-2 minutes.');
      
      const result = await trainModel(modelType);
      
      if (result.success) {
        setMessage(`✅ Model ${result.version} trained successfully! Performance: ${result.performance_score}/100`);
        await fetchData(); // Refresh data
      } else {
        setMessage(`❌ Training failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Training failed:', error);
      setMessage(`❌ Training failed: ${error.message}`);
    } finally {
      setTraining(false);
    }
  };

  const handleActivateModel = async (modelId) => {
    try {
      setMessage('Activating model...');
      const result = await activateModel(modelId);
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        await fetchData();
      }
    } catch (error) {
      console.error('Activation failed:', error);
      setMessage(`❌ Activation failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer wide={true}>
          <Loading />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer wide={true}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">ML Model Monitor</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track model performance, train new models, and manage deployments
            </p>
          </div>
          
          <button
            onClick={() => handleTrainModel('random_forest')}
            disabled={training}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              training
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {training ? '🔄 Training...' : '🚀 Train New Model'}
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : message.includes('❌')
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* System Status Card */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className={`mr-2 text-2xl ${
                  status?.system_status === 'operational' ? '🟢' : '🟡'
                }`}>
                  {status?.system_status === 'operational' ? '🟢' : '🟡'}
                </span>
                System Status
              </h3>
              
              {status ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-semibold">
                      {status.system_status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Models:</span>
                    <span className="font-semibold">
                      {status.statistics?.total_models_trained || 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Predictions (7d):</span>
                    <span className="font-semibold">
                      {status.statistics?.predictions_last_week || 0}
                    </span>
                  </div>
                  
                  {status.active_model && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Model:</div>
                      <div className="font-semibold">{status.active_model.version}</div>
                      <div className="text-sm text-gray-500">
                        Score: {status.active_model.performance_score}/100
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">No status data available</div>
              )}
            </div>
          </Card>

          {/* Performance Card */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">📊 Performance Metrics</h3>
              
              {performance && performance.models && performance.models.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest Score:</span>
                    <span className="font-semibold text-green-600">
                      {performance.models[0]?.performance_score || 0}/100
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest R²:</span>
                    <span className="font-semibold">
                      {performance.models[0]?.test_r2?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest MAE:</span>
                    <span className="font-semibold">
                      {performance.models[0]?.test_mae?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  
                  {performance.trends && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                        <span className={`font-semibold flex items-center ${
                          performance.trends.improving ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {performance.trends.improving ? '📈 Improving' : '📉 Declining'}
                          <span className="ml-2 text-sm">
                            ({performance.trends.performance_score_change > 0 ? '+' : ''}
                            {performance.trends.performance_score_change.toFixed(2)})
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">No performance data available</div>
              )}
            </div>
          </Card>

          {/* Active Model Details */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">🎯 Active Model</h3>
              
              {activeModel && !activeModel.error ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Version</div>
                    <div className="font-semibold">{activeModel.version}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                    <div className="font-semibold capitalize">
                      {activeModel.model_type?.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trained</div>
                    <div className="font-semibold text-sm">
                      {activeModel.trained_at ? new Date(activeModel.trained_at).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Training Data
                    </div>
                    <div className="text-sm">
                      {activeModel.n_samples || 0} samples, {activeModel.n_features || 0} features
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  No active model. Train a model to get started.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Models Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">📚 Training History</h3>
            
            {models.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Version</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">R²</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">MAE</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Trained</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {models.map((model) => (
                      <tr key={model.id} className={model.is_active ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                        <td className="px-4 py-3 text-sm font-mono">{model.version}</td>
                        <td className="px-4 py-3 text-sm capitalize">
                          {model.model_type?.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {model.performance_metrics?.performance_score?.toFixed(1) || 'N/A'}/100
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {model.performance_metrics?.test_r2?.toFixed(4) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {model.performance_metrics?.test_mae?.toFixed(4) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {model.created_at ? new Date(model.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {model.is_active ? (
                            <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-semibold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                              {model.status?.toUpperCase() || 'ARCHIVED'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {!model.is_active && (
                            <button
                              onClick={() => handleActivateModel(model.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No models trained yet. Click "Train New Model" to get started.
              </div>
            )}
          </div>
        </Card>

        {/* Training Instructions */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">💡 How to Use</h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>1. Train a Model:</strong> Click "Train New Model" to create a new predictive model using your latest data.
                Training takes 1-2 minutes depending on data size.
              </p>
              <p>
                <strong>2. Monitor Performance:</strong> Check the performance score (0-100) and R² metrics to evaluate model quality.
                Higher scores indicate better predictions.
              </p>
              <p>
                <strong>3. Activate Models:</strong> Switch between trained model versions by clicking "Activate" in the table.
                Only one model can be active at a time.
              </p>
              <p>
                <strong>4. Auto-Training:</strong> Models are automatically trained after each CSV upload.
                Manual training is useful for experimenting with different configurations.
              </p>
              <p className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <strong>Note:</strong> Models require at least 14 days of data across multiple rooms for accurate predictions.
                Upload more data to improve model performance.
              </p>
            </div>
          </div>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
