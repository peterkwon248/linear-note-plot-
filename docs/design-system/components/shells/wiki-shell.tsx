"use client"

import type { Shell, ThemeConfig } from "@/lib/types"
import { SAMPLE_CONTENT } from "@/lib/shells"
import { ChapterDivider } from "./chapter-divider"

interface WikiShellProps {
  shell: Shell
  theme: ThemeConfig
}

export function WikiShell({ shell, theme }: WikiShellProps) {
  const c = SAMPLE_CONTENT.wiki
  const marginScale = theme.margins === "narrow" ? 0.65 : theme.margins === "wide" ? 1.5 : 1
  const pad = `${40 * marginScale}px ${48 * marginScale}px`

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
      <h1
        style={{
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          marginTop: 0,
          marginBottom: 6,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 10,
        }}
      >
        {c.title}
      </h1>
      <p
        style={{
          fontStyle: "italic",
          color: "var(--muted-foreground)",
          fontSize: 14,
          marginTop: 6,
          marginBottom: 24,
        }}
      >
        {c.hatnote}
      </p>

      {/* Infobox floats right on wide screens */}
      <aside
        style={{
          float: "right",
          width: 280,
          marginLeft: 24,
          marginBottom: 16,
          border: theme.cardBorder || shell.cardBorder,
          borderRadius: shell.cardRadius,
          background: "var(--card)",
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            textAlign: "center",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: 8,
          }}
        >
          {c.infobox.title}
        </div>
        <div
          style={{
            width: "100%",
            aspectRatio: "4/3",
            background: "linear-gradient(135deg, #e8d5b7 0%, #c9a878 50%, #8b6f47 100%)",
            borderRadius: 4,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.8)",
            fontSize: 11,
            fontStyle: "italic",
          }}
        >
          Ebbinghaus forgetting curve
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <tbody>
            {c.infobox.fields.map(([k, v]) => (
              <tr key={k} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td
                  style={{
                    padding: "6px 0",
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    width: "40%",
                    verticalAlign: "top",
                  }}
                >
                  {k}
                </td>
                <td style={{ padding: "6px 0" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>

      {/* ToC */}
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--card)",
          padding: "12px 16px",
          margin: "0 0 20px",
          display: "inline-block",
          minWidth: 260,
          borderRadius: shell.cardRadius,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            marginBottom: 8,
          }}
        >
          Contents
        </div>
        {c.toc.map((r) => (
          <div
            key={r.n}
            style={{
              fontSize: 13,
              padding: "2px 0",
              paddingLeft: (r.n.split(".").length - 1) * 14,
              color: "var(--foreground)",
            }}
          >
            <span style={{ color: "var(--muted-foreground)", marginRight: 6 }}>{r.n}</span>
            {r.t}
          </div>
        ))}
      </div>

      {/* Body (cols override) */}
      <div
        style={{
          fontSize: 15.5,
          lineHeight: 1.7,
          columnCount: shell.cols > 1 ? shell.cols : 1,
          columnGap: 28,
        }}
      >
        {(() => {
          let hc = 0
          return c.body.map((b, i) => {
            if (b.type === "lead")
              return (
                <p key={i} style={{ marginBottom: 16 }}>
                  {b.text}
                </p>
              )
            if (b.type === "h2") {
              hc += 1
              return (
                <div key={i}>
                  {theme.chapterStyle !== "default" && hc > 1 && (
                    <div style={{ color: shell.fg }}>
                      <ChapterDivider
                        style={theme.chapterStyle}
                        displayFont={shell.displayFont}
                        idx={hc}
                        label={b.text}
                      />
                    </div>
                  )}
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: 6,
                      marginTop: 28,
                      marginBottom: 12,
                      breakInside: "avoid",
                    }}
                  >
                    {b.text}
                  </h2>
                </div>
              )
            }
            if (b.type === "p")
              return (
                <p key={i} style={{ marginBottom: 14 }}>
                  {b.text}
                </p>
              )
            return null
          })
        })()}
      </div>

      <div
        style={{
          clear: "both",
          marginTop: 40,
          paddingTop: 14,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            marginBottom: 8,
          }}
        >
          Footnotes
        </div>
        {c.footnotes.map((f, i) => (
          <div key={i} style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  )
}
