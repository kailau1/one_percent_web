// A stand-in for the OpenAI API for local end-to-end testing: deterministic, free, offline.
// Run the backend with OPENAI_BASE_URL=http://localhost:8090 to use it.
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
const DELAY = Number(process.env.STUB_DELAY_MS ?? 900)

// Embeddings the backend can match to its themes: built from the backend's own theme vectors
// (themes.json), weighted by keywords in the text. Without the file, falls back to small vectors,
// which the backend treats as "not analysed".
const THEMES_JSON = process.env.THEMES_JSON ?? `${homedir()}/projects/one_percent_spring/src/main/resources/themes.json`
let THEMES = null
try {
  const all = JSON.parse(readFileSync(THEMES_JSON, 'utf8'))
  // like the backend: keep the vectors of the most common length, so every embedding can be compared
  const counts = {}
  for (const v of Object.values(all)) counts[v.length] = (counts[v.length] ?? 0) + 1
  const dims = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0])
  THEMES = Object.fromEntries(Object.entries(all).filter(([, v]) => v.length === dims))
} catch (error) {
  console.error(`\n  !! No themes at ${THEMES_JSON} (${error.message}).\n  !! Embeddings won't match any theme, so Insights will say entries weren't analysed.\n  !! Set THEMES_JSON to the backend's src/main/resources/themes.json.\n`)
}
const KEYWORDS = {
  // whole words (or word starts, for stems like "procrastinat"), so "imperfect" isn't perfectionism
  anxiety: ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panic', 'dread'],
  gratitude: ['grateful', 'gratitude', 'thankful', 'appreciate'],
  confidence: ['confident', 'confidence', 'proud', 'capable'],
  motivation: ['motivated', 'motivation', 'excited', 'inspired'],
  discipline: ['discipline', 'routine', 'consistent', 'every day'],
  'emotional regulation': ['angry', 'upset', 'emotional', 'frustrated', 'breathe'],
  burnout: ['exhausted', 'burnout', 'burnt out', 'tired', 'drained', 'overwhelmed'],
  'self-doubt': ['doubt', 'not good enough', 'imposter', 'insecure', 'failure'],
  procrastination: ['procrastinat', 'putting off', 'put off', 'avoiding'],
  perfectionism: ['perfectionis', 'mistake', 'flawless', 'not right'],
}
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const PATTERNS = Object.fromEntries(Object.entries(KEYWORDS).map(([theme, words]) => [theme, words.map((w) => new RegExp(`\\b${escape(w)}`, 'i'))]))
function embed(text) {
  if (!THEMES) return Array.from({ length: 16 }, (_, i) => ((text.charCodeAt(i % Math.max(text.length, 1)) || 1) % 17) / 17)
  const lower = text.toLowerCase()
  const names = Object.keys(THEMES)
  const weights = names.map((name) => (PATTERNS[name] ?? []).filter((pattern) => pattern.test(lower)).length)
  // no keyword: lean towards two different themes picked from the text, so plain entries still vary
  if (weights.every((w) => w === 0)) {
    let h = 7
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
    const first = h % names.length
    weights[first] = 1
    weights[(first + 1 + ((h >>> 8) % (names.length - 1))) % names.length] = 0.6
  }
  const dims = THEMES[names[0]].length
  const v = new Array(dims).fill(0)
  names.forEach((name, t) => { if (weights[t]) THEMES[name].forEach((x, i) => (v[i] += weights[t] * x)) })
  return v
}
const reply = (res, body) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
http.createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}
    if (req.url.endsWith('/v1/embeddings')) {
      // deterministic: the same text always gets the same vector
      return reply(res, { data: [{ embedding: embed(String(body.input ?? '')) }] })
    }
    if (req.url.endsWith('/v1/chat/completions')) {
      const system = body.messages?.[0]?.content ?? ''
      const user = body.messages?.[1]?.content ?? ''
      let content
      if (/journaling prompt generator/i.test(system)) {
        content = ['What did you avoid today, and what was underneath that?', 'Where did you show up for yourself this week?', 'What would make tomorrow morning ten percent easier?', 'Which habit felt lightest lately, and why?', 'What are you carrying that you could put down?', 'What did you learn about how you work best?'].join('\n')
      } else if (/summarisation assistant/i.test(system)) {
        content = 'Suggested implementation intentions: decide the first tiny step in advance.'
      } else if (/tips/i.test(system)) {
        content = 'Decide tonight what “done” looks like for tomorrow’s hardest task; a clear finish line makes starting easier.'
      } else {
        const about = /report|dread|putting off/i.test(user) ? 'that report' : 'what you described'
        content = `It sounds like starting was the hardest part of ${about}, and once you were in it the rest followed. That gap between dread and doing is worth noticing.\n\nOne thing to try: an **implementation intention**. Tonight, write one line: *"When I sit down at my desk, I will open the document and write one sentence."* Deciding the first move in advance takes the decision out of the morning.`
      }
      return setTimeout(() => reply(res, { choices: [{ message: { content } }] }), DELAY)
    }
    res.writeHead(404); res.end()
  })
}).listen(8090, () => console.log('openai stub on :8090'))
