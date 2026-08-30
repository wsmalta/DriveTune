import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Track } from '../db';

interface FavoriteButtonProps {
  track: Track;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ track, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [track.id]);

  const checkFavorite = async () => {
    if (!track.id) return;
    
    const existing = await db.favorites
      .where('trackId')
      .equals(track.id)
      .first();
    
    setIsFavorite(!!existing);
  };

  const handleToggle = async () => {
    if (!track.id) return;

    try {
      if (isFavorite) {
        await db.favorites
          .where('trackId')
          .equals(track.id)
          .delete();
        setIsFavorite(false);
        onToggle?.(false);
      } else {
        await db.favorites.add({
          trackId: track.id,
          createdAt: new Date(),
        });
        setIsFavorite(true);
        onToggle?.(true);
      }
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
      onClick={handleToggle}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {isFavorite ? '❤️' : '🤍'}
    </button>
  );
}
