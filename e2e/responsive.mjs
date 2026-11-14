import { open, check, summary, WEB, API } from './lib.mjs'
// Every signed-in page, at phone, tablet and desktop widths: nothing may scroll sideways.
const first = await open(); const auth = { Authorization: 'Bearer ' + first.token }
const entry = (await (await fetch(API + '/api/journals/me', { headers: auth })).json())[0]; await first.browser.close()
const pages = ['/today', '/journal', '/journal/new', entry ? '/journal/' + entry.id : null, '/habits', '/account'].filter(Boolean)
for (const width of [375, 768, 1024, 1440]) {
  const { browser, page } = await open({ width, height: 800 })
  for (const path of pages) {
    await page.goto(WEB + path); await page.waitForLoadState('networkidle'); await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(`${width}px ${path.replace(/[0-9a-f]{24}/, ':id')}`, overflow <= 0, overflow > 0 ? `overflows by ${overflow}px` : '')
  }
  await browser.close()
}
summary()
