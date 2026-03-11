import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useTelemetry } from '../../telemetry/hooks';
import { TelemetrySnapshot } from '../../types/physics';

interface GraphProps {
  data: TelemetrySnapshot[];
  dataKey: keyof TelemetrySnapshot;
  label: string;
  unit: string;
  color: string;
  refLines?: Array<{ value: number; label: string; color: string }>;
}

function TelemetryGraph({ data, dataKey, label, unit, color, refLines = [] }: GraphProps) {
  // Show last 60 seconds of data (600 points at dt=0.1s)
  const recent = data.slice(-600);

  return (
    <div className="bg-mission-panel border border-mission-border rounded p-2">
      <p className="text-mission-amber text-xs font-mono mb-1">{label}</p>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={recent} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#1e2a3a" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 8, fill: '#6b7a8a' }}
            tickFormatter={(v: number) => `${v.toFixed(0)}s`}
          />
          <YAxis tick={{ fontSize: 8, fill: '#6b7a8a' }} />
          {refLines.map((rl) => (
            <ReferenceLine key={rl.value} y={rl.value} stroke={rl.color} strokeDasharray="4 2" label={{ value: rl.label, fontSize: 8, fill: rl.color }} />
          ))}
          <Line
            type="monotone"
            dataKey={dataKey as string}
            stroke={color}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={{ background: '#0a0e1a', border: '1px solid #1e2a3a', fontSize: 10 }}
            formatter={(v) => [`${(v as number).toFixed(2)} ${unit}`, label]}
            labelFormatter={(l) => `T+${(l as number).toFixed(1)}s`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TelemetryGraphs() {
  const { telemetryHistory, maxQSnapshot } = useTelemetry();

  return (
    <div className="flex flex-col gap-2 overflow-y-auto h-full">
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="altitude_km"
        label="ALTITUD"
        unit="km"
        color="#00ff88"
        refLines={[{ value: 100, label: 'Kármán', color: '#0088ff' }]}
      />
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="velocidad_ms"
        label="VELOCIDAD"
        unit="m/s"
        color="#00aaff"
      />
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="aceleracion_ms2"
        label="ACELERACIÓN"
        unit="m/s²"
        color="#ffaa00"
        refLines={[{ value: 0, label: '0', color: '#444' }]}
      />
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="numero_mach"
        label="NÚMERO DE MACH"
        unit=""
        color="#ff8800"
        refLines={[
          { value: 1.0, label: 'Ma=1', color: '#ff3355' },
          { value: 0.8, label: 'Ma=0.8', color: '#ff8800' },
        ]}
      />
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="presion_dinamica_pa"
        label="PRESIÓN DINÁMICA (Max-Q)"
        unit="Pa"
        color="#ff5500"
        refLines={maxQSnapshot ? [{ value: maxQSnapshot.presion_dinamica_pa, label: 'Max-Q', color: '#ff3355' }] : []}
      />
      <TelemetryGraph
        data={telemetryHistory}
        dataKey="arrastre_n"
        label="FUERZA DE ARRASTRE"
        unit="N"
        color="#cc44ff"
      />
    </div>
  );
}
