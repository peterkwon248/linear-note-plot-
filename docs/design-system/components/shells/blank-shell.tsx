"use client"

import type { Shell, ThemeConfig } from "@/lib/types"

interface BlankShellProps {
  shell: Shell
  theme: ThemeConfig
}

export function BlankShell({ shell, theme }: BlankShellProps) {
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${48 * marginScale}px`

  return (
    <div
      style={{
        maxWidth: shell.maxWidth,
        margin: "0 auto",
        padding: pad,
        fontFamily: shell.bodyFont,
        color: shell.fg,
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 16,
          minHeight: 400,
        }}
      >
        {/* Example grid visualization */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--hover-bg)",
              borderRadius: 4,
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "var(--muted-foreground)",
              border: "1px dashed var(--border-subtle)",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 48,
          color: "var(--muted-foreground)",
          fontSize: 14,
        }}
      >
        <p style={{ marginBottom: 8 }}>Blank shell &mdash; 12-column grid, no chrome</p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Press <kbd style={{ 
            fontFamily: "var(--font-mono)", 
            fontSize: 11, 
            background: "var(--card)", 
            border: "1px solid var(--border)", 
            borderRadius: 4, 
            padding: "1px 6px" 
          }}>/</kbd> in the Grid Editor to add blocks
        </p>
      </div>
    </div>
  )
}
