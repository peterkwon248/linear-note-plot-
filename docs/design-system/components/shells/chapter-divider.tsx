"use client"

import type { ChapterStyle } from "@/lib/types"

interface ChapterDividerProps {
  style: ChapterStyle
  displayFont: string
  label?: string
  idx?: number
}

export function ChapterDivider({ style, displayFont, label, idx = 1 }: ChapterDividerProps) {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][idx - 1] || String(idx)
  const num = String(idx).padStart(2, "0")

  const baseStyle = {
    fontFamily: displayFont,
    textAlign: "center" as const,
    margin: "24px 0",
  }

  if (style === "roman") {
    return (
      <div style={{ ...baseStyle, fontSize: 32, fontStyle: "italic", letterSpacing: "0.2em" }}>
        {roman}
      </div>
    )
  }

  if (style === "numeric") {
    return (
      <div
        style={{ ...baseStyle, fontSize: 28, fontWeight: 300, letterSpacing: "0.3em", opacity: 0.6 }}
      >
        {num}
      </div>
    )
  }

  if (style === "ornament") {
    return (
      <div style={{ ...baseStyle, fontSize: 22, letterSpacing: "1em", opacity: 0.5 }}>
        &#x2766;
      </div>
    )
  }

  if (style === "rule") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0" }}>
        <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} />
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 13,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {label || num}
        </div>
        <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.25 }} />
      </div>
    )
  }

  // default
  return (
    <div style={{ ...baseStyle, fontSize: 18, letterSpacing: "0.8em", opacity: 0.5 }}>
      &#x2767;
    </div>
  )
}
