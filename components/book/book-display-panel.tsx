"use client"

// Phase 2C Step 3 — BookDisplayPanel
// Self-contained popover content for the Book space. Renders inside
// ViewHeader's Display popover (w-[300px]). Replaces the old TweakPanel
// which was a fixed sidecar.

import type { ShellId, ThemeConfig, DecorationConfig } from "@/lib/book/types"
import { SHELLS } from "@/lib/book/shells"
import type { BookDisplayState } from "./book-editor"

interface BookDisplayPanelProps {
  state: BookDisplayState
  onChange: (patch: Partial<BookDisplayState>) => void
}

export function BookDisplayPanel({ state, onChange }: BookDisplayPanelProps) {
  const { shell, renderMode, theme, decor } = state

  const patchTheme = (t: Partial<ThemeConfig>) => onChange({ theme: { ...theme, ...t } })
  const patchDecor = (d: Partial<DecorationConfig>) => onChange({ decor: { ...decor, ...d } })

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col gap-4 p-3.5">
        {/* Shell */}
        <Section label="Shell">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.values(SHELLS) as (typeof SHELLS)[ShellId][]).map((s) => (
              <Chip
                key={s.id}
                selected={shell === s.id}
                onClick={() => onChange({ shell: s.id })}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Render Mode */}
        <Section label="Render mode">
          <div className="flex rounded-md border border-border-subtle bg-card p-0.5">
            {(["scroll", "flipbook"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onChange({ renderMode: m })}
                className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                  renderMode === m
                    ? "bg-active-bg-strong text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "scroll" ? "Scroll" : "Flipbook"}
              </button>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section label="Typography">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "default", label: "Default", sub: "Playfair / Merriweather" },
              { id: "classic", label: "Classic", sub: "Garamond / Garamond" },
              { id: "modern", label: "Modern", sub: "Geist / Geist" },
              { id: "editorial", label: "Editorial", sub: "Playfair / Geist" },
              { id: "bauhaus", label: "Bauhaus", sub: "Geist Mono / Geist" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => patchTheme({ fontPair: f.id as ThemeConfig["fontPair"] })}
                className={`rounded border px-2 py-1.5 text-left text-[11px] transition-colors ${
                  theme.fontPair === f.id
                    ? "border-accent bg-accent/8 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-hover-bg"
                }`}
              >
                <div className="font-medium">{f.label}</div>
                <div className="text-[10px] leading-tight text-muted-foreground">{f.sub}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Margins */}
        <Section label="Margins">
          <div className="flex gap-1">
            {(["narrow", "standard", "wide"] as const).map((m) => (
              <Chip
                key={m}
                selected={theme.margins === m}
                onClick={() => patchTheme({ margins: m })}
                grow
              >
                {m}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Columns */}
        <Section label="Columns">
          <div className="flex gap-1">
            {[
              { v: 0, l: "Auto" },
              { v: 1, l: "1" },
              { v: 2, l: "2" },
              { v: 3, l: "3" },
              { v: 6, l: "6" },
            ].map((c) => (
              <Chip
                key={c.v}
                selected={theme.cols === c.v}
                onClick={() => patchTheme({ cols: c.v })}
                grow
              >
                {c.l}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Chapter breaks */}
        <Section label="Chapter breaks">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "default", label: "Default" },
              { id: "roman", label: "I · II · III" },
              { id: "numeric", label: "01 · 02 · 03" },
              { id: "ornament", label: "\u2766 ornament" },
              { id: "rule", label: "— rule —" },
            ].map((c) => (
              <Chip
                key={c.id}
                selected={theme.chapterStyle === c.id}
                onClick={() => patchTheme({ chapterStyle: c.id as ThemeConfig["chapterStyle"] })}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Background */}
        <Section label="Background">
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="color"
              value={theme.bgColor || "#141417"}
              onChange={(e) => patchTheme({ bgColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
            />
            <span className="flex-1">Color</span>
            {theme.bgColor && (
              <button
                onClick={() => patchTheme({ bgColor: "" })}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                reset
              </button>
            )}
          </label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(["none", "paper", "newsprint", "dots", "linen"] as const).map((t) => (
              <Chip key={t} selected={theme.texture === t} onClick={() => patchTheme({ texture: t })}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Card border */}
        <Section label="Card border">
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: "none", val: "none" },
                { id: "hairline", val: "1px solid rgba(0,0,0,0.15)" },
                { id: "subtle", val: "1px solid var(--border-subtle)" },
                { id: "strong", val: "2px solid var(--foreground)" },
              ] as const
            ).map((b) => (
              <Chip
                key={b.id}
                selected={theme.cardBorder === b.val || (!theme.cardBorder && b.id === "none")}
                onClick={() => patchTheme({ cardBorder: b.val })}
              >
                {b.id}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Ink colors */}
        <Section label="Ink colors">
          <ColorRow
            label="Body text"
            value={theme.textColor || "#fafafa"}
            hasValue={!!theme.textColor}
            onChange={(v) => patchTheme({ textColor: v })}
            onReset={() => patchTheme({ textColor: "" })}
          />
          <ColorRow
            label="Accent"
            value={theme.accentColor || "#6366f1"}
            hasValue={!!theme.accentColor}
            onChange={(v) => patchTheme({ accentColor: v })}
            onReset={() => patchTheme({ accentColor: "" })}
          />
          <ColorRow
            label="Pull quote"
            value={theme.quoteColor || "#9b1c1c"}
            hasValue={!!theme.quoteColor}
            onChange={(v) => patchTheme({ quoteColor: v })}
            onReset={() => patchTheme({ quoteColor: "" })}
          />
        </Section>

        {/* Decoration */}
        <Section label="Decoration">
          <div className="flex flex-col gap-1.5">
            <CheckRow
              label="Ribbon"
              checked={decor.ribbon}
              onToggle={(v) => patchDecor({ ribbon: v })}
              accessory={
                <input
                  type="color"
                  value={decor.ribbonColor}
                  onChange={(e) => patchDecor({ ribbonColor: e.target.value })}
                  className="ml-auto h-5 w-6 cursor-pointer rounded border border-border"
                />
              }
            />
            <CheckRow
              label="Bookmark tab"
              checked={decor.bookmark}
              onToggle={(v) => patchDecor({ bookmark: v })}
            />
            <CheckRow
              label="Corner ornament"
              checked={decor.ornament}
              onToggle={(v) => patchDecor({ ornament: v })}
            />
            <CheckRow
              label="Flipbook frame"
              checked={decor.flipbook}
              onToggle={(v) => patchDecor({ flipbook: v })}
            />
          </div>
        </Section>

        {/* Save as My Shell (Phase 5 stub) */}
        <div className="border-t border-border-subtle pt-3">
          <button
            disabled
            className="w-full rounded border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground/60"
            title="Coming in Phase 5"
          >
            Save as My Shell…
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function Chip({
  children,
  selected,
  onClick,
  grow,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  grow?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${grow ? "flex-1" : ""} rounded border px-2 py-1 text-[11px] transition-colors ${
        selected
          ? "border-accent bg-accent/8 text-foreground"
          : "border-border bg-background text-foreground hover:bg-hover-bg"
      }`}
    >
      {children}
    </button>
  )
}

function ColorRow({
  label,
  value,
  hasValue,
  onChange,
  onReset,
}: {
  label: string
  value: string
  hasValue: boolean
  onChange: (v: string) => void
  onReset: () => void
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-5 w-6 cursor-pointer rounded border border-border"
      />
      <span className="flex-1 text-[11px] text-muted-foreground">{label}</span>
      {hasValue && (
        <button
          onClick={onReset}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          reset
        </button>
      )}
    </label>
  )
}

function CheckRow({
  label,
  checked,
  onToggle,
  accessory,
}: {
  label: string
  checked: boolean
  onToggle: (v: boolean) => void
  accessory?: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-[12px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="flex-1">{label}</span>
      {accessory}
    </label>
  )
}
