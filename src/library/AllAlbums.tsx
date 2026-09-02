import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Album, Track } from '../db';
import type { DriveFile } from '../drive';
import { RenameInput } from './RenameInput';
import { fetchAndCacheCover, removeCover } from './cover';
import { AlbumsGridView } from '../components/AlbumsGridView';

interface AllAlbumsProps {
  onTrackSelect: (track: DriveFile, allFiles: DriveFile[]) => void;
}

export function AllAlbums({ onTrackSelect }: AllAlbumsProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverLoading, setCoverLoading] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      loadAlbumTracks(selectedAlbum);
    }
  }, [selectedAlbum]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const allAlbums = await db.albums.toArray();
      const unique = new Map<string, Album>();
      for (const a of allAlbums) {
        const key = `${a.name}|||${a.artist || ''}`;
        if (!unique.has(key)) unique.set(key, a);
      }
      setAlbums([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Erro ao carregar álbuns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumTracks = async (album: Album) => {
    const tracks = await db.tracks
      .where('album')
      .equals(album.name)
      .toArray();
    const filtered = album.artist
      ? tracks.filter(t => t.artist === album.artist)
      : tracks;
    setAlbumTracks(filtered.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)));
  };

  const getAlbumCover = (albumName: string, artistName?: string): string | null => {
    const track = albumTracks.find(t =>
      t.album === albumName && (!artistName || t.artist === artistName) && t.coverUrl
    );
    return track?.coverUrl || null;
  };

  const handleRenameAlbum = async (oldName: string, newName: string) => {
    const records = await db.albums.where('name').equals(oldName).toArray();
    for (const record of records) {
      if (record.id) await db.albums.update(record.id, { name: newName });
    }
    await db.tracks.where('album').equals(oldName).modify({ album: newName });
    if (selectedAlbum?.name === oldName) {
      setSelectedAlbum({ ...selectedAlbum, name: newName });
    }
    await loadAlbums();
  };

  const handleFetchCovers = async () => {
    setCoverLoading(true);
    for (const track of albumTracks) {
      if (!track.coverUrl && track.driveFileId) {
        try {
          await fetchAndCacheCover(track);
        } catch {
          // ignore
        }
      }
    }
    if (selectedAlbum) await loadAlbumTracks(selectedAlbum);
    setCoverLoading(false);
  };

  const handleRemoveCovers = async () => {
    if (!window.confirm('Remover todas as capas deste álbum?')) return;
    for (const track of albumTracks) {
      if (track.id && track.coverUrl) {
        await removeCover(track.id);
      }
    }
    if (selectedAlbum) await loadAlbumTracks(selectedAlbum);
  };

  const handleTrackClick = (track: Track) => {
    const driveFile: DriveFile = {
      id: track.driveFileId,
      name: track.name,
      mimeType: 'audio/mpeg',
    };
    const allFiles: DriveFile[] = albumTracks.map(t => ({
      id: t.driveFileId,
      name: t.name,
      mimeType: 'audio/mpeg',
    }));
    onTrackSelect(driveFile, allFiles);
  };

  if (loading) {
    return <div className="library"><p>Carregando álbuns...</p></div>;
  }

  if (selectedAlbum) {
    const cover = getAlbumCover(selectedAlbum.name, selectedAlbum.artist);
    const hasCovers = albumTracks.some(t => t.coverUrl);

    return (
      <div className="library">
        <div className="library-nav">
          <button className="back-button" onClick={() => { setSelectedAlbum(null); setAlbumTracks([]); }}>
            ← Voltar
          </button>
          <div className="library-nav-info">
            {cover ? (
              <img src={cover} alt="" className="library-cover-thumb" />
            ) : (
              <div className="library-cover-thumb library-cover-placeholder">💿</div>
            )}
            <div>
              <h3>
                <RenameInput value={selectedAlbum.name} onSave={(v) => handleRenameAlbum(selectedAlbum.name, v)} />
              </h3>
              {selectedAlbum.artist && <p className="text-secondary">{selectedAlbum.artist}</p>}
            </div>
          </div>
          <span className="track-count">{albumTracks.length} música(s)</span>
          <div className="library-nav-actions">
            <button className="cover-btn" onClick={handleFetchCovers} disabled={coverLoading}>
              {coverLoading ? '...' : '⬇ Baixar capas'}
            </button>
            {hasCovers && (
              <button className="cover-btn cover-btn-remove" onClick={handleRemoveCovers}>
                ✕ Remover capas
              </button>
            )}
          </div>
        </div>
        <ul className="track-list">
          {albumTracks.map((track) => (
            <li key={track.id} className="track-list-item">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt="" className="track-list-cover" />
              ) : (
                <div className="track-list-cover track-list-cover-placeholder">🎵</div>
              )}
              <button className="track-button" onClick={() => handleTrackClick(track)}>
                {track.trackNumber && <span className="track-number">{track.trackNumber}. </span>}
                {track.name}
              </button>
            </li>
          ))}
        </ul>
        {albumTracks.length === 0 && <p>Nenhuma música encontrada.</p>}
      </div>
    );
  }

  const handleAlbumClick = (albumName: string, artistName: string) => {
    const album = albums.find(a => a.name === albumName && a.artist === artistName);
    if (album) {
      setSelectedAlbum(album);
    }
  };

  const albumsWithTracks = albums.map(album => ({
    album: album.name,
    artist: album.artist || 'Desconhecido',
    tracks: [] as Track[],
  }));

  return (
    <div className="library">
      <h3>Álbuns</h3>
      {albums.length === 0 ? (
        <p>Nenhum álbum indexado. Navegue por pastas para indexar.</p>
      ) : (
        <AlbumsGridView albums={albumsWithTracks} onAlbumClick={handleAlbumClick} />
      )}
    </div>
  );
}
