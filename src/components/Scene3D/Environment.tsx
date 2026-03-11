import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface EnvironmentProps {
  altitude: number;
}

/**
 * 3D environment: launch pad, atmosphere layers, stars.
 * Atmosphere layers use transparent spheres with altitude-appropriate colors.
 */
export function Environment({ altitude }: EnvironmentProps) {
  const starsRef = useRef<THREE.Points>(null);

  // Star field — visible above 40 km
  const starPositions = useMemo(() => {
    const positions = new Float32Array(3000);
    for (let i = 0; i < positions.length; i += 3) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const r = 800 + Math.random() * 200;
      positions[i] = r * Math.sin(theta) * Math.cos(phi);
      positions[i + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i + 2] = r * Math.cos(theta);
    }
    return positions;
  }, []);

  const starOpacity = Math.min(1, Math.max(0, (altitude - 40_000) / 20_000));

  // Suppress unused ref warning - starsRef is used for future animation
  void starsRef;

  return (
    <>
      {/* Launch pad / ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[500, 500, 20, 20]} />
        <meshPhongMaterial color="#1a2a1a" wireframe={false} />
      </mesh>

      {/* Ground grid */}
      <gridHelper args={[400, 40, '#2a4a2a', '#1a3a1a']} position={[0, 0.01, 0]} />

      {/* Launch tower (simplified) */}
      <mesh position={[-3, 15, 0]}>
        <boxGeometry args={[0.3, 30, 0.3]} />
        <meshPhongMaterial color="#3a4a3a" />
      </mesh>

      {/* Troposphere layer (0–11 km) — blue */}
      <mesh>
        <sphereGeometry args={[350, 32, 32]} />
        <meshBasicMaterial color="#0033aa" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>

      {/* Stratosphere layer (11–25 km) — lighter blue */}
      <mesh>
        <sphereGeometry args={[500, 32, 32]} />
        <meshBasicMaterial color="#0055cc" transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>

      {/* Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.8} transparent opacity={starOpacity} sizeAttenuation />
      </points>

      {/* Ambient + directional light */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[100, 200, 100]} intensity={1.2} castShadow />
    </>
  );
}
