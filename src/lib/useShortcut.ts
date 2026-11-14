import { useEffect, useRef } from 'react'

interface ShortcutOptions {
  /** Require Ctrl (Windows/Linux) or Cmd (Mac). */
  mod?: boolean
  /** Fire even while the user is typing in a field (for things like Ctrl+S). */
  whileTyping?: boolean
  enabled?: boolean
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Runs `handler` when `key` is pressed. Single-letter shortcuts are ignored while typing. */
export function useShortcut(key: string, handler: () => void, { mod = false, whileTyping = false, enabled = true }: ShortcutOptions = {}) {
  // Always call the newest handler without re-subscribing the key listener on every render.
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (mod !== (event.ctrlKey || event.metaKey)) return
      if (event.altKey) return
      if (!whileTyping && isTyping(event.target)) return
      event.preventDefault()
      latest.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, mod, whileTyping, enabled])
}
