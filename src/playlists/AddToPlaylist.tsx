import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Playlist, Track } from '../db';

interface AddToPlaylistProps {
  track: Track;
  onAdded?: () => void;
}

export function AddToPlaylist({ track, onAdded }: AddToPlaylistProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

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

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      // Verificar se a música já está na playlist
      const existing = await db.playlistItems
        .where({ playlistId, trackId: track.id })
        .first();

      if (existing) {
        alert('Esta música já está na playlist!');
        return;
      }

      // Obter posição atual
      const count = await db.playlistItems
        .where('playlistId')
        .equals(playlistId)
        .count();

      await db.playlistItems.add({
        playlistId,
        trackId: track.id!,
        position: count,
      });

      setIsOpen(false);
      onAdded?.();
    } catch (err) {
      console.error('Erro ao adicionar à playlist:', err);
    }
  };

  return (
    <div className="add-to-playlist">
      <button
        className="add-to-playlist-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        📋 Adicionar à playlist
      </button>

      {isOpen && (
        <div className="playlists-dropdown">
          {loading ? (
            <p>Carregando...</p>
          ) : playlists.length === 0 ? (
            <p>Nenhuma playlist criada.</p>
          ) : (
            <ul>
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button onClick={() => handleAddToPlaylist(playlist.id!)}>
                    {playlist.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
