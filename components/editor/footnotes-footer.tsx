"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { usePlotStore } from "@/lib/store"

interface FootnoteItem {
  id: string
  content: string
  referenceId: string | null
  number: number
}

interface FootnotesFooterProps {
  editor: Editor | null
}

/** Inline-editable footnote row */
function FootnoteRow({
  fn,
  editor,
  scrollToRef,
}: {
  fn: FootnoteItem & { count: number }
  editor: Editor
  scrollToRef: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(fn.content)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync draft when content changes externally (e.g. edited via marker popover)
  useEffect(() => {
    if (!editing) setDraft(fn.content)
  }, [fn.content, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at end
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    // Update the footnoteRef node's content attr in the editor
    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "footnoteRef" && node.attrs.id === fn.id) {
          const newAttrs: Record<string, any> = { ...node.attrs, content: trimmed }

          // Auto-create Reference if none linked and content exists
          if (trimmed && !node.attrs.referenceId) {
            const store = usePlotStore.getState()
            const refId = store.createReference({
              title: trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
              content: trimmed,
            })
            newAttrs.referenceId = refId
          }
          // Sync content to linked Reference
          if (trimmed && node.attrs.referenceId) {
            const store = usePlotStore.getState()
            store.updateReference(node.attrs.referenceId as string, { content: trimmed })
          }

          const tr = editor.state.tr.setNodeMarkup(pos, undefined, newAttrs)
          editor.view.dispatch(tr)
          return false
        }
      })
    }
    setEditing(false)
  }

  const startEditing = () => {
    setDraft(fn.content)
    setEditing(true)
  }

  return (
    <li
      className="footnotes-footer-item"
      data-footnote-list-id={fn.id}
    >
      <button
        className="footnotes-footer-number"
        onClick={() => scrollToRef(fn.id)}
        title="Jump to [${fn.number}] in text"
      >
        [{fn.number}]
      </button>

      {editing ? (
        <textarea
          ref={inputRef}
          className="footnotes-footer-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              save()
            }
            if (e.key === "Escape") {
              setDraft(fn.content)
              setEditing(false)
            }
          }}
          placeholder="Enter footnote content..."
          rows={1}
        />
      ) : fn.content ? (
        <span
          className="footnotes-footer-content"
          onClick={startEditing}
          title="Click to edit"
        >
          {fn.content}
        </span>
      ) : (
        <button
          className="footnotes-footer-empty"
          onClick={startEditing}
        >
          Click to add content
        </button>
      )}

      {fn.count > 1 && (
        <span className="footnotes-footer-count">({fn.count}× referenced)</span>
      )}
    </li>
  )
}

export function FootnotesFooter({ editor }: FootnotesFooterProps) {
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([])

  const collectFootnotes = useCallback(() => {
    if (!editor) return
    const items: FootnoteItem[] = []
    let count = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === "footnoteRef") {
        count++
        items.push({
          id: node.attrs.id as string,
          content: node.attrs.content as string,
          referenceId: node.attrs.referenceId as string | null,
          number: count,
        })
      }
    })
    setFootnotes(items)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    collectFootnotes()
    editor.on("update", collectFootnotes)
    return () => {
      editor.off("update", collectFootnotes)
    }
  }, [editor, collectFootnotes])

  if (footnotes.length === 0) return null

  // Deduplicate by id
  const seen = new Map<string, FootnoteItem & { count: number }>()
  for (const fn of footnotes) {
    if (seen.has(fn.id)) {
      seen.get(fn.id)!.count++
    } else {
      seen.set(fn.id, { ...fn, count: 1 })
    }
  }
  const uniqueFootnotes = Array.from(seen.values())

  const scrollToRef = (id: string) => {
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
  }

  return (
    <div className="footnotes-footer">
      <div className="footnotes-footer-title">Footnotes</div>
      <ol className="footnotes-footer-list">
        {uniqueFootnotes.map((fn) => (
          <FootnoteRow
            key={fn.id}
            fn={fn}
            editor={editor!}
            scrollToRef={scrollToRef}
          />
        ))}
      </ol>
    </div>
  )
}
