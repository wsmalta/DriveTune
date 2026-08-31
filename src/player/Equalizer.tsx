import { useState, useEffect } from 'react';
import { db } from '../db';

export interface EQBand {
  frequency: number;
  gain: number;
  Q: number;
  label: string;
}

export interface EQSettings {
  enabled: boolean;
  bands: EQBand[];
}

const DEFAULT_BANDS: EQBand[] = [
  { frequency: 60, gain: 0, Q: 1.2, label: '60' },
  { frequency: 230, gain: 0, Q: 1.0, label: '230' },
  { frequency: 910, gain: 0, Q: 1.0, label: '910' },
  { frequency: 3600, gain: 0, Q: 1.0, label: '3.6k' },
  { frequency: 14000, gain: 0, Q: 0.7, label: '14k' },
];

const PRESETS: { name: string; bands: number[] }[] = [
  { name: 'Flat', bands: [0, 0, 0, 0, 0] },
  { name: 'Bass', bands: [6, 3, 0, 0, 0] },
  { name: 'Treble', bands: [0, 0, 0, 3, 6] },
  { name: 'Rock', bands: [4, 2, -1, 2, 4] },
  { name: 'Pop', bands: [-1, 2, 4, 2, -1] },
  { name: 'Jazz', bands: [3, 1, -1, 1, 3] },
  { name: 'Classical', bands: [4, 2, 0, 2, 4] },
  { name: 'Dance', bands: [5, 3, 0, -2, 4] },
  { name: 'Vocal', bands: [-2, 0, 4, 3, 0] },
];

interface EqualizerProps {
  filters: BiquadFilterNode[];
  onToggle: (enabled: boolean) => void;
  isEnabled: boolean;
}

export function Equalizer({ filters, onToggle, isEnabled }: EqualizerProps) {
  const [bands, setBands] = useState<EQBand[]>(DEFAULT_BANDS);
  const [selectedPreset, setSelectedPreset] = useState('Flat');

  useEffect(() => {
    db.eqSettings.toCollection().first().then(saved => {
      if (saved) {
        setBands(saved.bands);
        onToggle(saved.enabled);
        updateFilters(saved.bands);
      }
    }).catch(() => {});
  }, []);

  const updateFilters = (newBands: EQBand[]) => {
    filters.forEach((filter, i) => {
      if (newBands[i]) {
        filter.gain.value = isEnabled ? newBands[i].gain : 0;
      }
    });
  };

  const handleGainChange = (index: number, value: number) => {
    const newBands = [...bands];
    newBands[index] = { ...newBands[index], gain: value };
    setBands(newBands);
    setSelectedPreset('');
    updateFilters(newBands);
    saveSettings(newBands);
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    const newBands = bands.map((band, i) => ({
      ...band,
      gain: preset.bands[i] || 0,
    }));
    setBands(newBands);
    setSelectedPreset(presetName);
    updateFilters(newBands);
    saveSettings(newBands);
  };

  const handleToggle = () => {
    const newState = !isEnabled;
    onToggle(newState);
    filters.forEach((filter, i) => {
      filter.gain.value = newState ? bands[i].gain : 0;
    });
    saveSettings(bands, newState);
  };

  const saveSettings = (currentBands: EQBand[], enabled?: boolean) => {
    db.eqSettings.toCollection().first().then(existing => {
      const data = {
        bands: currentBands,
        enabled: enabled ?? isEnabled,
      };
      if (existing?.id) {
        db.eqSettings.update(existing.id, data);
      } else {
        db.eqSettings.add(data as never);
      }
    }).catch(() => {});
  };

  return (
    <div className="equalizer" onClick={e => e.stopPropagation()}>
      <div className="eq-header">
        <span className="eq-title">Equalizer</span>
        <button
          className={`eq-toggle ${isEnabled ? 'active' : ''}`}
          onClick={handleToggle}
        >
          {isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="eq-presets">
        {PRESETS.map(preset => (
          <button
            key={preset.name}
            className={`eq-preset-btn ${selectedPreset === preset.name ? 'active' : ''}`}
            onClick={() => handlePresetSelect(preset.name)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="eq-sliders">
        {bands.map((band, i) => (
          <div key={band.frequency} className="eq-band">
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={band.gain}
              onChange={e => handleGainChange(i, Number(e.target.value))}
              className="eq-slider"
              disabled={!isEnabled}
              style={{
                background: `linear-gradient(to top, var(--accent) 0%, var(--accent) ${((band.gain + 12) / 24) * 100}%, var(--bg-tertiary) ${((band.gain + 12) / 24) * 100}%, var(--bg-tertiary) 100%)`,
              }}
            />
            <span className="eq-gain">{band.gain > 0 ? '+' : ''}{band.gain}</span>
            <span className="eq-label">{band.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
