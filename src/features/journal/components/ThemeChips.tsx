import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Plus, X } from 'lucide-react'
import type { JournalEntry } from '@/api/types'
import { useSetEntryThemes } from '../hooks'
import { themeLabel } from '../themes'

/**
 * The themes an entry is about, as small chips the user can correct: remove one that's wrong, add
 * one that's missing. Kept quiet so the writing stays the focus. Hidden for servers that don't send
 * themes yet.
 */
export function ThemeChips({ entry }: { entry: JournalEntry }) {
  const setThemes = useSetEntryThemes(entry.id)
  if (!entry.themes) return null

  const themes = entry.themes
  const addable = (entry.themeChoices ?? []).filter((theme) => !themes.includes(theme))

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Themes" role="group">
      {themes.length === 0 && <span className="text-sm text-ink-faint">No themes</span>}
      {themes.map((theme) => (
        <span
          key={theme}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-0.5 pl-3 pr-1 text-sm text-ink-muted"
        >
          {themeLabel(theme)}
          <button
            type="button"
            onClick={() => setThemes.mutate(themes.filter((t) => t !== theme))}
            aria-label={`Remove theme ${themeLabel(theme)}`}
            className="grid size-5 place-items-center rounded-full text-ink-faint hover:bg-sunken hover:text-ink"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </span>
      ))}
      {addable.length > 0 && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm text-ink-muted hover:bg-sunken hover:text-ink"
            >
              <Plus aria-hidden className="size-3.5" />
              Add theme
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={6} className="z-50 min-w-48 rounded-card border border-line bg-surface p-1.5 shadow-lg">
              {addable.map((theme) => (
                <DropdownMenu.Item
                  key={theme}
                  onSelect={() => setThemes.mutate([...themes, theme])}
                  className="cursor-pointer rounded-control px-3 py-1.5 text-[0.9375rem] outline-none data-[highlighted]:bg-sunken"
                >
                  {themeLabel(theme)}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  )
}
