"use client"

import { useRef, useState, Fragment } from "react"
import { Editor } from "@tiptap/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Image as PhImage,
  Paperclip,
  Plus as PhPlus,
} from "@/lib/editor/editor-icons"
import { Layout as PhLayout } from "@phosphor-icons/react/dist/ssr/Layout"
import { usePlotStore } from "@/lib/store"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import {
  BLOCK_REGISTRY,
  type BlockGroup,
} from "@/components/editor/block-registry"
import { SelectFromTemplatesModal } from "@/components/editor/SelectFromTemplatesModal"

interface InsertMenuProps {
  editor: Editor
  /** noteId is required to associate attachments with a note */
  noteId?: string
}

const ITEM_CLASS =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-hover-bg focus:text-foreground focus:bg-hover-bg text-note"

/** Display order for groups in the Insert dropdown. */
const GROUP_ORDER: BlockGroup[] = [
  "embed",
  "structure",
  "layout",
  "text",
  "field",
  "math",
]

/** Format bytes to human-readable size. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function InsertMenu({ editor, noteId }: InsertMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addAttachment = usePlotStore((s) => s.addAttachment)
  // Templates entry — UpNote-pattern modal trigger (33-decisions §15).
  const [templatesOpen, setTemplatesOpen] = useState(false)

  // ── Attachments (kept local — need file-input refs and noteId) ────────
  const handleImage = () => imageInputRef.current?.click()

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const attachmentId = addAttachment({
      noteId: noteId ?? "",
      name: file.name,
      type: "image",
      url: "",
      mimeType: file.type,
      size: file.size,
    })
    persistAttachmentBlob({ id: attachmentId, data: buffer })

    const pos = editor.state.selection.anchor
    editor
      .chain()
      .focus()
      .insertContentAt(pos, {
        type: "image",
        attrs: { src: `attachment://${attachmentId}`, alt: file.name },
      })
      .run()

    e.target.value = ""
  }

  const handleFile = () => fileInputRef.current?.click()

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const attachmentId = addAttachment({
      noteId: noteId ?? "",
      name: file.name,
      type: "file",
      url: "",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    })
    persistAttachmentBlob({ id: attachmentId, data: buffer })

    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="attachment://${attachmentId}" download="${file.name}">${file.name} (${formatFileSize(file.size)})</a>`,
      )
      .run()

    e.target.value = ""
  }

  // ── Registry-driven items ────────────────────────────────────────────
  const menuItems = BLOCK_REGISTRY.filter((e) => e.surfaces.includes("insertMenu"))

  // Group by BlockGroup, maintain GROUP_ORDER.
  const byGroup = new Map<BlockGroup, typeof menuItems>()
  for (const item of menuItems) {
    const bucket = byGroup.get(item.group) ?? []
    bucket.push(item)
    byGroup.set(item.group, bucket)
  }

  const groupSections = GROUP_ORDER.map((group) => byGroup.get(group) ?? []).filter(
    (arr) => arr.length > 0,
  )

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={onImageSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelected}
        className="hidden"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onMouseDown={(e) => e.preventDefault()}
            title="Insert"
            className="h-7 rounded-md flex items-center justify-center gap-1 shrink-0 cursor-pointer text-muted-foreground bg-transparent border-0 outline-none px-2 font-medium text-note hover:text-foreground hover:bg-hover-bg transition-colors duration-100"
          >
            <PhPlus size={14} />
            <span>Insert</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px] p-1">
          {/* Attachments (Image + File) — kept as hardcoded entries since they
              need file-input refs and noteId that don't fit the registry shape. */}
          <DropdownMenuItem onSelect={handleImage} className={ITEM_CLASS}>
            <PhImage size={14} />
            <span className="flex-1">Image</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleFile} className={ITEM_CLASS}>
            <Paperclip size={14} />
            <span className="flex-1">File</span>
          </DropdownMenuItem>

          {/* Templates — opens the UpNote-pattern picker modal. Hardcoded
              entry (not registry-driven) because it needs local React state
              to drive the modal's open/close. */}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            onSelect={(e) => {
              // Prevent the dropdown from stealing focus before modal mounts.
              e.preventDefault()
              setTemplatesOpen(true)
            }}
            className={ITEM_CLASS}
          >
            <PhLayout size={14} />
            <span className="flex-1">Templates…</span>
          </DropdownMenuItem>

          {/* Registry-driven sections, grouped with separators between groups. */}
          {groupSections.map((section) => (
            <Fragment key={section[0]!.group}>
              <DropdownMenuSeparator className="my-1" />
              {section.map((entry) => {
                const Icon = entry.icon
                return (
                  <DropdownMenuItem
                    key={entry.id}
                    onSelect={() => entry.execute({ editor, noteId })}
                    className={ITEM_CLASS}
                  >
                    <Icon size={14} />
                    <span className="flex-1">{entry.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal lives outside DropdownMenu so it survives the dropdown
          unmounting on close. Same editor instance — selecting a template
          inserts at the current cursor. */}
      <SelectFromTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        editor={editor}
      />
    </>
  )
}
