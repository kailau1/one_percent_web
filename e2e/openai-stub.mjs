// A stand-in for the OpenAI API for local end-to-end testing: deterministic, free, offline.
// Run the backend with OPENAI_BASE_URL=http://localhost:8090 to use it.
import http from 'node:http'
const DELAY = Number(process.env.STUB_DELAY_MS ?? 900)
const reply = (res, body) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
http.createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}
    if (req.url.endsWith('/v1/embeddings')) {
      // a small deterministic vector derived from the text
      const text = String(body.input ?? '')
      const v = Array.from({ length: 16 }, (_, i) => ((text.charCodeAt(i % Math.max(text.length, 1)) || 1) % 17) / 17)
      return reply(res, { data: [{ embedding: v }] })
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
