import type { DriveFile } from '../drive';

interface FileListProps {
  files: DriveFile[];
  onFileSelected: (file: DriveFile) => void;
}

export function FileList({ files, onFileSelected }: FileListProps) {
  const handleFileClick = (file: DriveFile) => {
    onFileSelected(file);
  };

  return (
    <div className="file-list">
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
