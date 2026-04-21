"use client"

import { useState, useEffect } from "react"
import type { ShellId, ThemeConfig, DecorationConfig } from "@/lib/types"
import { SHELLS, TEXTURES, resolveShell } from "@/lib/shells"
import {
  WikiShell,
  MagazineShell,
  NewspaperShell,
  BookShell,
  BlankShell,
  Ribbon,
  CornerOrnament,
  Bookmark,
} from "@/components/shells"
import { GridEditor } from "@/components/editor"
import { FlipbookViewer, SAMPLE_PAGES } from "@/components/flipbook"
import { TweakPanel } from "./tweak-panel"

type EditorMode = "shells" | "editor" | "flipbook"

const defaultTheme: ThemeConfig = {
  bgColor: "",
  texture: "none",
  cardBorder: "",
  fontPair: "default",
  accentColor: "",
  textColor: "",
  quoteColor: "",
  cols: 0,
  margins: "standard",
  chapterStyle: "default",
}

const defaultDecor: DecorationConfig = {
  ribbon: false,
  ribbonColor: "#9b1c1c",
  bookmark: false,
  ornament: false,
  flipbook: false,
}

export function BookEditor() {
  const [mode, setMode] = useState<EditorMode>("shells")
  const [shell, setShell] = useState<ShellId>("magazine")
  const [showCover, setShowCover] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [decor, setDecor] = useState<DecorationConfig>(defaultDecor)

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("plot.book.theme")
    if (saved) setTheme(JSON.parse(saved))
    const savedShell = localStorage.getItem("plot.book.shell")
    if (savedShell) setShell(savedShell as ShellId)
    const savedMode = localStorage.getItem("plot.book.mode")
    if (savedMode) setMode(savedMode as EditorMode)
  }, [])

  useEffect(() => {
    localStorage.setItem("plot.book.theme", JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem("plot.book.shell", shell)
  }, [shell])

  useEffect(() => {
    localStorage.setItem("plot.book.mode", mode)
  }, [mode])

  // Flipbook mode
  if (mode === "flipbook") {
    return (
      <div style={{ minHeight: "100vh", background: "#1a1612" }}>
        <div style={{ position: "fixed", top: 14, left: 14, zIndex: 50 }}>
          <button
            onClick={() => setMode("shells")}
            style={{
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            &larr; Back
          </button>
        </div>
        <FlipbookViewer pages={SAMPLE_PAGES} shell={SHELLS.book} />
      </div>
    )
  }

  // Editor mode
  if (mode === "editor") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "var(--background)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setMode("shells")}
            style={{
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--background)",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            &larr; Back
          </button>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Grid Editor &mdash; 12-col snap</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Active shell:{" "}
            <b style={{ color: "var(--foreground)" }}>{SHELLS[shell].label}</b>
          </div>
        </div>
        <GridEditor shell={shell} cols={SHELLS[shell].cols === 1 ? 12 : SHELLS[shell].cols} />
      </div>
    )
  }

  // Shells preview mode
  const S = SHELLS[shell]
  const resolvedShell = resolveShell(S, theme)
  const bg = theme.bgColor || S.bg
  const tex = theme.texture || S.texture || "none"

  const renderShell = () => {
    switch (shell) {
      case "wiki":
        return <WikiShell shell={resolvedShell} theme={theme} />
      case "magazine":
        return <MagazineShell shell={resolvedShell} theme={theme} />
      case "newspaper":
        return <NewspaperShell shell={resolvedShell} theme={theme} />
      case "book":
        return (
          <BookShell
            shell={resolvedShell}
            theme={theme}
            showCover={showCover}
            setShowCover={setShowCover}
          />
        )
      case "blank":
        return <BlankShell shell={resolvedShell} theme={theme} />
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-sans)" }}>
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--background)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginRight: 8 }}>Plot Book</div>
        <div style={{ display: "flex", gap: 4 }}>
          {(Object.values(SHELLS) as typeof SHELLS[ShellId][]).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setShell(s.id)
                setShowCover(true)
              }}
              style={{
                padding: "6px 12px",
                height: 30,
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: shell === s.id ? "var(--foreground)" : "var(--background)",
                color: shell === s.id ? "var(--background)" : "var(--foreground)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setMode("editor")}
            style={{
              height: 30,
              padding: "0 12px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Grid Editor &rarr;
          </button>
          <button
            onClick={() => setMode("flipbook")}
            style={{
              height: 30,
              padding: "0 12px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Flipbook &rarr;
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            height: 30,
            padding: "0 12px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--background)",
            color: "var(--foreground)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {panelOpen ? "Hide" : "Show"} Tweaks
        </button>
      </div>

      {/* Subtitle */}
      <div
        style={{
          padding: "10px 16px",
          color: "var(--muted-foreground)",
          fontSize: 12,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {S.subtitle}
      </div>

      {/* Stage */}
      <div
        style={{
          background: bg,
          backgroundImage: TEXTURES[tex] || "none",
          backgroundSize: tex === "dots" ? "14px 14px" : "3px 3px",
          minHeight: "calc(100vh - 80px)",
          position: "relative",
          padding: decor.flipbook ? "40px 20px" : "0",
          transition: "background 0.3s ease",
        }}
      >
        <div
          style={{
            position: "relative",
            ...(decor.flipbook
              ? {
                  maxWidth: S.maxWidth + 80,
                  margin: "0 auto",
                  background: bg,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }
              : {}),
          }}
        >
          {decor.ribbon && <Ribbon color={decor.ribbonColor} position="right" />}
          {decor.ornament && <CornerOrnament glyph="\u2766" />}
          {decor.bookmark && <Bookmark label="Ch. I" color={decor.ribbonColor} />}

          {renderShell()}
        </div>

        {decor.flipbook && (
          <div
            style={{
              position: "fixed",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 11,
              color: "var(--muted-foreground)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <span>Flipbook preview mode</span>
            <button
              onClick={() => setMode("flipbook")}
              style={{
                padding: "4px 10px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Open full flipbook &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Tweak Panel */}
      {panelOpen && (
        <TweakPanel
          theme={theme}
          setTheme={setTheme}
          decor={decor}
          setDecor={setDecor}
          shell={shell}
          setShell={setShell}
        />
      )}
    </div>
  )
}
