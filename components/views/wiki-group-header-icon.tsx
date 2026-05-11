import { Tree } from "@phosphor-icons/react/dist/ssr/Tree"
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack"
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple"
import type { GroupBy } from "@/lib/view-engine/types"
import type { WikiCategory } from "@/lib/types"

interface WikiGroupHeaderIconProps {
  groupBy: GroupBy
  groupKey: string
  wikiCategories: WikiCategory[]
  size?: number
}

export function WikiGroupHeaderIcon({
  groupBy,
  groupKey,
  wikiCategories,
  size = 16,
}: WikiGroupHeaderIconProps) {
  switch (groupBy) {
    case "family":
      return <Tree className="text-muted-foreground shrink-0" size={size} weight="regular" />
    case "tier":
      return <Stack className="text-muted-foreground shrink-0" size={size} weight="regular" />
    case "linkCount":
      return <LinkSimple className="text-muted-foreground shrink-0" size={size} weight="regular" />
    case "label": {
      if (groupKey === "_no_label") {
        return <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground" />
      }
      const categoryId = groupKey.startsWith("label-") ? groupKey.slice("label-".length) : groupKey
      const color = wikiCategories.find((c) => c.id === categoryId)?.color
      return color ? (
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground" />
      )
    }
    default:
      return null
  }
}
