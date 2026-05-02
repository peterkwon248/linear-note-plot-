"use client"

/**
 * NodeContextMenu — right-click on a graph node (or selection) action menu.
 *
 * Why this exists: the ontology graph is a *thinking tool*, not just a
 * read-only visualization. Users need to take action on selected nodes
 * (label/tag/sticker them, group them, color-code them) and see the result
 * immediately reflected in the hull. This menu is the bridge.
 *
 * Sticker is the recommended grouping mechanism: cross-entity (notes+wiki),
 * inline-creatable, no other system to maintain. Listed first.
 *
 * Selection model:
 *  - If the right-clicked node is in the current multi-selection, all
 *    selected nodes get the action.
 *  - Otherwise the action applies only to the right-clicked node.
 *
 * Inline entity creation: the sticker submenu has a search box that doubles
 * as a "create new" affordance — type any name → press Enter → new sticker
 * is created and applied to the selection in one shot. Linear's quick-add
 * pattern.
 */

import { useState, useRef, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { ColorPickerGrid } from "@/components/color-picker-grid"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Sticker as StickerIcon } from "@phosphor-icons/react/dist/ssr/Sticker"
import { ArrowsOutCardinal } from "@phosphor-icons/react/dist/ssr/ArrowsOutCardinal"
import { ArrowsInCardinal } from "@phosphor-icons/react/dist/ssr/ArrowsInCardinal"
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight"

/** Default color shown in the new-sticker picker. Matches the first palette
 *  entry the slice would auto-assign so "auto" and "explicit pick" are
 *  visually consistent. */
const DEFAULT_NEW_COLOR = "#ef4444"

interface NodeContextMenuProps {
  /** Screen coordinates where to render the menu. */
  x: number
  y: number
  /** Entity ids the menu acts on. Notes are bare ids; wikis are "wiki:<id>". */
  selectedIds: string[]
  onClose: () => void
  /** Triggered after a sticker is added — caller can switch Group by to "sticker"
   *  if it's not already, so the new hull shows up immediately. */
  onAfterAddSticker?: () => void
  /** Spread / cluster the current selection (force adjustment in graph canvas). */
  onSpread?: () => void
  onCluster?: () => void
  /** Hide all edges connected to the selected nodes (visual only). */
  onHideConnections?: () => void
  /** Show only the selected nodes (dim others). Pass empty array to clear. */
  onIsolate?: () => void
  /** Whether any visual filter (hidden/isolate) is active — if so, show "Show all". */
  hasHidden?: boolean
  onShowAll?: () => void
}

export function NodeContextMenu({
  x,
  y,
  selectedIds,
  onClose,
  onAfterAddSticker,
  onSpread,
  onCluster,
  onHideConnections,
  onIsolate,
  hasHidden,
  onShowAll,
}: NodeContextMenuProps) {
  const stickers = usePlotStore((s) => s.stickers)
  const createSticker = usePlotStore((s) => s.createSticker)
  const bulkAddSticker = usePlotStore((s) => s.bulkAddSticker)
  const updateSticker = usePlotStore((s) => s.updateSticker)

  const [view, setView] = useState<"main" | "sticker">("main")
  const [stickerQuery, setStickerQuery] = useState("")
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR)
  /** When set, the per-row color popover is open for this sticker id. */
  const [colorEditingId, setColorEditingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-focus input when sticker submenu opens.
  useEffect(() => {
    if (view === "sticker") {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [view])

  // Close on outside click or Escape.
  // Uses capture phase so we hear the click even when the canvas/SVG
  // handlers call e.stopPropagation() — otherwise the menu would stick
  // open while the user clicked back on the canvas.
  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (menuRef.current.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    // capture: true → fires before canvas's own mousedown handlers can
    // swallow the event with stopPropagation.
    document.addEventListener("mousedown", onDocPointerDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [onClose])

  // Filter / sort active (non-trashed) stickers for the submenu.
  const visibleStickers = stickers
    .filter((s) => !s.trashed)
    .filter((s) => s.name.toLowerCase().includes(stickerQuery.toLowerCase()))

  const trimmedQuery = stickerQuery.trim()
  const hasExactMatch = visibleStickers.some(
    (s) => s.name.toLowerCase() === trimmedQuery.toLowerCase()
  )
  const canCreate = trimmedQuery.length > 0 && !hasExactMatch

  const applySticker = (stickerId: string) => {
    bulkAddSticker(selectedIds, stickerId)
    onAfterAddSticker?.()
    onClose()
  }

  const handleCreateAndApply = () => {
    if (!canCreate) return
    const newId = createSticker(trimmedQuery, newColor)
    bulkAddSticker(selectedIds, newId)
    onAfterAddSticker?.()
    onClose()
  }

  const handleSubmenuKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (visibleStickers.length === 1 && !canCreate) {
        applySticker(visibleStickers[0].id)
      } else if (canCreate) {
        handleCreateAndApply()
      }
    }
  }

  // Position adjusted to avoid overflowing the viewport.
  const adjustedX = Math.min(x, window.innerWidth - 240)
  const adjustedY = Math.min(y, window.innerHeight - 320)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] rounded-md border border-border bg-popover shadow-lg overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
      role="menu"
    >
      {view === "main" && (
        <div className="flex flex-col py-1 text-note">
          <div className="px-3 py-1.5 text-2xs text-muted-foreground border-b border-border-subtle">
            {selectedIds.length} {selectedIds.length === 1 ? "node" : "nodes"} selected
          </div>

          <button
            type="button"
            onClick={() => setView("sticker")}
            className="flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <StickerIcon size={14} weight="regular" />
              Add sticker…
            </span>
            <CaretRight size={12} weight="regular" className="opacity-50" />
          </button>

          <div className="my-1 border-t border-border-subtle" />

          {onSpread && (
            <button
              type="button"
              onClick={() => {
                onSpread()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
            >
              <ArrowsOutCardinal size={14} weight="regular" />
              Spread these
            </button>
          )}
          {onCluster && (
            <button
              type="button"
              onClick={() => {
                onCluster()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
            >
              <ArrowsInCardinal size={14} weight="regular" />
              Cluster these
            </button>
          )}

          {/* ── Visual filters (declutter the canvas without touching data) ── */}
          {(onIsolate || onHideConnections || (hasHidden && onShowAll)) && (
            <div className="my-1 border-t border-border-subtle" />
          )}
          {onIsolate && (
            <button
              type="button"
              onClick={() => {
                onIsolate()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
              title="Show only these nodes; dim everything else"
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-sm border border-current opacity-70">·</span>
              Isolate
            </button>
          )}
          {onHideConnections && (
            <button
              type="button"
              onClick={() => {
                onHideConnections()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
              title="Hide all edges touching these nodes (visual only)"
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center text-xs">⌀</span>
              Hide connections
            </button>
          )}
          {hasHidden && onShowAll && (
            <button
              type="button"
              onClick={() => {
                onShowAll()
                onClose()
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent text-foreground/80"
              title="Restore all hidden edges and clear isolation"
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center text-xs">↺</span>
              Show all
            </button>
          )}
        </div>
      )}

      {view === "sticker" && (
        <div className="flex flex-col">
          {/* Input row + color preview swatch (color = what new sticker
              will be created with). Click swatch to expand picker below. */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border-subtle">
            <input
              ref={inputRef}
              type="text"
              value={stickerQuery}
              onChange={(e) => setStickerQuery(e.target.value)}
              onKeyDown={handleSubmenuKey}
              placeholder="Search or create sticker…"
              className="flex-1 bg-transparent text-note outline-none placeholder:text-muted-foreground"
            />
            {canCreate && (
              <button
                type="button"
                onClick={() => setColorEditingId(colorEditingId === "__new__" ? null : "__new__")}
                title="Pick color for new sticker"
                className="h-4 w-4 rounded-full shrink-0 ring-1 ring-border hover:ring-2 hover:ring-foreground/40 transition"
                style={{ backgroundColor: newColor }}
              />
            )}
          </div>

          {/* New-sticker color picker — shown when color swatch was clicked. */}
          {canCreate && colorEditingId === "__new__" && (
            <div className="px-2 py-2 border-b border-border-subtle bg-muted/30">
              <ColorPickerGrid
                value={newColor}
                onChange={(c) => {
                  setNewColor(c)
                  setColorEditingId(null)
                  inputRef.current?.focus()
                }}
                showCustom={false}
                size="sm"
              />
            </div>
          )}

          <div className="max-h-[240px] overflow-y-auto py-1">
            {visibleStickers.length === 0 && !canCreate && (
              <div className="px-3 py-2 text-2xs text-muted-foreground">
                No stickers yet.
              </div>
            )}

            {visibleStickers.map((sticker) => (
              <div key={sticker.id} className="flex flex-col">
                <div className="flex w-full items-center gap-2 px-3 py-1.5 text-note hover:bg-accent group">
                  {/* Click dot to open inline color editor for this sticker.
                      Hover hint via ring to suggest interactivity. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setColorEditingId(colorEditingId === sticker.id ? null : sticker.id)
                    }}
                    title="Change color"
                    className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-transparent group-hover:ring-foreground/30 hover:ring-foreground/60 transition"
                    style={{ backgroundColor: sticker.color }}
                  />
                  {/* Click name (or row body) to apply sticker. */}
                  <button
                    type="button"
                    onClick={() => applySticker(sticker.id)}
                    className="flex-1 text-left truncate"
                  >
                    {sticker.name}
                  </button>
                </div>
                {/* Per-sticker color picker — opens inline below the row. */}
                {colorEditingId === sticker.id && (
                  <div className="px-3 py-2 border-y border-border-subtle bg-muted/30">
                    <ColorPickerGrid
                      value={sticker.color}
                      onChange={(c) => {
                        updateSticker(sticker.id, { color: c })
                        setColorEditingId(null)
                      }}
                      showCustom={false}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            ))}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreateAndApply}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-note text-left hover:bg-accent border-t border-border-subtle"
              >
                <Plus size={14} weight="bold" />
                <span className="flex items-center gap-1.5">
                  Create
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: newColor }} />
                  &quot;<span className="font-medium">{trimmedQuery}</span>&quot;
                </span>
              </button>
            )}
          </div>

          <div className="border-t border-border-subtle px-3 py-1.5 text-2xs text-muted-foreground flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView("main")}
              className="hover:text-foreground"
            >
              ← Back
            </button>
            <span>↵ to apply / create</span>
          </div>
        </div>
      )}
    </div>
  )
}
