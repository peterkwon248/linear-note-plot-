"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Editor } from "@tiptap/react"
import { MapPin, PushPin } from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import type { GlobalBookmark } from "@/lib/types"

interface TocNavItem {
  id: string
  level: number
  text: string
  pos: number
  type: "heading" | "bookmark"
}

/**
 * Collect headings and anchor bookmarks from the editor document.
 * The very first heading (which is the note title, typically H2) is excluded.
 */
function collectNavItems(editor: Editor): TocNavItem[] {
  const items: TocNavItem[] = []
  let skippedTitle = false

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      // Skip the very first heading — it's the note title
      if (!skippedTitle) {
        skippedTitle = true
        return
      }
      items.push({
        id: node.attrs.id || `heading-${pos}`,
        level: node.attrs.level as number,
        text: node.textContent,
        pos,
        type: "heading",
      })
    } else if (node.type.name === "anchorMark" || node.type.name === "anchorDivider") {
      items.push({
        id: node.attrs.id || `anchor-${pos}`,
        level: 99, // special level for bookmarks
        text: node.attrs.label || "Bookmark",
        pos,
        type: "bookmark",
      })
    }
  })

  return items
}

/** Dash width in px for each heading level */
function dashWidth(level: number): number {
  if (level === 99) return 0 // bookmarks use icon instead
  switch (level) {
    case 1:
      return 16
    case 2:
      return 16
    case 3:
      return 10
    default:
      return 6
  }
}

/** Left indent (px) for each heading level in expanded view */
function indentPx(level: number): number {
  // Since the note title (first heading) is excluded,
  // section headings typically start at H2
  switch (level) {
    case 1:
      return 0
    case 2:
      return 0
    case 3:
      return 12
    case 4:
      return 24
    case 5:
      return 36
    default:
      return 48
  }
}

interface FloatingTocProps {
  editor: Editor
}

export function FloatingToc({ editor }: FloatingTocProps) {
  const [headings, setHeadings] = useState<TocNavItem[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)
  const selectedNoteId = usePlotStore((s) => s.selectedNoteId)

  // Collect headings and bookmarks on editor updates
  const updateHeadings = useCallback(() => {
    const h = collectNavItems(editor)
    setHeadings(h)
  }, [editor])

  useEffect(() => {
    updateHeadings()
    editor.on("update", updateHeadings)
    return () => {
      editor.off("update", updateHeadings)
    }
  }, [editor, updateHeadings])

  // Detect if user is actively typing (editor focused)
  useEffect(() => {
    const onFocus = () => setIsFocused(true)
    const onBlur = () => setIsFocused(false)
    editor.on("focus", onFocus)
    editor.on("blur", onBlur)
    return () => {
      editor.off("focus", onFocus)
      editor.off("blur", onBlur)
    }
  }, [editor])

  // Find scroll container once
  useEffect(() => {
    const editorDom = editor.view.dom
    let el: HTMLElement | null = editorDom.parentElement
    while (el) {
      const style = getComputedStyle(el)
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainerRef.current = el
        return
      }
      el = el.parentElement
    }
    // fallback to document element
    scrollContainerRef.current = document.documentElement
  }, [editor])

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return

    const container = scrollContainerRef.current
    if (!container) return

    // Disconnect previous observer
    observerRef.current?.disconnect()

    const headingElements: { el: HTMLElement; idx: number }[] = []

    headings.forEach((h, idx) => {
      try {
        const domNode = editor.view.nodeDOM(h.pos) as HTMLElement | null
        if (domNode) {
          headingElements.push({ el: domNode, idx })
        }
      } catch {
        // pos might be stale
      }
    })

    if (headingElements.length === 0) return

    // Use a simpler scroll-based approach for accuracy
    const handleScroll = () => {
      let activeIndex = -1
      const containerRect =
        container === document.documentElement
          ? { top: 0 }
          : container.getBoundingClientRect()

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const rect = headingElements[i].el.getBoundingClientRect()
        const relativeTop = rect.top - containerRect.top
        if (relativeTop <= 100) {
          activeIndex = headingElements[i].idx
          break
        }
      }

      // If none passed the threshold, use the first one
      if (activeIndex === -1 && headingElements.length > 0) {
        activeIndex = headingElements[0].idx
      }

      setActiveIdx(activeIndex)
    }

    handleScroll()
    container.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      container.removeEventListener("scroll", handleScroll)
      observerRef.current?.disconnect()
    }
  }, [headings, editor])

  // Click handler — scroll to heading or bookmark
  const handleClick = useCallback(
    (heading: TocNavItem) => {
      try {
        const domNode = editor.view.nodeDOM(heading.pos) as HTMLElement | null
        if (domNode) {
          domNode.scrollIntoView({ behavior: "smooth", block: "start" })
          // Also set cursor there
          editor.commands.setTextSelection(heading.pos + 1)
        }
      } catch {
        // pos might be stale
      }
    },
    [editor]
  )

  // Don't render if fewer than 2 items
  if (headings.length < 2) return null

  return (
    <div
      className="floating-toc"
      style={{ opacity: isFocused ? 0.3 : 1 }}
    >
      <div className="floating-toc-inner">
        {headings.map((h, idx) => {
          const pinnedEntry = h.type === "bookmark" && selectedNoteId
            ? Object.values(globalBookmarks as Record<string, GlobalBookmark>).find(
                (bm) => bm.noteId === selectedNoteId && bm.anchorId === h.id
              )
            : null
          const isPinned = !!pinnedEntry

          return (
            <div
              key={h.id}
              className="floating-toc-item-wrap group"
              style={{ position: "relative", display: "flex", alignItems: "center" }}
            >
              <button
                type="button"
                className="floating-toc-item"
                data-active={idx === activeIdx ? "true" : "false"}
                onClick={() => handleClick(h)}
                title={h.text || "Untitled"}
                style={{ flex: 1 }}
              >
                {h.type === "bookmark" ? (
                  <MapPin size={10} className="floating-toc-bookmark-icon" style={{ flexShrink: 0 }} />
                ) : (
                  <span
                    className="floating-toc-dash"
                    style={{ width: dashWidth(h.level) }}
                  />
                )}
                <span
                  className="floating-toc-label"
                  style={{ paddingLeft: h.type === "bookmark" ? 0 : indentPx(h.level) }}
                >
                  {h.text || "Untitled"}
                </span>
              </button>
              {h.type === "bookmark" && selectedNoteId && (
                <button
                  type="button"
                  className="floating-toc-pin-btn"
                  data-pinned={isPinned ? "true" : "false"}
                  title={isPinned ? "Unpin from bookmarks" : "Pin to bookmarks"}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isPinned && pinnedEntry) {
                      unpinBookmark(pinnedEntry.id)
                    } else {
                      pinBookmark(selectedNoteId, h.id, h.text || "Bookmark", "inline")
                    }
                  }}
                >
                  <PushPin size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
