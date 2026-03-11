import { MissionState, MissionEvent, RocketState, RocketConfig } from '../types/physics';
import { computeTelemetryAux } from '../physics/forces';

export interface FSMStatus {
  current: MissionState;
  previous: MissionState | null;
  timeInState: number;
  history: MissionEvent[];
  missionTime: number;
}

/**
 * Determines the next mission state based on current physics state.
 *
 * The FSM encodes the lifecycle of a suborbital rocket flight:
 * PRE_LAUNCH → IGNITION → LIFTOFF → MAX_Q → MECO → COAST → APOGEE → REENTRY → LANDING
 *
 * Each transition records a timestamp and reason for post-flight analysis.
 *
 * @param current - Current FSM state
 * @param rocketState - Physics state vector
 * @param config - Rocket configuration
 * @param missionTime - Elapsed mission time [s]
 * @param thrustActive - Engine firing flag
 * @param maxQRecorded - Has Max-Q been recorded already?
 * @param peakDynPressure - Highest dynamic pressure seen so far [Pa]
 * @param launchCommandIssued - User pressed LAUNCH
 * @param abortCommandIssued - User pressed ABORT
 * @returns Next state (same as current if no transition)
 */
export function evaluateTransition(
  current: MissionState,
  rocketState: RocketState,
  config: RocketConfig,
  missionTime: number,
  thrustActive: boolean,
  maxQRecorded: boolean,
  peakDynPressure: number,
  launchCommandIssued: boolean,
  abortCommandIssued: boolean
): { next: MissionState; reason: string } | null {
  const { y, vy, mass } = rocketState;
  const propellantMass = mass - config.dryMass;
  const aux = computeTelemetryAux(rocketState, config, thrustActive);

  // Suppress unused variable warnings - these params are for API completeness
  void missionTime;
  void launchCommandIssued;

  // ABORT overrides everything (except already landed/aborted)
  if (abortCommandIssued && current !== 'ABORT' && current !== 'LANDING') {
    return { next: 'ABORT', reason: 'Abort command issued by operator' };
  }

  switch (current) {
    case 'PRE_LAUNCH':
      if (launchCommandIssued) {
        return { next: 'IGNITION', reason: 'Launch command accepted — engine ignition sequence started' };
      }
      return null;

    case 'IGNITION':
      // After 3 seconds of ignition, vehicle lifts off
      if (y > 0.5) {
        return { next: 'LIFTOFF', reason: `Vehicle cleared launch pad (altitude: ${y.toFixed(1)} m)` };
      }
      return null;

    case 'LIFTOFF':
      // Transition to MAX_Q phase when dynamic pressure peaks
      // MAX_Q is the moment of maximum aerodynamic stress on the vehicle
      if (!maxQRecorded && aux.dynamicPressure > peakDynPressure * 0.95 && aux.mach > 0.5) {
        return { next: 'MAX_Q', reason: `Max-Q detected: q = ${aux.dynamicPressure.toFixed(0)} Pa at Ma ${aux.mach.toFixed(2)}` };
      }
      return null;

    case 'MAX_Q':
      // After Max-Q, check for MECO
      if (propellantMass <= 0) {
        return { next: 'MECO', reason: 'Propellant depleted — Main Engine Cut-Off' };
      }
      return null;

    case 'MECO':
      return { next: 'COAST', reason: 'Engine off — ballistic coast phase begins' };

    case 'COAST':
      if (vy <= 0 && y > 1000) {
        return { next: 'APOGEE', reason: `Apogee reached at ${(y / 1000).toFixed(1)} km` };
      }
      return null;

    case 'APOGEE':
      if (vy < -5) {
        return { next: 'REENTRY', reason: 'Descent initiated — reentry phase' };
      }
      return null;

    case 'REENTRY':
      if (y <= 0 && vy < 0) {
        return { next: 'LANDING', reason: `Vehicle impacted at downrange ${(rocketState.x / 1000).toFixed(1)} km` };
      }
      return null;

    case 'ABORT':
      if (y <= 0) {
        return { next: 'LANDING', reason: 'Vehicle reached ground after abort' };
      }
      return null;

    case 'LANDING':
      return null;

    default:
      return null;
  }
}

/** Creates the initial FSM status */
export function createInitialFSM(): FSMStatus {
  return {
    current: 'PRE_LAUNCH',
    previous: null,
    timeInState: 0,
    history: [],
    missionTime: 0,
  };
}
