import React, { Suspense, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

const STL_PATH = '/assets/models/spine.stl';

function LoadedSpine() {
  const geometry = useLoader(STLLoader, STL_PATH);
  const groupRef = useRef();

  const spineGroup = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: '#0284c7',        // Deep Medical Blue (Sky 600)
      metalness: 0.1,          // Slight reflection
      roughness: 0.2,          // Smooth frosted interior
      transparent: true,       // Use standard alpha blending instead of expensive transmission
      opacity: 0.85,           // Mimic glass volume
      clearcoat: 1.0,          // Glossy exterior
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5     // High environment reflection for glass feel
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false; // DISABLED: 400k polygon shadows crash the GPU
    mesh.receiveShadow = false;

    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (size.z === maxDim) {
      mesh.rotation.x = -Math.PI / 2;
    } else if (size.x === maxDim) {
      mesh.rotation.z = Math.PI / 2;
    }

    const targetHeight = 2.5; 
    const scaleFactor = maxDim > 0 ? targetHeight / maxDim : 1;
    mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }, [geometry]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const heroHeight = window.innerHeight;
    const maxCardsScroll = Math.max(1, document.body.scrollHeight - window.innerHeight - heroHeight);
    const activeCardsScroll = Math.max(0, window.scrollY - heroHeight);
    const clampedProgress = Math.max(0, Math.min(1, activeCardsScroll / maxCardsScroll));
    
    const totalCards = 6;
    const scrollProgress = clampedProgress * totalCards;
    
    // Exact same rotation speed and direction as the HelixCards orbit
    const scrollRotation = -scrollProgress * (Math.PI / 4.5);

    const time = state.clock.elapsedTime;
    
    groupRef.current.rotation.y = Math.sin(time * 0.28) * 0.18 + scrollRotation;
    groupRef.current.rotation.x = Math.sin(time * 0.42) * 0.05;
    
    // Subtle floating animation, centered at Y=0
    groupRef.current.position.y = Math.sin(time * 0.55) * 0.09;
    groupRef.current.position.x = 0;
    groupRef.current.position.z = -0.72;
  });

  return <primitive ref={groupRef} object={spineGroup} />;
}

export default function SpineModel({ scrollProgress = 0 }) {
  return (
    <Suspense fallback={null}>
      <LoadedSpine scrollProgress={scrollProgress} />
    </Suspense>
  );
}
