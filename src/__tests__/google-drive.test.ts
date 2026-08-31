import { describe, it, expect } from 'vitest'
import { extractMetadata, getAudioUrl } from '../drive/google-drive'

describe('getAudioUrl', () => {
  it('returns correct Drive API URL for a file id', () => {
    const url = getAudioUrl('abc123')
    expect(url).toBe('https://www.googleapis.com/drive/v3/files/abc123?alt=media')
  })
})

describe('extractMetadata', () => {
  it('parses "01 - Artist - Title.mp3"', () => {
    const result = extractMetadata('01 - Artist - Title.mp3')
    expect(result).toEqual({
      trackNumber: 1,
      artist: 'Artist',
      title: 'Title',
      album: undefined,
    })
  })

  it('parses "12. Artist - Song.mp3"', () => {
    const result = extractMetadata('12. Artist - Song.mp3')
    expect(result).toEqual({
      trackNumber: 12,
      artist: 'Artist',
      title: 'Song',
      album: undefined,
    })
  })

  it('parses "[Album Name] Artist - Title.mp3"', () => {
    const result = extractMetadata('[Album Name] Artist - Title.mp3')
    expect(result).toEqual({
      album: 'Album Name',
      artist: 'Artist',
      title: 'Title',
      trackNumber: undefined,
    })
  })

  it('parses "05.[Album] Artist - Title.mp3"', () => {
    const result = extractMetadata('05.[Album] Artist - Title.mp3')
    expect(result).toEqual({
      trackNumber: 5,
      album: 'Album',
      artist: 'Artist',
      title: 'Title',
    })
  })

  it('parses "Artist - Album - Title.mp3"', () => {
    const result = extractMetadata('Artist - Album - Title.mp3')
    expect(result).toEqual({
      artist: 'Artist',
      album: 'Album',
      title: 'Title',
      trackNumber: undefined,
    })
  })

  it('parses "Artist - Title.mp3"', () => {
    const result = extractMetadata('Artist - Title.mp3')
    expect(result).toEqual({
      artist: 'Artist',
      title: 'Title',
      album: undefined,
      trackNumber: undefined,
    })
  })

  it('parses "Just a Song.mp3"', () => {
    const result = extractMetadata('Just a Song.mp3')
    expect(result).toEqual({
      title: 'Just a Song',
      artist: undefined,
      album: undefined,
      trackNumber: undefined,
    })
  })

  it('parses "Track - A - B - C.mp3" (multi-part title)', () => {
    const result = extractMetadata('Track - A - B - C.mp3')
    expect(result).toEqual({
      artist: 'Track',
      album: 'A',
      title: 'B - C',
      trackNumber: undefined,
    })
  })

  it('handles uppercase extension FILE.MP3', () => {
    const result = extractMetadata('FILE.MP3')
    expect(result).toEqual({
      title: 'FILE',
      artist: undefined,
      album: undefined,
      trackNumber: undefined,
    })
  })

  it('handles .wav extension', () => {
    const result = extractMetadata('song.wav')
    expect(result).toEqual({
      title: 'song',
      artist: undefined,
      album: undefined,
      trackNumber: undefined,
    })
  })

  it('handles .flac extension', () => {
    const result = extractMetadata('song.flac')
    expect(result).toEqual({
      title: 'song',
      artist: undefined,
      album: undefined,
      trackNumber: undefined,
    })
  })

  it('parses 3-digit track number "999 - Too High.mp3"', () => {
    const result = extractMetadata('999 - Too High.mp3')
    expect(result).toEqual({
      trackNumber: 999,
      title: 'Too High',
      artist: undefined,
      album: undefined,
    })
  })

  it('parses bracket format with title only "[Album] Title.mp3"', () => {
    const result = extractMetadata('[Album] Title.mp3')
    expect(result).toEqual({
      album: 'Album',
      title: 'Title',
      artist: undefined,
      trackNumber: undefined,
    })
  })
})
