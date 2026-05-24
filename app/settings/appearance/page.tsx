"use client"

import { useSettingsStore } from "@/lib/settings-store"
import { useT } from "@/lib/i18n"
import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
  SelectControl,
} from "@/components/settings-ui"
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon"
import { Sun } from "@phosphor-icons/react/dist/ssr/Sun"
import { Monitor } from "@phosphor-icons/react/dist/ssr/Monitor"

export default function AppearancePage() {
  const t = useT()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const setFontSize = useSettingsStore((s) => s.setFontSize)
  const density = useSettingsStore((s) => s.density)
  const setDensity = useSettingsStore((s) => s.setDensity)

  const themes = [
    { id: "light" as const, label: t("settings.appearance.theme.light"), icon: Sun },
    { id: "dark" as const, label: t("settings.appearance.theme.dark"), icon: Moon },
    { id: "system" as const, label: t("settings.appearance.theme.system"), icon: Monitor },
  ]

  return (
    <>
      <SettingsPageTitle>{t("settings.appearance.title")}</SettingsPageTitle>

      <SettingsCard title={t("settings.appearance.section")}>
        <div className="px-4 py-4">
          <span className="mb-3 block text-ui font-medium text-foreground">
            {t("settings.appearance.theme")}
          </span>
          <div className="flex gap-2">
            {themes.map((tt) => (
              <button
                key={tt.id}
                onClick={() => setTheme(tt.id)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 text-note transition-colors ${
                  theme === tt.id
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                }`}
              >
                <tt.icon className="h-5 w-5" />
                <span>{tt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Divider />
        <SettingRow label={t("settings.appearance.fontsize.label")} description={t("settings.appearance.fontsize.description")}>
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
        <SettingRow label={t("settings.appearance.density.label")} description={t("settings.appearance.density.description")}>
          <SelectControl
            value={density}
            onChange={(v) => setDensity(v as "compact" | "default" | "comfortable")}
            options={[
              { label: t("settings.appearance.density.compact"), value: "compact" },
              { label: t("settings.appearance.density.default"), value: "default" },
              { label: t("settings.appearance.density.comfortable"), value: "comfortable" },
            ]}
          />
        </SettingRow>
      </SettingsCard>
    </>
  )
}
