"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function EditorPage() {
  const [spellcheck, setSpellcheck] = useState(true)
  const [lineNumbers, setLineNumbers] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [tabSize, setTabSize] = useState("2")
  const [fontFamily, setFontFamily] = useState("mono")

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
