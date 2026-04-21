"use client"

// Phase 2B-3 — BookBlockSlot: wraps each Book block with per-block chrome.
//
// - Left handle (⠿) on hover → opens block menu (Turn Into / Duplicate / Delete)
// - Bottom hairline (hover) → "+ Add block" picker (8 types)
//
// Chrome is invisible at rest, fades in on hover. No dashed borders,
// no permanent `+/×` noise — follows Plot's "selected cell chrome" principle.

import { useState, useRef, useEffect } from "react"
import type { WikiBlockType } from "@/lib/types"

/** Block types shown in the insert picker. */
const INSERT_OPTIONS: Array<{ type: WikiBlockType; label: string; hint?: string }> = [
  { type: "text", label: "Text", hint: "Body paragraph" },
  { type: "section", label: "Section", hint: "H2 heading" },
  { type: "pull-quote", label: "Pull Quote", hint: "Oversized quote" },
  { type: "image", label: "Image", hint: "Photo + caption" },
  { type: "url", label: "URL", hint: "Link card" },
  { type: "table", label: "Table", hint: "Grid data" },
  { type: "infobox", label: "Infobox", hint: "Fact table" },
  { type: "toc", label: "TOC", hint: "Table of contents" },
]

interface BookBlockSlotProps {
  children: React.ReactNode
  onInsertBelow?: (type: WikiBlockType) => void
  onDelete?: () => void
  onDuplicate?: () => void
  /** Reserved for Phase 2B-3c — change block type in place. */
  onTurnInto?: (type: WikiBlockType) => void
}

export function BookBlockSlot({
  children,
  onInsertBelow,
  onDelete,
  onDuplicate,
  onTurnInto,
}: BookBlockSlotProps) {
  const [hovering, setHovering] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [turnIntoOpen, setTurnIntoOpen] = useState(false)
  const insertRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Click-outside to close
  useEffect(() => {
    if (!insertOpen && !menuOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (insertOpen && !insertRef.current?.contains(target)) setInsertOpen(false)
      if (menuOpen && !menuRef.current?.contains(target)) {
        setMenuOpen(false)
        setTurnIntoOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [insertOpen, menuOpen])

  const chromeVisible = hovering || insertOpen || menuOpen

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{ position: "relative" }}
    >
      {/* Left drag handle + menu trigger */}
      {(onDelete || onDuplicate || onTurnInto) && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Block menu"
          aria-expanded={menuOpen}
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
            cursor: "grab",
            fontFamily: "inherit",
            fontSize: 14,
            color: "var(--muted-foreground)",
            padding: 0,
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
                  {INSERT_OPTIONS.map((opt) => (
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

      {/* Bottom hairline — Add Block */}
      {onInsertBelow && (
        <div ref={insertRef}>
          <button
            onClick={() => setInsertOpen((v) => !v)}
            aria-label="Insert block below"
            aria-expanded={insertOpen}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -8,
              height: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: chromeVisible ? 1 : 0,
              transition: "opacity 160ms ease",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "0 4px",
              }}
            >
              + Add block
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </button>
          {insertOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                left: "50%",
                top: "calc(100% + 8px)",
                transform: "translateX(-50%)",
                zIndex: 20,
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "var(--shadow-lg)",
                padding: 4,
                minWidth: 220,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {INSERT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  role="menuitem"
                  onClick={() => {
                    onInsertBelow(opt.type)
                    setInsertOpen(false)
                  }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg, rgba(0,0,0,0.04))")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ flex: 1, fontWeight: 500 }}>{opt.label}</span>
                  {opt.hint && (
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{opt.hint}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
