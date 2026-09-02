import type { Track } from '../db';

interface AlbumsGridViewProps {
  albums: { album: string; artist: string; tracks: Track[] }[];
  onAlbumClick: (album: string, artist: string) => void;
}

export function AlbumsGridView({ albums, onAlbumClick }: AlbumsGridViewProps) {
  return (
    <div className="albums-grid">
      {albums.map((album, index) => (
        <button
          key={`${album.artist}-${album.album}-${index}`}
          className="album-grid-item"
          onClick={() => onAlbumClick(album.album, album.artist)}
        >
          <div className="album-grid-cover">
            {album.tracks[0]?.coverUrl ? (
              <img src={album.tracks[0].coverUrl} alt={album.album} />
            ) : (
              <div className="album-grid-cover-placeholder">💿</div>
            )}
          </div>
          <div className="album-grid-info">
            <div className="album-grid-title">{album.album}</div>
            <div className="album-grid-artist">{album.artist}</div>
            <div className="album-grid-count">{album.tracks.length} músicas</div>
          </div>
        </button>
      ))}
    </div>
  );
}
