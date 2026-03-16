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
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  Minus,
  Table,
  ChevronRight,
  Sigma,
  LayoutTemplate,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { expandPlaceholders } from "@/lib/store/slices/templates"
import type { NoteTemplate } from "@/lib/types"

interface CommandItem {
  title: string
  description: string
  icon: React.ElementType
  command: (props: { editor: Editor; range: Range }) => void
}

const COMMANDS: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large heading",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small heading",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Checklist",
    description: "Task list with checkboxes",
    icon: ListTodo,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "Quote",
    description: "Blockquote",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: "Toggle",
    description: "Collapsible content",
    icon: ChevronRight,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setDetails().run()
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: "Table",
    description: "3×3 table with header",
    icon: Table,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: "Math",
    description: "LaTeX math equation",
    icon: Sigma,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent("$$\n\\displaystyle \n$$").run()
    },
  },
]

interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

interface CommandListProps extends SuggestionProps {
  items: CommandItem[]
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
        style={{
          minWidth: "220px",
          maxHeight: "320px",
          overflowY: "auto",
          backgroundColor: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          padding: "4px",
        }}
      >
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "7px",
                border: "none",
                outline: "none",
                cursor: "pointer",
                textAlign: "left",
                backgroundColor:
                  index === selectedIndex
                    ? "rgba(94, 106, 210, 0.12)"
                    : "transparent",
                color:
                  index === selectedIndex
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                transition: "background 0.1s",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(94, 106, 210, 0.08)",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.3 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.6, lineHeight: 1.3, marginTop: "1px" }}>
                  {item.description}
                </div>
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

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashCommandPluginKey,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          const baseItems = COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(q)
          )

          // Dynamically add template items from the store
          const templates = (usePlotStore.getState().templates ?? []) as NoteTemplate[]
          const templateItems: CommandItem[] = templates
            .filter((t) => t.name.toLowerCase().includes(q) || "template".includes(q))
            .map((t) => ({
              title: `Template: ${t.name}`,
              description: t.description || "Insert template content",
              icon: LayoutTemplate,
              command: ({ editor, range }: { editor: Editor; range: Range }) => {
                const expanded = expandPlaceholders(t.content)
                editor.chain().focus().deleteRange(range).insertContent(expanded).run()
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
