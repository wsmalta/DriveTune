import { db } from '../db';
import type { HistoryEntry } from '../db';

export async function recordPlayback(trackId: number, duration?: number): Promise<void> {
  await db.history.add({
    trackId,
    playedAt: new Date(),
    duration,
  });
}

export async function getRecentHistory(limit = 50): Promise<(HistoryEntry & { trackName?: string; artist?: string; album?: string })[]> {
  const entries = await db.history
    .orderBy('playedAt')
    .reverse()
    .limit(limit)
    .toArray();

  const enriched = await Promise.all(
    entries.map(async (entry) => {
      const track = await db.tracks.get(entry.trackId);
      return {
        ...entry,
        trackName: track?.name,
        artist: track?.artist,
        album: track?.album,
      };
    })
  );

  return enriched;
}

export async function clearHistory(): Promise<void> {
  await db.history.clear();
}

export async function getTrackPlayCount(trackId: number): Promise<number> {
  return db.history.where('trackId').equals(trackId).count();
}
