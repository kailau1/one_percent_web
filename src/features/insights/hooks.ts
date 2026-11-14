import { useQuery } from '@tanstack/react-query'
import { getThemeInsights } from './api'

export const insightsKeys = { themes: ['insights', 'themes'] as const }

export function useThemeInsights() {
  return useQuery({ queryKey: insightsKeys.themes, queryFn: getThemeInsights })
}
