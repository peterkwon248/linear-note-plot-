# Plot — Project Context (Git-Synced)

> This file is synced via git so all machines share the same context.
> before-work reads this file. Update it whenever major decisions change.

## ⭐ Plot 정체성 (영구 디자인 원칙)

> **"Gentle by default, powerful when needed."**
>
> - 사용자가 원하는 모든 것 가능 (강력)
> - 그러나 소란스럽지 않게 (gentle)
> - 기본만으로 충분 (sensible defaults)
> - 원할 때만 (opt-in)
>
> 모든 디자인 결정의 척도. memory의 "기능 5개의 98점" 철학 + Linear UI 정합.

## ⭐ 작업 원칙 (영구, 모든 PR/작업에 적용)

> **"정확도 + 버그 위험 최소화"**
>
> 모든 todo / PR / 코드 변경에 적용되는 무조건적 원칙.

### 적용 방식
1. **변경 전 점검**: 현재 코드/패턴 정확히 이해 → 추측으로 변경 X
2. **최소 diff**: 작업 범위에서 벗어난 변경 X (executor scope 초과 사례 회피)
3. **빌드/타입 검증**: 매 PR마다 `npm run build` + `tsc --noEmit` 통과 의무
4. **사용자 reproduce 정보 우선**: 버그 보고 시 추측 fix X, 실제 reproduce + 원인 분석 후 fix
5. **마이그레이션 신중**: 데이터 모델 변경 시 백업/롤백 가능하도록 설계
6. **UI 변경 + 데이터 모델 변경 분리 PR**: 둘 동시면 디버깅 어려움
7. **edge case 점검**: 빈 데이터 / 거대 데이터 / hydration 시점 / SSR 등
8. **사용자 직관 = 디자인 시그널**: 사용자가 헷갈리면 의미 분리 약하다는 신호 (무시 X)
9. **문서 정확성**: docs는 코드 진실 source. 추측 기록 X, 검증된 사실만
10. **커밋 메시지 명시**: 무엇을 왜 변경했는지 + 검증 방법 포함

### 위반 시 사례 (재발 방지)
- 이전 세션 — Executor scope 초과 (Sticker UI 754줄 자동 추가): 명시적 prompt scope 정의 + 결과 검증 의무
- 이전 세션 — Hull pointer-events 추측 fix (실제 원인 = visiblePainted): 사용자 reproduce 정보 받고 코드 분석 후 fix
- 2026-05-08 — PR #282 chrome 통일 시도가 globals.css `.a-row` grid 강제로 layout 깨짐: 단순 className 추가로 해결 안 됨, 깊은 refactor 필요. 사용자 visual feedback이 가장 빠른 진단 path.
- 2026-05-09 — Dual mode PRD에서 "Split" 이름 충돌 (NoteSplitOverlay): Critic 검토로 발견 → "Dual" rename. PRD 신선할 때 critic review 가치 큼.
- 2026-05-12 — Books view-engine 통합에서 dangling JSX 삽입 사고: Edit이 분기 추가 후 기존 JSX가 dangling으로 남음. read로 정확히 확인 후 분기 추출 (BookGridCard 별도 컴포넌트)으로 정리. **교훈: 큰 JSX 분기 변경은 Read → 분기 헬퍼 추출 → Edit 순서가 안전.**
- 2026-05-12 (저녁) — 거대 PR 시리즈 (10 PR) 후 매번 squash 머지 conflict 발생: HEAD 우선 (`git checkout --ours`) resolve 패턴 안정. **교훈: 매 PR 머지 직후 fetch+merge 습관, 같은 worktree에서 시리즈 진행 시 안전.**
- 2026-05-12 (낮) — `transition-all` Tailwind class가 dnd-kit transform 업데이트와 충돌. transition class는 hover/select 시각 변경에만 사용. `transition-colors`, `transition-shadow`로 specific 제한. **교훈: drag/transform 컴포넌트에 `transition-all` 위험.**
- 2026-05-12 (낮) — NEXT-ACTION.md 폐지 결정. 3중복 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG hook)이 stale 패턴 유발. **교훈: source of truth는 단일이어야. 단순화 우선.**
- 2026-05-12 (오후) — JSX `{cond && <X .../>}` webpack/swc parser에서 "unterminated regexp literal" 오해석. 페이지 빈 화면. **교훈: conditional render 무조건 parens `{cond && (<X />)}`. 향후 PR review 시 같은 패턴 차단.**
- 2026-05-12 (오후) — `STATUS_CONFIG[status]` undefined runtime crash. data corruption / 옛 enum / 빈 값에 graceful 대응 X. **교훈: 모든 `Record<X, Y>` lookup access에 null guard 의무.**

---

## 🚀 2026-05-12 (오후) — Board/Gallery polish + Split view + hotfix (4 PR cascade) ⭐⭐⭐⭐

**범위**: PR #305 직후 사용자 시그널 5건 follow-up. 4 PR 단일 worktree squash (#305-#308).

### 핵심 결정 (영구 LOCKED)

**1. Block 색 = slate**: Plot 건축 메타포 (stone beige → brick orange → block slate earthy progression). teal `#0E9384` 폐기.

**2. Gallery click = list/board parity (Linear principle)**:
- Single = preview / Double = open / Mod+click = select / Hover = checkbox / Selection 시 = 하단 FloatingActionBar
- 모든 view mode 동일 muscle memory

**3. Split view 보드**: secondary pane workbench hide. primary만 시그니처 보존. secondary는 board column drop target만.

**4. STATUS_CONFIG / 모든 lookup map null guard 의무**: `if (!cfg) return null` graceful skip.

**5. JSX conditional render parens 의무**: `{cond && (<X />)}`. webpack/swc parser 안전.

### 기술 학습

- JSX parser ambiguity 해결책 (parens)
- STATUS_CONFIG runtime corruption 대응 (null guard)
- Gallery selection 진입 3 경로 (cmd-click + hover checkbox + selection 중 click)
- GalleryCard onClick 시그니처 확장 (modifier key 검출)
- dropAnimation cubic-bezier polish
- 빈 status group의 Kanban drop target

---

## 🚀 2026-05-12 (낮~오후) — ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 ⭐⭐⭐⭐

**범위**: 1 worktree. 11 작업 통합. 단일 PR squash (예정).

### 핵심 결정 (영구)

**1. NEXT-ACTION.md 영구 폐지 (LOCKED)**: 정보 3중복 해소. SESSION-LOG entry 첫 줄 hook + TODO P0가 단일 진실 두 source. 글로벌 commands → project-level (`.claude/commands/`, git tracked) 이전.

**2. Pin 위치 = title 옆 (name 오른쪽) 재확인**: PR #301 영구 결정. elastic-darwin의 status chip 옆 이동 변경(`1d8b30f`)은 폐기.

**3. Multi-select UI 패턴**: List = 하단 FloatingActionBar / Board = 우측 BoardWorkbench (signature) / Gallery = 하단 (향후). action set 통일 + presentation mode-specific.

**4. ContextMenu DRY (`note-context-menu-items.tsx`)**: 13 items, 3 surface (list/board/gallery) 동일. Linear principle.

**5. Kanban 패턴 — 빈 status column 항상 표시**: `groupBy === "status"`일 때만. dynamic group은 기존 동작.

**6. Books entity icon = `BookOpen`**: ActivityBar/Sidebar/Secondary popover 모두. Library의 phosphor `Books`와 시각 구별.

**7. Trash "All" = 모든 entity 통합**: 통합 view 신규 PR (다음 세션 P0).

### 기술 학습

- `transition-all` + dnd-kit transform 충돌 → `transition-colors` specific
- `<DragOverlay dropAnimation={...}>` polish (cubic-bezier easing + sideEffects fade)
- Cherry-pick id-dedup pattern (Wiki v130 = Books v127 패턴 정합)
- 빈 group default hide의 kanban UX 부작용 (groupBy 분기 필수)
- Helper extraction = callback prop (dumb component), 항상 동일 store action은 직접 호출 OK

---

## 🚀 2026-05-12 (저녁~밤, 거대) — Books view-engine polish 6 PR + emoji 영구 폐기 + Pin 통일 ⭐⭐⭐⭐⭐

**범위**: 1 worktree, 오후 시리즈에 이어 사용자 manual verify 흐름과 강하게 결합. 6 추가 PR (#296-#301). Store v126 → v129.

### 핵심 결정 (영구)

**1. emoji 영구 폐기 (PR #298)**: Plot icon = Phosphor outline only. Apple/Unicode emoji 폐기. BookKindIcon이 cover 책임.

**2. Books 자체 정체성 = kind 유지**: status 도입 거부. normalizeViewState books-specific validation으로 stale "status" 자동 reset.

**3. BookKindChip = StatusBadge 패턴**: Smart=violet / Manual=neutral / Hybrid=amber. 색 + bg 18% + border 35% + icon + label.

**4. Pin 통일 모든 entity**: 우클릭 + 플로팅 바 + inline indicator. batch UX = mixed → pin.

**5. Plot ViewHeader actions 표준 = Save view 버튼**: Trash chip 거부 (Books). trashed 책은 /trash 페이지.

**6. Books DisplayPanel**: 4 properties toggle (Item count / Kind / Sources / Pin), groupingOptions = [none/kind/pinned].

### 기술 학습

- emoji 데이터 wipe migration 패턴 (필드 보존 + UI 안 읽음)
- CONTEXT_VALID_GROUP_BY entity-specific validation
- store version bump = normalize 재실행 트리거
- id-dedup append backfill (사용자 기존 데이터 보존 + 시드 추가)
- BookKindChip vs BookKindIcon 분리 (색이 시각 분리 도구)

---

## 🚀 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode ⭐⭐⭐⭐⭐

**범위**: 1 worktree (`suspicious-williamson-3670e0`). 4 PR 시리즈 통합. Store v122 → v126. ~1200 net LOC.

### 4 PR 요약

1. **PR 1 (v123)** — 인프라 + grid 보존. `useBooksView` thin fork hook. 시각 변경 0.
2. **PR 2 (v124)** — list mode + sort/group/filter UI + 3 PropertyChip (BookItemCountChip / BookKindChip / BookSourceKindChip mini-bar). ViewHeader Search/Filter/Display popover 활성화. pinned-first sort.
3. **PR 3 (v125)** — board mode (Option A: column drag + card drag, dnd-kit, NotesBoard 패턴). groupBy kind (Smart/Hybrid/Manual) / pinned. card drag UX: pinned 즉시 toggle, kind smart→manual confirm, kind manual→smart toast hint.
4. **PR 4 (v126)** — gallery mode (entity-agnostic adapter). 2026-05-11 GalleryView 재사용. kind-based accent color.

### 큰 결정 (영구)

**1. 사용자 결정 4가지 (AskUserQuestion 2026-05-12)**: PR 분할 C / viewMode grid default / sort updatedAt desc / groupBy none.

**2. Option A — Plot 일관성 풀**: Notes/Wiki와 동일 dnd-kit 패턴. card drag의 destructive 행동은 confirmation 안전화.

**3. Smart Book INVARIANT 보존**: resolver / BookDetailPage / SourcesSection 동작 변화 0.

**4. thin fork 패턴 영구**: useBooksView가 8번째 thin fork. Generic 추출 X (Plot 영구 결정).

**5. 마이그레이션 옵션 A 영구 (idempotent)**: 모든 4 store version (v123-v126) 데이터 변경 0, types union 확장만.

**6. launch.json `npx next` 전환**: 한글 경로 안전성. `node node_modules/.../next` 직접 호출은 일시적 module resolution 실패 가능.

### 기술 학습 (영구)

- **VALID_VIEW_CONTEXT_KEYS 확장만으로 자동 마이그레이션**: `normalizeViewStatesMap`이 normalize 진입 시 default 채움. 명시적 마이그레이션 코드 불필요.
- **NotesBoard column drag 패턴**: `SortableContext` + `horizontalListSortingStrategy` + `useSortable({ id: col-${key} })` + `useDroppable({ id: groupKey })` for cards.
- **확인 다이얼로그 + 토스트 분기 UX**: destructive (smart→manual) = confirm; non-destructive (manual→smart) = toast hint.
- **`.next/dev` stale cache**: build/dev 충돌 시 `rm -rf .next/dev .next/cache` 후 dev server 재시작.
- **dangling JSX 삽입 회피**: 큰 분기 추가 시 Read → helper component 추출 (BookGridCard / EmptyBooks) → Edit.

---

## 🚀 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic ⭐⭐⭐⭐⭐

**범위**: 9 카테고리. 단일 worktree (`lucid-agnesi-b963f3`). 27 files (+735 / -847), 2 파일 삭제.

### 9 카테고리

1. **이슈 2 — 책 목차 드롭다운 (kind + status icons + 색 버그 fix)** — BookContextNav에 Note/BookOpen + StatusShapeIcon/IconWikiStub/Article 추가. NOTE_STATUS_COLORS stale var fix
2. **이슈 3 — NoteEditor BookContextNav 좌측 통일** — 노트/위키 동일 layout
3. **이슈 4 — BookWikiReader article breadcrumb** — "Books > Title"
4. **Read mode ←/→** — NoteEditor + BookWikiReader + SecondaryWikiArticle 모두 + ⌘[ ⌘] modifier 공존
5. **이슈 1 — 책 Split View 풀 지원 (~4h)** — secondary pane에 책 detail/reading mount, 5 케이스 모두 동작
6. **Dual mode 완전 폐기 (10 파일, Store v122)** — Split view + list로 충분, 중복 제거
7. **갤러리 entity-agnostic 리디자인** — Notes/Wiki/References 통합, Plot 토큰, 클릭=풀에디터, 그라데이션 cover (warm sand)
8. **View-engine 그룹핑 + 그룹 헤더 아이콘 통일** — Notes Table/Board/Gallery 모두 같은 아이콘 패턴
9. **Status 색 강화 (다크 모드)** — Stone toasted sand (warm earthy), Brick amber-500, Keystone teal-400

### 큰 결정 (영구)

**1. Dual mode 폐기 LOCKED**: Split view + list mode + editor pane 조합으로 dual mode 대체 가능. v3 mockup 결정사항이지만 Plot 정체성과 충돌. v122 migration으로 사용자 데이터 자동 fix.

**2. 갤러리 = entity-agnostic generic**: GalleryItem interface로 Note/Wiki/Reference 통합. v3 `u-*` CSS 클래스 영구 폐기.

**3. 단일 클릭 = 풀 에디터**: Plot 표준. List/Board/Gallery 일관.

**4. Books split view 풀 지원**: 5 케이스 모두 secondary pane 인프라 활용. URL primary 전유 + store-driven secondary.

**5. Stone 색 = toasted sand**: warm earthy stone tone. neutral gray(zinc) 폐기. brick(orange)과 같은 따뜻한 군.

**6. 그룹 헤더 아이콘 view 간 통일**: list/board/gallery 모두 같은 아이콘 패턴.

**7. 키보드 단축키 두 패턴 공존**: ⌘[/⌘] (modifier) + ←/→ (read mode only).

### 기술 학습 (영구)

- NOTE_STATUS_COLORS stale CSS var bug (chart vars → status vars, 1줄 fix로 전체 일관성)
- `e.target` window일 때 `closest` undefined (synthetic event 방어)
- WorkspaceEditorArea NotesTableView 전용 (layout.tsx가 외 처리)
- SecondaryPanelContent priority (books route > secondaryNoteId)
- notes-table GroupHeaderIcon label vs groupKey 차이
- `.gallery-cover` + `--cover-color` 변수 (CSS class light/dark 분기)

### 큰 작업 다음 후보

- **Books view-engine 풀 통합** — filter (컨텐츠 타입/Smart vs Manual/Pinned) + sort + group + view modes (grid/list/gallery/board). 사용자 brainstorm 중. ~5-6h
- **Wiki 그룹 헤더 아이콘** — WikiList/WikiBoard 미적용 (~30분)

---

## 🚀 2026-05-10 (마라톤) — Phase A polish + Smart Book Phase A + 책 reading flow ⭐⭐⭐⭐⭐

**범위**: 9 작업 + 12 polish iteration steps. 단일 worktree (`distracted-heyrovsky-f06ba0`)에서 누적. 33 files (+1289 / -187), 4 신규 파일.

### 9 카테고리 작업

1. **/trash 페이지에 Books 통합** (`components/notes-table.tsx`) — TrashFilter union/TRASH_TABS/TrashEntityList/카운트/렌더 분기 books 추가
2. **Path B Step A** (`app/globals.css`) — `.a-th, .a-row` 6-col grid hardcoded 제거, chrome-only로. PR #282/#283 사례 회피
3. **Dual mode pane gating + i18n** (`hooks/use-effective-view-mode.ts` + `components/dual/dual-list-editor.tsx`) — secondary pane은 dual 비활성 (PRD §LOCKED #9 정확 구현). 한글→영어 5 strings
4. **⌘⇧E pane-aware fix** (`hooks/use-global-shortcuts.ts`) — secondary focus면 no-op + toast hint
5. **DisplayPanel "Dual" 버튼 disabled in secondary** (`components/display-panel.tsx`) — PRD §LOCKED #9 3-layer 일관 종결 (시각/입력/UI)
6. **Smart Book PRD** (`.omc/plans/smart-book-prd.md` 656 line) — draft → revision → 2x critic 통과. 12 LOCKED decisions
7. **Smart Book Phase A** (10 sub-steps) — Step 1 + 2.1-2.9 + Tweaks A/B/C
8. **책 reading flow** (Step 2.10-2.11) — Read 버튼 + read mode + ←→ + TOC dropdown
9. **책 reading flow polish** (Step 2.12-2.21) — sidePanel/cleanup/풀폭 fix iteration

### Smart Book Phase A 10 sub-steps

```
Step 1   — Schema (AutoSource) + Store API (5 methods, LOCKED #12 dedup) + v121 migration
Step 2.1 — Resolver pure function (folder source only, +14 tests)
Step 2.2 — BookDetailPage 통합 (resolver useMemo + drag/up-down auto guard)
Step 2.3 — SourcesSection UI (folder picker + add/remove)
Step 2.4 — AddItemDialog "Smart" 탭
Step 2.5 — BookItemRow source-aware (visual + remove branch)
Step 2.6 — Tweak A: empty source heading hide (LOCKED #10 v1.2)
Step 2.7 — Tweak B: manual override source badge
Step 2.8 — Tweak C: folder picker preview count
Step 2.9 — In-book navigation includes auto items (resolvedContentItems)
```

### 책 reading flow (Step 2.10~2.21)

```
2.10 — "Read from start" button + NoteEditor defaultReadMode + BookDetailPage mount NoteEditor
2.11 — ←→ arrows (CaretLeft/Right) + TOC dropdown (page list with active highlight)
2.12 — Books reading 진입 시 sidePanel force close (full-width)
2.13 — BookDetailPage cleanup unmount (bookContext + selectedNoteId clear)
2.14-16 — max-w iteration (제거 → restore → wider)
2.17 — BookDetailPage list-mode pattern (max-w 완전 제거 = 풀페이지 default)
2.18 — layout.tsx isViewRoute include /books/* sub-routes (FALLBACK double-mount 50% fix)
2.19 — Empty infobox auto-hide (showInfoboxRail = !preview && (hasContent || editable))
2.20 — BookWikiReader root w-full flex-1 (81% → 100% width)
2.21 — BookWikiReader full wiki chrome (Aa font / collapse / WikiLayoutToggle / Edit/Done)
```

### 큰 결정 (영구)

**1. Plot 모토 = 풀페이지 default** (mx-auto + max-w 제한 없음). 우측 SmartSidePanel은 opt-in (⌘B 토글). NotesView/WikiView/BookDetailPage 모두 동일.

**2. Books reading flow = books route 유지**:
- /books/{id} URL 그대로 유지하면서 BookDetailPage가 NoteEditor / WikiArticleView 직접 mount
- handleOpen wiki branch도 setSelectedNoteId 직접 사용 (route 변경 X)
- BookDetailPage cleanup unmount 시 bookContext + selectedNoteId clear

**3. layout.tsx `isViewRoute` 정의 보강**:
- VIEW_ROUTES include만으로는 `/books/{id}` 같은 sub-route 누락
- `activeRoute.startsWith("/books/")`, `startsWith("/library/")` 추가
- Fallback children div가 BooksView와 동시 mount되어 50% 폭 stealing 버그 fix

**4. Empty infobox 자동 hide**:
- 이전: `showInfoboxRail = !preview` (항상 22% 차지)
- 지금: `!preview && (hasInfoboxContent || editable)` — read 모드 + 비어있으면 hide
- 본문이 22% 회수 → wider reading

**5. Smart Book INVARIANT** (§2):
- Book.items kind = "note" | "wiki" | "chapter-heading"만
- AutoSource는 공급원, 멤버 kind 아님
- folder/category/tag/label/sticker 모든 source가 note/wiki만 filter

**6. Smart Book LOCKED #5c** — Manual top, Auto bottom (lastManualOrder seeding). LOCKED #10 v1.2 — empty source = silent skip (orphan heading 어색). LOCKED #12 — addSmartSource dedup guard (boolean return).

**7. PRD §LOCKED #9 3-layer 일관** — 시각 fallback (useEffectiveViewMode) + 입력 가드 (⌘⇧E) + UI 가드 (DisplayPanel Dual 버튼).

### 기술 학습 (영구)

- **flex item w-full / flex-1 누락 시 contents 폭만** — `<div className="flex h-full flex-col">`은 부모 폭 안 채움. `w-full flex-1` 필수
- **Layout fallback double-mount** — `isFallback` 정의가 sub-route 누락하면 children + view 둘 다 visible → flex-1로 50%씩
- **Resolver의 manual/auto fractional key** — `lastManualOrder` 추출 후 auto 시퀀스 시작 (`generateKeyBetween(lastManualOrder, null)`) → manual top + auto bottom 자연 보장
- **Multi-source dedup** — `seenAutoRefIds` Set으로 첫 source 우선 (LOCKED #11)
- **`Folder.kind = "note" | "wiki"`** — 폴더에는 note 또는 wiki만 (둘 다 X). Smart Book Phase A는 `kind="note"` only
- **`Note.folderIds` reverse N:M** — Folder엔 noteIds 없음, Note에서 forward reference
- **`WikiArticle.categoryIds: string[]`** — DAG 다중 부모 (scalar X)
- **Folder hard-delete only** (`lib/store/slices/folders.ts:54-82`) — trash 시스템 없음
- **WikiArticle hard-delete only** — wiki는 trashed 필드 없음 (Phase B 진입 전 검증)
- **HMR 한계** — note-editor / book-detail-page 같이 큰 파일 변경 시 HMR 못 잡고 stale view. dev server 재시작 또는 hard reload 권장

### 다음 세션 P0 (사용자 명시)

1. **Close 버튼** — 위키에만 있는데 노트에도 추가할지 vs 그냥 없애기 (의논 필요)
2. **Books 뒤로가기 별로** — 위키처럼 타이틀 헤더 아래 sub-nav 패턴 (`← All / Articles / Stubs`) 적용 검토
3. **Books 리스트 무조건 그리드** — list mode/grid mode 통일 검토
4. **Edit 버튼 색상/폰트** — 책 안 wiki reading의 Edit 버튼이 일반 wiki view와 색상/사이즈 다름 → 통일 필요

### 환경 변경

- Store version 120 → 121 (Smart Book migration: smartSources/excludeIds defaults)
- 신규 파일: `.omc/plans/smart-book-prd.md`, `lib/books/resolver.ts`, `lib/books/__tests__/resolver.test.ts`, `components/books/sources-section.tsx`
- Tests: 246 → 255 (+9 utils.test, +11 books-slice.test, +14 resolver.test)
- Build: ✅ exit 0 / TSC: ✅ 0 errors / Tests: ✅ 255/255

### Architect 검증

총 7회 진행:
- /trash Books 통합 (APPROVED)
- Path B Step A (APPROVED)
- Dual mode i18n + secondary fix (APPROVED + N1-N6 minor)
- ⌘⇧E pane-aware (APPROVED)
- DisplayPanel Dual 버튼 (APPROVED + defense-in-depth 검증)
- Smart Book PRD critic 2회 (NEEDS REVISION → APPROVED)
- Smart Book Phase A step별 (Step 1, 2.1, 2.2, 2.3, 2.4, 2.5, 종결)

---

## 🚀 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (~45 변경) ⭐⭐⭐⭐⭐

**범위**: 단일 squash PR로 머지. polish 시리즈 + Path A 완성 + Book/Dual 두 entity 도입 + plot-frontend plugin install.

### 머지 예정
- 단일 squash PR (`session: Book entity + Dual mode + Filter Path A 완전 종결`)
- 49 files (+1912 / -1512)
- 5 파일 삭제 (Studio/Editorial/ViewSwitcher/Cuboid 1×2)
- ~10 신규 파일 (DualListEditor, BookDetailPage, BookItemRow, AddItemDialog, books-view, in-books-section, books slice/utils, BookContextNav, useBookContextNav, useEffectiveViewMode)

### 큰 결정 (영구)

**1. Books 색상 = Burgundy `#be123c`** (rose-700, 6 다른 space와 distinct).

**2. Book entity = cross-entity ordered sequence**:
- 4사분면 컨테이너 모델 마지막 자리 (Sticker=unordered, Book=ordered)
- Heading-as-divider 단일 데이터 모델 (flat + nested 자연스럽게 통합)
- N:M 다중 멤버십, 책 내 dedup
- fractional-indexing string order
- Smart Book = AutoSource는 v2 (별도 PRD)

**3. Dual mode = "Split" 이름 회피**:
- 기존 NoteSplitOverlay와 충돌 → "Dual" rename
- DisplayPanel "Dual" mode entry + ⌘⇧E 단축키
- 1200px viewport 자동 fallback (transition-only debounced toast)
- Pane-scoped state (primary 전용 MVP), URL 비동기 (mac Mail 패턴)
- NoteSplitOverlay 우선순위 (z-40 overlay)

**4. Filter coverage Path A 완전 종결 — 6 entity** (Files/References/Wiki Category/Tags/Inbox/Stickers).

**5. Plot 사이드바 active icon = 공간별 색상** (data-active-space 기반).

### 기술 학습 (영구)

- **fractional-indexing**: sparse integer halving underflow 회피. lexicographic key 사용.
- **VALID_VIEW_MODES**: TS union만 update하면 IDB hydration 시 silent fallback. 두 곳 (union + array) 같이 update 필수.
- **autoSaveId**: react-resizable-panels controlled X. autoSaveId로 라이브러리 자체 persistence.
- **SSR-safe hook**: mounted guard + transition-only debounced toast로 hydration mismatch + resize spam 회피.
- **Critic 가치**: PRD 신선할 때 review = mid-implementation pivot 위험 회피. 두 PRD 모두 6 issues 정확히 잡음.

### 환경 변경
- Store version 119 → 120 (v120 = Books migration)
- npm: `fractional-indexing@^3.2.0`
- Plugin global: `plot-frontend@plot-frontend`

### 다음 우선순위 (P0)
- Smart Book (Phase 5) — AutoSource resolver, 별도 PRD (~4-5h)
- /trash 페이지 books section 통합 (~1h)
- Path B Step A — globals.css `.a-th/.a-row` 6-col grid hardcoded refactor (~1.5h)
- 나무위키 인포박스 고도화 Tier 1 (~3-4h)
- 다중 기기 sync Phase 1 (PRD LOCKED, ~몇 세션)

---

## 🚀 2026-05-08 (오후) — Status icons + Phase 4.3 north star (5 PR + docs sync) ⭐⭐⭐

**범위**: PR #271 (Status icons rework) + PR 4.3a 시도→revert→정리 cycle (#282 → #283 → #284) + plan Section 11 Filter coverage 분석 (#285) + docs sync (이 PR).

### 머지된 PRs
- ✅ **#271** — Status icons + UI 라벨 "Block" + Cuboid (1×2 isometric block) + Save view 16px (HBtn pattern). 4 atomic commits + merge resolution
- ✅ **#282** — PR 4.3a Tags+Labels chrome 통일 (`.a-th` + `.a-row`) 시도
- ✅ **#283** — PR #282 partial revert (`.a-row` 6-col grid 강제로 layout 깨짐)
- ✅ **#284** — Tags row border-b 제거 + plan Section 9-10 (lessons + roadmap)
- ✅ **#285** — plan Section 11 Filter coverage 분석 (Step 1-5)

### 영구 결정 (이번 세션)

**1. Filter model 통찰 (★ 사용자 직관, 영구 north star)**:
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
- Filter 없는 view = 도메인 attribute 부족
- column 추가 → Filter 자연스레 가능
- Phase 4.3 chrome 통일의 진짜 의미: visual + filter/column model 통일

**2. NoteStatus enum value `keystone` 유지** (UI만 "Block"):
- 내부 코드 `keystone` 그대로 (URL `/keystone`, IDB, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier 충돌 회피
- mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)

**3. Cuboid 컴포넌트** (`components/icons/Cuboid.tsx`):
- 1×2 isometric block (두 큐브가 한 면 공유). 11 line elements (outer hexagon 6 + Y junction 3 + cube divider 2)
- 256 viewBox + 16px padding + Phosphor wrapper API
- `IconBlock` = `<Cuboid weight="regular" />` 단순 wrapper

**4. View modes 평가** (사용자 회의 직관):
- Studio + Editorial: 영구 규칙 #1 위반 + TODO 폐기 항목 ("매거진 pivot 폐기 2026-04-22") 부활 → **제거 예정** (Path C)
- Gallery: 카드 형태는 좋음. 단 (1) 편집 X (2) 하드코딩 styling (cream 강제) → **polishing 후 재도입** (Path D)
- 통합 방향: Display popover `[List | Board | Gallery]` 3-segment + ViewSwitcher tab 제거

**5. `.a-th, .a-row` grid hardcoded 발견 + refactor 필요**:
- globals.css에서 6-column grid template (notes-table 전용) 강제
- NotesTable inline grid로 덮어씀 → OK / 다른 view (3-element flex) → layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임

**6. Filter coverage 도메인 분석** (entity별):
- 명확 가치: Files (type), References (type), Wiki Category 보강, Inbox (source)
- 일관성 추가: Tags / Labels color
- Filter 없는 게 자연스러움: Insights (analytics)

### 다음 우선순위 (P0)
- ⭐ **Path A Step 1** — Files type filter (가장 작고 명확)
- **Path B Step A** — globals.css `.a-th/.a-row` refactor (chrome 통일 prerequisite)
- **Path C** — Studio + Editorial 제거 (영구 규칙 위반 cleanup)

---

## 🚀 2026-05-07 (밤) — Mockup 직접 서빙 + PanelsMenu 통합 (PR #281, 5 commits) ⭐⭐⭐

**큰 발견**: Mockup HTML을 dev server로 직접 서빙해서 작동 분석 가능. 이전 코드만 읽기 vs 작동 보기 = 인터랙션 spec 추출 차이 큼.

### Mockup 직접 서빙 setup
- `.claude/launch.json` mockup config 추가 (port 3003, npx serve)
- preview MCP로 Plot v3.html 작동 → 인터랙션 spec 추출

### 추출된 spec
- 4-panel toggle (actbar/sidebar/list/detail)
- PanelsMenu 햄버거 patterns (Show all / Hide all preset)
- Filter popover Linear 2-column
- `.a-shell` grid CSS var driven
- 단축키 ⌘⇧\ / ⌘\

### PR #281 누적 (5 commits — actbar + UI cleanup)
1. Activity bar collapse + edge re-open
2. Save view 단어 제거 (모든 view)
3. ⌘⇧A 단축키
4. (이전 commit 포함)
5. **PanelsMenu (햄버거) 통합** — 분산 close button 폐기

### 영구 결정
1. **Mockup-first 한계** (layout mockup, typography Plot)
2. **Mockup 직접 서빙으로 인터랙션 분석** (다른 Claude 만들기 X)
3. **PanelsMenu 통합 패턴** (분산 close button 폐기)
4. **단축키 매핑**: ⌘⇧F sidebar / ⌘⇧A actbar / ⌘B side panel / ⌘\ split

### 다음 우선순위
- 🔴 PR #281 머지
- 🟡 Phase 6 본 작업 (Filter popover + .a-shell grid)
- 🟡 Phase 5.4 Graph

---

## 🚀 2026-05-07 (저녁/밤) — v3 Phase 4.2 + Phase 5 4 PR + mockup-first 패턴 정착 ⭐⭐

**범위**: v3 visual refresh 대규모. Inbox 시리즈 후 notes-table reskin + Gallery + Studio + Editorial. 사용자와 토론으로 mockup-first 한계 명확화.

### 머지된/OPEN PRs
- ✅ #276 Phase 4.2 — notes-table reskin (.a-* row chip)
- ✅ #277 Phase 5.1 — Gallery (warm canvas + cards)
- ✅ #278 Phase 5.1b — Table/Board .u-mode shell
- ✅ #279 Phase 5.2 — Studio (dark + SRS) + 7 mockup-first fixes
- 🔵 #280 OPEN Phase 5.3 — Editorial (magazine 룩)

### 큰 영구 결정 ⭐⭐

**Mockup-first 한계 명확화**:
- 사용자 통찰: "디자인만 가져오기, 기능 살리기"
- mockup의 layout/structure는 가져오되 이미 잘 잡힌 Plot 디자인은 보존
- mockup vs Plot 결정 매트릭스 (영구):
  - Layout / cell / shell / card / chip → mockup
  - Header typography / Status badge / Memo label / spacing → Plot

### 4 view modes 완성 (Phase 5)
- Gallery: oklch hue cards
- Studio: dark forced + SRS segments
- Editorial: Source Serif 4 magazine spread
- Graph: 대기 (PR 5.4)

### Phase 진행
- ✅ Phase 0/1/3/4.1/4.2 머지
- ✅ Phase 5.1 / 5.1b / 5.2 머지, 5.3 OPEN
- ⏳ 5.4 Graph
- ⏳ Phase 6 (Filter Popover + Workspace Chrome)
- ⏳ Phase 7 (QA + cleanup)

### 다음 우선순위
- 🔴 PR #280 머지
- 🟡 Phase 5.4 Graph (마지막 view mode)
- 🟡 Phase 6 / 7

---

## 🚀 2026-05-07 (오후) — Phase B Inbox Layer 시리즈 완성 (4 PR) ⭐

**범위**: 새 worktree `magical-curie-ad6175`. Inbox layer 4 PR (3 머지 + 1 OPEN). entity-based → action-based 큰 방향 전환.

### 큰 방향 전환 (영구) ⭐
- **v1 plan 폐기 → v2 action-based 채택**
- v1 entity-based "stone+미분류" 필터가 Memo backfill 정책으로 항상 0 항목 (실측)
- 사용자 통찰: "스톤은 인박스가 아니야. 리니어의 인박스처럼."
- v2: action notification queue — "내가 *반응*해야 할 일들"

### 5 sources 완성
1. **reminder** — Note.reviewAt 도래
2. **srs** — srsStateByNoteId.dueAt 도래
3. **snooze-expired** — snoozedInboxItems 만료 재노출
4. **wiki-redlink** — unresolved [[wiki-link]] (refs >= 2)
5. **auto-enroll** — clusterSuggestions (status === pending)

### 머지/OPEN PRs
- **#272** ✅ infra (action-based dismiss/snooze + reminder source) + IDB v117 + plan v2
- **#273** ✅ home inbox card with reminder source
- **#274** ✅ /inbox full-page + srs/snooze-expired sources + dismiss/snooze hover button
- **#275** 🔵 OPEN — sidebar entry + wiki-redlink/auto-enroll + InboxSourceIcon dedup

### 완성된 인프라
- `lib/store/slices/inbox.ts` — InboxItemKind type + 5 actions
- `lib/hooks/use-inbox.ts` — 5 sources unified, dedup/dismiss/snooze 필터
- `components/inbox/inbox-source-icon.tsx` — 공용 kind→icon 매핑
- `components/views/inbox-view.tsx` — full-page (filter tabs + popover snooze + toast undo)
- `components/linear-sidebar.tsx` — Home space sidebar Inbox link
- IDB v117 migration

### 영구 결정 (이번 세션)
1. **Inbox = action notification queue** — entity-based 폐기. Linear 정합.
2. **dismiss/snooze identifier = (kind, sourceId)** — 5 source 호환
3. **InboxItemKind ≠ EntityKind** — kind = "왜 inbox에 있는가" (action source)
4. **wiki-redlink threshold = 2** — noise 방지
5. **Sidebar Inbox link = Home space만**

### 기술 학습
- **Memo backfill 함정**: createNote가 항상 Memo 자동 부여 — entity-based "no label" 필터 무효화
- **VIEW_ROUTES 등록 필수**: 새 always-mounted route는 `lib/table-route.ts`에 추가
- **InboxItemKind 분리**: EntityKind와 명확 구분 — semantic 명확화

### 다음 우선순위
- 🟡 Phase 4 PR 4.2+ (notes-table.tsx reskin, stone/brick/keystone 명칭)
- 🟡 Wiki template 3-layer
- 🟡 Smart Book v2 (AutoSource[5])
- 🟢 (옵션) Inbox-5: SRS review mode 진입, mobile, grouping by date

---

## 🚀 2026-05-08 (새벽) — NoteStatus rename + Inbox layer 결정 (plan 작성)

**범위**: PR 4.1 (Phase 4 CSS 통합) 머지 + 2 plan 작성 (Phase A rename + Phase B Inbox layer). 작업은 다음 세션.

### 큰 결정 (영구)

**1. NoteStatus 명칭 변경 (Phase A)**:
- `inbox/capture/permanent` → **`stone/brick/keystone`** (건축 메타포)
- atomic 단일 PR (53 files / 274 occ). IDB v116 migration.

**2. Inbox 개념 분리 + 단일 통합 (Phase B)**:
- inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- **하나의 inbox** = 모든 entity 통합 (per-entity 분산 X)
- 위치: home 안 카드 + `/inbox` full-page
- 정의: 하이브리드 (자동 entity별 필터 + dismiss/snooze)

### Phase 진행 상황
- ✅ Phase 0/1: cleanup + token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ Phase 3: Activity Bar / Sidebar Chrome
- ⏳ Phase 4: Table Mode Reskin
  - ✅ PR 4.1 (CSS 통합)
  - ⏳ PR 4.2+ — NoteStatus rename 후
- ⏳ Phase A (NoteStatus rename) — 다음 세션
- ⏳ Phase B (Inbox layer) — Phase A 완료 후

### 다음
- 🔴 Phase A: NoteStatus rename (단일 atomic PR)

---

## 🚀 2026-05-07 (밤 늦게) — Plot v3 Phase 3 완료 (4 PR)

**범위**: Activity Bar / Sidebar Chrome v3 mockup reskin. 4 PR 누적.

### Phase 3 4 PR
- **98f9277** PR 3.1: CSS 통합 (시각 변경 0, +729 LOC)
- **5ac22ef** PR 3.2: activity-bar.tsx reskin (width 72px / label / brand / per-space 색)
- **8155530** PR 3.3: linear-sidebar.tsx reskin (+43/-61, NavLink + Section + 11 inline 일괄)
- **3761e42** PR 3.4: brand mark = Plot 로고 SVG (네트워크 그래프)

### PR 3.4 scope 변경 (영구)
- shell grid 보류 → Phase 6 통합 (ResizablePanel 충돌)
- brand mark SVG 교체로 전환

### 다음
- 🔴 Visual confirm (사용자 manual)
- 🟡 Phase 4 / 5 / 6 결정

### Phase 진행 상황
- ✅ Phase 0/1: cleanup + token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ **Phase 3: Activity Bar / Sidebar Chrome** (이번)
- ⏳ Phase 4-7

---

## 🚀 2026-05-07 (밤) — Group C PR-D 5/5 완성 + 4 design skills install

**범위**: PR 3 Stickers + PR 4 References + PR 5 Files + skills install. Group C PR-D 시리즈 종료. Store v112 → v115.

### 머지된 PRs (이번 세션)
- **a055581 v113** — Stickers view-engine 통합
- **c3700ad v114** — References view-engine 통합 (첫 non-Note entity)
- **f210fcf v115** — Files view-engine 통합 (시리즈 완성)

### 디자인 인프라 보강
- **0f7e2ec** — taste-skill 4개 install (project-level): design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
- universal symlink (12 agents 호환). cross-machine sync는 `npx skills experimental_install`

### Group C PR-D 시리즈 완성 🎉
5 entity (Tags / Labels / Stickers / References / Files) 모두 view-engine + ViewHeader + viewState persist + list/grid mode 통합. thin fork 패턴 정합. Saved View 자동 지원.

### 외부 도구 평가 (적용 X 결정)
- **onlook** (visual code editor): production app 자동 코드 변경 회귀 위험
- **Front-End-Design-Checklist**: design-quality-gate / 4 design skills과 중복

### shadcn-ui 확인
✅ 이미 적용 (components.json + components/ui/* 30+ + @radix-ui 28개)

### Store version
v112 → v113 (Stickers) → v114 (References) → v115 (Files)

### 다음 우선순위 (NEXT-ACTION.md 참조)
- 🔴 Plot v3 Phase 3+ 분해 plan
- 🟡 Wiki template 3-layer
- 🟡 Smart Book v2

---

## 🚀 2026-05-07 (밤) — Plot v3 Phase 2 DEFERRED (큰 방향 결정)

**범위**: Phase 2 (Imperial icon kit) 도입 **보류** 결정. PRD 상단 DECISION banner + plan 문서 ARCHIVED.

### 결정 (영구)
- **Imperial icon kit 전면 도입 보류**: phosphor-icons 그대로 유지
- 직전 plan 문서 (`.omc/plans/v3-phosphor-inventory.md`) **부정확** ("2 files / 4 icons" → 실측 **119 files / 60+ icons / 87 files weight 사용**, `from "@phosphor-icons/react/dist/ssr/<X>"` 패턴 미반영)
- 119 files = 단일 PR로 안전하지 않음 (작업 원칙 #2 "최소 diff" 위배)
- phosphor `weight="regular"` (1.5–1.7px stroke) ↔ Imperial (1.5px stroke) 시각 위화감 미미 → Imperial 도입의 시각 가치 약함
- 빌드 정상 (`tsc --noEmit` 0 errors / `npm run build` clean / 185 tests pass)
- lucide / 다른 외부 라이브러리 도입은 의미 없음 (이미 phosphor 광범위)

### 처리한 작업
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` 상단 **DECISION banner 추가**, §0 TL;DR Imperial 항목 strike-through + DEFERRED 표시. Status v1.1 → v1.2 (Phase 2 deferred)
- `.omc/plans/v3-phosphor-inventory.md` **ARCHIVED banner 추가**, historical reference로 보존 (삭제 X)
- `docs/CONTEXT.md` / `docs/MEMORY.md` 결정 기록

### 보존된 partial work (revert 안 함)
- `components/icons/imperial.tsx` + `imperial-extras.tsx` 모듈 보존 (활동바 등 일부 사용 중)
- `components/activity-bar.tsx` Imperial migration
- `components/plot-icons.tsx` `IconWiki = WikiBook` (Imperial extras)
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` 일부
- `components/side-panel/backlink-card.tsx` weight 제거

### 재개 조건 (future Phase)
- 정확한 phosphor 인벤토리 재작성
- imperial-extras shim의 phosphor 매핑 coverage 검증 (60+ icons 중 매핑 가능 비율)
- 단일 책임 PR 단위 분할 (페이지 그룹별 5–10 PR 시리즈)

### 다음 P0 (Phase 2 종료, 다음 우선순위 이동)
- **Group C PR-D PR 3-5**: Stickers→Pack / References / Files view-engine 통합
- 또는 **Plot v3 Phase 3+**: PRD 후속 phases (Notion/Linear 하이브리드 에디터, Type rename PR 등)

---

## 🚀 2026-05-07 (저녁) — Phase 2 부분 진행 (Imperial icon kit)

**범위**: Imperial icon kit 모듈 작성 + 일부 파일 migration. 사용자가 위임 거절 시점에 부분 완료 상태.

### 완료
- `components/icons/imperial.tsx` 신규 (Imperial 80+ icons, 1.5px stroke, currentColor, `weight: never` 의도적 typing)
- `components/icons/imperial-extras.tsx` 신규 (Plot 도메인: WikiBook, OntologyWide, Bookshelf 등)
- `components/activity-bar.tsx` — phosphor SSR (Graph/Books/BookOpen/SidebarSimple) → Imperial 교체
- `components/plot-icons.tsx` — `IconWiki = BookOpen` (phosphor) → `WikiBook` (Imperial)
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` — lucide → Imperial 일부
- `components/side-panel/backlink-card.tsx` — `weight="regular"` 제거 (Imperial weight: never 충돌 fix)

### 잔여 (다음 세션 0.5일)
- 5+ files / 85+ occurrences `weight=` 잔존 (calendar-view.tsx, display-panel.tsx, filter-bar.tsx, board-workbench.tsx, color-picker-grid.tsx 외)
- lucide / iconoir / tabler / remixicon 잔존 사용처
- imperial-extras.tsx의 Plot 도메인 icon SVG 정확성 검증

### 검증
- `tsc --noEmit`: 0 errors (backlink-card fix 후)
- `npm run build`: clean
- `npm run test`: 185 pass (0 regression)

---

## 🚀 2026-05-07 — Plot v3 Phase 1 (token foundation) 완료

**범위**: v3 design tokens 통합 + Q1-Q3, Q8 LOCKED 결정 적용 + Source Serif 4
font 추가 + `_legacy/` 폴더 마련.

### Phase 1 결과 (완료)

| Task | 내용 |
|------|------|
| 1.1 Token Cascade Map | `app/globals.css` 토큰 → 사용처 분석. v3 신규 토큰 모두 grep 0 hits (충돌 없음). Plot 기존 토큰은 shadcn/ui 40+ 컴포넌트 의존 — 100% 보존 정책 확정. `.omc/plans/v3-phase-1-cascade-map.md` 산출. |
| 1.2 globals.css 통합 | v3 신규 토큰 추가 (`--bg`, `--fg`, `--soft-fg`, `--bg-elev`, `--space-*`, `--status-*`, `--shadow-*`, `--font-2xs..3xl`, `--r-2..12`, `--t-fast/mid/slow`, `--accent-soft`). Plot 기존 토큰은 그대로 (shadcn cascade 보존). `@theme inline`에 v3 토큰 노출. |
| Q1 SPACE_COLORS | Plot 유지 (notes=cyan, wiki=violet, calendar=pink 등). v3 mockup 값 적용 안 함. |
| Q2 --accent | light `#4f46e5 → #5E6AD2`, dark `#818cf8 → #7C8AE7`. cascading: `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--toolbar-active` 따라 변경. (의도된 시각 변화) |
| Q3 NOTE_STATUS_HEX | inbox `#22d3ee → #6B7280`, capture `#f97316 → #D97706`, permanent `#22c55e → #0E9384`. desaturated 톤. |
| Q8 --v3-priority-* | Phase 0의 unset 자리에 v3 mockup 값 채움: high `#DC6803`, medium `#5E6AD2`, low `#98A2B3`. Plot `--priority-*` 5-tier 100% 보존. |
| 1.3 lib/colors.ts | NOTE_STATUS_HEX 변경 + 신규 export: `TEXT_HIERARCHY`, `MOTION`, `RADIUS` (CSS var alias maps). Plot 기존 export 보존. |
| 1.4 Source Serif 4 | next/font (`Source_Serif_4`) 추가. `--font-source-serif` → `@theme inline { --font-serif: var(--font-source-serif), ... }` alias로 자기 참조 회피. Geist + Geist Mono 그대로. |
| 1.7 _legacy/ scaffold | `components/_legacy/` + README.md 정책 문서 (4 정책: codemod 제외, 새 작업 import 금지, deprecation 주석, 삭제 정책). Phase 2부터 사용. |

### 검증 결과 (Phase 1 acceptance 통과)

- `tsc --noEmit`: 0 errors
- `npm run build`: clean (33 routes prerendered)
- `npm run test`: 185 tests passed (0 regression)
- shadcn/ui Tailwind cascade: 정상 (Plot 기존 토큰 모두 보존)

### 다음: Phase 2 (Imperial icons codemod)

121 phosphor import 사이트의 Imperial icon kit 변환. `_legacy/` 폴더 본격 사용
시작점. `.omc/plans/v3-phase-2-imperial-icons.md`(작성 예정) 참조.

---

## 🚀 2026-05-07 — Plot v3 PRD 작성 + Phase 0 cleanup 완료

**범위**: Plot 2.0 → v3 리브랜드 + Phase 0 사전 정리 (C1 priority namespace / C2 ViewMode mismatch).

### 결정사항 (영구)

- **Plot 2.0 폐기**: 앞 세션의 11가지 결정(7-space, Type rename 등)은 유지하되, "2.0" 브랜딩 버리고 **v3 visual refresh** PR 시리즈로 진행
- **v3 mockup 채택**: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` 기준 — Notion/Linear 하이브리드 에디터, 토큰 시스템 전면 교체

### Phase 0 결과 (store v112, 완료)

| 항목 | 내용 |
|------|------|
| ViewMode 통합 | `SavedView.viewState.viewMode`에서 legacy `"table"` 제거, `"grid"` 추가 — view-engine `ViewMode`와 exact match |
| normalizeViewState | pre-v112 `"table"` → `"list"` rawViewMode 매핑 helper 추가 (fallback 보장) |
| Store v112 | savedViews.viewState.viewMode `"table"` → `"list"` idempotent 마이그레이션 |
| `--v3-priority-*` namespace | `:root` + `.dark`에 `--v3-priority-{high,medium,low}: unset` 선언 자리 마련 (Phase 1에서 값 채움) |
| 기존 보존 | `--priority-{medium,high,low,urgent,none}` Plot 5-tier 100% 보존 |

### 검증 결과

- `tsc --noEmit`: 0 errors
- `npm run test`: 185 tests passed (0 regression)
- `npm run build`: clean

---

## 🚀 2026-05-05 — Group C PR-D 진행 + Plot 2.0 PRD 시작

**범위**: PR #261 (Tags v110) merged. PR #262 (Labels v111) created. Hotfix 8개. **Plot 2.0 진화 PRD Phase A 완료 + 11가지 결정 확정**.

### 🆕 Plot 2.0 진화 (큰 결정, 영구)

**자료**: 사용자 ChatGPT 목업 20장 (`C:\Users\user\Desktop\플롯 UI 진화 가이드자료\`) 영감

**확정된 11가지 결정**:
1. **Activity Bar 7-space**: home/notes/wiki/calendar/ontology/library/**books NEW**
2. **7-space 새 팔레트** (기존 SPACE_COLORS 재디자인): home indigo, notes cyan, wiki violet, calendar pink, ontology emerald, library amber, **books rose** (#fb7185 dark / #e11d48 light)
3. **분류 체계 4-system → 3-system**:
   - Label → **Type** (note pool, 단일)
   - Category → **Type** (wiki pool, DAG 다중)
   - Tag (그대로, 사이드바 인라인 색 dot 추가)
   - **Sticker → Pack** (rename + 새 시각 정체성)
4. **Type rename 방식**: UI 레이블만 변경 (코드 그대로), 나중에 별도 PR로 코드 rename
5. **Type 컬럼 Display picker**: Hidden / Icon only (default) / Text only / Icon + Text
6. **이모지 vs Custom Icon**: emoji 단일 필드 먼저 prep, 이중 구조로 swap 가능 (사용자 직접 디자인 진행 중)
7. **Tags 사이드바 인라인 색 dot** (큰 변화)
8. **Templates 사이드바 승격**: More section → 별도 섹션, [Note] [Wiki disabled] 탭
9. **Timeline = ViewMode** (별도 ContextKey X), `VALID_VIEW_MODES`에 `timeline` 추가
10. **Detail Panel 5-tab**: Detail / Connections / Activity / Bookmarks / **Stats** (NEW). "Insights" 단어는 Plot 전체 분석에 보존, **Stats**는 단일 노트
11. **Focus Mode** 4-mode (Default/Focus/Zen/Compact). 3-진입점 (단축키 ⌘. + 우상단 버튼 + Settings)

**진행 단계**:
- ✅ Phase A: 코드베이스 정독 (`docs/PLOT-CURRENT-STATE-FOR-2.0.md`)
- ⏳ Phase B: 완벽한 목업 (반응형 + 토글 + 데이터 정확) — designer-high 위임 대기
- ⏳ Phase C: 사용자 검토
- ⏳ Phase D: PRD 작성 + 작업 단위 분해 (2-4개월 구현)

**보존 영구 결정**:
- Note/Wiki 2-entity 분리
- 색 정책 4사분면 (Label/Sticker→Pack 필수, Folder/Tag opt-in)
- LLM/API 미사용
- Note split = UniqueID

### 머지된 PRs (이번 세션)
- **#261** v110 — Group C PR-D PR 1 (Tags). useTagsView thin fork, ViewMode list+grid, TagNoteCountChip
- **#262** v111 — Group C PR-D PR 2 (Labels). useLabelsView thin fork, list+grid, LabelNoteCountChip + 8 hotfix 함께

### Hotfix 8개
1. status-icon defensive guard (crash fix)
2. notes-table Index gap-2 + TH hideInactiveHint
3. wiki-list Index gap-2 + checkbox w-8 + article icon status color
4. templates-table row align (gap-2/py-2.5)
5. labels-view 체크박스 hover-only
6. tags-view list mode 체크박스 hover-only
7. stickers-view 체크박스 hover-only
8. linear-sidebar Folders ↔ Views 순서 변경

### 다음 세션 우선순위
1. **🔴 Plot 2.0 Phase B** (designer-high 위임, Notes 시그니처부터)
2. Phase C+D
3. Group C PR-D 나머지 (Stickers→Pack / References / Files)

### Store Version 진화
v109 → v110 (tags-list) → v111 (labels-list)

---

## 🚀 2026-05-03 — 대규모 디자인 토론 (코드 변경 X, 결정사항만)

이 세션은 코드 변경보다 **앞으로 작업 방향 결정**이 핵심이었음. 33개 디자인 결정 정리.

### 1. View/Folder/Sticker/Book — 4사분면 모델 (확정)

```
                Unordered (collection)    Ordered (sequence)
Type-strict     Folder                    (의미 약함)
Type-free       Sticker                   Book ⭐ (신규 결정)
```

**의미 분리**:
- **View** = 동적 (필터 조건 저장, type-strict)
- **Folder** = 수동 멤버십, type-strict (한 종류만)
- **Sticker** = 수동 멤버십, cross-entity (collection)
- **Book** = 수동 멤버십, cross-entity, **ordered sequence**
- **Search** = 일회성 도구 (컨테이너 X, Linear 탭형 검색창 패턴)

### 2. Folder 변경 결정 (큰 PR 예정) — **재확정 2026-05-03**
- **type-strict** (노트 폴더는 노트만, 위키 폴더는 위키만)
- **N:M 멤버십** (한 노트 → 여러 폴더)
- 메타포: "텍스트 파일만 수용하는 폴더"
- **재확정 근거 (2026-05-03)**: 사용자 재논의 — cross-everything의 단기 자유도보다
  사이드바 일관성 + 4사분면 모델 + Sticker entity 가치가 더 중요. cross-entity 통합은
  Sticker가 담당, Folder는 한 영역 1차 정리 도구로 분리.
- **현재 코드 상태**: PR #236에서 `WikiArticle.folderId?` 임시 추가 (cross-everything).
  §2 큰 PR로 마이그레이션 시 type-strict + N:M 적용 예정. 임시 cross-everything UX
  (예: `/folder/[id]`의 노트+위키 동시 표시)는 큰 PR에서 롤백.
- **데이터 모델 (예정)**: `Folder.kind: "note" | "wiki"` 필드 추가 + `Note.folderIds[]`
  / `WikiArticle.folderIds[]` (단일 → 배열 마이그레이션)

### 3. Sticker v2 결정 (큰 PR 예정)
- **cross-everything** (Note + Wiki + Tag + Label + Category + File + Reference 모두 수용)
- **다중 멤버십 + 다중 sticker** (한 노드 → 여러 sticker, hull 겹침 가능)
- 메타포: "이미지+텍스트+Python 등 모든 형식 수용"
- 데이터 모델 옵션 D2 (정참조 단일) 추천: `Sticker.members[]`
- Universal Entity Picker UI 신규 필요

### 4. Book entity 신규 결정 (v3급 PR 예정) — **확장 2026-05-03 (Smart Book)**
- **신규 1급 entity** (Activity Bar 7번째 space — 7개 OK)
- **cross-entity** (Note + Wiki 포괄, 단일 Book entity)
- **ordered sequence** (chapter 순서 = 본질, slideshow 비유 정확)
- 메타: title / color / chapters[] / author? / series? / cover?
- chapter 정렬: **Manual drag-drop default + Auto-sort 액션**
- 시각화: **Hull + Sequence edge** (그래프) + **별도 Reading view** (Book detail)
- Wikilink 통합: `[[Book]]` / `[[Book#Chapter]]`

#### Smart Book — `AutoSource[]` 배열 (2026-05-03 확정)

엑셀 함수 패턴: 여러 source를 조합해 chapters[] 자동 생성.

```ts
interface Book {
  id, name, color, ...
  chapters: BookChapter[]      // 표시되는 chapter 목록 (수동 + 자동 합)
  autoSources?: AutoSource[]   // 비어있지 않으면 Smart Book
  excludeIds?: string[]        // 자동 chapter 중 사용자가 제외한 것
}

interface BookChapter {
  kind: "note" | "wiki"
  id: string
  order: number
  addedBy: "manual" | "auto"
  sourceId?: string            // 자동인 경우 어느 AutoSource에서 왔는지
}

interface AutoSource {
  id: string
  type: "folder" | "category" | "tag" | "label" | "sticker"  // 5종
  targetKind: "note" | "wiki" | "both"                       // sticker는 무시
  targetId: string
}
```

**Sticker source의 특별함**: Sticker 자체가 cross-everything이라 가장 강력한 source.
"이 sticker 묶음을 책으로" 워크플로우 직관적.

**UI 패턴**: Book detail에 "+ Add source" 버튼 (스프레드시트 함수 추가 UX).
각 source는 chip + 카운트 + 제거 버튼.

**Hybrid (수동 + 자동) 권장**: 일부 chapter는 manual (대표 노트), 일부는 auto
(folder/sticker 매칭). `excludeIds[]`로 자동 chapter 제외 가능.

#### Book template 시스템 X (Smart Book이 대체)

별도 "Book template" 도입 X. 이유:
- Book = 컨테이너 (자체 콘텐츠 없음)
- 진짜 가치는 chapter 콘텐츠 = 노트/위키 자체 → 노트/위키 템플릿이 처리
- 동적 자동화는 Smart Book의 `autoSources[]`가 대체

### 5. Page entity 도입 폐기 (확정)
**이유**:
- 제텔카스텐 atomic 정체성 위배 (page = sub-entity 묶음)
- 비용 v3급, 가치 한정적 (대다수 사용자에 의문)
- 별도 노트 + 폴더 + Linear navigation으로 80% 충족
- 사용자 needs는 **Book entity로 더 정합** (atomic 보존 + sequence 표현)

### 6. 그래프 sandbox 모델 (옵션 B 통합)
- **Save view = 보기 + 데이터 변경 staging 함께 저장** (통합 모델)
- **Sandbox = 그래프만** (노트/위키 편집은 즉시 영구 — 노트앱 표준)
- **Wikilink = 본문에서만** (편집기 [[..]])
- **Relation = 그래프 sandbox에서 추가** (별도 메타 layer)

### 7. Relation 저장 방식
- **본문 contentJson에 직접 embed 추가** (footer 새로 만들지 X)
- **사용자 명시 동의** (Q2: 첫 번째만 prompt + "기억" 옵션)
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화
- Entity-ref = note-ref 일반화 (모든 entity type 수용)

### 8. Sticker 진입점 = Library만 (정정)
- 이전 결정: 4 space (Notes/Wiki/Ontology/Home)에 NavLink
- **새 결정**: Library만 진입점 (cross-cutting 인덱스 결로 정합)
- 다른 space에서 제거 작업 필요

### 9. 사이드 패널 변경 — 모든 큰 PR의 collateral
- **Detail 탭**: status 라벨 / folder list / sticker chips / block count / page 정보
- **Connections 탭**: Wikilinks / Graph Relations 분리 + Page toggle + Sticker members + Source
- **Activity 탭**: 새 이벤트 타입 (relation/sticker/folder/page/status) + source 메타
- **원칙**: entity 단위 dashboard. 각 큰 PR이 자기 변경의 사이드 패널 부분 처리

### 10. Linear-style entity navigation (의미 A)
- view 안 노트 간 ↑/↓ 키, 1/N 표시
- **Page 폐기 후 80% needs 충족**
- 작은 PR로 즉시 가능

### 11. Linear 검색창 패턴
- All / Notes / Wiki / Tag / Label / Sticker / Folder / Book / 탭형 검색
- Search = 일회성 도구 (컨테이너 X, 4사분면 외)

### 12. 마크다운 단축키 강화 (Obsidian 90% 수준)
**Phase 1 (작은 PR)**:
- `---` Enter 패턴 (UpNote 스타일, 즉시 변환 X)
- Highlight (`==`)
- Image embed (`![[..]]`)

**Phase 2 (중간 PR)**:
- Math (`$$...$$` KaTeX)
- Heading anchor (`[[Title#Heading]]`)

**Phase 3 (큰 PR)**:
- Block reference (`[[Title^block-id]]`)
- Definition list

### 13. UI Polish 항목
- Wiki "Blocks" Display Property (Words 자리)
- Notes 사이드바 위계 (Notes ▼ Status 그룹: Inbox/Capture/Permanent/Pinned)
- All Notes 명칭 유지 (Overview로 변경 X)
- 컬럼 헤더 아이콘 통일 (별도 PR)
- Status 아이콘 시리즈 (Linear 패턴: 빈/반/꽉)

### 14. 기술 학습
- **Hull 클릭 안 됨 버그**: SVG `pointer-events="visiblePainted"` default가 fillOpacity 0.04~0.10을 "not painted"로 판단 → `pointerEvents: "all"` 명시 필요
- **Hull stuck 버그**: `clusterHulls` useMemo deps에 `transform`만 있어서 노드 드래그 시 재계산 안 됨 → `forceRender`의 카운터 (renderTick) 노출해서 deps에 추가
- **위키-노트 cross-entity가 디지털에선 자연**: 종이책 메타포에 갇히지 말 것 (Notion 페이지가 다양한 블록 mix하듯)
- **자료구조 본질 차이**: Sticker = collection (set, 무순서) / Book = sequence (list, 순서 있음). 다른 entity 정당화

### 15. 노트 템플릿 = UpNote식 옵션 A only (v1) — 2026-05-03 확정

**정체성**: "준비된 빈 노트" — 단순 복사 + 변수 치환. powerful 동적 조합은 Smart Book이 담당.

**v1 scope (옵션 A — 변수 시스템 강화)**:
- 기존 변수 (`{date}`, `{year}`, `{month}`, `{day}`, `{time}`, `{datetime}`)는 그대로 유지
- UpNote 형식 추가: `{{YYYY}}`, `{{MM}}`, `{{DD}}`, `{{date}}`, `{{time}}`
- `expandPlaceholders` 양쪽 패턴 모두 지원 (additive, regex 충돌 X)
- 4 진입점 ("건물 하나, 출입구 여러 개" 원칙):
  - ① 슬래시 명령어 `/` (이미 있음)
  - ② 우클릭 메뉴 → "Insert from template..."
  - ③ 하단 플로팅바 Insert 메뉴 → "Templates"
  - ④ 빈 노트 placeholder 클릭 (모달 트리거)
  - (⑤ 단축키 옵션)
- 빈 노트 placeholder: "Press / for menu, or start with a template"
  (UpNote와 어순 다름, 저작권 안전)
- 시드 템플릿 10~20개 (회의록/일기/투두/Daily/PARA 등) — Sprint 2 출시 폴리시

**폐기 (v1 scope 밖)**:
- 옵션 B (템플릿 조합) — TipTap JSON merge 어려움, 가치 모호
- 옵션 D (Partial / include) — 가치 낮음

### 16. Smart Template (옵션 C) → v2 재검토 — 보류

동적 콘텐츠 가진 템플릿 (예: "주간 리뷰" → 자동으로 이번 주 노트 리스트 삽입).

**v1 보류 이유**:
- Smart Book과 멘탈모델 겹침 ("Smart Book이랑 뭐가 달라?")
- 템플릿 정체성 ("준비된 빈 노트") 흐림
- 디버깅 어려움 (동적 콘텐츠 → 예측 어려움)

**v2 재검토 조건**: 옵션 A (UpNote식) 안착 후 사용자 피드백 받고 진짜 필요한지 판단.
필요하면 Smart Book과 명확히 차이 정의 후 도입.

### 17. Template 시드 + entity별 audit (큰 작업) — 별도 PR

**현재 상태**:
- 노트 템플릿: NoteTemplate slice 있음, 시드 0개
- 인포박스 프리셋: `lib/wiki-infobox-presets.ts` 237줄 (Person/Place/Concept 시드 있음)
- 위키 템플릿: 결정만, 구현 0
- 배너 블록: 33-decisions에 있음, 미구현
- 카테고리 트리, 사이드바 layout 등: 시드 X

**사용자 요청 (2026-05-03)**: "인포박스/배너 외에도 템플릿 만들 수 있을 법한 entity는 다 가능하게. 코드 깊이 분석 필요."

**audit 범위 (별도 PR)**:
1. Plot 코드베이스 전체 grep: "preset", "template", "default", "seed" 패턴
2. Entity별 시드 유무 점수표
3. 통합 추상화 가능성 (`PlotTemplate<T>` 단일 추상화 vs entity별 따로)
4. 변수 시스템 적용 가능 entity 목록

**Book 템플릿은 X**: §4 Smart Book이 대체 (autoSources로 동적 chapter).

---

## 🚀 2026-05-02 (늦은 밤) — Index 버튼 위치 통일 + viewState.toggles에 보존

**문제**: Notes의 Index 토글은 ViewHeader 우측 toolbar (Filter/Display 옆), Wiki list는 ViewHeader 아래 별도 toolbar에 있어서 두 view 패턴이 어색하게 달랐음.

**해결**: 두 view 모두 **컬럼 헤더의 Title 옆 inline 토글**로 통일. ViewHeader는 글로벌 view-level 액션(Filter/Display/Save view)만 보유.

**옵션 B 선택** (Display 패널 + 컬럼 헤더 inline 두 진입점, viewState.toggles에 보존):
- `viewState.toggles.showAlphaIndex` 키로 통일 (기존 `useState` 로컬 상태 폐기)
- saved view에 함께 보존됨 — "알파벳 인덱스 켠 상태"의 view 만들 수 있음
- 컬럼 헤더 inline 토글 + Display 패널 토글 = 같은 state (synced), Linear 패턴

**dirty 검증 확장**: `viewStateEquals`에 `toggles` map 비교 추가. Index 켜면 ViewHeader Save 버튼 자동 등장.

**적용 파일**:
- `components/notes-table.tsx` — useState 제거, viewState.toggles 사용, ViewHeader extraToolbarButtons에서 제거, 컬럼 헤더 Title 셀에 toggle inline
- `components/views/wiki-list.tsx` — `ColumnHeaders`에 `showAlphaIndex` + `onToggleAlphaIndex` props 추가, 별도 toolbar의 Index 버튼 제거
- `components/views/wiki-view.tsx` — `showAllArticles` useState 제거, wikiViewState.toggles로 전환
- `lib/view-engine/saved-view-context.ts` — viewStateEquals에 toggles 비교 추가
- `lib/view-engine/view-configs.tsx` — NOTES + WIKI configs의 displayConfig.toggles에 `showAlphaIndex` 추가

---

## 🚀 2026-05-02 (밤) — Saved Views 스냅샷 UX (Linear 패턴 옵션 C)

**Saved Views snapshot 흐름 완성**: 이전엔 + 버튼이 빈 default state 뷰만 만들었음. 이제:

1. **사이드바 + 버튼**: 이름 입력 → 즉시 **현재 viewState 캡처**해서 저장 (`createSavedView(name, currentViewState, space)`)
2. **ViewHeader Save 버튼** (Linear 패턴):
   - 활성 view 없음 → "Save view" (popover로 이름 입력)
   - 활성 view + dirty (현재 state ≠ saved state) → 강조된 "Save" 버튼 (덮어쓰기)
   - 활성 view + clean → 버튼 숨김
3. **사이드바 saved view 우클릭 메뉴**:
   - **Update view** — 현재 viewState로 saved view 덮어쓰기
   - **Reset to saved** — 현재 viewState를 saved view 상태로 되돌림
   - Rename / Delete

**적용 범위**: notes-table, notes-board, wiki-view (list mode), ontology-view, calendar-view 5곳

**핵심 헬퍼**:
- `lib/view-engine/saved-view-context.ts` — `getCurrentViewContextKey(space, route)`, `getSavedViewSpaceForActivity(space)`, `viewStateEquals(a, b)`
- `lib/view-engine/use-save-view-props.ts` — `useSaveViewProps(contextKey, space)` 훅. 자동으로 saveViewMode 계산 + onSaveView 콜백 제공

**Dirty 검증**: viewMode/sortField/sortDirection/groupBy/showEmptyGroups + filters[] + visibleColumns[] 비교

---

## 🚀 2026-05-02 (오후) — docs 정리 + Saved Views 완성 + 카테고리 색 UI + Sticker 사이드바 (사이드바 polish + Sticker 1급 UI 통합 PR)

**5개 작업 묶음 PR**:

1. **🗂️ docs archive 정리**: stale 문서 5개를 `docs/.archive/`로 이동
   - `TODO.md`, `NEXT-ACTION.md`, `SESSION-LOG.md` — 4-30 시점, PR #228~#236 9개 누락. CONTEXT.md/MEMORY.md/worklog와 정보 중복
   - `PHASE-PLAN-wiki-enrichment.md` — v75→v83 가정인데 현재 v100, 데이터 모델 가정 깨짐. 헤더에 "ARCHIVED + 분할 PRD로 대체" 노트
   - `plot-discussion/` 11개 — 2026-03-30 historical brainstorm. entity 통합→분리 등 일부 결정 뒤집힘
   - `docs/.archive/README.md` 신규 (보관 이유 + authoritative 문서 가이드)
   - 의도: single source 원칙 (CONTEXT.md/MEMORY.md만 갱신, after-work 갱신 누락 패턴 차단)

2. **🔧 SavedView.viewMode 타입 보강**: `lib/types.ts:314`에 `"graph" | "dashboard"` 추가
   - 기존: `"list" | "table" | "board" | "insights" | "calendar"` — ontology의 graph/dashboard 누락
   - Ontology saved view 만들 때 viewMode 보존되도록 fix (잠재 버그 사전 차단)

3. **🆕 Saved Views 복원 패턴 Wiki/Ontology/Calendar에 적용**: 기존 Notes만 동작하던 viewState 복원 로직을 3개 view로 확장
   - `components/views/wiki-view.tsx` + `ontology-view.tsx` + `calendar-view.tsx`에 `useActiveViewId` import + useEffect 패턴 추가
   - SavedView.space 가드 (wiki/ontology/calendar 각각 자기 saved view만 적용)
   - notes-table-view.tsx의 useEffect 패턴 거의 그대로 복제 (~10줄 × 3 파일)

4. **🎨 카테고리 색 dot + Change color UI**: WikiCategory.color 활용 UI 완성
   - List view 카테고리 row: 색 dot (h-2 w-2 rounded-full) + ContextMenu(Rename/Change color/Delete + undo)
   - CategoryEditor: Name input 아래 Color Popover (ColorPickerGrid)
   - `components/views/wiki-category-page.tsx` 단일 파일 121줄 추가
   - 데이터 모델은 v99에서 이미 추가됨. UI만 늦게 추가됨.

5. **🆕 Sticker 사이드바 + /stickers 페이지**: Sticker 1급 entity UI 완성
   - `components/views/stickers-view.tsx` 신규 (754줄, LabelsView 복제 패턴)
   - `app/(app)/stickers/page.tsx` shell (return null)
   - `app/(app)/layout.tsx`에 StickersView always-mounted 등록
   - `components/linear-sidebar.tsx` More 섹션에 Stickers NavLink 추가 (Sticker Phosphor 아이콘 + count)
   - `lib/table-route.ts`의 VIEW_ROUTES에 `/stickers` 등록
   - 의도: 그래프 우클릭 메뉴에서만 가능했던 sticker 생성/관리를 라벨처럼 사이드바 진입점에서도 가능하게

**Saved Views 스냅샷 UX 결정사항 (다음 PR 후보)**:
- 현재 사이드바 + 버튼은 이름만 받고 빈 default state 뷰 생성 → "현재 viewState 캡처" UX 부재
- 사용자 합의 옵션 C (ViewHeader Save + 사이드바 + 버튼 의미 변경 둘 다):
  - ViewHeader에 명시적 "Save view" 버튼 (변경 있을 때만 활성화 — Linear 패턴)
  - 사이드바 + 버튼: 빈 뷰 대신 현재 viewState 캡처 (이름 입력 → 즉시 스냅샷)
  - 우클릭 메뉴: "Update view" (덮어쓰기), "Reset to saved" 등

**작업 안 한 것 (deferred)**:
- linear-sidebar wiki space에 카테고리 트리 표시 (현재는 wiki-category-page에서만 색 dot 보임)
- NoteStatus 리네이밍 (PRD 사전 조사 완료, 다음 큰 PR로)
- Filter chip 3-part 드롭다운 Step B (별도 PR)
- Saved Views 스냅샷 UX 개선 (옵션 C)

**Out of scope (다음 PR)**:
- Saved Views 스냅샷 UX (ViewHeader Save 버튼 + 사이드바 + 버튼 의미 변경)
- NoteStatus → stone/brick/keystone 리네이밍 (Phase 1)
- Filter chip 인라인 편집 Step B (모든 part 드롭다운)
- 인포박스 Tier 1~3 (분할 PRD)

---

## 🚀 2026-05-01 ~ 2026-05-02 — Light Mode + Ontology Graph 재설계 + Group by Hull + Sticker entity + Dashboard 3분할 (단일 PR)

**12개 큰 작업을 한 PR에 누적:**

1. **라벨 편집 UX 재설계 (Option A)**: name click=rename, color popover always-on, FAB rename/recolor, 우클릭 메뉴, hover pencil 제거
2. **한글 → 영어 전환 + v97/v98 마이그레이션**: 인포박스 프리셋/필드명, navbox 버튼, wikiArticles dedup
3. **글로벌 컬러 시스템**: SPACE_COLORS + ENTITY_COLORS + STATUS_COLORS 단일 진입점, 라이트 모드 가시성 헬퍼
4. **폰트 스케일 시스템**: 위키 article 6 그룹 (title/heading/body/infobox/meta/misc) per-group 배율. Reader Settings popover (S/M/L/XL + Refine ± + Layout + Reset)
5. **Ontology Graph Redesign Phase 1~4**: `lib/graph/ontology-graph-config.ts` 신규 — 50+ 매직넘버 단일 진입점. Force tier, sqrt(linkCount) 사이징, smooth LOD fade, 부채 정리
6. **Phase 7 — Ontology UX 통일**: Display popover에 View Mode (Graph/Insights) + 노드 타입 토글 통합. 사이드바 Node Types 제거, OntologyTabBar 제거. Notes/Wiki와 동일 멘탈 모델
7. **🆕 Phase 7 버그 fix**: `showViewMode` prop 누락 → ontology-view에서 Graph/Insights 토글 안 보이는 문제 해결
8. **🆕 Group by Hull 시스템 (PRD: REDESIGN_GRAPH_GROUPING.md)**: Ontology hull = 사용자 group by 결과. 라벨/태그/카테고리/폴더/스티커/상태 어느 거든 부여 = 그래프 hull 멤버십. Hull light/dark 분기로 라이트모드 가시성 ~3× 개선
9. **🆕 Sticker entity 신규**: 라벨(노트만)/카테고리(위키만)/태그(맥락) 외에 **임의 묶음** 슬롯. 노트+위키 모두 다중 멤버십. 사용자 멘탈모델: "라벨/카테고리/태그 의미 따질 필요 없이 그냥 한 묶음으로 표시하고 싶어"
10. **🆕 우클릭 메뉴 + 인라인 스티커 생성**: 그래프 노드/hull 우클릭 → Add sticker… → 인라인 검색 + "+ New" → 즉시 모든 선택 노드에 부여 + Group by 자동 전환. Linear quick-add 패턴
11. **🆕 Hull 인터랙티브**: hull = 블록. 클릭(그룹 선택) / 드래그(그룹 이동) / 우클릭(메뉴) 모두 지원. 안의 모든 노드 함께 이동 (group-drag 로직 재활용)
12. **🆕 3분할 Dashboard 진입**: Ontology = Graph (시각화) + Insights (행동 유발) + Dashboard (raw stats, "사브메트릭스"). 사이드바 More에 Dashboard 진입점. Stats 재설계 (Health → Stats, Density 삭제, Top hub → 노트 제목)
13. **🆕 Hull/스티커 색 사용자 변경 UI**: 우클릭 메뉴의 스티커 서브메뉴에 두 곳 색 picker — (1) 새 스티커 생성 시 입력창 옆 dot → PRESET_COLORS swatch grid, (2) 기존 스티커 row의 dot 클릭 → 인라인 picker. **Hull 색 = entity 색**이라 스티커 색만 바꾸면 hull도 즉시 동기화
14. **🆕 Hull 드래그 부드럽게**: Hull = 블록 드래그 시 path data 매 tick 재계산하면 "꿈틀거림" 발생 → drag 중에는 path 모양 freeze + SVG `transform=translate(dx, dy)`로 통째 이동. 노드들은 group-drag 로직으로 동일 delta 적용. drag 끝나면 transform 해제 + 새 위치 기반 hull 자연스럽게 그대로 그려짐 (점프 없음)
15. **🆕 다중 선택 강화**: Ctrl/Cmd+click(toggle) + **Shift+click(add)** + Shift+drag(marquee) 모두 지원 (Mac Finder/Linear 패턴). 좌상단 hint 재설계: 선택 0개일 때 단축키 안내 (Kbd badge), 선택 시 카운트 + 해제 버튼
16. **🆕 범례 라이트모드 가시성 통일**: 텍스트 색을 통일된 slate-800로 (이전 status별 색상은 흐림), color는 swatch에만 — Linear 패턴. 배경 `0.92 → 0.98` 거의 불투명, 노드 fill alpha `0x55 → 0x88`
17. **🆕 Stats 재구조 + 호버 tooltip**: Notes/Wiki **큰 숫자 카드** (grid-2col) + 각 행에 `cursor-help` + 풍부한 tooltip (status breakdown, 노트 제목 미리보기 8개), 푸터에 `N edges → Dashboard` 포인터
18. **🆕 사이드바 Ontology 진입점 재설계**: Wiki/Library 패턴 따라 **Graph / Insights / Dashboard 모두 상단 navigation으로** (More 섹션에서 끌어올림). 각 클릭 시 `plot:set-ontology-tab` 이벤트 → 같은 /ontology 페이지에서 viewMode 전환 (그래프 layout/positions 보존)
19. **🆕 연결 끊기 (시각만, 데이터 보존)**: ViewState에 `hiddenEdgeIds` / `hiddenEdgeKinds` / `isolatedNodeIds` 추가 → visibleEdges 필터링. 우클릭 메뉴에 **Hide connections** (선택 노드의 모든 엣지 숨김) + **Isolate** (선택만 보이게, 나머지 dim) + **Show all** (복원). 좌상단에 amber 인디케이터 ("N hidden · M isolated · Show all"). 엣지 직접 우클릭은 path hit-area 코드 비용 커서 다음 PR로 위임
20a. **🆕 다크모드 엣지 색 강화 + Dashboard 아이콘 분리**:
- EDGE_STYLE.alphaRelation/Wikilink/Tag의 dark 값이 light보다 *낮게* 설정돼 다크에서 거의 안 보였던 버그 수정 (relation: 0.12→0.38, wikilink 0.08→0.30, tag 0.06→0.22). 다크 모드에서도 엣지 잘 보임
- 사이드바 Insights/Dashboard 동일 아이콘 → Dashboard만 `ChartBar`로 변경

20c. **🆕 Filter chip 인라인 편집 (Step A)**: connectedTo chip의 direction 부분을 클릭하면 Popover로 Both/In/Out 즉시 토글. 매번 우클릭 → submenu 갈 필요 없음. FilterChipBar에 `onUpdateFilter` prop 추가, notes-table·notes-board에서 wire. 다른 chip(Status/Folder/Label 등)의 인라인 편집은 Step B로 다음 PR

20d. **🆕 폴더 인라인 생성 (Move to folder 안에서)**: 노트 우클릭 → Move to folder → "+ New folder…" 선택 시 prompt로 이름 입력 → 즉시 생성 + 자동 부여. 위키 row 메뉴, multi-select 플로팅바에도 동일 패턴. createFolder가 생성된 ID 반환하도록 변경 (이전 void)

20b. **🆕 Connection 필터 (in-place backlink/links 필터)**: 노트/위키 뷰 안에서 "이 노트와 연결된 entity만 보기". Ontology 가지 않고 현장에서 즉시 적용.
- 새 FilterField `connectedTo` (value: `<id>:<direction>`, direction ∈ both/in/out)
- Notes pipeline (filter.ts): linksOut + backlinksMap 기반 양방향 처리
- Wiki pipeline (wiki-list-pipeline.ts): linksOut(titles) + alias 기반 매칭, allArticles 추가 extras
- 우클릭 → "Show connected" 서브메뉴 (Both / Backlinks only / Links out only)
- 노트와 위키 양쪽 동일 패턴, FolderPickerSubmenu와 같은 인라인 expand-to-list UI
- Filter chip 자동 표시 ("Connected · [노트 제목] (↔ both)")
- 세 방향 토글로 분리되어 backlinks/links out 별도 필터 가능

21. **🆕 폴더 = 글로벌 컨테이너 (노트+위키 공유)**: v99에서 데이터 모델은 이미 통합됐으나 UI가 노트만 다뤘던 것을 정리.
    - 노트 row 우클릭 메뉴 → **Move to folder** 서브메뉴 (폴더 목록 + No folder + 색 dot)
    - 노트 multi-select 플로팅바 → **Folder** popover 버튼 (bulk 적용 + 토스트)
    - 위키 row 메뉴 → **Move to folder** 인라인 expand-to-list submenu (FolderPickerSubmenu 컴포넌트)
    - 폴더 detail 페이지 (`/folder/[id]`) 완전 재구성 — 기존 `/notes` redirect 폐기. 두 섹션 (Wiki / Notes) + "+ Add" 드롭다운 (New note / New wiki article). 빈 섹션엔 "Create one" 액션. "Open in Notes view" 링크로 풀 기능 노트 뷰 진입 가능
    - 사이드바 폴더 카운트 = 노트 + 위키 합산 (이전엔 노트만)
    - layout.tsx 라우팅 수정 — pathname이 동적 라우트(`/folder/`, `/label/`, `/tag/`)면 isFallback 강제 → children(폴더 페이지)이 NotesTableView 위에 정확히 표시
    - createWikiArticle에 `folderId?` partial 필드 추가 (폴더 페이지에서 새 위키 생성 시 자동 멤버십)
    - **이름 결정**: "Folder" 그대로 유지 (Notion에는 폴더 없음 / Apple Notes·Obsidian·Logseq·Evernote 모두 폴더 메타포로 검증됨 / 친숙도 ★★★★★ + Plot의 노트+위키 컨테이너 의미 정확)
    - 위키 detail panel folder 셀렉터는 다음 PR (UI 영역 큼)

**데이터 모델 변경 (v98 → v100)**:
- WikiCategory에 `color: string` 추가 (graph hull 색)
- WikiArticle에 `folderId?: string | null` 추가 (노트+위키 통합 폴더 멤버십)
- **Sticker interface 신규** + Note/WikiArticle.stickerIds (multi)
- 신규 slice: `lib/store/slices/stickers.ts` (CRUD + bulkAddSticker)
- v99 마이그레이션: 기존 카테고리에 자동 색 할당, 위키 folderId default null
- v100 마이그레이션: stickers: [] 보장

**Group by 옵션 (Display popover)**:
- None / **Sticker** (default 추천, 노트+위키 통합) / Tag / Label / Wiki Category / Folder / Status / Connections (legacy BFS)

**Marquee 단축키**: Shift+drag = 영역 선택 / Ctrl+click = 노드 toggle. 그래프 좌상단에 hint 표시 (선택 후 사라짐)

**위키 노드 가시성**: hex `#8b5cf6` → `#7c3aed` (더 진한 violet) + light fillOpacity 0.33 → 0.55, strokeWidth 2.0 → 2.4

**Store**: v96 → v97 → v98 → v99 → **v100** (sticker entity)

**Out of scope (다음 PR)**:
- **사이드바 Stickers 섹션 + /stickers 페이지** (라벨처럼 관리, 우클릭 메뉴)
- **카테고리 사이드바 색 dot + Change color UI**
- **위키 폴더 입력 UI** (folderId 데이터는 있음)
- **위키 detail panel folder 셀렉터** (G20d deferred)
- **Dashboard 추가 섹션**: time series, connectivity distribution, cluster analysis, wiki article stats
- **모바일 인터랙션**: long press → selection mode + 하단 액션바
- **Phase 8** — 계층 시각화 (parent/child/root/orphan 차별화)
- **Phase 5** — Layout Switcher (Force/Hierarchical/Radial)
- **Filter chip 인라인 편집 Step B/C** — value 전체 + Field swap (Step A 완료)
- **Side Panel Connections 탭 강화** (sortable + clickable + filter chip 통합)
- **엣지 직접 우클릭** (path hit-area overlay)
- **Display popover edge type 세분화** (wikilink/relation/tag 토글 분리)
- **Insights Hub 본격 구축** (Wiki candidates / Stale notes / Broken wikilinks)
- **🆕 Saved Views 완성** — 데이터 슬라이스 + 사이드바 UI는 4 space (Notes/Wiki/Ontology/Calendar) 모두 구현됨. **하지만 viewState 복원은 Notes만 동작** (notes-table-view에서 activeViewId 감시). **Wiki/Ontology/Calendar는 dead end** (사이드바에 view 표시되고 클릭 라우팅도 되지만 viewState 적용 X). 다음 PR로 3개 view에 동일 패턴 적용 (notes-table-view의 useEffect 패턴 복제). 비용 ~3h
- **🆕 NoteStatus 리네이밍 (`inbox/capture/permanent` → `stone/brick/keystone`) + Inbox 알림함 시스템 도입** — 큰 작업, 사용자 직접 작성 PRD `docs/REDESIGN_NOTE_STATUS_INBOX.md`. **Phase 1 NoteStatus 전면 리네이밍 + IDB v101 마이그레이션**, **Phase 2 Home Inbox 의미 재정의 (placeholder + InboxSignal stub)**. 작업 시작 전 사전 조사 + 사용자 합의 절차 강제

자세한 PRD: [`docs/REDESIGN_ONTOLOGY_GRAPH.md`](./REDESIGN_ONTOLOGY_GRAPH.md), [`docs/REDESIGN_GRAPH_GROUPING.md`](./REDESIGN_GRAPH_GROUPING.md), [`docs/REDESIGN_NOTE_STATUS_INBOX.md`](./REDESIGN_NOTE_STATUS_INBOX.md)

---

## 🚀 2026-04-30 오후 — Sprint 1.4 완료 (4 PR 통합 단일 commit). 다음은 Sprint 1.5 + Wiki Hierarchy filter fix

**Sprint 1.4 완료 (단일 commit, ~40 파일)**:
- **PR 1 (D)** Parent 위계 활성화 — note-hierarchy + setNoteParent + Connections > Hierarchy + breadcrumb + Family/Parent/Role grouping + Filter-aware toggle + multi-select picker + hover delay 500ms
- **PR 2 (B)** Wiki 컬럼 정비 — Status badge / Reads (v95 마이그레이션) / Created
- **PR 3 (C)** Wiki 차트 개선 — Article/Stub 분리 + Sub-tabs (count) + Knowledge Connectivity (신규)
- **PR 4 (A)** Wiki 보드 뷰 신규 — Multi-membership Category drag + categoryNames lookup

**Store**: v94 → **v95** (Reads 백필). v96은 sortField/sortDirection deprecated 제거 단독 예정 (별도 cleanup PR).

**다음 세션**: Wiki Hierarchy filter 4 카테고리 fix (S, 10분) → Sprint 1.5 (Outlinks + 위계 컬럼) → Sprint 2.

자세한 plan: [`docs/TODO.md`](./TODO.md) P0 섹션

---

## 🚀 2026-04-30 오전 — Sprint 1.3 머지 완료

**Sprint 1.3 (PR #228)**: 디자인 polish + 사이드 패널 동기화 + Display Properties 동적 컬럼 + 출시 빌드 fix.

---

## 🚀 2026-04-29 (오후 후반) — **출시 준비 우선 결정. Sync는 v2.0**

**같은 세션 내 재고**: Sync 6개 결정 + PRD 작성 후 사용자 재고 → "꼭 페이즈 1부터 해야 되나? 우선은 앱부터 다듬고 출시 계획을 제대로 진행하고 싶은데?"

**결정 #3 변경**: (a) Sync 포함 출시 → **(c) Free 출시 후 v2.0에 Sync** (6개월~1년 후)

**이유**: Sync = 3~4개월 작업, 그 동안 사용자 facing 개선 멈춤. 앱 폴리시 빚 + 출시 후 사용자 피드백 반영해서 sync 설계 보강 가능.

**현재 작업 우선순위**:
- **Sprint 1 (~2주)**: P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) + 필터/디스플레이 드롭다운 정리
- **Sprint 2 (~3주)**: 노트 템플릿 시드 10~20개 + 온톨로지 메트릭 툴팁 + 캘린더 점검 + Views/Insights 업그레이드
- **Sprint 3 (~2주)**: 도메인 + 마케팅 사이트 + Privacy Policy + 데스크톱 웹 배포
- **🎯 데스크톱 Free 출시**
- **Sprint 4 (회원 수 충분해진 후)**: 모바일 반응형 + PWA + TWA + Google Play
- **Sync v2.0 (출시 후 6개월~1년)**: SYNC-PRD.md 활성화

**출시 결정**:
- **타임라인**: 자유 (끝날 때까지) — 품질 우선
- **플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일
- **모바일 전략**: PWA + TWA (Bubblewrap → Google Play)

**자세한 작업 가이드**: [`docs/TODO.md`](./TODO.md) P0 섹션
**Sync v2.0 PRD (보존)**: [`docs/SYNC-PRD.md`](./SYNC-PRD.md)

### Sync 6개 결정 (LOCKED, v2.0 진입 시점에 적용)

1. Sync 옵션: B. Supabase + E2E 암호화
2. 가격: Free / Sync $5 / Pro $10 (Obsidian 동일)
3. **출시 시점: (c) v2.0 — Free 출시 후 6개월~1년**
4. CRDT/Y.Doc: 노트+메타 모두 Yjs
5. 결제: 보류 (v2.0 진입 시점)
6. 인증 (v2.0): Magic link + Google + Kakao

**영구 규칙 추가** (v2.0 시점에 적용):
- 단일 사용자 도구 유지 (협업 X, 다중 기기만)
- E2E 암호화 절대 양보 X
- 오프라인 우선
- 마스터 비번 분실 = 데이터 복구 불가 → Recovery Phrase 강제

**Y.Doc 폐기 결정 (2026-04-27) 뒤집음** — sync 컨텍스트에서 노트 본문 + 메타 모두 Yjs 사용. v2.0 시점 적용.

---

## 🟢 2026-04-29 (오전) — v0 협업 + UI polish + dead code 정리 + P0 필터 + Row density 시도/revert (5 PR)

**완료 PR**:
- **#220 (23fe1be)**: v0 작업 흡수 — 라이트모드 contrast 개선 + Home View 리디자인 (12 파일). v0 환경 wrapper(`next.config.mjs`) 제외
- **#221 (4f5165a)**: UI polish + dead code 14개
  - 체크박스 6 위치 통일 (`bg-card` + `border-zinc-400` + `shadow-sm` + `rounded-[4px]`)
  - 라이트모드 chart 색 WCAG AA: chart-2 → #0e7490 (cyan-700) / chart-3 → #c2410c (orange-700) / chart-5 → #15803d (green-700)
  - StatusShapeIcon hex → CSS var (라이트/다크 자동)
  - Dead code 14개 정리 (Notes / Wiki / Wiki Cat / Calendar toggles)
- **#222 (f613532)**: P0 필터 강화 (5 앱 리서치 기반)
  - True orphan filter (linksOut=0 AND backlinks=0)
  - "Has backlinks" 활성화 (기존 dead config)
  - Wiki-registered filter (title+aliases 매칭)
  - `applyFilters` extras 인프라 확장 (backlinksMap + wikiTitles)
- **#223 (7423c08)**: Row density dropdown 통합 (Notion 패턴 시도)
- **#224 (7472321)**: Row density 제거 — Linear 스타일 (revert + 영구 규칙 재확인)

**큰 결정**:
- **Linear 방식 재확인** — "시각적 다양성 ≠ Plot 코어" 영구 규칙. Notion 패턴 시도 후 사용자 피드백으로 회귀. 토글 옵션 적게 (진짜 필요한 것만)
- **5 앱 리서치 결과 P0 4개 / P1 3-5개 / P2 3개 도출** — Linear / Notion / Obsidian / Capacities / Bear 분석. anti-pattern 명시
- **Sub-group 인프라 발견** — `ViewState.subGroupBy` + `applyGrouping` 재귀 + `NoteGroup.subGroups` 모두 구현됨. Notes만 의미 있음 (Wiki/Library는 비추)
- **Saved View 이미 구현** — `lib/store/slices/saved-views.ts` + linear-sidebar `createSavedView`. 검증만 필요. P1에서 제외

**Store version**: v91 → v92 → v93

**다음 세션 (다른 컴퓨터)**: P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) 한 PR로 묶음 + Wiki 1차 groupBy 별도 PR

---

## 🟢 2026-04-27 — Doc sync + group-header + attachment drag-drop + 시계열 메트릭

**완료**:
- Doc sync (SESSION-LOG / NEXT-ACTION / TODO를 PR #218 시점으로 정합성 회복)
- TipTap InfoboxBlockNode `"group-header"` row 타입 지원 (collapse + 8 컬러 프리셋 + custom hex). 위키 인포박스와 일관성 회복
- FileHandler onDrop/onPaste 구현 — 이미지 드래그/스크린샷 paste 자동 attachment
- 시계열 메트릭 — `lib/insights/timeseries.ts` `computeWikiTimeSeries` (day/week/month 버킷) + `wiki-growth-chart.tsx` (recharts AreaChart + BarChart, ResizeObserver 패턴) → Wiki Dashboard 통합

**큰 결정 (영구)**:
- **Wiki Y.Doc 폐기** — WikiBlock 배열 구조라 Note 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음. 안 해도 안전
- **AI provider 폐기** — "LLM 없이 규칙/통계/그래프" 코어 정체성 위반

**출시 방향 논의 진행** (다음 세션 결정):
- Google Play Store + 마케팅 웹사이트 출시 의향
- 모바일 전략: PWA → TWA 추천
- 출시 전 부족 영역: 온톨로지 / 캘린더 / 노트·위키 템플릿

---

## 🟢 2026-04-26 — Plot 디자인 + 인사이트 대규모 (9시간 세션, 9 PR + 핫픽스)

**핵심 결정**:
- **Home = 데이터 대시보드 + 빠른 진입** (시간 기반 X). Quick Capture / Stats (컬러) / Recent (4 카드) / Quicklinks (Mixed pinned 통합) / CTA. max-w-5xl.
- **Ontology = Single Source of Insights**. 모든 정비 행동(Orphan/Promote/Unlinked/메트릭) Ontology Insights 탭으로 이전. 새 메트릭: Knowledge WAR / Concept Reach / Hubs / Density / Coverage / Tag Coverage / Cluster Cohesion.
- **Pinned 통합 시스템**: Note + Wiki + Folder + SavedView + Bookmark (글로벌) 모두 Mixed Quicklinks에 통합. WikiArticle.pinned 신설 (Store v87).
- **나무위키 Tier 2-4 완료**: 배너 블록 (4 다채로움) + age/dday 매크로 + Include 양방향 + 각주 이미지 + 위키 parent-child. 루비 텍스트는 사용자 결정으로 제거 (한국어 fit X).
- **인포박스 Type 11 프리셋 + 그룹 토글** + Navbox 풀 디자인 (Editorial-Imperial, 다단/그룹/색상/그리드/펼치기) — 둘 다 사용자 비전 그대로 구현.
- **Connections 풀 강화**: 블록 단위 인라인 스니펫 + 호버 풀 프리뷰 + mention 처리 + 위키 source contentJson scan + mention IDB 인덱스 캐시 (O(1) 룩업).
- **Y.Doc PoC → 본 구현 (P0-1 부분)**: y-indexeddb 영속화 + 4 race guard 유지 + side issue (plot-note-bodies / duplicate extensions) 정리.

**Store version**: v82 → v91 (9 마이그레이션, 모두 안전). 핵심: v86~v91은 핫픽스 (infobox undefined / 위키 article pinned / dedup).

**다음 작업 후보**:
- PR 9: 시계열 메트릭 + Wiki Dashboard 통합
- TipTap InfoboxBlockNode group-header 지원 (작은 폴리시)
- P0-2: Wiki Y.Doc 적용 (위험)

---

## 🟢 2026-04-25 — 코멘트 시스템 대규모 + 사이드패널 통합 + 미니맵

**한 세션 18 커밋 — Plot 코멘트 인프라 구축 + 노트/위키 사이드패널 대칭 통합 + 디자인 폴리시.**

### 새로 추가된 시스템

**Comment 시스템 (신규)**:
- Linear 스타일 status: Backlog/Todo/Done/Blocker
- 1단계 답글 (parentId)
- CommentAnchor 4종: note, note-block, wiki, wiki-block
- 인라인 진입점: 위키 모든 블록 8종 + 노트 모든 블록 (BlockDragOverlay 패턴)
- 사이드패널 Activity → CommentsByEntity (블록 + 엔티티 통합)
- Convert to Note 액션 (코멘트 → inbox 노트로 promote)

**통합 작업**:
- Activity 통합: ThreadPanel/ReflectionPanel 폐기 → CommentsByEntity 단일
- Bookmarks 통합: targetKind ("note"|"wiki") + Filter chips + Search
- Connections 통합: 위키 incoming wikilink 추가
- Pin → Bookmark 네이밍 통일 (BookmarkSimple 아이콘)
- Wiki SECTIONS 섹션 제거 (Detail Outline과 중복)

**Navbox 하이브리드** (Wiki 표준 호환):
- Auto: 카테고리 자동 필터 (편의)
- Manual: WikiPickerDialog로 직접 선택 (Wikipedia/나무위키 정통)
- 둘 다 지원, 모드 토글

**미니맵 (Document-level 드롭다운)**:
- Phosphor 아이콘 통일 (이모지 전부 제거)
- 블록 타입별 컬러 stripe (note-ref=blue, image=emerald 등)
- 섹션 = accent 번호 badge (1, 1.1, 2.3.1 — H 아이콘 제거)
- Plot 디자인 시스템과 일관

### 데이터 모델 변경
- Store v76 → **v80** (4 마이그레이션 — v77/v78/v79/v80)
- v77: Comment.status + parentId
- v78: Reflections/Threads → Comments 마이그레이션
- v79: status "note" → "backlog"
- v80: GlobalBookmark.targetKind 백필

### 정책 결정
- **Comment 본질**: 가벼운 메모. 풀 에디터 툴바 X. 라이트 tier (마크다운 + 위키링크 + 해시태그)
- **노트/위키 대칭**: 모든 블록에서 인라인 코멘트 가능 (B 옵션 선택)
- **Pin = Bookmark**: 시각/네이밍 통일

### 다음 방향
- Connections 상세 (어느 블록/코멘트에서 링크되는지 — 별도 7시간 작업으로 미룸)
- TipTap 미니 에디터 추가 발전 (필요시)
- ~~미니맵 G 진화~~ — **폐기 (2026-04-25)**: 현 Document-level 드롭다운으로 충분, 좌/우 항상 보이는 미니맵은 불필요

---

## 🟢 2026-04-23 — Wiki visual polish + PR #215

**PR #215 (2026-04-23, 머지 대기)**:
- Graph → Ontology rename (5파일)
- Encyclopedia TOC: dark-only hardcoded → 디자인 토큰 (라이트/다크 호환)
- 두 모드 공통 updatedAt "최근 수정: N시간 전"
- Default TOC 헤더: "Contents" → "목차" 조용하게
- IDB fix: `plot-note-bodies` DB_VERSION 2 (bodies store 복구)

---

## 🟢 2026-04-22 상태 — Hard reset to PR #194

**현재 branch HEAD**: `3f2e54c` (PR #194: "Tier 1 인포박스 전체 완료 + 위키 디자인 버그 수정")

**대결정**: PR #195 ~ #213 (2026-04-14 저녁 ~ 2026-04-21) 전부 폐기. 2주간 "대결정" 3회 반복 (Column Template → Page Identity → Book Pivot) 패턴 종결.

**폐기 대상**:
- WikiTemplate + 8 built-in (#197)
- 컬럼 시스템 (ColumnRenderer, WikiColumnMenu 등, #198-#205)
- 메타→블록 통합 (infobox/toc 블록화, #208)
- Page Identity Tier 시스템 (#209)
- Book Pivot 5 shell (#211-213)

**유지**:
- Tier 1 인포박스 전체 (heroImage + 헤더 색상 + 섹션 구분 + 리치텍스트 + themeColor)
- Y.Doc PoC + Block Registry (#192)
- 각주 / References / Split View / Library / Expand-Collapse 등
- Default + Encyclopedia 2-layout toggle

**자각**: "매거진/뉴스페이퍼/북 등등은 개발자 자기만족". Plot 코어(지식 관계망, 팔란티어×제텔카스텐)와 직교.

**다음 방향**: **UI 일관성 감사 + 개선**. 사용자 pain point "ui가 너무 이상함, 일관성 없고" 해결. 기능 추가는 당분간 보류.

**⚠️ Git 주의**: 이 branch가 hard reset 상태. `git merge origin/main -X theirs` 실행 시 롤백 자동 취소됨. 곧 commit + PR 해서 main에 반영 필요.

**Claude memory 참조**: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

---

## Identity

Plot = 노트 + 개인 위키 + 지식 관계망
- 겉은 Apple Notes, 속은 Zettelkasten
- 유저는 노트만 쓰고 앱이 알아서 제텔카스텐
- 사상: 팔란티어 × 제텔카스텐 — 개인 지식을 디지털 모델로 만들고 분석/사고/글쓰기를 돕는다

## Architecture Redesign v2 — ALL PHASES COMPLETE ✅

### 4-Layer Architecture

```
Layer 1 — Raw Data:    노트, 태그, 라벨, 폴더, 템플릿
Layer 2 — Ontology:    관계, 분류, co-occurrence (엔진)
Layer 3 — Wiki:        표현 계층 (정리된 참고자료)
Layer 4 — Insights:    패턴 발견 (건강검진)
```

### 구현 Phase (전부 완료)

1. Foundation (v41 wikiStatus, v42 workspaceMode, activeSpace) ✅
2. Layout Automation (WorkspaceMode, auto-collapse) ✅
3. Activity Bar + Top Utility Bar ✅
4. Sidebar Refactor (컨텍스트 반응형) ✅
5. Breadcrumb ✅
6. Wiki Evolution (자동 등재, 초성 인덱스, 목업 매칭) ✅
7. Wiki Collection (Collection slice v43, WikiQuote→WikiEmbed 대체, Extract as Note, Collection sidebar, Red Links) ✅
8. Split View + Library + Reference/Footnote system (v71) ✅

## Current Architecture (현재 코드 기준)

### Store
- Zustand + persist (IDB storage via `lib/idb-storage.ts`)
- Slices (22): notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories, references, global-bookmarks
- Store version: 95
- Types: `lib/store/types.ts`, `lib/types.ts`

### View System
- Always-mounted views via `lib/table-route.ts` + `app/(app)/layout.tsx`
- Mount-once keep-alive pattern (CSS display toggle)
- Responsive NotesTable: ONE grid for all sizes (ResizeObserver + minWidth thresholds)
- 6 Activity Spaces: Inbox / Notes / Wiki / Calendar / Graph / Library
  - Library: 서브라우트 4개 (`/library`, `/library/references`, `/library/tags`, `/library/files`), 사이드바 NavLink (Overview/References/Tags/Files)

### Editor
- TipTap 3 editor — Shared config factory (`components/editor/core/shared-editor-config.ts`)
- 4-tier extension system: `base` | `note` | `wiki` | `template`
- Title 노드 통합: 제목과 본문이 하나의 TipTap 문서 (`components/editor/core/title-node.ts`)
- 25+ extensions (StarterKit, TaskList, Highlight, Link, Table, CodeBlockLowlight, Mathematics, SlashCommand, HashtagSuggestion, WikilinkSuggestion, WikilinkDecoration, FootnoteRefExtension, @mention (노트/위키/태그/날짜 통합), Floating TOC, Anchor/Bookmark, etc.)
- Toolbar: h-14 (56px) bar, w-10 (40px) buttons, Remix Icon (에디터 전용, `lib/editor/editor-icons.ts` barrel). 34 configurable items via Arrange Mode (dnd-kit). Persisted in settings store. More Actions: Pin+Favorites+서브패널
  - Indent Extension: `indent-extension.ts` — paragraph/heading indent 0-8단계 (24px/level, Notion 방식)
- Workspace: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- WorkspaceMode 삭제됨 — sidebarCollapsed + detailsOpen 독립 토글
- Split View 시스템 (PR #172-173): PaneContext + route intercept 패턴. Primary/Secondary 독립 패널. SmartSidePanel primary/secondary 분리. 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state, secondary history navigation
- Wiki-links: `[[title]]` extracted to `Note.linksOut`
- Wiki tier = note tier와 동일한 인라인 제안: `[[` 위키링크, `@` 멘션(노트/위키/태그/날짜/레퍼런스), `#` 해시태그 (PR #182)
- Wiki 문서 레벨 각주: `WikiFootnotesSection` — 위키백과 스타일 하단 통합 목록. FootnoteRefExtension `addStorage({ footnoteStartOffset })` + 블록별 offset 전달로 문서 전체 연번 (PR #182)
- NoteHoverPreview: `layout.tsx` 글로벌 마운트 (노트+위키 모두 호버 프리뷰 동작) (PR #183)
- 공유 유틸: `lib/wiki-block-utils.ts` + `hooks/use-wiki-block-actions.ts` + `wiki-layout-toggle.tsx` (PR #182)

### Knowledge System
- Backlinks: `lib/backlinks.ts` (incremental index, keyword/tag scoring, alias support)
- Search: FlexSearch worker-based (`lib/search/`) with IDB persistence
- Ontology Engine: co-occurrence engine, relation suggestions, wiki infobox, graph view
- Graph: `ontology-graph-canvas.tsx` — SVG 기반, Web Worker 레이아웃, viewport culling, LOD zoom, 노드 형태 분화, 3-tier 엣지

### Wiki Collection System (Phase 7)
- `WikiCollectionItem` type: note | url | image | text
- `wikiCollections: Record<string, WikiCollectionItem[]>` keyed by wikiNoteId
- Edit mode sidebar: Related (auto) + Collected (manual) + Red Links
- WikiQuote: TipTap custom node (atom, blockquote style with source attribution)
- Extract as Note: bubble menu button, creates note + replaces with [[link]]
- Link insertion: click Related/Collected → insert [[title]] at cursor
- Quote insertion: Shift+click → insert WikiQuote block

### Note Lifecycle (병렬 트랙)

```
노트 워크플로우:  inbox → capture → permanent   (처리 상태)
                    ↕        ↕        ↕         (어느 시점에서든 진입 가능)
위키 품질 트랙:   red link → stub → article     (완성도, WikiArticle 별도 엔티티)
```

### Labels vs Tags
- Labels → 노트 타입 (무엇인가): 메모, 리서치, 아이디어
- Tags → 노트 주제 (무엇에 관한 것인가): #투자 #사주 #독서

## Completed Features (최근 5개, 전체는 docs/MEMORY.md 참조)

1. **인포박스 Tier 1-2/1-4 + Default 통합 + 섹션 구분 행 (2026-04-14 밤)**: 나무위키식 인포박스 전면 고도화. **3개 경로 모두 지원** — (A) TipTap `InfoboxBlockNode` (노트 에디터 + 위키 TextBlock 내부 `/infobox`), (B) `WikiInfobox` 컴포넌트 (위키 encyclopedia), (C) **위키 Default 레이아웃에도 동일 인포박스 렌더** (`wiki-article-view.tsx` Aliases 뒤 + Category 앞, encyclopedia와 동일 center/float-right 분기). **사이드바 Infobox 섹션 제거** (`wiki-article-detail-panel.tsx`) — 중복 해소. **Tier 1-2 헤더 색상**: 프리셋 8종 (Default/Blue/Red/Green/Yellow/Orange/Purple/Pink, rgba 0.35) + 커스텀 `<input type="color">` (hex→rgba). `WikiArticle.infoboxHeaderColor?: string | null` + `headerColor`/`onHeaderColorChange` props. PaintBucket 버튼 `showColorPicker || headerColor` 상시, 아니면 hover. 팝오버 `absolute right-2 top-[calc(100%+4px)]`. `onHeaderColorChange` 없으면 피커 자동 숨김 (read-only 자동 대응). **Tier 1-4 섹션 구분 행**: `WikiInfoboxEntry.type?: "field" | "section"` optional 필드 + TipTap `InfoboxRow` 동일. Section row = full-width bold uppercase + tinted bg (`bg-secondary/40`) + value 숨김. Edit UI에 "Add section" 버튼 (Add field와 나란히). **Migration 없음** — 전부 optional 필드. verify: 3경로 모두 렌더 + layout 전환 시 색/섹션 유지 확인. **중장기 TODO**: `WikiInfobox` → `InfoboxBlockNode` 통합 (base 티어 단일화).
2. **Insert Block Registry 단일화 (2026-04-14 밤)**: `components/editor/block-registry/` 신설. 25+ insertable block operations 단일 source. 기존 3곳 중복 제거: SlashCommand.tsx (COMMANDS 배열 → `getBlocksForSurface("slash")`), insert-menu.tsx (JSX 하드코드 → `BLOCK_REGISTRY.filter` + group 정렬), FixedToolbar.tsx (인라인 체인 13개 → `getBlock(id).execute({ editor })`). Shape: `{id, label, description, aliases, icon, surfaces, group, tier, execute({editor, range?, noteId?})}`. range 유무로 slash path(blank attrs) vs click path(example attrs) 분기. 첨부(Image/File)는 ref 의존성으로 registry 제외. 검증: InsertMenu 20 항목 렌더 + Callout(HTML 344→2590) + Divider(hr 0→1) + Toggle(details 0→1) + Slash popup 25+ 항목. 이제 새 블록(배너, 둘러보기 틀)은 registry.ts 한 파일에 entry 추가만으로 3곳 자동 노출.
3. **Y.Doc Split-View Sync PoC (2026-04-14)**: 같은 note를 두 pane에서 열면 Y.Doc 싱글톤이 공유되어 실시간 bidirectional CRDT sync 작동. `lib/y-doc-manager.ts` (refcount registry + isFresh flag), `@tiptap/extension-collaboration` 바인딩, `?yjs=1` / `window.plotYjs(true)` / localStorage 3-way feature flag. Dev-only `window.__plotStore` 노출. 핵심 버그 4개 해결: (1) StarterKit 3.x는 `undoRedo` (`history` 아님) — Collaboration과 충돌 해소, (2) `fragment.length === 0` seed guard 제거 (Collab pre-populate 때문에 영원히 truthy) — `isFresh` 플래그로 권위 있는 signal 사용, (3) **Stale Y.Doc binding** — `useState + useEffect` 패턴이 note 전환 시 한 렌더 사이클 동안 이전 Y.Doc 노출 → 새 editor가 이전 Y.Doc에 seed → 다른 pane으로 CRDT 전파 → 데이터 영구 손실. `useRef` + 렌더 중 동기 전환으로 교체, (4) **Empty-content guard의 임계값 실패** — `JSON.stringify(json).length < 80` 조건이 Collab pre-populate의 UUID-stamped 빈 paragraph (~125자)에 무효화됨. `looksEmpty = !plainText.trim()` 로 단순화 + `ui.ts` auto-delete 연쇄로 노트 소멸까지 이어짐.
4. **PR #190**: Reference Usage + Note History + Wiki Activity 정리 + chevron 비활성 — 사이드패널 Usage 섹션, ActivityTimeline 연결, Wiki Stats 중복 제거, 접을 게 없을 때 비활성
5. **PR #189**: Expand/Collapse All + 위키 TOC 버그 + TextBlock 드래그 핸들 + 리사이즈 — 나무위키식 전체 접기/펼치기, TocBlockNode wiki 티어 등록, BlockDragOverlay 위키 통합, 4코너 리사이즈 + Store v75

## Two Axes — Core Design Philosophy

```
Thread        → 깊이축  (지금 이 생각을 파고드는 실시간 전개)
Reflections   → 시간축  (시간이 지난 후 과거 노트를 회고)
```

> Relations(공간축)은 UI에서 삭제 — 백링크+위키링크+Discover 추천으로 충분. store slice는 유지.

## Key Design Decisions

- **LLM/API 사용 안 함** — 전부 규칙 기반 + 통계 기반 + 그래프 알고리즘. 오프라인, 프라이버시, 비용 0
- **독립 공간 구조 유지, 노션식 통합 템플릿 폐기** — 5개 공간이 각각 최적화된 UX 제공. "유저는 노트만 쓰고 앱이 알아서" = IKEA 전략. 노션식 "빈 캔버스 + 블록 조합" 방향 포기 (2026-04-01)
- **Activity Bar 6-space**: Inbox / Notes / Wiki / Calendar / Graph / Library — Library 6번째 공간 추가 (PR #165, 2026-04-08)
- **Wiki 사이드바 4-항목**: Overview / Merge / Split / Categories (+ Views 섹션). Categories = 2-panel 트리 에디터
- **Wiki Layout 프리셋**: `"default" | "encyclopedia"` — article별 전환. Encyclopedia = 나무위키식 (인라인 인포박스, 목차, 분류 태그)
- **Wiki URL 블록**: 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에서 추가
- **WikiStatus 삭제**: stub/article 구분 폐지 (v67). 위키 문서는 존재하거나 Red Link(computed)만 (2026-03-31)
- **isWiki→noteType**: `Note.isWiki: boolean` 삭제 → `noteType: "note" | "wiki"` 디스크리미네이터 (v66, 2026-03-31)
- **Home = Knowledge Intelligence Panel**: Inbox 독립 공간 폐지 → Home 대시보드. 사이드바에 Unlinked Mentions/Suggestions/Orphans/Knowledge Health 실시간 지식 인텔리전스. 사이드바 클릭 → 메인 영역 드릴다운 (Linear 패턴) (2026-03-31)
- **Ontology 네이밍**: Activity Bar "Graph" → "Ontology". 사이드바 Graph 아이콘 → ChartBar (2026-03-31)
- **Wiki Coverage→Uncategorized**: 대시보드 3번째 지표. Coverage(모호) 제거 → Uncategorized(카테고리 없는 문서 수) (2026-03-31)
- **Display = List/Board만**: Insights/Calendar는 사이드바/Activity Bar 전용
- **Graph Health → /graph-insights 페이지**: 사이드바는 필터/컨트롤 패널
- **필터/디스플레이 먼저, 사이드바 정리 나중에**: 기능이 동작해야 사이드바 의미 있음
- **Phase 4-D Context Panel 보류**: 각 공간별로 이미 컨텍스트 패널 존재
- **글로벌 탭 도입 안 함**: 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행. Linear는 멀티패널이 없어서 탭 필요하지만 Plot은 사이드바+멀티패널로 커버
- **View = 사이드바 섹션**: Linear의 View(상단 탭 프리셋)를 사이드바 Views 섹션으로 구현. 한눈에 전체 구조 파악 가능, 액티비티별 독립
- **+ 버튼 = ViewHeader 우측**: top-utility-bar에서 제거, ViewHeader의 필터 아이콘 옆 `+` 아이콘으로 통일
- **위키 카테고리 = 계층적 트리**: 태그/라벨은 flat(동등), 카테고리만 parentId 기반 트리. 위키백과식 지식 분류 체계
- **카테고리 페이지 = 사이드바 최상위**: Overview/Merge/Split과 동급. List + Board 2모드
- **카테고리 List/Board 2모드**: Tree 모드 제거 완료. Board = Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
- **카테고리 Tier 네이밍**: depth 0=1st, depth 1=2nd, depth 2+=3rd+ (무한 depth 허용, Board에서 3rd+ 합침)
- **카테고리 우측 사이드바 3상태**: 미선택=All Overview, 단일선택=Category Detail, 멀티선택=Batch Actions
- **Family 그룹핑**: 같은 루트 조상 아래 전체를 묶고 들여쓰기로 depth 표현 (리스트+트리 하이브리드)
- **캘린더 플로팅 액션바 삭제**: 불필요하다고 판단 (2026-03-25)
- **TopUtilityBar 제거**: Back/Forward/Search를 사이드바 헤더로 이동. 44px 공간 확보 (2026-03-26)
- **사이드바 닫기/열기 = Plane식**: 닫으면 완전 숨김. ActivityBar 상단 열기 버튼. space 클릭으로 열리지 않음 (2026-03-26)
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제. 사이드바 버튼으로만 열림. previewNoteId로 리스트 행 클릭 시 내용 업데이트 (2026-03-26)
- **Priority UI 완전 삭제**: 디테일 패널에서도 제거. Pin + Labels로 충분 (2026-03-26)
- **sidePanelOpen persist 안 함**: 앱 시작 시 항상 닫힌 상태 (2026-03-26)
- **Relations UI 삭제**: 백링크+위키링크+Discover 추천으로 공간축 충분. store slice 유지, UI만 제거 (2026-03-28)
- **Connections = Connected+Discover 2섹션**: Connected(← inbound notes/wiki, → outbound notes/wiki, unlinked mentions) + Discover(추천 notes/wiki/tags). 방향 화살표로 직관적 구분 (2026-03-28)
- **Peek wiki fallback**: wiki article ID → title match → note lookup. 위키 블록 직접 편집은 Phase 2A 스코프 (2026-03-28)
- **Side Panel = Unified SmartSidePanel**: 4-tab: Detail + Connections(Connected/Discover) + Activity(Thread/Reflection) + Bookmarks. Peek as fallback. Relations UI 삭제. primary/secondary 독립 패널 (PR #173)
- **Split View = PaneContext + route intercept**: 4-column flat layout (layout.tsx + WorkspaceEditorArea). secondarySpace URL state. secondary history navigation. SmartSidePanel primary/secondary 분리 (PR #172-173)
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 280px 사이드바 제거, 글로벌 Details 패널에서 표시. Notes와 동일 패턴 (2026-03-26)
- **카테고리 더블클릭 에디터**: 싱글클릭=선택(하이라이트만), 더블클릭=폼 에디터 split view. 이름/설명 인라인 편집, Parent 드롭다운, 서브카테고리 +New/Move here (2026-03-26)
- **노트 ≠ 위키**: Note와 WikiArticle은 완전 별도 엔티티. isWiki→noteType 리팩토링 완료 (2026-03-31)
- **Stub 부활 (heuristic 방식)**: 상태 필드 없이 블록 수 + 내용 비어있음으로 판정. 기본 템플릿(Overview/Details/See Also) 에서 변경 없으면 stub. 블록/내용 추가 → article 자동 승격 (2026-04-05)
- **Note/Wiki 2-entity 철학 확정 (2026-04-14)**: 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. Note / WikiArticle 별도 엔티티 유지. **차별점의 원천 = 데이터 구조** (TipTap JSON vs WikiBlock[]). 렌더러(Layout Preset)는 위키 전용 — 노트엔 만들지 말 것. 자세한 배경은 `BRAINSTORM-2026-04-14-entity-philosophy.md`
- **위키 템플릿 3층 모델 (2026-04-14)**: Layer 1 Layout Preset (렌더러, default/encyclopedia/wiki-color) + Layer 2 Content Template (섹션+인포박스 뼈대, Person/Place/Concept 등 타입별) + Layer 3 Typed Infobox (C-3). 노트 템플릿은 별개 시스템 (NoteTemplate slice, UpNote식 단순 복사 시드)
- **[[드롭다운 Create Note + Create Wiki**: 노트는 inbox에 생성, 위키는 빈 WikiArticle(stub) 생성. 위키 아이콘 = IconWiki (액티비티바 통일) (2026-04-05)
- **Auto Create 방향 결정 (미구현)**: Red Link → "Unresolved Links"로 개념 전환. 빨간색→회색 점선, 클릭 시 노트/위키 선택 팝업. Wiki에서 Red Links 제거 → Home "Unresolved Links"로 통합 (2026-04-05)
- **인사이트 중앙 허브 방향 결정 (미구현)**: 온톨로지 = 모든 인사이트의 원천 (Single Source of Insights). Notes/Wiki 각 공간 인사이트는 온톨로지에서 파생. 세이브매트릭스급 지표 (Knowledge WAR, Link Density, Stub Conversion Rate 등) (2026-04-05)
- **@멘션 = 노트/위키/태그/날짜 통합**: `@` 트리거, WikiArticle 별도 검색, 카테고리별 그룹핑 (2026-03-30)
- **플로팅 TOC = Notion 스타일**: 에디터 우측 자동 사이드바, 대시 인디케이터, hover 확장, scrollspy. 첫 heading(타이틀) 제외 (2026-03-30)
- **앵커/북마크 2종**: 인라인 마커(anchorMark) + 블록 구분선(anchorDivider). TOC + 사이드패널 Bookmarks 탭 통합 (2026-03-30)
- **Columns = CSS Grid + 테이블 스타일 border**: renderHTML 기반 columnCell, resize handle, 외곽선+셀간 border-right (2026-03-30)
- **Make Block 폐기**: Turn Into가 대체. 래퍼로 감싸는 UX가 직관적이지 않음 (2026-03-30)
- **디자인 폴리싱 방향 = Notion**: Linear 레이아웃 + Notion 에디터 블록 디자인 참고 (2026-03-30)
- **TOC = 수동 + 블록피커**: 자동 헤딩 수집 제거. + 버튼 = 문서 내 모든 블록 검색 피커, 1클릭으로 항목+링크 생성. 더블클릭 편집, 드래그 순서변경, Tab 들여쓰기 (2026-04-01)
- **Merge Blocks**: 멀티 선택 → hardBreak로 하나의 paragraph 병합 (Make Block 대체). Wrap in(Callout/Summary/Block) 별도 유지 (2026-04-01)
- **Toggle = 노션식 (배경 없음)**: border/background 제거. ▶+텍스트 flex 한 줄. 접힌 내용은 left-border 들여쓰기 (2026-04-01)
- **Side-drop 컬럼 자동생성 제거**: 드래그로 columns 안 만들어짐. Insert 메뉴로만 생성 (2026-04-01)
- **인포박스 읽기모드**: readOnly + 삭제/추가 버튼 숨김. Add row = hover-only (2026-04-01)
- **Memo 라벨 자동 부여**: 노트 생성 시 labelId 없으면 "Memo" 라벨 자동 할당. 없으면 자동 생성. 기존 노트도 rehydrate 시 backfill (2026-04-01)
- **Delete Block 우클릭 메뉴**: 모든 블록에 적용. details/columns 같은 compound 블록은 skipTypes로 올바른 depth 탐색 (2026-04-01)
- **드래그 핸들 블록 메뉴**: ⠿ 짧게 클릭=메뉴(Turn Into/Insert Below/Duplicate/Move/Delete), 누르고 5px 이동=드래그. pointerUp + pointerEvents 전환 (2026-04-01)
- **Embed Note = 노트 피커**: Insert→Embed Note 클릭 시 NotePickerDialog 열림. 선택한 noteId로 미리보기 카드 삽입. Synced Block(본문 편집)은 Phase 2+ (2026-04-01)
- **WikiQuote 폐기**: WikiEmbed가 상위 대체. 호버 프리뷰 Quote 버튼 + insert-wiki-quote 이벤트 + WikiQuoteExtension/Node 전부 삭제 (2026-04-06)
- **Footnote = "에디터 접점", Reference = "저장소"**: `/footnote` 슬래시 커맨드, `[[`/`@` 드롭다운 모두에서 각주 생성/참조 가능. 유저는 Footnote만 알면 됨, Reference는 뒤에서 자동 생성 (2026-04-06)
- **에디터 아이콘 = Remix Icon**: Phosphor light → Remix. 에디터 전용, 나머지 앱 UI는 Phosphor 유지. `lib/editor/editor-icons.ts` 중앙 barrel 101매핑 (2026-04-07)
- **Indent = margin-left 레벨**: blockquote 감쌈 폐기 → 24px 단위 8단계 (Notion 방식). `indent-extension.ts` (2026-04-07)
- **More Actions = 풀 기능 허브**: Pin 고정, 우클릭 Favorites (persist), 서브패널 (컬러피커/테이블/이미지). 에디터 모든 기능 접근 가능 (2026-04-07)
- **Embed Note 기본 Synced**: 삽입 시 전체 내용 인라인 표시. Preview 카드는 토글로 전환 (2026-04-07)
- **WikiEmbed 높이 무제한**: max-h 제거, 위키 문서 전체 펼침. 리사이즈 시 스크롤 (2026-04-07)
- **Math 툴바 기본 hidden**: SlashCommand로 접근. Arrange Mode에서 복원 가능 (2026-04-07)
- **Reference = 인포박스식 자유 키-값**: `fields: Array<{key,value}>`. Type 없음 — 앱이 content에서 URL/연도 자동 감지. Quick Note(fields 비면)→Full Reference(fields 있음) heuristic (2026-04-06)
- **Library = References + Tags(글로벌) + Files**: 6번째 Activity Bar 공간. Labels는 노트 전용 유지, Tags만 글로벌 승격 (2026-04-06)
- **Library 사이드바 NavLink**: 상단 탭 제거 → 사이드바 NavLink (Overview/References/Tags/Files). Wiki 패턴 동일 (2026-04-07)
- **Reference 디테일 = SmartSidePanel**: 별도 풀페이지 에디터 없음. Title/Content/Fields 사이드패널 편집 (2026-04-07)
- **Reference에 Tags 없음**: fields(key-value)가 메타데이터 역할. Tags는 노트/위키 전용 (2026-04-07)
- **각주→Reference 자동 연결**: footnote save 시 referenceId 없으면 자동 createReference. content 양방향 동기화 (2026-04-07)
- **각주 타임라인**: createdAt 자동 기록 + Reference.history로 수정 이력 (2026-04-06)
- **Tags Library 통합**: Notes "More"에서 Tags 제거, `/library/tags`로 통합. Capacities 패턴 (2026-04-08)
- **References/Files soft delete**: trashed/trashedAt 필드, 복원 가능. Store v71 (2026-04-08)
- **Reference = 통합 참고자료 (옵션3 하이브리드)**: url 필드 있으면 Link형, 없으면 Citation형으로 자동 분기. 새 엔티티 없이 Reference 하나로 통합. 위키백과 철학 차용 — `[[]]`=내부링크, 각주=하단URL, referenceLink=외부링크(🔗 시각 구분). `[[`/`@` 드롭다운에서 url 있으면 referenceLink 노드, 없으면 footnoteRef 노드 자동 삽입. Shift+클릭=반대 모드. Quick Filter에 Links 추가 (2026-04-08)
- **위키 레이아웃 프리셋 = 공유 유틸 추출**: 1파일 통합 대신 순수 함수/훅/컴포넌트 추출 방식. 두 렌더러(Default/Encyclopedia)의 구조적 차이가 커서 통합 시 분기 20개+ 발생 (2026-04-12)
- **위키 문서 레벨 각주 = offset 방식**: 블록별 `footnoteStartOffset`으로 문서 전체 연번. `onFootnoteCount` 콜백으로 블록별 각주 개수 수집 → 누적 offset 계산 (2026-04-12)
- **EncyclopediaFooter 삭제**: 사이드바에서 이미 Sources/Properties 표시. 본문 중복 제거 (2026-04-12)
- **드롭다운 아이콘 색상 체계**: Wiki stub=#f59e0b(주황), article=#8b5cf6(보라). CircleDashed/CircleHalf/CheckCircle는 Phosphor 직접 import (Remix 매핑 부정확) (2026-04-12)
- **NoteHoverPreview 글로벌**: TipTapEditor에서 layout.tsx로 이동. 위키 텍스트 블록에서도 호버 프리뷰 동작 (2026-04-12)
- **위키 텍스트 블록 click-outside 가드**: `.tippy-content` + Radix Portal + `role=menu/dialog` 클릭은 "내부"로 인식 (2026-04-12)
- **FootnoteEditModal = Reference 모달 통합**: Title+Content+URL 3필드. 각주/레퍼런스 동일 UX. 인라인 미니 에디터 폐기 (atom node 포커스 충돌) (2026-04-12)
- **위키 하단 References 섹션**: Footnotes(번호) + References(불릿) 위키백과 2단 구조. WikiArticle.referenceIds로 문서↔Reference 직접 연결 (2026-04-12)
- **Reference 사이드패널 = Library 전용**: 위키에서는 모달로 편집 (사이드패널 context 고착 방지) (2026-04-12)
- **footnote 에디터 티어**: StarterKit 최소 + Link + Underline. 테이블/이미지/슬래시/멘션 제외 (2026-04-12)
- **각주 read-only 가드**: footnote-node.tsx + footnotes-footer.tsx — `editor.isEditable` 체크. 리드 모드에서 모달 안 열림 (2026-04-13)
- **위키 footnote 삽입 버그 수정**: footnote-edit-modal.tsx에 `role="dialog"` 추가. 위키 TextBlock click-outside 가드가 모달을 "외부"로 인식해 에디터 언마운트 → debounce 저장 실패하던 문제 해결 (2026-04-13)
- **위키 Footnotes/References 컴팩트 디자인**: TipTap EditorContent 제거 → 단순 텍스트. `▶ FOOTNOTES N` / `▶ REFERENCES N` 토글. text-base 헤더 + text-[14px] 내용 (2026-04-13)
- **노트 References 하단 섹션**: `footnotes-footer.tsx` NoteReferencesFooter 컴포넌트. 각주 referenceId 수집 → `▶ REFERENCES N` 불릿 목록. 기본 collapsed (2026-04-13)
- **Footnotes+References 분리 유지 (확정, 2026-04-13)**: 합치기 논의 후 번복. FOOTNOTES(번호 각주)와 REFERENCES(불릿 참고자료) 2개 섹션 분리. 라이브러리 References와 이름 같아도 OK (같은 엔티티, 다른 스코프)
- **노트 References 시스템 (2026-04-13)**: `Note.referenceIds: string[]` + Store v74. NoteReferencesFooter 모달(검색/생성/편집 3모드). Insert/`/reference`/하단 `+` 진입점. `[[`/`@`는 항상 FootnoteRef [N]만 (불릿은 인라인 삽입 도구에서 넣지 않음)
- **Reference 아이콘 = Book (RiBookLine)**: Bookmark(BookmarkSimple)/BookOpen/Article과 구분 (2026-04-13)
- **em 기반 fontSize cascade (2026-04-13)**: 위키 타이틀/섹션/각주의 rem/px Tailwind 클래스를 em으로 전환. 글로벌 Aa 스케일 + 섹션별 개별 fontScale 동시 동작. fontScale은 섹션 wrapper에 적용 (개별 heading X)
- **위키 텍스트 display 컴팩트 (2026-04-13)**: `.wiki-text-display` 클래스. ProseMirror min-height:unset + p margin:0. 편집→읽기 전환 시 간격 차이 해소
- **Expand/Collapse All = 나무위키 패턴 (2026-04-13)**: 노트 chevron 버튼(PushPin 왼쪽) + 위키 기존 버튼 확장. `plot:set-all-collapsed` CustomEvent 브로드캐스트. Details/Toggle + Summary + Footnotes + References 전부 대상. 노트: hasCollapsibles 조건부 표시, Details `open` attr 일괄 토글. 위키: 기존 섹션 접기 + 내부 collapsible + footer까지
- **위키 TOC 버그 수정 (2026-04-13)**: TocBlockNode + TableOfContents가 note 티어에만 등록되어있던 버그. wiki 티어에 추가 (`shared-editor-config.ts`)
- **위키 TextBlock 드래그 핸들 (2026-04-13)**: `WikiTextEditor`에 `BlockDragOverlay` 래핑. `pl-8` 좌측 패딩으로 핸들 거터 확보. 기존 note 에디터 패턴과 동일
- **위키 TextBlock 4코너 리사이즈 (2026-04-13)**: `WikiBlock.editorWidth/editorHeight` persist (Store v75). 편집 모드에서만 적용, 읽기 모드는 full width 유지. `block-resize-corner` CSS 재활용. 4코너(tl/tr/bl/br) 핸들. `⋯` 메뉴에 "Reset editor size" 버튼 (ArrowsIn)
- **Reference Usage 섹션 구현 (2026-04-14)**: `reference-detail-panel.tsx` Usage "Coming soon" → 실제 노트/위키 사용처 목록. `notes.filter(referenceIds.includes)` + `wikiArticles.filter`. 클릭 → openNote / navigateToWikiArticle
- **Note History 연결 (2026-04-14)**: `side-panel-activity.tsx` History placeholder → `ActivityTimeline` 컴포넌트 연결. noteEvents 기반 이벤트 타임라인 (25 이벤트 타입, 색상 도트 + verb + 상대시간)
- **Wiki Activity 정리 (2026-04-14)**: Article Stats 제거 (Detail Properties와 중복). "Thread & Reflections not available" 제거. "Wiki article history is not yet available" 간결 안내로 교체
- **Expand/Collapse All 항상 표시 (2026-04-14)**: `hasCollapsibles` 조건 제거 → 버튼 항상 렌더. 접을 게 없으면 disabled + 흐릿 (`text-muted-foreground/20`). Details 토글 = DOM 클릭 방식 (setNodeMarkup 대신). hasCollapsibles 체크: details/summary/footnoteRef/referenceIds

## TODO: Future Work (우선순위 순, 2026-04-14 sync)

### ✅ P0 — Split-First 마이그레이션 — ALL COMPLETE
### ✅ P0 — 노트 References + fontSize cascade — ALL COMPLETE
### ✅ P2 — Reference Usage — COMPLETE
### ✅ P0 — Y.Doc Split-View Sync PoC — COMPLETE (2026-04-14)

### P0 — Y.Doc 본 구현 (PoC → 프로덕션)
- **PHASE-PLAN 리뷰 + PoC 결과 반영** — 현재 in-memory Y.Doc, 리로드 시 CRDT history 유실
- **y-indexeddb 영속화** — 오프라인 undo history + 장래 collab 대비
- **Wiki 동일 패턴 적용** — `WikiEditorAdapter`에 `acquireYDoc("wiki", id)` 바인딩. NoteEditorAdapter가 해결한 4개 버그 동일 적용 필수 (특히 sync-during-render 패턴 + plainText-only empty guard)
- **방어 가드 유지** — `NoteEditorAdapter.handleChange` 의 empty-refuse 가드 + `note.title` 포함된 `storeHasContent` 판정은 본 구현에도 유지 (다른 race 방어)
- **플래그 제거 or 기본 ON** — 안정화 후 `?yjs=1` 없이도 동작하게
- **사이드 이슈**: `plot-note-bodies` IDB object store 누락 (NotFoundError 반복), TipTap duplicate extension names 경고 (link/underline/gapCursor)

### P2 — 인포박스 고도화 + 나무위키 리서치 기능 (나무위키 수준, base 티어 = 노트+위키 공용)
**Tier 1 — 인포박스:**
- ✅ **대표 이미지 + 캡션 (PR #192, 2026-04-14)** — heroImage/heroCaption attrs, URL prompt, hover Add/Remove
- ✅ **헤더 색상 테마 (2026-04-14 밤)** — 노트(TipTap `InfoboxBlockNode`) + 위키(`WikiInfobox` 컴포넌트) 양쪽 지원. 프리셋 7색 + 커스텀 color input, rgba 0.35, PaintBucket 팝오버. `WikiArticle.infoboxHeaderColor` 필드 (optional, migration 없음). 중장기 TODO: `WikiInfobox` → `InfoboxBlockNode` 통합 (base 티어 단일화)
- ✅ **인포박스 접기/펼치기 (PR #192, 2026-04-14)** — chevron 토글 + `plot:set-all-collapsed` 이벤트 리슨
- ✅ **섹션 구분 행 (2026-04-14 밤)** — 나무위키 스타일 그룹 헤더 (bold + uppercase + tinted bg, value 숨김). `WikiInfoboxEntry.type?: "field" \| "section"` optional 필드 (backward compat). TipTap `InfoboxRow` 도 동일. Edit UI에 "Add section" 버튼 (field와 나란히). 세 경로 모두 지원 (Default/Encyclopedia/TipTap 노드)
- ✅ **필드 값 리치텍스트 (2026-04-14 밤)** — 공용 `InfoboxValueRenderer` (`components/editor/infobox-value-renderer.tsx`). 지원: `[[title]]` 위키링크 (article/note resolve + dangling dashed), `[text](url)` 외부링크, `![alt](url)` 인라인 이미지 (h-[1.25em]), bare `https?://` auto-link. 보안: `isSafeUrl` (http/https/data:image/ 경로만). 편집 모드는 raw text input 유지, **읽기 모드에서만 리치 렌더**. WikiInfobox + InfoboxBlockNode 모두 적용. **Tier 1 완료** 🎉
**Tier 2 — 새 블록 타입 (base 티어):**
- **배너 블록** — 배경색 + 제목 + 부제 (노트 Insert + 위키 TextBlock 공용)
- **둘러보기 틀 (Navigation Box)** — 관련 문서 그룹 박스 (접기 가능)
**Tier 3 — 유틸리티 매크로 (인라인):**
- **나이 계산** `[age(YYYY-MM-DD)]` — 만 나이 자동
- **D-Day** `[dday(날짜)]` — 남은 날 자동
- **Include** — 다른 문서 내용 현재 위치에 삽입
**Tier 4 — 고급:**
- **상위/하위 문서 관계** — 부모-자식 문서 계층
- **각주 이미지** — FootnoteEditModal 이미지 첨부
- **루비 텍스트** — 한자/일본어 읽기 표시
**아키텍처:**
- 모든 새 기능 = base 티어 (노트+위키 공용, shared-editor-config.ts)
- ✅ **Insert 레지스트리 단일화 완료 (2026-04-14 밤)** — `components/editor/block-registry/` 25+ entry 단일 source. 새 블록 추가 시 registry.ts 한 파일만 수정하면 slash + insertMenu 자동 노출. FixedToolbar 퀵액세스는 `getBlock(id).execute({editor})` 호출

### P2 — 인사이트 허브
- **인사이트 허브** — 온톨로지 Single Source of Insights

### P2 — 노트 Split (must-todo, 2026-04-14 확정)
- **노트 split 기능** — 위키처럼 안정적 split UX. Medium 난이도, PR 하나 분량
- **UX = WikiSplitPage 패턴 그대로** (`components/views/wiki-split-page.tsx`). 사용자 명시: "노트 스플리트도 이런 식으로 되면 이상적"
  - 2-column UI: Original Note (체크박스 + 블록 타입 배지) / New Note (이동된 블록 preview)
  - Shift+Click 범위 선택, Back/Cancel, 하단 Title 입력 + "Split N Blocks"
- 기술 가능성 확인됨: UniqueID extension으로 top-level 노드 23종이 영속 ID 보유 (`shared-editor-config.ts:361`). 위키 splitMode UI 재사용
- 새 파일: `components/views/note-split-page.tsx` (wiki 템플릿 복사 + TipTap 조작으로 교체) + `lib/store/slices/notes.ts`에 `splitNote` 액션
- 우선순위: 위키 디자인 강화 (wiki-color, themeColor, Hatnote 등) 이후
- 배경: `BRAINSTORM-2026-04-14-entity-philosophy.md`, `project_note_split_todo.md`

### P3 — 사이드패널 + 뷰 확장
- **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식)
- **동음이의어 해소 페이지** — 멀티 링크 매칭 시 선택 화면
- **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드

### P4 — 지능 + 검색
- 요약 엔진, 풀페이지 검색 분리
- 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

## Calendar 리디자인 설계 (확정)

### 정체성

Calendar = **Cross-Space 시간 대시보드**. Notes/Wiki/Graph 어디에도 속하지 않는 독립 공간.
"시간 축에서 내 지식 활동이 어떻게 분포되는가"를 보여주는 곳.

### 핵심 원칙

1. **모든 엔티티를 시간 축에 표시** — 노트뿐 아니라 위키, 태그, 라벨, 폴더, 관계, 템플릿 전부
2. **레이어 시스템으로 밀도 제어** — 자주 발생하는 이벤트는 기본 ON, 드문 이벤트는 기본 OFF
3. **기존 필터 인프라 재사용** — FilterPanel, DisplayPanel 그대로 적용
4. **Calendar는 Notes의 뷰 모드가 아님** — 독립 공간으로서 cross-space 통합 뷰

### Date Source

| 필드 | 의미 | "Calendar by" 선택 가능 |
|------|------|------------------------|
| createdAt | 생성일 | ✅ (기본) |
| updatedAt | 수정일 | ✅ |
| reviewAt | 리뷰 예정일 | ✅ |

### 레이어 (Display 토글)

| 레이어 | 기본값 | 이벤트 |
|--------|--------|--------|
| Notes | ☑ ON | 노트 생성/수정 |
| Wiki | ☑ ON | 위키 문서 생성/수정/상태변경 |
| Reminders | ☑ ON | snoozed 노트 reviewAt |
| Relations | ☐ OFF | 관계 생성 |
| Tags/Labels/Folders | ☐ OFF | 태그·라벨·폴더 생성 |
| Templates | ☐ OFF | 템플릿 생성 |

### Display Modes (캘린더 내)

| 모드 | 용도 |
|------|------|
| Month | 전체 흐름 파악 (기본) |
| Week | 주간 디테일 |
| Agenda | 날짜별 그룹된 리스트 (텍스트 밀도 최고) |

**Timeline(Gantt) 뷰는 제외** — 노트는 "시점" 데이터이지 "기간" 데이터가 아님.

### Filter

기존 FilterPanel 재사용:
- Status (inbox/capture/permanent)
- Tags, Labels, Folders
- Space (Notes만 / Wiki만 / 전체)
- Date range

### 인터랙션

| 액션 | 동작 |
|------|------|
| 빈 날짜 + 클릭 | 해당 날짜로 노트 생성 |
| 아이템 클릭 | Side peek / 에디터 열기 |
| 날짜 숫자 클릭 | Week/Day 뷰로 드릴다운 |
| ← → 키 | 월/주 이동 |

### Calendar 사이드바

- 미니 캘린더 (월간, 날짜 점프)
- 오늘의 요약 (생성 N, 수정 N, 리뷰 N)
- Views 섹션 (Calendar 커스텀 뷰)
- Upcoming (다가오는 리마인더)

## 참조 문서

- `docs/SYNC-PRD.md` — **★ 다중 기기 sync PRD (Phase 분할 + 기술 architecture)**
- `docs/SYNC-DESIGN-DECISIONS.md` — Sync 6개 결정 + 옵션 비교 + 위험
- `docs/TODO.md` — 우선순위 P0/P1/P2 (P0 = 다음 세션 즉시 시작점)
- `docs/SESSION-LOG.md` — 세션 history (최신 entry 가장 위, "다음 즉시 액션 hook" 포함)
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 상세
- `docs/TODO.md` — Phase 진행 추적
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- `docs/DESIGN-AUDIT.md` — 전수 디자인 감사 결과 + 5-Phase Design Spine 실행 계획
