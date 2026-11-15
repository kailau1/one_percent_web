import { apiRequest } from '@/api/client'
import type { ThemeInsights } from '@/api/types'

export const getThemeInsights = () => apiRequest<ThemeInsights>('/api/insights/themes')
