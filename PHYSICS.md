# MIURA Mission Control — Physics Models Documentation

This document describes all physics models implemented in the MIURA 1 rocket launch simulation.

---

## 1. US Standard Atmosphere 1976

**File:** `src/physics/atmosphere.ts` — `computeAtmosphere(altitude)`

The simulation models the atmosphere in three distinct layers based on the US Standard Atmosphere 1976 (NASA TM-X-74335):

### Troposphere (0 – 11,000 m)

Temperature decreases linearly with altitude:

```
T(h) = T₀ - L·h
T₀ = 288.15 K  (sea-level standard temperature)
L  = 0.0065 K/m  (temperature lapse rate)
```

Pressure follows from the hydrostatic equation combined with the ideal gas law:

```
dP/dh = -ρ·g  and  P = ρ·R·T
→ P(h) = P₀ · (T(h)/T₀)^(g₀/(R·L))

where:
  P₀ = 101,325 Pa
  g₀ = 9.80665 m/s²
  R  = 287.05 J/(kg·K)  (specific gas constant, dry air)
  exponent ≈ 5.2561
```

### Lower Stratosphere (11,000 – 25,000 m)

Temperature is constant (isothermal) at the tropopause value: **T = 216.65 K**

Pressure decays exponentially (barometric formula):

```
P(h) = P₁₁ · exp(-g₀·(h - 11,000) / (R·T))
```

where P₁₁ ≈ 22,632 Pa is the pressure at the tropopause.

### Upper Atmosphere (> 25,000 m)

Above 25 km a simplified exponential scale-height approximation is used. The real atmosphere has a temperature inversion at the stratopause (~50 km) followed by the mesosphere, but for the purpose of suborbital trajectory simulation this simplified model produces adequate results.

---

## 2. Drag Coefficient Model

**File:** `src/physics/atmosphere.ts` — `computeCd(mach)`

The drag coefficient varies strongly with Mach number due to the onset of compressibility effects:

| Regime | Mach Range | Cd | Physical Explanation |
|--------|------------|-----|---------------------|
| Subsonic | Ma < 0.8 | 0.30 | Attached flow; drag dominated by skin friction and form drag |
| Transonic | 0.8 ≤ Ma ≤ 1.2 | up to 0.55 | Shock wave formation on the body surface dramatically increases wave drag — this is the "sound barrier" |
| Supersonic | Ma > 1.2 | 0.25 | Attached oblique shocks; wave drag stabilizes at a lower value |

The transonic region uses a smooth parabolic interpolation to avoid discontinuities.

**Reference:** Barrowman method approximation for sounding rockets.

---

## 3. Gravity Model

**File:** `src/physics/forces.ts` — `computeGravity(altitude)`

Gravitational acceleration varies with altitude following Newton's law:

```
g(h) = g₀ · (R_Earth / (R_Earth + h))²

where:
  g₀ = 9.80665 m/s²  (standard gravity at sea level)
  R_Earth = 6,371,000 m  (mean Earth radius)
```

For MIURA 1 at its ~150 km apogee: g ≈ 9.33 m/s² (~5% reduction from sea-level value).

---

## 4. Thrust and Mass Flow

**File:** `src/physics/forces.ts` — `computeMassFlow(config)`

The Tsiolkovsky rocket equation relates velocity change to mass ratio:

```
Δv = Isp · g₀ · ln(m₀/m_f)
```

From the thrust equation:

```
F = Isp · g₀ · ṁ
→ ṁ = F / (Isp · g₀)  [kg/s]
```

For MIURA 1:
- Thrust F = 30,000 N
- Isp = 290 s
- Mass flow ≈ 10.55 kg/s
- Burn time ≈ 237 s (2,500 kg propellant)
- Tsiolkovsky Δv ≈ 3,210 m/s (vacuum, gravity-free)

---

## 5. RK4 Numerical Integration

**File:** `src/physics/integrator.ts` — `rk4Step(state, config, thrustActive, dt)`

The simulation uses 4th-order Runge-Kutta (RK4) integration rather than simple Euler integration.

### Why RK4?

**Euler's method** advances the state using a single slope estimate at the beginning of the interval:
```
y_{n+1} = y_n + h · f(t_n, y_n)
```
Global truncation error: O(h) — for dt=0.1s over a 300s flight this produces kilometer-scale trajectory errors.

**RK4** computes four weighted slope estimates:
```
k₁ = f(t, y)
k₂ = f(t + h/2, y + h/2·k₁)
k₃ = f(t + h/2, y + h/2·k₂)
k₄ = f(t + h, y + h·k₃)

y_{n+1} = y_n + (h/6)·(k₁ + 2k₂ + 2k₃ + k₄)
```
Global truncation error: O(h⁴) — roughly 10,000× more accurate than Euler for the same step size.

RK4 is the industry standard for orbital mechanics integrators (used in GMAT, OpenRocket, MATLAB ode45).

**Reference:** Press et al., "Numerical Recipes" (3rd ed.), §17.1

---

## 6. Force Model (2D Trajectory)

**File:** `src/physics/forces.ts` — `computeDerivative(state, config, thrustActive)`

The simulation tracks rocket motion in a 2D vertical plane. Forces acting on the vehicle:

### Thrust
```
F_T = config.thrust  [N]  (along velocity vector — gravity turn)
```

During initial liftoff (speed < 1 m/s), thrust is directed vertically. Once the vehicle is moving, thrust follows the velocity vector (gravity turn trajectory). This is a simplification of the real pitch program used by MIURA 1.

### Aerodynamic Drag
```
F_D = ½ · ρ · v² · Cd(Ma) · A  [N]

where:
  ρ = air density from atmosphere model [kg/m³]
  v = speed magnitude [m/s]
  Cd = Mach-dependent drag coefficient
  A = π·(d/2)²  (reference cross-sectional area)
```

Drag opposes the velocity vector.

### Gravity
```
F_G = m · g(h)  [N]  (downward)
```

### Newton's Second Law
```
a = ΣF / m

ax = (F_Tx + F_Dx) / m
ay = (F_Ty + F_Dy - F_G) / m
```

---

## 7. Dynamic Pressure and Max-Q

Dynamic pressure is a measure of aerodynamic loading on the structure:

```
q = ½ · ρ · v²  [Pa]
```

**Max-Q** (maximum dynamic pressure) is the most critical structural loading event during ascent. At Max-Q the vehicle is simultaneously fast and still in dense atmosphere. This is why the Space Shuttle and real rockets throttle down their engines momentarily as they approach Max-Q.

For MIURA 1 the simulation detects Max-Q when dynamic pressure peaks (derivative ≈ 0 — density decrease outweighs velocity increase).

Typical Max-Q for MIURA 1 simulation: ~30,000–50,000 Pa at ~Ma 1.5–2.0 and ~15–20 km altitude.

---

## 8. Mission Finite State Machine

**File:** `src/fsm/missionFSM.ts`

The mission lifecycle is modeled as an FSM with the following states and transitions:

```
PRE_LAUNCH ──(launch command)──→ IGNITION
IGNITION ──(altitude > 0.5 m)──→ LIFTOFF
LIFTOFF ──(Max-Q detected, Ma > 0.5)──→ MAX_Q
MAX_Q ──(propellant = 0)──→ MECO
MECO ──(immediate)──→ COAST
COAST ──(vy ≤ 0, altitude > 1 km)──→ APOGEE
APOGEE ──(vy < -5 m/s)──→ REENTRY
REENTRY ──(altitude ≤ 0)──→ LANDING

Any state ──(ABORT command)──→ ABORT
ABORT ──(altitude ≤ 0)──→ LANDING
```

Each transition is recorded with timestamp and reason for post-flight analysis.

---

## 9. MIURA 1 Reference Data

| Parameter | Value | Source |
|-----------|-------|--------|
| Dry mass | ~1,000 kg | Estimated from total mass |
| Propellant mass | ~2,500 kg | LOX + Ethanol (estimated) |
| Total mass | ~3,500 kg | PLD Space |
| Thrust | ~30,000 N | TEPREL-1B engine |
| Isp (vacuum est.) | ~290 s | TEPREL-1B |
| Diameter | 0.70 m | PLD Space |
| Length | ~12 m | PLD Space |
| Target apogee | ~150 km | PLD Space |
| First flight | Oct 7, 2023 | El Arenosillo, Huelva |
| Propellants | LOX / Ethanol | PLD Space |
| T/W ratio | ~0.87 | Calculated |

Note: Some values are estimates based on publicly available information from PLD Space press releases and ESA documentation. The actual flight data has not been fully disclosed.

---

## 10. Coordinate System

The simulation uses a 2D Cartesian coordinate system:
- **x**: Horizontal (downrange) distance [m], positive East
- **y**: Vertical (altitude) [m], positive Up
- **Origin**: Launch pad at sea level

The 3D visualization maps these to Three.js coordinates using a logarithmic altitude scale above 10 km to keep both the launch pad and the apogee visible in the same scene.

---

*This simulation is for educational purposes as part of a Spanish aerospace education project. It uses simplified models appropriate for demonstrating the physics of suborbital rocket flight.*
