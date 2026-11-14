import { open, check, summary, S, WEB, API } from './lib.mjs'
const { browser, page: p, token } = await open()
const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
for (const j of await (await fetch(API + '/api/journals/me', { headers: auth })).json()) await fetch(API + '/api/journals/' + j.id, { method: 'DELETE', headers: auth })

// tip of the day
await p.goto(WEB + '/today'); await p.waitForSelector('section[aria-label="Tip of the day"] p.font-serif')
const tip = await p.locator('section[aria-label="Tip of the day"] p.font-serif').textContent()
check('tip of the day loads from the backend', tip.length > 20, tip)
let tipRequests = 0; p.on('request', (r) => { if (r.url().endsWith('/api/ai/tip')) tipRequests++ })
await p.reload(); await p.waitForSelector('section[aria-label="Tip of the day"] p.font-serif')
check('reload reuses the cached tip (no second AI call)', tipRequests === 0, 'requests after reload: ' + tipRequests)

// prompts -> new entry
await p.goto(WEB + '/journal/new')
await p.getByRole('button', { name: 'Suggest something to write about' }).click()
await p.waitForSelector('section[aria-label="Writing prompts"] li button')
const count = await p.locator('section[aria-label="Writing prompts"] li button').count()
check('prompts come back as separate items (backend parsing fix)', count >= 5, count + ' prompts')
await p.screenshot({ path: S + '/p4-prompts.png' })
await p.locator('section[aria-label="Writing prompts"] li button').first().click()
check('picked prompt becomes the title', (await p.getByLabel('Title').inputValue()).length > 10, await p.getByLabel('Title').inputValue())

// new entry: save and get feedback
await p.getByRole('textbox', { name: 'Entry' }).fill('I kept putting off the report again. I think I am dreading how long it will take, so I never begin.')
await p.getByRole('button', { name: 'Save and get feedback' }).click()
await p.waitForSelector('text=Reading your entry')
check('progress is shown while the AI works', true)
await p.waitForSelector('aside[aria-label=Feedback] strong', { timeout: 30000 })
check('feedback arrives and renders markdown', (await p.locator('aside[aria-label=Feedback] strong').first().textContent()).includes('implementation intention'))
const id = p.url().split('/').pop()
await p.screenshot({ path: S + '/p4-feedback-light.png' })

await p.reload(); await p.waitForSelector('aside[aria-label=Feedback] strong')
check('feedback is still there after a reload', true)
const stored = await (await fetch(API + '/api/journals/entry/' + id, { headers: auth })).json()
check('feedback is stored on the entry on the server', (stored.llmResponse ?? '').includes('implementation intention'))

// edit + save keeps feedback
await p.getByRole('textbox', { name: 'Entry' }).press('Control+End'); await p.getByRole('textbox', { name: 'Entry' }).type(' Tomorrow: one sentence first.')
await p.getByRole('button', { name: 'Save changes' }).click(); await p.waitForSelector('text=Saved')
const after = await (await fetch(API + '/api/journals/entry/' + id, { headers: auth })).json()
check('editing the entry keeps its feedback', (after.llmResponse ?? '').includes('implementation intention') && after.content.includes('one sentence first'))

// AI failure is shown, not stored
await p.route('**/api/ai/feedback', (route) => route.abort())
await p.getByRole('button', { name: 'Get fresh feedback' }).click(); await p.waitForSelector('aside[aria-label=Feedback] [role=alert]')
const afterFail = await (await fetch(API + '/api/journals/entry/' + id, { headers: auth })).json()
check('a failed AI request shows an error and leaves stored feedback untouched', afterFail.llmResponse === after.llmResponse, await p.locator('aside[aria-label=Feedback] [role=alert]').textContent())
await p.screenshot({ path: S + '/p4-feedback-error.png' })
await p.unroute('**/api/ai/feedback')

// dark + narrow
const d = await open({ colorScheme: 'dark' }); await d.page.goto(WEB + '/journal/' + id); await d.page.waitForSelector('aside[aria-label=Feedback] strong'); await d.page.screenshot({ path: S + '/p4-feedback-dark.png' }); await d.browser.close()
const m = await open({ width: 375, height: 800 }); await m.page.goto(WEB + '/journal/' + id); await m.page.waitForSelector('aside[aria-label=Feedback] strong'); await m.page.screenshot({ path: S + '/p4-feedback-375.png', fullPage: true })
check('no horizontal scroll at 375px', !(await m.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))); await m.browser.close()
await browser.close(); summary()
