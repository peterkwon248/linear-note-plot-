"use client"

import type { Shell, ThemeConfig, Book } from "@/lib/book/types"
import { SAMPLE_CONTENT } from "@/lib/book/shells"

interface BookShellProps {
  shell: Shell
  theme: ThemeConfig
  showCover: boolean
  setShowCover: (show: boolean) => void
  /** Cover title + chapter body swap to real book; rest (publisher/subtitle/author) stays sample. */
  book?: Book
}

export function BookShell({ shell, theme, showCover, setShowCover, book }: BookShellProps) {
  const c = SAMPLE_CONTENT.book
  const realCoverTitle = book?.title ?? c.cover.title
  const realChapterTitle = book?.title ?? c.chapterTitle
  const realBody = book
    ? book.blocks.map((b, idx) => ({
        type: idx === 0 && b.type === "paragraph" ? "dropcap-p" : "p",
        text: b.text ?? "",
      }))
    : c.body
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const accentColor = theme.accentColor || "#5e6ad2"

  if (showCover) {
    return (
      <div
        style={{
          maxWidth: 520,
          margin: "32px auto",
          padding: "80px 48px 60px",
          fontFamily: shell.bodyFont,
          color: shell.fg,
          background: "#2f1e14",
          minHeight: 680,
          border: "10px solid #1a0f08",
          position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 10,
            border: "1px solid rgba(230,200,140,0.3)",
            pointerEvents: "none",
          }}
        />
        <div style={{ textAlign: "center", color: "#e8d9b8" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: 80,
              opacity: 0.7,
            }}
          >
            {c.cover.publisher}
          </div>
          <h1
            style={{
              fontFamily: shell.displayFont,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              margin: "0 0 18px",
            }}
          >
            {realCoverTitle}
          </h1>
          <div style={{ width: 80, height: 1, background: "#e8d9b8", margin: "0 auto 18px", opacity: 0.5 }} />
          <div
            style={{
              fontFamily: shell.displayFont,
              fontSize: 16,
              fontStyle: "italic",
              fontWeight: 400,
              opacity: 0.85,
              marginBottom: 160,
            }}
          >
            {c.cover.subtitle}
          </div>
          <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.85 }}>
            {c.cover.author}
          </div>
        </div>
        <button
          onClick={() => setShowCover(false)}
          style={{
            position: "absolute",
            bottom: 16,
            right: 20,
            background: "transparent",
            border: "1px solid rgba(232,217,184,0.4)",
            color: "#e8d9b8",
            padding: "6px 12px",
            borderRadius: 4,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: shell.bodyFont,
          }}
        >
          Open &rarr;
        </button>
      </div>
    )
  }

  const pad = `${72 * marginScale}px ${56 * marginScale}px ${96 * marginScale}px`
  const bodyCols = shell.cols > 0 ? shell.cols : 1

  const renderChapterOpener = () => {
    if (theme.chapterStyle === "roman") {
      return (
        <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
          <div
            style={{
              fontFamily: shell.displayFont,
              fontSize: 54,
              fontWeight: 300,
              letterSpacing: "0.25em",
              marginBottom: 18,
            }}
          >
            I
          </div>
          <h2
            style={{
              fontFamily: shell.displayFont,
              fontSize: 22,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.02em",
              margin: 0,
            }}
          >
            {realChapterTitle}
          </h2>
        </div>
      )
    }

    if (theme.chapterStyle === "numeric") {
      return (
        <div
          style={{
            textAlign: "left",
            margin: "20px 0 48px",
            borderLeft: `3px solid ${accentColor}`,
            paddingLeft: 18,
          }}
        >
          <div
            style={{
              fontFamily: shell.displayFont,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.25em",
              color: accentColor,
              marginBottom: 6,
            }}
          >
            CHAPTER 01
          </div>
          <h2
            style={{
              fontFamily: shell.displayFont,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {realChapterTitle}
          </h2>
        </div>
      )
    }

    if (theme.chapterStyle === "ornament") {
      return (
        <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
          <div style={{ fontSize: 32, letterSpacing: "1em", opacity: 0.5, marginBottom: 14 }}>&#x2766;&#x2766;&#x2766;</div>
          <h2
            style={{
              fontFamily: shell.displayFont,
              fontSize: 28,
              fontWeight: 400,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {realChapterTitle}
          </h2>
        </div>
      )
    }

    if (theme.chapterStyle === "rule") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "20px 0 48px" }}>
          <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.3 }} />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: shell.displayFont,
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                opacity: 0.6,
                marginBottom: 4,
              }}
            >
              Chapter One
            </div>
            <div style={{ fontFamily: shell.displayFont, fontSize: 22, fontWeight: 600 }}>{realChapterTitle}</div>
          </div>
          <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.3 }} />
        </div>
      )
    }

    // Default
    return (
      <div style={{ textAlign: "center", margin: "20px 0 48px" }}>
        <div
          style={{
            fontFamily: shell.displayFont,
            fontSize: 80,
            fontWeight: 300,
            letterSpacing: "0.15em",
            lineHeight: 1,
            opacity: 0.15,
            marginBottom: 12,
          }}
        >
          I
        </div>
        <h2
          style={{
            fontFamily: shell.displayFont,
            fontSize: 26,
            fontWeight: 600,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {realChapterTitle}
        </h2>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: shell.maxWidth,
        margin: "0 auto",
        padding: pad,
        fontFamily: shell.bodyFont,
        color: shell.fg,
      }}
    >
      {/* Running header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
          marginBottom: 40,
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: 12,
        }}
      >
        <span>Plot</span>
        <span style={{ fontStyle: "italic", letterSpacing: "0.08em", textTransform: "none" }}>
          {realChapterTitle}
        </span>
      </div>

      {renderChapterOpener()}

      {/* Body */}
      <div
        style={{
          columnCount: bodyCols,
          columnGap: 32,
          fontSize: 15,
          lineHeight: 1.75,
          textAlign: "justify",
          hyphens: "auto",
        }}
      >
        {realBody.map((b, i) => {
          if (b.type === "dropcap-p") {
            const first = b.text[0]
            const rest = b.text.slice(1)
            return (
              <p key={i} style={{ margin: "0 0 14px", textIndent: 0 }}>
                <span
                  style={{
                    fontFamily: shell.displayFont,
                    fontSize: 64,
                    fontWeight: 700,
                    float: "left",
                    lineHeight: 0.82,
                    marginRight: 10,
                    marginTop: 5,
                    color: shell.fg,
                  }}
                >
                  {first}
                </span>
                {rest}
              </p>
            )
          }
          if (b.type === "p") {
            return (
              <p key={i} style={{ margin: "0 0 14px", textIndent: "1.5em" }}>
                {b.text}
              </p>
            )
          }
          return null
        })}
      </div>

      {/* Page number */}
      <div
        style={{
          marginTop: 60,
          textAlign: "center",
          fontSize: 12,
          color: "var(--muted-foreground)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        7
      </div>

      {/* Back to cover button */}
      <button
        onClick={() => setShowCover(true)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          background: "var(--popover)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
          padding: "8px 14px",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        &larr; Cover
      </button>
    </div>
  )
}
