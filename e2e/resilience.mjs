import { execSync, spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { open, check, summary, S, WEB, API } from './lib.mjs'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const backendUp = async () => { try { return (await fetch(API + '/api/habits/me')).status === 401 } catch { return false } }

// ---- 1. keyboard only: log in, write an entry, tick a habit ----
{
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage()
  await p.goto(WEB + '/login'); await p.waitForSelector('h1')
  await p.keyboard.type('web-dev@onepercent.local'); await p.keyboard.press('Tab'); await p.keyboard.type('dev-password-1'); await p.keyboard.press('Enter')
  await p.waitForURL('**/today')
  check('keyboard: log in with Tab + Enter (email is focused on load)', true)
  await p.waitForSelector('ul[aria-label="Today’s habits"]')
  await p.keyboard.press('n'); await p.waitForURL('**/journal/new')
  check('keyboard: N opens a new entry', true)
  await p.waitForSelector('textarea[aria-label="Entry"]:focus')
  await p.keyboard.type('Typed entirely from the keyboard.'); await p.keyboard.press('Control+s'); await p.waitForURL(/\/journal\/[0-9a-f]{24}$/)
  check('keyboard: type and Ctrl+S saves', true)
  await p.goto(WEB + '/habits'); await p.waitForSelector('ul[aria-label="Your habits"]')
  const box = p.getByRole('checkbox').first(); const before = await box.getAttribute('aria-checked')
  await box.focus(); await p.keyboard.press('Space'); await sleep(600)
  check('keyboard: Space ticks a habit', (await box.getAttribute('aria-checked')) !== before)
  await p.getByRole('button', { name: /open details$/ }).first().focus(); await p.keyboard.press('Enter'); await p.waitForSelector('text=Current streak')
  await p.keyboard.press('Escape'); await sleep(300)
  check('keyboard: Enter opens the habit drawer and Escape closes it', !(await p.getByText('Current streak').isVisible().catch(() => false)))
  const focusVisible = await p.evaluate(() => /open details$/.test(document.activeElement?.textContent ?? ''))
  check('keyboard: focus returns to the habit after closing the drawer', Boolean(focusVisible))
  await b.close()
}

// ---- 2. backend goes down mid-session, then comes back ----
{
  const { browser, page: p } = await open()
  await p.goto(WEB + '/journal/new'); await p.waitForSelector('textarea[aria-label="Entry"]')
  await p.getByRole('textbox', { name: 'Entry' }).fill('Written just before the server went away.')
  execSync('pkill -f "one_percent[.]Application" || true'); execSync('pkill -f "spring-boot[:]run" || true'); await sleep(2500)
  check('backend is really down', !(await backendUp()))

  await p.getByRole('button', { name: 'Save entry' }).click(); await p.waitForSelector('[role=alert]')
  check('server down: save shows "can’t reach" and keeps the text', /reach/.test(await p.getByRole('alert').first().textContent()) && (await p.getByRole('textbox', { name: 'Entry' }).inputValue()).includes('server went away'))
  await p.screenshot({ path: S + '/final-server-down-editor.png' })
  await p.reload(); await p.waitForSelector('text=Restored what you were writing')
  check('server down: the draft survives a reload', true)

  const t = await p.context().newPage(); await t.goto(WEB + '/today'); await t.waitForSelector('[role=alert]'); await sleep(1500)
  const alerts = await t.getByRole('alert').count()
  check('server down: Today shows one banner with one retry, not empty lists', alerts === 1 && !(await t.getByText('No habits yet').isVisible().catch(() => false)), alerts + ' alerts')
  await t.screenshot({ path: S + '/final-server-down-today.png' })

  spawn('bash', ['-c', 'cd ${BACKEND_DIR:-~/projects/one_percent_spring} && OPENAI_BASE_URL=http://localhost:8090 setsid nohup scripts/dev-run.sh > /tmp/op-backend.log 2>&1 &'], { detached: true, stdio: 'ignore' }).unref()
  for (let i = 0; i < 60 && !(await backendUp()); i++) await sleep(2000)
  check('backend is back up', await backendUp())

  await t.getByRole('button', { name: 'Try again' }).first().click(); await t.waitForSelector('ul[aria-label="Today’s habits"]', { timeout: 20000 })
  check('server back: "Try again" on Today recovers', true)
  await p.getByRole('button', { name: 'Save entry' }).click(); await p.waitForURL(/\/journal\/[0-9a-f]{24}$/, { timeout: 20000 })
  check('server back: the restored draft saves', true)
  await browser.close()
}
summary()
