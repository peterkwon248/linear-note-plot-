"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import type { WikiArticle } from "@/lib/types"
import { usePlotStore } from "@/lib/store"
import { getBlockBody } from "@/lib/wiki-block-body-store"
import { cn } from "@/lib/utils"

interface FootnoteEntry {
  id: string
  content: string
  contentJson: Record<string, unknown> | null
  referenceId: string | null
  blockId: string
  globalNumber: number
}

/** Extract footnoteRef nodes from a TipTap JSON document */
function extractFootnoteRefs(json: Record<string, unknown> | null | undefined): Array<{ id: string; content: string; contentJson: Record<string, unknown> | null; referenceId: string | null }> {
  if (!json) return []
  const results: Array<{ id: string; content: string; contentJson: Record<string, unknown> | null; referenceId: string | null }> = []
  function walk(node: any) {
    if (!node) return
    if (node.type === "footnoteRef" && node.attrs?.id) {
      results.push({
        id: node.attrs.id as string,
        content: (node.attrs.content as string) ?? "",
        contentJson: (node.attrs.contentJson as Record<string, unknown>) ?? null,
        referenceId: (node.attrs.referenceId as string) ?? null,
      })
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child)
    }
  }
  walk(json)
  return results
}

interface WikiFootnotesSectionProps {
  article: WikiArticle
}

export function WikiFootnotesSection({ article }: WikiFootnotesSectionProps) {
  const references = usePlotStore((s) => s.references)
  const [blockContents, setBlockContents] = useState<Map<string, Record<string, unknown> | null>>(new Map())
  const [collapsed, setCollapsed] = useState(false)

  // Listen for collapse-all / expand-all broadcast
  useEffect(() => {
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setCollapsed(c)
    }
    window.addEventListener("plot:set-all-collapsed", handler)
    return () => window.removeEventListener("plot:set-all-collapsed", handler)
  }, [])

  // Load all text blocks' contentJson from IDB
  const textBlockIds = useMemo(
    () => article.blocks.filter((b) => b.type === "text").map((b) => b.id),
    [article.blocks]
  )

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      const entries = new Map<string, Record<string, unknown> | null>()
      await Promise.all(
        textBlockIds.map(async (blockId) => {
          // Check in-memory first (block.contentJson from store)
          const block = article.blocks.find((b) => b.id === blockId)
          if (block?.contentJson && Object.keys(block.contentJson).length > 0) {
            entries.set(blockId, block.contentJson)
            return
          }
          // Fall back to IDB
          const body = await getBlockBody(blockId)
          entries.set(blockId, body?.contentJson ?? null)
        })
      )
      if (!cancelled) setBlockContents(entries)
    }
    loadAll()
    return () => { cancelled = true }
  }, [textBlockIds, article.blocks])

  // Collect all footnotes in document order
  const footnotes = useMemo(() => {
    const results: FootnoteEntry[] = []
    const seen = new Set<string>()
    let globalNum = 0

    for (const block of article.blocks) {
      if (block.type !== "text") continue
      const json = blockContents.get(block.id)
      const refs = extractFootnoteRefs(json)
      for (const ref of refs) {
        if (seen.has(ref.id)) continue
        seen.add(ref.id)
        globalNum++
        results.push({
          id: ref.id,
          content: ref.content,
          contentJson: ref.contentJson,
          referenceId: ref.referenceId,
          blockId: block.id,
          globalNumber: globalNum,
        })
      }
    }
    return results
  }, [article.blocks, blockContents])

  // Listen for scroll-to-footnote events from inline badges
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.id) return
      // Auto-expand if collapsed
      setCollapsed(false)
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-wiki-footnote-id="${detail.id}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    }
    window.addEventListener("plot:scroll-to-footnote", handler)
    return () => window.removeEventListener("plot:scroll-to-footnote", handler)
  }, [])

  if (footnotes.length === 0) return null

  return (
    <div className="mt-10 border-t border-border/40 pt-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 py-0.5 mb-0"
      >
        <span className={cn(
          "text-[10px] text-muted-foreground/60 transition-transform duration-150",
          !collapsed && "rotate-90"
        )}>▶</span>
        <span className="text-[1em] font-semibold uppercase tracking-[0.05em] text-muted-foreground/70">FOOTNOTES</span>
        <span className="text-[0.875em] font-medium text-muted-foreground/80 bg-hover-bg rounded px-[5px] min-w-[18px] text-center tabular-nums">{footnotes.length}</span>
      </button>

      {!collapsed && (
        <ol className="list-none p-0 m-0 mt-2 flex flex-col gap-1 text-[0.875em] text-muted-foreground">
          {footnotes.map((fn) => {
            const ref = fn.referenceId ? references[fn.referenceId] : null
            const urlField = ref?.fields.find((f) => f.key.toLowerCase() === "url")
            const url = urlField?.value || null

            return (
              <li
                key={fn.id}
                data-wiki-footnote-id={fn.id}
                className="flex items-baseline gap-1.5 leading-relaxed"
              >
                <button
                  onClick={() => {
                    const el = document.querySelector(`[data-footnote-id="${fn.id}"]`)
                    el?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }}
                  className="shrink-0 text-accent font-semibold text-[0.875em] min-w-[20px] text-right hover:opacity-70 hover:underline transition-opacity bg-transparent border-none p-0 cursor-pointer"
                >
                  [{fn.globalNumber}]
                </button>
                <span className="flex-1 min-w-0 break-words">
                  {fn.content || <span className="italic opacity-40">Empty footnote</span>}
                  {url && (
                    <>
                      {" "}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent/60 hover:text-accent hover:underline transition-colors"
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
        </ol>
      )}
    </div>
  )
}

/* ── Wiki References Section (bibliography, no inline [N] markers) ── */

interface WikiReferencesSectionProps {
  article: WikiArticle
  editable?: boolean
}

export function WikiReferencesSection({ article, editable = false }: WikiReferencesSectionProps) {
  const references = usePlotStore((s) => s.references)
  const [refCollapsed, setRefCollapsed] = useState(false)

  // Listen for collapse-all / expand-all broadcast
  useEffect(() => {
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setRefCollapsed(c)
    }
    window.addEventListener("plot:set-all-collapsed", handler)
    return () => window.removeEventListener("plot:set-all-collapsed", handler)
  }, [])

  const addArticleReference = usePlotStore((s) => s.addArticleReference)
  const removeArticleReference = usePlotStore((s) => s.removeArticleReference)
  const createReference = usePlotStore((s) => s.createReference)
  const updateReference = usePlotStore((s) => s.updateReference)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"search" | "create" | "edit">("search")
  const [editingRefId, setEditingRefId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newContent, setNewContent] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const linkedRefs = useMemo(() => {
    const ids = article.referenceIds ?? []
    return ids.map((id) => references[id]).filter(Boolean)
  }, [article.referenceIds, references])

  // All references not already linked
  const availableRefs = useMemo(() => {
    const linkedSet = new Set(article.referenceIds ?? [])
    return Object.values(references)
      .filter((r) => !linkedSet.has(r.id) && !r.trashed && r.title?.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [references, article.referenceIds])

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
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  const closeModal = () => {
    setShowModal(false)
    setSearch("")
    setNewTitle("")
    setNewUrl("")
    setNewContent("")
  }

  const openEditModal = (refId: string) => {
    const ref = references[refId]
    if (!ref) return
    setEditingRefId(refId)
    setModalMode("edit")
    setNewTitle(ref.title)
    setNewUrl(ref.fields.find((f) => f.key.toLowerCase() === "url")?.value ?? "")
    setNewContent(ref.content)
    setShowModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleSaveEdit = () => {
    if (!editingRefId || !newTitle.trim()) return
    const trimmedUrl = newUrl.trim()
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
    })
    closeModal()
    setEditingRefId(null)
  }

  const handleLinkExisting = (refId: string) => {
    addArticleReference(article.id, refId)
    closeModal()
  }

  const switchToCreate = (prefillTitle?: string) => {
    setModalMode("create")
    setNewTitle(prefillTitle ?? search)
    setNewUrl("")
    setNewContent("")
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleCreateAndLink = () => {
    if (!newTitle.trim()) return
    const fields = newUrl.trim() ? [{ key: "URL", value: newUrl.trim() }] : []
    const refId = createReference({
      title: newTitle.trim(),
      content: newContent.trim() || newTitle.trim(),
      fields,
    } as any)
    addArticleReference(article.id, refId)
    closeModal()
  }

  if (linkedRefs.length === 0 && !editable) return null

  return (
    <div className="mt-6 border-t border-border/30 pt-4">
      <button
        onClick={() => setRefCollapsed(!refCollapsed)}
        className="flex items-center gap-1.5 py-0.5 mb-0"
      >
        <span className={cn(
          "text-[10px] text-muted-foreground/60 transition-transform duration-150",
          !refCollapsed && "rotate-90"
        )}>▶</span>
        <span className="text-[1em] font-semibold uppercase tracking-[0.05em] text-muted-foreground/70">REFERENCES</span>
        <span className="text-[0.875em] font-medium text-muted-foreground/80 bg-hover-bg rounded px-[5px] min-w-[18px] text-center tabular-nums">{linkedRefs.length}</span>
      </button>

      {!refCollapsed && (
        <>
          {linkedRefs.length > 0 && (
            <ul className="space-y-1 mt-2 mb-3 text-[0.875em]">
              {linkedRefs.map((ref) => {
                const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
                const url = urlField?.value || null
                return (
                  <li
                    key={ref.id}
                    className="group flex items-start gap-2 rounded-md px-2 py-0.5 hover:bg-hover-bg transition-colors cursor-pointer"
                    onClick={() => editable && openEditModal(ref.id)}
                  >
                    <span className="shrink-0 text-muted-foreground/40 pt-0.5">•</span>
                    <span className="flex-1 text-foreground/70">
                      <span className="font-medium">{ref.title}</span>
                      {ref.content && ref.content !== ref.title && (
                        <span className="text-muted-foreground/50"> — {ref.content.length > 80 ? ref.content.slice(0, 80) + "…" : ref.content}</span>
                      )}
                      {url && (
                        <>
                          {" "}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent/60 hover:text-accent hover:underline transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {url.replace(/^https?:\/\//, "").split("/")[0]}
                          </a>
                        </>
                      )}
                    </span>
                    {editable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeArticleReference(article.id, ref.id) }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/40 hover:text-destructive transition-all"
                        title="Remove from this article"
                      >
                        ×
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {editable && (
            <button
              onClick={openModal}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-hover-bg transition-colors"
            >
              + Add Reference
            </button>
          )}
        </>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={closeModal}>
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
                    className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
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
                    <p className="px-3 py-3 text-2xs text-muted-foreground/40 text-center">
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
                        if (e.key === "Enter") handleCreateAndLink()
                        if (e.key === "Escape") closeModal()
                      }}
                      placeholder="Reference title..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">URL (optional)</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">Description (optional)</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent resize-none"
                    />
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

