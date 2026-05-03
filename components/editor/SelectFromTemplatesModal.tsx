"use client"

/**
 * SelectFromTemplatesModal — UpNote-pattern template picker modal.
 *
 * Triggered from multiple entry points (33-decisions §15 — "건물 하나,
 * 출입구 여러 개"):
 *   ① slash command (existing, separate UI)
 *   ② right-click menu → "Insert from template..." (TODO)
 *   ③ floating-bar Insert menu → "Templates" (TODO)
 *   ④ empty-note placeholder click (this PR)
 *
 * Behavior: select a template → insert its expanded content at the
 * current editor cursor (or replace empty document). Single insertion
 * model — no separate "create new note" path because every entry point
 * has an editor instance available.
 */

import { useMemo, useState } from "react"
import type { Editor } from "@tiptap/core"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { usePlotStore } from "@/lib/store"
import { expandPlaceholders } from "@/lib/store/slices/templates"
import { Layout } from "@phosphor-icons/react/dist/ssr/Layout"
import { PushPin } from "@phosphor-icons/react/dist/ssr/PushPin"
import type { NoteTemplate } from "@/lib/types"

type Props = {
  /** Controls modal visibility. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** TipTap editor whose document will receive the expanded template. */
  editor: Editor | null
}

export function SelectFromTemplatesModal({ open, onOpenChange, editor }: Props) {
  const templates = usePlotStore((s) => s.templates ?? [])
  const [query, setQuery] = useState("")

  // Active templates only, pinned first then alphabetical.
  const sortedTemplates = useMemo(() => {
    const active = templates.filter((t) => !t.trashed)
    return active.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [templates])

  const handleSelect = (template: NoteTemplate) => {
    if (!editor) return
    const expanded = expandPlaceholders(template.content)
    editor.chain().focus().insertContent(expanded).run()
    setQuery("")
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select from templates"
      description="Pick a template to insert at the cursor."
    >
      <CommandInput
        placeholder="Search templates..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {templates.length === 0
            ? "No templates yet. Create one in More → Templates."
            : "No templates match this search."}
        </CommandEmpty>
        {sortedTemplates.length > 0 && (
          <CommandGroup>
            {sortedTemplates.map((template) => (
              <CommandItem
                key={template.id}
                value={`${template.name} ${template.description ?? ""}`}
                onSelect={() => handleSelect(template)}
                className="flex items-center gap-3"
              >
                <Layout
                  size={16}
                  weight="regular"
                  className="shrink-0 text-muted-foreground"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-note text-foreground">
                    {template.name}
                  </span>
                  {template.description && (
                    <span className="truncate text-2xs text-muted-foreground">
                      {template.description}
                    </span>
                  )}
                </div>
                {template.pinned && (
                  <PushPin
                    size={12}
                    weight="fill"
                    className="shrink-0 text-muted-foreground/70"
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
