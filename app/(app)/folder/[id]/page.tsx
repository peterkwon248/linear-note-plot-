"use client"

import { use } from "react"
import { NoteListPage } from "@/components/note-list-page"

export default function FolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <NoteListPage filter={{ type: "folder", folderId: id }} />
}
