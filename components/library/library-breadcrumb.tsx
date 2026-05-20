"use client"

/**
 * LibraryBreadcrumb — `Library > [entity]` header navigation.
 *
 * 사용자 시그널 (2026-05-14): Wiki의 `← Overview` 패턴보다 Notes의 breadcrumb
 * 패턴 (`Notes > Quick Memo`)이 더 자연. Library도 같은 패턴 적용. 차이점:
 *   - Search 불필요 (4 entity만 — Tags / Files / References / Stickers)
 *   - `>` chevron이 popover trigger (다른 entity 빠르게 switch)
 *
 * Library entity들 (Tags / Files / References) 헤더 + 별도 route Stickers
 * 헤더에 동일 사용. Stickers는 실제 route가 `/stickers`지만 사용자 mental
 * model에서 Library 계열 — breadcrumb에 함께 포함.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { setActiveRoute } from "@/lib/table-route"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IconChevronRight } from "@/components/plot-icons"
import { Tag as PhTag } from "@phosphor-icons/react/dist/ssr/Tag"
import { Folder } from "@phosphor-icons/react/dist/ssr/Folder"
import { Quotes } from "@phosphor-icons/react/dist/ssr/Quotes"
import { Sticker as StickerIcon } from "@phosphor-icons/react/dist/ssr/Sticker"
import { Bookmark as PhBookmark } from "@phosphor-icons/react/dist/ssr/Bookmark"
import { cn } from "@/lib/utils"

type LibraryEntity = "tags" | "files" | "references" | "stickers" | "labels"

const ENTITY_META: Record<LibraryEntity, { label: string; route: string; icon: React.ElementType }> = {
  tags: { label: "Tags", route: "/library/tags", icon: PhTag },
  files: { label: "Files", route: "/library/files", icon: Folder },
  references: { label: "References", route: "/library/references", icon: Quotes },
  stickers: { label: "Stickers", route: "/stickers", icon: StickerIcon },
  labels: { label: "Labels", route: "/labels", icon: PhBookmark },
}

const ALL_ENTITIES: LibraryEntity[] = ["tags", "files", "references", "stickers", "labels"]

export function LibraryBreadcrumb({
  current,
  count,
}: {
  current: LibraryEntity
  /** Optional entity count rendered next to the current label (e.g. "Tags 5"). */
  count?: number
}) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)

  const navigateToLibrary = () => {
    setActiveRoute("/library")
    router.push("/library")
  }

  const navigateToEntity = (entity: LibraryEntity) => {
    setActiveRoute(ENTITY_META[entity].route)
    router.push(ENTITY_META[entity].route)
    setPickerOpen(false)
  }

  const currentMeta = ENTITY_META[current]

  return (
    <nav className="flex items-center gap-1 min-w-0">
      {/* Library root crumb */}
      <button
        onClick={navigateToLibrary}
        className="shrink-0 text-note font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        Library
      </button>

      {/* Chevron → entity picker popover */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button className="shrink-0 rounded p-0.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-hover-bg transition-colors">
            <IconChevronRight size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1" sideOffset={4}>
          {ALL_ENTITIES.map((entity) => {
            const meta = ENTITY_META[entity]
            const Icon = meta.icon
            const isActive = entity === current
            return (
              <button
                key={entity}
                onClick={() => navigateToEntity(entity)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-note transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-hover-bg hover:text-foreground",
                )}
              >
                <Icon size={14} weight="regular" className="shrink-0" />
                <span className="truncate">{meta.label}</span>
              </button>
            )
          })}
        </PopoverContent>
      </Popover>

      {/* Current entity crumb */}
      <span className="flex items-center gap-1.5 min-w-0 text-note font-medium text-foreground">
        <span className="truncate">{currentMeta.label}</span>
        {count !== undefined && (
          <span className="ml-0.5 text-note font-normal text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </span>
    </nav>
  )
}
