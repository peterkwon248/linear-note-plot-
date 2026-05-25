"use client"

/**
 * QuickFilterCreateDialog — promote the user's currently active filter rules
 * into a reusable chip on the ViewHeader chip bar.
 *
 * MVP scope (2026-05-25):
 *   - Rules are *read-only* in the dialog — pulled directly from the
 *     caller's `activeFilters`. The user already built the filter via the
 *     existing Filter panel; this dialog just labels and persists it.
 *   - If no filters are active, the dialog still opens but disables Save
 *     and shows an inline hint.
 *
 * Out of scope for this MVP (deferred):
 *   - In-dialog rule builder (advanced)
 *   - Editing an existing custom quick filter
 *   - Reordering / drag-to-sort
 */

import { useState } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatFilterChip } from "@/components/filter-bar"
import type { FilterRule } from "@/lib/view-engine/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Folder, Tag, Label } from "@/lib/types"

interface QuickFilterCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewContext: string
  activeFilters: Array<{ field: string; operator: string; value: string }>
  folders?: Folder[]
  tags?: Tag[]
  labels?: Label[]
}

export function QuickFilterCreateDialog({
  open,
  onOpenChange,
  viewContext,
  activeFilters,
  folders,
  tags,
  labels,
}: QuickFilterCreateDialogProps) {
  const t = useT()
  const addCustomQuickFilter = usePlotStore((s) => s.addCustomQuickFilter)
  const [label, setLabel] = useState("")
  const [desc, setDesc] = useState("")

  const hasRules = activeFilters.length > 0
  const canSave = hasRules && label.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    addCustomQuickFilter({
      viewContext,
      label: label.trim(),
      desc: desc.trim() || undefined,
      rules: activeFilters,
    })
    setLabel("")
    setDesc("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLabel("")
    setDesc("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("filter.quick.create.title")}</DialogTitle>
          <DialogDescription>
            {hasRules
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

          {/* Rules (read-only preview) */}
          <div className="space-y-1.5">
            <label className="text-2xs font-medium text-foreground/80">
              {t("filter.quick.create.rules")}
            </label>
            {hasRules ? (
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((rule, i) => {
                  const parts = formatFilterChip(rule as FilterRule, folders, tags, labels, t)
                  return (
                    <span
                      key={`${rule.field}-${rule.operator}-${rule.value}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/[0.10] px-2 py-0.5 text-2xs text-accent"
                    >
                      <span>{parts.fieldLabel}</span>
                      <span className="text-accent/60">{parts.operatorLabel}</span>
                      <span>{parts.valueLabel}</span>
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
