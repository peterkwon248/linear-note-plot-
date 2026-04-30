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
  noteId?: string
  editable?: boolean
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

  const referenceImageUrl = useMemo(() => {
    if (!fn.referenceId) return null
    const ref = references[fn.referenceId]
    return ref?.imageUrl || null
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

      {referenceImageUrl && (
        <div className="w-full mt-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={referenceImageUrl}
            alt=""
            className="max-h-24 rounded object-contain"
            onError={(e) => { e.currentTarget.style.display = "none" }}
          />
        </div>
      )}
    </li>
  )
}

export function FootnotesFooter({ editor, noteId, editable = true }: FootnotesFooterProps) {
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

  // Ref for scoped event listener (Split View pane independence)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Listen for collapse-all / expand-all broadcast (scoped to this editor container)
  useEffect(() => {
    const scope = rootRef.current?.closest('[data-editor-scope]')
    if (!scope) return
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setCollapsed(c)
    }
    scope.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () => scope.removeEventListener("plot:set-all-collapsed", handler as EventListener)
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

  // Deduplicate footnotes by id (must be before any conditional return — hooks above)
  const uniqueFootnotes = useMemo(() => {
    const seen = new Map<string, FootnoteItem & { count: number }>()
    for (const fn of footnotes) {
      if (seen.has(fn.id)) {
        seen.get(fn.id)!.count++
      } else {
        seen.set(fn.id, { ...fn, count: 1 })
      }
    }
    return Array.from(seen.values())
  }, [footnotes])

  // Collect unique referenceIds linked via footnotes
  const footnoteRefIds = useMemo(() => {
    const ids = new Set<string>()
    for (const fn of uniqueFootnotes) {
      if (fn.referenceId) ids.add(fn.referenceId)
    }
    return Array.from(ids)
  }, [uniqueFootnotes])

  const scrollToRef = useCallback((id: string) => {
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
  }, [editor])

  const hasFootnotes = footnotes.length > 0

  return (
    <div ref={rootRef}>
      {hasFootnotes && (
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
      )}
      <NoteReferencesFooter
        footnoteRefIds={footnoteRefIds}
        noteId={noteId}
        editable={editable}
      />
    </div>
  )
}

/* ── Note References Footer (standalone document-level references with modal) ── */

interface NoteReferencesFooterProps {
  footnoteRefIds: string[]
  noteId?: string
  editable?: boolean
}

function NoteReferencesFooter({ footnoteRefIds, noteId, editable = true }: NoteReferencesFooterProps) {
  const references = usePlotStore((s) => s.references)
  const addNoteReference = usePlotStore((s) => s.addNoteReference)
  const removeNoteReference = usePlotStore((s) => s.removeNoteReference)
  const createReference = usePlotStore((s) => s.createReference)
  const updateReference = usePlotStore((s) => s.updateReference)
  const noteReferenceIds = usePlotStore((s) => {
    if (!noteId) return [] as string[]
    const note = s.notes.find((n: any) => n.id === noteId)
    return (note?.referenceIds ?? []) as string[]
  })

  const [collapsed, setCollapsed] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"search" | "create" | "edit">("search")
  const [editingRefId, setEditingRefId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newImageUrl, setNewImageUrl] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Show only note.referenceIds that are NOT already shown in FOOTNOTES section
  const bulletRefIds = useMemo(() => {
    const footnoteSet = new Set(footnoteRefIds)
    return noteReferenceIds.filter((id: string) => !footnoteSet.has(id))
  }, [noteReferenceIds, footnoteRefIds])

  const bulletRefs = useMemo(() => {
    return bulletRefIds.map((id: string) => references[id]).filter(Boolean)
  }, [bulletRefIds, references])

  // All references not already linked to this note
  const availableRefs = useMemo(() => {
    const linkedSet = new Set(noteReferenceIds)
    return Object.values(references)
      .filter((r) => !linkedSet.has(r.id) && !r.trashed && r.title?.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [references, noteReferenceIds])

  const filteredRefs = useMemo(() => {
    if (!search.trim()) return availableRefs.slice(0, 10)
    const q = search.toLowerCase()
    return availableRefs.filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)).slice(0, 10)
  }, [availableRefs, search])

  const openModal = () => {
    setShowModal(true)
    setModalMode("search")
    setSearch("")
    setNewTitle("")
    setNewUrl("")
    setNewContent("")
    setNewImageUrl("")
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  // Listen for external trigger (slash command, insert menu)
  useEffect(() => {
    if (!noteId) return
    const handler = () => {
      if (editable) openModal()
    }
    window.addEventListener("plot:open-reference-picker", handler)
    return () => window.removeEventListener("plot:open-reference-picker", handler)
  }, [noteId, editable])

  // Ref for scoped event listener (Split View pane independence)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Listen for collapse-all / expand-all broadcast (scoped to this editor container)
  useEffect(() => {
    const scope = rootRef.current?.closest('[data-editor-scope]')
    if (!scope) return
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setCollapsed(c)
    }
    scope.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () => scope.removeEventListener("plot:set-all-collapsed", handler as EventListener)
  }, [])

  const closeModal = () => {
    setShowModal(false)
    setSearch("")
    setNewTitle("")
    setNewUrl("")
    setNewContent("")
    setNewImageUrl("")
    setEditingRefId(null)
  }

  const openEditModal = (refId: string) => {
    const ref = references[refId]
    if (!ref) return
    setEditingRefId(refId)
    setModalMode("edit")
    setNewTitle(ref.title)
    setNewUrl(ref.fields.find((f) => f.key.toLowerCase() === "url")?.value ?? "")
    setNewContent(ref.content)
    setNewImageUrl(ref.imageUrl ?? "")
    setShowModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleSaveEdit = () => {
    if (!editingRefId || !newTitle.trim()) return
    const trimmedUrl = newUrl.trim()
    const trimmedImageUrl = newImageUrl.trim()
    const ref = references[editingRefId]
    if (!ref) return
    const updatedFields = trimmedUrl
      ? ref.fields.some((f) => f.key.toLowerCase() === "url")
        ? ref.fields.map((f) => f.key.toLowerCase() === "url" ? { ...f, value: trimmedUrl } : f)
        : [...ref.fields, { key: "URL", value: trimmedUrl }]
      : ref.fields.filter((f) => f.key.toLowerCase() !== "url")
    updateReference(editingRefId, {
      title: newTitle.trim(),
      content: newContent.trim(),
      fields: updatedFields,
      imageUrl: trimmedImageUrl || null,
    })
    closeModal()
  }

  const handleLinkExisting = (refId: string) => {
    if (!noteId) return
    addNoteReference(noteId, refId)
    closeModal()
  }

  const switchToCreate = (prefillTitle?: string) => {
    setModalMode("create")
    setNewTitle(prefillTitle ?? search)
    setNewUrl("")
    setNewContent("")
    setNewImageUrl("")
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleCreateAndLink = () => {
    if (!newTitle.trim() || !noteId) return
    const fields = newUrl.trim() ? [{ key: "URL", value: newUrl.trim() }] : []
    const trimmedImageUrl = newImageUrl.trim()
    const refId = createReference({
      title: newTitle.trim(),
      content: newContent.trim() || newTitle.trim(),
      fields,
      imageUrl: trimmedImageUrl || null,
    } as any)
    addNoteReference(noteId, refId)
    closeModal()
  }

  // No noteId = can't manage references (still render wrapper for scoped listener consistency)
  if (!noteId) return <div ref={rootRef} style={{ display: "none" }} />

  // Only show visual section when there are actual references
  const hasReferences = bulletRefs.length > 0

  return (
    <div ref={rootRef}>
      {hasReferences && (
      <div className="footnotes-footer" style={{ marginTop: "0.5rem" }}>
        <button
          className="footnotes-footer-toggle"
          onClick={() => setCollapsed((c) => !c)}
        >
          <span className={`footnotes-footer-chevron ${collapsed ? "" : "footnotes-footer-chevron-open"}`}>▶</span>
          <span className="footnotes-footer-title">REFERENCES</span>
          <span className="footnotes-footer-count-badge">{bulletRefs.length}</span>
        </button>
        {!collapsed && (
          <>
              <ul className="footnotes-footer-list animate-in fade-in duration-150" style={{ listStyle: "none" }}>
                {bulletRefs.map((ref) => {
                  const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
                  const url = urlField?.value || null
                  return (
                    <li
                      key={ref.id}
                      className="footnotes-footer-item group"
                      onClick={() => editable && openEditModal(ref.id)}
                      style={{ cursor: editable ? "pointer" : "default" }}
                    >
                      <span style={{ flexShrink: 0, opacity: 0.4 }}>•</span>
                      <span className="footnotes-footer-content" style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{ref.title}</span>
                        {ref.content && ref.content !== ref.title && (
                          <span style={{ opacity: 0.5 }}> — {ref.content.length > 60 ? ref.content.slice(0, 60) + "..." : ref.content}</span>
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
                      {editable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNoteReference(noteId, ref.id) }}
                          className="footnotes-footer-remove"
                          title="Remove from this note"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            {editable && (
              <button
                onClick={openModal}
                className="footnotes-footer-add"
              >
                + Add Reference
              </button>
            )}
          </>
        )}
      </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
          role="dialog"
          onClick={closeModal}
        >
          <div
            className="w-[420px] rounded-xl border border-border bg-surface-overlay shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {modalMode === "search" ? (
              <>
                <div className="px-5 pt-4 pb-2">
                  <h3 className="text-note font-semibold text-foreground mb-3">Add Reference</h3>
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") closeModal()
                    }}
                    placeholder="Search existing references..."
                    className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto px-2 pb-2">
                  {filteredRefs.map((ref) => {
                    const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
                    return (
                      <button
                        key={ref.id}
                        onClick={() => handleLinkExisting(ref.id)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-note text-foreground/80 hover:bg-hover-bg transition-colors"
                      >
                        <span className="truncate flex-1">{ref.title}</span>
                        {urlField?.value && (
                          <span className="shrink-0 text-2xs text-accent/40">🔗</span>
                        )}
                      </button>
                    )
                  })}
                  {filteredRefs.length === 0 && (
                    <p className="px-3 py-3 text-2xs text-muted-foreground/70 text-center">
                      {search.trim() ? "No matching references" : "No references in Library"}
                    </p>
                  )}
                </div>
                <div className="border-t border-border/30 px-5 py-3 flex justify-between items-center">
                  <button
                    onClick={() => switchToCreate()}
                    className="text-2xs text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    + Create new reference
                  </button>
                  <button
                    onClick={closeModal}
                    className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 pt-4 pb-1">
                  <h3 className="text-note font-semibold text-foreground mb-3">{modalMode === "edit" ? "Edit Reference" : "New Reference"}</h3>
                </div>
                <div className="px-5 space-y-3 pb-4">
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">Title</label>
                    <input
                      ref={titleRef}
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") modalMode === "edit" ? handleSaveEdit() : handleCreateAndLink()
                        if (e.key === "Escape") closeModal()
                      }}
                      placeholder="Reference title..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">URL (optional)</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">Description (optional)</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">Image URL (optional)</label>
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.png"
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                    />
                    {newImageUrl.trim() && (
                      <div className="mt-1.5 rounded-md overflow-hidden border border-border/40 bg-secondary/30 inline-block max-w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={newImageUrl.trim()}
                          alt="Preview"
                          className="max-h-24 object-contain"
                          onError={(e) => { e.currentTarget.style.display = "none" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-border/30 px-5 py-3 flex justify-between items-center">
                  {modalMode === "create" ? (
                    <button
                      onClick={() => setModalMode("search")}
                      className="text-2xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                      ← Back to search
                    </button>
                  ) : <span />}
                  <div className="flex gap-2">
                    <button
                      onClick={closeModal}
                      className="rounded-md px-3 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-hover-bg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={modalMode === "edit" ? handleSaveEdit : handleCreateAndLink}
                      disabled={!newTitle.trim()}
                      className="rounded-md bg-accent px-3 py-1.5 text-2xs font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
