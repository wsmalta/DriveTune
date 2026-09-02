import { useState, useEffect } from 'react';
import type { DriveFile } from '../drive';
import { extractMetadata } from '../drive';
import { db } from '../db';

interface FullScreenPlayerProps {
  file: DriveFile | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function FullScreenPlayer({
  file,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
}: FullScreenPlayerProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; artist: string; album: string }>({
    title: '',
    artist: '',
    album: '',
  });

  useEffect(() => {
    if (!file) return;

    const metadata = extractMetadata(file.name);
    setMeta({
      title: metadata.title || file.name,
      artist: metadata.artist || 'Desconhecido',
      album: metadata.album || 'Desconhecido',
    });

    db.tracks.where('driveFileId').equals(file.id).first().then(dbTrack => {
      if (dbTrack?.coverUrl) {
        setCoverUrl(dbTrack.coverUrl);
      }
    });
  }, [file]);

  if (!file) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="full-screen-player-content">
      <div className="full-screen-header">
        <button className="full-screen-close" onClick={onClose}>
          ←
        </button>
        <div className="full-screen-header-icons">
          <button aria-label="Favorito">♡</button>
          <button aria-label="Mais opções">⋮</button>
        </div>
      </div>

      <div className="full-screen-cover">
        {coverUrl ? (
          <img src={coverUrl} alt="Capa do álbum" />
        ) : (
          <div className="full-screen-cover-placeholder">🎵</div>
        )}
      </div>

      <div className="full-screen-info">
        <div className="full-screen-title">{meta.title}</div>
        <div className="full-screen-artist">{meta.artist}</div>
        <div className="full-screen-album">{meta.album}</div>
      </div>

      <div className="full-screen-progress">
        <div className="full-screen-progress-bar">
          <div className="full-screen-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="full-screen-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="full-screen-controls">
        <button className="full-screen-control-btn" aria-label="Aleatório">
          🔀
        </button>
        <button className="full-screen-control-btn" onClick={onPrevious} aria-label="Anterior">
          ⏮
        </button>
        <button className="full-screen-play-btn" onClick={onPlayPause} aria-label={isPlaying ? 'Pausar' : 'Tocar'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="full-screen-control-btn" onClick={onNext} aria-label="Próxima">
          ⏭
        </button>
        <button className="full-screen-control-btn" aria-label="Repetir">
          🔁
        </button>
      </div>

      <div className="full-screen-footer">
        <span>44,1kHz MP3 256kbps</span>
      </div>
    </div>
  );
}
