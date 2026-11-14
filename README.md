# One Percent: Web

The desktop-first web app for **One Percent**, a journaling and habit-tracking app with personalised AI
feedback. It talks to the same Spring Boot API as the mobile app.

- Backend: [fyp_one_percent_spring](https://github.com/kailau1/fyp_one_percent_spring)
- Mobile app: [fyp_one_percent](https://github.com/kailau1/fyp_one_percent)

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Radix UI primitives · React Router · TanStack Query ·
React Hook Form + Zod · Vitest + Testing Library + MSW · oxlint + Prettier

## Running locally

1. Start the backend (see its README). From WSL: `scripts/dev-run.sh` in the backend repo. It listens on `http://localhost:8084`.
2. In this repo:
   ```bash
   npm install
   cp .env.example .env   # VITE_API_URL=http://localhost:8084
   npm run dev            # http://localhost:5173
   ```

The dev server must stay on port 5173: the backend only accepts browser requests from the origins in its
`app.cors.allowed-origins` setting.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run check` | Lint, type-check and test: run this before committing |
| `npm test` / `npm run test:watch` | Tests once / in watch mode |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run format` | Format `src/` with Prettier |

## How the code is organised

```
src/
  app/         App, routes, providers, error boundary
  api/         client.ts (every request goes through apiRequest), session (login token), types (DTOs)
  features/    one folder per feature: auth, journal, habits, today, account
  components/  shared pieces: ui/ primitives, layout/ (AppShell, Sidebar, Page), ErrorState, EmptyState
  lib/         small helpers: storage, theme, cn
  test/        test setup, the MSW fake backend, renderWithProviders
```

Data flows one way: **page → feature hook (TanStack Query) → feature `api.ts` → `api/client.ts` → backend.**
Components never call `fetch` themselves.

Design tokens (colours, fonts, radii) live in `src/index.css`; components use the token names
(`bg-paper`, `text-ink`, `bg-action`…) and never raw colours, which is what makes dark mode work.
