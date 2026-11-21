import { useEffect, useState } from 'react'

/** `value`, but only once it has stopped changing for `delayMs` (e.g. search text, so each keystroke isn't a request). */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
