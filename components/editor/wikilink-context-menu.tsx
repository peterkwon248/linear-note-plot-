"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePlotStore } from "@/lib/store"
import { setActiveRoute } from "@/lib/table-route"
import { resolveNoteByTitle } from "@/lib/note-reference-actions"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut"
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye"
import { Columns } from "@phosphor-icons/react/dist/ssr/Columns"
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy"
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus"
import { toast } from "sonner"

interface MenuState {
  title: string
  x: number
  y: number
}

export function WikilinkContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openNote = usePlotStore((s) => s.openNote)
  const openSidePeek = usePlotStore((s) => s.openSidePeek)
  const openInSecondary = usePlotStore((s) => s.openInSecondary)
  const createNote = usePlotStore((s) => s.createNote)

  // Listen for custom event
  useEffect(() => {
    function handleEvent(e: Event) {
      const detail = (e as CustomEvent).detail
      setMenu({ title: detail.title, x: detail.x, y: detail.y })
    }
    window.addEventListener("plot:wikilink-context-menu", handleEvent)
    return () => window.removeEventListener("plot:wikilink-context-menu", handleEvent)
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!menu) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [menu])

  const close = useCallback(() => setMenu(null), [])

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

  // Clamp position to viewport
  const menuWidth = 180
  const menuHeight = isDangling ? 120 : 160
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080
  const x = Math.min(currentMenu.x, vw - menuWidth - 8)
  const y = currentMenu.y + menuHeight > vh - 8 ? currentMenu.y - menuHeight : currentMenu.y
  const titleDisplay = currentMenu.title.length > 12 ? currentMenu.title.slice(0, 12) + "\u2026" : currentMenu.title

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] w-[180px] rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {!isDangling ? (
        <>
          <MenuItem icon={<ArrowSquareOut size={14} />} label="Open" onClick={handleOpen} />
          <MenuItem icon={<Eye size={14} />} label="Open in Peek" onClick={handlePeek} />
          <MenuItem icon={<Columns size={14} />} label="Side by Side" onClick={handleSideBySide} />
          <div className="my-1 border-t border-border-subtle" />
          <MenuItem icon={<Copy size={14} />} label={`Copy [[${titleDisplay}]]`} onClick={handleCopyLink} />
        </>
      ) : (
        <>
          <MenuItem icon={<Plus size={14} />} label={`Create "${titleDisplay}"`} onClick={handleCreateNote} />
          <div className="my-1 border-t border-border-subtle" />
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
