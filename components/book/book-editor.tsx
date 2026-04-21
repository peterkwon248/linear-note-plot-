"use client"

import { useState, useEffect } from "react"
import type { ShellId, ThemeConfig, DecorationConfig, Book } from "@/lib/book/types"
import { SHELLS, TEXTURES, resolveShell } from "@/lib/book/shells"
import { WikiShell } from "./shells/wiki-shell"
import { MagazineShell } from "./shells/magazine-shell"
import { NewspaperShell } from "./shells/newspaper-shell"
import { BookShell } from "./shells/book-shell"
import { BlankShell } from "./shells/blank-shell"
import { Ribbon, CornerOrnament, Bookmark } from "./shells/decorations"
import { FlipbookViewer, SAMPLE_PAGES } from "./flipbook/flipbook-viewer"

type RenderMode = "scroll" | "flipbook"

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

export interface BookDisplayState {
  shell: ShellId
  renderMode: RenderMode
  theme: ThemeConfig
  decor: DecorationConfig
}

interface BookEditorProps {
  /** Optional real Book loaded from wikiArticles. When omitted, shells render SAMPLE_CONTENT. */
  book?: Book
  /** Edit mode — when true, inline editors + block chrome show. Default read-only. */
  editing?: boolean
  /** Controlled display state (shell/renderMode/theme/decor). When omitted, internal state is used. */
  displayState?: BookDisplayState
  onDisplayStateChange?: (patch: Partial<BookDisplayState>) => void
}

export function BookEditor({ book, editing = false, displayState, onDisplayStateChange }: BookEditorProps = {}) {
  const [internalShell, setInternalShell] = useState<ShellId>("magazine")
  const [internalRenderMode, setInternalRenderMode] = useState<RenderMode>("scroll")
  const [showCover, setShowCover] = useState(true)
  const [internalTheme, setInternalTheme] = useState<ThemeConfig>(defaultTheme)
  const [internalDecor, setInternalDecor] = useState<DecorationConfig>(defaultDecor)

  const shell = displayState?.shell ?? internalShell
  const renderMode = displayState?.renderMode ?? internalRenderMode
  const theme = displayState?.theme ?? internalTheme
  const decor = displayState?.decor ?? internalDecor

  const setShell = (v: ShellId) => {
    if (onDisplayStateChange) onDisplayStateChange({ shell: v })
    else setInternalShell(v)
    setShowCover(true)
  }
  const setRenderMode = (v: RenderMode) => {
    if (onDisplayStateChange) onDisplayStateChange({ renderMode: v })
    else setInternalRenderMode(v)
  }
  // When controlled, theme/decor setters are proxies; otherwise internal.
  // (BookEditor internals may still call these via TweakPanel during Step 1 transition;
  //  Step 3 removes TweakPanel entirely.)

  // Persist to localStorage (only when uncontrolled — parent owns persistence otherwise)
  useEffect(() => {
    if (displayState) return
    const saved = localStorage.getItem("plot.book.theme")
    if (saved) setInternalTheme(JSON.parse(saved))
    const savedShell = localStorage.getItem("plot.book.shell")
    if (savedShell) setInternalShell(savedShell as ShellId)
    const savedRenderMode = localStorage.getItem("plot.book.renderMode")
    if (savedRenderMode) setInternalRenderMode(savedRenderMode as RenderMode)
  }, [displayState])

  useEffect(() => {
    if (displayState) return
    localStorage.setItem("plot.book.theme", JSON.stringify(internalTheme))
  }, [internalTheme, displayState])

  useEffect(() => {
    if (displayState) return
    localStorage.setItem("plot.book.shell", internalShell)
  }, [internalShell, displayState])

  useEffect(() => {
    if (displayState) return
    localStorage.setItem("plot.book.renderMode", internalRenderMode)
  }, [internalRenderMode, displayState])

  // Flipbook render mode — replaces the scroll layout with a page-turning viewer.
  if (renderMode === "flipbook") {
    return (
      <div style={{ minHeight: "100vh", background: "#1a1612" }}>
        <div style={{ position: "fixed", top: 14, left: 14, zIndex: 50 }}>
          <button
            onClick={() => setRenderMode("scroll")}
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

  // Scroll render mode
  const S = SHELLS[shell]
  const resolvedShell = resolveShell(S, theme)
  const bg = theme.bgColor || S.bg
  const tex = theme.texture || S.texture || "none"

  const renderShell = () => {
    switch (shell) {
      case "wiki":
        return <WikiShell shell={resolvedShell} theme={theme} book={book} editing={editing} />
      case "magazine":
        return <MagazineShell shell={resolvedShell} theme={theme} book={book} editing={editing} />
      case "newspaper":
        return <NewspaperShell shell={resolvedShell} theme={theme} book={book} editing={editing} />
      case "book":
        return (
          <BookShell
            shell={resolvedShell}
            theme={theme}
            showCover={showCover}
            setShowCover={setShowCover}
            book={book}
            editing={editing}
          />
        )
      case "blank":
        return <BlankShell shell={resolvedShell} theme={theme} book={book} editing={editing} />
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "var(--font-sans)" }}>
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
              onClick={() => setRenderMode("flipbook")}
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
    </div>
  )
}
