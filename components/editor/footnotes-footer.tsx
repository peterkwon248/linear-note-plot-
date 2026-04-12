"use client"

import { useEffect, useCallback, useRef, useMemo, useState } from "react"
import type { Editor } from "@tiptap/react"
import { usePlotStore } from "@/lib/store"
import { openFootnoteModal } from "./footnote-edit-modal"

interface FootnoteItem {
  id: string
  content: string
  contentJson: Record<string, unknown> | null
  referenceId: string | null
  number: number
}


interface FootnotesFooterProps {
  editor: Editor | null
}

/** Read-only footnote row — click to open modal editor */
function FootnoteRow({
  fn,
  editor,
  scrollToRef,
}: {
  fn: FootnoteItem & { count: number }
  editor: Editor
  scrollToRef: (id: string) => void
}) {
  const references = usePlotStore((s) => s.references)

  const referenceUrl = useMemo(() => {
    if (!fn.referenceId) return null
    const ref = references[fn.referenceId]
    if (!ref) return null
    const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
    return urlField?.value || null
  }, [fn.referenceId, references])

  const openModal = () => {
    if (!editor.isEditable) return
    openFootnoteModal({
      footnoteId: fn.id,
      content: fn.content,
      contentJson: fn.contentJson,
      referenceId: fn.referenceId,
      onSave: ({ content: plainText, contentJson, referenceId }) => {
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "footnoteRef" && node.attrs.id === fn.id) {
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
  }

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

      {fn.content || fn.contentJson ? (
        <span
          className="footnotes-footer-content"
          onClick={openModal}
          title={editor.isEditable ? "Click to edit" : undefined}
        >
          {fn.content || ""}
        </span>
      ) : editor.isEditable ? (
        <button
          className="footnotes-footer-empty"
          onClick={openModal}
        >
          Click to add content
        </button>
      ) : null}

      {referenceUrl && (
        <a
          href={referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footnote-footer-url"
          onClick={(e) => e.stopPropagation()}
        >
          {referenceUrl.replace(/^https?:\/\//, "").split("/")[0]}
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
          contentJson: (node.attrs.contentJson as Record<string, unknown>) ?? null,
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

  // Listen for footnote clicks from body text → auto-expand and scroll
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.id) {
        setCollapsed(false)
        pendingScrollRef.current = detail.id
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

  // Collect unique referenceIds for NoteReferencesFooter
  const referenceIds = useMemo(() => {
    const ids = new Set<string>()
    for (const fn of uniqueFootnotes) {
      if (fn.referenceId) ids.add(fn.referenceId)
    }
    return Array.from(ids)
  }, [uniqueFootnotes])

  return (
    <>
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
              />
            ))}
          </ol>
        )}
      </div>
      {referenceIds.length > 0 && (
        <NoteReferencesFooter referenceIds={referenceIds} />
      )}
    </>
  )
}

/* ── Note References Footer (bullet list of all references linked via footnotes) ── */

function NoteReferencesFooter({ referenceIds }: { referenceIds: string[] }) {
  const references = usePlotStore((s) => s.references)
  const [collapsed, setCollapsed] = useState(true)

  const linkedRefs = useMemo(() => {
    return referenceIds.map((id) => references[id]).filter(Boolean)
  }, [referenceIds, references])

  if (linkedRefs.length === 0) return null

  return (
    <div className="footnotes-footer" style={{ marginTop: "0.5rem" }}>
      <button
        className="footnotes-footer-toggle"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className={`footnotes-footer-chevron ${collapsed ? "" : "footnotes-footer-chevron-open"}`}>▶</span>
        <span className="footnotes-footer-title">REFERENCES</span>
        <span className="footnotes-footer-count-badge">{linkedRefs.length}</span>
      </button>
      {!collapsed && (
        <ul className="footnotes-footer-list animate-in fade-in duration-150" style={{ listStyle: "none" }}>
          {linkedRefs.map((ref) => {
            const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
            const url = urlField?.value || null
            return (
              <li key={ref.id} className="footnotes-footer-item">
                <span style={{ flexShrink: 0, opacity: 0.4 }}>•</span>
                <span className="footnotes-footer-content" style={{ cursor: "default" }}>
                  <span style={{ fontWeight: 500 }}>{ref.title}</span>
                  {ref.content && ref.content !== ref.title && (
                    <span style={{ opacity: 0.5 }}> — {ref.content.length > 60 ? ref.content.slice(0, 60) + "…" : ref.content}</span>
                  )}
                  {url && (
                    <>
                      {" "}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footnote-footer-url"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {url.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
