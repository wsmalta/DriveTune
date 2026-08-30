import { useState, useCallback } from 'react';
import { LoginButton } from './auth';
import type { GoogleUser } from './auth';
import { FolderTree, MainPanel, listFolderContents, listRootFolderContents, listMp3Files } from './drive';
import type { DriveFile, DriveFolder } from './drive';
import { AudioPlayer, TrackInfoPanel } from './player';
import './App.css';

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const [playerFiles, setPlayerFiles] = useState<DriveFile[]>([]);

  const handleAuthChange = (newUser: GoogleUser | null) => {
    setUser(newUser);
    if (!newUser) {
      setSelectedFolderId(null);
      setFolderName('');
      setFolders([]);
      setFiles([]);
      setCurrentFileIndex(null);
      setPlayerFiles([]);
    }
  };

  const loadFolderContent = useCallback(async (folderId: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedFolderId(folderId);
      setFolderName(name);

      const content = folderId === '__drive_root__'
        ? await listRootFolderContents()
        : await listFolderContents(folderId);
      setFolders(content.folders);
      setFiles(content.files);
    } catch (err) {
      setError('Erro ao carregar conteúdo da pasta');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFolderSelect = useCallback((folderId: string, folderName: string) => {
    loadFolderContent(folderId, folderName);
  }, [loadFolderContent]);

  const handlePlayFolder = useCallback(async (folderId: string, _folderName: string) => {
    try {
      const effectiveId = folderId === '__drive_root__' ? 'root' : folderId;
      const folderFiles = await listMp3Files(effectiveId);
      if (folderFiles.length > 0) {
        setPlayerFiles(folderFiles);
        setCurrentFileIndex(0);
      }
    } catch (err) {
      console.error('Erro ao carregar músicas da pasta:', err);
    }
  }, []);

  const handleFileSelected = useCallback((file: DriveFile, allFiles: DriveFile[]) => {
    const index = allFiles.findIndex(f => f.id === file.id);
    setPlayerFiles(allFiles);
    setCurrentFileIndex(index >= 0 ? index : 0);
  }, []);

  const handlePlayAll = useCallback((filesToPlay: DriveFile[]) => {
    if (filesToPlay.length > 0) {
      setPlayerFiles(filesToPlay);
      setCurrentFileIndex(0);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DriveTune</h1>
        <div className="user-info">
          {user && <LoginButton onAuthChange={handleAuthChange} />}
        </div>
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
            <div className="split-view">
              <div className="left-panel">
                <FolderTree
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={handleFolderSelect}
                  onPlayFolder={handlePlayFolder}
                />
              </div>

              <div className="right-panel">
                <MainPanel
                  folders={folders}
                  files={files}
                  folderName={folderName}
                  isLoading={isLoading}
                  error={error}
                  onFolderClick={handleFolderSelect}
                  onPlayFolder={handlePlayFolder}
                  onFileSelected={handleFileSelected}
                  onPlayAll={handlePlayAll}
                />
              </div>
            </div>

            {currentFileIndex !== null && playerFiles.length > 0 && (
              <div className="player-section">
                <div className="player-layout">
                  <TrackInfoPanel file={playerFiles[currentFileIndex]} />
                  <AudioPlayer
                    files={playerFiles}
                    initialIndex={currentFileIndex}
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
