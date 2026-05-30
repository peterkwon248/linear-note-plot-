import type { ReactNode } from "react"
import { CircleDashed, Circle, CircleHalf, CheckCircle, BookOpen, PencilSimple, Globe, DownloadSimple } from "@phosphor-icons/react"
import { NOTE_STATUS_HEX } from "@/lib/colors"

/**
 * A3.2 schema engine — icon set for the schema PropertyDefs.
 *
 * These are COPIED (not moved) from `view-configs.tsx` so the original config
 * stays untouched until M2 (plan §4 — the equivalence safety net runs against
 * the live `NOTES_VIEW_CONFIG`). The equivalence test excludes icon nodes from
 * the structural compare (plan D4: ReactNode can't `toEqual`), checking only
 * presence; visual identity is guaranteed by these being the same JSX.
 *
 * Chrome icons: 14px / strokeWidth 1.2 (matches the existing inline SVGs).
 */

/* ── Category / chrome icons ─────────────────────────────── */
export const StatusIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 2.5a5.5 5.5 0 010 11" fill="currentColor" opacity="0.15"/></svg>
export const PriorityIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="3" y1="13" x2="3" y2="10"/><line x1="6.5" y1="13" x2="6.5" y2="7"/><line x1="10" y1="13" x2="10" y2="4"/><line x1="13" y1="13" x2="13" y2="2"/></svg>
export const FolderIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M14 12.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1z"/></svg>
export const LabelIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5h12l2.5 3.5-2.5 3.5h-12z"/></svg>
export const TagIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M8.5 1.5H2v6.5l5.65 5.65a1 1 0 001.41 0l4.59-4.59a1 1 0 000-1.41z"/><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/></svg>
export const SourceIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><path d="M8 2a10.5 10.5 0 013 6 10.5 10.5 0 01-3 6 10.5 10.5 0 01-3-6 10.5 10.5 0 013-6z"/></svg>
export const CalendarIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/><line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/></svg>
export const LinkIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/><path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/></svg>
export const ContentIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="10" y2="8"/><line x1="2.5" y1="12" x2="7" y2="12"/></svg>
export const PinIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="11" x2="8" y2="15"/><path d="M3.5 11h9V9.8a1.3 1.3 0 00-.7-1.2L10.5 8A1.3 1.3 0 0110 7V4h.5a1.3 1.3 0 000-2.7h-5a1.3 1.3 0 100 2.7H6v3a1.3 1.3 0 01-.5 1l-1.3.6a1.3 1.3 0 00-.7 1.2z"/></svg>
export const TrashIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 4 3.3 4 14 4"/><path d="M12.7 4v9a1.3 1.3 0 01-1.4 1.3H4.7A1.3 1.3 0 013.3 13V4m2 0V2.7a1.3 1.3 0 011.4-1.4h2.6a1.3 1.3 0 011.4 1.4V4"/></svg>

// Parent: parent node above + self below — "my parent is above me"
export const ParentIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><line x1="8" y1="5" x2="8" y2="11"/><circle cx="8" cy="12.7" r="1.5" fill="currentColor" stroke="none"/></svg>
// Children: self above + two children branching below — "my children are below me"
export const ChildrenIcon: ReactNode = <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/></svg>

// Wiki: same as the activity-bar BookOpen — consistency
export const WikiIcon: ReactNode = <BookOpen size={14} weight="regular" />

/* ── Status option icons (Notes + Wiki shared 4-stage) ───── */
export const StatusBacklogIcon: ReactNode = <CircleDashed size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.backlog }} />
export const StatusTodoIcon: ReactNode = <Circle size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.todo }} />
export const StatusInProgressIcon: ReactNode = <CircleHalf size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.in_progress }} />
export const StatusDoneIcon: ReactNode = <CheckCircle size={14} weight="regular" style={{ color: NOTE_STATUS_HEX.done }} />

/* ── Source option icons ─────────────────────────────────── */
export const SourceManualIcon: ReactNode = <PencilSimple size={14} weight="regular" className="text-muted-foreground" />
export const SourceWebclipIcon: ReactNode = <Globe size={14} weight="regular" className="text-muted-foreground" />
export const SourceImportIcon: ReactNode = <DownloadSimple size={14} weight="regular" className="text-muted-foreground" />
