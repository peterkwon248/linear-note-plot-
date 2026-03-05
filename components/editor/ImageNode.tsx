"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import {
  MoreHorizontal,
  Copy,
  Scissors,
  Download,
  Trash2,
} from "lucide-react"

export function ImageNode({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const { src, alt, width } = node.attrs

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isMenuOpen])

  // Resize handlers
  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      startX.current = e.clientX
      startWidth.current = imageRef.current?.offsetWidth ?? 300

      const onMouseMove = (ev: MouseEvent) => {
        const diff = ev.clientX - startX.current
        const newWidth = Math.max(100, startWidth.current + diff)
        updateAttributes({ width: newWidth })
      }

      const onMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [updateAttributes]
  )

  // Action handlers
  const handleCopy = useCallback(async () => {
    setIsMenuOpen(false)
    try {
      if (src.startsWith("data:")) {
        const res = await fetch(src)
        const blob = await res.blob()
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ])
      } else {
        await navigator.clipboard.writeText(src)
      }
    } catch {
      // Fallback: copy src as text
      await navigator.clipboard.writeText(src)
    }
  }, [src])

  const handleCut = useCallback(async () => {
    await handleCopy()
    deleteNode()
  }, [handleCopy, deleteNode])

  const handleSave = useCallback(() => {
    setIsMenuOpen(false)
    const a = document.createElement("a")
    a.href = src
    a.download = alt || "image"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [src, alt])

  const handleDelete = useCallback(() => {
    setIsMenuOpen(false)
    deleteNode()
  }, [deleteNode])

  return (
    <NodeViewWrapper
      className="image-node-wrapper"
      data-drag-handle
    >
      <div
        ref={wrapperRef}
        className="image-node-container"
        style={{ width: width ? `${width}px` : undefined }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isMenuOpen) setIsHovered(false)
        }}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ""}
          draggable={false}
          className={`image-node-img ${selected ? "image-node-selected" : ""}`}
          style={{ width: width ? `${width}px` : undefined }}
        />

        {/* Menu button (top-right) */}
        {(isHovered || isMenuOpen || selected) && editor?.isEditable && (
          <button
            className="image-node-menu-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <MoreHorizontal size={16} />
          </button>
        )}

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div ref={menuRef} className="image-node-dropdown">
            <button
              className="image-node-dropdown-item"
              onClick={handleCopy}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Copy size={14} />
              <span>Copy Image</span>
            </button>
            <button
              className="image-node-dropdown-item"
              onClick={handleCut}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Scissors size={14} />
              <span>Cut Image</span>
            </button>
            <button
              className="image-node-dropdown-item"
              onClick={handleSave}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Download size={14} />
              <span>Save Image</span>
            </button>
            <div className="image-node-dropdown-separator" />
            <button
              className="image-node-dropdown-item image-node-dropdown-danger"
              onClick={handleDelete}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Resize handle (bottom-right) */}
        {(isHovered || selected || isResizing) && editor?.isEditable && (
          <div
            className="image-node-resize-handle"
            onMouseDown={onResizeStart}
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path
                d="M11 1L1 11M11 5L5 11M11 9L9 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
