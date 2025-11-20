// API utility functions for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get list of all rooms
 */
export async function getRooms() {
  return fetchAPI('/analysis/rooms');
}

/**
 * Get KPIs for a specific room
 */
export async function getRoomKPIs(roomId) {
  return fetchAPI(`/analysis/rooms/${roomId}/kpis`);
}

/**
 * Get AI predictions for a specific room
 * Returns: { room_id, predicted_avg_weight_kg, recommendations }
 */
export async function getRoomPredictions(roomId) {
  return fetchAPI(`/analysis/rooms/${roomId}/predict`);
}

/**
 * Get predictions for all rooms
 */
export async function getAllRoomsPredictions() {
  try {
    const { rooms } = await getRooms();
    const predictions = await Promise.all(
      rooms.map(room => getRoomPredictions(room.id))
    );
    return predictions.filter(p => !p.error);
  } catch (error) {
    console.error('Failed to fetch all predictions:', error);
    return [];
  }
}

/**
 * Upload CSV file
 */
export async function uploadCSV(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/csv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List uploaded CSV files
 */
export async function listCSVFiles() {
  return fetchAPI('/upload/files');
}

/**
 * Preview CSV file
 */
export async function previewCSV(filePath, rows = 5, startDate = null, endDate = null) {
  const params = new URLSearchParams({ rows: rows.toString() });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  return fetchAPI(`/upload/preview/${filePath}?${params.toString()}`);
}

/**
 * Get feed recommendations (from predictions)
 * Returns top 3 feed recommendations with scores
 */
export async function getFeedRecommendations(roomId) {
  try {
    const prediction = await getRoomPredictions(roomId);
    if (prediction.error || !prediction.recommendations) {
      return [];
    }
    
    // Transform backend format to frontend format with emojis
    const emojiMap = {
      'Feed A': '🐣',
      'Feed B': '🌾',
      'Feed C': '🥚',
      'Feed D': '🌿'
    };
    
    return prediction.recommendations.slice(0, 3).map((rec, idx) => ({
      feed: rec.feed,
      score: rec.expected_avg_weight / 10, // Normalize to 0-1 range
      benefit: `Expected weight: ${rec.expected_avg_weight} kg`,
      emoji: emojiMap[rec.feed] || '🍖',
      rank: idx + 1
    }));
  } catch (error) {
    console.error('Failed to fetch feed recommendations:', error);
    return [];
  }
}

/**
 * Generate 7-day weight forecast for a room
 */
export async function getWeightForecast(roomId, days = 7) {
  try {
    const forecast = await fetchAPI(`/analysis/rooms/${roomId}/forecast?days=${days}`);
    if (forecast.error) {
      return null;
    }
    return forecast;
  } catch (error) {
    console.error('Failed to generate forecast:', error);
    return null;
  }
}

/**
 * Generate weekly aggregated forecast
 */
export async function getWeeklyForecast(roomId, weeks = 4) {
  try {
    const forecast = await fetchAPI(`/analysis/rooms/${roomId}/forecast/weekly?weeks=${weeks}`);
    if (forecast.error) {
      return null;
    }
    return forecast;
  } catch (error) {
    console.error('Failed to generate weekly forecast:', error);
    return null;
  }
}

/**
 * Get model performance metrics
 */
export async function getModelMetrics() {
  try {
    return await fetchAPI('/analysis/model/metrics');
  } catch (error) {
    console.error('Failed to fetch model metrics:', error);
    return { error: 'Model metrics not available' };
  }
}

/**
 * Get historical accuracy tracking
 */
export async function getAccuracyHistory() {
  try {
    return await fetchAPI('/analysis/model/accuracy-history');
  } catch (error) {
    console.error('Failed to fetch accuracy history:', error);
    return { error: 'Accuracy history not available' };
  }
}

/**
 * Get weekly aggregated data for all rooms
 */
export async function getWeeklyData() {
  try {
    return await fetchAPI('/analysis/weekly');
  } catch (error) {
    console.error('Failed to fetch weekly data:', error);
    return { error: 'Weekly data not available' };
  }
}

/**
 * Get week-over-week comparison
 */
export async function getWeekComparison(roomId = null) {
  try {
    const endpoint = roomId ? `/analysis/weekly/comparison?room_id=${roomId}` : '/analysis/weekly/comparison';
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('Failed to fetch week comparison:', error);
    return { error: 'Week comparison not available' };
  }
}

/**
 * ========================================
 * AI INTELLIGENCE API FUNCTIONS
 * ========================================
 */

/**
 * Get comprehensive AI analysis
 * Returns: feed_optimization, mortality_risks, environmental_warnings, room_recommendations, health_summary
 */
export async function getAIAnalysis(filePath = null) {
  try {
    const endpoint = filePath ? `/ai/analyze?file_path=${encodeURIComponent(filePath)}` : '/ai/analyze';
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('Failed to fetch AI analysis:', error);
    return { error: 'AI analysis not available' };
  }
}

/**
 * Get anomaly detection results
 * Returns: anomalies array with severity, explanations, and actions
 */
export async function getAnomalies(filePath = null, sensitivity = 0.1) {
  try {
    const endpoint = filePath 
      ? `/ai/anomalies?file_path=${encodeURIComponent(filePath)}&sensitivity=${sensitivity}`
      : `/ai/anomalies?sensitivity=${sensitivity}`;
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('Failed to fetch anomalies:', error);
    return { error: 'Anomaly detection not available', anomalies: [], total_detected: 0 };
  }
}

/**
 * Get weekly AI-powered farm manager report
 * Returns: complete report with all sections
 */
export async function getWeeklyAIReport(filePath = null) {
  try {
    const endpoint = filePath ? `/ai/report/weekly?file_path=${encodeURIComponent(filePath)}` : '/ai/report/weekly';
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('Failed to fetch weekly AI report:', error);
    return { error: 'Weekly AI report not available' };
  }
}

/**
 * Get AI explanation for a specific metric (used in tooltips)
 * Returns: meaning, explanation, recommended_action
 */
export async function getMetricExplanation(metric, value, change = 0, roomId = null) {
  try {
    let endpoint = `/ai/explain-metric?metric=${encodeURIComponent(metric)}&value=${value}&change=${change}`;
    if (roomId) {
      endpoint += `&room_id=${roomId}`;
    }
    return await fetchAPI(endpoint);
  } catch (error) {
    console.error('Failed to fetch metric explanation:', error);
    return {
      metric: metric.replace('_', ' ').toUpperCase(),
      meaning: 'AI explanation temporarily unavailable',
      explanation: `Current value: ${value}`,
      recommended_action: 'Monitor trends and consult documentation'
    };
  }
}

// ============================================================================
// PHASE 7: ML PREDICTIONS & MODEL MANAGEMENT API
// ============================================================================

/**
 * Train a new ML model
 */
export async function trainModel(modelType = 'random_forest') {
  return fetchAPI('/ml/train?model_type=' + modelType, {
    method: 'POST',
  });
}

/**
 * Get list of all trained models
 */
export async function getMLModels() {
  return fetchAPI('/ml/models');
}

/**
 * Get active model information
 */
export async function getActiveModel() {
  return fetchAPI('/ml/models/active/info');
}

/**
 * Get detailed model information
 */
export async function getModelDetails(modelId) {
  return fetchAPI(`/ml/models/${modelId}`);
}

/**
 * Activate a specific model version
 */
export async function activateModel(modelId) {
  return fetchAPI(`/ml/models/${modelId}/activate`, {
    method: 'POST',
  });
}

/**
 * Get multi-horizon predictions for a room (7/14/30 days)
 */
export async function getRoomMLPredictions(roomId, horizons = [7, 14, 30], savePredictions = true) {
  const params = new URLSearchParams();
  horizons.forEach(h => params.append('horizons', h));
  params.append('save_predictions', savePredictions);
  
  return fetchAPI(`/ml/predict/room/${roomId}?${params.toString()}`, {
    method: 'POST',
  });
}

/**
 * Get predictions for all rooms in a farm
 */
export async function getFarmMLPredictions(farmId, horizons = [7, 14, 30]) {
  const params = new URLSearchParams();
  horizons.forEach(h => params.append('horizons', h));
  
  return fetchAPI(`/ml/predict/farm/${farmId}?${params.toString()}`, {
    method: 'POST',
  });
}

/**
 * Get prediction history from database
 */
export async function getPredictionHistory(filters = {}) {
  const params = new URLSearchParams();
  if (filters.farm_id) params.append('farm_id', filters.farm_id);
  if (filters.room_id) params.append('room_id', filters.room_id);
  if (filters.metric_name) params.append('metric_name', filters.metric_name);
  if (filters.days) params.append('days', filters.days);
  
  return fetchAPI(`/ml/predictions/history?${params.toString()}`);
}

/**
 * Get ML system status and health
 */
export async function getMLStatus() {
  return fetchAPI('/ml/monitor/status');
}

/**
 * Get model performance metrics
 */
export async function getMLPerformance() {
  return fetchAPI('/ml/monitor/performance');
}
