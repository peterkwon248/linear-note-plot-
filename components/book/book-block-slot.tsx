"use client"

// Phase 2B-3 — BookBlockSlot: wraps each Book block with per-block chrome.
//
// - Left handle (⠿) on hover → drag to reorder + click to open block menu (Turn Into / Duplicate / Delete)
// - Bottom hairline (hover) → reuses wiki-editor's AddBlockButton so Book and Wiki share
//   the same picker UX (Section / Subsection / Text / Note / Image / URL / Table / Infobox / TOC /
//   Pull Quote / Callout / Blockquote / Toggle / Spacer).
//
// Chrome is invisible at rest, fades in on hover. No dashed borders.

import { useState, useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AddBlockButton } from "@/components/wiki-editor/wiki-block-renderer"
import type { WikiBlockType } from "@/lib/types"

/** Types supported by the in-place "Turn Into" submenu. */
const TURN_INTO_OPTIONS: Array<{ type: WikiBlockType; label: string }> = [
  { type: "text", label: "Text" },
  { type: "section", label: "Section" },
  { type: "pull-quote", label: "Pull Quote" },
  { type: "image", label: "Image" },
  { type: "url", label: "URL" },
  { type: "table", label: "Table" },
  { type: "infobox", label: "Infobox" },
  { type: "toc", label: "TOC" },
]

interface BookBlockSlotProps {
  children: React.ReactNode
  /** Inserts a new block after this slot. Signature matches AddBlockButton's onAdd. */
  onInsertBelow?: (type: string, level?: number) => void
  onDelete?: () => void
  onDuplicate?: () => void
  /** Reserved for Phase 2B-3c — change block type in place. */
  onTurnInto?: (type: WikiBlockType) => void
  /** When provided, the slot registers with a DndContext SortableContext so the ⠿ handle
   * drags the block to a new position. Without an id, the slot renders statically. */
  blockId?: string
}

export function BookBlockSlot({
  children,
  onInsertBelow,
  onDelete,
  onDuplicate,
  onTurnInto,
  blockId,
}: BookBlockSlotProps) {
  const [hovering, setHovering] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [turnIntoOpen, setTurnIntoOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sortable (no-op when blockId is absent — useSortable still works with undefined id fallback)
  const sortable = useSortable({ id: blockId ?? "__no-drag__", disabled: !blockId })
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable
  const dragStyle: React.CSSProperties = {
    position: "relative",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 5 : undefined,
  }

  // Click-outside to close the block menu (AddBlockButton handles its own popup)
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false)
        setTurnIntoOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const chromeVisible = hovering || menuOpen

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={dragStyle}
      {...attributes}
    >
      {/* Left drag handle + menu trigger */}
      {(onDelete || onDuplicate || onTurnInto || blockId) && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Block menu / drag handle"
          aria-expanded={menuOpen}
          {...(blockId ? listeners : {})}
          style={{
            position: "absolute",
            left: -28,
            top: 4,
            width: 20,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: chromeVisible ? 0.55 : 0,
            transition: "opacity 160ms ease",
            background: "transparent",
            border: "none",
            cursor: blockId ? "grab" : "pointer",
            fontFamily: "inherit",
            fontSize: 14,
            color: "var(--muted-foreground)",
            padding: 0,
            touchAction: "none",
          }}
        >
          ⠿
        </button>
      )}

      {menuOpen && (onDelete || onDuplicate || onTurnInto) && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "absolute",
            left: -8,
            top: 28,
            zIndex: 21,
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "var(--shadow-lg)",
            padding: 4,
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {onTurnInto && (
            <div style={{ position: "relative" }}>
              <button
                role="menuitem"
                onClick={() => setTurnIntoOpen((v) => !v)}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ flex: 1 }}>Turn Into</span>
                <span style={{ color: "var(--muted-foreground)" }}>›</span>
              </button>
              {turnIntoOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    left: "100%",
                    top: 0,
                    marginLeft: 4,
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-lg)",
                    padding: 4,
                    minWidth: 200,
                  }}
                >
                  {TURN_INTO_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      role="menuitem"
                      onClick={() => {
                        onTurnInto(opt.type)
                        setMenuOpen(false)
                        setTurnIntoOpen(false)
                      }}
                      style={menuItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onDuplicate && (
            <button
              role="menuitem"
              onClick={() => {
                onDuplicate()
                setMenuOpen(false)
              }}
              style={menuItemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <>
              {(onTurnInto || onDuplicate) && (
                <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
              )}
              <button
                role="menuitem"
                onClick={() => {
                  onDelete()
                  setMenuOpen(false)
                }}
                style={{ ...menuItemStyle, color: "var(--destructive, #dc2626)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(220,38,38,0.08))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {children}

      {/* Bottom hairline — reuses wiki-editor's AddBlockButton (same picker as Wiki) */}
      {onInsertBelow && (
        <AddBlockButton onAdd={(type, level) => onInsertBelow(type, level)} />
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  border: "none",
  background: "transparent",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  color: "var(--foreground)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  transition: "background 120ms ease",
}
