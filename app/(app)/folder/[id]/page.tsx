"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { setActiveFolderId, setActiveRoute } from "@/lib/table-route"

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    setActiveFolderId(id)
    setActiveRoute("/notes")
    router.replace("/notes")
  }, [id, router])

  return null
}
