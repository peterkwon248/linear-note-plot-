"use client"

import React, { useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { StatusShapeIcon } from "@/components/status-icon"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { BookKindIcon } from "@/components/property-chips"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { isWikiStub } from "@/lib/wiki-utils"
import { getBookKind } from "@/lib/view-engine/use-books-view"
import { shortRelative } from "@/lib/format-utils"
import { buildAttachmentDeleteWarning } from "@/lib/extract-attachment-refs"
import { useT } from "@/lib/i18n"
import type {
  Note,
  WikiArticle,
  Book,
  Tag,
  Label,
  NoteTemplate,
  Reference,
  Attachment,
  NoteStatus,
} from "@/lib/types"
import {
  RotateCcw as ArrowCounterClockwise,
  Trash2 as Trash,
  BookOpen,
  Hash,
  Tag as TagIcon,
  FileText,
  Bookmark as BookmarkSimple,
  Paperclip,
  Check as PhCheck,
  Minus as PhMinus,
  X as PhX,
} from "lucide-react"

type EntityKind = "note" | "wiki" | "book" | "tag" | "label" | "template" | "reference" | "attachment"

const ENTITY_KIND_KEY: Record<EntityKind, string> = {
  note: "trash.kind.note",
  wiki: "trash.kind.wiki",
  book: "trash.kind.book",
  tag: "trash.kind.tag",
  label: "trash.kind.label",
  template: "trash.kind.template",
  reference: "trash.kind.reference",
  attachment: "trash.kind.attachment",
}

const SECTION_TITLE_KEY: Record<EntityKind, string> = {
  note: "trash.section.notes",
  wiki: "trash.section.wikis",
  book: "trash.section.books",
  tag: "trash.section.tags",
  label: "trash.section.labels",
  template: "trash.section.templates",
  reference: "trash.section.references",
  attachment: "trash.section.attachments",
}

function EntityKindIcon({
  kind,
  noteStatus,
  wikiIsStub,
  bookKind,
  color,
}: {
  kind: EntityKind
  noteStatus?: NoteStatus
  wikiIsStub?: boolean
  bookKind?: "manual" | "smart" | "hybrid"
  color?: string | null
}) {
  // 2026-05-17 — entity-native icon (사용자 시그널 "엔티티와 그 내부 아이콘
  // 까지 고려해서 표시"). 영구 룰: Plot 어디서나 entity 본질 icon 일관.
  if (kind === "note" && noteStatus) {
    return <StatusShapeIcon status={noteStatus} size={14} />
  }
  if (kind === "wiki") {
    return wikiIsStub ? (
      <IconWikiStub size={14} style={{ color: WIKI_STATUS_HEX.stub }} className="shrink-0" />
    ) : (
      <IconWikiArticle size={14} style={{ color: WIKI_STATUS_HEX.article }} className="shrink-0" />
    )
  }
  if (kind === "book") {
    return <BookKindIcon kind={bookKind ?? "manual"} size={14} />
  }
  if (kind === "tag" || kind === "label") {
    // Color dot (tag/label native pattern). color 없으면 muted dot.
    return (
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-subtle"
        style={{ backgroundColor: color ?? "#6b7280" }}
      />
    )
  }
  const cls = "shrink-0 text-muted-foreground"
  switch (kind) {
    case "template": return <FileText size={14} strokeWidth={2} className={cls} />
    case "reference": return <BookmarkSimple size={14} strokeWidth={2} className={cls} />
    case "attachment": return <Paperclip size={14} strokeWidth={2} className={cls} />
    default: return <FileText size={14} strokeWidth={2} className={cls} />
  }
}

interface TrashRowItem {
  id: string
  label: string
  color?: string | null
  trashedAt?: string | null
  noteStatus?: NoteStatus
  /** 2026-05-17 — entity-native icon 분기용. wiki는 stub/article 구분,
   *  book은 manual/smart/hybrid kind 표시 (영구 룰 Wiki Stub vs Article badge
   *  / Book Kind Icon). */
  wikiIsStub?: boolean
  bookKind?: "manual" | "smart" | "hybrid"
}

function TrashRow({
  kind,
  item,
  isSelected,
  selectionActive,
  onToggleSelect,
  onRestore,
  onDelete,
}: {
  kind: EntityKind
  item: TrashRowItem
  isSelected: boolean
  selectionActive: boolean
  onToggleSelect: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  const t = useT()
  return (
    <div className={cn(
      "group flex items-center border-b border-border px-5 py-2.5 transition-colors",
      isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-hover-bg",
    )}>
      {/* Checkbox — notes/wiki parity (hover-only unless selected) */}
      <div
        className={cn(
          "w-8 shrink-0 flex items-center justify-center cursor-pointer",
          selectionActive || isSelected ? "visible" : "invisible group-hover:visible",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
      >
        <div className={cn(
          "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm",
          isSelected
            ? "bg-accent border-accent"
            : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
        )}>
          {isSelected && <PhCheck size={10} strokeWidth={2.5} className="text-accent-foreground" />}
        </div>
      </div>
      <div className="w-6 shrink-0 flex items-center justify-center">
        <EntityKindIcon
          kind={kind}
          noteStatus={item.noteStatus}
          wikiIsStub={item.wikiIsStub}
          bookKind={item.bookKind}
          color={item.color}
        />
      </div>
      <div className="w-24 shrink-0 text-2xs uppercase tracking-wide text-muted-foreground">
        {t(ENTITY_KIND_KEY[kind])}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-note font-medium text-foreground truncate">{item.label}</span>
        {item.color ? (
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
            title={item.color}
          />
        ) : null}
      </div>
      <div className="w-32 shrink-0 text-right text-note text-muted-foreground">
        {item.trashedAt ? shortRelative(item.trashedAt) : "—"}
      </div>
      <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
          title={t("trash.action.restore")}
        >
          <ArrowCounterClockwise size={14} strokeWidth={2} />
          {t("trash.action.restore")}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-note text-destructive transition-colors hover:bg-destructive/10"
          title={t("trash.action.delete_permanently")}
        >
          <Trash size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

/**
 * Unified trash view that lists trashed items across **all** entity kinds in
 * one place. Mounted in NotesTable when `isTrashView && trashFilter === "all"`.
 *
 * Pattern mirrors the per-entity TrashEntityList inside notes-table.tsx but
 * adds Notes/Wiki coverage (which the older partial branch didn't display).
 */
export function TrashAllView() {
  const t = useT()
  // Multi-select state — keyed by `${kind}-${id}` since IDs are scoped per
  // entity kind (e.g. note "tag-1" and tag "tag-1" both can exist).
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const selectionActive = selectedKeys.size > 0
  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), [])

  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const storeBooks = usePlotStore((s) => s.books)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const storeTemplates = usePlotStore((s) => s.templates)
  const storeReferences = usePlotStore((s) => s.references)
  const storeAttachments = usePlotStore((s) => s.attachments)
  // 2026-05-17 — Display panel grouping 설정 읽기. notes-table-view.tsx에서
  // trash context로 mount되므로 viewStateByContext["trash"].groupBy 사용.
  // "none" 이외 모든 값은 기본 KIND 섹션 (현재 패턴 유지).
  const trashGroupBy = usePlotStore(
    (s) => (s.viewStateByContext as Record<string, { groupBy?: string }>)?.trash?.groupBy ?? "kind",
  )

  // entity-specific store actions (stable refs via Zustand)
  const toggleTrash = usePlotStore((s) => s.toggleTrash)
  const deleteNote = usePlotStore((s) => s.deleteNote)
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)
  const deleteWikiArticle = usePlotStore((s) => s.deleteWikiArticle)
  const restoreBook = usePlotStore((s) => s.restoreBook)
  const permanentlyDeleteBook = usePlotStore((s) => s.permanentlyDeleteBook)
  const restoreTag = usePlotStore((s) => s.restoreTag)
  const permanentlyDeleteTag = usePlotStore((s) => s.permanentlyDeleteTag)
  const restoreLabel = usePlotStore((s) => s.restoreLabel)
  const permanentlyDeleteLabel = usePlotStore((s) => s.permanentlyDeleteLabel)
  const restoreTemplate = usePlotStore((s) => s.restoreTemplate)
  const permanentlyDeleteTemplate = usePlotStore((s) => s.permanentlyDeleteTemplate)
  const restoreReference = usePlotStore((s) => s.restoreReference)
  const permanentlyDeleteReference = usePlotStore((s) => s.permanentlyDeleteReference)
  const restoreAttachment = usePlotStore((s) => s.restoreAttachment)
  const permanentlyDeleteAttachment = usePlotStore((s) => s.permanentlyDeleteAttachment)

  const sections = useMemo(() => {
    // Note slice and WikiArticle slice are separate entities. Notes section
    // shows the full Note slice (any noteType); Wiki Articles section shows
    // WikiArticle entities (the wiki-articles slice).
    const trashedNotes = notes.filter((n: Note) => n.trashed)
    const trashedWikis = wikiArticles.filter((w: WikiArticle) => (w as any).trashed)
    const trashedBooks = (storeBooks || []).filter((b: Book) => b.trashed)
    const trashedTags = tags.filter((t: Tag) => t.trashed)
    const trashedLabels = labels.filter((l: Label) => l.trashed)
    const trashedTemplates = storeTemplates.filter((t: NoteTemplate) => t.trashed)
    const trashedRefs = Object.values(storeReferences || {}).filter((r: Reference) => r.trashed)
    const trashedFiles = (storeAttachments || []).filter((a: Attachment) => a.trashed)

    const untitled = t("common.untitled")
    const list: Array<{ kind: EntityKind; items: TrashRowItem[] }> = [
      {
        kind: "note",
        items: trashedNotes.map((n) => ({
          id: n.id,
          label: n.title || untitled,
          trashedAt: n.trashedAt ?? null,
          noteStatus: n.status,
        })),
      },
      {
        kind: "wiki",
        items: trashedWikis.map((w) => ({
          id: w.id,
          label: w.title || untitled,
          trashedAt: (w as any).trashedAt ?? null,
          wikiIsStub: isWikiStub(w),
        })),
      },
      {
        kind: "book",
        items: trashedBooks.map((b) => ({
          id: b.id,
          label: b.title || untitled,
          trashedAt: b.trashedAt ?? null,
          bookKind: getBookKind(b),
        })),
      },
      {
        kind: "tag",
        items: trashedTags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          color: tag.color,
          trashedAt: tag.trashedAt ?? null,
        })),
      },
      {
        kind: "label",
        items: trashedLabels.map((l) => ({
          id: l.id,
          label: l.name,
          color: l.color,
          trashedAt: l.trashedAt ?? null,
        })),
      },
      {
        kind: "template",
        items: trashedTemplates.map((tpl) => ({
          id: tpl.id,
          label: tpl.name || untitled,
          trashedAt: tpl.trashedAt ?? null,
        })),
      },
      {
        kind: "reference",
        items: trashedRefs.map((r) => ({
          id: r.id,
          label: r.title || untitled,
          trashedAt: r.trashedAt ?? null,
        })),
      },
      {
        kind: "attachment",
        items: trashedFiles.map((a) => ({
          id: a.id,
          label: a.name || untitled,
          trashedAt: a.trashedAt ?? null,
        })),
      },
    ]
    return list
  }, [notes, wikiArticles, storeBooks, tags, labels, storeTemplates, storeReferences, storeAttachments, t])

  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0)

  // Silent variants — used by bulk handlers that emit a single aggregated toast.
  const handleRestoreSilent = (kind: EntityKind, id: string) => {
    switch (kind) {
      case "note": toggleTrash(id); break
      case "wiki": updateWikiArticle(id, { trashed: false, trashedAt: null } as any); break
      case "book": restoreBook(id); break
      case "tag": restoreTag(id); break
      case "label": restoreLabel(id); break
      case "template": restoreTemplate(id); break
      case "reference": restoreReference(id); break
      case "attachment": restoreAttachment(id); break
    }
  }

  const handleDeleteSilent = (kind: EntityKind, id: string) => {
    switch (kind) {
      case "note": deleteNote(id); break
      case "wiki": deleteWikiArticle(id); break
      case "book": permanentlyDeleteBook(id); break
      case "tag": permanentlyDeleteTag(id); break
      case "label": permanentlyDeleteLabel(id); break
      case "template": permanentlyDeleteTemplate(id); break
      case "reference": permanentlyDeleteReference(id); break
      case "attachment": permanentlyDeleteAttachment(id); break
    }
  }

  const handleRestore = (kind: EntityKind, id: string, label: string) => {
    handleRestoreSilent(kind, id)
    toast(
      t("trash.toast.restored")
        .replace("{kind}", t(ENTITY_KIND_KEY[kind]).toLowerCase())
        .replace("{label}", label),
    )
  }

  const handleDelete = (kind: EntityKind, id: string, label: string) => {
    // file-entity-prd §5: surface attachment usage in the confirm prompt so
    // the user knows which notes/wikis will get dangling references.
    let message = t("trash.confirm.delete").replace("{label}", label)
    if (kind === "attachment") {
      const s = usePlotStore.getState()
      const warning = buildAttachmentDeleteWarning(id, label, s.notes, s.wikiArticles)
      if (warning) message = warning
    }
    if (!window.confirm(message)) return
    handleDeleteSilent(kind, id)
    toast(
      t("trash.toast.deleted")
        .replace("{kind}", t(ENTITY_KIND_KEY[kind]).toLowerCase())
        .replace("{label}", label),
    )
  }

  // Build a quick lookup so the bulk-action bar can resolve a selection
  // back to (kind, id, label) without re-iterating every entity slice.
  // 2026-05-25 — hooks moved above the empty-state early return so that
  // toggling totalCount from >0 to 0 (e.g. restoring the last item) does
  // not change the hook count between renders. React would otherwise
  // throw "Rendered fewer hooks than expected".
  const keyLookup = useMemo(() => {
    const map = new Map<string, { kind: EntityKind; id: string; label: string }>()
    for (const { kind, items } of sections) {
      for (const it of items) {
        map.set(`${kind}-${it.id}`, { kind, id: it.id, label: it.label })
      }
    }
    return map
  }, [sections])

  // Select-all state — drives header checkbox tri-state (none/some/all).
  const allKeys = useMemo(() => Array.from(keyLookup.keys()), [keyLookup])
  const isAllSelected = allKeys.length > 0 && selectedKeys.size === allKeys.length
  const isSomeSelected = selectedKeys.size > 0 && !isAllSelected
  const toggleAll = useCallback(() => {
    setSelectedKeys((prev) => (prev.size === allKeys.length ? new Set() : new Set(allKeys)))
  }, [allKeys])

  if (totalCount === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <div>
          <Trash className="mx-auto mb-3 text-muted-foreground/70" size={40} strokeWidth={2} />
          <p className="text-ui text-muted-foreground">{t("trash.empty")}</p>
        </div>
      </div>
    )
  }

  const handleBulkRestore = () => {
    const targets = Array.from(selectedKeys)
      .map((k) => keyLookup.get(k))
      .filter((x): x is { kind: EntityKind; id: string; label: string } => !!x)
    if (targets.length === 0) return
    for (const target of targets) handleRestoreSilent(target.kind, target.id)
    toast.success(t("trash.toast.bulk_restored").replace("{count}", String(targets.length)))
    clearSelection()
  }

  const handleBulkDelete = () => {
    if (
      !window.confirm(t("trash.confirm.bulk_delete").replace("{count}", String(selectedKeys.size)))
    )
      return
    const targets = Array.from(selectedKeys)
      .map((k) => keyLookup.get(k))
      .filter((x): x is { kind: EntityKind; id: string; label: string } => !!x)
    for (const target of targets) handleDeleteSilent(target.kind, target.id)
    toast.success(t("trash.toast.bulk_deleted").replace("{count}", String(targets.length)))
    clearSelection()
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Column header */}
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-background px-5 py-2">
        {/* Select-all checkbox — tri-state (none / some / all). Lets the
            user pick everything in trash for bulk Restore / Delete forever. */}
        <div
          className="w-8 shrink-0 flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            toggleAll()
          }}
          title={isAllSelected ? t("trash.action.deselect_all") : t("trash.action.select_all")}
        >
          <div
            className={cn(
              "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm",
              isAllSelected || isSomeSelected
                ? "bg-accent border-accent"
                : "bg-card border-zinc-400 dark:border-zinc-600 hover:border-zinc-500",
            )}
            role="checkbox"
            aria-checked={isAllSelected ? true : isSomeSelected ? "mixed" : false}
            aria-label={
              isAllSelected
                ? t("trash.action.deselect_all_aria")
                : t("trash.action.select_all_aria")
            }
          >
            {isAllSelected ? (
              <PhCheck size={10} strokeWidth={2.5} className="text-accent-foreground" />
            ) : isSomeSelected ? (
              <PhMinus size={10} strokeWidth={2.5} className="text-accent-foreground" />
            ) : null}
          </div>
        </div>
        <div className="w-6 shrink-0" />
        <div className="w-24 shrink-0 text-2xs uppercase tracking-wide font-medium text-foreground/80">
          {t("trash.header.kind")}
        </div>
        <div className="flex-1 text-note font-medium text-foreground/80">{t("trash.header.name")}</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">{t("trash.header.trashed")}</div>
        <div className="w-32 shrink-0 text-right text-note font-medium text-foreground/80">{t("trash.header.actions")}</div>
      </div>
      {/* 2026-05-17 — Display panel grouping 설정 정합 (사용자 시그널 "노
          그룹핑 상태인데 왜 트래쉬에서 카인드별로 리스트업"). trash context
          viewState의 groupBy 읽어 분기:
            - "kind" (default) → KIND 섹션 헤더 + 그룹
            - "none" 또는 기타 → flat 리스트
          영구 룰: Display panel 설정은 모든 view에 일관 적용. */}
      {trashGroupBy === "none" ? (
        // Flat list — sections를 평탄화, KIND 헤더 없음.
        sections.flatMap(({ kind, items }) =>
          items.map((item) => {
            const key = `${kind}-${item.id}`
            return (
              <TrashRow
                key={key}
                kind={kind}
                item={item}
                isSelected={selectedKeys.has(key)}
                selectionActive={selectionActive}
                onToggleSelect={() => toggleSelect(key)}
                onRestore={() => handleRestore(kind, item.id, item.label)}
                onDelete={() => handleDelete(kind, item.id, item.label)}
              />
            )
          })
        )
      ) : (
        sections.map(({ kind, items }) => {
          if (items.length === 0) return null
          return (
            <React.Fragment key={kind}>
              <div className="sticky top-[33px] z-[9] flex items-center border-b border-border bg-secondary/30 px-5 py-1.5">
                <span className="text-2xs uppercase tracking-wide font-medium text-muted-foreground">
                  {t(SECTION_TITLE_KEY[kind])}
                </span>
                <span className="ml-2 tabular-nums text-2xs text-foreground/50">{items.length}</span>
              </div>
              {items.map((item) => {
                const key = `${kind}-${item.id}`
                return (
                  <TrashRow
                    key={key}
                    kind={kind}
                    item={item}
                    isSelected={selectedKeys.has(key)}
                    selectionActive={selectionActive}
                    onToggleSelect={() => toggleSelect(key)}
                    onRestore={() => handleRestore(kind, item.id, item.label)}
                    onDelete={() => handleDelete(kind, item.id, item.label)}
                  />
                )
              })}
            </React.Fragment>
          )
        })
      )}
      {/* Floating bulk action bar — mirrors Notes/Wiki list selection UX. */}
      {selectionActive && (
        <div className="sticky bottom-4 z-20 mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur">
          <span className="text-note text-muted-foreground tabular-nums">
            {t("trash.selected_count").replace("{count}", String(selectedKeys.size))}
          </span>
          <button
            onClick={handleBulkRestore}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note text-foreground transition-colors hover:bg-hover-bg"
          >
            <ArrowCounterClockwise size={14} strokeWidth={2} />
            {t("trash.action.restore")}
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash size={14} strokeWidth={2} />
            {t("trash.action.delete_forever")}
          </button>
          <button
            onClick={clearSelection}
            className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title={t("trash.action.clear_selection")}
          >
            <PhX size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
