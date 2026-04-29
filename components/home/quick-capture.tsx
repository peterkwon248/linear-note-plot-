"use client"

import { useEffect, useRef, useState } from "react"
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
 *   - Placeholder cycles every 3s while idle (Linear search-bar pattern) to hint
 *     at the kinds of things you can capture: thought / meeting / quote / idea / learning.
 *     Cycle pauses while the user is typing.
 */
const PLACEHOLDERS = [
  "Capture a thought…",
  "Meeting notes…",
  "A quotation…",
  "An idea…",
  "Something learned…",
]

export function QuickCapture() {
  const [value, setValue] = useState("")
  const [flashing, setFlashing] = useState(false)
  const [phIndex, setPhIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cycle placeholder while the input is empty. Stops while the user is typing.
  useEffect(() => {
    if (value) return
    const id = window.setInterval(
      () => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length),
      3000,
    )
    return () => window.clearInterval(id)
  }, [value])

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
        placeholder={PLACEHOLDERS[phIndex]}
        className={
          "h-10 w-full rounded-lg bg-secondary/50 px-4 text-note text-foreground " +
          "border border-border outline-none transition-all " +
          "placeholder:text-muted-foreground " +
          "focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:bg-background"
        }
        aria-label="Quick capture — press Enter to add a note to your Inbox"
      />
    </div>
  )
}
