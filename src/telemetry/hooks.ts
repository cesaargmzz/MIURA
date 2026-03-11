import { useEffect, useRef } from 'react';
import { useSimStore } from './store';

/**
 * Primary hook for consuming telemetry data in UI components.
 * Returns the latest telemetry snapshot and the rolling history.
 */
export function useTelemetry() {
  const currentSnapshot = useSimStore((s) => s.currentSnapshot);
  const telemetryHistory = useSimStore((s) => s.telemetryHistory);
  const missionState = useSimStore((s) => s.missionState);
  const missionTime = useSimStore((s) => s.missionTime);
  const stateHistory = useSimStore((s) => s.stateHistory);
  const maxQSnapshot = useSimStore((s) => s.maxQSnapshot);
  const countdown = useSimStore((s) => s.countdown);

  return {
    currentSnapshot,
    telemetryHistory,
    missionState,
    missionTime,
    stateHistory,
    maxQSnapshot,
    countdown,
  };
}

/**
 * Animation loop hook — drives the physics simulation every frame.
 * Uses requestAnimationFrame for smooth 60fps updates.
 * The actual simulation steps are determined by timeScale.
 */
export function useSimulationLoop() {
  const tick = useSimStore((s) => s.tick);
  const isRunning = useSimStore((s) => s.isRunning);
  const isPaused = useSimStore((s) => s.isPaused);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTimeRef.current = null;
      }
      return;
    }

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = Math.min(now - lastTimeRef.current, 100); // cap at 100ms
        tick(delta);
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, isPaused, tick]);
}
