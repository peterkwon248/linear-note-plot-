"use client"

import type { Shell, ThemeConfig } from "@/lib/types"
import { SAMPLE_CONTENT } from "@/lib/shells"
import { ChapterDivider } from "./chapter-divider"

interface MagazineShellProps {
  shell: Shell
  theme: ThemeConfig
}

export function MagazineShell({ shell, theme }: MagazineShellProps) {
  const c = SAMPLE_CONTENT.magazine
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${48 * marginScale}px ${56 * marginScale}px`
  const bodyCols = shell.cols > 0 ? shell.cols : 2
  const quoteColor = theme.quoteColor || "#9b1c1c"

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
      {/* Masthead */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: "3px double #1a1a1a",
          paddingBottom: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: shell.displayFont,
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.02em",
          }}
        >
          {c.masthead.brand}
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: shell.bodyFont,
            color: "#555",
          }}
        >
          {c.masthead.issue} &middot; {c.masthead.date}
        </div>
      </div>

      {/* Nameplate */}
      <div
        style={{
          textAlign: "center",
          padding: "14px 0 28px",
          borderBottom: "1px solid rgba(0,0,0,0.2)",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontStyle: "italic",
            color: "#666",
          }}
        >
          &mdash; {c.nameplate} &mdash;
        </div>
      </div>

      {/* Headline trio */}
      <h1
        style={{
          fontFamily: shell.displayFont,
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 0.98,
          margin: "0 0 20px",
          maxWidth: "88%",
        }}
      >
        {c.headline}
      </h1>
      <p
        style={{
          fontFamily: shell.displayFont,
          fontSize: 22,
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1.35,
          color: "#333",
          margin: "0 0 24px",
          maxWidth: "70%",
        }}
      >
        {c.deck}
      </p>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#666",
          marginBottom: 40,
          fontFamily: shell.bodyFont,
        }}
      >
        {c.byline}
      </div>

      {/* Hero image */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "linear-gradient(135deg, #c9b28a 0%, #8b7355 40%, #3a2e24 100%)",
          marginBottom: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 14,
            color: "rgba(255,255,255,0.9)",
            fontSize: 11,
            fontStyle: "italic",
          }}
        >
          Archive &middot; A reader at the British Library, 1962
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          fontStyle: "italic",
          color: "#666",
          marginBottom: 32,
          textAlign: "right",
        }}
      >
        Photography &mdash; archive
      </div>

      {/* Body columns */}
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
        {c.body.map((b, i) => {
          if (b.type === "dropcap-p") {
            const first = b.text[0]
            const rest = b.text.slice(1)
            return (
              <p key={i} style={{ margin: "0 0 14px", breakInside: "avoid-column" }}>
                <span
                  style={{
                    fontFamily: shell.displayFont,
                    fontSize: 72,
                    fontWeight: 900,
                    float: "left",
                    lineHeight: 0.85,
                    marginRight: 8,
                    marginTop: 4,
                    color: shell.fg,
                  }}
                >
                  {first}
                </span>
                {rest}
              </p>
            )
          }
          if (b.type === "pullquote")
            return (
              <div
                key={i}
                style={{
                  columnSpan: "all",
                  borderTop: `2px solid ${quoteColor}`,
                  borderBottom: `2px solid ${quoteColor}`,
                  padding: "18px 0",
                  margin: "18px 0",
                  fontFamily: shell.displayFont,
                  fontStyle: "italic",
                  fontSize: 28,
                  lineHeight: 1.25,
                  textAlign: "center",
                  fontWeight: 400,
                  color: quoteColor,
                }}
              >
                &ldquo;{b.text}&rdquo;
              </div>
            )
          if (b.type === "h2")
            return (
              <div key={i}>
                {theme.chapterStyle !== "default" && (
                  <div style={{ columnSpan: "all", color: shell.fg }}>
                    <ChapterDivider
                      style={theme.chapterStyle}
                      displayFont={shell.displayFont}
                      idx={i}
                      label={b.text}
                    />
                  </div>
                )}
                <h2
                  style={{
                    fontFamily: shell.displayFont,
                    fontSize: 24,
                    fontWeight: 700,
                    margin: "14px 0 10px",
                  }}
                >
                  {b.text}
                </h2>
              </div>
            )
          if (b.type === "p")
            return (
              <p key={i} style={{ margin: "0 0 14px" }}>
                {b.text}
              </p>
            )
          return null
        })}
      </div>
    </div>
  )
}
