import { useState, useEffect } from 'react';
import { listFolders } from '../drive';
import type { DriveFolder } from '../drive';

interface FolderPickerProps {
  onFolderSelected: (folder: DriveFolder) => void;
}

export function FolderPicker({ onFolderSelected }: FolderPickerProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async (parentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const foldersList = await listFolders(parentId);
      setFolders(foldersList);
    } catch (err) {
      setError('Erro ao carregar pastas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: DriveFolder) => {
    onFolderSelected(folder);
  };

  if (loading) {
    return <div className="folder-picker">Carregando pastas...</div>;
  }

  if (error) {
    return (
      <div className="folder-picker error">
        <p>{error}</p>
        <button onClick={() => loadFolders()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="folder-picker">
      <h3>Selecione a pasta com suas músicas</h3>
      {folders.length === 0 ? (
        <p>Nenhuma pasta encontrada no seu Google Drive.</p>
      ) : (
        <ul className="folder-list">
          {folders.map((folder) => (
            <li key={folder.id}>
              <button
                className="folder-button"
                onClick={() => handleFolderClick(folder)}
              >
                📁 {folder.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
