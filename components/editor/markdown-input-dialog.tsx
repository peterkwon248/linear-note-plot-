"use client"

/**
 * MarkdownInputDialog — author content as Markdown, convert to rich text.
 *
 * Used by the template editor's "Input as Markdown" option (D안 B방식).
 * Mirrors `url-input-dialog.tsx` styling. The caller converts via
 * `markdownToHtml` + `editor.insertContent(html)` so the schema parses it.
 */

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useT } from "@/lib/i18n"

interface MarkdownInputDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (markdown: string) => void
}

export function MarkdownInputDialog({ open, onClose, onSubmit }: MarkdownInputDialogProps) {
  const t = useT()
  const [md, setMd] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setMd("")
      setTimeout(() => ref.current?.focus(), 50)
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

  const trimmed = md.trim()
  const valid = trimmed.length > 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Dialog */}
      <div className="relative w-[560px] max-w-[90vw] rounded-xl border border-border bg-surface-overlay shadow-2xl p-6 flex flex-col gap-4">
        <div className="text-base font-semibold text-foreground">{t("markdown.input.title")}</div>
        <div className="text-sm text-muted-foreground">{t("markdown.input.desc")}</div>
        <textarea
          ref={ref}
          value={md}
          onChange={(e) => setMd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && valid) onSubmit(trimmed)
          }}
          placeholder={"## Today\n- [ ] task\n- note"}
          rows={12}
          className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 font-mono text-note text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-accent transition-shadow"
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-2xs text-muted-foreground/70">{t("markdown.input.hint")}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => {
                if (valid) onSubmit(trimmed)
              }}
              disabled={!valid}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110 transition-all"
            >
              {t("editor.insert.button")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
