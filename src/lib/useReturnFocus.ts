import { useEffect, useRef } from 'react'

/**
 * For dialogs and drawers opened by state rather than by a Radix trigger: remembers what had
 * focus when it opened and gives a handler that puts focus back there when it closes, so
 * keyboard users carry on from where they were instead of from the top of the page.
 *
 * Usage: <Dialog.Content onCloseAutoFocus={useReturnFocus(open)} />
 */
export function useReturnFocus(open: boolean) {
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      opener.current = document.activeElement
    }
  }, [open])

  return (event: Event) => {
    const element = opener.current
    if (element && element.isConnected) {
      event.preventDefault()
      element.focus()
    }
  }
}
