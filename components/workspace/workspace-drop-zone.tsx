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

/** Detect which of the 5 zones the cursor is in.
 *  Center = 40%, edges = 20% each (top/bottom/left/right) */
function detectZone(
  e: React.DragEvent,
  rect: DOMRect,
): DropZone {
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  // Edges take priority when cursor is clearly in the margin
  if (y < 0.2) return "top"
  if (y > 0.8) return "bottom"
  if (x < 0.2) return "left"
  if (x > 0.8) return "right"

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
    setActiveZone(zone)
    activeZoneRef.current = zone
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      setActiveZone(null)
      activeZoneRef.current = null
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
        // Center drop: move tab to existing leaf
        moveTabToLeaf(tabData.tabId, tabData.panelId, leafId)
      } else if (zone !== "center") {
        // Edge drop: split tab into new leaf
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
          {/* Top */}
          <div className={cn(
            "absolute left-0 right-0 top-0 h-[20%] rounded-t border-2 transition-colors",
            activeZone === "top" ? "border-primary bg-primary/10" : "border-transparent"
          )} />
          {/* Bottom */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 h-[20%] rounded-b border-2 transition-colors",
            activeZone === "bottom" ? "border-primary bg-primary/10" : "border-transparent"
          )} />
          {/* Left */}
          <div className={cn(
            "absolute bottom-[20%] left-0 top-[20%] w-[20%] rounded-l border-2 transition-colors",
            activeZone === "left" ? "border-primary bg-primary/10" : "border-transparent"
          )} />
          {/* Right */}
          <div className={cn(
            "absolute bottom-[20%] right-0 top-[20%] w-[20%] rounded-r border-2 transition-colors",
            activeZone === "right" ? "border-primary bg-primary/10" : "border-transparent"
          )} />
          {/* Center */}
          <div className={cn(
            "absolute bottom-[20%] left-[20%] right-[20%] top-[20%] rounded border-2 transition-colors",
            activeZone === "center" ? "border-primary bg-primary/10" : "border-transparent"
          )} />
        </div>
      )}
    </div>
  )
}
