import {
  SettingsPageTitle,
  SettingsCard,
  Divider,
} from "@/components/settings-ui"

const navShortcuts = [
  { keys: ["/"], description: "Open search" },
  { keys: ["G", "I"], description: "Go to Inbox" },
  { keys: ["G", "M"], description: "Go to All Notes" },
  { keys: ["G", "V"], description: "Go to Views" },
  { keys: ["C"], description: "Create new note" },
]

const editorShortcuts = [
  { keys: ["Esc"], description: "Back / Close panel" },
  { keys: ["Ctrl", "S"], description: "Save note" },
  { keys: ["Ctrl", "Shift", "P"], description: "Pin/Unpin note" },
  { keys: ["Ctrl", "Backspace"], description: "Delete note" },
]

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[13px] text-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="inline-flex min-w-[24px] items-center justify-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}

export default function ShortcutsPage() {
  return (
    <>
      <SettingsPageTitle>Keyboard Shortcuts</SettingsPageTitle>

      <SettingsCard title="Navigation">
        {navShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title="Editor">
        {editorShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>
    </>
  )
}
