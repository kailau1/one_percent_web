import { useQuery } from '@tanstack/react-query'
import { getThemeInsights } from './api'

// Under 'insights', which the journal's save and delete hooks invalidate: themes come from the entries.
export const insightsKeys = { themes: ['insights', 'themes'] as const }

export function useThemeInsights() {
  return useQuery({ queryKey: insightsKeys.themes, queryFn: getThemeInsights })
}
