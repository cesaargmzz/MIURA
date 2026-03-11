/** Physical constants used throughout the simulation */
export const PHYSICS_CONSTANTS = {
  g0: 9.80665,          // Standard gravity [m/s²]
  R_EARTH: 6_371_000,   // Earth radius [m]
  R_AIR: 287.05,        // Specific gas constant for dry air [J/(kg·K)]
  GAMMA: 1.4,           // Heat capacity ratio for air (diatomic)
  P0: 101_325,          // Sea-level pressure [Pa]
  T0: 288.15,           // Sea-level temperature [K]
  LAPSE_RATE: 0.0065,   // Temperature lapse rate in troposphere [K/m]
} as const;

/** 2D state vector for RK4 integration */
export interface RocketState {
  x: number;    // Horizontal position [m]
  y: number;    // Vertical position / altitude [m]
  vx: number;   // Horizontal velocity [m/s]
  vy: number;   // Vertical velocity [m/s]
  mass: number; // Current total mass [kg]
}

/** Rocket vehicle configuration */
export interface RocketConfig {
  dryMass: number;       // Dry mass (no propellant) [kg]
  propellantMass: number;// Initial propellant mass [kg]
  isp: number;           // Specific impulse [s]
  thrust: number;        // Maximum thrust [N]
  cd: number;            // Reference drag coefficient (overridden by Mach model)
  diameter: number;      // Body diameter [m]
  name: string;          // Vehicle name
}

/** Atmospheric conditions at a given altitude */
export interface AtmosphericConditions {
  temperature: number;  // [K]
  pressure: number;     // [Pa]
  density: number;      // [kg/m³]
  speedOfSound: number; // [m/s]
}

/** Full telemetry snapshot at one simulation step */
export interface TelemetrySnapshot {
  time: number;               // Mission time [s]
  altitude_m: number;         // [m]
  altitude_km: number;        // [km]
  velocidad_ms: number;       // Total speed magnitude [m/s]
  vx_ms: number;              // Horizontal velocity [m/s]
  vy_ms: number;              // Vertical velocity [m/s]
  aceleracion_ms2: number;    // Acceleration magnitude [m/s²]
  numero_mach: number;        // Mach number [dimensionless]
  presion_dinamica_pa: number;// Dynamic pressure (Max-Q candidate) [Pa]
  densidad_aire_kgm3: number; // Air density [kg/m³]
  temperatura_k: number;      // Atmospheric temperature [K]
  empuje_n: number;           // Thrust [N]
  arrastre_n: number;         // Drag force [N]
  fuerza_neta_n: number;      // Net force [N]
  masa_propelente_kg: number; // Remaining propellant [kg]
  fraccion_propelente: number;// Propellant fraction [0-1]
  distancia_horizontal_km: number; // Downrange distance [km]
  angulo_trayectoria_deg: number;  // Flight path angle [°]
  carga_g: number;            // G-load [g]
  state: MissionState;        // FSM state at this moment
}

/** All possible mission FSM states */
export type MissionState =
  | 'PRE_LAUNCH'
  | 'IGNITION'
  | 'LIFTOFF'
  | 'MAX_Q'
  | 'MECO'
  | 'COAST'
  | 'APOGEE'
  | 'REENTRY'
  | 'LANDING'
  | 'ABORT';

/** A recorded FSM transition event */
export interface MissionEvent {
  time: number;
  from: MissionState;
  to: MissionState;
  reason: string;
}

/** Derivative vector for RK4 (matches RocketState shape) */
export interface StateDerivative {
  dx: number;
  dy: number;
  dvx: number;
  dvy: number;
  dmass: number;
}
