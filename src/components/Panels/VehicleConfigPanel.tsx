import { useState } from 'react';
import { useSimStore } from '../../telemetry/store';
import { RocketConfig } from '../../types/physics';
import { ROCKET_PRESETS } from '../../presets/rockets';

interface FieldProps {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  disabled: boolean;
}

function ConfigField({ label, value, unit, onChange, disabled }: FieldProps) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <label className="text-gray-400 text-xs font-mono w-28">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="flex-1 bg-black border border-mission-border rounded px-2 py-0.5 text-xs font-mono text-mission-green disabled:opacity-50 focus:border-mission-amber focus:outline-none"
      />
      <span className="text-gray-600 text-xs font-mono w-10">{unit}</span>
    </div>
  );
}

export function VehicleConfigPanel() {
  const config = useSimStore((s) => s.config);
  const setConfig = useSimStore((s) => s.setConfig);
  const missionState = useSimStore((s) => s.missionState);
  const isLocked = missionState !== 'PRE_LAUNCH';

  const [local, setLocal] = useState<RocketConfig>(config);

  function updateField(field: keyof RocketConfig, value: number | string) {
    setLocal((prev) => ({ ...prev, [field]: value }));
  }

  function applyConfig() {
    setConfig(local);
  }

  function loadPreset(key: string) {
    const preset = ROCKET_PRESETS[key];
    if (preset) {
      setLocal(preset);
      setConfig(preset);
    }
  }

  return (
    <div className="bg-mission-panel border border-mission-border rounded p-3">
      <p className="text-mission-amber text-xs font-mono mb-3">CONFIGURACIÓN DEL VEHÍCULO</p>

      {/* Preset buttons */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {Object.entries(ROCKET_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => loadPreset(key)}
            disabled={isLocked}
            className="text-xs font-mono px-2 py-1 border border-mission-border rounded hover:border-mission-amber hover:text-mission-amber disabled:opacity-40 transition-colors"
          >
            {preset.name.split('(')[0].trim()}
          </button>
        ))}
      </div>

      <ConfigField label="Masa seca" value={local.dryMass} unit="kg" onChange={(v) => updateField('dryMass', v)} disabled={isLocked} />
      <ConfigField label="Propelente" value={local.propellantMass} unit="kg" onChange={(v) => updateField('propellantMass', v)} disabled={isLocked} />
      <ConfigField label="Isp" value={local.isp} unit="s" onChange={(v) => updateField('isp', v)} disabled={isLocked} />
      <ConfigField label="Empuje" value={local.thrust} unit="N" onChange={(v) => updateField('thrust', v)} disabled={isLocked} />
      <ConfigField label="Diámetro" value={local.diameter} unit="m" onChange={(v) => updateField('diameter', v)} disabled={isLocked} />

      {!isLocked && (
        <button
          onClick={applyConfig}
          className="mt-2 w-full py-1 text-xs font-mono border border-mission-green text-mission-green rounded hover:bg-mission-green/10 transition-colors"
        >
          APLICAR CONFIG
        </button>
      )}

      {/* Quick stats */}
      <div className="mt-3 pt-2 border-t border-mission-border">
        <p className="text-gray-500 text-xs font-mono">
          Δv Tsiolkovsky: {(config.isp * 9.80665 * Math.log((config.dryMass + config.propellantMass) / config.dryMass)).toFixed(0)} m/s
        </p>
        <p className="text-gray-500 text-xs font-mono">
          Masa total: {(config.dryMass + config.propellantMass).toFixed(0)} kg
        </p>
        <p className="text-gray-500 text-xs font-mono">
          T/W: {(config.thrust / ((config.dryMass + config.propellantMass) * 9.80665)).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
