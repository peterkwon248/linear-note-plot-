"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSettingsStore } from "@/lib/settings-store"

const startViewRoutes: Record<string, string> = {
  all: "/notes",
  inbox: "/inbox",
  pinned: "/notes",
}

export default function Page() {
  const router = useRouter()
  const startView = useSettingsStore((s) => s.startView)

  useEffect(() => {
    router.replace(startViewRoutes[startView] || "/notes")
  }, [router, startView])

  return null
}
