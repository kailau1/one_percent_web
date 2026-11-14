import { useLayoutEffect, type RefObject } from 'react'

/** Grows a textarea to fit its text, so the page scrolls rather than a small box inside it. */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [ref, value])
}
