import * as RadixDialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** One or two sentences explaining what will happen. */
  description?: ReactNode
  /** The buttons, right-aligned. Put the safest choice first. */
  actions: ReactNode
  children?: ReactNode
}

/** A centred modal for decisions. Focus is trapped inside and Escape closes it (via Radix). */
export function Dialog({ open, onOpenChange, title, description, actions, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <RadixDialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-line bg-surface p-6 shadow-xl"
        >
          <RadixDialog.Title className="font-serif text-2xl">{title}</RadixDialog.Title>
          {description && <RadixDialog.Description className="mt-2 text-ink-muted">{description}</RadixDialog.Description>}
          {children}
          <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
