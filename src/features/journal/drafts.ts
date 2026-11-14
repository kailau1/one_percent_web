import { storage } from '@/lib/storage'

/**
 * Unsaved writing, kept in the browser so it survives a failed save, a closed tab or a crash.
 * One draft per entry (plus one for "new entry"); removed once the entry saves.
 */
export interface Draft {
  title: string
  content: string
}

const key = (entryId: string | undefined) => `draft.${entryId ?? 'new'}`

export const drafts = {
  load(entryId: string | undefined): Draft | null {
    const draft = storage.getJson<Partial<Draft>>(key(entryId))
    if (!draft || typeof draft.content !== 'string') return null
    return { title: typeof draft.title === 'string' ? draft.title : '', content: draft.content }
  },
  save(entryId: string | undefined, draft: Draft): void {
    storage.setJson(key(entryId), draft)
  },
  clear(entryId: string | undefined): void {
    storage.remove(key(entryId))
  },
}
