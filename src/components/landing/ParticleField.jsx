import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ParticleField({ count = 1200 }) {
  const groupRef = useRef(null);

  const { small, medium, large } = useMemo(() => {
    const generateParticles = (num) => {
      const positions = new Float32Array(num * 3);
      const colors = new Float32Array(num * 3);
      
      // High-contrast vibrant colors that pop against a light background
      const palette = [
        new THREE.Color('#1e40af'), // Blue 800 (Deep Medical Blue)
        new THREE.Color('#0284c7'), // Sky 600 (Vibrant Blue)
        new THREE.Color('#4338ca'), // Indigo 700 (Deep Purple)
        new THREE.Color('#0891b2'), // Cyan 600 (Dark Cyan)
        new THREE.Color('#0f172a'), // Slate 900 (Almost Black)
      ];

      for (let i = 0; i < num; i += 1) {
        // Restrict particle height to perfectly wrap the 2.5 unit spine, 
        // preventing them from infinitely extending and clustering the hero text
        let y = (Math.random() - 0.5) * 3.6;
        
        // Two distinct strands for the double helix (separated by PI)
        const strand = Math.random() > 0.5 ? 0 : Math.PI;
        
        // How many twists the helix has
        const twists = 2.2;
        const angle = y * twists + strand;
        
        // Strict radius for the helix backbone, plus noise
        const baseRadius = 0.95;
        
        // 60% of particles form the thick backbone, 40% form a glowing aura
        const isAura = Math.random() > 0.6;
        const r = isAura 
          ? baseRadius + (Math.random() * 1.8) // Scattered aura
          : baseRadius + (Math.random() * 0.15); // Thick backbone
        
        let x = Math.sin(angle) * r;
        let z = Math.cos(angle) * r;

        // Add random jitter so it looks like a cluster of particles, not a perfect line
        x += (Math.random() - 0.5) * 0.25;
        y += (Math.random() - 0.5) * 0.25;
        z += (Math.random() - 0.5) * 0.25;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const color = palette[Math.floor(Math.random() * palette.length)];
        // Aura particles are fainter, backbone particles are solid
        const intensity = isAura ? (0.2 + Math.random() * 0.4) : (0.7 + Math.random() * 0.5); 
        colors[i * 3] = color.r * intensity;
        colors[i * 3 + 1] = color.g * intensity;
        colors[i * 3 + 2] = color.b * intensity;
      }

      return { positions, colors };
    };

    return {
      small: generateParticles(Math.floor(count * 0.50)),  // 50% small
      medium: generateParticles(Math.floor(count * 0.35)), // 35% medium
      large: generateParticles(Math.floor(count * 0.15)),  // 15% large
    };
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // STRICTLY native window scroll-driven rotation
    // Removed synchronous DOM reads (scrollHeight, innerHeight) to fix brutal layout thrashing.
    const scrollY = window.scrollY;
    // Dynamic max scroll based on 5 full viewport heights of card scrolling
    const maxScroll = window.innerHeight * 5; 
    const scrollOffset = scrollY / maxScroll;
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
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
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
        <pointsMaterial size={0.045} map={circleTexture} vertexColors transparent={true} opacity={0.8} depthWrite={false} alphaTest={0.01} />
      </points>

      {/* MEDIUM PARTICLES */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={medium.positions.length / 3} array={medium.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={medium.colors.length / 3} array={medium.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} map={circleTexture} vertexColors transparent={true} opacity={0.85} depthWrite={false} alphaTest={0.01} />
      </points>

      {/* LARGE PARTICLES */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={large.positions.length / 3} array={large.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={large.colors.length / 3} array={large.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.16} map={circleTexture} vertexColors transparent={true} opacity={0.9} depthWrite={false} alphaTest={0.01} />
      </points>
    </group>
  );
}
