# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-14 밤 후속 (PR #322-#327 + #329-#331 9 PR — entity-uniformity 풀 + time grouping + books-divider + Library Files Detail + Template anchor)

---

## 🔴 P0 — 즉시 (다음 세션, cross-machine)

### 다음 머신에서 시작 절차
1. `git pull origin main` (PR #322-#327, #329-#331 머지된 main 받음)
2. `npm install` (새 worktree 또는 dependency drift 가능)
3. `npm run dev` → :3002 hard refresh (Ctrl+Shift+R)

### Manual verify 9 surface (PR #322-#327 + #329-#331)

**낮~밤 6 PR** (entity-uniformity + time grouping + books-divider):
1. **Template Detail 재설계** (#322) — /templates Daily Log 클릭 → Detail에 Dates / Outline / Properties=stats (Words/Chars/Headings/Placeholders) / Actions. Label/Folder/Tags 사라짐. "Template → Note" 버튼.
2. **Wiki Stub badge** (#322 보너스) — /wiki Working Memory (stub) → Detail header에 "Wiki Stub" muted badge.
3. **Book 사이드바 4탭** (#323) — /books Getting Started Guide → ⌘B → Detail (Kind/Smart sources/Chapters/Properties/Actions) / Connections (Items by kind & status) / Activity / Bookmarks.
4. **Connections status dots** (#324) — /notes 노트 클릭 → Connections 탭 → "→ Notes" 옆 status dots.
5. **Book Bookmarks IN THIS BOOK** (#325) — /books * → Bookmarks 탭 → "IN THIS BOOK" 섹션.
6. **Books list divider X + checkbox w-8** (#326 + #326 update) — /books list mode → 행 사이 구분선 사라짐 + Notes와 checkbox column 같은 위치 (w-8).
7. **Time grouping** (#327) — /notes Display panel → Group by → "Updated" → "Today/Yesterday/This Week/This Month/Older" 그룹.

**밤 후속 3 PR** (PR 4a + Library 확장):
8. **Template anchor pinning** (#329) — /templates Daily Log → Bookmarks 탭 → 본문 anchor 보임 + pin/unpin 작동. globalBookmarks에 `targetKind: "template"` 저장.
9. **Library Files Detail panel** (#330 + #331) — /library Files → 파일 클릭 → 사이드바 자동 open + Detail (Dates/Source/Used in/Properties + Open in new tab). row 사이 구분선 X.

---

## 🟡 P1 — 다음 PR 후보 (사용자 시그널 "다 순차" — 우선순위 1~4 순서)

### 1. Library Tags Detail panel 신설
PR #331 (Files Detail panel) 패턴 그대로 적용.
- `SidePanelContext`에 "tag" 추가
- `useSidePanelEntity` tag 분기 (Tag type lookup)
- `tag-detail-panel.tsx` 신설 (Header/Dates/Properties=stats:note count/Used in:notes/Actions)
- `SidePanelDetail` tag 분기 dispatch
- Library Tags row 클릭 시 `setSidePanelContext({ type: "tag", id })`

### 2. Library Stickers Detail panel 신설
같은 패턴. Sticker의 `members` 필드 활용 → "Used by" cross-entity list.

### 3. Ontology Legend redesign (Option A + B 합의됨)
사용자 시그널: 색 충돌 (Brick orange ↔ Stub orange, Block emerald ↔ Article emerald) + Light mode 가시성.

**Option A + B 결합** 확정:
- Legend에 entity 그룹 헤더 (NOTES / WIKI / BOOKS / EDGES)
- 각 status는 **color + icon silhouette** (단순 dot 대신)
- Plot 이미 정의된 icons: `Hexagon`/`Cube`/`Cuboid2x2` (Notes) / `IconWikiStub`/`IconWikiArticle` (Wiki) / `Lightning`/`Sparkle`/`PencilSimple` (Books)
- 색은 영구 LOCKED (WIKI_STATUS_HEX + NOTE_STATUS_HEX) 그대로

**+ 별도 작업**: List Options 토글 mismatch 버그 (디폴트 OFF인데 graph는 모두 표시. 토글 한 번 켰다 꺼야 sync). view-engine defaults에 명시.

### 4. PR 4b — Wiki blocks anchor extractor
Wiki blocks 구조 (Notes contentJson과 다름). 새 `extractAnchorsFromWikiBlocks` helper 작성. Wiki Bookmarks 탭에 LocalAnchors 추가. GlobalBookmark.targetKind는 이미 "wiki" 지원.

### 5. PR 5 — Activity entity-agnostic 통합 (별도 PRD 필수)
큰 작업. `noteEvents` slice → `entityEvents` 통합 + 마이그레이션 + 모든 entity wire-up.

진행 전 `.omc/plans/activity-unification-prd.md` 작성 의무:
- 통합 event 모델 (entityKind + entityId)
- 마이그레이션 전략 (기존 noteEvents → entityEvents)
- 각 entity action 시점 wire-up 지점 정의
- ActivityTimeline entity-agnostic 확장
- Comments wire-up (template/book도)

---

## 🟣 P2 — 작은 후속 정리

- **attachments slice에 `deleteAttachment` action 신설** (Files Detail panel Delete 활성화) — PR #331 follow-up
- **GlobalBookmark.targetKind에 "book" 추가** (PR 4 후속) — Book entity anchor pinning. 단 Book entity 자체는 contentJson 없음 → chapter-heading anchor만 의미? 결정 필요.
- **Reference Detail panel 호출 흐름 검증** — `ReferenceDetailPanel` 존재하지만 library-view 안에서 setSidePanelContext("reference") 호출 위치 확인 X
- **NoteLocalAnchors → LocalAnchors rename** (polish) — entity-agnostic naming
- **navigateToBookmark template 분기** + "Templates" filter chip (unified bookmarks list)
- **Stone/Brick STATUS_CONFIG도 var(--status-*) 통일** (Block만 fix됨)
- **Wiki Gallery view-engine 통합** (Notes/Books 완료, Wiki만 누락)
- **dev hot reload stale state 모니터링** — 잦은 branch switch + cascade 작업 시 React Hook order 경고 또는 stale import 발생. hard refresh로 해소.

---

## 🔵 보류

### Manual verify Books 4 viewMode + 회귀 fix
다음 세션 시작 시 진행. 7 step 절차 (아래).

```
1. Grid mode 정상 (cover emoji + 카드, 우클릭 메뉴)
2. Search "Search books" → title/description 실시간 필터링
3. List mode → BookListRow chip (Kind/ItemCount/SourceKind/Pin/Time)
4. Filter popover 4 categories (Kind/SmartSource/Pin/Updated)
5. Pinned-first sort → reload 후 유지
6. viewState persist (viewMode/sort/filter)
7. Board mode → column drag + card drag (pinned toggle / kind confirm)
8. Gallery mode → entity-agnostic GalleryView (accent kind-based)
```

회귀 발견 시 즉시 fix → 추가 commit.

### (verify 통과 시) Wiki 그룹 헤더 아이콘 (~30분)
- WikiList/WikiBoard 미적용 (Notes Table/Board/Gallery는 5-11에서 통일됨, Books는 5-12)
- 자투리 시간 정리 후보

---

## 🟡 P1 — 큰 작업 후보

### Smart Book v2 — AutoSource picker UX 강화
- folder/category/tag/label/sticker source picker 풀 도입
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화

### Wiki view-engine board 도입
- Plot 일관성 (Notes/Books와 동일 viewMode 토글)
- WikiList → WikiBoard 라우트 통합

### Notes/Wiki/Books 통합 entity-agnostic ListRow/BoardCard 패턴
- Books의 BookListRow + BookGridCard 패턴 일반화
- generic 추출 없이도 reuse 패턴 (`renderListRow` prop) 도입

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

---

## 🟡 P1 — 큰 작업 후보

### Wiki template 3-layer
- Layout Preset + Content Template + Typed Infobox
- Wiki domain. v3 Phase 3+와 독립

### Smart Book v2 — AutoSource[5]
- folder / category / tag / label / sticker 자동 source
- Book entity 신규 (v3 7번째 space, rose 팔레트 #fb7185 dark / #e11d48 light)
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화 + Reading view

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

---

## 🟣 P2 — 작은 후속 정리

- **Stone/Brick STATUS_CONFIG도 var(--status-*)로 통일** (Block만 fix됨 — 사용자 시그널 시 stone `var(--chart-2)` brick `var(--chart-3)` 같은 패턴)
- **chapter heading manual rename** — auto chapter title 사용자 수정 (PRD §6 명시 non-goal, 시그널 시 v2.5)
- **Hull style toggle** — outline/filled/none per source. Display panel에 3-state radio
- **Sequence edge manual reorder** — userOrder 반영 (현재 manual book.items order만)
- **100+ entity hull culling** — viewport 안만 render (Phase 4 picker filter로 부분 mitigate 됐지만 본격 X)
- **`npm install` 새 worktree 자동 체크** — before-work 단계 룰 후보 (본 세션 시작 시 stale dev server 발생)
- **hydration mismatch radix id** — main pre-existing, 별도 fix 후보 (모든 dev session console error 다수)
- Templates grid chip 시스템 완전 통일 (PR e deviation)
- 키보드 shortcut (D/T/P 등) 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)
- Tag 우클릭 메뉴 Rename 옵션 추가
- Label 색 정책 재검토 (Tag opt-in 가능성)
- ReferencesView quickFilter / fieldKey filter → viewState.filters lift (PR 4 follow-up)
- FilesView type filter (all/image/document) → viewState.filters lift (PR 5 follow-up — Path A Step 1과 정합)
- File grid mode 실제 image preview (blob URL 처리, PR 5 follow-up)
- `docs/status-icons-preview.html` 등 mockup HTML untracked 파일 정리 (.gitignore 또는 삭제)
- **Gallery card enrichment** (P1 follow-up) — Notes/Wiki/Books 갤러리 카드에 status chip + folder/category chip + updated badge. GalleryItem interface 변경 + 3 adapter 매핑. 사용자 시그널 "휑함" (2026-05-13).
- **Home stats card "References" 2px truncate** — viewport 1400px / 카드 134px에서 90vs88 미세 잘림. 사용자 시그널 시 short label ("Refs") 또는 padding 추가 축소.
- **status icon weight bold 영향** — 13곳 사용. 일부 작은 영역에서 너무 굵으면 size별 weight 조정.

---

## ⏸️ 보류 / 영구 폐기

### Plot v3 Phase 2 (Imperial icon kit) — DEFERRED
- 119 files codemod scope 비대 + 시각 위화감 미미
- partial work (activity-bar 등) 그대로 보존
- 재개 조건: 정확한 인벤토리 + 매핑 coverage 검증 + 단일 책임 PR 분할

### onlook (visual code editor) — 적용 X
- production app 자동 코드 변경 회귀 위험
- greenfield/marketing 사이트에 적합

### Front-End-Design-Checklist — 적용 X
- design-quality-gate + linear-design-mirror + 4 design skills과 중복
- handoff 가이드 (디자이너↔개발자), 1인 dev audience 불일치

### Plot 2.0 브랜딩 — v3 visual refresh로 리브랜드
- 11가지 결정은 v3 PRD에 통합 보존

### 매거진/뉴스페이퍼/북 Pivot — 폐기 (2026-04-22)
- ✅ Studio/Editorial view modes 제거 완료 (Store v119, 2026-05-09)
### Dual mode — 폐기 (2026-05-11)
- Split view + list mode + editor pane으로 충분. v122 migration으로 자동 fix.
### AI provider 연결 — 정체성 위반 (2026-04-27)
### Notion식 Row density toggle — Linear 코어 (PR #224 revert)
### Page entity 신규 — atomic 위배 (2026-05-03)
### Generic `useEntityView<T>` hook 추출 — 영구 거부 (scope 폭발)

---

## ✅ 최근 완료

### 2026-05-13 — Smart Book v2 풀 + Ontology Hull P1-4 + 11 follow-up (PR #319, 17 commits)
- ✅ **Bug fix 3 + 4 follow-up** — books-board normalize / wiki-board normalize / TrashAllView select-all / BookItemRow 5-source icon / legend Keystone→Block / Filter Status Wiki·Book icon / Block 색 var(--chart-5)→var(--status-keystone) 통일
- ✅ **Smart Book v2 PRD v1.0 LOCKED** (13 Q 모두 resolved) + Ontology Hull PRD v0.1 (Phase 1/2/3/4 모두 구현)
- ✅ **Phase G** (chapter ordering) — userOrder 신규 + autoUserOrders map + reorderAutoItem/clearAutoUserOrder API + UI drag/Auto-sort toggle/5초 undo toast + 43/43 tests
- ✅ **Phase H** (reading view) — lastReadItemId/lastReadAt + setLastRead + Resume 버튼 + mini progress bar (36px md+) + chapter context badge (sourceRefId clustering)
- ✅ **Phase K** (picker UX) — dialog 너비 lg + cross-tab unified search + tab badge count + bulk select (multi-mode 토글 + footer "Add N")
- ✅ **Ontology Hull Phase 1** — Status filter cross-entity (Note 3 + Wiki 2 + Book 3 = 8 values) + nested sub-section headers (FilterValue.group field)
- ✅ **Ontology Hull Phase 2** — Book hull groupBy 추가 (Sticker 패턴 정합) + Book.color 우선 + Smart Book auto items 포함 (resolveBookItems via bookMembership prop)
- ✅ **Ontology Hull Phase 3** — Book sequence edge (dashed thin + opt-in toggle + SVG marker)
- ✅ **Ontology Hull Phase 4** — Visible hulls picker filter (FilterField "hullEntity" + runtime values hydration)
- ✅ **Linear refs 137 captures** + `docs/reference/linear/README.md` 14 카테고리 인덱스
- ✅ 영구 룰: status 색 var(--status-*) only / dnd-kit normalize all boards / Filter icon 일관성 / resolver 외부 view 재사용 / PRD 분리 trigger / cmdk multi-select 우회 패턴

### 2026-05-12 (밤) — Smart Book Phase A-F 전체 완성 + 4 polish PR (6 PR 누적 #312-#317)
- ✅ **PR #312** — BoardCard chip overflow (PropertyChipRow `overflow-hidden` 1줄) + Wiki 그룹 헤더 아이콘 (`WikiGroupHeaderIcon` 신규: family/parent/role→Tree, tier→Stack, linkCount→Link, label→color dot) + PRIORITY_CONFIG/STATUS_CONFIG null guard 확산 (PR #308 패턴)
- ✅ **PR #313** — TrashEntityList multi-select (books/tags/labels/templates/references/files 탭에 TrashAllView 패턴 적용). hover-only checkbox + floating bar
- ✅ **PR #314** — Smart Book Phase B (Wiki Category source, DAG `categoryIds?` array, 📚 heading). +10 tests
- ✅ **PR #315** — Smart Book Phase C+D+E (Tag/Label/Sticker, all 5 kinds active). `emitSection` helper 추출 + 5-col tab UI + sourceRefId tagging probe. +11 tests
- ✅ **PR #316** — Smart Book Phase F (trash guard tag/label/sticker + Convert to manual button). LOCKED #11 lazy detection + manual freeze. +4 tests
- ✅ **PR #317** — Books list mode grouping 회귀 fix (BookTable에 `groups + groupBy` props 추가). 사용자 스크린샷 보고로 발견. board/gallery는 이미 처리, list만 누락이었음
- 사용자 합의 — Smart Book Phase A-F 전체 완성 ("전부 다 진행해"). PRD §4 12 LOCKED 결정 모두 구현
- tsc + 59/59 tests pass 매 PR마다 검증

### 2026-05-12 (저녁) — Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR (Store v130 → v132)
- ✅ **Trash "All" 통합 view 신규** — `components/views/trash-all-view.tsx` (~300 LOC). 8 entity (Notes/Wiki/Books/Tags/Labels/Templates/References/Files) trashed 통합 표시. 사용자 의도 *"ALL은 모든 entity의 trashed 통합"* 충족. `trashTabCounts.all`에 wikiArticles 합산 보강 (count 모순 해소).
- ✅ **Status icon stale root cause 발견 + 3-layer fix**:
  - root cause: `notes-board.tsx:277-283` column DOM에 `useSortable("col-${key}")` + `useDroppable("${key}")` 동시 bind. dnd-kit collision detection이 sortable id 반환 시 `targetKey = "col-stone"`이 status로 저장 → StatusShapeIcon (else→Cuboid) + StatusBadge (fallback→brick) mismatch
  - **#1 root prevention**: `notes-board.tsx:968` — `overId.startsWith("col-") ? overId.slice(4) : overId`
  - **#2 memo safety**: BoardCard memo에 `prev.note.status === next.note.status` 추가
  - **#3 data recovery**: `migrate.ts` v131 — VALID_STATUSES Set + legacy enum re-map + `col-` prefix strip + stone fallback. Store version 130 → 131
- ✅ **v132 folderIds garbage cleanup** — 같은 dnd-kit root cause가 folderIds에도 garbage (`col-folder-1` 등) 저장 가능. v132 마이그레이션 — `state.folders`에 없는 folderId 제거. notes + wikiArticles 둘 다. Store version 131 → 132
- ✅ **Board drag default = Move semantic 반전** (작업 원칙 #8 사용자 직관) — folder drop default = Move (folderIds 교체) / Shift+drop = Add (N:M 기존 유지). status/priority/triage는 single-valued라 자동 Move. 사용자 의도 *"옮기면 진짜 옮겨져야"*
- ✅ **Books row checkbox hover-only** — `book-table.tsx:405-414` wrapper에 `checked ? "visible" : "invisible group-hover:visible"`. notes/wiki 패턴 정합 (사용자 보고: "Books의 경우 체크박스가 눈에 보이게")
- ✅ **Trash row multi-select + bulk action bar** — `trash-all-view.tsx`에 selectedKeys state + row checkbox + 하단 floating bar (Restore / Delete forever / Clear). 사용자 보고: *"트래쉬의 경우 왜 체크박스가 없는 거야"*
- ✅ **Wiki pin 위치 title 옆** — `wiki-list.tsx:426-435` title span `flex-1` 제거 + pin `ml-1`. Books book-table.tsx 패턴 정합. SESSION-LOG 영구 결정 #301 ("title 옆") 재실현. 사용자 보고: *"왜 스테이터스 칩 왼쪽에 있냐고"*
- ✅ Wiki "북마크 이상" 진단 — wiki-view trashed filter (line 372) 정상. 사용자가 본 7개 trashed wiki = port 3002 (이전 worktree crazy-raman) stale build. port 61869는 정상
- ✅ tsc + production build clean 매 fix마다 검증

### 2026-05-12 (오후) — Board/Gallery polish + Split view fix + hotfix (4 PR cascade)
- ✅ **PR #305** (앞서 entry — ContextMenu DRY + Wiki UX cherry-pick + 워크플로우 재편)
- ✅ **PR #306**: Split view secondary pane workbench hide (`usePane()` 분기)
- ✅ **PR #307**: Block 색 slate (Plot 메타포 정합) + Gallery click parity (preview/open/select + 하단 FloatingActionBar)
- ✅ **PR #308**: Hotfix — notes-board JSX parser (parens 명시) + FloatingActionBar `STATUS_CONFIG` null guard
- 5 사용자 보고 처리: Block 색 ✅ / Gallery click ✅ / Split view ✅ / 7개 표시 ✅(PR #305) / Status icon stale ⏭️(reproduce 정보 필요)

### 2026-05-12 (낮~오후) — ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (Store v129 → v130)
- ✅ Dev server fix (npm install — node_modules 누락)
- ✅ Books list mode pin 위치 fix (title 옆, flex-1 제거)
- ✅ Notes Source filter values icon 추가 (Manual/Web Clip/Import)
- ✅ **NEXT-ACTION.md 영구 폐지** + before-work/after-work project-level 재편
- ✅ Split view popover에 Books 옵션 추가 (BookOpen icon, 영구 결정)
- ✅ Wiki seed 4개 확장 + v130 backfill migration (verify 데이터 다양성)
- ✅ **Cherry-pick `42c6e59`** — Wiki UX 3 issues (우클릭 cursor / 플로팅바 Pin+Move+Category / Gallery 우클릭)
- ✅ **ContextMenu DRY refactor** — `note-context-menu-items.tsx` helper + list/board/gallery 3 surfaces 통일 (Linear principle)
- ✅ **BoardWorkbench 보강** — Pin/Folder/Split 액션 추가 (list FloatingActionBar parity)
- ✅ Notes board polish — drag transition fix + 빈 status column 항상 표시 (Kanban) + smooth drop animation (220ms cubic-bezier)
- ✅ 시각 폴리시 — group header 폰트 (11→13) + row metadata 폰트 (12→13, muted→fg)
- Pin indicator 위치 = title 옆 (영구 결정 재확인, elastic-darwin의 status chip 옆 변경 폐기)

### 2026-05-12 (저녁~밤, 거대) — Books polish 6 PR + emoji 폐기 + Pin 통일 (Store v126 → v129)
- ✅ **PR #296** (v127): SEED_BOOKS migration backfill (기존 사용자에도 inject)
- ✅ **PR #297** (v128): Polish 1 — SEED emoji 제거 + Display properties Sources/Pin toggle + groupBy "status" stale validation
- ✅ **PR #298** (v129): emoji 영구 폐기 + Phosphor BookKindIcon 통일 (Plot icon 시스템)
- ✅ **PR #299**: Polish 2 — BookKindChip 색 (StatusBadge 패턴) + Filter Kind values icon + Save view 통일 (Trash chip 제거)
- ✅ **PR #300**: Pin 통일 — Books FloatingBar + Notes 우클릭 + Notes FloatingActionBar Pin
- ✅ **PR #301**: Pin indicator (Notes/Wiki title 옆 inline)

### 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode (Store v122 → v126)
- ✅ **PR 1 (v123)**: 인프라 + grid 보존. useBooksView thin fork. 시각 변경 0
- ✅ **PR 2 (v124)**: list mode + sort/group/filter UI + 3 chip (BookItemCount/BookKind/BookSourceKind mini-bar). ViewHeader Search/Filter/Display 활성화. pinned-first sort
- ✅ **PR 3 (v125)**: board mode Option A (column drag + card drag, dnd-kit). groupBy kind/pinned. card drag UX: pinned 즉시 toggle / kind smart→manual confirm / manual→smart toast hint
- ✅ **PR 4 (v126)**: gallery mode (entity-agnostic adapter). 2026-05-11 GalleryView 재사용. kind-based accent color
- ✅ launch.json `npx next` 전환 (한글 경로 안전성)
- ✅ Plan `.omc/plans/books-view-engine-integration.md` 작성

### 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic (PR #291)

### 2026-05-10 (마라톤) — Smart Book Phase A + 책 reading flow (PR #290)

### 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (PR #289)

### 2026-05-08 (오후) — Status icons + Phase 4.3 plan 보강 (5 PR + docs sync)
- ✅ **PR #271**: Status icons + UI 라벨 "Block" + Cuboid (1×2 isometric block) + Save view 16px (HBtn pattern)
- ✅ **PR #282**: PR 4.3a Tags+Labels chrome 통일 시도
- ✅ **PR #283**: PR #282 partial revert (`.a-row` grid 6-col 강제 충돌)
- ✅ **PR #284**: Tags row border-b 제거 + plan Section 9-10 (lessons + roadmap)
- ✅ **PR #285**: plan Section 11 Filter coverage 분석 (Step 1-5)
- ✅ **(이 PR)** docs sync — NEXT-ACTION / SESSION-LOG / MEMORY / TODO / CONTEXT

### 2026-05-07 (밤 늦게) — Plot v3 Phase 3 (4 PR)
- ✅ PR 3.1 (98f9277): CSS 통합 — `.a-actbar` / `.a-sidebar` / `.a-sb-*` (시각 변경 0)
- ✅ PR 3.2 (5ac22ef): activity-bar.tsx reskin (width 72px / label / brand mark / per-space 6색 inline)
- ✅ PR 3.3 (8155530): linear-sidebar.tsx reskin
- ✅ PR 3.4 (3761e42): brand mark = Plot 로고 SVG (네트워크 그래프) → 후 PR #270으로 mockup 패턴 P glyph 복귀

### 2026-05-07 (밤) — Group C PR-D 시리즈 5/5 완성
- ✅ Tags v110 / Labels v111 / Stickers v113 / References v114 / Files v115

### Plot v3 Phase 2 DEFER 결정 (3b84d7e)
### 4 design skills install (0f7e2ec)
