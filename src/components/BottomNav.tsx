import type { Tab } from '../App';

interface BottomNavProps {
  activeTab: Tab;
  onTabSelect: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'pastas', label: 'Pastas', icon: '📁' },
  { id: 'artistas', label: 'Artistas', icon: '👤' },
  { id: 'albuns', label: 'Álbuns', icon: '💿' },
  { id: 'musicas', label: 'Músicas', icon: '🎵' },
  { id: 'busca', label: 'Busca', icon: '🔍' },
];

export function BottomNav({ activeTab, onTabSelect }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabSelect(tab.id)}
          aria-label={tab.label}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
