"use client"

import { useState, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen"

interface WikiPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  onSelect: (articleId: string) => void
}

export function WikiPickerDialog({ open, onOpenChange, title = "Select a wiki article", onSelect }: WikiPickerDialogProps) {
  const wikiArticles = usePlotStore((s) => s.wikiArticles)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return wikiArticles
    const q = search.toLowerCase()
    return wikiArticles.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.aliases.some((alias) => alias.toLowerCase().includes(q))
    )
  }, [wikiArticles, search])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={title} value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No wiki articles found.</CommandEmpty>
        <CommandGroup heading="Wiki Articles">
          {filtered.map((article) => (
            <CommandItem
              key={article.id}
              value={`${article.title} ${article.aliases.join(" ")}`}
              onSelect={() => {
                onSelect(article.id)
                onOpenChange(false)
                setSearch("")
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={14} weight="bold" className="text-teal-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-note font-medium truncate">{article.title}</span>
                {article.aliases.length > 0 && (
                  <span className="ml-2 text-2xs text-muted-foreground/50 truncate">
                    {article.aliases.join(", ")}
                  </span>
                )}
              </div>
              <span className="text-2xs text-muted-foreground/40 shrink-0">
                {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
