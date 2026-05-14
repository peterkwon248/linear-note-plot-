"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft"
import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp"
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus"
import { Sticker as StickerIcon } from "@phosphor-icons/react/dist/ssr/Sticker"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Note as PhNote } from "@phosphor-icons/react/dist/ssr/Note"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import { PRESET_COLORS } from "@/lib/colors"
import type { Sticker } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"
import { LibraryBreadcrumb } from "@/components/library/library-breadcrumb"
import { DisplayPanel } from "@/components/display-panel"
import { FilterPanel } from "@/components/filter-panel"
import { useStickersView } from "@/lib/view-engine/use-stickers-view"
import { STICKERS_LIST_VIEW_CONFIG } from "@/lib/view-engine/view-configs"
import type { FilterRule } from "@/lib/view-engine/types"
import { StickerMemberCountChip } from "@/components/property-chips"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import { setActiveRoute } from "@/lib/table-route"

const DRAG_THRESHOLD = 5
const ROW_HEIGHT = 40
const HEADER_HEIGHT = 37

export function StickersView() {
  const stickers = usePlotStore((s) => s.stickers)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const createSticker = usePlotStore((s) => s.createSticker)
  const deleteSticker = usePlotStore((s) => s.deleteSticker)
  const updateSticker = usePlotStore((s) => s.updateSticker)
  const openNote = usePlotStore((s) => s.openNote)

  // View-engine integration (PR group-c-d-3): viewState (sort, viewMode,
  // visibleColumns) is persisted via the unified pipeline. Search uses
  // the global `searchQuery` slice. Local sortBy/hideEmpty state was removed.
  const {
    flatStickers,
    flatCount,
    totalCount,
    viewState,
    updateViewState,
  } = useStickersView()
  const isGridMode = viewState.viewMode === "grid"
  const sortField = viewState.sortFields[0]?.field ?? "name"
  const sortDirection = viewState.sortFields[0]?.direction ?? "asc"

  // UI-only local state (not in viewState)
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[5])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(null)
  const [contextMenuStickerId, setContextMenuStickerId] = useState<string | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Selection state
  const [checkedStickers, setCheckedStickers] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<number | null>(null)
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null)
  const isDraggingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const stickersRef = useRef<typeof flatStickers>(flatStickers)

  // Notes/wiki active sets — used by detail mode for membership filtering
  // (the hook handles the count derivation in flatStickers.memberCount).
  const activeNotes = useMemo(() =>
    notes.filter((n) => !n.trashed),
    [notes]
  )
  const activeWiki = wikiArticles

  // Filter toggle handler (mirrors tags-view handleTagsListFilterToggle pattern).
  const handleStickersFilterToggle = useCallback((rule: FilterRule) => {
    const exists = viewState.filters.some(
      (f) => f.field === rule.field && f.operator === rule.operator && f.value === rule.value
    )
    const newFilters = exists
      ? viewState.filters.filter((f) => !(f.field === rule.field && f.operator === rule.operator && f.value === rule.value))
      : [...viewState.filters, rule]
    updateViewState({ filters: newFilters })
  }, [viewState.filters, updateViewState])

  // Sort handler — toggles direction when same field, otherwise switches field.
  const handleSortToggle = useCallback((field: "name" | "memberCount") => {
    const currentField = viewState.sortFields[0]?.field
    const currentDir = viewState.sortFields[0]?.direction
    let nextDir: "asc" | "desc"
    if (currentField === field) {
      nextDir = currentDir === "asc" ? "desc" : "asc"
    } else {
      // Different field: name → asc default, memberCount → desc default.
      nextDir = field === "name" ? "asc" : "desc"
    }
    updateViewState({ sortFields: [{ field, direction: nextDir }] })
  }, [viewState.sortFields, updateViewState])

  // Notes attached to the currently selected sticker (active only).
  const selectedStickerNotes = useMemo(() => {
    if (!selectedStickerId) return []
    const sticker = stickers.find((s) => s.id === selectedStickerId)
    if (!sticker) return []
    const noteIdSet = new Set(
      (sticker.members ?? [])
        .filter((m) => m.kind === "note")
        .map((m) => m.id),
    )
    return activeNotes.filter((n) => noteIdSet.has(n.id))
  }, [selectedStickerId, stickers, activeNotes])

  // Wiki articles attached to the currently selected sticker.
  // Phase 2: visual verification that the cross-everything model (옵션 D2)
  // surfaces both entity kinds. Phase 3 (Universal Picker) extends this
  // to tag/label/category/file/reference.
  const selectedStickerWikis = useMemo(() => {
    if (!selectedStickerId) return []
    const sticker = stickers.find((s) => s.id === selectedStickerId)
    if (!sticker) return []
    const wikiIdSet = new Set(
      (sticker.members ?? [])
        .filter((m) => m.kind === "wiki")
        .map((m) => m.id),
    )
    return activeWiki.filter((w) => wikiIdSet.has(w.id))
  }, [selectedStickerId, stickers, activeWiki])

  const selectedStickerCount = useMemo(() => {
    if (!selectedStickerId) return 0
    const enriched = flatStickers.find((s) => s.id === selectedStickerId)
    return enriched?.memberCount ?? 0
  }, [selectedStickerId, flatStickers])

  stickersRef.current = flatStickers

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId)

  // Auto-focus
  useEffect(() => {
    if (creating) setTimeout(() => nameInputRef.current?.focus(), 0)
  }, [creating])

  useEffect(() => {
    if (editingId) setTimeout(() => editInputRef.current?.focus(), 0)
  }, [editingId])

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d`
    return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" })
  }

  // Create handler
  const handleCreate = () => {
    const name = newName.trim()
    if (name) {
      createSticker(name, newColor)
    }
    setCreating(false)
    setNewName("")
    setNewColor(PRESET_COLORS[5])
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate()
    else if (e.key === "Escape") {
      setCreating(false)
      setNewName("")
    }
  }

  // Edit handler
  const handleEditSubmit = () => {
    if (editingId) {
      const name = editName.trim()
      if (name) {
        updateSticker(editingId, { name: editName, color: editColor })
      }
    }
    setEditingId(null)
    setEditName("")
    setEditColor("")
    setColorPickerOpenId(null)
  }

  const startEdit = useCallback((sticker: Sticker) => {
    setEditingId(sticker.id)
    setEditName(sticker.name)
    setEditColor(sticker.color)
  }, [])

  const handleNameClick = useCallback((sticker: Sticker, e: React.MouseEvent) => {
    e.stopPropagation()
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      setSelectedStickerId(sticker.id)
      return
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      startEdit(sticker)
    }, 200)
  }, [startEdit])

  const handleColorDotClick = useCallback((sticker: Sticker, e: React.MouseEvent) => {
    e.stopPropagation()
    setColorPickerOpenId(sticker.id)
  }, [])

  const handleQuickColorChange = useCallback((stickerId: string, color: string) => {
    updateSticker(stickerId, { color })
  }, [updateSticker])

  const handleFabRename = useCallback(() => {
    const id = Array.from(checkedStickers)[0]
    const sticker = stickers.find((s) => s.id === id)
    if (sticker) {
      setCheckedStickers(new Set())
      startEdit(sticker)
    }
  }, [checkedStickers, stickers, startEdit])

  const handleFabRecolor = useCallback(() => {
    const id = Array.from(checkedStickers)[0]
    if (id) {
      setCheckedStickers(new Set())
      setColorPickerOpenId(id)
    }
  }, [checkedStickers])

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEditSubmit()
    else if (e.key === "Escape") {
      setEditingId(null)
      setEditName("")
    }
  }

  const handleEditColorChange = (color: string) => {
    setEditColor(color)
    if (editingId) updateSticker(editingId, { color })
  }

  const handleEditBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget as HTMLElement | null
    if (next?.closest("[data-radix-popper-content-wrapper]")) return
    handleEditSubmit()
  }

  // Selection handlers
  const toggleCheck = (stickerId: string) => {
    setCheckedStickers(prev => {
      const next = new Set(prev)
      if (next.has(stickerId)) next.delete(stickerId)
      else next.add(stickerId)
      return next
    })
  }

  const toggleAll = () => {
    if (checkedStickers.size === flatStickers.length) {
      setCheckedStickers(new Set())
    } else {
      setCheckedStickers(new Set(flatStickers.map((s) => s.id)))
    }
  }

  const handleDeleteChecked = () => {
    for (const id of checkedStickers) {
      deleteSticker(id)
    }
    setCheckedStickers(new Set())
  }

  const handleRowClick = useCallback((stickerId: string, rowIndex: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, rowIndex)
      const end = Math.max(lastClickedRef.current, rowIndex)
      const rangeIds = stickersRef.current.slice(start, end + 1).map((s) => s.id)
      setCheckedStickers(new Set(rangeIds))
      e.preventDefault()
      return
    }
    if (e.metaKey || e.ctrlKey) {
      setCheckedStickers(prev => {
        const next = new Set(prev)
        if (next.has(stickerId)) next.delete(stickerId)
        else next.add(stickerId)
        return next
      })
      lastClickedRef.current = rowIndex
      e.preventDefault()
      return
    }
    toggleCheck(stickerId)
    lastClickedRef.current = rowIndex
  }, [])

  // Keyboard ESC + Ctrl+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && checkedStickers.size > 0) {
        setCheckedStickers(new Set())
        e.preventDefault()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && flatStickers.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedStickers(new Set(flatStickers.map((s) => s.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedStickers.size, flatStickers])

  // Drag-to-select
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest("button, a, input, [data-no-drag]")) return
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop: scrollContainerRef.current?.scrollTop ?? 0
    }
    isDraggingRef.current = false
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return
      const container = scrollContainerRef.current
      if (!container) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (!isDraggingRef.current) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
        isDraggingRef.current = true
      }
      e.preventDefault()
      const containerRect = container.getBoundingClientRect()
      const scrollTop = container.scrollTop
      const startY = dragStartRef.current.y - containerRect.top + dragStartRef.current.scrollTop
      const currentY = e.clientY - containerRect.top + scrollTop
      const rectTop = Math.min(startY, currentY)
      const rectBottom = Math.max(startY, currentY)
      const rectLeft = Math.min(
        dragStartRef.current.x - containerRect.left,
        e.clientX - containerRect.left
      )
      const rectWidth = Math.abs(e.clientX - dragStartRef.current.x)
      setDragRect({ x: rectLeft, y: rectTop, w: rectWidth, h: rectBottom - rectTop })
      const adjustedTop = rectTop - HEADER_HEIGHT
      const adjustedBottom = rectBottom - HEADER_HEIGHT
      const matchedIds = new Set<string>()
      const currentStickers = stickersRef.current
      for (let i = 0; i < currentStickers.length; i++) {
        const rowTop = i * ROW_HEIGHT
        const rowBottom = rowTop + ROW_HEIGHT
        if (rowBottom > adjustedTop && rowTop < adjustedBottom) {
          matchedIds.add(currentStickers[i].id)
        }
      }
      setCheckedStickers(matchedIds)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) setDragRect(null)
      dragStartRef.current = null
      isDraggingRef.current = false
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // ── Sticker Detail Mode ──
  if (selectedStickerId && selectedSticker) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <button
            onClick={() => setSelectedStickerId(null)}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-hover-bg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} weight="regular" />
          </button>
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: selectedSticker.color }}
          />
          <h1 className="text-ui font-semibold text-foreground">{selectedSticker.name}</h1>
          <span className="text-note text-muted-foreground">{selectedStickerCount} items</span>
          <div className="flex-1" />
          <button
            onClick={() => {
              deleteSticker(selectedStickerId)
              setSelectedStickerId(null)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-note text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash size={14} weight="regular" />
            Delete sticker
          </button>
        </div>

        {/* Members list — grouped by entity kind. Phase 2 surfaces
            notes + wikis (the two kinds with actual data today). Phase 3
            (Universal Picker) extends to tag/label/category/file/reference. */}
        <div className="flex-1 overflow-y-auto">
          {selectedStickerNotes.length === 0 && selectedStickerWikis.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-note text-muted-foreground">
              No items with this sticker
            </div>
          ) : (
            <div>
              {/* Notes section */}
              {selectedStickerNotes.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-background px-6 py-2">
                    <PhNote size={14} weight="regular" className="text-muted-foreground" />
                    <span className="text-note font-medium text-muted-foreground">Notes</span>
                    <span className="text-note text-muted-foreground tabular-nums">
                      {selectedStickerNotes.length}
                    </span>
                  </div>
                  {selectedStickerNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => openNote(note.id)}
                      className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-hover-bg transition-colors"
                    >
                      <span className="flex-1 truncate text-ui text-foreground">
                        {note.title || "Untitled"}
                      </span>
                      <span className="text-note text-muted-foreground capitalize">
                        {note.status}
                      </span>
                      <span className="text-note text-muted-foreground tabular-nums">
                        {formatRelativeTime(note.updatedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Wiki articles section */}
              {selectedStickerWikis.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-background px-6 py-2">
                    <BookOpen size={14} weight="regular" className="text-muted-foreground" />
                    <span className="text-note font-medium text-muted-foreground">Wiki articles</span>
                    <span className="text-note text-muted-foreground tabular-nums">
                      {selectedStickerWikis.length}
                    </span>
                  </div>
                  {selectedStickerWikis.map((wiki) => (
                    <button
                      key={wiki.id}
                      onClick={() => {
                        // Switch to wiki space first — navigateToWikiArticle
                        // alone only sets the pending ID for WikiView, which
                        // isn't mounted while we're at /stickers. Same pattern
                        // as reference-detail-panel.tsx.
                        setActiveRoute("/wiki")
                        navigateToWikiArticle(wiki.id)
                      }}
                      className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-hover-bg transition-colors"
                    >
                      <span className="flex-1 truncate text-ui text-foreground">
                        {wiki.title || "Untitled"}
                      </span>
                      <span className="text-note text-muted-foreground tabular-nums">
                        {formatRelativeTime(wiki.updatedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Sticker List Mode ──
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ViewHeader
        icon={<StickerIcon size={20} weight="regular" />}
        title="Stickers"
        titleNode={<LibraryBreadcrumb current="stickers" count={flatCount} />}
        count={flatCount}
        onCreateNew={() => setCreating(true)}
        showDisplay={STICKERS_LIST_VIEW_CONFIG.showDisplay}
        displayContent={
          <DisplayPanel
            config={STICKERS_LIST_VIEW_CONFIG.displayConfig}
            viewState={viewState}
            onViewStateChange={updateViewState}
            showViewMode={true}
            toggleStates={viewState.toggles}
            onToggleChange={(key, val) =>
              updateViewState({ toggles: { ...viewState.toggles, [key]: val } })
            }
          />
        }
        showFilter={STICKERS_LIST_VIEW_CONFIG.showFilter}
        hasActiveFilters={viewState.filters.length > 0}
        filterContent={
          <FilterPanel
            categories={STICKERS_LIST_VIEW_CONFIG.filterCategories}
            activeFilters={viewState.filters}
            onToggle={handleStickersFilterToggle}
            quickFilters={STICKERS_LIST_VIEW_CONFIG.quickFilters as any}
            onQuickFilter={(rules) => updateViewState({ filters: rules })}
          />
        }
      />

      {/* Sticker list */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleDragMouseDown}
            className={`flex-1 overflow-y-auto relative${dragRect ? " select-none" : ""}${checkedStickers.size > 0 ? " pb-20" : ""}`}
          >
            {/* Creation form */}
            {creating && (
              <div className="px-6 py-4 border-b border-border space-y-3">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  placeholder="Sticker name"
                  className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-3 text-note text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <ColorPickerGrid value={newColor} onChange={setNewColor} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1.5 rounded-md text-note bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName("") }}
                    className="px-3 py-1.5 rounded-md text-note text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {stickers.length === 0 && !creating ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <span className="text-note text-muted-foreground">No stickers yet</span>
                <span className="text-2xs text-muted-foreground">
                  Click &quot;New sticker&quot; to create one
                </span>
              </div>
            ) : isGridMode && flatStickers.length > 0 ? (
              /* ── Grid Mode ── */
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 p-4">
                {flatStickers.map((sticker) => (
                  <ContextMenu key={sticker.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "group relative flex flex-col gap-2 rounded-lg border border-border/60 p-3 transition-all cursor-pointer",
                          checkedStickers.has(sticker.id)
                            ? "bg-accent/8 border-accent/40"
                            : "bg-card hover:bg-hover-bg hover:border-border",
                        )}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("button")) return
                          toggleCheck(sticker.id)
                        }}
                      >
                        {/* Checkbox (top-right) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCheck(sticker.id) }}
                          className={cn(
                            "absolute right-2 top-2 h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-all shadow-sm",
                            checkedStickers.has(sticker.id)
                              ? "bg-accent border-accent opacity-100"
                              : "opacity-0 group-hover:opacity-100 bg-card border-zinc-400 dark:border-zinc-600",
                          )}
                        >
                          {checkedStickers.has(sticker.id) && (
                            <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                          )}
                        </button>

                        {/* Color dot — required color (drives graph hull) */}
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                          style={{ backgroundColor: sticker.color }}
                        />

                        {/* Sticker name — click to view items + open side panel */}
                        <button
                          onClick={() => {
                            // 2026-05-14 follow-up (Library Stickers Detail panel):
                            // 사이드바 자동 노출 + Detail 표시 (PR #331 Files +
                            // PR #334 Tags 패턴 정합). drill-down (selectedStickerId)도
                            // 유지 — 사용자가 row 한 번 클릭하면 items 페이지 +
                            // side panel detail 둘 다 보이는 풍부한 패턴.
                            setSelectedStickerId(sticker.id)
                            usePlotStore.setState({
                              sidePanelContext: { type: "sticker", id: sticker.id },
                              sidePanelOpen: true,
                            })
                          }}
                          className="text-left text-ui text-foreground transition-colors hover:text-accent leading-tight"
                          title="Click to view items"
                        >
                          {sticker.name}
                        </button>

                        {/* PropertyChip row */}
                        <div className="flex items-center gap-1 min-w-0">
                          <StickerMemberCountChip count={sticker.memberCount} />
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>Change color</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="p-2">
                          <ColorPickerGrid
                            value={sticker.color}
                            onChange={(color) => updateSticker(sticker.id, { color })}
                          />
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem
                        onClick={() => setSelectedStickerId(sticker.id)}
                        className="text-note"
                      >
                        View items
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => deleteSticker(sticker.id)}
                        className="text-note text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2" size={14} weight="regular" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            ) : (
              <div>
                {/* Header row */}
                <div
                  data-header-row
                  className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-subtle bg-background px-6 py-2.5"
                >
                  <div
                    onClick={toggleAll}
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors shadow-sm",
                      checkedStickers.size === flatStickers.length && flatStickers.length > 0
                        ? "bg-accent border-accent"
                        : checkedStickers.size > 0
                          ? "bg-accent/50 border-accent"
                          : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                    )}
                  >
                    {checkedStickers.size === flatStickers.length && flatStickers.length > 0 && (
                      <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                    )}
                    {checkedStickers.size > 0 && checkedStickers.size < flatStickers.length && (
                      <Minus size={10} weight="regular" className="text-accent-foreground" />
                    )}
                  </div>
                  <button
                    className="flex flex-1 items-center gap-1 text-left text-note font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => handleSortToggle("name")}
                  >
                    Name
                    {sortField === "name" && (
                      sortDirection === "asc"
                        ? <ArrowUp size={12} weight="bold" className="text-muted-foreground" />
                        : <ArrowDown size={12} weight="bold" className="text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="flex w-16 items-center justify-end gap-1 text-note font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => handleSortToggle("memberCount")}
                  >
                    Items
                    {sortField === "memberCount" && (
                      sortDirection === "desc"
                        ? <ArrowDown size={12} weight="bold" className="text-muted-foreground" />
                        : <ArrowUp size={12} weight="bold" className="text-muted-foreground" />
                    )}
                  </button>
                  <span className="w-16" />
                </div>

                {flatStickers.map((sticker, index) => {
                  const isEditing = editingId === sticker.id
                  const dotColor = isEditing ? editColor : sticker.color
                  return (
                    <ContextMenu key={sticker.id} onOpenChange={(open) => {
                      if (open) setContextMenuStickerId(sticker.id)
                      else setContextMenuStickerId(null)
                    }}>
                      <ContextMenuTrigger asChild>
                        <div
                          data-sticker-index={index}
                          className={`flex items-start gap-3 px-6 py-2.5 transition-colors group cursor-default${
                            checkedStickers.has(sticker.id) ? " bg-accent/10" : " hover:bg-hover-bg"
                          }`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("button, input, [data-no-drag]")) return
                            if (isEditing) return
                            handleRowClick(sticker.id, index, e)
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCheck(sticker.id) }}
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors mt-0.5 shadow-sm",
                              checkedStickers.has(sticker.id)
                                ? "bg-accent border-accent text-accent-foreground"
                                : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
                              checkedStickers.size > 0 || checkedStickers.has(sticker.id) ? "visible" : "invisible group-hover:visible"
                            )}
                          >
                            {checkedStickers.has(sticker.id) && (
                              <PhCheck size={10} weight="bold" />
                            )}
                          </button>

                          {/* Color dot — popover trigger */}
                          <Popover
                            open={colorPickerOpenId === sticker.id}
                            onOpenChange={(open) => {
                              if (!open) setColorPickerOpenId(null)
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                onClick={(e) => handleColorDotClick(sticker, e)}
                                className="h-3 w-3 rounded-full shrink-0 mt-0.5 ring-1 ring-black/5 dark:ring-white/10 hover:ring-2 hover:ring-foreground/20 transition-all cursor-pointer"
                                style={{ backgroundColor: dotColor }}
                                title="Change color"
                                type="button"
                              />
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[280px] p-3"
                              align="start"
                              sideOffset={6}
                              onClick={(e) => e.stopPropagation()}
                              onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                              <ColorPickerGrid
                                value={dotColor}
                                onChange={(color) => {
                                  if (isEditing) handleEditColorChange(color)
                                  else handleQuickColorChange(sticker.id, color)
                                }}
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Name — click to rename, double-click to navigate */}
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={handleEditBlur}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 h-7 max-w-md rounded-md border border-border bg-card px-2.5 text-note text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                                placeholder="Sticker name"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleNameClick(sticker, e)}
                              className="flex-1 text-left text-ui text-foreground hover:text-accent transition-colors"
                              title="Click to rename · Double-click to view items"
                            >
                              {sticker.name}
                            </button>
                          )}

                          {!isEditing && (
                            <span className="w-16 text-right text-note text-muted-foreground tabular-nums self-center">
                              {sticker.memberCount}
                            </span>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={() => startEdit(sticker)}
                          className="text-note"
                        >
                          <PencilSimple className="mr-2 text-muted-foreground" size={14} weight="regular" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => setColorPickerOpenId(sticker.id)}
                          className="text-note"
                        >
                          <span className="mr-2 h-3 w-3 shrink-0 rounded-full inline-block" style={{ backgroundColor: sticker.color }} />
                          Change color
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => setSelectedStickerId(sticker.id)}
                          className="text-note"
                        >
                          View items
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => deleteSticker(sticker.id)}
                          className="text-note text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2" size={14} weight="regular" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
              </div>
            )}

            {/* Drag selection rectangle */}
            {dragRect && (
              <div
                className="pointer-events-none absolute z-20 rounded border border-accent/50 bg-accent/10"
                style={{ left: dragRect.x, top: dragRect.y, width: dragRect.w, height: dragRect.h }}
              />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => setCreating(true)}
            className="text-note"
          >
            <PhPlus className="mr-2 text-muted-foreground" size={16} weight="regular" />
            New sticker
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating action bar */}
      {checkedStickers.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <button
              onClick={() => setCheckedStickers(new Set())}
              className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-2xs font-medium text-muted-foreground hover:bg-active-bg transition-colors"
            >
              <Lightning size={14} weight="fill" className="text-accent" />
              {checkedStickers.size} selected
              <PhX size={12} weight="regular" className="ml-0.5 text-muted-foreground/70" />
            </button>
            <div className="h-7 w-px bg-border mx-1.5" />
            {checkedStickers.size === 1 && (
              <>
                <button
                  onClick={handleFabRename}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
                >
                  <PencilSimple size={14} weight="regular" /> Rename
                </button>
                <button
                  onClick={handleFabRecolor}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-foreground hover:bg-hover-bg transition-colors"
                >
                  {(() => {
                    const id = Array.from(checkedStickers)[0]
                    const s = stickers.find((st) => st.id === id)
                    return <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s?.color ?? "#6b7280" }} />
                  })()}
                  Recolor
                </button>
                <div className="h-7 w-px bg-border mx-0.5" />
              </>
            )}
            <button
              onClick={handleDeleteChecked}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-2xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash size={16} weight="regular" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
