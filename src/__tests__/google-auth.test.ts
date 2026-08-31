import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStoredUser, getAccessToken, signOut } from '../auth/google-auth'

describe('getStoredUser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no user is stored', () => {
    expect(getStoredUser()).toBeNull()
  })

  it('returns user when token is valid', () => {
    const future = Date.now() + 100000
    const user = { access_token: 'tok_abc', expires_at: future }
    localStorage.setItem('drivetune_user', JSON.stringify(user))
    expect(getStoredUser()).toEqual(user)
  })

  it('returns null and removes expired token', () => {
    const past = Date.now() - 100000
    const user = { access_token: 'tok_expired', expires_at: past }
    localStorage.setItem('drivetune_user', JSON.stringify(user))
    expect(getStoredUser()).toBeNull()
    expect(localStorage.getItem('drivetune_user')).toBeNull()
  })

  it('returns null and removes corrupt JSON', () => {
    localStorage.setItem('drivetune_user', 'not-json')
    expect(getStoredUser()).toBeNull()
    expect(localStorage.getItem('drivetune_user')).toBeNull()
  })
})

describe('getAccessToken', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no user', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('returns access_token when valid user exists', () => {
    const future = Date.now() + 100000
    const user = { access_token: 'tok_valid', expires_at: future }
    localStorage.setItem('drivetune_user', JSON.stringify(user))
    expect(getAccessToken()).toBe('tok_valid')
  })

  it('returns null when token expired', () => {
    const past = Date.now() - 100000
    const user = { access_token: 'tok_expired', expires_at: past }
    localStorage.setItem('drivetune_user', JSON.stringify(user))
    expect(getAccessToken()).toBeNull()
  })
})

describe('signOut', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes user from localStorage', () => {
    localStorage.setItem('drivetune_user', '{}')
    vi.stubGlobal('location', { ...window.location, reload: vi.fn() })
    signOut()
    expect(localStorage.getItem('drivetune_user')).toBeNull()
  })
})
