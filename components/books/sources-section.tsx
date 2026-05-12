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
  CommandInput,
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

  const book = books.find((b) => b.id === bookId)
  const sources = book?.smartSources ?? []

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("folder")
  const [search, setSearch] = useState("")

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

  const handleRemove = (kind: AutoSourceKind, refId: string, name: string) => {
    removeSmartSource(bookId, kind, refId)
    toast(`Removed source: ${name}`)
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

      {/* Source list / empty state */}
      {resolvedSources.length === 0 ? (
        <div className="px-4 pb-3 pt-0 text-2xs text-muted-foreground/70">
          No sources yet. Auto-fill this book from folders, categories, tags, labels, or stickers.
        </div>
      ) : (
        <ul className="divide-y divide-border/30 border-t border-border/30">
          {resolvedSources.map((entry) => (
            <li
              key={`${entry.kind}-${entry.refId}`}
              className="group flex items-center gap-2 px-4 py-1.5 text-note transition-colors hover:bg-hover-bg/40"
            >
              {renderEntryIcon(entry)}
              <span className="flex-1 truncate text-foreground">{entry.name}</span>
              <span className="text-2xs uppercase tracking-wide text-muted-foreground/50">
                {entry.kind}
              </span>
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
          ))}
        </ul>
      )}

      {/* Source picker dialog — 5 tabs (Phase A-E). */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle className="text-sm">Add smart source</DialogTitle>
            <DialogDescription className="text-2xs">
              Auto-fill this book from any of 5 source kinds. Notes / wikis only — source entities themselves are never added as pages.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as TabKey)
              setSearch("")
            }}
            className="gap-0"
          >
            <TabsList className="mx-4 mt-1 grid grid-cols-5 gap-0.5">
              <TabsTrigger value="folder" title="Folder source (notes)">
                <PhFolder size={12} weight="regular" />
              </TabsTrigger>
              <TabsTrigger value="category" title="Wiki category source">
                <PhBookOpen size={12} weight="regular" />
              </TabsTrigger>
              <TabsTrigger value="tag" title="Tag source (notes + wikis)">
                <PhHash size={12} weight="regular" />
              </TabsTrigger>
              <TabsTrigger value="label" title="Label source (notes)">
                <PhTag size={12} weight="regular" />
              </TabsTrigger>
              <TabsTrigger value="sticker" title="Sticker source (note/wiki members)">
                <PhSticker size={12} weight="regular" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="folder" className="mt-0">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search folders..." value={search} onValueChange={setSearch} />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching folders</CommandEmpty>
                  <CommandGroup>
                    {folderCandidates.map(({ folder, total, inBook }) => (
                      <CommandItem
                        key={folder.id}
                        value={folder.id}
                        onSelect={() => handleAdd("folder", folder.id, folder.name)}
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
                <CommandInput placeholder="Search wiki categories..." value={search} onValueChange={setSearch} />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching categories</CommandEmpty>
                  <CommandGroup>
                    {categoryCandidates.map(({ category, total, inBook }) => (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => handleAdd("category", category.id, category.name)}
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
                <CommandInput placeholder="Search tags..." value={search} onValueChange={setSearch} />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching tags</CommandEmpty>
                  <CommandGroup>
                    {tagCandidates.map(({ tag, total, inBook }) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.id}
                        onSelect={() => handleAdd("tag", tag.id, tag.name)}
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
                <CommandInput placeholder="Search labels..." value={search} onValueChange={setSearch} />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching labels</CommandEmpty>
                  <CommandGroup>
                    {labelCandidates.map(({ label, total, inBook }) => (
                      <CommandItem
                        key={label.id}
                        value={label.id}
                        onSelect={() => handleAdd("label", label.id, label.name)}
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
                <CommandInput placeholder="Search stickers..." value={search} onValueChange={setSearch} />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching stickers</CommandEmpty>
                  <CommandGroup>
                    {stickerCandidates.map(({ sticker, total, inBook }) => (
                      <CommandItem
                        key={sticker.id}
                        value={sticker.id}
                        onSelect={() => handleAdd("sticker", sticker.id, sticker.name)}
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
