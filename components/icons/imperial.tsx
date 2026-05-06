"use client"

/**
 * Imperial Icon Kit — Linear-inspired stroked SVG icons.
 *
 * Spec: 1.5px stroke · 24 viewBox · currentColor · round caps & joins
 * Source: plot-v3-mockup/imperial-ui.jsx (converted to TSX)
 *
 * Props:
 *   size      — width/height in px (default 20)
 *   className — CSS class forwarded to <svg>
 *   style     — inline style forwarded to <svg>
 *
 * No `weight` prop — stroke is fixed at 1.5px.
 * Use `strokeWidth` prop to override (rare).
 */

import * as React from "react"

export interface IconProps {
  size?: number | string
  className?: string
  style?: React.CSSProperties
  strokeWidth?: number
  /** Explicitly disallow the Phosphor `weight` prop so TypeScript surfaces
   *  any lingering callers as a compile-time error. */
  weight?: never
}

/** Internal factory — mirrors the `mk()` helper from imperial-ui.jsx */
function mk(paths: React.ReactElement[]): React.FC<IconProps> {
  const Comp: React.FC<IconProps> = ({ size = 20, strokeWidth = 1.5, className = "", style }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      {paths.map((p, i) => React.cloneElement(p, { key: i }))}
    </svg>
  )
  return Comp
}

// ============ NAVIGATION ============
export const Home = mk([<path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-4v-7h-7v7h-4A1.5 1.5 0 0 1 3 20Z"/>])
export const Compass = mk([<circle cx="12" cy="12" r="9"/>, <path d="m15.5 8.5-2 5.5-5.5 2 2-5.5z"/>])
export const MapIcon = mk([<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>, <path d="M9 4v16M15 6v16"/>])
export const Layout = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <path d="M3 9h18M9 21V9"/>])
export const Sidebar = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <path d="M9 3v18"/>])
export const Menu = mk([<path d="M4 6h16M4 12h16M4 18h16"/>])
export const Grid = mk([<rect x="3" y="3" width="7" height="7" rx="1"/>, <rect x="14" y="3" width="7" height="7" rx="1"/>, <rect x="3" y="14" width="7" height="7" rx="1"/>, <rect x="14" y="14" width="7" height="7" rx="1"/>])
export const Globe = mk([<circle cx="12" cy="12" r="9"/>, <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18"/>])
export const ExternalLink = mk([<path d="M14 4h6v6"/>, <path d="M20 4 10 14"/>, <path d="M19 13v6a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5h6"/>])

// ============ ARROWS & CHEVRONS ============
export const ArrowUp = mk([<path d="M12 19V5M5 12l7-7 7 7"/>])
export const ArrowDown = mk([<path d="M12 5v14M5 12l7 7 7-7"/>])
export const ArrowLeft = mk([<path d="M19 12H5M12 5l-7 7 7 7"/>])
export const ArrowRight = mk([<path d="M5 12h14M12 5l7 7-7 7"/>])
export const ArrowUpRight = mk([<path d="M7 17 17 7M8 7h9v9"/>])
export const ChevronUp = mk([<path d="m6 15 6-6 6 6"/>])
export const ChevronDown = mk([<path d="m6 9 6 6 6-6"/>])
export const ChevronLeft = mk([<path d="m15 18-6-6 6-6"/>])
export const ChevronRight = mk([<path d="m9 18 6-6-6-6"/>])
export const ChevronsUpDown = mk([<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>])
export const CornerDownRight = mk([<path d="m15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12"/>])
export const Refresh = mk([<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/>, <path d="M21 3v5h-5"/>])
export const RotateCw = mk([<path d="M21 12a9 9 0 1 1-3-6.7"/>, <path d="M21 4v5h-5"/>])
export const Move = mk([<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>])

// ============ ACTIONS ============
export const Plus = mk([<path d="M12 5v14M5 12h14"/>])
export const Minus = mk([<path d="M5 12h14"/>])
export const Close = mk([<path d="M18 6 6 18M6 6l12 12"/>])
export const Check = mk([<path d="m4 12 5 5L20 6"/>])
export const Edit = mk([<path d="M12 20h9"/>, <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/>])
export const Trash = mk([<path d="M3 6h18M8 6V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 4v2M5.5 6l1 13.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 6"/>, <path d="M10 11v6M14 11v6"/>])
export const Copy = mk([<rect x="8" y="8" width="13" height="13" rx="2"/>, <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>])
export const Save = mk([<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>, <path d="M17 21v-8H7v8M7 3v5h8"/>])
export const Share = mk([<circle cx="6" cy="12" r="3"/>, <circle cx="18" cy="6" r="3"/>, <circle cx="18" cy="18" r="3"/>, <path d="m8.6 10.5 6.8-3M8.6 13.5l6.8 3"/>])
export const Download = mk([<path d="M12 3v13M7 11l5 5 5-5M5 21h14"/>])
export const Upload = mk([<path d="M12 16V3M7 8l5-5 5 5M5 21h14"/>])
export const Send = mk([<path d="M22 2 11 13"/>, <path d="M22 2 15 22l-4-9-9-4Z"/>])
export const Bookmark = mk([<path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>])
export const Pin = mk([<path d="M9 3h6M12 3v8M5 13l7-2 7 2-3 3v3h-8v-3Z"/>, <path d="M12 19v3"/>])
export const Star = mk([<path d="M12 3 14.5 9.5 21.5 10l-5.5 4.5L17.5 21 12 17.5 6.5 21l1.5-6.5L2.5 10l7-.5Z"/>])
export const Heart = mk([<path d="M12 21s-7-4.5-9.5-9.5C1 8 3.5 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 6 4 4.5 7.5C19 16.5 12 21 12 21Z"/>])
export const Flag = mk([<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>])

// ============ STATUS & FEEDBACK ============
export const CheckCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="m8 12 3 3 5-6"/>])
export const XCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="m15 9-6 6M9 9l6 6"/>])
export const AlertCircle = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 8v4"/>, <circle cx="12" cy="16" r="0.5" fill="currentColor"/>])
export const AlertTriangle = mk([<path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>, <path d="M12 9v4"/>, <circle cx="12" cy="17" r="0.5" fill="currentColor"/>])
export const Info = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 16v-4"/>, <circle cx="12" cy="8" r="0.5" fill="currentColor"/>])
export const Help = mk([<circle cx="12" cy="12" r="9"/>, <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5"/>, <circle cx="12" cy="17" r="0.5" fill="currentColor"/>])
export const Loader = mk([<path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>])
export const Zap = mk([<path d="M13 2 3 14h7l-1 8L19 10h-7Z"/>])
export const Shield = mk([<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6Z"/>])
export const Lock = mk([<rect x="4" y="11" width="16" height="10" rx="2"/>, <path d="M8 11V7a4 4 0 0 1 8 0v4"/>])
export const Unlock = mk([<rect x="4" y="11" width="16" height="10" rx="2"/>, <path d="M8 11V7a4 4 0 0 1 7.5-2"/>])

// ============ COMMUNICATION ============
export const Mail = mk([<rect x="3" y="5" width="18" height="14" rx="2"/>, <path d="m3 7 9 6 9-6"/>])
export const Inbox = mk([<path d="M22 12h-6l-2 3h-4l-2-3H2"/>, <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6L18.5 5.1A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z"/>])
export const Message = mk([<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11Z"/>])
export const Messages = mk([<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/>, <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>])
export const Bell = mk([<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>, <path d="M13.7 21a2 2 0 0 1-3.4 0"/>])
export const BellOff = mk([<path d="M13.7 21a2 2 0 0 1-3.4 0M18.6 13.4A14 14 0 0 1 18 8a6 6 0 0 0-9.3-5M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h15M3 3l18 18"/>])
export const Phone = mk([<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.4c1 .3 2 .6 3 .7a2 2 0 0 1 1.7 2Z"/>])
export const Video = mk([<path d="m23 7-7 5 7 5Z"/>, <rect x="1" y="5" width="15" height="14" rx="2"/>])
export const Mic = mk([<rect x="9" y="2" width="6" height="12" rx="3"/>, <path d="M19 10a7 7 0 0 1-14 0M12 19v3"/>])
export const Megaphone = mk([<path d="M3 11v2a2 2 0 0 0 2 2h1l3 5 2-1-2-4h2l8 4V5l-8 4H5a2 2 0 0 0-2 2Z"/>])

// ============ FILES & DOCUMENTS ============
export const FileIcon = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6"/>])
export const FileText = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>])
export const FilePlus = mk([<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>, <path d="M14 2v6h6M12 12v6M9 15h6"/>])
export const Folder = mk([<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/>])
export const FolderOpen = mk([<path d="M6 14 4 21h17l2-9H7Z"/>, <path d="M2 5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v3"/>])
export const Notebook = mk([<rect x="4" y="3" width="16" height="18" rx="2"/>, <path d="M8 3v18M4 8h4M4 12h4M4 16h4"/>])
export const Book = mk([<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v17H6.5a2.5 2.5 0 0 0 0 3H20"/>])
export const Bookmarks = mk([<path d="M15 2H6a2 2 0 0 0-2 2v18l5-3 5 3V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v15"/>])
export const Clipboard = mk([<rect x="8" y="3" width="8" height="4" rx="1"/>, <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>])
export const Archive = mk([<rect x="2" y="3" width="20" height="5" rx="1"/>, <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>])
export const Paperclip = mk([<path d="m21 12-9 9a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2L9.4 18.6a1.8 1.8 0 0 1-2.6-2.6L15 7.8"/>])
export const Layers = mk([<path d="M12 2 2 7l10 5 10-5Z"/>, <path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>])

// ============ MEDIA ============
export const ImageIcon = mk([<rect x="3" y="3" width="18" height="18" rx="2"/>, <circle cx="9" cy="9" r="2"/>, <path d="m21 15-5-5L5 21"/>])
export const Camera = mk([<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/>, <circle cx="12" cy="13" r="4"/>])
export const Play = mk([<path d="m6 4 14 8-14 8z"/>])
export const Pause = mk([<rect x="6" y="4" width="4" height="16" rx="1"/>, <rect x="14" y="4" width="4" height="16" rx="1"/>])
export const Stop = mk([<rect x="5" y="5" width="14" height="14" rx="1"/>])
export const SkipForward = mk([<path d="m5 4 10 8-10 8Z"/>, <path d="M19 5v14"/>])
export const SkipBack = mk([<path d="M19 20 9 12l10-8Z"/>, <path d="M5 19V5"/>])
export const Volume = mk([<path d="M11 5 6 9H2v6h4l5 4Z"/>, <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>])
export const VolumeOff = mk([<path d="M11 5 6 9H2v6h4l5 4Z"/>, <path d="m23 9-6 6M17 9l6 6"/>])
export const Music = mk([<path d="M9 18V5l12-2v13"/>, <circle cx="6" cy="18" r="3"/>, <circle cx="18" cy="16" r="3"/>])
export const Headphones = mk([<path d="M3 18v-6a9 9 0 0 1 18 0v6"/>, <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/>])

// ============ TIME ============
export const Clock = mk([<circle cx="12" cy="12" r="9"/>, <path d="M12 7v5l3 2"/>])
export const Calendar = mk([<rect x="3" y="4" width="18" height="17" rx="2"/>, <path d="M16 2v4M8 2v4M3 10h18"/>])
export const CalendarDays = mk([<rect x="3" y="4" width="18" height="17" rx="2"/>, <path d="M16 2v4M8 2v4M3 10h18"/>, <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>])
export const Hourglass = mk([<path d="M6 2h12M6 22h12M6 2v4a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2M6 22v-4a6 6 0 0 1 6-6 6 6 0 0 1 6 6v4"/>])
export const Timer = mk([<circle cx="12" cy="13" r="8"/>, <path d="M12 9v4l2 2M9 2h6M12 13"/>])
export const HistoryIcon = mk([<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>, <path d="M3 3v5h5M12 8v4l3 2"/>])

// ============ USER & PEOPLE ============
export const User = mk([<circle cx="12" cy="8" r="4"/>, <path d="M4 21a8 8 0 0 1 16 0"/>])
export const UserPlus = mk([<circle cx="9" cy="8" r="4"/>, <path d="M3 21a6 6 0 0 1 12 0M19 8v6M16 11h6"/>])
export const Users = mk([<circle cx="9" cy="8" r="4"/>, <path d="M2 21a7 7 0 0 1 14 0"/>, <path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-6-7"/>])
export const UserCircle = mk([<circle cx="12" cy="12" r="9"/>, <circle cx="12" cy="10" r="3"/>, <path d="M6.2 18.5a6 6 0 0 1 11.6 0"/>])
export const At = mk([<circle cx="12" cy="12" r="4"/>, <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>])

// ============ DATA & CHARTS ============
export const BarChart = mk([<path d="M3 21h18M7 17V9M12 17V5M17 17v-6"/>])
export const LineChart = mk([<path d="M3 3v18h18"/>, <path d="m7 14 4-4 4 4 5-7"/>])
export const PieChart = mk([<path d="M12 3a9 9 0 1 0 9 9h-9Z"/>, <path d="M12 3a9 9 0 0 1 9 9"/>])
export const TrendingUp = mk([<path d="m23 6-9.5 9.5-5-5L1 18"/>, <path d="M16 6h7v7"/>])
export const TrendingDown = mk([<path d="m23 18-9.5-9.5-5 5L1 6"/>, <path d="M16 18h7v-7"/>])
export const Activity = mk([<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>])
export const Database = mk([<ellipse cx="12" cy="5" rx="8" ry="3"/>, <path d="M4 5v14a8 3 0 0 0 16 0V5M4 12a8 3 0 0 0 16 0"/>])
export const Server = mk([<rect x="2" y="3" width="20" height="8" rx="2"/>, <rect x="2" y="13" width="20" height="8" rx="2"/>, <circle cx="6" cy="7" r="0.5" fill="currentColor"/>, <circle cx="6" cy="17" r="0.5" fill="currentColor"/>])

// ============ SETTINGS & TOOLS ============
export const Settings = mk([<circle cx="12" cy="12" r="3"/>, <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1Z"/>])
export const Sliders = mk([<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>])
export const Toggle = mk([<rect x="2" y="7" width="20" height="10" rx="5"/>, <circle cx="8" cy="12" r="3"/>])
export const Tool = mk([<path d="M14.7 6.3a4 4 0 0 1 5.4 5.4l-9.7 9.7-5.4 1 1-5.4Z"/>])
export const Wrench = mk([<path d="M14.7 6.3a4 4 0 0 0-5.7 5.7l-7 7a2 2 0 1 0 2.8 2.8l7-7a4 4 0 0 0 5.7-5.7l-3.5 3.5-2.5-.5-.5-2.5Z"/>])
export const Cog = mk([<circle cx="12" cy="12" r="3"/>, <circle cx="12" cy="12" r="9"/>, <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>])

// ============ SEARCH & FILTER ============
export const Search = mk([<circle cx="11" cy="11" r="7"/>, <path d="m21 21-4.3-4.3"/>])
export const Filter = mk([<path d="M22 3H2l8 9.5V20l4 1V12.5Z"/>])
export const SortAsc = mk([<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16"/>])
export const SortDesc = mk([<path d="M11 13h10M11 17h7M11 9h4M3 7l3-3 3 3M6 4v16"/>])
export const Hash = mk([<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>])
export const Tag = mk([<path d="M2 12V2h10l10 10-10 10Z"/>, <circle cx="7.5" cy="7.5" r="1.5"/>])

// ============ EDIT & FORMAT ============
export const Bold = mk([<path d="M6 4h7a4 4 0 0 1 0 8H6Z"/>, <path d="M6 12h8a4 4 0 0 1 0 8H6Z"/>])
export const Italic = mk([<path d="M19 4h-8M14 20H6M15 4 9 20"/>])
export const Underline = mk([<path d="M6 4v8a6 6 0 0 0 12 0V4M4 21h16"/>])
export const Strikethrough = mk([<path d="M16 4H9a3 3 0 0 0-2 5M14 12a4 4 0 0 1 0 8H6M3 12h18"/>])
export const Heading = mk([<path d="M6 4v16M18 4v16M6 12h12"/>])
export const Quote = mk([<path d="M3 21c4 0 6-2 6-7V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2c0 4-2 5-3 5M14 21c4 0 6-2 6-7V6a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2c0 4-2 5-3 5"/>])
export const Code = mk([<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>])
export const Terminal = mk([<path d="m4 17 6-6-6-6M12 19h8"/>])
export const ListUl = mk([<path d="M8 6h13M8 12h13M8 18h13"/>, <circle cx="3.5" cy="6" r="0.5" fill="currentColor"/>, <circle cx="3.5" cy="12" r="0.5" fill="currentColor"/>, <circle cx="3.5" cy="18" r="0.5" fill="currentColor"/>])
export const ListOl = mk([<path d="M10 6h11M10 12h11M10 18h11M4 4h1v4M4 11h2L4 14h2M4 16.5a1.5 1.5 0 0 1 3 0c0 .8-1 1-3 2.5h3"/>])
export const ListCheck = mk([<path d="M11 6h10M11 12h10M11 18h10m-17-12 1 1 2-2m-3 6 1 1 2-2m-3 6 1 1 2-2"/>])
export const Indent = mk([<path d="M3 8h13M3 12h13M3 16h13M3 20h13M3 4h18M21 12l-4-3v6Z"/>])
export const AlignLeft = mk([<path d="M3 6h18M3 12h12M3 18h15"/>])
export const AlignCenter = mk([<path d="M3 6h18M6 12h12M4 18h16"/>])
export const Type = mk([<path d="M4 7V4h16v3M9 20h6M12 4v16"/>])
export const Link = mk([<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 1 0-7-7l-1.7 1.7"/>, <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 1 0 7 7l1.7-1.7"/>])
export const Unlink = mk([<path d="m18 9 3-3a3.5 3.5 0 0 0-5-5l-3 3M6 15l-3 3a3.5 3.5 0 0 0 5 5l3-3M3 3l18 18M9 8l3 3M12 13l3 3"/>])

// ============ DEVICES & APPS ============
export const Phone2 = mk([<rect x="6" y="2" width="12" height="20" rx="3"/>, <path d="M11 18h2"/>])
export const Tablet = mk([<rect x="4" y="2" width="16" height="20" rx="2"/>, <path d="M11 18h2"/>])
export const Laptop = mk([<rect x="4" y="4" width="16" height="11" rx="2"/>, <path d="M2 19h20"/>])
export const Monitor = mk([<rect x="2" y="3" width="20" height="14" rx="2"/>, <path d="M8 21h8M12 17v4"/>])
export const Cloud = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19Z"/>])
export const CloudUp = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19h2"/>, <path d="M12 21v-9M9 15l3-3 3 3"/>])
export const CloudDown = mk([<path d="M17 19a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4 4 0 0 0 6 19h2"/>, <path d="M12 12v9M9 18l3 3 3-3"/>])
export const Wifi = mk([<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0"/>, <circle cx="12" cy="19" r="0.5" fill="currentColor"/>])
export const Bluetooth = mk([<path d="m6 7 12 10-6 5V2l6 5L6 17"/>])
export const Battery = mk([<rect x="2" y="7" width="18" height="10" rx="2"/>, <path d="M22 11v2M6 10v4M9 10v4"/>])
export const Power = mk([<path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10"/>])

// ============ FINANCE & BUSINESS ============
export const DollarSign = mk([<path d="M12 2v20M17 6H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H6"/>])
export const CreditCard = mk([<rect x="2" y="5" width="20" height="14" rx="2"/>, <path d="M2 10h20M6 15h2"/>])
export const Wallet = mk([<path d="M21 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13v4"/>, <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>, <circle cx="17" cy="13" r="1.5"/>])
export const Coin = mk([<circle cx="12" cy="12" r="9"/>, <path d="M14 9.5a2.5 2.5 0 0 0-2.5-1.5h-1A2 2 0 0 0 10 12h2.5a2 2 0 0 1-.5 4h-1A2.5 2.5 0 0 1 9 14.5M12 6v2M12 16v2"/>])
export const PiggyBank = mk([<path d="M19 5h-1.4A8 8 0 0 0 4 8c0 1.5.5 3 1.4 4.2L4 14v3h2l1.5-1.5A8 8 0 0 0 14 17a8 8 0 0 0 7-3.5L23 14v-3l-2-1c-.4-1.7-1-3.4-2-5Z"/>, <circle cx="16" cy="10" r="0.5" fill="currentColor"/>])
export const Receipt = mk([<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-2Z"/>, <path d="M9 8h6M9 12h6M9 16h4"/>])
export const Briefcase = mk([<rect x="2" y="7" width="20" height="14" rx="2"/>, <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>])
export const Building = mk([<rect x="4" y="2" width="16" height="20" rx="1"/>, <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>])
export const Target = mk([<circle cx="12" cy="12" r="9"/>, <circle cx="12" cy="12" r="5"/>, <circle cx="12" cy="12" r="1.5"/>])
export const Award = mk([<circle cx="12" cy="9" r="6"/>, <path d="m8.2 13.5-2 7L12 17l5.8 3.5-2-7"/>])

// ============ WORKFLOW & PRODUCTIVITY ============
export const Workflow = mk([<rect x="3" y="3" width="7" height="6" rx="1"/>, <rect x="14" y="3" width="7" height="6" rx="1"/>, <rect x="9" y="15" width="7" height="6" rx="1"/>, <path d="M6 9v3h6.5M17.5 9v3H12.5"/>])
export const Branch = mk([<circle cx="6" cy="3" r="2"/>, <circle cx="6" cy="21" r="2"/>, <circle cx="18" cy="9" r="2"/>, <path d="M6 5v14M18 11v3a3 3 0 0 1-3 3H6"/>])
export const Network = mk([<circle cx="12" cy="3" r="2"/>, <circle cx="5" cy="21" r="2"/>, <circle cx="19" cy="21" r="2"/>, <circle cx="12" cy="12" r="2"/>, <path d="M12 5v5M11 13l-5 6M13 13l5 6"/>])
export const Sitemap = mk([<rect x="9" y="2" width="6" height="6" rx="1"/>, <rect x="2" y="16" width="6" height="6" rx="1"/>, <rect x="16" y="16" width="6" height="6" rx="1"/>, <path d="M12 8v4M5 16v-4h14v4"/>])
export const Sparkles = mk([<path d="m12 3 1.7 4.7L18 9.5l-4.3 1.8L12 16l-1.7-4.7L6 9.5l4.3-1.8Z"/>, <path d="M19 14v3M19 20v3M21 17h-3M16 17h-3"/>])
export const Beaker = mk([<path d="M9 3v8L3 21h18l-6-10V3M9 3h6"/>])
export const Lightbulb = mk([<path d="M9 21h6"/>, <path d="M10 17h4"/>, <path d="M12 3a6 6 0 0 0-4 10.5c1 1 2 2 2 3.5h4c0-1.5 1-2.5 2-3.5A6 6 0 0 0 12 3Z"/>])
export const Eye = mk([<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/>, <circle cx="12" cy="12" r="3"/>])
export const EyeOff = mk([<path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4M9 5.5A11 11 0 0 1 22 12s-1 1.7-3 3.5M6 7C3.5 8.7 2 12 2 12s4 7 10 7c1.5 0 3-.4 4.3-1"/>])
export const Scissors = mk([<circle cx="6" cy="6" r="3"/>, <circle cx="6" cy="18" r="3"/>, <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>])
export const GitMerge = mk([<circle cx="18" cy="18" r="3"/>, <circle cx="6" cy="6" r="3"/>, <path d="M6 21V9a9 9 0 0 0 9 9"/>])
export const Undo2 = mk([<path d="M9 14 4 9l5-5"/>, <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>])

// ============ MISC ============
export const Zap2 = mk([<path d="M12 3v6M12 21v-3M5.6 5.6 8 8M16 16l2.5 2.5M3 12h3M18 12h3M5.6 18.4 8 16M16 8l2.5-2.5"/>])
export const Gift = mk([<rect x="3" y="8" width="18" height="13" rx="2"/>, <path d="M3 12h18M12 8v13"/>, <path d="M16 8a3 3 0 0 0 0-6c-2 0-4 6-4 6s2-6-4-6a3 3 0 0 0 0 6"/>])
export const Coffee = mk([<path d="M17 8h1a4 4 0 0 1 0 8h-1"/>, <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>, <path d="M6 2v3M10 2v3M14 2v3"/>])
export const Sun = mk([<circle cx="12" cy="12" r="4"/>, <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>])
export const Sunrise = mk([<path d="M12 2v6M5.6 8.6l1.4 1.4M17 10l1.4-1.4M2 18h2M20 18h2M22 22H2M8 18a4 4 0 0 1 8 0"/>])
export const Moon = mk([<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>])
export const Flame = mk([<path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-7 1-10Z"/>])
export const Brain = mk([<path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3v1a3 3 0 0 0 1 2 3 3 0 0 0 0 4 3 3 0 0 0 3 3 3 3 0 0 0 3 0V3Z"/>, <path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3v1a3 3 0 0 1-1 2 3 3 0 0 1 0 4 3 3 0 0 1-3 3 3 3 0 0 1-3 0V3Z"/>])
export const Wand = mk([<path d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM4 20l11-11 2 2L6 22Z"/>, <path d="M19 11l1 1.5L21.5 13 20 13.5 19 15l-1-1.5L16.5 13 18 12.5Z"/>])
export const Anchor = mk([<circle cx="12" cy="5" r="2.5"/>, <path d="M12 22V7.5M5 12a7 7 0 0 0 14 0M2 12h3M19 12h3"/>])
export const Box = mk([<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>, <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>])
export const Gauge = mk([<path d="M12 14 18 8"/>, <circle cx="12" cy="14" r="0.5" fill="currentColor"/>, <path d="M3 14a9 9 0 1 1 18 0"/>])
export const GripVertical = mk([<circle cx="9" cy="6" r="0.5" fill="currentColor"/>, <circle cx="9" cy="12" r="0.5" fill="currentColor"/>, <circle cx="9" cy="18" r="0.5" fill="currentColor"/>, <circle cx="15" cy="6" r="0.5" fill="currentColor"/>, <circle cx="15" cy="12" r="0.5" fill="currentColor"/>, <circle cx="15" cy="18" r="0.5" fill="currentColor"/>])

// ============ IMPERIAL LOGO ============
export function ImperialMark({ size = 24, strokeWidth = 1.5, className = "", style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      <path d="M5 4h14"/>
      <path d="M5 20h14"/>
      <path d="M12 4v16"/>
      <path d="M8 12h8"/>
    </svg>
  )
}
