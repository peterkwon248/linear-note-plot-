---
session_date: "2026-05-10 14:40"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\distracted-heyrovsky-f06ba0"
duration_estimate: "~14h+ (마라톤 세션, 9 카테고리 + 12 polish iteration steps)"
---

## Completed Work — 33 files (+1289 / -187), 4 신규 파일

### 9 카테고리 작업

1. **/trash 페이지에 Books 통합** — `components/notes-table.tsx` (TrashFilter union/TRASH_TABS/TrashEntityList/카운트/렌더 분기)
2. **Path B Step A — chrome/grid 분리** — `app/globals.css` (`.a-th, .a-row` 6-col grid hardcoded 제거, PR #282/#283 사례 회피)
3. **Dual mode pane gating + i18n** — `hooks/use-effective-view-mode.ts` + `components/dual/dual-list-editor.tsx` (secondary pane은 dual 비활성, 한글→영어 5 strings)
4. **⌘⇧E pane-aware fix** — `hooks/use-global-shortcuts.ts` (secondary focus면 no-op + toast hint)
5. **DisplayPanel "Dual" 버튼 disabled** — `components/display-panel.tsx` (PRD §LOCKED #9 3-layer closure)
6. **Smart Book PRD draft → revision → critic** — `.omc/plans/smart-book-prd.md` (656 line, 12 LOCKED, 2x critic 통과)
7. **Smart Book Phase A 10 sub-steps** — Step 1 + 2.1-2.9 + Tweaks A/B/C
8. **책 reading flow** — Step 2.10-2.11 (Read button + read mode + Linear ←→ + TOC dropdown)
9. **책 reading flow polish** — Step 2.12-2.21 (12 iteration steps: sidePanel/cleanup/풀폭/wiki chrome)

### Smart Book Phase A 10 sub-steps

```
Step 1   — Schema + Store API (5 methods, dedup) + v121 migration
Step 2.1 — Resolver pure function (folder source) + 14 tests
Step 2.2 — BookDetailPage 통합 (resolver useMemo + drag/up-down auto guard)
Step 2.3 — SourcesSection UI (folder picker + add/remove)
Step 2.4 — AddItemDialog "Smart" 탭
Step 2.5 — BookItemRow source-aware (visual + remove branch)
Step 2.6 — Tweak A: empty source heading hide (LOCKED #10 v1.2)
Step 2.7 — Tweak B: manual override source badge
Step 2.8 — Tweak C: folder picker preview count
Step 2.9 — In-book navigation includes auto items
```

### 책 reading flow Step 2.10-2.21

```
2.10 — Read button + NoteEditor defaultReadMode + BookDetailPage mount NoteEditor
2.11 — ←→ arrows (CaretLeft/Right) + TOC dropdown
2.12 — sidePanel force close on books reading
2.13 — BookDetailPage cleanup unmount + max-w fix
2.17 — list-mode pattern (max-w 완전 제거 = 풀페이지 default)
2.18 — layout.tsx isViewRoute include /books/* (FALLBACK 50% double-mount fix)
2.19 — Empty infobox auto-hide
2.20 — BookWikiReader root w-full flex-1 (81% → 100%)
2.21 — BookWikiReader full wiki chrome (Aa / collapse / WikiLayoutToggle / Edit)
```

## In Progress
없음. 모든 작업 tsc clean + 255/255 tests pass. Build ✅ pass. Architect 7회 통과.

## Remaining Tasks (다음 세션 P0, 사용자 명시)

- [ ] **Close 버튼 일관성** — 책 안 wiki reading에는 "Close" 있는데 노트는 없음. 노트에도 추가 vs 그냥 없애기 — 의논 필요. 사용자 의도: "위키에만 있는데, 노트에도 추가하기 vs 그냥 없애기 너랑 이야기나눠보고 싶어"
- [ ] **Books 뒤로가기 버튼 redesign** — 사용자: "ＢＯＯＫＳ의 뒤로 가기 버튼이 별로야". 위키처럼 타이틀 헤더 아래 sub-nav 패턴 (`← All / Articles / Stubs`)을 books에도 적용 검토. 참고: `components/views/wiki-view.tsx`의 Overview/Articles/Stubs 탭
- [ ] **Books 리스트 그리드 vs list mode 통일 검토** — 사용자: "ＢＯＯＫＳ의 경우 리스트는 지금처럼 무조건 그리드¿ 느낌으로 통일이야¿". 다른 view (Notes/Wiki)는 list/board/gallery 같은 multi-mode 지원. Books도 list mode 옵션 추가 가능?
- [ ] **Edit 버튼 색상/폰트 통일** — 책 안 wiki reading의 Edit 버튼이 일반 wiki view와 색상/사이즈 다름. 사용자: "왜 에디트 버튼 색상이랑 폰트 사이즈 등이 실제 위키 내부의 사이즈랑 컬러랑 달라". 코드: `components/views/book-detail-page.tsx` BookWikiReader `bg-accent px-2 py-1 text-xs font-medium` vs `components/views/wiki-view.tsx` line ~1033 `bg-accent px-2.5 py-1 text-note font-medium`. text-xs vs text-note + px-2 vs px-2.5 차이

## Key Decisions

- **Plot 모토 = 풀페이지 default** — max-w 제거. SmartSidePanel은 opt-in (⌘B). NotesView/WikiView/BookDetailPage 통일
- **Books reading = books route 유지** — /books/{id} URL 그대로 + BookDetailPage가 NoteEditor / WikiArticleView 직접 mount
- **layout.tsx isViewRoute sub-route 포함** — `/books/*`, `/library/*` 추가 (fallback double-mount 50% fix)
- **Empty infobox 자동 hide** — read 모드 + 비어있으면 22% 회수
- **Smart Book INVARIANT** — AutoSource는 공급원, 멤버 kind 아님. note/wiki만 filter
- **LOCKED #5c** — Manual top, Auto bottom (lastManualOrder seeding)
- **LOCKED #10 v1.2** — Empty source = silent skip
- **LOCKED #12** — addSmartSource dedup guard (boolean return)
- **PRD §LOCKED #9 3-layer** — 시각 (useEffectiveViewMode) + 입력 (⌘⇧E) + UI (Dual 버튼)

## Technical Learnings

- **flex item `w-full flex-1` 필수** — 누락 시 contents 폭만 (BookWikiReader 81% 원인)
- **Layout fallback double-mount** — sub-route 누락 시 children + view 둘 다 visible → 50%씩 폭 stealing
- **Resolver lastManualOrder seeding** — manual top/auto bottom 자연 보장
- **데이터 모델 silent assumption**:
  - Folder.noteIds 없음 (Note.folderIds reverse N:M)
  - WikiArticle.categoryIds: string[] (DAG)
  - Folder.kind = "note" | "wiki" 분리
  - Folder + WikiArticle hard-delete only (trash 시스템 없음)
- **PRD critic agent 가치** — Plot codebase 직접 검증으로 silent assumption catch
- **HMR 한계** — 큰 파일 변경 시 stale view, dev 재시작 또는 hard reload 필요

## Blockers / Issues
없음. 모든 작업 architect APPROVED + tests pass.

## Environment & Config

- Branch: `claude/distracted-heyrovsky-f06ba0`
- Remote: `origin/main` (default)
- Store version: **121** (Smart Book: smartSources/excludeIds defaults)
- 신규 npm 패키지: 없음 (fractional-indexing은 직전 세션 추가)
- Build: ✅ exit 0 / TSC: ✅ 0 errors / Tests: ✅ 255/255
- dev port: 3002

## Notes for Next Session

- **첫 명령**: `/before-work`
- **추천 시작 작업 순서**:
  1. Edit 버튼 색상/폰트 통일 (~10분, 가장 작음)
  2. Close 버튼 일관성 의논 (사용자 결정)
  3. Books 뒤로가기 sub-nav 패턴 (~30분, wiki view 패턴 모방)
  4. Books 리스트 list mode 옵션 (~1-2h, multi-mode 지원)
- **주의 사항**:
  - HMR 못 잡으면 dev 재시작 (npm run dev) 권유
  - 사용자 viewport 1404px 정도 (preview MCP 측정 기준)
- **Smart Book Phase B-F 진입 전 검증**:
  - WikiArticle.trashed 필드 미존재 (hard-delete only)
  - WikiCategory.trashed 검증 필요
  - Folder/Tag/Label/Sticker 각자 delete 동작 검증
- **참고 PRD**: `.omc/plans/smart-book-prd.md` (656 line, 12 LOCKED)

## Files Modified — 33 files (+1289 / -187)

### 신규 (4)
- `.omc/plans/smart-book-prd.md` (656 line) — Smart Book PRD v1.1
- `lib/books/resolver.ts` (167 line) — Pure function resolver
- `lib/books/__tests__/resolver.test.ts` (~245 line) — 14 tests
- `components/books/sources-section.tsx` (183 line) — SourcesSection UI

### 수정 (주요)
- `app/(app)/layout.tsx` — isViewRoute sub-route 포함
- `app/globals.css` — `.a-th, .a-row` chrome-only
- `components/views/book-detail-page.tsx` (+319 line) — Smart Book 통합 + Read button + BookWikiReader
- `components/note-editor.tsx` — defaultReadMode prop + PanelsMenu
- `components/notes-table.tsx` — Trash Books 통합
- `components/display-panel.tsx` — Dual 버튼 secondary disabled
- `components/dual/dual-list-editor.tsx` — i18n
- `components/books/{book-context-nav,book-item-row,add-item-dialog,in-books-section}.tsx` — Smart Book 통합
- `components/wiki-editor/wiki-article-view.tsx` — Empty infobox hide
- `components/views/wiki-view.tsx` + `components/workspace/secondary-panel-content.tsx` — BookContextNav items/jumpTo props
- `hooks/use-book-context-nav.ts` — items + jumpTo + resolved content items
- `hooks/use-effective-view-mode.ts` — pane gating + i18n
- `hooks/use-global-shortcuts.ts` — ⌘⇧E pane-aware
- `lib/books/utils.ts` — `resolvedContentItems`, `findItemIndexInResolvedBook`, `booksContainingEntityResolved`
- `lib/books/__tests__/utils.test.ts` (+9 tests)
- `lib/store/{types,index,migrate,slices/books}.ts` — Smart Book schema + v121 migration
- `lib/store/__tests__/books-slice.test.ts` (+11 tests)
- `lib/types.ts` — AutoSource type + Book extension
- `docs/MEMORY.md` + `docs/CONTEXT.md` — 이번 세션 기록
