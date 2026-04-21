"use client"

import { useRef, useEffect } from "react"
import type { ShellId, BlockType, BlockDefinition } from "@/lib/book/types"
import { getShellBlocks } from "@/lib/book/shells"

interface SlashMenuProps {
  shell: ShellId
  open: boolean
  x: number
  y: number
  q: string
  setQ: (q: string) => void
  onPick: (type: BlockType) => void
  onClose: () => void
}

export function SlashMenu({ shell, open, x, y, q, setQ, onPick, onClose }: SlashMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  if (!open) return null

  const entries = getShellBlocks(shell).filter(
    ([, b]) =>
      !q ||
      b.label.toLowerCase().includes(q.toLowerCase()) ||
      b.hint.toLowerCase().includes(q.toLowerCase())
  )

  const groups: Record<string, [BlockType, BlockDefinition][]> = {
    Content: entries.filter(([k]) =>
      ["paragraph", "heading", "quote", "image", "divider"].includes(k)
    ),
    [shell.charAt(0).toUpperCase() + shell.slice(1)]: entries.filter(
      ([, b]) => b.shells !== "*" && b.shells.includes(shell)
    ),
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 300,
          maxHeight: 380,
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          boxShadow: "var(--shadow-popover)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter blocks..."
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          style={{
            border: 0,
            outline: 0,
            padding: "10px 12px",
            fontSize: 13,
            borderBottom: "1px solid var(--border-subtle)",
            background: "transparent",
            color: "var(--foreground)",
            fontFamily: "inherit",
          }}
        />
        <div style={{ overflowY: "auto", padding: 4 }}>
          {Object.entries(groups).map(
            ([g, its]) =>
              its.length > 0 && (
                <div key={g}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                      padding: "8px 10px 4px",
                    }}
                  >
                    {g}
                  </div>
                  {its.map(([k, b]) => (
                    <div
                      key={k}
                      onClick={() => onPick(k)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 10px",
                        borderRadius: 5,
                        cursor: "pointer",
                        transition: "background var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--hover-bg)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 5,
                          background: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          color: "var(--foreground)",
                        }}
                      >
                        {b.glyph}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--foreground)" }}>{b.label}</div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--muted-foreground)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {b.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
          {entries.length === 0 && (
            <div
              style={{
                padding: 14,
                fontSize: 12,
                color: "var(--muted-foreground)",
                textAlign: "center",
              }}
            >
              No blocks match &quot;{q}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
