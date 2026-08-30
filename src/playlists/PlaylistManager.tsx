import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Playlist, Track } from '../db';

interface PlaylistManagerProps {
  onTrackSelect: (track: Track) => void;
}

export function PlaylistManager({ onTrackSelect }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistTracks(selectedPlaylist.id!);
    }
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const list = await db.playlists.toArray();
      setPlaylists(list);
    } catch (err) {
      console.error('Erro ao carregar playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlistId: number) => {
    try {
      const items = await db.playlistItems
        .where('playlistId')
        .equals(playlistId)
        .sortBy('position');
      
      const trackIds = items.map(item => item.trackId);
      const tracks = await db.tracks
        .where('id')
        .anyOf(trackIds)
        .toArray();
      
      // Manter a ordem da playlist
      const orderedTracks = trackIds
        .map(id => tracks.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
      
      setPlaylistTracks(orderedTracks);
    } catch (err) {
      console.error('Erro ao carregar faixas da playlist:', err);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const id = await db.playlists.add({
        name: newPlaylistName.trim(),
        createdAt: new Date(),
      });

      const newPlaylist = await db.playlists.get(id);
      if (newPlaylist) {
        setPlaylists(prev => [...prev, newPlaylist]);
        setNewPlaylistName('');
        setSelectedPlaylist(newPlaylist);
      }
    } catch (err) {
      console.error('Erro ao criar playlist:', err);
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await db.playlists.delete(playlistId);
      await db.playlistItems.where('playlistId').equals(playlistId).delete();
      
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistTracks([]);
      }
    } catch (err) {
      console.error('Erro ao excluir playlist:', err);
    }
  };

  const handleRemoveTrackFromPlaylist = async (trackId: number) => {
    if (!selectedPlaylist) return;

    try {
      await db.playlistItems
        .where({ playlistId: selectedPlaylist.id, trackId })
        .delete();
      
      loadPlaylistTracks(selectedPlaylist.id!);
    } catch (err) {
      console.error('Erro ao remover faixa:', err);
    }
  };

  if (loading) {
    return <div className="playlist-manager">Carregando playlists...</div>;
  }

  return (
    <div className="playlist-manager">
      <h3>Playlists</h3>
      
      <div className="create-playlist">
        <input
          type="text"
          placeholder="Nova playlist..."
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
        />
        <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
          Criar
        </button>
      </div>

      <div className="playlists-content">
        <div className="playlists-list">
          {playlists.length === 0 ? (
            <p>Nenhuma playlist criada.</p>
          ) : (
            <ul>
              {playlists.map((playlist) => (
                <li key={playlist.id} className={selectedPlaylist?.id === playlist.id ? 'selected' : ''}>
                  <button
                    className="playlist-button"
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    📋 {playlist.name}
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePlaylist(playlist.id!)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedPlaylist && (
          <div className="playlist-tracks">
            <h4>{selectedPlaylist.name}</h4>
            {playlistTracks.length === 0 ? (
              <p>Nenhuma faixa nesta playlist.</p>
            ) : (
              <ul>
                {playlistTracks.map((track) => (
                  <li key={track.id}>
                    <button
                      className="track-button"
                      onClick={() => onTrackSelect(track)}
                    >
                      🎵 {track.name}
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveTrackFromPlaylist(track.id!)}
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
