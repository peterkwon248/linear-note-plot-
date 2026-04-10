"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import type { Editor } from "@tiptap/react"
import { usePlotStore } from "@/lib/store"
import { FootnoteMiniEditor, serializeFootnoteContent, parseFootnoteContent } from "./footnote-mini-editor"

interface FootnoteItem {
  id: string
  content: string
  referenceId: string | null
  number: number
}

interface FootnotesFooterProps {
  editor: Editor | null
}

/**
 * Extract plain text from footnote content (handles both plain string and JSON).
 * Used for display when rich editor is not mounted.
 */
function getPlainText(content: string): string {
  if (!content) return ""
  const trimmed = content.trim()
  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed)
      if (json?.type === "doc" && Array.isArray(json.content)) {
        return json.content
          .map((block: any) =>
            (block.content ?? [])
              .map((n: any) => n.text ?? "")
              .join("")
          )
          .join("\n")
      }
    } catch {}
  }
  return trimmed
}

/** Inline-editable footnote row — supports rich text (mini TipTap) editing */
function FootnoteRow({
  fn,
  editor,
  scrollToRef,
  autoEdit,
  onEditStarted,
}: {
  fn: FootnoteItem & { count: number }
  editor: Editor
  scrollToRef: (id: string) => void
  autoEdit?: boolean
  onEditStarted?: () => void
}) {
  const [editing, setEditing] = useState(false)

  // Auto-enter edit mode when triggered from body text "Edit" button
  useEffect(() => {
    if (autoEdit && !editing) {
      setEditing(true)
      onEditStarted?.()
    }
  }, [autoEdit]) // eslint-disable-line react-hooks/exhaustive-deps
  const references = usePlotStore((s) => s.references)

  const referenceUrl = useMemo(() => {
    if (!fn.referenceId) return null
    const ref = references[fn.referenceId]
    if (!ref) return null
    const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
    return urlField?.value || null
  }, [fn.referenceId, references])

  const plainText = useMemo(() => getPlainText(fn.content), [fn.content])
  const [urlDraft, setUrlDraft] = useState(referenceUrl ?? "")

  // Sync urlDraft when referenceUrl changes externally
  useEffect(() => {
    if (!editing) setUrlDraft(referenceUrl ?? "")
  }, [referenceUrl, editing])

  const handleSave = useCallback((json: Record<string, unknown>, text: string) => {
    const serialized = serializeFootnoteContent(json)
    // Update the footnoteRef node's content attr in the parent editor
    if (editor) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "footnoteRef" && node.attrs.id === fn.id) {
          const newAttrs: Record<string, any> = { ...node.attrs, content: serialized }

          // Auto-create Reference if none linked and content exists
          if (text.trim() && !node.attrs.referenceId) {
            const store = usePlotStore.getState()
            const refId = store.createReference({
              title: text.length > 60 ? text.slice(0, 60) + "…" : text,
              content: text,
            })
            newAttrs.referenceId = refId
          }
          // Sync plain text content + URL to linked Reference
          if (text.trim() && node.attrs.referenceId) {
            const store = usePlotStore.getState()
            store.updateReference(node.attrs.referenceId as string, { content: text })

            // Sync URL field from the dedicated URL input
            const trimmedUrl = urlDraft.trim()
            const ref = store.references[node.attrs.referenceId as string]
            if (ref) {
              const existingFields = ref.fields.filter((f: { key: string }) => f.key.toLowerCase() !== "url")
              if (trimmedUrl) {
                // Add/update url field
                store.updateReference(node.attrs.referenceId as string, {
                  fields: [{ key: "url", value: trimmedUrl }, ...existingFields],
                })
              } else {
                // Remove url field if input was cleared
                if (existingFields.length !== ref.fields.length) {
                  store.updateReference(node.attrs.referenceId as string, { fields: existingFields })
                }
              }
            }
          }

          const tr = editor.state.tr.setNodeMarkup(pos, undefined, newAttrs)
          editor.view.dispatch(tr)
          return false
        }
      })
    }
    setEditing(false)
  }, [editor, fn.id, urlDraft])

  return (
    <li
      className="footnotes-footer-item"
      data-footnote-list-id={fn.id}
    >
      <button
        className="footnotes-footer-number"
        onClick={() => scrollToRef(fn.id)}
        title={`Jump to [${fn.number}] in text`}
      >
        [{fn.number}]
      </button>

      {editing ? (
        <div className="footnote-edit-group">
          <FootnoteMiniEditor
            initialContent={fn.content}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            autoFocus
          />
          <div className="footnote-url-input-row">
            <span className="footnote-url-icon">🔗</span>
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setUrlDraft(referenceUrl ?? "")
                  setEditing(false)
                }
                e.stopPropagation()
              }}
              placeholder="https://..."
              className="footnote-url-input"
            />
          </div>
        </div>
      ) : plainText ? (
        <span
          className="footnotes-footer-content"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {plainText}
        </span>
      ) : (
        <button
          className="footnotes-footer-empty"
          onClick={() => setEditing(true)}
        >
          Click to add content
        </button>
      )}

      {referenceUrl && (
        <a
          href={referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footnote-footer-url"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 {referenceUrl.replace(/^https?:\/\//, "").split("/")[0]}
        </a>
      )}

      {fn.count > 1 && (
        <span className="footnotes-footer-count">({fn.count}× referenced)</span>
      )}
    </li>
  )
}

export function FootnotesFooter({ editor }: FootnotesFooterProps) {
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([])
  const [collapsed, setCollapsed] = useState(true)
  // Track which footnote ID was clicked from body text — auto-expand + scroll to it
  const pendingScrollRef = useRef<string | null>(null)
  // Which footnote ID should auto-enter edit mode (set by "Edit" button in popover)
  const [autoEditId, setAutoEditId] = useState<string | null>(null)

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

  // Listen for footnote clicks from body text → auto-expand and scroll (+ optional edit)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.id) {
        setCollapsed(false)
        pendingScrollRef.current = detail.id
        // If edit=true, auto-activate editing for this footnote
        if (detail.edit) {
          setAutoEditId(detail.id)
        }
      }
    }
    window.addEventListener("plot:scroll-to-footnote", handler)
    return () => window.removeEventListener("plot:scroll-to-footnote", handler)
  }, [])

  // After expanding, scroll to the pending footnote
  useEffect(() => {
    if (!collapsed && pendingScrollRef.current) {
      const id = pendingScrollRef.current
      pendingScrollRef.current = null
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-footnote-list-id="${id}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
    }
  }, [collapsed])

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
      <button
        className="footnotes-footer-toggle"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={`footnotes-footer-chevron ${collapsed ? "" : "footnotes-footer-chevron-open"}`}>▶</span>
        <span className="footnotes-footer-title">FOOTNOTES</span>
        <span className="footnotes-footer-count-badge">{uniqueFootnotes.length}</span>
      </button>
      {!collapsed && (
        <ol className="footnotes-footer-list animate-in fade-in duration-150">
          {uniqueFootnotes.map((fn) => (
            <FootnoteRow
              key={fn.id}
              fn={fn}
              editor={editor!}
              scrollToRef={scrollToRef}
              autoEdit={autoEditId === fn.id}
              onEditStarted={() => setAutoEditId(null)}
            />
          ))}
        </ol>
      )}
    </div>
  )
}
