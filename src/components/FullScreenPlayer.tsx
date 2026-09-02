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
  onSeek: (time: number) => void;
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
  onSeek,
  onClose,
}: FullScreenPlayerProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ title: string; artist: string; album: string }>({
    title: '',
    artist: '',
    album: '',
  });
  const [showMenu, setShowMenu] = useState(false);

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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  };

  return (
    <div className="full-screen-player-content">
      <div className="full-screen-header">
        <button className="full-screen-close" onClick={onClose}>
          ←
        </button>
        <div className="full-screen-header-icons">
          <button aria-label="Favorito">♡</button>
          <button 
            aria-label="Mais opções" 
            onClick={() => setShowMenu(!showMenu)}
            className={showMenu ? 'active' : ''}
          >
            ⋮
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="full-screen-menu">
          <button className="full-screen-menu-item">
            <span>🎛️</span>
            <span>Equalizador</span>
          </button>
          <button className="full-screen-menu-item">
            <span>ℹ️</span>
            <span>Detalhes da faixa</span>
          </button>
          <button className="full-screen-menu-item">
            <span>📋</span>
            <span>Adicionar à playlist</span>
          </button>
          <button className="full-screen-menu-item">
            <span>❤️</span>
            <span>Favoritar</span>
          </button>
        </div>
      )}

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
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeekChange}
          className="full-screen-progress-input"
        />
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
