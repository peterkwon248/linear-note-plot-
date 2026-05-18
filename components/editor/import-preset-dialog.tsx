"use client"

/**
 * Infobox preset import dialog (PR-E1).
 *
 * Paired with `export presets…` for cross-machine / cross-user preset sharing.
 * Accepts a JSON envelope (produced by `exportPresetsToJSON`) OR a raw array.
 * Imported presets always get fresh ids — we never replace existing presets,
 * so name collisions are surfaced in the preview but don't block import.
 *
 * UI:
 *   - Textarea for direct JSON paste
 *   - File input (.json) as an alternative
 *   - Live preview ("3 presets will be imported: …")
 *   - Error surface for invalid JSON / shape
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlotStore } from "@/lib/store"
import {
  parsePresetImport,
} from "@/lib/wiki-infobox-presets-io"
import type { UserInfoboxPreset } from "@/lib/types"

interface ImportPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the count of presets imported. */
  onImported?: (count: number) => void
}

export function ImportPresetDialog({
  open,
  onOpenChange,
  onImported,
}: ImportPresetDialogProps) {
  const saveUserInfoboxPreset = usePlotStore((s) => s.saveUserInfoboxPreset)
  const existingPresets = usePlotStore((s) => s.userInfoboxPresets)
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setJsonText("")
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 30)
    }
  }, [open])

  // Parse on every keystroke for preview + validation. Cheap; presets are tiny.
  const parsed = useMemo<{ ok: true; presets: UserInfoboxPreset[] } | { ok: false; error: string } | null>(() => {
    const trimmed = jsonText.trim()
    if (trimmed.length === 0) return null
    try {
      const presets = parsePresetImport(trimmed)
      return { ok: true, presets }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }, [jsonText])

  // Detect name collisions for the preview (id always changes so no id conflict,
  // but matching labels are worth flagging so users don't end up with duplicates).
  const collisionCount = useMemo(() => {
    if (parsed?.ok !== true) return 0
    const existingLabels = new Set(existingPresets.map((p) => p.label))
    let n = 0
    for (const p of parsed.presets) {
      if (existingLabels.has(p.label)) n += 1
    }
    return n
  }, [parsed, existingPresets])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      setJsonText(text)
      setError(null)
    }
    reader.onerror = () => setError("Failed to read file.")
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (parsed?.ok !== true) return
    let imported = 0
    for (const p of parsed.presets) {
      saveUserInfoboxPreset({
        label: p.label,
        hint: p.hint,
        defaultHeaderColor: p.defaultHeaderColor,
        defaultEntries: p.defaultEntries,
      })
      imported += 1
    }
    onImported?.(imported)
    onOpenChange(false)
  }

  const canImport = parsed?.ok === true && parsed.presets.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import presets</DialogTitle>
          <DialogDescription>
            Paste a presets JSON export, or pick a `.json` file. Imported
            presets are added with fresh ids (existing presets are never
            replaced).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                JSON
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-2xs text-accent hover:underline"
              >
                Load from file…
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <textarea
              ref={textareaRef}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                setError(null)
              }}
              rows={10}
              placeholder='{ "version": 1, "presets": [ ... ] }'
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Preview / error surface */}
          {parsed?.ok === true && (
            <div className="rounded-md border border-border-subtle bg-secondary/20 px-2.5 py-2 text-xs">
              <p className="font-medium text-foreground">
                {parsed.presets.length} preset{parsed.presets.length === 1 ? "" : "s"} will be imported
                {collisionCount > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({collisionCount} share names with existing presets — duplicates will be created)
                  </span>
                )}
              </p>
              <ul className="mt-1 ml-3 list-disc text-muted-foreground">
                {parsed.presets.slice(0, 6).map((p, i) => (
                  <li key={`${p.id}-${i}`} className="truncate">
                    {p.label}
                    {p.hint && <span className="text-muted-foreground/70"> — {p.hint}</span>}
                  </li>
                ))}
                {parsed.presets.length > 6 && (
                  <li className="text-muted-foreground/70">…and {parsed.presets.length - 6} more</li>
                )}
              </ul>
            </div>
          )}
          {parsed?.ok === false && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
              {parsed.error}
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-hover-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
