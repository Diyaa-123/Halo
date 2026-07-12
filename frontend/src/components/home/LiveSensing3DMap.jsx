import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import HumanTwinModel from '../twin/HumanTwinModel';
import DensePoseSkeleton from '../twin/DensePoseSkeleton';

function AnimatedOccupant({ index, occupant, sensing, mode, isPrimary }) {
  const groupRef = useRef();
  
  // Calculate raw distance using Log-Distance Path Loss Model from live feed
  const rssi = sensing.meanRssi || -60;
  const amps = sensing.csiAmplitude || [];
  const variance = sensing.variance || 0;
  
  const estimatedDistance = useMemo(() => {
    const P0 = -50;
    const n = 3;
    const distanceMeters = Math.pow(10, (P0 - rssi) / (10 * n));
    return Math.max(0.5, Math.min(distanceMeters, 8)); 
  }, [rssi]);

  // Frequency-Selective Fading Center of Mass for Angle
  // Calculates the weighted average of the subcarrier amplitudes to derive spatial azimuth
  const estimatedAngle = useMemo(() => {
    if (amps && amps.length > 0) {
      let sumAmp = 0;
      let weightedSum = 0;
      for (let i = 0; i < amps.length; i++) {
        sumAmp += amps[i];
        weightedSum += amps[i] * i;
      }
      const centerIndex = sumAmp > 0 ? weightedSum / sumAmp : amps.length / 2;
      // Map the index to a sweeping angle (0 to 2PI)
      const baseAngle = (centerIndex / amps.length) * Math.PI * 2;
      return baseAngle + (index * Math.PI / 4);
    }
    // Fallback if no CSI available: use variance as a rotational proxy
    return (variance * Math.PI) + (index * Math.PI / 4);
  }, [amps, variance, index]);

  const rawTargetX = occupant && occupant.position ? occupant.position[0] : Math.cos(estimatedAngle) * (isPrimary ? estimatedDistance : estimatedDistance + (index * 0.5));
  const rawTargetZ = occupant && occupant.position ? occupant.position[1] : Math.sin(estimatedAngle) * (isPrimary ? estimatedDistance : estimatedDistance + (index * 0.5));

  const currentTargetRef = useRef({ x: rawTargetX, z: rawTargetZ });
  const [isMovingState, setIsMovingState] = useState(false);
  const stopTimeoutRef = useRef(null);
  
  useEffect(() => {
    const dx = rawTargetX - currentTargetRef.current.x;
    const dz = rawTargetZ - currentTargetRef.current.z;
    const distMoved = Math.sqrt(dx*dx + dz*dz);
    
    // Apply a spatial deadzone filter to completely ignore telemetry jitter (< 0.2m)
    if (distMoved > 0.2) {
      currentTargetRef.current = { x: rawTargetX, z: rawTargetZ };
      setIsMovingState(true);
      
      // Auto-stop the twin if no new significant movement breaks the deadzone in 1.5 seconds
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = setTimeout(() => {
        setIsMovingState(false);
      }, 1500);
    }
  }, [rawTargetX, rawTargetZ]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const isMoving = isMovingState;
    const br = (occupant && occupant.breathing_rate > 0) ? occupant.breathing_rate : (sensing.breathingRate || 15);
    
    const targetX = currentTargetRef.current.x;
    const targetZ = currentTargetRef.current.z;

    // 2. Smoothly move (lerp) the twin to the target X,Z
    const moveSpeed = isMoving ? 3.0 * delta : 1.5 * delta;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, moveSpeed);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, moveSpeed);
    
    // 3. Make the twin face the direction of movement
    const dx = targetX - groupRef.current.position.x;
    const dz = targetZ - groupRef.current.position.z;
    if (isMoving && (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01)) {
       // Calculate rotation to face the movement vector
       let targetRotation = Math.atan2(dx, dz);
       
       // Use Doppler/Phase derived direction from backend if available
       if (occupant && occupant.direction !== undefined && Math.abs(occupant.direction) > 0.01) {
           targetRotation = occupant.direction;
       }
       
       // Find shortest path for rotation to avoid snapping 360 degrees
       let diff = targetRotation - groupRef.current.rotation.y;
       while (diff < -Math.PI) diff += Math.PI * 2;
       while (diff > Math.PI) diff -= Math.PI * 2;
       groupRef.current.rotation.y += diff * moveSpeed * 3.0;
    }

    // 4. Bobbing & Breathing Animations
    const breatheScale = 1.0 + Math.sin(time * (br / 30) * Math.PI) * 0.015;
    groupRef.current.scale.set(breatheScale, breatheScale, breatheScale);

    if (isMoving) {
      // Walk bounce
      groupRef.current.position.y = Math.abs(Math.sin(time * 8 + index)) * 0.1;
      // Slight sway
      groupRef.current.rotation.z = Math.sin(time * 4 + index) * 0.04;
      groupRef.current.rotation.x = Math.cos(time * 4 + index) * 0.04;
    } else {
      // Settle down to resting
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    }
  });

  const isNightMode = mode === 'night';
  const isLive = sensing.isConnected;
  const presence = isLive && sensing.presence;
  const twinColor = !isLive ? '#9CA3AF' : 
                    !presence ? '#3B82F6' : 
                    isMovingState ? '#F59E0B' : 
                    isNightMode ? '#4edea3' : '#6366f1';

  const hasPose = sensing.pose && sensing.pose.confidence > 0.1;

  return (
    <group ref={groupRef} position={[0,0,0]}>
      {hasPose ? (
        <DensePoseSkeleton pose={sensing.pose} scale={3.0} color={twinColor} />
      ) : (
        <HumanTwinModel
          color={twinColor}
          wireframe={true}
          scaleFactor={isPrimary ? 0.8 : 0.72}
          animate={false}
          regions={[]}
          enableControls={false}
        />
      )}
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
    // Distance from the occupant
    float dist = distance(vUv, uOccupantPos);
    
    // Create a pulsing effect based on time and confidence
    float pulse = sin(uTime * 2.0) * 0.05 + 1.0;
    float intensity = exp(-dist * 4.0) * uConfidence * pulse * uPresence;
    
    // Add some organic noise/waves
    float wave = sin(vUv.x * 10.0 + uTime) * cos(vUv.y * 10.0 + uTime) * 0.1;
    intensity += wave * 0.2 * uPresence;

    // Mix colors from cold (background) to hot (occupant)
    vec3 finalColor = mix(uColorCold, uColorHot, clamp(intensity, 0.0, 1.0));
    
    // Fade out at edges
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

  // The center of the heatmap (could be mapped to actual tracking data if available)
  const occupantPos = useMemo(() => new THREE.Vector2(0.5, 0.5), []); 

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOccupantPos: { value: occupantPos },
      uConfidence: { value: confidence },
      uColorCold: { value: new THREE.Color(isNightMode ? '#1e1b4b' : '#f0f9ff') },
      uColorHot: { value: new THREE.Color(isNightMode ? '#818cf8' : '#3b82f6') },
      uPresence: { value: presence ? 1.0 : 0.0 },
    }),
    [isNightMode, occupantPos]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly transition confidence uniform
      materialRef.current.uniforms.uConfidence.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uConfidence.value,
        confidence,
        0.05
      );
      materialRef.current.uniforms.uPresence.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uPresence.value,
        presence ? 1.0 : 0.0,
        0.05
      );
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
  
  // Use React.useEffect (aliased as useEffect)
  useEffect(() => {
    // Heavy dampening: only update if significant structural shift is detected
    if (Math.abs(rawRssi - dampedRssi) > 4) {
      setDampedRssi(rawRssi);
    }
    if (Math.abs(variance - dampedVariance) > 0.5) {
      setDampedVariance(variance);
    }
  }, [rawRssi, variance, dampedRssi, dampedVariance]);

  const normalizedScale = useMemo(() => {
    return Math.max(0.6, Math.min(2.0, (dampedRssi + 100) / 40));
  }, [dampedRssi]);

  // Physics-based Layout Complexity Formula
  // High variance (multipath scattering) + Low RSSI (attenuation) = Many Walls
  const layoutComplexity = useMemo(() => {
    const alpha = 1.2; // Variance weight
    const beta = 0.05; // RSSI drop weight
    const rssiDrop = Math.max(0, -30 - dampedRssi); // Drop from optimal -30dBm
    return (alpha * dampedVariance) + (beta * rssiDrop);
  }, [dampedVariance, dampedRssi]);

  const { outerWalls, innerWalls } = useMemo(() => {
    const s = normalizedScale * 6;
    const outer = [
      [-s, 0, -s],
      [s, 0, -s],
      [s, 0, s],
      [-s, 0, s],
      [-s, 0, -s],
    ].map(p => new THREE.Vector3(...p));

    const inner = [];
    
    // If layout complexity is high, predict multiple internal rooms
    if (layoutComplexity > 3.0) {
      inner.push(
        [[-s, 0, 0], [s, 0, 0]].map(p => new THREE.Vector3(...p)),
        [[0, 0, -s], [0, 0, s]].map(p => new THREE.Vector3(...p))
      );
      inner.push(
        [[s*0.5, 0, s*0.5], [s*0.5, 0, s]].map(p => new THREE.Vector3(...p)),
        [[s*0.5, 0, s*0.5], [s, 0, s*0.5]].map(p => new THREE.Vector3(...p))
      );
    } else if (layoutComplexity > 1.5) {
      inner.push(
        [[-s, 0, s*0.2], [s, 0, s*0.2]].map(p => new THREE.Vector3(...p))
      );
    }
    return { outerWalls: outer, innerWalls: inner };
  }, [normalizedScale, layoutComplexity]);

  // Vertical lines for corners (walls)
  const corners = useMemo(() => {
    return outerWalls.slice(0, -1).map(p => {
      return [p.clone(), p.clone().setY(2)];
    });
  }, [outerWalls]);

  const lineColor = isNightMode ? '#6366f1' : '#60a5fa';

  return (
    <group>
      {/* Floor outline */}
      <Line points={outerWalls} color={lineColor} lineWidth={2.5} transparent opacity={0.6} />
      
      {/* Inner Procedural Rooms */}
      {innerWalls.map((wallPoints, idx) => (
        <Line
          key={`inner-wall-${idx}`}
          points={wallPoints}
          color={lineColor}
          lineWidth={1.5}
          transparent
          opacity={0.4}
        />
      ))}

      {/* Ceiling outline */}
      <Line points={outerWalls.map(p => p.clone().setY(2))} color={lineColor} lineWidth={1.5} transparent opacity={0.3} dashSize={0.2} gapSize={0.1} dashed />
      
      {/* Vertical pillars */}
      {corners.map((c, i) => (
        <Line key={`corner-${i}`} points={c} color={lineColor} lineWidth={1} transparent opacity={0.2} />
      ))}

      {/* Ground Grid */}
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
  const presence = isLive && sensing.presence;
  const occupantsCount = isLive && sensing.estimatedPersons ? Math.max(1, sensing.estimatedPersons) : 1;

  const occupants = Array.from({ length: occupantsCount }, (_, i) => i);
  
  // Define colors based on mode and sensing state
  const twinColor = !isLive ? '#9CA3AF' : 
                    !presence ? '#3B82F6' : 
                    sensing.motionLevel === 'active' ? '#F59E0B' : 
                    isNightMode ? '#4edea3' : '#6366f1';

  return (
    <div style={{ width: '100%', height: '100%', background: 'transparent', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Overlay Status */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ color: isNightMode ? '#fff' : '#000', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
          3D SPATIAL RECONSTRUCTION
        </div>
        <div style={{ color: isNightMode ? '#94a3b8' : '#64748b', fontSize: 10 }}>
          {isLive ? 'Live Blueprint & Signal Heatmap' : 'Backend Feed Offline'}
        </div>
      </div>

      <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
        {/* Environment & Lighting */}
        <ambientLight intensity={isNightMode ? 0.8 : 1.5} />
        <directionalLight position={[10, 10, 5]} intensity={isNightMode ? 0.5 : 1} color={isNightMode ? '#818cf8' : '#ffffff'} />
        <pointLight position={[-5, 5, -5]} intensity={isNightMode ? 1 : 0.5} color="#4edea3" />
        
        <Environment preset={isNightMode ? "night" : "city"} />

        {/* The Procedural Room Blueprint */}
        <BlueprintWalls sensing={sensing} isNightMode={isNightMode} />

        {/* Dynamic Floor Heatmap */}
        <HeatmapFloor sensing={sensing} isNightMode={isNightMode} />

        {/* The Tracked Occupants */}
        {presence && (sensing.tracked_occupants && sensing.tracked_occupants.length > 0
          ? sensing.tracked_occupants.map((occ, index) => (
              <AnimatedOccupant 
                key={occ.id || index} 
                index={index} 
                occupant={occ}
                sensing={sensing} 
                mode={mode}
                isPrimary={index === 0} 
              />
            ))
          : occupants.map((index) => (
              <AnimatedOccupant 
                key={index} 
                index={index} 
                sensing={sensing} 
                mode={mode}
                isPrimary={index === 0} 
              />
            ))
        )}

        {/* Controls */}
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 8} // Allow looking more top-down
          maxPolarAngle={Math.PI / 2.05} // Almost fully horizontal
          minDistance={4}
          maxDistance={20}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
