---
session_date: "2026-05-09 16:19"
project: "Plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\distracted-bassi-0a7ded"
duration_estimate: "~12+ hours (마라톤 세션, 2 PRD + 9 Phase + 45 changes)"
---

## Completed Work — ~45개 변경, 단일 squash PR 예정

### Polish + Cleanup (12개)
- StatusShapeIcon `Cuboid` (1×2) → `Cuboid2x2` (2×2 grid) 통일 (`status-icon.tsx`)
- Chip 가시성 12% → 24% (`.a-row__icon` + `.a-stchip` 7곳, globals.css)
- Wiki list leading icon `.a-row__icon` chip wrapper (wiki-list.tsx)
- Studio + Editorial 제거 + IDB migration v119 (영구 규칙 #1 cleanup) — 5 파일 삭제
- ViewSwitcher 제거 → Display popover [List|Board|Gallery] 3-segment 통합
- 사이드바 active icon 공간별 색상 (`data-active-space` + globals.css 6 매핑)
- Stone/Brick/Block 헤더 status 아이콘 (notes-table.tsx — context별 분기)
- Wiki article 헤더 stub/article 아이콘 (wiki-view.tsx)
- Inbox 라우팅 home space 매핑 (inferSpace에 `/inbox` 추가)
- Inbox B1+B2+B3 (max-width 720px + count chip 항상 표시 + Next-up 카드 forward-looking)
- Home sidebar 보강 (Inbox + Pinned + Recent cross-entity Note+Wiki+Book)
- PanelsMenu 미니어처 (4-region SVG, 각 panel 옆 layout 시각화)
- Old `components/icons/Cuboid.tsx` 삭제 + Notes filter config Cuboid2x2 통일

### Filter coverage Path A 완전 종결 (6 entity)
- Step 1: Files type filter (image/url/file) — view-engine + ViewHeader filter wiring
- Step 2: References type filter (link/citation) — refType derived
- Step 3: Wiki Category status filter (has-articles/empty) + tier value mismatch fix
- Step 4: Tags color filter (set/unset) — Labels skip (모든 label color set)
- Step 5: Inbox source filter (5 InboxItemKind) — local state + tabs와 공존
- Bonus: Sticker memberStatus + memberKind (7 EntityKind)

### Book entity 도입 (PRD + Critic + Phase 1-4 + 통합)
- PRD: `.omc/plans/book-entity-prd.md` (revised v1.1, 6 critic issues 반영)
- **Phase 1**: Data infra — Book/BookItem types + BooksSlice + 25 vitest tests + IDB v120 migration + `fractional-indexing@^3.2.0` 추가
- **Phase 2**: ActivityBar 7th space (Wiki와 Calendar 사이) + /books route + Burgundy 색 `#be123c` (rose-700) + sidebar
- **Phase 3**: Manual book view — books grid + BookDetailPage + dnd-kit drag/↑↓ + AddItemDialog (검색 picker) + chapter heading insert + dropdown context menu (rename/pin/trash)
- **Phase 4**: In-book navigation — `N/M ↑↓` counter + breadcrumb back-link + ⌘[/⌘] 단축키 + pane-scoped bookContext (primary/secondary 독립)
- "In Books" 섹션 (note/wiki detail panel — 공용 InBooksSection 컴포넌트, click → bookContext set)
- Book pin → Home Quicklinks 통합 (mixed-quicklinks book + sidebar HomePinnedItem book kind)
- Book trash UI 통합 (showTrashed toggle + restore/forever-delete context menu)

### Dual mode 도입 (PRD + Critic + Phase 1-3+5+6, Books skip locked)
- PRD: `.omc/plans/split-mode-prd.md` (revised v1.1, 6 critic issues 반영)
- **핵심 결정**: 이름 "Split" → "Dual" rename — 기존 `NoteSplitOverlay` (`lib/note-split-mode.ts`)와 충돌 회피
- **Phase 1**: 인프라 — `DualListEditor` (autoSaveId, controlled X) + `useEffectiveViewMode` (SSR-safe + transition-only debounced toast) + ⌘⇧E 단축키 + UI slice (dualSelection flat, dualRatio)
- **Phase 2**: Notes view 통합 — DisplayPanel "Dual" entry + NotesTable dualMode + NoteEditor reuse
- **Phase 3**: Wiki view 통합 — WikiList dualMode + WikiArticleView reuse (wiki sub-modes 우선순위 보존)
- **Phase 4**: Books skip — LOCKED (자체가 list 구조)
- **Phase 5**: References 통합 — ReferenceDetailPanel reuse
- **Phase 6**: Polish — 키보드 ↑↓ navigation + DefaultEmptyState 강화 (⌘⇧E hint) + Display button title hint
- Mail-client 패턴 5-pane (AB / SB / List / Editor / Detail), 1200px viewport 자동 fallback

### Plugin install
- `plot-frontend` 글로벌 등록: `~/claude-plugins/plot-frontend-plugin/` + `~/.claude/plugins/known_marketplaces.json` + `~/.claude/settings.json` enabledPlugins
- 다음 세션부터 자동 활성: 3 skills (production-ui-refiner, mockup-faithful-implementation, frontend-orchestrator) + 4 hooks + 4 commands

### Bug fixes
- FilterRule.op → operator typo fix (References filter)
- VALID_VIEW_MODES runtime validator 누락 — Critic이 Dual PRD에서 발견

## In Progress
- 없음. 모든 작업 완료 + tsc clean + build pass + 221/221 tests pass.

## Remaining Tasks (다음 세션 후보)

- [ ] **Smart Book (Phase 5)** — AutoSource[] resolver (folder/category/tag/label/sticker), 별도 PRD 필요. Memory: 33-design-decisions §4. ~4-5h.
- [ ] **/trash 페이지 books section 통합** — 현재 deleteBook은 작동하지만 /trash UI에 책 안 보임. notes-table 기반 trash view에 cross-entity section 추가. ~1h.
- [ ] **Path B Step A — globals.css `.a-th/.a-row` 6-col grid hardcoded refactor** — chrome (height/border/sticky/bg/font-size) vs grid (consumer 책임) 분리. before-work P0 #2. ~1.5h.
- [ ] **나무위키 인포박스 고도화 Tier 1** — 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기. Memory P2 항목. ~3-4h.
- [ ] **다중 기기 sync Phase 1** — Supabase B + E2E + Yjs setup. PRD LOCKED 2026-04-29. ~몇 세션.

## Key Decisions

- **Books burgundy** `#be123c` (rose-700) — 6 다른 space와 distinct, 책 표지 가죽 메타포
- **Book = ordered sequence** (4사분면 컨테이너 모델 마지막 자리, Sticker=unordered와 짝)
- **Heading-as-divider 단일 모델** — flat + nested 자연스럽게 통합 (Notion sub-heading 패턴)
- **Dual mode 이름** (Split→Dual, NoteSplitOverlay 충돌 회피)
- **N:M 다중 멤버십** — 한 entity가 여러 book에 (Sticker 패턴)
- **fractional-indexing string order** — sparse integer 대신 (50회 underflow 회피)
- **Filter coverage Path A 완성** — 6 entity (Files/References/Wiki Cat/Tags/Inbox/Stickers)
- **사이드바 active icon = 공간별** — data-active-space CSS 매핑

## Technical Learnings

- **fractional-indexing**: sparse integer halving은 50회 후 underflow → lexicographic key string (Linear/Figma 패턴)
- **VALID_VIEW_MODES**: TS union + runtime validator array 둘 다 update 필수. IDB hydration 시 silent fallback 위험
- **ResizablePanelGroup autoSaveId**: defaultSize controlled X. autoSaveId로 라이브러리 자체 persistence
- **SSR-safe hook**: mounted state guard + transition-only debounced toast (resize spam 방지)
- **Pane-scoped state**: bookContext / dualSelection 패턴, primary/secondary 독립 (SmartSidePanel dual pane 정합)
- **Critic agent 가치**: 두 PRD 모두 6 issues 정확히 잡음 (이름 충돌 / runtime validator / shape mismatch / SSR / hydration / autoSaveId)
- **NoteSplitOverlay vs Dual mode 이름 충돌** — 기존 기능과 새 기능이 같은 단어 사용 → rename 필수

## Blockers / Issues
- 없음.

## Environment & Config
- Working dir: `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\distracted-bassi-0a7ded`
- Branch: `claude/distracted-bassi-0a7ded` (squash PR 예정)
- Remote default: **main**
- Stack: Next.js 16, React 19, TypeScript, Zustand 5, TipTap 3, Tailwind v4
- Store: **v120** (Books migration)
- 추가 npm 패키지: `fractional-indexing@^3.2.0`
- Build: ✅ exit 0 / TSC: ✅ 0 errors / Tests: ✅ 221/221
- dev port 3002
- Plugin global: `plot-frontend@plot-frontend` (~/claude-plugins/plot-frontend-plugin/)

## Notes for Next Session

- **첫 명령**: `/before-work`
- **Plugin 검증**: plot-frontend skill 자동 활성 정확도 관찰 (production-ui-refiner / mockup-faithful-implementation / frontend-orchestrator description 매칭)
- **추천 다음 작업** (우선순위):
  1. /trash 페이지 books section 통합 (~1h, 작은 finishing)
  2. Smart Book Phase 5 PRD 작성 (큰 작업 시작)
  3. Path B Step A — globals.css refactor (P0 #2)
- **Critic agent 패턴**: 큰 PRD 작성 후 항상 critic review (이번 세션 검증된 가치)
- **Plot에서 큰 entity 도입 시 표준 절차**: PRD → Critic → Phase 분해 → executor 위임 → 단계별 tsc/build/tests 검증
- **워크트리 흐름**: 단일 squash PR로 큰 batch 머지 (오늘 ~45 변경 한 PR)

## Files Modified — 49 files (+1912 / -1512)

### 삭제 (5)
- `components/views/studio-view.tsx`, `studio-view-shell.tsx`, `editorial-view.tsx`, `editorial-view-shell.tsx` — 영구 규칙 #1 cleanup
- `components/views/view-switcher.tsx` — Display popover로 통합
- `components/icons/Cuboid.tsx` (1×2) — 미사용

### 신규 (~10)
- `components/dual/dual-list-editor.tsx` (Dual Phase 1)
- `hooks/use-effective-view-mode.ts` (Dual Phase 1)
- `components/views/book-detail-page.tsx` (Book Phase 3)
- `components/books/book-item-row.tsx`, `add-item-dialog.tsx`, `book-context-nav.tsx` (Book Phase 3-4)
- `components/views/books-view.tsx` (Book Phase 2)
- `components/books/in-books-section.tsx` (Book follow-up)
- `lib/store/slices/books.ts` + `lib/store/__tests__/books-slice.test.ts` (Book Phase 1)
- `lib/books/utils.ts` + tests (Book Phase 4)
- `hooks/use-book-context-nav.ts` (Book Phase 4)
- `app/(app)/books/page.tsx` + `app/(app)/books/[id]/page.tsx` (Book route)

### 수정 (주요)
- `lib/types.ts` (Book + BookItem + DualSelection types)
- `lib/store/types.ts` + `index.ts` + `migrate.ts` (v120 + Books slice + DualState + bookContext)
- `lib/store/slices/ui.ts` (bookContext + dualSelection setters)
- `lib/view-engine/types.ts` (ViewMode + VALID_VIEW_MODES + FilterField 확장)
- `lib/view-engine/view-configs.tsx` (모든 entity supportedModes + filterCategories)
- `lib/view-engine/use-{notes,wiki,files,references,tags,stickers}-view.ts` (filter stage 추가)
- `lib/colors.ts` (Books burgundy)
- `lib/table-route.ts` (/books route + /inbox → home space + /books/{id} dynamic)
- `app/globals.css` (chip 24% + active icon 공간별 + 5 파일 cleanup)
- `app/(app)/layout.tsx` (BooksView + BookDetailPage mount)
- `components/activity-bar.tsx` (7th Books)
- `components/linear-sidebar.tsx` (Books space + Home pinned cross-entity)
- `components/views/{wiki,notes-table,inbox,library,tags,stickers}-view.tsx` (filter wiring + dual branches)
- `components/notes-table.tsx` + `wiki-list.tsx` (dualMode + 키보드 ↑↓)
- `components/note-editor.tsx` + `wiki-view.tsx` (BookContextNav 통합)
- `components/side-panel/{side-panel-context,wiki-article-detail-panel}.tsx` (InBooksSection 삽입)
- `components/dual/dual-list-editor.tsx` (Phase 6 polish)
- `components/display-panel.tsx` (Dual mode entry)
- `components/panels-menu.tsx` (4-region 미니어처 SVG)
- `components/status-icon.tsx` (Cuboid → Cuboid2x2)
- `components/home/mixed-quicklinks.tsx` (Book pin)
- `hooks/use-global-shortcuts.ts` (⌘⇧E)
- `package.json` + `package-lock.json` (fractional-indexing)
- `docs/MEMORY.md` + `docs/CONTEXT.md` (이번 세션 기록)
- `.omc/notepads/general/{learnings,decisions}.md` + `.omc/notepad.md` (wisdom)
- `.omc/plans/book-entity-prd.md` + `split-mode-prd.md` (신규 2 PRD)
