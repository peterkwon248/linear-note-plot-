"use client"

import { useState, useMemo, useCallback } from "react"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import { useRef } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText"
import { Link as PhLink } from "@phosphor-icons/react/dist/ssr/Link"
import { TextT } from "@phosphor-icons/react/dist/ssr/TextT"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass"
import { CircleDashed } from "@phosphor-icons/react/dist/ssr/CircleDashed"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip"
import { cn } from "@/lib/utils"
import { usePlotStore } from "@/lib/store"
import { useBacklinksFor } from "@/lib/search/use-backlinks-for"
import type { WikiCollectionItem } from "@/lib/types"

interface WikiCollectionSidebarProps {
  noteId: string
  onNavigate: (id: string) => void
  onInsertLink?: (title: string) => void
  onInsertQuote?: (sourceNoteId: string, sourceTitle: string, quotedText: string) => void
}

export function WikiCollectionSidebar({ noteId, onNavigate, onInsertLink, onInsertQuote }: WikiCollectionSidebarProps) {
  const notes = usePlotStore((s) => s.notes)
  const wikiCollections = usePlotStore((s) => s.wikiCollections)
  const addToCollection = usePlotStore((s) => s.addToCollection)
  const removeFromCollection = usePlotStore((s) => s.removeFromCollection)
  const createNote = usePlotStore((s) => s.createNote)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)

  const collectionItems: WikiCollectionItem[] = wikiCollections[noteId] ?? []
  const backlinks = useBacklinksFor(noteId)

  const note = notes.find((n) => n.id === noteId)

  // IDs already in collection
  const collectedNoteIds = useMemo(
    () => new Set(collectionItems.filter((i) => i.type === "note").map((i) => i.sourceNoteId!)),
    [collectionItems]
  )

  // --- Related section ---
  const relatedNotes = useMemo(() => {
    if (!note) return []
    const noteTags = new Set(note.tags)
    const linkedTitles = new Set(note.linksOut)

    const seen = new Set<string>()
    const result: typeof notes = []

    const add = (n: (typeof notes)[0]) => {
      if (seen.has(n.id)) return
      if (n.id === noteId) return
      if (n.trashed) return
      if (collectedNoteIds.has(n.id)) return
      seen.add(n.id)
      result.push(n)
    }

    // 1. Backlinks
    for (const bl of backlinks) add(bl)

    // 2. Same tags
    for (const n of notes) {
      if (n.tags.some((t) => noteTags.has(t))) add(n)
    }

    // 3. linksOut references
    for (const n of notes) {
      if (
        linkedTitles.has(n.title.toLowerCase()) ||
        n.aliases?.some((a) => linkedTitles.has(a.toLowerCase()))
      ) {
        add(n)
      }
    }

    return result.slice(0, 20)
  }, [note, notes, backlinks, collectedNoteIds, noteId])

  // --- Red links section ---
  const redLinks = useMemo(() => {
    if (!note) return []
    const wikiTitleSet = new Set(
      notes
        .filter((n) => n.isWiki && !n.trashed)
        .flatMap((n) => [n.title.toLowerCase(), ...(n.aliases?.map((a) => a.toLowerCase()) ?? [])])
    )

    const redMap = new Map<string, number>()
    for (const link of note.linksOut) {
      if (!wikiTitleSet.has(link)) {
        redMap.set(link, (redMap.get(link) ?? 0) + 1)
      }
    }

    return Array.from(redMap.entries()).map(([title, count]) => ({ title, count }))
  }, [note, notes])

  const handleCreateStub = useCallback(
    (title: string) => {
      createWikiArticle({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        wikiStatus: "stub",
        stubSource: "red-link",
      })
    },
    [createWikiArticle]
  )

  if (!note) return null

  return (
    <aside className="w-[260px] shrink-0 border-l border-border overflow-y-auto flex flex-col">
      <div className="p-4 space-y-6">
        {/* Related section */}
        <SidebarSection title="Related">
          {relatedNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No related notes</p>
          ) : (
            <div className="flex flex-col gap-1">
              {relatedNotes.map((n) => (
                <div key={n.id} className="flex items-center gap-1.5 group">
                  <button
                    onClick={(e) => {
                      if (e.shiftKey && onInsertQuote) {
                        const noteContent = n.content || ""
                        const preview = noteContent.slice(0, 300) || n.title || "Untitled"
                        onInsertQuote(n.id, n.title || "Untitled", preview)
                      } else {
                        onInsertLink?.(n.title || "Untitled")
                      }
                    }}
                    title="Click: insert [[link]] · Shift+click: insert as quote"
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-md px-2 py-1 hover:bg-secondary text-left"
                  >
                    <FileText className="shrink-0" size={14} weight="regular" />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </button>
                  <button
                    onClick={() =>
                      addToCollection(noteId, { type: "note", sourceNoteId: n.id })
                    }
                    title="Add to collection"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <PhPlus size={14} weight="regular" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Collected section */}
        <SidebarSection title="Collected">
          <div className="flex flex-col gap-1">
            {collectionItems.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">Nothing collected yet</p>
            ) : (
              collectionItems.map((item) => (
                <CollectionItemRow
                  key={item.id}
                  item={item}
                  notes={notes}
                  onNavigate={onNavigate}
                  onRemove={() => removeFromCollection(noteId, item.id)}
                  onInsertLink={onInsertLink}
                  onInsertQuote={onInsertQuote}
                />
              ))
            )}
          </div>

          {/* Add buttons */}
          <div className="flex flex-wrap gap-1 mt-2">
            <AddNotePopover noteId={noteId} onAdd={addToCollection} notes={notes} />
            <AddUrlPopover noteId={noteId} onAdd={addToCollection} />
            <AddFileButton noteId={noteId} onAdd={addToCollection} />
            <AddMemoPopover noteId={noteId} onAdd={addToCollection} />
          </div>
        </SidebarSection>

        {/* Red Links section */}
        <SidebarSection title="Red Links">
          {redLinks.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No broken links</p>
          ) : (
            <div className="flex flex-col gap-1">
              {redLinks.map(({ title, count }) => (
                <div key={title} className="flex items-center gap-1.5 group">
                  <CircleDashed className="shrink-0 text-destructive" size={12} weight="regular" />
                  <span className="flex-1 min-w-0 text-sm text-foreground truncate">{title}</span>
                  {count > 1 && (
                    <span className="text-xs text-muted-foreground shrink-0">{count}</span>
                  )}
                  <button
                    onClick={() => handleCreateStub(title)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-secondary shrink-0"
                  >
                    Create
                  </button>
                </div>
              ))}
            </div>
          )}
        </SidebarSection>
      </div>
    </aside>
  )
}

// --- Sub-components ---

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

function CollectionItemRow({
  item,
  notes,
  onNavigate,
  onRemove,
  onInsertLink,
  onInsertQuote,
}: {
  item: WikiCollectionItem
  notes: ReturnType<typeof usePlotStore.getState>["notes"]
  onNavigate: (id: string) => void
  onRemove: () => void
  onInsertLink?: (title: string) => void
  onInsertQuote?: (sourceNoteId: string, sourceTitle: string, quotedText: string) => void
}) {
  const sourceNote = item.type === "note" ? notes.find((n) => n.id === item.sourceNoteId) : null

  return (
    <div className="flex items-center gap-1.5 group">
      {item.type === "note" && <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />}
      {item.type === "url" && <PhLink className="shrink-0 text-muted-foreground" size={14} weight="regular" />}
      {item.type === "text" && <TextT className="shrink-0 text-muted-foreground" size={14} weight="regular" />}
      {(item.type === "file" || item.type === "image") && <Paperclip className="shrink-0 text-muted-foreground" size={14} weight="regular" />}

      <div className="flex-1 min-w-0">
        {item.type === "note" && (
          <button
            onClick={(e) => {
              if (e.shiftKey && onInsertQuote && sourceNote) {
                const preview = sourceNote.content?.slice(0, 300) || sourceNote.title || "Untitled"
                onInsertQuote(sourceNote.id, sourceNote.title || "Untitled", preview)
              } else {
                onInsertLink?.(sourceNote?.title || "Untitled")
              }
            }}
            title="Click: insert [[link]] · Shift+click: insert as quote"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 truncate block w-full text-left"
          >
            {sourceNote?.title || "Untitled"}
          </button>
        )}
        {item.type === "url" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 truncate"
          >
            <span className="truncate">{item.urlTitle || item.url}</span>
            <ArrowSquareOut className="shrink-0" size={12} weight="regular" />
          </a>
        )}
        {item.type === "text" && (
          <span className="text-sm text-muted-foreground truncate block">{item.text}</span>
        )}
        {(item.type === "file" || item.type === "image") && (
          <span className="text-sm text-muted-foreground truncate block">
            {item.fileName || "File"}
            {item.fileSize && (
              <span className="ml-1 text-xs text-muted-foreground/50">
                ({item.fileSize < 1024 * 1024
                  ? `${(item.fileSize / 1024).toFixed(0)} KB`
                  : `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
                })
              </span>
            )}
          </span>
        )}
      </div>

      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
      >
        <PhX size={14} weight="regular" />
      </button>
    </div>
  )
}

function AddNotePopover({
  noteId,
  onAdd,
  notes,
}: {
  noteId: string
  onAdd: (wikiNoteId: string, item: Omit<WikiCollectionItem, "id" | "addedAt">) => void
  notes: ReturnType<typeof usePlotStore.getState>["notes"]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const nonWikiNotes = useMemo(
    () =>
      notes
        .filter(
          (n) =>
            !n.isWiki &&
            !n.trashed &&
            (query === "" ||
              n.title.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 12),
    [notes, query]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md px-2 py-1 transition-colors duration-150">
          <PhPlus size={12} weight="regular" />
          Add note
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-64 p-2">
        <div className="flex items-center gap-2 border border-border rounded-md px-2 py-1.5 mb-2">
          <MagnifyingGlass className="text-muted-foreground shrink-0" size={14} weight="regular" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MagnifyingGlass notes..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
          {nonWikiNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-1">No notes found</p>
          ) : (
            nonWikiNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  onAdd(noteId, { type: "note", sourceNoteId: n.id })
                  setOpen(false)
                  setQuery("")
                }}
                className="flex items-center gap-2 text-sm text-left px-2 py-1.5 rounded hover:bg-secondary transition-colors duration-150 truncate"
              >
                <FileText className="shrink-0 text-muted-foreground" size={14} weight="regular" />
                <span className="truncate">{n.title || "Untitled"}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AddUrlPopover({
  noteId,
  onAdd,
}: {
  noteId: string
  onAdd: (wikiNoteId: string, item: Omit<WikiCollectionItem, "id" | "addedAt">) => void
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [urlTitle, setUrlTitle] = useState("")

  const handleAdd = () => {
    if (!url.trim()) return
    onAdd(noteId, { type: "url", url: url.trim(), urlTitle: urlTitle.trim() || undefined })
    setUrl("")
    setUrlTitle("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md px-2 py-1 transition-colors duration-150">
          <PhPlus size={12} weight="regular" />
          Add URL
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-64 p-3 space-y-2">
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="https://..."
          className="w-full text-sm bg-transparent border border-border rounded-md px-2 py-1.5 outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
        <input
          value={urlTitle}
          onChange={(e) => setUrlTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Title (optional)"
          className="w-full text-sm bg-transparent border border-border rounded-md px-2 py-1.5 outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handleAdd}
          disabled={!url.trim()}
          className={cn(
            "w-full text-sm rounded-md px-3 py-1.5 transition-colors duration-150",
            url.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          Add
        </button>
      </PopoverContent>
    </Popover>
  )
}

function AddMemoPopover({
  noteId,
  onAdd,
}: {
  noteId: string
  onAdd: (wikiNoteId: string, item: Omit<WikiCollectionItem, "id" | "addedAt">) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd(noteId, { type: "text", text: text.trim() })
    setText("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md px-2 py-1 transition-colors duration-150">
          <PhPlus size={12} weight="regular" />
          Add memo
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-64 p-3 space-y-2">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a memo..."
          rows={4}
          className="w-full text-sm bg-transparent border border-border rounded-md px-2 py-1.5 outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className={cn(
            "w-full text-sm rounded-md px-3 py-1.5 transition-colors duration-150",
            text.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          Add
        </button>
      </PopoverContent>
    </Popover>
  )
}

function AddFileButton({
  noteId,
  onAdd,
}: {
  noteId: string
  onAdd: (wikiNoteId: string, item: Omit<WikiCollectionItem, "id" | "addedAt">) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addAttachment = usePlotStore((s) => s.addAttachment)

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const attachmentId = addAttachment({
      noteId,
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "file",
      url: "",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    })
    persistAttachmentBlob({ id: attachmentId, data: buffer })

    onAdd(noteId, {
      type: file.type.startsWith("image/") ? "image" : "file",
      attachmentId,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || "application/octet-stream",
    })

    e.target.value = ""
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md px-2 py-1 transition-colors duration-150"
      >
        <PhPlus size={12} weight="regular" />
        Add file
      </button>
    </>
  )
}
