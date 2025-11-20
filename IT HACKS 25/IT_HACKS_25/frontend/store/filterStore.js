import { create } from 'zustand';

/**
 * Global Filter Store for Cross-Filtering System
 * All charts and components subscribe to this store
 */
const useFilterStore = create((set, get) => ({
  // Filter State
  dateRange: { start: null, end: null },
  selectedRooms: [],
  selectedMetrics: [],
  anomalySeverity: 'all', // 'all', 'critical', 'high', 'medium'
  productionThresholds: {
    minEggs: 0,
    maxEggs: 1000,
    minWeight: 0,
    maxWeight: 10,
    minFCR: 0,
    maxFCR: 5
  },
  
  // Available Options
  availableRooms: [],
  availableMetrics: [
    { key: 'eggs_produced', label: 'Eggs Produced', emoji: '🥚' },
    { key: 'avg_weight_kg', label: 'Avg Weight', emoji: '⚖️' },
    { key: 'feed_kg_total', label: 'Feed Intake', emoji: '🌾' },
    { key: 'mortality_rate', label: 'Mortality', emoji: '💔' },
    { key: 'temperature_c', label: 'Temperature', emoji: '🌡️' },
    { key: 'humidity_pct', label: 'Humidity', emoji: '💧' },
    { key: 'fcr', label: 'FCR', emoji: '📊' },
    { key: 'water_liters_total', label: 'Water Intake', emoji: '💧' }
  ],
  
  // UI State
  isFilterPanelOpen: false,
  activeView: 'overview', // 'overview', 'comparison', 'correlation', 'drilldown'
  
  // Actions
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  
  setSelectedRooms: (rooms) => set({ selectedRooms: rooms }),
  
  toggleRoom: (roomId) => {
    const { selectedRooms } = get();
    const isSelected = selectedRooms.includes(roomId);
    set({
      selectedRooms: isSelected
        ? selectedRooms.filter(r => r !== roomId)
        : [...selectedRooms, roomId]
    });
  },
  
  selectAllRooms: () => {
    const { availableRooms } = get();
    const roomIds = availableRooms.map(r => (typeof r === 'object' ? r.room_id : r));
    set({ selectedRooms: roomIds });
  },
  
  clearRoomSelection: () => set({ selectedRooms: [] }),
  
  setSelectedMetrics: (metrics) => set({ selectedMetrics: metrics }),
  
  toggleMetric: (metricKey) => {
    const { selectedMetrics } = get();
    const isSelected = selectedMetrics.includes(metricKey);
    set({
      selectedMetrics: isSelected
        ? selectedMetrics.filter(m => m !== metricKey)
        : [...selectedMetrics, metricKey]
    });
  },
  
  setAnomalySeverity: (severity) => set({ anomalySeverity: severity }),
  
  setProductionThresholds: (thresholds) => set({
    productionThresholds: { ...get().productionThresholds, ...thresholds }
  }),
  
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  
  toggleFilterPanel: () => set({ isFilterPanelOpen: !get().isFilterPanelOpen }),
  
  setActiveView: (view) => set({ activeView: view }),
  
  resetFilters: () => set({
    dateRange: { start: null, end: null },
    selectedRooms: [],
    selectedMetrics: [],
    anomalySeverity: 'all',
    productionThresholds: {
      minEggs: 0,
      maxEggs: 1000,
      minWeight: 0,
      maxWeight: 10,
      minFCR: 0,
      maxFCR: 5
    }
  }),
  
  // Helper: Apply filters to dataset
  applyFilters: (data) => {
    const { dateRange, selectedRooms, productionThresholds, anomalySeverity } = get();
    let filtered = [...data];
    
    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(row => {
        if (!row.date) return true;
        const rowDate = new Date(row.date);
        if (dateRange.start && rowDate < new Date(dateRange.start)) return false;
        if (dateRange.end && rowDate > new Date(dateRange.end)) return false;
        return true;
      });
    }
    
    // Room filter
    if (selectedRooms.length > 0) {
      filtered = filtered.filter(row => selectedRooms.includes(row.room_id));
    }
    
    // Production thresholds
    if (productionThresholds.minEggs > 0 || productionThresholds.maxEggs < 1000) {
      filtered = filtered.filter(row => {
        const eggs = row.eggs_produced || 0;
        return eggs >= productionThresholds.minEggs && eggs <= productionThresholds.maxEggs;
      });
    }
    
    if (productionThresholds.minWeight > 0 || productionThresholds.maxWeight < 10) {
      filtered = filtered.filter(row => {
        const weight = row.avg_weight_kg || 0;
        return weight >= productionThresholds.minWeight && weight <= productionThresholds.maxWeight;
      });
    }
    
    if (productionThresholds.minFCR > 0 || productionThresholds.maxFCR < 5) {
      filtered = filtered.filter(row => {
        const fcr = row.fcr || 0;
        return fcr >= productionThresholds.minFCR && fcr <= productionThresholds.maxFCR;
      });
    }
    
    return filtered;
  }
}));

export { useFilterStore };
export default useFilterStore;
