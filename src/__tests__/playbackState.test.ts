import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { savePlaybackState, loadPlaybackState, clearPlaybackState } from '../player/playbackState'

beforeEach(async () => {
  await db.playbackState.clear()
})

describe('savePlaybackState', () => {
  it('saves a new playback state', async () => {
    await savePlaybackState({
      currentTrackId: 1,
      position: 30,
      queue: [1, 2, 3],
      currentIndex: 0,
    })

    const count = await db.playbackState.count()
    expect(count).toBe(1)
  })

  it('updates existing state instead of creating new', async () => {
    await savePlaybackState({
      currentTrackId: 1,
      position: 30,
      queue: [1, 2, 3],
      currentIndex: 0,
    })

    await savePlaybackState({
      currentTrackId: 2,
      position: 60,
      queue: [1, 2, 3],
      currentIndex: 1,
    })

    const count = await db.playbackState.count()
    expect(count).toBe(1)

    const state = await db.playbackState.toCollection().first()
    expect(state?.currentTrackId).toBe(2)
    expect(state?.position).toBe(60)
    expect(state?.currentIndex).toBe(1)
  })
})

describe('loadPlaybackState', () => {
  it('returns null when no state saved', async () => {
    const result = await loadPlaybackState()
    expect(result).toBeNull()
  })

  it('returns saved state', async () => {
    await savePlaybackState({
      currentTrackId: 5,
      position: 120,
      queue: [5, 6, 7],
      currentIndex: 2,
    })

    const result = await loadPlaybackState()
    expect(result).toEqual({
      currentTrackId: 5,
      position: 120,
      queue: [5, 6, 7],
      currentIndex: 2,
    })
  })
})

describe('clearPlaybackState', () => {
  it('removes all playback state', async () => {
    await savePlaybackState({
      currentTrackId: 1,
      position: 0,
      queue: [1],
      currentIndex: 0,
    })

    await clearPlaybackState()
    const result = await loadPlaybackState()
    expect(result).toBeNull()
  })
})
