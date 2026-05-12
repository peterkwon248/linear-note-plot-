"use client"

/**
 * SourcesSection — Smart Book sources management UI (Phase 5 / Phase A+B).
 *
 * Embedded in BookDetailPage between description and items list. Shows
 * current `book.smartSources` (Phase A: folder, Phase B: category) with
 * add/remove controls. Auto items appear in the main items list via
 * `resolveBookItems` (see `lib/books/resolver.ts`).
 *
 * Folder picker filters to `kind === "note"` per PRD §1 INVARIANT — wiki
 * folders aren't supported until Phase A.5.
 *
 * Category picker shows all WikiCategories with the count of wikis they
 * contain (`categoryIds[]` DAG reverse lookup, Phase B).
 *
 * Spec: `.omc/plans/smart-book-prd.md` §5.5 + Phase B addendum.
 */

import { useState, useMemo } from "react"
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
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle"

interface SourcesSectionProps {
  bookId: string
}

export function SourcesSection({ bookId }: SourcesSectionProps) {
  const books = usePlotStore((s) => s.books)
  const folders = usePlotStore((s) => s.folders)
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const wikiCategories = usePlotStore((s) => s.wikiCategories)
  const addSmartSource = usePlotStore((s) => s.addSmartSource)
  const removeSmartSource = usePlotStore((s) => s.removeSmartSource)

  const book = books.find((b) => b.id === bookId)
  const sources = book?.smartSources ?? []

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"folder" | "category">("folder")
  const [search, setSearch] = useState("")

  // Resolve source entries for display (skip stale refs). Phase A: folder,
  // Phase B: category. Each entry tagged with kind for dual rendering.
  const resolvedSources = useMemo(() => {
    return sources
      .map((s) => {
        if (s.kind === "folder") {
          const folder = folders.find((f) => f.id === s.refId)
          return folder ? { kind: "folder" as const, source: s, name: folder.name } : null
        }
        if (s.kind === "category") {
          const category = wikiCategories.find((c) => c.id === s.refId)
          return category
            ? { kind: "category" as const, source: s, name: category.name, color: category.color }
            : null
        }
        return null // Phase C-E silently ignored
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [sources, folders, wikiCategories])

  // Folder picker candidates: kind="note" only (PRD §1 INVARIANT) +
  // not already added.
  const existingFolderRefIds = useMemo(
    () => new Set(sources.filter((s) => s.kind === "folder").map((s) => s.refId)),
    [sources],
  )
  const existingCategoryRefIds = useMemo(
    () => new Set(sources.filter((s) => s.kind === "category").map((s) => s.refId)),
    [sources],
  )
  // Tweak C: candidates carry preview counts so users see what each source
  // will pull (and how much already exists in the book as manual).
  const manualNoteRefIds = useMemo(() => {
    return new Set(
      (book?.items ?? [])
        .filter((i): i is Extract<typeof i, { kind: "note" }> => i.kind === "note")
        .map((i) => i.refId),
    )
  }, [book])
  const manualWikiRefIds = useMemo(() => {
    return new Set(
      (book?.items ?? [])
        .filter((i): i is Extract<typeof i, { kind: "wiki" }> => i.kind === "wiki")
        .map((i) => i.refId),
    )
  }, [book])
  const folderCandidates = useMemo(() => {
    const q = search.toLowerCase().trim()
    return folders
      .filter((f) => f.kind === "note" && !existingFolderRefIds.has(f.id))
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .map((folder) => {
        const folderNotes = notes.filter(
          (n) => n.folderIds.includes(folder.id) && !n.trashed,
        )
        const inBook = folderNotes.filter((n) => manualNoteRefIds.has(n.id)).length
        return { folder, total: folderNotes.length, inBook }
      })
      .sort((a, b) => a.folder.name.localeCompare(b.folder.name))
  }, [folders, existingFolderRefIds, search, notes, manualNoteRefIds])
  const categoryCandidates = useMemo(() => {
    const q = search.toLowerCase().trim()
    return wikiCategories
      .filter((c) => !existingCategoryRefIds.has(c.id))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((category) => {
        const catWikis = wikiArticles.filter(
          (w) => w.categoryIds?.includes(category.id) && !(w as { trashed?: boolean }).trashed,
        )
        const inBook = catWikis.filter((w) => manualWikiRefIds.has(w.id)).length
        return { category, total: catWikis.length, inBook }
      })
      .sort((a, b) => a.category.name.localeCompare(b.category.name))
  }, [wikiCategories, existingCategoryRefIds, search, wikiArticles, manualWikiRefIds])

  if (!book) return null

  const handleAddFolder = (folderId: string) => {
    const ok = addSmartSource(bookId, { kind: "folder", refId: folderId })
    if (ok) {
      const folderName = folders.find((f) => f.id === folderId)?.name ?? "folder"
      toast.success(`Added source: ${folderName}`)
    } else {
      toast("Already added", { duration: 1500 })
    }
    setSearch("")
    // Keep dialog open for multi-add — user closes manually
  }

  const handleAddCategory = (categoryId: string) => {
    const ok = addSmartSource(bookId, { kind: "category", refId: categoryId })
    if (ok) {
      const catName = wikiCategories.find((c) => c.id === categoryId)?.name ?? "category"
      toast.success(`Added source: ${catName}`)
    } else {
      toast("Already added", { duration: 1500 })
    }
    setSearch("")
  }

  const handleRemove = (kind: "folder" | "category", refId: string, name: string) => {
    removeSmartSource(bookId, kind, refId)
    toast(`Removed source: ${name}`)
  }

  // Hint formatter shared across both pickers — same UX as Phase A.
  const formatHint = (total: number, inBook: number): string => {
    const newCount = total - inBook
    if (total === 0) return "empty"
    if (inBook === 0) return `${total}`
    if (newCount === 0) return `${total} all in book`
    return `${newCount} new · ${inBook} in book`
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
          No sources yet. Auto-fill this book by adding a folder or category.
        </div>
      ) : (
        <ul className="divide-y divide-border/30 border-t border-border/30">
          {resolvedSources.map((entry) => (
            <li
              key={`${entry.kind}-${entry.source.refId}`}
              className="group flex items-center gap-2 px-4 py-1.5 text-note transition-colors hover:bg-hover-bg/40"
            >
              {entry.kind === "folder" ? (
                <PhFolder size={14} weight="regular" className="text-muted-foreground" />
              ) : (
                <PhBookOpen
                  size={14}
                  weight="regular"
                  style={{ color: entry.color }}
                />
              )}
              <span className="flex-1 truncate text-foreground">{entry.name}</span>
              <span className="text-2xs uppercase tracking-wide text-muted-foreground/50">
                {entry.kind}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(entry.kind, entry.source.refId, entry.name)}
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

      {/* Source picker dialog — tabs for Folder / Category (Phase B). */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle className="text-sm">Add smart source</DialogTitle>
            <DialogDescription className="text-2xs">
              Auto-fill this book from a folder (notes) or a wiki category (articles).
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "folder" | "category")
              setSearch("")
            }}
            className="gap-0"
          >
            <TabsList className="mx-4 mt-1">
              <TabsTrigger value="folder">
                <PhFolder size={12} weight="regular" />
                Folder
              </TabsTrigger>
              <TabsTrigger value="category">
                <PhBookOpen size={12} weight="regular" />
                Category
              </TabsTrigger>
            </TabsList>
            <TabsContent value="folder" className="mt-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search folders..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching folders</CommandEmpty>
                  <CommandGroup>
                    {folderCandidates.map(({ folder, total, inBook }) => (
                      <CommandItem
                        key={folder.id}
                        value={folder.id}
                        onSelect={() => handleAddFolder(folder.id)}
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
                <CommandInput
                  placeholder="Search wiki categories..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList className="max-h-72">
                  <CommandEmpty>No matching categories</CommandEmpty>
                  <CommandGroup>
                    {categoryCandidates.map(({ category, total, inBook }) => (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => handleAddCategory(category.id)}
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
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
