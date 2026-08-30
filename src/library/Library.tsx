import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Track } from '../db';

interface LibraryProps {
  folderId: string;
  onTrackSelect: (track: Track) => void;
}

export function Library({ folderId, onTrackSelect }: LibraryProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, [folderId]);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const tracksList = await db.tracks
        .where('folderId')
        .equals(folderId)
        .toArray();
      setTracks(tracksList);
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="library">Carregando biblioteca...</div>;
  }

  return (
    <div className="library">
      <h3>Biblioteca</h3>
      {tracks.length === 0 ? (
        <p>Nenhuma música indexada nesta pasta.</p>
      ) : (
        <ul className="track-list">
          {tracks.map((track) => (
            <li key={track.id}>
              <button
                className="track-button"
                onClick={() => onTrackSelect(track)}
              >
                🎵 {track.name}
                {track.artist && <span className="track-artist"> — {track.artist}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
