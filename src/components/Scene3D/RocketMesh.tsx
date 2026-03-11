import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RocketMeshProps {
  position: [number, number, number];
  flightAngle: number;
  thrustActive: boolean;
  thrust: number;
  maxThrust: number;
}

/**
 * 3D rocket model using primitive geometries.
 * Body: Cylinder, Nose: Cone, Fins: BoxGeometry
 * Exhaust plume: animated Points system
 */
export function RocketMesh({ position, flightAngle, thrustActive, thrust, maxThrust }: RocketMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Points>(null);

  // Animate exhaust particles
  useFrame((_, delta) => {
    if (!plumeRef.current || !thrustActive) return;
    const positions = plumeRef.current.geometry.attributes['position'];
    if (!positions) return;
    const arr = positions.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= delta * (2 + Math.random() * 3); // drift down
      if (arr[i + 1] < -3) arr[i + 1] = 0;
      arr[i] += (Math.random() - 0.5) * 0.02;
    }
    positions.needsUpdate = true;
  });

  const plumePositions = new Float32Array(150);
  for (let i = 0; i < 150; i += 3) {
    plumePositions[i] = (Math.random() - 0.5) * 0.1;
    plumePositions[i + 1] = -Math.random() * 2;
    plumePositions[i + 2] = (Math.random() - 0.5) * 0.1;
  }

  const plumeIntensity = thrustActive ? thrust / maxThrust : 0;

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, flightAngle]}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 4, 12]} />
        <meshPhongMaterial color="#c0c8d0" shininess={80} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 2.8, 0]}>
        <coneGeometry args={[0.35, 1.6, 12]} />
        <meshPhongMaterial color="#e8eef2" shininess={120} />
      </mesh>

      {/* Engine bell */}
      <mesh position={[0, -2.2, 0]}>
        <coneGeometry args={[0.28, 0.4, 12]} />
        <meshPhongMaterial color="#8a9090" shininess={60} />
      </mesh>

      {/* Fins (4x) */}
      {[0, 90, 180, 270].map((angle) => (
        <mesh
          key={angle}
          position={[Math.sin((angle * Math.PI) / 180) * 0.5, -1.8, Math.cos((angle * Math.PI) / 180) * 0.5]}
          rotation={[0, (angle * Math.PI) / 180, 0]}
        >
          <boxGeometry args={[0.05, 1.2, 0.6]} />
          <meshPhongMaterial color="#9aa8b0" />
        </mesh>
      ))}

      {/* PLD Space stripe */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.352, 0.352, 0.3, 12]} />
        <meshPhongMaterial color="#e05020" />
      </mesh>

      {/* Exhaust plume */}
      {thrustActive && (
        <points ref={plumeRef} position={[0, -2.4, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[plumePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={new THREE.Color(1, 0.6 + plumeIntensity * 0.4, 0.1)}
            size={0.08 + plumeIntensity * 0.12}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}
