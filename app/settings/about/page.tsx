import {
  SettingsPageTitle,
  SettingsCard,
  SettingRow,
  Divider,
} from "@/components/settings-ui"

export default function AboutPage() {
  return (
    <>
      <SettingsPageTitle>About</SettingsPageTitle>

      <SettingsCard title="Plot">
        <SettingRow label="Version" description="Current application version">
          <span className="font-mono text-[13px] text-muted-foreground">0.1.0</span>
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
