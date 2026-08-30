import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Track } from '../db';

interface FavoritesListProps {
  onTrackSelect: (track: Track) => void;
}

export function FavoritesList({ onTrackSelect }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      const favoriteItems = await db.favorites.toArray();
      const trackIds = favoriteItems.map(f => f.trackId);
      
      if (trackIds.length === 0) {
        setFavorites([]);
        return;
      }

      const tracks = await db.tracks
        .where('id')
        .anyOf(trackIds)
        .toArray();
      
      setFavorites(tracks);
    } catch (err) {
      console.error('Erro ao carregar favoritas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="favorites-list">Carregando favoritas...</div>;
  }

  return (
    <div className="favorites-list">
      <h3>Favoritas</h3>
      {favorites.length === 0 ? (
        <p>Nenhuma música favoritada.</p>
      ) : (
        <ul>
          {favorites.map((track) => (
            <li key={track.id}>
              <button
                className="track-button"
                onClick={() => onTrackSelect(track)}
              >
                ❤️ {track.name}
                {track.artist && <span> — {track.artist}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
