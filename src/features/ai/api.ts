import { AI_TIMEOUT_MS, apiRequest } from '@/api/client'
import type { AiResponse } from '@/api/types'

/**
 * Asks for feedback on a saved entry. The server reads the entry's stored text (not anything
 * sent from here) and saves the feedback onto the entry, so save before calling this.
 */
export const requestFeedback = (journalId: string) =>
  apiRequest<AiResponse>('/api/ai/feedback', {
    method: 'POST',
    body: { journalId, journalContent: null },
    timeoutMs: AI_TIMEOUT_MS,
  }).then((data) => data?.response ?? '')

/** Journaling prompts personalised from the user's habits and recurring themes. */
export const getPrompts = () =>
  apiRequest<string[]>('/api/ai/prompt', { timeoutMs: AI_TIMEOUT_MS }).then((prompts) =>
    Array.isArray(prompts) ? prompts.filter((p) => typeof p === 'string' && p.trim() !== '') : [],
  )

export const getTip = () =>
  apiRequest<AiResponse>('/api/ai/tip', { timeoutMs: AI_TIMEOUT_MS }).then((data) => data?.response ?? '')
