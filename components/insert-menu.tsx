"use client"

import { useRef, useState } from "react"
import { format } from "date-fns"
import { Editor } from "@tiptap/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Image as PhImage, Paperclip, Table as PhTable, CalendarDots, Minus as PhMinus,
  Code as PhCode, Plus as PhPlus, CaretRight, MathOperations, ListBullets,
  LinkSimple, Info, Article, Columns as PhColumns, Note as PhNote,
  IdentificationCard, Database, BookOpen, Asterisk,
} from "@/lib/editor/editor-icons"
import { usePlotStore } from "@/lib/store"
import { detectUrlType } from "@/lib/editor/url-detect"
import { persistAttachmentBlob } from "@/lib/store/helpers"
import { nanoid } from "nanoid"
import { NotePickerDialog } from "@/components/note-picker-dialog"
import { UrlInputDialog } from "@/components/editor/url-input-dialog"

interface InsertMenuProps {
  editor: Editor
  /** noteId is required to associate attachments with a note */
  noteId?: string
}

const ITEM_CLASS =
  "flex items-center gap-2 py-1.5 px-2.5 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-hover-bg focus:text-foreground focus:bg-hover-bg text-note"

export function InsertMenu({ editor, noteId }: InsertMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notePickerOpen, setNotePickerOpen] = useState(false)
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false)
  const addAttachment = usePlotStore((s) => s.addAttachment)

  const handleImage = () => {
    imageInputRef.current?.click()
  }

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read as ArrayBuffer for IDB storage
    const buffer = await file.arrayBuffer()

    // Save metadata to Zustand store
    const attachmentId = addAttachment({
      noteId: noteId ?? "",
      name: file.name,
      type: "image",
      url: "", // will be resolved via attachment:// protocol
      mimeType: file.type,
      size: file.size,
    })

    // Save binary blob to IDB
    persistAttachmentBlob({ id: attachmentId, data: buffer })

    // Insert image with attachment:// URL
    const pos = editor.state.selection.anchor
    editor.chain().focus().insertContentAt(pos, {
      type: "image",
      attrs: { src: `attachment://${attachmentId}`, alt: file.name },
    }).run()

    e.target.value = ""
  }

  const handleFile = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Read as ArrayBuffer for IDB storage
    const buffer = await file.arrayBuffer()

    // Save metadata to Zustand store
    const attachmentId = addAttachment({
      noteId: noteId ?? "",
      name: file.name,
      type: "file",
      url: "",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    })

    // Save binary blob to IDB
    persistAttachmentBlob({ id: attachmentId, data: buffer })

    // Insert as a downloadable link with attachment:// URL
    editor.chain().focus().insertContent(
      `<a href="attachment://${attachmentId}" download="${file.name}">${file.name} (${formatFileSize(file.size)})</a>`
    ).run()

    e.target.value = ""
  }

  /** Format bytes to human-readable size */
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const handleDate = () => {
    editor.chain().focus().insertContent(format(new Date(), "yyyy-MM-dd")).run()
  }

  const handleDivider = () => {
    editor.chain().focus().setHorizontalRule().run()
  }

  const handleCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run()
  }

  const handleEmbed = () => {
    setEmbedDialogOpen(true)
  }

  const handleEmbedSubmit = (url: string) => {
    const type = detectUrlType(url)
    if (type === "youtube") {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    } else if (type === "audio") {
      editor.chain().focus().insertContent({ type: "audio", attrs: { src: url } }).run()
    } else {
      editor.chain().focus().insertContent({ type: "linkCard", attrs: { url } }).run()
    }
    setEmbedDialogOpen(false)
  }

  const handleToggle = () => {
    editor.chain().focus().setDetails().run()
  }

  const handleInlineMath = () => {
    editor.chain().focus().insertContent({
      type: "inlineMath",
      attrs: { latex: "E = mc^2" },
    }).run()
  }

  const handleBlockMath = () => {
    editor.chain().focus().insertContent({
      type: "blockMath",
      attrs: { latex: "\\sum_{i=1}^{n} x_i" },
    }).run()
  }

  const handleTOC = () => {
    editor.chain().focus().insertContent({ type: "tocBlock" }).run()
  }

  const handleCallout = () => {
    editor.chain().focus().insertContent({ type: "calloutBlock", attrs: { calloutType: "info" }, content: [{ type: "paragraph" }] }).run()
  }

  const handleSummary = () => {
    editor.chain().focus().insertContent({ type: "summaryBlock", content: [{ type: "paragraph" }] }).run()
  }

  const handleColumns = () => {
    editor.chain().focus().insertContent({
      type: "columnsBlock",
      content: [
        { type: "columnCell", content: [{ type: "paragraph" }] },
        { type: "columnCell", content: [{ type: "paragraph" }] },
      ],
    }).run()
  }

  const handleInfobox = () => {
    editor.chain().focus().insertContent({
      type: "infoboxBlock",
      attrs: { title: "Info", rows: [{ label: "", value: "" }] },
    }).run()
  }

  const handleNoteEmbed = () => {
    setNotePickerOpen(true)
  }

  const onNoteSelected = (selectedNoteId: string) => {
    editor.chain().focus().insertContent({ type: "noteEmbed", attrs: { noteId: selectedNoteId } }).run()
  }

  const handleQuery = () => {
    editor.chain().focus().insertContent({ type: "queryBlock", attrs: { queryId: nanoid(8) } }).run()
  }

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
          {/* Media */}
          <DropdownMenuItem onSelect={handleImage} className={ITEM_CLASS}>
            <PhImage size={14} />
            <span className="flex-1">Image</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleEmbed} className={ITEM_CLASS}>
            <LinkSimple size={14} />
            <span className="flex-1">Embed URL</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleFile} className={ITEM_CLASS}>
            <Paperclip size={14} />
            <span className="flex-1">File</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          {/* Structure */}
          <DropdownMenuItem onSelect={handleTable} className={ITEM_CLASS}>
            <PhTable size={14} />
            <span className="flex-1">Table</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleQuery} className={ITEM_CLASS}>
            <Database size={14} />
            <span className="flex-1">Query</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleTOC} className={ITEM_CLASS}>
            <ListBullets size={14} />
            <span className="flex-1">Table of Contents</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleCallout} className={ITEM_CLASS}>
            <Info size={14} />
            <span className="flex-1">Callout</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleSummary} className={ITEM_CLASS}>
            <Article size={14} />
            <span className="flex-1">Summary</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleColumns} className={ITEM_CLASS}>
            <PhColumns size={14} />
            <span className="flex-1">Columns</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleNoteEmbed} className={ITEM_CLASS}>
            <PhNote size={14} />
            <span className="flex-1">Embed Note</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => window.dispatchEvent(new CustomEvent("plot:embed-wiki-pick", { detail: { editor } }))} className={ITEM_CLASS}>
            <BookOpen size={14} />
            <span className="flex-1">Embed Wiki</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleInfobox} className={ITEM_CLASS}>
            <IdentificationCard size={14} />
            <span className="flex-1">Infobox</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleDate} className={ITEM_CLASS}>
            <CalendarDots size={14} />
            <span className="flex-1">Date</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => {
            editor.chain().focus().insertContent({
              type: "footnoteRef",
              attrs: { id: nanoid(8), content: "", referenceId: null, comment: null },
            }).run()
          }} className={ITEM_CLASS}>
            <Asterisk size={14} />
            <span className="flex-1">Footnote</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          {/* Blocks */}
          <DropdownMenuItem onSelect={handleDivider} className={ITEM_CLASS}>
            <PhMinus size={14} />
            <span className="flex-1">Divider</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleCodeBlock} className={ITEM_CLASS}>
            <PhCode size={14} />
            <span className="flex-1">Code Block</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleToggle} className={ITEM_CLASS}>
            <CaretRight size={14} />
            <span className="flex-1">Toggle</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />

          {/* Math */}
          <DropdownMenuItem onSelect={handleInlineMath} className={ITEM_CLASS}>
            <MathOperations size={14} />
            <span className="flex-1">Inline Math</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleBlockMath} className={ITEM_CLASS}>
            <MathOperations size={14} />
            <span className="flex-1">Block Math</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NotePickerDialog
        open={notePickerOpen}
        onOpenChange={setNotePickerOpen}
        title="Embed a note"
        excludeIds={noteId ? [noteId] : []}
        onSelect={onNoteSelected}
      />
      <UrlInputDialog
        open={embedDialogOpen}
        mode="embed"
        onClose={() => setEmbedDialogOpen(false)}
        onSubmit={handleEmbedSubmit}
      />
    </>
  )
}
