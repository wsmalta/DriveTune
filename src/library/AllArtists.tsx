import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Artist, Track } from '../db';
import type { DriveFile } from '../drive';
import { RenameInput } from './RenameInput';
import { fetchAndCacheCover, removeCover } from './cover';
import { ArtistsGridView } from '../components/ArtistsGridView';

interface AllArtistsProps {
  onTrackSelect: (track: DriveFile, allFiles: DriveFile[]) => void;
}

export function AllArtists({ onTrackSelect }: AllArtistsProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverLoading, setCoverLoading] = useState(false);

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    if (selectedArtist) {
      loadArtistTracks(selectedArtist);
    }
  }, [selectedArtist]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const allArtists = await db.artists.toArray();
      const unique = new Map<string, Artist>();
      for (const a of allArtists) {
        if (!unique.has(a.name)) unique.set(a.name, a);
      }
      setArtists([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Erro ao carregar artistas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistTracks = async (artistName: string) => {
    const tracks = await db.tracks.where('artist').equals(artistName).toArray();
    setArtistTracks(tracks);
  };

  const getArtistCover = (artistName: string): string | null => {
    const track = artistTracks.find(t => t.artist === artistName && t.coverUrl);
    return track?.coverUrl || null;
  };

  const handleRenameArtist = async (oldName: string, newName: string) => {
    const records = await db.artists.where('name').equals(oldName).toArray();
    for (const record of records) {
      if (record.id) await db.artists.update(record.id, { name: newName });
    }
    await db.tracks.where('artist').equals(oldName).modify({ artist: newName });
    if (selectedArtist === oldName) setSelectedArtist(newName);
    await loadArtists();
  };

  const handleFetchCovers = async () => {
    setCoverLoading(true);
    for (const track of artistTracks) {
      if (!track.coverUrl && track.driveFileId) {
        try {
          await fetchAndCacheCover(track);
        } catch {
          // ignore
        }
      }
    }
    if (selectedArtist) await loadArtistTracks(selectedArtist);
    setCoverLoading(false);
  };

  const handleRemoveCovers = async () => {
    if (!window.confirm('Remover todas as capas deste artista?')) return;
    for (const track of artistTracks) {
      if (track.id && track.coverUrl) {
        await removeCover(track.id);
      }
    }
    if (selectedArtist) await loadArtistTracks(selectedArtist);
  };

  const handleTrackClick = (track: Track) => {
    const driveFile: DriveFile = {
      id: track.driveFileId,
      name: track.name,
      mimeType: 'audio/mpeg',
    };
    const allFiles: DriveFile[] = artistTracks.map(t => ({
      id: t.driveFileId,
      name: t.name,
      mimeType: 'audio/mpeg',
    }));
    onTrackSelect(driveFile, allFiles);
  };

  if (loading) {
    return <div className="library"><p>Carregando artistas...</p></div>;
  }

  if (selectedArtist) {
    const cover = getArtistCover(selectedArtist);
    const hasCovers = artistTracks.some(t => t.coverUrl);

    return (
      <div className="library">
        <div className="library-nav">
          <button className="back-button" onClick={() => { setSelectedArtist(null); setArtistTracks([]); }}>
            ← Voltar
          </button>
          <div className="library-nav-info">
            {cover ? (
              <img src={cover} alt="" className="library-cover-thumb" />
            ) : (
              <div className="library-cover-thumb library-cover-placeholder">🎤</div>
            )}
            <h3>
              <RenameInput value={selectedArtist} onSave={(v) => handleRenameArtist(selectedArtist, v)} />
            </h3>
          </div>
          <span className="track-count">{artistTracks.length} música(s)</span>
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
          {artistTracks.map((track) => (
            <li key={track.id} className="track-list-item">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt="" className="track-list-cover" />
              ) : (
                <div className="track-list-cover track-list-cover-placeholder">🎵</div>
              )}
              <button className="track-button" onClick={() => handleTrackClick(track)}>
                {track.name}
                {track.album && <span className="track-album"> — {track.album}</span>}
              </button>
            </li>
          ))}
        </ul>
        {artistTracks.length === 0 && <p>Nenhuma música encontrada.</p>}
      </div>
    );
  }

  const handleArtistClick = (artistName: string) => {
    setSelectedArtist(artistName);
  };

  const artistsWithTracks = artists.map(artist => ({
    artist: artist.name,
    tracks: [] as Track[],
  }));

  return (
    <div className="library">
      <h3>Artistas</h3>
      {artists.length === 0 ? (
        <p>Nenhum artista indexado. Navegue por pastas para indexar.</p>
      ) : (
        <ArtistsGridView artists={artistsWithTracks} onArtistClick={handleArtistClick} />
      )}
    </div>
  );
}
