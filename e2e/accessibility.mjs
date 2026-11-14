import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'
import { open, WEB, API } from './lib.mjs'
let total = 0
const report = (label, violations) => {
  for (const v of violations) {
    total++
    console.log(`VIOLATION [${label}] ${v.id} (${v.impact}): ${v.help}`)
    for (const n of v.nodes.slice(0, 3)) console.log('    ' + n.target.join(' ') + '  ' + (n.any[0]?.message ?? n.failureSummary?.split('\n')[1] ?? '').slice(0, 150))
  }
}
for (const colorScheme of ['light', 'dark']) {
  // signed-out pages
  const b = await chromium.launch(); const c = await b.newContext({ colorScheme, viewport: { width: 1440, height: 900 } }); const lp = await c.newPage()
  for (const path of ['/login', '/signup']) { await lp.goto(WEB + path); await lp.waitForTimeout(2500); report(`${colorScheme} ${path}`, (await new AxeBuilder({ page: lp }).analyze()).violations) }
  await b.close()
  // signed-in pages
  const { browser, page, token } = await open({ colorScheme })
  const entry = (await (await fetch(API + '/api/journals/me', { headers: { Authorization: 'Bearer ' + token } })).json())[0]
  for (const path of ['/today', '/journal', '/journal/new', '/journal/' + entry.id, '/habits', '/account']) {
    await page.goto(WEB + path); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1200)
    report(`${colorScheme} ${path.replace(/[0-9a-f]{24}/, ':id')}`, (await new AxeBuilder({ page }).analyze()).violations)
  }
  // dialogs and drawers
  await page.goto(WEB + '/habits'); await page.waitForSelector('ul[aria-label="Your habits"]')
  await page.getByRole('button', { name: 'New habit' }).click(); await page.waitForTimeout(400)
  report(`${colorScheme} habit form dialog`, (await new AxeBuilder({ page }).analyze()).violations)
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: /open details$/ }).first().click(); await page.waitForSelector('text=Current streak'); await page.waitForTimeout(400)
  report(`${colorScheme} habit drawer`, (await new AxeBuilder({ page }).analyze()).violations)
  await browser.close()
}
console.log(total === 0 ? 'NO VIOLATIONS' : `${total} violation(s)`)
