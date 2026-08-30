import { useState, useCallback } from 'react';
import { listFolders } from '../drive';

interface FolderTreeProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string, folderName: string) => void;
  onPlayFolder: (folderId: string, folderName: string) => void;
}

interface FolderNode {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  children?: FolderNode[];
  isExpanded?: boolean;
  isLoaded?: boolean;
  hasSubfolders?: boolean;
  level?: number;
}

const DRIVE_ROOT_ID = '__drive_root__';

export function FolderTree({ selectedFolderId, onFolderSelect, onPlayFolder }: FolderTreeProps) {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [rootExpanded, setRootExpanded] = useState(false);
  const [rootLoaded, setRootLoaded] = useState(false);
  const [rootLoading, setRootLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRootFolders = async () => {
    try {
      setRootLoading(true);
      setError(null);
      const folders = await listFolders();
      const nodes: FolderNode[] = folders.map(f => ({
        ...f,
        isExpanded: false,
        isLoaded: false,
        level: 1,
      }));

      const withSubfolders = await Promise.all(
        nodes.map(async (node) => {
          try {
            const subfolders = await listFolders(node.id);
            return { ...node, hasSubfolders: subfolders.length > 0 };
          } catch {
            return { ...node, hasSubfolders: false };
          }
        })
      );

      setTree(withSubfolders);
      setRootLoaded(true);
    } catch (err) {
      setError('Erro ao carregar pastas');
      console.error(err);
    } finally {
      setRootLoading(false);
    }
  };

  const loadSubfolders = useCallback(async (folderId: string, level: number): Promise<FolderNode[]> => {
    const folders = await listFolders(folderId);
    const nodes: FolderNode[] = folders.map(f => ({
      ...f,
      isExpanded: false,
      isLoaded: false,
      level: level + 1,
    }));

    const withSubfolders = await Promise.all(
      nodes.map(async (node) => {
        try {
          const subfolders = await listFolders(node.id);
          return { ...node, hasSubfolders: subfolders.length > 0 };
        } catch {
          return { ...node, hasSubfolders: false };
        }
      })
    );

    return withSubfolders;
  }, []);

  const handleToggleRoot = async () => {
    if (rootExpanded) {
      setRootExpanded(false);
      return;
    }

    if (!rootLoaded) {
      await loadRootFolders();
    }
    setRootExpanded(true);
  };

  const handleToggleFolder = async (folderId: string) => {
    const folder = findFolder(tree, folderId);
    if (!folder) return;

    if (folder.isExpanded) {
      setTree(prev => updateFolder(prev, folderId, { isExpanded: false }));
      return;
    }

    if (folder.children && folder.children.length > 0) {
      setTree(prev => updateFolder(prev, folderId, { isExpanded: true }));
      return;
    }

    try {
      const level = folder.level || 0;
      const children = await loadSubfolders(folderId, level);
      setTree(prev => updateFolder(prev, folderId, {
        isExpanded: true,
        children,
        isLoaded: true,
        hasSubfolders: children.length > 0,
      }));
    } catch (err) {
      console.error('Erro ao carregar subpastas:', err);
    }
  };

  const handleSelectFolder = (folderId: string, folderName: string) => {
    onFolderSelect(folderId, folderName);
  };

  const handlePlayFolder = (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.stopPropagation();
    onPlayFolder(folderId, folderName);
  };

  const findFolder = (nodes: FolderNode[], id: string): FolderNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFolder(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const updateFolder = (nodes: FolderNode[], id: string, updates: Partial<FolderNode>): FolderNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateFolder(node.children, id, updates) };
      }
      return node;
    });
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const hasChildren = folder.hasSubfolders || (folder.children && folder.children.length > 0);
    const isExpanded = folder.isExpanded;
    const isSelected = selectedFolderId === folder.id;
    const isLoading = !folder.isLoaded && isExpanded;

    return (
      <li key={folder.id} className="tree-item">
        <div className={`tree-node ${isSelected ? 'selected' : ''}`}>
          {hasChildren ? (
            <button
              className="tree-expand"
              onClick={() => handleToggleFolder(folder.id)}
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isLoading ? '◌' : isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="tree-expand-placeholder" />
          )}

          <button
            className="tree-folder"
            onClick={() => handleSelectFolder(folder.id, folder.name)}
            title={folder.name}
          >
            <span className="tree-folder-icon">{isExpanded ? '📂' : '📁'}</span>
            <span className="tree-folder-name">{folder.name}</span>
          </button>

          <button
            className="tree-play"
            onClick={(e) => handlePlayFolder(e, folder.id, folder.name)}
            title="Todas as músicas desta pasta"
          >
            ▶
          </button>
        </div>

        {isExpanded && folder.children && folder.children.length > 0 && (
          <ul className="tree-children">
            {folder.children.map(child => renderFolder(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="folder-tree-panel">
      <div className="tree-content">
        {error ? (
          <>
            <p className="tree-error">{error}</p>
            <button onClick={loadRootFolders}>Tentar novamente</button>
          </>
        ) : (
          <ul className="tree-root">
            <li className="tree-item">
              <div className={`tree-node tree-root-node ${selectedFolderId === DRIVE_ROOT_ID ? 'selected' : ''}`}>
                <button
                  className="tree-expand"
                  onClick={handleToggleRoot}
                  title={rootExpanded ? 'Recolher' : 'Expandir'}
                >
                  {rootLoading ? '◌' : rootExpanded ? '−' : '+'}
                </button>

                <button
                  className="tree-folder tree-root-folder"
                  onClick={() => handleSelectFolder(DRIVE_ROOT_ID, 'Meu Drive')}
                  title="Meu Drive"
                >
                  <span className="tree-folder-icon">{rootExpanded ? '📂' : '📁'}</span>
                  <span className="tree-folder-name">Meu Drive</span>
                </button>
              </div>

              {rootExpanded && tree.length > 0 && (
                <ul className="tree-children">
                  {tree.map(folder => renderFolder(folder, 1))}
                </ul>
              )}

              {rootExpanded && tree.length === 0 && !rootLoading && (
                <p className="tree-empty">Nenhuma pasta encontrada</p>
              )}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
