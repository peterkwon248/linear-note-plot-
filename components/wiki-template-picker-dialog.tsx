"use client"

/**
 * WikiTemplatePickerDialog — Phase 1 entry point for "+ New Wiki".
 *
 * Click a template card → immediately creates a new wiki article with that template
 * applied (title = "Untitled Wiki", user can rename inline). The dialog calls
 * `onSelect(templateId)` and then closes; the parent handles the actual `createWikiArticle`
 * call so it can wire the new id into routing/edit-mode state.
 *
 * Design: 2-column card grid. Built-ins first; user templates section appears only
 * if the user has any (Phase 4 will let users author their own).
 */

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlotStore } from "@/lib/store"
import type { WikiTemplate } from "@/lib/types"
import { BUILT_IN_TEMPLATES } from "@/lib/wiki-templates/built-in"

interface WikiTemplatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the chosen templateId. Dialog closes automatically after. */
  onSelect: (templateId: string) => void
}

export function WikiTemplatePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: WikiTemplatePickerDialogProps) {
  const userTemplates = usePlotStore((s) => s.wikiTemplates)

  const userTemplateList = useMemo(
    () =>
      Object.values(userTemplates).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [userTemplates],
  )

  const handlePick = (templateId: string) => {
    onSelect(templateId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>New Wiki — Choose a template</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <section>
            <h3 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Built-in
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {BUILT_IN_TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} onClick={() => handlePick(t.id)} />
              ))}
            </div>
          </section>

          {userTemplateList.length > 0 && (
            <section>
              <h3 className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                My templates
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {userTemplateList.map((t) => (
                  <TemplateCard key={t.id} template={t} onClick={() => handlePick(t.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Template card ─────────────────────────────────────────────── */

interface TemplateCardProps {
  template: WikiTemplate
  onClick: () => void
}

function TemplateCard({ template, onClick }: TemplateCardProps) {
  // Theme color tint for the card accent (light variant for picker preview).
  const accentTint = template.themeColor?.light
  const columnCount = template.layout.columns.length
  const sectionCount = template.sections.length
  const fieldCount = template.infobox.fields.length

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start gap-1.5 overflow-hidden rounded-md border border-border bg-secondary/30 p-3 text-left transition-all hover:border-accent/60 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {accentTint && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
          style={{ backgroundColor: accentTint }}
        />
      )}

      <div className="flex w-full items-center gap-2">
        <span aria-hidden className="text-base leading-none">
          {template.icon ?? "📄"}
        </span>
        <span className="flex-1 truncate text-note font-medium text-foreground">
          {template.name}
        </span>
      </div>

      <p className="line-clamp-2 text-2xs text-muted-foreground">
        {template.description}
      </p>

      <div className="mt-1 flex flex-wrap gap-1.5 text-2xs text-muted-foreground/70">
        <span>{columnCount} col</span>
        {sectionCount > 0 && <span>· {sectionCount} sections</span>}
        {fieldCount > 0 && <span>· {fieldCount} infobox</span>}
      </div>
    </button>
  )
}
