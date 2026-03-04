"use client"

import { use } from "react"
import { NoteListPage } from "@/components/note-list-page"

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <NoteListPage filter={{ type: "category", categoryId: id }} />
}
