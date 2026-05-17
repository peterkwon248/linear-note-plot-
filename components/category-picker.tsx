"use client"

/**
 * CategoryPicker — entity-agnostic category picker.
 *
 * 2026-05-17 — 사용자 결정: Category 시스템 cross-entity 확장 (Note/Wiki/Book
 * 공통). WikiCategory 풀 공유. 자유 선택 (없어도 OK).
 *
 * TagPicker 패턴 정합 (components/note-fields.tsx:365):
 *   - 검색 input + filtered list
 *   - 매치 없을 때 inline "Create '{value}'" 옵션
 *   - multi-select (N:M) — 선택된 카테고리 chip strip + "+" 버튼 picker
 *   - Plot Linear-style polish
 *
 * DAG hierarchy 시각화는 별도 polish (P2). 일단 flat list + name search.
 * 사용자가 parentIds로 카테고리 hierarchy를 만들면 search로 찾으면 됨.
 */

import { useState, useRef, useEffect, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Plus as PhPlus } from "@phosphor-icons/react/dist/ssr/Plus"
import { Check as PhCheck } from "@phosphor-icons/react/dist/ssr/Check"
import { X as PhX } from "@phosphor-icons/react/dist/ssr/X"
import { FolderSimple } from "@phosphor-icons/react/dist/ssr/FolderSimple"

export interface CategoryPickerCategory {
  id: string
  name: string
  color?: string | null
}

export function CategoryPicker({
  entityId,
  selectedCategoryIds,
  allCategories,
  onAddCategory,
  onRemoveCategory,
  onCreateCategory,
}: {
  /** entityId — Note.id / WikiArticle.id / Book.id. callback에 그대로 전달. */
  entityId: string
  selectedCategoryIds: string[]
  allCategories: CategoryPickerCategory[]
  onAddCategory: (entityId: string, categoryId: string) => void
  onRemoveCategory: (entityId: string, categoryId: string) => void
  onCreateCategory: (name: string) => string | null
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(
    () => allCategories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [allCategories, search],
  )

  const exactMatch = useMemo(
    () => allCategories.some((c) => c.name.toLowerCase() === search.trim().toLowerCase()),
    [allCategories, search],
  )
  const showCreate = search.trim().length > 0 && !exactMatch

  const selected = useMemo(
    () => allCategories.filter((c) => selectedCategoryIds.includes(c.id)),
    [allCategories, selectedCategoryIds],
  )

  const handleCreate = () => {
    const name = search.trim()
    if (!name) return
    const newId = onCreateCategory(name)
    if (newId) {
      onAddCategory(entityId, newId)
    }
    setSearch("")
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Selected chips */}
      <div className="flex flex-wrap gap-1">
        {selected.map((c) => (
          <span
            key={c.id}
            className="group/cat inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium"
            style={{
              backgroundColor: c.color ? `${c.color}18` : "#6b728018",
              color: c.color ?? "#6b7280",
            }}
          >
            <FolderSimple size={10} weight="regular" />
            {c.name}
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveCategory(entityId, c.id) }}
              className="ml-0.5 rounded-full p-0 opacity-0 transition-opacity group-hover/cat:opacity-100 hover:bg-black/10"
            >
              <PhX size={10} weight="regular" />
            </button>
          </span>
        ))}
      </div>

      {/* "+" trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <PhPlus size={12} weight="regular" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create category..."
              className="w-full bg-transparent text-note text-foreground placeholder:text-muted-foreground/70 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((c) => {
              const isSelected = selectedCategoryIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-note transition-colors hover:bg-hover-bg"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isSelected) onRemoveCategory(entityId, c.id)
                    else onAddCategory(entityId, c.id)
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.color ?? "#6b7280" }}
                    />
                    <span className="text-foreground">{c.name}</span>
                  </span>
                  {isSelected && (
                    <PhCheck className="text-muted-foreground" size={12} weight="bold" />
                  )}
                </button>
              )
            })}
            {showCreate && (
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-note text-accent transition-colors hover:bg-hover-bg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreate()
                }}
              >
                <PhPlus size={12} weight="regular" />
                Create &ldquo;{search.trim()}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-2 text-note text-muted-foreground/60">No categories found.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
