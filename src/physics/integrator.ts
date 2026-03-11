import { RocketState, RocketConfig, StateDerivative } from '../types/physics';
import { computeDerivative } from './forces';

/**
 * Applies RK4 (Runge-Kutta 4th order) integration step.
 *
 * Why RK4 and not Euler:
 *  - Euler's method: y_{n+1} = y_n + h·f(t_n, y_n)
 *    Error accumulates as O(h²) per step → O(h) globally.
 *    For a 150 km trajectory at dt=0.1s, Euler can deviate by kilometers.
 *  - RK4 computes 4 slope estimates (k1…k4) and takes a weighted average.
 *    Global error is O(h⁴) — for dt=0.1s this is ~10⁻⁴ times smaller.
 *    It is the industry standard for orbital mechanics integrators
 *    (e.g., used in GMAT, OpenRocket).
 *
 * RK4 formula:
 *   k1 = f(t, y)
 *   k2 = f(t + h/2, y + h/2·k1)
 *   k3 = f(t + h/2, y + h/2·k2)
 *   k4 = f(t + h, y + h·k3)
 *   y_{n+1} = y_n + (h/6)·(k1 + 2k2 + 2k3 + k4)
 *
 * Reference: Press et al., "Numerical Recipes" (3rd ed.), §17.1
 *
 * @param state - Current state vector
 * @param config - Rocket configuration
 * @param thrustActive - Whether the engine is firing
 * @param dt - Time step [s]
 * @returns New state after one RK4 step
 */
export function rk4Step(
  state: RocketState,
  config: RocketConfig,
  thrustActive: boolean,
  dt: number
): RocketState {
  const k1 = computeDerivative(state, config, thrustActive);
  const k2 = computeDerivative(addScaled(state, k1, dt / 2), config, thrustActive);
  const k3 = computeDerivative(addScaled(state, k2, dt / 2), config, thrustActive);
  const k4 = computeDerivative(addScaled(state, k3, dt), config, thrustActive);

  return {
    x: state.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: state.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    vx: state.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
    vy: state.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
    mass: Math.max(
      config.dryMass,
      state.mass + (dt / 6) * (k1.dmass + 2 * k2.dmass + 2 * k3.dmass + k4.dmass)
    ),
  };
}

/** Helper: state + scale * derivative */
function addScaled(state: RocketState, deriv: StateDerivative, scale: number): RocketState {
  return {
    x: state.x + scale * deriv.dx,
    y: state.y + scale * deriv.dy,
    vx: state.vx + scale * deriv.dvx,
    vy: state.vy + scale * deriv.dvy,
    mass: Math.max(0, state.mass + scale * deriv.dmass),
  };
}
