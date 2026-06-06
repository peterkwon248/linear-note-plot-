"use client"

/**
 * PromptInputDialog — collects {{prompt:Label}} answers before a template is
 * applied. Renders one input per distinct label (from `extractPrompts`); the
 * collected values map is handed to `expandPlaceholders` as `promptValues`.
 * Mirrors markdown-input-dialog styling.
 */

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useT } from "@/lib/i18n"

interface PromptInputDialogProps {
  open: boolean
  labels: string[]
  onCancel: () => void
  onSubmit: (values: Record<string, string>) => void
}

export function PromptInputDialog({ open, labels, onCancel, onSubmit }: PromptInputDialogProps) {
  const t = useT()
  const [values, setValues] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValues({})
      setTimeout(() => firstRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onCancel])

  if (!open || labels.length === 0) return null

  const submit = () => onSubmit(values)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Dialog */}
      <div className="relative w-[440px] max-w-[90vw] rounded-xl border border-border bg-surface-overlay shadow-2xl p-6 flex flex-col gap-4">
        <div className="text-base font-semibold text-foreground">{t("prompt.dialog.title")}</div>
        <div className="text-sm text-muted-foreground">{t("prompt.dialog.desc")}</div>
        <div className="flex flex-col gap-3">
          {labels.map((label, i) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <input
                ref={i === 0 ? firstRef : undefined}
                value={values[label] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [label]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-note text-foreground outline-none focus:ring-1 focus:ring-accent transition-shadow"
              />
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-2xs text-muted-foreground/70">⌘/Ctrl + Enter</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={submit}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:brightness-110 transition-all"
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
