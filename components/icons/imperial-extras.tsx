"use client"

/**
 * Imperial Extras — Plot domain-specific icons + Phosphor migration shims.
 *
 * All follow the Imperial spec: 1.5px stroke · 24 viewBox · currentColor.
 *
 * Contains two groups:
 *
 * 1. PLOT DOMAIN ICONS — WikiBook, OntologyWide, Bookshelf
 *    Source: plot-v3-mockup/imperial-ui.jsx
 *
 * 2. PHOSPHOR MIGRATION SHIMS — icons not present in imperial.tsx.
 *    Drawn from scratch in Imperial style to replace the Phosphor originals.
 *    Exported under the Phosphor name so call sites need no further changes.
 */

import * as React from "react"
import type { IconProps } from "./imperial"

/** Internal SVG wrapper — same spec as imperial.tsx mk() */
function Svg({ size = 20, strokeWidth = 1.5, className = "", style, children }: IconProps & { children: React.ReactNode }) {
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
      {children}
    </svg>
  )
}

// ============ PLOT DOMAIN ICONS ============

/** WikiBook — open reference book with center spine and ribbon bookmark. */
export function WikiBook(p: IconProps) {
  return <Svg {...p}><path d="M3 6c3-1 6-1 9 1v13c-3-2-6-2-9-1z"/><path d="M21 6c-3-1-6-1-9 1v13c3-2 6-2 9-1z"/><path d="M15 5.6V11l1.5-1.2L18 11V5.9"/></Svg>
}

/** OntologyWide — diamond knowledge graph. Used for the Ontology space. */
export function OntologyWide(p: IconProps) {
  return <Svg {...p}><path d="m12 12-6-7"/><path d="m12 12 6-7"/><path d="m12 12-9 7"/><path d="m12 12 9 7"/><path d="M6 5h12"/><path d="m18 5 3 14"/><path d="M3 19h18"/><path d="M3 19 6 5"/><circle cx="6" cy="5" r="1.6"/><circle cx="18" cy="5" r="1.6"/><circle cx="3" cy="19" r="1.6"/><circle cx="21" cy="19" r="1.6"/><circle cx="12" cy="12" r="1.4"/></Svg>
}

/** Bookshelf — two-shelf bookcase. Used for the Library space. */
export function Bookshelf(p: IconProps) {
  return <Svg {...p}><path d="M4 3v18"/><path d="M20 3v18"/><path d="M4 3h16"/><path d="M4 12h16"/><path d="M4 21h16"/><path d="M7 12V5h2v7"/><path d="M11 12V6h2v6"/><path d="M15 12V5.5h2V12"/><path d="M11 8.5h2"/><path d="M7 21v-7h2v7"/><path d="M11 21v-6h2v6"/><path d="m14.6 21 1-6.5 1.8.3-1 6.2"/></Svg>
}

// ============ PHOSPHOR MIGRATION SHIMS ============
// Icons not present in imperial.tsx — drawn in Imperial style.
// Named after their Phosphor counterparts for zero-diff migration.

/** CircleDashed — dashed circle outline */
export function CircleDashed(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" strokeDasharray="3 2.5"/></Svg>
}

/** Circle — plain circle */
export function Circle(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9"/></Svg>
}

/** CircleHalf — half-filled circle (theme/contrast indicator) */
export function CircleHalf(p: IconProps) {
  return <Svg {...p}><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/></Svg>
}

/** Square — plain square */
export function Square(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/></Svg>
}

/** CheckSquare — checkbox checked */
export function CheckSquare(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 12 4 4 6-7"/></Svg>
}

/** DotsThree — horizontal ellipsis / more actions */
export function DotsThree(p: IconProps) {
  return <Svg {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Svg>
}

/** Table — data grid */
export function Table(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></Svg>
}

/** Kanban — three-column board */
export function Kanban(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></Svg>
}

/** Sticker — smiley on rounded square */
export function Sticker(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M8 14s1 3 4 3 4-3 4-3"/></Svg>
}

/** GraduationCap — education / template / learning */
export function GraduationCap(p: IconProps) {
  return <Svg {...p}><path d="M22 10l-10-6L2 10l10 6 10-6z"/><path d="M6 12v6c0 2 2.7 4 6 4s6-2 6-4v-6"/><path d="M22 10v6"/></Svg>
}

/** Keyboard — keyboard shortcuts */
export function Keyboard(p: IconProps) {
  return <Svg {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></Svg>
}

/** SplitHorizontal — horizontal split view */
export function SplitHorizontal(p: IconProps) {
  return <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M8 8h2M8 16h2"/></Svg>
}

/** Cursor — pointer cursor */
export function Cursor(p: IconProps) {
  return <Svg {...p}><path d="M4 2l16 10-8 1-3 7z"/></Svg>
}

/** CursorClick — pointer with click indicator */
export function CursorClick(p: IconProps) {
  return <Svg {...p}><path d="M4 2l16 10-8 1-3 7z"/><path d="M18 2l2-1M21 7l1-2M20 11l2 1M17 13l1 2"/></Svg>
}

/** FileMagnifyingGlass — file with search */
export function FileMagnifyingGlass(p: IconProps) {
  return <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><circle cx="11" cy="15" r="3"/><path d="m16 20-2-2"/></Svg>
}

/** PaintBucket — fill / color bucket */
export function PaintBucket(p: IconProps) {
  return <Svg {...p}><path d="M19 11L8.93 1 2 7.93 12.07 18H19a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/><path d="M21 21a2 2 0 0 1-4 0c0-1.5 2-4 2-4s2 2.5 2 4z"/><path d="M2 14l10 3"/></Svg>
}

/** Palette — color palette */
export function Palette(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><path d="M12 16a4 4 0 0 1-4-4"/></Svg>
}

/** Island — placeholder / empty state island */
export function Island(p: IconProps) {
  return <Svg {...p}><ellipse cx="12" cy="18" rx="8" ry="3"/><circle cx="12" cy="10" r="4"/><path d="M12 14v4"/></Svg>
}
