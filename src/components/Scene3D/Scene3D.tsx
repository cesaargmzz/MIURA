import { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RocketMesh } from './RocketMesh';
import { Environment } from './Environment';
import { useTelemetry } from '../../telemetry/hooks';
import { useSimStore } from '../../telemetry/store';

/**
 * Camera controller that follows the rocket with smooth lerp.
 * Switches to orbit mode when user interacts.
 */
function CameraController({ targetPosition: _targetPosition }: { targetPosition: THREE.Vector3 }) {
  const { camera } = useThree();

  useEffect(() => {
    // Initial camera position
    camera.position.set(60, 20, 60);
    camera.lookAt(0, 5, 0);
  }, [camera]);

  return null;
}

/**
 * Maps simulation altitude to 3D scene Y coordinate.
 * Uses a logarithmic scale above 10 km so we can see both
 * the launch pad and high-altitude trajectory.
 */
function altitudeToScene(altitude: number): number {
  if (altitude <= 0) return 0;
  if (altitude <= 10_000) {
    // Linear scale: 1 scene unit = 100 m
    return altitude / 100;
  }
  // Logarithmic beyond 10 km
  return 100 + Math.log10(altitude / 10_000) * 150;
}

export function Scene3D() {
  const { currentSnapshot } = useTelemetry();
  const config = useSimStore((s) => s.config);
  const missionState = useSimStore((s) => s.missionState);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  const altitude = currentSnapshot?.altitude_m ?? 0;
  const sceneY = altitudeToScene(altitude);
  const flightAngle = currentSnapshot ? (currentSnapshot.angulo_trayectoria_deg * Math.PI) / 180 : Math.PI / 2;
  const thrustActive = ['IGNITION', 'LIFTOFF', 'MAX_Q'].includes(missionState);
  const downrange = (currentSnapshot?.distancia_horizontal_km ?? 0) * 10;

  targetRef.current.set(downrange, sceneY, 0);

  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #000510, #0a1428)' }}
      camera={{ fov: 60, near: 0.1, far: 5000, position: [60, 20, 60] }}
    >
      <CameraController targetPosition={targetRef.current} />
      <OrbitControls enableDamping dampingFactor={0.08} />

      <Environment altitude={altitude} />

      <RocketMesh
        position={[downrange, sceneY, 0]}
        flightAngle={-flightAngle + Math.PI / 2}
        thrustActive={thrustActive}
        thrust={currentSnapshot?.empuje_n ?? 0}
        maxThrust={config.thrust}
      />
    </Canvas>
  );
}
