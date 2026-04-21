"use client"

import type { ShellId, ThemeConfig, DecorationConfig } from "@/lib/book/types"
import { SHELLS } from "@/lib/book/shells"

interface TweakPanelProps {
  theme: ThemeConfig
  setTheme: (theme: ThemeConfig) => void
  decor: DecorationConfig
  setDecor: (decor: DecorationConfig) => void
  shell: ShellId
  setShell: (shell: ShellId) => void
}

export function TweakPanel({ theme, setTheme, decor, setDecor, shell, setShell }: TweakPanelProps) {
  const sectionTitle: React.CSSProperties = {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--muted-foreground)",
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 70,
        right: 16,
        width: 260,
        background: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 14,
        fontSize: 13,
        boxShadow: "var(--shadow-lg)",
        zIndex: 50,
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {/* Shell */}
      <div style={sectionTitle}>Shell</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {(Object.values(SHELLS) as typeof SHELLS[ShellId][]).map((s) => (
          <button
            key={s.id}
            onClick={() => setShell(s.id)}
            style={{
              padding: "8px 10px",
              border: shell === s.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: 6,
              background: shell === s.id ? "rgba(99,102,241,0.08)" : "var(--background)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              color: "var(--foreground)",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Background */}
      <div style={sectionTitle}>Background</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <input
          type="color"
          value={theme.bgColor || "#141417"}
          onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })}
          style={{
            width: 32,
            height: 24,
            border: "1px solid var(--border)",
            borderRadius: 4,
            background: "none",
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Color</span>
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
        {(["none", "paper", "newsprint", "dots", "linen"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme({ ...theme, texture: t })}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              border: theme.texture === t ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--background)",
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Card border */}
      <div style={sectionTitle}>Card border</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
        {(["none", "hairline", "subtle", "strong"] as const).map((b) => (
          <button
            key={b}
            onClick={() =>
              setTheme({
                ...theme,
                cardBorder:
                  b === "none"
                    ? "none"
                    : b === "hairline"
                      ? "1px solid rgba(0,0,0,0.15)"
                      : b === "subtle"
                        ? "1px solid var(--border-subtle)"
                        : "2px solid var(--foreground)",
              })
            }
            style={{
              padding: "3px 8px",
              fontSize: 11,
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--background)",
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Typography */}
      <div style={sectionTitle}>Typography</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
        {[
          { id: "default", label: "Default", display: "Playfair", body: "Merriweather" },
          { id: "classic", label: "Classic", display: "Garamond", body: "Garamond" },
          { id: "modern", label: "Modern", display: "Geist", body: "Geist" },
          { id: "editorial", label: "Editorial", display: "Playfair", body: "Geist" },
          { id: "bauhaus", label: "Bauhaus", display: "Geist Mono", body: "Geist" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setTheme({ ...theme, fontPair: f.id as ThemeConfig["fontPair"] })}
            style={{
              padding: "6px 8px",
              fontSize: 11,
              textAlign: "left",
              border: theme.fontPair === f.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: theme.fontPair === f.id ? "rgba(99,102,241,0.08)" : "var(--background)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
              lineHeight: 1.3,
            }}
          >
            <div style={{ fontWeight: 600 }}>{f.label}</div>
            <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              {f.display} / {f.body}
            </div>
          </button>
        ))}
      </div>

      {/* Ink colors */}
      <div style={sectionTitle}>Ink colors</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={theme.textColor || "#fafafa"}
            onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
            style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Body text</span>
          {theme.textColor && (
            <button
              onClick={() => setTheme({ ...theme, textColor: "" })}
              style={{
                border: 0,
                background: "none",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--muted-foreground)",
              }}
            >
              reset
            </button>
          )}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={theme.accentColor || "#6366f1"}
            onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
            style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Accent</span>
          {theme.accentColor && (
            <button
              onClick={() => setTheme({ ...theme, accentColor: "" })}
              style={{
                border: 0,
                background: "none",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--muted-foreground)",
              }}
            >
              reset
            </button>
          )}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="color"
            value={theme.quoteColor || "#9b1c1c"}
            onChange={(e) => setTheme({ ...theme, quoteColor: e.target.value })}
            style={{ width: 28, height: 22, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>Pull quote</span>
          {theme.quoteColor && (
            <button
              onClick={() => setTheme({ ...theme, quoteColor: "" })}
              style={{
                border: 0,
                background: "none",
                cursor: "pointer",
                fontSize: 10,
                color: "var(--muted-foreground)",
              }}
            >
              reset
            </button>
          )}
        </label>
      </div>

      {/* Columns */}
      <div style={sectionTitle}>Columns</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[
          { v: 0, l: "Auto" },
          { v: 1, l: "1" },
          { v: 2, l: "2" },
          { v: 3, l: "3" },
          { v: 6, l: "6" },
        ].map((c) => (
          <button
            key={c.v}
            onClick={() => setTheme({ ...theme, cols: c.v })}
            style={{
              flex: 1,
              padding: "5px 0",
              fontSize: 11,
              border: theme.cols === c.v ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: theme.cols === c.v ? "rgba(99,102,241,0.08)" : "var(--background)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {c.l}
          </button>
        ))}
      </div>

      {/* Margins */}
      <div style={sectionTitle}>Margins</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["narrow", "standard", "wide"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTheme({ ...theme, margins: m })}
            style={{
              flex: 1,
              padding: "5px 0",
              fontSize: 11,
              border: theme.margins === m ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: theme.margins === m ? "rgba(99,102,241,0.08)" : "var(--background)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Chapter breaks */}
      <div style={sectionTitle}>Chapter breaks</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14 }}>
        {[
          { id: "default", label: "Default" },
          { id: "roman", label: "I \xb7 II \xb7 III" },
          { id: "numeric", label: "01 \xb7 02 \xb7 03" },
          { id: "ornament", label: "\u2766 ornament" },
          { id: "rule", label: "\u2014\u2014 rule \u2014\u2014" },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setTheme({ ...theme, chapterStyle: c.id as ThemeConfig["chapterStyle"] })}
            style={{
              padding: "5px 8px",
              fontSize: 11,
              textAlign: "left",
              border: theme.chapterStyle === c.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: theme.chapterStyle === c.id ? "rgba(99,102,241,0.08)" : "var(--background)",
              borderRadius: 4,
              cursor: "pointer",
              color: "var(--foreground)",
              fontFamily: "inherit",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Decoration */}
      <div style={sectionTitle}>Decoration</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={decor.ribbon}
          onChange={(e) => setDecor({ ...decor, ribbon: e.target.checked })}
        />
        <span>Ribbon</span>
        <input
          type="color"
          value={decor.ribbonColor}
          onChange={(e) => setDecor({ ...decor, ribbonColor: e.target.value })}
          style={{
            width: 24,
            height: 20,
            border: "1px solid var(--border)",
            borderRadius: 4,
            cursor: "pointer",
            marginLeft: "auto",
          }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={decor.bookmark}
          onChange={(e) => setDecor({ ...decor, bookmark: e.target.checked })}
        />
        <span>Bookmark tab</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={decor.ornament}
          onChange={(e) => setDecor({ ...decor, ornament: e.target.checked })}
        />
        <span>Corner ornament</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <input
          type="checkbox"
          checked={decor.flipbook}
          onChange={(e) => setDecor({ ...decor, flipbook: e.target.checked })}
        />
        <span>Flipbook preview</span>
      </label>
    </div>
  )
}
