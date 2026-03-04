"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TipTapEditor } from "./TipTapEditor"
import { usePlotStore } from "@/lib/store"
import type { Note } from "@/lib/types"
import { suggestLinks } from "@/lib/queries/notes"
import { LinkSuggestion } from "@/components/link-suggestion"

interface NoteEditorAdapterProps {
  note: Note
}

export function NoteEditorAdapter({ note }: NoteEditorAdapterProps) {
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

  // Flush pending save immediately
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (pendingRef.current && currentNoteIdRef.current) {
      updateNote(currentNoteIdRef.current, {
        content: pendingRef.current.content,
        contentJson: pendingRef.current.contentJson,
      })
      pendingRef.current = null
    }
  }, [updateNote])

  // When noteId changes, flush any pending save for the old note
  useEffect(() => {
    if (currentNoteIdRef.current !== note.id) {
      flushSave()
      currentNoteIdRef.current = note.id
    }
  }, [note.id, flushSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      // Flush on unmount
      if (pendingRef.current && currentNoteIdRef.current) {
        // Can't use updateNote in cleanup reliably, but try
        const store = usePlotStore.getState()
        store.updateNote(currentNoteIdRef.current, {
          content: pendingRef.current.content,
          contentJson: pendingRef.current.contentJson,
        })
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
          updateNote(currentNoteIdRef.current, {
            content: pendingRef.current.content,
            contentJson: pendingRef.current.contentJson,
          })
          pendingRef.current = null
        }
      }, 300)
    },
    [updateNote]
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
    <div className="relative h-full">
      <TipTapEditor
        key={note.id}
        content={initialContent}
        onChange={handleChange}
        editable={true}
        placeholder="Start writing..."
      />
      <LinkSuggestion
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        visible={showSuggestions}
      />
    </div>
  )
}
