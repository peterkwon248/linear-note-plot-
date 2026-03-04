"use client"

import { useState } from "react"
import {
  ArrowLeft,
  SlidersHorizontal,
  Palette,
  PenTool,
  Keyboard,
  Cloud,
  Download,
  Info,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
} from "lucide-react"
import { usePlotStore } from "@/lib/store"
import { Switch } from "@/components/ui/switch"

type SettingsPage =
  | "preferences"
  | "appearance"
  | "editor"
  | "shortcuts"
  | "sync"
  | "backup"
  | "about"

interface SettingsNavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function SettingsNavItem({ icon, label, active, onClick }: SettingsNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-2.5 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground first:pt-0">
      {title}
    </div>
  )
}

/* ── Setting row components ── */

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-[12px] text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border" />
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-[13px] font-semibold text-foreground">{title}</h3>
      <div className="rounded-lg border border-border bg-card">{children}</div>
    </div>
  )
}

function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-border bg-secondary px-3 py-1.5 pr-7 text-[13px] text-foreground outline-none transition-colors hover:border-muted-foreground/30 focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/* ── Page contents ── */

function PreferencesPage() {
  const [language, setLanguage] = useState("en")
  const [startView, setStartView] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(true)
  const [markdown, setMarkdown] = useState(true)

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Preferences</h1>

      <SettingsCard title="General">
        <SettingRow label="Language" description="Interface display language">
          <SelectControl
            value={language}
            onChange={setLanguage}
            options={[
              { label: "English", value: "en" },
              { label: "Spanish", value: "es" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
              { label: "Japanese", value: "ja" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Start view" description="Default view when opening the app">
          <SelectControl
            value={startView}
            onChange={setStartView}
            options={[
              { label: "All Notes", value: "all" },
              { label: "Inbox", value: "inbox" },
              { label: "Pinned", value: "pinned" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label="Confirm before deleting"
          description="Show confirmation dialog when deleting notes"
        >
          <Switch checked={confirmDelete} onCheckedChange={setConfirmDelete} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Markdown">
        <SettingRow
          label="Live markdown preview"
          description="Render markdown formatting as you type"
        >
          <Switch checked={markdown} onCheckedChange={setMarkdown} />
        </SettingRow>
      </SettingsCard>
    </>
  )
}

function AppearancePage() {
  const [theme, setTheme] = useState("dark")
  const [fontSize, setFontSize] = useState("14")
  const [density, setDensity] = useState("default")

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ]

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Appearance</h1>

      <SettingsCard title="Interface and theme">
        <div className="px-4 py-4">
          <span className="mb-3 block text-[13px] font-medium text-foreground">Theme</span>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 text-[12px] transition-colors ${
                  theme === t.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <t.icon className="h-5 w-5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <SettingRow label="Interface font size" description="Controls the base font size">
          <SelectControl
            value={fontSize}
            onChange={setFontSize}
            options={[
              { label: "12px", value: "12" },
              { label: "13px", value: "13" },
              { label: "14px", value: "14" },
              { label: "15px", value: "15" },
              { label: "16px", value: "16" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Display density" description="Compact or comfortable spacing">
          <SelectControl
            value={density}
            onChange={setDensity}
            options={[
              { label: "Compact", value: "compact" },
              { label: "Default", value: "default" },
              { label: "Comfortable", value: "comfortable" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}

function EditorPage() {
  const [spellcheck, setSpellcheck] = useState(true)
  const [lineNumbers, setLineNumbers] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [tabSize, setTabSize] = useState("2")
  const [fontFamily, setFontFamily] = useState("mono")

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Editor</h1>

      <SettingsCard title="Editing">
        <SettingRow label="Spellcheck" description="Enable browser spellcheck in the editor">
          <Switch checked={spellcheck} onCheckedChange={setSpellcheck} />
        </SettingRow>
        <Divider />
        <SettingRow label="Line numbers" description="Show line numbers in the editor gutter">
          <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
        </SettingRow>
        <Divider />
        <SettingRow label="Word wrap" description="Wrap long lines instead of horizontal scroll">
          <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Code blocks">
        <SettingRow label="Tab size" description="Number of spaces per tab">
          <SelectControl
            value={tabSize}
            onChange={setTabSize}
            options={[
              { label: "2 spaces", value: "2" },
              { label: "4 spaces", value: "4" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Font family" description="Font used in code blocks">
          <SelectControl
            value={fontFamily}
            onChange={setFontFamily}
            options={[
              { label: "Monospace", value: "mono" },
              { label: "Sans-serif", value: "sans" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}

function ShortcutsPage() {
  const shortcuts = [
    { keys: ["/"], description: "Open search" },
    { keys: ["G", "I"], description: "Go to Inbox" },
    { keys: ["G", "M"], description: "Go to All Notes" },
    { keys: ["G", "V"], description: "Go to Views" },
    { keys: ["C"], description: "Create new note" },
    { keys: ["Esc"], description: "Back / Close panel" },
    { keys: ["Ctrl", "S"], description: "Save note" },
    { keys: ["Ctrl", "Shift", "P"], description: "Pin/Unpin note" },
    { keys: ["Ctrl", "Backspace"], description: "Delete note" },
  ]

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Keyboard Shortcuts</h1>

      <SettingsCard title="Navigation">
        {shortcuts.slice(0, 5).map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex min-w-[24px] items-center justify-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title="Editor">
        {shortcuts.slice(5).map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex min-w-[24px] items-center justify-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          </div>
        ))}
      </SettingsCard>
    </>
  )
}

function SyncPage() {
  const [autoSync, setAutoSync] = useState(false)

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Sync & Storage</h1>

      <SettingsCard title="Sync">
        <SettingRow
          label="Auto-sync"
          description="Automatically sync notes across devices"
        >
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </SettingRow>
        <Divider />
        <SettingRow
          label="Storage location"
          description="Where your notes are stored"
        >
          <span className="text-[13px] text-muted-foreground">Local (browser)</span>
        </SettingRow>
      </SettingsCard>
    </>
  )
}

function BackupPage() {
  const notes = usePlotStore((s) => s.notes)

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Backup & Export</h1>

      <SettingsCard title="Export">
        <SettingRow
          label="Export all notes"
          description={`Export ${notes.length} notes as JSON`}
        >
          <button
            onClick={() => {
              const data = JSON.stringify(notes, null, 2)
              const blob = new Blob([data], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "plot-notes-export.json"
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-secondary/80"
          >
            Export JSON
          </button>
        </SettingRow>
        <Divider />
        <SettingRow
          label="Export as Markdown"
          description="Download each note as a .md file"
        >
          <button className="rounded-md border border-border bg-secondary px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-secondary/80">
            Export Markdown
          </button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Danger zone">
        <SettingRow
          label="Delete all notes"
          description="Permanently remove all notes. This cannot be undone."
        >
          <button className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[13px] text-destructive transition-colors hover:bg-destructive/20">
            Delete All
          </button>
        </SettingRow>
      </SettingsCard>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">About</h1>

      <SettingsCard title="Plot">
        <SettingRow label="Version" description="Current application version">
          <span className="text-[13px] font-mono text-muted-foreground">0.1.0</span>
        </SettingRow>
        <Divider />
        <SettingRow label="Built with" description="Framework and tools">
          <span className="text-[13px] text-muted-foreground">
            Next.js, Tailwind CSS, Zustand
          </span>
        </SettingRow>
        <Divider />
        <SettingRow label="License" description="Open source license">
          <span className="text-[13px] text-muted-foreground">MIT</span>
        </SettingRow>
      </SettingsCard>
    </>
  )
}

/* ── Main Settings View ── */

export function SettingsView() {
  const [activePage, setActivePage] = useState<SettingsPage>("preferences")
  const setActiveView = usePlotStore((s) => s.setActiveView)

  const navItems: { section: string; items: { id: SettingsPage; label: string; icon: React.ReactNode }[] }[] = [
    {
      section: "General",
      items: [
        { id: "preferences", label: "Preferences", icon: <SlidersHorizontal className="h-4 w-4" /> },
        { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
        { id: "editor", label: "Editor", icon: <PenTool className="h-4 w-4" /> },
        { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="h-4 w-4" /> },
      ],
    },
    {
      section: "Data",
      items: [
        { id: "sync", label: "Sync & Storage", icon: <Cloud className="h-4 w-4" /> },
        { id: "backup", label: "Backup & Export", icon: <Download className="h-4 w-4" /> },
      ],
    },
    {
      section: "Info",
      items: [
        { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
      ],
    },
  ]

  const pageContent: Record<SettingsPage, React.ReactNode> = {
    preferences: <PreferencesPage />,
    appearance: <AppearancePage />,
    editor: <EditorPage />,
    shortcuts: <ShortcutsPage />,
    sync: <SyncPage />,
    backup: <BackupPage />,
    about: <AboutPage />,
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Settings sidebar */}
      <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-background">
        <div className="px-2 pt-3 pb-2">
          <button
            onClick={() => setActiveView({ type: "all" })}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to app</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {navItems.map((group) => (
            <div key={group.section}>
              <SectionHeader title={group.section} />
              <div className="space-y-px">
                {group.items.map((item) => (
                  <SettingsNavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activePage === item.id}
                    onClick={() => setActivePage(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Settings content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-[900px] px-10 py-8">
          {pageContent[activePage]}
        </div>
      </main>
    </div>
  )
}
