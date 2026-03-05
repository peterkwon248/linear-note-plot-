"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Editor } from "@tiptap/react"
import { Type, Highlighter, X } from "lucide-react"

const TEXT_COLORS = [
  { label: "Default", value: "", swatch: "#E2E2E2" },
  { label: "Red", value: "#EF4444", swatch: "#EF4444" },
  { label: "Orange", value: "#F97316", swatch: "#F97316" },
  { label: "Yellow", value: "#EAB308", swatch: "#EAB308" },
  { label: "Green", value: "#22C55E", swatch: "#22C55E" },
  { label: "Blue", value: "#3B82F6", swatch: "#3B82F6" },
  { label: "Purple", value: "#A855F7", swatch: "#A855F7" },
  { label: "Pink", value: "#EC4899", swatch: "#EC4899" },
  { label: "Gray", value: "#9CA3AF", swatch: "#9CA3AF" },
  { label: "Cyan", value: "#06B6D4", swatch: "#06B6D4" },
]

const HIGHLIGHT_COLORS = [
  { label: "None", value: "", swatch: "transparent" },
  { label: "Red", value: "rgba(239,68,68,0.25)", swatch: "#EF4444" },
  { label: "Orange", value: "rgba(249,115,22,0.25)", swatch: "#F97316" },
  { label: "Yellow", value: "rgba(234,179,8,0.3)", swatch: "#EAB308" },
  { label: "Green", value: "rgba(34,197,94,0.25)", swatch: "#22C55E" },
  { label: "Blue", value: "rgba(59,130,246,0.25)", swatch: "#3B82F6" },
  { label: "Purple", value: "rgba(168,85,247,0.25)", swatch: "#A855F7" },
  { label: "Pink", value: "rgba(236,72,153,0.25)", swatch: "#EC4899" },
  { label: "Gray", value: "rgba(156,163,175,0.2)", swatch: "#9CA3AF" },
  { label: "Cyan", value: "rgba(6,182,212,0.25)", swatch: "#06B6D4" },
]

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
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted-foreground)" }}>
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
                        ? "2px solid #5E6AD2"
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
                            backgroundColor: "#EF4444",
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
