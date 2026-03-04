"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePlotStore } from "@/lib/store"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { FileText, Pin } from "lucide-react"

export function SearchDialog() {
  const searchOpen = usePlotStore((s) => s.searchOpen)
  const setSearchOpen = usePlotStore((s) => s.setSearchOpen)
  const notes = usePlotStore((s) => s.notes)
  const setSelectedNoteId = usePlotStore((s) => s.setSelectedNoteId)
  const router = useRouter()

  const [query, setQuery] = useState("")

  const results = notes
    .filter((n) => {
      if (!query.trim()) return false
      const q = query.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      )
    })
    .slice(0, 10)

  function handleSelect(noteId: string) {
    setSelectedNoteId(noteId)
    router.push("/notes")
    setSearchOpen(false)
    setQuery("")
  }

  // "/" keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setSearchOpen])

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Search Notes"
      description="Search through your notes by title or content."
    >
      <CommandInput
        placeholder="Search notes..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No notes found.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Notes">
            {results.map((note) => (
              <CommandItem
                key={note.id}
                value={note.title || "Untitled"}
                onSelect={() => handleSelect(note.id)}
              >
                {note.pinned ? (
                  <Pin className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>{note.title || "Untitled"}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
