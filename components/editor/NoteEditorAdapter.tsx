"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type * as Y from "yjs"
import { TipTapEditor } from "./TipTapEditor"
import { usePlotStore } from "@/lib/store"
import type { Note } from "@/lib/types"
import { suggestLinks } from "@/lib/queries/notes"
import { LinkSuggestion } from "@/components/link-suggestion"
import { FootnotesFooter } from "./footnotes-footer"
import { extractHashtags } from "@/lib/body-helpers"
import { pickColor } from "@/components/note-fields"
import {
  acquireYDoc,
  releaseYDoc,
  isYjsExperimentEnabled,
  getRefCount,
} from "@/lib/y-doc-manager"

interface NoteEditorAdapterProps {
  note: Note
  onEditorReady?: (editor: unknown) => void
  editable?: boolean
}

export function NoteEditorAdapter({ note, onEditorReady, editable = true }: NoteEditorAdapterProps) {
  const updateNote = usePlotStore((s) => s.updateNote)
  const notes = usePlotStore((s) => s.notes)

  const [suggestions, setSuggestions] = useState<Note[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  // ── Experimental Y.Doc split-view sync (gated by ?yjs=1) ──
  //
  // IMPORTANT: We sync Y.Doc acquisition DURING RENDER (not in useEffect).
  //
  // The previous useState + useEffect pattern had a data-corruption bug:
  // when note.id changed from A → B, there was a one-render window where
  // `ydoc` state still pointed to A's Y.Doc. The new TipTapEditor (remounted
  // due to `key={note.id+...}` changing) bound to that STALE Y.Doc. Then
  // handleEditorReady called `setContent(B's initialContent)` on an editor
  // bound to A's Y.Doc — silently overwriting A's content with B's.
  //
  // Other panes sharing A's Y.Doc received the propagated content, and
  // their handleChange saves then persisted B's content into A's store
  // entry. Permanent data loss.
  //
  // Fix: mutate refs synchronously during render, so `ydoc` seen by the
  // JSX below is always the one matching the current `note.id`.
  const ydocRef = useRef<Y.Doc | null>(null)
  const ydocNoteIdRef = useRef<string | null>(null)
  const ydocIsFreshRef = useRef(false)

  if (ydocNoteIdRef.current !== note.id) {
    // Release Y.Doc held for the previous note (if any).
    if (ydocRef.current && ydocNoteIdRef.current) {
      releaseYDoc("note", ydocNoteIdRef.current)
    }
    // Acquire Y.Doc for the current note (if experiment enabled).
    if (isYjsExperimentEnabled()) {
      const { doc, isFresh } = acquireYDoc("note", note.id)
      ydocRef.current = doc
      ydocIsFreshRef.current = isFresh
    } else {
      ydocRef.current = null
      ydocIsFreshRef.current = false
    }
    ydocNoteIdRef.current = note.id
  }

  // Release on unmount. Uses refs (closure capture of .current reads the
  // live value at unmount time, not the initial one).
  useEffect(() => {
    return () => {
      if (ydocRef.current && ydocNoteIdRef.current) {
        releaseYDoc("note", ydocNoteIdRef.current)
        ydocRef.current = null
        ydocNoteIdRef.current = null
      }
    }
  }, [])

  const ydoc = ydocRef.current

  // Track the latest content to debounce saves
  const pendingRef = useRef<{
    content: string
    contentJson: Record<string, unknown> | null
    title: string
  } | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentNoteIdRef = useRef(note.id)

  // Flush pending save immediately (note switch / unmount)
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (pendingRef.current && currentNoteIdRef.current) {
      const noteId = currentNoteIdRef.current
      const content = pendingRef.current.content
      updateNote(noteId, {
        title: pendingRef.current.title,
        content,
        contentJson: pendingRef.current.contentJson,
      })
      pendingRef.current = null
      // Final extraction: include end-of-string tags since user is leaving the note
      syncHashtagsToTags(noteId, content, true)
    }
  }, [updateNote])

  // When noteId changes, flush any pending save for the old note
  useEffect(() => {
    if (currentNoteIdRef.current !== note.id) {
      flushSave()
      currentNoteIdRef.current = note.id
    }
  }, [note.id, flushSave])

  // Cleanup on unmount — flush save + final hashtag extraction
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (pendingRef.current && currentNoteIdRef.current) {
        const noteId = currentNoteIdRef.current
        const content = pendingRef.current.content
        const store = usePlotStore.getState()
        store.updateNote(noteId, {
          title: pendingRef.current.title,
          content,
          contentJson: pendingRef.current.contentJson,
        })
        // Final extraction with end-of-string support
        const hashtagNames = extractHashtags(content, { includeEos: true })
        if (hashtagNames.length > 0) {
          const currentNote = store.notes.find((n) => n.id === noteId)
          if (currentNote) {
            for (const name of hashtagNames) {
              let tag = store.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
              if (!tag) {
                store.createTag(name, pickColor(name))
                tag = usePlotStore.getState().tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
              }
              if (tag && !currentNote.tags.includes(tag.id)) {
                store.addTagToNote(noteId, tag.id)
              }
            }
          }
        }
      }
    }
  }, [])

  // Bidirectional sync: #hashtags in content ↔ tag associations on note
  // includeEos=true on flush (note switch/unmount) to catch end-of-string tags
  const syncHashtagsToTags = useCallback((noteId: string, content: string, includeEos = false) => {
    const hashtagNames = extractHashtags(content, { includeEos })
    const hashtagLower = new Set(hashtagNames.map((n) => n.toLowerCase()))

    const store = usePlotStore.getState()
    const currentNote = store.notes.find((n) => n.id === noteId)
    if (!currentNote) return

    // Forward: add tags found in content
    for (const name of hashtagNames) {
      let tag = store.tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
      if (!tag) {
        store.createTag(name, pickColor(name))
        tag = usePlotStore.getState().tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
      }
      if (tag && !currentNote.tags.includes(tag.id)) {
        store.addTagToNote(noteId, tag.id)
      }
    }

    // Reverse: remove tag associations for hashtags no longer in content
    for (const tagId of currentNote.tags) {
      const tag = store.tags.find((t) => t.id === tagId)
      if (!tag) continue
      // Only auto-remove if the tag name looks like it came from inline hashtag
      // (i.e., the tag name exists as a potential hashtag match)
      if (!hashtagLower.has(tag.name.toLowerCase())) {
        // Check if #tagName was ever in this content (heuristic: tag was auto-added)
        // We can't perfectly distinguish manual vs inline, so only remove if
        // the content has NO reference to this tag at all (not even as #partial)
        const hasAnyRef = content.includes(`#${tag.name}`)
        if (!hasAnyRef) {
          store.removeTagFromNote(noteId, tagId)
        }
      }
    }
  }, [])

  const handleChange = useCallback(
    (json: Record<string, unknown>, plainText: string) => {
      // ── Y.Doc safety: refuse to save empty content when Y.js is on and the
      // note had real content in store. This prevents the race where the
      // fresh-Y.Doc-empty-editor emits an empty onUpdate before seed runs
      // and nukes user data. Real empty edits (user cleared the note) are
      // captured via the normal path since `note.content` would also be "".
      //
      // "Empty" = no text content anywhere in the document. We check plainText
      // (editor.getText()) because it concatenates all text nodes — if it's
      // empty/whitespace, the doc has no meaningful content. A byte-length
      // threshold is UNRELIABLE: Collaboration extension pre-populates an
      // empty paragraph with UUID-bearing attrs (~125 chars of JSON), which
      // slipped past an earlier `< 80` check and caused data loss.
      if (ydoc) {
        const looksEmpty = !plainText.trim()
        const storeHasContent =
          (note.content && note.content.length > 0) ||
          (note.contentJson && Object.keys(note.contentJson).length > 0) ||
          (note.title && note.title.length > 0)
        if (looksEmpty && storeHasContent) {
          console.warn("[y-doc] refusing to save empty content over existing data for", note.id)
          return
        }
      }

      // Extract title from the first block (any type — heading, paragraph, etc.)
      const doc = json as { type: string; content?: Array<{ type: string; content?: Array<{ text?: string }> }> }
      let title = ""
      if (doc.content?.[0]?.content) {
        title = doc.content[0].content.map((n) => n.text || "").join("") || ""
      }

      // Body plain text (everything after first block text)
      const bodyPlainText = title ? plainText.slice(title.length).trimStart() : plainText

      pendingRef.current = { content: bodyPlainText, contentJson: json, title }

      // Debounce save at 300ms
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current && currentNoteIdRef.current) {
          const noteId = currentNoteIdRef.current
          const content = pendingRef.current.content
          updateNote(noteId, {
            title: pendingRef.current.title,
            content,
            contentJson: pendingRef.current.contentJson,
          })
          pendingRef.current = null
          // UpNote-style: only extract tags confirmed by whitespace (no end-of-string)
          syncHashtagsToTags(noteId, content)
        }
      }, 300)
    },
    [updateNote, syncHashtagsToTags, ydoc, note.id, note.content, note.contentJson]
  )

  const handleSuggestionSelect = useCallback(
    (selectedNote: Note) => {
      // Insert wiki-link into content via store
      const store = usePlotStore.getState()
      const current = store.notes.find((n) => n.id === note.id)
      if (current) {
        const newContent = current.content + ` [[${selectedNote.title}]]`
        updateNote(note.id, { content: newContent })
      }
      setShowSuggestions(false)
      setSuggestions([])
    },
    [note.id, updateNote]
  )

  // Build initial content for editor (first block = title, UpNote style)
  const initialContent = (() => {
    if (note.contentJson && Object.keys(note.contentJson).length > 0) {
      // contentJson already has the full document — use as-is
      // (IDB migration converts old title nodes to heading)
      return note.contentJson
    }

    // Fallback: build from title + content strings
    const headingNode = {
      type: "heading",
      attrs: { level: 2 },
      content: note.title ? [{ type: "text", text: note.title }] : [],
    }

    if (note.content) {
      return {
        type: "doc",
        content: [
          headingNode,
          { type: "paragraph", content: [{ type: "text", text: note.content }] },
        ],
      }
    }

    return {
      type: "doc",
      content: [
        headingNode,
        { type: "paragraph" },
      ],
    }
  })()

  const handleEditorReady = useCallback((editor: unknown) => {
    setEditorInstance(editor)
    onEditorReady?.(editor)

    // If this pane created the Y.Doc, seed the shared CRDT once with the
    // persisted note content. Later joiners (other panes) will receive the
    // state via Y.js sync, so they must NOT seed again.
    //
    // `isFresh` from the Y.Doc registry is the authoritative "first acquirer"
    // signal. We intentionally do NOT check `fragment.length === 0` — the
    // Collaboration extension pre-populates the XmlFragment with an empty
    // default paragraph during editor creation, before onEditorReady fires,
    // so fragment.length would already be 1 even on a truly fresh Y.Doc.
    if (
      ydoc &&
      ydocIsFreshRef.current &&
      editor &&
      typeof (editor as { commands?: { setContent?: (doc: unknown) => void } })
        .commands?.setContent === "function"
    ) {
      if (initialContent && Object.keys(initialContent).length > 0) {
        console.debug(
          "[y-seed] seeding fresh Y.Doc for",
          note.id,
          "with",
          Object.keys(initialContent).length,
          "top-level keys",
        )
        ;(editor as { commands: { setContent: (doc: unknown) => void } }).commands.setContent(
          initialContent,
        )
      }
      ydocIsFreshRef.current = false
    }
  }, [onEditorReady, ydoc, initialContent, note.id])

  // Always-visible diagnostic badge (dev PoC). Shows exactly what the
  // runtime thinks about the Y.js experiment:
  //   - gray  "yjs OFF"          → flag not active, std editor in use
  //   - amber "yjs ON acquiring" → flag active but Y.Doc not yet attached
  //   - green "yjs ON ref=N"     → Y.Doc attached; ref=2 means both panes share it
  const yjsEnabled = isYjsExperimentEnabled()
  const refCount = ydoc ? getRefCount("note", note.id) : 0
  const badgeState: "off" | "acquiring" | "ready" = !yjsEnabled
    ? "off"
    : ydoc
      ? "ready"
      : "acquiring"
  const badgeStyle: Record<typeof badgeState, { bg: string; fg: string; label: string }> = {
    off: { bg: "rgba(148,163,184,0.18)", fg: "rgb(148,163,184)", label: "yjs OFF" },
    acquiring: { bg: "rgba(245,158,11,0.18)", fg: "rgb(245,158,11)", label: "yjs ON acquiring…" },
    ready: { bg: "rgba(34,197,94,0.18)", fg: "rgb(34,197,94)", label: `yjs ON ref=${refCount}` },
  }

  return (
    <div className="relative min-w-0 flex-1 flex flex-col">
      <div
        className="absolute right-2 top-2 z-50 rounded-md px-2 py-0.5 font-mono text-2xs"
        style={{
          background: badgeStyle[badgeState].bg,
          color: badgeStyle[badgeState].fg,
          pointerEvents: "none",
          border: "1px solid currentColor",
        }}
      >
        {badgeStyle[badgeState].label}
      </div>
      <TipTapEditor
        key={`${note.id}-${ydoc ? "yjs" : "std"}`}
        content={initialContent}
        onChange={editable ? handleChange : undefined}
        editable={editable}
        placeholder="Type / for commands, or start writing..."
        onEditorReady={handleEditorReady}
        noteId={note.id}
        ydoc={ydoc ?? undefined}
      />
      <FootnotesFooter editor={editorInstance} noteId={note.id} editable={editable} />
      <LinkSuggestion
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions}
      />
    </div>
  )
}
