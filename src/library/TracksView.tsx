import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import type { Track } from '../db';
import type { DriveFile } from '../drive';
import { TrackEditModal } from './TrackEditModal';
import { fetchAllCovers, removeCovers, type CoverProgress } from './cover';

interface TracksViewProps {
  onTrackSelect: (track: DriveFile, allFiles: DriveFile[]) => void;
}

export function TracksView({ onTrackSelect }: TracksViewProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'artist' | 'album' | 'year'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [coverProgress, setCoverProgress] = useState<CoverProgress | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const allTracks = await db.tracks.toArray();
      setTracks(allTracks);
    } catch (err) {
      console.error('Erro ao carregar músicas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = tracks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q) ||
        t.album?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'artist') cmp = (a.artist || '').localeCompare(b.artist || '');
      else if (sortField === 'album') cmp = (a.album || '').localeCompare(b.album || '');
      else if (sortField === 'year') cmp = (a.year || 0) - (b.year || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [tracks, search, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field: typeof sortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const handleSaveTrack = async (updates: Partial<Track>) => {
    if (!editingTrack?.id) return;
    await db.tracks.update(editingTrack.id, updates);
    await loadTracks();
  };

  const handleFetchAllCovers = async () => {
    setCoverLoading(true);
    await fetchAllCovers(tracks, setCoverProgress);
    await loadTracks();
    setCoverLoading(false);
    setCoverProgress(null);
  };

  const handleRemoveAllCovers = async () => {
    if (!window.confirm('Remover todas as capas?')) return;
    const ids = tracks.filter(t => t.coverUrl && t.id).map(t => t.id!) as number[];
    await removeCovers(ids);
    await loadTracks();
  };

  const handleTrackClick = (track: Track) => {
    const driveFile: DriveFile = {
      id: track.driveFileId,
      name: track.name,
      mimeType: 'audio/mpeg',
    };
    const allFiles: DriveFile[] = filtered.map(t => ({
      id: t.driveFileId,
      name: t.name,
      mimeType: 'audio/mpeg',
    }));
    onTrackSelect(driveFile, allFiles);
  };

  if (loading) {
    return <div className="tracks-view"><p>Carregando...</p></div>;
  }

  const coveredCount = tracks.filter(t => t.coverUrl).length;

  return (
    <div className="tracks-view">
      <div className="tracks-header">
        <h3>Músicas</h3>
        <span className="tracks-count">{filtered.length} música(s)</span>
        <div className="tracks-cover-actions">
          <button
            className="cover-btn"
            onClick={handleFetchAllCovers}
            disabled={coverLoading}
          >
            {coverLoading
              ? coverProgress
                ? `${coverProgress.done}/${coverProgress.total}`
                : '...'
              : `⬇ Baixar capas (${coveredCount}/${tracks.length})`
            }
          </button>
          {coveredCount > 0 && !coverLoading && (
            <button className="cover-btn cover-btn-remove" onClick={handleRemoveAllCovers}>
              ✕ Remover todas
            </button>
          )}
        </div>
      </div>

      <div className="tracks-search">
        <input
          type="text"
          placeholder="Buscar música, artista ou álbum..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className="tracks-table-wrapper">
        <table className="file-table tracks-table">
          <thead>
            <tr>
              <th className="col-icon"></th>
              <th className="col-icon">#</th>
              <th onClick={() => handleSort('name')}>Título{sortIcon('name')}</th>
              <th onClick={() => handleSort('artist')}>Artista{sortIcon('artist')}</th>
              <th onClick={() => handleSort('album')}>Álbum{sortIcon('album')}</th>
              <th onClick={() => handleSort('year')}>Ano{sortIcon('year')}</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((track, idx) => (
              <tr key={track.id} className="file-row">
                <td className="col-icon">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="track-table-cover" />
                  ) : (
                    <span className="track-table-cover-placeholder">🎵</span>
                  )}
                </td>
                <td className="col-icon" onClick={() => handleTrackClick(track)}>{idx + 1}</td>
                <td onClick={() => handleTrackClick(track)}>{track.name}</td>
                <td onClick={() => handleTrackClick(track)}>{track.artist || '—'}</td>
                <td onClick={() => handleTrackClick(track)}>{track.album || '—'}</td>
                <td onClick={() => handleTrackClick(track)}>{track.year || '—'}</td>
                <td className="col-actions">
                  <button
                    className="track-edit-btn"
                    title="Editar"
                    onClick={() => setEditingTrack(track)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M15 3l6 6-12 12H3v-6L15 3z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="main-panel-empty">
          {tracks.length === 0
            ? 'Nenhuma música indexada. Navegue por pastas para indexar.'
            : 'Nenhum resultado encontrado.'}
        </p>
      )}

      {editingTrack && (
        <TrackEditModal
          track={editingTrack}
          onSave={handleSaveTrack}
          onClose={() => setEditingTrack(null)}
        />
      )}
    </div>
  );
}
