# Books view-engine 풀 통합 — 4 PR 점진 시리즈

> Books entity를 view-engine + ViewHeader + PropertyChip + 통일 viewMode 패턴으로 정렬. 본보기 = Group C PR-D (Tags/Labels/Stickers/References/Files 5 entity 시리즈, `group-c-prd-view-engine-integration.md`).

---

## 0. Plan 메타데이터

- **상태**: Approved (사용자 4가지 결정 받음, 2026-05-12)
- **현재 store version**: v122 (Dual mode 폐기 migration 적용 후)
- **본 PR 시리즈 store version 진화**: v123 → v124 → v125 → v126
- **본보기 PR**: Group C PR-D 시리즈 (#249 template-c, #251 PR e, #258 v108) + Smart Book Phase A (PR #290, #291)
- **본보기 plan**: `.omc/plans/group-c-prd-view-engine-integration.md`
- **Plot 정체성**: "Gentle by default, powerful when needed"
- **작업 원칙**: 정확도 + 버그 위험 최소화 (영구)

---

## 1. Context

### 1.1 Original Request

> Books entity view-engine 풀 통합. 현재 BooksGrid (414줄, `components/views/books-view.tsx`)는 직접 store 사용, viewMode 무조건 grid, sort 무조건 `updatedAt desc`. Notes/Wiki/Tags/Labels/Stickers/References/Files 7개 entity가 view-engine 통합된 상태에서 Books만 누락. 사용자 brainstorm: filter (컨텐츠 타입/Smart vs Manual/Pinned) + sort + group + view modes (grid/list/gallery/board).

### 1.2 사용자 영구 결정 (2026-05-12, AskUserQuestion 응답)

| 결정 | 값 | 근거 |
|---|---|---|
| **PR 분할** | C — 점진 4 PR | 작업 원칙 #2 최소 diff + 매 단계 visual confirm 가능 |
| **viewMode default** | grid 유지 | cover emoji 활용 강함 + 기존 사용자 reload 시 변화 0 |
| **default sort** | `updatedAt desc` 유지 | 현재 동작 보존 + 기존 사용자 영향 0 |
| **default groupBy** | `none` | 1차 보수. groupBy 옵션은 ViewHeader에 노출하되 default는 flat |

### 1.3 사전 조사 검증 결과 (코드 직접 확인)

| 측면 | 현재 상태 | 본 plan 적용 |
|---|---|---|
| `lib/view-engine/use-books-view.ts` | ❌ 없음 | 신규 작성 (use-templates-view 패턴) |
| `lib/view-engine/types.ts` ViewContextKey | `"books"` 없음 | PR 1에서 추가 |
| `lib/view-engine/types.ts` SortField | `"itemCount"` 없음 | PR 2에서 추가 |
| `lib/view-engine/types.ts` GroupBy | `"kind"`, `"pinned"` 없음 | PR 3에서 추가 |
| `lib/view-engine/types.ts` FilterField | `"kind"`, `"sourceType"` 없음 | PR 2에서 추가 (pinned는 이미 있음) |
| `lib/view-engine/types.ts` VALID_VIEW_MODES | `["list", "board", "grid", "insights", "calendar", "graph", "gallery"]` | OK — books는 list/board/grid/gallery 사용 |
| `components/views/books-view.tsx` | 직접 store, 로컬 state | thin fork hook 전환 |

### 1.4 Plot 영구 결정 (이 plan이 위반할 수 없음)

| 결정 | 근거 | 본 plan 적용 |
|---|---|---|
| **thin fork 패턴** | Group C PR-D § 1.3 "Generic 화는 scope 폭발 영구 거부" | `useBooksView` thin fork (`use-templates-view` 패턴) |
| **Smart Book INVARIANT** | `.omc/plans/smart-book-prd.md` § 2 — Book.items kind = note/wiki/chapter-heading만, AutoSource는 공급원 (멤버 kind 아님) | view-engine 통합은 Book entity list view만 변경. resolver/BookDetailPage/SourcesSection 동작 변화 0 |
| **마이그레이션 옵션 A** | v109 패턴 영구 | viewStateByContext.books 기본값 주입 idempotent. 기존 사용자 데이터 보존 |
| **단일 클릭 = 풀 에디터** | 2026-05-11 결정 | Books 카드 클릭 → `/books/{id}` 진입 (현재 동작 보존) |
| **갤러리 entity-agnostic** | 2026-05-11 결정 | Books도 GalleryItem adapter로 통합 (Notes/Wiki/References 패턴) |
| **PR 분리 원칙** | 작업 원칙 #6 | UI + 데이터 모델 분리. entity 본질 단위로 묶음 |
| **PropertyChip 패턴** | PR e (#251) 12개 chip 패턴 | ChipShell + h-5 + text-2xs + getEntityColor + maxVisible=3 |

### 1.5 Research Findings

- **`lib/view-engine/types.ts`**: ViewContextKey union + ViewMode union ("list/board/grid/insights/calendar/graph/dashboard/gallery") + VALID_* arrays
- **`lib/view-engine/defaults.ts`**: `CONTEXT_DEFAULTS` 맵 + `buildDefaultViewStates()` 마이그레이션 진입점
- **`lib/view-engine/use-templates-view.ts`** (263줄, 본보기): "Scope guard" 헤더 주석
- **`lib/types.ts`**: Book 구조 — `{ id, title, description?, coverEmoji?, items: BookItem[], smartSources: AutoSource[], excludeIds: string[], pinned?, trashed?, trashedAt?, createdAt, updatedAt }`. BookItem kind = `"note" | "wiki" | "chapter-heading"`. AutoSource = `{ id, type: "folder" | "category" | "tag" | "label" | "sticker", targetId, addedAt }`
- **`components/views/books-view.tsx`**: BooksView wrapper (route detail 분기) + BooksGrid (이 plan 작업 대상)
- **`components/views/book-detail-page.tsx`**: 단일 책 detail (작업 대상 X)
- **`components/property-chips.tsx`**: ChipShell + 12개 chip 패턴 (PR e)
- **`components/view-header.tsx`**: showSort / showGroup / showFilter / showViewMode / showSearch prop

---

## 2. Work Objectives

### 2.1 Core Objective

Books entity의 list view를 Group C PR-D 시리즈와 동일한 수준의 일관성으로 끌어올린다 — view-engine 통합, ViewHeader 활용, viewState persist, PropertyChip, entity 본질에 맞는 viewMode (grid/list/board/gallery).

### 2.2 Deliverables

1. `useBooksView` thin fork hook
2. ViewHeader에 search/sort/group/filter/viewMode prop 모두 노출
3. 신규 PropertyChip 3개 (`BookItemCountChip`, `BookKindChip`, `BookSourceKindChip` mini-bar)
4. ViewContextKey `"books"` 등록 + CONTEXT_DEFAULTS 기본값
5. 신규 SortField (`itemCount`), GroupBy (`kind`, `pinned`), FilterField (`kind`, `sourceType`)
6. 4 viewMode 지원 (grid/list/board/gallery) — 점진 PR
7. 마이그레이션 v123→v124→v125→v126 (모두 idempotent)
8. Smart Book INVARIANT 보존 (resolver/BookDetailPage 변화 0)

### 2.3 Definition of Done

- Books 카드 리스트가 ViewHeader + viewState persist + 4 viewMode 지원
- 직접 store 패턴 사라지고 `useBooksView` 사용
- PropertyChip 적용된 카드 (grid/list/board 모두 동일 시각 무게)
- viewState 페이지 reload 후 보존
- `npm run build` 0 errors + `tsc --noEmit` 0 errors
- 기존 사용자 데이터 손실 0 (idempotent 마이그레이션)
- 각 PR squash merge 가능
- Architect verification 통과 (매 PR)

---

## 3. Must Have / Must NOT Have

### 3.1 Must Have

- [x] thin fork hook (`useBooksView`) — generic 추출 X
- [x] 사용자 결정 4가지 영구 반영 (PR 분할 C / grid default / updatedAt desc / groupBy none)
- [x] Smart Book INVARIANT 보존 (resolver/BookDetailPage 동작 변화 0)
- [x] 갤러리는 entity-agnostic adapter 패턴 (2026-05-11 결정)
- [x] 단일 클릭 = 풀 에디터 (Plot 표준)
- [x] PropertyChip은 PR e 12개 패턴 따라 추가 (ChipShell, h-5, text-2xs)
- [x] 마이그레이션 idempotent (옵션 A)
- [x] 빌드/타입 검증 의무 (매 PR)

### 3.2 Must NOT Have

- [ ] **Generic `useEntityView<T>` hook 추출** — 영구 거부
- [ ] **BookDetailPage 변경** — book entity list view만 범위
- [ ] **Smart resolver 변경** — INVARIANT 위배
- [ ] **AutoSource 데이터 모델 변경** — 본 plan 범위 외
- [ ] **/books 라우트 변경** — 영구 결정 보존
- [ ] **4 viewMode 한 PR로 동시 도입** — 작업 원칙 #2 위반 (사용자 결정 C)
- [ ] **viewMode default 변경 (grid → list)** — 사용자 결정
- [ ] **default sort 변경 (updatedAt → pinned 우선)** — 사용자 결정
- [ ] **default groupBy 변경 (none → kind)** — 사용자 결정
- [ ] **사이드바 진입점 변경** — Books는 7번째 space, 이미 정착 (PR #289)

---

## 4. PR 로드맵 (4 PR 점진)

```
PR 1: 인프라 + grid 보존 [S+M, ~250 LOC, 시각 변경 0]
   ↓
PR 2: List mode + sort/group/filter UI [M, ~350 LOC]
   ↓
PR 3: Board mode + groupBy kind/pinned [M, ~250 LOC]
   ↓
PR 4: Gallery mode (entity-agnostic adapter) [S, ~150 LOC]
```

### PR 1: `books-view-engine-1` 인프라 + grid 보존 (~2h)

- **Goal**: view-engine pipeline 통합. 시각 변경 0 (현재 grid 그대로). 리뷰 안전성 ↑
- **변경 파일**:
  - `lib/view-engine/types.ts` — `"books"` ViewContextKey + VALID_VIEW_CONTEXT_KEYS 추가
  - `lib/view-engine/defaults.ts` — `"books"` CONTEXT_DEFAULTS (viewMode: "grid", sort: updatedAt desc, groupBy: none, visibleColumns: ["title", "itemCount", "updatedAt"])
  - `lib/view-engine/use-books-view.ts` — **신규** thin fork (filter/search/sort/group/viewMode). header 주석 "Scope guard"
  - `components/views/books-view.tsx` — BooksGrid가 `useBooksView()` 호출. 로컬 sort + filter state 제거. viewState reload 보존
  - `lib/store/index.ts` (또는 migration 파일) — v122 → v123. `viewStateByContext.books` 기본값 주입 idempotent
- **viewMode**: grid만 사용 (사용자 결정). list/board/gallery는 후속 PR
- **카드**: 변경 없음 (현재 JSX 보존)
- **마이그레이션**: idempotent (있으면 skip)
- **로드 LOC 추정**: +280 / -40

### PR 2: `books-view-engine-2` List mode + sort/group/filter UI (~2.5h)

- **Goal**: list 모드 도입 + ViewHeader showSort/showGroup/showFilter/showViewMode prop 활성화 + PropertyChip 3개 신규
- **변경 파일**:
  - `lib/view-engine/types.ts` — SortField `itemCount` 추가. FilterField `kind`, `sourceType` 추가. VALID_SORT_FIELDS 갱신
  - `lib/view-engine/use-books-view.ts` — sort/filter 분기 확장 (itemCount, kind, sourceType, pinned)
  - `lib/view-engine/defaults.ts` — books visibleColumns 확장 ("title", "itemCount", "kind", "updatedAt")
  - `components/views/books-view.tsx` — ViewHeader props 활성화. viewMode toggle (grid + list). list mode 렌더
  - `components/books/book-list-row.tsx` — **신규** list row 컴포넌트 (cover + title + BookKindChip + BookItemCountChip + TimestampChip + Pin)
  - `components/property-chips.tsx` — **신규** 3개: BookItemCountChip / BookKindChip / BookSourceKindChip mini-bar
- **마이그레이션**: v123 → v124. 신규 SortField/FilterField 값 등록만. viewStateByContext 변경 X (사용자 viewState는 그대로 보존)
- **로드 LOC 추정**: +400 / -50

### PR 3: `books-view-engine-3` Board mode (~2h)

- **Goal**: board 모드 도입. groupBy `kind` (Smart/Manual/Hybrid) 또는 `pinned`
- **변경 파일**:
  - `lib/view-engine/types.ts` — GroupBy `kind`, `pinned` 추가. VALID_GROUP_BY 갱신
  - `lib/view-engine/use-books-view.ts` — group 분기 확장
  - `lib/view-engine/group.ts` — kind/pinned 그룹 컬럼 정의 (또는 books 전용 fork)
  - `components/views/books-view.tsx` — viewMode toggle (grid + list + board)
  - `components/books/books-board.tsx` — **신규** board 컴포넌트 (NotesBoard 패턴 참조)
- **마이그레이션**: v124 → v125. 신규 GroupBy 값 등록.
- **viewMode 추천**: NotesBoard처럼 column drag/reorder 없음 (1차). kind는 3 column 고정 (Smart/Manual/Hybrid), pinned는 2 column 고정 (Pinned/Others)
- **로드 LOC 추정**: +300 / -30

### PR 4: `books-view-engine-4` Gallery mode (~1h)

- **Goal**: gallery 모드 도입. 2026-05-11 entity-agnostic generic 활용
- **변경 파일**:
  - `components/books/books-gallery-adapter.tsx` — **신규** Book → GalleryItem 변환 adapter
  - `components/views/books-view.tsx` — viewMode toggle (grid + list + board + gallery). gallery 분기에 GalleryView 마운트
  - `lib/view-engine/defaults.ts` — books supportedModes에 `"gallery"` 추가 (이미 있는 view-config interface면 1줄)
- **마이그레이션**: v125 → v126. supportedModes 정합성만.
- **로드 LOC 추정**: +180 / -20

---

## 5. ViewMode 결정 행렬 (Books 본질)

| Mode | 적용 PR | 본질 적합도 | 근거 |
|---|---|---|---|
| **grid** (default) | PR 1 | 5/5 | cover emoji + 시각 정체성. 현재 default 보존 |
| **list** | PR 2 | 5/5 | 다축 sort/filter 활용. 정보 밀집. Notes/Wiki 일관 |
| **board** | PR 3 | 4/5 | groupBy `kind` (Smart/Manual/Hybrid) 자연. binary attribute 적합 |
| **gallery** | PR 4 | 4/5 | entity-agnostic 패턴. cover emoji + description → 카드 |
| ~~insights~~ | - | 2/5 | 분석 페이지 — Books에 적합하지 않음 (스킵) |
| ~~calendar~~ | - | 1/5 | 일정 entity 아님 (스킵) |
| ~~graph~~ | - | 2/5 | Books는 그래프 노드 아님 (스킵) |

---

## 6. PropertyChip 적용 행렬

| Chip | 데이터 | 적용 viewMode | PR | 비고 |
|---|---|---|---|---|
| cover (chip 아님) | Book.coverEmoji 또는 Books icon | grid/list/board/gallery | PR1 (보존) | 카드 본체 |
| **BookItemCountChip** (신규) | Book.items.length (resolved 포함) | grid/list/board | PR 2 | icon: List, value: count. TagNoteCountChip 패턴 |
| **BookKindChip** (신규) | "Smart" / "Manual" / "Hybrid" | list/board | PR 2 | smartSources.length > 0 && items.length > 0 = Hybrid. 색 옵션 |
| **BookSourceKindChip** mini-bar (신규) | unique smartSources types | list (옵션) | PR 2 | StickerKindChip 패턴. icon만, 다중 |
| Pinned PushPin | Book.pinned | 모든 mode | PR1 (보존) | absolute 위치 (chip 아님) |
| TimestampChip | Book.updatedAt | list/board | PR 2 | 이미 shortRelative 사용 중 — chip으로 통일 |

**hard cap**: maxVisible=3 + "+N more" (PR e 패턴). cover/Pinned는 cap 외.

---

## 7. ViewContextKey + CONTEXT_DEFAULTS 변경

### PR 1 (인프라)

```ts
// lib/view-engine/types.ts
export type ViewContextKey =
  | "all" | "pinned" | "stone" | "brick" | "keystone"
  | /* ... */
  | "files"
  | "books"  // ← 신규 (PR 1)
  | `query-${string}`

export const VALID_VIEW_CONTEXT_KEYS: ViewContextKey[] = [
  // ...,
  "files",
  "books",  // ← 추가
]

// lib/view-engine/defaults.ts
"books": {
  viewMode: "grid",
  sortFields: [{ field: "updatedAt", direction: "desc" }],
  sortField: "updatedAt",
  sortDirection: "desc",
  groupBy: "none",
  subGroupBy: "none",
  filters: [],
  visibleColumns: ["title", "itemCount", "updatedAt"],
  showEmptyGroups: false,
  toggles: { showTrashed: false },
  groupOrder: null,
  subGroupOrder: null,
  subGroupSortBy: "default",
}
```

### PR 2 (List + sort/filter)

```ts
// lib/view-engine/types.ts
export type SortField =
  | /* 기존 */
  | "itemCount"  // ← 신규 (Books)

export type FilterField =
  | /* 기존 */
  | "kind"        // Smart / Manual / Hybrid (Books)
  | "sourceType"  // folder / category / tag / label / sticker (Books smart sources)

export const VALID_SORT_FIELDS: SortField[] = [
  // ...,
  "itemCount",
]

// lib/view-engine/defaults.ts books visibleColumns 확장
visibleColumns: ["title", "itemCount", "kind", "updatedAt"]
```

### PR 3 (Board)

```ts
// lib/view-engine/types.ts
export type GroupBy =
  | /* 기존 */
  | "kind"     // Books: Smart / Manual / Hybrid (또는 다른 entity 미래)
  | "pinned"   // Pinned / Others (Books, 다른 entity 적용 가능)

export const VALID_GROUP_BY: GroupBy[] = [
  // ...,
  "kind",
  "pinned",
]
```

### PR 4 (Gallery)

view-config interface에서 books supportedModes에 `"gallery"` 추가만.

---

## 8. 마이그레이션 전략

| PR | Store version | 내용 | 옵션 |
|---|---|---|---|
| PR 1 | v122 → v123 | `viewStateByContext["books"]` 기본값 주입 (없으면 add) | A (idempotent) |
| PR 2 | v123 → v124 | SortField/FilterField 신규 값 등록. viewStateByContext 변경 X (사용자 viewState는 그대로) | 변경 없음 (types만) |
| PR 3 | v124 → v125 | GroupBy 신규 값 등록. board column order 기본값 (옵션 — UI에 의존) | 변경 없음 (types만) |
| PR 4 | v125 → v126 | supportedModes 정합성 (gallery 추가) | 변경 없음 |

**중요**: PR 2/3/4는 store 데이터 변경 없음 (types union만 확장). store version bump는 "데이터 모델 호환성 boundary" 표시 목적.

**idempotent skip 보장**: 마이그레이션 진입 전 `viewStateByContext.books` 존재 여부 확인. 있으면 skip. 없으면 default 주입.

---

## 9. Task Flow + 상세 TODOs

### PR 1 — 인프라 + grid 보존

- [ ] **T1.1** `lib/view-engine/types.ts`: `"books"` ViewContextKey 추가, VALID_VIEW_CONTEXT_KEYS에 추가
  - 수용: tsc 0 errors. 기존 contextKey 동작 보존
- [ ] **T1.2** `lib/view-engine/defaults.ts`: `"books"` CONTEXT_DEFAULTS 항목 추가 (viewMode: grid, sort: updatedAt desc, groupBy: none, visibleColumns 3개)
  - 수용: `buildDefaultViewStates()` 호출 시 books 키 포함
- [ ] **T1.3** `lib/view-engine/use-books-view.ts` 신규 작성 (use-templates-view.ts 패턴 그대로 + Book 타입)
  - 5단계: filter (trashed/pinned/kind/sourceType 미리 정의) / search (title/description) / sort (updatedAt/createdAt/title/itemCount) / group (none/date — kind/pinned는 PR3) / viewMode (grid만 — list/board/gallery는 후속 PR)
  - header에 "Scope guard" 주석 명시
  - 수용: tsc 0 errors. useNotesView/useTemplatesView와 stage 분리 구조 동일
- [ ] **T1.4** `components/views/books-view.tsx`: BooksGrid가 `useBooksView()` 사용. 로컬 sort/showTrashed state 제거 (showTrashed는 viewState.toggles로 이동). 카드 JSX 보존
  - 수용: `npm run build` 0 errors. 시각 변경 0. trash toggle 동작 보존. viewState reload 보존
- [ ] **T1.5** Store migration v122 → v123: `viewStateByContext["books"]`가 없으면 default 주입. idempotent
  - 수용: 신규/기존 사용자 양쪽 verify (idempotent + 데이터 손실 0)
- [ ] **T1.6** 빌드 + tsc 검증. 시각 변경 0 verify
  - 수용: `npm run build` + `tsc --noEmit` 0 errors. `npm run test` pass

### PR 2 — List mode + sort/group/filter UI + PropertyChip 3개

- [ ] **T2.1** `lib/view-engine/types.ts`: SortField에 `itemCount` 추가, FilterField에 `kind`, `sourceType` 추가, VALID_SORT_FIELDS 갱신
  - 수용: tsc 0 errors
- [ ] **T2.2** `lib/view-engine/defaults.ts`: books visibleColumns 확장 ("title", "itemCount", "kind", "updatedAt")
- [ ] **T2.3** `lib/view-engine/use-books-view.ts`: filter 분기 확장 (kind / sourceType / pinned), sort 분기 확장 (itemCount)
  - 수용: itemCount sort 동작 (Book.items.length + resolved 카운트), kind filter 분류 (smartSources.length > 0 && items.length > 0 → Hybrid 등)
- [ ] **T2.4** `components/property-chips.tsx`: 신규 3개 chip 추가
  - BookItemCountChip (icon: List, value: count, PR e ChipShell)
  - BookKindChip (label: "Smart" / "Manual" / "Hybrid", 색 옵션 — Smart=violet?, Manual=neutral?, Hybrid=mixed)
  - BookSourceKindChip mini-bar (StickerKindChip 패턴 — icon만, 5 source types: Folder/Hash/Bookmark/Tag/StickerIcon)
  - 수용: ChipShell + h-5/text-2xs/leading-none
- [ ] **T2.5** `components/books/book-list-row.tsx` 신규: cover + title + BookKindChip + BookItemCountChip + TimestampChip + Pin indicator. 클릭 = openBook (PR 1 동작 보존)
  - 수용: list 모드에서 사용. 클릭/우클릭 컨텍스트 메뉴 동작 보존
- [ ] **T2.6** `components/views/books-view.tsx`: ViewHeader showSearch/showSort/showGroup/showFilter/showViewMode prop 활성화. viewMode === "list" 분기에 BookListRow 렌더
  - 수용: list 모드 토글 동작. sort/group/filter UI 노출. viewState persist
- [ ] **T2.7** Store migration v123 → v124: types union 확장만. 데이터 변경 X. idempotent
- [ ] **T2.8** 빌드 + tsc 검증. list mode visual verify + sort/filter 동작 verify
  - 수용: `npm run build` + `tsc --noEmit` 0 errors. itemCount sort + kind filter + sourceType filter 동작

### PR 3 — Board mode

- [ ] **T3.1** `lib/view-engine/types.ts`: GroupBy에 `kind`, `pinned` 추가, VALID_GROUP_BY 갱신
- [ ] **T3.2** `lib/view-engine/use-books-view.ts`: group 분기 확장 (kind: 3 column Smart/Manual/Hybrid / pinned: 2 column Pinned/Others)
- [ ] **T3.3** `lib/view-engine/group.ts` 또는 books 전용 group helper: kind/pinned 그룹 컬럼 라벨 + 정렬
- [ ] **T3.4** `components/books/books-board.tsx` 신규: NotesBoard 패턴 참조. column당 BookListRow 또는 그리드 카드 (1차는 list row)
- [ ] **T3.5** `components/views/books-view.tsx`: viewMode === "board" 분기. BooksBoard 마운트
  - 수용: board 모드 토글 동작. groupBy 변경 시 column 재구성
- [ ] **T3.6** Store migration v124 → v125: GroupBy 신규 값 등록
- [ ] **T3.7** 빌드 + tsc 검증. board visual verify

### PR 4 — Gallery mode

- [ ] **T4.1** `components/books/books-gallery-adapter.tsx` 신규: Book[] → GalleryItem[] 변환 (cover/title/description/clickHandler). 그룹은 view-engine groupBy 활용
  - 수용: 2026-05-11 GalleryItem interface 정합. 클릭 = openBook
- [ ] **T4.2** `components/views/books-view.tsx`: viewMode === "gallery" 분기. GalleryView 마운트
- [ ] **T4.3** `lib/view-engine/defaults.ts` 또는 view-config: books supportedModes에 "gallery" 추가
- [ ] **T4.4** Store migration v125 → v126: supportedModes 정합성
- [ ] **T4.5** 빌드 + tsc 검증. gallery visual verify

---

## 10. Smart Book 정합성 (영구 보존)

**INVARIANT** (`.omc/plans/smart-book-prd.md` § 2):
- Book.items kind = `"note" | "wiki" | "chapter-heading"`만
- AutoSource는 공급원, 멤버 kind 아님
- 모든 source는 note/wiki만 filter

**view-engine 통합 범위**: Book entity **자체의 list view** 만. 다음은 변화 0:
- `lib/books/resolver.ts` — resolver pure function
- `components/views/book-detail-page.tsx` — 단일 책 detail
- `components/books/sources-section.tsx` — folder picker UI
- `components/books/add-item-dialog.tsx` — Smart/Manual tab
- `components/books/book-item-row.tsx` — source-aware row
- `lib/store/slices/books.ts` — Smart Book API (addSmartSource 등)

**kind 계산**:
```ts
const isSmart = book.smartSources.length > 0
const isManual = book.items.length > 0
const kind: BookKind = isSmart && isManual ? "Hybrid" : isSmart ? "Smart" : "Manual"
```

resolver 호출 없이 단순 length 검사 → 빠름. (kind를 미리 계산해서 view-engine에 전달은 use-books-view.ts에서 useMemo로 처리)

---

## 11. Reverse-able Decisions

| 결정 | 추론 근거 | 뒤집고 싶을 때 |
|---|---|---|
| **PR 분할 = C 점진 4 PR** | 사용자 결정 (2026-05-12) | 옵션 A/B로 변경은 본 plan 재작성 필요. 영구 |
| **viewMode default = grid** | 사용자 결정 + cover emoji 활용 | CONTEXT_DEFAULTS의 viewMode를 "list"로. 1줄. 기존 사용자 viewState 보존 |
| **default sort = updatedAt desc** | 사용자 결정 + 현재 동작 보존 | CONTEXT_DEFAULTS의 sortFields를 변경. 1줄 |
| **default groupBy = none** | 사용자 결정 + 1차 보수 | CONTEXT_DEFAULTS의 groupBy를 "kind"로. 1줄 |
| **board column = 고정 (Smart/Manual/Hybrid or Pinned/Others)** | 1차 단순성 | drag/reorder 추가는 별도 PR (Notes Board가 이미 패턴 있음) |
| **BookKindChip 색 옵션** | 디자인 미정 (Smart=violet?) | property-chips.tsx에서 색 매핑 변경. 1줄 |
| **BookSourceKindChip = mini-bar (icon만)** | StickerKindChip 패턴 | text label 추가는 chip variant 늘림 |
| **gallery card = entity-agnostic adapter** | 2026-05-11 결정 | Books 전용 갤러리 카드 작성하면 generic 정합 깨짐. 영구 거부 |

---

## 12. Risks & Mitigations

| 위험 | 영향 | 완화 |
|---|---|---|
| view-engine pipeline.ts Note 타입 강결합 | 컴파일 에러 risk | thin fork 패턴 영구 (templates 패턴). useBooksView 격리 |
| Books 카드 list/board 디자인 신규 | 시각 회귀 | 점진 PR (PR 1 = grid 보존, 시각 변경 0). 매 PR visual confirm |
| groupBy `kind` / `pinned` 신규 = books 전용 | 다른 entity 적용 시 비호환 | use-books-view에 격리. notes pipeline group.ts 변경 X |
| Smart source filter UI 디자인 결정 부재 | UX 회귀 | Display popover sourceType 5 체크박스 (StickerKindChip mini-bar 패턴) |
| 마이그레이션 4단계 (v122→v126) | 사용자 데이터 손실 risk | 모든 마이그레이션 idempotent (옵션 A). PR 2/3/4는 types union 확장만 |
| BookKindChip의 Hybrid 분류 직관 부족 | 사용자 confused | tooltip + 색 옵션 (Smart=violet, Manual=neutral, Hybrid=gradient?) |
| PR 4 gallery adapter Smart Book 정합 | resolver 미호출 시 itemCount inaccurate | useMemo로 resolvedContentItems 카운트 활용 (BookDetailPage 패턴 참조) |

---

## 13. Out of Scope (명시적 제외)

- ❌ BookDetailPage 변경
- ❌ Smart resolver 변경 (INVARIANT 위배)
- ❌ AutoSource 데이터 모델 변경
- ❌ /books 라우트 변경
- ❌ Book.color 도입
- ❌ Generic `useEntityView<T>` 추출
- ❌ board column drag/reorder (1차는 고정)
- ❌ ContextMenu 변경 (Pin/Trash/Rename은 grid에서 이미 동작)
- ❌ Wiki 그룹 헤더 아이콘 (별도 작업 — NEXT-ACTION Path B)
- ❌ Create Book Dialog 변경

---

## 14. Success Criteria

### PR 별 acceptance

- `npm run build` 0 errors + `tsc --noEmit` 0 errors
- 기존 사용자 데이터 손실 0
- 카드 click → detail 진입 동작 보존 (`/books/{id}`)
- viewState reload 보존
- ContextMenu (Pin/Trash/Rename/Restore) 동작 보존
- Architect verification 통과

### 시리즈 전체 acceptance

- BooksGrid → `useBooksView` hook 전환 100%
- 4 viewMode 지원 (grid/list/board/gallery)
- PropertyChip 3개 신규 (BookItemCountChip + BookKindChip + BookSourceKindChip)
- Smart Book INVARIANT 보존 (resolver/BookDetailPage 변화 0)
- store version 진화: v122 → v126 (4 step)
- 사용자 결정 4가지 영구 반영

### Architect verification 기준 (매 PR)

1. thin fork hook이 use-templates-view.ts 패턴과 구조적으로 동일한가
2. PropertyChip 신규가 PR e 패턴 (ChipShell, h-5, text-2xs) 준수하는가
3. 마이그레이션이 idempotent인가 (옵션 A)
4. ViewContextKey/SortField/GroupBy/FilterField 신규 항목이 VALID_* 배열에도 추가됐는가
5. 사용자 영구 결정 (§ 1.2) 어느 것도 위반하지 않았는가
6. Smart Book INVARIANT 보존됐는가 (resolver/BookDetailPage 동작 변화 0)

### 빠뜨리지 말 것

- after-work 시: docs/MEMORY.md + docs/CONTEXT.md + docs/SESSION-LOG.md + docs/TODO.md + docs/NEXT-ACTION.md 갱신 의무
- 시리즈 종료 시: docs/MEMORY.md "Books view-engine 통합" 섹션 추가 (Group C PR-D 패턴 참조)

---

## 15. Commit Strategy

각 PR 내부에서 commit은 소단위 의미 묶음으로 분리:

```
PR 1 commits 예시:
  1. types: add "books" ViewContextKey + VALID_VIEW_CONTEXT_KEYS
  2. defaults: books CONTEXT_DEFAULTS (grid + updatedAt desc + none groupBy)
  3. view-engine: useBooksView thin fork (filter/search/sort/group)
  4. views/books-view: integrate useBooksView, preserve grid + showTrashed
  5. store: v123 migration (idempotent books defaults)
```

PR title 예시:
- `feat(books-view-engine-1): infrastructure + grid preservation (v123)`
- `feat(books-view-engine-2): list mode + sort/group/filter UI + 3 chips (v124)`
- `feat(books-view-engine-3): board mode + groupBy kind/pinned (v125)`
- `feat(books-view-engine-4): gallery mode (entity-agnostic adapter, v126)`

---

## 부록 A — 본보기 PR/Plan 인용

- **Plan**: `.omc/plans/group-c-prd-view-engine-integration.md` (Tags/Labels/Stickers/References/Files 5 entity 시리즈)
- **PR #249** (template-c): view-engine 통합 + useTemplatesView 패턴 정의
- **PR #251** (PR e): Linear-style PropertyChip 12개. ChipShell 패턴
- **PR #258** (v108): NoteTemplate slim. data model + UI 분리
- **PR #289** (book-entity): Book entity 도입 + Phase 1-4
- **PR #290** (smart-book): Smart Book Phase A
- **PR #291** (book-split-dual): 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic

## 부록 B — 핵심 코드 위치

- `lib/view-engine/types.ts` (PR 1/2/3 신규 값 추가)
- `lib/view-engine/defaults.ts` (PR 1 CONTEXT_DEFAULTS books 추가)
- `lib/view-engine/use-templates-view.ts` (본보기 thin fork)
- `lib/view-engine/use-books-view.ts` (PR 1 신규)
- `components/views/books-view.tsx` (모든 PR 수정)
- `components/books/book-list-row.tsx` (PR 2 신규)
- `components/books/books-board.tsx` (PR 3 신규)
- `components/books/books-gallery-adapter.tsx` (PR 4 신규)
- `components/property-chips.tsx` (PR 2 — BookItemCountChip + BookKindChip + BookSourceKindChip 추가)
- `components/view-header.tsx` (showSort/showGroup/showFilter/showViewMode prop)
- `lib/types.ts` (Book / BookItem / AutoSource — 변화 없음)
- `lib/books/resolver.ts` (변화 없음 — INVARIANT 보존)
- `lib/store/slices/books.ts` (변화 없음 — Smart Book API 보존)
- `lib/store/index.ts` (각 PR migration step)
