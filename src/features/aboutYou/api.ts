import { apiRequest } from '@/api/client'
import type { AiContext, AiContextSettings, AiFact } from '@/api/types'

export const getAiContext = () => apiRequest<AiContext>('/api/users/me/ai-context')

/** 400 (with a reason to show) if blank, too long, or the list is full. */
export const addFact = (text: string) =>
  apiRequest<AiFact>('/api/users/me/facts', { method: 'POST', body: { text } })

export const deleteFact = (id: string) =>
  apiRequest<void>(`/api/users/me/facts/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const updateAiSettings = (settings: AiContextSettings) =>
  apiRequest<AiContext>('/api/users/me/ai-context/settings', { method: 'PUT', body: settings })
