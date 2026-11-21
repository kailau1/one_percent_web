import { ArrowLeft, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { JournalEntry } from '@/api/types'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatLongDate, formatTime, parseDateTime } from '@/lib/dates'
import { useAutosize } from '@/lib/useAutosize'
import { useShortcut } from '@/lib/useShortcut'
import { getErrorMessage } from '@/api/client'
import { FeedbackPanel } from '@/features/ai/FeedbackPanel'
import { useRequestFeedback } from '@/features/ai/hooks'
import { PromptPicker } from '@/features/ai/PromptPicker'
import { EntryExportMenu } from '@/features/export/EntryExportMenu'
import { drafts } from '../drafts'
import { ThemeChips } from './ThemeChips'
import { useDeleteEntry, useSaveEntry } from '../hooks'

interface EntryEditorProps {
  /** The entry being edited; leave out to write a new one. */
  entry?: JournalEntry
  /** Text to start a new entry with (e.g. a journaling prompt). */
  startingContent?: string
}

/**
 * Where entries are written and edited. Three promises it keeps:
 *  - what you type is saved as a draft in the browser as you go, and restored if you come back;
 *  - a failed save leaves everything on screen with a retry;
 *  - existing AI feedback is sent back with every save (the backend would otherwise erase it).
 */
export function EntryEditor({ entry, startingContent = '' }: EntryEditorProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const saveEntry = useSaveEntry()
  const deleteEntry = useDeleteEntry()
  const feedback = useRequestFeedback()

  const savedTitle = entry?.title ?? ''
  const savedContent = entry?.content ?? startingContent

  const [restoredDraft] = useState(() => {
    const draft = drafts.load(entry?.id)
    return draft && (draft.title !== savedTitle || draft.content !== savedContent) ? draft : null
  })
  const [title, setTitle] = useState(restoredDraft?.title ?? savedTitle)
  const [content, setContent] = useState(restoredDraft?.content ?? savedContent)
  const [showRestored, setShowRestored] = useState(restoredDraft !== null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [openedAt] = useState(() => new Date())

  const contentRef = useRef<HTMLTextAreaElement>(null)
  useAutosize(contentRef, content)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  useAutosize(titleRef, title)

  const dirty = title !== savedTitle || content !== savedContent
  const canSave = dirty && content.trim() !== '' && !saveEntry.isPending

  // Keep a draft while there are unsaved changes; drop it once there aren't.
  useEffect(() => {
    if (!dirty) {
      drafts.clear(entry?.id)
      return
    }
    const timer = setTimeout(() => drafts.save(entry?.id, { title, content }), 400)
    return () => clearTimeout(timer)
  }, [dirty, title, content, entry?.id])

  function save({ thenFeedback = false }: { thenFeedback?: boolean } = {}) {
    if (!canSave) return
    saveEntry.mutate(
      {
        id: entry?.id,
        input: { title: title.trim(), content, llmResponse: entry?.llmResponse ?? null },
      },
      {
        onSuccess: (saved) => {
          drafts.clear(entry?.id)
          setShowRestored(false)
          if (!entry) {
            // A new entry moves to its own address; the editor there picks up the feedback request.
            navigate(`/journal/${saved.id}`, {
              replace: true,
              state: thenFeedback ? { requestFeedback: true } : null,
            })
          } else {
            setTitle(saved.title ?? '')
            if (thenFeedback) feedback.mutate(saved.id)
          }
        },
      },
    )
  }

  useShortcut('s', () => save(), { mod: true, whileTyping: true })

  // Feedback is about the saved text, so unsaved changes are saved first.
  function getFeedback() {
    if (!entry || dirty) save({ thenFeedback: true })
    else feedback.mutate(entry.id)
  }

  // Arriving from "Save and get feedback" on a new entry: ask once, then forget the instruction.
  const askedOnArrival = useRef(false)
  useEffect(() => {
    if (!entry || askedOnArrival.current) return
    if ((location.state as { requestFeedback?: boolean } | null)?.requestFeedback) {
      askedOnArrival.current = true
      navigate(location.pathname, { replace: true, state: null })
      feedback.mutate(entry.id)
    }
  }, [entry, location, navigate, feedback])

  // A prompt becomes the entry's title (the question) and the text is the answer.
  function applyPrompt(prompt: string) {
    setTitle(prompt)
    contentRef.current?.focus()
  }

  function discardDraft() {
    drafts.clear(entry?.id)
    setTitle(savedTitle)
    setContent(savedContent)
    setShowRestored(false)
  }

  function confirmDelete() {
    if (!entry) return
    deleteEntry.mutate(entry.id, {
      onSuccess: () => {
        drafts.clear(entry.id)
        toast.success('Entry deleted')
        navigate('/journal', { replace: true })
      },
      onError: (error) => {
        setConfirmingDelete(false)
        toast.error(getErrorMessage(error))
      },
    })
  }

  const createdAt = parseDateTime(entry?.createdAt)
  const status = saveEntry.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : entry ? 'Saved' : ''

  return (
    <div className="@container">
      <div className="mx-auto grid w-full max-w-prose gap-10 px-5 pb-24 pt-6 sm:px-8 lg:pt-12 @4xl:max-w-none @4xl:grid-cols-[minmax(0,1fr)_18rem] @4xl:gap-8 @4xl:px-10 @6xl:grid-cols-[minmax(0,40rem)_20rem] @6xl:justify-center">
        <article className="flex min-w-0 flex-col">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-3 lg:hidden">
              <Link to="/journal">
                <ArrowLeft aria-hidden />
                All entries
              </Link>
            </Button>
            <p role="status" className="ml-auto text-sm text-ink-muted">
              {status}
            </p>
            {entry && <EntryExportMenu entry={entry} />}
            {entry && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete entry"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 aria-hidden />
              </Button>
            )}
            <Button onClick={() => save()} disabled={!canSave} title="Save (Ctrl+S)">
              {entry ? 'Save changes' : 'Save entry'}
            </Button>
          </div>

          {showRestored && (
            <div
              role="status"
              className="mb-6 flex flex-wrap items-center gap-3 rounded-control border border-line bg-sky-wash px-4 py-2.5 text-sm"
            >
              <span className="flex-1">
                Restored what you were writing before. It isn’t saved yet.
              </span>
              <Button variant="link" size="sm" className="h-auto p-0" onClick={discardDraft}>
                Discard it
              </Button>
            </div>
          )}

          {saveEntry.error && (
            <ErrorState
              compact
              error={saveEntry.error}
              onRetry={() => save()}
              retrying={saveEntry.isPending}
              className="mb-6"
            />
          )}

          {!entry && <PromptPicker onPick={applyPrompt} />}

          <p className="mb-3 text-sm text-ink-muted">
            {createdAt
              ? `${formatLongDate(createdAt)}, ${formatTime(createdAt)}`
              : formatLongDate(openedAt)}
          </p>
          {entry && <ThemeChips entry={entry} />}

          {/* A text area so long titles (e.g. a prompt) wrap instead of being cut off; Enter moves on to the entry. */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={(event) => setTitle(event.target.value.replace(/\n/g, ' '))}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            contentRef.current?.focus()
          }
        }}
        placeholder="Title"
        aria-label="Title"
        rows={1}
        className="mb-5 w-full resize-none overflow-hidden bg-transparent font-serif text-[2rem] font-medium leading-tight tracking-tight placeholder:text-ink-faint focus-visible:outline-none"
      />

          <textarea
            ref={contentRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What’s on your mind?"
            aria-label="Entry"
            rows={entry ? 5 : 12}
            autoFocus={!entry}
            className="w-full resize-none overflow-hidden bg-transparent font-serif text-lg leading-8 placeholder:text-ink-faint focus-visible:outline-none"
          />

          <Dialog
            open={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            title="Delete this entry?"
            description="The entry and its feedback will be gone for good. This can’t be undone."
            actions={
              <>
                <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                  Keep entry
                </Button>
                <Button variant="danger" onClick={confirmDelete} disabled={deleteEntry.isPending}>
                  {deleteEntry.isPending ? 'Deleting…' : 'Delete entry'}
                </Button>
              </>
            }
          />
        </article>

        <div className="@4xl:sticky @4xl:top-12 @4xl:self-start">
          <FeedbackPanel
            feedback={entry?.llmResponse}
            isPending={feedback.isPending}
            error={feedback.error}
            onRequest={getFeedback}
            nothingToReview={content.trim() === ''}
            needsSave={!entry || dirty}
          />
        </div>
      </div>
    </div>
  )
}
