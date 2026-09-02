interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenEqualizer?: () => void;
}

export function SideMenu({
  isOpen,
  onClose,
  onExport,
  onImport,
  onOpenEqualizer,
}: SideMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="side-menu-overlay" onClick={onClose} />
      <div className="side-menu">
        <div className="side-menu-header">
          <h2>DriveTune</h2>
          <button className="side-menu-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="side-menu-content">
          <div className="side-menu-section">
            <h3>Biblioteca</h3>
            <button className="side-menu-item" onClick={onExport}>
              <span className="side-menu-icon">↓</span>
              <span>Exportar dados</span>
            </button>
            <button className="side-menu-item" onClick={onImport}>
              <span className="side-menu-icon">↑</span>
              <span>Importar dados</span>
            </button>
          </div>

          <div className="side-menu-section">
            <h3>Áudio</h3>
            <button className="side-menu-item" onClick={onOpenEqualizer}>
              <span className="side-menu-icon">🎛️</span>
              <span>Equalizador</span>
            </button>
          </div>

          <div className="side-menu-section">
            <h3>Configurações</h3>
            <div className="side-menu-item disabled">
              <span className="side-menu-icon">📁</span>
              <span>Pasta inicial</span>
            </div>
            <div className="side-menu-item disabled">
              <span className="side-menu-icon">▶</span>
              <span>Retomar reprodução</span>
            </div>
            <div className="side-menu-item disabled">
              <span className="side-menu-icon">❤️</span>
              <span>Iniciar com favoritas</span>
            </div>
          </div>

          <div className="side-menu-section">
            <h3>Sobre</h3>
            <div className="side-menu-item disabled">
              <span className="side-menu-icon">ℹ️</span>
              <span>Versão 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
