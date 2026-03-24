"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor } from "@tiptap/react"
import { Table as PhTable } from "@phosphor-icons/react/dist/ssr/Table"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Minus as PhMinus } from "@phosphor-icons/react/dist/ssr/Minus"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
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
    <div className="relative">
      <button
        ref={buttonRef}
        onMouseDown={handleToggle}
        title="Table"
        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-100 ease-in-out cursor-pointer border-0 outline-none hover:text-foreground hover:bg-foreground/[0.06] ${
          isInsideTable ? "text-foreground" : "text-muted-foreground"
        } ${
          isOpen ? "bg-foreground/10" : isInsideTable ? "bg-toolbar-active" : ""
        }`}
      >
        <PhTable size={15} weight="regular" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed -translate-x-1/2 p-2.5 rounded-[10px] bg-popover border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[9999] min-w-[180px]"
            style={{ left: `${pos.left}px`, bottom: `${pos.bottom}px` }}
          >
            {!isInsideTable ? (
              <>
                <div className="text-2xs font-semibold text-muted-foreground mb-2 px-0.5">
                  Insert table
                </div>
                <div
                  className="grid gap-[3px] mb-2"
                  style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
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
                        className={`w-[22px] h-[22px] rounded-sm border cursor-pointer transition-all duration-[50ms] ${
                          isHighlighted ? "border-[rgba(94,106,210,0.6)] bg-toolbar-active" : "border-border"
                        }`}
                      />
                    )
                  })}
                </div>
                <div className="text-2xs text-muted-foreground text-center">
                  {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} x ${hoverCol}` : "Select size"}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xs font-semibold text-muted-foreground mb-2 px-0.5">
                  Edit table
                </div>
                <div className="flex flex-col gap-0.5">
                  <TableAction icon={<PhPlus size={13} weight="regular" />} label="Add row above" onClick={() => { editor.chain().focus().addRowBefore().run(); setIsOpen(false) }} />
                  <TableAction icon={<PhPlus size={13} weight="regular" />} label="Add row below" onClick={() => { editor.chain().focus().addRowAfter().run(); setIsOpen(false) }} />
                  <TableAction icon={<PhMinus size={13} weight="regular" />} label="Delete row" onClick={() => { editor.chain().focus().deleteRow().run(); setIsOpen(false) }} danger />
                  <div className="h-px bg-border my-1" />
                  <TableAction icon={<PhPlus size={13} weight="regular" />} label="Add column left" onClick={() => { editor.chain().focus().addColumnBefore().run(); setIsOpen(false) }} />
                  <TableAction icon={<PhPlus size={13} weight="regular" />} label="Add column right" onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsOpen(false) }} />
                  <TableAction icon={<PhMinus size={13} weight="regular" />} label="Delete column" onClick={() => { editor.chain().focus().deleteColumn().run(); setIsOpen(false) }} danger />
                  <div className="h-px bg-border my-1" />
                  <TableAction icon={<Trash size={13} weight="regular" />} label="Delete table" onClick={() => { editor.chain().focus().deleteTable().run(); setIsOpen(false) }} danger />
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
      className={`flex items-center gap-2 py-[5px] px-1.5 rounded-[5px] font-medium bg-transparent border-0 cursor-pointer transition-colors duration-100 w-full text-left text-xs hover:bg-foreground/[0.06] ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
