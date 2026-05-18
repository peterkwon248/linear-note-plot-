/**
 * Wiki infobox preset import/export (PR-E1).
 *
 * Shareable JSON envelope for user-defined presets so users can move them
 * between machines or share with collaborators. Builtin presets are NOT
 * exported (they're already available on every install).
 *
 * Shape:
 *   {
 *     "version": 1,
 *     "exportedAt": "2026-05-19T...",
 *     "presets": [ UserInfoboxPreset, ... ]
 *   }
 *
 * `parsePresetImport` accepts both the envelope shape and a raw array fallback
 * (so users can hand-craft minimal JSON). Validation is intentionally minimal —
 * id / label / defaultEntries presence + type guards — to be forgiving of
 * future field additions.
 */

import type { UserInfoboxPreset, WikiInfoboxEntry } from "./types"

export const PRESET_EXPORT_VERSION = 1

export interface PresetExportEnvelope {
  version: number
  exportedAt: string
  presets: UserInfoboxPreset[]
}

/**
 * Serialize a list of user presets into a pretty-printed JSON string that
 * roundtrips via `parsePresetImport`.
 */
export function exportPresetsToJSON(presets: UserInfoboxPreset[]): string {
  const envelope: PresetExportEnvelope = {
    version: PRESET_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    presets,
  }
  return JSON.stringify(envelope, null, 2)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function validateEntry(e: unknown): e is WikiInfoboxEntry {
  if (!isPlainObject(e)) return false
  if (typeof e.key !== "string") return false
  if (typeof e.value !== "string") return false
  return true
}

function validatePreset(p: unknown): p is UserInfoboxPreset {
  if (!isPlainObject(p)) return false
  if (typeof p.id !== "string" || p.id.length === 0) return false
  if (typeof p.label !== "string" || p.label.length === 0) return false
  if (!Array.isArray(p.defaultEntries)) return false
  if (!p.defaultEntries.every(validateEntry)) return false
  return true
}

/**
 * Parse and validate a preset import JSON string. Returns the preset array on
 * success, throws on malformed input or shape mismatch.
 *
 * Accepts:
 *   - Envelope: `{ version, exportedAt, presets: [...] }`
 *   - Raw array: `[ ... ]`
 *
 * Each preset must have at minimum: `id` (non-empty string), `label` (non-empty
 * string), `defaultEntries` (array of valid entries). Missing optional fields
 * (`hint`, `defaultHeaderColor`, `createdAt`, `updatedAt`) are filled with
 * sensible defaults so the result is a usable `UserInfoboxPreset[]`.
 */
export function parsePresetImport(json: string): UserInfoboxPreset[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`)
  }

  let presetsRaw: unknown
  if (Array.isArray(parsed)) {
    presetsRaw = parsed
  } else if (isPlainObject(parsed) && Array.isArray(parsed.presets)) {
    presetsRaw = parsed.presets
  } else {
    throw new Error(
      "Unexpected shape: expected an envelope { presets: [...] } or a raw array.",
    )
  }

  const presets = presetsRaw as unknown[]
  const valid: UserInfoboxPreset[] = []
  for (let i = 0; i < presets.length; i++) {
    const p = presets[i]
    if (!validatePreset(p)) {
      throw new Error(`Preset at index ${i} is missing required fields (id / label / defaultEntries).`)
    }
    const nowIso = new Date().toISOString()
    valid.push({
      id: p.id,
      label: p.label,
      hint: typeof p.hint === "string" ? p.hint : undefined,
      defaultHeaderColor:
        typeof p.defaultHeaderColor === "string" ? p.defaultHeaderColor : null,
      defaultEntries: p.defaultEntries.map((e) => ({ ...e })),
      createdAt: typeof p.createdAt === "string" ? p.createdAt : nowIso,
      updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : nowIso,
    })
  }
  return valid
}

/**
 * Trigger a browser download of `presets` as a JSON file. No-op in non-browser
 * environments (SSR-safe via window check).
 */
export function downloadPresetJSON(
  presets: UserInfoboxPreset[],
  filename = "plot-infobox-presets.json",
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return
  const json = exportPresetsToJSON(presets)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
