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

export default function ShortcutsPage() {
  return (
    <>
      <SettingsPageTitle>Keyboard Shortcuts</SettingsPageTitle>

      <SettingsCard title="General">
        {generalShortcuts.map((s, i) => (
          <div key={s.description}>
            {i > 0 && <Divider />}
            <ShortcutRow keys={s.keys} description={s.description} />
          </div>
        ))}
      </SettingsCard>

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

      <SettingsCard title="Triage">
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
