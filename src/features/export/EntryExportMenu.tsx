import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Download, FileText, Printer } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { JournalEntry } from '@/api/types'
import { Button } from '@/components/ui/button'
import { downloadText } from '@/lib/download'
import { entryFileName, entryToMarkdown } from './markdown'

const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-[0.9375rem] outline-none data-[highlighted]:bg-sunken [&_svg]:size-4'

/**
 * Export one entry, as it was last saved. A menu keeps the editor's toolbar to the actions used
 * every day; the keyboard and screen-reader behaviour come from Radix.
 */
export function EntryExportMenu({ entry }: { entry: JournalEntry }) {
  const navigate = useNavigate()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Export entry">
          <Download aria-hidden />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-card border border-line bg-surface p-1.5 shadow-lg"
        >
          <DropdownMenu.Item
            className={itemClass}
            onSelect={() => downloadText(entryFileName(entry), entryToMarkdown(entry, { includeFeedback: true }) + '\n')}
          >
            <FileText aria-hidden />
            Download as Markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => navigate(`/print?entry=${encodeURIComponent(entry.id)}`)}>
            <Printer aria-hidden />
            Save as PDF
          </DropdownMenu.Item>
          <DropdownMenu.Label className="px-3 pb-1.5 pt-1 text-xs text-ink-muted">Exports the last saved version</DropdownMenu.Label>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
