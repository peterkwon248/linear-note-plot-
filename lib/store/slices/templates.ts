import type { Note, NoteTemplate } from "../../types"
import { genId, now, workflowDefaults, persistBody, type AppendEventFn } from "../helpers"
import { extractPreview, extractLinksOut } from "../../body-helpers"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"
import { useSettingsStore } from "../../settings-store"

type Set = (fn: ((state: any) => any) | any) => void
type Get = () => any

/**
 * Expand placeholders in template strings (33-decisions §15 v1, opt A).
 *
 * Two pattern families are supported simultaneously (additive — both
 * work, no conflict because `{` and `{{` are distinct prefixes):
 *
 *   - **Plot legacy** (single brace, lowercase, semantic name):
 *     `{date}` `{time}` `{datetime}` `{year}` `{month}` `{day}`
 *   - **UpNote-compatible** (double brace, mixed case, format token):
 *     `{{YYYY}}` `{{MM}}` `{{DD}}` `{{HH}}` `{{mm}}` `{{date}}` `{{time}}`
 *
 * Substitutions run in this order: UpNote double-brace first, Plot
 * single-brace second. Order matters because UpNote tokens like
 * `{{date}}` would otherwise get consumed by the single-brace `{date}`
 * pass mid-replacement.
 */
/**
 * Recursively expand placeholders in a TipTap/ProseMirror JSON document.
 *
 * 2026-05-13: previously `createNoteFromTemplate` only expanded
 * `template.content` (plain text), but TipTap editor uses `contentJson`
 * (richer source of truth) when present — so placeholders like
 * `{{YYYY}}-{{MM}}-{{DD}}` survived into the new note unchanged.
 *
 * Only `text` fields are expanded (TipTap text nodes). Attribute /
 * metadata fields are passed through verbatim to avoid clobbering
 * URL params, IDs, etc. that may legitimately contain `{...}`.
 */
export function expandPlaceholdersInJson<T>(node: T, promptValues?: Record<string, string>): T {
  if (node === null || node === undefined) return node
  if (Array.isArray(node)) {
    return node.map((n) => expandPlaceholdersInJson(n, promptValues)) as unknown as T
  }
  if (typeof node === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "text" && typeof v === "string") {
        result[k] = expandPlaceholders(v, promptValues)
      } else {
        result[k] = expandPlaceholdersInJson(v, promptValues)
      }
    }
    return result as unknown as T
  }
  return node
}

/**
 * Regex matching every supported placeholder token (UpNote double-brace
 * + Plot legacy single-brace). Shared with `countPlaceholders` so the
 * Detail panel surfaces only patterns that `expandPlaceholders` actually
 * substitutes — never a stat that lies about behavior.
 */
const PLACEHOLDER_PATTERN =
  /\{\{prompt:[^}]*\}\}|\{\{date(?:[+-]\d+)?[dwmy]?(?::[^}]+)?\}\}|\{\{(?:YYYY|YY|MMMM|MMM|MM|DD|dddd|ddd|HH|mm|time|datetime|tomorrow|yesterday)\}\}|\{(?:date|time|datetime|year|month|day)\}/g

/**
 * Count placeholder tokens in a template body. ContentJson takes
 * priority (it's what `createNoteFromTemplate` actually expands when
 * present); plain `content` is the fallback for older templates.
 *
 * Only text nodes inside contentJson are scanned — attrs / metadata are
 * skipped to avoid false positives from URL params or IDs that may
 * legitimately contain `{...}`. Mirrors `expandPlaceholdersInJson`.
 */
export function countPlaceholders(
  content: string,
  contentJson?: Record<string, unknown> | null,
): number {
  if (contentJson) {
    let count = 0
    const walk = (node: unknown) => {
      if (node === null || node === undefined) return
      if (Array.isArray(node)) {
        node.forEach(walk)
        return
      }
      if (typeof node !== "object") return
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === "text" && typeof v === "string") {
          const matches = v.match(PLACEHOLDER_PATTERN)
          if (matches) count += matches.length
        } else {
          walk(v)
        }
      }
    }
    walk(contentJson)
    return count
  }
  const matches = content.match(PLACEHOLDER_PATTERN)
  return matches ? matches.length : 0
}

/**
 * Resolve the active UI locale for date formatting (month/weekday names).
 * Korean users get "토요일" / "6월"; everyone else "Saturday" / "June".
 * Wrapped in try/catch so SSR / tests without a live settings store fall back to EN.
 */
function placeholderLocale(): string {
  try {
    return useSettingsStore.getState().language === "ko" ? "ko-KR" : "en-US"
  } catch {
    return "en-US"
  }
}

const pad2 = (n: number) => String(n).padStart(2, "0")
const isoDateOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const isoTimeOf = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

/**
 * Format a date against a Moment-style token string with locale-aware month /
 * weekday names. Shared by bare tokens ({{YYYY}}) and the format parameter
 * ({{date:YYYY/MM/DD}}). Longest variants first so MM never eats MMMM.
 */
function formatWithTokens(d: Date, fmt: string, intlLocale: string): string {
  return fmt
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MMMM/g, d.toLocaleString(intlLocale, { month: "long" }))
    .replace(/MMM/g, d.toLocaleString(intlLocale, { month: "short" }))
    .replace(/dddd/g, d.toLocaleString(intlLocale, { weekday: "long" }))
    .replace(/ddd/g, d.toLocaleString(intlLocale, { weekday: "short" }))
    .replace(/YY/g, String(d.getFullYear()).slice(2))
    .replace(/MM/g, pad2(d.getMonth() + 1))
    .replace(/DD/g, pad2(d.getDate()))
    .replace(/HH/g, pad2(d.getHours()))
    .replace(/mm/g, pad2(d.getMinutes()))
}

/** Apply a +N / -N offset in days (d) / weeks (w) / months (m) / years (y, default d). */
function applyDateOffset(base: Date, sign: string | undefined, unit: string | undefined): Date {
  if (!sign) return base
  const n = parseInt(sign, 10)
  switch (unit || "d") {
    case "w": return addWeeks(base, n)
    case "m": return addMonths(base, n)
    case "y": return addYears(base, n)
    default: return addDays(base, n)
  }
}

/**
 * Expand template placeholders into concrete values at note-creation time
 * (industry-standard static substitution — UpNote / Obsidian / Logseq all do
 * this once at insert, not live).
 *
 * Supported (additive — `{{` and `{` prefixes never collide):
 *   - **Date with offset + format**: `{{date}}` `{{date+1}}` (tomorrow)
 *     `{{date-7}}` (a week ago) `{{date+1w}}` `{{date-1m}}` `{{date+1y}}`,
 *     plus an optional `:format` → `{{date:YYYY/MM/DD}}` `{{date+1:dddd}}`.
 *   - **Named relative**: `{{tomorrow}}` `{{yesterday}}`.
 *   - **Bare Moment-style tokens** (locale-aware month/weekday names):
 *     `{{YYYY}}` `{{YY}}` `{{MMMM}}` `{{MMM}}` `{{MM}}` `{{DD}}`
 *     `{{dddd}}` `{{ddd}}` `{{HH}}` `{{mm}}` `{{time}}` `{{datetime}}`.
 *   - **Plot legacy single-brace**: `{date}` `{time}` `{datetime}`
 *     `{year}` `{month}` `{day}`.
 *
 * Month/weekday names follow the active UI language (`ko` → 한국어).
 */
export function expandPlaceholders(template: string, promptValues?: Record<string, string>): string {
  const today = new Date()
  const intlLocale = placeholderLocale()

  return template
    // user prompt inputs ({{prompt:Label}}) — resolved value, or "" when unanswered
    .replace(/\{\{prompt:([^}]*)\}\}/g, (_m, label) => promptValues?.[String(label).trim()] ?? "")
    // datetime / time first so the {{date…}} matcher can't partially swallow them
    .replace(/\{\{datetime\}\}/g, `${isoDateOf(today)} ${isoTimeOf(today)}`)
    .replace(/\{\{time\}\}/g, isoTimeOf(today))
    // {{date}} with optional ±N offset (unit d|w|m|y, default d) and :format
    .replace(
      /\{\{date([+-]\d+)?([dwmy])?(?::([^}]+))?\}\}/g,
      (_m, sign, unit, fmt) => {
        const d = applyDateOffset(today, sign, unit)
        return fmt ? formatWithTokens(d, fmt, intlLocale) : isoDateOf(d)
      },
    )
    // named relative dates
    .replace(/\{\{tomorrow\}\}/g, isoDateOf(addDays(today, 1)))
    .replace(/\{\{yesterday\}\}/g, isoDateOf(addDays(today, -1)))
    // bare Moment-style tokens (locale-aware)
    .replace(
      /\{\{(YYYY|YY|MMMM|MMM|MM|DD|dddd|ddd|HH|mm)\}\}/g,
      (_m, tok) => formatWithTokens(today, tok, intlLocale),
    )
    // Plot legacy single-brace tokens
    .replace(/\{date\}/g, isoDateOf(today))
    .replace(/\{time\}/g, isoTimeOf(today))
    .replace(/\{datetime\}/g, `${isoDateOf(today)} ${isoTimeOf(today)}`)
    .replace(/\{year\}/g, String(today.getFullYear()))
    .replace(/\{month\}/g, pad2(today.getMonth() + 1))
    .replace(/\{day\}/g, pad2(today.getDate()))
}

/**
 * Extract distinct {{prompt:Label}} labels from a template string, in first-seen
 * order. The template-apply flow shows one input field per label, then passes the
 * answers back to expandPlaceholders as `promptValues`.
 */
export function extractPrompts(text: string): string[] {
  const labels: string[] = []
  const re = /\{\{prompt:([^}]*)\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const label = m[1].trim()
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels
}

export function createTemplatesSlice(set: Set, get: Get, appendEvent: AppendEventFn) {
  return {
    createTemplate: (template: Omit<NoteTemplate, "id" | "createdAt" | "updatedAt">) => {
      const newTemplate: NoteTemplate = {
        ...template,
        id: `tmpl-${genId()}`,
        createdAt: now(),
        updatedAt: now(),
      }
      set((state: any) => ({
        templates: [...state.templates, newTemplate],
      }))
      // PR 5b: entity event log
      appendEvent({ kind: "template", id: newTemplate.id }, "created", { name: newTemplate.name })
      return newTemplate.id
    },

    updateTemplate: (id: string, updates: Partial<NoteTemplate>) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, ...updates, updatedAt: now() } : t
        ),
      }))
      // PR 5b: entity event log
      appendEvent({ kind: "template", id }, "updated")
    },

    deleteTemplate: (id: string) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, trashed: true, trashedAt: new Date().toISOString() } : t
        ),
      }))
      // PR 5b: entity event log
      appendEvent({ kind: "template", id }, "trashed")
    },

    restoreTemplate: (id: string) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, trashed: false, trashedAt: null } : t
        ),
      }))
      // PR 5b: entity event log
      appendEvent({ kind: "template", id }, "untrashed")
    },

    permanentlyDeleteTemplate: (id: string) => {
      set((state: any) => ({
        templates: state.templates.filter((t: NoteTemplate) => t.id !== id),
      }))
    },

    toggleTemplatePin: (id: string) => {
      set((state: any) => ({
        templates: state.templates.map((t: NoteTemplate) =>
          t.id === id ? { ...t, pinned: !t.pinned, updatedAt: now() } : t
        ),
      }))
    },

    createNoteFromTemplate: (templateId: string, promptValues?: Record<string, string>) => {
      const state = get()
      const template = (state.templates as NoteTemplate[]).find((t) => t.id === templateId)
      if (!template) return ""

      const id = genId()
      const title = expandPlaceholders(template.title, promptValues)
      const content = expandPlaceholders(template.content, promptValues)
      // 2026-05-13: contentJson도 placeholder expand. TipTap editor가
      // contentJson 우선 사용하므로 expand 누락 시 `{{YYYY}}` 등이 그대로 남음.
      const contentJson = template.contentJson
        ? expandPlaceholdersInJson(template.contentJson, promptValues)
        : null
      const activeView = state.activeView

      // Templates still use single `folderId` semantics (default folder for
      // newly created notes). v107: convert to N:M `folderIds[]` at the
      // creation boundary. Active-view folder wins when the template has
      // none, matching createNote's auto-classify behavior.
      const folderFromTemplate = template.folderId
      const folderFromView = activeView.type === "folder" ? activeView.folderId : null
      const seedFolder = folderFromTemplate ?? folderFromView
      const folderIds = seedFolder ? [seedFolder] : []

      // v108: NoteTemplate dropped `status` / `priority` fields — new notes
      // start at sensible defaults ("backlog" / "none"), matching createNote's
      // baseline. Users override on first edit if needed.
      const newNote: Note = {
        id,
        title,
        content,
        contentJson,
        folderIds,
        tags: [...template.tags],
        labelId: template.labelId,
        status: "backlog",
        priority: "none",
        reads: 0,
        pinned: false,
        trashed: false,
        createdAt: now(),
        updatedAt: now(),
        preview: extractPreview(content),
        linksOut: extractLinksOut(content),
        ...workflowDefaults("backlog"),
        noteType: "note" as const,
        source: "manual",
        aliases: [],
        wikiInfobox: [],
        referenceIds: [],
      }

      set((s: any) => ({
        notes: [newNote, ...s.notes],
        selectedNoteId: id,
      }))
      persistBody({ id, content, contentJson })
      appendEvent(id, "created", { templateId, templateName: template.name })
      return id
    },
  }
}
