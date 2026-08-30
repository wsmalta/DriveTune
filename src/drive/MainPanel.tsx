import { useState, useMemo } from 'react';
import type { DriveFolder, DriveFile } from '../drive';

interface MainPanelProps {
  folders: DriveFolder[];
  files: DriveFile[];
  folderName: string;
  isLoading: boolean;
  error: string | null;
  onFolderClick: (folderId: string, folderName: string) => void;
  onPlayFolder: (folderId: string, folderName: string) => void;
  onFileSelected: (file: DriveFile, allFiles: DriveFile[]) => void;
  onPlayAll: (files: DriveFile[]) => void;
}

type SortField = 'name' | 'modifiedTime' | 'size';
type SortDirection = 'asc' | 'desc';

export function MainPanel({
  folders,
  files,
  folderName,
  isLoading,
  error,
  onFolderClick,
  onPlayFolder,
  onFileSelected,
  onPlayAll,
}: MainPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortField === 'modifiedTime') {
        const aTime = a.modifiedTime || '';
        const bTime = b.modifiedTime || '';
        return aTime.localeCompare(bTime) * dir;
      }
      return 0;
    });
  }, [folders, sortField, sortDirection]);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortField === 'modifiedTime') {
        const aTime = a.modifiedTime || '';
        const bTime = b.modifiedTime || '';
        return aTime.localeCompare(bTime) * dir;
      }
      if (sortField === 'size') {
        const aSize = parseInt(a.size || '0', 10);
        const bSize = parseInt(b.size || '0', 10);
        return (aSize - bSize) * dir;
      }
      return 0;
    });
  }, [files, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === files.length + folders.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set([...folders.map(f => f.id), ...files.map(f => f.id)]);
      setSelectedIds(allIds);
    }
  };

  const handlePlaySelected = () => {
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    if (selectedFiles.length > 0) {
      onPlayAll(selectedFiles);
    }
  };

  const handlePlayAll = () => {
    if (files.length > 0) {
      onPlayAll(files);
    }
  };

  const formatSize = (size?: string): string => {
    if (!size) return '—';
    const bytes = parseInt(size, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const allSelected = files.length + folders.length > 0 && selectedIds.size === files.length + folders.length;
  const hasSelection = selectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="main-panel">
        <div className="main-panel-header">
          <h3>{folderName}</h3>
        </div>
        <div className="main-panel-content">
          <p className="main-panel-loading">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-panel">
        <div className="main-panel-header">
          <h3>{folderName}</h3>
        </div>
        <div className="main-panel-content">
          <p className="main-panel-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-panel">
      <div className="main-panel-header">
        <div className="main-panel-title">
          <h3>{folderName || 'Meu Drive'}</h3>
          <span className="main-panel-count">
            {folders.length} pasta(s), {files.length} música(s)
          </span>
        </div>
        <div className="main-panel-actions">
          {hasSelection && (
            <button className="play-selected-button" onClick={handlePlaySelected}>
              ▶ Tocar selecionados ({selectedIds.size})
            </button>
          )}
          {files.length > 0 && (
            <button className="play-all-button" onClick={handlePlayAll}>
              ▶ Tocar todas
            </button>
          )}
        </div>
      </div>

      <div className="main-panel-content">
        {folders.length === 0 && files.length === 0 ? (
          <div className="main-panel-empty">
            <p>Nenhum arquivo encontrado nesta pasta</p>
          </div>
        ) : (
          <table className="file-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="col-icon"></th>
                <th className="col-name" onClick={() => handleSort('name')}>
                  Nome{getSortIcon('name')}
                </th>
                <th className="col-modified" onClick={() => handleSort('modifiedTime')}>
                  Modificado{getSortIcon('modifiedTime')}
                </th>
                <th className="col-size" onClick={() => handleSort('size')}>
                  Tamanho{getSortIcon('size')}
                </th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {sortedFolders.map(folder => (
                <tr key={folder.id} className="file-row folder-row">
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(folder.id)}
                      onChange={() => handleToggleSelect(folder.id)}
                    />
                  </td>
                  <td className="col-icon">📁</td>
                  <td className="col-name">
                    <button
                      className="folder-link"
                      onClick={() => onFolderClick(folder.id, folder.name)}
                    >
                      {folder.name}
                    </button>
                  </td>
                  <td className="col-modified">{formatDate(folder.modifiedTime)}</td>
                  <td className="col-size">—</td>
                  <td className="col-actions">
                    <button
                      className="play-folder-button"
                      onClick={() => onPlayFolder(folder.id, folder.name)}
                      title="Todas as músicas desta pasta"
                    >
                      ▶
                    </button>
                  </td>
                </tr>
              ))}
              {sortedFiles.map(file => (
                <tr key={file.id} className="file-row music-row">
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(file.id)}
                      onChange={() => handleToggleSelect(file.id)}
                    />
                  </td>
                  <td className="col-icon">🎵</td>
                  <td className="col-name">
                    <button
                      className="file-link"
                      onClick={() => onFileSelected(file, files)}
                    >
                      {file.name}
                    </button>
                  </td>
                  <td className="col-modified">{formatDate(file.modifiedTime)}</td>
                  <td className="col-size">{formatSize(file.size)}</td>
                  <td className="col-actions"></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
