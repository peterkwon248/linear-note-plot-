"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { PRESET_COLORS } from "@/lib/colors"

interface CreateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onCreate: (name: string, color: string) => void
}

export function CreateItemDialog({
  open,
  onOpenChange,
  title,
  onCreate,
}: CreateItemDialogProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState<string>(PRESET_COLORS[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed, color)
    setName("")
    setColor(PRESET_COLORS[0])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="create-item-name"
              className="text-note font-medium text-foreground"
            >
              Name
            </label>
            <input
              id="create-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
              className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-note shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-note font-medium text-foreground">Color</label>
            <div className="mt-1.5 flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-note font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-note font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              Create
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
