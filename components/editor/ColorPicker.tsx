"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor } from "@tiptap/react"
import { Type, Highlighter, X } from "lucide-react"
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "@/lib/editor-colors"

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
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onMouseDown={handleToggle}
        title={mode === "text" ? "Text color" : "Highlight"}
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
          color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
          backgroundColor: isOpen
            ? "color-mix(in srgb, var(--foreground) 10%, transparent)"
            : isActive
              ? "rgba(94,106,210,0.2)"
              : "transparent",
          border: "none",
          outline: "none",
          position: "relative",
        }}
        className="hover:text-foreground hover:bg-foreground/[0.06]"
      >
        {mode === "text" ? (
          <Type size={15} strokeWidth={1.5} />
        ) : (
          <Highlighter size={15} strokeWidth={1.5} />
        )}
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "6px",
            right: "6px",
            height: "2px",
            borderRadius: "1px",
            backgroundColor: activeColor || (mode === "text" ? "var(--muted-foreground)" : "transparent"),
            transition: "background-color 0.1s",
          }}
        />
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
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              zIndex: 9999,
              width: "188px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                padding: "0 2px",
              }}
            >
              <span className="text-2xs" style={{ fontWeight: 600, color: "var(--muted-foreground)" }}>
                {mode === "text" ? "Text color" : "Highlight color"}
              </span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                }}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--muted-foreground)",
                  backgroundColor: "transparent",
                  border: "none",
                }}
                className="hover:bg-foreground/[0.08] hover:text-muted-foreground"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
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
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: isColorActive
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                      backgroundColor: "transparent",
                      transition: "all 0.1s",
                      outline: "none",
                      padding: 0,
                    }}
                    className="hover:border-foreground/20"
                  >
                    {!color.value ? (
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          position: "relative",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "-2px",
                            right: "-2px",
                            height: "1px",
                            backgroundColor: "var(--destructive)",
                            transform: "rotate(-45deg)",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          backgroundColor: color.swatch,
                          opacity: mode === "highlight" ? 0.7 : 1,
                        }}
                      />
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
