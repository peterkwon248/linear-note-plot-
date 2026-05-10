"use client"

/**
 * Generic Gallery view — entity-agnostic showcase grid.
 *
 * Used by Notes, Wiki, References. Each caller adapts its data into
 * `GalleryItem`s and passes optional grouping. The card uses Plot tokens
 * (`bg-card`, `border-border`, `text-muted-foreground`, hover states) so it
 * lives in the same visual language as the table / board views.
 *
 * Showcase touch: the cover band uses an `accentColor` (label / status /
 * category hex) as a soft gradient — keeps the gallery's "rich" feel without
 * borrowing the v3 mockup's noteId-hash hue (which ignored user color signal).
 */

import { Hash } from "@phosphor-icons/react/dist/ssr/Hash"
import { cn } from "@/lib/utils"

export interface GalleryItem {
  id: string
  title: string
  excerpt?: string
  /** Hex color used for the cover gradient + ring on hover. */
  accentColor: string
  /** Optional chip rendered inside the cover (e.g. status label). */
  badge?: { label: string; color?: string }
  /** Optional small icon to render inside the cover (entity hint). */
  coverIcon?: React.ReactNode
  /** Optional cover image URL — replaces the gradient when present. */
  coverImage?: string
  /** Left side of footer — tags / categories. */
  metaLeft?: string[]
  /** Right side of footer — counts / timestamps. */
  metaRight?: string[]
}

export interface GalleryGroup {
  id: string
  label: string
  /** Optional icon rendered before the label (matches list-mode group headers). */
  icon?: React.ReactNode
  items: GalleryItem[]
}

interface GalleryViewProps {
  /** Either a flat item list OR pre-bucketed groups. */
  items?: GalleryItem[]
  groups?: GalleryGroup[]
  activeId: string | null
  onItemClick: (id: string) => void
  /** Optional header above the first group. */
  title?: string
  subtitle?: string
}

export function GalleryView({
  items,
  groups,
  activeId,
  onItemClick,
  title,
  subtitle,
}: GalleryViewProps) {
  const hasGroups = !!groups && groups.length > 0
  const total = hasGroups ? groups!.reduce((n, g) => n + g.items.length, 0) : items?.length ?? 0

  if (total === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-muted-foreground">
        <p className="text-note">{title ?? "Nothing to show yet"}</p>
        {subtitle && <p className="text-2xs text-muted-foreground/70">{subtitle}</p>}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {(title || subtitle) && (
        <header className="mb-5 flex items-baseline justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-2xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="text-2xs text-muted-foreground tabular-nums">
            {total} {total === 1 ? "item" : "items"}
          </div>
        </header>
      )}

      {hasGroups ? (
        groups!.map((g) => (
          <section key={g.id} className="mb-6 last:mb-0">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                {g.icon && <span className="flex shrink-0 items-center">{g.icon}</span>}
                {g.label}
              </span>
              <span className="text-2xs text-muted-foreground/70 tabular-nums">
                {g.items.length}
              </span>
            </div>
            <Grid items={g.items} activeId={activeId} onItemClick={onItemClick} />
          </section>
        ))
      ) : (
        <Grid items={items!} activeId={activeId} onItemClick={onItemClick} />
      )}
    </div>
  )
}

function Grid({
  items,
  activeId,
  onItemClick,
}: {
  items: GalleryItem[]
  activeId: string | null
  onItemClick: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
      {items.map((it) => (
        <GalleryCard
          key={it.id}
          item={it}
          active={activeId === it.id}
          onClick={() => onItemClick(it.id)}
        />
      ))}
    </div>
  )
}

function GalleryCard({
  item,
  active,
  onClick,
}: {
  item: GalleryItem
  active: boolean
  onClick: () => void
}) {
  // Cover gradient is light-/dark-aware via the `.gallery-cover` class in
  // globals.css; the JSX only feeds the accent hex through `--cover-color`.
  // For pages with a real image, we fall through to the inline background.
  const useImageCover = !!item.coverImage

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      data-active={active ? "true" : undefined}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card cursor-pointer",
        "shadow-sm hover:shadow-md transition-all duration-150",
        "hover:border-accent/40",
        active
          ? "border-accent/50 ring-1 ring-accent/20"
          : "border-border",
      )}
    >
      {/* Cover band */}
      <div
        className={cn(
          "relative flex h-20 shrink-0 items-end justify-between px-3 pb-2",
          !useImageCover && "gallery-cover",
        )}
        style={
          useImageCover
            ? {
                backgroundImage: `url(${item.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : ({ "--cover-color": item.accentColor } as React.CSSProperties)
        }
      >
        {/* Top-left: optional small icon (entity hint) */}
        {item.coverIcon && (
          <div className="absolute left-3 top-3 text-foreground/60">{item.coverIcon}</div>
        )}
        {/* Bottom-left: badge */}
        {item.badge && (
          <span
            className="rounded-full bg-background/85 px-2 py-0.5 text-2xs font-medium text-foreground/85 backdrop-blur-sm"
            style={item.badge.color ? { color: item.badge.color } : undefined}
          >
            {item.badge.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-2">
        <h3 className="text-note font-medium leading-snug text-foreground line-clamp-2">
          {item.title || "Untitled"}
        </h3>
        {item.excerpt && (
          <p className="text-2xs leading-relaxed text-muted-foreground line-clamp-3">
            {item.excerpt}
          </p>
        )}
      </div>

      {/* Footer */}
      {(item.metaLeft?.length || item.metaRight?.length) && (
        <footer className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-2 text-2xs text-muted-foreground">
          {item.metaLeft && item.metaLeft.length > 0 ? (
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              {item.metaLeft.slice(0, 2).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-0.5">
                  {/^#/.test(t) || i === 0 ? <Hash size={9} weight="regular" className="opacity-60" /> : null}
                  <span className="truncate">{t.replace(/^#/, "")}</span>
                </span>
              ))}
            </div>
          ) : (
            <div />
          )}
          {item.metaRight && item.metaRight.length > 0 && (
            <div className="flex shrink-0 items-center gap-1 tabular-nums">
              {item.metaRight.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="opacity-50">·</span>}
                  {m}
                </span>
              ))}
            </div>
          )}
        </footer>
      )}
    </article>
  )
}
