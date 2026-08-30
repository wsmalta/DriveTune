import { useState, useEffect, useRef } from 'react';
import { parseBlob } from 'music-metadata';
import { getAccessToken } from '../auth';
import type { DriveFile } from '../drive';
import { extractMetadata } from '../drive';

interface TrackInfo {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  track?: { no: number | null; of: number | null };
  bitrate?: number;
  duration?: number;
  picture?: string;
  fileName: string;
}

interface TrackInfoPanelProps {
  file: DriveFile | null;
}

const metadataCache = new Map<string, TrackInfo>();

export function TrackInfoPanel({ file }: TrackInfoPanelProps) {
  const [info, setInfo] = useState<TrackInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!file) {
      setInfo(null);
      return;
    }

    const cached = metadataCache.get(file.id);
    if (cached) {
      setInfo(cached);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        if (!token) return;

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const blob = await response.blob();
        const metadata = await parseBlob(blob);

        const common = metadata.common;
        const format = metadata.format;

        let pictureUrl: string | undefined;
        if (common.picture && common.picture.length > 0) {
          const pic = common.picture[0];
          const base64 = btoa(
            new Uint8Array(pic.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          pictureUrl = `data:${pic.format};base64,${base64}`;
        }

        const filenameMeta = extractMetadata(file.name);

        const trackInfo: TrackInfo = {
          title: common.title || filenameMeta.title,
          artist: common.artist || filenameMeta.artist,
          album: common.album || filenameMeta.album,
          genre: common.genre?.[0],
          year: common.year,
          track: common.track,
          bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : undefined,
          duration: format.duration,
          picture: pictureUrl,
          fileName: file.name,
        };

        metadataCache.set(file.id, trackInfo);
        setInfo(trackInfo);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;

        const fallback = extractMetadata(file.name);
        const trackInfo: TrackInfo = {
          title: fallback.title,
          artist: fallback.artist,
          album: fallback.album,
          fileName: file.name,
        };
        setInfo(trackInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      controller.abort();
    };
  }, [file]);

  if (!file) return null;

  if (loading && !info) {
    return (
      <div className="track-info-panel">
        <div className="track-info-loading">Carregando informações...</div>
      </div>
    );
  }

  if (!info) return null;

  const formatBitrate = (bitrate?: number) => {
    if (!bitrate) return '—';
    return `${bitrate} kbps`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="track-info-panel">
      <div className="track-info-content">
        {info.picture ? (
          <img src={info.picture} alt="Capa do álbum" className="track-info-cover" />
        ) : (
          <div className="track-info-cover track-info-cover-placeholder">🎵</div>
        )}

        <div className="track-info-details">
          <div className="track-info-row">
            <span className="track-info-label">Título</span>
            <span className="track-info-value">{info.title || '—'}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Artista</span>
            <span className="track-info-value">{info.artist || '—'}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Álbum</span>
            <span className="track-info-value">{info.album || '—'}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Gênero</span>
            <span className="track-info-value">{info.genre || '—'}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Ano</span>
            <span className="track-info-value">{info.year || '—'}</span>
          </div>
          {info.track && (
            <div className="track-info-row">
              <span className="track-info-label">Faixa</span>
              <span className="track-info-value">
                {info.track.no || '—'}{info.track.of ? `/${info.track.of}` : ''}
              </span>
            </div>
          )}
          <div className="track-info-row">
            <span className="track-info-label">Qualidade</span>
            <span className="track-info-value">{formatBitrate(info.bitrate)}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Duração</span>
            <span className="track-info-value">{formatDuration(info.duration)}</span>
          </div>
          <div className="track-info-row">
            <span className="track-info-label">Arquivo</span>
            <span className="track-info-value track-info-filename">{info.fileName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
