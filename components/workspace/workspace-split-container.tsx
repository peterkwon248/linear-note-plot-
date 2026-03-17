"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WorkspaceBranch } from "@/lib/workspace/types"
import { WorkspaceRenderer } from "./workspace-renderer"

interface WorkspaceSplitContainerProps {
  branch: WorkspaceBranch
}

const SNAP_POINTS = [0.25, 0.333, 0.5, 0.667, 0.75]
const SNAP_DEADBAND = 0.02

function snapRatio(ratio: number): { ratio: number; snapped: boolean } {
  for (const point of SNAP_POINTS) {
    if (Math.abs(ratio - point) <= SNAP_DEADBAND) {
      return { ratio: point, snapped: true }
    }
  }
  return { ratio, snapped: false }
}

export function WorkspaceSplitContainer({ branch }: WorkspaceSplitContainerProps) {
  const setBranchRatio = usePlotStore((s) => s.setBranchRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const firstPaneRef = useRef<HTMLDivElement>(null)
  const secondPaneRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const localRatioRef = useRef(branch.ratio)

  const [isDragging, setIsDragging] = useState(false)
  const [isSnapped, setIsSnapped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isHorizontal = branch.direction === "horizontal"

  // Directly mutate DOM during drag — no React state updates
  const applyRatioDirect = useCallback((ratio: number) => {
    if (!firstPaneRef.current || !secondPaneRef.current) return
    const firstPct = `${(ratio * 100).toFixed(4)}%`
    const secondPct = `${((1 - ratio) * 100).toFixed(4)}%`
    if (isHorizontal) {
      firstPaneRef.current.style.width = firstPct
      secondPaneRef.current.style.width = secondPct
    } else {
      firstPaneRef.current.style.height = firstPct
      secondPaneRef.current.style.height = secondPct
    }
  }, [isHorizontal])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    localRatioRef.current = branch.ratio
    setIsDragging(true)
  }, [branch.ratio])

  const handleDoubleClick = useCallback(() => {
    setBranchRatio(branch.id, 0.5)
  }, [branch.id, setBranchRatio])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isDraggingRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const raw = isHorizontal
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height
      const clamped = Math.max(0.1, Math.min(0.9, raw))
      const { ratio, snapped } = snapRatio(clamped)

      localRatioRef.current = ratio

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        applyRatioDirect(ratio)
        setIsSnapped(snapped)
        rafRef.current = null
      })
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      setIsDragging(false)
      setIsSnapped(false)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // Commit final ratio to Zustand only on mouseup
      setBranchRatio(branch.id, localRatioRef.current)
    }

    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isHorizontal, branch.id, setBranchRatio, applyRatioDirect])

  const firstPercent = `${(branch.ratio * 100).toFixed(2)}%`
  const secondPercent = `${((1 - branch.ratio) * 100).toFixed(2)}%`

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-1 overflow-hidden",
        isHorizontal ? "flex-row" : "flex-col"
      )}
    >
      {/* First child */}
      <div
        ref={firstPaneRef}
        className="flex flex-col overflow-hidden"
        style={isHorizontal
          ? { width: firstPercent, minWidth: 120 }
          : { height: firstPercent, minHeight: 80 }
        }
      >
        <WorkspaceRenderer node={branch.children[0]} />
      </div>

      {/* Resize divider */}
      <div
        className={cn(
          "group relative flex shrink-0 items-center justify-center",
          isHorizontal
            ? "w-1 cursor-col-resize"
            : "h-1 cursor-row-resize"
        )}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Visual bar */}
        <div
          className={cn(
            "absolute z-10 transition-all duration-150",
            isHorizontal
              ? "inset-y-0 left-1/2 -translate-x-1/2"
              : "inset-x-0 top-1/2 -translate-y-1/2",
            isDragging && isSnapped
              ? "bg-blue-400"
              : isDragging
              ? "bg-primary"
              : isHovered
              ? "bg-primary/50"
              : "bg-transparent",
          )}
          style={
            isHorizontal
              ? { width: isHovered || isDragging ? 5 : 3 }
              : { height: isHovered || isDragging ? 5 : 3 }
          }
        />
        {/* Invisible 12px wide hit area overlay */}
        <div
          className={cn(
            "absolute z-20",
            isHorizontal
              ? "inset-y-0 left-1/2 -translate-x-1/2 w-3"
              : "inset-x-0 top-1/2 -translate-y-1/2 h-3"
          )}
        />
      </div>

      {/* Second child */}
      <div
        ref={secondPaneRef}
        className="flex flex-col overflow-hidden"
        style={isHorizontal
          ? { width: secondPercent, minWidth: 120 }
          : { height: secondPercent, minHeight: 80 }
        }
      >
        <WorkspaceRenderer node={branch.children[1]} />
      </div>
    </div>
  )
}
