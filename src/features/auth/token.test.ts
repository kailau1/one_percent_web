import { makeToken, testUser } from '@/test/auth'
import { userFromToken } from './token'

describe('userFromToken', () => {
  it("reads the user from the token's claims", () => {
    expect(userFromToken(makeToken())).toEqual(testUser)
  })

  it('returns null for an expired token', () => {
    const anHourAgo = Math.floor(Date.now() / 1000) - 3600
    expect(userFromToken(makeToken({ exp: anHourAgo }))).toBeNull()
  })

  it('accepts older tokens that have no expiry', () => {
    expect(userFromToken(makeToken({ exp: undefined }))).toEqual(testUser)
  })

  it('returns null for garbage, empty or missing tokens', () => {
    expect(userFromToken('not-a-token')).toBeNull()
    expect(userFromToken('')).toBeNull()
    expect(userFromToken(null)).toBeNull()
  })

  it('returns null when the token has no user in it', () => {
    expect(userFromToken(makeToken({ userId: undefined }))).toBeNull()
  })
})
