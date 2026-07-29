import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Grid, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import HumanTwinModel from '../twin/HumanTwinModel';

// COCO keypoint indices for pose-driven animation
// 0=nose, 5=LShoulder, 6=RShoulder, 7=LElbow, 8=RElbow,
// 9=LWrist, 10=RWrist, 11=LHip, 12=RHip, 13=LKnee, 14=RKnee
function poseToBodyRegions(keypoints) {
  // keypoints is flat [u0,v0, u1,v1 ... u16,v16] all in [0,1]
  if (!keypoints || keypoints.length !== 34) return [];

  const kp = (i) => ({ u: keypoints[i * 2], v: keypoints[i * 2 + 1] });

  // Motion level from limb spread
  const lElbow = kp(7), lShoulder = kp(5), rElbow = kp(8), rShoulder = kp(6);
  const lArmSpread = Math.abs(lElbow.u - lShoulder.u) + Math.abs(lElbow.v - lShoulder.v);
  const rArmSpread = Math.abs(rElbow.u - rShoulder.u) + Math.abs(rElbow.v - rShoulder.v);
  const armActivity = (lArmSpread + rArmSpread) / 2;

  // Hip-knee angle for legs
  const lHip = kp(11), lKnee = kp(13), rHip = kp(12), rKnee = kp(14);
  const lLegSpread = Math.abs(lKnee.v - lHip.v);
  const rLegSpread = Math.abs(rKnee.v - rHip.v);
  const legActivity = (lLegSpread + rLegSpread) / 2;

  // Emit "regions" for highlighted animation regions
  const regions = [];
  if (armActivity > 0.08) regions.push('left_arm', 'right_arm');
  if (legActivity > 0.05) regions.push('left_leg', 'right_leg');
  return regions;
}

function AnimatedOccupant({ index, occupant, sensing, mode, isPrimary }) {
  const groupRef = useRef();

  // ── Position Estimation ──────────────────────────────────────────────────────
  const rssi = sensing.meanRssi || -60;
  // ── Physics-based positioning with 1.2m+ separation & staggered depth ───────
  const totalOccupants = sensing.trackedOccupants?.length || 1;
  
  const estimatedDistance = useMemo(() => {
    const rssi = sensing.meanRssi || -60;
    const base = Math.pow(10, (-40 - rssi) / (10 * 2.7));
    const depthStagger = (index % 2 === 1) ? 0.9 : 0.0;
    return Math.max(1.2, Math.min(base + depthStagger, 6.0));
  }, [sensing.meanRssi, index]);

  const estimatedAngle = useMemo(() => {
    const arcSpan = Math.PI / 2.2; // ~80 degrees total span
    const angleStep = arcSpan / Math.max(1, totalOccupants - 1);
    return -(arcSpan / 2.0) + (index * angleStep);
  }, [totalOccupants, index]);

  // Compute 3D target coordinates with mandatory spacing
  const { rawTargetX, rawTargetZ } = useMemo(() => {
    if (occupant && occupant.position && occupant.position.length >= 2) {
      // Backend position available: blend with lateral spread & staggered depth
      const centerOffset = (index - (totalOccupants - 1) / 2.0) * 1.3; // 1.3m lateral spacing
      const targetX = occupant.position[0] * 0.35 + centerOffset * 0.65;
      const targetZ = occupant.position[1] + ((index % 2 === 1) ? 0.8 : 0.0);
      return { rawTargetX: targetX, rawTargetZ: targetZ };
    }
    // Fallback: polar coordinates mapped to 3D room grid
    const targetX = Math.cos(estimatedAngle) * estimatedDistance;
    const targetZ = Math.sin(estimatedAngle) * estimatedDistance;
    return { rawTargetX: targetX, rawTargetZ: targetZ };
  }, [occupant, index, totalOccupants, estimatedAngle, estimatedDistance]);

  const currentTargetRef = useRef({ x: rawTargetX, z: rawTargetZ });
  const [isMovingState, setIsMovingState] = useState(false);
  const stopTimeoutRef = useRef(null);

  useEffect(() => {
    const dx = rawTargetX - currentTargetRef.current.x;
    const dz = rawTargetZ - currentTargetRef.current.z;
    if (Math.sqrt(dx * dx + dz * dz) > 0.2) {
      currentTargetRef.current = { x: rawTargetX, z: rawTargetZ };
      setIsMovingState(true);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = setTimeout(() => setIsMovingState(false), 1500);
    }
  }, [rawTargetX, rawTargetZ]);

  useEffect(() => () => { if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current); }, []);

  // ── Pose-driven body regions from DensePose keypoints ────────────────────────
  const activeRegions = useMemo(() => {
    if (occupant && occupant.keypoints && occupant.keypoints.length === 34) {
      return poseToBodyRegions(occupant.keypoints);
    }
    // Fall back to motion-based heuristics
    if (isMovingState) return ['left_leg', 'right_leg'];
    return [];
  }, [occupant, isMovingState]);

  // ── Per-frame animation ──────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const isMoving = isMovingState;
    const br = (occupant && occupant.vitals?.breathing_rate_bpm > 0)
      ? occupant.vitals.breathing_rate_bpm
      : (sensing.breathingRate || 15);

    // Clamp target within room bounds (±5m)
    const ROOM_HALF = 5.0;
    const targetX = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, currentTargetRef.current.x));
    const targetZ = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, currentTargetRef.current.z));
    const moveSpeed = isMoving ? 3.0 * delta : 1.5 * delta;

    // Smooth lerp to clamped target position
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, moveSpeed);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, moveSpeed);

    // Face direction of travel
    const dx = targetX - groupRef.current.position.x;
    const dz = targetZ - groupRef.current.position.z;
    if (isMoving && (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01)) {
      let targetRot = Math.atan2(dx, dz);
      if (occupant && occupant.direction !== undefined && Math.abs(occupant.direction) > 0.01) {
        targetRot = occupant.direction;
      }
      let diff = targetRot - groupRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * moveSpeed * 3.0;
    }

    // Breathing scale animation
    const breatheScale = 1.0 + Math.sin(time * (br / 30) * Math.PI) * 0.015;
    groupRef.current.scale.set(breatheScale, breatheScale, breatheScale);

    // Walk bounce & sway
    if (isMoving) {
      groupRef.current.position.y = Math.abs(Math.sin(time * 8 + index)) * 0.1;
      groupRef.current.rotation.z = Math.sin(time * 4 + index) * 0.04;
      groupRef.current.rotation.x = Math.cos(time * 4 + index) * 0.04;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    }
  });

  // ── Colors ───────────────────────────────────────────────────────────────────
  const isNightMode = mode === 'night';
  const isLive = sensing.isConnected;
  const presence = isLive && sensing.presence;
  const twinColor = !isLive ? '#9CA3AF'
    : !presence    ? '#3B82F6'
    : isMovingState ? '#F59E0B'
    : isNightMode  ? '#4edea3'
    : '#6366f1';

  // ── Distance from ESP32 probe (ITU-R P.1238 Log-Distance Path Loss) ──────────
  // d = 10^((TxPower_1m - RSSI) / (10 * n))
  const distFromProbe = occupant?.distance_from_router_m
    ?? occupant?.distance_m
    ?? estimatedDistance;

  // Clamp x/z within room detection boundary (±5m from probe)
  const ROOM_HALF = 5.0;
  const clampedX = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, currentTargetRef.current.x));
  const clampedZ = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, currentTargetRef.current.z));

  return (
    <group ref={groupRef} position={[clampedX, 0, clampedZ]}>
      {/* 3D humanoid model — always shown, always inside room */}
      <HumanTwinModel
        color={twinColor}
        wireframe={true}
        scaleFactor={isPrimary ? 0.8 : 0.72}
        animate={isMovingState}
        regions={activeRegions}
        enableControls={false}
      />

      {/* Dynamic 3D Floating Activity Banner above occupant's head */}
      <Html position={[0, 2.3, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
        {(() => {
          // Resolve individual occupant activity or fallback to global room prediction
          const rawAct = (
            occupant?.activity ||
            occupant?.har_prediction ||
            (isMovingState ? 'walk' : sensing.harPrediction) ||
            'sit'
          ).toLowerCase();

          const actConfig = {
            walk:    { label: 'WALKING',  color: '#4edea3', icon: '🚶', bg: 'rgba(78, 222, 163, 0.18)', border: '#4edea3' },
            stand:   { label: 'STANDING', color: '#adc6ff', icon: '🚶‍♂️', bg: 'rgba(173, 198, 255, 0.18)', border: '#adc6ff' },
            sit:     { label: 'SITTING',  color: '#ffb786', icon: '🪑', bg: 'rgba(255, 183, 134, 0.18)', border: '#ffb786' },
            fall:    { label: 'FALL ALERT', color: '#EF4444', icon: '⚠️', bg: 'rgba(239, 68, 68, 0.3)', border: '#EF4444' },
            empty:   { label: 'EMPTY',    color: '#9CA3AF', icon: '⚪', bg: 'rgba(156, 163, 175, 0.15)', border: '#9CA3AF' },
          };

          const cfg = actConfig[rawAct] || (rawAct.includes('sit') ? actConfig.sit : actConfig.stand);
          const personLabel = isPrimary ? 'Person #1 (Primary)' : `Person #${occupant?.id ?? (index + 1)}`;
          const distStr = `${distFromProbe.toFixed(1)}m`;

          return (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <div style={{
                background: isNightMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                border: `1.5px solid ${cfg.border}`,
                boxShadow: `0 8px 24px ${cfg.color}33, 0 2px 8px rgba(0,0,0,0.4)`,
                borderRadius: '20px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(12px)',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease'
              }}>
                <span style={{ fontSize: '13px' }}>{cfg.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: isNightMode ? '#94a3b8' : '#64748b',
                    lineHeight: '1.1'
                  }}>
                    {personLabel}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: cfg.color,
                    lineHeight: '1.2'
                  }}>
                    {cfg.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: isNightMode ? '#cbd5e1' : '#475569',
                  background: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  marginLeft: '4px'
                }}>
                  {distStr}
                </span>
              </div>
              {/* Pointer triangle */}
              <div style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `6px solid ${cfg.border}`,
                marginTop: '-1px'
              }} />
            </div>
          );
        })()}
      </Html>
    </group>
  );
}

// --- Heatmap Floor Shader ---
const heatmapVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const heatmapFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uOccupantPos;
  uniform float uConfidence;
  uniform vec3 uColorCold;
  uniform vec3 uColorHot;
  uniform float uPresence;

  void main() {
    float dist = distance(vUv, uOccupantPos);
    float pulse = sin(uTime * 2.0) * 0.05 + 1.0;
    float intensity = exp(-dist * 4.0) * uConfidence * pulse * uPresence;
    float wave = sin(vUv.x * 10.0 + uTime) * cos(vUv.y * 10.0 + uTime) * 0.1;
    intensity += wave * 0.2 * uPresence;
    vec3 finalColor = mix(uColorCold, uColorHot, clamp(intensity, 0.0, 1.0));
    float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) *
                     smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    gl_FragColor = vec4(finalColor, (0.2 + intensity * 0.6) * edgeFade);
  }
`;

function HeatmapFloor({ sensing, isNightMode }) {
  const materialRef = useRef();
  const isLive = sensing.isConnected;
  const presence = isLive && sensing.presence;
  const confidence = isLive && sensing.confidence != null ? sensing.confidence : 0;
  const occupantPos = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOccupantPos: { value: occupantPos },
    uConfidence: { value: confidence },
    uColorCold: { value: new THREE.Color(isNightMode ? '#1e1b4b' : '#f0f9ff') },
    uColorHot: { value: new THREE.Color(isNightMode ? '#818cf8' : '#3b82f6') },
    uPresence: { value: presence ? 1.0 : 0.0 },
  }), [isNightMode, occupantPos]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uConfidence.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uConfidence.value, confidence, 0.05);
      materialRef.current.uniforms.uPresence.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uPresence.value, presence ? 1.0 : 0.0, 0.05);
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={heatmapVertexShader}
        fragmentShader={heatmapFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function BlueprintWalls({ sensing, isNightMode }) {
  const rawRssi = sensing.meanRssi || -60;
  const variance = sensing.variance || 0;
  const [dampedRssi, setDampedRssi] = useState(rawRssi);
  const [dampedVariance, setDampedVariance] = useState(variance);

  useEffect(() => {
    if (Math.abs(rawRssi - dampedRssi) > 4) setDampedRssi(rawRssi);
    if (Math.abs(variance - dampedVariance) > 0.5) setDampedVariance(variance);
  }, [rawRssi, variance, dampedRssi, dampedVariance]);

  const normalizedScale = useMemo(() => Math.max(0.6, Math.min(2.0, (dampedRssi + 100) / 40)), [dampedRssi]);

  const layoutComplexity = useMemo(() => {
    const rssiDrop = Math.max(0, -30 - dampedRssi);
    return 1.2 * dampedVariance + 0.05 * rssiDrop;
  }, [dampedVariance, dampedRssi]);

  const { outerWalls, innerWalls } = useMemo(() => {
    const s = normalizedScale * 6;
    const outer = [[-s,0,-s],[s,0,-s],[s,0,s],[-s,0,s],[-s,0,-s]].map(p => new THREE.Vector3(...p));
    const inner = [];
    if (layoutComplexity > 3.0) {
      inner.push([[-s,0,0],[s,0,0]].map(p => new THREE.Vector3(...p)));
      inner.push([[0,0,-s],[0,0,s]].map(p => new THREE.Vector3(...p)));
      inner.push([[s*0.5,0,s*0.5],[s*0.5,0,s]].map(p => new THREE.Vector3(...p)));
      inner.push([[s*0.5,0,s*0.5],[s,0,s*0.5]].map(p => new THREE.Vector3(...p)));
    } else if (layoutComplexity > 1.5) {
      inner.push([[-s,0,s*0.2],[s,0,s*0.2]].map(p => new THREE.Vector3(...p)));
    }
    return { outerWalls: outer, innerWalls: inner };
  }, [normalizedScale, layoutComplexity]);

  const corners = useMemo(() => outerWalls.slice(0,-1).map(p => [p.clone(), p.clone().setY(2)]), [outerWalls]);
  const lineColor = isNightMode ? '#6366f1' : '#60a5fa';

  return (
    <group>
      <Line points={outerWalls} color={lineColor} lineWidth={2.5} transparent opacity={0.6} />
      {innerWalls.map((wp, idx) => (
        <Line key={`iw-${idx}`} points={wp} color={lineColor} lineWidth={1.5} transparent opacity={0.4} />
      ))}
      <Line points={outerWalls.map(p => p.clone().setY(2))} color={lineColor} lineWidth={1.5} transparent opacity={0.3} dashSize={0.2} gapSize={0.1} dashed />
      {corners.map((c, i) => (
        <Line key={`corner-${i}`} points={c} color={lineColor} lineWidth={1} transparent opacity={0.2} />
      ))}
      <Grid
        infiniteGrid
        fadeDistance={15}
        sectionColor={isNightMode ? '#3730a3' : '#bae6fd'}
        cellColor={isNightMode ? '#312e81' : '#e0f2fe'}
        sectionSize={1}
        cellSize={0.2}
      />
    </group>
  );
}

export default function LiveSensing3DMap({ mode, sensing }) {
  const isNightMode = mode === 'night';
  const isLive = sensing.isConnected;
  const presence = isLive && (sensing.presenceGate?.calibrated
    ? sensing.presenceGate.status === 'inside'
    : sensing.presence);

  const occupantsCount = isLive && presence
    ? (sensing.actualOccupancyCount || sensing.estimatedPersons || 1)
    : 0;

  // Use tracked occupants from backend if available, otherwise generate placeholders
  const trackedOccupants = sensing.trackedOccupants && sensing.trackedOccupants.length > 0
    ? sensing.trackedOccupants
    : Array.from({ length: occupantsCount }, (_, i) => ({ id: i + 1 }));

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>

      {/* Overlay Status */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: isNightMode ? '#fff' : '#000', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
          3D SPATIAL RECONSTRUCTION
        </div>
        <div style={{ color: isNightMode ? '#94a3b8' : '#64748b', fontSize: 10 }}>
          {isLive ? `Live — ${trackedOccupants.length} occupant${trackedOccupants.length !== 1 ? 's' : ''} tracked` : 'Backend Feed Offline'}
        </div>
      </div>

      {/* Occupant count badge */}
      {presence && trackedOccupants.length > 0 && (
        <div style={{
          position: 'absolute', top: 12, right: 16, zIndex: 10,
          background: isNightMode ? 'rgba(99,102,241,0.25)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${isNightMode ? '#6366f1' : '#3b82f6'}`,
          borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
          color: isNightMode ? '#a5b4fc' : '#1d4ed8', backdropFilter: 'blur(8px)'
        }}>
          👥 {trackedOccupants.length} detected
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={isNightMode ? 0.8 : 1.5} />
        <directionalLight position={[10, 10, 5]} intensity={isNightMode ? 0.5 : 1} color={isNightMode ? '#818cf8' : '#ffffff'} />
        <pointLight position={[-5, 5, -5]} intensity={isNightMode ? 1 : 0.5} color="#4edea3" />
        <Environment preset={isNightMode ? 'night' : 'city'} />

        {/* Room Blueprint */}
        <BlueprintWalls sensing={sensing} isNightMode={isNightMode} />

        {/* Floor Heatmap */}
        <HeatmapFloor sensing={sensing} isNightMode={isNightMode} />

        {/* Render one 3D humanoid per tracked occupant */}
        {presence && trackedOccupants.map((occ, index) => (
          <AnimatedOccupant
            key={occ.id ?? index}
            index={index}
            occupant={occ}
            sensing={sensing}
            mode={mode}
            isPrimary={index === 0}
          />
        ))}

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={4}
          maxDistance={20}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
