import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { recordPlayback, getRecentHistory, clearHistory, getTrackPlayCount } from '../library/history'

beforeEach(async () => {
  await db.history.clear()
  await db.tracks.clear()
})

describe('recordPlayback', () => {
  it('creates a history entry', async () => {
    await recordPlayback(1)
    const count = await db.history.count()
    expect(count).toBe(1)
  })

  it('creates entry with duration', async () => {
    await recordPlayback(1, 210)
    const entry = await db.history.toCollection().first()
    expect(entry?.trackId).toBe(1)
    expect(entry?.duration).toBe(210)
  })
})

describe('clearHistory', () => {
  it('removes all history entries', async () => {
    await recordPlayback(1)
    await recordPlayback(2)
    await clearHistory()
    const count = await db.history.count()
    expect(count).toBe(0)
  })
})

describe('getTrackPlayCount', () => {
  it('returns 0 for track with no plays', async () => {
    const count = await getTrackPlayCount(999)
    expect(count).toBe(0)
  })

  it('counts plays for a specific track', async () => {
    await recordPlayback(1)
    await recordPlayback(1)
    await recordPlayback(2)
    const count = await getTrackPlayCount(1)
    expect(count).toBe(2)
  })
})

describe('getRecentHistory', () => {
  it('returns empty array when no history', async () => {
    const result = await getRecentHistory()
    expect(result).toEqual([])
  })

  it('returns entries enriched with track info', async () => {
    await db.tracks.add({
      driveFileId: 'file1',
      name: 'My Song',
      artist: 'Artist A',
      album: 'Album X',
      folderId: 'folder1',
      updatedAt: new Date(),
    })

    const track = await db.tracks.where('driveFileId').equals('file1').first()
    await recordPlayback(track!.id!)

    const result = await getRecentHistory()
    expect(result).toHaveLength(1)
    expect(result[0].trackName).toBe('My Song')
    expect(result[0].artist).toBe('Artist A')
    expect(result[0].album).toBe('Album X')
  })

  it('respects limit parameter', async () => {
    await db.tracks.add({
      driveFileId: 'f1', name: 'S1', folderId: 'folder1', updatedAt: new Date(),
    })
    await db.tracks.add({
      driveFileId: 'f2', name: 'S2', folderId: 'folder1', updatedAt: new Date(),
    })

    const t1 = await db.tracks.where('driveFileId').equals('f1').first()
    const t2 = await db.tracks.where('driveFileId').equals('f2').first()
    await recordPlayback(t1!.id!)
    await recordPlayback(t2!.id!)

    const result = await getRecentHistory(1)
    expect(result).toHaveLength(1)
  })
})
