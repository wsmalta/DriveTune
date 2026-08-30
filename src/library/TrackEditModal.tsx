import { useState, useRef, useEffect } from 'react';
import type { Track } from '../db';

interface TrackEditModalProps {
  track: Track;
  onSave: (updates: Partial<Track>) => void;
  onClose: () => void;
}

export function TrackEditModal({ track, onSave, onClose }: TrackEditModalProps) {
  const [name, setName] = useState(track.name);
  const [artist, setArtist] = useState(track.artist || '');
  const [album, setAlbum] = useState(track.album || '');
  const [genre, setGenre] = useState(track.genre || '');
  const [year, setYear] = useState(track.year?.toString() || '');
  const [trackNumber, setTrackNumber] = useState(track.trackNumber?.toString() || '');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = () => {
    onSave({
      name: name.trim() || track.name,
      artist: artist.trim() || undefined,
      album: album.trim() || undefined,
      genre: genre.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
      trackNumber: trackNumber ? parseInt(trackNumber, 10) : undefined,
    });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Editar Música</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Título</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Artista</label>
            <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Álbum</label>
            <input type="text" value={album} onChange={(e) => setAlbum(e.target.value)} />
          </div>
          <div className="modal-field">
            <label>Gênero</label>
            <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>Ano</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Faixa</label>
              <input type="number" value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} />
            </div>
          </div>
          <div className="modal-field">
            <label>Arquivo</label>
            <input type="text" value={track.driveFileId} disabled className="modal-readonly" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="modal-btn-save" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
