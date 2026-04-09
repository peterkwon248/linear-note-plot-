"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { resolveNoteByTitle } from "@/lib/note-reference-actions"
import { navigateToWikiArticle } from "@/lib/wiki-article-nav"
import {
  ArrowSquareOut, Eye, Columns, Copy, NotePencil, BookOpen, ArrowsClockwise,
} from "@/lib/editor/editor-icons"
import { toast } from "sonner"

interface MenuState {
  title: string
  x: number
  y: number
}

export function WikilinkContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [changeLinkMode, setChangeLinkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const openNote = usePlotStore((s) => s.openNote)
  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)
  const createNote = usePlotStore((s) => s.createNote)
  const createWikiArticle = usePlotStore((s) => s.createWikiArticle)

  // Listen for custom event
  useEffect(() => {
    function handleEvent(e: Event) {
      const detail = (e as CustomEvent).detail
      setMenu({ title: detail.title, x: detail.x, y: detail.y })
      setChangeLinkMode(false)
      setSearchQuery("")
      setSelectedIndex(0)
    }
    function handleChangeEvent(e: Event) {
      const detail = (e as CustomEvent).detail
      // Delay to avoid immediate close by outside-click handler
      setTimeout(() => {
        setMenu({ title: detail.title, x: detail.x, y: detail.y })
        setChangeLinkMode(true)
        setSearchQuery("")
        setSelectedIndex(0)
      }, 50)
    }
    window.addEventListener("plot:wikilink-context-menu", handleEvent)
    window.addEventListener("plot:wikilink-context-menu-change", handleChangeEvent)
    return () => {
      window.removeEventListener("plot:wikilink-context-menu", handleEvent)
      window.removeEventListener("plot:wikilink-context-menu-change", handleChangeEvent)
    }
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!menu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [menu])

  // Escape handling — separate to handle changeLinkMode
  useEffect(() => {
    if (!menu) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (changeLinkMode) {
          setChangeLinkMode(false)
          setSearchQuery("")
        } else {
          setMenu(null)
        }
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menu, changeLinkMode])

  const close = useCallback(() => {
    setMenu(null)
    setChangeLinkMode(false)
    setSearchQuery("")
  }, [])

  // Search results computed with useMemo
  const filteredResults = useMemo(() => {
    if (!changeLinkMode) return { notes: [], wikis: [] }
    const q = searchQuery.toLowerCase()
    const store = usePlotStore.getState()
    const notes = store.notes
      .filter((n: { trashed?: boolean; title: string }) => !n.trashed && n.title.toLowerCase().includes(q))
      .slice(0, 4)
    const wikis = (store.wikiArticles ?? [])
      .filter((w) => w.title.toLowerCase().includes(q))
      .slice(0, 4)
    return { notes, wikis }
  }, [changeLinkMode, searchQuery])

  const allResults = useMemo(
    () => [...filteredResults.notes, ...filteredResults.wikis],
    [filteredResults]
  )

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Focus input when changeLinkMode activates
  useEffect(() => {
    if (changeLinkMode) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [changeLinkMode])

  if (!menu) return null

  const currentMenu = menu
  const resolved = resolveNoteByTitle(currentMenu.title)
  const isDangling = !resolved

  function handleOpen() {
    if (resolved) {
      setActiveRoute("/notes")
      openNote(resolved.id)
    }
    close()
  }

  function handlePeek() {
    if (resolved) {
      openSidePeek(resolved.id)
    }
    close()
  }

  function handleSideBySide() {
    if (resolved) {
      openInSecondary(resolved.id)
    }
    close()
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`[[${currentMenu.title}]]`)
    toast.success("Copied to clipboard")
    close()
  }

  function handleCreateNote() {
    const id = createNote({ title: currentMenu.title })
    setActiveRoute("/notes")
    openNote(id)
    close()
  }

  function handleCreateWiki() {
    const store = usePlotStore.getState()
    // Check if wiki article already exists
    const existing = store.wikiArticles.find(
      (a: { title: string }) => a.title.toLowerCase() === currentMenu.title.toLowerCase()
    )
    const articleId = existing
      ? existing.id
      : createWikiArticle({ title: currentMenu.title, aliases: [] })
    setActiveRoute("/wiki")
    navigateToWikiArticle(articleId)
    close()
  }

  function handleChangeLink() {
    setChangeLinkMode(true)
    setSearchQuery("")
    setSelectedIndex(0)
  }

  function handleSelectNewLink(newTitle: string, isWiki: boolean) {
    // Wiki links use [[wiki:Title]] prefix, note links use [[Title]]
    const effectiveNewTitle = isWiki ? `wiki:${newTitle}` : newTitle
    window.dispatchEvent(
      new CustomEvent("plot:change-wikilink", {
        detail: { oldTitle: currentMenu.title, newTitle: effectiveNewTitle },
      })
    )
    // Switch preview to the new note/wiki
    const store = usePlotStore.getState()
    if (isWiki) {
      const wiki = store.wikiArticles.find(
        (a: { title: string }) => a.title.toLowerCase() === newTitle.toLowerCase()
      )
      if (wiki) {
        import("@/components/editor/note-hover-preview").then(({ switchPreviewNote }) => {
          switchPreviewNote(wiki.id, "wiki")
        })
      }
    } else {
      const newResolved = resolveNoteByTitle(newTitle)
      if (newResolved) {
        import("@/components/editor/note-hover-preview").then(({ switchPreviewNote }) => {
          switchPreviewNote(newResolved.id, newResolved.type)
        })
      }
    }
    close()
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (allResults[selectedIndex]) {
        const isWikiResult = selectedIndex >= filteredResults.notes.length
        handleSelectNewLink(allResults[selectedIndex].title, isWikiResult)
      }
    }
  }

  // Clamp position to viewport
  const menuWidth = changeLinkMode ? 240 : 180
  const menuHeight = isDangling ? 140 : 168
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080
  const x = Math.min(currentMenu.x, vw - menuWidth - 8)
  const y = currentMenu.y + menuHeight > vh - 8 ? currentMenu.y - menuHeight : currentMenu.y
  const titleDisplay =
    currentMenu.title.length > 12 ? currentMenu.title.slice(0, 12) + "\u2026" : currentMenu.title

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y, width: menuWidth }}
    >
      {changeLinkMode ? (
        <div>
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search notes..."
            className="w-full px-3 py-1.5 text-2xs bg-transparent border-b border-border-subtle text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filteredResults.notes.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                  Notes
                </div>
                {filteredResults.notes.map((note, i) => {
                  const globalIdx = i
                  return (
                    <button
                      key={note.id}
                      onClick={() => handleSelectNewLink(note.title, false)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-left transition-colors ${
                        globalIdx === selectedIndex
                          ? "bg-hover-bg text-foreground"
                          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
                      }`}
                    >
                      <NotePencil size={12} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{note.title}</span>
                    </button>
                  )
                })}
              </>
            )}
            {filteredResults.wikis.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                  Wiki
                </div>
                {filteredResults.wikis.map((wiki, i) => {
                  const globalIdx = filteredResults.notes.length + i
                  return (
                    <button
                      key={wiki.id}
                      onClick={() => handleSelectNewLink(wiki.title, true)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-2xs text-left transition-colors ${
                        globalIdx === selectedIndex
                          ? "bg-hover-bg text-foreground"
                          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
                      }`}
                    >
                      <BookOpen size={12} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{wiki.title}</span>
                    </button>
                  )
                })}
              </>
            )}
            {allResults.length === 0 && (
              <div className="px-3 py-2 text-2xs text-muted-foreground/50 text-center">
                No results
              </div>
            )}
          </div>
        </div>
      ) : !isDangling ? (
        <>
          <MenuItem icon={<ArrowSquareOut size={14} />} label="Open" onClick={handleOpen} />
          <MenuItem icon={<Eye size={14} />} label="Open in Peek" onClick={handlePeek} />
          <MenuItem icon={<Columns size={14} />} label="Split View" onClick={handleSideBySide} />
          <div className="my-1 border-t border-border-subtle" />
          <MenuItem icon={<ArrowsClockwise size={14} />} label="Change link" onClick={handleChangeLink} />
          <MenuItem icon={<Copy size={14} />} label={`Copy [[${titleDisplay}]]`} onClick={handleCopyLink} />
        </>
      ) : (
        <>
          <MenuItem icon={<NotePencil size={14} />} label="Create Note" onClick={handleCreateNote} />
          <MenuItem icon={<BookOpen size={14} />} label="Create Wiki" onClick={handleCreateWiki} />
          <div className="my-1 border-t border-border-subtle" />
          <MenuItem icon={<ArrowsClockwise size={14} />} label="Change link" onClick={handleChangeLink} />
          <MenuItem icon={<Copy size={14} />} label={`Copy [[${titleDisplay}]]`} onClick={handleCopyLink} />
        </>
      )}
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
