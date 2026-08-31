import { useState, useEffect } from 'react';
import { getRecentHistory, clearHistory } from './history';
import type { HistoryEntry } from '../db';
import type { DriveFile } from '../drive';
import { db } from '../db';

interface HistoryItem extends HistoryEntry {
  trackName?: string;
  artist?: string;
  album?: string;
}

interface HistoryViewProps {
  onTrackSelect: (file: DriveFile, allFiles: DriveFile[]) => void;
}

export function HistoryView({ onTrackSelect }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await getRecentHistory(100);
      setHistory(items);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Tem certeza que deseja limpar o histórico?')) {
      await clearHistory();
      setHistory([]);
    }
  };

  const handlePlayTrack = async (item: HistoryItem) => {
    const track = await db.tracks.get(item.trackId);
    if (track) {
      const file: DriveFile = {
        id: track.driveFileId,
        name: track.name,
        mimeType: 'audio/mpeg',
      };
      onTrackSelect(file, [file]);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="history-view">
        <div className="history-loading">Carregando histórico...</div>
      </div>
    );
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <h2>Histórico de Reprodução</h2>
        {history.length > 0 && (
          <button className="clear-history-btn" onClick={handleClearHistory}>
            Limpar Histórico
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <p>Nenhuma música reproduzida ainda</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => handlePlayTrack(item)}
            >
              <div className="history-item-info">
                <span className="history-item-title">
                  {item.trackName || 'Desconhecido'}
                </span>
                <span className="history-item-artist">
                  {item.artist || 'Desconhecido'}
                  {item.album ? ` • ${item.album}` : ''}
                </span>
              </div>
              <span className="history-item-time">
                {formatDate(item.playedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
