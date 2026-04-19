"use client"

/**
 * NoteReferencesContainer — 노트용 어댑터.
 *
 * Editor 에서 footnoteRef atom node 를 live 수집하고
 * note.referenceIds 와 합쳐 ReferencesBox 에 전달한다.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Editor } from "@tiptap/react"
import { usePlotStore } from "@/lib/store"
import { openFootnoteModal } from "./footnote-edit-modal"
import { ReferencesBox, type FootnoteItem } from "./references-box"

interface NoteReferencesContainerProps {
  editor: Editor | null
  noteId?: string
  editable?: boolean
}

export function NoteReferencesContainer({
  editor,
  noteId,
  editable = true,
}: NoteReferencesContainerProps) {
  const addNoteReference = usePlotStore((s) => s.addNoteReference)
  const removeNoteReference = usePlotStore((s) => s.removeNoteReference)
  const createReference = usePlotStore((s) => s.createReference)
  const noteReferenceIds = usePlotStore((s) => {
    if (!noteId) return [] as string[]
    const note = s.notes.find((n) => n.id === noteId)
    return (note?.referenceIds ?? []) as string[]
  })

  const [rawFootnotes, setRawFootnotes] = useState<FootnoteItem[]>([])

  const collectFootnotes = useCallback(() => {
    if (!editor) {
      setRawFootnotes([])
      return
    }
    const items: FootnoteItem[] = []
    let count = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === "footnoteRef") {
        count++
        items.push({
          id: node.attrs.id as string,
          content: node.attrs.content as string,
          contentJson:
            (node.attrs.contentJson as Record<string, unknown>) ?? null,
          referenceId: (node.attrs.referenceId as string) ?? null,
          number: count,
        })
      }
    })
    setRawFootnotes(items)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    collectFootnotes()
    editor.on("update", collectFootnotes)
    return () => {
      editor.off("update", collectFootnotes)
    }
  }, [editor, collectFootnotes])

  // Deduplicate by id, preserving first occurrence's number and tallying count
  const footnotes = useMemo(() => {
    const seen = new Map<string, FootnoteItem & { count: number }>()
    for (const fn of rawFootnotes) {
      const existing = seen.get(fn.id)
      if (existing) {
        existing.count++
      } else {
        seen.set(fn.id, { ...fn, count: 1 })
      }
    }
    return Array.from(seen.values())
  }, [rawFootnotes])

  // Bibliography = note.referenceIds 중 footnote 에 이미 연결된 것 제외
  const bibliographyRefIds = useMemo(() => {
    const footnoteRefSet = new Set<string>()
    for (const fn of footnotes) {
      if (fn.referenceId) footnoteRefSet.add(fn.referenceId)
    }
    return noteReferenceIds.filter((id) => !footnoteRefSet.has(id))
  }, [noteReferenceIds, footnotes])

  const handleScrollToFootnote = useCallback(
    (id: string) => {
      if (!editor) return
      let targetPos: number | null = null
      editor.state.doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (node.type.name === "footnoteRef" && node.attrs.id === id) {
          targetPos = pos
          return false
        }
      })
      if (targetPos !== null) {
        editor.commands.setTextSelection(targetPos)
        editor.commands.scrollIntoView()
      }
    },
    [editor],
  )

  const handleEditFootnote = useCallback(
    (fn: FootnoteItem) => {
      if (!editor || !editor.isEditable) return
      openFootnoteModal({
        footnoteId: fn.id,
        content: fn.content,
        contentJson: fn.contentJson,
        referenceId: fn.referenceId,
        onSave: ({ content: plainText, contentJson, referenceId }) => {
          editor.state.doc.descendants((node, pos) => {
            if (
              node.type.name === "footnoteRef" &&
              node.attrs.id === fn.id
            ) {
              const newAttrs: Record<string, unknown> = {
                ...node.attrs,
                content: plainText,
                contentJson,
                referenceId: referenceId ?? node.attrs.referenceId,
              }
              const tr = editor.state.tr.setNodeMarkup(pos, undefined, newAttrs)
              editor.view.dispatch(tr)
              return false
            }
          })
        },
      })
    },
    [editor],
  )

  const handleLinkReference = useCallback(
    (refId: string) => {
      if (!noteId) return
      addNoteReference(noteId, refId)
    },
    [noteId, addNoteReference],
  )

  const handleCreateAndLinkReference = useCallback(
    (ref: { title: string; content: string; fields: Array<{ key: string; value: string }> }) => {
      if (!noteId) return
      const refId = createReference(ref as Parameters<typeof createReference>[0])
      addNoteReference(noteId, refId)
    },
    [noteId, createReference, addNoteReference],
  )

  const handleRemoveReference = useCallback(
    (refId: string) => {
      if (!noteId) return
      removeNoteReference(noteId, refId)
    },
    [noteId, removeNoteReference],
  )

  // noteId 없으면 linking 불가 — 조회 only
  if (!noteId) {
    return (
      <ReferencesBox
        footnotes={footnotes}
        bibliographyRefIds={[]}
        editable={false}
        onScrollToFootnote={handleScrollToFootnote}
      />
    )
  }

  return (
    <ReferencesBox
      footnotes={footnotes}
      bibliographyRefIds={bibliographyRefIds}
      editable={editable}
      onScrollToFootnote={handleScrollToFootnote}
      onEditFootnote={handleEditFootnote}
      onLinkReference={handleLinkReference}
      onCreateAndLinkReference={handleCreateAndLinkReference}
      onRemoveReference={handleRemoveReference}
    />
  )
}
