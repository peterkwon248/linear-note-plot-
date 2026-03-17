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
    <div className="wiki-categories">
      <span className="wiki-categories-label">분류:</span>
      {resolved.map((tag, i) => (
        <span key={tag.id}>
          {i > 0 && <span className="wiki-cat-sep">|</span>}
          <button type="button" title={tag.name}>
            {tag.name}
          </button>
        </span>
      ))}
    </div>
  )
}
