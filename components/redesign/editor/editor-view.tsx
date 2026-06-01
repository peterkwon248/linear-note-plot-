"use client"

/**
 * Editor — pure presentational (preview-first redesign scaffolding).
 *
 * Faithful port of the live note-editor **chrome / shell**:
 *   - header + actions:   components/note-editor.tsx (NoteEditor, L456-693)
 *   - breadcrumb chrome:  components/editor-breadcrumb.tsx (visual reproduction)
 *   - referenced-in:      components/note-editor.tsx (ReferencedInBadges, L880)
 *   - body container:     components/note-editor.tsx (L702-714)
 *   - formatting toolbar: components/editor/FixedToolbar.tsx (L637-642 + groups)
 *
 * Every className is copied verbatim from those files. Store reads / i18n /
 * routing / TipTap are replaced by the `EditorViewModel` props (see
 * ./editor.types.ts). No usePlotStore / useRouter / useT / @tiptap/* here —
 * this is the unit handed to Open Design.
 *
 * ⚠️ The document BODY is a static approximation. The live editor renders the
 * TipTap/ProseMirror engine inside this frame; here we render plain JSX from
 * vm.body so the surface reads like a real note without the engine. Radix
 * wrappers (Tooltip / DropdownMenu / Popover) are flattened to plain
 * `<button title=...>` (visually identical, noop) to keep the unit store-free.
 */

import {
  // Header action icons (note-editor.tsx uses these lucide aliases)
  Pin as PushPin,
  Trash2 as Trash,
  MoreHorizontal as DotsThree,
  Copy as PhCopy,
  PanelRight as SidebarSimple,
  GitMerge,
  Link2 as PhLink,
  BookOpen,
  PenLine as PencilLine,
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  X as PhX,
  SplitSquareHorizontal as SplitHorizontal,
  Scissors,
} from "lucide-react"
// Breadcrumb chevron — live editor-breadcrumb uses IconChevronRight (plot-icons)
import { IconChevronRight } from "@/components/plot-icons"
// Status-shape glyphs — sourced from the pure editor-icons barrel (remix),
// mirroring StatusShapeIcon (components/status-icon.tsx) shape semantics.
import {
  Circle,
  CircleDashed,
  CircleHalf,
  CheckCircle,
} from "@/lib/editor/editor-icons"
import { NOTE_STATUS_HEX, PRIORITY_HEX } from "@/lib/colors"
import type {
  EditorViewModel,
  EditorViewCallbacks,
  EditorStatus,
  EditorPriority,
  EditorToolbarGroup,
  EditorBlock,
} from "./editor.types"

export function EditorView({
  vm,
  callbacks = {},
}: {
  vm: EditorViewModel
  callbacks?: EditorViewCallbacks
}) {
  return (
    <div data-editor-scope="note" className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* SURFACE: full-width column */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Editor Header */}
        <header className="flex items-center justify-between border-b border-border py-2 px-4 transition-colors duration-150">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {vm.pane === "secondary" && (
              <div className="flex items-center gap-0 mr-1">
                <button
                  onClick={() => callbacks.onBack?.()}
                  className="rounded-md p-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-hover-bg"
                  title="Go back"
                >
                  <CaretLeft size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => callbacks.onForward?.()}
                  className="rounded-md p-1 transition-colors text-muted-foreground hover:text-foreground hover:bg-hover-bg"
                  title="Go forward"
                >
                  <CaretRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <BreadcrumbView crumbs={vm.breadcrumb} title={vm.title} onCrumb={callbacks.onCrumb} />
            <ReferencedInBadgesView refs={vm.referencedIn} onOpen={callbacks.onOpenReferencedIn} />
          </div>
          <div className="flex items-center gap-0.5">
            {/* Expand / collapse all */}
            <button
              onClick={() => callbacks.onToggleCollapseAll?.()}
              disabled={!vm.hasCollapsibles}
              title={!vm.hasCollapsibles ? "No collapsible content" : vm.allCollapsed ? "Expand all" : "Collapse all"}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-all duration-100",
                vm.hasCollapsibles
                  ? "text-muted-foreground/70 hover:bg-hover-bg hover:text-muted-foreground cursor-pointer"
                  : "text-muted-foreground/50 cursor-default"
              )}
            >
              <svg width={17} height={17} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {vm.allCollapsed ? <path d="M4 6l4 4 4-4" /> : <path d="M12 10l-4-4-4 4" />}
              </svg>
            </button>
            {/* Pin */}
            <button
              onClick={() => callbacks.onTogglePin?.()}
              title={vm.pinned ? "Unpin" : "PushPin"}
              className={cn(
                "rounded-md p-1.5 transition-colors hover:bg-hover-bg",
                vm.pinned ? "text-chart-3" : "text-muted-foreground"
              )}
            >
              <PushPin size={16} strokeWidth={2} />
            </button>

            {/* More actions (DropdownMenu trigger, flattened) */}
            <button
              onClick={() => callbacks.onToolbarAction?.("note-more")}
              title="More actions"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-hover-bg"
            >
              <DotsThree size={16} strokeWidth={2.5} />
            </button>

            {/* Read / edit toggle */}
            <button
              onClick={() => callbacks.onToggleReadMode?.()}
              title={vm.isReadMode ? "Edit mode (Ctrl+Shift+E)" : "Read mode (Ctrl+Shift+E)"}
              className={cn(
                "rounded-md p-1.5 transition-colors hover:bg-hover-bg",
                vm.isReadMode ? "text-accent" : "text-muted-foreground"
              )}
            >
              {vm.isReadMode ? <BookOpen size={16} strokeWidth={2} /> : <PencilLine size={16} strokeWidth={2} />}
            </button>

            <span className="mx-0.5 h-4 w-px bg-border" />
            {/* Details panel toggle */}
            <button
              onClick={() => callbacks.onToggleDetails?.()}
              title={vm.detailsOpen ? "Hide details" : "Show details"}
              className={cn(
                "rounded-md p-1.5 transition-colors hover:bg-hover-bg",
                vm.detailsOpen ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <SidebarSimple size={16} strokeWidth={2} />
            </button>
            {vm.pane === "primary" && (
              <button
                onClick={() => callbacks.onToolbarAction?.("split")}
                title="Split View"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-hover-bg"
              >
                <SplitHorizontal size={16} strokeWidth={2} />
              </button>
            )}
            {vm.pane === "secondary" && (
              <>
                <span className="mx-0.5 h-4 w-px bg-border" />
                <button
                  onClick={() => callbacks.onClose?.()}
                  title="Close panel"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-hover-bg"
                >
                  <PhX size={16} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Editor (title is the first node inside TipTap — here a static
            title input + meta row, then the static body approximation). */}
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col">
          <div
            className="min-w-0 w-full flex-1 flex flex-col"
            style={{
              paddingLeft: "var(--editor-padding-x)",
              paddingRight: "var(--editor-padding-x)",
              paddingTop: "var(--editor-padding-y)",
              paddingBottom: "var(--editor-padding-y)",
            }}
          >
            {/* Title (live: TipTap title node, h1-scale). Static input visual. */}
            <input
              type="text"
              defaultValue={vm.title}
              placeholder={vm.titlePlaceholder}
              readOnly={vm.isReadMode}
              className="w-full bg-transparent text-3xl font-semibold leading-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />

            {/* Meta / properties row — status · priority · tags · date chips. */}
            <MetaRow vm={vm} />

            {/* Document body — STATIC approximation of TipTap output. */}
            <div className="mt-6 flex-1 space-y-4 text-note leading-relaxed text-foreground">
              {vm.body.map((block, i) => (
                <BodyBlock key={i} block={block} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FixedToolbar — outside SURFACE, full width (hidden in read mode). */}
      {!vm.isReadMode && (
        <FixedToolbarView groups={vm.toolbarGroups} onAction={callbacks.onToolbarAction} />
      )}
    </div>
  )
}

/* ── Breadcrumb (components/editor-breadcrumb.tsx, visual reproduction) ── */

function BreadcrumbView({
  crumbs,
  title,
  onCrumb,
}: {
  crumbs: { id: string; label: string }[]
  title: string
  onCrumb?: (id: string) => void
}) {
  return (
    <nav className="flex items-center gap-1 min-w-0">
      {crumbs.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1 shrink-0">
          {i > 0 && <IconChevronRight size={16} className="shrink-0 text-muted-foreground/70" />}
          <button
            onClick={() => onCrumb?.(c.id)}
            className="shrink-0 text-lg text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            {c.label}
          </button>
        </span>
      ))}
      {/* Note-picker chevron (live: NotePickerChevron, flattened to plain) */}
      <button className="shrink-0 rounded p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
        <IconChevronRight size={16} />
      </button>
      {/* Note title crumb */}
      <span className="min-w-0 truncate text-lg font-medium text-foreground">
        {title || "Untitled"}
      </span>
    </nav>
  )
}

/* ── Referenced In Badges (note-editor.tsx ReferencedInBadges, L880) ───── */

function ReferencedInBadgesView({
  refs,
  onOpen,
}: {
  refs: { id: string; title: string }[]
  onOpen?: (id: string) => void
}) {
  if (refs.length === 0) return null

  const MAX_BADGES = 3
  const visible = refs.slice(0, MAX_BADGES)
  const overflow = refs.length - MAX_BADGES

  return (
    <div className="flex items-center gap-1 shrink min-w-0 overflow-hidden">
      <span className="text-note text-muted-foreground/70 shrink-0">in</span>
      {visible.map((a) => (
        <button
          key={a.id}
          onClick={() => onOpen?.(a.id)}
          className="rounded-sm bg-accent/15 px-2.5 py-0.5 text-note font-medium text-accent hover:text-accent transition-colors duration-100 truncate max-w-[120px]"
        >
          {a.title}
        </button>
      ))}
      {overflow > 0 && (
        <button className="shrink-0 rounded-sm bg-secondary/50 px-1.5 py-px text-2xs font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-100">
          +{overflow} more
        </button>
      )}
    </div>
  )
}

/* ── Meta / properties row (status · priority · tags · date) ───────────── */

function StatusShapeGlyph({ status, size = 14 }: { status: EditorStatus; size?: number }) {
  const color = NOTE_STATUS_HEX[status]
  if (status === "backlog") return <CircleDashed size={size} style={{ color }} className="shrink-0" />
  if (status === "todo") return <Circle size={size} style={{ color }} className="shrink-0" />
  if (status === "in_progress") return <CircleHalf size={size} style={{ color }} className="shrink-0" />
  return <CheckCircle size={size} style={{ color }} className="shrink-0" />
}

function MetaRow({ vm }: { vm: EditorViewModel }) {
  const { meta } = vm
  const priorityColor = PRIORITY_HEX[meta.priority as EditorPriority]
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {/* Status chip */}
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-foreground/80">
        <StatusShapeGlyph status={meta.status} size={14} />
        {meta.statusLabel}
      </span>
      {/* Priority chip */}
      {meta.priority !== "none" && (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-2xs font-medium text-foreground/80">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: priorityColor }} />
          {meta.priorityLabel}
        </span>
      )}
      {/* Tag chips */}
      {meta.tags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-md border-solid px-2 py-1 text-2xs font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${t.color} 14%, transparent)`,
            color: t.color,
            borderColor: `color-mix(in srgb, ${t.color} 45%, transparent)`,
            borderWidth: "1.5px",
          }}
        >
          {t.name}
        </span>
      ))}
      {/* Updated date */}
      <span className="ml-auto shrink-0 text-2xs tabular-nums text-muted-foreground/70">
        {meta.updatedLabel}
      </span>
    </div>
  )
}

/* ── Document body blocks — STATIC approximation of TipTap output ───────── */

function BodyBlock({ block }: { block: EditorBlock }) {
  switch (block.kind) {
    case "heading": {
      if (block.level === 1)
        return <h1 className="text-2xl font-semibold leading-tight text-foreground">{block.text}</h1>
      if (block.level === 2)
        return <h2 className="text-xl font-semibold leading-snug text-foreground">{block.text}</h2>
      return <h3 className="text-lg font-semibold leading-snug text-foreground">{block.text}</h3>
    }
    case "paragraph":
      return <p className="text-note leading-relaxed text-foreground/90">{block.text}</p>
    case "bullets":
      return (
        <ul className="list-disc space-y-1 pl-6 text-note leading-relaxed text-foreground/90">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )
    case "quote":
      return (
        <blockquote className="border-l-2 border-border pl-4 text-note italic leading-relaxed text-muted-foreground">
          {block.text}
        </blockquote>
      )
    case "callout":
      return (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-note leading-relaxed text-foreground/90">
          <span className="mt-0.5 shrink-0 text-muted-foreground">{block.icon}</span>
          <span className="min-w-0">{block.text}</span>
        </div>
      )
  }
}

/* ── FixedToolbar (components/editor/FixedToolbar.tsx, L637-642) ────────── */

function FixedToolbarView({
  groups,
  onAction,
}: {
  groups: EditorToolbarGroup[]
  onAction?: (id: string) => void
}) {
  return (
    <div className="shrink-0 sticky bottom-0 z-10 overflow-x-auto overflow-y-hidden min-w-0 h-14 flex items-center gap-0.5 px-3 border-t border-border bg-background">
      {groups.map((group, gi) => (
        <span key={group.key} className="flex items-center gap-0.5">
          {gi > 0 && <ToolbarDivider />}
          <ToolbarGroup>
            {group.buttons.map((b) => (
              <ToolbarButton
                key={b.id}
                title={b.title}
                isActive={b.active}
                disabled={b.disabled}
                onClick={() => onAction?.(b.id)}
              >
                {b.icon}
              </ToolbarButton>
            ))}
          </ToolbarGroup>
        </span>
      ))}
      <ToolbarSpacer />
      {/* More actions overflow (FixedToolbar.tsx L883) */}
      <ToolbarDivider />
      <button
        onClick={() => onAction?.("more")}
        title="More Actions — Additional toolbar options"
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 cursor-pointer border-0 outline-none transition-colors duration-100 text-muted-foreground hover:text-foreground hover:bg-hover-bg"
      >
        <DotsThree size={20} />
      </button>
    </div>
  )
}

/* ── Toolbar primitives — inlined verbatim from
     components/editor/toolbar/toolbar-primitives.tsx (kept self-contained). ── */

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  size = "default",
  className,
}: {
  onClick?: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  size?: "default" | "sm"
  className?: string
}) {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-10 h-10"
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => { if (!disabled && onClick) onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        sizeClasses,
        "rounded-md flex items-center justify-center shrink-0 border-0 outline-none transition-colors duration-100",
        disabled
          ? "cursor-not-allowed opacity-40 text-muted-foreground"
          : isActive
            ? "cursor-pointer text-foreground bg-toolbar-active"
            : "cursor-pointer text-muted-foreground hover:text-foreground hover:bg-hover-bg",
        className,
      )}
    >
      {children}
    </button>
  )
}

function ToolbarDivider({ className }: { className?: string }) {
  return <div className={cn("w-px h-7 bg-border-subtle mx-1 shrink-0", className)} />
}

function ToolbarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-0.5", className)}>{children}</div>
}

function ToolbarSpacer() {
  return <div className="flex-1" />
}

/* ── cn — inlined (no @/lib/utils dep; presentational stays self-contained) ── */

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}
