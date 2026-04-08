"use client"

import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import tippy, { Instance as TippyInstance, Props as TippyProps } from "tippy.js"
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react"
import { FileText, Asterisk, Link as LinkIcon } from "@/lib/editor/editor-icons"
import { IconWiki } from "@/components/plot-icons"
import { usePlotStore } from "@/lib/store"
// ── Types ─────────────────────────────────────────────────────────────────────

interface WikilinkItem {
  id: string
  title: string
  status: string
  isAlias?: boolean
  isWiki?: boolean
  isNewNote?: boolean
  isNewWiki?: boolean
  isReference?: boolean
  isNewReference?: boolean
  referenceId?: string
  referenceContent?: string
  referenceUrl?: string
  _shiftKey?: boolean
  itemType?: "note" | "wiki" | "reference"
}

interface WikilinkListProps {
  items: WikilinkItem[]
  command: (item: WikilinkItem) => void
}

export interface WikilinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

// ── Dropdown Component ────────────────────────────────────────────────────────

const WikilinkList = forwardRef<WikilinkListRef, WikilinkListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number, shiftKey = false) => {
        const item = items[index]
        if (item) command({ ...item, _shiftKey: shiftKey })
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex, event.shiftKey)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    const sectionLabels: Record<string, string> = { note: "Notes", wiki: "Wiki", reference: "References" }
    const sectionOrder = ["note", "wiki", "reference"]

    return (
      <div className="z-50 min-w-[200px] max-w-[300px] overflow-hidden rounded-md border border-border bg-surface-overlay shadow-md">
        <div className="px-2 py-1 border-b border-border-subtle">
          <span className="text-2xs font-medium text-muted-foreground">
            Link to...
          </span>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {(() => {
            // Group items by type, preserving global index for keyboard nav
            const grouped = new Map<string, Array<{ item: WikilinkItem; globalIndex: number }>>()
            items.forEach((item, index) => {
              const type = item.isNewReference ? "reference" : item.isNewNote ? "note" : item.isNewWiki ? "wiki" : (item.itemType || "note")
              if (!grouped.has(type)) grouped.set(type, [])
              grouped.get(type)!.push({ item, globalIndex: index })
            })

            return sectionOrder.map(type => {
              const group = grouped.get(type)
              if (!group || group.length === 0) return null
              return (
                <div key={type}>
                  <div className="px-2 py-0.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {sectionLabels[type]}
                    </span>
                  </div>
                  {group.map(({ item, globalIndex }) => (
                    <button
                      key={item.id}
                      onClick={(e) => selectItem(globalIndex, e.shiftKey)}
                      className={[
                        "flex w-full items-center gap-2 px-2 py-1.5 text-left text-note transition-colors",
                        globalIndex === selectedIndex
                          ? "bg-active-bg text-foreground"
                          : "text-foreground hover:bg-hover-bg",
                      ].join(" ")}
                    >
                      {item.isNewReference ? (
                        <>
                          <span className="text-amber-500 text-2xs">+</span>
                          <Asterisk className="shrink-0 text-amber-500" size={14} />
                          <span className="truncate font-medium text-foreground">{item.title}</span>
                          <span className="ml-auto shrink-0 text-2xs text-amber-500">+ Create Ref</span>
                        </>
                      ) : item.isReference ? (
                        <>
                          {item.referenceUrl ? (
                            <LinkIcon className="shrink-0 text-emerald-400" size={14} />
                          ) : (
                            <Asterisk className="shrink-0 text-amber-500" size={14} />
                          )}
                          <span className="truncate">{item.title}</span>
                          <span className="ml-auto shrink-0 text-2xs text-muted-foreground/60 truncate max-w-[100px]">
                            {item.referenceUrl ? item.referenceUrl.replace(/^https?:\/\//, "").split("/")[0] : item.referenceContent}
                          </span>
                        </>
                      ) : item.isNewNote ? (
                        <>
                          <span className="text-muted-foreground text-2xs">+</span>
                          <FileText className="shrink-0 text-muted-foreground" size={14} />
                          <span className="truncate font-medium text-foreground">{item.title}</span>
                          <span className="ml-auto shrink-0 text-2xs text-muted-foreground">+ Create Note</span>
                        </>
                      ) : item.isNewWiki ? (
                        <>
                          <span className="text-accent text-2xs">+</span>
                          <IconWiki size={14} className="shrink-0 text-accent" />
                          <span className="truncate font-medium text-foreground">{item.title}</span>
                          <span className="ml-auto shrink-0 text-2xs text-accent">+ Create Wiki</span>
                        </>
                      ) : (
                        <>
                          {item.isWiki ? (
                            <IconWiki size={14} className="shrink-0 text-accent" />
                          ) : (
                            <FileText className="shrink-0 text-muted-foreground" size={14} />
                          )}
                          <span className="truncate">{item.title}</span>
                          {item.isAlias && (
                            <span className="shrink-0 text-2xs italic text-muted-foreground/50">
                              alias
                            </span>
                          )}
                          <span className={`ml-auto shrink-0 rounded px-1 py-0.5 text-2xs font-medium bg-secondary ${item.isWiki ? "text-accent/60" : "text-muted-foreground"}`}>
                            {item.status}
                          </span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )
            })
          })()}
        </div>
      </div>
    )
  }
)
WikilinkList.displayName = "WikilinkList"

// ── Suggestion Plugin Key ─────────────────────────────────────────────────────

const wikilinkSuggestionKey = new PluginKey("wikilink-suggestion")

// ── Extension ─────────────────────────────────────────────────────────────────

export const WikilinkSuggestion = Extension.create({
  name: "wikilinkSuggestion",

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        allowSpaces: true,
        allowedPrefixes: [" ", "\n", null],
        pluginKey: wikilinkSuggestionKey,

        // Don't trigger inside a completed [[...]] wikilink
        // Use `state` param (NEW state during apply()), NOT `editor.state` (stale)
        allow: ({ state: newState, range }: { editor: any; state: any; range: any }) => {
          try {
            // Check if matched range text contains ]] — wikilink already closed
            const end = Math.min(range.to + 3, newState.doc.content.size)
            const text = newState.doc.textBetween(range.from, end)
            if (text.includes("]]")) return false
          } catch { /* ignore */ }
          // Check cursor inside [[...]] via block text regex
          const { from } = newState.selection
          const $from = newState.selection.$from
          const blockText = $from.parent.textContent
          const offsetInBlock = from - $from.start()
          const re = /\[\[.*?\]\]/g
          let match
          while ((match = re.exec(blockText)) !== null) {
            if (offsetInBlock >= match.index && offsetInBlock <= match.index + match[0].length) {
              return false
            }
          }
          return true
        },

        items: ({ query }: { query: string }) => {
          // If query contains ]], the wikilink is already closed — don't suggest
          if (query.includes("]]")) return []

          const store = usePlotStore.getState()
          const notes = store.notes
          const currentNoteId = store.selectedNoteId

          // Strip trailing ] characters (user typed closing brackets before suggestion resolves)
          const q = query.trim().replace(/[\]]+$/g, '').toLowerCase().trim()

          const wikiArticles = (store as any).wikiArticles ?? []

          // Empty query: show recent 8 notes/wikis + recent 3 wiki articles
          if (q.length === 0) {
            const pool = notes.filter((n) => !n.trashed && n.title.trim() && n.id !== currentNoteId)
            const noteItems: WikilinkItem[] = pool
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
              )
              .slice(0, 8)
              .map((n) => ({ id: n.id, title: n.title, status: n.status, isWiki: n.noteType === "wiki", itemType: "note" as const }))

            const wikiMatches: WikilinkItem[] = wikiArticles
              .filter((w: any) => w.title?.trim())
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map((w: any) => ({ id: w.id, title: w.title, status: "article", isWiki: true, itemType: "wiki" as const }))

            // Recent References
            const references = (store as any).references ?? {}
            const refEntries = Object.values(references) as Array<{ id: string; title: string; content: string; fields: Array<{ key: string; value: string }>; updatedAt: string }>
            const recentRefs: WikilinkItem[] = refEntries
              .filter((r) => r.title?.trim() && !(r as any).trashed)
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map((r) => {
                const urlField = (r.fields || []).find((f) => f.key.toLowerCase() === "url")
                return {
                  id: r.id,
                  title: r.title,
                  status: "",
                  isReference: true,
                  referenceId: r.id,
                  referenceContent: r.content,
                  referenceUrl: urlField?.value,
                  itemType: "reference" as const,
                }
              })

            return [...noteItems, ...wikiMatches, ...recentRefs]
          }

          // Title matches: exact > startsWith > contains, then by length
          const pool = notes.filter((n) => !n.trashed && n.id !== currentNoteId)
          const titleMatches = pool
            .filter(
              (n) =>
                n.title.trim() &&
                n.title.toLowerCase().includes(q)
            )
            .sort((a, b) => {
              const aExact = a.title.toLowerCase() === q ? 0 : 1
              const bExact = b.title.toLowerCase() === q ? 0 : 1
              if (aExact !== bExact) return aExact - bExact
              const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1
              const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1
              if (aStarts !== bStarts) return aStarts - bStarts
              return a.title.length - b.title.length
            })

          // Alias matches
          const titleIds = new Set(titleMatches.map((n) => n.id))
          const aliasMatches = pool
            .filter(
              (n) =>
                !titleIds.has(n.id)
            )
            .filter((n) =>
              n.aliases?.some((a) => a.toLowerCase().includes(q))
            )
            .map((n) => ({
              id: n.id,
              title: n.title,
              status: n.status,
              isAlias: true,
              isWiki: n.noteType === "wiki",
              itemType: "note" as const,
            }))

          const combined: WikilinkItem[] = [
            ...titleMatches
              .slice(0, 6)
              .map((n) => ({ id: n.id, title: n.title, status: n.status, isWiki: n.noteType === "wiki", itemType: "note" as const })),
            ...aliasMatches.slice(0, 2),
          ].slice(0, 8)

          // Search WikiArticles
          const wikiMatches: WikilinkItem[] = wikiArticles
            .filter((w: any) => w.title?.trim() && w.title.toLowerCase().includes(q))
            .sort((a: any, b: any) => {
              const aExact = a.title.toLowerCase() === q ? 0 : 1
              const bExact = b.title.toLowerCase() === q ? 0 : 1
              if (aExact !== bExact) return aExact - bExact
              return a.title.length - b.title.length
            })
            .slice(0, 4)
            .map((w: any) => ({ id: w.id, title: w.title, status: "article", isWiki: true, itemType: "wiki" as const }))

          // Search References
          const references = (store as any).references ?? {}
          const refEntries = Object.values(references) as Array<{ id: string; title: string; content: string; fields: Array<{ key: string; value: string }>; updatedAt: string }>
          const refMatches: WikilinkItem[] = refEntries
            .filter((r) => !(r as any).trashed && (r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 3)
            .map((r) => {
              const urlField = (r.fields || []).find((f) => f.key.toLowerCase() === "url")
              return {
                id: r.id,
                title: r.title,
                status: "",
                isReference: true,
                referenceId: r.id,
                referenceContent: r.content,
                referenceUrl: urlField?.value,
                itemType: "reference" as const,
              }
            })

          // Combine: notes first, then wiki, then references, then create option
          const finalResults: WikilinkItem[] = [...combined, ...wikiMatches, ...refMatches]

          // "Create as Note" option if no exact match
          const hasExact = [...pool, ...wikiArticles].some(
            (n: any) =>
              n.title?.toLowerCase() === q ||
              n.aliases?.some?.((a: string) => a.toLowerCase() === q)
          )
          if (!hasExact && q.length > 0) {
            finalResults.push({
              id: `__new_note__${q}`,
              title: q,
              status: "inbox",
              isNewNote: true,
              itemType: "note",
            })
            // "Create as Wiki" option
            finalResults.push({
              id: `__new_wiki__${q}`,
              title: q,
              status: "article",
              isNewWiki: true,
              isWiki: true,
              itemType: "wiki",
            })
          }

          // "Create as Reference" — always show when query exists
          if (q.length > 0) {
            finalResults.push({
              id: `__new_ref__${q}`,
              title: q,
              status: "",
              isNewReference: true,
              itemType: "reference",
            })
          }

          return finalResults
        },

        render: () => {
          let component: ReactRenderer<WikilinkListRef, WikilinkListProps> | null =
            null
          let popup: TippyInstance[] | null = null

          return {
            onStart: (
              props: Parameters<
                NonNullable<
                  ReturnType<
                    NonNullable<
                      Parameters<typeof Suggestion>[0]["render"]
                    >
                  >["onStart"]
                >
              >[0]
            ) => {
              component = new ReactRenderer(WikilinkList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) return

              popup = tippy("body", {
                getReferenceClientRect:
                  props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                theme: "none",
                arrow: false,
                offset: [0, 4],
                popperOptions: {
                  strategy: "fixed",
                  modifiers: [
                    { name: "flip", enabled: true },
                    { name: "preventOverflow", enabled: true },
                  ],
                },
              } as Partial<TippyProps>)
            },

            onUpdate: (
              props: Parameters<
                NonNullable<
                  ReturnType<
                    NonNullable<
                      Parameters<typeof Suggestion>[0]["render"]
                    >
                  >["onUpdate"]
                >
              >[0]
            ) => {
              component?.updateProps(props)

              if (!props.clientRect) return

              popup?.[0]?.setProps({
                getReferenceClientRect:
                  props.clientRect as () => DOMRect,
              })
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit: () => {
              popup?.[0]?.destroy()
              component?.destroy()
              popup = null
              component = null
            },
          }
        },

        command: ({
          editor,
          range,
          props,
        }: {
          editor: import("@tiptap/core").Editor
          range: import("@tiptap/core").Range
          props: WikilinkItem
        }) => {
          const store = usePlotStore.getState()

          // Reference 항목 선택 → 기본 footnoteRef, Shift+클릭 시 referenceLink
          if (props.isReference || props.isNewReference) {
            let refId = props.referenceId

            if (props.isNewReference) {
              refId = (store as any).createReference({
                title: props.title,
                content: props.title,
                fields: [],
              })
            }

            // Shift+Enter/클릭 + URL 있음 → referenceLink (인라인 링크)
            // 그 외 → footnoteRef (각주)
            const useInlineLink = props._shiftKey && props.referenceUrl

            if (useInlineLink) {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent([
                  {
                    type: "referenceLink",
                    attrs: {
                      referenceId: refId,
                      title: props.title,
                    },
                  },
                  { type: "text", text: " " },
                ])
                .run()
            } else {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .insertContent([
                  {
                    type: "footnoteRef",
                    attrs: {
                      id: crypto.randomUUID().slice(0, 8),
                      referenceId: refId,
                      content: props.referenceContent || props.title,
                    },
                  },
                  { type: "text", text: " " },
                ])
                .run()
            }
            return
          }

          if (props.isNewNote) {
            // Create regular note
            const exists = store.notes.some(
              (n) => n.title.toLowerCase() === props.title.toLowerCase()
            )
            if (!exists) store.createNote({ title: props.title })
          }

          if (props.isNewWiki) {
            const wikiExists = ((store as any).wikiArticles ?? []).some(
              (w: any) => w.title.toLowerCase() === props.title.toLowerCase()
            )
            if (!wikiExists) (store as any).createWikiArticle({ title: props.title })
          }

          // Insert as atom node instead of raw text
          const linkType = (props.itemType === "wiki" || props.isNewWiki || props.isWiki) ? "wiki" : "note"
          const targetId = props.id || null
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: "wikilink",
                attrs: { title: props.title, linkType, targetId },
              },
              { type: "text", text: " " },
            ])
            .run()
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
