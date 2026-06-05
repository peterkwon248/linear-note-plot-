"use client"

/**
 * QuickFilterCreateDialog — promote OR build filter rules into a reusable
 * chip on the ViewHeader chip bar.
 *
 * 2026-05-25 (v2 — sized up from promote-only MVP after user signal):
 *   - The dialog now manages its own *editable* rule list, seeded from the
 *     caller's `activeFilters`. Users can add or remove rules without
 *     leaving the dialog.
 *   - When the caller supplies `filterCategories`, an "Add filter" popover
 *     renders the full FilterPanel inside the dialog so users can build
 *     the rule list from scratch.
 *   - Without `filterCategories` the dialog gracefully degrades back to
 *     promote-only (still useful — users seed via the external Filter UI
 *     and just label/save here).
 *
 * Out of scope for this revision:
 *   - Editing an existing custom quick filter (label change requires
 *     delete + recreate)
 *   - Reordering chips
 */

import { useEffect, useState } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatFilterChip } from "@/components/filter-bar"
import { FilterPanel, type FilterCategory } from "@/components/filter-panel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X as PhX } from "lucide-react"
import type { Folder, Tag, Label } from "@/lib/types"
import type { FilterRule } from "@/lib/view-engine/types"

interface QuickFilterCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewContext: string
  /** Initial rule seed — populated from the caller's currently active
   *  filter chips. Users can still add/remove rules inside the dialog. */
  activeFilters: Array<{ field: string; operator: string; value: string }>
  /** When provided, an in-dialog "Add filter" popover renders the same
   *  FilterPanel UI used by the regular filter button. Omit to keep the
   *  promote-only behavior (rules locked to whatever was passed in). */
  filterCategories?: FilterCategory[]
  folders?: Folder[]
  tags?: Tag[]
  labels?: Label[]
}

export function QuickFilterCreateDialog({
  open,
  onOpenChange,
  viewContext,
  activeFilters,
  filterCategories,
  folders,
  tags,
  labels,
}: QuickFilterCreateDialogProps) {
  const t = useT()
  const addCustomQuickFilter = usePlotStore((s) => s.addCustomQuickFilter)
  const [label, setLabel] = useState("")
  const [desc, setDesc] = useState("")
  const [rules, setRules] = useState<FilterRule[]>(() => activeFilters as FilterRule[])
  const [pickerOpen, setPickerOpen] = useState(false)

  // Re-seed the editable rule list whenever the dialog is reopened so a
  // user who tweaked their main filter list mid-session sees the latest
  // snapshot rather than a stale draft.
  useEffect(() => {
    if (open) {
      setRules(activeFilters as FilterRule[])
    }
  }, [open, activeFilters])

  const hasRules = rules.length > 0
  const canSave = hasRules && label.trim().length > 0

  const handleToggleRule = (rule: FilterRule) => {
    setRules((prev) => {
      const exists = prev.some(
        (r) => r.field === rule.field && r.operator === rule.operator && r.value === rule.value,
      )
      return exists
        ? prev.filter(
            (r) => !(r.field === rule.field && r.operator === rule.operator && r.value === rule.value),
          )
        : [...prev, rule]
    })
  }

  const handleRemoveRule = (rule: FilterRule) => {
    setRules((prev) =>
      prev.filter(
        (r) => !(r.field === rule.field && r.operator === rule.operator && r.value === r.value),
      ),
    )
  }

  const handleSave = () => {
    if (!canSave) return
    addCustomQuickFilter({
      viewContext,
      label: label.trim(),
      desc: desc.trim() || undefined,
      rules,
    })
    setLabel("")
    setDesc("")
    setRules([])
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLabel("")
    setDesc("")
    setRules([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("filter.quick.create.title")}</DialogTitle>
          <DialogDescription>
            {filterCategories
              ? t("filter.quick.create.rules_hint")
              : hasRules
                ? t("filter.quick.create.rules_hint")
                : t("filter.quick.create.rules_empty")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Label */}
          <div className="space-y-1.5">
            <label className="text-2xs font-medium text-foreground/80">
              {t("filter.quick.create.label")}
            </label>
            <Input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("filter.quick.create.label_placeholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-1.5">
            <label className="text-2xs font-medium text-foreground/80">
              {t("filter.quick.create.desc")}
            </label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t("filter.quick.create.desc_placeholder")}
            />
          </div>

          {/* Editable rule list */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-2xs font-medium text-foreground/80">
                {t("filter.quick.create.rules")}
              </label>
              {filterCategories && (
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/30 px-2 py-0.5 text-2xs font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
                    >
                      <Plus size={10} strokeWidth={2.5} />
                      {t("filter.quick.create.add_rule")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" collisionPadding={12} className="w-72 p-0">
                    <FilterPanel
                      categories={filterCategories}
                      activeFilters={rules}
                      onToggle={handleToggleRule}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {hasRules ? (
              <div className="flex flex-wrap gap-1.5">
                {rules.map((rule, i) => {
                  const parts = formatFilterChip(rule, folders, tags, labels, t)
                  return (
                    <span
                      key={`${rule.field}-${rule.operator}-${rule.value}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/[0.10] px-2 py-0.5 text-2xs text-accent"
                    >
                      <span>{parts.fieldLabel}</span>
                      <span className="text-accent/60">{parts.operatorLabel}</span>
                      <span>{parts.valueLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule)}
                        className="text-accent/60 transition-colors hover:text-destructive"
                        title={t("filter.quick.create.remove_rule")}
                      >
                        <PhX size={10} strokeWidth={2.5} />
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-2xs text-muted-foreground/70 italic">
                {t("filter.quick.create.rules_empty")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {t("filter.quick.create.cancel")}
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {t("filter.quick.create.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
