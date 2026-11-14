// Shared helpers for the browser checks in this folder. See README.md.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

/** Where screenshots are written (ignored by git). */
export const S = process.env.E2E_SHOTS ?? new URL('./shots', import.meta.url).pathname
mkdirSync(S, { recursive: true })
export const WEB = 'http://localhost:5173'
export const API = 'http://localhost:8084'
export const results = []
export const check = (name, ok, evidence = '') => { results.push({ name, ok }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (evidence ? '  [' + String(evidence).slice(0, 110) + ']' : '')) }
export const summary = () => console.log(results.every(r => r.ok) ? 'ALL PASS' : 'SOME FAILED')
/** Opens a browser page already logged in as the given dev account. */
export async function open({ email = 'web-dev@onepercent.local', password = 'dev-password-1', width = 1440, height = 900, colorScheme = 'light' } = {}) {
  const r = await fetch(API + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  const { token } = await r.json()
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width, height }, colorScheme })
  await context.addInitScript((t) => localStorage.setItem('onepercent.token', t), token)
  const page = await context.newPage()
  return { browser, context, page, token }
}
