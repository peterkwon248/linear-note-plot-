"use client"

/**
 * TemplatesPickerDialog — UpNote 패턴 (2026-05-13).
 *
 * 빈 노트 placeholder의 "Select from Templates" CTA 또는 slash 메뉴의
 * "Template..." entry에서 열림. 사용자가 template 선택 시 onSelect 호출 →
 * 호출자가 editor에 적용 (expandPlaceholdersInJson + setContent / insertContent).
 *
 * 기존 slash 메뉴에 templates를 모두 펴던 패턴을 dialog로 일원화 — entry
 * point 단순화 + slash 메뉴 noise 감소.
 */

import { useMemo } from "react"
import { usePlotStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import type { NoteTemplate } from "@/lib/types"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { LayoutTemplate as Layout } from "lucide-react"

interface TemplatesPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: NoteTemplate) => void
}

export function TemplatesPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: TemplatesPickerDialogProps) {
  const t = useT()
  const templates = usePlotStore((s) => s.templates) as NoteTemplate[]

  // Live (non-trashed) templates only. Pinned first, then by updatedAt desc
  // — matches the Templates list view ordering.
  const liveTemplates = useMemo(() => {
    return templates
      .filter((t) => !t.trashed)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        // updatedAt is ISO string — string compare works for ISO timestamps.
        return (b.updatedAt || "").localeCompare(a.updatedAt || "")
      })
  }, [templates])

  const handleSelect = (template: NoteTemplate) => {
    onSelect(template)
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("editor.template.title")}
      description={t("editor.template.desc")}
    >
      <CommandInput placeholder={t("editor.template.search")} />
      <CommandList>
        <CommandEmpty>{t("editor.template.empty")}</CommandEmpty>
        <CommandGroup>
          {liveTemplates.map((t) => (
            <CommandItem
              key={t.id}
              value={`${t.name} ${t.content || ""}`}
              onSelect={() => handleSelect(t)}
              className="flex items-center gap-2"
            >
              <Layout size={14} strokeWidth={2} className="text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-note">{t.name || "Untitled"}</span>
              {t.pinned && (
                <span className="text-2xs text-muted-foreground">Pinned</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
