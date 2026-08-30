import { parseBlob } from 'music-metadata';
import { getAccessToken } from '../auth';
import { db } from '../db';
import type { Track } from '../db';

function pictureToDataUrl(picture: { format: string; data: Uint8Array }): string {
  const base64 = btoa(
    new Uint8Array(picture.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return `data:${picture.format};base64,${base64}`;
}

export async function extractCoverFromDrive(driveFileId: string): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return null;

  const blob = await response.blob();
  const metadata = await parseBlob(blob);

  if (metadata.common.picture && metadata.common.picture.length > 0) {
    return pictureToDataUrl(metadata.common.picture[0]);
  }

  return null;
}

export async function fetchAndCacheCover(track: Track): Promise<string | null> {
  if (!track.driveFileId || !track.id) return null;

  const existing = await db.tracks.where('id').equals(track.id).first();
  if (existing?.coverUrl) return existing.coverUrl;

  try {
    const coverUrl = await extractCoverFromDrive(track.driveFileId);
    if (coverUrl) {
      await db.tracks.update(track.id, { coverUrl });
    }
    return coverUrl;
  } catch {
    return null;
  }
}

export async function removeCover(trackId: number): Promise<void> {
  await db.tracks.update(trackId, { coverUrl: undefined });
}

export async function removeCovers(trackIds: number[]): Promise<void> {
  await Promise.all(trackIds.map(id => db.tracks.update(id, { coverUrl: undefined })));
}

export interface CoverProgress {
  total: number;
  done: number;
  current: string;
}

export async function fetchAllCovers(
  tracks: Track[],
  onProgress?: (progress: CoverProgress) => void
): Promise<void> {
  const uncovered = tracks.filter(t => !t.coverUrl && t.driveFileId);

  for (let i = 0; i < uncovered.length; i++) {
    const track = uncovered[i];
    onProgress?.({ total: uncovered.length, done: i, current: track.name });
    try {
      await fetchAndCacheCover(track);
    } catch {
      // ignore errors for individual tracks
    }
  }

  onProgress?.({ total: uncovered.length, done: uncovered.length, current: '' });
}
