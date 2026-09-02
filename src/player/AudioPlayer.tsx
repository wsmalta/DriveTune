import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getAudioUrl, extractMetadata } from '../drive';
import { getAccessToken } from '../auth';
import { db } from '../db';
import { recordPlayback } from '../library';
import { savePlaybackState, loadPlaybackState } from './playbackState';
import { Equalizer } from './Equalizer';
import type { DriveFile } from '../drive';

type RepeatMode = 'none' | 'all' | 'one';

const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];
const EQ_Q = [1.2, 1.0, 1.0, 1.0, 0.7];

interface AudioPlayerProps {
  files: DriveFile[];
  initialIndex?: number;
  onEnded?: () => void;
}

export interface AudioPlayerHandle {
  audioElement: HTMLAudioElement | null;
  analyser: AnalyserNode | null;
}

export const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ files, initialIndex = 0, onEnded }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const stateRestoredRef = useRef(false);

  useImperativeHandle(ref, () => ({
    get audioElement() { return audioRef.current; },
    get analyser() { return analyserRef.current; },
  }), []);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const prevFilesRef = useRef(files);
  const onEndedRef = useRef(onEnded);
  const repeatModeRef = useRef(repeatMode);
  const userSelectedRef = useRef(initialIndex != null);
  const shuffleRef = useRef(shuffle);
  const shuffledIndicesRef = useRef(shuffledIndices);
  const filesLengthRef = useRef(files.length);
  const handleNextRef = useRef<() => void>(() => {});
  const handlePreviousRef = useRef<() => void>(() => {});

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices; }, [shuffledIndices]);
  useEffect(() => { filesLengthRef.current = files.length; }, [files.length]);

  useEffect(() => {
    if (prevFilesRef.current !== files) {
      prevFilesRef.current = files;
      if (files.length > 0) {
        const safeIndex = initialIndex != null && initialIndex < files.length ? initialIndex : 0;
        setCurrentIndex(safeIndex);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        userSelectedRef.current = true;
      }
    }
  }, [files, initialIndex]);

  useEffect(() => {
    if (files.length > 0 && initialIndex != null && initialIndex < files.length && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
      setCurrentTime(0);
      setDuration(0);
      userSelectedRef.current = true;
    }
  }, [initialIndex, files.length]);

  const currentFile = files[currentIndex];

  // Gerar índices embaralhados
  const generateShuffledIndices = useCallback(() => {
    const indices = files.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [files.length]);

  useEffect(() => {
    if (shuffle) {
      setShuffledIndices(generateShuffledIndices());
    }
  }, [shuffle, generateShuffledIndices]);

  // Salvar estado de reprodução quando mudar
  useEffect(() => {
    if (files.length > 0 && currentIndex >= 0) {
      const track = files[currentIndex];
      if (track) {
        db.tracks.where('driveFileId').equals(track.id).first().then(dbTrack => {
          if (dbTrack?.id) {
            // Buscar IDs do banco para todos os arquivos na fila
            const fileIds = files.map(f => f.id);
            db.tracks.where('driveFileId').anyOf(fileIds).toArray().then(dbTracks => {
              const queueIds = dbTracks.map(t => t.id).filter((id): id is number => id !== undefined);
              savePlaybackState({
                currentTrackId: dbTrack.id,
                position: currentTime,
                queue: queueIds,
                currentIndex,
              });
            });
          }
        });
      }
    }
  }, [currentIndex, currentTime, files]);

  const loadAndPlay = useCallback(async (file: DriveFile) => {
    if (!audioRef.current) return;

    // Retomar AudioContext se suspenso (requer interação do usuário)
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }

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
      
      const oldSrc = audioRef.current.src;
      audioRef.current.src = audioUrl;
      audioRef.current.play();

      if (oldSrc) {
        URL.revokeObjectURL(oldSrc);
      }
    } catch (err) {
      setError('Erro ao carregar música');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // Criar elemento de áudio
    const audio = new Audio();
    audioRef.current = audio;

    // Criar pipeline de áudio compartilhado
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaElementSource(audio);
      sourceRef.current = source;

      const filters: BiquadFilterNode[] = [];
      let prevNode: AudioNode = source;

      EQ_FREQUENCIES.forEach((freq, i) => {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = EQ_Q[i];
        filter.gain.value = 0;
        prevNode.connect(filter);
        prevNode = filter;
        filters.push(filter);
      });
      filtersRef.current = filters;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      prevNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;

      // Restaurar EQ salvo
      db.eqSettings.toCollection().first().then(saved => {
        if (saved) {
          setEqEnabled(saved.enabled);
          filters.forEach((f, i) => {
            f.gain.value = saved.enabled && saved.bands[i] ? saved.bands[i].gain : 0;
          });
        }
      }).catch(() => {});
    } catch {
      // AudioContext não suportado
    }

    // Restaurar estado de reprodução (apenas no mount inicial)
    if (!stateRestoredRef.current) {
      stateRestoredRef.current = true;
      loadPlaybackState().then(savedState => {
        if (savedState && files.length > 0 && !userSelectedRef.current) {
          db.tracks.get(savedState.currentTrackId).then(savedTrack => {
            if (savedTrack) {
              const trackIndex = files.findIndex(f => f.id === savedTrack.driveFileId);
              if (trackIndex >= 0) {
                setCurrentIndex(trackIndex);
              }
            }
          });
        }
      });
    }

    // Event listeners
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      if (currentFile?.mimeType?.startsWith('video/')) {
        loadPlaybackState().then(savedState => {
          if (savedState && audio.duration > 0) {
            audio.currentTime = Math.min(savedState.position, audio.duration);
          }
        });
      }
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      
      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatModeRef.current === 'all' || currentIndex < filesLengthRef.current - 1) {
        handleNextRef.current();
      } else {
        onEndedRef.current?.();
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
        handlePreviousRef.current();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextRef.current();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && audio) {
          audio.currentTime = details.seekTime;
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (audio) {
          audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (audio) {
          audio.currentTime = Math.min(audio.currentTime + skipTime, audio.duration || 0);
        }
      });
    }

    return () => {
      audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      sourceRef.current?.disconnect();
      filtersRef.current.forEach(f => f.disconnect());
      analyserRef.current?.disconnect();
      audioCtxRef.current?.close();
    };
  }, [currentIndex, files.length]);

  // Carregar nova música quando currentIndex mudar
  useEffect(() => {
    setError(null);
    if (currentFile) {
      loadAndPlay(currentFile);
      
      // Registrar no histórico
      db.tracks.where('driveFileId').equals(currentFile.id).first().then(dbTrack => {
        if (dbTrack?.id) {
          recordPlayback(dbTrack.id).catch(err => 
            console.error('Erro ao registrar histórico:', err)
          );
        }
      });
      
      // Atualizar Media Session com metadados reais
      if ('mediaSession' in navigator) {
        const meta = extractMetadata(currentFile.name);
        
        // Buscar capa do álbum no IndexedDB
        db.tracks.where('driveFileId').equals(currentFile.id).first().then(dbTrack => {
          const artwork: MediaImage[] = [];
          if (dbTrack?.coverUrl) {
            artwork.push({ src: dbTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' });
          }
          
          navigator.mediaSession.metadata = new MediaMetadata({
            title: meta.title || currentFile.name,
            artist: meta.artist || 'Desconhecido',
            album: meta.album || 'DriveTune',
            artwork,
          });
        }).catch(() => {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: meta.title || currentFile.name,
            artist: meta.artist || 'Desconhecido',
            album: meta.album || 'DriveTune',
          });
        });
      }
    }
  }, [currentFile, loadAndPlay]);

  // Atualizar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlay = () => {
    audioRef.current?.play();
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (repeatModeRef.current === 'all') {
      setCurrentIndex(filesLengthRef.current - 1);
    }
  };

  const handleNext = () => {
    if (shuffleRef.current && shuffledIndicesRef.current.length > 0) {
      const currentShufflePos = shuffledIndicesRef.current.indexOf(currentIndex);
      const nextShufflePos = (currentShufflePos + 1) % shuffledIndicesRef.current.length;
      setCurrentIndex(shuffledIndicesRef.current[nextShufflePos]);
    } else if (currentIndex < filesLengthRef.current - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (repeatModeRef.current === 'all') {
      setCurrentIndex(0);
    }
  };

  handleNextRef.current = handleNext;
  handlePreviousRef.current = handlePrevious;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleShuffle = () => {
    setShuffle(!shuffle);
  };

  const handleToggleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentFile) {
    return (
      <div className="audio-player">
        <p>Nenhuma música para reproduzir</p>
      </div>
    );
  }

  const handleRetry = () => {
    setError(null);
    if (currentFile) loadAndPlay(currentFile);
  };

  return (
    <div className="audio-player">
      {error && (
        <div className="player-error">
          <span>{error}</span>
          <button className="player-retry-btn" onClick={handleRetry} title="Tentar novamente">
            ↻
          </button>
          <button className="player-dismiss-btn" onClick={() => setError(null)} title="Dispensar">
            ✕
          </button>
        </div>
      )}
      <div className="player-info">
        <p className="track-name">{currentFile.name}</p>
        <p className="track-progress">
          {currentIndex + 1} de {files.length}
        </p>
      </div>

      <div className="player-controls">
        <button 
          onClick={handleToggleShuffle} 
          className={shuffle ? 'active' : ''}
          title="Aleatório"
        >
          🔀
        </button>
        <button onClick={handlePrevious} title="Anterior">
          ⏮
        </button>
        <button onClick={handlePause} disabled={!isPlaying} title="Pausar">
          ⏸
        </button>
        <button onClick={handlePlay} disabled={isPlaying} title="Tocar">
          ▶
        </button>
        <button onClick={handleNext} title="Próxima">
          ⏭
        </button>
        <button 
          onClick={handleToggleRepeat} 
          className={repeatMode !== 'none' ? 'active' : ''}
          title={`Repetir: ${repeatMode === 'none' ? 'desligado' : repeatMode === 'all' ? 'fila' : 'música'}`}
        >
          {repeatMode === 'one' ? '🔂' : '🔁'}
        </button>
        <button 
          onClick={() => setShowEq(!showEq)}
          className={eqEnabled ? 'active' : ''}
          title="Equalizer"
        >
          🎛️
        </button>
      </div>

      {showEq && filtersRef.current.length > 0 && (
        <Equalizer
          filters={filtersRef.current}
          onToggle={setEqEnabled}
          isEnabled={eqEnabled}
        />
      )}

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

      <div className="player-volume">
        <button onClick={handleToggleMute} title={isMuted ? 'Desmutar' : 'Mutar'}>
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
});
