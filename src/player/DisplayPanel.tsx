import { useState } from 'react';
import { TrackInfoPanel } from './TrackInfoPanel';
import { VUMeter } from './VUMeter';
import { AlbumCoverPanel } from './AlbumCoverPanel';
import type { DriveFile } from '../drive';

type DisplayMode = 'info' | 'album' | 'vumeter';

interface DisplayPanelProps {
  file: DriveFile | null;
  analyser: AnalyserNode | null;
}

const displayModes: DisplayMode[] = ['info', 'album', 'vumeter'];

export function DisplayPanel({ file, analyser }: DisplayPanelProps) {
  const [mode, setMode] = useState<DisplayMode>('info');

  const handleToggleMode = () => {
    const currentIndex = displayModes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % displayModes.length;
    setMode(displayModes[nextIndex]);
  };

  return (
    <div 
      className="display-panel clickable" 
      onClick={handleToggleMode}
      title="Clique para alternar visualização (Info / Capa / VU)"
      style={{ cursor: 'pointer' }}
    >
      <div className="display-panel-content">
        {mode === 'info' && <TrackInfoPanel file={file} />}
        {mode === 'album' && <AlbumCoverPanel file={file} />}
        {mode === 'vumeter' && <VUMeter analyser={analyser} />}
      </div>
    </div>
  );
}
