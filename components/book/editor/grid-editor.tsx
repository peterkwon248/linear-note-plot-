"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { ShellId, Block, BlockType } from "@/lib/book/types"
import { BLOCK_LIBRARY } from "@/lib/book/shells"
import { SlashMenu } from "./slash-menu"

interface GridEditorProps {
  shell: ShellId
  cols?: number
}

export function GridEditor({ shell, cols = 12 }: GridEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "b1", type: "heading", col: 1, span: 12, row: 1, text: "Untitled Book" },
    {
      id: "b2",
      type: "paragraph",
      col: 1,
      span: 7,
      row: 2,
      text: "Click a block to select. Drag the top handle to move. Drag the right edge to resize. Click empty cell to insert. Press / to open the block menu.",
    },
    { id: "b3", type: "image", col: 8, span: 5, row: 2, text: "Photo placeholder" },
    { id: "b4", type: "quote", col: 2, span: 10, row: 3, text: "A notebook is the cheapest lab in the world." },
  ])
  const [selected, setSelected] = useState<string | null>(null)
  const [slash, setSlash] = useState<{
    open: boolean
    x: number
    y: number
    q: string
    at: { col: number; row: number } | null
  }>({ open: false, x: 0, y: 0, q: "", at: null })
  const [drag, setDrag] = useState<{
    id: string
    kind: "move" | "resize"
    startX: number
    startY: number
    startCol: number
    startSpan: number
    startRow: number
  } | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const colWidth = useCallback(() => {
    const el = gridRef.current
    if (!el) return 80
    const gap = 12
    return (el.clientWidth - gap * (cols - 1)) / cols
  }, [cols])

  const onCellClick = (e: React.MouseEvent, col: number, row: number) => {
    if (drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    setSlash({ open: true, x: rect.left + 10, y: rect.top + 10, q: "", at: { col, row } })
  }

  const insertBlock = (type: BlockType) => {
    const def = BLOCK_LIBRARY[type]
    const at = slash.at || { col: 1, row: (blocks.reduce((m, b) => Math.max(m, b.row), 0) || 0) + 1 }
    const maxRow = blocks.reduce((m, b) => Math.max(m, b.row), 0)
    const row = at.row <= maxRow ? maxRow + 1 : at.row
    const col = Math.min(at.col, cols - def.span + 1)
    setBlocks([
      ...blocks,
      {
        id: "b" + (blocks.length + 1) + "_" + Date.now(),
        type,
        col,
        span: def.span,
        row,
        text: def.label,
      },
    ])
    setSlash({ open: false, x: 0, y: 0, q: "", at: null })
  }

  const startDrag = (e: React.MouseEvent, id: string, kind: "move" | "resize") => {
    e.stopPropagation()
    e.preventDefault()
    const b = blocks.find((x) => x.id === id)
    if (!b) return
    setDrag({
      id,
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startCol: b.col,
      startSpan: b.span,
      startRow: b.row,
    })
    setSelected(id)
  }

  useEffect(() => {
    if (!drag) return
    const cw = colWidth() + 12

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX
      const dySteps = Math.round((e.clientY - drag.startY) / 60)
      const dCol = Math.round(dx / cw)

      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== drag.id) return b
          if (drag.kind === "move") {
            const col = Math.max(1, Math.min(cols - b.span + 1, drag.startCol + dCol))
            const row = Math.max(1, drag.startRow + dySteps)
            return { ...b, col, row }
          } else {
            const span = Math.max(1, Math.min(cols - b.col + 1, drag.startSpan + dCol))
            return { ...b, span }
          }
        })
      )
    }

    const onUp = () => setDrag(null)

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [drag, cols, colWidth])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !slash.open && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        setSlash({ open: true, x: window.innerWidth / 2 - 150, y: 120, q: "", at: null })
      }
      if (e.key === "Backspace" && selected && document.activeElement?.tagName !== "INPUT") {
        setBlocks((bs) => bs.filter((b) => b.id !== selected))
        setSelected(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, slash.open])

  const maxRow = Math.max(4, blocks.reduce((m, b) => Math.max(m, b.row), 0) + 2)
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1)

  return (
    <>
      <div
        ref={gridRef}
        onClick={() => setSelected(null)}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: "minmax(60px, auto)",
          gap: 12,
          padding: 32,
          minHeight: "calc(100vh - 180px)",
          background: `linear-gradient(to right, transparent calc(100% - 1px), rgba(94,106,210,0.06) 0)`,
        }}
      >
        {/* Grid guides */}
        {rows.flatMap((r) =>
          Array.from({ length: cols }, (_, c) => (
            <div
              key={`g${r}-${c}`}
              onClick={(e) => {
                e.stopPropagation()
                onCellClick(e, c + 1, r)
              }}
              style={{
                gridColumn: `${c + 1} / span 1`,
                gridRow: `${r} / span 1`,
                border: "1px dashed rgba(94,106,210,0.12)",
                borderRadius: 4,
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(94,106,210,0.04)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            />
          ))
        )}

        {/* Blocks */}
        {blocks.map((b) => {
          const def = BLOCK_LIBRARY[b.type] || BLOCK_LIBRARY.paragraph
          const isSelected = selected === b.id
          return (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(b.id)
              }}
              style={{
                gridColumn: `${b.col} / span ${b.span}`,
                gridRow: `${b.row} / span 1`,
                position: "relative",
                background: "var(--background)",
                border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
                borderRadius: 6,
                padding: 14,
                cursor: "pointer",
                minHeight: 56,
                boxShadow: isSelected ? "0 0 0 3px rgba(94,106,210,0.12)" : "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {def.glyph} {def.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  col {b.col} &middot; span {b.span}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{b.text}</div>

              {isSelected && (
                <>
                  {/* Move handle */}
                  <div
                    onMouseDown={(e) => startDrag(e, b.id, "move")}
                    title="Drag to move"
                    style={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 44,
                      height: 16,
                      background: "var(--accent)",
                      borderRadius: 4,
                      cursor: "grab",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                    }}
                  >
                    &#x22ee;&#x22ee;
                  </div>
                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => startDrag(e, b.id, "resize")}
                    title="Drag to resize"
                    style={{
                      position: "absolute",
                      right: -6,
                      top: 0,
                      bottom: 0,
                      width: 12,
                      cursor: "ew-resize",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 3, height: 24, background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating hint */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          fontSize: 11,
          color: "var(--muted-foreground)",
          background: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 10px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          gap: 14,
        }}
      >
        <span>
          <span className="kbd">/</span> insert
        </span>
        <span>
          <span className="kbd">&#x232b;</span> delete
        </span>
        <span>drag top to move &middot; drag right to resize</span>
      </div>

      <SlashMenu
        shell={shell}
        open={slash.open}
        x={slash.x}
        y={slash.y}
        q={slash.q}
        setQ={(q) => setSlash({ ...slash, q })}
        onPick={insertBlock}
        onClose={() => setSlash({ ...slash, open: false })}
      />
    </>
  )
}
