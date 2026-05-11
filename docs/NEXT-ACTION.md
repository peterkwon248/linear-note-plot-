# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-12 (Books view-engine 풀 통합 4 PR 시리즈 종료)
**머신**: 집 (Windows)
**현재 main HEAD**: PR 머지 후 갱신 예정 (이 세션 = `books-view-engine-1~4` 통합 PR)
**현재 Phase**: Books view-engine 4 viewMode (grid/list/board/gallery) 완성. Store v122 → v126.

---

## 🎯 다음 즉시 액션

### 🔴 0. Manual verify Books 4 viewMode + 회귀 fix

이번 세션 LOC 큼 (~1200 net) — 사용자 직접 시각 확인 필수.

**verify 절차 (브라우저 `/books`)**:

1. **Grid mode** (default): cover emoji + 책 카드 정상 표시. 우클릭 컨텍스트 메뉴 (Rename/Pin/Trash) 동작.
2. **Search**: ViewHeader "Search books" input → title/description 실시간 필터링.
3. **List mode** (Display popover → List):
   - BookListRow 각 행: cover + title + **BookKindChip** (Lightning/PencilSimple/Sparkle) + **BookItemCountChip** + **BookSourceKindChip** mini-bar + Pin indicator + updated time.
   - 우클릭 컨텍스트 메뉴 동일 동작.
4. **Filter popover** (4 categories): Kind (Smart/Manual/Hybrid) / Smart source (folder/category/tag/label/sticker/_none) / Pin (true/false) / Updated (today/this-week/...).
5. **Pinned-first sort**: 한 책 Pin → 새로고침 후에도 상단 유지.
6. **viewState persist**: viewMode/sort/filter 변경 후 reload → 유지.
7. **Board mode** (Display popover → Board):
   - groupBy "Kind" → 3 column (Smart / Hybrid / Manual), 각각 icon (Lightning/Sparkle/PencilSimple).
   - groupBy "Pin status" → 2 column (Pinned / Others).
   - Column header drag → 순서 변경, reload 후 유지 (`groupOrder` persist).
   - Card drag (groupBy=pinned) → pinned toggle (immediate + toast).
   - Card drag Smart → Manual (groupBy=kind) → confirm dialog ("Convert ...? This will remove N sources").
   - Card drag Manual → Smart → toast hint ("Configure on detail page").
8. **Gallery mode** (Display popover → Gallery):
   - Entity-agnostic GalleryView (Notes/Wiki/References 일관).
   - kind-based accent color (Smart=violet / Hybrid=amber / Manual=slate).
   - badge (Smart/Manual/Hybrid), cover icon (emoji or Books glyph).
   - 클릭 = 풀 에디터 (Plot 표준).
   - groupBy 적용 시 그룹 헤더 + 분리 그리드.

회귀 발견 시 보고 → 즉시 fix → 추가 commit.

### 🟡 1. (verify 없으면) Wiki 그룹 헤더 아이콘 (~30분)
- WikiList/WikiBoard 미적용 (Notes Table/Board/Gallery는 5-11에서 통일)
- 자투리 시간 정리 후보

### 🟢 2. (manual verify 통과 후) 다음 큰 트랙 brainstorm
- Smart Book v2 (AutoSource picker UX 강화)
- Wiki view-engine board 도입 (Plot 일관성)
- Notes/Wiki/Books 통합 entity-agnostic ListRow/BoardCard 패턴 일반화

---

## 🧠 잊지 말 것 (영구 결정 — 직전 세션)

### Books view-engine 4 PR 시리즈 영구 결정
- **사용자 결정 4가지** (AskUserQuestion 2026-05-12):
  - PR 분할: C 점진 4 PR
  - viewMode default: **grid 유지** (cover emoji 활용)
  - default sort: **updatedAt desc 유지**
  - default groupBy: **none**
- **Option A**: Plot 일관성 풀 (column drag + card drag) 채택 — Notes/Wiki와 동일 패턴
- **kind column card drag UX**:
  - smart/hybrid → manual: **confirm dialog** (smartSources 제거)
  - manual → smart/hybrid: **toast hint** ("Configure on detail page")
  - pinned column drag: immediate toggle
- **thin fork hook**: `useBooksView` (Generic 추출 X — Plot 영구 결정)
- **Smart Book INVARIANT 보존**: resolver/BookDetailPage/SourcesSection 동작 변화 0
- **마이그레이션 옵션 A**: idempotent skip — 기존 사용자 데이터 보존

### Books PropertyChip 3종 신규
- `BookItemCountChip` (List icon + count)
- `BookKindChip` (Lightning/PencilSimple/Sparkle + label)
- `BookSourceKindChip` mini-bar (5 source kinds icon만)

### Books 본질별 viewMode 결정 행렬
| Mode | 적합 |
|---|---|
| Grid (default) | 5/5 cover emoji 활용 |
| List | 5/5 정보 밀집 + chip |
| Board | 4/5 binary attribute (kind/pinned) 적합 |
| Gallery | 4/5 entity-agnostic adapter 활용 |

### launch.json 수정
- `node node_modules/next/dist/bin/next` → **`npx next`** (한글 경로 안전성)

---

## 📊 현재 Phase 진행 상황

### 직전 큰 작업 종결
- ✅ 2026-05-12 마라톤: **Books view-engine 풀 통합 4 PR**
  - PR 1 (v123): 인프라 + grid 보존
  - PR 2 (v124): list mode + sort/group/filter UI + 3 chip
  - PR 3 (v125): board mode + Option A dnd-kit
  - PR 4 (v126): gallery mode (entity-agnostic adapter)
- ✅ 2026-05-11 마라톤 (PR #291) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic
- ✅ 2026-05-10 마라톤 (PR #290) — Smart Book Phase A + 책 reading flow
- ✅ 2026-05-09 마라톤 (PR #289) — Book entity + Dual mode + Filter Path A

### Plot v3 visual refresh
- ✅ Phase 0/1/3/4.1/4.2
- ⏸️ Phase 2 (Imperial icons) — DEFER
- ⏳ Phase 4.3 (other list views chrome 통일) — Path B Step A 완료
- ✅ Phase 5: Studio/Editorial 제거 (v119) + Gallery polish (5-11)

### Smart Book 진행
- ✅ Phase A (Step 1 + 2.1-2.9 + Tweaks A/B/C)
- ✅ 책 reading flow (Step 2.10-2.21)
- ✅ **Books view-engine 4 viewMode 통합** (2026-05-12)
- ⏳ Phase B (Wiki source 등) 후속

---

## ⏸️ 보류 / 영구 폐기

- **Dual mode** — 영구 폐기 (Store v122)
- **Studio + Editorial view modes** — 제거됨 (Store v119)
- **v3 mockup `u-*` CSS 클래스** — 영구 폐기
- **Plot v3 Phase 2 (Imperial icon kit)** — DEFERRED
- **Generic `useEntityView<T>` hook 추출** — 영구 거부 (scope 폭발)

---

## 🔧 작업 환경

- **현재 main branch HEAD**: PR 머지 후 갱신 (이 세션 = `books-view-engine-1~4` 통합 PR)
- **현 worktree**: `suspicious-williamson-3670e0`
- **dev server**: localhost:3002 (Next.js webpack, launch.json `npx next` 기반)
- **store version**: v126 (Books gallery 통합 후)
- **Tests**: 255/255 passing
- **신규 파일 (이번 세션, 5개)**:
  - `lib/view-engine/use-books-view.ts`
  - `components/books/book-list-row.tsx`
  - `components/books/book-grid-card.tsx`
  - `components/books/books-board.tsx`
  - `components/books/books-gallery-adapter.tsx`
  - `.omc/plans/books-view-engine-integration.md`

---

## 📚 참고 plan

- `.omc/plans/books-view-engine-integration.md` ⭐ **이번 시리즈 plan**
- `.omc/plans/group-c-prd-view-engine-integration.md` — 본보기 (Tags/Labels/Stickers/References/Files)
- `.omc/plans/smart-book-prd.md` — Smart Book PRD
- `.omc/plans/book-entity-prd.md` — Book entity PRD
- `.omc/plans/v3-phase-4-3-decompose.md` — Phase 4.3
