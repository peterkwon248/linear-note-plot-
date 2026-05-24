"use client"

import { Switch } from "@/components/ui/switch"
import { useSettingsStore } from "@/lib/settings-store"
import { useT } from "@/lib/i18n"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"

export default function EditorPage() {
  const t = useT()
  const lineNumbers = useSettingsStore((s) => s.lineNumbers)
  const setLineNumbers = useSettingsStore((s) => s.setLineNumbers)
  const wordWrap = useSettingsStore((s) => s.wordWrap)
  const setWordWrap = useSettingsStore((s) => s.setWordWrap)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const setTabSize = useSettingsStore((s) => s.setTabSize)
  const codeFontFamily = useSettingsStore((s) => s.codeFontFamily)
  const setCodeFontFamily = useSettingsStore((s) => s.setCodeFontFamily)
  return (
    <>
      <SettingsPageTitle>{t("settings.editor.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.editor.editing")}>
        <SettingRow label={t("settings.editor.linenumbers.label")} description={t("settings.editor.linenumbers.description")}>
          <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
        </SettingRow>
        <Divider />
        <SettingRow label={t("settings.editor.wordwrap.label")} description={t("settings.editor.wordwrap.description")}>
          <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title={t("settings.editor.codeblocks")}>
        <SettingRow label={t("settings.editor.tabsize.label")} description={t("settings.editor.tabsize.description")}>
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
        <SettingRow label={t("settings.editor.codefont.label")} description={t("settings.editor.codefont.description")}>
          <SelectControl
            value={codeFontFamily}
            onChange={(v) => setCodeFontFamily(v as "mono" | "sans")}
            options={[
              { label: t("settings.editor.codefont.mono"), value: "mono" },
              { label: t("settings.editor.codefont.sans"), value: "sans" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
