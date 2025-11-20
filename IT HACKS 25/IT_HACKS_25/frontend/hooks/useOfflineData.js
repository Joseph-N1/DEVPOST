/**
 * Offline Data Hook - Phase 9
 * React hook for managing offline data persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
  saveDashboardState,
  loadDashboardState,
  saveAnalytics,
  loadAnalytics,
  saveReports,
  loadReports,
  saveRooms,
  loadRooms,
  queueUpload,
  getPendingUploads,
  getCacheStats,
} from '../lib/offline/cacheManager';

export function useOfflineData() {
  const [cacheStats, setCacheStats] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    const stats = await getCacheStats();
    setCacheStats(stats);
    return stats;
  }, []);

  // Update pending uploads count
  const updatePendingUploads = useCallback(async () => {
    const uploads = await getPendingUploads();
    setPendingUploads(uploads);
    return uploads;
  }, []);

  useEffect(() => {
    updateCacheStats();
    updatePendingUploads();
  }, [updateCacheStats, updatePendingUploads]);

  // Dashboard operations
  const cacheDashboard = useCallback(async (data) => {
    const success = await saveDashboardState(data);
    if (success) await updateCacheStats();
    return success;
  }, [updateCacheStats]);

  const getCachedDashboard = useCallback(async () => {
    return await loadDashboardState();
  }, []);

  // Analytics operations
  const cacheAnalytics = useCallback(async (data, roomId = null) => {
    const success = await saveAnalytics(data, roomId);
    if (success) await updateCacheStats();
    return success;
  }, [updateCacheStats]);

  const getCachedAnalytics = useCallback(async (roomId = null, days = 7) => {
    return await loadAnalytics(roomId, days);
  }, []);

  // Reports operations
  const cacheReports = useCallback(async (reports) => {
    const success = await saveReports(reports);
    if (success) await updateCacheStats();
    return success;
  }, [updateCacheStats]);

  const getCachedReports = useCallback(async (type = null, days = 30) => {
    return await loadReports(type, days);
  }, []);

  // Rooms operations
  const cacheRooms = useCallback(async (rooms) => {
    const success = await saveRooms(rooms);
    if (success) await updateCacheStats();
    return success;
  }, [updateCacheStats]);

  const getCachedRooms = useCallback(async () => {
    return await loadRooms();
  }, []);

  // Upload queue operations
  const addToUploadQueue = useCallback(async (file, metadata) => {
    const uploadId = await queueUpload(file, metadata);
    if (uploadId) await updatePendingUploads();
    return uploadId;
  }, [updatePendingUploads]);

  return {
    // Cache statistics
    cacheStats,
    pendingUploads,
    updateCacheStats,
    updatePendingUploads,
    
    // Dashboard
    cacheDashboard,
    getCachedDashboard,
    
    // Analytics
    cacheAnalytics,
    getCachedAnalytics,
    
    // Reports
    cacheReports,
    getCachedReports,
    
    // Rooms
    cacheRooms,
    getCachedRooms,
    
    // Uploads
    addToUploadQueue,
  };
}
