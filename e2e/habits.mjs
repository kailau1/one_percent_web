import { open, check, summary, S, WEB, API } from './lib.mjs'
const { browser, page: p, token } = await open()
const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
const api = async (path, init = {}) => { const r = await fetch(API + path, { ...init, headers: auth }); const t = await r.text(); return { status: r.status, body: t ? JSON.parse(t) : null } }
for (const h of (await api('/api/habits/me')).body) await api('/api/habits/delete/' + h.id, { method: 'DELETE' })

await p.goto(WEB + '/habits'); await p.waitForSelector('text=No habits yet')
check('empty state invites a first habit', true)

// simple habit
await p.getByRole('button', { name: 'Add your first habit' }).click()
await p.getByLabel('Habit', { exact: true }).fill('Read 10 pages'); await p.getByLabel('Note (optional)').fill('Before bed')
await p.getByRole('radio', { name: 'Mint' }).click()
await p.screenshot({ path: S + '/p5-form.png' })
await p.getByRole('button', { name: 'Add habit' }).click(); await p.waitForSelector('ul[aria-label="Your habits"] >> text=Read 10 pages')
// when -> then habit
await p.getByRole('button', { name: 'New habit' }).click()
await p.getByRole('radio', { name: /When → then/ }).check({ force: true })
await p.getByLabel('When I…').fill('pour my morning coffee'); await p.getByLabel('I will…').fill('write one line in my journal')
await p.getByRole('radio', { name: 'Peach' }).click(); await p.getByRole('button', { name: 'Add habit' }).click()
await p.waitForSelector('text=When I pour my morning coffee, I will write one line in my journal')
await p.getByRole('button', { name: 'New habit' }).click(); await p.getByLabel('Habit', { exact: true }).fill('Morning run'); await p.getByRole('radio', { name: 'Rose' }).click(); await p.getByRole('button', { name: 'Add habit' }).click()
await p.waitForSelector('ul[aria-label="Your habits"] >> text=Morning run')
const habits = (await api('/api/habits/me')).body
check('both kinds of habit are created on the server', habits.length === 3 && habits.some(h => h.habitType === 'trigger-action' && h.trigger === 'pour my morning coffee'), habits.map(h => h.habitType).join(','))

// tick, reload -> persists (backend B6)
const read = habits.find(h => h.habitName === 'Read 10 pages')
await p.getByRole('checkbox', { name: 'Read 10 pages: done today' }).click()
await p.waitForSelector('text=1 of 3 done today'); await p.waitForSelector('ul[aria-label="Your habits"] >> text=1 day')
await p.reload(); await p.waitForSelector('ul[aria-label="Your habits"]')
check('a tick survives a page reload', await p.getByRole('checkbox', { name: 'Read 10 pages: done today' }).isChecked())
check('streak badge shows after ticking', await p.locator('ul[aria-label="Your habits"] >> text=1 day').isVisible())
await p.screenshot({ path: S + '/p5-habits-light.png' })

// failed toggle rolls back
await p.route('**/api/habit-history/complete/**', (r) => r.abort())
await p.getByRole('checkbox', { name: 'Morning run: done today' }).click()
await p.waitForSelector('text=/reach the One Percent server/')
await p.waitForFunction(() => document.querySelector('[aria-label="Morning run: done today"]')?.getAttribute('aria-checked') === 'false')
check('a failed tick rolls back with a message', true)
await p.unroute('**/api/habit-history/complete/**')

// detail drawer with real history: backfill is impossible via the API (by design), so check today's numbers
await p.getByRole('button', { name: /^Read 10 pages.*open details$/ }).click()
await p.waitForSelector('text=Current streak')
const current = await p.locator('dt:has-text("Current streak") + dd').textContent()
check('drawer shows streaks from the server history', current.trim().startsWith('1'), current)
await p.waitForTimeout(300); await p.screenshot({ path: S + '/p5-detail-light.png' })

// edit keeps completion
await p.getByRole('button', { name: 'Edit' }).click(); await p.getByLabel('Habit', { exact: true }).fill('Read 12 pages'); await p.getByRole('button', { name: 'Save changes' }).click()
await p.waitForSelector('ul[aria-label="Your habits"] >> text=Read 12 pages')
const afterEdit = (await api('/api/habits/me')).body.find(h => h.id === read.id)
check('editing a habit keeps it ticked', afterEdit.habitName === 'Read 12 pages' && afterEdit.completed === true)

// ownership from a second account
const other = await (await fetch(API + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'web-dev-2@onepercent.local', password: 'dev-password-1' }) })).json()
const r = await fetch(API + '/api/habit-history/complete/' + read.id, { method: 'POST', headers: { Authorization: 'Bearer ' + other.token } })
check("another user can't tick this habit", r.status === 404, 'status ' + r.status)

// delete
const run = habits.find(h => h.habitName === 'Morning run')
await p.keyboard.press('Escape'); await p.getByRole('button', { name: /^Morning run.*open details$/ }).click()
await p.getByRole('button', { name: 'Delete' }).click(); await p.getByRole('dialog', { name: 'Delete this habit?' }).getByRole('button', { name: 'Delete habit' }).click()
await p.waitForFunction(() => !document.body.textContent.includes('Morning run'))
check('delete removes the habit on the server', !(await api('/api/habits/me')).body.some(h => h.id === run.id))

const d = await open({ colorScheme: 'dark' }); await d.page.goto(WEB + '/habits'); await d.page.waitForSelector('ul[aria-label="Your habits"]'); await d.page.getByRole('button', { name: /^Read 12 pages.*open details$/ }).click(); await d.page.waitForSelector('text=Current streak'); await d.page.waitForTimeout(300); await d.page.screenshot({ path: S + '/p5-detail-dark.png' }); await d.browser.close()
const m = await open({ width: 375, height: 800 }); await m.page.goto(WEB + '/habits'); await m.page.waitForSelector('ul[aria-label="Your habits"]'); await m.page.screenshot({ path: S + '/p5-habits-375.png' })
check('no horizontal scroll at 375px', !(await m.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))); await m.browser.close()
await browser.close(); summary()
