import { RocketConfig } from '../types/physics';

/**
 * MIURA 1 — PLD Space (Spain)
 *
 * First Spanish privately-developed orbital-class rocket.
 * Suborbital sounding rocket for microgravity payloads.
 * Successfully flew on Oct 7, 2023 from El Arenosillo, Huelva.
 *
 * Data sourced from PLD Space public communications and ESA documentation.
 * Some values are estimates based on published performance figures.
 *
 * Target apogee: ~150 km (Kármán line + margin)
 * Propellants: LOX/Ethanol (liquid bipropellant)
 * Engine: TEPREL-1B (single engine)
 */
export const MIURA1: RocketConfig = {
  name: 'MIURA 1 (PLD Space)',
  dryMass: 1_000,        // kg — estimated from total/propellant mass
  propellantMass: 2_500, // kg — LOX + Ethanol
  isp: 290,              // s  — TEPREL-1B vacuum Isp estimate
  thrust: 30_000,        // N  — ~3 tonnes-force at sea level
  diameter: 0.70,        // m  — 700 mm diameter
  cd: 0.35,              // Overridden by Mach-dependent model
};

/**
 * Falcon 9 — First Stage (SpaceX)
 *
 * Orbital-class two-stage rocket. This preset simulates the first stage only
 * (up to MECO1). Values from SpaceX public data and academic analyses.
 *
 * Note: Falcon 9's actual trajectory includes a pitch program and RTLS maneuver
 * not modeled here. This is a simplified first-stage ascent.
 */
export const FALCON9_S1: RocketConfig = {
  name: 'Falcon 9 — Stage 1 (simplified)',
  dryMass: 22_200,         // kg — Block 5 first stage dry mass
  propellantMass: 395_700, // kg — LOX + RP-1
  isp: 282,                // s  — Merlin 1D sea-level Isp
  thrust: 7_607_000,       // N  — 9x Merlin 1D at sea level
  diameter: 3.66,          // m
  cd: 0.30,                // Slightly lower Cd due to more slender shape
};

/** All available rocket presets */
export const ROCKET_PRESETS: Record<string, RocketConfig> = {
  miura1: MIURA1,
  falcon9_s1: FALCON9_S1,
};
