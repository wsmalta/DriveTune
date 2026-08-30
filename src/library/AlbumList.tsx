import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Album } from '../db';

interface AlbumListProps {
  folderId: string;
  artistName?: string;
  onAlbumSelect: (album: Album) => void;
}

export function AlbumList({ folderId, artistName, onAlbumSelect }: AlbumListProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, [folderId, artistName]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      let query = db.albums.where('folderId').equals(folderId);
      
      if (artistName) {
        query = query.filter(album => album.artist === artistName);
      }
      
      const albumsList = await query.toArray();
      setAlbums(albumsList);
    } catch (err) {
      console.error('Erro ao carregar álbuns:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="album-list">Carregando álbuns...</div>;
  }

  return (
    <div className="album-list">
      <h3>Álbuns</h3>
      {albums.length === 0 ? (
        <p>Nenhum álbum encontrado.</p>
      ) : (
        <ul>
          {albums.map((album) => (
            <li key={album.id}>
              <button
                className="album-button"
                onClick={() => onAlbumSelect(album)}
              >
                💿 {album.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
