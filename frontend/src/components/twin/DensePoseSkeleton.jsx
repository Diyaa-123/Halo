import React, { useMemo } from 'react';
import { Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const SKELETON_CONNECTIONS = [
  [0, 1], [0, 2], [1, 3], [2, 4], // Head
  [5, 6], // Shoulders
  [5, 7], [7, 9], // Left arm
  [6, 8], [8, 10], // Right arm
  [11, 12], // Hips
  [5, 11], [6, 12], // Torso
  [11, 13], [13, 15], // Left leg
  [12, 14], [14, 16], // Right leg
];

export default function DensePoseSkeleton({ pose, scale = 2.0, color = "#4edea3" }) {
  // pose is { keypoints: [x0, y0, x1, y1, ...], confidence: float }
  
  const points = useMemo(() => {
    if (!pose || !pose.keypoints || pose.keypoints.length !== 34) {
      return [];
    }

    const pts = [];
    for (let i = 0; i < 17; i++) {
      // Keypoints from the model are typically normalized [0, 1] for x and y
      const u = pose.keypoints[i * 2];
      const v = pose.keypoints[i * 2 + 1];

      // Map to 3D space:
      // u: [0, 1] -> [-1, 1] (X axis, width)
      // v: [0, 1] -> [2, 0] (Y axis, height - assuming 0 is top and 1 is bottom)
      const x = (u - 0.5) * scale;
      const y = (1.0 - v) * scale;
      const z = 0.0; // Flat skeleton

      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [pose, scale]);

  if (points.length === 0) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Draw joints */}
      {points.map((pt, idx) => (
        <Sphere key={`joint-${idx}`} args={[0.04, 16, 16]} position={pt}>
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </Sphere>
      ))}

      {/* Draw bones */}
      {SKELETON_CONNECTIONS.map(([startIdx, endIdx], idx) => {
        const p1 = points[startIdx];
        const p2 = points[endIdx];
        if (!p1 || !p2) return null;

        return (
          <Line
            key={`bone-${idx}`}
            points={[p1, p2]}
            color={color}
            lineWidth={4}
            transparent
            opacity={0.6}
          />
        );
      })}
    </group>
  );
}
