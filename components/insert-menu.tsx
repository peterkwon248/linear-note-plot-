"use client"

import {
  Image,
  Paperclip,
  Table,
  CalendarDays,
  Minus,
  Code,
  Plus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const INSERT_ITEMS = [
  {
    key: "image",
    label: "Image",
    icon: Image,
    shortcut: null,
  },
  {
    key: "file",
    label: "File",
    icon: Paperclip,
    shortcut: null,
  },
  {
    key: "table",
    label: "Table",
    icon: Table,
    shortcut: null,
  },
  {
    key: "date",
    label: "Date",
    icon: CalendarDays,
    shortcut: "/date",
  },
  { key: "separator" },
  {
    key: "divider",
    label: "Divider",
    icon: Minus,
    shortcut: "---",
  },
  {
    key: "codeblock",
    label: "Code Block",
    icon: Code,
    shortcut: "```",
  },
] as const

type InsertKey = "image" | "file" | "table" | "date" | "divider" | "codeblock"

export interface InsertMenuProps {
  onInsertImage: () => void
  onInsertFile: () => void
  onInsertTable: () => void
  onInsertDate: () => void
  onInsertDivider: () => void
  onInsertCodeBlock: () => void
}

const handlerMap: Record<InsertKey, keyof InsertMenuProps> = {
  image: "onInsertImage",
  file: "onInsertFile",
  table: "onInsertTable",
  date: "onInsertDate",
  divider: "onInsertDivider",
  codeblock: "onInsertCodeBlock",
}

export function InsertMenu(props: InsertMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Insert block"
        >
          <Plus className="h-4 w-4" />
          <span>Insert</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56"
      >
        {INSERT_ITEMS.map((item) => {
          if (item.key === "separator") {
            return <DropdownMenuSeparator key="separator" />
          }

          const Icon = item.icon
          const handler = handlerMap[item.key as InsertKey]

          return (
            <DropdownMenuItem
              key={item.key}
              onClick={handler ? props[handler] : undefined}
              className="flex items-center gap-2.5 py-2 text-[13px]"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-[11px] font-mono text-muted-foreground/50">
                  {item.shortcut}
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
