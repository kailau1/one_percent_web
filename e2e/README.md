# Browser checks

Scripts that drive the real app in a headless browser against the **real backend**: the checks behind
each phase's "done when" list. They are run by hand (or by Claude via the `phase-check` skill), not in CI,
because they need the backend and a database.

| Script | What it proves |
| --- | --- |
| `auth.mjs` | sign up, refresh, log out, wrong password, duplicate email, tampered and forged tokens |
| `journal.mjs` | create, edit, reload, draft restore, failed save + retry, search, ownership, delete |
| `ai.mjs` | tip (and its daily cache), prompts, feedback saved on the entry, AI failure not stored |
| `habits.mjs` | both habit kinds, tick survives reload, failed tick rolls back, edit keeps the tick, delete |
| `responsive.mjs` | no page scrolls sideways at 375, 768, 1024 or 1440px |
| `accessibility.mjs` | axe finds no violations on any page, dialog or drawer, light and dark |
| `resilience.mjs` | keyboard-only use; the backend stopping mid-session and coming back |

**They change data**: `journal.mjs`, `ai.mjs` and `habits.mjs` delete the dev account's entries and habits
first. Only ever run them against the `fyp_dev` database (the default for `scripts/dev-run.sh`).

## Running

One-off setup (kept out of this repo's dependencies on purpose; the browser download is large):

```bash
mkdir -p ~/.cache/op-e2e && cd ~/.cache/op-e2e
npm init -y && npm install playwright @axe-core/playwright
npx playwright install chromium-headless-shell
```

Each run needs three things up:

```bash
node e2e/openai-stub.mjs &                                   # stand-in for OpenAI on :8090 (free, deterministic)
(cd ~/projects/one_percent_spring && AI_BASE_URL=http://localhost:8090/v1 scripts/dev-run.sh) &   # backend on :8084, database fyp_dev
npm run dev &                                                 # this app on :5173
```

Then link the Playwright install next to the scripts (once) and run one:

```bash
ln -s ~/.cache/op-e2e/node_modules e2e/node_modules          # ignored by git
node e2e/auth.mjs
```

Each prints `PASS` / `FAIL` per check and writes screenshots to `e2e/shots/`.
The dev accounts (`web-dev@onepercent.local`, `web-dev-2@onepercent.local`, password `dev-password-1`) must exist;
`auth.mjs` creates a fresh throwaway account each run.
