"use client"

import { useCallback, useRef, useState } from "react"

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right"

/**
 * Reusable hook for block-level node resizing.
 * - Edge handles (left/right): width only
 * - Corner handles: width + height
 * Height is stored as a fixed value; content overflows with scroll.
 */
export function useBlockResize(
  currentWidth: number | null,
  currentHeight: number | null,
  updateAttributes: (attrs: Record<string, unknown>) => void,
  minWidth = 120,
  minHeight = 60
) {
  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const startWidth = useRef(0)
  const startHeight = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const onResizeStart = useCallback(
    (corner: ResizeCorner) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      startX.current = e.clientX
      startY.current = e.clientY
      startWidth.current = containerRef.current?.offsetWidth ?? currentWidth ?? 400
      startHeight.current = containerRef.current?.offsetHeight ?? currentHeight ?? 200

      const isEdge = corner === "left" || corner === "right"
      const signX = corner.includes("left") ? -1 : 1
      const signY = corner.includes("top") ? -1 : 1

      const onMouseMove = (ev: MouseEvent) => {
        const diffX = (ev.clientX - startX.current) * signX
        const newWidth = Math.max(minWidth, startWidth.current + diffX)

        if (isEdge) {
          // Edge: width only
          updateAttributes({ width: Math.round(newWidth) })
        } else {
          // Corner: width + height
          const diffY = (ev.clientY - startY.current) * signY
          const newHeight = Math.max(minHeight, startHeight.current + diffY)
          updateAttributes({ width: Math.round(newWidth), height: Math.round(newHeight) })
        }
      }

      const onMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [currentWidth, currentHeight, updateAttributes, minWidth, minHeight]
  )

  return { containerRef, isResizing, onResizeStart }
}
