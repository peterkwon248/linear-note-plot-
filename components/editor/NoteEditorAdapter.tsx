"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TipTapEditor } from "./TipTapEditor"
import { usePlotStore } from "@/lib/store"
import type { Note } from "@/lib/types"
import { suggestLinks } from "@/lib/queries/notes"
import { LinkSuggestion } from "@/components/link-suggestion"
import { extractHashtags } from "@/lib/body-helpers"
import { pickColor } from "@/components/note-fields"

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

  // Track the latest content to debounce saves
  const pendingRef = useRef<{
    content: string
    contentJson: Record<string, unknown> | null
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
      pendingRef.current = { content: plainText, contentJson: json }

      // Debounce save at 300ms
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current && currentNoteIdRef.current) {
          const noteId = currentNoteIdRef.current
          const content = pendingRef.current.content
          updateNote(noteId, {
            content,
            contentJson: pendingRef.current.contentJson,
          })
          pendingRef.current = null
          // UpNote-style: only extract tags confirmed by whitespace (no end-of-string)
          syncHashtagsToTags(noteId, content)
        }
      }, 300)
    },
    [updateNote, syncHashtagsToTags]
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

  // Build initial content for editor
  const initialContent = note.contentJson && Object.keys(note.contentJson).length > 0
    ? note.contentJson
    : note.content
      ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: note.content }] }] }
      : {}

  return (
    <div className="relative min-w-0 flex-1 flex flex-col">
      <TipTapEditor
        key={note.id}
        content={initialContent}
        onChange={editable ? handleChange : undefined}
        editable={editable}
        placeholder="Type / for commands, or start writing..."
        onEditorReady={onEditorReady}
      />
      <LinkSuggestion
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions}
      />
    </div>
  )
}
