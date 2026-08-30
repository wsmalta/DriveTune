import { useState, useEffect } from 'react';
import { db } from '../db';
import { extractMetadata } from '../drive';
import type { Track } from '../db';
import type { DriveFile } from '../drive';

interface SearchProps {
  folderId: string;
  files: DriveFile[];
  onTrackSelect: (track: Track) => void;
}

export function Search({ folderId, files, onTrackSelect }: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'artist' | 'album' | 'title'>('all');

  useEffect(() => {
    if (query.trim().length >= 2) {
      handleSearch(query);
    } else {
      setResults([]);
    }
  }, [query, filterType, files]);

  const handleSearch = async (value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const searchTerm = value.toLowerCase();
      
      // Buscar tracks do banco (global, não por pasta)
      const tracks = await db.tracks.toArray();
      
      let tracksToSearch = tracks;
      
      if (tracksToSearch.length === 0 && files.length > 0) {
        // Criar tracks temporárias dos arquivos
        tracksToSearch = files.map(file => {
          const metadata = extractMetadata(file.name);
          return {
            id: 0,
            driveFileId: file.id,
            name: metadata.title || file.name,
            artist: metadata.artist,
            album: metadata.album,
            trackNumber: metadata.trackNumber,
            folderId,
            updatedAt: new Date(),
          };
        });
      }
      
      // Filtrar baseado no tipo de busca
      const filtered = tracksToSearch.filter(track => {
        const searchIn = getSearchFields(track, filterType);
        return searchIn.some(field => 
          field?.toLowerCase().includes(searchTerm)
        );
      });
      
      setResults(filtered.slice(0, 50));
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setSearching(false);
    }
  };

  const getSearchFields = (track: Track, filter: string): (string | undefined)[] => {
    switch (filter) {
      case 'artist':
        return [track.artist];
      case 'album':
        return [track.album];
      case 'title':
        return [track.name];
      default:
        return [track.name, track.artist, track.album];
    }
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={`Buscar por ${getFilterPlaceholder(filterType)}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <button 
            className="search-clear"
            onClick={() => setQuery('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="search-filters">
        <button 
          className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          Todos
        </button>
        <button 
          className={`filter-button ${filterType === 'artist' ? 'active' : ''}`}
          onClick={() => setFilterType('artist')}
        >
          Artista
        </button>
        <button 
          className={`filter-button ${filterType === 'album' ? 'active' : ''}`}
          onClick={() => setFilterType('album')}
        >
          Álbum
        </button>
        <button 
          className={`filter-button ${filterType === 'title' ? 'active' : ''}`}
          onClick={() => setFilterType('title')}
        >
          Música
        </button>
      </div>
      
      {searching && <p className="search-loading">Buscando...</p>}
      
      {results.length > 0 && (
        <div className="search-results">
          <p className="search-count">{results.length} resultado(s) encontrado(s)</p>
          <ul>
            {results.map((track, index) => (
              <li key={track.id || index}>
                <button
                  className="search-result-button"
                  onClick={() => onTrackSelect(track)}
                >
                  <span className="result-title">🎵 {track.name}</span>
                  <span className="result-info">
                    {track.artist && <span className="result-artist">{track.artist}</span>}
                    {track.album && <span className="result-album"> • {track.album}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="search-no-results">Nenhum resultado encontrado para "{query}".</p>
      )}
    </div>
  );
}

function getFilterPlaceholder(filter: string): string {
  switch (filter) {
    case 'artist':
      return 'artista';
    case 'album':
      return 'álbum';
    case 'title':
      return 'música';
    default:
      return 'artista, álbum ou música';
  }
}
