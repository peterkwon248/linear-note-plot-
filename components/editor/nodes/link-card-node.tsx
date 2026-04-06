"use client"

import { useState, useRef, useCallback } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe"
import { extractDomain } from "@/lib/editor/url-detect"

// ── LinkCard NodeView ────────────────────────────────────────────────

function LinkCardView({ node, selected, updateAttributes }: NodeViewProps) {
  const url = node.attrs.url as string
  const [title, setTitle] = useState<string>(node.attrs.title as string || "")
  const [description, setDescription] = useState<string>(node.attrs.description as string || "")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const titleRef = useRef<HTMLSpanElement>(null)
  const descRef = useRef<HTMLSpanElement>(null)

  const domain = extractDomain(url)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
  const displayTitle = title || url

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (editingTitle || editingDesc) return
    window.open(url, "_blank", "noopener,noreferrer")
  }, [url, editingTitle, editingDesc])

  const handleExternalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(url, "_blank", "noopener,noreferrer")
  }, [url])

  const startEditTitle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTitle(true)
    setTimeout(() => {
      titleRef.current?.focus()
      // select all text
      const range = document.createRange()
      const sel = window.getSelection()
      if (titleRef.current && sel) {
        range.selectNodeContents(titleRef.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }, 0)
  }, [])

  const startEditDesc = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDesc(true)
    setTimeout(() => {
      descRef.current?.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      if (descRef.current && sel) {
        range.selectNodeContents(descRef.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }, 0)
  }, [])

  const saveTitle = useCallback(() => {
    const newTitle = titleRef.current?.textContent?.trim() ?? ""
    setTitle(newTitle)
    updateAttributes({ title: newTitle })
    setEditingTitle(false)
  }, [updateAttributes])

  const saveDesc = useCallback(() => {
    const newDesc = descRef.current?.textContent?.trim() ?? ""
    setDescription(newDesc)
    updateAttributes({ description: newDesc })
    setEditingDesc(false)
  }, [updateAttributes])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveTitle()
    } else if (e.key === "Escape") {
      setEditingTitle(false)
      if (titleRef.current) titleRef.current.textContent = title || url
    }
  }, [saveTitle, title, url])

  const handleDescKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveDesc()
    } else if (e.key === "Escape") {
      setEditingDesc(false)
      if (descRef.current) descRef.current.textContent = description
    }
  }, [saveDesc, description])

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className={`link-card-wrapper not-draggable my-2 select-none${selected ? " ProseMirror-selectednode" : ""}`}
      >
        <div
          className="link-card"
          onClick={handleCardClick}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(e as any) }}
        >
          {/* Favicon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faviconUrl}
            alt=""
            className="link-card-favicon"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />

          {/* Content */}
          <div className="link-card-content">
            {/* Title */}
            <div
              className="link-card-title"
              onDoubleClick={startEditTitle}
              title="Double-click to edit title"
            >
              <span
                ref={titleRef}
                contentEditable={editingTitle}
                suppressContentEditableWarning
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
                onClick={editingTitle ? (e) => e.stopPropagation() : undefined}
                style={{ outline: editingTitle ? "1px solid var(--accent)" : "none", borderRadius: 2 }}
              >
                {displayTitle}
              </span>
            </div>

            {/* Description */}
            {(description || editingDesc) && (
              <div
                className="link-card-description"
                onDoubleClick={startEditDesc}
              >
                <span
                  ref={descRef}
                  contentEditable={editingDesc}
                  suppressContentEditableWarning
                  onBlur={saveDesc}
                  onKeyDown={handleDescKeyDown}
                  onClick={editingDesc ? (e) => e.stopPropagation() : undefined}
                  style={{ outline: editingDesc ? "1px solid var(--accent)" : "none", borderRadius: 2 }}
                >
                  {description}
                </span>
              </div>
            )}

            {/* Domain row */}
            <div className="link-card-domain">
              <Globe size={10} weight="regular" />
              <span>{domain}</span>
            </div>
          </div>

          {/* External link button */}
          <button
            type="button"
            className="link-card-external"
            onClick={handleExternalClick}
            title="Open in new tab"
            tabIndex={-1}
          >
            <ArrowSquareOut size={14} weight="regular" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// ── Node Definition ──────────────────────────────────────────────────

export const LinkCardNode = Node.create({
  name: "linkCard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-url") ?? "",
        renderHTML: (attributes: Record<string, string>) => ({
          "data-url": attributes.url,
        }),
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-title") ?? null,
        renderHTML: (attributes: Record<string, any>) =>
          attributes.title ? { "data-title": attributes.title } : {},
      },
      description: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-description") ?? null,
        renderHTML: (attributes: Record<string, any>) =>
          attributes.description ? { "data-description": attributes.description } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-card"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "link-card" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "linkCard") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "linkCard") {
          e.commands.deleteRange({
            from: $from.pos - before.nodeSize,
            to: $from.pos,
          })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "linkCard") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardView)
  },
})
