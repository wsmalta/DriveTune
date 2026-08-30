import { useState, useEffect } from 'react';
import { listMp3Files } from '../drive';
import type { DriveFile } from '../drive';

interface FileListProps {
  folderId: string;
  onFileSelected: (file: DriveFile) => void;
  onFilesLoaded?: (files: DriveFile[]) => void;
}

export function FileList({ folderId, onFileSelected, onFilesLoaded }: FileListProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [folderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const filesList = await listMp3Files(folderId);
      setFiles(filesList);
      onFilesLoaded?.(filesList);
    } catch (err) {
      setError('Erro ao carregar arquivos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: DriveFile) => {
    onFileSelected(file);
  };

  if (loading) {
    return <div className="file-list">Carregando músicas...</div>;
  }

  if (error) {
    return (
      <div className="file-list error">
        <p>{error}</p>
        <button onClick={loadFiles}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="file-list">
      <h3>Músicas encontradas</h3>
      {files.length === 0 ? (
        <p>Nenhuma música encontrada nesta pasta.</p>
      ) : (
        <ul className="file-list-items">
          {files.map((file) => (
            <li key={file.id}>
              <button
                className="file-button"
                onClick={() => handleFileClick(file)}
              >
                🎵 {file.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
