"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { detectUrlType } from "@/lib/editor/url-detect"

export type UrlDialogMode = "link" | "embed"

interface UrlInputDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (url: string) => void
  mode: UrlDialogMode
}

const CONFIG: Record<UrlDialogMode, { title: string; description: string; submitLabel: string; detectType: boolean }> = {
  link: {
    title: "Insert Link",
    description: "Add a hyperlink to the selected text.",
    submitLabel: "Insert",
    detectType: false,
  },
  embed: {
    title: "Embed URL",
    description: "Paste a URL to embed YouTube, audio, or link card.",
    submitLabel: "Embed",
    detectType: true,
  },
}

export function UrlInputDialog({ open, onClose, onSubmit, mode }: UrlInputDialogProps) {
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const config = CONFIG[mode]

  useEffect(() => {
    if (open) {
      setUrl("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  const trimmed = url.trim()
  const valid = mode === "link" ? trimmed.length > 0 : /^https?:\/\/[^\s]+$/.test(trimmed)
  const urlType = config.detectType && valid ? detectUrlType(trimmed) : null
  const hint = urlType === "youtube" ? "YouTube video" : urlType === "audio" ? "Audio file" : urlType === "generic" ? "Link card" : null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Dialog */}
      <div className="relative w-[440px] rounded-xl border border-border bg-surface-overlay shadow-2xl p-6 flex flex-col gap-4">
        <div className="text-base font-semibold text-foreground">{config.title}</div>
        <div className="text-sm text-muted-foreground">
          {config.description}
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onSubmit(trimmed)
          }}
          placeholder="https://..."
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-accent transition-shadow"
        />
        {hint && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
            {hint} detected
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (valid) onSubmit(trimmed) }}
            disabled={!valid}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition-all"
          >
            {config.submitLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
