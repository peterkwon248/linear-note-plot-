"use client"

import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function EditorPage() {
  const spellcheck = useSettingsStore((s) => s.spellcheck)
  const setSpellcheck = useSettingsStore((s) => s.setSpellcheck)
  const lineNumbers = useSettingsStore((s) => s.lineNumbers)
  const setLineNumbers = useSettingsStore((s) => s.setLineNumbers)
  const wordWrap = useSettingsStore((s) => s.wordWrap)
  const setWordWrap = useSettingsStore((s) => s.setWordWrap)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const setTabSize = useSettingsStore((s) => s.setTabSize)
  const codeFontFamily = useSettingsStore((s) => s.codeFontFamily)
  const setCodeFontFamily = useSettingsStore((s) => s.setCodeFontFamily)
  const currentLineHighlight = useSettingsStore((s) => s.currentLineHighlight)
  const setCurrentLineHighlight = useSettingsStore((s) => s.setCurrentLineHighlight)

  return (
    <>
      <SettingsPageTitle>Editor</SettingsPageTitle>

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
        <Divider />
        <SettingRow label="Current line highlight" description="Highlight the line where the cursor is located">
          <Switch checked={currentLineHighlight} onCheckedChange={setCurrentLineHighlight} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Code blocks">
        <SettingRow label="Tab size" description="Number of spaces per tab">
          <SelectControl
            value={tabSize}
            onChange={(v) => setTabSize(v as "2" | "4")}
            options={[
              { label: "2 spaces", value: "2" },
              { label: "4 spaces", value: "4" },
            ]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Font family" description="Font used in code blocks">
          <SelectControl
            value={codeFontFamily}
            onChange={(v) => setCodeFontFamily(v as "mono" | "sans")}
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
