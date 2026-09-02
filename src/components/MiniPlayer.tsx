import { useState, useEffect } from 'react';
import type { DriveFile } from '../drive';
import { extractMetadata } from '../drive';
import { db } from '../db';

interface MiniPlayerProps {
  file: DriveFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenFullScreen: () => void;
}

export function MiniPlayer({
  file,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrevious,
  onOpenFullScreen,
}: MiniPlayerProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; artist: string }>({ title: '', artist: '' });

  useEffect(() => {
    if (!file) return;

    const metadata = extractMetadata(file.name);
    setMeta({
      title: metadata.title || file.name,
      artist: metadata.artist || 'Desconhecido',
    });

    db.tracks.where('driveFileId').equals(file.id).first().then(dbTrack => {
      if (dbTrack?.coverUrl) {
        setCoverUrl(dbTrack.coverUrl);
      }
    });
  }, [file]);

  if (!file) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mini-player" onClick={onOpenFullScreen}>
      <div className="mini-player-progress">
        <div className="mini-player-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="mini-player-content">
        <div className="mini-player-cover">
          {coverUrl ? (
            <img src={coverUrl} alt="Capa" />
          ) : (
            <div className="mini-player-cover-placeholder">🎵</div>
          )}
        </div>

        <div className="mini-player-info">
          <div className="mini-player-title">{meta.title}</div>
          <div className="mini-player-artist">{meta.artist}</div>
        </div>

        <div className="mini-player-controls" onClick={e => e.stopPropagation()}>
          <button onClick={onPrevious} aria-label="Anterior">
            ⏮
          </button>
          <button onClick={onPlayPause} aria-label={isPlaying ? 'Pausar' : 'Tocar'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={onNext} aria-label="Próxima">
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
