import { useState, useRef, useEffect, useCallback } from 'react';
import { getAudioUrl } from '../drive';
import { getAccessToken } from '../auth';
import type { DriveFile } from '../drive';

interface AudioPlayerProps {
  files: DriveFile[];
  initialIndex?: number;
  onEnded?: () => void;
}

export function AudioPlayer({ files, initialIndex = 0, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentFile = files[currentIndex];

  const loadAndPlay = useCallback(async (file: DriveFile) => {
    if (!audioRef.current) return;

    const url = getAudioUrl(file.id);
    
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Não autenticado');
        return;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar áudio');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Limpar URL anterior
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (err) {
      setError('Erro ao carregar música');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Criar elemento de áudio
    const audio = new Audio();
    audioRef.current = audio;

    // Event listeners
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      // Avançar para próxima música
      if (currentIndex < files.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onEnded?.();
      }
    });
    audio.addEventListener('error', () => setError('Erro na reprodução'));

    // Media Session API
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (currentIndex < files.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      });
    }

    return () => {
      audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
    };
  }, [currentIndex, files.length, onEnded]);

  // Carregar nova música quando currentIndex mudar
  useEffect(() => {
    if (currentFile) {
      loadAndPlay(currentFile);
      
      // Atualizar Media Session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentFile.name,
          artist: 'DriveTune',
          album: 'Google Drive',
        });
      }
    }
  }, [currentFile, loadAndPlay]);

  const handlePlay = () => {
    audioRef.current?.play();
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="audio-player error">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="audio-player">
        <p>Nenhuma música para reproduzir</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <div className="player-info">
        <p className="track-name">{currentFile.name}</p>
        <p className="track-progress">
          {currentIndex + 1} de {files.length}
        </p>
      </div>

      <div className="player-controls">
        <button onClick={handlePrevious} disabled={currentIndex === 0}>
          ⏮
        </button>
        <button onClick={handlePause} disabled={!isPlaying}>
          ⏸
        </button>
        <button onClick={handlePlay} disabled={isPlaying}>
          ▶
        </button>
        <button onClick={handleNext} disabled={currentIndex === files.length - 1}>
          ⏭
        </button>
      </div>

      <div className="player-progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
