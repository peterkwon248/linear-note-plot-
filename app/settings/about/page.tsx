"use client"

import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"
import { useT } from "@/lib/i18n"

export default function AboutPage() {
  const t = useT()
  return (
    <>
      <SettingsPageTitle>{t("settings.about.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.about.section")}>
        <SettingRow label={t("settings.about.version.label")} description={t("settings.about.version.description")}>
          <span className="font-mono text-ui text-muted-foreground">0.1.0</span>
        </SettingRow>
        <Divider />
        <SettingRow label={t("settings.about.built_with.label")} description={t("settings.about.built_with.description")}>
          <span className="text-ui text-muted-foreground">
            Next.js, Tailwind CSS, Zustand
          </span>
        </SettingRow>
        <Divider />
        <SettingRow label={t("settings.about.license.label")} description={t("settings.about.license.description")}>
          <span className="text-ui text-muted-foreground">MIT</span>
        </SettingRow>
      </SettingsCard>
    </>
  )
}
