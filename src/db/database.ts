import Dexie, { type Table } from 'dexie';

export interface Track {
  id?: number;
  driveFileId: string;
  name: string;
  artist?: string;
  album?: string;
  trackNumber?: number;
  genre?: string;
  year?: number;
  bitrate?: number;
  duration?: number;
  coverUrl?: string;
  folderId: string;
  updatedAt: Date;
}

export interface Album {
  id?: number;
  name: string;
  artist?: string;
  folderId: string;
}

export interface Artist {
  id?: number;
  name: string;
  folderId: string;
}

export interface Playlist {
  id?: number;
  name: string;
  createdAt: Date;
}

export interface PlaylistItem {
  id?: number;
  playlistId: number;
  trackId: number;
  position: number;
}

export interface Favorite {
  id?: number;
  trackId: number;
  createdAt: Date;
}

export interface PlaybackState {
  id?: number;
  currentTrackId?: number;
  position: number;
  queue: number[];
  currentIndex: number;
  updatedAt: Date;
}

class DriveTuneDB extends Dexie {
  tracks!: Table<Track>;
  albums!: Table<Album>;
  artists!: Table<Artist>;
  playlists!: Table<Playlist>;
  playlistItems!: Table<PlaylistItem>;
  favorites!: Table<Favorite>;
  playbackState!: Table<PlaybackState>;

  constructor() {
    super('DriveTuneDB');
    this.version(1).stores({
      tracks: '++id, driveFileId, folderId, artist, album',
      albums: '++id, name, artist, folderId',
      artists: '++id, name, folderId',
      playlists: '++id, name',
      playlistItems: '++id, playlistId, trackId',
      favorites: '++id, trackId',
      playbackState: '++id',
    });
    this.version(2).stores({
      tracks: '++id, driveFileId, folderId, artist, album, genre, year',
    });
    this.version(3).stores({
      tracks: '++id, driveFileId, folderId, artist, album, genre, year',
    });
  }
}

export const db = new DriveTuneDB();
