"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ShortcutRow } from "@/components/shortcut-row"
import {
  generalShortcuts,
  navShortcuts,
  editorShortcuts,
  triageShortcuts,
} from "@/lib/shortcuts-data"
import { usePlotStore } from "@/lib/store"

function ShortcutSection({
  title,
  shortcuts,
}: {
  title: string
  shortcuts: { keys: string[]; description: string }[]
}) {
  return (
    <div>
      <h4 className="mb-2 text-ui font-semibold text-foreground">
        {title}
      </h4>
      <div className="rounded-lg border border-border bg-card">
        {shortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <div className="border-t border-border" />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShortcutOverlay() {
  const open = usePlotStore((s) => s.shortcutOverlayOpen)
  const setOpen = usePlotStore((s) => s.setShortcutOverlayOpen)

  // "?" shortcut is now in hooks/use-global-shortcuts.ts

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>
          All available keyboard shortcuts for the application.
        </DialogDescription>
      </DialogHeader>
      <DialogContent
        className="sm:max-w-2xl gap-0 p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
        </div>

        {/* Body: 2-column grid */}
        <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-6">
            <ShortcutSection title="General" shortcuts={generalShortcuts} />
            <ShortcutSection title="Editor" shortcuts={editorShortcuts} />
          </div>
          <div className="flex flex-col gap-6">
            <ShortcutSection title="Navigation" shortcuts={navShortcuts} />
            <ShortcutSection title="Triage" shortcuts={triageShortcuts} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-border px-6 py-3 text-sm text-muted-foreground">
          Press{" "}
          <kbd className="inline-flex min-w-[20px] items-center justify-center rounded border border-border bg-secondary px-1 py-0.5 font-mono text-xs text-muted-foreground">
            ?
          </kbd>{" "}
          or{" "}
          <kbd className="inline-flex min-w-[20px] items-center justify-center rounded border border-border bg-secondary px-1 py-0.5 font-mono text-xs text-muted-foreground">
            Esc
          </kbd>{" "}
          to close
        </div>
      </DialogContent>
    </Dialog>
  )
}
