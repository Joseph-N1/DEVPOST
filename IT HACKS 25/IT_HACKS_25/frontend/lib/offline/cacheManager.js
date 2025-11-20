/**
 * Offline Cache Manager for ECO FARM PWA
 * Phase 9: Manages IndexedDB and localStorage for offline data persistence
 */

import { openDB } from 'idb';

const DB_NAME = 'eco-farm-offline';
const DB_VERSION = 1;

// Store names
const STORES = {
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  ROOMS: 'rooms',
  UPLOADS: 'uploads-queue',
  METADATA: 'metadata'
};

// Initialize IndexedDB
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Dashboard store
      if (!db.objectStoreNames.contains(STORES.DASHBOARD)) {
        db.createObjectStore(STORES.DASHBOARD, { keyPath: 'id' });
      }

      // Analytics store
      if (!db.objectStoreNames.contains(STORES.ANALYTICS)) {
        const analyticsStore = db.createObjectStore(STORES.ANALYTICS, { keyPath: 'id', autoIncrement: true });
        analyticsStore.createIndex('timestamp', 'timestamp');
        analyticsStore.createIndex('roomId', 'roomId');
      }

      // Reports store
      if (!db.objectStoreNames.contains(STORES.REPORTS)) {
        const reportsStore = db.createObjectStore(STORES.REPORTS, { keyPath: 'id', autoIncrement: true });
        reportsStore.createIndex('timestamp', 'timestamp');
        reportsStore.createIndex('type', 'type');
      }

      // Rooms store
      if (!db.objectStoreNames.contains(STORES.ROOMS)) {
        db.createObjectStore(STORES.ROOMS, { keyPath: 'id' });
      }

      // Uploads queue store
      if (!db.objectStoreNames.contains(STORES.UPLOADS)) {
        const uploadsStore = db.createObjectStore(STORES.UPLOADS, { keyPath: 'id', autoIncrement: true });
        uploadsStore.createIndex('timestamp', 'timestamp');
        uploadsStore.createIndex('status', 'status');
      }

      // Metadata store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    },
  });
}

// Dashboard State Management
export async function saveDashboardState(dashboardData) {
  try {
    const db = await initDB();
    await db.put(STORES.DASHBOARD, {
      id: 'current',
      data: dashboardData,
      timestamp: Date.now(),
    });
    console.log('[Cache] Dashboard state saved');
    return true;
  } catch (error) {
    console.error('[Cache] Failed to save dashboard:', error);
    return false;
  }
}

export async function loadDashboardState() {
  try {
    const db = await initDB();
    const state = await db.get(STORES.DASHBOARD, 'current');
    
    if (state && isDataFresh(state.timestamp, 24)) { // 24 hours
      console.log('[Cache] Dashboard state loaded from cache');
      return state.data;
    }
    return null;
  } catch (error) {
    console.error('[Cache] Failed to load dashboard:', error);
    return null;
  }
}

// Analytics Management
export async function saveAnalytics(analyticsData, roomId = null) {
  try {
    const db = await initDB();
    await db.add(STORES.ANALYTICS, {
      data: analyticsData,
      roomId,
      timestamp: Date.now(),
    });
    
    // Keep only last 30 days
    await cleanOldAnalytics();
    console.log('[Cache] Analytics saved');
    return true;
  } catch (error) {
    console.error('[Cache] Failed to save analytics:', error);
    return false;
  }
}

export async function loadAnalytics(roomId = null, days = 7) {
  try {
    const db = await initDB();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let analytics = await db.getAllFromIndex(STORES.ANALYTICS, 'timestamp');
    analytics = analytics.filter(a => a.timestamp >= cutoff);
    
    if (roomId) {
      analytics = analytics.filter(a => a.roomId === roomId);
    }
    
    console.log(`[Cache] Loaded ${analytics.length} analytics entries`);
    return analytics.map(a => a.data);
  } catch (error) {
    console.error('[Cache] Failed to load analytics:', error);
    return [];
  }
}

async function cleanOldAnalytics() {
  try {
    const db = await initDB();
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    let cursor = await db.transaction(STORES.ANALYTICS).store.openCursor();
    while (cursor) {
      if (cursor.value.timestamp < cutoff) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  } catch (error) {
    console.error('[Cache] Failed to clean analytics:', error);
  }
}

// Reports Management
export async function saveReports(reports) {
  try {
    const db = await initDB();
    for (const report of reports) {
      await db.add(STORES.REPORTS, {
        data: report,
        type: report.type || 'general',
        timestamp: Date.now(),
      });
    }
    console.log('[Cache] Reports saved');
    return true;
  } catch (error) {
    console.error('[Cache] Failed to save reports:', error);
    return false;
  }
}

export async function loadReports(type = null, days = 30) {
  try {
    const db = await initDB();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let reports = await db.getAllFromIndex(STORES.REPORTS, 'timestamp');
    reports = reports.filter(r => r.timestamp >= cutoff);
    
    if (type) {
      reports = reports.filter(r => r.type === type);
    }
    
    console.log(`[Cache] Loaded ${reports.length} reports`);
    return reports.map(r => r.data);
  } catch (error) {
    console.error('[Cache] Failed to load reports:', error);
    return [];
  }
}

// Rooms Data Management
export async function saveRooms(rooms) {
  try {
    const db = await initDB();
    for (const room of rooms) {
      await db.put(STORES.ROOMS, {
        id: room.id || room.room_id,
        data: room,
        timestamp: Date.now(),
      });
    }
    console.log('[Cache] Rooms saved');
    return true;
  } catch (error) {
    console.error('[Cache] Failed to save rooms:', error);
    return false;
  }
}

export async function loadRooms() {
  try {
    const db = await initDB();
    const rooms = await db.getAll(STORES.ROOMS);
    console.log(`[Cache] Loaded ${rooms.length} rooms`);
    return rooms.map(r => r.data);
  } catch (error) {
    console.error('[Cache] Failed to load rooms:', error);
    return [];
  }
}

// Upload Queue Management
export async function queueUpload(file, metadata) {
  try {
    const db = await initDB();
    
    // Convert file to base64 for storage
    const fileData = await fileToBase64(file);
    
    const uploadId = await db.add(STORES.UPLOADS, {
      file: fileData,
      metadata,
      status: 'pending',
      timestamp: Date.now(),
    });
    
    console.log('[Cache] Upload queued:', uploadId);
    return uploadId;
  } catch (error) {
    console.error('[Cache] Failed to queue upload:', error);
    return null;
  }
}

export async function getPendingUploads() {
  try {
    const db = await initDB();
    const uploads = await db.getAllFromIndex(STORES.UPLOADS, 'status');
    return uploads.filter(u => u.status === 'pending');
  } catch (error) {
    console.error('[Cache] Failed to get pending uploads:', error);
    return [];
  }
}

export async function updateUploadStatus(uploadId, status) {
  try {
    const db = await initDB();
    const upload = await db.get(STORES.UPLOADS, uploadId);
    if (upload) {
      upload.status = status;
      await db.put(STORES.UPLOADS, upload);
      console.log('[Cache] Upload status updated:', uploadId, status);
    }
    return true;
  } catch (error) {
    console.error('[Cache] Failed to update upload status:', error);
    return false;
  }
}

export async function deleteUpload(uploadId) {
  try {
    const db = await initDB();
    await db.delete(STORES.UPLOADS, uploadId);
    console.log('[Cache] Upload deleted:', uploadId);
    return true;
  } catch (error) {
    console.error('[Cache] Failed to delete upload:', error);
    return false;
  }
}

// Metadata Management
export async function saveMetadata(key, value) {
  try {
    const db = await initDB();
    await db.put(STORES.METADATA, {
      key,
      value,
      timestamp: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('[Cache] Failed to save metadata:', error);
    return false;
  }
}

export async function loadMetadata(key) {
  try {
    const db = await initDB();
    const metadata = await db.get(STORES.METADATA, key);
    return metadata ? metadata.value : null;
  } catch (error) {
    console.error('[Cache] Failed to load metadata:', error);
    return null;
  }
}

// Utility Functions
function isDataFresh(timestamp, hours) {
  const now = Date.now();
  const age = now - timestamp;
  const maxAge = hours * 60 * 60 * 1000;
  return age < maxAge;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function base64ToFile(base64, filename, mimeType) {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
}

// Clear all offline data
export async function clearAllOfflineData() {
  try {
    const db = await initDB();
    await db.clear(STORES.DASHBOARD);
    await db.clear(STORES.ANALYTICS);
    await db.clear(STORES.REPORTS);
    await db.clear(STORES.ROOMS);
    await db.clear(STORES.UPLOADS);
    await db.clear(STORES.METADATA);
    console.log('[Cache] All offline data cleared');
    return true;
  } catch (error) {
    console.error('[Cache] Failed to clear offline data:', error);
    return false;
  }
}

// Get cache statistics
export async function getCacheStats() {
  try {
    const db = await initDB();
    
    const dashboardCount = await db.count(STORES.DASHBOARD);
    const analyticsCount = await db.count(STORES.ANALYTICS);
    const reportsCount = await db.count(STORES.REPORTS);
    const roomsCount = await db.count(STORES.ROOMS);
    const uploadsCount = await db.count(STORES.UPLOADS);
    
    return {
      dashboard: dashboardCount,
      analytics: analyticsCount,
      reports: reportsCount,
      rooms: roomsCount,
      uploads: uploadsCount,
      total: dashboardCount + analyticsCount + reportsCount + roomsCount + uploadsCount,
    };
  } catch (error) {
    console.error('[Cache] Failed to get cache stats:', error);
    return null;
  }
}
