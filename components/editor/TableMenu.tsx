"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor } from "@tiptap/react"
import { Grid3x3, Plus, Minus, Trash2 } from "lucide-react"

interface TableMenuProps {
  editor: Editor
}

export function TableMenu({ editor }: TableMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, bottom: 0 })

  const isInsideTable = editor.isActive("table")
  const maxRows = 6
  const maxCols = 6

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({
      left: rect.left + rect.width / 2,
      bottom: window.innerHeight - rect.top + 6,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen, updatePosition])

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setIsOpen(false)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isOpen) updatePosition()
    setIsOpen(!isOpen)
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onMouseDown={handleToggle}
        title="Table"
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.1s ease",
          cursor: "pointer",
          color: isInsideTable ? "var(--foreground)" : "var(--muted-foreground)",
          backgroundColor: isOpen
            ? "color-mix(in srgb, var(--foreground) 10%, transparent)"
            : isInsideTable
              ? "rgba(94,106,210,0.2)"
              : "transparent",
          border: "none",
          outline: "none",
        }}
        className="hover:text-foreground hover:bg-foreground/[0.06]"
      >
        <Grid3x3 size={15} strokeWidth={1.5} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              left: `${pos.left}px`,
              bottom: `${pos.bottom}px`,
              transform: "translateX(-50%)",
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              zIndex: 9999,
              minWidth: "180px",
            }}
          >
            {!isInsideTable ? (
              <>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    marginBottom: "8px",
                    padding: "0 2px",
                  }}
                >
                  Insert table
                </div>
                <div
                  style={{ display: "grid", gridTemplateColumns: `repeat(${maxCols}, 1fr)`, gap: "3px", marginBottom: "8px" }}
                  onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
                >
                  {Array.from({ length: maxRows * maxCols }).map((_, idx) => {
                    const r = Math.floor(idx / maxCols) + 1
                    const c = (idx % maxCols) + 1
                    const isHighlighted = r <= hoverRow && c <= hoverCol
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => { setHoverRow(r); setHoverCol(c) }}
                        onMouseDown={(e) => { e.preventDefault(); insertTable(r, c) }}
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "3px",
                          border: "1px solid",
                          borderColor: isHighlighted ? "rgba(94,106,210,0.6)" : "var(--border)",
                          backgroundColor: isHighlighted ? "rgba(94,106,210,0.2)" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.05s",
                        }}
                      />
                    )
                  })}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", textAlign: "center" }}>
                  {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} x ${hoverCol}` : "Select size"}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "8px", padding: "0 2px" }}>
                  Edit table
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <TableAction icon={<Plus size={13} strokeWidth={1.5} />} label="Add row above" onClick={() => { editor.chain().focus().addRowBefore().run(); setIsOpen(false) }} />
                  <TableAction icon={<Plus size={13} strokeWidth={1.5} />} label="Add row below" onClick={() => { editor.chain().focus().addRowAfter().run(); setIsOpen(false) }} />
                  <TableAction icon={<Minus size={13} strokeWidth={1.5} />} label="Delete row" onClick={() => { editor.chain().focus().deleteRow().run(); setIsOpen(false) }} danger />
                  <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "4px 0" }} />
                  <TableAction icon={<Plus size={13} strokeWidth={1.5} />} label="Add column left" onClick={() => { editor.chain().focus().addColumnBefore().run(); setIsOpen(false) }} />
                  <TableAction icon={<Plus size={13} strokeWidth={1.5} />} label="Add column right" onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsOpen(false) }} />
                  <TableAction icon={<Minus size={13} strokeWidth={1.5} />} label="Delete column" onClick={() => { editor.chain().focus().deleteColumn().run(); setIsOpen(false) }} danger />
                  <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "4px 0" }} />
                  <TableAction icon={<Trash2 size={13} strokeWidth={1.5} />} label="Delete table" onClick={() => { editor.chain().focus().deleteTable().run(); setIsOpen(false) }} danger />
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

function TableAction({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 6px",
        borderRadius: "5px",
        fontSize: "12px",
        fontWeight: 500,
        color: danger ? "var(--destructive)" : "var(--foreground)",
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.1s",
        width: "100%",
        textAlign: "left",
      }}
      className="hover:bg-foreground/[0.06]"
    >
      {icon}
      {label}
    </button>
  )
}
