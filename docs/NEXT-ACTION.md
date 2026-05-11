# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-12 (Books view-engine 10 PR 시리즈 완료 + Pin 통일)
**머신**: 집 (Windows)
**현재 main HEAD**: PR #301 머지 후
**현재 Phase**: Books view-engine 4 viewMode 완성. Pin 통일 (Notes/Wiki/Books). 미세 polish 진행 중.

---

## 🎯 다음 즉시 액션

### 🔴 0. Pin indicator 위치 fix — Notes/Wiki

사용자 명시 회귀 (세션 끝): "노트, 위키의 **status chip 옆**에 핀 아이콘이 있어야 되는 거 아니냐?"

**현재 상태**:
- Books: title cell 안 inline pin (title 옆) — OK
- Notes: title 옆 inline pin (PR #301) — 사용자는 **status chip 옆** 원함
- Wiki: title span 옆 inline pin (PR #301) — 동일

**작업**:
- `components/notes-table.tsx`: row의 status column (별도 cell) 안에 pin 추가 또는 status chip 직후 inline
- `components/views/wiki-list.tsx`: status badge 옆 pin 이동
- BookTable도 일관성 위해 검토 (현재 title 안 pin → status 옆으로?) — but Books의 "Status" column 없음 (kind만). 그러므로 Books는 그대로.

→ Notes는 status column 안 또는 옆. Wiki는 status badge (IconWikiArticle / IconWikiStub) 옆.

### 🟡 1. Wiki 우클릭 메뉴 + 플로팅 바 Pin 추가 (#300 follow-up)

PR #300에서 Books + Notes만 추가됨. Wiki도 동일 패턴 필요:
- WikiList의 row ContextMenu에 Pin/Unpin 항목 (note.pinned 분기)
- Wiki Floating bar (있다면) Pin 액션 추가 (또는 신규 floating bar)
- 또는 wiki는 기존 다른 컴포넌트 사용 — 점검 필요

### 🟢 2. Books view-engine 시리즈 manual verify
- Display popover → 4 viewMode (grid/list/board/gallery) 토글
- Filter Kind values icon 노출 (Lightning/PencilSimple/Sparkle + 색)
- BookKindChip 색 (Smart=violet / Manual=neutral / Hybrid=amber)
- BookFloatingBar (1+ 선택 시 하단 등장, Pin/Unpin/Trash)
- Save view 버튼 ViewHeader (Notes/Wiki 정합)
- Trash chip 제거됨 — /trash 페이지에서 trashed 책 보기

---

## 🧠 잊지 말 것 (영구 결정 — 이번 거대한 세션)

### Books view-engine 10 PR 시리즈 (Store v122 → v129)
- 사용자 결정 4가지 (PR 분할 C / grid default / updatedAt desc / groupBy none)
- Option A (column drag + card drag, NotesBoard 패턴)
- thin fork 패턴 영구 (Generic 추출 X)
- Smart Book INVARIANT 보존
- 마이그레이션 옵션 A 영구 (idempotent)

### Plot icon 시스템 = Phosphor outline (Linear-style)
- emoji 영구 폐기 (2026-05-12 결정 — PR #298)
- Book.coverEmoji 필드 `@deprecated` (UI 안 읽음, IDB round-trip만)
- BookKindIcon (Lightning/Sparkle/PencilSimple + 색)
- Sidebar entity identity = BookOpen (변경 X)
- 미래 사용자 unique cover icon = Phosphor icon picker (별도 PR — Book.coverIcon 신규 필드)

### Books kind metaphor = "shape carries meaning" (Plot status 정합)
- Smart: Lightning + violet `#5E6AD2`/`#7C8AE7`
- Manual: PencilSimple + muted-foreground (neutral)
- Hybrid: Sparkle + amber `#D97706`/`#f59e0b`
- BookKindChip = StatusBadge 패턴 (color + bg 18% + border 35% + icon + label)
- Filter Kind values = same icons/colors

### Pin 통일 (모든 entity)
- 우클릭 메뉴 Pin/Unpin: Books ✅ / Notes ✅ (PR #300) / Wiki ❌ (follow-up)
- 플로팅 바 Pin/Unpin: Books ✅ / Notes ✅ (PR #300) / Wiki ❌ (follow-up)
- Inline pin indicator (title 옆): Books ✅ / Notes ✅ (PR #301) / Wiki ✅ (PR #301)
- **위치는 status chip 옆으로 이동 필요** (사용자 시그널 2026-05-12 끝)

### Books DisplayPanel
- Properties 4 toggle (Item count / Kind / Sources / Pin)
- groupingOptions: none / kind / pinned
- supportedModes: grid / list / board / gallery
- Card drag UX:
  - pinned: 즉시 toggle
  - kind smart/hybrid → manual: confirm dialog
  - kind manual → smart/hybrid: toast hint
- normalizeViewState books-specific (groupBy ["none","kind","pinned","date"]만)

---

## 📊 현재 Phase 진행 상황

### 직전 큰 작업 종결 (2026-05-12 거대한 세션, 10 PR)
- ✅ [#292](https://github.com/peterkwon248/linear-note-plot-/pull/292) view-engine 4 viewMode 통합 (Store v122→v126)
- ✅ [#293](https://github.com/peterkwon248/linear-note-plot-/pull/293) BookTable column-rich + checkbox
- ✅ [#294](https://github.com/peterkwon248/linear-note-plot-/pull/294) Kind-shape carries meaning
- ✅ [#295](https://github.com/peterkwon248/linear-note-plot-/pull/295) SEED_BOOKS 8 books
- ✅ [#296](https://github.com/peterkwon248/linear-note-plot-/pull/296) v127 backfill
- ✅ [#297](https://github.com/peterkwon248/linear-note-plot-/pull/297) Polish 1 (emoji/properties/validation)
- ✅ [#298](https://github.com/peterkwon248/linear-note-plot-/pull/298) emoji 영구 폐기
- ✅ [#299](https://github.com/peterkwon248/linear-note-plot-/pull/299) Polish 2 (chip 색 + filter icon + Save view)
- ✅ [#300](https://github.com/peterkwon248/linear-note-plot-/pull/300) Pin 통일 (Books floating + Notes pin)
- ✅ [#301](https://github.com/peterkwon248/linear-note-plot-/pull/301) Pin indicator (Notes/Wiki title 옆)

### Plot v3 visual refresh
- ✅ Phase 0/1/3/4.1/4.2
- ⏸️ Phase 2 (Imperial icons) — DEFER
- ⏳ Phase 4.3 (other list views) — Path B Step A 완료
- ✅ Phase 5: Studio/Editorial 제거 + Gallery polish

### Smart Book
- ✅ Phase A (Step 1 + 2.1-2.9 + Tweaks A/B/C)
- ✅ 책 reading flow (Step 2.10-2.21)
- ✅ Books view-engine 4 viewMode 통합 (2026-05-12)
- ⏳ Phase B 후속

---

## ⏸️ 보류 / 영구 폐기

- **Dual mode** (Store v122 폐기)
- **Studio + Editorial** (Store v119 제거)
- **v3 mockup `u-*` CSS 클래스** 폐기
- **Plot v3 Phase 2 (Imperial icon kit)** DEFERRED
- **Generic `useEntityView<T>` hook** 영구 거부
- **emoji 시스템 (Book.coverEmoji 시각 사용)** 영구 폐기 (2026-05-12)
- **status 도입 to Books** 거부 — kind 자체로 충분 (사용자 통찰: config에서 status 빼고 kind 넣기)

---

## 🔧 작업 환경

- **현재 main HEAD**: PR #301 머지 후
- **현 worktree**: `suspicious-williamson-3670e0`
- **dev server**: localhost:3002 (`npx next dev --webpack`)
- **store version**: v129 (emoji 폐기 migration 적용 후)
- **Tests**: 255/255 passing
- **신규 파일 (이번 세션 누적)**:
  - `lib/view-engine/use-books-view.ts`
  - `components/books/book-grid-card.tsx`
  - `components/books/book-table.tsx` (BookTable + BookFloatingBar inline)
  - `components/books/books-board.tsx`
  - `components/books/books-gallery-adapter.tsx`
  - `.omc/plans/books-view-engine-integration.md`
  - (book-list-row.tsx 신규지만 사용 X — cleanup follow-up)

---

## 📚 참고 plan

- `.omc/plans/books-view-engine-integration.md` ⭐ **이번 시리즈 plan**
- `.omc/plans/group-c-prd-view-engine-integration.md` — 본보기
- `.omc/plans/smart-book-prd.md` / `book-entity-prd.md`
- `.omc/plans/v3-phase-4-3-decompose.md` — Phase 4.3
