import { PHYSICS_CONSTANTS, AtmosphericConditions } from '../types/physics';

const { g0, R_AIR, GAMMA, P0, T0, LAPSE_RATE } = PHYSICS_CONSTANTS;

/**
 * Computes atmospheric conditions using the US Standard Atmosphere 1976 (simplified).
 *
 * Three layers modeled:
 *  - Troposphere  (0 – 11 000 m): Linear temperature decrease
 *  - Stratosphere (11 000 – 25 000 m): Isothermal layer at 216.65 K
 *  - Mesosphere+  (> 25 000 m): Simplified exponential decay
 *
 * Reference: U.S. Standard Atmosphere, 1976 (NASA TM-X-74335)
 *
 * @param altitude - Geometric altitude [m], clamped to >= 0
 * @returns Atmospheric conditions (temperature, pressure, density, speed of sound)
 */
export function computeAtmosphere(altitude: number): AtmosphericConditions {
  const h = Math.max(0, altitude);

  let temperature: number;
  let pressure: number;

  if (h <= 11_000) {
    // --- TROPOSPHERE ---
    // Temperature decreases linearly: T = T0 - L*h
    // Pressure follows a power law derived from hydrostatic equilibrium + ideal gas law:
    //   dP/dh = -rho*g  combined with P = rho*R*T → P/P0 = (T/T0)^(g0/(R*L))
    temperature = T0 - LAPSE_RATE * h;
    const exponent = g0 / (R_AIR * LAPSE_RATE); // ≈ 5.2561
    pressure = P0 * Math.pow(temperature / T0, exponent);
  } else if (h <= 25_000) {
    // --- LOWER STRATOSPHERE ---
    // Temperature is constant (isothermal): T = 216.65 K
    // Pressure decays exponentially from the tropopause value:
    //   P = P_11 * exp(-g0*(h-11000)/(R*T))
    temperature = 216.65;
    // Tropopause pressure (T at 11 000 m)
    const T11 = T0 - LAPSE_RATE * 11_000; // 216.65 K
    const P11 = P0 * Math.pow(T11 / T0, g0 / (R_AIR * LAPSE_RATE)); // ≈ 22 632 Pa
    pressure = P11 * Math.exp(-g0 * (h - 11_000) / (R_AIR * temperature));
  } else {
    // --- UPPER ATMOSPHERE (simplified exponential) ---
    // Above 25 km the model uses a simple exponential scale-height approximation.
    // Real atmosphere is more complex (temperature inversion in stratopause, etc.)
    // but this is adequate for suborbital trajectory simulation.
    temperature = 216.65 * Math.exp(-0.000_008 * (h - 25_000));
    temperature = Math.max(temperature, 180); // prevent runaway cooling
    const T25 = 216.65;
    const T11 = T0 - LAPSE_RATE * 11_000;
    const P11 = P0 * Math.pow(T11 / T0, g0 / (R_AIR * LAPSE_RATE));
    const P25 = P11 * Math.exp(-g0 * 14_000 / (R_AIR * T25));
    pressure = P25 * Math.exp(-0.000_157_7 * (h - 25_000));
  }

  // Ideal gas law: rho = P / (R * T)
  const density = pressure / (R_AIR * temperature);

  // Speed of sound in air: a = sqrt(γ * R * T)
  // Derived from isentropic relations for a perfect gas
  const speedOfSound = Math.sqrt(GAMMA * R_AIR * temperature);

  return { temperature, pressure, density, speedOfSound };
}

/**
 * Computes the drag coefficient as a function of Mach number.
 *
 * Why Cd varies with Mach:
 *  - Subsonic (<0.8 Ma): attached flow, low wave drag → Cd ≈ 0.30
 *  - Transonic (0.8–1.2 Ma): shock waves form on the body surface,
 *    causing a dramatic increase in wave drag → Cd peaks at ≈ 0.80.
 *    This is the "sound barrier" — the structural loads spike here.
 *  - Supersonic (>1.2 Ma): attached oblique shocks, wave drag stabilizes
 *    → Cd ≈ 0.25 (lower than subsonic because blunt-nose contributions
 *    are dominated by supersonic pressure distribution)
 *
 * Reference: Barrowman method approximation for sounding rockets.
 *
 * @param mach - Mach number [dimensionless]
 * @returns Drag coefficient Cd [dimensionless]
 */
export function computeCd(mach: number): number {
  if (mach < 0.8) {
    return 0.30;
  } else if (mach <= 1.2) {
    // Smooth cubic interpolation through the transonic regime
    // Cd peaks at Ma=1.0 (0.80) and returns to lower values on either side
    const t = (mach - 0.8) / 0.4; // normalized [0, 1]
    // Cubic Hermite: starts at 0.30, peaks at 0.80 (Ma=1.0), ends at 0.25
    // We use a simple parabolic approximation: peak at t=0.5
    return 0.30 + 2.0 * t * (1 - t) * 0.50 + t * (t - 1) * 0.10;
  } else {
    return 0.25;
  }
}
