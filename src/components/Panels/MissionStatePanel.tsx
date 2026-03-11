import { useTelemetry } from '../../telemetry/hooks';
import { MissionState } from '../../types/physics';

function stateColor(state: MissionState): string {
  switch (state) {
    case 'PRE_LAUNCH': return 'text-mission-amber';
    case 'IGNITION': return 'text-yellow-300';
    case 'LIFTOFF': return 'text-mission-green';
    case 'MAX_Q': return 'text-orange-400';
    case 'MECO': return 'text-blue-400';
    case 'COAST': return 'text-blue-300';
    case 'APOGEE': return 'text-cyan-400';
    case 'REENTRY': return 'text-orange-500';
    case 'LANDING': return 'text-mission-green';
    case 'ABORT': return 'text-mission-red';
    default: return 'text-gray-400';
  }
}

function stateBg(state: MissionState): string {
  switch (state) {
    case 'ABORT': return 'bg-red-900/30 border-mission-red';
    case 'MAX_Q': return 'bg-orange-900/30 border-orange-500';
    case 'LANDING': return 'bg-green-900/30 border-mission-green';
    default: return 'bg-blue-900/20 border-mission-border';
  }
}

function formatTime(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = (abs % 60).toFixed(1);
  return `T${sign}${m.toString().padStart(2, '0')}:${s.padStart(4, '0')}`;
}

export function MissionStatePanel() {
  const { missionState, missionTime, stateHistory, countdown } = useTelemetry();

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Mission clock */}
      <div className="bg-mission-panel border border-mission-border rounded p-3">
        <p className="text-gray-400 text-xs font-mono mb-1">RELOJ DE MISIÓN</p>
        <p className="text-mission-green text-2xl font-mono font-bold tracking-widest">
          {formatTime(missionTime)}
        </p>
      </div>

      {/* Current state */}
      <div className={`border rounded p-3 ${stateBg(missionState)}`}>
        <p className="text-gray-400 text-xs font-mono mb-1">ESTADO ACTUAL</p>
        <p className={`text-xl font-mono font-bold ${stateColor(missionState)}`}>
          {missionState}
        </p>
        {missionState === 'PRE_LAUNCH' && (
          <p className="text-mission-red text-sm font-mono mt-1 animate-pulse">
            CUENTA ATRÁS: T-{countdown.toFixed(1)}s
          </p>
        )}
      </div>

      {/* Event log */}
      <div className="flex-1 bg-mission-panel border border-mission-border rounded p-2 overflow-hidden flex flex-col">
        <p className="text-gray-400 text-xs font-mono mb-2">LOG DE EVENTOS</p>
        <div className="flex-1 overflow-y-auto space-y-1">
          {[...stateHistory].reverse().map((event, i) => (
            <div key={i} className="border-b border-mission-border/40 pb-1">
              <p className="text-mission-amber text-xs font-mono">{formatTime(event.time)}</p>
              <p className="text-gray-300 text-xs font-mono">
                <span className={stateColor(event.from)}>{event.from}</span>
                {' → '}
                <span className={stateColor(event.to)}>{event.to}</span>
              </p>
              <p className="text-gray-500 text-xs font-mono">{event.reason}</p>
            </div>
          ))}
          {stateHistory.length === 0 && (
            <p className="text-gray-600 text-xs font-mono">Esperando lanzamiento...</p>
          )}
        </div>
      </div>
    </div>
  );
}
