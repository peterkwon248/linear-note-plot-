"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { EditorPanelContainer } from "./editor-panel-container"
import type { EditorState, EditorPanel } from "@/lib/store/types"

function ResizeDivider({
  isDragging,
  onMouseDown,
}: {
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className="group relative flex w-0 cursor-col-resize items-center justify-center"
      onMouseDown={onMouseDown}
    >
      <div
        className={cn(
          "absolute inset-y-0 -left-px w-[3px] transition-colors",
          isDragging ? "bg-primary" : "bg-transparent group-hover:bg-primary/50"
        )}
      />
    </div>
  )
}

export function EditorSplitView() {
  const editorState = usePlotStore((s) => s.editorState) as EditorState
  const setActivePanel = usePlotStore((s) => s.setActivePanel)
  const setSplitRatio = usePlotStore((s) => s.setSplitRatio)
  const setPanelRatios = usePlotStore((s) => s.setPanelRatios)
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingDivider, setDraggingDivider] = useState<number | null>(null)

  const handleMouseDown = useCallback((dividerIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingDivider(dividerIndex)
  }, [])

  useEffect(() => {
    if (draggingDivider === null) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width

      const panels = editorState.panels
      if (panels.length === 2) {
        // 2-panel: use splitRatio for backward compat
        setSplitRatio(ratio)
      } else if (panels.length === 3) {
        // 3-panel: adjust panelRatios
        const ratios = [...(editorState.panelRatios ?? [0.33, 0.33, 0.34])]
        if (draggingDivider === 0) {
          // Dragging divider between panel 0 and 1
          const newFirst = Math.max(0.15, Math.min(0.7, ratio))
          const totalRemaining = ratios[1] + ratios[2]
          const secondRatio = totalRemaining > 0
            ? (ratios[1] / totalRemaining) * (1 - newFirst)
            : (1 - newFirst) / 2
          ratios[0] = newFirst
          ratios[1] = secondRatio
          ratios[2] = 1 - newFirst - secondRatio
        } else {
          // Dragging divider between panel 1 and 2
          const boundary = ratios[0] + ratios[1]
          const newBoundary = Math.max(ratios[0] + 0.15, Math.min(0.85, ratio))
          ratios[1] = newBoundary - ratios[0]
          ratios[2] = 1 - newBoundary
        }
        setPanelRatios(ratios)
      }
    }

    const handleMouseUp = () => {
      setDraggingDivider(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingDivider, editorState.panels, editorState.panelRatios, setSplitRatio, setPanelRatios])

  const activePanels = editorState.panels

  if (activePanels.length === 0) return null

  // Single panel mode
  if (!editorState.splitMode || activePanels.length === 1) {
    const panel = activePanels[0]
    return (
      <div className="flex flex-1 overflow-hidden">
        <EditorPanelContainer
          panel={panel}
          isActivePanel={editorState.activePanelId === panel.id}
          onActivatePanel={() => setActivePanel(panel.id)}
        />
      </div>
    )
  }

  // Multi-panel mode (2 or 3 panels)
  const panelWidths = activePanels.length === 2
    ? [editorState.splitRatio, 1 - editorState.splitRatio]
    : editorState.panelRatios ?? activePanels.map(() => 1 / activePanels.length)

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-hidden"
      style={{ cursor: draggingDivider !== null ? "col-resize" : undefined }}
    >
      {activePanels.map((panel: EditorPanel, index: number) => (
        <div key={panel.id} className="contents">
          {/* Panel */}
          <div
            className="flex overflow-hidden"
            style={{ width: `${(panelWidths[index] ?? (1 / activePanels.length)) * 100}%` }}
          >
            <EditorPanelContainer
              panel={panel}
              isActivePanel={editorState.activePanelId === panel.id}
              onActivatePanel={() => setActivePanel(panel.id)}
            />
          </div>

          {/* Divider (between panels, not after last) */}
          {index < activePanels.length - 1 && (
            <ResizeDivider
              isDragging={draggingDivider === index}
              onMouseDown={handleMouseDown(index)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
