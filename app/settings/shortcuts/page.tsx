"use client"

import {
  SettingsPageTitle,
  SettingsCard,
  Divider,
} from "@/components/settings-ui"
import { ShortcutRow } from "@/components/shortcut-row"
import {
  generalShortcuts,
  navShortcuts,
  editorShortcuts,
  triageShortcuts,
} from "@/lib/shortcuts-data"
import { useT } from "@/lib/i18n"

export default function ShortcutsPage() {
  const t = useT()
  return (
    <>
      <SettingsPageTitle>{t("settings.shortcuts.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.shortcuts.general")}>
        {generalShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.shortcuts.navigation")}>
        {navShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.shortcuts.editor")}>
        {editorShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title={t("settings.shortcuts.triage")}>
        {triageShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>
    </>
  )
}
