import { useState } from 'react';
import { LoginButton } from './auth';
import type { GoogleUser } from './auth';
import { FolderPicker, FileList } from './drive';
import type { DriveFolder, DriveFile } from './drive';
import { AudioPlayer } from './player';
import './App.css';

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);

  const handleAuthChange = (newUser: GoogleUser | null) => {
    setUser(newUser);
    if (!newUser) {
      setSelectedFolder(null);
      setFiles([]);
      setCurrentFileIndex(null);
    }
  };

  const handleFolderSelected = (folder: DriveFolder) => {
    setSelectedFolder(folder);
    setFiles([]);
    setCurrentFileIndex(null);
    console.log('Pasta selecionada:', folder);
  };

  const handleFilesLoaded = (loadedFiles: DriveFile[]) => {
    setFiles(loadedFiles);
    setCurrentFileIndex(null);
  };

  const handleFileSelected = (file: DriveFile) => {
    const index = files.findIndex(f => f.id === file.id);
    setCurrentFileIndex(index >= 0 ? index : 0);
    console.log('Arquivo selecionado:', file);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>DriveTune</h1>
        <p>Player de música para Google Drive</p>
      </header>

      <main className="app-main">
        {!user ? (
          <section className="login-section">
            <h2>Bem-vindo ao DriveTune</h2>
            <p>Entre com sua conta Google para acessar suas músicas</p>
            <LoginButton onAuthChange={handleAuthChange} />
          </section>
        ) : (
          <section className="logged-section">
            <div className="user-info">
              <LoginButton onAuthChange={handleAuthChange} />
            </div>

            {!selectedFolder ? (
              <FolderPicker onFolderSelected={handleFolderSelected} />
            ) : (
              <div className="folder-selected">
                <h3>Pasta: {selectedFolder.name}</h3>
                <FileList
                  folderId={selectedFolder.id}
                  onFileSelected={handleFileSelected}
                  onFilesLoaded={handleFilesLoaded}
                />
                {currentFileIndex !== null && files.length > 0 && (
                  <div className="player-section">
                    <AudioPlayer
                      files={files}
                      initialIndex={currentFileIndex}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
