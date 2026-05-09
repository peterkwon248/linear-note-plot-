"use client"

/**
 * AddItemDialog — search picker for adding existing notes/wikis to a Book.
 *
 * Two tabs: "Notes" and "Wikis". Search-as-you-type, click to add. The dialog
 * stays open after each add so the user can pick several items in one
 * session — close via Done button or ESC.
 *
 * Items already in the current book are filtered out of the candidate list,
 * so the picker never offers a duplicate (matches PRD §10 dedup contract).
 *
 * Pattern mirrors `NotePickerDialog` / `WikiPickerDialog` (cmdk + DialogContent)
 * but consolidates the two pickers into a single tabbed surface and writes
 * directly to the Books slice via `addItemToBook`.
 */

import { useState, useMemo, useEffect } from "react"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { StatusShapeIcon } from "@/components/status-icon"
import { IconWikiStub, IconWikiArticle } from "@/components/plot-icons"
import { isWikiStub } from "@/lib/wiki-utils"
import { WIKI_STATUS_HEX } from "@/lib/colors"
import { shortRelative } from "@/lib/format-utils"
import { cn } from "@/lib/utils"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"

type Tab = "notes" | "wiki"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  /** Initial tab — defaults to "notes". */
  initialTab?: Tab
}

export function AddItemDialog({
  open,
  onOpenChange,
  bookId,
  initialTab = "notes",
}: AddItemDialogProps) {
  const notes = usePlotStore((s) => s.notes)
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const books = usePlotStore((s) => s.books)
  const addItemToBook = usePlotStore((s) => s.addItemToBook)

  const book = books.find((b) => b.id === bookId)

  const [tab, setTab] = useState<Tab>(initialTab)
  const [search, setSearch] = useState("")

  // Reset state on open
  useEffect(() => {
    if (open) {
      setTab(initialTab)
      setSearch("")
    }
  }, [open, initialTab])

  // Already-in-book ref ids per kind (filter source for the picker).
  const noteRefIds = useMemo(() => {
    if (!book) return new Set<string>()
    return new Set(
      book.items
        .filter((i): i is Extract<typeof i, { kind: "note" }> => i.kind === "note")
        .map((i) => i.refId),
    )
  }, [book])

  const wikiRefIds = useMemo(() => {
    if (!book) return new Set<string>()
    return new Set(
      book.items
        .filter((i): i is Extract<typeof i, { kind: "wiki" }> => i.kind === "wiki")
        .map((i) => i.refId),
    )
  }, [book])

  // Note candidates (live, not already in book)
  const noteCandidates = useMemo(() => {
    return notes
      .filter((n) => !n.trashed && !noteRefIds.has(n.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [notes, noteRefIds])

  // Wiki candidates (live, not already in book)
  const wikiCandidates = useMemo(() => {
    return wikiArticles
      .filter((w) => !wikiRefIds.has(w.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [wikiArticles, wikiRefIds])

  const handleAddNote = (noteId: string, title: string) => {
    addItemToBook(bookId, { kind: "note", refId: noteId })
    toast.success(`Added "${title || "Untitled"}"`)
    setSearch("")
  }

  const handleAddWiki = (articleId: string, title: string) => {
    addItemToBook(bookId, { kind: "wiki", refId: articleId })
    toast.success(`Added "${title || "Untitled"}"`)
    setSearch("")
  }

  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-[640px]"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add to book</DialogTitle>
          <DialogDescription>
            Pick existing notes or wiki articles to add to this book.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <TabButton active={tab === "notes"} onClick={() => setTab("notes")}>
            <FileText size={14} weight="regular" />
            Notes
            <span className="text-2xs text-muted-foreground/70 tabular-nums">
              {noteCandidates.length}
            </span>
          </TabButton>
          <TabButton active={tab === "wiki"} onClick={() => setTab("wiki")}>
            <BookOpen size={14} weight="regular" />
            Wikis
            <span className="text-2xs text-muted-foreground/70 tabular-nums">
              {wikiCandidates.length}
            </span>
          </TabButton>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 text-2xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>

        <Command
          shouldFilter
          filter={(value, query) => {
            const q = query.toLowerCase().trim()
            if (!q) return 1
            return value.toLowerCase().includes(q) ? 1 : 0
          }}
        >
          <CommandInput
            placeholder={tab === "notes" ? "Search notes..." : "Search wiki articles..."}
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className="max-h-[480px]">
            {tab === "notes" ? (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1.5 py-4">
                    <FileText className="text-muted-foreground/60" size={28} weight="regular" />
                    <p className="text-note text-muted-foreground">
                      {noteCandidates.length === 0
                        ? "No notes available — every note is already in this book."
                        : "No matching notes."}
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {noteCandidates.map((note) => (
                    <CommandItem
                      key={note.id}
                      value={`${note.title} ${note.preview}`}
                      onSelect={() => handleAddNote(note.id, note.title)}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <StatusShapeIcon status={note.status} size={14} />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-note font-medium text-foreground block">
                          {note.title || "Untitled"}
                        </span>
                        {note.preview && (
                          <p className="truncate text-2xs text-muted-foreground/70 mt-0.5">
                            {note.preview}
                          </p>
                        )}
                      </div>
                      <span className="text-2xs tabular-nums text-muted-foreground/70 shrink-0">
                        {shortRelative(note.updatedAt)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1.5 py-4">
                    <BookOpen className="text-muted-foreground/60" size={28} weight="regular" />
                    <p className="text-note text-muted-foreground">
                      {wikiCandidates.length === 0
                        ? "No wiki articles available — every article is already in this book."
                        : "No matching wiki articles."}
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {wikiCandidates.map((article) => {
                    const stub = isWikiStub(article)
                    return (
                      <CommandItem
                        key={article.id}
                        value={`${article.title} ${article.aliases.join(" ")}`}
                        onSelect={() => handleAddWiki(article.id, article.title)}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        {stub ? (
                          <IconWikiStub size={14} style={{ color: WIKI_STATUS_HEX.stub }} />
                        ) : (
                          <IconWikiArticle size={14} style={{ color: WIKI_STATUS_HEX.article }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="truncate text-note font-medium text-foreground block">
                            {article.title || "Untitled"}
                          </span>
                          {article.aliases.length > 0 && (
                            <p className="truncate text-2xs text-muted-foreground/70 mt-0.5">
                              {article.aliases.join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="text-2xs tabular-nums text-muted-foreground/70 shrink-0">
                          {shortRelative(article.updatedAt)}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-2xs font-medium transition-colors border-b-2",
        active
          ? "text-foreground border-accent"
          : "text-muted-foreground border-transparent hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
