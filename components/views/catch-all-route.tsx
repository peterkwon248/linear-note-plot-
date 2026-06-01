"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { FolderDetailView } from "@/components/views/folder-detail-view"
import { setActiveTagId, setActiveLabelId, setActiveRoute } from "@/lib/table-route"

/**
 * Client catch-all for the formerly-dynamic routes — `/folder/[id]`,
 * `/tag/[id]`, `/label/[id]`, `/books/[id]` — unified into one route so
 * `output:'export'` has no per-id pages to pre-render (the ids are runtime
 * IndexedDB values). Branches on the live pathname:
 *
 *   - `/folder/{id}` → <FolderDetailView/> (renders its own UI + restores
 *       activeRoute/activeFolderId via its own effect)
 *   - `/tag|label/{id}` → apply the facet filter, then bounce to /notes
 *       (mirrors the former tag/[id] + label/[id] pages exactly)
 *   - `/books/{id}` → null. BooksView is always-mounted in (app)/layout.tsx
 *       and branches on activeRoute; table-route.syncFromPathname already
 *       restores `/books/{id}` on hard-load.
 *   - anything else → null
 *
 * This is the only thing layout.tsx renders into `children` (the isFallback
 * slot). The always-mounted view system in (app)/layout.tsx does the rest.
 */
export function CatchAllRoute() {
  const pathname = usePathname() ?? ""
  const router = useRouter()

  const isFolder = pathname.startsWith("/folder/")
  const isTag = pathname.startsWith("/tag/")
  const isLabel = pathname.startsWith("/label/")

  // Facet routes (tag/label) carry no standalone view — they set the filter
  // and redirect to the always-mounted Notes table. Effect (not render-time)
  // so router.replace runs after commit. Mirrors the former page behaviour.
  useEffect(() => {
    if (isTag) {
      setActiveTagId(pathname.slice("/tag/".length))
      setActiveRoute("/notes")
      router.replace("/notes")
    } else if (isLabel) {
      setActiveLabelId(pathname.slice("/label/".length))
      setActiveRoute("/notes")
      router.replace("/notes")
    }
  }, [pathname, isTag, isLabel, router])

  if (isFolder) {
    return <FolderDetailView id={pathname.slice("/folder/".length)} />
  }
  return null
}
