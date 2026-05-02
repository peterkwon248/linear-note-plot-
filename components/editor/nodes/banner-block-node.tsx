"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Node, mergeAttributes } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import {
  BookmarkSimple,
  GearSix,
  Info,
  Lightbulb,
  Megaphone,
  Pushpin,
  Sparkle,
  Star,
  Warning,
  X as PhX,
} from "@/lib/editor/editor-icons"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { getEntityContext } from "@/lib/editor/entity-context"
import { BlockCommentMarker } from "@/components/comments/block-comment-marker"
import type { CommentAnchor } from "@/lib/types"
import { useTintedBg } from "@/lib/tinted-bg"

// ── Color Presets ─────────────────────────────────────────────────────────────
// Reuses the same RGBA-0.35 palette as InfoboxBlockNode to stay consistent.
export interface BannerColorPreset {
  label: string
  value: string | null
  swatch: string
}

export const BANNER_COLOR_PRESETS: BannerColorPreset[] = [
  { label: "Default", value: null,                          swatch: "rgba(148,163,184,0.25)" },
  { label: "Blue",    value: "rgba(59,130,246,0.35)",       swatch: "rgba(59,130,246,0.35)"  },
  { label: "Red",     value: "rgba(239,68,68,0.35)",        swatch: "rgba(239,68,68,0.35)"   },
  { label: "Green",   value: "rgba(34,197,94,0.35)",        swatch: "rgba(34,197,94,0.35)"   },
  { label: "Yellow",  value: "rgba(234,179,8,0.35)",        swatch: "rgba(234,179,8,0.35)"   },
  { label: "Orange",  value: "rgba(249,115,22,0.35)",       swatch: "rgba(249,115,22,0.35)"  },
  { label: "Purple",  value: "rgba(168,85,247,0.35)",       swatch: "rgba(168,85,247,0.35)"  },
  { label: "Pink",    value: "rgba(236,72,153,0.35)",       swatch: "rgba(236,72,153,0.35)"  },
]

// hex (#rrggbb) → rgba(r,g,b,0.35). input[type=color] is always #rrggbb.
export function hexToRgba(hex: string, alpha = 0.35): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Icon Catalog (8 options) ──────────────────────────────────────────────────
// Used by both BannerNodeView (TipTap) and WikiBannerBlock (wiki tier).
export type BannerIconKey =
  | "megaphone"
  | "warning"
  | "info"
  | "lightbulb"
  | "star"
  | "sparkle"
  | "bookmark"
  | "pushpin"

// Icons can come from either Remix (RemixiconComponentType) or Phosphor — both
// accept a `size` prop. We treat them as opaque at the catalog level to avoid
// fighting the upstream types; consumers always render via the captured ref.
type IconComponent = React.ComponentType<any>

export const BANNER_ICON_OPTIONS: { key: BannerIconKey; label: string; Icon: IconComponent }[] = [
  { key: "megaphone", label: "Megaphone", Icon: Megaphone     },
  { key: "warning",   label: "Warning",   Icon: Warning       },
  { key: "info",      label: "Info",      Icon: Info          },
  { key: "lightbulb", label: "Idea",      Icon: Lightbulb     },
  { key: "star",      label: "Star",      Icon: Star          },
  { key: "sparkle",   label: "Sparkle",   Icon: Sparkle       },
  { key: "bookmark",  label: "Bookmark",  Icon: BookmarkSimple },
  { key: "pushpin",   label: "Pin",       Icon: Pushpin       },
]

const BANNER_ICON_MAP: Record<BannerIconKey, IconComponent> = BANNER_ICON_OPTIONS.reduce(
  (acc, { key, Icon }) => {
    acc[key] = Icon
    return acc
  },
  {} as Record<BannerIconKey, IconComponent>,
)

export function resolveBannerIcon(key: string | undefined | null): IconComponent {
  if (key && key in BANNER_ICON_MAP) return BANNER_ICON_MAP[key as BannerIconKey]
  return Megaphone
}

// ── Size System ───────────────────────────────────────────────────────────────
export type BannerSize = "compact" | "default" | "hero"

export interface BannerSizeStyle {
  /** Container padding utility classes. */
  containerPadding: string
  /** Title font/weight utility classes. */
  titleClass: string
  /** Subtitle font utility classes. */
  subtitleClass: string
  /** Pixel size of the leading icon. */
  iconSize: number
  /** Vertical alignment offset for the icon (matches title baseline). */
  iconMarginTop: string
  /** Right-side reserved space for the action cluster. */
  rightPadClass: string
  /** Gap between icon and text column. */
  gapClass: string
}

export const BANNER_SIZE_STYLES: Record<BannerSize, BannerSizeStyle> = {
  compact: {
    containerPadding: "px-4 py-3",
    titleClass:       "text-[calc(1em*var(--scale-misc,1))] font-medium leading-tight",
    subtitleClass:    "mt-0.5 text-xs",
    iconSize:         16,
    iconMarginTop:    "mt-0.5",
    rightPadClass:    "pr-10",
    gapClass:         "gap-2.5",
  },
  default: {
    containerPadding: "px-6 py-5",
    titleClass:       "text-[calc(1.25em*var(--scale-misc,1))] font-semibold leading-tight",
    subtitleClass:    "mt-1 text-sm",
    iconSize:         20,
    iconMarginTop:    "mt-0.5",
    rightPadClass:    "pr-12",
    gapClass:         "gap-3",
  },
  hero: {
    containerPadding: "px-8 py-8",
    titleClass:       "text-[calc(1.5em*var(--scale-misc,1))] font-bold leading-tight",
    subtitleClass:    "mt-2 text-base",
    iconSize:         24,
    iconMarginTop:    "mt-1",
    rightPadClass:    "pr-14",
    gapClass:         "gap-4",
  },
}

export function resolveBannerSize(value: string | undefined | null): BannerSize {
  if (value === "compact" || value === "hero") return value
  return "default"
}

// ── Background Style ──────────────────────────────────────────────────────────
export type BannerBgStyle = "solid" | "stripe" | "gradient"

export function resolveBannerBgStyle(value: string | undefined | null): BannerBgStyle {
  if (value === "stripe" || value === "gradient") return value
  return "solid"
}

/**
 * Compute container styling and class fragments based on bgStyle + colors.
 * Centralised so the TipTap node and the wiki block stay visually identical.
 */
export interface BannerVisualResult {
  /** Inline style for the outer banner container. */
  containerStyle: CSSProperties | undefined
  /** Whether the container should fall back to `bg-secondary/40` (no inline bg). */
  useDefaultBg: boolean
  /** Optional className addendum (e.g. transparent bg for stripe). */
  containerExtraClass: string
}

export function computeBannerVisual(
  bgStyle: BannerBgStyle,
  bgColor: string | null,
  bgColorEnd: string | null,
): BannerVisualResult {
  // No color set → always default backdrop, no special treatment.
  if (!bgColor) {
    return { containerStyle: undefined, useDefaultBg: true, containerExtraClass: "" }
  }

  if (bgStyle === "stripe") {
    // Left accent stripe + neutral fill. Container background uses a subtle
    // tinted secondary so the stripe pops without being garish.
    return {
      containerStyle: {
        borderLeftColor: bgColor,
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
      },
      useDefaultBg: false,
      // Slightly muted backdrop — still themed (dark/light safe via Tailwind token).
      containerExtraClass: "bg-secondary/30",
    }
  }

  if (bgStyle === "gradient") {
    const end = bgColorEnd ?? "transparent"
    return {
      containerStyle: {
        backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, ${end} 100%)`,
      },
      useDefaultBg: false,
      containerExtraClass: "",
    }
  }

  // Solid (default): single fill.
  return {
    containerStyle: { backgroundColor: bgColor },
    useDefaultBg: false,
    containerExtraClass: "",
  }
}

// ── Shared Bookmark Button ────────────────────────────────────────────────────
// Re-usable bookmark toggle. Used here AND inside the wiki-banner block, so
// both surfaces share one source of truth for bookmark behavior.

export function BannerBookmarkButton({
  entityId,
  blockId,
  label,
  active,
}: {
  entityId: string
  blockId: string
  /** Display label persisted with the bookmark. */
  label: string
  /** Whether the surrounding cluster is currently visible (color active). */
  active?: boolean
}) {
  const globalBookmarks = usePlotStore((s) => s.globalBookmarks)
  const pinBookmark = usePlotStore((s) => s.pinBookmark)
  const unpinBookmark = usePlotStore((s) => s.unpinBookmark)

  const existing = useMemo(
    () => Object.values(globalBookmarks).find((b) => b.noteId === entityId && b.anchorId === blockId),
    [globalBookmarks, entityId, blockId],
  )
  const bookmarked = !!existing

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (bookmarked && existing) {
      unpinBookmark(existing.id)
    } else {
      pinBookmark(entityId, blockId, label || "Banner", "block", "wiki")
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "rounded p-1 transition-colors",
        bookmarked
          ? "text-accent bg-hover-bg"
          : active
            ? "text-foreground hover:bg-hover-bg"
            : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
      )}
    >
      <BookmarkSimple size={13} />
    </button>
  )
}

// ── Banner Action Cluster ─────────────────────────────────────────────────────
// Shared row of [Settings][Comment][Bookmark][X] used by both the TipTap
// BannerNodeView and the wiki-tier WikiBannerBlock. Centralised so the two
// surfaces stay visually identical.

export interface BannerActionClusterProps {
  /** Whether to show editing affordances (Settings, X). */
  editable: boolean
  /** Whether the settings popover is currently open. Drives the gear's "active" styling. */
  showSettings: boolean
  /** Toggle the settings popover. */
  onToggleSettings: () => void
  /** Delete the banner. */
  onDelete: () => void
  /** Anchor for the comment popover. */
  commentAnchor: CommentAnchor | null
  /** Bookmark target — entity (noteId/articleId) and block id. */
  bookmark: { entityId: string; blockId: string; label: string } | null
  /** Whether the banner has a non-default visual (color, size, icon). Drives Settings "active" styling. */
  hasCustomization: boolean
}

function BannerActionCluster({
  editable,
  showSettings,
  onToggleSettings,
  onDelete,
  commentAnchor,
  bookmark,
  hasCustomization,
}: BannerActionClusterProps) {
  // Settings + X are editor-only. Comment + Bookmark always show (read-only safe).
  const settingsActive = showSettings || hasCustomization

  return (
    <div className="absolute top-2 right-2 flex items-center gap-0.5 z-10">
      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSettings()
          }}
          className={cn(
            "rounded p-1 transition-colors",
            settingsActive
              ? "text-foreground bg-hover-bg"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
          )}
          title="Banner settings"
        >
          <GearSix size={13} />
        </button>
      )}

      {commentAnchor && (
        <span
          className={cn(
            "transition-opacity",
            settingsActive ? "opacity-100" : "opacity-0 group-hover/banner:opacity-100",
          )}
        >
          <BlockCommentMarker
            anchor={commentAnchor}
            alwaysVisibleWhenEmpty
            className="!px-1 !py-1 !rounded !text-muted-foreground/60 hover:!text-foreground"
          />
        </span>
      )}

      {bookmark && (
        <BannerBookmarkButton
          entityId={bookmark.entityId}
          blockId={bookmark.blockId}
          label={bookmark.label}
          active={settingsActive}
        />
      )}

      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className={cn(
            "rounded p-1 transition-colors",
            settingsActive
              ? "text-foreground hover:bg-hover-bg"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-hover-bg opacity-0 group-hover/banner:opacity-100",
          )}
          title="Remove banner"
        >
          <PhX size={13} />
        </button>
      )}
    </div>
  )
}

// ── Color Picker Row ──────────────────────────────────────────────────────────
// Compact row used INSIDE the new BannerSettingsPopover. (Old standalone popover
// is removed; this is the row form used inside Settings.)

function BannerColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {BANNER_COLOR_PRESETS.map((preset) => {
          const isActive = (value ?? null) === preset.value
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.value)}
              title={preset.label}
              className={cn(
                "h-5 w-5 rounded-sm border transition-transform hover:scale-110",
                isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle",
              )}
              style={{ backgroundColor: preset.swatch }}
            />
          )
        })}
        <div className="mx-0.5 h-4 w-px bg-border-subtle" />
        <label
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
          title="Custom color"
        >
          <input
            type="color"
            value={(value && /^#/.test(value)) ? value : "#3b82f6"}
            onChange={(e) => onChange(hexToRgba(e.target.value))}
            className="pointer-events-none h-0 w-0 opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

// ── Color Picker Popover (legacy export, kept for compatibility) ──────────────
// Retained because external code (e.g. older banner-block.tsx revisions) might
// import it. The new Settings popover supersedes this in current callers.
export function BannerColorPickerPopover({
  bgColor,
  onPick,
  onClose,
}: {
  bgColor: string | null
  onPick: (value: string | null) => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute right-2 top-[calc(100%-2rem)] z-20 flex items-center gap-1 rounded-md border border-border-subtle bg-popover p-1.5 shadow-md"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {BANNER_COLOR_PRESETS.map((preset) => {
        const isActive = (bgColor ?? null) === preset.value
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onPick(preset.value)
              onClose()
            }}
            title={preset.label}
            className={cn(
              "h-5 w-5 rounded-sm border transition-transform hover:scale-110",
              isActive ? "border-foreground ring-1 ring-foreground" : "border-border-subtle",
            )}
            style={{ backgroundColor: preset.swatch }}
          />
        )
      })}
      <div className="mx-1 h-4 w-px bg-border-subtle" />
      <label
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm border border-border-subtle bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400 hover:scale-110 transition-transform"
        title="Custom color"
      >
        <input
          type="color"
          value={(bgColor && /^#/.test(bgColor)) ? bgColor : "#3b82f6"}
          onChange={(e) => {
            onPick(hexToRgba(e.target.value))
          }}
          className="pointer-events-none h-0 w-0 opacity-0"
        />
      </label>
    </div>
  )
}

// ── Settings Popover (Style + Color + Icon + Size) ────────────────────────────

export interface BannerSettingsValues {
  bgStyle: BannerBgStyle
  bgColor: string | null
  bgColorEnd: string | null
  icon: BannerIconKey
  size: BannerSize
}

export interface BannerSettingsPatch {
  bgStyle?: BannerBgStyle
  bgColor?: string | null
  bgColorEnd?: string | null
  icon?: BannerIconKey
  size?: BannerSize
}

export function BannerSettingsPopover({
  values,
  onChange,
  onClose,
}: {
  values: BannerSettingsValues
  onChange: (patch: BannerSettingsPatch) => void
  onClose: () => void
}) {
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click — but only on click (not mousedown) so swatch
  // taps inside the popover register before close fires.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return
      // Allow clicks inside the popover and standard inner-popover targets
      // (color input, radix popper portals, tippy if any).
      if (popoverRef.current?.contains(target)) return
      if (target.closest('[data-radix-popper-content-wrapper], [role="menu"], [role="dialog"], .tippy-content')) {
        return
      }
      onClose()
    }
    // Defer attachment so the click that opened the popover doesn't close it.
    const t = setTimeout(() => document.addEventListener("click", onDocClick), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener("click", onDocClick)
    }
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="absolute right-2 top-[calc(100%-2rem)] z-20 w-[280px] rounded-md border border-border-subtle bg-popover p-3 shadow-md flex flex-col gap-3"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Style ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Style
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(["solid", "stripe", "gradient"] as BannerBgStyle[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ bgStyle: s })}
              className={cn(
                "rounded border px-2 py-1.5 text-xs capitalize transition-colors",
                values.bgStyle === s
                  ? "border-foreground bg-hover-bg text-foreground"
                  : "border-border-subtle text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Color ──────────────────────────────────────────────────────── */}
      <BannerColorRow
        label={values.bgStyle === "stripe" ? "Stripe color" : values.bgStyle === "gradient" ? "Start color" : "Color"}
        value={values.bgColor}
        onChange={(v) => onChange({ bgColor: v })}
      />

      {/* Gradient end color slot (only when gradient mode active) */}
      {values.bgStyle === "gradient" && (
        <BannerColorRow
          label="End color (auto-fade if empty)"
          value={values.bgColorEnd}
          onChange={(v) => onChange({ bgColorEnd: v })}
        />
      )}

      {/* ── Icon ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Icon
        </div>
        <div className="grid grid-cols-4 gap-1">
          {BANNER_ICON_OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ icon: key })}
              title={label}
              className={cn(
                "flex aspect-square items-center justify-center rounded border transition-colors",
                values.icon === key
                  ? "border-foreground bg-hover-bg text-foreground"
                  : "border-border-subtle text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Size ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Size
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(["compact", "default", "hero"] as BannerSize[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ size: s })}
              className={cn(
                "rounded border px-2 py-1.5 text-xs capitalize transition-colors",
                values.size === s
                  ? "border-foreground bg-hover-bg text-foreground"
                  : "border-border-subtle text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── NodeView ──────────────────────────────────────────────────────────────────

function BannerNodeView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const editable = editor.isEditable
  const title       = (node.attrs.title    as string) || ""
  const subtitle    = (node.attrs.subtitle as string) || ""
  const bgColor     = (node.attrs.bgColor    as string | null) ?? null
  const bgColorEnd  = (node.attrs.bgColorEnd as string | null) ?? null
  const iconKey     = (node.attrs.icon       as string) || "megaphone"
  const sizeAttr    = (node.attrs.size       as string) || "default"
  const bgStyleAttr = (node.attrs.bgStyle    as string) || "solid"
  const blockId     = (node.attrs.id       as string | undefined) ?? null

  const [showSettings, setShowSettings] = useState(false)

  const updateTitle    = useCallback((v: string) => updateAttributes({ title: v }),    [updateAttributes])
  const updateSubtitle = useCallback((v: string) => updateAttributes({ subtitle: v }), [updateAttributes])

  // Resolve which entity (note/wiki) we live in. Falls back to null when the
  // host editor hasn't published an entity context — e.g. read-only previews.
  const entityCtx = getEntityContext(editor)
  const commentAnchor = useMemo<CommentAnchor | null>(() => {
    if (!entityCtx || !blockId) return null
    if (entityCtx.kind === "note") {
      return { kind: "note-block", noteId: entityCtx.entityId, nodeId: blockId }
    }
    return { kind: "wiki-block", articleId: entityCtx.entityId, blockId }
  }, [entityCtx, blockId])

  const bookmark = useMemo(() => {
    if (!entityCtx || !blockId) return null
    return {
      entityId: entityCtx.entityId,
      blockId,
      label: title || "Banner",
    }
  }, [entityCtx, blockId, title])

  // Resolve visual primitives from attrs.
  const size       = resolveBannerSize(sizeAttr)
  const bgStyle    = resolveBannerBgStyle(bgStyleAttr)
  const sizeStyles = BANNER_SIZE_STYLES[size]
  const Icon       = resolveBannerIcon(iconKey)
  const renderedBgColor    = useTintedBg(bgColor) ?? bgColor
  const renderedBgColorEnd = useTintedBg(bgColorEnd) ?? bgColorEnd
  const visual     = computeBannerVisual(bgStyle, renderedBgColor, renderedBgColorEnd)

  // "Customised" = anything non-default (color, non-default icon, non-default size, non-solid style).
  const hasCustomization = !!bgColor
    || iconKey !== "megaphone"
    || size !== "default"
    || bgStyle !== "solid"

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className={cn(
          "not-draggable rounded-lg my-4 relative group/banner select-none",
          sizeStyles.containerPadding,
          visual.useDefaultBg && "bg-secondary/40",
          visual.containerExtraClass,
        )}
        style={visual.containerStyle}
      >
        {/* Unified action cluster: Settings + Comment + Bookmark + X */}
        <BannerActionCluster
          editable={editable}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings((v) => !v)}
          onDelete={() => deleteNode()}
          commentAnchor={commentAnchor}
          bookmark={bookmark}
          hasCustomization={hasCustomization}
        />

        {/* Settings popover */}
        {editable && showSettings && (
          <BannerSettingsPopover
            values={{
              bgStyle,
              bgColor,
              bgColorEnd,
              icon: (iconKey as BannerIconKey),
              size,
            }}
            onChange={(patch) => updateAttributes(patch)}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Icon + Title */}
        <div className={cn("flex items-start", sizeStyles.gapClass, sizeStyles.rightPadClass)}>
          <Icon
            size={sizeStyles.iconSize}
            className={cn("shrink-0 text-foreground/60", sizeStyles.iconMarginTop)}
          />
          <div className="flex-1 min-w-0">
            {editable ? (
              <input
                type="text"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Banner title"
                className={cn(
                  "w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60",
                  sizeStyles.titleClass,
                )}
              />
            ) : (
              <div className={cn("text-foreground", sizeStyles.titleClass)}>
                {title || <span className="text-muted-foreground/60">Banner title</span>}
              </div>
            )}
            {/* Subtitle */}
            {editable ? (
              <input
                type="text"
                value={subtitle}
                onChange={(e) => updateSubtitle(e.target.value)}
                placeholder="Subtitle (optional)"
                className={cn(
                  "w-full bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/60",
                  sizeStyles.subtitleClass,
                )}
              />
            ) : (
              subtitle && (
                <div className={cn("text-muted-foreground", sizeStyles.subtitleClass)}>
                  {subtitle}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// ── TipTap Node Definition ────────────────────────────────────────────────────

export const BannerBlockNode = Node.create({
  name: "bannerBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: "Banner title",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-title") || "Banner title",
        renderHTML: (attrs: Record<string, string>) => ({ "data-title": attrs.title }),
      },
      subtitle: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-subtitle") || "",
        renderHTML: (attrs: Record<string, string>) =>
          attrs.subtitle ? { "data-subtitle": attrs.subtitle } : {},
      },
      bgColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-bg-color") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.bgColor ? { "data-bg-color": attrs.bgColor } : {},
      },
      bgColorEnd: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-bg-color-end") || null,
        renderHTML: (attrs: Record<string, any>) =>
          attrs.bgColorEnd ? { "data-bg-color-end": attrs.bgColorEnd } : {},
      },
      icon: {
        default: "megaphone",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-icon") || "megaphone",
        renderHTML: (attrs: Record<string, any>) =>
          attrs.icon && attrs.icon !== "megaphone" ? { "data-icon": attrs.icon } : {},
      },
      size: {
        default: "default",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-size") || "default",
        renderHTML: (attrs: Record<string, any>) =>
          attrs.size && attrs.size !== "default" ? { "data-size": attrs.size } : {},
      },
      bgStyle: {
        default: "solid",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-bg-style") || "solid",
        renderHTML: (attrs: Record<string, any>) =>
          attrs.bgStyle && attrs.bgStyle !== "solid" ? { "data-bg-style": attrs.bgStyle } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="banner-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "banner-block" })]
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "bannerBlock") {
          e.commands.deleteSelection()
          return true
        }
        const { $from } = e.state.selection
        const before = $from.nodeBefore
        if (before?.type.name === "bannerBlock") {
          e.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
          return true
        }
        return false
      },
      Delete: ({ editor: e }) => {
        const sel = e.state.selection as any
        if (sel.node?.type.name === "bannerBlock") {
          e.commands.deleteSelection()
          return true
        }
        return false
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(BannerNodeView)
  },
})
