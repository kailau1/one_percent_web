import { useEntries } from './hooks'

/** The right-hand pane on wide screens when no entry is open. */
export function JournalIndex() {
  const { data: entries } = useEntries()
  if (!entries || entries.length === 0) return null
  return (
    <div className="flex h-full items-center justify-center p-12">
      <p className="max-w-xs text-center text-ink-muted">
        Choose an entry to read it, or press <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-sm">N</kbd> to start a new one.
      </p>
    </div>
  )
}
