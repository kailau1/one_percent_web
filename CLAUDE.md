# CLAUDE.md

One Percent web app: React 19 + TypeScript + Vite + Tailwind 4, desktop-first.
Backend: `~/projects/one_percent_spring` (remote `fyp_one_percent_spring`). Mobile: `~/projects/one_percent_mobile`.
The build plan and phases: `~/.claude/plans/pasted-content-id-8bd5-i-d-like-iterative-matsumoto.md`.

## Git workflow (always follow; see the `feature-workflow` skill)

- Never work on `main`: branch `feature/<kebab-description>` (`fix/…`, `test/…`) from an up-to-date `main`.
- One commit per feature, as soon as it's finished and `npm run check` passes. Push after every commit.

## Commands

- `npm run check`: lint (oxlint) + typecheck + tests. The gate before every commit.
- `npm run dev`: http://localhost:5173 (port is fixed; the backend's CORS allow-list expects it).
- Backend for manual testing: `~/projects/one_percent_spring/scripts/dev-run.sh` (database `fyp_dev`;
  dev accounts `web-dev@onepercent.local` / `web-dev-2@onepercent.local`, password `dev-password-1`).

## Conventions (details in the `web-feature` and `ui-polish` skills in `.claude/skills/`)

- Requests only through `apiRequest` in `src/api/client.ts`; it throws `ApiError` and attaches the login token.
- Server data lives in TanStack Query hooks inside each feature folder; no global store.
- Every data view handles loading (skeleton), empty (`EmptyState`), and error (`ErrorState` with retry).
- Colours, fonts and radii come from the tokens in `src/index.css`; never hard-code a hex value in a component.
- Tests sit next to the code (`*.test.tsx`), use `renderWithProviders`/`renderRoutes`, and fake the API with
  MSW handlers that match what the real backend returns (see the `api-contract-sync` skill).
