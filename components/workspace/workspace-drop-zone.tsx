"use client"

import { useState, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import type { DropZone, PanelContent } from "@/lib/workspace/types"
import {
  hasLeafDragData,
  hasViewDragData,
  hasNoteDragData,
  hasTabDragData,
  getLeafDragData,
  getViewDragData,
  getNoteDragData,
  getTabDragData,
} from "@/lib/drag-helpers"

interface WorkspaceDropZoneProps {
  leafId: string
  children: React.ReactNode
}

/** Simplified 3-zone detection: left / right / center
 *  x < 0.35 → left, x > 0.65 → right, else → center */
function detectZone(e: React.DragEvent, rect: DOMRect): DropZone {
  const x = (e.clientX - rect.left) / rect.width
  if (x < 0.35) return "left"
  if (x > 0.65) return "right"
  return "center"
}

export function WorkspaceDropZone({ leafId, children }: WorkspaceDropZoneProps) {
  const moveLeaf = usePlotStore((s) => s.moveLeaf)
  const splitLeaf = usePlotStore((s) => s.splitLeaf)
  const setLeafContent = usePlotStore((s) => s.setLeafContent)
  const openNoteInLeaf = usePlotStore((s) => s.openNoteInLeaf)
  const moveTabToLeaf = usePlotStore((s) => s.moveTabToLeaf)
  const splitTabToNewLeaf = usePlotStore((s) => s.splitTabToNewLeaf)

  const [activeZone, setActiveZone] = useState<DropZone | null>(null)
  const activeZoneRef = useRef<DropZone | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!hasLeafDragData(e) && !hasViewDragData(e) && !hasNoteDragData(e) && !hasTabDragData(e)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const zone = detectZone(e, rect)

    // Only update state when zone actually changes — avoid 60fps setState
    if (zone !== activeZoneRef.current) {
      activeZoneRef.current = zone
      setActiveZone(zone)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      activeZoneRef.current = null
      setActiveZone(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const zone = activeZoneRef.current ?? "center"
    setActiveZone(null)
    activeZoneRef.current = null

    // 1. Leaf drag — rearrange panels
    const sourceLeafId = getLeafDragData(e)
    if (sourceLeafId && sourceLeafId !== leafId) {
      moveLeaf(sourceLeafId, leafId, zone)
      return
    }

    // 2. Tab drag — move to leaf (center) or split (edge)
    const tabData = getTabDragData(e)
    if (tabData) {
      if (zone === "center" && tabData.panelId !== leafId) {
        moveTabToLeaf(tabData.tabId, tabData.panelId, leafId)
      } else if (zone !== "center") {
        const direction = (zone === "left" || zone === "right") ? "horizontal" : "vertical"
        const position = (zone === "left" || zone === "top") ? "before" : "after"
        splitTabToNewLeaf(tabData.tabId, tabData.panelId, leafId, direction, position)
      }
      return
    }

    // 3. View drag — set or split with new content
    const viewData = getViewDragData(e)
    if (viewData && viewData.type) {
      const content = viewData as unknown as PanelContent
      if (zone === "center") {
        setLeafContent(leafId, content)
      } else {
        const direction = (zone === "left" || zone === "right") ? "horizontal" : "vertical"
        const position = (zone === "left" || zone === "top") ? "before" : "after"
        splitLeaf(leafId, direction, content, position)
      }
      return
    }

    // 4. Note drag — open note in this leaf
    const noteId = getNoteDragData(e)
    if (noteId) {
      if (zone === "center") {
        openNoteInLeaf(noteId, leafId)
      } else {
        const direction = (zone === "left" || zone === "right") ? "horizontal" : "vertical"
        const position = (zone === "left" || zone === "top") ? "before" : "after"
        splitLeaf(leafId, direction, { type: "editor", noteId }, position)
      }
      return
    }
  }, [leafId, moveLeaf, moveTabToLeaf, splitTabToNewLeaf, splitLeaf, setLeafContent, openNoteInLeaf])

  return (
    <div
      ref={ref}
      className="relative flex flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop zone overlay */}
      {activeZone && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {activeZone === "left" && (
            <>
              {/* Left half highlight */}
              <div className="absolute inset-y-0 left-0 w-[35%] rounded-l bg-primary/10 ring-1 ring-inset ring-primary/40" />
              {/* Dashed split-point preview line */}
              <div className="absolute inset-y-2 left-[35%] w-px border-l-2 border-dashed border-primary/60" />
            </>
          )}
          {activeZone === "right" && (
            <>
              {/* Dashed split-point preview line */}
              <div className="absolute inset-y-2 left-[65%] w-px border-l-2 border-dashed border-primary/60" />
              {/* Right half highlight */}
              <div className="absolute inset-y-0 right-0 w-[35%] rounded-r bg-primary/10 ring-1 ring-inset ring-primary/40" />
            </>
          )}
          {activeZone === "center" && (
            <div className="absolute inset-2 rounded-lg bg-primary/8 ring-2 ring-primary/30" />
          )}
        </div>
      )}
    </div>
  )
}
