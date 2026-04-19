"use client"

/**
 * ReferencesBox — 노트/위키 공용 하단 Reference 박스.
 *
 * 박스 하나에 numbered footnotes + bibliography refs 를 함께 묶어 렌더한다.
 * 박스 제목은 없고 좌상단 chevron + total count 만 표시.
 * Note/Wiki 의 데이터 수집·링크 액션 차이는 container(adapter)에서 흡수.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export interface FootnoteItem {
  id: string
  content: string
  contentJson: Record<string, unknown> | null
  referenceId: string | null
  number: number
  count?: number // 중복 참조 횟수 (노트 live editor 전용)
}

export interface ReferencesBoxProps {
  footnotes: FootnoteItem[]
  bibliographyRefIds: string[]
  editable?: boolean
  /** 본문의 footnote 마커로 스크롤 */
  onScrollToFootnote?: (id: string) => void
  /** 각주 클릭 시 편집 모달 — 지원하는 경우만 전달 (위키 IDB 블록은 미지원) */
  onEditFootnote?: (fn: FootnoteItem) => void
  /** 기존 Reference 를 현재 문서에 링크 */
  onLinkReference?: (refId: string) => void
  /** 새 Reference 생성 후 현재 문서에 링크 */
  onCreateAndLinkReference?: (ref: {
    title: string
    content: string
    fields: Array<{ key: string; value: string }>
  }) => void
  /** 현재 문서에서 Reference 링크 해제 */
  onRemoveReference?: (refId: string) => void
}

export function ReferencesBox({
  footnotes,
  bibliographyRefIds,
  editable = true,
  onScrollToFootnote,
  onEditFootnote,
  onLinkReference,
  onCreateAndLinkReference,
  onRemoveReference,
}: ReferencesBoxProps) {
  const references = usePlotStore((s) => s.references)
  const updateReference = usePlotStore((s) => s.updateReference)

  const [collapsed, setCollapsed] = useState(false)
  const pendingScrollRef = useRef<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"search" | "create" | "edit">("search")
  const [editingRefId, setEditingRefId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [newContent, setNewContent] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const bibliographyRefs = useMemo(
    () => bibliographyRefIds.map((id) => references[id]).filter(Boolean),
    [bibliographyRefIds, references],
  )

  // Search 모드 available refs (이미 링크된 건 제외)
  const availableRefs = useMemo(() => {
    const linkedSet = new Set(bibliographyRefIds)
    // footnote referenceId 도 exclude
    for (const fn of footnotes) {
      if (fn.referenceId) linkedSet.add(fn.referenceId)
    }
    return Object.values(references)
      .filter((r) => !linkedSet.has(r.id) && !r.trashed && r.title?.trim())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [references, bibliographyRefIds, footnotes])

  const filteredRefs = useMemo(() => {
    if (!search.trim()) return availableRefs.slice(0, 10)
    const q = search.toLowerCase()
    return availableRefs
      .filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))
      .slice(0, 10)
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
    setShowModal(true)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const switchToCreate = (prefillTitle?: string) => {
    setModalMode("create")
    setNewTitle(prefillTitle ?? search)
    setNewUrl("")
    setNewContent("")
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const handleLinkExisting = (refId: string) => {
    onLinkReference?.(refId)
    closeModal()
  }

  const handleCreateAndLink = () => {
    if (!newTitle.trim()) return
    const fields = newUrl.trim() ? [{ key: "URL", value: newUrl.trim() }] : []
    onCreateAndLinkReference?.({
      title: newTitle.trim(),
      content: newContent.trim() || newTitle.trim(),
      fields,
    })
    closeModal()
  }

  const handleSaveEdit = () => {
    if (!editingRefId || !newTitle.trim()) return
    const trimmedUrl = newUrl.trim()
    const ref = references[editingRefId]
    if (!ref) return
    const updatedFields = trimmedUrl
      ? ref.fields.some((f) => f.key.toLowerCase() === "url")
        ? ref.fields.map((f) =>
            f.key.toLowerCase() === "url" ? { ...f, value: trimmedUrl } : f,
          )
        : [...ref.fields, { key: "URL", value: trimmedUrl }]
      : ref.fields.filter((f) => f.key.toLowerCase() !== "url")
    updateReference(editingRefId, {
      title: newTitle.trim(),
      content: newContent.trim(),
      fields: updatedFields,
    })
    closeModal()
  }

  // External triggers
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

  useEffect(() => {
    const handler = () => {
      if (editable) openModal()
    }
    window.addEventListener("plot:open-reference-picker", handler)
    return () => window.removeEventListener("plot:open-reference-picker", handler)
  }, [editable])

  useEffect(() => {
    const scope = rootRef.current?.closest("[data-editor-scope]")
    if (!scope) return
    const handler = (e: Event) => {
      const { collapsed: c } = (e as CustomEvent).detail
      setCollapsed(c)
    }
    scope.addEventListener("plot:set-all-collapsed", handler as EventListener)
    return () =>
      scope.removeEventListener("plot:set-all-collapsed", handler as EventListener)
  }, [])

  useEffect(() => {
    if (!collapsed && pendingScrollRef.current) {
      const id = pendingScrollRef.current
      pendingScrollRef.current = null
      requestAnimationFrame(() => {
        const el = document.querySelector(
          `[data-references-footnote-id="${id}"]`,
        )
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
    }
  }, [collapsed])

  const hasFootnotes = footnotes.length > 0
  const hasBibliography = bibliographyRefs.length > 0
  const hasContent = hasFootnotes || hasBibliography
  const totalCount = footnotes.length + bibliographyRefs.length

  // Render nothing if there's truly no content and no way to add (viewer-only empty state)
  if (!hasContent && !editable) {
    return <div ref={rootRef} style={{ display: "none" }} />
  }

  return (
    <div ref={rootRef}>
      {hasContent && (
        <div className="mt-10 border-t border-border/40 pt-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 py-0.5 mb-0"
            aria-label={collapsed ? "Expand references" : "Collapse references"}
          >
            <span
              className={cn(
                "text-[10px] text-muted-foreground/60 transition-transform duration-150",
                !collapsed && "rotate-90",
              )}
            >
              ▶
            </span>
            <span className="text-[0.875em] font-medium text-muted-foreground/60 min-w-[18px] text-center tabular-nums">
              {totalCount}
            </span>
          </button>

          {!collapsed && (
            <div className="mt-2 flex flex-col">
              {/* Numbered footnotes */}
              {hasFootnotes && (
                <ol className="list-none p-0 m-0 flex flex-col gap-1 text-[0.875em] text-muted-foreground">
                  {footnotes.map((fn) => (
                    <FootnoteRow
                      key={fn.id}
                      fn={fn}
                      editable={editable}
                      onScrollToFootnote={onScrollToFootnote}
                      onEditFootnote={onEditFootnote}
                    />
                  ))}
                </ol>
              )}

              {/* Divider: 양쪽 모두 있을 때만 */}
              {hasFootnotes && hasBibliography && (
                <div className="my-3 border-t border-border/30" />
              )}

              {/* Bibliography bullets */}
              {hasBibliography && (
                <ul className="list-none p-0 m-0 space-y-1 text-[0.875em]">
                  {bibliographyRefs.map((ref) => {
                    const urlField = ref.fields.find((f) => f.key.toLowerCase() === "url")
                    const url = urlField?.value || null
                    return (
                      <li
                        key={ref.id}
                        className={cn(
                          "group flex items-start gap-2 rounded-md px-2 py-0.5 transition-colors",
                          editable && "hover:bg-hover-bg cursor-pointer",
                        )}
                        onClick={() => editable && openEditModal(ref.id)}
                      >
                        <span className="shrink-0 text-muted-foreground/40 pt-0.5">•</span>
                        <span className="flex-1 text-foreground/70">
                          <span className="font-medium">{ref.title}</span>
                          {ref.content && ref.content !== ref.title && (
                            <span className="text-muted-foreground/50">
                              {" "}
                              —{" "}
                              {ref.content.length > 80
                                ? ref.content.slice(0, 80) + "…"
                                : ref.content}
                            </span>
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
                        {editable && onRemoveReference && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveReference(ref.id)
                            }}
                            className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/40 hover:text-destructive transition-all"
                            title="Remove from this document"
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
                  className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-hover-bg transition-colors self-start"
                >
                  + Add Reference
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* viewer에 아무 내용 없는데 editable은 true 인 edge case — 비어있는 상태에서도 Add 버튼 노출 */}
      {!hasContent && editable && (
        <div className="mt-10 border-t border-border/40 pt-4">
          <button
            onClick={openModal}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-hover-bg transition-colors"
          >
            + Add Reference
          </button>
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
                  <h3 className="text-note font-semibold text-foreground mb-3">
                    {modalMode === "edit" ? "Edit Reference" : "New Reference"}
                  </h3>
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
                        if (e.key === "Enter")
                          modalMode === "edit" ? handleSaveEdit() : handleCreateAndLink()
                        if (e.key === "Escape") closeModal()
                      }}
                      placeholder="Reference title..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">
                      URL (optional)
                    </label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full h-8 rounded-md border border-border bg-secondary/50 px-3 text-note text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground/60 mb-1 block">
                      Description (optional)
                    </label>
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
                  ) : (
                    <span />
                  )}
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

interface FootnoteRowProps {
  fn: FootnoteItem
  editable: boolean
  onScrollToFootnote?: (id: string) => void
  onEditFootnote?: (fn: FootnoteItem) => void
}

function FootnoteRow({ fn, editable, onScrollToFootnote, onEditFootnote }: FootnoteRowProps) {
  const references = usePlotStore((s) => s.references)
  const url = useMemo(() => {
    if (!fn.referenceId) return null
    const ref = references[fn.referenceId]
    if (!ref) return null
    return ref.fields.find((f) => f.key.toLowerCase() === "url")?.value || null
  }, [fn.referenceId, references])

  const canEdit = editable && onEditFootnote

  return (
    <li
      data-references-footnote-id={fn.id}
      className="flex items-baseline gap-1.5 leading-relaxed"
    >
      <button
        onClick={() => onScrollToFootnote?.(fn.id)}
        className="shrink-0 text-accent font-semibold text-[0.875em] min-w-[20px] text-right hover:opacity-70 hover:underline transition-opacity bg-transparent border-none p-0 cursor-pointer"
        title={`Jump to [${fn.number}] in text`}
      >
        [{fn.number}]
      </button>
      <span className="flex-1 min-w-0 break-words">
        {fn.content ? (
          <span
            onClick={canEdit ? () => onEditFootnote!(fn) : undefined}
            className={canEdit ? "cursor-pointer hover:underline" : undefined}
            title={canEdit ? "Click to edit" : undefined}
          >
            {fn.content}
          </span>
        ) : canEdit ? (
          <button
            onClick={() => onEditFootnote!(fn)}
            className="italic opacity-40 hover:opacity-60"
          >
            Click to add content
          </button>
        ) : (
          <span className="italic opacity-40">Empty footnote</span>
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
        {fn.count && fn.count > 1 && (
          <span className="ml-1 text-[0.8em] text-muted-foreground/50">
            ({fn.count}× referenced)
          </span>
        )}
      </span>
    </li>
  )
}
