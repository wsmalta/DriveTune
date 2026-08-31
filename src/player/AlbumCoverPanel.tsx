import { useState, useEffect, useRef } from 'react';
import { parseBlob } from 'music-metadata';
import { getAccessToken } from '../auth';
import { db } from '../db';
import type { DriveFile } from '../drive';
import { extractMetadata } from '../drive';

interface AlbumCoverPanelProps {
  file: DriveFile | null;
}

const memoryCache = new Map<string, string>();

export function AlbumCoverPanel({ file }: AlbumCoverPanelProps) {
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!file) {
      setPictureUrl(null);
      return;
    }

    const cached = memoryCache.get(file.id);
    if (cached) {
      setPictureUrl(cached);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchCover = async () => {
      try {
        const dbTrack = await db.tracks.where('driveFileId').equals(file.id).first();
        if (dbTrack?.coverUrl) {
          memoryCache.set(file.id, dbTrack.coverUrl);
          setPictureUrl(dbTrack.coverUrl);
          return;
        }

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

        if (common.picture && common.picture.length > 0) {
          const pic = common.picture[0];
          const base64 = btoa(
            new Uint8Array(pic.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const url = `data:${pic.format};base64,${base64}`;
          memoryCache.set(file.id, url);
          setPictureUrl(url);

          if (dbTrack?.id) {
            await db.tracks.update(dbTrack.id, { coverUrl: url });
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    };

    fetchCover();

    return () => {
      controller.abort();
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="album-cover-panel">
      {pictureUrl ? (
        <img src={pictureUrl} alt="Capa do álbum" className="album-cover-image" />
      ) : (
        <div className="album-cover-image album-cover-placeholder">
          {extractMetadata(file.name).artist || '?'}
        </div>
      )}
    </div>
  );
}
