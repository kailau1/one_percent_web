---
name: web-feature
description: How to build a feature, page or data-backed component in the One Percent web app (one_percent_web) - the feature-folder layout, TanStack Query hooks, loading/empty/error states, optimistic updates, and MSW-backed tests. Use this whenever you add or change anything under src/features, add an API call, a query or mutation, a new route or page, or a component that shows server data, even for a small change, so every screen handles failure the same way and ships with tests.
---

# Building a feature in one_percent_web

The app should never show a blank area, a spinner that never ends, or lose something the user typed.
Most of this skill exists to make those three failures hard to write.

## Shape of a feature

```
src/features/<feature>/
  api.ts          plain async functions, one per endpoint, calling apiRequest (no React)
  hooks.ts        TanStack Query hooks wrapping api.ts (useX queries, useSaveX mutations)
  <Feature>Page.tsx        the route component: composes hooks + components
  components/     pieces used only by this feature
  *.test.tsx      next to what they test
```

Data flows one way: page → hook → `api.ts` → `src/api/client.ts`. Components never call `fetch` or
`apiRequest` directly: that keeps them testable and keeps error handling in one place.

Add types for request/response bodies to `src/api/types.ts`, read from the backend's DTO (not guessed),
and register the page in `src/app/routes.tsx`.

## api.ts and hooks.ts

```ts
// api.ts
export const listJournals = () => apiRequest<JournalEntry[]>('/api/journals/me').then((d) => d ?? [])

// hooks.ts
export const journalKeys = { all: ['journals'] as const }
export function useJournals() {
  return useQuery({ queryKey: journalKeys.all, queryFn: listJournals })
}
export function useDeleteJournal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteJournal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalKeys.all }),
  })
}
```

- Export a `<feature>Keys` object; never write a query key as a loose string elsewhere.
- `apiRequest` attaches the login token and announces expired sessions itself. Pass `auth: false` only
  for login/register. Pass `timeoutMs: AI_TIMEOUT_MS` for anything that calls OpenAI.
- Retries are decided globally in `src/api/queryClient.ts` (only when the server was unreachable or 5xx).

## Every data view has four states

```tsx
const { data, error, isPending, refetch, isFetching } = useJournals()

if (isPending) return <Skeleton … />                       // shaped like the content, not a spinner
if (error && !data) return <ErrorState error={error} onRetry={refetch} retrying={isFetching} />
return (
  <>
    {error && <ErrorState compact error={error} onRetry={refetch} />}   // stale data stays visible
    {data.length === 0 ? <EmptyState title="…" action={…}>…</EmptyState> : <List … />}
  </>
)
```

An empty state says what will appear and offers the action that creates the first item. Error copy
comes from `ApiError`; don't write new error strings in components.

## Mutations

- Failure → `toast.error(getErrorMessage(error))` (sonner), unless the form shows it inline.
- Anything the user typed survives a failed save: keep the form/editor open with the text intact, and
  for long text (journal entries) keep a draft in `storage` until the save succeeds.
- Quick toggles (ticking a habit) are optimistic with rollback:
  `onMutate` (cancel queries, snapshot, write the new value with `setQueryData`) →
  `onError` (restore the snapshot + toast) → `onSettled` (invalidate).
- Disable the submit control while `isPending` so a slow request can't be sent twice.

## Forms

React Hook Form + Zod schema (`zodResolver`). Labels are real `<label>`s; errors sit under their field
and are linked with `aria-describedby`; server errors that aren't about one field go above the submit button.

## Tests (required with the feature)

- Add the endpoint's default response to `src/test/msw/handlers.ts`, matching the real backend's status
  codes and body shape; override per test with `server.use(...)`.
- Render with `renderWithProviders(<X />)` or `renderRoutes(routes, { route })` from `src/test/`.
- Query by role and name (`getByRole('button', { name: 'Save entry' })`), as a user would find things.
- Cover at least: the happy path; the server being unreachable (`HttpResponse.error()`) showing a retry;
  the empty state; and for mutations, that failure keeps the user's input.
- Unmocked requests fail the test on purpose (`onUnhandledFrame: 'error'`).

Then run `npm run check`, and follow the `feature-workflow` skill to commit.
If the feature needed a backend change, use `spring-endpoint` there and `api-contract-sync` after.
