import { useState, useCallback, useRef } from 'react';
import { LoginButton } from './auth';
import type { GoogleUser } from './auth';
import { FolderTree, MainPanel, listFolderContents, listRootFolderContents, listMp3Files } from './drive';
import type { DriveFile, DriveFolder } from './drive';
import { AudioPlayer, DisplayPanel } from './player';
import type { AudioPlayerHandle } from './player';
import { AllArtists, AllAlbums, TracksView, Search, indexFolder, HistoryView } from './library';
import { exportData, importData } from './library/backup';
import './App.css';

type Tab = 'pastas' | 'artistas' | 'albuns' | 'musicas' | 'busca' | 'historico';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('pastas');
  const importRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<AudioPlayerHandle>(null);

  const handleAuthChange = useCallback((newUser: GoogleUser | null) => {
    setUser(newUser);
    if (!newUser) {
      setSelectedFolderId(null);
      setFolderName('');
      setFolders([]);
      setFiles([]);
      setCurrentFileIndex(null);
      setPlayerFiles([]);
    }
  }, []);

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

      if (content.files.length > 0) {
        const effectiveId = folderId === '__drive_root__' ? 'root' : folderId;
        indexFolder(content.files, effectiveId).catch(err =>
          console.error('Erro ao indexar pasta:', err)
        );
      }
    } catch (err) {
      setError('Erro ao carregar conteúdo da pasta');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFolderSelect = useCallback((folderId: string, folderName: string) => {
    loadFolderContent(folderId, folderName);
    setSidebarOpen(false);
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
    setSidebarOpen(false);
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

  const handleTabSelect = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pastas', label: 'Pastas' },
    { id: 'artistas', label: 'Artistas' },
    { id: 'albuns', label: 'Álbuns' },
    { id: 'musicas', label: 'Músicas' },
    { id: 'busca', label: 'Busca' },
    { id: 'historico', label: 'Histórico' },
  ];

  const handleExport = () => {
    exportData();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importData(file);
      alert(`Importado: ${result.imported} atualizado(s), ${result.skipped} já existente(s)`);
      window.location.reload();
    } catch {
      alert('Erro ao importar arquivo');
    }
    e.target.value = '';
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          {user && (
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Alternar painel de pastas"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          )}
          <h1>DriveTune</h1>
        </div>
        <div className="user-info">
          {user && (
            <>
              <button className="header-action-btn" onClick={handleExport} title="Exportar dados">
                ↓<span className="header-action-btn-label"> Exportar</span>
              </button>
              <button className="header-action-btn" onClick={() => importRef.current?.click()} title="Importar dados">
                ↑<span className="header-action-btn-label"> Importar</span>
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <LoginButton onAuthChange={handleAuthChange} />
            </>
          )}
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
            <nav className="tab-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabSelect(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="tab-content">
              {activeTab === 'pastas' && (
                <div className={`split-view ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  {user && (
                    <div
                      className="sidebar-overlay"
                      onClick={() => setSidebarOpen(false)}
                    />
                  )}
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
              )}

              {activeTab === 'artistas' && (
                <div className="tab-panel">
                  <AllArtists onTrackSelect={handleFileSelected} />
                </div>
              )}

              {activeTab === 'albuns' && (
                <div className="tab-panel">
                  <AllAlbums onTrackSelect={handleFileSelected} />
                </div>
              )}

              {activeTab === 'musicas' && (
                <div className="tab-panel">
                  <TracksView onTrackSelect={handleFileSelected} />
                </div>
              )}

              {activeTab === 'busca' && (
                <div className="tab-panel">
                  <Search
                    folderId={selectedFolderId || ''}
                    files={files}
                    onTrackSelect={(track) => {
                      const driveFile: DriveFile = {
                        id: track.driveFileId,
                        name: track.name,
                        mimeType: 'audio/mpeg',
                      };
                      handleFileSelected(driveFile, [driveFile]);
                    }}
                  />
                </div>
              )}

              {activeTab === 'historico' && (
                <div className="tab-panel">
                  <HistoryView onTrackSelect={handleFileSelected} />
                </div>
              )}
            </div>

            {currentFileIndex !== null && playerFiles.length > 0 && (
              <div className="player-section">
                <div className="player-layout">
                  <DisplayPanel
                    file={playerFiles[currentFileIndex]}
                    analyser={playerRef.current?.analyser ?? null}
                  />
                  <AudioPlayer
                    ref={playerRef}
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
