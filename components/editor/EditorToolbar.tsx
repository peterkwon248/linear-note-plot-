"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { Editor, useEditorState } from "@tiptap/react"
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "@/lib/editor-colors"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import { TextB } from "@phosphor-icons/react/dist/ssr/TextB"
import { TextItalic } from "@phosphor-icons/react/dist/ssr/TextItalic"
import { TextUnderline as UnderlineIcon } from "@phosphor-icons/react/dist/ssr/TextUnderline"
import { TextStrikethrough } from "@phosphor-icons/react/dist/ssr/TextStrikethrough"
import { Code as PhCode } from "@phosphor-icons/react/dist/ssr/Code"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { LinkBreak } from "@phosphor-icons/react/dist/ssr/LinkBreak"
import { TextT } from "@phosphor-icons/react/dist/ssr/TextT"
import { HighlighterCircle } from "@phosphor-icons/react/dist/ssr/HighlighterCircle"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FileArrowUp } from "@phosphor-icons/react/dist/ssr/FileArrowUp"

interface EditorToolbarProps {
  editor: Editor | null
}

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
    <div className="flex items-center gap-[3px] px-0.5">
      {colors.map((color) => (
        <button
          key={color.label}
          onMouseDown={(e) => { e.preventDefault(); applyColor(color.value) }}
          title={color.label}
          className="w-5 h-5 rounded flex items-center justify-center cursor-pointer border border-border bg-transparent outline-none p-0 shrink-0 hover:border-foreground/30"
        >
          {!color.value ? (
            <div className="w-3 h-3 rounded-sm relative overflow-hidden border border-border">
              <div className="absolute top-1/2 -left-0.5 -right-0.5 h-px bg-destructive -rotate-45" />
            </div>
          ) : (
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.swatch, opacity: mode === "highlight" ? 0.7 : 1 }} />
          )}
        </button>
      ))}
      <button
        onMouseDown={(e) => { e.preventDefault(); onClose() }}
        className="w-5 h-5 rounded flex items-center justify-center cursor-pointer text-muted-foreground bg-transparent border-0 shrink-0 hover:text-muted-foreground"
      >
        <PhX size={12} weight="regular" />
      </button>
    </div>
  )
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const createNote = usePlotStore((s) => s.createNote)
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

  const handleExtractAsNote = useCallback(() => {
    if (!editor) return
    const { from, to, empty } = editor.state.selection
    if (empty) return

    const selectedText = editor.state.doc.textBetween(from, to, "\n")
    if (!selectedText.trim()) return

    const firstLine = selectedText.split("\n")[0].trim()
    const title = firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine

    createNote({
      title,
      content: selectedText,
      status: "inbox",
    })

    editor.chain().focus().deleteSelection().insertContent(`[[${title}]]`).run()

    toast.success(`Extracted as note: "${title}"`, { duration: 2000 })
  }, [editor, createNote])

  const handleSetLink = () => {
    if (!editor || !editorState) return
    if (editorState.link) { editor.chain().unsetLink().run(); return }
    const url = window.prompt("Enter URL:")
    if (url) editor.chain().setLink({ href: url }).run()
  }

  const activeTextColor = editor ? (editor.getAttributes("textStyle").color || null) : null

  if (!editor || !editorState) return null

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
          <BubbleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editorState.bold} title="Bold (Ctrl+B)">
            <TextB size={14} weight="regular" />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editorState.italic} title="Italic (Ctrl+I)">
            <TextItalic size={14} weight="regular" />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editorState.underline} title="Underline (Ctrl+U)">
            <UnderlineIcon size={14} weight="regular" />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editorState.strike} title="TextStrikethrough">
            <TextStrikethrough size={14} weight="regular" />
          </BubbleButton>
          <BubbleButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editorState.code} title="Inline code">
            <PhCode size={14} weight="regular" />
          </BubbleButton>
          <BubbleDivider />
          <BubbleButton onClick={() => setActivePanel("textColor")} isActive={!!activeTextColor} title="Text color">
            <div className="relative">
              <TextT size={14} weight="regular" />
              <div className="absolute -bottom-[3px] left-px right-px h-0.5 rounded-sm" style={{ backgroundColor: activeTextColor || "var(--muted-foreground)" }} />
            </div>
          </BubbleButton>
          <BubbleButton onClick={() => setActivePanel("highlightColor")} isActive={editorState.highlight} title="Highlight">
            <HighlighterCircle size={14} weight="regular" />
          </BubbleButton>
          <BubbleDivider />
          <BubbleButton onClick={handleSetLink} isActive={editorState.link} title={editorState.link ? "Remove link" : "Insert link"}>
            {editorState.link ? <LinkBreak size={14} weight="regular" /> : <PhLink size={14} weight="regular" />}
          </BubbleButton>
          <BubbleDivider />
          <BubbleButton onClick={handleExtractAsNote} title="Extract as Note">
            <FileArrowUp size={14} weight="regular" />
          </BubbleButton>
        </>
      ) : (
        <InlineColorPalette editor={editor} mode={activePanel === "textColor" ? "text" : "highlight"} onClose={() => setActivePanel("none")} />
      )}
    </div>
  )
}
