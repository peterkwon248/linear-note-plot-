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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface InsertMenuProps {
  editor: Editor
}

export function InsertMenu({ editor }: InsertMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImage = () => {
    imageInputRef.current?.click()
  }

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleFile = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editor.chain().focus().insertContent(
        `<a href="${dataUrl}" download="${file.name}">${file.name}</a>`
      ).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ""
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
            fontSize: "13px",
            fontWeight: 500,
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-75"
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Image size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Image</span>
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
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
            fontSize: "13px",
          }}
          className="hover:text-foreground hover:bg-foreground/[0.06] focus:text-foreground focus:bg-foreground/[0.06]"
        >
          <Code size={14} strokeWidth={1.5} />
          <span style={{ flex: 1 }}>Code Block</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
