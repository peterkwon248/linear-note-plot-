"use client"

import type { Shell, ThemeConfig, Book } from "@/lib/book/types"

interface BlankShellProps {
  shell: Shell
  theme: ThemeConfig
  /** When a book is loaded, render its blocks as a simple 12-col flow. */
  book?: Book
}

export function BlankShell({ shell, theme, book }: BlankShellProps) {
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
      {book ? (
        <>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
            }}
          >
            {book.title}
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 16,
            }}
          >
            {book.blocks.map((b) => (
              <div
                key={b.id}
                style={{
                  gridColumn: `${b.col} / span ${b.span}`,
                  fontSize: b.type === "heading" ? 20 : 15,
                  fontWeight: b.type === "heading" ? 600 : 400,
                  lineHeight: b.type === "heading" ? 1.3 : 1.65,
                  padding: "6px 0",
                }}
              >
                {b.text}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 16,
              minHeight: 400,
            }}
          >
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
                padding: "1px 6px",
              }}>/</kbd> in the Grid Editor to add blocks
            </p>
          </div>
        </>
      )}
    </div>
  )
}
