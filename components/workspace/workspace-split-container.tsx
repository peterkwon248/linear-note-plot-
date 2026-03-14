"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { WorkspaceBranch } from "@/lib/workspace/types"
import { WorkspaceRenderer } from "./workspace-renderer"

interface WorkspaceSplitContainerProps {
  branch: WorkspaceBranch
}

export function WorkspaceSplitContainer({ branch }: WorkspaceSplitContainerProps) {
  const setBranchRatio = usePlotStore((s) => s.setBranchRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isHorizontal = branch.direction === "horizontal"

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = isHorizontal
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height
      setBranchRatio(branch.id, ratio)
    }

    const handleMouseUp = () => setIsDragging(false)

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
  }, [isDragging, isHorizontal, branch.id, setBranchRatio])

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
      >
        <div
          className={cn(
            "absolute transition-colors z-10",
            isHorizontal
              ? "inset-y-0 -left-px w-[3px]"
              : "inset-x-0 -top-px h-[3px]",
            isDragging
              ? "bg-primary"
              : "bg-transparent group-hover:bg-primary/50"
          )}
        />
      </div>

      {/* Second child */}
      <div
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
