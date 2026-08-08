'use client'

import * as React from 'react'

export interface AutosaveDraft<T> {
  savedAt: number
  data: T
}

/**
 * Browser-local autosave for long-running forms (rich text editors especially).
 *
 * Every `debounceMs` of silence the current draft is written to localStorage so
 * an accidental reload or tab close can't destroy hours of writing. On mount a
 * previously saved draft is surfaced through `pendingDraft` so the form can
 * offer to restore it — autosave is paused until the user decides, preventing
 * the very first keystroke from overwriting the stored draft.
 *
 * `isSaving` is derived (last written snapshot vs current data) rather than
 * set from inside an effect, which keeps the hook lint-clean and avoids
 * cascading re-renders. Before the first write it compares against the initial
 * mount snapshot so the indicator appears from the very first keystroke.
 *
 * A `pagehide`/`beforeunload` listener flushes the current draft synchronously
 * (localStorage writes are sync) so nothing typed within the debounce window is
 * lost if the tab is closed.
 */
export function useAutosaveDraft<T>({
  storageKey,
  data,
  debounceMs = 1000,
}: {
  storageKey: string
  data: T
  debounceMs?: number
}) {
  const [pendingDraft, setPendingDraft] = React.useState<AutosaveDraft<T> | null>(null)
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null)
  const [lastSavedSnapshot, setLastSavedSnapshot] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)

  // Skip writes on the very first effect run so loading an existing post
  // doesn't immediately rewrite the unchanged initial value to storage.
  const isFirstRun = React.useRef(true)
  // After discard()/clear() we must not re-write the (possibly unchanged) data
  // on the next effect run — that would resurrect the draft we just deleted.
  const skipNextWrite = React.useRef(false)
  // Snapshot of the data as of mount, used to derive isSaving before the first
  // write has completed (lastSavedAt is still null then). Set asynchronously in
  // the mount effect so it stays a plain state (no ref reads during render).
  const [initialSnapshot, setInitialSnapshot] = React.useState<string | null>(null)
  // Always-fresh data for the unload flush (read inside a stable listener).
  const dataRef = React.useRef(data)

  React.useEffect(() => {
    dataRef.current = data
  })

  const readDraft = React.useCallback((): AutosaveDraft<T> | null => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AutosaveDraft<T>
      return parsed && typeof parsed.savedAt === 'number' && parsed.data ? parsed : null
    } catch {
      return null // corrupted JSON — treat as no draft
    }
  }, [storageKey])

  const writeDraft = React.useCallback(
    (value: T) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), data: value }))
        setLastSavedSnapshot(JSON.stringify(value))
        setLastSavedAt(Date.now())
        setError(false)
      } catch {
        setError(true) // quota exceeded / private mode
      }
    },
    [storageKey],
  )

  // Flush the latest data synchronously when the page is hidden or closed so
  // nothing typed inside the debounce window is lost. Runs even while a
  // recoverable draft is pending — keeping the newest content always wins.
  const flushToStorage = React.useCallback(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ savedAt: Date.now(), data: dataRef.current }),
      )
    } catch {
      // ignore — best-effort on unload
    }
  }, [storageKey])

  React.useEffect(() => {
    const flush = () => flushToStorage()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [flushToStorage])

  // Surface a previously saved draft on mount so the form can offer recovery.
  // Deferred to a macrotask so no setState runs synchronously inside the effect.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialSnapshot(JSON.stringify(data))
      const draft = readDraft()
      if (draft) setPendingDraft(draft)
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  // Debounced autosave whenever the form data changes.
  React.useEffect(() => {
    // While a recoverable draft is pending, don't overwrite it — wait for the
    // user's restore/discard decision.
    if (pendingDraft) return
    if (skipNextWrite.current) {
      skipNextWrite.current = false
      return
    }
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const timer = setTimeout(() => writeDraft(data), debounceMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on data
  }, [data, pendingDraft, debounceMs])

  /** Replace the form state with the recovered draft; returns it for the caller. */
  const restore = React.useCallback((): T | null => {
    if (!pendingDraft) return null
    const restored = pendingDraft.data
    setPendingDraft(null)
    isFirstRun.current = false
    return restored
  }, [pendingDraft])

  /** Delete the stored draft without applying it. */
  const discard = React.useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    skipNextWrite.current = true
    setPendingDraft(null)
    setLastSavedAt(null)
    setLastSavedSnapshot(null)
    setError(false)
  }, [storageKey])

  /** Delete the stored draft after a successful manual save. */
  const clear = React.useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
    skipNextWrite.current = true
    setPendingDraft(null)
    setLastSavedAt(null)
    setLastSavedSnapshot(null)
    setError(false)
  }, [storageKey])

  // Derived — is the current data different from what we last wrote (or from
  // the initial snapshot before anything has been written yet)?
  const currentSnapshot = React.useMemo(() => JSON.stringify(data), [data])
  const isSaving =
    lastSavedAt !== null
      ? lastSavedSnapshot !== currentSnapshot
      : initialSnapshot !== null && initialSnapshot !== currentSnapshot

  return { pendingDraft, lastSavedAt, error, isSaving, restore, discard, clear }
}
