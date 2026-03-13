import { describe, it, expect } from 'vitest'
import type { Note, NoteStatus, NotePriority } from '../../types'
import { applySort } from '../sort'
import { applyFilters } from '../filter'
import { applyGrouping } from '../group'
import { STATUS_ORDER, PRIORITY_ORDER } from '../types'

/* ── Helper: Create minimal valid Note object ────────────────────────── */

function makeNote(overrides: Partial<Note> = {}): Note {
  const now = new Date().toISOString()
  return {
    id: 'test-id',
    title: 'Test Note',
    content: 'Test content',
    contentJson: null,
    folderId: null,
    tags: [],
    status: 'inbox' as NoteStatus,
    priority: 'none' as NotePriority,
    reads: 0,
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    triageStatus: 'untriaged',
    reviewAt: null,
    inboxRank: 0,
    summary: null,
    source: null,
    promotedAt: null,
    lastTouchedAt: now,
    snoozeCount: 0,
    archivedAt: null,
    trashedAt: null,
    trashed: false,
    parentNoteId: null,
    isWiki: false,
    labelId: null,
    preview: '',
    linksOut: [],
    ...overrides,
  }
}

/* ────────────────────────────────────────────────────────────────────── */
/* TEST SUITE 1: applySort                                              */
/* ────────────────────────────────────────────────────────────────────── */

describe('applySort', () => {
  describe('sort by title', () => {
    it('should sort titles ascending', () => {
      const notes = [
        makeNote({ id: '1', title: 'Zebra' }),
        makeNote({ id: '2', title: 'Apple' }),
        makeNote({ id: '3', title: 'Banana' }),
      ]
      const sorted = applySort(notes, 'title', 'asc')
      expect(sorted.map(n => n.title)).toEqual(['Apple', 'Banana', 'Zebra'])
    })

    it('should sort titles descending', () => {
      const notes = [
        makeNote({ id: '1', title: 'Zebra' }),
        makeNote({ id: '2', title: 'Apple' }),
        makeNote({ id: '3', title: 'Banana' }),
      ]
      const sorted = applySort(notes, 'title', 'desc')
      expect(sorted.map(n => n.title)).toEqual(['Zebra', 'Banana', 'Apple'])
    })

    it('should handle case-insensitive sorting', () => {
      const notes = [
        makeNote({ id: '1', title: 'zebra' }),
        makeNote({ id: '2', title: 'APPLE' }),
        makeNote({ id: '3', title: 'Banana' }),
      ]
      const sorted = applySort(notes, 'title', 'asc')
      // localeCompare is case-sensitive but sorted by locale rules
      expect(sorted.length).toBe(3)
      expect(sorted[0].title).toBe('APPLE')
    })
  })

  describe('sort by status', () => {
    it('should sort by status order: inbox < capture < permanent', () => {
      const notes = [
        makeNote({ id: '1', status: 'permanent' }),
        makeNote({ id: '2', status: 'inbox' }),
        makeNote({ id: '3', status: 'capture' }),
      ]
      const sorted = applySort(notes, 'status', 'asc')
      expect(sorted.map(n => n.status)).toEqual([
        'inbox',
        'capture',
        'permanent',
      ])
    })

    it('should reverse status order when descending', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox' }),
        makeNote({ id: '2', status: 'capture' }),
        makeNote({ id: '3', status: 'permanent' }),
      ]
      const sorted = applySort(notes, 'status', 'desc')
      expect(sorted.map(n => n.status)).toEqual([
        'permanent',
        'capture',
        'inbox',
      ])
    })
  })

  describe('sort by priority', () => {
    it('should sort by priority order: none < low < medium < high < urgent', () => {
      const notes = [
        makeNote({ id: '1', priority: 'urgent' }),
        makeNote({ id: '2', priority: 'none' }),
        makeNote({ id: '3', priority: 'high' }),
        makeNote({ id: '4', priority: 'medium' }),
        makeNote({ id: '5', priority: 'low' }),
      ]
      const sorted = applySort(notes, 'priority', 'asc')
      expect(sorted.map(n => n.priority)).toEqual([
        'none',
        'low',
        'medium',
        'high',
        'urgent',
      ])
    })

    it('should reverse priority order when descending', () => {
      const notes = [
        makeNote({ id: '1', priority: 'none' }),
        makeNote({ id: '2', priority: 'low' }),
        makeNote({ id: '3', priority: 'medium' }),
        makeNote({ id: '4', priority: 'high' }),
        makeNote({ id: '5', priority: 'urgent' }),
      ]
      const sorted = applySort(notes, 'priority', 'desc')
      expect(sorted.map(n => n.priority)).toEqual([
        'urgent',
        'high',
        'medium',
        'low',
        'none',
      ])
    })
  })

  describe('sort by createdAt', () => {
    it('should sort by creation date ascending (oldest first)', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

      const notes = [
        makeNote({ id: '1', createdAt: yesterday }),
        makeNote({ id: '2', createdAt: now.toISOString() }),
        makeNote({ id: '3', createdAt: twoDaysAgo }),
      ]
      const sorted = applySort(notes, 'createdAt', 'asc')
      expect(sorted.map(n => n.createdAt)).toEqual([twoDaysAgo, yesterday, now.toISOString()])
    })

    it('should sort by creation date descending (newest first)', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

      const notes = [
        makeNote({ id: '1', createdAt: yesterday }),
        makeNote({ id: '2', createdAt: now.toISOString() }),
        makeNote({ id: '3', createdAt: twoDaysAgo }),
      ]
      const sorted = applySort(notes, 'createdAt', 'desc')
      expect(sorted.map(n => n.createdAt)).toEqual([now.toISOString(), yesterday, twoDaysAgo])
    })
  })

  describe('sort by updatedAt', () => {
    it('should sort by updated date ascending', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

      const notes = [
        makeNote({ id: '1', updatedAt: yesterday }),
        makeNote({ id: '2', updatedAt: now.toISOString() }),
        makeNote({ id: '3', updatedAt: twoDaysAgo }),
      ]
      const sorted = applySort(notes, 'updatedAt', 'asc')
      expect(sorted.map(n => n.updatedAt)).toEqual([twoDaysAgo, yesterday, now.toISOString()])
    })
  })

  describe('sort by links (with backlinksMap)', () => {
    it('should sort by backlink count ascending', () => {
      const backlinksMap = new Map([
        ['1', 0],
        ['2', 5],
        ['3', 2],
      ])
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
        makeNote({ id: '3' }),
      ]
      const sorted = applySort(notes, 'links', 'asc', backlinksMap)
      expect(sorted.map(n => n.id)).toEqual(['1', '3', '2'])
    })

    it('should sort by backlink count descending', () => {
      const backlinksMap = new Map([
        ['1', 0],
        ['2', 5],
        ['3', 2],
      ])
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
        makeNote({ id: '3' }),
      ]
      const sorted = applySort(notes, 'links', 'desc', backlinksMap)
      expect(sorted.map(n => n.id)).toEqual(['2', '3', '1'])
    })

    it('should treat missing ids as 0 backlinks', () => {
      const backlinksMap = new Map([['2', 5]])
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
        makeNote({ id: '3' }),
      ]
      const sorted = applySort(notes, 'links', 'asc', backlinksMap)
      expect(sorted.map(n => n.id)).toEqual(['1', '3', '2'])
    })

    it('should use 0 when backlinksMap is undefined', () => {
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
      ]
      const sorted = applySort(notes, 'links', 'asc')
      // Both should have 0 backlinks, order should be preserved (stable sort)
      expect(sorted.map(n => n.id)).toEqual(['1', '2'])
    })
  })

  describe('sort by reads', () => {
    it('should sort by read count ascending', () => {
      const notes = [
        makeNote({ id: '1', reads: 10 }),
        makeNote({ id: '2', reads: 0 }),
        makeNote({ id: '3', reads: 5 }),
      ]
      const sorted = applySort(notes, 'reads', 'asc')
      expect(sorted.map(n => n.reads)).toEqual([0, 5, 10])
    })

    it('should sort by read count descending', () => {
      const notes = [
        makeNote({ id: '1', reads: 10 }),
        makeNote({ id: '2', reads: 0 }),
        makeNote({ id: '3', reads: 5 }),
      ]
      const sorted = applySort(notes, 'reads', 'desc')
      expect(sorted.map(n => n.reads)).toEqual([10, 5, 0])
    })
  })

  describe('sort by folder', () => {
    it('should sort by folder id ascending, null values first', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-zebra' }),
        makeNote({ id: '2', folderId: null }),
        makeNote({ id: '3', folderId: 'folder-alpha' }),
      ]
      const sorted = applySort(notes, 'folder', 'asc')
      // null becomes empty string, sorts first
      expect(sorted.map(n => n.id)).toEqual(['2', '3', '1'])
    })

    it('should sort by folder id descending', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-zebra' }),
        makeNote({ id: '2', folderId: 'folder-alpha' }),
        makeNote({ id: '3', folderId: 'folder-beta' }),
      ]
      const sorted = applySort(notes, 'folder', 'desc')
      expect(sorted.map(n => n.folderId)).toEqual([
        'folder-zebra',
        'folder-beta',
        'folder-alpha',
      ])
    })
  })

  describe('edge cases', () => {
    it('should return empty array when given empty array', () => {
      const sorted = applySort([], 'title', 'asc')
      expect(sorted).toEqual([])
    })

    it('should return single element unchanged', () => {
      const notes = [makeNote({ id: '1', title: 'Only Note' })]
      const sorted = applySort(notes, 'title', 'asc')
      expect(sorted).toEqual(notes)
    })

    it('should not mutate original array', () => {
      const notes = [
        makeNote({ id: '1', title: 'Zebra' }),
        makeNote({ id: '2', title: 'Apple' }),
      ]
      const original = [...notes]
      applySort(notes, 'title', 'asc')
      expect(notes).toEqual(original)
    })

    it('should be a stable sort', () => {
      const notes = [
        makeNote({ id: '1', title: 'A', priority: 'high' }),
        makeNote({ id: '2', title: 'A', priority: 'low' }),
        makeNote({ id: '3', title: 'A', priority: 'medium' }),
      ]
      const sorted = applySort(notes, 'title', 'asc')
      // All have same title, so order should be preserved
      expect(sorted.map(n => n.id)).toEqual(['1', '2', '3'])
    })
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/* TEST SUITE 2: applyFilters                                           */
/* ────────────────────────────────────────────────────────────────────── */

describe('applyFilters', () => {
  describe('empty filters', () => {
    it('should return all notes when filters array is empty', () => {
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
        makeNote({ id: '3' }),
      ]
      const filtered = applyFilters(notes, [])
      expect(filtered).toEqual(notes)
    })
  })

  describe('filter by status', () => {
    it('should filter by status eq "capture"', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox' }),
        makeNote({ id: '2', status: 'capture' }),
        makeNote({ id: '3', status: 'capture' }),
        makeNote({ id: '4', status: 'permanent' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'status', operator: 'eq', value: 'capture' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '3'])
    })

    it('should filter by status neq "inbox"', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox' }),
        makeNote({ id: '2', status: 'capture' }),
        makeNote({ id: '3', status: 'permanent' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'status', operator: 'neq', value: 'inbox' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '3'])
    })
  })

  describe('filter by priority', () => {
    it('should filter by priority eq "high"', () => {
      const notes = [
        makeNote({ id: '1', priority: 'none' }),
        makeNote({ id: '2', priority: 'high' }),
        makeNote({ id: '3', priority: 'urgent' }),
        makeNote({ id: '4', priority: 'high' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'priority', operator: 'eq', value: 'high' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '4'])
    })

    it('should filter by priority neq "none"', () => {
      const notes = [
        makeNote({ id: '1', priority: 'none' }),
        makeNote({ id: '2', priority: 'low' }),
        makeNote({ id: '3', priority: 'none' }),
        makeNote({ id: '4', priority: 'high' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'priority', operator: 'neq', value: 'none' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '4'])
    })
  })

  describe('filter by links', () => {
    it('should filter by links gt "2" (outbound wiki-links)', () => {
      const notes = [
        makeNote({ id: '1', linksOut: ['a', 'b'] }),
        makeNote({ id: '2', linksOut: ['a', 'b', 'c'] }),
        makeNote({ id: '3', linksOut: [] }),
        makeNote({ id: '4', linksOut: ['a', 'b', 'c', 'd', 'e'] }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'links', operator: 'gt', value: '2' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '4'])
    })

    it('should filter by links lt "3"', () => {
      const notes = [
        makeNote({ id: '1', linksOut: ['a', 'b'] }),
        makeNote({ id: '2', linksOut: ['a', 'b', 'c'] }),
        makeNote({ id: '3', linksOut: [] }),
        makeNote({ id: '4', linksOut: ['a'] }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'links', operator: 'lt', value: '3' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['1', '3', '4'])
    })

    it('should filter by links eq "0"', () => {
      const notes = [
        makeNote({ id: '1', linksOut: ['a', 'b'] }),
        makeNote({ id: '2', linksOut: [] }),
        makeNote({ id: '3', linksOut: [] }),
        makeNote({ id: '4', linksOut: ['a'] }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'links', operator: 'eq', value: '0' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '3'])
    })

    it('should treat undefined linksOut as 0', () => {
      const notes = [
        makeNote({ id: '1', linksOut: undefined as any }),
        makeNote({ id: '2', linksOut: ['a'] }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'links', operator: 'eq', value: '0' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['1'])
    })
  })

  describe('filter by reads', () => {
    it('should filter by reads lt "5"', () => {
      const notes = [
        makeNote({ id: '1', reads: 0 }),
        makeNote({ id: '2', reads: 3 }),
        makeNote({ id: '3', reads: 5 }),
        makeNote({ id: '4', reads: 10 }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'lt', value: '5' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['1', '2'])
    })

    it('should filter by reads eq "10"', () => {
      const notes = [
        makeNote({ id: '1', reads: 5 }),
        makeNote({ id: '2', reads: 10 }),
        makeNote({ id: '3', reads: 10 }),
        makeNote({ id: '4', reads: 15 }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'eq', value: '10' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2', '3'])
    })

    it('should filter by reads gt "2"', () => {
      const notes = [
        makeNote({ id: '1', reads: 1 }),
        makeNote({ id: '2', reads: 2 }),
        makeNote({ id: '3', reads: 3 }),
        makeNote({ id: '4', reads: 10 }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'gt', value: '2' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['3', '4'])
    })

    it('should treat undefined reads as 0', () => {
      const notes = [
        makeNote({ id: '1', reads: undefined as any }),
        makeNote({ id: '2', reads: 5 }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'gt', value: '0' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['2'])
    })
  })

  describe('multiple filters (AND logic)', () => {
    it('should apply multiple filters with AND logic', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox', priority: 'high' }),
        makeNote({ id: '2', status: 'capture', priority: 'high' }),
        makeNote({ id: '3', status: 'inbox', priority: 'low' }),
        makeNote({ id: '4', status: 'capture', priority: 'low' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'status', operator: 'eq', value: 'inbox' },
        { field: 'priority', operator: 'eq', value: 'high' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['1'])
    })

    it('should require all filters to pass', () => {
      const notes = [
        makeNote({ id: '1', reads: 5, priority: 'high' }),
        makeNote({ id: '2', reads: 10, priority: 'high' }),
        makeNote({ id: '3', reads: 5, priority: 'low' }),
        makeNote({ id: '4', reads: 15, priority: 'high' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'gt', value: '4' },
        { field: 'priority', operator: 'eq', value: 'high' },
      ])
      expect(filtered.map(n => n.id)).toEqual(['1', '2', '4'])
    })

    it('should return empty when no notes match all filters', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox', priority: 'high' }),
        makeNote({ id: '2', status: 'capture', priority: 'high' }),
        makeNote({ id: '3', status: 'inbox', priority: 'low' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'status', operator: 'eq', value: 'permanent' },
        { field: 'priority', operator: 'eq', value: 'urgent' },
      ])
      expect(filtered).toEqual([])
    })
  })

  describe('invalid operators', () => {
    it('should return all notes when operator is invalid', () => {
      const notes = [
        makeNote({ id: '1', priority: 'high' }),
        makeNote({ id: '2', priority: 'low' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'priority', operator: 'invalid' as any, value: 'high' },
      ])
      expect(filtered).toEqual(notes)
    })

    it('should return all notes when filter field is invalid', () => {
      const notes = [
        makeNote({ id: '1' }),
        makeNote({ id: '2' }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'invalid' as any, operator: 'eq', value: 'anything' },
      ])
      expect(filtered).toEqual(notes)
    })

    it('should return all notes for non-numeric value with number operator', () => {
      const notes = [
        makeNote({ id: '1', reads: 5 }),
        makeNote({ id: '2', reads: 10 }),
      ]
      const filtered = applyFilters(notes, [
        { field: 'reads', operator: 'gt', value: 'not-a-number' },
      ])
      expect(filtered).toEqual(notes)
    })
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/* TEST SUITE 3: applyGrouping                                          */
/* ────────────────────────────────────────────────────────────────────── */

describe('applyGrouping', () => {
  describe('groupBy "none"', () => {
    it('should return single group with all notes', () => {
      const notes = [
        makeNote({ id: '1', title: 'Note 1' }),
        makeNote({ id: '2', title: 'Note 2' }),
        makeNote({ id: '3', title: 'Note 3' }),
      ]
      const groups = applyGrouping(notes, 'none')
      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe('_all')
      expect(groups[0].label).toBe('')
      expect(groups[0].notes).toEqual(notes)
    })

    it('should return single group with empty array when notes empty', () => {
      const groups = applyGrouping([], 'none')
      expect(groups).toHaveLength(1)
      expect(groups[0].notes).toEqual([])
    })
  })

  describe('groupBy "status"', () => {
    it('should return 3 groups in status order: inbox, capture, permanent', () => {
      const notes = [
        makeNote({ id: '1', status: 'permanent', title: 'P1' }),
        makeNote({ id: '2', status: 'inbox', title: 'I1' }),
        makeNote({ id: '3', status: 'capture', title: 'C1' }),
      ]
      const groups = applyGrouping(notes, 'status')
      expect(groups).toHaveLength(3)
      expect(groups.map(g => g.key)).toEqual([
        'inbox',
        'capture',
        'permanent',
      ])
    })

    it('should populate correct notes in each status group', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox' }),
        makeNote({ id: '2', status: 'inbox' }),
        makeNote({ id: '3', status: 'capture' }),
        makeNote({ id: '4', status: 'permanent' }),
      ]
      const groups = applyGrouping(notes, 'status')
      const inboxGroup = groups.find(g => g.key === 'inbox')!
      const captureGroup = groups.find(g => g.key === 'capture')!
      const permanentGroup = groups.find(g => g.key === 'permanent')!

      expect(inboxGroup.notes.map(n => n.id)).toEqual(['1', '2'])
      expect(captureGroup.notes.map(n => n.id)).toEqual(['3'])
      expect(permanentGroup.notes.map(n => n.id)).toEqual(['4'])
    })

    it('should return all 3 status groups even if some are empty', () => {
      const notes = [
        makeNote({ id: '1', status: 'inbox' }),
        makeNote({ id: '2', status: 'inbox' }),
      ]
      const groups = applyGrouping(notes, 'status')
      expect(groups).toHaveLength(3)
      expect(groups[0].notes.map(n => n.id)).toEqual(['1', '2'])
      expect(groups[1].notes).toEqual([])
      expect(groups[2].notes).toEqual([])
    })

    it('should have correct labels for status groups', () => {
      const groups = applyGrouping([], 'status')
      expect(groups.map(g => g.label)).toEqual([
        'Inbox',
        'Capture',
        'Permanent',
      ])
    })
  })

  describe('groupBy "priority"', () => {
    it('should return 5 groups in priority order: urgent, high, medium, low, none', () => {
      const notes = [
        makeNote({ id: '1', priority: 'none' }),
        makeNote({ id: '2', priority: 'low' }),
        makeNote({ id: '3', priority: 'medium' }),
        makeNote({ id: '4', priority: 'high' }),
        makeNote({ id: '5', priority: 'urgent' }),
      ]
      const groups = applyGrouping(notes, 'priority')
      expect(groups).toHaveLength(5)
      expect(groups.map(g => g.key)).toEqual([
        'urgent',
        'high',
        'medium',
        'low',
        'none',
      ])
    })

    it('should populate correct notes in each priority group', () => {
      const notes = [
        makeNote({ id: '1', priority: 'high' }),
        makeNote({ id: '2', priority: 'high' }),
        makeNote({ id: '3', priority: 'low' }),
        makeNote({ id: '4', priority: 'none' }),
      ]
      const groups = applyGrouping(notes, 'priority')
      const highGroup = groups.find(g => g.key === 'high')!
      const lowGroup = groups.find(g => g.key === 'low')!
      const noneGroup = groups.find(g => g.key === 'none')!

      expect(highGroup.notes.map(n => n.id)).toEqual(['1', '2'])
      expect(lowGroup.notes.map(n => n.id)).toEqual(['3'])
      expect(noneGroup.notes.map(n => n.id)).toEqual(['4'])
    })

    it('should have correct labels for priority groups', () => {
      const groups = applyGrouping([], 'priority')
      expect(groups.map(g => g.label)).toEqual([
        'Urgent',
        'High',
        'Medium',
        'Low',
        'No Priority',
      ])
    })

    it('should return all 5 priority groups even if some are empty', () => {
      const notes = [
        makeNote({ id: '1', priority: 'urgent' }),
      ]
      const groups = applyGrouping(notes, 'priority')
      expect(groups).toHaveLength(5)
      expect(groups[0].notes.map(n => n.id)).toEqual(['1'])
      expect(groups[1].notes).toEqual([])
      expect(groups[2].notes).toEqual([])
      expect(groups[3].notes).toEqual([])
      expect(groups[4].notes).toEqual([])
    })
  })

  describe('groupBy "folder"', () => {
    it('should group by folder id', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-a' }),
        makeNote({ id: '2', folderId: 'folder-a' }),
        makeNote({ id: '3', folderId: 'folder-b' }),
      ]
      const groups = applyGrouping(notes, 'folder')
      expect(groups).toHaveLength(2)
      expect(groups.map(g => g.key)).toEqual(['folder-a', 'folder-b'])
    })

    it('should sort folder ids alphabetically', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-zebra' }),
        makeNote({ id: '2', folderId: 'folder-apple' }),
        makeNote({ id: '3', folderId: 'folder-banana' }),
      ]
      const groups = applyGrouping(notes, 'folder')
      expect(groups.map(g => g.key)).toEqual(['folder-apple', 'folder-banana', 'folder-zebra'])
    })

    it('should create "No Folder" group for null folders', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-a' }),
        makeNote({ id: '2', folderId: null }),
        makeNote({ id: '3', folderId: null }),
      ]
      const groups = applyGrouping(notes, 'folder')
      expect(groups).toHaveLength(2)
      const noFolderGroup = groups.find(g => g.key === '_no_folder')!
      expect(noFolderGroup.label).toBe('No Folder')
      expect(noFolderGroup.notes.map(n => n.id)).toEqual(['2', '3'])
    })

    it('should only include "No Folder" group if there are null folders', () => {
      const notes = [
        makeNote({ id: '1', folderId: 'folder-a' }),
        makeNote({ id: '2', folderId: 'folder-b' }),
      ]
      const groups = applyGrouping(notes, 'folder')
      expect(groups).toHaveLength(2)
      expect(groups.every(g => g.key !== '_no_folder')).toBe(true)
    })

    it('should handle notes with all folders as null', () => {
      const notes = [
        makeNote({ id: '1', folderId: null }),
        makeNote({ id: '2', folderId: null }),
      ]
      const groups = applyGrouping(notes, 'folder')
      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe('_no_folder')
      expect(groups[0].notes.map(n => n.id)).toEqual(['1', '2'])
    })
  })

  describe('groupBy "date"', () => {
    it('should return groups for Today, This Week, This Month, Older', () => {
      const groups = applyGrouping([], 'date')
      expect(groups).toHaveLength(4)
      expect(groups.map(g => g.key)).toEqual([
        'Today',
        'This Week',
        'This Month',
        'Older',
      ])
    })

    it('should have correct labels for date groups', () => {
      const groups = applyGrouping([], 'date')
      expect(groups.map(g => g.label)).toEqual([
        'Today',
        'This Week',
        'This Month',
        'Older',
      ])
    })
  })

  describe('edge cases', () => {
    it('should return empty notes groups when empty array passed', () => {
      const groups = applyGrouping([], 'status')
      expect(groups).toHaveLength(3)
      groups.forEach(group => {
        expect(group.notes).toEqual([])
      })
    })

    it('should handle invalid groupBy as "none"', () => {
      const notes = [makeNote({ id: '1' })]
      const groups = applyGrouping(notes, 'invalid' as any)
      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe('_all')
      expect(groups[0].notes).toEqual(notes)
    })
  })
})
