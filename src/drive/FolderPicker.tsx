import { useState, useEffect, useMemo } from 'react';
import { listFolders, listMp3Files } from '../drive';
import type { DriveFolder, DriveFile } from '../drive';

interface FolderPickerProps {
  onFolderSelected: (folder: DriveFolder, files: DriveFile[]) => void;
}

export function FolderPicker({ onFolderSelected }: FolderPickerProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentParentId, setCurrentParentId] = useState<string | undefined>();
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | undefined, name: string}[]>([]);

  useEffect(() => {
    loadFolders();
  }, [currentParentId]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const foldersList = await listFolders(currentParentId);
      setFolders(foldersList);
      setSearchTerm('');
    } catch (err) {
      setError('Erro ao carregar pastas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folders;
    
    const term = searchTerm.toLowerCase();
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(term)
    );
  }, [folders, searchTerm]);

  const handleFolderClick = (folder: DriveFolder) => {
    setBreadcrumbs(prev => [...prev, { id: currentParentId, name: 'Voltar' }]);
    setCurrentParentId(folder.id);
  };

  const handleSelectFolder = async (folder: DriveFolder) => {
    try {
      setLoading(true);
      const files = await listMp3Files(folder.id);
      onFolderSelected(folder, files);
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    const newBreadcrumbs = [...breadcrumbs];
    const last = newBreadcrumbs.pop();
    setBreadcrumbs(newBreadcrumbs);
    setCurrentParentId(last?.id);
  };

  if (loading && folders.length === 0) {
    return <div className="folder-picker">Carregando pastas...</div>;
  }

  if (error) {
    return (
      <div className="folder-picker error">
        <p>{error}</p>
        <button onClick={loadFolders}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="folder-picker">
      <h3>Selecione a pasta com suas músicas</h3>

      {breadcrumbs.length > 0 && (
        <button className="back-button" onClick={handleGoBack}>
          ← Voltar
        </button>
      )}
      
      {folders.length > 10 && (
        <div className="folder-search">
          <input
            type="text"
            placeholder="Buscar pasta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="folder-search-input"
          />
          {searchTerm && (
            <button 
              className="folder-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {folders.length === 0 ? (
        <p>Nenhuma pasta encontrada.</p>
      ) : filteredFolders.length === 0 ? (
        <p>Nenhuma pasta encontrada para "{searchTerm}".</p>
      ) : (
        <>
          <p className="folder-count">
            {filteredFolders.length} pasta(s)
          </p>
          <ul className="folder-list">
            {filteredFolders.map((folder) => (
              <li key={folder.id} className="folder-item">
                <button
                  className="folder-button"
                  onClick={() => handleFolderClick(folder)}
                >
                  📁 {folder.name}
                </button>
                <button
                  className="folder-select-button"
                  onClick={() => handleSelectFolder(folder)}
                  title="Selecionar esta pasta"
                >
                  ✓
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
