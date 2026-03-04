"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Link from "@tiptap/extension-link"

interface TipTapEditorProps {
  content: Record<string, unknown>
  onChange?: (json: Record<string, unknown>, plainText: string) => void
  editable?: boolean
  placeholder?: string
}

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Link.configure({ openOnClick: false }),
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(
        editor.getJSON() as Record<string, unknown>,
        editor.getText()
      )
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-[14px] leading-relaxed text-foreground",
      },
    },
  })

  // Sync editable prop
  if (editor && editor.isEditable !== editable) {
    editor.setEditable(editable)
  }

  return (
    <>
      <EditorContent editor={editor} className="h-full w-full" />
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground) / 0.4);
          pointer-events: none;
          height: 0;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .tiptap ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .tiptap ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .tiptap ul {
          list-style-type: disc;
        }
        .tiptap ol {
          list-style-type: decimal;
        }
        .tiptap h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .tiptap h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .tiptap h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .tiptap mark {
          background-color: hsl(var(--accent) / 0.3);
          border-radius: 0.2rem;
          padding: 0.1rem 0.2rem;
        }
        .tiptap a {
          color: hsl(var(--accent));
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1rem;
          margin-left: 0;
          color: hsl(var(--muted-foreground));
        }
        .tiptap code {
          background-color: hsl(var(--secondary));
          border-radius: 0.25rem;
          padding: 0.15rem 0.3rem;
          font-size: 0.875em;
        }
        .tiptap pre {
          background-color: hsl(var(--secondary));
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
        }
        .tiptap hr {
          border-color: hsl(var(--border));
          margin: 1.5rem 0;
        }
      `}</style>
    </>
  )
}
