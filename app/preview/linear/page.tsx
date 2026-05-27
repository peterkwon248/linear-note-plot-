'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Home,
  Inbox,
  BookOpen,
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
  Bookmark,
  Clock,
  Tag,
  Folder,
  Pin,
  Filter,
  ArrowDownUp,
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
  ViewTimeline: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="2.5" rx="0.6"/><rect x="5" y="7" width="9" height="2.5" rx="0.6"/><rect x="2" y="11" width="6" height="2.5" rx="0.6"/></svg>,
  // Status entity icons (mirror Hexagon / Cube / Cuboid in view-configs)
  Hexagon:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/></svg>,
  Cube:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/><path d="M2.5 4.85L8 8m0 0l5.5-3.15M8 8v6.3"/></svg>,
  Cuboid:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2.5" y="4.5" width="11" height="9" rx="0.6"/><path d="M2.5 4.5L5.3 1.7h11l-2.8 2.8M13.5 13.5l2.8-2.8v-9"/></svg>,
  // Library / Books bits
  Quotes:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"><path d="M3 9V6.5A1.5 1.5 0 014.5 5h.5v1.5H5A1 1 0 004 7.5V9h2V12H3zM9 9V6.5A1.5 1.5 0 0110.5 5h.5v1.5h-.5A1 1 0 0010 7.5V9h2V12H9z"/></svg>,
  Paperclip:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 7.5L7.7 12.3a2.8 2.8 0 11-4-4l5.8-5.8a1.8 1.8 0 012.6 2.6L6.4 11a0.8 0.8 0 11-1.2-1.1l4.5-4.5"/></svg>,
  Sticker:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"><path d="M2.5 4.5a2 2 0 012-2h5.5l4 4v5.5a2 2 0 01-2 2H4.5a2 2 0 01-2-2z"/><path d="M10 2.5V6h4"/></svg>,
  BookStack:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2.5" y="2.5" width="3" height="11" rx="0.6"/><rect x="6.5" y="4" width="3" height="9.5" rx="0.6"/><path d="M10.4 5.2l2.8-0.6 1.7 8.3-2.8 0.6z"/></svg>,
  // Detail panel tab icons
  PanelLeft:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><line x1="6" y1="2.5" x2="6" y2="13.5"/></svg>,
  Network:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="3" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="13" cy="13" r="1.5"/><circle cx="13" cy="7" r="1.5"/><line x1="8" y1="4.5" x2="3" y2="11.5"/><line x1="8" y1="4.5" x2="13" y2="5.5"/><line x1="8" y1="4.5" x2="13" y2="11.5"/></svg>,
  Clock:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><polyline points="8 4.5 8 8 10.5 9.5"/></svg>,
  Bookmark:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M3.5 2.5h9v12l-4.5-3-4.5 3z"/></svg>,
  ChevronDown:() => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="4.5 6.5 8 10 11.5 6.5"/></svg>,
  ArrowDownLeft:() => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="10 4 4 10"/><polyline points="4 4 4 10 10 10"/></svg>,
  ArrowUpRight:() => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 12 12 6"/><polyline points="6 6 12 6 12 12"/></svg>,
  FileText:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5H4.5a1.5 1.5 0 00-1.5 1.5v10a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5V4.5z"/><polyline points="10 1.5 10 4.5 13 4.5"/><line x1="5.5" y1="8" x2="10.5" y2="8"/><line x1="5.5" y1="10.5" x2="10.5" y2="10.5"/></svg>,
  FileLines:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M10 1.5H4.5a1.5 1.5 0 00-1.5 1.5v10a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5V4.5z"/><polyline points="10 1.5 10 4.5 13 4.5"/></svg>,
  GitBranch:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="3.5" r="1.5"/><circle cx="5" cy="12.5" r="1.5"/><circle cx="11" cy="6.5" r="1.5"/><line x1="5" y1="5" x2="5" y2="11"/><path d="M11 8v1.5a2 2 0 01-2 2H5"/></svg>,
  Search:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5"/><line x1="10.2" y1="10.2" x2="14" y2="14"/></svg>,
  Edit:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M11 2.5l2.5 2.5L5 13.5l-3 .5.5-3z"/></svg>,
  Move:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 1 8 3 10"/><polyline points="13 6 15 8 13 10"/><polyline points="6 3 8 1 10 3"/><polyline points="6 13 8 15 10 13"/><line x1="1" y1="8" x2="15" y2="8"/><line x1="8" y1="1" x2="8" y2="15"/></svg>,
  Star:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round"><path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.8l-4 2.1.8-4.5L1.5 6.2l4.5-.6z"/></svg>,
  MapPin:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M8 14.5S3 10 3 6.5a5 5 0 0110 0c0 3.5-5 8-5 8z"/><circle cx="8" cy="6.5" r="1.5"/></svg>,
  Hash:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round"><line x1="4.5" y1="2" x2="3.5" y2="14"/><line x1="12.5" y1="2" x2="11.5" y2="14"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="2" y1="10.5" x2="14" y2="10.5"/></svg>,
};

/* ─────────────────────────────────────────────────────────────
   Surface + types
   ───────────────────────────────────────────────────────────── */

type Surface = 'list' | 'editor' | 'table' | 'books' | 'home' | 'inbox' | 'wiki' | 'ontology' | 'calendar';
type NoteStatus = 'stone' | 'brick' | 'keystone';

type Note = {
  id: number;
  code: string;
  title: string;
  status: NoteStatus;
  tags: string[];
  refs: number;
  updated: string;
  progress: number;
  section: 'today' | 'yesterday' | 'earlier';
  labels?: string[];
  folder?: string;
  source?: string;
  relations?: number;
  created?: string;
};

const NOTES: Note[] = [
  { id: 1, code: 'PLT-1', title: 'Phase 3 머지 plan — Filter / Display / Books 통합', status: 'keystone', tags: ['ui', 'tokens'], refs: 12, updated: '2h', progress: 78, section: 'today', labels: ['design', 'important'], folder: 'Design', source: 'manual', relations: 3, created: '2026-05-20' },
  { id: 2, code: 'PLT-3', title: 'v3 phase 4-3 — Filter coverage 분석', status: 'brick', tags: ['filter'], refs: 7, updated: '5h', progress: 45, section: 'today', labels: ['bug'], folder: 'Research', source: 'autopilot', relations: 1, created: '2026-05-22' },
  { id: 3, code: 'PLT-2', title: 'Cuboid2x2 icon viewBox fit', status: 'keystone', tags: ['icons'], refs: 2, updated: '8h', progress: 100, section: 'today', labels: ['icons'], folder: 'Design', source: 'manual', relations: 0, created: '2026-05-24' },
  { id: 4, code: 'PLT-4', title: 'Sync v2.0 — Yjs + Supabase 결정 정리', status: 'stone', tags: ['sync', 'architecture'], refs: 18, updated: '1d', progress: 60, section: 'yesterday', labels: ['architecture', 'sync'], folder: 'Architecture', source: 'manual', relations: 5, created: '2026-05-18' },
  { id: 5, code: 'PLT-5', title: 'Plot 통째 재설계 (Path A) — Open Design 도입', status: 'brick', tags: ['vision'], refs: 24, updated: '1d', progress: 35, section: 'yesterday', labels: ['vision'], folder: 'Plot v2', source: 'manual', relations: 8, created: '2026-05-15' },
  { id: 6, code: 'PLT-6', title: 'Chrome chunk 3 dropdown 흡수 vs 분리 복원', status: 'stone', tags: ['ux'], refs: 5, updated: '3d', progress: 100, section: 'earlier', labels: ['ux'], folder: 'Design', source: 'manual', relations: 2, created: '2026-05-10' },
  { id: 7, code: 'PLT-7', title: 'Custom Quick Filter — promote-then-save 패턴', status: 'keystone', tags: ['filter', 'savedview'], refs: 9, updated: '5d', progress: 88, section: 'earlier', labels: ['feature'], folder: 'Research', source: 'manual', relations: 4, created: '2026-05-08' },
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
  { key: 'stone',    label: 'Stone',     color: '#94a3b8', Icon: I.Hexagon },
  { key: 'brick',    label: 'Brick',     color: '#f59e0b', Icon: I.Cube },
  { key: 'keystone', label: 'Block',     color: '#34d399', Icon: I.Cuboid },
];

/* Real app space colors from lib/colors.ts SPACE_COLORS */
const SPACE_COLORS: Record<string, string> = {
  home:     '#5e6ad2',
  notes:    '#06b6d4',
  wiki:     '#8b5cf6',
  books:    '#be123c',
  calendar: '#ec4899',
  ontology: '#0f766e',
  library:  '#b45309',
};

/* Real app status hex from lib/colors.ts NOTE_STATUS_HEX */
const STATUS_HEX: Record<NoteStatus, string> = {
  stone:    '#94a3b8',
  brick:    '#f59e0b',
  keystone: '#34d399',
};

/** Colored status shape icon — mirrors StatusShapeIcon from real app */
function StatusShape({ status, size = 14 }: { status: NoteStatus; size?: number }) {
  const color = STATUS_HEX[status];
  const w = 16;
  if (status === 'stone') return <svg width={size} height={size} viewBox={`0 0 ${w} ${w}`} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/></svg>;
  if (status === 'brick') return <svg width={size} height={size} viewBox={`0 0 ${w} ${w}`} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round"><path d="M8 1.7l5.5 3.15v6.3L8 14.3 2.5 11.15v-6.3z"/><path d="M2.5 4.85L8 8m0 0l5.5-3.15M8 8v6.3"/></svg>;
  return <svg width={size} height={size} viewBox={`0 0 ${w} ${w}`} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round"><rect x="2.5" y="4.5" width="11" height="9" rx="0.6"/><path d="M2.5 4.5L5.3 1.7h11l-2.8 2.8M13.5 13.5l2.8-2.8v-9"/></svg>;
}

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
  { key: '_sep',      label: '' },
  { key: 'unread',    label: 'Unread' },
  { key: 'short',     label: 'Short (< 50 words)' },
  { key: 'long',      label: 'Long (200+ words)' },
  { key: 'verylong',  label: 'Very long (500+ words)' },
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

type ViewMode = 'list' | 'board' | 'grid' | 'graph' | 'insights' | 'timeline';
type SortField = 'updatedAt' | 'createdAt' | 'title' | 'links' | 'reads';
type GroupOrderField = 'groupName' | 'count' | 'manual';
type GroupBy = 'none' | 'status' | 'folder' | 'label' | 'parent' | 'role' | 'family';
type SortRule = { field: SortField; direction: 'asc' | 'desc' };

const VIEW_MODES: Array<{ key: ViewMode; label: string; Icon: () => ReactNode }> = [
  { key: 'list',     label: 'List',     Icon: I.ViewList },
  { key: 'board',    label: 'Board',    Icon: I.ViewBoard },
  { key: 'grid',     label: 'Grid',     Icon: I.ViewGrid },
  { key: 'graph',    label: 'Graph',    Icon: I.ViewGraph },
  { key: 'insights', label: 'Insights', Icon: I.ViewChart },
  { key: 'timeline', label: 'Timeline', Icon: I.ViewTimeline },
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

const GROUP_ORDER_OPTS: Array<{ value: GroupOrderField; label: string }> = [
  { value: 'groupName', label: 'Group name' },
  { value: 'count',     label: 'Count' },
  { value: 'manual',    label: 'Manual' },
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
  { sec: 'Notes', rows: [
    { icon: <Plus size={14} />, title: 'Create new note…', meta: 'C', action: 'dialog' as const },
    { icon: <Sparkles size={14} />, title: 'Quick capture…', meta: 'N', action: 'dialog' as const },
  ]},
  { sec: 'Wiki', rows: [
    { icon: <BookOpen size={14} />, title: 'Create new article…', meta: 'N then W', action: 'dialog' as const },
  ]},
  { sec: 'Navigate', rows: [
    { icon: <Home size={14} />, title: 'Go to Home', meta: 'G H', action: 'home' as const },
    { icon: <Inbox size={14} />, title: 'Go to Inbox', meta: 'G I', action: 'inbox' as const },
    { icon: <Network size={14} />, title: 'Go to Ontology', meta: 'G O', action: 'ontology' as const },
    { icon: <Search size={14} />, title: 'Search everywhere', meta: '/', action: 'search' as const },
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
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailHidden, setDetailHidden] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Nav + detail panel state
  type NavPage = 'home' | 'notes' | 'wiki' | 'books' | 'calendar' | 'ontology' | 'library';
  const [activePage, setActivePage] = useState<NavPage>('notes');
  const [detailTab, setDetailTab] = useState<'detail' | 'connections' | 'activity' | 'bookmarks'>('detail');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [reminderOn, setReminderOn] = useState(true);

  const toggleGroup = (group: string) => setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const navGoTo = (page: NavPage) => {
    setActivePage(page);
    if (page === 'notes') setSurface('list');
    else if (page === 'library' || page === 'books') setSurface('books');
    else setSurface(page);
  };

  // Filter state
  const [filters, setFilters] = useState<FilterRule[]>([
    { field: 'updatedAt', operator: 'gt', value: '7d' },
    { field: 'links',     operator: 'eq', value: '0' },
  ]);
  const [filterPopOpen, setFilterPopOpen] = useState(false);
  const [filterHoverCat, setFilterHoverCat] = useState<FieldKey | null>(null);
  const [filterSubTop, setFilterSubTop] = useState(0);
  const [filterSubSearch, setFilterSubSearch] = useState('');
  const filterRef = useClickOutside<HTMLDivElement>(filterPopOpen, () => {
    setFilterPopOpen(false);
    setFilterHoverCat(null);
    setFilterSubSearch('');
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
  const [groupOrderDdOpen, setGroupOrderDdOpen] = useState(false);
  const [groupOrder, setGroupOrder] = useState<GroupOrderField>('groupName');
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
  function applyQuickFilter(rules: FilterRule[]) { setFilters(rules); setFilterPopOpen(false); setFilterHoverCat(null); setFilterSubSearch(''); }
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

  /* ─── Filter popover content (two-panel, Linear-style) ──── */
  const filterSubContent = (() => {
    if (!filterHoverCat) return null;

    const sq = filterSubSearch.toLowerCase();

    const matchLabel = (label: string) => !sq || label.toLowerCase().includes(sq);

    if (filterHoverCat === 'status') {
      const items = STATUS_OPTS.filter((o) => matchLabel(o.label));
      return items.map((o) => {
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
      });
    }

    if (filterHoverCat === 'folder') {
      return FOLDER_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('folder', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('folder', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          <Folder size={16} strokeWidth={1.5} />
          <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'label') {
      return LABEL_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('label', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('label', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          {'color' in o && o.color ? (
            <span className="ln-swatch" style={{ background: o.color }} />
          ) : <Bookmark size={14} strokeWidth={1.5} />}
          <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'tags') {
      return TAG_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('tags', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('tags', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          {'color' in o && o.color ? (
            <span className="ln-swatch ln-swatch--round" style={{ background: o.color }} />
          ) : <Tag size={14} strokeWidth={1.5} />}
          <span className="ln-pop-row-label" style={{ color: o.key.startsWith('_') ? 'var(--muted)' : undefined }}>
            {o.key.startsWith('_') ? o.label : `#${o.label}`}
          </span>
        </div>
      ));
    }

    if (filterHoverCat === 'source') {
      return SOURCE_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('source', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('source', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          <I.Source />
          <span className="ln-pop-row-label" style={{ color: o.key === '_none' ? 'var(--meta)' : undefined }}>{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'links') {
      return LINK_OPTS.filter((o) => matchLabel(o.label)).map((o, i) => (
        <div
          key={i}
          className={`ln-pop-row ${hasFilter('links', o.key, o.op) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('links', o.key, o.op)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          <I.Link />
          <span className="ln-pop-row-label">{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'wikiRegistered') {
      return WIKI_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('wikiRegistered', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('wikiRegistered', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          <BookOpen size={16} strokeWidth={1.5} />
          <span className="ln-pop-row-label">{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'content') {
      return CONTENT_OPTS.filter((o) => o.key === '_sep' || matchLabel(o.label)).map((o) => {
        if (o.key === '_sep') return <div key="_sep" className="ln-popover-sep" />;
        // Map special keys to their filter fields
        const fieldMap: Record<string, { field: string; op: FilterOp; val: string }> = {
          unread:   { field: 'reads',     op: 'eq', val: '0' },
          short:    { field: 'wordCount', op: 'lt', val: '50' },
          long:     { field: 'wordCount', op: 'gt', val: '199' },
          verylong: { field: 'wordCount', op: 'gt', val: '499' },
        };
        const mapped = fieldMap[o.key];
        const isActive = mapped
          ? hasFilter(mapped.field, mapped.val, mapped.op)
          : hasFilter('content', o.key);
        const handleClick = () => mapped
          ? toggleFilter(mapped.field, mapped.val, mapped.op)
          : toggleFilter('content', o.key);
        return (
          <div
            key={o.key}
            className={`ln-pop-row ${isActive ? 'is-active' : ''}`}
            onClick={handleClick}
          >
            <span className="ln-checkmark"><I.Check /></span>
            <I.Content />
            <span className="ln-pop-row-label">{o.label}</span>
          </div>
        );
      });
    }

    if (filterHoverCat === 'pinned') {
      return PIN_OPTS.filter((o) => matchLabel(o.label)).map((o) => (
        <div
          key={o.key}
          className={`ln-pop-row ${hasFilter('pinned', o.key) ? 'is-active' : ''}`}
          onClick={() => toggleFilter('pinned', o.key)}
        >
          <span className="ln-checkmark"><I.Check /></span>
          <Pin size={14} strokeWidth={1.5} />
          <span className="ln-pop-row-label">{o.label}</span>
        </div>
      ));
    }

    if (filterHoverCat === 'updatedAt') {
      const updatedItems = DATE_OPTS_UPDATED.filter((o) => o.group === 'updated' && matchLabel(o.label));
      const staleItems = DATE_OPTS_UPDATED.filter((o) => o.group === 'stale' && matchLabel(o.label));
      return (
        <>
          {updatedItems.length > 0 && <div className="ln-popover-section">Updated</div>}
          {updatedItems.map((o, i) => (
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
          {staleItems.length > 0 && (
            <>
              {updatedItems.length > 0 && <div className="ln-popover-sep" />}
              <div className="ln-popover-section">Stale</div>
            </>
          )}
          {staleItems.map((o, i) => (
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
      );
    }

    return null;
  })();

  const filterCategories = (Object.keys(FIELD_META) as FieldKey[]).filter((f) => f !== 'createdAt');

  const filterPopover = filterPopOpen && (
    <div className="ln-filter-2panel" style={{ minWidth: 520 }}>
      {/* Left: Sub-panel (values) — appears on hover, positioned at hovered row Y */}
      {filterHoverCat && (
        <div className="ln-filter-sub" style={{ top: filterSubTop }}>
          <div className="ln-filter-search">
            <input
              className="ln-filter-search-input"
              placeholder={`Search ${FIELD_META[filterHoverCat].label}…`}
              value={filterSubSearch}
              onChange={(e) => setFilterSubSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ln-popover-sep" />
          {filterSubContent}
        </div>
      )}

      {/* Right: Main panel (categories) — always visible */}
      <div className="ln-filter-main">
        <div className="ln-filter-search">
          <input
            className="ln-filter-search-input"
            placeholder="Add Filter…"
            readOnly
            onFocus={() => setFilterHoverCat(null)}
          />
          <span className="ln-kbd" style={{ fontSize: 11 }}>F</span>
        </div>
        <div className="ln-popover-sep" />
        {/* Quick Filters */}
        <div
          className="ln-popover-section"
          onMouseEnter={() => setFilterHoverCat(null)}
        >
          <I.Lightning /> Quick filters
        </div>
        {QUICK_FILTERS.map((q) => (
          <div
            key={q.label}
            className="ln-pop-row"
            onClick={() => applyQuickFilter(q.rules)}
            onMouseEnter={() => setFilterHoverCat(null)}
          >
            <I.Lightning />
            <span className="ln-pop-row-label">{q.label}</span>
            <span className="ln-pop-row-meta">{q.desc}</span>
          </div>
        ))}
        <div className="ln-popover-sep" />
        {/* Field rows — hover to show sub-panel */}
        {filterCategories.map((f) => {
          const meta = FIELD_META[f];
          const count = f === 'updatedAt' ? datesCount : fieldCount(f);
          const Icon = meta.Icon;
          return (
            <div
              key={f}
              className={`ln-pop-row ${filterHoverCat === f ? 'is-active' : ''}`}
              onMouseEnter={(e) => {
                setFilterHoverCat(f);
                setFilterSubSearch('');
                const container = e.currentTarget.closest('.ln-filter-main');
                if (container) {
                  const offset = e.currentTarget.getBoundingClientRect().top - container.getBoundingClientRect().top;
                  setFilterSubTop(offset);
                }
              }}
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
      </div>
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

      {/* Group order */}
      {groupBy !== 'none' && (
        <div className="ln-row-set">
          <span className="ln-row-set-label">Group order</span>
          <div className="ln-popover-anchor">
            <button
              type="button"
              className="ln-chip-dd"
              onClick={() => setGroupOrderDdOpen((v) => !v)}
            >
              {GROUP_ORDER_OPTS.find((o) => o.value === groupOrder)?.label ?? 'Group name'}
              <span className="caret"><I.Caret /></span>
            </button>
            {groupOrderDdOpen && (
              <div className="ln-popover is-open ln-popover--right" style={{ minWidth: 160 }}>
                {GROUP_ORDER_OPTS.map((o) => (
                  <div
                    key={o.value}
                    className={`ln-pop-row ${groupOrder === o.value ? 'is-active' : ''}`}
                    onClick={() => { setGroupOrder(o.value); setGroupOrderDdOpen(false); }}
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
          <Plus size={14} strokeWidth={1.5} /> Add sort
        </button>
      )}

      <div className="ln-popover-sep" />

      {/* List options */}
      <div className="ln-popover-section">
        <ArrowDownUp size={14} strokeWidth={1.5} />
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

      <div className="ln-popover-sep" />
      <div className="ln-display-footer">
        <button type="button" className="ln-display-footer-btn" onClick={() => {
          setViewMode('list'); setGroupBy('status'); setSubGroupBy('none');
          setSortRules([{ field: 'updatedAt', direction: 'desc' }]);
          setToggleStates({ showTrashed: false, filterAwareRole: true });
          setVisibleProps(['status', 'priority', 'label', 'tags', 'updatedAt']);
        }}>Reset</button>
        <button type="button" className="ln-display-footer-btn ln-display-footer-btn--accent">Set default for everyone</button>
      </div>
    </div>
  );

  return (
    <div className={appClass}>
      {/* ── activity bar (space switcher) ── */}
      <aside className="ln-activity">
        <div className="ln-activity-logo">P</div>
        {([
          { page: 'home' as NavPage, icon: <Home size={20} strokeWidth={1.5} />, tip: 'Home' },
          { page: 'notes' as NavPage, icon: <FileText size={20} strokeWidth={1.5} />, tip: 'Notes' },
          { page: 'wiki' as NavPage, icon: <BookOpen size={20} strokeWidth={1.5} />, tip: 'Wiki' },
          { page: 'books' as NavPage, icon: <Layers size={20} strokeWidth={1.5} />, tip: 'Books' },
          { page: 'calendar' as NavPage, icon: <Calendar size={20} strokeWidth={1.5} />, tip: 'Calendar' },
          { page: 'ontology' as NavPage, icon: <Network size={20} strokeWidth={1.5} />, tip: 'Ontology' },
          { page: 'library' as NavPage, icon: <I.BookStack />, tip: 'Library' },
        ]).map((item) => (
          <button
            key={item.page}
            className={`ln-activity-item ${activePage === item.page ? 'is-active' : ''}`}
            data-tip={item.tip}
            type="button"
            onClick={() => navGoTo(item.page)}
            style={activePage === item.page ? { color: SPACE_COLORS[item.page] } : undefined}
          >
            {item.icon}
          </button>
        ))}
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
            <button className="ln-icon-btn" type="button" aria-label="New" onClick={() => setDialogOpen(true)}>
              <Plus />
            </button>
          </div>
        </div>
        <div className="ln-sidebar-search" onClick={() => setPaletteOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="ln-sidebar-search-inner">
            <Search />
            <input placeholder="Search…" readOnly style={{ cursor: 'pointer' }} />
            <span className="ln-kbd">⌘K</span>
          </div>
        </div>
        <div className="ln-sidebar-scroll">
          {/* ── Home space ── */}
          {activePage === 'home' && (<>
            <div className="ln-nav-section">
              <div className={`ln-nav-item is-active`} style={{ cursor: 'pointer' }} onClick={() => navGoTo('home')}>
                <Home />
                <span className="ln-nav-item-label">Overview</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('inbox')}>
                <Inbox />
                <span className="ln-nav-item-label">Inbox</span>
                <span className="ln-nav-item-count">3</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('pinned')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['pinned'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Pinned</span>
              </div>
              {!collapsedGroups['pinned'] && (<>
                <div className="ln-nav-item" onClick={() => { setSelectedId(1); setSurface('editor'); setActivePage('notes'); }} style={{ cursor: 'pointer' }}>
                  <StatusShape status="keystone" />
                  <span className="ln-nav-item-label">Phase 3 plan</span>
                </div>
                <div className="ln-nav-item" onClick={() => { setSelectedId(4); setSurface('editor'); setActivePage('notes'); }} style={{ cursor: 'pointer' }}>
                  <StatusShape status="stone" />
                  <span className="ln-nav-item-label">Sync v2.0 결정</span>
                </div>
                <div className="ln-nav-item" onClick={() => navGoTo('wiki')} style={{ cursor: 'pointer' }}>
                  <BookOpen size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Plot Architecture</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('recent')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['recent'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Recent</span>
              </div>
              {!collapsedGroups['recent'] && (<>
                {NOTES.slice(0, 4).map((n) => (
                  <div key={n.id} className="ln-nav-item" onClick={() => { setSelectedId(n.id); setSurface('editor'); setActivePage('notes'); }} style={{ cursor: 'pointer' }}>
                    <StatusShape status={n.status} />
                    <span className="ln-nav-item-label">{n.title.length > 28 ? n.title.slice(0, 26) + '…' : n.title}</span>
                  </div>
                ))}
              </>)}
            </div>
          </>)}

          {/* ── Notes space ── */}
          {activePage === 'notes' && (<>
            <div className="ln-nav-section">
              <div className={`ln-nav-item ${surface === 'list' ? 'is-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSurface('list')}>
                <FileText size={16} strokeWidth={1.5} />
                <span className="ln-nav-item-label">All Notes</span>
                <span className="ln-nav-item-count">42</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('list')}>
                <StatusShape status="stone" />
                <span className="ln-nav-item-label">Stone</span>
                <span className="ln-nav-item-count">12</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('list')}>
                <StatusShape status="brick" />
                <span className="ln-nav-item-label">Brick</span>
                <span className="ln-nav-item-count">18</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('list')}>
                <StatusShape status="keystone" />
                <span className="ln-nav-item-label">Block</span>
                <span className="ln-nav-item-count">12</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <Pin size={14} strokeWidth={1.5} />
                <span className="ln-nav-item-label">Pinned</span>
                <span className="ln-nav-item-count">2</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('pinned')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['pinned'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Pinned</span>
              </div>
              {!collapsedGroups['pinned'] && (<>
                <div className="ln-nav-item" onClick={() => { setSelectedId(1); setSurface('editor'); }} style={{ cursor: 'pointer' }}>
                  <StatusShape status="keystone" />
                  <span className="ln-nav-item-label">Phase 3 plan</span>
                </div>
                <div className="ln-nav-item" onClick={() => { setSelectedId(2); setSurface('editor'); }} style={{ cursor: 'pointer' }}>
                  <StatusShape status="brick" />
                  <span className="ln-nav-item-label">v3 phase 4-3</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('views')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['views'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Views</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
              {!collapsedGroups['views'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Sparkles size={14} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">All by status</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Sparkles size={14} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Recently edited</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('folders')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['folders'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Folders</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
              {!collapsedGroups['folders'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Folder size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Research</span>
                  <span className="ln-nav-item-count">8</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Folder size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Sync PRD</span>
                  <span className="ln-nav-item-count">4</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Folder size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Plot v2</span>
                  <span className="ln-nav-item-count">6</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('more')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['more'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">More</span>
              </div>
              {!collapsedGroups['more'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <FileText />
                  <span className="ln-nav-item-label">Templates</span>
                  <span className="ln-nav-item-count">5</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <I.ViewChart />
                  <span className="ln-nav-item-label">Insights</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('recent')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['recent'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Recent</span>
              </div>
              {!collapsedGroups['recent'] && (<>
                {NOTES.slice(0, 5).map((n) => (
                  <div key={n.id} className="ln-nav-item" onClick={() => { setSelectedId(n.id); setSurface('editor'); }} style={{ cursor: 'pointer' }}>
                    <StatusShape status={n.status} />
                    <span className="ln-nav-item-label">{n.title.length > 28 ? n.title.slice(0, 26) + '…' : n.title}</span>
                  </div>
                ))}
              </>)}
            </div>
          </>)}

          {/* ── Wiki space ── */}
          {activePage === 'wiki' && (<>
            <div className="ln-nav-section">
              <div className="ln-nav-item is-active" style={{ cursor: 'pointer' }} onClick={() => setSurface('wiki')}>
                <BookOpen />
                <span className="ln-nav-item-label">Overview</span>
                <span className="ln-nav-item-count">18</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <I.Graph />
                <span className="ln-nav-item-label">Merge</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <I.Lightning />
                <span className="ln-nav-item-label">Split</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <FileText />
                <span className="ln-nav-item-label">Templates</span>
                <span className="ln-nav-item-count">3</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('pinned')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['pinned'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Pinned</span>
              </div>
              {!collapsedGroups['pinned'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <BookOpen size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Plot Architecture</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <BookOpen size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Zustand Store Design</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('views')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['views'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Views</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
              {!collapsedGroups['views'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Sparkles size={14} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Stubs only</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('folders')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['folders'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Folders</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
              {!collapsedGroups['folders'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Folder size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Core Concepts</span>
                  <span className="ln-nav-item-count">5</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <Folder size={16} strokeWidth={1.5} />
                  <span className="ln-nav-item-label">Architecture</span>
                  <span className="ln-nav-item-count">3</span>
                </div>
              </>)}
            </div>
          </>)}

          {/* ── Books space ── */}
          {activePage === 'books' && (<>
            <div className="ln-nav-section">
              <div className="ln-nav-item is-active" style={{ cursor: 'pointer' }} onClick={() => setSurface('books')}>
                <Layers size={16} strokeWidth={1.5} />
                <span className="ln-nav-item-label">All Books</span>
                <span className="ln-nav-item-count">6</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('pinned')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['pinned'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Pinned</span>
              </div>
              {!collapsedGroups['pinned'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <BookOpen />
                  <span className="ln-nav-item-label">Zettelkasten Method</span>
                  <span className="ln-nav-item-count">12</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('views')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['views'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Views</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('recent')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['recent'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Recent</span>
              </div>
              {!collapsedGroups['recent'] && (<>
                {[
                  { title: 'Zettelkasten Method', items: 12 },
                  { title: 'UI Design Patterns', items: 8 },
                  { title: 'Architecture Notes', items: 15 },
                ].map((b, i) => (
                  <div key={i} className="ln-nav-item" style={{ cursor: 'pointer' }}>
                    <BookOpen />
                    <span className="ln-nav-item-label">{b.title}</span>
                    <span className="ln-nav-item-count">{b.items}</span>
                  </div>
                ))}
              </>)}
            </div>
          </>)}

          {/* ── Calendar space ── */}
          {activePage === 'calendar' && (<>
            <div className="ln-nav-section">
              <div className="ln-nav-item is-active" style={{ cursor: 'pointer' }} onClick={() => setSurface('calendar')}>
                <Calendar />
                <span className="ln-nav-item-label">Calendar</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('pinned')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['pinned'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Pinned</span>
              </div>
              {!collapsedGroups['pinned'] && (<>
                <div className="ln-nav-item" onClick={() => { setSelectedId(1); setSurface('editor'); setActivePage('notes'); }} style={{ cursor: 'pointer' }}>
                  <StatusShape status="keystone" />
                  <span className="ln-nav-item-label">Phase 3 plan</span>
                </div>
              </>)}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('today')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['today'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Today</span>
              </div>
              {!collapsedGroups['today'] && (
                <div className="ln-nav-stats">
                  <div className="ln-nav-stat-row">
                    <span className="ln-nav-stat-label">Created</span>
                    <span className="ln-nav-stat-value">3</span>
                  </div>
                  <div className="ln-nav-stat-row">
                    <span className="ln-nav-stat-label">Updated</span>
                    <span className="ln-nav-stat-value">7</span>
                  </div>
                </div>
              )}
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('upcoming')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['upcoming'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Upcoming</span>
              </div>
              {!collapsedGroups['upcoming'] && (<>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <StatusShape status="stone" />
                  <span className="ln-nav-item-label">Review sync notes</span>
                  <span className="ln-nav-item-meta">Tomorrow</span>
                </div>
                <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                  <StatusShape status="brick" />
                  <span className="ln-nav-item-label">Phase 4 kickoff</span>
                  <span className="ln-nav-item-meta">In 3d</span>
                </div>
              </>)}
            </div>
          </>)}

          {/* ── Ontology space ── */}
          {activePage === 'ontology' && (<>
            <div className="ln-nav-section">
              <div className="ln-nav-item is-active" style={{ cursor: 'pointer' }} onClick={() => setSurface('ontology')}>
                <I.Graph />
                <span className="ln-nav-item-label">Graph</span>
                <span className="ln-nav-item-count">42</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('ontology')}>
                <I.ViewChart />
                <span className="ln-nav-item-label">Insights</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }} onClick={() => setSurface('ontology')}>
                <I.Index />
                <span className="ln-nav-item-label">Dashboard</span>
              </div>
            </div>
            <div className="ln-nav-group">
              <div className="ln-nav-group-head" onClick={() => toggleGroup('views')} style={{ cursor: 'pointer' }}>
                <span style={{ transform: collapsedGroups['views'] ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms' }}><I.Caret /></span>
                <span className="ln-nav-group-label">Views</span>
                <button className="ln-nav-group-action" onClick={(e) => { e.stopPropagation(); }}><Plus size={14} strokeWidth={1.5} /></button>
              </div>
            </div>
          </>)}

          {/* ── Library space ── */}
          {activePage === 'library' && (<>
            <div className="ln-nav-section">
              <div className="ln-nav-item is-active" style={{ cursor: 'pointer' }} onClick={() => navGoTo('library')}>
                <I.BookStack />
                <span className="ln-nav-item-label">Overview</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <I.Quotes />
                <span className="ln-nav-item-label">References</span>
                <span className="ln-nav-item-count">142</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <Tag size={14} strokeWidth={1.5} />
                <span className="ln-nav-item-label">Tags</span>
                <span className="ln-nav-item-count">68</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <Bookmark size={14} strokeWidth={1.5} />
                <span className="ln-nav-item-label">Labels</span>
                <span className="ln-nav-item-count">12</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <Folder size={16} strokeWidth={1.5} />
                <span className="ln-nav-item-label">Categories</span>
                <span className="ln-nav-item-count">8</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <I.Paperclip />
                <span className="ln-nav-item-label">Files</span>
                <span className="ln-nav-item-count">24</span>
              </div>
              <div className="ln-nav-item" style={{ cursor: 'pointer' }}>
                <I.Sticker />
                <span className="ln-nav-item-label">Stickers</span>
                <span className="ln-nav-item-count">18</span>
              </div>
            </div>
          </>)}
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
              <a href="#" onClick={(e) => { e.preventDefault(); navGoTo('home'); }}>Plot</a>
              <span className="crumb-sep">/</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navGoTo(activePage); }}>
                {activePage === 'notes' ? 'Notes' : activePage === 'wiki' ? 'Wiki' : activePage === 'books' ? 'Books' : activePage === 'library' ? 'Library' : activePage === 'home' ? 'Home' : activePage === 'ontology' ? 'Ontology' : 'Calendar'}
              </a>
              {surface === 'editor' && (
                <>
                  <span className="crumb-sep">/</span>
                  <span className="crumb-current">{selected.title.slice(0, 40)}{selected.title.length > 40 ? '…' : ''}</span>
                </>
              )}
            </nav>
            <div className="ln-tab-strip">
              {(activePage === 'notes' || surface === 'list' || surface === 'editor' || surface === 'table') && (<>
                <button
                  className={`ln-tab ${surface === 'list' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => { setSurface('list'); setActivePage('notes'); }}
                >
                  <I.ViewList />
                  List
                </button>
                <button
                  className={`ln-tab ${surface === 'editor' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => { setSurface('editor'); setActivePage('notes'); }}
                >
                  <FileText />
                  Editor
                </button>
                <button
                  className={`ln-tab ${surface === 'table' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => { setSurface('table'); setActivePage('notes'); }}
                >
                  <I.ViewGrid />
                  Table
                </button>
              </>)}
              {(activePage === 'books' || activePage === 'library') && (
                <button className="ln-tab is-active" type="button">
                  <I.BookStack />
                  {activePage === 'books' ? 'Books' : 'Library'}
                </button>
              )}
              {activePage === 'wiki' && (
                <button className="ln-tab is-active" type="button">
                  <BookOpen size={16} strokeWidth={1.5} />
                  Wiki
                </button>
              )}
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
                onClick={() => { setFilterPopOpen((v) => !v); setFilterHoverCat(null); setFilterSubSearch(''); }}
              >
                <Filter size={14} strokeWidth={1.5} />
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
                <ArrowDownUp size={14} strokeWidth={1.5} />
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
              <Plus size={14} strokeWidth={1.5} />
            </button>
            <button className="ln-chip-clear" type="button" onClick={() => setFilters([])}>
              Clear all
            </button>
          </div>
        )}

        {surface === 'list' && viewMode === 'list' && (
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
                      <button className="lr-more" type="button" aria-label="More"><MoreHorizontal size={14} /></button>
                      <span className="lr-code">{note.code}</span>
                      <div className="lr-icon">
                        <StatusGlyph status={note.status} />
                      </div>
                      <span className="lr-time">{note.updated}</span>
                      <div className="lr-title">
                        <span>{note.title}</span>
                      </div>
                      <div className="lr-tags">
                        {note.tags.map((t) => (
                          <span key={t} className="ln-tag">{t}</span>
                        ))}
                      </div>
                      <div className="lr-assignee">
                        <span className="ln-avatar-xs">KK</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Board view — Kanban columns by status */}
        {surface === 'list' && viewMode === 'board' && (
          <div className="ln-content">
            <div className="ln-board">
              {STATUS_OPTS.map((col) => {
                const colNotes = NOTES.filter((n) => n.status === col.key);
                return (
                  <div key={col.key} className="ln-board-col">
                    <div className="ln-board-col-head">
                      <span style={{ color: col.color, display: 'inline-flex' }}><col.Icon /></span>
                      <span>{col.label}</span>
                      <span className="count">{colNotes.length}</span>
                    </div>
                    {colNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`ln-board-card ${selectedId === note.id ? 'is-selected' : ''}`}
                        onClick={() => setSelectedId(note.id)}
                      >
                        <div className="ln-board-card-head">
                          <span className="lr-code">{note.code}</span>
                          <span className="ln-avatar-xs">KK</span>
                        </div>
                        <div className="ln-board-card-title">{note.title}</div>
                        <div className="ln-board-card-tags">
                          {note.tags.map((t) => <span key={t} className="ln-tag">{t}</span>)}
                        </div>
                      </div>
                    ))}
                    <button className="ln-board-add" type="button"><Plus size={14} strokeWidth={1.5} /> New</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid view — card grid */}
        {surface === 'list' && viewMode === 'grid' && (
          <div className="ln-content">
            <div className="ln-grid">
              {NOTES.map((note) => (
                <div
                  key={note.id}
                  className={`ln-grid-card ${selectedId === note.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="ln-grid-card-head">
                    <StatusGlyph status={note.status} />
                    <span className="lr-code">{note.code}</span>
                    <div className="ln-spacer" />
                    <span className="ln-meta">{note.updated}</span>
                  </div>
                  <div className="ln-grid-card-title">{note.title}</div>
                  <div className="ln-grid-card-body">
                    Linear 디자인을 Plot v2에 통합하는 작업…
                  </div>
                  <div className="ln-grid-card-foot">
                    {note.tags.map((t) => <span key={t} className="ln-tag">{t}</span>)}
                    <div className="ln-spacer" />
                    <span className="ln-avatar-xs">KK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graph view — placeholder node visualization */}
        {surface === 'list' && viewMode === 'graph' && (
          <div className="ln-content">
            <div className="ln-graph-placeholder">
              <svg viewBox="0 0 400 300" style={{ width: '100%', maxWidth: 600, margin: '40px auto', display: 'block' }}>
                {/* Edges */}
                <line x1="200" y1="60" x2="100" y2="160" stroke="var(--ln-border)" strokeWidth="1" />
                <line x1="200" y1="60" x2="300" y2="140" stroke="var(--ln-border)" strokeWidth="1" />
                <line x1="100" y1="160" x2="160" y2="240" stroke="var(--ln-border)" strokeWidth="1" />
                <line x1="300" y1="140" x2="240" y2="240" stroke="var(--ln-border)" strokeWidth="1" />
                <line x1="160" y1="240" x2="240" y2="240" stroke="var(--ln-border)" strokeWidth="1" />
                <line x1="100" y1="160" x2="300" y2="140" stroke="var(--ln-border)" strokeWidth="0.5" strokeDasharray="4" />
                {/* Nodes */}
                {[
                  { x: 200, y: 60, label: 'PLT-1', color: '#45D483' },
                  { x: 100, y: 160, label: 'PLT-3', color: '#F5A623' },
                  { x: 300, y: 140, label: 'PLT-4', color: '#9CA3AF' },
                  { x: 160, y: 240, label: 'PLT-5', color: '#F5A623' },
                  { x: 240, y: 240, label: 'PLT-7', color: '#45D483' },
                ].map((node) => (
                  <g key={node.label}>
                    <circle cx={node.x} cy={node.y} r="18" fill="var(--ln-surface)" stroke={node.color} strokeWidth="2" />
                    <text x={node.x} y={node.y + 4} textAnchor="middle" fill="var(--ln-fg)" fontSize="10" fontFamily="var(--font-body)">{node.label}</text>
                  </g>
                ))}
              </svg>
              <div style={{ textAlign: 'center', color: 'var(--ln-meta)', fontSize: 'var(--text-sm)' }}>
                {NOTES.length} nodes · {NOTES.reduce((a, n) => a + n.refs, 0)} edges
              </div>
            </div>
          </div>
        )}

        {/* Insights view — mini dashboard */}
        {surface === 'list' && viewMode === 'insights' && (
          <div className="ln-content">
            <div className="ln-insights">
              <div className="ln-insights-grid">
                <div className="ln-insights-card">
                  <div className="ln-insights-card-label">Total Notes</div>
                  <div className="ln-insights-card-value">{NOTES.length}</div>
                </div>
                <div className="ln-insights-card">
                  <div className="ln-insights-card-label">Avg. Refs</div>
                  <div className="ln-insights-card-value">{Math.round(NOTES.reduce((a, n) => a + n.refs, 0) / NOTES.length)}</div>
                </div>
                <div className="ln-insights-card">
                  <div className="ln-insights-card-label">Completion</div>
                  <div className="ln-insights-card-value">{Math.round(NOTES.reduce((a, n) => a + n.progress, 0) / NOTES.length)}%</div>
                </div>
                <div className="ln-insights-card">
                  <div className="ln-insights-card-label">Keystones</div>
                  <div className="ln-insights-card-value">{NOTES.filter((n) => n.status === 'keystone').length}</div>
                </div>
              </div>
              <div className="ln-insights-chart">
                <div className="ln-popover-section">Status distribution</div>
                <div className="ln-insights-bars">
                  {STATUS_OPTS.map((s) => {
                    const count = NOTES.filter((n) => n.status === s.key).length;
                    const pct = Math.round((count / NOTES.length) * 100);
                    return (
                      <div key={s.key} className="ln-insights-bar-row">
                        <span style={{ color: s.color, display: 'inline-flex', width: 16 }}><s.Icon /></span>
                        <span className="ln-insights-bar-label">{s.label}</span>
                        <div className="ln-insights-bar-track">
                          <div className="ln-insights-bar-fill" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                        <span className="ln-insights-bar-val">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline view — Gantt-like bars */}
        {surface === 'list' && viewMode === 'timeline' && (
          <div className="ln-content">
            <div className="ln-timeline">
              <div className="ln-timeline-header">
                <div className="ln-timeline-label-col">Note</div>
                <div className="ln-timeline-track-col">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d} className="ln-timeline-day">{d}</span>
                  ))}
                </div>
              </div>
              {NOTES.map((note) => (
                <div
                  key={note.id}
                  className={`ln-timeline-row ${selectedId === note.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="ln-timeline-label-col">
                    <StatusGlyph status={note.status} />
                    <span className="ln-timeline-row-title">{note.title.slice(0, 30)}…</span>
                  </div>
                  <div className="ln-timeline-track-col">
                    <div
                      className="ln-timeline-bar"
                      style={{
                        left: `${(note.id * 7) % 40 + 5}%`,
                        width: `${note.progress * 0.5 + 10}%`,
                        background: note.status === 'keystone' ? '#45D483' : note.status === 'brick' ? '#F5A623' : '#9CA3AF',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
                    {([
                      { key: 'title' as SortField, label: 'Title', cls: '' },
                      { key: 'updatedAt' as SortField, label: 'Status', cls: '' },
                      { key: 'title' as SortField, label: 'Tags', cls: '' },
                      { key: 'links' as SortField, label: 'Refs', cls: 'num-col' },
                      { key: 'reads' as SortField, label: 'Progress', cls: 'num-col' },
                      { key: 'updatedAt' as SortField, label: 'Updated', cls: '' },
                    ]).map((col, i) => (
                      <th
                        key={i}
                        className={`${col.cls} ln-th-sortable ${sortRules[0]?.field === col.key ? 'is-sorted' : ''}`}
                        onClick={() => setSortRules([{ field: col.key, direction: sortRules[0]?.field === col.key && sortRules[0]?.direction === 'asc' ? 'desc' : 'asc' }])}
                        style={{ cursor: 'pointer' }}
                      >
                        {col.label}
                        {sortRules[0]?.field === col.key && (
                          <span className="ln-th-sort-icon">{sortRules[0].direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTES.map((note) => (
                    <tr
                      key={note.id}
                      className={selectedId === note.id ? 'is-selected' : ''}
                      onClick={() => setSelectedId(note.id)}
                      onDoubleClick={() => { setSelectedId(note.id); setSurface('editor'); }}
                      style={{ cursor: 'pointer' }}
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
                    className={`ln-book-card ${selectedBook === col.key ? 'is-selected' : ''}`}
                    style={{ ['--book-c' as string]: col.color }}
                    onClick={() => setSelectedBook(selectedBook === col.key ? null : col.key)}
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
        {/* Home surface */}
        {surface === 'home' && (
          <div className="ln-content">
            <div className="ln-home">
              <div className="ln-home-greeting">
                <h1 className="ln-home-title">Good evening, KK</h1>
                <p className="ln-home-sub">{NOTES.length} notes · {NOTES.filter((n) => n.section === 'today').length} updated today</p>
              </div>
              <div className="ln-home-section">
                <div className="ln-popover-section">Recently viewed</div>
                {NOTES.slice(0, 4).map((note) => (
                  <div key={note.id} className="ln-pop-row" style={{ cursor: 'pointer' }} onClick={() => { setSelectedId(note.id); setSurface('editor'); }}>
                    <StatusGlyph status={note.status} />
                    <span className="ln-pop-row-label">{note.title}</span>
                    <span className="ln-pop-row-meta">{note.updated}</span>
                  </div>
                ))}
              </div>
              <div className="ln-home-section">
                <div className="ln-popover-section">Quick stats</div>
                <div className="ln-insights-grid" style={{ maxWidth: 500 }}>
                  <div className="ln-insights-card">
                    <div className="ln-insights-card-label">Notes</div>
                    <div className="ln-insights-card-value">{NOTES.length}</div>
                  </div>
                  <div className="ln-insights-card">
                    <div className="ln-insights-card-label">Wiki</div>
                    <div className="ln-insights-card-value">18</div>
                  </div>
                  <div className="ln-insights-card">
                    <div className="ln-insights-card-label">Inbox</div>
                    <div className="ln-insights-card-value">3</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inbox surface */}
        {surface === 'inbox' && (
          <div className="ln-content">
            <div style={{ padding: '16px 20px' }}>
              <div className="ln-popover-section">Do · 2</div>
              {[
                { title: 'Review: Sync v2.0 결정 정리', meta: 'reminder · 9:00', icon: <Bell size={14} /> },
                { title: 'Phase 4 filter-bar 마이그레이션 시작', meta: 'autopilot · detected', icon: <Sparkles size={14} /> },
              ].map((item, i) => (
                <div key={i} className="ln-pop-row" style={{ cursor: 'pointer', padding: '8px 0' }}>
                  <span style={{ color: 'var(--accent-2)' }}>{item.icon}</span>
                  <span className="ln-pop-row-label">{item.title}</span>
                  <span className="ln-pop-row-meta">{item.meta}</span>
                </div>
              ))}
              <div className="ln-popover-sep" />
              <div className="ln-popover-section">Review · 1</div>
              {[
                { title: '위키 Zettelkasten 아티클 — 링크 검토', meta: '2 unresolved backlinks', icon: <I.Link /> },
              ].map((item, i) => (
                <div key={i} className="ln-pop-row" style={{ cursor: 'pointer', padding: '8px 0' }}>
                  <span style={{ color: 'var(--muted)' }}>{item.icon}</span>
                  <span className="ln-pop-row-label">{item.title}</span>
                  <span className="ln-pop-row-meta">{item.meta}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wiki surface */}
        {surface === 'wiki' && (
          <div className="ln-content">
            <div style={{ padding: '16px 20px' }}>
              <div className="ln-popover-section">Wiki articles · 18</div>
              {[
                { title: 'Zettelkasten method', status: 'published' as const, updated: '2h' },
                { title: 'Linear design patterns', status: 'draft' as const, updated: '5h' },
                { title: 'Zustand 5 migration guide', status: 'published' as const, updated: '1d' },
                { title: 'TipTap 3 extensions', status: 'draft' as const, updated: '3d' },
                { title: 'Next.js 16 changes', status: 'published' as const, updated: '5d' },
              ].map((article, i) => (
                <div key={i} className="ln-list-row" style={{ cursor: 'pointer' }} onClick={() => setSurface('editor')}>
                  <div className="lr-icon"><BookOpen size={16} strokeWidth={1.5} /></div>
                  <div className="lr-title"><span>{article.title}</span></div>
                  <span className={`ln-badge ${article.status === 'published' ? 'ln-badge--success' : 'ln-badge--accent'}`}>
                    {article.status}
                  </span>
                  <span className="lr-time">{article.updated}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ontology surface */}
        {surface === 'ontology' && (
          <div className="ln-content">
            <div className="ln-graph-placeholder">
              <svg viewBox="0 0 500 350" style={{ width: '100%', maxWidth: 700, margin: '32px auto', display: 'block' }}>
                {/* Denser graph for ontology */}
                {[
                  [250, 50, 120, 140], [250, 50, 380, 140], [120, 140, 80, 260],
                  [120, 140, 200, 260], [380, 140, 300, 260], [380, 140, 420, 260],
                  [200, 260, 300, 260], [80, 260, 200, 260], [300, 260, 420, 260],
                ].map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ln-border)" strokeWidth="1" />
                ))}
                {[
                  { x: 250, y: 50, label: 'Plot', color: '#5e6ad2', r: 22 },
                  { x: 120, y: 140, label: 'Notes', color: '#45D483', r: 18 },
                  { x: 380, y: 140, label: 'Wiki', color: '#F5A623', r: 18 },
                  { x: 80, y: 260, label: 'Tags', color: '#22c55e', r: 14 },
                  { x: 200, y: 260, label: 'Links', color: '#3b82f6', r: 14 },
                  { x: 300, y: 260, label: 'Refs', color: '#8b5cf6', r: 14 },
                  { x: 420, y: 260, label: 'Books', color: '#ec4899', r: 14 },
                ].map((node) => (
                  <g key={node.label}>
                    <circle cx={node.x} cy={node.y} r={node.r} fill="var(--ln-surface)" stroke={node.color} strokeWidth="2" />
                    <text x={node.x} y={node.y + 4} textAnchor="middle" fill="var(--ln-fg)" fontSize="10" fontFamily="var(--font-body)">{node.label}</text>
                  </g>
                ))}
              </svg>
              <div style={{ textAlign: 'center', color: 'var(--ln-meta)', fontSize: 'var(--text-sm)' }}>
                Ontology graph · 7 entities · 9 relations
              </div>
            </div>
          </div>
        )}

        {/* Calendar surface */}
        {surface === 'calendar' && (
          <div className="ln-content">
            <div className="ln-calendar">
              <div className="ln-calendar-head">
                <button className="ln-icon-btn" type="button"><I.CaretRight /></button>
                <span className="ln-calendar-month">May 2026</span>
                <button className="ln-icon-btn" type="button" style={{ transform: 'rotate(180deg)' }}><I.CaretRight /></button>
              </div>
              <div className="ln-calendar-grid">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <div key={d} className="ln-calendar-dayhead">{d}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 3; // offset for May starting on Friday
                  const isCurrentMonth = day >= 0 && day < 31;
                  const isToday = day === 26; // May 27
                  const hasNotes = [0, 4, 7, 12, 15, 20, 22, 26].includes(day);
                  return (
                    <div
                      key={i}
                      className={`ln-calendar-cell ${!isCurrentMonth ? 'is-muted' : ''} ${isToday ? 'is-today' : ''}`}
                    >
                      <span className="ln-calendar-num">{isCurrentMonth ? day + 1 : day < 0 ? 30 + day + 1 : day - 30}</span>
                      {hasNotes && isCurrentMonth && <span className="ln-calendar-dot" />}
                    </div>
                  );
                })}
              </div>
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
          {([
            { key: 'detail' as const, icon: <PanelLeft size={16} strokeWidth={1.5} />, label: '상세' },
            { key: 'connections' as const, icon: <Network size={16} strokeWidth={1.5} />, label: '연결' },
            { key: 'activity' as const, icon: <Clock size={16} strokeWidth={1.5} />, label: '활동' },
            { key: 'bookmarks' as const, icon: <Bookmark size={16} strokeWidth={1.5} />, label: '북마크' },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={`ln-detail-tab ${detailTab === tab.key ? 'is-active' : ''}`}
              type="button"
              onClick={() => setDetailTab(tab.key)}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
        <div className="ln-detail-scroll">
          {/* ── 상세 (Detail) tab ── */}
          {detailTab === 'detail' && (<>
            <dl className="ln-props">
              <dt>Status</dt>
              <dd>
                <StatusGlyph status={selected.status} />
                <span>{selected.status}</span>
              </dd>
              <dt>Labels</dt>
              <dd>
                {(selected.labels ?? ['design', 'important']).map((l: string) => (
                  <span key={l} className="ln-label-chip">{l}</span>
                ))}
              </dd>
              <dt>Tags</dt>
              <dd>
                {selected.tags.map((t) => (
                  <span key={t} className="ln-tag">
                    #{t}
                  </span>
                ))}
              </dd>
              <dt>Folder</dt>
              <dd>
                <Folder size={16} strokeWidth={1.5} />
                <span>{selected.folder ?? 'Research'}</span>
              </dd>
              <dt>Source</dt>
              <dd>
                <span className="ln-meta">{selected.source ?? 'manual'}</span>
              </dd>
              <dt>Relations</dt>
              <dd>
                <span className="ln-num">{selected.relations ?? 2}</span>
                <span className="ln-meta" style={{ marginLeft: 4 }}>linked</span>
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
            </dl>

            <hr className="ln-divider" />

            {/* Dates section */}
            <div className="ln-detail-dates">
              <div className="ln-detail-date-row">
                <span className="ln-detail-date-label">Created</span>
                <span className="ln-detail-date-value">{selected.created ?? '2026-05-20'}</span>
              </div>
              <div className="ln-detail-date-row">
                <span className="ln-detail-date-label">Updated</span>
                <span className="ln-detail-date-value">{selected.updated}</span>
              </div>
            </div>

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
                <div
                  className={`ln-toggle ${reminderOn ? 'is-on' : ''}`}
                  onClick={() => setReminderOn((v) => !v)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>
          </>)}

          {/* ── 연결 (Connections) tab ── */}
          {detailTab === 'connections' && (
            <div className="ln-connections-tab">
              {/* Backlinks section */}
              <div className="ln-conn-section">
                <button className="ln-conn-section-head" type="button">
                  <I.ChevronDown />
                  <I.ArrowDownLeft />
                  <span className="ln-conn-section-title">Backlinks</span>
                  <span className="ln-conn-section-count">{Math.min(selected.refs, 5)}</span>
                </button>
                <div className="ln-conn-section-body">
                  {Array.from({ length: Math.min(selected.refs, 5) }, (_, i) => {
                    const kinds = ['note', 'wiki', 'note', 'note', 'wiki'] as const;
                    const titles = ['Research notes on LLM agents', 'Architecture Overview', 'Weekly review #12', 'Meeting notes — design sync', 'API Reference Guide'];
                    return (
                      <div key={i} className="ln-conn-row" style={{ cursor: 'pointer' }}>
                        <span className="ln-conn-dir">←</span>
                        {kinds[i] === 'wiki' ? <I.FileText /> : <I.FileLines />}
                        <span className="ln-conn-row-title">{titles[i % titles.length]}</span>
                        <span className="ln-conn-row-meta">2d ago</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Forward links section */}
              <div className="ln-conn-section">
                <button className="ln-conn-section-head" type="button">
                  <I.ChevronDown />
                  <I.ArrowUpRight />
                  <span className="ln-conn-section-title">Forward links</span>
                  <span className="ln-conn-section-count">3</span>
                </button>
                <div className="ln-conn-section-body">
                  {['Plot v2 PRD', 'Linear design tokens', 'Filter architecture'].map((title, i) => (
                    <div key={i} className="ln-conn-row" style={{ cursor: 'pointer' }}>
                      <span className="ln-conn-dir" style={{ color: 'var(--ln-accent-2)' }}>→</span>
                      <I.FileLines />
                      <span className="ln-conn-row-title">{title}</span>
                      <span className="ln-conn-row-meta">1w ago</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wikilinks section */}
              <div className="ln-conn-section">
                <button className="ln-conn-section-head" type="button">
                  <I.ChevronDown />
                  <I.Link />
                  <span className="ln-conn-section-title">Wikilinks</span>
                  <span className="ln-conn-section-count">2</span>
                </button>
                <div className="ln-conn-section-body">
                  {['Design System', 'Component Library'].map((title, i) => (
                    <div key={i} className="ln-conn-row" style={{ cursor: 'pointer' }}>
                      <I.FileText />
                      <span className="ln-conn-row-title">{title}</span>
                      <span className="ln-conn-row-meta">wiki</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Co-occurrence section */}
              <div className="ln-conn-section">
                <button className="ln-conn-section-head" type="button">
                  <I.ChevronDown />
                  <I.GitBranch />
                  <span className="ln-conn-section-title">Co-occurrence</span>
                  <span className="ln-conn-section-count">4</span>
                </button>
                <div className="ln-conn-section-body">
                  {['#design', '#linear', '#frontend', '#plot'].map((tag, i) => (
                    <div key={i} className="ln-conn-row">
                      <Tag size={14} strokeWidth={1.5} />
                      <span className="ln-conn-row-title">{tag}</span>
                      <span className="ln-conn-row-meta">{[3, 2, 5, 1][i]} notes</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested tags */}
              <div className="ln-conn-suggested">
                <div className="ln-conn-suggested-head">Suggested tags</div>
                <div className="ln-conn-suggested-list">
                  {['ui-redesign', 'phase-4'].map((tag) => (
                    <span key={tag} className="ln-conn-suggested-chip">
                      <Tag size={14} strokeWidth={1.5} />
                      #{tag}
                      <button className="ln-conn-add-btn" type="button">+</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 활동 (Activity) tab ── */}
          {detailTab === 'activity' && (
            <div className="ln-activity-tab">
              {/* Comments section */}
              <div className="ln-activity-section">
                <div className="ln-activity-section-head">Comments</div>
                <div className="ln-activity-comment">
                  <span className="ln-avatar-xs">KK</span>
                  <div className="ln-activity-comment-body">
                    <div className="ln-activity-comment-meta">
                      <span className="ln-activity-comment-author">You</span>
                      <span className="ln-activity-comment-time">2h ago</span>
                    </div>
                    <div className="ln-activity-comment-text">
                      Filter popover를 two-panel hover로 변환 완료. Linear reference와 동일.
                    </div>
                  </div>
                </div>
                <div className="ln-activity-comment">
                  <span className="ln-avatar-xs" style={{ background: 'var(--ln-accent-2)', color: '#fff' }}>AI</span>
                  <div className="ln-activity-comment-body">
                    <div className="ln-activity-comment-meta">
                      <span className="ln-activity-comment-author">Plot AI</span>
                      <span className="ln-activity-comment-time">3h ago</span>
                    </div>
                    <div className="ln-activity-comment-text">
                      이 노트에 3개의 orphan link가 발견됨. 연결을 추천합니다.
                    </div>
                  </div>
                </div>
              </div>

              <hr className="ln-divider" />

              {/* History section */}
              <div className="ln-activity-section">
                <div className="ln-activity-section-head">History</div>
                {[
                  { icon: <I.Edit />, action: 'Content edited', actor: 'You', time: '2h ago', detail: '+142 chars' },
                  { icon: <Tag size={14} strokeWidth={1.5} />, action: 'Tags updated', actor: 'You', time: '5h ago', detail: 'added #design' },
                  { icon: <I.ArrowUpRight />, action: 'Link added', actor: 'You', time: '1d ago', detail: '→ Plot v2 PRD' },
                  { icon: <I.Move />, action: 'Moved to folder', actor: 'You', time: '2d ago', detail: 'Research → Design' },
                  { icon: <Star size={14} strokeWidth={1.5} />, action: 'Pinned', actor: 'You', time: '3d ago', detail: '' },
                  { icon: <Plus size={14} strokeWidth={1.5} />, action: 'Created', actor: 'You', time: '1w ago', detail: '' },
                ].map((ev, i) => (
                  <div key={i} className="ln-activity-event">
                    <div className="ln-activity-event-icon">{ev.icon}</div>
                    <div className="ln-activity-event-content">
                      <span className="ln-activity-event-action">{ev.action}</span>
                      {ev.detail && <span className="ln-activity-event-detail">{ev.detail}</span>}
                    </div>
                    <span className="ln-activity-event-time">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 북마크 (Bookmarks) tab ── */}
          {detailTab === 'bookmarks' && (
            <div className="ln-bookmarks-tab">
              {/* Filter chips */}
              <div className="ln-bm-filters">
                {[
                  { key: 'all', label: 'All', count: 5 },
                  { key: 'note', label: 'Notes', count: 3 },
                  { key: 'wiki', label: 'Wiki', count: 2 },
                ].map((f) => (
                  <button key={f.key} className={`ln-bm-filter-chip ${f.key === 'all' ? 'is-active' : ''}`} type="button">
                    {f.label}
                    <span className="ln-bm-filter-count">{f.count}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="ln-bm-search">
                <Search size={14} strokeWidth={1.5} />
                <input type="text" placeholder="Search bookmarks..." className="ln-bm-search-input" readOnly />
              </div>

              {/* Bookmark items */}
              <div className="ln-bm-list">
                {[
                  { title: 'Design principles section', target: 'Plot v2 PRD', kind: 'note' as const, anchor: '§ Design principles', time: '2d ago' },
                  { title: 'API endpoint table', target: 'Architecture Overview', kind: 'wiki' as const, anchor: '§ REST endpoints', time: '3d ago' },
                  { title: 'Color token reference', target: 'Linear design tokens', kind: 'note' as const, anchor: '§ OKLch palette', time: '5d ago' },
                  { title: 'Migration checklist', target: 'Phase 4 plan', kind: 'note' as const, anchor: '§ Checklist', time: '1w ago' },
                  { title: 'Component taxonomy', target: 'UI Component Guide', kind: 'wiki' as const, anchor: '§ Taxonomy', time: '1w ago' },
                ].map((bm, i) => (
                  <div key={i} className="ln-bm-item" style={{ cursor: 'pointer' }}>
                    <div className="ln-bm-item-icon">
                      {bm.kind === 'wiki' ? <I.FileText /> : <I.FileLines />}
                    </div>
                    <div className="ln-bm-item-content">
                      <div className="ln-bm-item-title">{bm.title}</div>
                      <div className="ln-bm-item-meta">
                        <span>{bm.target}</span>
                        <span className="ln-bm-item-dot">·</span>
                        <span>{bm.anchor}</span>
                      </div>
                    </div>
                    <span className="ln-bm-item-time">{bm.time}</span>
                  </div>
                ))}
              </div>

              {/* Context section — anchors in current note */}
              <hr className="ln-divider" />
              <div className="ln-bm-context">
                <div className="ln-bm-context-head">
                  <I.MapPin />
                  Anchors in this note
                </div>
                {['Introduction', 'Key findings', 'Next steps'].map((anchor, i) => (
                  <div key={i} className="ln-bm-anchor-row" style={{ cursor: 'pointer' }}>
                    <I.Hash />
                    <span>{anchor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
          <span className="ln-palette-ask">Ask Plot</span>
          <span className="ln-kbd">Tab</span>
        </div>
        <div className="ln-palette-results">
          {PALETTE_ROWS.map((group) => (
            <div key={group.sec}>
              <div className="ln-palette-sec">{group.sec}</div>
              {group.rows.map((row) => (
                <div
                  key={row.title}
                  className="ln-palette-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setPaletteOpen(false);
                    if (row.action === 'dialog') setDialogOpen(true);
                    else if (row.action === 'search') { /* already in palette */ }
                    else if (row.action === 'home' || row.action === 'ontology') {
                      setActivePage(row.action);
                      if (row.action === 'home') setSurface('home');
                    } else if (row.action === 'inbox') {
                      setActivePage('home');
                      setSurface('inbox');
                    }
                  }}
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
