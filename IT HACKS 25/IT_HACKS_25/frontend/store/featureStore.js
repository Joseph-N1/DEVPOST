import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Feature Store - Manages feature selection and analysis state
 * Shared between Features page and Monitor Dashboard
 */
const useFeatureStore = create(
  persist(
    (set, get) => ({
      // Selected features for investigation (3-5 recommended)
      selectedFeatures: [],
      maxFeatures: 5,
      minFeatures: 3,
      
      // Feature importance data cache
      featureImportanceData: [],
      featureHistory: {},
      seasonalData: {},
      
      // Investigation insights
      investigationNotes: [],
      featureAlerts: [],
      
      // Seasonal intervention planning
      seasonalInterventions: {
        spring: [],
        summer: [],
        autumn: [],
        winter: []
      },
      
      // Actions
      setSelectedFeatures: (features) => {
        const { maxFeatures } = get();
        const limited = features.slice(0, maxFeatures);
        set({ selectedFeatures: limited });
      },
      
      toggleFeature: (featureName) => {
        const { selectedFeatures, maxFeatures } = get();
        const isSelected = selectedFeatures.includes(featureName);
        
        if (isSelected) {
          set({ selectedFeatures: selectedFeatures.filter(f => f !== featureName) });
        } else if (selectedFeatures.length < maxFeatures) {
          set({ selectedFeatures: [...selectedFeatures, featureName] });
        }
      },
      
      clearSelectedFeatures: () => set({ selectedFeatures: [] }),
      
      // Feature importance data management
      setFeatureImportanceData: (data) => set({ featureImportanceData: data }),
      
      setFeatureHistory: (featureName, history) => set({
        featureHistory: { ...get().featureHistory, [featureName]: history }
      }),
      
      setSeasonalData: (data) => set({ seasonalData: data }),
      
      // Investigation notes
      addInvestigationNote: (note) => set({
        investigationNotes: [
          ...get().investigationNotes,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...note
          }
        ]
      }),
      
      removeInvestigationNote: (noteId) => set({
        investigationNotes: get().investigationNotes.filter(n => n.id !== noteId)
      }),
      
      // Feature alerts (for sudden importance changes)
      addFeatureAlert: (alert) => set({
        featureAlerts: [
          ...get().featureAlerts,
          {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            acknowledged: false,
            ...alert
          }
        ]
      }),
      
      acknowledgeAlert: (alertId) => set({
        featureAlerts: get().featureAlerts.map(a =>
          a.id === alertId ? { ...a, acknowledged: true } : a
        )
      }),
      
      clearAcknowledgedAlerts: () => set({
        featureAlerts: get().featureAlerts.filter(a => !a.acknowledged)
      }),
      
      // Seasonal interventions
      addSeasonalIntervention: (season, intervention) => set({
        seasonalInterventions: {
          ...get().seasonalInterventions,
          [season]: [
            ...get().seasonalInterventions[season],
            {
              id: Date.now(),
              createdAt: new Date().toISOString(),
              ...intervention
            }
          ]
        }
      }),
      
      removeSeasonalIntervention: (season, interventionId) => set({
        seasonalInterventions: {
          ...get().seasonalInterventions,
          [season]: get().seasonalInterventions[season].filter(i => i.id !== interventionId)
        }
      }),
      
      updateSeasonalIntervention: (season, interventionId, updates) => set({
        seasonalInterventions: {
          ...get().seasonalInterventions,
          [season]: get().seasonalInterventions[season].map(i =>
            i.id === interventionId ? { ...i, ...updates } : i
          )
        }
      }),
      
      // Check if feature selection is valid
      isSelectionValid: () => {
        const { selectedFeatures, minFeatures, maxFeatures } = get();
        return selectedFeatures.length >= minFeatures && selectedFeatures.length <= maxFeatures;
      },
      
      // Get selection summary
      getSelectionSummary: () => {
        const { selectedFeatures, featureImportanceData } = get();
        return selectedFeatures.map(name => {
          const featureData = featureImportanceData.find(f => f.feature_name === name);
          return {
            name,
            importance: featureData?.importance_score || 0,
            trend: featureData?.trend || 'stable',
            stability: featureData?.stability || 0
          };
        });
      }
    }),
    {
      name: 'eco-farm-feature-store',
      partialize: (state) => ({
        selectedFeatures: state.selectedFeatures,
        investigationNotes: state.investigationNotes,
        seasonalInterventions: state.seasonalInterventions
      })
    }
  )
);

export default useFeatureStore;
