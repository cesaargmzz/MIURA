import { useTelemetry } from '../../telemetry/hooks';
import { useSimStore } from '../../telemetry/store';

function HUDTape({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center bg-black/60 border border-mission-border px-3 py-1 rounded">
      <span className="text-mission-amber text-xs font-mono">{label}</span>
      <span className="text-mission-green text-lg font-mono font-bold">{value}</span>
      <span className="text-gray-400 text-xs font-mono">{unit}</span>
    </div>
  );
}

export function HUD() {
  const { currentSnapshot, missionState, countdown } = useTelemetry();
  const isRunning = useSimStore((s) => s.isRunning);

  const alt = currentSnapshot?.altitude_km ?? 0;
  const spd = currentSnapshot?.velocidad_ms ?? 0;
  const mach = currentSnapshot?.numero_mach ?? 0;
  const gLoad = currentSnapshot?.carga_g ?? 0;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-10">
      <HUDTape label="ALT" value={alt.toFixed(2)} unit="km" />
      <HUDTape label="SPD" value={spd.toFixed(0)} unit="m/s" />
      <HUDTape label="MACH" value={mach.toFixed(3)} unit="" />
      <HUDTape label="G-LOAD" value={gLoad.toFixed(2)} unit="g" />
      {!isRunning && (
        <div className="flex items-center bg-black/60 border border-mission-amber px-3 py-1 rounded">
          <span className="text-mission-amber text-sm font-mono animate-pulse">SISTEMAS LISTOS</span>
        </div>
      )}
      {isRunning && missionState === 'PRE_LAUNCH' && (
        <div className="flex items-center bg-black/80 border border-mission-red px-3 py-1 rounded">
          <span className="text-mission-red text-lg font-mono font-bold">T-{countdown.toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
}
