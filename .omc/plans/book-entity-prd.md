# Book Entity — Product Requirements Document

**Status**: REVISED v1.1 (2026-05-09) — Critic feedback applied
**Date**: 2026-05-09 (initial), 2026-05-09 (v1.1 revision)
**Owner**: Plot architecture

**v1.1 changes** (Critic review): SPACE_COLORS not yet defined → Phase 2 task; sparse-order replaced with `fractional-indexing` package; ⌘1-6 phantom shortcut deleted (Plot uses "G then letter" pattern); `bookContext` made pane-scoped; heading drag + counter denominator rules explicit; trash + savedViews cleanup specified.
**Memory references**:
- 2026-05-03 4사분면 (Sticker=unordered set, Book=ordered sequence)
- 2026-05-03 Smart Book = AutoSource[] 확장
- v3 plan: Books = Activity Bar 7번째 space
- Page entity 폐기 (Book이 대체)

---

## 1. Overview

### Vision
Book = **cross-entity ordered sequence**. Plot의 4사분면 컨테이너 모델 (Folder/Sticker/View/Book) 중 마지막 미구현 자리. 종이책 메타포 — 한 권 안에 노트/위키가 의도된 순서로 정렬된다.

```
                Unordered (collection)    Ordered (sequence)
Type-strict     Folder                    —
Type-free       Sticker                   Book ← THIS PRD
```

### Why now
- 2026-05-03 33-design-decisions 이래 미구현
- v3 plan에 Books = 7번째 space로 정의됨
- 사용자 요청 (2026-05-09)
- Page entity 폐기로 자리 비어있음

### Non-goals
- Book 자체 컨텐츠 작성 (Book = wrapper, 컨텐츠는 멤버 노트/위키)
- Book template 시스템 (Memory: Smart Book이 대체)
- Reference / File / Sticker 멤버십 (v2+)
- Cover image storage (v2)

---

## 2. LOCKED Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Manual vs Smart 우선순위 | **Manual MVP, Smart v2** | 안전, 점진. Smart는 검증 후 |
| 2 | Member kinds (MVP) | **Note + Wiki Article 만** | 2-entity 철학 정합, 작은 surface |
| 3 | 다중 멤버십 (한 entity가 여러 book) | **N:M 허용** | Sticker 패턴 일관 |
| 4 | 챕터 구조 | **Heading-as-divider (단일 모델)** | gentle by default. flat 시작, heading 추가 시 nested 자연스럽게 |
| 5 | 메타데이터 | **title 만 필수** (cover/description optional) | minimal MVP |
| 6 | Book template 시스템 | **종식** | Smart Book이 대체 (Memory 결정) |
| 7 | Ordering UX | **drag + ↑/↓ 둘 다** | Linear 패턴, 접근성 + UX |
| 8 | Activity Bar 7번째 도입 | **Phase 2 (data 후 바로)** | 사용자 즉시 visible space |
| 9 | Trash/Archive | **Note/Wiki와 동일 시스템** | soft delete → /trash, 일관성 |
| 10 | 중복 항목 | **한 책에 1번만 (차단)** | 깔끔, 위치 명확 |
| 11 | In-book navigation | **`N/M` counter + ↑↓** (Linear 패턴) | ordered sequence 의미 살림 |

---

## 3. Data Model

### Book entity (`lib/types.ts`)

```typescript
/**
 * Book — cross-entity ordered sequence (33-design-decisions §1).
 *
 * Items can be notes, wiki articles, or chapter-heading dividers.
 * Items maintain explicit order (`order` field, sparse integers for fast reorder).
 *
 * Same entity can appear in multiple books (N:M membership).
 * Within a single book, an entity appears at most once (deduplicated by ref).
 *
 * Phase 1 covers Note + Wiki Article only. Reference/File/Sticker are v2.
 */
export interface Book {
  id: string
  title: string                    // required
  description?: string             // optional rich text? — MVP: plain string
  coverEmoji?: string | null       // optional single emoji (cover image is v2)
  color?: string | null            // optional accent color
  items: BookItem[]                // ordered list of items + chapter headings
  createdAt: string
  updatedAt: string
  trashed?: boolean                // soft delete
  trashedAt?: string | null
  pinned?: boolean                 // pin to home/sidebar (mirrors Note/Wiki)
}

/**
 * Book item — discriminated union. `note` and `wiki` reference existing entities;
 * `chapter-heading` is a Book-internal divider with title only (no body content).
 */
export type BookItem =
  | { kind: "note"; id: string; refId: string; order: number }
  | { kind: "wiki"; id: string; refId: string; order: number }
  | { kind: "chapter-heading"; id: string; title: string; order: number }
```

**Notes**:
- `id` on each item is a unique book-internal id (for React keys, drag, removal). `refId` points to the actual Note/WikiArticle id.
- `order`: sparse integer (0, 1000, 2000, ...) — insert between items without re-numbering all rows.
- `chapter-heading` has its own id but no entity reference; it's just a divider.
- Deduplication: a Note's `refId` appears at most once across all `kind: "note"` items in a single book. Adding a duplicate is silently rejected with toast.

### Store slice (`lib/store/slices/books.ts`)

```typescript
export interface BooksSlice {
  books: Book[]

  /* ── CRUD ── */
  createBook: (title: string) => string // returns book id
  updateBook: (id: string, patch: Partial<Book>) => void
  deleteBook: (id: string) => void              // soft delete (sets trashed)
  restoreBook: (id: string) => void
  permanentlyDeleteBook: (id: string) => void

  /* ── Item management ── */
  addItemToBook: (bookId: string, item: { kind: "note" | "wiki"; refId: string }) => void  // dedupes
  addChapterHeading: (bookId: string, title: string, afterItemId?: string) => void
  removeItemFromBook: (bookId: string, itemId: string) => void
  reorderBookItems: (bookId: string, fromIndex: number, toIndex: number) => void
  updateChapterHeading: (bookId: string, itemId: string, title: string) => void
}
```

### IDB migration (store version bump)

- Current version: 119 (after Studio/Editorial removal migration)
- Bump to **v120**: initialize `state.books = []` for users upgrading from v119. Idempotent.

---

## 4. Phase Plan

| Phase | Scope | Time est | PR |
|-------|-------|----------|-----|
| **1. Data infra** | Book type, BooksSlice, store v120 migration, no UI | ~2-3h | 1 |
| **2. Activity Bar + nav** | Bookshelf icon, /books route, sidebar empty state, BooksView shell | ~1-2h | 1 |
| **3. Manual book view** | Book overview (items list), drag + ↑↓ reorder, add/remove note/wiki, chapter heading insert | ~3-4h | 1-2 |
| **4. In-book navigation** | `N/M` counter + ↑↓ in NoteEditor/WikiArticleView when context=book | ~2-3h | 1 |
| **5. Smart Book (v2)** | AutoSource[] + folder/category/tag/label/sticker resolver | ~4-5h | separate |

**MVP = Phases 1-4** (~10h, 2-3 sessions). Phase 5 deferred.

---

## 5. Phase 1 Detail — Data Infra

### Files
- `lib/types.ts`: add Book + BookItem types (above)
- `lib/store/slices/books.ts`: new slice with CRUD + item management
- `lib/store/types.ts`: extend PlotState with `books: Book[]` and slice methods
- `lib/store/index.ts`: register slice, version 119 → 120
- `lib/store/migrate.ts`: v120 migration block (idempotent init `state.books = []`)
- `lib/store/helpers.ts` (if exists): `nextSparseOrder(items)` helper

### Helpers — fractional-indexing (CRITIC #2)

**DO NOT use sparse integer + halving** — `(prev + next) / 2` collapses to underflow after ~50 inserts at the same position. This is the classic `LexoRank`/fractional-indexing problem.

**Use `fractional-indexing` npm package** (~1KB, zero deps, used by Linear / Figma / Tldraw):

```typescript
import { generateKeyBetween } from "fractional-indexing"

// `order` is now a STRING (lexicographic sort key), not a number
type BookItem =
  | { kind: "note"; id: string; refId: string; order: string }
  | { kind: "wiki"; id: string; refId: string; order: string }
  | { kind: "chapter-heading"; id: string; title: string; order: string }

export function orderBetween(prev: string | null, next: string | null): string {
  return generateKeyBetween(prev, next)  // package handles all edge cases
}

export function appendOrder(items: BookItem[]): string {
  const sorted = [...items].sort((a, b) => a.order.localeCompare(b.order))
  const last = sorted[sorted.length - 1]?.order ?? null
  return generateKeyBetween(last, null)
}
```

Storage cost: ~5-10 bytes per item vs ~8 bytes for number. Acceptable.

**Migration note (v120)**: items array starts empty for all users, so no order-conversion needed yet. If MVP ships and we later switch from integer to fractional, that's a separate migration.

### Tests (Vitest)
- create/update/delete book lifecycle
- addItemToBook dedupe (same refId twice → second silently rejected)
- reorderBookItems (sparse order math)
- addChapterHeading after a specific item
- soft delete + restore + permanently delete

### Verification
- `npm run test` passes new test file
- `npx tsc --noEmit` clean
- Manual store test in browser console: `usePlotStore.getState().createBook("Test")`

---

## 6. Phase 2 Detail — Activity Bar + Nav

### Files
- **`lib/colors.ts`**: ADD `books: "#6366f1"` to `SPACE_COLORS` (CRITIC #1: currently missing — only home/notes/wiki/ontology/calendar/library exist). Also add to `SPACE_COLOR_CLASSES`, `ENTITY_COLORS` if applicable. Verify all consumers compile (`Space = keyof typeof SPACE_COLORS` narrows everywhere).
- `app/globals.css`: confirm `--space-books: #6366f1` already exists at line 29 (it does)
- `components/activity-bar.tsx`: add Books space (Bookshelf icon, `SPACE_COLORS.books`). Verify shortcut hint pattern (Plot uses "G then letter", e.g. `gB` or `gK`)
- `lib/types.ts`: extend `ActivitySpace` union with `"books"`
- `lib/table-route.ts`:
  - add `/books` to `VIEW_ROUTES`
  - `inferSpace`: `route.startsWith("/books") → "books"`
- `app/(app)/layout.tsx`: mount BooksView at /books route
- `components/views/books-view.tsx`: NEW — empty state shell + ViewHeader (icon=Bookshelf, title="Books", count=books.length)
- `components/linear-sidebar.tsx`: add Books-space block (similar to home block — list of pinned/recent books, or just empty state for MVP)
- **`lib/saved-views.ts` or wherever `SavedView.space` is typed**: extend with `"books"` (CRITIC #6) so future saved views in Books context don't break

### MVP empty state
"No books yet. Create your first book to organize related notes and wiki articles in order."
+ "Create book" CTA button

### Verification
- ActivityBar shows 7 spaces (home/notes/wiki/calendar/ontology/library/books)
- /books navigates correctly, shows empty state
- Shortcut hint: "G then B" (or another free letter — verify in `lib/shortcuts-data.ts`. CRITIC #3: Plot does NOT use ⌘1-6, uses G+letter pattern.)
- Color verification: `SPACE_COLORS.books` resolves correctly across activity-bar, sidebar active-icon CSS var, EntityKind chip if applicable

---

## 7. Phase 3 Detail — Manual Book View

### Files
- `components/views/books-view.tsx`: extend with book grid (cards) — list of books, click → /books/{id}
- `components/views/book-detail-page.tsx`: NEW — single book detail
  - ViewHeader: icon (Bookshelf or book.coverEmoji), title=book.title, count=item count, edit name inline
  - Items list with `BookItemRow` (drag handle + ↑↓ buttons + entity icon + title + remove ×)
  - "Add note", "Add wiki", "Add heading" buttons (or `+` menu)
- `components/books/book-item-row.tsx`: NEW — single row component
  - For `note`: StatusShapeIcon + title + remove
  - For `wiki`: IconWikiStub/Article + title + remove
  - For `chapter-heading`: distinct visual (bold + divider line, editable inline)
- `components/books/add-item-dialog.tsx`: NEW — pick existing note or wiki to add (search-as-you-type)

### dnd-kit reuse
- `dnd-kit-block-reorder.md` plan exists. Reuse SortableContext + SortableItem patterns.
- Keyboard: ↑↓ inside item moves up/down (`reorderBookItems`)

### CRITIC #5: Heading drag rule

Chapter-headings drag **independently** — they do NOT carry following items as a "chapter group". Each item (heading or content) is its own draggable. Reasoning:
- Heading is visual divider, not structural container (Notion sub-heading pattern)
- Simpler dnd-kit semantics (one SortableItem type)
- User can drag a heading away to "ungroup" naturally
- Future Phase 5 (Smart Book) may treat headings as chapter labels, but MVP keeps it flat-with-dividers

### Empty chapter behavior
- Two headings in a row (e.g. "Setup" → "Review" with no items between) is **allowed** — user might be reorganizing
- No auto-removal of empty chapters
- Visual hint may be added later (faded heading) but not MVP

### Counter logic (referenced from §8)
- Counter excludes headings: `contentItems.length`
- ↑↓ navigation skips headings (jumps to next note/wiki)

### Visual reference
Linear 패턴 — drag handle on hover (left edge), subtle row hover bg, instant feedback.

### Verification
- Drag reorder persists across reload
- ↑↓ keyboard shortcut works
- Add same note twice → toast "Already in this book"
- Chapter heading insertable, editable inline, removable
- Empty book shows empty state

---

## 8. Phase 4 Detail — In-Book Navigation

### Goal
When user opens a note/wiki *from a book context*, header shows:
```
┌────────────────────────────────────┐
│ My Book / Note Title       1/5 ↑↓  │
└────────────────────────────────────┘
```
Like Linear's KKH-1 "1/5" pattern (user 2026-05-09 screenshot).

### CRITIC #4: Pane-scoped bookContext

Plot has primary + secondary panes (SmartSidePanel dual pane, v71). bookContext MUST be pane-scoped — same note can be in book A in primary AND book B in secondary simultaneously.

**Data shape**:
```typescript
// lib/store/slices/ui.ts
interface BookContextState {
  bookId: string
  itemIndex: number      // 0-based, excluding chapter-headings
  total: number          // count of note + wiki items only (NOT headings)
}

interface UISlice {
  bookContext: {
    primary: BookContextState | null
    secondary: BookContextState | null
  }
  setBookContext: (pane: "primary" | "secondary", ctx: BookContextState | null) => void
}
```

### URL persistence — DECIDED: session-only, NOT URL

URL `/notes/abc?book=xyz&idx=2` is rejected for MVP:
- Adds URL state surface, breaks deep-link clarity ("share a note" vs "share a note within a book")
- Reload loses bookContext — that's acceptable (Linear's "1/5" also session-only)
- If user wants persistent in-book navigation, they re-open from book detail page

(Phase 5 / v2 may revisit if user feedback demands.)

### Files
- `lib/store/slices/ui.ts`: add `bookContext` (pane-scoped per above)
- `components/view-header.tsx`: extend props with `bookContext` (now optional, pane-aware)
- `components/note-editor.tsx`: when opened from book, set bookContext via PaneContext
- `components/wiki-editor/wiki-article-view.tsx`: same wiring

### UX
- Click note in book → opens note editor in current pane with bookContext set
- Header: `[Bookshelf] BookTitle / NoteTitle    1/5 ↑↓`
- ↑/↓ navigates to prev/next **content item** (chapter-headings skipped — counter denominator excludes headings)
- Breadcrumb back-link to book detail page (`/books/{bookId}`)
- Keyboard shortcut: TBD (verify free key in shortcuts-data.ts)

### Counter logic (CRITIC #5)

```typescript
// Items array includes both content items and chapter-headings.
// Counter denominator counts content items only (notes + wikis).
const contentItems = book.items.filter(i => i.kind !== "chapter-heading")
const total = contentItems.length
const itemIndex = contentItems.findIndex(i => i.refId === currentRefId)
```

Heading item types are visual structure only, not navigation targets.

### Edge cases
- First content item: ↑ disabled
- Last content item: ↓ disabled
- Item removed from book mid-session → bookContext invalid → clear bookContext, show plain note view
- Item's referenced entity deleted (orphaned refId) → render "Item missing" placeholder, allow remove from book
- Same note in multiple books → bookContext is per-pane-session, no persistence
- Empty book (only headings) → ↑↓ both disabled, counter shows "0/0" or hidden

### Verification
- Opens note from book → counter shows correct N/M (M = content count, not total items)
- ↑↓ works, disabled at edges
- Counter updates on reorder
- Heading-only book → no counter
- Two panes with two different books → independent counters
- Pane swap (move note from secondary to primary) → bookContext correctly transfers
- Opens note from /notes (not book) → no counter

---

## 9. Phase 5 Detail — Smart Book (v2, deferred)

**Out of scope for this PRD's MVP.** Will be planned separately after Phases 1-4 land and user feedback collected.

Sketch:
- `Book.smartSources?: AutoSource[]`
- `AutoSource` = `{ kind: "folder" | "category" | "tag" | "label" | "sticker"; refId: string }`
- Smart Book auto-resolves items from sources (cached, recompute on source change)
- Hybrid: manual items + smart items (excludeIds[] to remove auto-included)
- Chapter heading auto-generated per source (e.g., "Tag: Project X")

---

## 10. Cross-Cutting

### Color
- `SPACE_COLORS.books = "#6366f1"` (already defined in lib/colors.ts)
- `--space-books` CSS var (already defined)
- Bookshelf icon imported from imperial-extras (already in use elsewhere)

### Pinned integration
- Books appear in Home Mixed Quicklinks (33-design-decisions §1: cross-entity pinning)
- Today's PR (Home sidebar Pinned cross-entity) extends to include `Book` items in Phase 2-3

### Note/Wiki side panel
- Detail panel shows "In Books" section: list of books containing this entity
- Quick add to book / remove from book buttons

### Trash + Stale Reference Cleanup (CRITIC #6)

- /trash includes books (with note/wiki count badge)
- Permanently delete book → items survive (book is a wrapper, member entities are independent)
- Restore book → all items survive (refIds unchanged)

**Stale refId handling**:
- Note or Wiki Article deleted independently while book still references it → orphaned BookItem
- Resolution strategy: **lazy detection at render time**
  - BookItemRow checks if `notes.find(n => n.id === refId)` (or wiki equivalent) exists
  - If missing: render "Item no longer available" placeholder with a [×] remove button
  - User clicks × → removes the BookItem cleanly
- No background sweep migration needed (lazy is sufficient and avoids race conditions with deletion in-flight)

**SavedView integration** (CRITIC #6):
- `SavedView.space` union must include `"books"` so saved views in Books context don't break type-narrowing
- Future: SavedView could filter books by trashed/pinned/etc — out of MVP scope but type-extending is a one-line change in Phase 2

**globalBookmarks integration**:
- Books may eventually appear in globalBookmarks (mirroring Note/Wiki bookmark pattern)
- MVP: do NOT add to globalBookmarks — pinned flag on Book is sufficient
- Out of scope: bookmark sync

---

## 11. Verification Gates (per phase)

| Phase | Gate |
|-------|------|
| 1 | tsc + tests + IDB migration verified (manual reload simulation) |
| 2 | Visual: 7 spaces in ActivityBar, /books loads, empty state correct |
| 3 | Manual: create book + add 5 notes + reorder + add heading + remove + delete book |
| 4 | Manual: open note from book → counter shows, ↑↓ works, reorder updates counter |
| 5 (v2) | Separate PRD |

Each phase requires:
- npx tsc --noEmit clean
- npm run build pass
- Architect review approval before merge

---

## 12. Out of Scope (this PRD)

- Smart Book (Phase 5, separate PRD)
- Reference / File / Sticker membership (v2+)
- Cover image upload (v2)
- Book templates (permanently rejected per Memory)
- Nested chapters (chapter inside chapter — single-level only)
- Book sharing / export (v2+)
- Book comments / annotations
- Reading progress tracking

---

## 13. Open Questions (pre-impl)

**Phase 2 blocker** (resolve BEFORE starting Phase 2):
- **Pinned book in sidebar**: extend today's PR (Home Pinned cross-entity, Note + Wiki) to include Book? Or separate Pinned-Book section? Recommended: extend the existing `HomePinnedItem` discriminated union with `kind: "book"` — incremental, single source of truth.

**Phase 3 questions** (resolvable during impl):
- **Books shortcut**: free letter for "G then ?" pattern. Verify in `lib/shortcuts-data.ts`. Candidates: G+B (book) — likely free.
- **"Remove from book" vs "Delete entity"**: UX wording in BookItemRow context menu. Recommended: × icon = "Remove from book"; user must navigate to entity itself to delete it. Tooltip clarifies.
- **Search inside book**: MVP includes simple title filter. Default yes (low cost via existing search infrastructure).

---

## 14. Acceptance Criteria (MVP = Phases 1-4)

- [ ] User can create a book with title only
- [ ] Book appears in /books grid + Activity Bar Books space
- [ ] User can add notes/wikis from a search picker (no duplicates)
- [ ] User can reorder via drag + keyboard
- [ ] User can insert chapter headings between items
- [ ] User can rename, edit description, soft-delete (→ /trash), restore
- [ ] Opening note from book shows `N/M` counter + ↑↓ in header
- [ ] Counter survives reorder, hides outside book context
- [ ] Same note can be in multiple books (N:M)
- [ ] Same note in same book deduplicated (toast)
- [ ] tsc clean + build pass + tests pass
- [ ] Architect verification

---

## 15. References

- Memory: `docs/MEMORY.md` 2026-05-03 entry (33-design-decisions §1, §4)
- v3 mockup: `docs/v3-mockup/` (7-space activity bar)
- dnd-kit pattern: `.omc/plans/dnd-kit-block-reorder.md`
- Linear in-context navigation: 2026-05-09 user screenshot (KKH-1 "1/5 ↑↓")
- Note/Wiki entity philosophy: `docs/MEMORY.md` 2026-04-14 LOCKED
