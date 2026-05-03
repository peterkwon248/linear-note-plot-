"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
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
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash"
import { Sticker as StickerIcon } from "@phosphor-icons/react/dist/ssr/Sticker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import { PRESET_COLORS } from "@/lib/colors"
import type { Sticker } from "@/lib/types"
import { ViewHeader } from "@/components/view-header"

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

  // Search state
  const [search, setSearch] = useState("")

  // View state
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[5])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [stickerSortBy, setStickerSortBy] = useState<"name-asc" | "name-desc" | "count-desc" | "count-asc">("name-asc")
  const [hideEmptyStickers, setHideEmptyStickers] = useState(false)
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
  const stickersRef = useRef<typeof stickers>(stickers)

  // Active notes and wiki articles
  const activeNotes = useMemo(() =>
    notes.filter((n) => !n.trashed),
    [notes]
  )
  const activeWiki = useMemo(() =>
    wikiArticles,
    [wikiArticles]
  )

  // Lookup maps for active-entity check during count.
  // Sticker.members may still reference trashed notes (we don't auto-cleanup),
  // so filter them out at read time to match the prior behavior.
  const activeNoteIds = useMemo(() => new Set(activeNotes.map((n) => n.id)), [activeNotes])
  const activeWikiIds = useMemo(() => new Set(activeWiki.map((w) => w.id)), [activeWiki])

  // Sticker counts (notes + wikis combined; future kinds will fall through).
  // Reads from Sticker.members[] (옵션 D2). Each ref kind decides its own
  // active-entity test; unknown kinds count as-is for forward compatibility.
  const stickerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sticker of stickers) {
      let count = 0
      for (const ref of sticker.members ?? []) {
        if (ref.kind === "note") {
          if (activeNoteIds.has(ref.id)) count++
        } else if (ref.kind === "wiki") {
          if (activeWikiIds.has(ref.id)) count++
        } else {
          // tag / label / category / file / reference — no active check yet
          count++
        }
      }
      counts[sticker.id] = count
    }
    return counts
  }, [stickers, activeNoteIds, activeWikiIds])

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

  const selectedStickerCount = useMemo(() => {
    if (!selectedStickerId) return 0
    return stickerCounts[selectedStickerId] ?? 0
  }, [selectedStickerId, stickerCounts])

  // Sort and filter stickers for list mode (excluding trashed)
  const sortedStickers = useMemo(() => {
    let result = stickers.filter((s) => !s.trashed)
    if (hideEmptyStickers) {
      result = result.filter((s) => (stickerCounts[s.id] || 0) > 0)
    }
    if (search) {
      result = result.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    }
    switch (stickerSortBy) {
      case "name-asc": return result.sort((a, b) => a.name.localeCompare(b.name))
      case "name-desc": return result.sort((a, b) => b.name.localeCompare(a.name))
      case "count-desc": return result.sort((a, b) => (stickerCounts[b.id] || 0) - (stickerCounts[a.id] || 0))
      case "count-asc": return result.sort((a, b) => (stickerCounts[a.id] || 0) - (stickerCounts[b.id] || 0))
      default: return result
    }
  }, [stickers, stickerSortBy, hideEmptyStickers, stickerCounts, search])

  stickersRef.current = sortedStickers

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
    if (checkedStickers.size === sortedStickers.length) {
      setCheckedStickers(new Set())
    } else {
      setCheckedStickers(new Set(sortedStickers.map((s) => s.id)))
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
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && sortedStickers.length > 0) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea") return
        setCheckedStickers(new Set(sortedStickers.map((s) => s.id)))
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [checkedStickers.size, sortedStickers])

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

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {selectedStickerNotes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-note text-muted-foreground">
              No notes with this sticker
            </div>
          ) : (
            <div>
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
        count={stickers.filter((s) => !s.trashed).length}
        onCreateNew={() => setCreating(true)}
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
                      checkedStickers.size === sortedStickers.length && sortedStickers.length > 0
                        ? "bg-accent border-accent"
                        : checkedStickers.size > 0
                          ? "bg-accent/50 border-accent"
                          : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-500"
                    )}
                  >
                    {checkedStickers.size === sortedStickers.length && sortedStickers.length > 0 && (
                      <PhCheck size={10} weight="bold" className="text-accent-foreground" />
                    )}
                    {checkedStickers.size > 0 && checkedStickers.size < sortedStickers.length && (
                      <Minus size={10} weight="regular" className="text-accent-foreground" />
                    )}
                  </div>
                  <button
                    className="flex flex-1 items-center gap-1 text-left text-note font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setStickerSortBy(stickerSortBy === "name-asc" ? "name-desc" : "name-asc")}
                  >
                    Name
                    {(stickerSortBy === "name-asc" || stickerSortBy === "name-desc") && (
                      stickerSortBy === "name-asc"
                        ? <ArrowUp size={12} weight="bold" className="text-muted-foreground" />
                        : <ArrowDown size={12} weight="bold" className="text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="flex w-16 items-center justify-end gap-1 text-note font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setStickerSortBy(stickerSortBy === "count-desc" ? "count-asc" : "count-desc")}
                  >
                    Items
                    {(stickerSortBy === "count-desc" || stickerSortBy === "count-asc") && (
                      stickerSortBy === "count-desc"
                        ? <ArrowDown size={12} weight="bold" className="text-muted-foreground" />
                        : <ArrowUp size={12} weight="bold" className="text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => setHideEmptyStickers(!hideEmptyStickers)}
                    className={cn(
                      "ml-2 rounded p-1 transition-colors",
                      hideEmptyStickers ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    )}
                    title={hideEmptyStickers ? "Show all" : "Hide empty"}
                  >
                    <EyeSlash size={14} weight="bold" />
                  </button>
                  <span className="w-16" />
                </div>

                {sortedStickers.map((sticker, index) => {
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
                                : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500"
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
                              {stickerCounts[sticker.id] || 0}
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
