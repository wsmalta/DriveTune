import type { Track } from '../db';

interface ArtistsGridViewProps {
  artists: { artist: string; tracks: Track[] }[];
  onArtistClick: (artist: string) => void;
}

export function ArtistsGridView({ artists, onArtistClick }: ArtistsGridViewProps) {
  return (
    <div className="artists-grid">
      {artists.map((artist, index) => (
        <button
          key={`${artist.artist}-${index}`}
          className="artist-grid-item"
          onClick={() => onArtistClick(artist.artist)}
        >
          <div className="artist-grid-cover">
            {artist.tracks[0]?.coverUrl ? (
              <img src={artist.tracks[0].coverUrl} alt={artist.artist} />
            ) : (
              <div className="artist-grid-cover-placeholder">👤</div>
            )}
          </div>
          <div className="artist-grid-info">
            <div className="artist-grid-title">{artist.artist}</div>
            <div className="artist-grid-count">{artist.tracks.length} músicas</div>
          </div>
        </button>
      ))}
    </div>
  );
}
