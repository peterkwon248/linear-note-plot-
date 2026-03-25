/**
 * Plot custom SVG icons — extracted from plot-mockup-v3.jsx (canonical reference).
 * These replace Lucide icons for visual consistency with the mockup.
 *
 * All icons:
 * - viewBox="0 0 24 24"
 * - fill="none" stroke="currentColor"
 * - strokeWidth="1.5" (unless noted)
 * - strokeLinecap="round" strokeLinejoin="round"
 */

import { type SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const defaults = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
}

/* ── Activity Bar (Tier 1, 20px) ─────────────── */

export function IconInbox({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function IconNotes({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  )
}

export function IconWiki({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  )
}

export function IconOntology({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <line x1="12" y1="7.5" x2="5" y2="16.5" />
      <line x1="12" y1="7.5" x2="19" y2="16.5" />
      <line x1="7.5" y1="19" x2="16.5" y2="19" />
    </svg>
  )
}

export function IconCalendar({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function IconSun({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

export function IconMoon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function IconGear({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/* ── Sidebar Nav (14~16px) ───────────────────── */

export function IconDoc({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

export function IconFolder({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconTag({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function IconLabel({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M2 6h18l4 6-4 6H2z" />
    </svg>
  )
}

export function IconTemplate({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}

export function IconInsight({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <circle cx="12" cy="12" r="4" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export function IconCapture({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

export function IconPermanent({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M2 9h20" />
    </svg>
  )
}

export function IconPin({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

/* ── Action Icons ────────────────────────────── */

export function IconSearch({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconPlus({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconChevronLeft({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function IconChevronRight({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconTrash({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function IconClock({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function IconPanelRight({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  )
}

export function IconFilter({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function IconSort({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <line x1="4" y1="6" x2="16" y2="6" />
      <line x1="4" y1="12" x2="12" y2="12" />
      <line x1="4" y1="18" x2="8" y2="18" />
    </svg>
  )
}

export function IconMore({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function IconSparkle({ size = 14, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M12 2 L14.5 9 L22 9.5 L16 14.5 L18 22 L12 17.5 L6 22 L8 14.5 L2 9.5 L9.5 9Z" />
    </svg>
  )
}

export function IconPanelLeftClose({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <polyline points="15 9 12 12 15 15" />
    </svg>
  )
}

export function IconCheck({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconSnooze({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <path d="M2 4h6l-6 8h6" />
      <path d="M12 8h8l-8 10h8" />
    </svg>
  )
}

export function IconArrowLeft({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} {...defaults} {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/* ── Wiki Status Icons (Linear-style progression) ── */

/** Stub: dashed book outline, empty — placeholder article */
export function IconWikiStub({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeDasharray="3 2.5" />
    </svg>
  )
}

/** Article: solid book with content lines + bookmark ribbon — polished, finished article */
export function IconWikiArticle({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <line x1="8" y1="8" x2="14" y2="8" />
      <line x1="8" y1="12" x2="12" y2="12" />
      {/* bookmark ribbon */}
      <path d="M16 2v8l-1.5-1.5L13 10V2" fill="currentColor" fillOpacity={0.15} strokeWidth={1.3} />
    </svg>
  )
}
