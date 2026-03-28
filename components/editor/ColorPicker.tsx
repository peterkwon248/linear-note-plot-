"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor } from "@tiptap/react"
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "@/lib/editor-colors"
import { TextT } from "@phosphor-icons/react/dist/ssr/TextT"
import { HighlighterCircle } from "@phosphor-icons/react/dist/ssr/HighlighterCircle"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"

interface ColorPickerProps {
  editor: Editor
  mode: "text" | "highlight"
}

export function ColorPicker({ editor, mode }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, bottom: 0 })
  const colors = mode === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS

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

  const getActiveColor = (): string | null => {
    if (mode === "text") {
      const attrs = editor.getAttributes("textStyle")
      return attrs.color || null
    } else {
      if (editor.isActive("highlight")) {
        const attrs = editor.getAttributes("highlight")
        return attrs.color || "#FDE047"
      }
      return null
    }
  }

  const applyColor = (color: string) => {
    if (mode === "text") {
      if (!color) {
        editor.chain().focus().unsetColor().run()
      } else {
        editor.chain().focus().setColor(color).run()
      }
    } else {
      if (!color) {
        editor.chain().focus().unsetHighlight().run()
      } else {
        editor.chain().focus().toggleHighlight({ color }).run()
      }
    }
    setIsOpen(false)
  }

  const activeColor = getActiveColor()
  const isActive = mode === "text" ? !!activeColor : editor.isActive("highlight")

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
        title={mode === "text" ? "Text color" : "Highlight"}
        className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-all duration-100 ease-in-out cursor-pointer border-0 outline-none relative hover:text-foreground hover:bg-foreground/[0.06] ${
          isActive ? "text-foreground" : "text-muted-foreground"
        } ${
          isOpen ? "bg-foreground/10" : isActive ? "bg-toolbar-active" : ""
        }`}
      >
        {mode === "text" ? (
          <TextT size={22} weight="light" />
        ) : (
          <HighlighterCircle size={22} weight="light" />
        )}
        <div
          className="absolute bottom-1 left-2 right-2 h-0.5 rounded-sm transition-colors duration-100"
          style={{ backgroundColor: activeColor || (mode === "text" ? "var(--muted-foreground)" : "transparent") }}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed -translate-x-1/2 p-2 rounded-[10px] bg-popover border border-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[9999] w-[300px]"
            style={{ left: `${pos.left}px`, bottom: `${pos.bottom}px` }}
          >
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-2xs font-semibold text-muted-foreground">
                {mode === "text" ? "Text color" : "Highlight color"}
              </span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                }}
                className="w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer text-muted-foreground bg-transparent border-0 hover:bg-foreground/[0.08] hover:text-muted-foreground"
              >
                <PhX size={12} weight="light" />
              </button>
            </div>

            <div className="grid grid-cols-8 gap-1">
              {colors.map((color) => {
                const isColorActive =
                  mode === "text"
                    ? activeColor === color.value || (!activeColor && !color.value)
                    : mode === "highlight" &&
                      ((!color.value && !editor.isActive("highlight")) ||
                        (color.value && editor.isActive("highlight", { color: color.value })))

                return (
                  <button
                    key={color.label}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applyColor(color.value)
                    }}
                    title={color.label}
                    className={`w-[30px] h-[30px] rounded-md flex items-center justify-center cursor-pointer bg-transparent transition-all duration-100 outline-none p-0 hover:border-foreground/20 ${
                      isColorActive ? "border-2 border-accent" : "border border-border"
                    }`}
                  >
                    {!color.value ? (
                      <div className="w-4 h-4 rounded-sm relative overflow-hidden border border-border">
                        <div className="absolute top-1/2 -left-0.5 -right-0.5 h-px bg-destructive -rotate-45" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color.swatch, opacity: mode === "highlight" ? 0.7 : 1 }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
