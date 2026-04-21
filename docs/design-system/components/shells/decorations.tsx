"use client"

interface RibbonProps {
  color: string
  position?: "top" | "left" | "right"
}

export function Ribbon({ color, position = "right" }: RibbonProps) {
  if (position === "top") {
    return (
      <div
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 24,
          height: 60,
          background: color,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: `12px solid ${color}`,
          }}
        />
      </div>
    )
  }

  // Right position (default)
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        right: -12,
        width: 24,
        height: 120,
        background: color,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        zIndex: 10,
        pointerEvents: "none",
        borderRadius: "0 0 2px 2px",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -12,
          left: 0,
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: `12px solid ${color}`,
        }}
      />
    </div>
  )
}

interface CornerOrnamentProps {
  glyph?: string
}

export function CornerOrnament({ glyph = "\u2766" }: CornerOrnamentProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        fontSize: 24,
        opacity: 0.3,
        pointerEvents: "none",
        fontFamily: "Georgia, serif",
      }}
    >
      {glyph}
    </div>
  )
}

interface BookmarkProps {
  label: string
  color: string
}

export function Bookmark({ label, color }: BookmarkProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        right: 0,
        background: color,
        color: "#fff",
        padding: "6px 12px 6px 16px",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 600,
        boxShadow: "-2px 2px 4px rgba(0,0,0,0.2)",
        zIndex: 10,
        pointerEvents: "none",
        clipPath: "polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)",
      }}
    >
      {label}
    </div>
  )
}
