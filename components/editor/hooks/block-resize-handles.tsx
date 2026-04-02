"use client"

/**
 * Render resize handles for block nodes.
 * Includes: 2 edge handles (left/right) + 4 corner handles.
 * Reset button is placed in each block's header for consistency.
 */
export function BlockResizeHandles({
  onResizeStart,
}: {
  onResizeStart: (corner: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right") => (e: React.MouseEvent) => void
}) {
  return (
    <>
      {/* Edge handles */}
      <div className="block-resize-handle block-resize-handle--left" onMouseDown={onResizeStart("left")} />
      <div className="block-resize-handle block-resize-handle--right" onMouseDown={onResizeStart("right")} />
      {/* Corner handles */}
      <div className="block-resize-corner block-resize-corner--tl" onMouseDown={onResizeStart("top-left")} />
      <div className="block-resize-corner block-resize-corner--tr" onMouseDown={onResizeStart("top-right")} />
      <div className="block-resize-corner block-resize-corner--bl" onMouseDown={onResizeStart("bottom-left")} />
      <div className="block-resize-corner block-resize-corner--br" onMouseDown={onResizeStart("bottom-right")} />
    </>
  )
}
