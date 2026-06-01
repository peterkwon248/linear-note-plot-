"use client"

/**
 * Sidebar — pure presentational (preview-first redesign scaffolding).
 *
 * Faithful port of the live sidebar god:
 *   - shell + nav primitives:  components/linear-sidebar.tsx (NavLink L78, Section L189)
 *   - Notes context:           linear-sidebar.tsx L817–1086
 *   - Home context:            linear-sidebar.tsx L2009–2084
 *   - footer:                  linear-sidebar.tsx L2090–2109
 *
 * Every className is copied verbatim from that file — especially the
 * design-system token classes (`.a-sidebar`, `.a-sb-link`, `.a-sb-link__count`,
 * `.a-sb-section`, `.a-sb-foot`, `data-active-space`, `data-active`). Store
 * reads / router / i18n are replaced by the `SidebarViewModel` + per-context
 * `SidebarContextModel` props (see ./sidebar.types.ts).
 *
 * No usePlotStore / useRouter / usePathname / useT / data-hook imports — this is
 * the unit handed to Open Design. The only non-prop imports are pure visual ones
 * (icons via lucide, `cn`). StatusShapeIcon / entity glyphs are NOT imported
 * here; the live container builds those leading glyphs from store data, so the
 * mock supplies them as ready-made ReactNodes on each row.
 *
 * ── Context-generic ─────────────────────────────────────────────────────────
 * `SidebarView` renders the shared shell (header + global Inbox + footer) and
 * delegates the per-space body to `<SidebarContextBody />`, which renders any
 * context from a `SidebarContextModel`. This scaffolding wires **Notes** and
 * **Home**; the remaining 5 contexts (Wiki / Calendar / Ontology / Library /
 * Books) are the SAME skeleton with different rows — to add one, build its
 * `SidebarContextModel` in the mock and pass it as `context`. No new view code
 * is needed (그 5개는 동일 패턴으로 후속 추가 — 지금 포팅 X).
 */

import { useState } from "react"
import {
  ChevronDown as CaretDown,
  ChevronRight as CaretRight,
  ArrowRight,
  PanelLeft as SidebarSimple,
  Plus,
  CircleHelp,
  Trash2,
  Folder as FolderIcon,
} from "lucide-react"
import type {
  SidebarViewModel,
  SidebarViewCallbacks,
  SidebarContextModel,
  SidebarNavLink,
  SidebarFoldersSection,
  SidebarEntityRow,
} from "./sidebar.types"

export function SidebarView({
  vm,
  context,
  callbacks = {},
}: {
  vm: SidebarViewModel
  /** The active context body (Notes / Home / …) rendered below the Inbox. */
  context: SidebarContextModel
  callbacks?: SidebarViewCallbacks
}) {
  return (
    <aside
      className="a-sidebar group/sidebar relative h-full w-full shrink-0 select-none"
      data-active-space={context.space}
    >
      {/* §10 — Sidebar header row. Current space name (left) + collapse toggle
       *  (right, hover-reveal). (linear-sidebar.tsx L789–801) */}
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 px-2.5 pt-0.5">
        <span className="truncate text-xs font-medium text-muted-foreground/80">
          {vm.spaceLabel}
        </span>
        <button
          onClick={() => callbacks.onCollapse?.()}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 opacity-0 transition duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-hover-bg hover:text-foreground group-hover/sidebar:opacity-100"
          aria-label="Collapse sidebar"
          title="Collapse sidebar  ⌘⇧F"
        >
          <SidebarSimple size={16} strokeWidth={1.75} />
        </button>
      </header>

      {/* Navigation (linear-sidebar.tsx L804–2085) */}
      <nav className="flex-1 overflow-y-auto px-2.5 pt-1 pb-2">
        {/* ── Inbox (global) — pinned to sidebar top across all spaces. */}
        <div className="space-y-px mb-2">
          <NavLinkView link={vm.inbox} onClick={callbacks.onOpenInbox} />
        </div>

        <SidebarContextBody context={context} callbacks={callbacks} />
      </nav>

      {/* Footer — Help "?" + Trash (linear-sidebar.tsx L2090–2109). */}
      <div className="a-sb-foot">
        <button
          type="button"
          onClick={() => callbacks.onOpenHelp?.()}
          className="a-sb-foot__btn"
          title={vm.helpLabel}
        >
          <CircleHelp size={16} strokeWidth={1.5} />
          <span className="flex-1 text-left">{vm.helpLabel}</span>
          <span className="a-sb-foot__hint">{vm.helpHint}</span>
        </button>
        <button
          type="button"
          onClick={() => callbacks.onOpenTrash?.()}
          className="a-sb-foot__icon"
          title={vm.trashLabel}
          aria-label={vm.trashLabel}
        >
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}

/* ── Context body (context-generic) ───────────────────────────────────────────
 *  Renders any context from its model. Notes uses every slot; Home uses only
 *  topNav (Overview) + pinned + recent. The order mirrors the live file:
 *  topNav → Pinned → Folders → More → Recent.                                  */

function SidebarContextBody({
  context,
  callbacks,
}: {
  context: SidebarContextModel
  callbacks: SidebarViewCallbacks
}) {
  return (
    <>
      {/* Top status/kind nav block — bare links, no section header. */}
      {context.topNav.length > 0 && (
        <div className="space-y-px">
          {context.topNav.map((link) => (
            <NavLinkView key={link.id} link={link} onClick={callbacks.onOpenNav} />
          ))}
        </div>
      )}

      {/* Pinned section (placed at top per Linear/Notion 표준). */}
      {context.pinned && context.pinned.rows.length > 0 && (
        <SectionView title={context.pinned.label}>
          {context.pinned.rows.map((row) => (
            <EntityRowView
              key={row.id}
              row={row}
              onClick={() => callbacks.onOpenEntity?.(row.id)}
            />
          ))}
        </SectionView>
      )}

      {/* Folders section (omitted for contexts without folders, e.g. Home). */}
      {context.folders && (
        <FoldersSectionView
          section={context.folders}
          onOpenFolder={callbacks.onOpenFolder}
          onNewFolder={callbacks.onNewFolder}
          onShowAll={callbacks.onShowAllFolders}
        />
      )}

      {/* More section. */}
      {context.more && context.more.rows.length > 0 && (
        <SectionView title={context.more.label}>
          {context.more.rows.map((row) => (
            <EntityRowView
              key={row.id}
              row={row}
              onClick={() => callbacks.onOpenNav?.(row.id)}
            />
          ))}
        </SectionView>
      )}

      {/* Recent section. */}
      {context.recent && context.recent.rows.length > 0 && (
        <SectionView title={context.recent.label}>
          {context.recent.rows.map((row) => (
            <EntityRowView
              key={row.id}
              row={row}
              onClick={() => callbacks.onOpenEntity?.(row.id)}
            />
          ))}
        </SectionView>
      )}
    </>
  )
}

/* ── Nav primitives (linear-sidebar.tsx NavLink L78 / Section L189) ─────────── */

/**
 * Pure `NavLink`. Live renders a `<button>` (sidebar routes) or `<Link>`; here
 * it is always a `<button>` with an `onClick` callback. The inner markup —
 * wrapper span + truncating label + `.a-sb-link__count` — is verbatim.
 */
function NavLinkView({
  link,
  onClick,
}: {
  link: SidebarNavLink
  onClick?: (id: string) => void
}) {
  return (
    <button
      onClick={() => onClick?.(link.id)}
      className="a-sb-link"
      data-active={link.active ? "true" : undefined}
    >
      <span className="flex shrink-0 items-center justify-center w-5 h-5">
        {link.icon}
      </span>
      <span className="truncate text-left flex-1">{link.label}</span>
      {link.count !== undefined && (
        <span className="a-sb-link__count tabular-nums">{link.count}</span>
      )}
    </button>
  )
}

/**
 * Pure `Section` — collapsible header + body. UI-local `open` state is allowed
 * (it's view-state, not store data). `onHeaderClick` renders the hover-reveal
 * "view all" arrow exactly as the live primitive.
 */
function SectionView({
  title,
  children,
  trailing,
  count,
  defaultOpen = true,
  onHeaderClick,
  active = false,
}: {
  title: string
  children: React.ReactNode
  trailing?: React.ReactNode
  count?: number
  defaultOpen?: boolean
  onHeaderClick?: () => void
  active?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="a-sb-section">
      <div className="a-sb-section__head group">
        <button
          onClick={() => setOpen(!open)}
          className={`flex flex-1 items-center gap-1.5 transition-colors ${
            active ? "text-sidebar-active-text" : "hover:text-sidebar-foreground"
          }`}
        >
          <span>{title}</span>
          {count !== undefined && (
            <span className="a-sb-section__hint">{count}</span>
          )}
          {open ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        {onHeaderClick && (
          <button
            onClick={onHeaderClick}
            className={`rounded p-0.5 transition-all duration-150 ${
              active
                ? "opacity-100 text-sidebar-active-text"
                : "opacity-0 group-hover:opacity-100 text-sidebar-muted hover:text-sidebar-foreground"
            }`}
            title={`View all ${title.toLowerCase()}`}
          >
            <ArrowRight size={12} />
          </button>
        )}
        {trailing}
      </div>
      {open && <div className="mt-1 space-y-px">{children}</div>}
    </div>
  )
}

/**
 * Pinned / Recent entity row. Mirrors the live inline `<button className="a-sb-link">`
 * used in the Pinned/Recent sections — wrapper-span glyph (supplied by mock) +
 * truncating title + optional trailing count (books).
 */
function EntityRowView({
  row,
  onClick,
}: {
  row: SidebarEntityRow
  onClick: () => void
}) {
  return (
    <button
      draggable={row.draggable}
      onClick={onClick}
      className="a-sb-link"
    >
      <span className="flex shrink-0 items-center justify-center w-5 h-5">
        {row.icon}
      </span>
      <span className="truncate text-left flex-1">{row.title}</span>
      {row.count !== undefined && (
        <span className="a-sb-link__count tabular-nums">{row.count}</span>
      )}
    </button>
  )
}

/**
 * Folders section — `Section` with a trailing "+" (new folder) and the
 * "+N more" / "Show less" auto-collapse affordance. UI-local `showAll` toggles
 * the more/less label (live: `showAllFolders` store-UI state; here it's pure
 * view-state because the mock already supplies the visible rows + `hiddenCount`).
 */
function FoldersSectionView({
  section,
  onOpenFolder,
  onNewFolder,
  onShowAll,
}: {
  section: SidebarFoldersSection
  onOpenFolder?: (id: string) => void
  onNewFolder?: () => void
  onShowAll?: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  return (
    <SectionView
      title={section.label}
      trailing={
        <button
          onClick={() => onNewFolder?.()}
          className="flex items-center justify-center h-5 w-5 rounded hover:bg-sidebar-hover text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="New note folder"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      }
    >
      {section.folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onOpenFolder?.(folder.id)}
          className="a-sb-link"
          data-active={folder.active ? "true" : undefined}
        >
          <span className="flex shrink-0 items-center justify-center w-5 h-5">
            <FolderIcon size={20} strokeWidth={1.5} />
          </span>
          <span className="truncate text-left flex-1">{folder.name}</span>
          {folder.count !== undefined && folder.count > 0 && (
            <span className="a-sb-link__count tabular-nums">{folder.count}</span>
          )}
        </button>
      ))}
      {section.hiddenCount > 0 && !showAll && (
        <button
          onClick={() => {
            setShowAll(true)
            onShowAll?.()
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          {section.hiddenCount} more
        </button>
      )}
      {showAll && section.hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-note text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </SectionView>
  )
}

// Folder glyph: live uses `<IconFolder size={20} />` (= lucide `Folder` @
// strokeWidth 1.5, per components/plot-icons.tsx). Inlined as the pure lucide
// `Folder` so this presentational stays self-contained (no Plot icon-registry
// import), exactly mirroring the home example's lucide-only icon usage.
