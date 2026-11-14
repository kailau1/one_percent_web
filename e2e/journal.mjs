import { open, check, summary, S, WEB, API } from './lib.mjs'
const { browser, page: p, token } = await open()
const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
// start from a clean journal for this account
for (const j of await (await fetch(API + '/api/journals/me', { headers: auth })).json()) await fetch(API + '/api/journals/' + j.id, { method: 'DELETE', headers: auth })

await p.goto(WEB + '/journal'); await p.waitForSelector('text=Your journal is empty')
check('empty journal shows an invitation', true)
await p.screenshot({ path: S + '/p3-empty.png' })

await p.getByRole('link', { name: 'Write your first entry' }).click()
await p.getByLabel('Title').fill('First day with the web app')
await p.getByRole('textbox', { name: 'Entry' }).fill('I spent the morning putting off a report I have been dreading. Once I finally opened it, the first paragraph took ten minutes and the rest followed.\n\nTomorrow I want to start with the hardest thing before checking messages.')
await p.getByRole('button', { name: 'Save entry' }).click()
await p.waitForURL(/\/journal\/[0-9a-f]{24}$/)
check('create saves to the real backend and opens the entry', true, p.url())
const id = p.url().split('/').pop()

await p.goto(WEB + '/journal/new')
await p.getByLabel('Title').fill('Evening walk'); await p.getByRole('textbox', { name: 'Entry' }).fill('Short walk after dinner. Noticed I was calmer afterwards.')
await p.keyboard.press('Control+s'); await p.waitForURL(/\/journal\/[0-9a-f]{24}$/)
check('Ctrl+S saves a new entry', true)

await p.goto(WEB + '/journal/' + id); await p.waitForSelector('[aria-label="Title"]')
await p.getByRole('textbox', { name: 'Entry' }).press('End'); await p.getByRole('textbox', { name: 'Entry' }).type(' Edited on the web.')
await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForSelector('text=Saved')
const server = await (await fetch(API + '/api/journals/entry/' + id, { headers: auth })).json()
check('edit is stored on the server', server.content.includes('Edited on the web.'))
await p.screenshot({ path: S + '/p3-entry-light.png' })

await p.reload(); await p.waitForSelector('[aria-label="Title"]')
check('entry survives a reload', (await p.getByLabel('Title').inputValue()) === 'First day with the web app')

// draft survives a reload
await p.getByRole('textbox', { name: 'Entry' }).type(' DRAFT TEXT'); await p.waitForTimeout(700); await p.reload()
await p.waitForSelector('text=Restored what you were writing')
check('unsaved draft is restored after a reload', (await p.getByRole('textbox', { name: 'Entry' }).inputValue()).includes('DRAFT TEXT'))
await p.getByRole('button', { name: 'Discard it' }).click()

// backend down: save keeps text
await p.getByRole('textbox', { name: 'Entry' }).type(' Written while offline.')
await p.route('**/api/journals/entry', (route) => route.abort())
await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForSelector('[role=alert]')
check('failed save keeps the text and shows a retry', (await p.getByRole('textbox', { name: 'Entry' }).inputValue()).includes('Written while offline.'), await p.getByRole('alert').textContent())
await p.screenshot({ path: S + '/p3-save-failed.png' })
await p.unroute('**/api/journals/entry')
await p.getByRole('button', { name: 'Try again' }).click(); await p.waitForSelector('text=Saved')
check('retry succeeds once the server is back', true)

// search
await p.getByRole('searchbox').fill('walk'); await p.waitForTimeout(200)
check('search filters the list', (await p.getByRole('navigation', { name: 'Entries' }).getByRole('link').count()) === 1)
await p.getByRole('searchbox').fill('')

// ownership from the browser: another user's entry id is "not found"
const other = await (await fetch(API + '/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'web-dev-2@onepercent.local', password: 'dev-password-1' }) })).json()
const r = await fetch(API + '/api/journals/entry/' + id, { headers: { Authorization: 'Bearer ' + other.token } })
check("another user can't read this entry", r.status === 404, 'status ' + r.status)

// delete
await p.getByRole('button', { name: 'Delete entry' }).click(); await p.getByRole('dialog').screenshot({ path: S + '/p3-delete-dialog.png' })
await p.getByRole('dialog').getByRole('button', { name: 'Delete entry' }).click(); await p.waitForURL('**/journal')
check('delete removes the entry', (await fetch(API + '/api/journals/entry/' + id, { headers: auth })).status === 404)

await p.setViewportSize({ width: 375, height: 800 }); await p.goto(WEB + '/journal'); await p.waitForSelector('nav[aria-label=Entries]')
await p.screenshot({ path: S + '/p3-list-375.png' })
check('no horizontal scroll at 375px', !(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)))
await browser.close(); summary()
