import { describe, it, expect } from 'vitest';
import { computeAtmosphere, computeCd } from './atmosphere';
import { PHYSICS_CONSTANTS } from '../types/physics';

const { R_AIR, GAMMA } = PHYSICS_CONSTANTS;

describe('US Standard Atmosphere 1976', () => {
  it('matches sea-level standard conditions', () => {
    const { temperature, pressure, density } = computeAtmosphere(0);
    expect(temperature).toBeCloseTo(288.15, 1);
    expect(pressure).toBeCloseTo(101325, 0);
    expect(density).toBeCloseTo(1.225, 2);
  });

  it('matches tropopause conditions at 11 000 m', () => {
    const { temperature, pressure } = computeAtmosphere(11_000);
    // Temperature at tropopause: T = 288.15 - 6.5*11 = 216.65 K
    expect(temperature).toBeCloseTo(216.65, 1);
    // Pressure: ~22 632 Pa
    expect(pressure).toBeCloseTo(22_632, -1);
  });

  it('is isothermal in the stratosphere at 20 000 m', () => {
    const atmo11 = computeAtmosphere(11_000);
    const atmo20 = computeAtmosphere(20_000);
    expect(atmo20.temperature).toBeCloseTo(216.65, 1);
    // Pressure must be lower at higher altitude
    expect(atmo20.pressure).toBeLessThan(atmo11.pressure);
  });

  it('pressure decreases monotonically with altitude', () => {
    const altitudes = [0, 5000, 11000, 20000, 25000, 50000, 80000];
    let prevPressure = Infinity;
    for (const h of altitudes) {
      const { pressure } = computeAtmosphere(h);
      expect(pressure).toBeLessThan(prevPressure);
      prevPressure = pressure;
    }
  });

  it('density is physically reasonable at 150 km (near vacuum)', () => {
    const { density } = computeAtmosphere(150_000);
    // Should be negligibly small — less than 0.001 kg/m³
    expect(density).toBeLessThan(0.001);
  });

  it('speed of sound is sqrt(γRT) at all altitudes', () => {
    [0, 11000, 30000].forEach((h) => {
      const { temperature, speedOfSound } = computeAtmosphere(h);
      const expected = Math.sqrt(GAMMA * R_AIR * temperature);
      expect(speedOfSound).toBeCloseTo(expected, 3);
    });
  });
});

describe('Drag coefficient model', () => {
  it('returns 0.30 in subsonic regime (Ma < 0.8)', () => {
    expect(computeCd(0)).toBe(0.30);
    expect(computeCd(0.5)).toBe(0.30);
    expect(computeCd(0.79)).toBe(0.30);
  });

  it('peaks in transonic regime (0.8 ≤ Ma ≤ 1.2)', () => {
    const subCd = computeCd(0.6);
    const transonicCd = computeCd(1.0);
    const supCd = computeCd(1.5);
    expect(transonicCd).toBeGreaterThan(subCd);
    expect(transonicCd).toBeGreaterThan(supCd);
  });

  it('returns 0.25 in supersonic regime (Ma > 1.2)', () => {
    expect(computeCd(1.5)).toBe(0.25);
    expect(computeCd(3.0)).toBe(0.25);
  });
});
