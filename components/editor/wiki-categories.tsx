"use client"

import type { Tag } from "@/lib/types"

interface WikiCategoriesProps {
  noteTagIds: string[]
  allTags: Tag[]
}

export function WikiCategories({ noteTagIds, allTags }: WikiCategoriesProps) {
  const resolved = noteTagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean) as Tag[]

  if (resolved.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Categories
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {resolved.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  )
}
