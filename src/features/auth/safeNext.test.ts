import { safeNext } from './safeNext'

describe('safeNext', () => {
  it('keeps paths inside the app', () => {
    expect(safeNext('/journal')).toBe('/journal')
    expect(safeNext('/habits?open=h1')).toBe('/habits?open=h1')
  })

  it('falls back to Today when there is nothing to go back to', () => {
    expect(safeNext(null)).toBe('/today')
    expect(safeNext('')).toBe('/today')
  })

  it('refuses to redirect to another site', () => {
    expect(safeNext('https://evil.example')).toBe('/today')
    expect(safeNext('//evil.example')).toBe('/today')
    expect(safeNext('/\\evil.example')).toBe('/today')
  })
})
