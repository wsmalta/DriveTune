import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Artist } from '../db';

interface ArtistListProps {
  folderId: string;
  onArtistSelect: (artist: Artist) => void;
}

export function ArtistList({ folderId, onArtistSelect }: ArtistListProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtists();
  }, [folderId]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      const artistsList = await db.artists
        .where('folderId')
        .equals(folderId)
        .toArray();
      setArtists(artistsList);
    } catch (err) {
      console.error('Erro ao carregar artistas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="artist-list">Carregando artistas...</div>;
  }

  return (
    <div className="artist-list">
      <h3>Artistas</h3>
      {artists.length === 0 ? (
        <p>Nenhum artista encontrado.</p>
      ) : (
        <ul>
          {artists.map((artist) => (
            <li key={artist.id}>
              <button
                className="artist-button"
                onClick={() => onArtistSelect(artist)}
              >
                🎤 {artist.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
