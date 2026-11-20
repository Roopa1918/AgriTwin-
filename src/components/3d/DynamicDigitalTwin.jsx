// AgriTwin — Dynamic 3D Digital Twin Component
// Automatically adapts to the user's selected field & crop with 4 zones,
// procedural vegetation, sensor markers, and animated sprinkler mist.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useFields } from '../../context/FieldsContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useLanguage } from '../../context/LanguageContext';
import { RotateCcw, Droplets, Eye, Layers, Check } from 'lucide-react';

export default function DynamicDigitalTwin({ height = 540 }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const zonePlanesRef = useRef({});
  const sprinklerMistRef = useRef(null);
  const animFrameId = useRef(null);
  const sensorsGroupRef = useRef(null);
  const plantsGroupRef = useRef(null);

  const { activeField } = useFields();
  const { zones, isIrrigatingZone2, waterZone2, activeSoil } = useTelemetry();
  const { t } = useLanguage();
  const [hoveredZone, setHoveredZone] = useState(null);

  const fc = activeSoil?.fc ?? 18.0;
  const pwp = activeSoil?.pwp ?? 8.0;
  const refillThreshold = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1));

  // 3D Layer Toggles
  const [layers, setLayers] = useState({
    zones: true,
    plants: true,
    soilSensors: true
  });
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1c15);
    scene.fog = new THREE.FogExp2(0x0a1c15, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / (height || 540), 0.5, 100);
    camera.position.set(0, 13, 16);
    cameraRef.current = camera;

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height || 540);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      rendererRef.current = renderer;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('[AgriTwin 3D] WebGL unsupported or context initialization failed:', err);
      setWebglError(true);
      return;
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 6;
    controls.maxDistance = 32;
    controls.target.set(0, 0, 0);
    controls.enablePan = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // Automatic responsive resize handler (PRD Section 9)
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth || width;
      const newHeight = container.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xe2fbe8, 0.9);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sun.position.set(10, 18, 8);
    sun.castShadow = true;
    scene.add(sun);

    // Ground Base
    const baseGeo = new THREE.BoxGeometry(16.5, 0.4, 16.5);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x162c22, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.22;
    scene.add(base);

    // 4 Zones Positions
    // Zone 1: NW (-3.8, -3.8), Zone 2: NE (3.8, -3.8)
    // Zone 3: SW (-3.8, 3.8), Zone 4: SE (3.8, 3.8)
    const zoneLayout = {
      zone1: { x: -3.8, z: -3.8, name: 'Zone 1' },
      zone2: { x: 3.8, z: -3.8, name: 'Zone 2' },
      zone3: { x: -3.8, z: 3.8, name: 'Zone 3' },
      zone4: { x: 3.8, z: 3.8, name: 'Zone 4' }
    };

    const zoneSize = 7.2;
    const planeGeo = new THREE.PlaneGeometry(zoneSize, zoneSize);
    planeGeo.rotateX(-Math.PI / 2);

    const meshes = {};
    const plantsGroup = new THREE.Group();
    scene.add(plantsGroup);
    plantsGroupRef.current = plantsGroup;

    const sensorsGroup = new THREE.Group();
    scene.add(sensorsGroup);
    sensorsGroupRef.current = sensorsGroup;

    Object.entries(zoneLayout).forEach(([zId, pos]) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.65,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(planeGeo.clone(), mat);
      mesh.position.set(pos.x, 0.02, pos.z);
      mesh.userData = { zoneId: zId, name: pos.name };
      scene.add(mesh);
      meshes[zId] = mesh;

      // Crop Vegetation Rows tailored to active crop
      const isTomato = (activeField?.crop || '').toLowerCase().includes('tomato');

      for (let r = -2.6; r <= 2.6; r += 1.3) {
        for (let c = -2.8; c <= 2.8; c += 0.8) {
          const plant = new THREE.Group();

          // Stem
          const stemGeo = new THREE.CylinderGeometry(0.04, 0.07, isTomato ? 0.6 : 0.8, 5);
          const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
          const stem = new THREE.Mesh(stemGeo, stemMat);
          stem.position.y = 0.35;
          plant.add(stem);

          // Foliage
          const leafGeo = new THREE.ConeGeometry(0.24, 0.45, 4);
          const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.y = 0.55;
          plant.add(leaf);

          // Red Tomato Fruit if Tomato crop
          if (isTomato) {
            const fruitGeo = new THREE.SphereGeometry(0.08, 6, 6);
            const fruitMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
            const fruit = new THREE.Mesh(fruitGeo, fruitMat);
            fruit.position.set(0.12, 0.35, 0.08);
            plant.add(fruit);
          }

          plant.position.set(pos.x + c, 0.02, pos.z + r);
          plantsGroup.add(plant);
        }
      }

      // Sensor Pin Beacon
      const pin = new THREE.Group();
      pin.position.set(pos.x + 1.8, 0.02, pos.z + 1.8);
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.6;
      pin.add(pole);

      const beaconHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      beaconHead.position.y = 1.3;
      pin.add(beaconHead);

      sensorsGroup.add(pin);
    });
    zonePlanesRef.current = meshes;

    // Sprinkler Water Mist Particles (Zone 2)
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pVels = [];

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = 3.8 + (Math.random() - 0.5) * 4.8;
      pPositions[i * 3 + 1] = 0.4 + Math.random() * 2.2;
      pPositions[i * 3 + 2] = -3.8 + (Math.random() - 0.5) * 4.8;
      pVels.push({ y: -(0.04 + Math.random() * 0.05), x: (Math.random() - 0.5) * 0.02 });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.0
    });
    const sprinklerMist = new THREE.Points(pGeo, pMat);
    sprinklerMist.userData = { vels: pVels };
    scene.add(sprinklerMist);
    sprinklerMistRef.current = sprinklerMist;

    // Raycaster for Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(zonePlanesRef.current));
      if (hits.length > 0) {
        setHoveredZone(hits[0].object.userData.name);
      } else {
        setHoveredZone(null);
      }
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      controls.update();

      const elapsed = clock.getElapsedTime();

      // Animate Sprinkler Mist
      if (sprinklerMistRef.current) {
        const mist = sprinklerMistRef.current;
        const posAttr = mist.geometry.attributes.position;
        const vels = mist.userData.vels;
        const active = mist.userData.active;
        mist.material.opacity = active ? 0.85 : 0.0;

        if (active) {
          for (let i = 0; i < particleCount; i++) {
            posAttr.array[i * 3 + 1] += vels[i].y;
            if (posAttr.array[i * 3 + 1] <= 0.1) {
              posAttr.array[i * 3 + 1] = 2.4;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [height, activeField?.crop]);

  // Sync Layers Visibility
  useEffect(() => {
    if (plantsGroupRef.current) {
      plantsGroupRef.current.visible = layers.plants;
    }
    if (sensorsGroupRef.current) {
      sensorsGroupRef.current.visible = layers.soilSensors;
    }
  }, [layers]);

  // Sync Zone Colors with Telemetry (Green = Good, Amber = Watch, Red = Needs Water)
  useEffect(() => {
    if (!zonePlanesRef.current) return;
    zones.forEach(z => {
      const mesh = zonePlanesRef.current[z.id];
      if (mesh) {
        let color = new THREE.Color(0x10b981); // Good
        if (z.status === 'Needs Water' || z.soilWater <= refillThreshold) {
          color = new THREE.Color(0xef4444); // Needs Water
        } else if (z.status === 'Watch' || z.soilWater < fc) {
          color = new THREE.Color(0xf59e0b); // Watch
        }
        mesh.material.color.lerp(color, 0.4);
      }
    });

    if (sprinklerMistRef.current) {
      sprinklerMistRef.current.userData.active = isIrrigatingZone2;
    }
  }, [zones, isIrrigatingZone2]);

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 13, 16);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  if (webglError) {
    return (
      <div className="twin-3d-wrapper" style={{ minHeight: '340px', padding: '20px', background: '#091c14', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-medium)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div className="twin-overlay-badge">
              <span className="pulse-dot" style={{ background: '#10b981' }} />
              <span>{t('fieldTwin.digitalTwin') || 'Digital Twin:'} <strong>{activeField?.name} ({activeField?.crop})</strong> {t('fieldTwin.canopyMode2D') || '(2D Canopy Mode)'}</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {t('fieldTwin.demoQuadrants') || '4 Precision Zones (Assumed Demo Quadrants)'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', margin: '14px 0' }}>
            {zones.map((z, idx) => {
              const isZoneLow = z.status === 'Needs Water' || z.soilWater <= refillThreshold;
              const isZoneWatch = z.status === 'Watch' || (z.soilWater > refillThreshold && z.soilWater < fc);
              return (
                <div key={z.id} style={{
                  background: isZoneLow ? 'rgba(239, 68, 68, 0.15)' : isZoneWatch ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${isZoneLow ? 'rgba(239, 68, 68, 0.4)' : isZoneWatch ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                    <span>{z.name}</span>
                    <span style={{ color: isZoneLow ? '#f87171' : isZoneWatch ? '#fbbf24' : 'var(--emerald-400)' }}>{Math.round(z.soilWater)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, ((z.soilWater - pwp) / (fc - pwp)) * 100))}%`, height: '100%', background: isZoneLow ? '#ef4444' : isZoneWatch ? '#f59e0b' : '#10b981', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    {t('sensorData.colSensor') || 'Sensor'}: {z.sensorId || `SM-Z0${idx + 1}`} &bull; {t('common.status') || 'Status'}: {z.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button onClick={waterZone2} className="btn btn-water btn-sm">
            <Droplets size={14} /> {isIrrigatingZone2 ? (t('fieldMonitor.sprinklersActive') || 'Watering Active...') : (t('fieldMonitor.waterThisZone') || 'Water Zone 2')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="twin-3d-wrapper" style={{ height: `${height}px`, position: 'relative' }}>
      <div ref={containerRef} className="twin-3d-canvas" />

      {/* Top Overlay Badge & 3D Layer Switcher */}
      <div className="twin-overlay-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div className="twin-overlay-badge">
          <span className="pulse-dot" style={{ background: '#10b981' }} />
          <span>{t('fieldTwin.fieldTwin3D') || '3D Field Twin:'} <strong>{activeField?.name} ({activeField?.crop})</strong></span>
        </div>

        {hoveredZone && (
          <div className="twin-overlay-badge" style={{ borderColor: 'var(--emerald-400)' }}>
            <Eye size={14} color="var(--emerald-400)" />
            <span>{t('fieldTwin.hovering') || 'Hovering:'} {hoveredZone}</span>
          </div>
        )}

        {/* 3D Layers Toggle Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(9, 24, 17, 0.9)' }}
          >
            <Layers size={14} color="var(--emerald-400)" />
            <span>{t('fieldTwin.layers3D') || '3D Layers'}</span>
          </button>

          {showLayerMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '6px',
              background: 'rgba(7, 20, 14, 0.98)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              minWidth: '190px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.8)'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase' }}>
                {t('fieldMonitor.toggle3DLayers')}
              </span>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={layers.plants}
                  onChange={e => setLayers({ ...layers, plants: e.target.checked })}
                />
                <span>{t('fieldMonitor.layerCropPlants')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={layers.soilSensors}
                  onChange={e => setLayers({ ...layers, soilSensors: e.target.checked })}
                />
                <span>{t('fieldMonitor.layerSoilSensors')}</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="twin-overlay-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={resetCamera} className="btn btn-secondary btn-sm">
          <RotateCcw size={14} /> {t('fieldMonitor.resetView')}
        </button>

        <button onClick={waterZone2} className="btn btn-water btn-sm">
          <Droplets size={14} /> {isIrrigatingZone2 ? t('fieldMonitor.sprinklersActive') : t('fieldMonitor.waterThisZone')}
        </button>
      </div>
    </div>
  );
}
