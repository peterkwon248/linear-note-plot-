"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { useAttachmentUrl } from "@/lib/use-attachment-url"
import { DotsThree } from "@phosphor-icons/react/dist/ssr/DotsThree"
import { Copy as PhCopy } from "@phosphor-icons/react/dist/ssr/Copy"
import { Scissors } from "@phosphor-icons/react/dist/ssr/Scissors"
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple"
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash"
import { TextAlignLeft } from "@phosphor-icons/react/dist/ssr/TextAlignLeft"
import { TextAlignCenter } from "@phosphor-icons/react/dist/ssr/TextAlignCenter"
import { TextAlignRight } from "@phosphor-icons/react/dist/ssr/TextAlignRight"

export function ImageNode({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, isLeft: false })

  const { src: rawSrc, alt, width, textAlign = "left" } = node.attrs

  // Resolve attachment:// URLs to blob: URLs (also handles data: and http: pass-through)
  const { url: resolvedUrl, loading } = useAttachmentUrl(rawSrc)
  const src = resolvedUrl ?? ""

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isMenuOpen])

  // Update menu position — dropdown opens outside the image container
  // Right-aligned: dropdown opens to the LEFT; otherwise: to the RIGHT
  const updateMenuPos = useCallback(() => {
    if (!wrapperRef.current) return
    const containerRect = wrapperRef.current.getBoundingClientRect()
    const btnRect = menuBtnRef.current?.getBoundingClientRect()
    const topVal = btnRect ? btnRect.top : containerRect.top + 4

    if (textAlign === "right") {
      // Open to the LEFT of the image
      setMenuPos({ top: topVal, left: containerRect.left - 6, isLeft: true })
    } else {
      // Open to the RIGHT of the image
      setMenuPos({ top: topVal, left: containerRect.right + 6, isLeft: false })
    }
  }, [textAlign])

  useEffect(() => {
    if (!isMenuOpen) return
    updateMenuPos()
    window.addEventListener("scroll", updateMenuPos, true)
    window.addEventListener("resize", updateMenuPos)
    return () => {
      window.removeEventListener("scroll", updateMenuPos, true)
      window.removeEventListener("resize", updateMenuPos)
    }
  }, [isMenuOpen, updateMenuPos])

  // Resize handlers — supports all 4 corners
  const onResizeStart = useCallback(
    (corner: "top-left" | "top-right" | "bottom-left" | "bottom-right") =>
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      startX.current = e.clientX
      startWidth.current = imageRef.current?.offsetWidth ?? 300

      // Left-side corners: dragging left = wider, right = narrower
      const sign = corner.includes("left") ? -1 : 1

      const onMouseMove = (ev: MouseEvent) => {
        const diff = (ev.clientX - startX.current) * sign
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
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
      }}
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
        {loading ? (
          <div
            className="image-node-img image-node-loading"
            style={{
              width: width ? `${width}px` : "200px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--secondary)",
              borderRadius: "6px",
              color: "var(--muted-foreground)",
              fontSize: "12px",
            }}
          >
            Loading...
          </div>
        ) : (
          <img
            ref={imageRef}
            src={src}
            alt={alt || ""}
            draggable={false}
            className={`image-node-img ${selected ? "image-node-selected" : ""}`}
            style={{ width: width ? `${width}px` : undefined }}
          />
        )}

        {/* Resize handles (invisible hit areas at corners) */}
        {editor?.isEditable && (
          <>
            <div
              className="image-node-resize-handle image-node-resize-tl"
              onMouseDown={onResizeStart("top-left")}
            />
            <div
              className="image-node-resize-handle image-node-resize-tr"
              onMouseDown={onResizeStart("top-right")}
            />
            <div
              className="image-node-resize-handle image-node-resize-bl"
              onMouseDown={onResizeStart("bottom-left")}
            />
            <div
              className="image-node-resize-handle image-node-resize-br"
              onMouseDown={onResizeStart("bottom-right")}
            />
          </>
        )}

        {/* Menu button — inside image, top-right (or top-left when right-aligned) */}
        {(isHovered || isMenuOpen || selected) && editor?.isEditable && (
          <button
            ref={menuBtnRef}
            className={`image-node-menu-btn ${textAlign === "right" ? "image-node-menu-btn-left" : ""}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isMenuOpen) updateMenuPos()
              setIsMenuOpen(!isMenuOpen)
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <DotsThree size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Dropdown menu — portal to body so it doesn't get clipped */}
        {isMenuOpen && createPortal(
          <div
            ref={menuRef}
            className="image-node-dropdown"
            style={{
              position: "fixed",
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              ...(menuPos.isLeft ? { transform: "translateX(-100%)" } : {}),
            }}
          >
            {/* Alignment buttons */}
            <div className="image-node-align-row">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  className={`image-node-align-btn ${textAlign === align ? "image-node-align-active" : ""}`}
                  onClick={() => { updateAttributes({ textAlign: align }); setIsMenuOpen(false) }}
                  onMouseDown={(e) => e.preventDefault()}
                  title={align === "left" ? "Left" : align === "center" ? "Center" : "Right"}
                >
                  {align === "left" && <TextAlignLeft size={15} weight="regular" />}
                  {align === "center" && <TextAlignCenter size={15} weight="regular" />}
                  {align === "right" && <TextAlignRight size={15} weight="regular" />}
                </button>
              ))}
            </div>
            <div className="image-node-dropdown-separator" />
            <button
              className="image-node-dropdown-item"
              onClick={handleCopy}
              onMouseDown={(e) => e.preventDefault()}
            >
              <PhCopy size={14} weight="regular" />
              <span>PhCopy Image</span>
            </button>
            <button
              className="image-node-dropdown-item"
              onClick={handleCut}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Scissors size={14} weight="regular" />
              <span>Cut Image</span>
            </button>
            <button
              className="image-node-dropdown-item"
              onClick={handleSave}
              onMouseDown={(e) => e.preventDefault()}
            >
              <DownloadSimple size={14} weight="regular" />
              <span>Save Image</span>
            </button>
            <div className="image-node-dropdown-separator" />
            <button
              className="image-node-dropdown-item image-node-dropdown-danger"
              onClick={handleDelete}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Trash size={14} weight="regular" />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  )
}
