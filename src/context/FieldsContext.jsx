// AgriTwin — Multi-Field Management & Dynamic Zone Context (PRD Section 6, 14–17, 28)
// Stores user-created fields, boundaries, crops, acreage, and generates dynamic 4-zone telemetry.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseBridge } from '../services/firebase';
import { SOIL_PROFILES, CROP_AGRONOMIC_PROFILES, TOMATO_GROWTH_STAGES } from '../data/demoConfiguration';
import { getBaselineZonesForSoil } from '../services/recommendationEngine';

const FieldsContext = createContext(null);

// PRD Section 14: Required crop options
export const CROP_OPTIONS = [
  { id: 'Tomato', label: 'Tomato 🍅', icon: '🍅', waterNeed: 'Medium-High', daysToMaturity: 90 },
  { id: 'Rice', label: 'Rice (Paddy) 🌾', icon: '🌾', waterNeed: 'High', daysToMaturity: 120 },
  { id: 'Maize', label: 'Maize (Corn) 🌽', icon: '🌽', waterNeed: 'Medium', daysToMaturity: 105 },
  { id: 'Wheat', label: 'Wheat 🌾', icon: '🌾', waterNeed: 'Medium', daysToMaturity: 110 },
  { id: 'Potato', label: 'Potato 🥔', icon: '🥔', waterNeed: 'Medium', daysToMaturity: 95 },
  { id: 'Groundnut', label: 'Groundnut 🥜', icon: '🥜', waterNeed: 'Low-Medium', daysToMaturity: 100 },
  { id: 'Cotton', label: 'Cotton ☁️', icon: '☁️', waterNeed: 'Medium', daysToMaturity: 150 },
  { id: 'Sugarcane', label: 'Sugarcane 🎋', icon: '🎋', waterNeed: 'High', daysToMaturity: 360 },
  { id: 'Pulses', label: 'Pulses (Lentils) 🫘', icon: '🫘', waterNeed: 'Low', daysToMaturity: 75 },
  { id: 'Vegetables', label: 'Vegetables 🥬', icon: '🥬', waterNeed: 'Medium', daysToMaturity: 60 },
  { id: 'Other', label: 'Other Crop 🌱', icon: '🌱', waterNeed: 'Medium', daysToMaturity: 90 }
];

export function FieldsProvider({ children }) {
  // Load saved fields from localStorage
  const [fields, setFields] = useState(() => {
    try {
      const saved = localStorage.getItem('agritwin_user_fields');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(f => {
            const soil = SOIL_PROFILES[f.soilType || 'sandy_loam'] || SOIL_PROFILES.sandy_loam;
            const isOutOfBounds = !f.zones || f.zones.length === 0 ||
              f.zones.some(z => {
                const val = typeof z === 'number' ? z : (typeof z?.soilWater === 'number' ? z.soilWater : (z?.moisture ?? null));
                return val === null || val > soil.fc || val < soil.pwp;
              });
            const zones = isOutOfBounds
              ? getBaselineZonesForSoil(soil.id)
              : f.zones.map(zone => {
                if (zone?.id === 'zone1' && (zone.soilWater === 17.8 || zone.soilWater === 17)) return { ...zone, soilWater: 17, status: 'Watch' };
                if (zone?.id === 'zone3' && zone.soilWater === 16.2) return { ...zone, soilWater: 16, status: 'Watch' };
                if (zone?.id === 'zone2' && (zone.soilWater === 13.8 || zone.moisture === 13.8)) {
                  return { ...zone, ...(typeof zone.soilWater === 'number' ? { soilWater: 12 } : {}), ...(typeof zone.moisture === 'number' ? { moisture: 12 } : {}) };
                }
                return zone;
              });

            return {
              ...f,
              soilType: f.soilType || 'sandy_loam',
              soilIsProvisional: f.soilIsProvisional !== undefined ? f.soilIsProvisional : (f.soilType ? f.soilType === 'sandy_loam' : true),
              growthStage: f.growthStage || 'mid',
              pumpDischargeLph: f.pumpDischargeLph !== undefined ? f.pumpDischargeLph : null,
              zones
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error reading saved fields:', e);
    }
    return []; // New users start with 0 fields to prompt field selection
  });

  const [activeFieldId, setActiveFieldId] = useState(() => {
    try {
      return localStorage.getItem('agritwin_active_field_id') || null;
    } catch (e) {
      return null;
    }
  });

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('agritwin_user_fields', JSON.stringify(fields));
    } catch (e) {
      // safe fallback
    }
  }, [fields]);

  useEffect(() => {
    try {
      if (activeFieldId) {
        localStorage.setItem('agritwin_active_field_id', activeFieldId);
      }
    } catch (e) {
      // safe fallback
    }
  }, [activeFieldId]);

  // Keep activeField in sync
  const activeField = fields.find(f => f.id === activeFieldId) || fields[0] || null;

  // Add new field from map drawing/selection wizard (PRD Section 14 & 15)
  const addField = ({ userId, name, crop, latitude, longitude, area, boundary, village, soilType }) => {
    const cropMeta = CROP_OPTIONS.find(c => c.id.toLowerCase() === (crop || 'Tomato').toLowerCase()) || { icon: '🍅' };
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const chosenSoil = soilType || 'sandy_loam';

    // Compute simple boundary polygon if not drawn
    const poly = boundary && boundary.length >= 3 ? boundary : [
      [lat + 0.0012, lon - 0.0012],
      [lat + 0.0012, lon + 0.0012],
      [lat - 0.0012, lon + 0.0012],
      [lat - 0.0012, lon - 0.0012]
    ];

    const newField = {
      id: 'field_' + Date.now(),
      userId: userId || 'user-default',
      name: name.trim() || 'My Farm Field',
      crop: crop || 'Tomato',
      cropIcon: cropMeta.icon,
      soilType: chosenSoil,
      soilIsProvisional: chosenSoil === 'sandy_loam',
      growthStage: 'mid',
      pumpDischargeLph: null,
      village: village || 'Selected Field Location',
      latitude: lat,
      longitude: lon,
      area: area || '2.5 Acres',
      boundary: poly,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      zones: [
        { id: 'zone1', name: 'Zone A (North-West)', shortName: 'Zone A', soilWater: 17, status: 'Watch', sensorId: 'SM-Z01' },
        { id: 'zone2', name: 'Zone B (North-East - Target)', shortName: 'Zone B', soilWater: 12, status: 'Needs Water', sensorId: 'SM-Z02' },
        { id: 'zone3', name: 'Zone C (South-West)', shortName: 'Zone C', soilWater: 16, status: 'Watch', sensorId: 'SM-Z03' },
        { id: 'zone4', name: 'Zone D (South-East)', shortName: 'Zone D', soilWater: 18.0, status: 'Good', sensorId: 'SM-Z04' }
      ]
    };

    setFields(prev => [newField, ...prev]);
    setActiveFieldId(newField.id);

    // Save to Firebase Firestore
    firebaseBridge.setDocument('fields', newField.id, newField);
    return newField;
  };

  // Helper to load sample field for Presentation / Demo mode
  const loadDemoField = () => {
    if (fields.length > 0) return fields[0];

    const demoField = {
      id: 'field_demo_tomato_01',
      userId: 'demo-presenter',
      name: 'My Tomato Field',
      crop: 'Tomato',
      cropIcon: '🍅',
      soilType: 'sandy_loam',
      soilIsProvisional: true,
      growthStage: 'mid',
      pumpDischargeLph: null,
      village: 'Rural Farm Plot',
      latitude: 12.5234,
      longitude: 76.8971,
      area: '2.5 Acres',
      createdAt: new Date().toISOString().split('T')[0],
      boundary: [
        [12.5245, 76.8955],
        [12.5248, 76.8988],
        [12.5218, 76.8985],
        [12.5215, 76.8958]
      ],
      zones: [
        { id: 'zone1', name: 'Zone A (North-West)', shortName: 'Zone A', soilWater: 17, status: 'Watch', sensorId: 'SM-Z01' },
        { id: 'zone2', name: 'Zone B (North-East - Target)', shortName: 'Zone B', soilWater: 12, status: 'Needs Water', sensorId: 'SM-Z02' },
        { id: 'zone3', name: 'Zone C (South-West)', shortName: 'Zone C', soilWater: 16, status: 'Watch', sensorId: 'SM-Z03' },
        { id: 'zone4', name: 'Zone D (South-East)', shortName: 'Zone D', soilWater: 18.0, status: 'Good', sensorId: 'SM-Z04' }
      ]
    };

    setFields([demoField]);
    setActiveFieldId(demoField.id);
    return demoField;
  };

  const deleteField = (id) => {
    setFields(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (filtered.length > 0 && activeFieldId === id) {
        setActiveFieldId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveFieldId(null);
      }
      return filtered;
    });
  };

  const updateField = (id, updates) => {
    setFields(prev => prev.map(field => {
      if (field.id === id) {
        const updated = { ...field, ...updates, updatedAt: new Date().toISOString() };
        if (updates.soilType !== undefined) {
          updated.soilIsProvisional = (updates.soilType === 'sandy_loam');
        }
        return updated;
      }
      return field;
    }));
  };

  const updateActiveFieldZone = (zoneId, updates) => {
    setFields(prev => prev.map(field => {
      if (field.id === activeFieldId) {
        const updatedZones = field.zones.map(z => z.id === zoneId ? { ...z, ...updates } : z);
        return { ...field, zones: updatedZones };
      }
      return field;
    }));
  };

  return (
    <FieldsContext.Provider value={{
      fields,
      activeField,
      activeFieldId,
      setActiveFieldId,
      addField,
      updateField,
      deleteField,
      loadDemoField,
      updateActiveFieldZone,
      cropOptions: CROP_OPTIONS,
      soilProfiles: SOIL_PROFILES,
      cropAgronomicProfiles: CROP_AGRONOMIC_PROFILES,
      tomatoGrowthStages: TOMATO_GROWTH_STAGES
    }}>
      {children}
    </FieldsContext.Provider>
  );
}

export function useFields() {
  const context = useContext(FieldsContext);
  if (!context) throw new Error('useFields must be used within a FieldsProvider');
  return context;
}
