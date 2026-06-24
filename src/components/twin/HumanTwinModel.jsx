import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';

const OBJ_PATH = '/assets/models/Base Mesh sculpt 2.obj';

// Anatomical 3D positions relative to model center (x, y, z)
// y is vertical (positive = up), x is horizontal (positive = right from camera)
// These are calibrated to a human figure that's ~3.8 units tall centered at 0
const BODY_ANCHORS = {
  brain:     [  0.00,  1.65, 0.12 ],
  lungs:     [  0.00,  0.80, 0.15 ],
  heart:     [ -0.20,  0.90, 0.18 ],
  abdomen:   [  0.00,  0.25, 0.10 ],
  'left-arm':[  0.85,  0.55, 0.05 ],
  'right-arm':[ -0.85, 0.55, 0.05 ],
  'left-leg':[  0.25, -0.85, 0.05 ],
  'right-leg':[ -0.25, -0.85, 0.05 ],
};

const STATUS_COLORS = {
  stable:   '#3B82F6',
  warning:  '#F59E0B',
  critical: '#EF4444',
};

const STATUS_ICONS = {
  stable:   'check_circle',
  warning:  'warning_amber',
  critical: 'error',
};

function Pin3D({ region, isActive, onClick }) {
  const anchor = BODY_ANCHORS[region.id];
  if (!anchor) return null;

  const color = STATUS_COLORS[region.status] || STATUS_COLORS.stable;
  const icon  = STATUS_ICONS[region.status]  || STATUS_ICONS.stable;

  const pos = anchor;

  return (
    <Html
      position={pos}
      center
      occlude={false}
      style={{ pointerEvents: 'auto', userSelect: 'none' }}
      zIndexRange={[10, 100]}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        {/* Pulsing dot */}
        <div style={{
          width: 14, height: 14,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 0 ${color}`,
          animation: 'pin-pulse 2s ease-out infinite',
          border: `2px solid ${isActive ? 'white' : 'transparent'}`,
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle, white 30%, ${color} 100%)`,
            opacity: 0.8,
          }} />
        </div>

        {/* Ripple ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 28, height: 28,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `1.5px solid ${color}`,
          animation: 'pin-ripple 2s ease-out infinite',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />

        {/* Tooltip card */}
        {isActive && (
          <div style={{
            position: 'absolute',
            left: 20, top: -10,
            background: 'rgba(8, 10, 18, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${color}44`,
            borderRadius: 10,
            padding: '10px 14px',
            minWidth: 160,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}22`,
            zIndex: 50,
            pointerEvents: 'auto',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="material-icons" style={{ color, fontSize: 14 }}>{icon}</span>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {region.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: '#8899bb', fontSize: 10 }}>{region.details.metric}</span>
              <span style={{ color, fontWeight: 700, fontSize: 10 }}>{region.details.value}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#8899bb', fontSize: 10 }}>Risk</span>
              <span style={{ color, fontWeight: 600, fontSize: 10 }}>{region.details.risk}</span>
            </div>
            <div style={{ fontSize: 9, color: '#aac4ff', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 5 }}>
              {region.details.recommendation}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

function LoadedHumanTwin({ color = '#0284c7', wireframe = false, scaleFactor = 1, regions = [], activePin, onPinClick }) {
  const objGroup = useLoader(OBJLoader, OBJ_PATH);

  const { twinGroup, modelScale } = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: wireframe ? 0.8 : 0.2,
      roughness: wireframe ? 0.2 : 0.15,
      transparent: true,
      opacity: wireframe ? 0.65 : 0.85,
      wireframe: wireframe,
      envMapIntensity: 1.2,
    });

    const clonedGroup = objGroup.clone(true);
    clonedGroup.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    // Center on all axes
    const box = new THREE.Box3().setFromObject(clonedGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clonedGroup.traverse((child) => {
      if (child.isMesh) {
        child.geometry.translate(-center.x, -center.y, -center.z);
      }
    });

    // Scale to fit
    const box2 = new THREE.Box3().setFromObject(clonedGroup);
    const size = new THREE.Vector3();
    box2.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetHeight = 3.8 * scaleFactor;
    const factor = maxDim > 0 ? targetHeight / maxDim : 1;
    clonedGroup.scale.set(factor, factor, factor);

    const group = new THREE.Group();
    group.add(clonedGroup);
    return { twinGroup: group, modelScale: factor };
  }, [objGroup, color, wireframe, scaleFactor]);

  return (
    <group>
      <primitive object={twinGroup} />
      {/* 3D-anchored pins */}
      {regions.map(region => (
        <Pin3D
          key={region.id}
          region={region}
          isActive={activePin === region.id}
          onClick={() => onPinClick(region.id)}
        />
      ))}
    </group>
  );
}

export default function HumanTwinModel({
  color,
  wireframe = false,
  scaleFactor = 1,
  regions = [],
  activePin = null,
  onPinClick = () => {},
  enableControls = false,
}) {
  return (
    <Suspense fallback={null}>
      {enableControls && (
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={4}
          maxDistance={14}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
          makeDefault
        />
      )}
      <LoadedHumanTwin
        color={color}
        wireframe={wireframe}
        scaleFactor={scaleFactor}
        regions={regions}
        activePin={activePin}
        onPinClick={onPinClick}
      />
    </Suspense>
  );
}
