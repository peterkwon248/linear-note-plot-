"use client"

import { usePlotStore } from "@/lib/store"
import type { WikiLayout } from "@/lib/types"
import { useT } from "@/lib/i18n"
import { LayoutTemplate as Layout } from "lucide-react"
import { cn } from "@/lib/utils"

interface WikiLayoutToggleProps {
  articleId: string
  layout?: WikiLayout
  /** If true, show icon + label (used in primary wiki view). If false, label only (used in secondary panel). */
  showIcon?: boolean
}

export function WikiLayoutToggle({ articleId, layout, showIcon = true }: WikiLayoutToggleProps) {
  const t = useT()
  const updateWikiArticle = usePlotStore((s) => s.updateWikiArticle)

  const isEncyclopedia = layout === "encyclopedia"
  const next = isEncyclopedia ? "default" : "encyclopedia"

  return (
    <button
      onClick={() => updateWikiArticle(articleId, { layout: next })}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-note font-medium transition-colors duration-150",
        isEncyclopedia
          ? "bg-accent/15 text-accent hover:bg-accent/25"
          : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"
      )}
      title={isEncyclopedia ? t("wiki.layout.switch_default") : t("wiki.layout.switch_encyclopedia")}
    >
      {showIcon && <Layout size={14} strokeWidth={2} />}
      {isEncyclopedia ? t("wiki.layout.encyclopedia") : t("wiki.layout.default")}
    </button>
  )
}
