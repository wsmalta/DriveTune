import { db } from '../db';
import { extractMetadata } from '../drive';
import type { DriveFile } from '../drive';

export async function indexFolder(files: DriveFile[], folderId: string): Promise<void> {
  for (const file of files) {
    const existing = await db.tracks
      .where('driveFileId')
      .equals(file.id)
      .first();

    const meta = extractMetadata(file.name);

    if (existing) {
      await db.tracks.update(existing.id!, {
        name: meta.title || file.name,
        artist: meta.artist,
        album: meta.album,
        trackNumber: meta.trackNumber,
        folderId,
        updatedAt: new Date(),
      });
    } else {
      await db.tracks.add({
        driveFileId: file.id,
        name: meta.title || file.name,
        artist: meta.artist,
        album: meta.album,
        trackNumber: meta.trackNumber,
        folderId,
        updatedAt: new Date(),
      });
    }
  }

  await syncArtistsAndAlbums(folderId);
}

async function syncArtistsAndAlbums(folderId: string): Promise<void> {
  const tracks = await db.tracks
    .where('folderId')
    .equals(folderId)
    .toArray();

  const artistNames = new Set<string>();
  const albumKeys = new Set<string>();

  for (const track of tracks) {
    if (track.artist) artistNames.add(track.artist);
    if (track.album) {
      albumKeys.add(`${track.album}|||${track.artist || ''}`);
    }
  }

  const existingArtists = await db.artists
    .where('folderId')
    .equals(folderId)
    .toArray();
  const existingArtistMap = new Map(existingArtists.map(a => [a.name, a.id]));

  for (const name of artistNames) {
    if (!existingArtistMap.has(name)) {
      await db.artists.add({ name, folderId });
    }
  }

  const existingAlbums = await db.albums
    .where('folderId')
    .equals(folderId)
    .toArray();
  const existingAlbumMap = new Map(
    existingAlbums.map(a => [`${a.name}|||${a.artist || ''}`, a.id])
  );

  for (const key of albumKeys) {
    const [name, artist] = key.split('|||');
    if (!existingAlbumMap.has(key)) {
      await db.albums.add({ name, artist: artist || undefined, folderId });
    }
  }
}
