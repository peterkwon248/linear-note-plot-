# Smart Book — AutoSource Resolver (Book Entity Phase 5)

**Status**: DRAFT v1.1 (post-critic revision, 2026-05-09)
**Date**: 2026-05-09
**Owner**: Plot architecture
**Parent PRD**: `.omc/plans/book-entity-prd.md` (v1.1 LOCKED — Phases 1-4 manual book MVP)

**Revision history**:
- v1.0 (2026-05-09): Initial draft
- v1.1 (2026-05-09): post-critic revision — data-model corrections (Folder reverse N:M, WikiArticle.categoryIds DAG, Folder hard-delete only), Phase A time +3-4h, store hook name fix, dedup guard spec, manual/auto placement LOCKED, future source out-of-scope, cross-links

**Memory references**:
- 2026-05-03 Smart Book sketch (33-design-decisions §1: Book = AutoSource[] 확장)
- 2026-05-03 4사분면 (Sticker=unordered set, Book=ordered sequence)
- 2026-05-09 마라톤 (Book entity Phase 1-4 완료, store v120)
- 2026-04-14 Note/Wiki 2-entity 철학 LOCKED (엔티티 통합 영구 폐기)
- Sticker 7-kind cross-entity (`docs/MEMORY.md`)
- Folder N:M reverse pattern (`Note.folderIds: string[]` / `WikiArticle.folderIds: string[]`, Note/Wiki 쪽에서 folder 가리킴 — folder는 멤버 배열을 보유하지 않음)

---

## 1. Overview

### Vision
Smart Book = **Saved view + ordering + heading grouping + cross-entity**. Manual book이 사용자가 의도적으로 큐레이션한 ordered sequence라면, Smart Book은 **공급원(AutoSource)에서 자동으로 채워지지만 여전히 ordered + cross-entity**.

```
                       Manual                    Smart
ordered                Book §3                   Book §5 (THIS PRD)
unordered              Sticker                   Saved View
```

### Why Smart Book ≠ Saved View
| Property | Saved View | Smart Book |
|----------|------------|------------|
| Cross-entity (note + wiki) | 단일 entity 위주 | **둘 다 한 컨테이너에** |
| Ordering | filter 결과 sort만 | **manual reorder 가능 (fixed position)** |
| Grouping | flat | **chapter heading로 source별 grouping** |
| Resolution | query만 | **auto-resolve + manual override (excludeIds)** |
| Hybrid | X (pure filter) | **manual items + auto sources 공존** |

Smart Book의 unique value: (a) cross-entity (b) ordered (c) heading grouping (d) hybrid.

### Single source vs multi-source
- Single folder source → "이 폴더의 노트들이 책 한 권" (간단)
- Multi-source (folder A + tag B + sticker C) → **진짜 가치**: 흩어진 entity를 의도된 순서로 묶고, source별 heading으로 구분

### Why now
- 2026-05-09 Book entity Phase 1-4 완료 (store v120, fractional-indexing 정착)
- Manual book 인프라 (items, order, chapter-heading) 그대로 재사용 가능
- 사용자 합의 6개 결정 LOCKED (2026-05-09)

### Folder source data-model note (CORRECTED v1.1)
- Folder 타입에는 `noteIds` 필드가 **없음** (`lib/types.ts` 437-460: `{id, name, color, parentId, lastAccessedAt, pinned, pinnedOrder, createdAt, kind}`).
- 멤버십은 **Note/WikiArticle 쪽에서 forward reference**: `Note.folderIds: string[]`, `WikiArticle.folderIds: string[]`.
- 따라서 folder source resolution은 **reverse lookup**: `store.notes.filter(n => n.folderIds.includes(source.refId))` 형태.
- Folder는 `kind: "note" | "wiki"` 디스크리미네이터를 가지며 한 folder는 둘 중 하나의 entity만 담음 (XOR). `kind="note"` folder source → notes만, `kind="wiki"` folder source → wiki articles만.
- **Folder는 trash 시스템 없음 (hard delete 전용)** — `deleteFolder`는 `state.folders.filter(f => f.id !== id)` 패턴 + cascade로 `Note.folderIds`/`WikiArticle.folderIds`에서 해당 id 제거 (`lib/store/slices/folders.ts` 54-82).

### Non-goals
- AND / NOT semantics (multi-source는 OR/union만, AND/NOT은 v2)
- Smart Book 안에 Smart Book 중첩
- Source filter (folder + "tag X 있는 것만") — v2
- Chapter heading 사용자 rename (auto-generated, read-only, v2)
- Multi-source dedup 정책 변경 (첫 source 우선만, v2)

---

## 2. INVARIANT (CORE)

**Smart Book에도 manual book과 동일하게 적용:**

```
Book.items의 element kind = "note" | "wiki" | "chapter-heading" 만.
AutoSource는 "어디서 가져올지(공급원)"이지 멤버 kind가 아니다.
모든 source는 자신이 가진 entity 중 note/wiki만 filter해서 Book.items에 추가한다.
```

| Source kind | 가져오는 entity (resolve 패턴) | 결과 BookItem kind | Notes |
|-------------|-------------------------------|-------------------|-------|
| `folder` (kind="note") | `notes.filter(n => n.folderIds.includes(refId) && !n.trashed)` | `note` only | Folder.kind="note"인 source. Reverse N:M lookup. Folder 자체에는 `noteIds` 없음 |
| `folder` (kind="wiki") | `wikiArticles.filter(w => w.folderIds.includes(refId))` | `wiki` only | Folder.kind="wiki"인 source. **Phase A는 kind="note" folder만 지원**, wiki folder는 Phase A.5에서 지원 결정 |
| `category` | `wikiArticles.filter(w => w.categoryIds?.includes(refId))` | `wiki` only | **DAG 다중 부모**: 한 wiki가 여러 category에 속할 수 있음 (`WikiArticle.categoryIds?: string[]` array) |
| `tag` | `notes.filter(n => n.tags.includes(refId))` + `wikiArticles.filter(w => w.tags.includes(refId))` | `note` + `wiki` | Cross-entity |
| `label` | `notes.filter(n => n.labelId === refId)` | `note` only | Plot label은 notes 전용 (label은 single per note: `Note.labelId: string \| null`) |
| `sticker` | `sticker.members.filter(m => m.kind === "note" \|\| m.kind === "wiki")` | `note` + `wiki` | 7-kind 중 2개만 추출 |

**즉**: Sticker가 7-kind cross-entity여도, Smart Book에 들어가는 건 그 중 note/wiki만. AutoSource는 공급 채널일 뿐, Book 멤버 type을 확장하지 않는다.

**Folder 멤버십 방향성**:
- Plot의 folder N:M은 `Note.folderIds`/`WikiArticle.folderIds`에서 forward, folder 자체는 멤버 배열을 보유하지 않음. resolver는 항상 reverse lookup (note/wiki를 sweep하며 folderIds에 source.refId가 들어있는지 검사).
- Folder는 trash 시스템 없음 (hard delete 전용). LOCKED #11에 반영.

**Multi-source dedup**:
- 같은 entity가 여러 source에 매칭될 수 있음 (예: 한 wiki가 여러 categoryIds에 속함, 한 note가 여러 folderIds + tag 양쪽에 매칭).
- Resolver는 `seenRefIds` set으로 dedup, 첫 source 우선 (LOCKED #4 OR semantics + LOCKED §9 dedup).

이 invariant는 Phase A부터 모든 구현에서 깨지면 안 된다.

---

## 3. LOCKED Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | INVARIANT (위 §2) | **AutoSource는 공급원, BookItem kind는 note/wiki/chapter-heading만** | 2-entity 철학 정합, source 확장이 type 확장 아님 |
| 2 | Smart-only vs Hybrid | **Hybrid** (smart auto-resolve + manual override) | 자유도, 사용자가 manual reorder/exclude 가능 |
| 3 | Source kind 우선순위 (MVP) | **Phase A: folder(kind="note")만**. category/tag/label/sticker/wiki-folder는 future phases | 작은 MVP, future-proof shape (`AutoSource.kind` union 미리 정의) |
| 4 | 여러 source semantics | **OR (union)** + per-source chapter heading | 사용자 직관 ("이거 + 저거 둘 다 합쳐서"), AND/NOT은 v2 |
| 5 | Order 정책 (auto items) | **Default: source 내부 `updatedAt desc`** | manual book과 일관, 최근 활동 우선 |
| 5b | Order 정책 (manual override) | **`fractional-indexing` position 고정** + auto resolver는 manual-positioned을 제외하고만 정렬 | Plot 패턴, manual book 인프라 재사용 |
| **5c** | **Manual vs auto placement (NEW v1.1)** | **Auto items는 항상 manual items 뒤에 배치** (manual = top, auto = bottom). Resolver는 마지막 manual order key를 추출 → 그 뒤에서 auto chapter heading + auto items의 fractional key 시퀀스 생성 | 사용자 직관 ("직접 추가한 게 위, 자동 채워진 게 아래"), manual reorder가 auto와 섞이지 않으므로 fractional key 충돌 회피, predictable layout |
| 6 | UI entry point | **Book 생성 dialog "Smart" 탭** + BookDetailPage Sources 섹션 | Single mental model — Smart는 Book의 한 모드, 별도 entity X |
| 7 | Schema migration | **store v120 → v121** (Book에 `smartSources?`, `excludeIds?` 추가, idempotent: `?? []`) | 기존 manual book 안전, 점진적 |
| 8 | Resolution 시점 | **Eager** (source 변경 시 즉시 re-resolve via React useMemo) | Plot reactivity 패턴 정합, derived state, cache 불필요 (resolver 빠름) |
| 9 | Manual override semantics | `excludeIds[]` = auto-resolved에서 제외할 entity id 목록. `items[]`에 manual reorder된 entity는 자동으로 fixed position (resolver가 manual-positioned을 auto에서 dedup) | 사용자 직관 ("이 노트만 빼기"), id 단위가 source 단위보다 자연스러움 |
| 10 | Empty source 처리 | source가 가리키는 entity가 0개면 **chapter heading만 표시** (사용자가 setup 진행 중일 수 있음). 빈 heading 자동 제거 X | 사용자 의도 보존, "곧 채울 예정" 상태 유지 |
| 11 | Source 삭제 시 처리 (UPDATED v1.1) | **Folder는 hard delete만** → cleanup hook이 즉시 트리거 (lazy resolve가 안전하지 않음, restore 경로 없음). **Tag/Label/Category/Sticker는 trash/restore 양쪽 모두 처리** (trashed 시 lazy resolve로 source가 무시되고, restore 시 자동 복구됨). Phase A는 resolver의 `if (!folder) continue` 가드만 — Phase F에서 entity별 cleanup hook 구현 | Folder는 hard delete 전용이므로 source orphan을 방치하면 영구 stale. 다른 entity는 trash 시스템이 있어 lazy detection으로 충분 |
| **12** | **Dedup guard at write time (NEW v1.1)** | `addSmartSource(bookId, source)` — 같은 `(kind, refId)` 조합이 이미 있으면 silent no-op (toast 권장). 이유: auto chapter-heading id가 `auto-heading-${source.refId}` 패턴이라 중복 source 시 React key 충돌 위험 | Self-review #7, write-time guard가 read-time crash보다 안전 |

---

## 4. Phase Breakdown (UPDATED v1.1)

| Phase | Scope | Time est | PR |
|-------|-------|----------|-----|
| **A. Data infra + folder source MVP** | Schema (`smartSources`, `excludeIds`) + folder resolver (kind="note" only) + UI Sources 섹션 + AddItemDialog Smart 탭 + BookItemRow source 시각 구분 + dedup guard + tests + migration | **~7-9h** (was 4-5h) | 1-2 |
| **B. Category source** | Wiki category resolver (`wikiArticles.filter(w => w.categoryIds?.includes(refId))`) — DAG 다중 부모 명시 | ~1-2h | 1 |
| **C. Tag source** | Cross-entity (notes + wiki tagged) | ~2h | 1 |
| **D. Label source** | Notes labeled (notes-only, `Note.labelId`) | ~1h | 1 |
| **E. Sticker source** | `sticker.members.filter(note/wiki)` — 7-kind cross-entity 처리 | ~2h | 1 |
| **F. Polish** | Source 삭제 cleanup hook (Folder hard delete + Tag/Label/Category/Sticker trash/restore), "Convert to manual" 버튼, UI refinement, edge cases | ~2-3h | 1 |

**MVP = Phase A** (folder kind="note"만, ~7-9h, 2-3 sessions). 나머지는 incremental 1 PR씩.

**Phase A 시간 재추정 근거 (v1.1)**:
- Resolver complexity: manual+auto fractional-indexing 충돌 회피 (LOCKED #5c), multi-source dedup, edge cases — 2-3h
- Store API + dedup guard + migration: 1h
- UI (SourcesSection, AddItemDialog Smart 탭, BookItemRow source 시각 구분, manual/auto remove 분기): 2-3h
- Tests (resolver pure function ~10 cases): 1h
- Wire-through + edge case 검증: 1h
- 합계 7-9h, 2-3 sessions이 현실적

**Phase B-E PRD revision 정책**:
- 각 phase는 별도 PRD revision 문서로 이관 (예: `.omc/plans/smart-book-phase-b-prd.md`).
- 본 PRD는 Phase A에 집중. Phase B-E는 §6 brief만 유지하되 데이터 모델 변경 사항 (예: `categoryIds` array)만 본 PRD INVARIANT에 반영.

---

## 5. Phase A Detail — Folder Source MVP

### 5.1 Files

| File | Action |
|------|--------|
| `lib/types.ts` | ADD `AutoSourceKind`, `AutoSource` types. EXTEND `Book` with `smartSources?: AutoSource[]`, `excludeIds?: string[]` |
| `lib/store/slices/books.ts` | ADD `setBookSmartSources(bookId, sources)`, `addExcludeId(bookId, id)`, `removeExcludeId(bookId, id)`, `addSmartSource(bookId, source)` (with dedup guard, LOCKED #12), `removeSmartSource(bookId, sourceIndex)` |
| `lib/store/migrate.ts` | v120 → v121 migration block (idempotent: `book.smartSources ??= []`, `book.excludeIds ??= []`) |
| `lib/store/index.ts` | Version bump 120 → 121 |
| `lib/books/resolver.ts` | **NEW**. Pure function `resolveBookItems(book, store): ResolvedBookItem[]`. Phase A: folder source (kind="note")만 처리 |
| `components/books/sources-section.tsx` | **NEW**. BookDetailPage 헤더 아래 Sources UI (folder picker, source 목록, source 삭제) |
| `components/books/book-detail-page.tsx` | EXTEND — SourcesSection 통합. 현재 `book.items` 직접 렌더 → `resolveBookItems(book, store)` 결과 렌더 |
| `components/books/add-item-dialog.tsx` | EXTEND — "Smart" 탭 추가 (현재 manual picker만). Smart 탭 = folder picker (Phase A) |
| `components/books/book-item-row.tsx` | EXTEND — `source: "manual" \| "auto"` 시각적 구분 (auto 아이템은 옅은 배경 + "auto from {folder}" 툴팁). remove 버튼 동작 분기 (manual → `removeItemFromBook`, auto → `addExcludeId`) |
| `lib/store/types.ts` | EXTEND `BooksSlice` interface with new methods |
| Tests: `lib/books/resolver.test.ts` | **NEW**. Pure function tests (input → output) |

### 5.2 Type Definitions

```typescript
// lib/types.ts

/**
 * AutoSource — Smart Book의 공급원 (Phase 5).
 *
 * Source는 "어디서 가져올지"이지 멤버 kind가 아니다.
 * 모든 source는 note/wiki만 filter해서 Book.items에 추가한다.
 *
 * Phase A: folder(kind="note")만 활성. 다른 kind는 future phases (B-E).
 */
export type AutoSourceKind = "folder" | "category" | "tag" | "label" | "sticker"

export interface AutoSource {
  kind: AutoSourceKind
  refId: string  // folder.id / category.id / tag.id / label.id / sticker.id
}

export interface Book {
  id: string
  title: string
  description?: string
  coverEmoji?: string | null
  color?: string | null
  items: BookItem[]
  createdAt: string
  updatedAt: string
  trashed?: boolean
  trashedAt?: string | null
  pinned?: boolean

  // ── Smart Book (Phase 5) ──
  smartSources?: AutoSource[]    // NEW: auto-resolve sources
  excludeIds?: string[]          // NEW: exclude these entity refIds from auto-resolved items
}
```

### 5.3 Resolver Pseudo-code (CORRECTED v1.1)

```typescript
// lib/books/resolver.ts
import { generateKeyBetween } from "fractional-indexing"
import type { Book, BookItem, Note, WikiArticle, Folder } from "@/lib/types"

/**
 * Resolved item — BookItem과 동일하지만 manual / auto 구분 메타데이터 추가.
 * UI는 이 메타로 시각 구분 + remove 동작 분기 (manual=removeItem, auto=addExclude).
 */
export type ResolvedBookItem = BookItem & {
  source: "manual" | "auto"
  sourceRefId?: string  // auto-resolved일 때 가리키는 source.refId (e.g. folder.id)
}

interface ResolverStore {
  notes: Note[]
  wikiArticles: WikiArticle[]
  folders: Folder[]
  // Phase B-E에서 추가: tags, labels, wikiCategories, stickers
}

export function resolveBookItems(
  book: Book,
  store: ResolverStore
): ResolvedBookItem[] {
  // ── 1. Manual items 그대로 (chapter-heading + manual-positioned note/wiki) ──
  // LOCKED #5c: manual = top, auto = bottom. manual items의 order key는 그대로 사용.
  const manualResolved: ResolvedBookItem[] =
    book.items.map(item => ({ ...item, source: "manual" as const }))

  // ── 2. Smart sources — Phase A: folder(kind="note")만 ──
  const manualNoteRefIds = new Set(
    book.items.filter(i => i.kind === "note").map(i => i.refId)
  )
  const manualWikiRefIds = new Set(
    book.items.filter(i => i.kind === "wiki").map(i => i.refId)
  )
  const excludeSet = new Set(book.excludeIds ?? [])
  const seenRefIds = new Set<string>()  // multi-source dedup (첫 source 우선)

  // LOCKED #5c: auto items는 manual items 뒤에 배치.
  // 마지막 manual order key를 추출해서 그 뒤에서 fractional key 시퀀스 시작.
  const sortedManualOrders = manualResolved
    .map(r => r.order)
    .sort()
  const lastManualOrder =
    sortedManualOrders.length > 0
      ? sortedManualOrders[sortedManualOrders.length - 1]
      : null
  let prevOrder: string = generateKeyBetween(lastManualOrder, null)

  const autoResolved: ResolvedBookItem[] = []

  for (const source of book.smartSources ?? []) {
    if (source.kind !== "folder") continue  // Phase A guard. B-E에서 분기 추가

    const folder = store.folders.find(f => f.id === source.refId)
    // LOCKED #11: Folder는 hard delete 전용이므로 trashed 검사 X.
    // folder가 사라졌으면 stale source — Phase F cleanup이 정리, 여기는 무시.
    if (!folder) continue
    // Phase A는 kind="note" folder만 지원. kind="wiki"는 Phase A.5+에서 결정.
    if (folder.kind !== "note") continue

    // Folder 멤버십 reverse lookup: Note.folderIds에서 source.refId 검색.
    // Folder.noteIds 필드는 존재하지 않음 (lib/types.ts 437-460).
    const memberNotes = store.notes
      .filter(n => n.folderIds.includes(source.refId) && !n.trashed)

    // exclude + manual-positioned 제거 + multi-source dedup
    const autoOnly = memberNotes.filter(n =>
      !excludeSet.has(n.id) &&
      !manualNoteRefIds.has(n.id) &&
      !seenRefIds.has(n.id)
    )

    autoOnly.forEach(n => seenRefIds.add(n.id))

    // updatedAt desc sort (LOCKED #5)
    autoOnly.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    // Auto-generated chapter heading (id pattern: `auto-heading-${refId}`)
    // LOCKED #12 보장: addSmartSource dedup guard로 같은 refId 중복 source 방지 → key 충돌 없음.
    autoResolved.push({
      kind: "chapter-heading",
      id: `auto-heading-${source.refId}`,
      title: folder.name,  // Folder 타입 필드명은 `name` (lib/types.ts:439)
      order: prevOrder,
      source: "auto",
      sourceRefId: source.refId,
    })

    for (const note of autoOnly) {
      prevOrder = generateKeyBetween(prevOrder, null)
      autoResolved.push({
        kind: "note",
        id: `auto-${source.refId}-${note.id}`,  // book-internal id (auto 식별)
        refId: note.id,
        order: prevOrder,
        source: "auto",
        sourceRefId: source.refId,
      })
    }

    // 다음 source의 chapter heading은 마지막 auto note 뒤에 옴
    prevOrder = generateKeyBetween(prevOrder, null)
  }

  // ── 3. Final sort by order (lexicographic) ──
  // manual + auto 합쳐서 정렬. 5c LOCKED 덕에 manual이 항상 앞에 옴.
  return [...manualResolved, ...autoResolved].sort((a, b) =>
    a.order < b.order ? -1 : a.order > b.order ? 1 : 0
  )
}
```

**핵심 변경점 (v1.1)**:
- **Folder reverse lookup**: `folder.noteIds.filter(...)` → `store.notes.filter(n => n.folderIds.includes(source.refId) && !n.trashed)` (lib/types.ts 437-460에 noteIds 필드 없음)
- **Folder hard delete only**: `if (!folder || folder.trashed) continue` → `if (!folder) continue` (Folder 타입에 trashed 필드 없음)
- **folder.kind 가드**: Phase A는 kind="note"만 지원하므로 명시적 가드 추가
- **Folder 필드명**: `folder.title` → `folder.name` (실제 필드명, lib/types.ts:439)
- **Auto items placement (LOCKED #5c)**: manual items의 last order key 뒤에서 시퀀스 시작 → manual = top, auto = bottom 구조 보장

### 5.4 Store API spec — addSmartSource dedup guard (NEW v1.1)

LOCKED #12 보장:

```typescript
// lib/store/slices/books.ts (의사코드)
addSmartSource: (bookId: string, source: AutoSource) => {
  set(state => ({
    books: state.books.map(b => {
      if (b.id !== bookId) return b
      const sources = b.smartSources ?? []
      // Dedup: 같은 (kind, refId)가 이미 있으면 silent no-op
      const exists = sources.some(s => s.kind === source.kind && s.refId === source.refId)
      if (exists) {
        // 호출 측에서 toast 표시 권장 ("Source already added")
        return b
      }
      return { ...b, smartSources: [...sources, source], updatedAt: new Date().toISOString() }
    }),
  }))
}
```

**왜 write-time guard가 필요한가**:
- Resolver는 auto chapter heading id를 `auto-heading-${source.refId}`로 생성.
- 같은 refId 중복 source가 들어오면 React key 충돌 발생 (두 chapter heading 같은 id).
- Read-time dedup도 가능하지만 write-time이 더 안전 + 사용자 의도 명확화 (중복은 의미 없음).

UI 호출 측 패턴:
```typescript
const ok = usePlotStore.getState().addSmartSource(bookId, source)
// addSmartSource는 void 반환이므로 필요시 자체적으로 toast 호출하도록 wrapper 추가 가능.
// MVP는 silent no-op + 사용자가 source 목록에 이미 있는 것 보고 알아채는 방식.
```

### 5.5 UI — SourcesSection

`components/books/sources-section.tsx` (Phase A):

```
┌─ Sources ─────────────────────────────┐
│ Folder: 📁 Project X         [×]      │
│ Folder: 📁 Reading List       [×]     │
│                                        │
│ [+ Add source ▾]                       │
└────────────────────────────────────────┘
```

- `+ Add source` 클릭 → dropdown: "Folder" (Phase A는 이것만 활성, 나머지는 disabled + "Coming soon" tooltip)
- Folder 선택 → folder picker dialog (kind="note" filter) → `addSmartSource(bookId, { kind: "folder", refId })`
- × 클릭 → `removeSmartSource(bookId, sourceIndex)`
- 이 섹션은 ViewHeader 아래, items list 위에 위치
- Dedup feedback: 사용자가 이미 추가된 folder를 다시 추가하려 하면 picker UI에서 그 folder를 disabled (또는 "Already added" badge)

### 5.6 UI — BookDetailPage 통합 (CORRECTED v1.1)

```typescript
// components/books/book-detail-page.tsx (의사코드)
import { usePlotStore } from "@/lib/store"

const book = usePlotStore(s => s.books.find(b => b.id === bookId))
const notes = usePlotStore(s => s.notes)
const wikiArticles = usePlotStore(s => s.wikiArticles)
const folders = usePlotStore(s => s.folders)

const resolvedItems = useMemo(
  () => book ? resolveBookItems(book, { notes, wikiArticles, folders }) : [],
  [book, notes, wikiArticles, folders]
)

// 기존 manual rendering 대신 resolvedItems 렌더
// BookItemRow에 `resolved.source` prop 전달
```

**v1.1 fix**: `useStoreSlice` → `usePlotStore` (Plot 표준 hook, `lib/store/index.ts:42`).

### 5.7 UI — BookItemRow (auto 시각 구분)

| Source | Visual | Remove 버튼 동작 |
|--------|--------|-----------------|
| `manual` | normal background, drag handle, ↑↓ button | `removeItemFromBook(bookId, itemId)` |
| `auto` | subtle background tint (e.g. `bg-muted/20`), "auto" badge or icon, drag handle disabled | `addExcludeId(bookId, refId)` (excludeIds에 추가 → resolver가 자동 제외) |

Drag/reorder UX:
- Auto item을 manual처럼 reorder하려면? → drag start 시 "Pin position?" 확인 → 확인하면 manual `book.items`에 promote 후 reorder. (Phase A는 보류, Phase F에서 결정)
- 단순 case (Phase A): auto item drag 비활성, manual item만 drag 가능. 사용자가 auto item을 fixed로 만들고 싶으면 "Pin to position" 버튼 (Phase F)

### 5.8 Edge Cases (UPDATED v1.1)

| Edge case | Behavior |
|-----------|----------|
| Folder hard delete | resolver `if (!folder) continue` 가드 — 그 source 자체가 자동 무시. smartSources entry는 stale로 남아있음 → Phase F cleanup hook이 정리 (Folder는 trash 시스템 없으므로 lazy detection으로는 영구 stale, Phase F에서 즉시 hook 트리거 필수, LOCKED #11) |
| 비-folder source의 entity가 trashed (Phase B-E 적용) | resolver의 trash 필터에서 자동 제외. source 자체는 보존 (entity restore 가능성 있으므로 lazy resolve가 안전) |
| Manual reorder된 노트가 같은 source에도 속함 | Manual position 보존 (manual-positioned에서 dedup, auto에 미포함) |
| 같은 노트가 여러 folder source 속함 | 첫 source의 chapter 아래 표시 (`seenRefIds` set으로 dedup, 첫 source 우선) |
| `excludeIds`에 추가된 노트가 source에서 제거됨 | excludeIds는 entity id 기준이므로 무관. 그 노트가 source에 다시 들어오면 여전히 excluded |
| 빈 folder | chapter heading만 표시 (LOCKED #10, "곧 채울 예정" 상태 유지) |
| Folder hard delete + smartSources orphan | resolver `if (!folder) continue` 안전 (런타임 crash 없음). Phase F cleanup hook이 즉시 source entry 제거 (Folder는 restore 경로 없으므로 lazy resolve보다 적극적 정리 필수) |
| Manual book + smart sources 동시 | `book.items` (manual) + `smartSources`로 가져온 auto items 둘 다 표시 (manual=top, auto=bottom by LOCKED #5c) |
| 같은 (kind, refId) source 중복 추가 시도 | LOCKED #12 dedup guard로 silent no-op. 토스트로 사용자에게 알림 권장 |
| WikiArticle이 여러 categoryId에 속함 (Phase B 미리 명시) | DAG 다중 부모. 첫 매칭 source의 chapter 아래 표시 (`seenRefIds` dedup) |

### 5.9 Resolver 시점 / Caching

**Eager (LOCKED #8)**:
- React `useMemo` with deps `[book, store.notes, store.wikiArticles, store.folders]`
- Cache 불필요 — resolver는 O(folders × notes) 정도, 빠름
- Re-render trigger: `smartSources` change, `excludeIds` change, `store.notes` change, `store.folders` change, `book.items` change

**Cache 추가 시점**: 측정 후 hot path면 Phase F에서 zustand selector + memo. MVP는 useMemo로 충분.

### 5.10 Schema Migration (v120 → v121)

```typescript
// lib/store/migrate.ts (v121 block)
if (version < 121) {
  state.books = state.books.map(book => ({
    ...book,
    smartSources: book.smartSources ?? [],
    excludeIds: book.excludeIds ?? [],
  }))
  version = 121
}
```

Idempotent — 이미 있으면 그대로 보존, 없으면 빈 배열 초기화. 기존 manual book은 변화 없음.

### 5.11 Verification (Phase A) (UPDATED v1.1)

| Scenario | Expected |
|----------|----------|
| Folder(kind="note")에 노트 5개 → smartSource 추가 | 책에 5개 노트 + chapter heading "{folder.name}" 1개, total 6 items, manual items 뒤에 배치 (LOCKED #5c) |
| 1개 노트 manual reorder (drag → fixed position) | 그 노트는 manual position (top section), 나머지 4개는 auto-section, heading 그대로 |
| 1개 노트 excludeId 추가 | 4개만 auto-section, 1개는 보이지 않음. excludeIds 제거하면 다시 표시 |
| Folder에 노트 추가 (다른 곳에서) | 즉시 책에 추가됨 (eager re-resolve via React) |
| Folder hard delete | 그 source가 자동 무시 (heading 사라짐, 노트들 사라짐). smartSources entry는 stale로 남음 → Phase F cleanup이 정리. resolver는 `if (!folder) continue`로 런타임 안전 |
| Folder cascade (deleteFolder 후) | `Note.folderIds`에서 해당 folderId 제거됨 (folders slice 자체 cascade). resolver는 folder 자체 부재로 source 무시 — double safety |
| Manual book + smart source 동시 | Manual items가 위, auto items가 아래에 표시 (LOCKED #5c). manual은 자유 reorder, auto는 readonly |
| 두 folder source (같은 노트가 양쪽) | 첫 source heading 아래만 표시 (dedup), 두 번째는 heading만 |
| Empty folder source | chapter heading만 표시, 빈 책처럼 보임 |
| 같은 (kind, refId) 중복 추가 시도 | `addSmartSource` silent no-op (LOCKED #12). React key 충돌 없음 |
| 같은 책 reload | smartSources, excludeIds persist (IDB v121) |
| `npm run test` | resolver pure function tests pass (~10 cases including dedup, manual placement, hard delete safety) |
| `npx tsc --noEmit` | clean |
| `npm run build` | pass |

---

## 6. Phase B-F (브리핑)

각 phase는 Phase A 완료 + critic review 후 **별도 PRD revision 문서**로 detail 이관 (예: `.omc/plans/smart-book-phase-b-prd.md`). 본 PRD는 Phase A에 집중.

### Phase B — Category source (~1-2h)
- `AutoSource.kind === "category"` 분기 추가
- **Resolver (CORRECTED v1.1)**: `wikiArticles.filter(w => w.categoryIds?.includes(source.refId) && !w.trashed)` → wiki only.
  - **DAG 다중 부모**: `WikiArticle.categoryIds?: string[]` (배열, lib/types.ts:330). 한 wiki가 여러 category에 동시 속할 수 있음.
  - 이전 v1.0 가정 (`wikiArticles.filter(a => a.categoryId === refId)` scalar) 폐기.
- Multi-source dedup: 한 wiki가 여러 categoryIds에 속하면 첫 매칭 category source의 chapter 아래 표시 (`seenRefIds` dedup, 첫 source 우선).
- Heading: `📚 {category.title}` (또는 category color/icon)
- New store dep: `wikiArticles`, `wikiCategories`

### Phase C — Tag source (~2h)
- `AutoSource.kind === "tag"` — cross-entity (note + wiki 둘 다)
- `notes.filter(n => n.tags.includes(refId) && !n.trashed)` + `wikiArticles.filter(w => w.tags.includes(refId))`
- Order: notes/wiki 합쳐서 `updatedAt desc` (mixed sort)
- Heading: `# {tag.title}` + tag color hint
- New store dep: `tags`

### Phase D — Label source (~1h)
- `AutoSource.kind === "label"` — notes only (Plot label은 notes 전용, `Note.labelId: string \| null`)
- `notes.filter(n => n.labelId === source.refId && !n.trashed)` (label은 single per note)
- Heading: `● {label.title}` + label color
- New store dep: `labels`

### Phase E — Sticker source (~2h)
- `AutoSource.kind === "sticker"` — 7-kind cross-entity 처리
- `sticker.members.filter(m => m.kind === "note" || m.kind === "wiki")` → 그 중 trashed 제외 (note는 `.trashed` 필드 사용, wiki는 별도 trashed 필드 검증 필요)
- INVARIANT 검증: sticker가 7-kind여도 Book에는 note/wiki만 들어감 (file/reference/sticker/category/folder는 무시)
- Heading: `🏷️ {sticker.title}`
- New store dep: `stickers`

### Phase F — Polish (~2-3h, UPDATED v1.1)
- **Source 삭제 cleanup hook (entity별 분기)**:
  - **Folder**: hard delete 전용 → `deleteFolder` 호출 시 즉시 모든 book의 `smartSources`에서 `kind="folder"` + `refId === folderId` 제거 (LOCKED #11). zustand middleware / store subscription으로 구현. 이유: lazy resolve로 두면 영구 stale (restore 경로 없음).
  - **Tag/Label/Category/Sticker**: trash/restore 양쪽 처리. trashed 시 source는 보존 (lazy detection으로 resolver가 무시), 영구 삭제 시 hook으로 cleanup. Restore 시 자동 복구.
- **"Convert to manual" 버튼** (Sources 섹션): smart sources 모두 제거 + auto items를 manual `book.items`로 promote (각자 fractional-indexing key 부여, source / sourceRefId 메타 제거)
- **"Pin to position" 버튼** (auto BookItemRow): 단일 auto item을 manual `book.items`로 promote (특정 위치 고정)
- **Refresh 버튼**: 보류 (eager resolution이라 의미 없음. 사용자 신뢰 위해 visual feedback만 추가할 수도)
- Edge case 정리: multi-source가 같은 entity 가진 케이스, 빈 source, source 순서 변경

---

## 7. Cross-Cutting

### Color / Icon
- Books burgundy `#be123c` 그대로 (parent PRD §10)
- Auto chapter heading icon: source kind에 따라
  - folder → `📁` 또는 folder icon component
  - category → wiki category icon
  - tag → `#`
  - label → `●` + label color
  - sticker → `🏷️`
- Heading은 manual chapter-heading과 동일 스타일이지만 작은 "auto" badge로 구분

### Migration
- v120 → v121 (idempotent, `book.smartSources ??= []`, `book.excludeIds ??= []`)
- 기존 manual book 영향 없음

### Tests
- `lib/books/resolver.test.ts` — pure function tests (Phase A): 단일 folder, multi-folder, manual override, exclude, empty folder, hard-delete folder, dedup, manual+auto placement (LOCKED #5c), `(kind, refId)` 중복 source dedup guard
- Phase B-E: 각 source kind별 resolver test 추가
- Phase F: cleanup hook integration test (Folder hard delete → smartSources 즉시 제거; Tag trash → source 무시 + restore → 복구)

### Docs
- `docs/MEMORY.md`: Smart Book Phase 5 진행 상태 섹션 추가, phase별 완료 표시
- `docs/CONTEXT.md`: "Smart Book = AutoSource resolver" 한 줄 + LOCKED 12개 요약 link

### Side panel integration
- 노트 detail panel "In Books" 섹션이 manual 멤버십만 표시 → smart 멤버십도 포함 (resolver 거꾸로: "이 노트가 어느 smart book에 속하는가" lookup)
- v2 고려, Phase A는 manual만

### Saved view interaction
- Smart Book ≠ Saved View지만, BookDetailPage에 "Save as view" 버튼 추가 가능 (v2)
- MVP에서는 Smart Book이 Saved View의 superset임을 사용자가 자연스럽게 학습

---

## 8. Verification (전체)

| Phase | Gate |
|-------|------|
| A | All §5.11 scenarios pass + tsc + build + resolver tests |
| B-E | Each phase: source kind 작동 + tsc + build + new test |
| F | Cleanup hook 작동 (Folder hard delete → smartSources 즉시 제거; Tag/Label/Category/Sticker trash/restore lazy resolve) + tsc + build |

각 phase 공통:
- `npx tsc --noEmit` clean
- `npm run build` pass
- 25+ existing books-slice tests still pass
- New resolver tests pass
- Architect verification before merge

---

## 9. Open Questions (with cross-links to §5)

| # | Question | Cross-link | Notes |
|---|----------|-----------|-------|
| 1 | "Convert to manual" 버튼이 v1에 필요한가? | §6 Phase F | Phase F에서 사용자 피드백 후 결정. Phase A에는 없음 |
| 2 | Resolver를 zustand selector로 vs React useMemo로 | §5.9 | MVP는 useMemo (Plot 패턴 정합). Phase F에서 hot path면 selector로 |
| 3 | Chapter heading 사용자 edit 가능? | §5.3 (heading id 패턴) | Phase A: read-only (auto-generated). User rename은 v2. 만약 rename 허용하면 source.title과 heading.title 분리 필요 |
| 4 | Multi-source가 같은 entity 가진 경우 처리 | §5.3 (`seenRefIds` dedup), §5.8 edge cases | Phase A: 첫 source 우선 (`seenRefIds` dedup). 사용자 컨트롤 (어느 source 우선) v2 |
| 5 | Tag/Label color theme를 chapter heading에 표시? | §6 Phase C/D, §7 Color/Icon | Phase D-C: gentle hint (heading 옆 color dot). v1.5 |
| 6 | Smart Book 안의 manual chapter-heading을 사용자가 추가 가능? | §5.3, §5.7 BookItemRow | Phase A: 가능 (book.items에 chapter-heading 직접 push, manual block). Auto heading과 manual heading 동시 가능. LOCKED #5c로 manual heading은 top section, auto heading은 bottom section에 배치 |
| 7 | Source `OR` 외에 `AND`/`NOT` semantics | §3 LOCKED #4, §10 | LOCKED #4 참고 — v2. 사용자 요청 빈도 보고 결정 |
| 8 | excludeIds 한계 (10000 노트면?) | §5.3 (`excludeSet`) | Phase A: 평범 사용 가정. Performance 측정 후 Phase F에서 최적화 |
| 9 | Sticker가 trashed → smartSources에서 제거 — Sticker는 7-kind라 다른 sticker source도 영향? | §6 Phase E, §6 Phase F cleanup | Phase F cleanup hook 설계 시 명확히. Sticker.id 기반이므로 1:1 매칭 |
| 10 | "In Books" reverse lookup이 smart 멤버십 포함 | §7 Side panel integration | v2 — 노트의 detail panel에서 "이 노트가 어느 smart book에 자동으로 들어감"을 보여줄지 |
| 11 (NEW v1.1) | Folder kind="wiki" source 지원 시점 | §3 LOCKED #3, §6 (no phase yet) | Phase A는 kind="note" folder만. kind="wiki" folder source는 Phase A.5 또는 Phase B에 통합 결정 필요 (resolver에서 folder.kind 분기 추가하면 minimal cost) |
| 12 (NEW v1.1) | Reference / file source 지원 검토 | §10 Out of Scope | AutoSourceKind union이 5개로 fixed. Reference/file은 v2+에서 별도 evaluation 후 결정 |

---

## 10. Out of Scope (this PRD)

- AND / NOT source semantics (v2)
- Source filter ("folder + tag X 둘 다 있는 것만") (v2)
- Smart Book 안에 Smart Book 중첩
- Auto chapter heading rename / 사용자 정의 (v2)
- "In Books" reverse lookup smart membership 포함 (v2)
- Smart Book template / preset ("내 모든 inbox 노트", "최근 7일 위키" 등) (v2)
- AND/NOT/XOR boolean logic UI
- Source weighting (folder A 우선, folder B 후순위)
- Source 내 sub-filter (sticker source인데 그 중 특정 kind만)
- **Reference source / File source (NEW v1.1)** — 현 AutoSourceKind union은 folder/category/tag/label/sticker 5개로 fixed. Reference (인용 raw entity) / File (binary attachment) source는 사용 케이스 모호. Phase X+: 별도 evaluation 후 결정. 추가 시 INVARIANT (note/wiki only) 유지 가능 여부 검증 필요 (예: file은 BookItem kind에 들어갈 수 없음 → INVARIANT 위반).

---

## 11. Acceptance Criteria (Phase A MVP)

- [ ] User can create a Book and add `kind: "folder"` smart source (folder.kind="note"만 picker에서 활성)
- [ ] Book auto-displays all live notes from that folder + auto chapter heading
- [ ] Items sorted by `updatedAt desc` within each source
- [ ] Manual items가 항상 top, auto items가 항상 bottom (LOCKED #5c)
- [ ] User can manual-reorder a single item → that item gets fixed position (manual top section), rest auto-flow (bottom section)
- [ ] User can exclude a single auto-resolved item (× button on auto row → addExcludeId)
- [ ] Excluded item disappears from book; clearing excludeIds restores it
- [ ] Folder hard delete → that source disappears from book (resolver guards), smartSources entry stale until Phase F cleanup
- [ ] Multi-source (folder A + folder B): per-source chapter heading, dedup if same note in both (첫 source 우선)
- [ ] Empty folder → chapter heading only
- [ ] Manual book items + smart sources can coexist (hybrid)
- [ ] 같은 (kind, refId) 중복 source 추가 → silent no-op (LOCKED #12 dedup guard)
- [ ] Store v121 migration idempotent (existing manual books unchanged)
- [ ] `npx tsc --noEmit` clean + `npm run build` pass + tests pass (resolver pure function ~10 cases)
- [ ] Architect verification

---

## 12. References

- Memory: `docs/MEMORY.md` — 2026-05-09 마라톤 (Book entity Phase 1-4 완료, store v120)
- Parent PRD: `.omc/plans/book-entity-prd.md` v1.1 LOCKED
- 2026-05-03 Smart Book sketch decision (33-design-decisions §1)
- Sticker 7-kind cross-entity: `docs/MEMORY.md` Sticker section
- Folder N:M reverse pattern: `lib/types.ts` Folder (437-460) + Note.folderIds (390) + WikiArticle.folderIds (336) + `lib/store/slices/folders.ts` (deleteFolder 54-82, hard delete + cascade)
- WikiArticle DAG categoryIds: `lib/types.ts` WikiArticle (318-354, line 330)
- fractional-indexing 패턴: parent PRD §158-186, `lib/store/slices/books.ts`
- Plot reactivity 패턴: `lib/store/index.ts` (zustand + persist + IDB, `usePlotStore` line 42)

---

## Appendix A — v1.0 → v1.1 fix manifest

| # | Fix | Severity | Locations |
|---|-----|----------|-----------|
| 1 | Folder reverse N:M (`Note.folderIds.includes(refId)`) | BLOCKING | §1 Overview, §2 INVARIANT, §5.3 resolver, §5.8 edge cases, §5.11 verification, §12 references |
| 2 | WikiArticle.categoryIds DAG array | BLOCKING | §2 INVARIANT, §6 Phase B, §5.8 edge cases |
| 3 | Folder hard delete only (no trashed field) | BLOCKING | §1 Overview, §3 LOCKED #11, §5.3 resolver, §5.8 edge cases, §5.11 verification, §6 Phase F |
| 4 | Phase A time est 4-5h → 7-9h | RECOMMENDED | §4 Phase Breakdown |
| 5 | `useStoreSlice` → `usePlotStore` | RECOMMENDED | §5.6 BookDetailPage 통합 |
| 6 | `addSmartSource` dedup guard spec | RECOMMENDED | §3 LOCKED #12, §5.4 Store API spec |
| 7 | Manual=top / auto=bottom placement LOCKED #5c | RECOMMENDED | §3 LOCKED #5c, §5.3 resolver, §5.11 verification, §11 acceptance |
| 8 | Reference/file source out-of-scope | RECOMMENDED | §10 Out of Scope, §9 Open Q #12 |
| 9 | §9 Open Questions cross-link to §5 | RECOMMENDED | §9 entire table (added "Cross-link" column) |
| 10 | INVARIANT — Folder는 kind 따라 note/wiki source 명시 | RECOMMENDED | §2 INVARIANT (folder row split into kind="note" / kind="wiki") |
