import type { DriveFile } from '../drive';

interface TrackListProps {
  files: DriveFile[];
  folderName: string;
  onFileSelected: (file: DriveFile) => void;
  onPlayAll: () => void;
}

export function TrackList({ files, folderName, onFileSelected, onPlayAll }: TrackListProps) {
  return (
    <div className="track-list-panel">
      <div className="track-list-header">
        <h3>{folderName}</h3>
        <p className="track-count">{files.length} música(s)</p>
        {files.length > 0 && (
          <button className="play-all-button" onClick={onPlayAll}>
            ▶ Tocar todas
          </button>
        )}
      </div>
      
      <div className="track-list-content">
        {files.length === 0 ? (
          <p className="track-list-empty">Nenhuma música nesta pasta</p>
        ) : (
          <ul className="track-list-items">
            {files.map((file, index) => (
              <li key={file.id}>
                <button
                  className="track-item"
                  onClick={() => onFileSelected(file)}
                >
                  <span className="track-number">{index + 1}</span>
                  <span className="track-name">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
