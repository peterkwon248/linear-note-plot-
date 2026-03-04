export type NoteStatus = "capture" | "reference" | "permanent" | "project"
export type NotePriority = "none" | "urgent" | "high" | "medium" | "low"

export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  category: string
  tags: string[]
  status: NoteStatus
  priority: NotePriority
  pinned: boolean
  archived: boolean
  isInbox: boolean
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  color: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export type ActiveView =
  | { type: "inbox" }
  | { type: "all" }
  | { type: "views" }
  | { type: "folder"; folderId: string }
  | { type: "archive" }
  | { type: "templates" }
  | { type: "insights" }
  | { type: "category"; categoryId: string }
  | { type: "pinned" }
  | { type: "tag"; tagId: string }
  | { type: "settings" }
