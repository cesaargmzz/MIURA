import { PHYSICS_CONSTANTS, RocketState, RocketConfig, StateDerivative } from '../types/physics';
import { computeAtmosphere, computeCd } from './atmosphere';

const { g0, R_EARTH } = PHYSICS_CONSTANTS;

/**
 * Computes gravitational acceleration at a given altitude.
 *
 * Equation: g(h) = g₀ · (R_earth / (R_earth + h))²
 *
 * Why g varies with altitude:
 *  Newton's law of universal gravitation: F = G·M·m/r²
 *  At altitude h, the distance to Earth's center is R+h, so:
 *  g(h)/g₀ = R²/(R+h)²
 *  For MIURA 1 at 150 km apogee: g ≈ 9.33 m/s² (≈5% reduction)
 *
 * @param altitude - Geometric altitude above sea level [m]
 * @returns Gravitational acceleration [m/s²]
 */
export function computeGravity(altitude: number): number {
  const r = R_EARTH + Math.max(0, altitude);
  return g0 * (R_EARTH / r) ** 2;
}

/**
 * Computes the mass flow rate from specific impulse and thrust.
 *
 * Tsiolkovsky's equation: Δv = Isp · g₀ · ln(m₀/m_f)
 * Thrust equation: F = Isp · g₀ · ṁ
 * Therefore: ṁ = F / (Isp · g₀)
 *
 * @param config - Rocket configuration
 * @returns Mass flow rate [kg/s] (positive = mass leaving)
 */
export function computeMassFlow(config: RocketConfig): number {
  return config.thrust / (config.isp * g0);
}

/**
 * Computes the state derivative (ẋ) for RK4 integration.
 *
 * Forces acting on the rocket (2D vertical plane):
 *  - Thrust F_T: along velocity vector (simplified: vertical during ascent)
 *  - Gravity F_G = m · g(h), downward
 *  - Drag F_D = ½ · ρ · v² · Cd · A, opposing velocity
 *
 * Newton's second law: a = ΣF / m
 *
 * @param state - Current state vector [x, y, vx, vy, mass]
 * @param config - Rocket configuration
 * @param thrustActive - Whether the engine is firing
 * @param launchAngle - Initial launch angle from vertical [rad]
 * @returns State derivative dS/dt
 */
export function computeDerivative(
  state: RocketState,
  config: RocketConfig,
  thrustActive: boolean,
  launchAngle: number = 0
): StateDerivative {
  const { x: _x, y, vx, vy, mass } = state;
  const h = Math.max(0, y);

  // Atmospheric properties at current altitude
  const atmo = computeAtmosphere(h);

  // Current speed magnitude
  const speed = Math.sqrt(vx * vx + vy * vy);

  // Mach number: Ma = v / a_sound
  const mach = speed > 0 ? speed / atmo.speedOfSound : 0;

  // Reference area: A = π·(d/2)²
  const area = Math.PI * (config.diameter / 2) ** 2;

  // Drag force magnitude: F_D = ½·ρ·v²·Cd·A
  const cd = computeCd(mach);
  const drag = 0.5 * atmo.density * speed * speed * cd * area;

  // Drag acts opposite to velocity vector
  const dragX = speed > 0 ? -drag * (vx / speed) : 0;
  const dragY = speed > 0 ? -drag * (vy / speed) : 0;

  // Gravity (always downward, variable with altitude)
  const g = computeGravity(h);
  const gravityY = -g * mass;

  // Thrust along velocity direction (gravity turn approximation)
  // During liftoff, initial direction is vertical (or near-vertical)
  let thrustX = 0;
  let thrustY = 0;
  let massFlow = 0;

  if (thrustActive) {
    const propellantMass = mass - config.dryMass;
    if (propellantMass > 0) {
      massFlow = computeMassFlow(config);
      const thrustMag = config.thrust;

      // Gravity turn: thrust along current velocity vector once moving,
      // or vertical during initial liftoff
      if (speed > 1) {
        thrustX = thrustMag * (vx / speed);
        thrustY = thrustMag * (vy / speed);
      } else {
        // Initial vertical trajectory with small horizontal kick for gravity turn
        thrustX = thrustMag * Math.sin(launchAngle);
        thrustY = thrustMag * Math.cos(launchAngle);
      }
    }
  }

  // Newton's second law: a = ΣF / m
  const ax = (thrustX + dragX) / mass;
  const ay = (thrustY + dragY + gravityY) / mass;

  return {
    dx: vx,
    dy: vy,
    dvx: ax,
    dvy: ay,
    dmass: -massFlow,
  };
}

/**
 * Computes auxiliary telemetry values from the current state.
 * These are derived quantities, not integrated directly.
 */
export function computeTelemetryAux(
  state: RocketState,
  config: RocketConfig,
  thrustActive: boolean
) {
  const { y, vx, vy, mass } = state;
  const h = Math.max(0, y);
  const atmo = computeAtmosphere(h);
  const speed = Math.sqrt(vx * vx + vy * vy);
  const mach = speed > 0 ? speed / atmo.speedOfSound : 0;
  const area = Math.PI * (config.diameter / 2) ** 2;
  const cd = computeCd(mach);
  const drag = 0.5 * atmo.density * speed * speed * cd * area;
  const g = computeGravity(h);

  const propellantMass = mass - config.dryMass;
  const thrust = thrustActive && propellantMass > 0 ? config.thrust : 0;
  const massFlow = thrust > 0 ? computeMassFlow(config) : 0;

  // Net force along velocity direction
  const gravForce = mass * g;
  const flightAngleRad = Math.atan2(vy, vx);
  const flightAngleDeg = (flightAngleRad * 180) / Math.PI;

  // Net vertical force (simplified)
  const netForce = thrust - drag - gravForce * Math.sin(Math.abs(flightAngleRad));
  const acceleration = Math.abs(netForce) / mass;

  return {
    speed,
    mach,
    thrust,
    drag,
    dynamicPressure: 0.5 * atmo.density * speed * speed,
    acceleration,
    gLoad: acceleration / PHYSICS_CONSTANTS.g0,
    flightAngleDeg,
    propellantMass: Math.max(0, propellantMass),
    propellantFraction: Math.max(0, propellantMass) / config.propellantMass,
    temperature: atmo.temperature,
    density: atmo.density,
    massFlow,
  };
}
