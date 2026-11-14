---
name: ui-polish
description: The visual language and quality bar for the One Percent web app - design tokens, typography, layout, dark mode, responsive breakpoints, motion and accessibility. Use this whenever you build, restyle or review any UI in one_percent_web (a page, component, form, empty state, dialog), choose a colour, font size, spacing or radius, or are asked to make something "look better" or "more polished", so new screens match the existing ones instead of drifting into generic defaults.
---

# One Percent: visual language

**Concept: a ledger of days.** Calm, cool "morning" tones; a reading typeface for the user's own words;
quiet chrome. The one expressive element is anything that shows days adding up (the year ribbon, streaks).
Spend boldness there and keep everything else restrained.

## Tokens (defined in `src/index.css`; use the names, never raw values)

| Token | Use |
|---|---|
| `paper` | page background |
| `surface` | cards, sidebar, inputs |
| `sunken` | hover fills, skeletons, wells |
| `ink` / `ink-muted` / `ink-faint` | text: primary / secondary / hints and disabled |
| `line` | hairline borders and dividers |
| `action` / `action-hover` / `on-action` | anything clickable: buttons, links, focus ring |
| `sky` / `sky-wash` | brand blue for marks and illustrations; wash for the selected nav item and selection |
| `sunrise` / `sunrise-wash` | **only** progress: streaks, completed, "done today" |
| `danger` / `danger-wash` | destructive actions and errors |
| `warning-wash` / `warning-line` | offline / can't-connect notices |

Habit colours are user data (pastels chosen per habit) and are the only raw colours in the UI; put ink
text on them, never white.

Why semantic names: dark mode is just a second set of values for the same names, so a component written
with tokens works in both themes without a single `dark:` class. If you reach for `dark:`, a token is missing.

## Type

- `font-sans` (Figtree) for interface text. `font-serif` (Literata) for the user's writing, dates, page
  titles and empty-state titles: it marks "content" versus "controls".
- Page title: `font-serif text-4xl font-medium tracking-tight` (via `<Page>`). Section heading:
  `font-serif text-2xl`. Body: default. Secondary: `text-ink-muted`. Small print: `text-sm`.
- Journal text: `font-serif text-lg leading-8`, column `max-w-prose` (~68 characters).
- Sentence case everywhere. No all-caps labels, no letter-spaced eyebrows above headings, no monospace
  for data, no arrows appended to buttons or links.

## Layout and shape

- Left-aligned. Pages use `<Page title action>` for consistent padding and headings.
- Separate with space and `border-line` hairlines; shadows are for things that float (dialogs, menus).
- Radius follows importance: `rounded-control` (buttons, inputs) < `rounded-card` < `rounded-panel`
  (dialogs, large panels); `rounded-full` only for pills and avatars.
- Don't turn every group of content into an identical card; a list with dividers is often calmer.

## Responsive

Design at 1440 first, then check 1024 and 375.
- ≥1024 (`lg`): sidebar visible; two-pane layouts side by side.
- <1024: top bar + drawer; two panes become list → detail routes.
- 375: no horizontal scroll, 16–20px side padding, tap targets ≥ 40px.

## Motion

Only when it answers an action (a tick drawing, a panel opening) plus one page-load moment at most.
No entrance animations on sections, no hover lifts on cards. `prefers-reduced-motion` is honoured globally.

## Accessibility floor

- Everything works by keyboard; the global `:focus-visible` ring is never removed.
- Icon-only buttons have `aria-label`; decorative icons have `aria-hidden`.
- Inputs have visible `<label>`s. Errors use `role="alert"`; status notes use `role="status"`.
- Dialogs/drawers/menus use the Radix primitives (focus trap, Escape, ARIA come free).
- Text contrast ≥ 4.5:1: `ink-faint` is for hints only, never essential text.

## Copy

Plain verbs, sentence case. A button says what it does ("Save entry", not "Submit") and keeps that word
through the flow ("Entry saved"). Errors say what happened and what to do; they don't apologise.
Empty states invite the first action.

## Check your work by looking at it

Take screenshots and actually read them (light and dark, 1440 and 375) before calling UI done:

```bash
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars \
  --window-size=1440,900 --virtual-time-budget=4000 --screenshot='C:\path\out.png' http://localhost:5173/today
```
(The headless browser follows the Windows theme; for the other theme, the app reads `onepercent.theme`
from localStorage.) Then remove one thing that isn't earning its place.
