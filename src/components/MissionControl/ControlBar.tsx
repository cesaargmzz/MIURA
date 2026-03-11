import { useSimStore } from '../../telemetry/store';
import { useTelemetry } from '../../telemetry/hooks';

const TIME_SCALES = [1, 5, 10, 50];

export function ControlBar() {
  const launch = useSimStore((s) => s.launch);
  const abort = useSimStore((s) => s.abort);
  const reset = useSimStore((s) => s.reset);
  const pause = useSimStore((s) => s.pause);
  const resume = useSimStore((s) => s.resume);
  const setTimeScale = useSimStore((s) => s.setTimeScale);
  const timeScale = useSimStore((s) => s.timeScale);
  const isRunning = useSimStore((s) => s.isRunning);
  const isPaused = useSimStore((s) => s.isPaused);
  const { missionState } = useTelemetry();

  const canLaunch = missionState === 'PRE_LAUNCH' && !isRunning;
  const canAbort = isRunning && !['LANDING', 'ABORT'].includes(missionState);
  const canPause = isRunning && !isPaused;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-mission-panel border-t border-mission-border">
      {/* LAUNCH */}
      <button
        onClick={launch}
        disabled={!canLaunch}
        className="px-6 py-2 text-sm font-mono font-bold border-2 border-mission-green text-mission-green rounded hover:bg-mission-green/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
      >
        LANZAR
      </button>

      {/* ABORT */}
      <button
        onClick={abort}
        disabled={!canAbort}
        className="px-6 py-2 text-sm font-mono font-bold border-2 border-mission-red text-mission-red rounded hover:bg-mission-red/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wider animate-pulse"
      >
        ABORTAR
      </button>

      {/* Pause / Resume */}
      <button
        onClick={canPause ? pause : resume}
        disabled={!isRunning}
        className="px-4 py-2 text-sm font-mono border border-mission-border rounded hover:border-mission-amber hover:text-mission-amber disabled:opacity-30 transition-colors"
      >
        {isPaused ? '▶ REANUDAR' : '⏸ PAUSA'}
      </button>

      {/* Time scale */}
      <div className="flex items-center gap-1 ml-2">
        <span className="text-gray-500 text-xs font-mono mr-1">TIEMPO:</span>
        {TIME_SCALES.map((scale) => (
          <button
            key={scale}
            onClick={() => setTimeScale(scale)}
            className={`px-2 py-1 text-xs font-mono border rounded transition-colors ${
              timeScale === scale
                ? 'border-mission-amber text-mission-amber bg-mission-amber/10'
                : 'border-mission-border hover:border-mission-amber hover:text-mission-amber'
            }`}
          >
            {scale}×
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="ml-auto px-4 py-2 text-xs font-mono border border-mission-border rounded hover:border-mission-red hover:text-mission-red transition-colors"
      >
        ↺ REINICIAR
      </button>

      {/* State indicator */}
      <div className="flex items-center gap-2 px-3 py-1 border border-mission-border rounded">
        <div className={`w-2 h-2 rounded-full ${
          missionState === 'ABORT' ? 'bg-mission-red animate-ping' :
          missionState === 'LANDING' ? 'bg-mission-green' :
          isRunning ? 'bg-mission-green animate-pulse' :
          'bg-mission-amber'
        }`} />
        <span className="text-xs font-mono text-gray-400">{missionState}</span>
      </div>
    </div>
  );
}
