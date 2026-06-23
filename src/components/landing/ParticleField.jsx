import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ParticleField({ count = 5000 }) {
  const groupRef = useRef(null);

  const { small, medium, large } = useMemo(() => {
    const generateParticles = (num) => {
      const positions = new Float32Array(num * 3);
      const colors = new Float32Array(num * 3);
      const palette = [
        new THREE.Color('#0369a1'), // Sky 700 (Deep Medical Blue)
        new THREE.Color('#0ea5e9'), // Sky 500 (Primary Cyan)
        new THREE.Color('#38bdf8'), // Sky 400 (Bright Cyan)
        new THREE.Color('#e0f2fe'), // Sky 100 (Ice White)
        new THREE.Color('#94a3b8'), // Slate 400 (Clinical Grey)
      ];

      for (let i = 0; i < num; i += 1) {
        let y = (Math.random() - 0.5) * 9.0;
        const strand = Math.random() > 0.5 ? 0 : Math.PI;
        const angle = y * 2.8 + strand;
        
        // Base radius + Power curve scatter (most stay near 0.15, some fly very far out)
        const scatter = Math.pow(Math.random(), 4); 
        const r = 0.15 + (Math.random() * 0.3) + (scatter * 4.5);
        
        let x = Math.sin(angle) * r;
        let z = Math.cos(angle) * r;

        x += (Math.random() - 0.5) * 0.25;
        y += (Math.random() - 0.5) * 0.25;
        z += (Math.random() - 0.5) * 0.25;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const color = palette[Math.floor(Math.random() * palette.length)];
        // Variable intensity: some particles are very subtle/dark, some are bright
        const intensity = 0.15 + Math.random() * 0.85; 
        colors[i * 3] = color.r * intensity;
        colors[i * 3 + 1] = color.g * intensity;
        colors[i * 3 + 2] = color.b * intensity;
      }

      return { positions, colors };
    };

    return {
      small: generateParticles(Math.floor(count * 0.55)),  // 55% small
      medium: generateParticles(Math.floor(count * 0.35)), // 35% medium
      large: generateParticles(Math.floor(count * 0.10)),  // 10% large
    };
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // STRICTLY native window scroll-driven rotation
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollOffset = window.scrollY / maxScroll;
    const scrollRotation = -scrollOffset * Math.PI * 4;

    groupRef.current.rotation.y = scrollRotation;
    // Slight vertical bob to match spine
    groupRef.current.position.y = -0.12 + Math.sin(time * 0.55) * 0.09;
  });

  const circleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.12, -0.72]}>
      {/* SMALL PARTICLES */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={small.positions.length / 3} array={small.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={small.colors.length / 3} array={small.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.025} map={circleTexture} vertexColors transparent={true} opacity={1} depthWrite={false} alphaTest={0.01} />
      </points>

      {/* MEDIUM PARTICLES */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={medium.positions.length / 3} array={medium.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={medium.colors.length / 3} array={medium.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} map={circleTexture} vertexColors transparent={true} opacity={1} depthWrite={false} alphaTest={0.01} />
      </points>

      {/* LARGE PARTICLES */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={large.positions.length / 3} array={large.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={large.colors.length / 3} array={large.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.095} map={circleTexture} vertexColors transparent={true} opacity={1} depthWrite={false} alphaTest={0.01} />
      </points>
    </group>
  );
}
