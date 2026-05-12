# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-12 (Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR)

---

## 🔴 P0 — 즉시 (다음 세션)

### BoardCard chip overflow fix ⭐⭐⭐ — 다음 세션 최우선
**사용자 의도** (이번 세션 명시, 스크린샷 동봉): *"이런 식으로 박스 밖으로 `#Productivity` 글자가 빠져나오는 연출이 있는데 이러면 안 됨. 박스 밖으로 빠져나가면 안 돼."*

**현재 상태**: `components/notes-board.tsx`의 BoardCard에서 tag/category chips row가 가로로 풀려서 카드 box width 초과 시 마지막 chip text가 잘리지 않고 box 밖으로 돌출됨. 스크린샷 예: "Build a Personal Wiki" 카드에 `[📁 Projects] [# Knowle…] [# Producti`...`vity]` — 마지막 chip이 box 우측 경계 넘김.

#### 추정 root cause
- BoardCard chips row의 flex container가 `overflow-hidden` / `min-w-0` 없음 → child chip이 grow + 잘림 처리 X
- 또는 chip element 자체가 `truncate` / `max-w` 없음 → 긴 tag name이 자기 자연 width로 stretch

#### Sub-tasks
**Step 1**: BoardCard 컴포넌트 chips row 위치 정확히 찾기 (notes-board.tsx — chips 렌더 부분, line ~400-600 추정)
**Step 2**: chip row container에 `overflow-hidden min-w-0` + `flex-wrap` 또는 `flex` + chip 자체 `truncate max-w-[...]`
**Step 3**: 두 가지 정책 중 사용자 결정:
  - **A: Truncate** — 한 줄 유지, chip text 잘림 (`…`). 카드 height 일정. Linear 패턴 정합.
  - **B: Wrap** — chip 여러 줄로 wrap. 카드 height variable. 표시 정보량 ↑.
  - 추천: A (Linear principle, board card height 일정 = 시각 정돈).

#### 위험 + 회피
- chip 너무 짧으면 truncate 의미 없음 — `max-w` 적당히 조정
- card grid layout 영향 (flex/grid template) — `min-w-0`는 flex item shrink 허용
- board mode 외 grid/gallery에도 같은 BoardCard 사용하는지 확인 (회귀 회피)
- list mode의 chip layout과 별개 (list mode는 별도 cell)

#### 참고 파일
- `components/notes-board.tsx` (BoardCard 또는 BoardCardInner)
- `components/notes-table.tsx` (list mode chip 패턴 비교용 — 정합 가이드)
- `components/views/wiki-list.tsx:462` (wiki list tags column — `w-[140px] shrink-0 ... overflow-hidden` 패턴)

### 9 fix manual verify (localhost:61869)
이번 세션 통합된 변경 — 시각 확인 필요:
1. `/trash` "All" 탭 → 모든 entity 통합 표시 + row checkbox hover-only + 선택 시 하단 floating bar (Restore / Delete forever / Clear X)
2. `/notes` board mode → keystone(Block) 카드를 stone/brick column으로 drag → 노트 status 진짜 변경 + icon-chip 일치
3. `/notes` board mode (folder grouping) → 노트를 다른 folder column으로 drag → 노트 folderIds 진짜 교체 (이전 folder 제거, Move semantic). Shift+drop = Add (N:M 기존 유지)
4. 페이지 reload → console에 `[migrate] v130→v131: repaired NoteStatus on N notes` + `[migrate] v131→v132: cleaned garbage folderIds on N notes` log
5. `/library` (Books) → row checkbox는 hover 시에만 visible (notes/wiki 정합)
6. `/wiki` → pinned wiki article의 pin icon이 title 바로 옆 (cell 우측 끝 X)
7. `/wiki` trashed article 자동 제외 (filter 정상 작동)

### #2 Status icon stale (root cause + fix 둘 다 완료) — verify만 남음
- root cause = notes-board column에 useSortable + useDroppable 동시 bind. dnd-kit이 sortable id 반환 시 `col-stone` 같은 garbage가 status에 저장
- fix 3-layer: notes-board.tsx line 968 overId.slice(4) + BoardCard memo status 비교 + v131 NoteStatus garbage cleanup
- 사용자가 다시 보드에서 drag 시도 → 옛 mismatch 재발 X 확인 필요

### STATUS_CONFIG 패턴 다른 lookup map에 적용 (계속)
이전 hotfix (#308) — `STATUS_CONFIG[status]` null guard 추가. 다른 lookup map에 동일 패턴 적용 후보:
- PRIORITY_CONFIG (priority lookup)
- BOARD_DEFAULT_GROUP (effectiveTab lookup)
- 기타 Record<X, Y> 타입 모든 access 점검

### 글로벌 commands 수동 삭제 (양 머신)
```bash
rm ~/.claude/commands/before-work.md
rm ~/.claude/commands/after-work.md
```
NEXT-ACTION 의존 옛 정의 제거. project-level (git tracked) 새 정의가 단일 진실.

### TrashEntityList multi-select (이번 세션은 TrashAllView만 fix)
TrashAllView에 multi-select + bulk action 추가 완료. TrashEntityList (entity별 탭: books/tags/labels/templates/references/files) 도 동일 패턴 적용 후보. 사용자가 entity별 탭에서 multi-select 원하면 follow-up.

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
