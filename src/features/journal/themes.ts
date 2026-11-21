/** "self-doubt" → "Self-doubt", "emotional regulation" → "Emotional regulation" */
export function themeLabel(theme: string): string {
  return theme.charAt(0).toUpperCase() + theme.slice(1)
}
