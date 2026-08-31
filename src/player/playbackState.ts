import { db } from '../db';

interface PlaybackStateData {
  currentTrackId?: number;
  position: number;
  queue: number[];
  currentIndex: number;
}

export async function savePlaybackState(state: PlaybackStateData): Promise<void> {
  try {
    const existing = await db.playbackState.toCollection().first();
    if (existing?.id) {
      await db.playbackState.update(existing.id, {
        ...state,
        updatedAt: new Date(),
      });
    } else {
      await db.playbackState.add({
        ...state,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.error('Erro ao salvar estado de reprodução:', err);
  }
}

export async function loadPlaybackState(): Promise<PlaybackStateData | null> {
  try {
    const state = await db.playbackState.toCollection().first();
    if (state) {
      return {
        currentTrackId: state.currentTrackId,
        position: state.position,
        queue: state.queue,
        currentIndex: state.currentIndex,
      };
    }
    return null;
  } catch (err) {
    console.error('Erro ao carregar estado de reprodução:', err);
    return null;
  }
}

export async function clearPlaybackState(): Promise<void> {
  try {
    await db.playbackState.clear();
  } catch (err) {
    console.error('Erro ao limpar estado de reprodução:', err);
  }
}
