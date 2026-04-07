"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { setActiveRoute } from "@/lib/table-route"

/** Tags moved to Library — redirect */
export default function TagsPage() {
  const router = useRouter()
  useEffect(() => {
    setActiveRoute("/library/tags")
    router.replace("/library/tags")
  }, [router])
  return null
}
