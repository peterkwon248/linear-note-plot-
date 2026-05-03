"use client"

/**
 * TemplateEditPage — NoteEditor surface adapted for templates.
 *
 * Plot Template PR b (2026-05-03): replaces the standalone "Editing
 * template" UI inside templates-view.tsx with the same TipTap surface
 * notes use. Metadata moves to the side panel (TemplateDetailPanel via
 * SmartSidePanel — wired in b1).
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │ TitlePatternBar (template.title)    │
 *   ├─────────────────────────────────────┤
 *   │ TipTap editor (template.name +      │
 *   │   template.content/contentJson)     │
 *   │                                     │
 *   │ FootnotesFooter                     │
 *   ├─────────────────────────────────────┤
 *   │ FixedToolbar                        │
 *   └─────────────────────────────────────┘
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { TipTapEditor } from "@/components/editor/TipTapEditor"
import { FootnotesFooter } from "@/components/editor/footnotes-footer"
import { FixedToolbar } from "@/components/editor/FixedToolbar"
import { usePlotStore } from "@/lib/store"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import type { NoteTemplate } from "@/lib/types"

/**
 * Placeholder variables shown in the title-pattern bar. Mirrors the
 * v1 single-brace family from `expandPlaceholders`. UpNote-compatible
 * `{{YYYY}}` etc. are also supported by the runtime expander but not
 * promoted to the chip strip yet (avoids menu bloat).
 */
const PLACEHOLDER_VARS = [
  { key: "{date}", label: "Date", desc: "YYYY-MM-DD" },
  { key: "{time}", label: "Time", desc: "HH:MM" },
  { key: "{datetime}", label: "DateTime", desc: "YYYY-MM-DD HH:MM" },
  { key: "{year}", label: "Year", desc: "YYYY" },
  { key: "{month}", label: "Month", desc: "MM" },
  { key: "{day}", label: "Day", desc: "DD" },
] as const

/* ── Title pattern bar ──────────────────────────────────────────────── */

function TitlePatternBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-secondary/10 px-6 py-2.5 shrink-0">
      <Layout size={14} weight="regular" className="text-muted-foreground shrink-0" />
      <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
        Title pattern
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Meeting - {date}"
        className="flex-1 bg-transparent font-mono text-note text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />
      <div className="flex items-center gap-1 shrink-0">
        {PLACEHOLDER_VARS.map((v) => (
          <button
            key={v.key}
            title={`${v.label} → ${v.desc}`}
            onClick={() => onChange(value + v.key)}
            className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-2xs text-muted-foreground hover:bg-accent/20 hover:text-accent transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Template editor adapter (thin fork of NoteEditorAdapter) ───────── */

/**
 * Forks the minimum surface NoteEditorAdapter needs for template editing.
 * Strips:
 *   - Y.Doc multi-pane sync (single editor; no collab)
 *   - IDB body store (templates persist in main Zustand)
 *   - Hashtag bidirectional sync (templates' tags are defaults, not
 *     extracted from content)
 *   - LinkSuggestion (YAGNI for templates; user can type [[...]] manually)
 *
 * Keeps:
 *   - TipTap mount with full extension set (slash, footnotes, wiki embed)
 *   - 300ms debounced save
 *   - Title-from-first-block extraction
 *   - FootnotesFooter mount
 *   - key={template.id} remount on switch
 */
function TemplateEditorAdapter({ template }: { template: NoteTemplate }) {
  const updateTemplate = usePlotStore((s) => s.updateTemplate)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<{ name: string; content: string; contentJson: Record<string, unknown> } | null>(null)
  // Track current template id so the debounced flush always writes to the
  // intended template (not a stale id captured by closure).
  const currentTemplateIdRef = useRef(template.id)
  useEffect(() => {
    currentTemplateIdRef.current = template.id
  }, [template.id])

  // Build initial content for editor (first block = name, UpNote style — same
  // pattern as NoteEditorAdapter).
  const initialContent = useMemo(() => {
    if (template.contentJson && Object.keys(template.contentJson).length > 0) {
      return template.contentJson
    }
    const headingNode = {
      type: "heading",
      attrs: { level: 2 },
      content: template.name ? [{ type: "text", text: template.name }] : [],
    }
    if (template.content) {
      return {
        type: "doc",
        content: [
          headingNode,
          { type: "paragraph", content: [{ type: "text", text: template.content }] },
        ],
      }
    }
    return { type: "doc", content: [headingNode, { type: "paragraph" }] }
  }, [template.contentJson, template.name, template.content])

  const handleChange = useCallback(
    (json: Record<string, unknown>, plainText: string) => {
      // Extract first-block text → template.name (any block type).
      const doc = json as { content?: Array<{ content?: Array<{ text?: string }> }> }
      let name = ""
      if (doc.content?.[0]?.content) {
        name = doc.content[0].content.map((n) => n.text || "").join("") || ""
      }
      const bodyText = name ? plainText.slice(name.length).trimStart() : plainText
      pendingRef.current = { name, content: bodyText, contentJson: json }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          updateTemplate(currentTemplateIdRef.current, {
            name: pendingRef.current.name || "Untitled template",
            content: pendingRef.current.content,
            contentJson: pendingRef.current.contentJson as Record<string, unknown> | null,
          })
          pendingRef.current = null
        }
      }, 300)
    },
    [updateTemplate],
  )

  // Flush pending save on unmount / template switch — prevents data loss
  // when user switches templates faster than the 300ms debounce window.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (pendingRef.current) {
        updateTemplate(currentTemplateIdRef.current, {
          name: pendingRef.current.name || "Untitled template",
          content: pendingRef.current.content,
          contentJson: pendingRef.current.contentJson as Record<string, unknown> | null,
        })
        pendingRef.current = null
      }
    }
  }, [template.id, updateTemplate])

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <TipTapEditor
          key={template.id}
          content={initialContent as Record<string, unknown>}
          onChange={handleChange}
          editable
          placeholder="Press / for menu, or start writing your template…"
          onEditorReady={(e) => setEditorInstance(e as Editor)}
        />
        <FootnotesFooter editor={editorInstance} editable={true} />
      </div>
      <FixedToolbar editor={editorInstance} />
    </div>
  )
}

/* ── Top-level page ─────────────────────────────────────────────────── */

export function TemplateEditPage({ template }: { template: NoteTemplate }) {
  const updateTemplate = usePlotStore((s) => s.updateTemplate)
  const setSidePanelContext = usePlotStore((s) => s.setSidePanelContext)

  // Keep the side panel pointed at this template — TemplateDetailPanel
  // (b1) consumes sidePanelContext to render properties.
  useEffect(() => {
    setSidePanelContext({ type: "template", id: template.id })
  }, [template.id, setSidePanelContext])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TitlePatternBar
        value={template.title}
        onChange={(v) => updateTemplate(template.id, { title: v })}
      />
      <TemplateEditorAdapter template={template} />
    </div>
  )
}
