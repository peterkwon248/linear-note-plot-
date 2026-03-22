"use client"

import { useRef } from "react"
import { format } from "date-fns"
import { Editor } from "@tiptap/react"
import {
  Image,
  Paperclip,
  Table,
  CalendarDays,
  Minus,
  Code,
  Plus,
  Play,
  ChevronRight,
  Sigma,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlotStore } from "@/lib/store"
import { persistAttachmentBlob } from "@/lib/store/helpers"

interface InsertMenuProps {
  editor: Editor
  /** noteId is required to associate attachments with a note */
  noteId?: string
}

export function InsertMenu({ editor, noteId }: InsertMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleYoutube = () => {
    const url = window.prompt("Enter YouTube URL:")
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  const handleToggle = () => {
    editor.chain().focus().setDetails().run()
  }

  const handleInlineMath = () => {
    editor.chain().focus().insertContent("$E = mc^2$").run()
  }

  const handleBlockMath = () => {
    editor.chain().focus().insertContent("$$\n\\sum_{i=1}^{n} x_i\n$$").run()
  }

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={onImageSelected}
        style={{ display: "none" }}
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelected}
        style={{ display: "none" }}
      />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onMouseDown={(e) => e.preventDefault()}
          title="Insert"
          style={{
            height: "28px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            flexShrink: 0,
            cursor: "pointer",
            color: "var(--muted-foreground)",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            padding: "0 8px",
            fontWeight: 500,
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-75"
        >
          <Plus size={14} strokeWidth={2} />
          <span>Insert</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        style={{
          backgroundColor: "var(--popover)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
          minWidth: "180px",
          padding: "4px",
        }}
      >
        <DropdownMenuItem
          onSelect={handleImage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Image size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Image</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleYoutube}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Play size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>YouTube</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleFile}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Paperclip size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>File</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator style={{ backgroundColor: "var(--border)", margin: "4px 0" }} />

        <DropdownMenuItem
          onSelect={handleTable}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Table size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Table</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleDate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <CalendarDays size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Date</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator style={{ backgroundColor: "var(--border)", margin: "4px 0" }} />

        <DropdownMenuItem
          onSelect={handleDivider}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Minus size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Divider</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleCodeBlock}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Code size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Code Block</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <ChevronRight size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Toggle</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator style={{ backgroundColor: "var(--border)", margin: "4px 0" }} />

        <DropdownMenuItem
          onSelect={handleInlineMath}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Sigma size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Inline Math</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleBlockMath}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
          className="text-note hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Sigma size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Block Math</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
