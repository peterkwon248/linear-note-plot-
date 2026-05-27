'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Home,
  Inbox,
  StickyNote,
  BookOpen,
  Library,
  Network,
  Calendar,
  Search,
  Settings,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  CornerDownLeft,
  Hash,
  Trash2,
  Star,
  Bell,
  Sun,
  Moon,
  PanelLeft,
  PanelRight,
  Quote,
  Paperclip,
  Layers,
  FileText,
  CheckCircle2,
  Circle,
  CircleDot,
} from 'lucide-react';

import '../linear-styles.css';

/* ─────────────────────────────────────────────────────────────
   Linear-feel icons — mirrors lib/view-engine/view-configs.tsx
   All 14px viewBox, strokeWidth 1.2. Keep flat (no fill) so they
   blend with both light + dark themes.
   ───────────────────────────────────────────────────────────── */

const sw = 1.2 as const;

const I = {
  Status:    () => <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth={sw}/><path d="M8 2.5a5.5 5.5 0 010 11" fill="currentColor" opacity={0.15}/></svg>,
  Priority:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><line x1="3" y1="13" x2="3" y2="10"/><line x1="6.5" y1="13" x2="6.5" y2="7"/><line x1="10" y1="13" x2="10" y2="4"/><line x1="13" y1="13" x2="13" y2="2"/></svg>,
  Folder:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M14 12.5a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1z"/></svg>,
  Label:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5h12l2.5 3.5-2.5 3.5h-12z"/></svg>,
  Tag:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8.5 1.5H2v6.5l5.65 5.65a1 1 0 001.41 0l4.59-4.59a1 1 0 000-1.41z"/><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/></svg>,
  Source:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><path d="M8 2a10.5 10.5 0 013 6 10.5 10.5 0 01-3 6 10.5 10.5 0 01-3-6 10.5 10.5 0 013-6z"/></svg>,
  Calendar:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5.3" y1="1.3" x2="5.3" y2="4.7"/><line x1="10.7" y1="1.3" x2="10.7" y2="4.7"/></svg>,
  Link:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M6.7 8.7a3.3 3.3 0 005 .4l2-2a3.3 3.3 0 00-4.7-4.7L8.4 3"/><path d="M9.3 7.3a3.3 3.3 0 00-5-.4l-2 2a3.3 3.3 0 004.7 4.7l.6-.6"/></svg>,
  Content:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><line x1="2.5" y1="8" x2="10" y2="8"/><line x1="2.5" y1="12" x2="7" y2="12"/></svg>,
  Pin:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="11" x2="8" y2="15"/><path d="M3.5 11h9V9.8a1.3 1.3 0 00-.7-1.2L10.5 8A1.3 1.3 0 0110 7V4h.5a1.3 1.3 0 000-2.7h-5a1.3 1.3 0 100 2.7H6v3a1.3 1.3 0 01-.5 1l-1.3.6a1.3 1.3 0 00-.7 1.2z"/></svg>,
  Wiki:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 3.2v9.4a1 1 0 001 1H8V4.4A1.6 1.6 0 006.4 2.8H3.5a1 1 0 00-1 1z"/><path d="M13.5 3.2v9.4a1 1 0 01-1 1H8V4.4A1.6 1.6 0 019.6 2.8h2.9a1 1 0 011 1z"/></svg>,
  Trash:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="2 4 3.3 4 14 4"/><path d="M12.7 4v9a1.3 1.3 0 01-1.4 1.3H4.7A1.3 1.3 0 013.3 13V4m2 0V2.7a1.3 1.3 0 011.4-1.4h2.6a1.3 1.3 0 011.4 1.4V4"/></svg>,
  Eye:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>,
  Index:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><circle cx="3" cy="3.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="3" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="3" cy="12.5" r="0.8" fill="currentColor" stroke="none"/><line x1="6" y1="3.5" x2="13.5" y2="3.5"/><line x1="6" y1="8" x2="13.5" y2="8"/><line x1="6" y1="12.5" x2="13.5" y2="12.5"/></svg>,
  Parent:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><line x1="8" y1="5" x2="8" y2="11"/><circle cx="8" cy="12.7" r="1.5" fill="currentColor" stroke="none"/></svg>,
  Children:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.5" fill="currentColor" stroke="none"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/></svg>,
  Graph:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/><line x1="5" y1="12.7" x2="11" y2="12.7"/></svg>,
  Lightning: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5L3 9h4l-1 5.5L13 7H9l1-5.5z"/></svg>,
  Plus:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>,
  Check:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 8.5 6.5 11.5 12.5 5"/></svg>,
  Caret:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="4.5 6.5 8 10 11.5 6.5"/></svg>,
  CaretRight:() => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="6.5 4.5 10 8 6.5 11.5"/></svg>,
  X:         () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>,
  Filter:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5h12l-4.5 5v5l-3-1.5v-3.5z"/></svg>,
  Sliders:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><line x1="2.5" y1="4" x2="13.5" y2="4"/><circle cx="6" cy="4" r="1.5" fill="currentColor" stroke="none"/><line x1="2.5" y1="8" x2="13.5" y2="8"/><circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none"/><line x1="2.5" y1="12" x2="13.5" y2="12"/><circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>,
  SortAsc:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 4 7 6"/><line x1="5" y1="4" x2="5" y2="12"/><line x1="9" y1="5" x2="13" y2="5"/><line x1="9" y1="8" x2="12" y2="8"/><line x1="9" y1="11" x2="11" y2="11"/></svg>,
  SortDesc:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 10 5 12 7 10"/><line x1="5" y1="4" x2="5" y2="12"/><line x1="9" y1="5" x2="11" y2="5"/><line x1="9" y1="8" x2="12" y2="8"/><line x1="9" y1="11" x2="13" y2="11"/></svg>,
  // View modes
  ViewList:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/></svg>,
  ViewBoard:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2" y="3" width="3.5" height="10" rx="0.6"/><rect x="6.25" y="3" width="3.5" height="7" rx="0.6"/><rect x="10.5" y="3" width="3.5" height="10" rx="0.6"/></svg>,
  ViewGrid:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2.5" y="2.5" width="5" height="5" rx="0.6"/><rect x="8.5" y="2.5" width="5" height="5" rx="0.6"/><rect x="2.5" y="8.5" width="5" height="5" rx="0.6"/><rect x="8.5" y="8.5" width="5" height="5" rx="0.6"/></svg>,
  ViewGraph:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3.3" r="1.7"/><circle cx="3.3" cy="12.7" r="1.7"/><circle cx="12.7" cy="12.7" r="1.7"/><line x1="8" y1="5" x2="3.3" y2="11"/><line x1="8" y1="5" x2="12.7" y2="11"/></svg>,
  ViewChart:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="2 12 6 7 9 9 14 3"/><polyline points="14 7 14 3 10 3"/></svg>,
  // Status entity icons (mirror Hexagon / Cube / Cuboid in view-configs)
  Hexagon:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/></svg>,
  Cube:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/><path d="M2.5 4.85L8 8m0 0l5.5-3.15M8 8v6.3"/></svg>,
  Cuboid:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2.5" y="4.5" width="11" height="9" rx="0.6"/><path d="M2.5 4.5L5.3 1.7h11l-2.8 2.8M13.5 13.5l2.8-2.8v-9"/></svg>,
  // Library / Books bits
  Quotes:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"><path d="M3 9V6.5A1.5 1.5 0 014.5 5h.5v1.5H5A1 1 0 004 7.5V9h2V12H3zM9 9V6.5A1.5 1.5 0 0110.5 5h.5v1.5h-.5A1 1 0 0010 7.5V9h2V12H9z"/></svg>,
  Paperclip:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 7.5L7.7 12.3a2.8 2.8 0 11-4-4l5.8-5.8a1.8 1.8 0 012.6 2.6L6.4 11a0.8 0.8 0 11-1.2-1.1l4.5-4.5"/></svg>,
  Sticker:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"><path d="M2.5 4.5a2 2 0 012-2h5.5l4 4v5.5a2 2 0 01-2 2H4.5a2 2 0 01-2-2z"/><path d="M10 2.5V6h4"/></svg>,
  BookStack:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2.5" y="2.5" width="3" height="11" rx="0.6"/><rect x="6.5" y="4" width="3" height="9.5" rx="0.6"/><path d="M10.4 5.2l2.8-0.6 1.7 8.3-2.8 0.6z"/></svg>,
};

/* ─────────────────────────────────────────────────────────────
   Surface + types
   ───────────────────────────────────────────────────────────── */

type Surface = 'list' | 'editor' | 'table' | 'books';
type NoteStatus = 'stone' | 'brick' | 'keystone';

type Note = {
  id: number;
  title: string;
  status: NoteStatus;
  tags: string[];
  refs: number;
  updated: string;
  progress: number;
  section: 'today' | 'yesterday' | 'earlier';
};

const NOTES: Note[] = [
  { id: 1, title: 'Phase 3 머지 plan — Filter / Display / Books 통합', status: 'keystone', tags: ['ui', 'tokens'], refs: 12, updated: '2h ago', progress: 78, section: 'today' },
  { id: 2, title: 'v3 phase 4-3 — Filter coverage 분석', status: 'brick', tags: ['filter'], refs: 7, updated: '5h ago', progress: 45, section: 'today' },
  { id: 3, title: 'Cuboid2x2 icon viewBox fit', status: 'keystone', tags: ['icons'], refs: 2, updated: '8h ago', progress: 100, section: 'today' },
  { id: 4, title: 'Sync v2.0 — Yjs + Supabase 결정 정리', status: 'stone', tags: ['sync', 'architecture'], refs: 18, updated: '1d ago', progress: 60, section: 'yesterday' },
  { id: 5, title: 'Plot 통째 재설계 (Path A) — Open Design 도입', status: 'brick', tags: ['vision'], refs: 24, updated: '1d ago', progress: 35, section: 'yesterday' },
  { id: 6, title: 'Chrome chunk 3 dropdown 흡수 vs 분리 복원', status: 'stone', tags: ['ux'], refs: 5, updated: '3d ago', progress: 100, section: 'earlier' },
  { id: 7, title: 'Custom Quick Filter — promote-then-save 패턴', status: 'keystone', tags: ['filter', 'savedview'], refs: 9, updated: '5d ago', progress: 88, section: 'earlier' },
];

/* ─────────────────────────────────────────────────────────────
   Real filter shape — copied from filter-bar.tsx + view-configs.tsx
   ───────────────────────────────────────────────────────────── */

type FilterOp = 'eq' | 'neq' | 'gt' | 'lt';
type FilterRule = { field: string; operator: FilterOp; value: string };

type FieldKey =
  | 'status' | 'folder' | 'label' | 'tags' | 'source'
  | 'updatedAt' | 'createdAt' | 'links' | 'wikiRegistered'
  | 'content' | 'pinned';

const FIELD_META: Record<FieldKey, { label: string; Icon: () => ReactNode }> = {
  status:         { label: 'Status',  Icon: I.Status },
  folder:         { label: 'Folder',  Icon: I.Folder },
  label:          { label: 'Label',   Icon: I.Label },
  tags:           { label: 'Tags',    Icon: I.Tag },
  source:         { label: 'Source',  Icon: I.Source },
  updatedAt:      { label: 'Updated', Icon: I.Calendar },
  createdAt:      { label: 'Created', Icon: I.Calendar },
  links:          { label: 'Links',   Icon: I.Link },
  wikiRegistered: { label: 'Wiki',    Icon: I.Wiki },
  content:        { label: 'Content', Icon: I.Content },
  pinned:         { label: 'Pinned',  Icon: I.Pin },
};

const STATUS_OPTS: Array<{ key: NoteStatus; label: string; color: string; Icon: () => ReactNode }> = [
  { key: 'stone',    label: 'Stone',     color: '#9CA3AF', Icon: I.Hexagon },
  { key: 'brick',    label: 'Brick',     color: '#F5A623', Icon: I.Cube },
  { key: 'keystone', label: 'Block',     color: '#45D483', Icon: I.Cuboid },
];

const FOLDER_OPTS = [
  { key: '_none', label: 'No folder' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'research', label: 'Research' },
  { key: 'sync-prd', label: 'Sync PRD' },
  { key: 'plot-v2', label: 'Plot v2 redesign' },
];

const LABEL_OPTS = [
  { key: '_none', label: 'No label' },
  { key: '_any',  label: 'Has label' },
  { key: 'arch',  label: 'Architecture', color: '#5e6ad2' },
  { key: 'ui',    label: 'UI / Design',  color: '#8b5cf6' },
  { key: 'ops',   label: 'Ops',          color: '#22c55e' },
  { key: 'idea',  label: 'Idea',         color: '#f59e0b' },
];

const TAG_OPTS = [
  { key: '_any',  label: 'Has tags' },
  { key: '_none', label: 'No tags' },
  { key: 'ui',         label: 'ui',         color: '#8b5cf6' },
  { key: 'tokens',     label: 'tokens',     color: '#06b6d4' },
  { key: 'filter',     label: 'filter',     color: '#3b82f6' },
  { key: 'architecture', label: 'architecture', color: '#5e6ad2' },
  { key: 'savedview',  label: 'savedview',  color: '#f59e0b' },
  { key: 'vision',     label: 'vision',     color: '#ec4899' },
];

const SOURCE_OPTS = [
  { key: 'manual',  label: 'Manual' },
  { key: 'webclip', label: 'Web clip' },
  { key: 'import',  label: 'Import' },
  { key: 'share',   label: 'Shared' },
  { key: 'api',     label: 'API' },
  { key: '_none',   label: 'No source' },
];

const LINK_OPTS = [
  { key: '0',         op: 'eq' as FilterOp, label: 'Unlinked' },
  { key: '0',         op: 'gt' as FilterOp, label: 'Has links' },
  { key: '2',         op: 'gt' as FilterOp, label: '3+ links' },
  { key: '4',         op: 'gt' as FilterOp, label: '5+ links' },
  { key: '9',         op: 'gt' as FilterOp, label: '10+ links' },
];

const WIKI_OPTS = [
  { key: 'true',  label: 'In wiki' },
  { key: 'false', label: 'Not in wiki' },
];

const CONTENT_OPTS = [
  { key: 'empty',     label: 'Empty body' },
  { key: 'hasImage',  label: 'Has images' },
  { key: 'hasCode',   label: 'Has code blocks' },
  { key: 'hasTable',  label: 'Has tables' },
];

const PIN_OPTS = [
  { key: 'true',  label: 'Pinned only' },
  { key: 'false', label: 'Not pinned' },
];

const DATE_OPTS_UPDATED: Array<{ key: string; op: FilterOp; group: 'updated' | 'stale'; label: string }> = [
  { key: '24h', op: 'gt', group: 'updated', label: 'Today' },
  { key: '7d',  op: 'gt', group: 'updated', label: 'This week' },
  { key: '30d', op: 'gt', group: 'updated', label: 'This month' },
  { key: '7d',  op: 'lt', group: 'stale',   label: '7+ days ago' },
  { key: '30d', op: 'lt', group: 'stale',   label: '30+ days ago' },
  { key: '90d', op: 'lt', group: 'stale',   label: '90+ days ago' },
];

const QUICK_FILTERS = [
  { label: 'Needs attention', desc: 'stale + unlinked',  rules: [
    { field: 'updatedAt', operator: 'lt' as FilterOp, value: '30d' },
    { field: 'links',     operator: 'eq' as FilterOp, value: '0' },
  ]},
  { label: 'Active work',     desc: 'updated < 7d',       rules: [
    { field: 'updatedAt', operator: 'gt' as FilterOp, value: '7d' },
  ]},
  { label: 'True orphans',    desc: 'no in/out links',    rules: [
    { field: 'links', operator: 'eq' as FilterOp, value: '0' },
  ]},
  { label: 'Wiki-registered', desc: 'promoted to wiki',   rules: [
    { field: 'wikiRegistered', operator: 'eq' as FilterOp, value: 'true' },
  ]},
];

/* ── Filter formatting (mirrors filter-bar.formatFilterChip) ── */

function formatChip(rule: FilterRule): { fieldLabel: string; op: string; value: string; Icon: () => ReactNode } {
  const meta = FIELD_META[rule.field as FieldKey];
  const fieldLabel = meta?.label ?? rule.field;
  const Icon = meta?.Icon ?? I.Tag;

  let op = 'is';
  const isDate = rule.field === 'updatedAt' || rule.field === 'createdAt';
  if (rule.operator === 'neq') op = 'is not';
  else if (rule.operator === 'lt') op = isDate ? 'older than' : '<';
  else if (rule.operator === 'gt') op = isDate ? 'within' : '>';

  let value = rule.value;
  if (rule.field === 'status') {
    const s = STATUS_OPTS.find((o) => o.key === rule.value);
    value = s ? s.label : rule.value;
  } else if (rule.field === 'folder') {
    if (rule.value === '_none') value = 'None';
    else value = FOLDER_OPTS.find((o) => o.key === rule.value)?.label ?? rule.value;
  } else if (rule.field === 'label') {
    if (rule.value === '_none') value = 'None';
    else if (rule.value === '_any') value = 'Any';
    else value = LABEL_OPTS.find((o) => o.key === rule.value)?.label ?? rule.value;
  } else if (rule.field === 'tags') {
    if (rule.value === '_none') value = 'None';
    else if (rule.value === '_any') value = 'Any';
    else {
      const t = TAG_OPTS.find((o) => o.key === rule.value);
      value = t ? `#${t.label}` : rule.value;
    }
  } else if (rule.field === 'source') {
    if (rule.value === '_none') value = 'None';
    else value = SOURCE_OPTS.find((o) => o.key === rule.value)?.label ?? rule.value;
  } else if (rule.field === 'links') {
    if (rule.operator === 'eq' && rule.value === '0') value = 'Unlinked';
    else if (rule.operator === 'gt') value = `${parseInt(rule.value) + 1}+`;
  } else if (rule.field === 'wikiRegistered') {
    value = rule.value === 'true' ? 'In wiki' : 'Not in wiki';
  } else if (rule.field === 'content') {
    value = CONTENT_OPTS.find((o) => o.key === rule.value)?.label ?? rule.value;
  } else if (rule.field === 'pinned') {
    value = rule.value === 'true' ? 'Yes' : 'No';
  } else if (isDate) {
    if (rule.operator === 'gt') {
      if (rule.value === '24h') value = 'Today';
      else if (rule.value === '7d') value = 'This week';
      else if (rule.value === '30d') value = 'This month';
    } else if (rule.operator === 'lt') value = `${rule.value} ago`;
  }
  return { fieldLabel, op, value, Icon };
}

/* ─────────────────────────────────────────────────────────────
   Display config — mirrors NOTES_VIEW_CONFIG.displayConfig
   ───────────────────────────────────────────────────────────── */

type ViewMode = 'list' | 'board' | 'grid' | 'graph' | 'insights';
type SortField = 'updatedAt' | 'createdAt' | 'title' | 'links' | 'reads';
type GroupBy = 'none' | 'status' | 'folder' | 'label' | 'parent' | 'role' | 'family';
type SortRule = { field: SortField; direction: 'asc' | 'desc' };

const VIEW_MODES: Array<{ key: ViewMode; label: string; Icon: () => ReactNode }> = [
  { key: 'list',     label: 'List',     Icon: I.ViewList },
  { key: 'board',    label: 'Board',    Icon: I.ViewBoard },
  { key: 'grid',     label: 'Grid',     Icon: I.ViewGrid },
  { key: 'graph',    label: 'Graph',    Icon: I.ViewGraph },
  { key: 'insights', label: 'Insights', Icon: I.ViewChart },
];

const GROUPING_OPTS: Array<{ value: GroupBy; label: string }> = [
  { value: 'none',   label: 'No grouping' },
  { value: 'status', label: 'Status' },
  { value: 'folder', label: 'Folder' },
  { value: 'label',  label: 'Label' },
  { value: 'parent', label: 'Parent' },
  { value: 'role',   label: 'Role' },
  { value: 'family', label: 'Family' },
];

const ORDERING_OPTS: Array<{ value: SortField; label: string }> = [
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdAt', label: 'Created' },
  { value: 'title',     label: 'Name' },
  { value: 'links',     label: 'Links' },
  { value: 'reads',     label: 'Word count' },
];

const LIST_TOGGLES: Array<{ key: string; label: string; Icon: () => ReactNode }> = [
  { key: 'showTrashed',      label: 'Show trashed',       Icon: I.Trash },
  { key: 'filterAwareRole',  label: 'Filter-aware role',  Icon: I.Eye },
];

const DISPLAY_PROPS: Array<{ key: string; label: string; Icon: () => ReactNode }> = [
  { key: 'showAlphaIndex', label: 'Index',     Icon: I.Index },
  { key: 'status',         label: 'Status',    Icon: I.Status },
  { key: 'priority',       label: 'Priority',  Icon: I.Priority },
  { key: 'label',          label: 'Label',     Icon: I.Label },
  { key: 'tags',           label: 'Tags',      Icon: I.Tag },
  { key: 'folder',         label: 'Folder',    Icon: I.Folder },
  { key: 'parent',         label: 'Parent',    Icon: I.Parent },
  { key: 'children',       label: 'Children',  Icon: I.Children },
  { key: 'links',          label: 'Backlinks', Icon: I.Link },
  { key: 'wordCount',      label: 'Words',     Icon: I.Content },
  { key: 'updatedAt',      label: 'Updated',   Icon: I.Calendar },
  { key: 'createdAt',      label: 'Created',   Icon: I.Calendar },
];

/* ─────────────────────────────────────────────────────────────
   Books surface — Library overview cards
   ───────────────────────────────────────────────────────────── */

const BOOK_COLLECTIONS = [
  { key: 'references', name: 'References', count: 142, meta: '12 sources · last week', Icon: I.Quotes,    color: '#5e6ad2' },
  { key: 'tags',       name: 'Tags',       count:  68, meta: '3 untouched',           Icon: I.Tag,       color: '#22c55e' },
  { key: 'files',      name: 'Files',      count:  24, meta: '156 MB',                Icon: I.Paperclip, color: '#f59e0b' },
  { key: 'stickers',   name: 'Stickers',   count:  18, meta: 'across 47 notes',       Icon: I.Sticker,   color: '#ec4899' },
  { key: 'categories', name: 'Categories', count:  12, meta: '34 wiki articles',      Icon: I.Folder,    color: '#06b6d4' },
];

const BOOK_RECENT = [
  { color: '#5e6ad2', title: 'Zettelkasten — Niklas Luhmann', meta: 'Reference · added 2h' },
  { color: '#8b5cf6', title: 'Linear handbook (UI patterns)',  meta: 'Reference · added 6h' },
  { color: '#22c55e', title: '#tokens — 21 notes',             meta: 'Tag · updated yesterday' },
  { color: '#f59e0b', title: 'plot-v2-original.html — 412 KB', meta: 'File · added 3d' },
  { color: '#ec4899', title: 'Plot v2 redesign sticker',       meta: 'Sticker · 12 members' },
];

/* ─────────────────────────────────────────────────────────────
   Palette rows
   ───────────────────────────────────────────────────────────── */

const PALETTE_ROWS = [
  { sec: 'Actions', rows: [
    { icon: <Plus size={14} />, title: 'New note', meta: 'N' },
    { icon: <Sparkles size={14} />, title: 'Quick capture', meta: 'C' },
    { icon: <Search size={14} />, title: 'Search everywhere', meta: '/' },
  ]},
  { sec: 'Navigate', rows: [
    { icon: <Home size={14} />, title: 'Go to Home', meta: 'G H' },
    { icon: <Inbox size={14} />, title: 'Go to Inbox', meta: 'G I' },
    { icon: <Network size={14} />, title: 'Go to Ontology', meta: 'G O' },
  ]},
];

/* ─────────────────────────────────────────────────────────────
   Visual glyphs reused in list / table / detail
   ───────────────────────────────────────────────────────────── */

function statusBadgeClass(status: NoteStatus): string {
  if (status === 'keystone') return 'ln-badge--success';
  if (status === 'brick') return 'ln-badge--warn';
  return 'ln-badge--accent';
}

function StatusGlyph({ status }: { status: NoteStatus }) {
  if (status === 'keystone') return <CheckCircle2 size={14} style={{ color: 'var(--ln-accent-2)' }} />;
  if (status === 'brick') return <CircleDot size={14} style={{ color: '#D97706' }} />;
  return <Circle size={14} style={{ color: 'var(--ln-meta)' }} />;
}

/* ─────────────────────────────────────────────────────────────
   Click-outside hook for popovers
   ───────────────────────────────────────────────────────────── */

function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);
  return ref;
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function LinearPreview() {
  const [surface, setSurface] = useState<Surface>('list');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailHidden, setDetailHidden] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Filter state
  const [filters, setFilters] = useState<FilterRule[]>([
    { field: 'updatedAt', operator: 'gt', value: '7d' },
    { field: 'links',     operator: 'eq', value: '0' },
  ]);
  const [filterPopOpen, setFilterPopOpen] = useState(false);
  const [filterSub, setFilterSub] = useState<FieldKey | null>(null);
  const filterRef = useClickOutside<HTMLDivElement>(filterPopOpen, () => {
    setFilterPopOpen(false);
    setFilterSub(null);
  });

  // Display state
  const [displayPopOpen, setDisplayPopOpen] = useState(false);
  const displayRef = useClickOutside<HTMLDivElement>(displayPopOpen, () => setDisplayPopOpen(false));
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [subGroupBy, setSubGroupBy] = useState<GroupBy>('none');
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { field: 'updatedAt', direction: 'desc' },
  ]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    showTrashed: false,
    filterAwareRole: true,
  });
  const [visibleProps, setVisibleProps] = useState<string[]>([
    'status', 'priority', 'label', 'tags', 'updatedAt',
  ]);

  // Dropdowns inside the display popover
  const [groupingDdOpen, setGroupingDdOpen] = useState(false);
  const [subGroupDdOpen, setSubGroupDdOpen] = useState(false);
  const [sortFieldDdOpen, setSortFieldDdOpen] = useState<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setDialogOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const selected = NOTES.find((n) => n.id === selectedId) ?? NOTES[0];

  /* ── Filter helpers ── */
  function hasFilter(field: string, value: string, op: FilterOp = 'eq') {
    return filters.some((f) => f.field === field && f.operator === op && f.value === value);
  }
  function toggleFilter(field: string, value: string, op: FilterOp = 'eq') {
    setFilters((prev) =>
      hasFilter(field, value, op)
        ? prev.filter((f) => !(f.field === field && f.operator === op && f.value === value))
        : [...prev, { field, operator: op, value }],
    );
  }
  function applyQuickFilter(rules: FilterRule[]) { setFilters(rules); setFilterPopOpen(false); setFilterSub(null); }
  function removeFilterAt(i: number) { setFilters((prev) => prev.filter((_, k) => k !== i)); }

  const fieldCount = (f: FieldKey) => filters.filter((r) => r.field === f).length;
  const datesCount = filters.filter((f) => f.field === 'updatedAt' || f.field === 'createdAt').length;

  /* ── Sort helpers ── */
  function updateSortAt(idx: number, patch: Partial<SortRule>) {
    setSortRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeSortAt(idx: number) {
    setSortRules((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }
  function addSort() {
    const used = new Set(sortRules.map((r) => r.field));
    const next = ORDERING_OPTS.find((o) => !used.has(o.value))?.value ?? 'updatedAt';
    setSortRules((prev) => [...prev, { field: next, direction: 'desc' }]);
  }

  const appClass = [
    'ln-app',
    sidebarCollapsed ? 'ln-app--collapsed' : '',
    detailHidden ? 'ln-app--no-detail' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /* ─── Filter popover content ─────────────────────────────── */
  const filterPopover = filterPopOpen && (
    <div className="ln-popover is-open ln-popover--left" style={{ minWidth: 280 }}>
      {filterSub === null ? (
        <>
          {/* Quick Filters */}
          <div className="ln-popover-section">
            <I.Lightning /> Quick filters
          </div>
          {QUICK_FILTERS.map((q) => (
            <div
              key={q.label}
              className="ln-pop-row"
              onClick={() => applyQuickFilter(q.rules)}
            >
              <I.Lightning />
              <span className="ln-pop-row-label">{q.label}</span>
              <span className="ln-pop-row-meta">{q.desc}</span>
            </div>
          ))}
          <div className="ln-popover-sep" />
          {/* Field rows */}
          {(Object.keys(FIELD_META) as FieldKey[])
            .filter((f) => f !== 'createdAt') // dates is one entry combining both
            .map((f) => {
              const meta = FIELD_META[f];
              const count =
                f === 'updatedAt' ? datesCount : fieldCount(f);
              const Icon = meta.Icon;
              return (
                <div
                  key={f}
                  className="ln-pop-row"
                  onClick={() => setFilterSub(f)}
                >
                  <Icon />
                  <span className="ln-pop-row-label">
                    {f === 'updatedAt' ? 'Dates' : meta.label}
                  </span>
                  {count > 0 && <span className="ln-pop-row-count">{count}</span>}
                  <span className="ln-pop-row-arrow"><I.CaretRight /></span>
                </div>
              );
            })}
        </>
      ) : (
        <>
          {/* Sub-header */}
          <div
            className="ln-pop-row"
            onClick={() => setFilterSub(null)}
            style={{ color: 'var(--muted)' }}
          >
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
              <I.CaretRight />
            </span>
            <span className="ln-pop-row-label">{FIELD_META[filterSub].label}</span>
          </div>
          <div className="ln-popover-sep" />

          {filterSub === 'status' && STATUS_OPTS.map((o) => {
            const Icon = o.Icon;
            return (
              <div
                key={o.key}
                className={`ln-pop-row ${hasFilter('status', o.key) ? 'is-active' : ''}`}
                onClick={() => toggleFilter('status', o.key)}
              >
                <span className="ln-checkmark"><I.Check /></span>
                <span style={{ color: o.color, display: 'inline-flex' }}><Icon /></span>
                <span className="ln-pop-row-label">{o.label}</span>
              </div>
            );
          })}

          {filterSub === 'folder' && FOLDER_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('folder', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('folder', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Folder />
              <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
            </div>
          ))}

          {filterSub === 'label' && LABEL_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('label', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('label', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              {'color' in o && o.color ? (
                <span className="ln-swatch" style={{ background: o.color }} />
              ) : <I.Label />}
              <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
            </div>
          ))}

          {filterSub === 'tags' && TAG_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('tags', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('tags', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              {'color' in o && o.color ? (
                <span className="ln-swatch ln-swatch--round" style={{ background: o.color }} />
              ) : <I.Tag />}
              <span className="ln-pop-row-label" style={{ color: o.key.startsWith('_') ? 'var(--muted)' : undefined }}>
                {o.key.startsWith('_') ? o.label : `#${o.label}`}
              </span>
            </div>
          ))}

          {filterSub === 'source' && SOURCE_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('source', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('source', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Source />
              <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
            </div>
          ))}

          {filterSub === 'links' && LINK_OPTS.map((o, i) => (
            <div
              key={i}
              className={`ln-pop-row ${hasFilter('links', o.key, o.op) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('links', o.key, o.op)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Link />
              <span className="ln-pop-row-label">{o.label}</span>
            </div>
          ))}

          {filterSub === 'wikiRegistered' && WIKI_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('wikiRegistered', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('wikiRegistered', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Wiki />
              <span className="ln-pop-row-label">{o.label}</span>
            </div>
          ))}

          {filterSub === 'content' && CONTENT_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('content', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('content', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Content />
              <span className="ln-pop-row-label">{o.label}</span>
            </div>
          ))}

          {filterSub === 'pinned' && PIN_OPTS.map((o) => (
            <div
              key={o.key}
              className={`ln-pop-row ${hasFilter('pinned', o.key) ? 'is-active' : ''}`}
              onClick={() => toggleFilter('pinned', o.key)}
            >
              <span className="ln-checkmark"><I.Check /></span>
              <I.Pin />
              <span className="ln-pop-row-label">{o.label}</span>
            </div>
          ))}

          {filterSub === 'updatedAt' && (
            <>
              <div className="ln-popover-section">Updated</div>
              {DATE_OPTS_UPDATED.filter((o) => o.group === 'updated').map((o, i) => (
                <div
                  key={`u-${i}`}
                  className={`ln-pop-row ${hasFilter('updatedAt', o.key, o.op) ? 'is-active' : ''}`}
                  onClick={() => toggleFilter('updatedAt', o.key, o.op)}
                >
                  <span className="ln-checkmark"><I.Check /></span>
                  <I.Calendar />
                  <span className="ln-pop-row-label">{o.label}</span>
                </div>
              ))}
              <div className="ln-popover-sep" />
              <div className="ln-popover-section">Stale</div>
              {DATE_OPTS_UPDATED.filter((o) => o.group === 'stale').map((o, i) => (
                <div
                  key={`s-${i}`}
                  className={`ln-pop-row ${hasFilter('updatedAt', o.key, o.op) ? 'is-active' : ''}`}
                  onClick={() => toggleFilter('updatedAt', o.key, o.op)}
                >
                  <span className="ln-checkmark"><I.Check /></span>
                  <I.Calendar />
                  <span className="ln-pop-row-label">{o.label}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );

  /* ─── Display popover ────────────────────────────────────── */
  const displayPopover = displayPopOpen && (
    <div className="ln-popover is-open ln-display-pop ln-popover--right">
      {/* View mode */}
      <div className="ln-segctl">
        {VIEW_MODES.map((m) => {
          const Icon = m.Icon;
          return (
            <button
              key={m.key}
              type="button"
              className={`ln-segctl-btn ${viewMode === m.key ? 'is-active' : ''}`}
              onClick={() => setViewMode(m.key)}
            >
              <Icon />
              {m.label}
            </button>
          );
        })}
      </div>
      <div className="ln-popover-sep" />

      {/* Grouping */}
      <div className="ln-row-set">
        <span className="ln-row-set-label">Grouping</span>
        <div className="ln-popover-anchor">
          <button
            type="button"
            className="ln-chip-dd"
            onClick={() => setGroupingDdOpen((v) => !v)}
          >
            {GROUPING_OPTS.find((o) => o.value === groupBy)?.label ?? 'None'}
            <span className="caret"><I.Caret /></span>
          </button>
          {groupingDdOpen && (
            <div className="ln-popover is-open ln-popover--right" style={{ minWidth: 160 }}>
              {GROUPING_OPTS.map((o) => (
                <div
                  key={o.value}
                  className={`ln-pop-row ${groupBy === o.value ? 'is-active' : ''}`}
                  onClick={() => { setGroupBy(o.value); setGroupingDdOpen(false); if (o.value === subGroupBy) setSubGroupBy('none'); }}
                >
                  <span className="ln-checkmark"><I.Check /></span>
                  <span className="ln-pop-row-label">{o.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {groupBy !== 'none' && (
        <div className="ln-row-set">
          <span className="ln-row-set-label">Sub-grouping</span>
          <div className="ln-popover-anchor">
            <button
              type="button"
              className="ln-chip-dd"
              onClick={() => setSubGroupDdOpen((v) => !v)}
            >
              {GROUPING_OPTS.find((o) => o.value === subGroupBy)?.label ?? 'None'}
              <span className="caret"><I.Caret /></span>
            </button>
            {subGroupDdOpen && (
              <div className="ln-popover is-open ln-popover--right" style={{ minWidth: 160 }}>
                {GROUPING_OPTS.filter((o) => o.value !== groupBy).map((o) => (
                  <div
                    key={o.value}
                    className={`ln-pop-row ${subGroupBy === o.value ? 'is-active' : ''}`}
                    onClick={() => { setSubGroupBy(o.value); setSubGroupDdOpen(false); }}
                  >
                    <span className="ln-checkmark"><I.Check /></span>
                    <span className="ln-pop-row-label">{o.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ln-popover-sep" />

      {/* Ordering */}
      {sortRules.map((rule, idx) => {
        const used = new Set(sortRules.filter((_, i) => i !== idx).map((r) => r.field));
        return (
          <div key={idx} className="ln-row-set">
            <span className="ln-row-set-label">{idx === 0 ? 'Ordering' : 'Then by'}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="ln-popover-anchor">
                <button
                  type="button"
                  className="ln-chip-dd"
                  onClick={() => setSortFieldDdOpen(sortFieldDdOpen === idx ? null : idx)}
                >
                  {ORDERING_OPTS.find((o) => o.value === rule.field)?.label}
                  <span className="caret"><I.Caret /></span>
                </button>
                {sortFieldDdOpen === idx && (
                  <div className="ln-popover is-open ln-popover--right" style={{ minWidth: 160 }}>
                    {ORDERING_OPTS.map((o) => (
                      <div
                        key={o.value}
                        className={`ln-pop-row ${rule.field === o.value ? 'is-active' : ''} ${used.has(o.value) ? 'is-disabled' : ''}`}
                        style={used.has(o.value) ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
                        onClick={() => { updateSortAt(idx, { field: o.value }); setSortFieldDdOpen(null); }}
                      >
                        <span className="ln-checkmark"><I.Check /></span>
                        <span className="ln-pop-row-label">{o.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="ln-icon-square"
                title={rule.direction === 'asc' ? 'Ascending' : 'Descending'}
                onClick={() => updateSortAt(idx, { direction: rule.direction === 'asc' ? 'desc' : 'asc' })}
              >
                {rule.direction === 'asc' ? <I.SortAsc /> : <I.SortDesc />}
              </button>
              {idx > 0 && (
                <button
                  type="button"
                  className="ln-icon-ghost"
                  title="Remove sort"
                  onClick={() => removeSortAt(idx)}
                >
                  <I.X />
                </button>
              )}
            </div>
          </div>
        );
      })}
      {sortRules.length < 3 && sortRules.length < ORDERING_OPTS.length && (
        <button type="button" className="ln-add-sort" onClick={addSort}>
          <I.Plus /> Add sort
        </button>
      )}

      <div className="ln-popover-sep" />

      {/* List options */}
      <div className="ln-popover-section">
        <I.Sliders />
        {viewMode === 'board' ? 'Board options' : 'List options'}
      </div>
      {LIST_TOGGLES.map((t) => {
        const Icon = t.Icon;
        const on = !!toggleStates[t.key];
        return (
          <div key={t.key} className="ln-toggle-row">
            <Icon />
            <span className="ln-toggle-row-label">{t.label}</span>
            <span
              className={`ln-toggle ${on ? 'is-on' : ''}`}
              onClick={() => setToggleStates((s) => ({ ...s, [t.key]: !s[t.key] }))}
            />
          </div>
        );
      })}

      <div className="ln-popover-sep" />

      {/* Display properties */}
      <div className="ln-popover-section">Display properties</div>
      <div className="ln-prop-chips">
        {DISPLAY_PROPS.map((p) => {
          const Icon = p.Icon;
          const active = visibleProps.includes(p.key);
          return (
            <button
              key={p.key}
              type="button"
              className={`ln-prop-chip ${active ? 'is-active' : ''}`}
              onClick={() =>
                setVisibleProps((prev) =>
                  prev.includes(p.key) ? prev.filter((k) => k !== p.key) : [...prev, p.key],
                )
              }
            >
              <Icon />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={appClass}>
      {/* ── activity bar ── */}
      <aside className="ln-activity">
        <div className="ln-activity-logo">P</div>
        <button className="ln-activity-item is-active" data-tip="Home" type="button">
          <Home />
        </button>
        <button className="ln-activity-item" data-tip="Inbox" type="button">
          <Inbox />
        </button>
        <button className="ln-activity-item" data-tip="Notes" type="button">
          <StickyNote />
        </button>
        <button className="ln-activity-item" data-tip="Wiki" type="button">
          <BookOpen />
        </button>
        <button className="ln-activity-item" data-tip="Library" type="button">
          <Library />
        </button>
        <button className="ln-activity-item" data-tip="Ontology" type="button">
          <Network />
        </button>
        <button className="ln-activity-item" data-tip="Calendar" type="button">
          <Calendar />
        </button>
        <div className="ln-activity-spacer" />
        <button
          className="ln-activity-item"
          data-tip="Theme"
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
        <button className="ln-activity-item" data-tip="Settings" type="button">
          <Settings />
        </button>
        <div className="ln-activity-avatar">KK</div>
      </aside>

      {/* ── sidebar ── */}
      <aside className="ln-sidebar">
        <div className="ln-sidebar-head">
          <div className="ln-sidebar-title">
            Plot <ChevronRight size={12} />
          </div>
          <div className="ln-sidebar-actions">
            <button
              className="ln-icon-btn"
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label="Collapse sidebar"
            >
              <PanelLeft />
            </button>
            <button className="ln-icon-btn" type="button" aria-label="New">
              <Plus />
            </button>
          </div>
        </div>
        <div className="ln-sidebar-search">
          <div className="ln-sidebar-search-inner">
            <Search />
            <input placeholder="Search…" />
            <span className="ln-kbd">⌘K</span>
          </div>
        </div>
        <div className="ln-sidebar-scroll">
          <div className="ln-nav-group">
            <div className="ln-nav-group-head">
              <span className="ln-nav-group-label">Workspace</span>
            </div>
            <div className="ln-nav-item is-active">
              <Home />
              <span className="ln-nav-item-label">Home</span>
            </div>
            <div className="ln-nav-item">
              <Inbox />
              <span className="ln-nav-item-label">Inbox</span>
              <span className="ln-nav-item-count">3</span>
            </div>
            <div className="ln-nav-item">
              <StickyNote />
              <span className="ln-nav-item-label">Notes</span>
              <span className="ln-nav-item-count">42</span>
            </div>
            <div className="ln-nav-item">
              <BookOpen />
              <span className="ln-nav-item-label">Wiki</span>
              <span className="ln-nav-item-count">18</span>
            </div>
            <div className="ln-nav-item">
              <Library />
              <span className="ln-nav-item-label">Library</span>
            </div>
            <div className="ln-nav-item">
              <Network />
              <span className="ln-nav-item-label">Ontology</span>
            </div>
            <div className="ln-nav-item">
              <Calendar />
              <span className="ln-nav-item-label">Calendar</span>
            </div>
          </div>
          <div className="ln-nav-group">
            <div className="ln-nav-group-head">
              <span className="ln-nav-group-label">Pinned</span>
            </div>
            <div className="ln-nav-item">
              <Star />
              <span className="ln-nav-item-label">Phase 3 plan</span>
            </div>
            <div className="ln-nav-item">
              <Star />
              <span className="ln-nav-item-label">v3 phase 4-3</span>
            </div>
          </div>
          <div className="ln-nav-group">
            <div className="ln-nav-group-head">
              <span className="ln-nav-group-label">Library</span>
            </div>
            <div className="ln-nav-item">
              <Quote />
              <span className="ln-nav-item-label">References</span>
              <span className="ln-nav-item-count">142</span>
            </div>
            <div className="ln-nav-item">
              <Hash />
              <span className="ln-nav-item-label">Tags</span>
              <span className="ln-nav-item-count">68</span>
            </div>
            <div className="ln-nav-item">
              <Paperclip />
              <span className="ln-nav-item-label">Files</span>
              <span className="ln-nav-item-count">24</span>
            </div>
            <div className="ln-nav-item">
              <Layers />
              <span className="ln-nav-item-label">Stickers</span>
              <span className="ln-nav-item-count">18</span>
            </div>
          </div>
        </div>
        <div className="ln-sidebar-foot">
          <div className="ln-daily-card">
            <div className="ln-daily-card-mark">
              <Sparkles />
            </div>
            <div className="ln-daily-card-body">
              <div className="ln-daily-card-title">Today&apos;s prompt</div>
              <div className="ln-daily-card-meta">What did you learn?</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── main ── */}
      <div className="ln-main">
        <header className="ln-topbar">
          <div className="ln-topbar-left">
            <nav className="ln-breadcrumb">
              <a href="#">Plot</a>
              <span className="crumb-sep">/</span>
              <a href="#">Notes</a>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{selected.title}</span>
            </nav>
            <div className="ln-tab-strip">
              <button
                className={`ln-tab ${surface === 'list' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSurface('list')}
              >
                <I.ViewList />
                List
              </button>
              <button
                className={`ln-tab ${surface === 'editor' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSurface('editor')}
              >
                <FileText />
                Editor
              </button>
              <button
                className={`ln-tab ${surface === 'table' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSurface('table')}
              >
                <I.ViewGrid />
                Table
              </button>
              <button
                className={`ln-tab ${surface === 'books' ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSurface('books')}
              >
                <I.BookStack />
                Books
              </button>
            </div>
          </div>
          <div className="ln-topbar-right">
            <button className="ln-tb-btn" type="button" onClick={() => setPaletteOpen(true)}>
              <Search />
              Search
              <span className="ln-kbd">⌘K</span>
            </button>

            <div className="ln-popover-anchor" ref={filterRef}>
              <button
                className={`ln-tb-btn ${filterPopOpen || filters.length > 0 ? 'is-active' : ''}`}
                type="button"
                onClick={() => { setFilterPopOpen((v) => !v); setFilterSub(null); }}
              >
                <I.Filter />
                Filter
                {filters.length > 0 && (
                  <span className="ln-pop-row-count" style={{ marginLeft: 2 }}>{filters.length}</span>
                )}
              </button>
              {filterPopover}
            </div>

            <div className="ln-popover-anchor" ref={displayRef}>
              <button
                className={`ln-tb-btn ${displayPopOpen ? 'is-active' : ''}`}
                type="button"
                onClick={() => setDisplayPopOpen((v) => !v)}
              >
                <I.Sliders />
                Display
              </button>
              {displayPopover}
            </div>

            <button
              className="ln-tb-btn"
              type="button"
              onClick={() => setDetailHidden((v) => !v)}
              aria-label="Toggle detail panel"
            >
              <PanelRight />
            </button>
            <button className="ln-tb-btn ln-tb-btn--primary" type="button" onClick={() => setDialogOpen(true)}>
              <Plus />
              New
            </button>
          </div>
        </header>

        {/* Active filter chip bar — visible only when filters present */}
        {filters.length > 0 && surface !== 'books' && (
          <div className="ln-chip-bar">
            {filters.map((f, i) => {
              const parts = formatChip(f);
              const Icon = parts.Icon;
              return (
                <span key={i} className="ln-fchip">
                  <span className="ln-fchip-part">
                    <Icon /> {parts.fieldLabel}
                  </span>
                  <span className="ln-fchip-sep" />
                  <span className="ln-fchip-part ln-fchip-op">{parts.op}</span>
                  <span className="ln-fchip-sep" />
                  <span className="ln-fchip-part">{parts.value}</span>
                  <span className="ln-fchip-sep" />
                  <button className="ln-fchip-x" type="button" onClick={() => removeFilterAt(i)} aria-label="Remove">
                    <I.X />
                  </button>
                </span>
              );
            })}
            <button
              className="ln-chip-add"
              type="button"
              onClick={() => setFilterPopOpen(true)}
              aria-label="Add filter"
            >
              <I.Plus />
            </button>
            <button className="ln-chip-clear" type="button" onClick={() => setFilters([])}>
              Clear all
            </button>
          </div>
        )}

        {surface === 'list' && (
          <div className="ln-content">
            {(['today', 'yesterday', 'earlier'] as const).map((section) => {
              const items = NOTES.filter((n) => n.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  <div className="ln-list-section-head">
                    {section === 'today' ? 'Today' : section === 'yesterday' ? 'Yesterday' : 'Earlier'}
                    <span className="count">{items.length}</span>
                  </div>
                  {items.map((note) => (
                    <div
                      key={note.id}
                      className={`ln-list-row ${selectedId === note.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedId(note.id)}
                    >
                      <div className="lr-icon">
                        <StatusGlyph status={note.status} />
                      </div>
                      <div className="lr-title">
                        <span>{note.title}</span>
                        {note.tags.map((t) => (
                          <span key={t} className="ln-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="lr-meta">{note.refs} refs</div>
                      <div className="lr-prio" style={{ width: 64 }}>
                        <div className="ln-bar" style={{ width: 56 }}>
                          <div className="ln-bar-fill" style={{ width: `${note.progress}%` }} />
                        </div>
                      </div>
                      <div className="lr-meta">{note.updated}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {surface === 'editor' && (
          <div className="ln-content">
            <article className="ln-editor">
              <div className="ln-editor-title-meta">
                <span className={`ln-badge ${statusBadgeClass(selected.status)}`}>{selected.status}</span>
                {selected.tags.map((t) => (
                  <span key={t} className="ln-tag">
                    {t}
                  </span>
                ))}
                <span className="ln-meta">Updated {selected.updated}</span>
                <div className="ln-spacer" />
                <span className="ln-meta">{selected.refs} refs</span>
              </div>
              <h1 className="title">{selected.title}</h1>
              <p>
                Linear 디자인을 Plot v2에 통합하는 작업의 세 번째 단계. Phase 3는 Filter / Display
                popover를 실제 코드 옵션(NOTES_VIEW_CONFIG)으로 재구성하고, Books surface를 추가해
                Library overview를 비교할 수 있게 만든다.
              </p>
              <h2>설계 원칙</h2>
              <p>
                아이콘은 <code>view-configs.tsx</code>의 14px / strokeWidth 1.2 인라인 SVG 어휘를
                그대로 유지하되, Linear의 hover/selected/foreground 토큰으로 색만 통일한다. Phosphor
                폰트 두께(weight=&ldquo;regular&rdquo;)와 Linear의 line-icon 룩이 우연히 같은 stroke 두께라
                자연스럽게 어울린다.
              </p>
              <h2>Strategy</h2>
              <ul>
                <li className="todo">
                  <span className="ln-check is-checked" /> Filter popover — 10 fields, Quick Filters,
                  4-part chip bar
                </li>
                <li className="todo">
                  <span className="ln-check is-checked" /> Display popover — segmented view-mode,
                  chip dropdown, sort chain, toggles, property chips
                </li>
                <li className="todo">
                  <span className="ln-check is-checked" /> Books surface — Library collection cards +
                  recent activity
                </li>
                <li className="todo">
                  <span className="ln-check" /> 컴포넌트 마이그레이션 (Phase 4)
                </li>
              </ul>
              <div className="callout">
                <span className="callout-mark">▸</span>
                실제 Plot 코드의 옵션 셋(NOTES_VIEW_CONFIG.filterCategories + displayConfig)을 그대로
                반영했으므로 Phase 4에서 컴포넌트 이식할 때 데이터 모델 변환 비용이 0이다.
              </div>
            </article>
          </div>
        )}

        {surface === 'table' && (
          <div className="ln-content">
            <div className="ln-content-pad">
              <table className="ln-dt">
                <thead>
                  <tr>
                    <th className="icon-col"></th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th className="num-col">Refs</th>
                    <th className="num-col">Progress</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {NOTES.map((note) => (
                    <tr
                      key={note.id}
                      className={selectedId === note.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(note.id)}
                    >
                      <td className="icon-col">
                        <StatusGlyph status={note.status} />
                      </td>
                      <td className="title-col">
                        <div className="title-col-row">{note.title}</div>
                      </td>
                      <td>
                        <span className={`ln-badge ${statusBadgeClass(note.status)}`}>{note.status}</span>
                      </td>
                      <td>
                        {note.tags.map((t) => (
                          <span key={t} className="ln-tag" style={{ marginRight: 4 }}>
                            {t}
                          </span>
                        ))}
                      </td>
                      <td className="num-col">{note.refs}</td>
                      <td className="num-col">{note.progress}%</td>
                      <td>
                        <span className="ln-meta">{note.updated}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {surface === 'books' && (
          <div className="ln-content">
            <div className="ln-books-section-head">
              Collections <span className="count">{BOOK_COLLECTIONS.length}</span>
            </div>
            <div className="ln-books-grid">
              {BOOK_COLLECTIONS.map((col) => {
                const Icon = col.Icon;
                return (
                  <div
                    key={col.key}
                    className="ln-book-card"
                    style={{ ['--book-c' as string]: col.color }}
                  >
                    <div className="ln-book-cover">
                      <div className="ln-book-cover-icon">
                        <Icon />
                      </div>
                    </div>
                    <div className="ln-book-body">
                      <div className="ln-book-title">{col.name}</div>
                      <div className="ln-book-meta">
                        <span className="ln-book-tally">{col.count}</span>
                        <span className="ln-dot" />
                        <span>{col.meta}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ln-books-section-head">
              Recent additions <span className="count">{BOOK_RECENT.length}</span>
            </div>
            <div className="ln-books-recent">
              {BOOK_RECENT.map((r, i) => (
                <div key={i} className="ln-book-recent-row">
                  <span className="ln-swatch" style={{ background: r.color }} />
                  <span className="title">{r.title}</span>
                  <span className="meta">{r.meta}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── detail panel ── */}
      <aside className="ln-detail">
        <div className="ln-detail-head">
          <div className="ln-detail-title">{selected.title.slice(0, 28)}…</div>
          <button className="ln-icon-btn" type="button" aria-label="More">
            <MoreHorizontal />
          </button>
        </div>
        <div className="ln-detail-tabs">
          <button className="ln-detail-tab is-active" type="button">
            Properties
          </button>
          <button className="ln-detail-tab" type="button">
            Backlinks
          </button>
          <button className="ln-detail-tab" type="button">
            Activity
          </button>
        </div>
        <div className="ln-detail-scroll">
          <dl className="ln-props">
            <dt>Status</dt>
            <dd>
              <StatusGlyph status={selected.status} />
              <span>{selected.status}</span>
            </dd>
            <dt>Tags</dt>
            <dd>
              {selected.tags.map((t) => (
                <span key={t} className="ln-tag">
                  {t}
                </span>
              ))}
            </dd>
            <dt>Refs</dt>
            <dd className="ln-num">{selected.refs}</dd>
            <dt>Progress</dt>
            <dd>
              <div className="ln-bar" style={{ width: 120 }}>
                <div className="ln-bar-fill" style={{ width: `${selected.progress}%` }} />
              </div>
              <span className="ln-meta">{selected.progress}%</span>
            </dd>
            <dt>Updated</dt>
            <dd className="ln-meta">{selected.updated}</dd>
          </dl>

          <hr className="ln-divider" />

          <div className="ln-card-head">
            <div className="ln-card-title">
              <Bell size={14} />
              Reminders
            </div>
          </div>
          <div className="ln-card ln-card-flat">
            <div className="ln-row-between">
              <div>
                <div style={{ fontSize: 'var(--text-md)', color: 'var(--fg)', fontWeight: 510 }}>
                  Review tomorrow
                </div>
                <div className="ln-meta">9:00 — daily prompt</div>
              </div>
              <div className="ln-toggle is-on" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── statusbar ── */}
      <footer className="ln-statusbar">
        <div className="ln-statusbar-left">
          <span className="ln-statusbar-item">
            <span className="ln-statusbar-dot" />
            Synced
          </span>
          <span className="ln-statusbar-item">
            <Trash2 />0 in trash
          </span>
        </div>
        <div className="ln-statusbar-right">
          <span className="ln-statusbar-item">{NOTES.length} notes</span>
          <span className="ln-statusbar-item">v148</span>
          <span className="ln-statusbar-item">Phase 3 preview</span>
        </div>
      </footer>

      {/* ── palette (Cmd+K) ── */}
      <div className={`ln-scrim ${paletteOpen ? 'is-open' : ''}`} onClick={() => setPaletteOpen(false)} />
      <div className={`ln-palette ${paletteOpen ? 'is-open' : ''}`} role="dialog" aria-label="Command palette">
        <div className="ln-palette-input">
          <Search />
          <input placeholder="Type a command or search…" autoFocus={paletteOpen} />
          <span className="ln-kbd">esc</span>
        </div>
        <div className="ln-palette-results">
          {PALETTE_ROWS.map((group) => (
            <div key={group.sec}>
              <div className="ln-palette-sec">{group.sec}</div>
              {group.rows.map((row, idx) => (
                <div
                  key={row.title}
                  className={`ln-palette-row ${group.sec === 'Actions' && idx === 0 ? 'is-focus' : ''}`}
                >
                  {row.icon}
                  <span className="pr-title">{row.title}</span>
                  <span className="pr-meta">{row.meta}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ln-palette-foot">
          <div>
            <span className="ln-kbd">↑↓</span> navigate
            <span style={{ margin: '0 8px' }}>·</span>
            <span className="ln-kbd">
              <CornerDownLeft size={9} />
            </span>{' '}
            select
          </div>
          <div>Plot · ⌘K</div>
        </div>
      </div>

      {/* ── dialog (Quick Capture) ── */}
      <div className={`ln-scrim ${dialogOpen ? 'is-open' : ''}`} onClick={() => setDialogOpen(false)} />
      <div className={`ln-dialog ${dialogOpen ? 'is-open' : ''}`} role="dialog" aria-label="Quick capture">
        <div className="ln-dialog-head">
          <Sparkles size={14} style={{ color: 'var(--ln-accent-2)' }} />
          <div className="ln-dialog-title">Quick Capture</div>
          <div className="ln-spacer" />
          <span className="ln-kbd">esc</span>
        </div>
        <div className="ln-dialog-body">
          <div className="ln-field">
            <label>Title</label>
            <input className="ln-input" placeholder="What did you learn?" autoFocus={dialogOpen} />
          </div>
          <div className="ln-field" style={{ marginTop: 12 }}>
            <label>Body</label>
            <textarea className="ln-input ln-textarea" placeholder="Free write — the prompt is just a starting point." />
          </div>
        </div>
        <div className="ln-dialog-foot">
          <button className="ln-tb-btn" type="button" onClick={() => setDialogOpen(false)}>
            Cancel
          </button>
          <button className="ln-tb-btn ln-tb-btn--primary" type="button" onClick={() => setDialogOpen(false)}>
            Capture
            <span className="ln-kbd" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              ⌘⏎
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
