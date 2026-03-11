"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { EditorPanelContainer } from "./editor-panel-container"
import type { EditorState } from "@/lib/store/types"

export function EditorSplitView() {
  const editorState = usePlotStore((s) => s.editorState) as EditorState
  const setActivePanel = usePlotStore((s) => s.setActivePanel)
  const setSplitRatio = usePlotStore((s) => s.setSplitRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(ratio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, setSplitRatio])

  const leftPanel = editorState.panels.find((p) => p.id === "panel-left")
  const rightPanel = editorState.panels.find((p) => p.id === "panel-right")

  if (!leftPanel) return null

  // Single panel mode
  if (!editorState.splitMode || !rightPanel) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <EditorPanelContainer
          panel={leftPanel}
          isActivePanel={editorState.activePanelId === "panel-left"}
          onActivatePanel={() => setActivePanel("panel-left")}
        />
      </div>
    )
  }

  // Split mode
  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
      style={{ cursor: isDragging ? "col-resize" : undefined }}
    >
      {/* Left Panel */}
      <div
        className="flex overflow-hidden"
        style={{ width: `${editorState.splitRatio * 100}%` }}
      >
        <EditorPanelContainer
          panel={leftPanel}
          isActivePanel={editorState.activePanelId === "panel-left"}
          onActivatePanel={() => setActivePanel("panel-left")}
        />
      </div>

      {/* Resize Divider */}
      <div
        className="group relative flex w-0 cursor-col-resize items-center justify-center"
        onMouseDown={handleMouseDown}
      >
        <div className={cn(
          "absolute inset-y-0 -left-px w-[3px] transition-colors",
          isDragging ? "bg-primary" : "bg-transparent group-hover:bg-primary/50"
        )} />
      </div>

      {/* Right Panel */}
      <div
        className="flex overflow-hidden"
        style={{ width: `${(1 - editorState.splitRatio) * 100}%` }}
      >
        <EditorPanelContainer
          panel={rightPanel}
          isActivePanel={editorState.activePanelId === "panel-right"}
          onActivatePanel={() => setActivePanel("panel-right")}
        />
      </div>
    </div>
  )
}
