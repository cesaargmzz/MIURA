import { Scene3D } from '../Scene3D/Scene3D';
import { HUD } from '../HUD/HUD';
import { MissionStatePanel } from '../Panels/MissionStatePanel';
import { VehicleConfigPanel } from '../Panels/VehicleConfigPanel';
import { TelemetryGraphs } from '../Graphs/TelemetryGraphs';
import { ControlBar } from './ControlBar';
import { useSimulationLoop } from '../../telemetry/hooks';
import { useTelemetry } from '../../telemetry/hooks';

function TelemetryNumerics() {
  const { currentSnapshot } = useTelemetry();
  if (!currentSnapshot) return null;

  const fields = [
    { label: 'Alt', value: currentSnapshot.altitude_km.toFixed(3), unit: 'km' },
    { label: 'Vel', value: currentSnapshot.velocidad_ms.toFixed(1), unit: 'm/s' },
    { label: 'Mach', value: currentSnapshot.numero_mach.toFixed(3), unit: '' },
    { label: 'G', value: currentSnapshot.carga_g.toFixed(2), unit: 'g' },
    { label: 'Propel', value: currentSnapshot.masa_propelente_kg.toFixed(0), unit: 'kg' },
    { label: 'Empuje', value: (currentSnapshot.empuje_n / 1000).toFixed(1), unit: 'kN' },
    { label: 'Arrastre', value: (currentSnapshot.arrastre_n / 1000).toFixed(1), unit: 'kN' },
    { label: 'dyn-q', value: currentSnapshot.presion_dinamica_pa.toFixed(0), unit: 'Pa' },
  ];

  return (
    <div className="grid grid-cols-2 gap-1 mb-3">
      {fields.map((f) => (
        <div key={f.label} className="flex justify-between bg-black/40 rounded px-2 py-0.5">
          <span className="text-gray-500 text-xs font-mono">{f.label}</span>
          <span className="text-mission-green text-xs font-mono">{f.value} {f.unit}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Root mission control component.
 * Three-column layout: State panel | 3D Scene | Telemetry panel
 * The simulation loop runs here at the top level.
 */
export function MissionControl() {
  // Start the RAF simulation loop
  useSimulationLoop();

  return (
    <div
      className="flex flex-col h-screen w-screen"
      style={{ backgroundColor: '#0a0e1a', color: '#e0e8f0' }}
    >
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-mission-border bg-mission-panel">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-mission-green flex items-center justify-center">
            <span className="text-mission-green text-xs font-mono font-bold">M1</span>
          </div>
          <div>
            <h1 className="text-sm font-mono font-bold text-mission-green tracking-wider">
              MIURA MISSION CONTROL
            </h1>
            <p className="text-xs font-mono text-gray-500">PLD Space Simulation — Educational</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Mission State */}
        <div className="w-64 flex-shrink-0 border-r border-mission-border p-3 overflow-y-auto flex flex-col gap-3">
          <VehicleConfigPanel />
          <MissionStatePanel />
        </div>

        {/* Center — 3D Scene */}
        <div className="flex-1 relative">
          <Scene3D />
          <HUD />
        </div>

        {/* Right panel — Telemetry */}
        <div className="w-72 flex-shrink-0 border-l border-mission-border p-3 overflow-y-auto">
          <p className="text-mission-amber text-xs font-mono mb-2">TELEMETRÍA EN VIVO</p>
          <TelemetryNumerics />
          <TelemetryGraphs />
        </div>
      </div>

      {/* Bottom control bar */}
      <ControlBar />
    </div>
  );
}
