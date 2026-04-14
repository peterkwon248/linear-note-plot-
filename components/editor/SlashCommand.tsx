"use client"

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import type { Editor, Range } from "@tiptap/core"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
// Import to pick up module augmentation for setDetails / unsetDetails
import "@tiptap/extension-details"
import { usePlotStore } from "@/lib/store"
import { expandPlaceholders } from "@/lib/store/slices/templates"
import type { NoteTemplate } from "@/lib/types"
import { Layout } from "@/lib/editor/editor-icons"
import {
  getBlocksForSurface,
  type BlockRegistryEntry,
} from "./block-registry"

/** Slash-menu item: a registry entry, or a dynamically-generated template item
 *  that wears the same shape. */
type SlashItem = BlockRegistryEntry

interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface CommandListProps extends SuggestionProps {
  items: SlashItem[]
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    // Scroll selected item into view
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const item = container.children[selectedIndex] as HTMLElement | undefined
      if (item) {
        item.scrollIntoView({ block: "nearest" })
      }
    }, [selectedIndex])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div
        ref={containerRef}
        className="min-w-[220px] max-h-[320px] overflow-y-auto bg-surface-overlay border border-[var(--border)] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-1"
      >
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={[
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border-none outline-none cursor-pointer text-left transition-[background] duration-100",
                index === selectedIndex
                  ? "bg-[rgba(94,106,210,0.12)] text-[var(--foreground)]"
                  : "bg-transparent text-[var(--muted-foreground)]",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgba(94,106,210,0.08)] shrink-0">
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-note font-medium leading-[1.3]">
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-2xs opacity-60 leading-[1.3] mt-px">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }
)

CommandList.displayName = "CommandList"

const slashCommandPluginKey = new PluginKey("slashCommand")

/** Match an item against a lowercase query (label + aliases). */
function matchesQuery(item: SlashItem, q: string): boolean {
  if (!q) return true
  if (item.label.toLowerCase().includes(q)) return true
  if (item.aliases?.some((a) => a.toLowerCase().includes(q))) return true
  return false
}

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashCommandPluginKey,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) => {
          props.execute({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          const baseItems = getBlocksForSurface("slash").filter((item) =>
            matchesQuery(item, q),
          )

          // Dynamically add template items from the store.
          // Templates don't live in the static registry because they're
          // user-created; we adapt them to BlockRegistryEntry shape.
          const templates = (usePlotStore.getState().templates ?? []) as NoteTemplate[]
          const templateItems: SlashItem[] = templates
            .filter((t) => t.name.toLowerCase().includes(q) || "template".includes(q))
            .map<SlashItem>((t) => ({
              id: `template-${t.id}`,
              label: `Template: ${t.name}`,
              description: t.description || "Insert template content",
              icon: Layout,
              surfaces: ["slash"],
              group: "structure",
              tier: "base",
              execute: ({ editor, range }) => {
                const expanded = expandPlaceholders(t.content)
                const chain = editor.chain().focus()
                if (range) chain.deleteRange(range)
                chain.insertContent(expanded).run()
              },
            }))

          return [...baseItems, ...templateItems]
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null
          let popup: HTMLDivElement | null = null

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              popup = document.createElement("div")
              popup.style.position = "fixed"
              popup.style.zIndex = "1000"
              document.body.appendChild(popup)

              // Position popup
              const { view } = props.editor
              const coords = view.coordsAtPos(props.range.from)
              popup.style.left = `${coords.left}px`
              popup.style.top = `${coords.bottom + 6}px`

              if (component.element) {
                popup.appendChild(component.element)
              }
            },

            onUpdate(props: SuggestionProps) {
              component?.updateProps(props)
              if (popup) {
                const { view } = props.editor
                const coords = view.coordsAtPos(props.range.from)
                popup.style.left = `${coords.left}px`
                popup.style.top = `${coords.bottom + 6}px`
              }
            },

            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === "Escape") {
                popup?.remove()
                component?.destroy()
                popup = null
                component = null
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit() {
              popup?.remove()
              component?.destroy()
              popup = null
              component = null
            },
          }
        },
      } as const,
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
