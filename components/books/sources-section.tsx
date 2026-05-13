"use client"

/**
 * SourcesSection — Smart Book sources management UI (Phase 5 / all 5 kinds).
 *
 * Embedded in BookDetailPage between description and items list. Shows
 * current `book.smartSources` (folder / category / tag / label / sticker)
 * with add/remove controls. Auto items appear in the main items list via
 * `resolveBookItems` (see `lib/books/resolver.ts`).
 *
 * Source mapping:
 *   - folder (kind=note)  → notes (Phase A)
 *   - category            → wiki articles (Phase B)
 *   - tag                 → notes + wikis cross-entity (Phase C)
 *   - label               → notes only (Phase D)
 *   - sticker             → note/wiki members (Phase E, filtered from 7-kind)
 *
 * Spec: `.omc/plans/smart-book-prd.md` §5.5 + Phase B-E addenda.
 */

import { useState, useMemo, type ReactNode } from "react"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import { resolveBookItems } from "@/lib/books/resolver"
import type { BookItem } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Folder as PhFolder } from "@phosphor-icons/react/dist/ssr/Folder"
import { BookOpen as PhBookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"
import { Hash as PhHash } from "@phosphor-icons/react/dist/ssr/Hash"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Sticker as PhSticker } from "@phosphor-icons/react/dist/ssr/Sticker"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { cn } from "@/lib/utils"
import type { AutoSourceKind } from "@/lib/types"

interface SourcesSectionProps {
  bookId: string
}

type TabKey = "folder" | "category" | "tag" | "label" | "sticker"

export function SourcesSection({ bookId }: SourcesSectionProps) {
  const books = usePlotStore((s) => s.books)
  const folders = usePlotStore((s) => s.folders)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const tags = usePlotStore((s) => s.tags)
  const labels = usePlotStore((s) => s.labels)
  const stickers = usePlotStore((s) => s.stickers)
  const addSmartSource = usePlotStore((s) => s.addSmartSource)
  const removeSmartSource = usePlotStore((s) => s.removeSmartSource)
  const updateBook = usePlotStore((s) => s.updateBook)
  const clearAutoUserOrder = usePlotStore((s) => s.clearAutoUserOrder)

  const book = books.find((b) => b.id === bookId)
  const sources = book?.smartSources ?? []

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("folder")
  const [search, setSearch] = useState("")
  // v2 Phase K follow-up — bulk select. Cmd/Ctrl+Click on a candidate
  // toggles it in the selection set; the footer "Add N selected" button
  // adds all at once. Single click without modifier is immediate add
  // (preserves existing UX for one-off picks).
  const [bulkSelected, setBulkSelected] = useState<Map<string, { kind: AutoSourceKind; refId: string; name: string }>>(new Map())
  // bulkMode 활성 시 candidate click이 toggle 동작. 비활성 시 기존
  // immediate add (single one-off pick). 사용자 explicit trigger.
  const [bulkMode, setBulkMode] = useState(false)
  const toggleBulk = (kind: AutoSourceKind, refId: string, name: string) => {
    const key = `${kind}::${refId}`
    setBulkSelected((prev) => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, { kind, refId, name })
      return next
    })
  }
  const clearBulk = () => setBulkSelected(new Map())

  // Resolved source entries for display (skip stale refs).
  type ResolvedEntry =
    | { kind: "folder"; refId: string; name: string; icon: ReactNode }
    | { kind: "category"; refId: string; name: string; color: string }
    | { kind: "tag"; refId: string; name: string; color: string | null }
    | { kind: "label"; refId: string; name: string; color: string }
    | { kind: "sticker"; refId: string; name: string; color: string }

  const resolvedSources = useMemo<ResolvedEntry[]>(() => {
    const out: ResolvedEntry[] = []
    for (const s of sources) {
      if (s.kind === "folder") {
        const folder = folders.find((f) => f.id === s.refId)
        if (folder) {
          out.push({
            kind: "folder",
            refId: s.refId,
            name: folder.name,
            icon: <PhFolder size={14} weight="regular" className="text-muted-foreground" />,
          })
        }
      } else if (s.kind === "category") {
        const c = wikiCategories.find((c) => c.id === s.refId)
        if (c) out.push({ kind: "category", refId: s.refId, name: c.name, color: c.color })
      } else if (s.kind === "tag") {
        const t = tags.find((t) => t.id === s.refId)
        if (t) out.push({ kind: "tag", refId: s.refId, name: t.name, color: t.color })
      } else if (s.kind === "label") {
        const l = labels.find((l) => l.id === s.refId)
        if (l) out.push({ kind: "label", refId: s.refId, name: l.name, color: l.color })
      } else if (s.kind === "sticker") {
        const st = stickers?.find((st) => st.id === s.refId)
        if (st) out.push({ kind: "sticker", refId: s.refId, name: st.name, color: st.color })
      }
    }
    return out
  }, [sources, folders, wikiCategories, tags, labels, stickers])

  // O(1) lookups for "already added" guard, scoped per source kind.
  const existingByKind = useMemo(() => {
    const map: Record<AutoSourceKind, Set<string>> = {
      folder: new Set(),
      category: new Set(),
      tag: new Set(),
      label: new Set(),
      sticker: new Set(),
    }
    for (const s of sources) map[s.kind].add(s.refId)
    return map
  }, [sources])

  // Manual ref-id sets for "in-book" preview counts.
  const manualNoteRefIds = useMemo(
    () =>
      new Set(
        (book?.items ?? [])
          .filter((i): i is Extract<typeof i, { kind: "note" }> => i.kind === "note")
          .map((i) => i.refId),
      ),
    [book],
  )
  const manualWikiRefIds = useMemo(
    () =>
      new Set(
        (book?.items ?? [])
          .filter((i): i is Extract<typeof i, { kind: "wiki" }> => i.kind === "wiki")
          .map((i) => i.refId),
      ),
    [book],
  )

  // Per-tab candidate builders ─────────────────────────────────────────

  const q = search.toLowerCase().trim()
  const matches = (name: string) => !q || name.toLowerCase().includes(q)

  const folderCandidates = useMemo(() => {
    return folders
      .filter((f) => f.kind === "note" && !existingByKind.folder.has(f.id) && matches(f.name))
      .map((folder) => {
        const folderNotes = notes.filter(
          (n) => n.folderIds.includes(folder.id) && !n.trashed,
        )
        const inBook = folderNotes.filter((n) => manualNoteRefIds.has(n.id)).length
        return { folder, total: folderNotes.length, inBook }
      })
      .sort((a, b) => a.folder.name.localeCompare(b.folder.name))
  }, [folders, existingByKind.folder, q, notes, manualNoteRefIds])

  const categoryCandidates = useMemo(() => {
    return wikiCategories
      .filter((c) => !existingByKind.category.has(c.id) && matches(c.name))
      .map((category) => {
        const catWikis = wikiArticles.filter(
          (w) =>
            w.categoryIds?.includes(category.id) &&
            !(w as { trashed?: boolean }).trashed,
        )
        const inBook = catWikis.filter((w) => manualWikiRefIds.has(w.id)).length
        return { category, total: catWikis.length, inBook }
      })
      .sort((a, b) => a.category.name.localeCompare(b.category.name))
  }, [wikiCategories, existingByKind.category, q, wikiArticles, manualWikiRefIds])

  const tagCandidates = useMemo(() => {
    return tags
      .filter((t) => !t.trashed && !existingByKind.tag.has(t.id) && matches(t.name))
      .map((tag) => {
        const taggedNotes = notes.filter(
          (n) => n.tags?.includes(tag.id) && !n.trashed,
        )
        const taggedWikis = wikiArticles.filter(
          (w) =>
            w.tags?.includes(tag.id) && !(w as { trashed?: boolean }).trashed,
        )
        const total = taggedNotes.length + taggedWikis.length
        const inBook =
          taggedNotes.filter((n) => manualNoteRefIds.has(n.id)).length +
          taggedWikis.filter((w) => manualWikiRefIds.has(w.id)).length
        return { tag, total, inBook }
      })
      .sort((a, b) => a.tag.name.localeCompare(b.tag.name))
  }, [tags, existingByKind.tag, q, notes, wikiArticles, manualNoteRefIds, manualWikiRefIds])

  const labelCandidates = useMemo(() => {
    return labels
      .filter((l) => !l.trashed && !existingByKind.label.has(l.id) && matches(l.name))
      .map((label) => {
        const labeled = notes.filter((n) => n.labelId === label.id && !n.trashed)
        const inBook = labeled.filter((n) => manualNoteRefIds.has(n.id)).length
        return { label, total: labeled.length, inBook }
      })
      .sort((a, b) => a.label.name.localeCompare(b.label.name))
  }, [labels, existingByKind.label, q, notes, manualNoteRefIds])

  const stickerCandidates = useMemo(() => {
    return (stickers ?? [])
      .filter((s) => !s.trashed && !existingByKind.sticker.has(s.id) && matches(s.name))
      .map((sticker) => {
        const memberNoteIds = new Set(
          sticker.members.filter((m) => m.kind === "note").map((m) => m.id),
        )
        const memberWikiIds = new Set(
          sticker.members.filter((m) => m.kind === "wiki").map((m) => m.id),
        )
        const memberNotes = notes.filter((n) => memberNoteIds.has(n.id) && !n.trashed)
        const memberWikis = wikiArticles.filter(
          (w) => memberWikiIds.has(w.id) && !(w as { trashed?: boolean }).trashed,
        )
        const total = memberNotes.length + memberWikis.length
        const inBook =
          memberNotes.filter((n) => manualNoteRefIds.has(n.id)).length +
          memberWikis.filter((w) => manualWikiRefIds.has(w.id)).length
        return { sticker, total, inBook }
      })
      .sort((a, b) => a.sticker.name.localeCompare(b.sticker.name))
  }, [stickers, existingByKind.sticker, q, notes, wikiArticles, manualNoteRefIds, manualWikiRefIds])

  if (!book) return null

  // ─────────────────────────────────────────────────────────────────────

  const handleAdd = (kind: AutoSourceKind, refId: string, name: string) => {
    const ok = addSmartSource(bookId, { kind, refId })
    if (ok) toast.success(`Added source: ${name}`)
    else toast("Already added", { duration: 1500 })
    setSearch("")
    // Keep dialog open for multi-add
  }

  const handleBulkAdd = () => {
    if (bulkSelected.size === 0) return
    let added = 0
    let dup = 0
    for (const { kind, refId } of bulkSelected.values()) {
      const ok = addSmartSource(bookId, { kind, refId })
      if (ok) added++
      else dup++
    }
    if (added > 0 && dup === 0) toast.success(`${added}개 소스 추가됨`)
    else if (added > 0 && dup > 0) toast.success(`${added}개 추가, ${dup}개는 이미 있음`)
    else toast(`이미 모두 추가된 소스 (${dup}개)`, { duration: 1500 })
    clearBulk()
    setSearch("")
  }

  const handleRemove = (kind: AutoSourceKind, refId: string, name: string) => {
    removeSmartSource(bookId, kind, refId)
    toast(`Removed source: ${name}`)
  }

  // v2 Phase G: per-source "Auto-sort" button — clears all userOrder
  // entries scoped to this sourceRefId, reverting items to the natural
  // updatedAt desc order. Undo restores the snapshot via updateBook.
  const sourcesWithUserOrder = useMemo(() => {
    const map = book?.autoUserOrders ?? {}
    const set = new Set<string>()
    for (const k of Object.keys(map)) {
      const [refId] = k.split("::")
      if (refId) set.add(refId)
    }
    return set
  }, [book?.autoUserOrders])

  const handleAutoSort = (sourceRefId: string, sourceName: string) => {
    if (!book) return
    const snapshot = { ...(book.autoUserOrders ?? {}) }
    const removed = clearAutoUserOrder(bookId, sourceRefId)
    if (removed === 0) {
      toast("이미 자동 정렬 상태입니다", { duration: 1500 })
      return
    }
    toast.success(`${sourceName} 자동 정렬로 복원 (${removed}개)`, {
      duration: 5000,
      action: {
        label: "되돌리기",
        onClick: () => {
          updateBook(bookId, { autoUserOrders: snapshot })
          toast("순서 복원됨", { duration: 1500 })
        },
      },
    })
  }

  // Phase F — "Convert to manual" pins every current auto item into
  // book.items as a real BookItem (new uuid, source/sourceRefId stripped)
  // and clears smartSources + excludeIds. Use case: user has curated the
  // auto-resolved book and wants it frozen against future source changes
  // (e.g., new wikis appearing in the Algorithms category).
  const handleConvertToManual = () => {
    if (!book) return
    const resolved = resolveBookItems(book, {
      notes,
      folders,
      wikiArticles,
      wikiCategories,
      tags,
      labels,
      stickers,
    })
    const autoItems = resolved.filter((r) => r.source === "auto")
    if (autoItems.length === 0) {
      toast("No auto items to convert")
      return
    }
    if (
      !window.confirm(
        `Convert ${autoItems.length} auto items to manual? Smart sources will be removed and the book becomes static.`,
      )
    )
      return

    // Strip ResolvedBookItem metadata back to plain BookItem with fresh ids.
    // Auto headings need their own ids (the `auto-heading-${refId}` form
    // would collide if the same source is re-added later — give them new
    // ones). Order is preserved (manual items keep their fractional keys;
    // auto items keep the resolver-generated keys).
    const newItems: BookItem[] = autoItems.map((r) => {
      if (r.kind === "chapter-heading") {
        return { kind: "chapter-heading", id: nanoid(), title: r.title, order: r.order }
      }
      if (r.kind === "wiki") {
        return { kind: "wiki", id: nanoid(), refId: r.refId, order: r.order }
      }
      return { kind: "note", id: nanoid(), refId: r.refId, order: r.order }
    })

    updateBook(bookId, {
      items: [...book.items, ...newItems],
      smartSources: [],
      excludeIds: [],
    })
    toast.success(`Converted ${autoItems.length} items to manual`)
  }

  const formatHint = (total: number, inBook: number): string => {
    const newCount = total - inBook
    if (total === 0) return "empty"
    if (inBook === 0) return `${total}`
    if (newCount === 0) return `${total} all in book`
    return `${newCount} new · ${inBook} in book`
  }

  const renderEntryIcon = (e: ResolvedEntry): ReactNode => {
    switch (e.kind) {
      case "folder":
        return <PhFolder size={14} weight="regular" className="text-muted-foreground" />
      case "category":
        return <PhBookOpen size={14} weight="regular" style={{ color: e.color }} />
      case "tag":
        return (
          <PhHash
            size={14}
            weight="regular"
            style={{ color: e.color ?? undefined }}
            className={e.color ? "" : "text-muted-foreground"}
          />
        )
      case "label":
        return (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: e.color }}
          />
        )
      case "sticker":
        return <PhSticker size={14} weight="regular" style={{ color: e.color }} />
    }
  }

  return (
    <div className="mb-6 rounded-md border border-border/40 bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkle size={12} weight="regular" />
          Smart sources
        </div>
        <div className="flex items-center gap-1">
          {resolvedSources.length > 0 && (
            <button
              type="button"
              onClick={handleConvertToManual}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
              title="Pin every auto item into book.items and remove smart sources"
            >
              Convert to manual
            </button>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            title="Add source"
          >
            <PhPlus size={12} weight="bold" />
            Add source
          </button>
        </div>
      </div>

      {/* Source list / empty state */}
      {resolvedSources.length === 0 ? (
        <div className="px-4 pb-3 pt-0 text-2xs text-muted-foreground/70">
          No sources yet. Auto-fill this book from folders, categories, tags, labels, or stickers.
        </div>
      ) : (
        <ul className="divide-y divide-border/30 border-t border-border/30">
          {resolvedSources.map((entry) => {
            const hasUserOrder = sourcesWithUserOrder.has(entry.refId)
            return (
              <li
                key={`${entry.kind}-${entry.refId}`}
                className="group flex items-center gap-2 px-4 py-1.5 text-note transition-colors hover:bg-hover-bg/40"
              >
                {renderEntryIcon(entry)}
                <span className="flex-1 truncate text-foreground">{entry.name}</span>
                <span className="text-2xs uppercase tracking-wide text-muted-foreground/50">
                  {entry.kind}
                </span>
                {hasUserOrder && (
                  <button
                    type="button"
                    onClick={() => handleAutoSort(entry.refId, entry.name)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
                    title="이 소스의 사용자 정렬 해제 → updatedAt desc로 복원"
                  >
                    <ArrowsClockwise size={11} weight="regular" />
                    Auto-sort
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(entry.kind, entry.refId, entry.name)}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  title={`Remove source: ${entry.name}`}
                  aria-label={`Remove source: ${entry.name}`}
                >
                  <PhX size={12} weight="regular" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Source picker dialog — 5 tabs (Phase A-E) + v2 Phase K: wider
          dialog + unified search input (one query filters all 5 tabs
          simultaneously, each tab shows its count badge for cross-tab
          discoverability). */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-lg gap-0 p-0">
          <DialogHeader className="flex flex-row items-start justify-between gap-2 px-4 pb-2 pt-4">
            <div className="min-w-0">
              <DialogTitle className="text-sm">Add smart source</DialogTitle>
              <DialogDescription className="text-2xs">
                Auto-fill this book from any of 5 source kinds. Notes / wikis only — source entities themselves are never added as pages.
              </DialogDescription>
            </div>
            {/* v2 Phase K follow-up — Multi-select 토글. 활성 시
                candidate click이 toggle, 비활성 시 immediate add. */}
            <button
              type="button"
              onClick={() => {
                setBulkMode((m) => {
                  if (m) clearBulk()
                  return !m
                })
              }}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-2xs font-medium transition-colors",
                bulkMode
                  ? "bg-accent/15 text-accent hover:bg-accent/25"
                  : "text-muted-foreground hover:bg-hover-bg hover:text-foreground",
              )}
              title={bulkMode ? "다중 선택 모드 끄기" : "다중 선택 모드 켜기 — 여러 소스 한 번에 추가"}
            >
              {bulkMode ? "다중 선택 ✓" : "다중 선택"}
            </button>
          </DialogHeader>
          {/* Unified search input — shared across all 5 tabs (Q11 LOCKED:
              cross-tab search). Each tab's candidates list is already
              filtered by the same `q` state; this input is the single
              entry point so users don't have to retype when switching. */}
          <div className="border-b border-border/40 px-4 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all source kinds…"
              className="w-full bg-transparent text-note text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              autoFocus
            />
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
            className="gap-0"
          >
            <TabsList className="mx-4 mt-1 grid grid-cols-5 gap-0.5">
              <TabsTrigger value="folder" title={`Folder source — ${folderCandidates.length} matches`}>
                <PhFolder size={12} weight="regular" />
                {folderCandidates.length > 0 && (
                  <span className="ml-1 text-2xs tabular-nums text-muted-foreground/70">
                    {folderCandidates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="category" title={`Wiki category source — ${categoryCandidates.length} matches`}>
                <PhBookOpen size={12} weight="regular" />
                {categoryCandidates.length > 0 && (
                  <span className="ml-1 text-2xs tabular-nums text-muted-foreground/70">
                    {categoryCandidates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tag" title={`Tag source — ${tagCandidates.length} matches`}>
                <PhHash size={12} weight="regular" />
                {tagCandidates.length > 0 && (
                  <span className="ml-1 text-2xs tabular-nums text-muted-foreground/70">
                    {tagCandidates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="label" title={`Label source — ${labelCandidates.length} matches`}>
                <PhTag size={12} weight="regular" />
                {labelCandidates.length > 0 && (
                  <span className="ml-1 text-2xs tabular-nums text-muted-foreground/70">
                    {labelCandidates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sticker" title={`Sticker source — ${stickerCandidates.length} matches`}>
                <PhSticker size={12} weight="regular" />
                {stickerCandidates.length > 0 && (
                  <span className="ml-1 text-2xs tabular-nums text-muted-foreground/70">
                    {stickerCandidates.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="folder" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching folders</CommandEmpty>
                  <CommandGroup>
                    {folderCandidates.map(({ folder, total, inBook }) => (
                      <CommandItem
                        key={folder.id}
                        value={folder.id}
                        onSelect={() => bulkMode ? toggleBulk("folder", folder.id, folder.name) : handleAdd("folder", folder.id, folder.name)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <PhFolder size={14} weight="regular" className="text-muted-foreground" />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <span className="text-2xs text-muted-foreground/60 tabular-nums">
                          {formatHint(total, inBook)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="category" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching categories</CommandEmpty>
                  <CommandGroup>
                    {categoryCandidates.map(({ category, total, inBook }) => (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => bulkMode ? toggleBulk("category", category.id, category.name) : handleAdd("category", category.id, category.name)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="flex-1 truncate">{category.name}</span>
                        <span className="text-2xs text-muted-foreground/60 tabular-nums">
                          {formatHint(total, inBook)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="tag" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching tags</CommandEmpty>
                  <CommandGroup>
                    {tagCandidates.map(({ tag, total, inBook }) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.id}
                        onSelect={() => bulkMode ? toggleBulk("tag", tag.id, tag.name) : handleAdd("tag", tag.id, tag.name)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <PhHash
                          size={14}
                          weight="regular"
                          style={{ color: tag.color ?? undefined }}
                          className={tag.color ? "" : "text-muted-foreground"}
                        />
                        <span className="flex-1 truncate">{tag.name}</span>
                        <span className="text-2xs text-muted-foreground/60 tabular-nums">
                          {formatHint(total, inBook)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="label" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching labels</CommandEmpty>
                  <CommandGroup>
                    {labelCandidates.map(({ label, total, inBook }) => (
                      <CommandItem
                        key={label.id}
                        value={label.id}
                        onSelect={() => bulkMode ? toggleBulk("label", label.id, label.name) : handleAdd("label", label.id, label.name)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 truncate">{label.name}</span>
                        <span className="text-2xs text-muted-foreground/60 tabular-nums">
                          {formatHint(total, inBook)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            <TabsContent value="sticker" className="mt-0">
              <Command shouldFilter={false}>
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching stickers</CommandEmpty>
                  <CommandGroup>
                    {stickerCandidates.map(({ sticker, total, inBook }) => (
                      <CommandItem
                        key={sticker.id}
                        value={sticker.id}
                        onSelect={() => bulkMode ? toggleBulk("sticker", sticker.id, sticker.name) : handleAdd("sticker", sticker.id, sticker.name)}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <PhSticker size={14} weight="regular" style={{ color: sticker.color }} />
                        <span className="flex-1 truncate">{sticker.name}</span>
                        <span className="text-2xs text-muted-foreground/60 tabular-nums">
                          {formatHint(total, inBook)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>
          </Tabs>
          {/* v2 Phase K follow-up — Bulk select footer. bulkMode 활성
              + selected > 0 시 표시. "Add N selected" 누르면 batch add. */}
          {bulkMode && (
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
              <span className="text-2xs text-muted-foreground">
                {bulkSelected.size > 0
                  ? `${bulkSelected.size}개 선택됨`
                  : "항목을 클릭해서 선택하세요"}
              </span>
              <div className="flex items-center gap-1.5">
                {bulkSelected.size > 0 && (
                  <button
                    type="button"
                    onClick={clearBulk}
                    className="rounded-md px-2 py-1 text-2xs text-muted-foreground hover:bg-hover-bg hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={bulkSelected.size === 0}
                  className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-2xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PhCheck size={11} weight="bold" />
                  Add {bulkSelected.size > 0 ? bulkSelected.size : ""} selected
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
