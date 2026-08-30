import { db } from '../db';

export async function exportData(): Promise<void> {
  const tracks = await db.tracks.toArray();
  const artists = await db.artists.toArray();
  const albums = await db.albums.toArray();
  const playlists = await db.playlists.toArray();
  const playlistItems = await db.playlistItems.toArray();
  const favorites = await db.favorites.toArray();

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tracks,
    artists,
    albums,
    playlists,
    playlistItems,
    favorites,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `drivetune-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<{ imported: number; skipped: number }> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data.tracks || !Array.isArray(data.tracks)) {
    throw new Error('Arquivo inválido');
  }

  let imported = 0;
  let skipped = 0;

  for (const track of data.tracks) {
    const existing = await db.tracks
      .where('driveFileId')
      .equals(track.driveFileId)
      .first();

    if (existing) {
      const hasChanges =
        existing.name !== track.name ||
        existing.artist !== track.artist ||
        existing.album !== track.album ||
        existing.genre !== track.genre ||
        existing.year !== track.year ||
        existing.coverUrl !== track.coverUrl;

      if (hasChanges) {
        await db.tracks.update(existing.id!, {
          name: track.name,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          year: track.year,
          trackNumber: track.trackNumber,
          coverUrl: track.coverUrl,
        });
        imported++;
      } else {
        skipped++;
      }
    } else {
      await db.tracks.add({
        driveFileId: track.driveFileId,
        name: track.name,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        year: track.year,
        trackNumber: track.trackNumber,
        bitrate: track.bitrate,
        duration: track.duration,
        coverUrl: track.coverUrl,
        folderId: track.folderId,
        updatedAt: new Date(track.updatedAt),
      });
      imported++;
    }
  }

  return { imported, skipped };
}
