/**
 * Locale-aware date formatting for Plot.
 *
 * Built on top of `date-fns` + `date-fns/locale`. Pairs with `lib/i18n.ts`
 * so the user's Settings → Preferences → Language toggle drives both UI
 * strings (`useT()`) and date display (`useDateFormat()`).
 *
 * Korean follows the natural "큰→작은" ordering ("2026년 5월", "2026년 5월 24일")
 * while English uses the canonical "May 2026" form. Other locales fall
 * through to the default `MMMM yyyy` / `MMM d, yyyy` patterns until they
 * get their own entries — graceful degradation, never raw lookup keys.
 */
import { format, formatDistanceToNow } from "date-fns"
import { ko, ja, es, fr, de, enUS, type Locale as DateFnsLocale } from "date-fns/locale"
import { useSettingsStore } from "./settings-store"
import type { Locale } from "./i18n"

/** Map app locale → date-fns locale object. */
const DATE_LOCALES: Record<Locale, DateFnsLocale> = {
  en: enUS,
  ko,
  ja,
  es,
  fr,
  de,
}

/** Format strings per locale, per semantic slot. Add new slots as surfaces
 *  need them — keep the existing slots' contracts stable. */
interface DateFormatStrings {
  /** "May 2026" / "2026년 5월" / "2026年5月" — month/year header. */
  monthYear: string
  /** "May 24, 2026" / "2026년 5월 24일" — full date. */
  longDate: string
  /** "May 24" / "5월 24일" — month/day (no year). */
  monthDay: string
}

const DATE_FORMATS: Record<Locale, DateFormatStrings> = {
  en: { monthYear: "MMMM yyyy", longDate: "MMM d, yyyy", monthDay: "MMM d" },
  ko: { monthYear: "yyyy년 M월", longDate: "yyyy년 M월 d일", monthDay: "M월 d일" },
  ja: { monthYear: "yyyy年M月", longDate: "yyyy年M月d日", monthDay: "M月d日" },
  es: { monthYear: "MMMM yyyy", longDate: "d 'de' MMMM 'de' yyyy", monthDay: "d 'de' MMMM" },
  fr: { monthYear: "MMMM yyyy", longDate: "d MMMM yyyy", monthDay: "d MMMM" },
  de: { monthYear: "MMMM yyyy", longDate: "d. MMMM yyyy", monthDay: "d. MMMM" },
}

/** Standalone formatter — useful for non-React contexts (server, tests). */
export function formatDate(date: Date, slot: keyof DateFormatStrings, locale: Locale): string {
  const pattern = DATE_FORMATS[locale]?.[slot] ?? DATE_FORMATS.en[slot]
  const dateLocale = DATE_LOCALES[locale] ?? enUS
  return format(date, pattern, { locale: dateLocale })
}

/** React hook bound to the Settings store. Returns a record of formatters
 *  that re-render the caller whenever the active language changes. */
export function useDateFormat() {
  const lang = useSettingsStore((s) => s.language) as Locale
  return {
    monthYear: (d: Date) => formatDate(d, "monthYear", lang),
    longDate: (d: Date) => formatDate(d, "longDate", lang),
    monthDay: (d: Date) => formatDate(d, "monthDay", lang),
    /** Expose the active date-fns locale for direct callers (e.g.
     *  `formatDistanceToNow(d, { locale })`). */
    locale: DATE_LOCALES[lang] ?? enUS,
  }
}

/** Convenience hook for relative time strings ("1 hour ago" / "1시간 전").
 *  Wraps date-fns `formatDistanceToNow` with the active locale + `addSuffix`.
 *  Accepts Date or ISO string. Returns "" for invalid inputs (graceful). */
export function useRelativeTime() {
  const lang = useSettingsStore((s) => s.language) as Locale
  const locale = DATE_LOCALES[lang] ?? enUS
  return (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (Number.isNaN(d.getTime())) return ""
      return formatDistanceToNow(d, { addSuffix: true, locale })
    } catch {
      return ""
    }
  }
}
