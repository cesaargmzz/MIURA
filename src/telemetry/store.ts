import { create } from 'zustand';
import {
  RocketState,
  RocketConfig,
  TelemetrySnapshot,
  MissionState,
  MissionEvent,
  PHYSICS_CONSTANTS,
} from '../types/physics';
import { rk4Step } from '../physics/integrator';
import { computeTelemetryAux } from '../physics/forces';
import { evaluateTransition } from '../fsm/missionFSM';
import { MIURA1 } from '../presets/rockets';

const DT = 0.1; // Fixed physics time step [s]

interface SimulationStore {
  // Configuration
  config: RocketConfig;
  setConfig: (config: RocketConfig) => void;

  // Physics state
  rocketState: RocketState;

  // Mission control
  missionState: MissionState;
  missionTime: number;
  previousState: MissionState | null;
  stateHistory: MissionEvent[];
  timeInState: number;

  // Simulation control
  isRunning: boolean;
  isPaused: boolean;
  timeScale: number;
  thrustActive: boolean;
  abortRequested: boolean;

  // Telemetry
  currentSnapshot: TelemetrySnapshot | null;
  telemetryHistory: TelemetrySnapshot[];
  maxQSnapshot: TelemetrySnapshot | null;
  peakDynPressure: number;
  maxQRecorded: boolean;

  // Countdown
  countdown: number;
  ignitionTime: number | null;

  // Actions
  launch: () => void;
  abort: () => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  setTimeScale: (scale: number) => void;
  tick: (realDeltaMs: number) => void;
}

function makeInitialRocketState(config: RocketConfig): RocketState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mass: config.dryMass + config.propellantMass,
  };
}

export const useSimStore = create<SimulationStore>((set, get) => ({
  config: MIURA1,
  setConfig: (config) =>
    set({ config, rocketState: makeInitialRocketState(config) }),

  rocketState: makeInitialRocketState(MIURA1),

  missionState: 'PRE_LAUNCH',
  missionTime: 0,
  previousState: null,
  stateHistory: [],
  timeInState: 0,

  isRunning: false,
  isPaused: false,
  timeScale: 1,
  thrustActive: false,
  abortRequested: false,

  currentSnapshot: null,
  telemetryHistory: [],
  maxQSnapshot: null,
  peakDynPressure: 0,
  maxQRecorded: false,

  countdown: 10,
  ignitionTime: null,

  launch: () => {
    const { missionState } = get();
    if (missionState !== 'PRE_LAUNCH') return;
    set({ isRunning: true, isPaused: false, countdown: 10 });
  },

  abort: () => {
    const { missionState } = get();
    if (['LANDING', 'ABORT'].includes(missionState)) return;
    set({ abortRequested: true });
  },

  reset: () => {
    const { config } = get();
    set({
      rocketState: makeInitialRocketState(config),
      missionState: 'PRE_LAUNCH',
      missionTime: 0,
      previousState: null,
      stateHistory: [],
      timeInState: 0,
      isRunning: false,
      isPaused: false,
      thrustActive: false,
      abortRequested: false,
      currentSnapshot: null,
      telemetryHistory: [],
      maxQSnapshot: null,
      peakDynPressure: 0,
      maxQRecorded: false,
      countdown: 10,
      ignitionTime: null,
    });
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  setTimeScale: (timeScale) => set({ timeScale }),

  tick: (realDeltaMs: number) => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    if (['LANDING', 'ABORT'].includes(state.missionState) && state.rocketState.y <= 0) return;

    // How many physics steps to run this frame
    const simDelta = (realDeltaMs / 1000) * state.timeScale;
    const steps = Math.max(1, Math.round(simDelta / DT));

    let rocketState = { ...state.rocketState };
    let missionTime = state.missionTime;
    let missionState = state.missionState;
    let previousState = state.previousState;
    let stateHistory = state.stateHistory;
    let timeInState = state.timeInState;
    let thrustActive = state.thrustActive;
    let abortRequested = state.abortRequested;
    let countdown = state.countdown;
    let ignitionTime = state.ignitionTime;
    let peakDynPressure = state.peakDynPressure;
    let maxQRecorded = state.maxQRecorded;
    let maxQSnapshot = state.maxQSnapshot;
    let lastSnapshot: TelemetrySnapshot | null = state.currentSnapshot;
    const newHistory: TelemetrySnapshot[] = [];

    for (let i = 0; i < steps; i++) {
      missionTime += DT;
      timeInState += DT;

      // Countdown handling
      if (missionState === 'PRE_LAUNCH' && state.isRunning) {
        countdown = Math.max(0, countdown - DT);
        if (countdown <= 0 && !ignitionTime) {
          ignitionTime = missionTime;
          // Trigger IGNITION transition manually
          const event: MissionEvent = {
            time: missionTime,
            from: 'PRE_LAUNCH',
            to: 'IGNITION',
            reason: 'T-0: Engine ignition sequence',
          };
          stateHistory = [...stateHistory, event];
          previousState = missionState;
          missionState = 'IGNITION';
          timeInState = 0;
          thrustActive = true;
        }
      }

      // Integrate physics
      const isEngineOn = thrustActive && missionState !== 'MECO' && missionState !== 'COAST' &&
        missionState !== 'APOGEE' && missionState !== 'REENTRY' && missionState !== 'LANDING' &&
        missionState !== 'ABORT';

      rocketState = rk4Step(rocketState, state.config, isEngineOn, DT);

      // Clamp to ground
      if (rocketState.y < 0) {
        rocketState = { ...rocketState, y: 0, vy: 0, vx: 0 };
      }

      // Compute auxiliary telemetry
      const aux = computeTelemetryAux(rocketState, state.config, isEngineOn);

      // Track peak dynamic pressure (Max-Q detection)
      if (aux.dynamicPressure > peakDynPressure) {
        peakDynPressure = aux.dynamicPressure;
      }

      // Build snapshot
      const snapshot: TelemetrySnapshot = {
        time: missionTime,
        altitude_m: rocketState.y,
        altitude_km: rocketState.y / 1000,
        velocidad_ms: aux.speed,
        vx_ms: rocketState.vx,
        vy_ms: rocketState.vy,
        aceleracion_ms2: aux.acceleration,
        numero_mach: aux.mach,
        presion_dinamica_pa: aux.dynamicPressure,
        densidad_aire_kgm3: aux.density,
        temperatura_k: aux.temperature,
        empuje_n: aux.thrust,
        arrastre_n: aux.drag,
        fuerza_neta_n: aux.thrust - aux.drag - rocketState.mass * PHYSICS_CONSTANTS.g0,
        masa_propelente_kg: aux.propellantMass,
        fraccion_propelente: aux.propellantFraction,
        distancia_horizontal_km: rocketState.x / 1000,
        angulo_trayectoria_deg: aux.flightAngleDeg,
        carga_g: aux.gLoad,
        state: missionState,
      };

      // FSM transition evaluation
      const transition = evaluateTransition(
        missionState,
        rocketState,
        state.config,
        missionTime,
        isEngineOn,
        maxQRecorded,
        peakDynPressure,
        false, // launch command already processed
        abortRequested
      );

      if (transition) {
        const event: MissionEvent = {
          time: missionTime,
          from: missionState,
          to: transition.next,
          reason: transition.reason,
        };
        stateHistory = [...stateHistory, event];
        previousState = missionState;
        missionState = transition.next;
        timeInState = 0;
        abortRequested = false;

        if (transition.next === 'MECO') thrustActive = false;
        if (transition.next === 'MAX_Q') {
          maxQRecorded = true;
          maxQSnapshot = snapshot;
        }
      }

      lastSnapshot = { ...snapshot, state: missionState };
      newHistory.push(lastSnapshot);
    }

    set({
      rocketState,
      missionTime,
      missionState,
      previousState,
      stateHistory,
      timeInState,
      thrustActive,
      abortRequested,
      countdown,
      ignitionTime,
      peakDynPressure,
      maxQRecorded,
      maxQSnapshot,
      currentSnapshot: lastSnapshot,
      // Keep history bounded to last 10 minutes at dt=0.1s = 6000 entries
      telemetryHistory: [...state.telemetryHistory, ...newHistory].slice(-6000),
    });
  },
}));
