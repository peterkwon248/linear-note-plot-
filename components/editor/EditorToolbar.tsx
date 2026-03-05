"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { Editor, useEditorState } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading,
  Code,
  Link2,
  Unlink,
  Type,
  Highlighter,
  X,
} from "lucide-react"

interface EditorToolbarProps {
  editor: Editor | null
}

const TEXT_COLORS = [
  { label: "Default", value: "", swatch: "#E2E2E2" },
  { label: "Red", value: "#EF4444", swatch: "#EF4444" },
  { label: "Orange", value: "#F97316", swatch: "#F97316" },
  { label: "Yellow", value: "#EAB308", swatch: "#EAB308" },
  { label: "Green", value: "#22C55E", swatch: "#22C55E" },
  { label: "Blue", value: "#3B82F6", swatch: "#3B82F6" },
  { label: "Purple", value: "#A855F7", swatch: "#A855F7" },
  { label: "Pink", value: "#EC4899", swatch: "#EC4899" },
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
  { label: "Cyan", value: "rgba(6,182,212,0.25)", swatch: "#06B6D4" },
]

function BubbleButton({ onClick, isActive = false, title, children }: { onClick: () => void; isActive?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-75 flex-shrink-0 ${
        isActive ? "text-foreground bg-foreground/[0.12]" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08]"
      }`}
    >
      {children}
    </button>
  )
}

function BubbleDivider() {
  return <div className="w-px h-4 bg-foreground/10 mx-0.5 flex-shrink-0" />
}

function BubbleHeadingDropdown({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const headingOptions = [
    { level: 1, label: "H1", fontSize: "18px" },
    { level: 2, label: "H2", fontSize: "16px" },
    { level: 3, label: "H3", fontSize: "15px" },
    { level: 4, label: "H4", fontSize: "14px" },
    { level: 5, label: "H5", fontSize: "13px" },
    { level: 6, label: "H6", fontSize: "13px" },
  ] as const

  const headingState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e?.isActive("heading", { level: 1 }) ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      h4: e?.isActive("heading", { level: 4 }) ?? false,
      h5: e?.isActive("heading", { level: 5 }) ?? false,
      h6: e?.isActive("heading", { level: 6 }) ?? false,
    }),
  })

  const headingActiveMap: Record<number, boolean> = {
    1: headingState.h1,
    2: headingState.h2,
    3: headingState.h3,
    4: headingState.h4,
    5: headingState.h5,
    6: headingState.h6,
  }

  const isAnyHeadingActive = Object.values(headingActiveMap).some(Boolean)

  useEffect(() => {
    if (!isOpen) return
    let cleanup: (() => void) | undefined
    const id = requestAnimationFrame(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
      }
      document.addEventListener("mousedown", handleClickOutside)
      cleanup = () => document.removeEventListener("mousedown", handleClickOutside)
    })
    return () => { cancelAnimationFrame(id); cleanup?.() }
  }, [isOpen])

  const handleSelect = useCallback(
    (level: number | null) => {
      if (level === null) editor.chain().focus().setParagraph().run()
      else editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
      setIsOpen(false)
    },
    [editor]
  )

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Heading"
        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-75 flex-shrink-0 ${
          isAnyHeadingActive ? "text-foreground bg-foreground/[0.12]" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08]"
        }`}
      >
        <Heading size={14} strokeWidth={1.5} />
      </button>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            marginTop: "8px",
            minWidth: "120px",
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
            padding: "4px",
            zIndex: 1000,
          }}
        >
          {headingOptions.map(({ level, label, fontSize }) => (
            <button
              key={level}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(level) }}
              style={{
                width: "100%",
                padding: "6px 12px",
                fontSize,
                fontWeight: 600,
                textAlign: "left",
                border: "none",
                outline: "none",
                cursor: "pointer",
                borderRadius: "6px",
                backgroundColor: headingActiveMap[level] ? "rgba(94,106,210,0.2)" : "transparent",
                color: headingActiveMap[level] ? "var(--foreground)" : "var(--muted-foreground)",
              }}
              className="hover:bg-foreground/[0.06]"
            >
              {label}
            </button>
          ))}
          <button
            onMouseDown={(e) => { e.preventDefault(); handleSelect(null) }}
            style={{
              width: "100%",
              padding: "6px 12px",
              fontSize: "13px",
              textAlign: "left",
              border: "none",
              outline: "none",
              cursor: "pointer",
              borderRadius: "6px",
              backgroundColor: !isAnyHeadingActive ? "rgba(94,106,210,0.2)" : "transparent",
              color: !isAnyHeadingActive ? "var(--foreground)" : "var(--muted-foreground)",
            }}
            className="hover:bg-foreground/[0.06]"
          >
            Normal
          </button>
        </div>
      )}
    </div>
  )
}

function InlineColorPalette({ editor, mode, onClose }: { editor: Editor; mode: "text" | "highlight"; onClose: () => void }) {
  const colors = mode === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS
  const applyColor = (color: string) => {
    if (mode === "text") {
      if (!color) editor.chain().unsetColor().run()
      else editor.chain().setColor(color).run()
    } else {
      if (!color) editor.chain().unsetHighlight().run()
      else editor.chain().toggleHighlight({ color }).run()
    }
    onClose()
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "0 2px" }}>
      {colors.map((color) => (
        <button
          key={color.label}
          onMouseDown={(e) => { e.preventDefault(); applyColor(color.value) }}
          title={color.label}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            outline: "none",
            padding: 0,
            flexShrink: 0,
          }}
          className="hover:border-foreground/30"
        >
          {!color.value ? (
            <div style={{ width: "12px", height: "12px", borderRadius: "2px", position: "relative", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ position: "absolute", top: "50%", left: "-2px", right: "-2px", height: "1px", backgroundColor: "#EF4444", transform: "rotate(-45deg)" }} />
            </div>
          ) : (
            <div style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: color.swatch, opacity: mode === "highlight" ? 0.7 : 1 }} />
          )}
        </button>
      ))}
      <button
        onMouseDown={(e) => { e.preventDefault(); onClose() }}
        style={{ width: "20px", height: "20px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted-foreground)", backgroundColor: "transparent", border: "none", flexShrink: 0 }}
        className="hover:text-muted-foreground"
      >
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  )
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [activePanel, setActivePanel] = useState<"none" | "textColor" | "highlightColor">("none")

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      underline: e?.isActive("underline") ?? false,
      strike: e?.isActive("strike") ?? false,
      code: e?.isActive("code") ?? false,
      link: e?.isActive("link") ?? false,
      highlight: e?.isActive("highlight") ?? false,
    }),
  })

  useEffect(() => {
    if (!editor) return
    const updatePosition = () => {
      const { empty } = editor.state.selection
      if (empty) { setIsVisible(false); setActivePanel("none"); return }
      const domSelection = window.getSelection()
      if (!domSelection || domSelection.rangeCount === 0 || domSelection.isCollapsed) { setIsVisible(false); setActivePanel("none"); return }
      const range = domSelection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) { setIsVisible(false); setActivePanel("none"); return }
      const menuWidth = menuRef.current?.offsetWidth || 380
      const menuHeight = menuRef.current?.offsetHeight || 40
      let left = rect.left + rect.width / 2 - menuWidth / 2
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))
      let top = rect.top - menuHeight - 10
      if (top < 8) top = rect.bottom + 10
      setPosition({ top, left })
      setIsVisible(true)
    }
    editor.on("selectionUpdate", updatePosition)
    const handleBlur = () => {
      setTimeout(() => {
        const menuEl = menuRef.current
        if (menuEl && (menuEl.contains(document.activeElement) || menuEl.matches(":hover"))) return
        setIsVisible(false)
        setActivePanel("none")
      }, 200)
    }
    editor.on("blur", handleBlur)
    const scrollContainer = editor.view.dom.closest(".overflow-y-auto")
    const handleScroll = () => { if (isVisible) updatePosition() }
    scrollContainer?.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      editor.off("selectionUpdate", updatePosition)
      editor.off("blur", handleBlur)
      scrollContainer?.removeEventListener("scroll", handleScroll)
    }
  }, [editor, isVisible])

  if (!editor || !editorState) return null

  const handleSetLink = () => {
    if (editorState.link) { editor.chain().unsetLink().run(); return }
    const url = window.prompt("Enter URL:")
    if (url) editor.chain().setLink({ href: url }).run()
  }

  const getActiveTextColor = (): string | null => {
    const attrs = editor.getAttributes("textStyle")
    return attrs.color || null
  }

  const activeTextColor = getActiveTextColor()

  return (
    <div
      ref={menuRef}
      className={`fixed z-[100] flex items-center gap-0.5 px-1.5 py-1 rounded-[10px] bg-popover border border-border shadow-[0_4px_24px_rgba(0,0,0,0.55)] transition-all duration-150 ${
        isVisible ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {activePanel === "none" ? (
        <>
          <BubbleHeadingDropdown editor={editor} />
          <BubbleDivider />
          <BubbleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold (Ctrl+B)">
            <Bold size={14} strokeWidth={2} />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic (Ctrl+I)">
            <Italic size={14} strokeWidth={1.5} />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline (Ctrl+U)">
            <UnderlineIcon size={14} strokeWidth={1.5} />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="Strikethrough">
            <Strikethrough size={14} strokeWidth={1.5} />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline code">
            <Code size={14} strokeWidth={1.5} />
          </BubbleButton>
          <BubbleDivider />
          <BubbleButton onClick={() => setActivePanel("textColor")} isActive={!!activeTextColor} title="Text color">
            <div style={{ position: "relative" }}>
              <Type size={14} strokeWidth={1.5} />
              <div style={{ position: "absolute", bottom: "-3px", left: "1px", right: "1px", height: "2px", borderRadius: "1px", backgroundColor: activeTextColor || "var(--muted-foreground)" }} />
            </div>
          </BubbleButton>
          <BubbleButton onClick={() => setActivePanel("highlightColor")} isActive={editorState.highlight} title="Highlight">
            <Highlighter size={14} strokeWidth={1.5} />
          </BubbleButton>
          <BubbleDivider />
          <BubbleButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove link" : "Insert link"}>
            {editorState.link ? <Unlink size={14} strokeWidth={1.5} /> : <Link2 size={14} strokeWidth={1.5} />}
          </BubbleButton>
        </>
      ) : (
        <InlineColorPalette editor={editor} mode={activePanel === "textColor" ? "text" : "highlight"} onClose={() => setActivePanel("none")} />
      )}
    </div>
  )
}
