import { chromium } from 'playwright'
import { S, WEB } from './lib.mjs'
const results = []
const check = (name, ok, evidence = '') => { results.push({ name, ok, evidence }); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (evidence ? '  [' + evidence + ']' : '')) }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' })
const p = await ctx.newPage()
const h1 = () => p.locator('h1').first().textContent()
const email = 'e2e-' + Date.now() + '@onepercent.local'

await p.goto(WEB + '/journal')
await p.waitForURL('**/login**')
check('logged-out visit to /journal redirects to login with next', p.url().includes('next=%2Fjournal'), p.url())
await p.screenshot({ path: S + '/p2-login-light.png' })

await p.getByRole('link', { name: 'Create an account' }).click()
await p.getByLabel('First name').fill('E2E'); await p.getByLabel('Last name').fill('Tester')
await p.getByLabel('Email').fill(email); await p.getByLabel('Password').fill('e2e-password-1')
await p.screenshot({ path: S + '/p2-signup-light.png' })
await p.getByRole('button', { name: 'Create account' }).click()
await p.waitForURL('**/journal')
check('sign up against real backend logs straight in and honours next', (await h1()) === 'Journal', await h1())

await p.reload(); await p.waitForSelector('h1')
check('refresh keeps the session', (await h1()) === 'Journal')

await p.goto(WEB + '/account'); await p.waitForSelector('text=' + email)
check('account page shows the logged-in user', await p.getByText('E2E Tester').isVisible())
await p.screenshot({ path: S + '/p2-account-light.png' })
await p.getByRole('button', { name: 'Log out' }).click(); await p.waitForURL('**/login')
check('logout clears the session', (await p.evaluate(() => localStorage.getItem('onepercent.token'))) === null)

await p.getByLabel('Email').fill(email); await p.getByLabel('Password').fill('wrong-password')
await p.getByRole('button', { name: 'Log in' }).click()
const alertText = await p.getByRole('alert').textContent()
check('wrong password shows a clear message', /match an account/.test(alertText), alertText)

await p.getByLabel('Password').fill('e2e-password-1'); await p.getByRole('button', { name: 'Log in' }).click()
await p.waitForURL('**/today')
await p.getByRole('region', { name: 'Your year' }).waitFor()
check('login with the right password lands on Today', p.url().endsWith('/today'))

// duplicate email
await p.getByRole('link', { name: 'Account' }).first().click(); await p.getByRole('button', { name: 'Log out' }).click()
await p.goto(WEB + '/signup')
await p.getByLabel('First name').fill('E2E'); await p.getByLabel('Last name').fill('Tester')
await p.getByLabel('Email').fill(email); await p.getByLabel('Password').fill('e2e-password-1')
await p.getByRole('button', { name: 'Create account' }).click()
await p.waitForSelector('text=already exists')
check('duplicate email is explained next to the field', true, await p.locator('p.text-danger').first().textContent())

// tampered token
await p.evaluate(() => localStorage.setItem('onepercent.token', 'tampered.token.value'))
await p.goto(WEB + '/today'); await p.waitForURL('**/login**')
check('tampered token -> login with "session expired"', await p.getByText(/session expired/i).isVisible())

// a token the client can read but the SERVER rejects (bad signature): real 401 path
await p.getByLabel('Email').fill(email); await p.getByLabel('Password').fill('e2e-password-1'); await p.getByRole('button', { name: 'Log in' }).click()
await p.waitForURL('**/today')
const status = await p.evaluate(async () => {
  const t = localStorage.getItem('onepercent.token'); const forged = t.slice(0, -6) + 'AAAAAA'
  const r = await fetch('http://localhost:8084/api/habits/me', { headers: { Authorization: 'Bearer ' + forged } }); return r.status
})
check('server answers 401 (not 500) to a forged token, readable from the browser (CORS ok)', status === 401, 'status ' + status)

// mobile + dark screenshots
const m = await b.newContext({ viewport: { width: 375, height: 800 }, colorScheme: 'dark' }); const mp = await m.newPage()
await mp.goto(WEB + '/login'); await mp.waitForSelector('h1'); await mp.screenshot({ path: S + '/p2-login-375-dark.png' })
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
check('no horizontal scroll at 375px', !overflow)
await b.close()
console.log(results.every(r => r.ok) ? 'ALL PASS' : 'SOME FAILED')
