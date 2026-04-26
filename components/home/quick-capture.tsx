"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { usePlotStore } from "@/lib/store"

/**
 * Quick Capture — top-of-Home single-line input.
 *
 * Behavior contract (PR 7 spec):
 *   - Enter -> createNote({title, status: "inbox"}); stay on Home (selectedNoteId restored to null)
 *   - Escape -> blur + clear
 *   - Empty Enter -> ignored (no toast)
 *   - Toast: "Added to Inbox" 1.5s
 *
 * Visual discipline:
 *   - Border-bottom only (no top/sides) — feels like the page's first line, not a card
 *   - 36px tall, 12px padding-x, placeholder muted-foreground/60
 *   - On focus: border-bottom strengthens (border-foreground/30) — no ring, no shadow
 *   - Subtle ring animation on successful submit (60ms fade, ring-foreground/10)
 */
export function QuickCapture() {
  const [value, setValue] = useState("")
  const [flashing, setFlashing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return

    const store = usePlotStore.getState()
    // createNote sets selectedNoteId = id internally; restore to null so we stay on Home.
    store.createNote({
      title: trimmed,
      status: "inbox",
      source: "manual",
    })
    store.setSelectedNoteId(null)

    // Reset + flash
    setValue("")
    setFlashing(true)
    window.setTimeout(() => setFlashing(false), 220)

    toast.success("Added to Inbox", {
      duration: 1500,
      position: "bottom-right",
    })

    // Keep focus so the user can keep capturing
    inputRef.current?.focus()
  }

  return (
    <div
      className={
        "mb-6 transition-shadow duration-200 " +
        (flashing ? "ring-1 ring-foreground/10 rounded-md" : "")
      }
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          } else if (e.key === "Escape") {
            setValue("")
            inputRef.current?.blur()
          }
        }}
        placeholder="What's on your mind?"
        className={
          "h-9 w-full bg-transparent px-3 text-note text-foreground " +
          "border-b border-border/40 outline-none transition-colors " +
          "placeholder:text-muted-foreground/60 " +
          "focus:border-foreground/30"
        }
        aria-label="Quick capture — press Enter to add a note to your Inbox"
      />
    </div>
  )
}
