# Plot Project Memory

## ⭐ Plot 정체성 (영구 디자인 원칙, 2026-05-03 확정)

> **"Gentle by default, powerful when needed."**
> 기본만으로 충분, 원할 때 강력. 소란스럽지 않게.
> 모든 디자인 결정의 척도.

## ⭐ 작업 원칙 (영구, 모든 PR/작업에 적용)

> **"정확도 + 버그 위험 최소화"**

### 핵심 규칙
1. 변경 전 코드/패턴 정확히 이해 (추측 X)
2. 최소 diff (executor scope 초과 X)
3. 빌드/타입 검증 의무 (`npm run build` + `tsc --noEmit`)
4. 사용자 reproduce 정보 우선 (추측 fix X)
5. 마이그레이션 신중 (백업/롤백 가능)
6. UI + 데이터 모델 분리 PR
7. Edge case 점검 (빈/거대/hydration/SSR)
8. 사용자 직관 = 디자인 시그널 (무시 X)
9. docs는 진실 source (검증된 사실만)
10. 커밋 메시지 명시 (무엇/왜/검증)

### 재발 방지 사례
- Executor scope 초과 → 명시적 prompt + 결과 검증
- 추측 fix → reproduce + 원인 분석 후 fix
- 거대 PR 시리즈 (10+ PR) 후 conflict 빈번: 매 PR 머지 후 즉시 fetch+merge origin/main 습관
- 4 PR cascade (#305-#308) 단일 세션 — 같은 worktree에서 누적 변경 squash 머지 4회. conflict는 build artifact만 (`--ours` 패턴).
- 2026-05-12 (저녁) — multi-server dev (port 3002 + port 61869 동시) 환경에서 stale build 화면 보고 사용자가 fix 안 보인다고 보고. **교훈: 매 fix 후 정확한 port URL 안내. `preview_list` 로 inventory 확인.**
- 2026-05-12 (저녁) — 사용자 "위키 북마크" = pin 의미 (bookmark 아님). 추측으로 진행하다 fix 의도 달라짐. **교훈: 사용자 어휘 매핑 명확화 후 진행.**

---

## 🚀 2026-05-12 (저녁) — Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR (Store v130 → v132)

**범위**: 1 worktree (`quirky-colden-bcf3de`). 9 fix 통합 단일 PR. Store v130 → v132. 사용자가 보고한 다섯 가지 issue (Trash All, Status icon stale, Board drag move semantic, Books checkbox visibility, Trash checkbox 부재, Wiki pin 위치) + 그 연쇄 root cause fix.

### 큰 결정 (영구 LOCKED)

**1. Trash "All" 통합 view 신규**:
- `components/views/trash-all-view.tsx` (~380 LOC final including multi-select)
- 8 entity (Notes/Wiki/Books/Tags/Labels/Templates/References/Files) trashed 통합 표시
- entity별 section header, 통합 row layout, status별 leading icon (Notes만 StatusShapeIcon)
- multi-select + 하단 floating bulk action bar (Restore / Delete forever / Clear)
- `trashTabCounts.all`에 wikiArticles 합산 보강 — count 모순 해소
- 사용자 의도 *"ALL은 모든 entity의 trashed 통합 표시"*

**2. dnd-kit DOM ref 합치기 위험 패턴 (영구 학습 LOCKED)**:
- `useSortable("col-${key}")`와 `useDroppable("${key}")`를 같은 ref에 bind 시 collision detection 비결정
- card drop의 `over.id`가 sortable id (`col-stone`) 또는 droppable id (`stone`) 중 비결정 반환
- handler에서 무조건 id normalize: `overId.startsWith("col-") ? overId.slice(4) : overId`
- 같은 패턴 사용 시 (books-board 등) 같은 normalize 적용

**3. Status icon stale root cause + 3-layer fix (영구 결정)**:
- root cause 명확: dnd-kit DOM ref 이중 binding (위 #2). garbage `col-stone` 등이 `note.status`에 저장 → StatusShapeIcon (else→Cuboid/Block) + StatusBadge (fallback→brick) mismatch
- **Fix #1 root prevention**: `notes-board.tsx:968` overId strip
- **Fix #2 memo safety**: BoardCard memo에 status 비교 추가
- **Fix #3 data recovery**: `migrate.ts` v131 NoteStatus garbage cleanup (idempotent)
- Store version: 130 → **131**

**4. v132 folderIds garbage cleanup**:
- 같은 dnd-kit root cause가 folderIds에도 garbage (`col-folder-1`, `col-_no_folder` 등) 저장 가능
- 사용자 toast 본 *"Added X to col-_no_folder"* 가 직접 증거
- v132 마이그레이션: `state.folders` Set 외 folderId 제거. notes + wikiArticles 둘 다
- Store version: 131 → **132**

**5. Board drag default = Move semantic (영구 결정 변경 LOCKED)**:
- 이전 N:M 패턴: folder drop default = Add / Shift = Move
- **신규** (2026-05-12 저녁 user feedback): default = **Move** (folderIds 교체) / Shift+drop = **Add** (N:M 기존 유지)
- 사용자 직관 *"옮기면 진짜로 속성이 바뀌어야"* 우선. 작업 원칙 #8.
- status / priority / triage는 single-valued라 항상 Move (불변)
- 이전 결정 (PR (c) Add-default) 폐기, 새 결정 LOCKED

**6. row checkbox 패턴 — 모든 entity 일관 (영구 LOCKED)**:
- 패턴: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`
- 부모에 `group` className 필수
- 적용: notes-table NoteRow / wiki-list ArticleRow / book-table BookRow (이번 세션 fix) / trash-all-view TrashRow (이번 세션 신규)
- 사용자 보고: Books visible mismatch + Trash 부재

**7. Pin 위치 = title 옆 (영구 결정 #301 재실현, Books 패턴 reference)**:
- title span에서 `flex-1` 제거 + pin `ml-1 shrink-0`
- 모든 entity 표준
- elastic-darwin의 status chip 옆 이동(`1d8b30f`) 영구 폐기 재확인
- 사용자 보고 *"왜 스테이터스 칩 왼쪽에 있냐고. 북마크가 아니라 pin이었어!!"*

**8. Migration 2-layer 패턴 (영구 LOCKED)**:
- 코드 fix만으로는 이미 corrupted된 IDB 데이터 정리 X
- root prevention (코드) + data recovery (migration) 둘 다 필수
- v131 / v132 idempotent — valid 데이터 pass through. 재실행 안전.

### 기술 학습 (영구)

- **dnd-kit collision detection**: useSortable이 내부적으로 useDroppable wrap. 같은 DOM ref bind 시 over.id가 어느 id 반환할지 비결정. handler normalize 필수.
- **Zustand persist `partialize`**: notes의 content/contentJson 제거 후 저장. body는 별도 IDB store. migration 시 state.notes에 body 없음.
- **preview_eval로 IDB 직접 dump**: `indexedDB.open("plot-zustand")` + `tx.objectStore("kv").getAll()`. zustand persist 검증 효과적.
- **사용자 IDB-aware migration**: SEED 코드 vs 사용자 데이터 분리. SEED는 valid enum 사용해도 사용자 IDB에 옛 enum/garbage 잔존 가능. migration이 root cause 진단 + recovery 둘 다 담당.
- **multi-server preview troubleshooting**: 사용자 본 화면 ≠ AI verify 화면. port URL 명시 + `preview_list` 로 inventory.
- **Hover-only checkbox**: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`. 부모 `group` className. 모든 entity 일관.
- **Floating bulk action bar (sticky bottom)**: `sticky bottom-4 z-20 mx-auto w-fit ... backdrop-blur shadow-lg`. selection 활성 시 mount.
- **Migration silent log**: console `[migrate] vN→vN+1`. dev tools 없으면 사용자 못 봄. toast 알림 follow-up 후보.
- **Wiki list rendering chain**: wiki-view (line 372 trashed filter) → filteredWikiNotes → wikiGroups → WikiList (filteredWikiNotes prop). 단 wikiArticles 원본 prop도 별도 (backlink resolution용, 표시 X).
- **`overId.slice(4)` vs `.replace("col-", "")` 비교**: slice가 prefix 일관 처리 더 안전 (replace는 모든 occurrence 처리, 한 번만 처리해야).

### 다음 (TODO.md P0 참조)

🔴 **BoardCard chip overflow fix** — 사용자 보고 *"박스 밖으로 `#Productivity` 글자가 빠져나오는 연출"*. notes-board.tsx의 BoardCard chips row에 overflow:hidden + truncate. 정책 A (truncate, 한 줄 유지) 추천.

🟡 9 fix manual verify (localhost:61869):
- /trash All / /notes board drag / /library Books / /wiki pin / migration log

🟢 TrashEntityList multi-select (entity별 탭) — follow-up

### 머신
집 (Windows)

### 누적 commits (이번 세션, 1 mega-PR)
- v131 migration (NoteStatus garbage cleanup) + Trash All view 신규 + 9 fix 통합
- 모든 코드 변경 + docs sync (TODO + SESSION-LOG + CONTEXT + MEMORY)
- tsc / build / preview console clean 매 fix마다 검증

---

## 🚀 2026-05-12 (오후) — Board/Gallery polish + Split view + hotfix (4 PR cascade)

**범위**: PR #305 직후 사용자 시그널 5건 follow-up. 4 PR 단일 worktree squash 머지 (#305 → #308). PR #306 split view → #307 Block 색 + Gallery click → #308 hotfix (JSX parser + null guard).

### 큰 결정 (영구 LOCKED)

**1. Block 색 = slate (Plot 건축 메타포)**:
- teal `#0E9384/2dd4bf` 폐기. slate `#475569/94a3b8`.
- stone (beige) → brick (orange) → block (slate) earthy progression
- chart-5 accent와 시각 분리 + status "settled" 의미 유지

**2. Gallery click 패턴 = list/board parity (Linear principle)**:
- Single click → preview pane
- Double click → open (편집)
- cmd/ctrl-click 또는 selection 활성 중 click → toggle multi-select
- Hover → 카드 우상단 checkbox
- Selection 시 → 하단 FloatingActionBar
- 모든 view mode 동일 패턴 = muscle memory 학습 부담 0

**3. Split view 보드 = secondary pane workbench hide**:
- viewport 절반에서 workbench `flex-1` grow가 column 잘림
- primary pane만 workbench (시그니처 보존)
- secondary pane은 board column만 (drop target 보존, batch action은 primary로 유도)

**4. STATUS_CONFIG 패턴 — lookup map null guard 의무**:
- 모든 `Record<X, Y>` lookup access에 `if (!value) return null` graceful skip
- corruption / 옛 enum / 빈 값 대응
- crash 대신 silent degradation

**5. JSX expression parens 안전 패턴 (LOCKED)**:
- conditional render `{cond && <X .../>}` 위험 (webpack/swc regex 오해석)
- **무조건 parens**: `{cond && (<X ... />)}`
- 향후 모든 conditional JSX 이 패턴

### 기술 학습 (영구)

- **webpack/swc JSX parser ambiguity**: `/>}` 시퀀스 → regex literal 오해석. "unterminated regexp literal" 에러 = 같은 패턴 의심. parens가 expression boundary 명확화.
- **STATUS_CONFIG runtime undefined**: store normalize는 type-level 보호. user IDB stale enum / data corruption은 runtime에 lookup undefined → cfg.bg crash. lookup map access 의무 null guard.
- **Gallery selection 진입 3 경로**: cmd/ctrl-click + hover checkbox + selection 활성 중 일반 click도 toggle. Linear principle 4 접근 경로 패턴 정합 (button/keyboard/context-menu/command-palette).
- **GalleryCard onClick 시그니처 확장**: `() => void` → `(e: React.MouseEvent | React.KeyboardEvent) => void` (modifier key 검출). caller side 영향 — event arg 받도록.
- **dropAnimation cubic-bezier 220ms polish**: dnd-kit 기본은 즉시 snap. `dropAnimation={{ duration: 220, easing: cubic-bezier(0.18, 0.67, 0.6, 1.0), sideEffects: defaultDropAnimationSideEffects(...) }}` 명시화로 부드러운 drop.
- **빈 status group의 Kanban 의미**: drop target 유지 필수. `groupBy === "status"` 분기로 dynamic group (folder/label)과 격리.
- **PR cascade 시 build artifact conflict 패턴**: `.omc/continuation-count.json`, `docs/.pdca-status.json`, `tsconfig.tsbuildinfo` — `--ours` resolve 매번 동일. 같은 worktree에서 시리즈 진행 시 정착.

### PR 정보

| PR | 핵심 |
|----|---|
| [#306](https://github.com/peterkwon248/linear-note-plot-/pull/306) | Split view secondary pane workbench hide |
| [#307](https://github.com/peterkwon248/linear-note-plot-/pull/307) | Block 색 slate + Gallery click parity + 하단 FloatingActionBar |
| [#308](https://github.com/peterkwon248/linear-note-plot-/pull/308) | Hotfix — notes-board JSX parser + FloatingActionBar cfg null guard |

### 다음 세션 P0

🔴 **Trash "All" 통합 view 신규** (~150-200 LOC)
🔴 **#2 Status icon stale** — 사용자 reproduce 정보 받기
🟡 Block 색 + Gallery click + Split view 사용자 manual verify
🟢 STATUS_CONFIG 패턴 다른 lookup map 적용 (PRIORITY_CONFIG 등)

### 환경 변경

- Store version v130 (이번 세션 변경 X)
- 4 PR squash merged
- 사용자 IDB wiki-1/2/3 trashed=true 상태 (사용자 결정 대기)

---

## 🚀 2026-05-12 (낮~오후) — ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (Store v129 → v130)

**범위**: 단일 worktree. 11 작업 통합. 사용자 manual verify 흐름과 결합. **NEXT-ACTION.md 영구 폐지 + ContextMenu DRY (3 surface 통일) + Wiki UX 통합 + Board polish**가 핵심.

### 큰 결정 (영구)

**1. NEXT-ACTION.md 영구 폐지 (2026-05-12 LOCKED)**:
- 정보 3중복 해소 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG 끝 "다음")
- 다음 세션 즉시 액션 = **SESSION-LOG entry 첫 줄 hook + TODO P0** 두 source
- 글로벌 commands (`~/.claude/commands/`, 머신마다 vergent) → project-level (`.claude/commands/`, git tracked) 이전
- 새 before-work: SESSION-LOG 최신 entry + TODO P0. 새 after-work: SESSION-LOG entry 첫 줄에 hook 통합.

**2. Pin indicator 위치 = title 옆 영구 결정 재확인**:
- PR #301 commit message 영구 결정 = "title 옆 우측 (status chip / label chip 안 침범)"
- 직전 세션 끝 "status chip 옆" 정정 시그널은 잘못된 docs 기록 (commit이 진실)
- `elastic-darwin-382a48` branch의 `1d8b30f` (status chip 옆 이동)은 사용자 폐기 결정

**3. Multi-select UI 패턴 (Linear principle + Plot 도메인 분리)**:
- **List mode** → 하단 FloatingActionBar (compact)
- **Board mode** → 우측 BoardWorkbench (시그니처 패널, 풍부)
- **Gallery mode** → 하단 FloatingActionBar (compact, 향후 신규 PR)
- 공통 action set은 mode 무관 동일. presentation만 mode-specific.

**4. ContextMenu DRY 패턴 (Linear principle)**:
- 모든 surface (list row / board card / gallery card)가 동일 13-item 메뉴
- `note-context-menu-items.tsx` helper가 단일 source
- callback wiring은 caller-specific (store action 직접 호출). helper는 dumb component.

**5. Kanban 패턴 — 빈 status column 항상 표시**:
- 카드를 drag로 다른 column 이동 후 원래 column 비어도 column 유지 (drop target)
- `groupBy === "status"`일 때만 (folder/label 등 dynamic group은 기존 동작)

**6. Books entity icon 분기 (영구)**:
- ActivityBar / Sidebar / ViewHeader Secondary popover = `BookOpen` icon
- Library의 phosphor `Books` (책 모음 메타포)와 시각 구별 — 두 entity가 popover에 함께 나올 때 명확

**7. Trash "All" tab 의미 = 통합 (모든 entity)**:
- 현재 count는 통합, display는 notes만 = 모순
- 다음 세션 P0: 통합 view 컴포넌트 신규 (entity별 section)

### 기술 학습 (영구)

- **transition-all과 dnd-kit transform 충돌**: card의 `transition-all`이 transform property도 transition 처리 → dnd-kit 매 프레임 transform 업데이트마다 jitter. `transition-colors`로 제한이 정답.
- **DragOverlay dropAnimation polish**: dnd-kit 기본은 즉시 snap. `dropAnimation={{ duration: 220, easing: cubic-bezier(0.18, 0.67, 0.6, 1.0), sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}` 명시.
- **Cherry-pick id-dedup pattern**: SEED backfill에 `existingIds = new Set(...)` + 누락분만 push (Books v127 → Wiki v130 동일 패턴). 사용자 IDB의 기존 데이터 보존.
- **빈 group의 default hide 부작용**: kanban 패턴은 빈 column이 drop target. dynamic group (folder/label)에는 자연스러운 hide. **groupBy 분기 필수**.
- **Helper extraction signature**: helper가 store action을 직접 호출 X (caller flexibility). callback prop으로 받음. 단 helper 내부에서 *항상 동일* store action (예: `usePlotStore.getState().openInSecondary`)은 직접 호출 OK.
- **Cherry-pick으로 다른 머신 작업 통합**: `git cherry-pick -n <commit>`으로 staging만 + 검토 후 우리 변경과 함께 commit. base의 폐기 변경은 cherry-pick 변경 안에 없으면 묻어들어오지 않음 (auto-merge).
- **`text-2xs` (Tailwind ≈11px) vs `.a-tg__label` 11px**: 같은 크기지만 시각 비교 시 다르게 느낄 수 있음. 단순 13px로 키우는 게 명확 안전.
- **flatNotes vs columns 합**: workbench의 "total notes"는 flatNotes.length (filter 후 sorted, group 전). columns의 cards 합은 groups.flatMap. 일반적으로 동일하지만 group이 hidden되면 차이 발생.

### PR 정보

이번 세션 단일 PR (squash merge 예정). 11 작업 + 25 파일 변경:
- Helper 신규: `components/note-context-menu-items.tsx`
- Cherry-pick: `42c6e59` Wiki UX 3 issues (gallery-view / wiki-list / wiki-view / wiki-floating-action-bar)
- Major refactor: notes-table / notes-board / gallery-view-shell / board-workbench
- Visual polish: globals.css (group header + metadata 폰트)
- Data: seeds.ts (Wiki seed 4 추가) + migrate.ts (v130) + index.ts (version bump)
- Workflow: .claude/commands/before-work.md + after-work.md (project-level 신규 정의) + docs/NEXT-ACTION.md 삭제

### 다음 세션 P0

🔴 **Trash "All" 통합 view 신규** (~150-200 LOC) — sample 통일 후 entity 통합 display
🟡 사용자 manual verify (Wiki UX cherry-pick + ContextMenu 4 surface + Board drag/empty column)
🟢 Notes Gallery 하단 floating bar (Linear parity 마무리)
🟢 Books grid/board/gallery pin 위치 점검

### 환경 변경

- Store version v129 → **v130** (Wiki seed backfill)
- Tests: 255/255 (변화 없음 추정)
- 신규 파일: `components/note-context-menu-items.tsx`
- 삭제 파일: `docs/NEXT-ACTION.md` (영구 폐지)
- Project-level commands: `.claude/commands/before-work.md` + `after-work.md`

---

## 🚀 2026-05-12 (저녁~밤, 거대) — Books view-engine 10 PR polish + Pin 통일 + emoji 폐기 (Store v126 → v129)

**범위**: 오후 4 PR 시리즈에 이어 거대한 polish + extension. 매 사용자 manual verify 후 회귀 즉시 fix → commit → 머지 반복. 6 추가 PR (#296-#301) + emoji 영구 폐기 결정.

### PR 누적 (10 PR squash 머지)

| # | PR | 핵심 |
|---|---|---|
| 1 | [#292](https://github.com/peterkwon248/linear-note-plot-/pull/292) | view-engine 4 viewMode (grid/list/board/gallery, v122→v126) |
| 2 | [#293](https://github.com/peterkwon248/linear-note-plot-/pull/293) | BookTable column-rich + checkbox (NotesTable 정합) |
| 3 | [#294](https://github.com/peterkwon248/linear-note-plot-/pull/294) | Kind-shape carries meaning (Lightning/Sparkle/PencilSimple + 색) |
| 4 | [#295](https://github.com/peterkwon248/linear-note-plot-/pull/295) | SEED_BOOKS 8 demo books |
| 5 | [#296](https://github.com/peterkwon248/linear-note-plot-/pull/296) | v127 migration backfill (기존 사용자에도 seed inject) |
| 6 | [#297](https://github.com/peterkwon248/linear-note-plot-/pull/297) | Polish 1 (emoji/properties/groupBy validation, v128) |
| 7 | [#298](https://github.com/peterkwon248/linear-note-plot-/pull/298) | **emoji 영구 폐기** (Phosphor BookKindIcon 통일, v129) |
| 8 | [#299](https://github.com/peterkwon248/linear-note-plot-/pull/299) | Polish 2 (chip 색 + filter icon + Save view) |
| 9 | [#300](https://github.com/peterkwon248/linear-note-plot-/pull/300) | Pin 통일 (Books floating + Notes pin) |
| 10 | [#301](https://github.com/peterkwon248/linear-note-plot-/pull/301) | Pin indicator (Notes/Wiki title 옆) |

### 큰 결정 (영구)

**1. emoji 영구 폐기 (PR #298 LOCKED)**:
- Apple/Unicode color emoji ↔ Phosphor outline 시스템 mismatch
- Plot icon 시스템 = Phosphor outline only (Linear-style)
- BookKindIcon이 cover 책임 (kind 표현)
- Book.coverEmoji 타입 보존 (round-trip), UI 안 읽음
- 미래 unique cover icon = Phosphor icon picker (Book.coverIcon 필드, follow-up)

**2. Books 자체 정체성 = kind 유지 (status 도입 X)**:
- 사용자 통찰: "config에 status 빼고 kind 넣기 = 이미 그렇게 됨"
- normalizeViewState books-specific validation (`CONTEXT_VALID_GROUP_BY.books = [none/kind/pinned/date]`)
- stale "status" 자동 reset
- kind config = Smart/Manual/Hybrid (derived)

**3. BookKindChip = StatusBadge 패턴 (색 + bg 18% + border 35% + icon + label)**:
- Smart: violet `#5E6AD2` / `#7C8AE7`
- Manual: muted-foreground (neutral)
- Hybrid: amber `#D97706` / `#f59e0b`
- BookKindIcon (leading)도 동일 색 + 모양

**4. Pin 통일 = 모든 entity 표준 (Notes/Wiki/Books)**:
- 우클릭 메뉴 + 플로팅 바 + inline indicator
- batch pin UX: mixed → pin (allPinned 시만 unpin)
- 위치 (현재 PR #301): title 옆. 사용자 마지막 시그널: **status chip 옆으로 이동 필요** (follow-up)

**5. Plot ViewHeader actions 표준 = Save view 버튼 (Trash chip 거부)**:
- Books trashed 책은 `/trash` 페이지 (2026-05-10 통합)
- Save view = 모든 entity 일관

**6. Books DisplayPanel properties 4 toggle**:
- Item count / Kind / Sources / Pin (사용자 column 자유도)
- BookTable에 column 정의 + renderCell 분기

**7. Books DisplayPanel groupingOptions = [none/kind/pinned]**:
- normalizeViewState books-specific validation으로 stale "status" 차단

### 기술 학습 (영구)

- **emoji 데이터 wipe migration 패턴**: 타입 필드 보존 (round-trip) + `state.books.forEach(b => b.coverEmoji = null)` (UI는 무관)
- **CONTEXT_VALID_GROUP_BY map**: entity-specific validation을 normalize 단계에서 적용. `isGroupByValidForContext(g, ctx)` helper
- **store version bump = normalizeViewStatesMap 재실행 트리거**: migrate gate가 persisted version 기준. types union 확장 후에도 version bump 필요 (사용자 viewState 재normalize 위해)
- **id-dedup append backfill (v127 패턴)**: `existingIds.has(seed.id)` 확인 후 push. 사용자 기존 데이터 보존 + 누락 시드만 추가
- **BookKindChip vs BookKindIcon 분리**: chip은 색 + bg + 작은 icon (StatusBadge 패턴), leading icon은 모양만 (큰 size). 같은 row에서 둘 다 보여도 시각 분리 — 색이 분리 도구
- **Conflict resolve pattern**: 매 PR squash 후 base divergence. `git fetch + merge origin/main` → conflict 있으면 `git checkout --ours <file>` (HEAD 우선) → `git commit --no-edit`
- **dnd-kit BookFloatingBar inline**: 단순 entity는 floating bar를 BookTable 안 inline 정의 가능 (Notes FloatingActionBar처럼 별도 파일 추출 안 함)

### 다음 세션 P0

🔴 **Pin indicator 위치 fix** — Notes/Wiki status chip 옆으로 이동 (사용자 시그널 끝)
🟡 **Wiki 우클릭 메뉴 + 플로팅 바 Pin 추가** — PR #300 follow-up
🟢 **Books view-engine 시리즈 manual verify** — 회귀 발견 시 fix

### 환경 변경

- Store version v126 → v129 (3 step — v127 backfill, v128 groupBy validation, v129 emoji wipe)
- Tests: 255/255 (변화 없음)
- 신규 파일 (이번 세션 추가): `components/books/book-table.tsx` (BookTable + BookFloatingBar inline)
- launch.json `npx next` (한글 경로 안전성)
- BookKindChip / BookKindIcon (property-chips.tsx) — Plot status 패턴 정합

### Architect 검증

자동: tsc 0 errors + npm run build 0 / 0 + npm run test 255/255. 시각 verify는 사용자 manual.

---

## 🚀 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode (Store v122 → v126, ~1200 LOC)

**범위**: 단일 worktree (`suspicious-williamson-3670e0`). 4 PR 시리즈 통합 squash 머지. Books entity가 view-engine pipeline에 완전 통합되어 grid/list/board/gallery 4 viewMode 지원.

### 큰 작업 요약

**1. PR 1 (v123) — 인프라 + grid 보존**
- `useBooksView` thin fork hook (8번째 thin fork, use-templates-view 패턴)
- `"books"` ViewContextKey + CONTEXT_DEFAULTS
- BooksGrid → useBooksView 통합. showTrashed → viewState.toggles persist
- 시각 변경 0 — grid 모드 보존, 인프라만 깔기

**2. PR 2 (v124) — list mode + sort/group/filter UI + 3 PropertyChip**
- SortField `itemCount`, FilterField `kind`/`sourceType` 추가
- `BOOKS_VIEW_CONFIG` (filter 4 cats + display config)
- 3 신규 chip: BookItemCountChip / BookKindChip (Lightning/PencilSimple/Sparkle) / BookSourceKindChip mini-bar
- `book-list-row.tsx` + `book-grid-card.tsx` 신규 (grid 카드 별도 분리)
- ViewHeader Search/Filter/Display popover 활성화
- pinned-first sort 활성화

**3. PR 3 (v125) — board mode (Option A: column drag + card drag)**
- GroupBy `kind`/`pinned` 추가
- `books-board.tsx` 신규 (320 LOC, dnd-kit) — NotesBoard 패턴 정합
- Column drag/reorder + groupOrder persist
- Card drag UX:
  - pinned column → 즉시 toggle
  - kind smart/hybrid → manual: confirm dialog (smartSources 제거)
  - kind manual → smart/hybrid: toast hint
- 3 column for kind (Smart/Hybrid/Manual), 2 column for pinned (Pinned/Others)

**4. PR 4 (v126) — gallery mode (entity-agnostic adapter)**
- `books-gallery-adapter.tsx` 신규 — Book → GalleryItem 매핑
- 2026-05-11 entity-agnostic GalleryView 재사용 (Notes/Wiki/References 일관)
- kind-based accent color (Smart=violet `#7C8AE7` / Hybrid=amber `#f59e0b` / Manual=slate `#94a3b8`)

**부속**:
- Plan: `.omc/plans/books-view-engine-integration.md` (~600 line, 15 sections)
- launch.json: `node next/dist/bin/next` → **`npx next`** (한글 경로 안전성)

### 큰 결정 (영구)

**1. 사용자 결정 4가지 (AskUserQuestion 2026-05-12) LOCKED**:
- PR 분할: C 점진 4 PR
- viewMode default: grid 유지 (cover emoji 활용)
- default sort: updatedAt desc 유지
- default groupBy: none (UI 옵션은 노출)

**2. Option A — Plot 일관성 풀 (column drag + card drag)**: Notes/Wiki와 동일 dnd-kit 패턴. 학습 부담 0. card drag의 destructive 행동은 confirmation으로 안전화.

**3. kind column card drag UX 분기**: 
- smart/hybrid → manual: confirm ("Remove N sources?")
- manual → smart/hybrid: toast hint (BookDetailPage 안내)
- pinned column: 즉시 toggle (안전)

**4. Smart Book INVARIANT 보존**: resolver / BookDetailPage / SourcesSection 동작 변화 0. view-engine 통합은 Books **list view 자체**만 변경.

**5. thin fork hook 영구 (Generic 추출 X)**: `useBooksView`가 8번째 thin fork. Notes pipeline 격리. "Scope guard" 헤더 주석.

**6. 마이그레이션 옵션 A 영구 (idempotent skip)**: 모든 4 store version (v123-v126) — 데이터 변경 0, types union 확장만. 기존 사용자 viewState 보존.

**7. BooksGalleryAdapter accent color kind-based**: 단순 entity-color 매핑보다 책 본질 (Smart/Hybrid/Manual) 반영. 의미적 시각 정체성.

### 기술 학습 (영구)

- **VALID_VIEW_CONTEXT_KEYS 확장만으로 자동 마이그레이션**: `normalizeViewStatesMap`이 진입 시 모든 valid key에 default 채움. 명시적 마이그레이션 코드 불필요.
- **store version bump는 boundary 표시 목적**: 데이터 모델 변경 시만 필수. types union 확장은 normalize가 처리.
- **NotesBoard column drag 패턴**: `SortableContext` + `horizontalListSortingStrategy` + `useSortable({ id: col-${key} })` + `useDroppable({ id: groupKey })` for cards. Books도 동일 적용.
- **dnd-kit DragOverlay**: 드래그 중인 카드의 visual 복제. Books의 BookBoardCardInner를 별도 함수로 두어 재사용.
- **확인 다이얼로그 + 토스트 분기 UX**: destructive (smart→manual) = confirm. non-destructive (manual→smart) = toast hint. 사용자 직관 부담 ↓.
- **launch.json `node` → `npx` 전환**: 한글 경로에서 node module resolution 일시적 실패 → npx PATH lookup으로 안정.
- **`.next/dev` stale cache**: build 시 종종 발생. dev server 재시작 또는 `rm -rf .next/dev .next/cache`.
- **GalleryView entity-agnostic 활용 가능성**: 2026-05-11 generic이 잘 작동. Books도 adapter 1개로 통합. 미래 entity 추가 시 동일 패턴.

### 다음 세션 P0

🔴 **Manual verify Books 4 viewMode** (TODO.md P0의 7-step 절차) — 사용자 직접 시각 확인 + 회귀 fix
🟡 Wiki 그룹 헤더 아이콘 (~30분)
🟢 다음 큰 트랙 (Smart Book v2 / Wiki view-engine board) brainstorm

### 환경 변경

- Store version v122 → v126 (4 step, 모두 idempotent / types union 확장)
- Tests: 255/255 (변화 없음)
- Build/TSC: 0 errors
- launch.json: `npx next` 기반
- 신규 파일 6개 (`use-books-view.ts`, `book-list-row.tsx`, `book-grid-card.tsx`, `books-board.tsx`, `books-gallery-adapter.tsx`, plan)

### Architect 검증

자동 verify: tsc + build + tests OK (255/255). dnd-kit visual verify는 사용자 manual 필수.

---

## 🚀 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic (27 files, 9 카테고리)

**범위**: 단일 worktree (`lucid-agnesi-b963f3`). 27 files (+735 / -847), 2 파일 삭제 (dual mode).

### 큰 작업 요약

**1. 책 UX 개선 4 fixes (이슈 2/3/4 + ←→ 단축키)**
- 책 목차 드롭다운 (BookContextNav): kind icon (Note cyan / BookOpen violet) + status icon (StatusShapeIcon / IconWikiStub/Article) 추가
- NoteEditor BookContextNav 우측 → 좌측 통일 (EditorBreadcrumb 옆)
- BookWikiReader "Books > Article Title" breadcrumb 추가
- Read mode 키보드 ←/→ 네비 (NoteEditor + BookWikiReader + SecondaryWikiArticle)

**2. 책 Split View 풀 지원 (이슈 1, ~4h)**
- SecondaryViewRouter에 /books + /books/{id} case 추가
- BookDetailPage pane-aware refactor (readingEntityId, cleanup pane-scoped)
- BooksView pane-aware (useActiveRoute ↔ useSecondaryRoute)
- layout.tsx `isEditingInTableView` (book route는 layout이 split panel 렌더)
- SecondaryPanelContent priority (books route > secondaryNoteId)
- 5 케이스 모두 동작 (같은 책 두 페이지, 다른 책 비교, 책 list + 메타, 메타 + reading, 같은 책 note+wiki)

**3. Dual mode 완전 폐기 (10 파일, Store v122 migration)**
- ViewMode + VALID_VIEW_MODES + view-configs supportedModes 정리
- DisplayPanel "Dual" 버튼 + isDualDisabled 로직 제거
- use-effective-view-mode.ts + dual-list-editor.tsx 파일 삭제
- ⌘⇧E Dual toggle 제거 (NoteEditor read/edit toggle만 유지)
- Store v122: viewMode === "dual" → "list" (viewStateByContext + savedViews idempotent)

**4. 갤러리 entity-agnostic 리디자인 (Notes + Wiki + References)**
- v3 mockup `u-*` 클래스 폐기 → Plot 토큰 (`bg-card`, `border-border`)
- Generic GalleryView (GalleryItem/GalleryGroup interface)
- 3 entity adapters (Notes/Wiki/References)
- Wiki + References supportedModes에 `"gallery"` 추가
- 클릭 = 풀 에디터 (preview pane → openNote)
- `.gallery-cover` CSS class (light/dark alpha 분기, `--cover-color` 변수)

**5. View-engine 그룹핑 + 그룹 헤더 아이콘 통일**
- Gallery 시간 그룹핑 폐기 → view-engine groupBy 활용 (status/label/folder/tag/family/priority)
- 그룹 헤더 아이콘: status=StatusShapeIcon, label=color dot, folder=Folder, tag=Hash, family=Tree
- Notes Table/Board/Gallery 모두 통일
- 버그 fix: notes-table GroupHeaderIcon `label.toLowerCase()` → `groupKey` (NoteStatus cast bug)

**6. NOTE_STATUS_COLORS stale CSS var 버그 fix**
- 기존: `var(--chart-2)` (cyan in dark) — 다크모드에서 stone이 cyan으로 보이던 버그
- 새: `var(--status-stone)` (#cbd5e1 slate-300 → toasted sand #e8d5a3)
- learnings.md의 v3 phase 1 의도와 코드 불일치 해소

**7. Status 색 강화 (다크 모드)**
- Stone: gray → toasted sand (warm earthy)
- `--status-stone` light `#c9a87c` / dark `#e8d5a3`
- Brick `#f59e0b` (dark), Keystone `#2dd4bf` (dark)
- 다크 캔버스에서 모든 status 가시성 강화

### 큰 결정 (영구, 이번 세션)

**1. Dual mode 폐기 LOCKED**: Split view + list mode + editor pane으로 충분. 중복 메커니즘 제거. v3 mockup의 결정이었지만 Plot 정체성과 충돌 — "Gentle by default" 위배. v122 migration으로 사용자 데이터 자동 fix.

**2. 갤러리 = entity-agnostic generic**: GalleryItem interface로 Note/Wiki/Reference 통합. 미래 entity 추가 시 adapter만 작성. v3 mockup CSS 클래스 (`u-*`) 영구 폐기 — Plot 디자인 토큰만 사용.

**3. 단일 클릭 = 풀 에디터 (Plot 표준)**: preview pane → openNote 변경. List/Board/Gallery 모두 일관.

**4. Books split view 풀 지원**: 5 케이스 모두 secondary pane 인프라 활용. URL은 primary 전유, secondary는 store-driven. `_interceptForSecondary` + PaneProvider 기존 인프라가 핵심.

**5. Stone 색 = toasted sand**: neutral gray(zinc)에서 자연 돌(sandstone) 색으로 변경. brick(orange)과 같은 따뜻한 군이지만 saturation 다름. keystone(teal)과 cool/warm contrast.

**6. 그룹 헤더 아이콘 view 간 통일**: list/board/gallery 모두 같은 (status shape / label color / folder icon). 학습 부담 0.

**7. 키보드 단축키 두 패턴 공존**: ⌘[/⌘] (modifier, Safari/Chrome 패턴) + plain ←/→ (read mode, Reader app 패턴) 모두 지원.

### 기술 학습 (영구)

- **NOTE_STATUS_COLORS stale CSS var bug** — `var(--chart-2)` 가리켰는데 globals.css에 `--status-stone` 별도 정의. 매핑 mismatch. 1줄 fix로 Plot 전체 stone 색 일관성 회복.
- **`e.target` window일 때 `closest` undefined** — synthetic `window.dispatchEvent` 시 target=window. Real keyboard input은 target=focused element. Optional chain `target.closest?.()` 방어.
- **WorkspaceEditorArea NotesTableView 전용** — split panel을 자체 처리. 다른 view (BooksView, WikiView 등)는 layout.tsx가 처리해야. `isEditingInTableView = isTableView && !!selectedNoteId`.
- **SecondaryPanelContent priority** — secondaryNoteId 우선이면 BookDetailPage가 unmount → cleanup이 bookContext 클리어. 책 라우트(`/books*`)는 secondary route 우선 처리해야 BookDetailPage가 reading mode 자체 처리.
- **notes-table GroupHeaderIcon label vs groupKey** — label은 display alias ("Block" for keystone), groupKey는 raw value. NoteStatus cast 시 groupKey 필수. label.toLowerCase() 패턴은 잠재 버그.
- **CSS-aware color via color-mix + custom property** — 인라인 style은 dark variant 불가. `.gallery-cover` 클래스 + `--cover-color` 변수로 light/dark 분기. Plot 토큰 패턴 정합.

---

## 🚀 2026-05-10 (마라톤) — Phase A polish + Smart Book Phase A + 책 reading flow (33 files, 9 작업 + 12 polish steps)

**범위**: 단일 worktree (`distracted-heyrovsky-f06ba0`)에 누적. 33 files (+1289 / -187), 4 신규 파일.

### 큰 작업 요약

**1. UI 버그/UX 5 fixes**
- /trash 페이지에 Books entity 통합 (`components/notes-table.tsx`)
- Path B Step A: globals.css `.a-th, .a-row` 6-col grid hardcoded 제거 (chrome-only)
- Dual mode pane gating + i18n: 한글→영어 5 strings + secondary pane dual 비활성 (PRD §LOCKED #9)
- ⌘⇧E pane-aware: secondary focus면 no-op + toast hint
- DisplayPanel "Dual" 버튼 disabled in secondary (3-layer closure)

**2. Smart Book PRD 작성**
- `.omc/plans/smart-book-prd.md` (656 line, 12 LOCKED decisions)
- draft → revision (BLOCKING 3 + recommended 7) → 2x critic 통과
- INVARIANT: AutoSource는 공급원, BookItem kind는 note/wiki/chapter-heading만

**3. Smart Book Phase A 10 sub-steps 완성**
- Step 1: Schema (AutoSource type) + Store API (5 methods, dedup guard) + v121 migration + 11 tests
- Step 2.1: Resolver pure function (folder source only, multi-source dedup) + 14 tests
- Step 2.2: BookDetailPage 통합 (resolver useMemo + drag/up-down auto guard)
- Step 2.3: SourcesSection UI (folder picker + add/remove)
- Step 2.4: AddItemDialog "Smart" 탭
- Step 2.5: BookItemRow source-aware (visual + remove branch)
- Step 2.6 (Tweak A): empty source heading hide
- Step 2.7 (Tweak B): manual override source badge
- Step 2.8 (Tweak C): folder picker preview count
- Step 2.9: In-book navigation includes auto items (`resolvedContentItems`)

**4. 책 reading flow 도입 (Step 2.10~2.21)**
- Read button + read mode + Linear ←→ navigation + TOC dropdown
- BookDetailPage가 NoteEditor / BookWikiReader 직접 mount (URL `/books/{id}` 유지)
- BookWikiReader full chrome (Aa font / collapse / WikiLayoutToggle / Edit/Done)
- max-w 풀폭 default + sub-route fallback double-mount fix (50% → 100%)

### 큰 결정 (영구, 이번 세션)

**1. Plot 모토 = 풀페이지 default**: max-w 제한 없이 본문 풀폭. 우측 SmartSidePanel은 opt-in (⌘B). NotesView/WikiView/BookDetailPage 통일.

**2. Books reading flow 패턴**: /books/{id} URL 유지 + BookDetailPage가 NoteEditor / WikiArticleView 직접 mount. Cleanup unmount 시 bookContext + selectedNoteId clear.

**3. layout.tsx isViewRoute sub-route 포함**: `/books/{id}`, `/library/*` 같은 sub-route를 view-route로 인정 → fallback children div 동시 mount 방지 (50% 폭 stealing fix).

**4. Empty infobox 자동 hide**: read 모드 + 콘텐츠 비어있으면 infobox rail 숨김. 본문이 22% 회수.

**5. Smart Book INVARIANT**: AutoSource = "어디서(공급원)", 멤버 kind 아님. 모든 source는 note/wiki만 filter.

**6. PRD §LOCKED #9 3-layer 일관**: 시각 fallback + 입력 가드 (⌘⇧E) + UI 가드 (Dual 버튼) — defense-in-depth.

### 기술 학습 (영구)

- **flex item에 `w-full flex-1` 필수** — 누락 시 contents 폭만 차지 (intrinsic width). BookWikiReader가 81%만 차지하던 진짜 원인
- **Layout fallback double-mount 패턴** — `isFallback` 정의에서 sub-route 누락 시 children + view 동시 visible → flex-1 50%씩
- **Resolver fractional key seeding** — `lastManualOrder` 추출 후 auto 시퀀스 → manual top + auto bottom 자연 보장
- **Multi-source dedup** — `seenAutoRefIds` Set으로 첫 source 우선
- **데이터 모델 silent assumption 위험**:
  - `Folder.noteIds` 없음 (Note.folderIds reverse N:M)
  - `WikiArticle.categoryIds: string[]` (DAG 다중 부모)
  - `Folder.kind = "note" | "wiki"` (둘 다 X)
  - Folder + WikiArticle 모두 hard-delete only
- **PRD critic agent 2회 가치** — silent assumption catch (Plot codebase 직접 검증으로)
- **HMR 한계** — 큰 파일 변경 시 HMR 못 잡고 stale view 표시 → dev server 재시작 또는 hard reload (Ctrl+Shift+R)

### 환경 변경

- Store version 120 → 121 (Smart Book: smartSources/excludeIds defaults)
- 신규 파일 4: `smart-book-prd.md`, `resolver.ts`, `resolver.test.ts`, `sources-section.tsx`
- Tests: 246 → 255 (+9 utils tests, 14 resolver tests, 11 books-slice tests)
- Build/TSC: 모두 ✅ pass
- Architect 7회 검증 통과

### 다음 세션 P0 (사용자 명시)

1. **Close 버튼** — 위키에만 있는데 노트에도 추가할지 vs 그냥 없애기 (의논)
2. **Books 뒤로가기 별로** — 위키처럼 타이틀 헤더 아래 sub-nav 패턴 (`← All / Articles / Stubs`) 적용 검토
3. **Books 리스트 무조건 그리드** — list mode/grid mode 통일 검토
4. **Edit 버튼 색상/폰트** — 책 안 wiki reading의 Edit 버튼이 일반 wiki view와 색상/사이즈 다름 → 통일

---

## 🚀 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (~45 변경, 2 PRD, 단일 PR)

**범위**: 하루에 polish 시리즈 + Path A 완성 + 두 큰 entity 도입 (Book + Dual mode) + plugin install. 단일 squash PR로 머지 예정.

### 큰 작업 요약 (~45개 변경)

**Polish + cleanup (12개)**
- StatusShapeIcon `Cuboid` → `Cuboid2x2` 통일
- `.a-row__icon` + `.a-stchip` chip 가시성 12% → 24% (라이트모드)
- Wiki list leading icon `.a-row__icon` chip wrapper 추가
- Studio + Editorial 제거 + migration v119 (영구 규칙 #1 cleanup)
- ViewSwitcher 제거 → Display popover [List|Board|Gallery] 3-segment
- 사이드바 active icon 공간별 색상 (`data-active-space` + 6 space CSS 매핑)
- Stone/Brick/Block 헤더 status 아이콘 분기 (FileText → Hexagon/Cube/Cuboid2x2)
- Wiki article 헤더 stub/article 아이콘 분기 (BookOpen → IconWikiStub/Article)
- Inbox 라우팅 home space (`inferSpace` `/inbox` → `home`)
- Inbox B1+B2+B3 (max-width + count chip + Next-up 카드)
- Home sidebar 보강 (Pinned + Recent cross-entity Note+Wiki+Book)
- PanelsMenu 미니어처 (4-region SVG, panel별 layout 시각화)
- Old Cuboid (1×2) `components/icons/Cuboid.tsx` 삭제 + Notes config Cuboid2x2 통일

**Filter coverage Path A 완전 종결 (6 entity)**
- Step 1: Files type filter (image/url/file)
- Step 2: References type filter (link/citation)
- Step 3: Wiki Category status filter (has-articles/empty) + tier value fix
- Step 4: Tags color filter (set/unset)
- Step 5: Inbox source filter (5 InboxItemKind)
- Bonus: Sticker memberStatus + memberKind (7-kind)

**Book entity 도입 (PRD + Critic + Phase 1-4 + 통합)**
- PRD: `.omc/plans/book-entity-prd.md` (revised v1.1, 6 critic issues 반영)
- Phase 1: Data infra — Book/BookItem types + BooksSlice + 25 vitest tests + IDB v120 migration + `fractional-indexing` package
- Phase 2: ActivityBar 7th space (Wiki와 Calendar 사이) + /books route + Burgundy 색 `#be123c` + sidebar
- Phase 3: Manual book view — books grid + BookDetailPage + dnd-kit drag/↑↓ reorder + AddItemDialog + chapter heading insert + dropdown context menu
- Phase 4: In-book navigation — `N/M ↑↓` counter + breadcrumb + ⌘[/⌘] 단축키 + pane-scoped bookContext (primary/secondary)
- "In Books" 섹션 (note/wiki detail panel — 공용 InBooksSection 컴포넌트)
- Book pin → Home Quicklinks 통합 (mixed-quicklinks book + sidebar HomePinnedItem)
- Book trash UI 통합 (showTrashed toggle + restore/forever-delete)
- Books 색상 burgundy (#be123c rose-700, 6 다른 space와 distinct)

**Dual mode 도입 (PRD + Critic + Phase 1-3+5+6, Books skip locked)**
- PRD: `.omc/plans/split-mode-prd.md` (revised v1.1, 6 critic issues 반영)
- 핵심: 이름 "Split" → "Dual" rename — 기존 NoteSplitOverlay와 충돌 회피
- Phase 1: 인프라 — DualListEditor (autoSaveId, controlled X) + useEffectiveViewMode (SSR-safe, transition-only debounced toast) + ⌘⇧E 단축키 + UI slice (dualSelection flat, dualRatio)
- Phase 2: Notes view 통합 — DisplayPanel "Dual" entry + NotesTable dualMode + NoteEditor reuse
- Phase 3: Wiki view 통합 — WikiList dualMode + WikiArticleView reuse (sub-modes 우선순위 보존)
- Phase 4: Books skip — LOCKED (자체가 list 구조)
- Phase 5: References 통합 — ReferenceDetailPanel reuse
- Phase 6: Polish — 키보드 ↑↓ navigation (Notes/Wiki/References) + DefaultEmptyState 강화 (⌘⇧E hint) + Display button title hint
- Mail-client 패턴 5-pane (AB / SB / List / Editor / Detail), 1200px viewport fallback

**Plugin install**
- plot-frontend 글로벌 등록 (~/claude-plugins/plot-frontend-plugin/ + known_marketplaces.json + settings.json)
- 다음 세션부터 자동 활성: 3 skills (production-ui-refiner, mockup-faithful-implementation, frontend-orchestrator) + 4 hooks + 4 commands

**Bug fixes**
- FilterRule.op → operator typo fix (References filter)
- VALID_VIEW_MODES runtime validator 누락 — Critic이 Dual PRD에서 발견 (TS union만으론 부족, IDB hydration 시 silent fallback 위험)

### 큰 결정 (영구)

**1. Books 색상 = Burgundy `#be123c`**:
- 6 기존 space (cyan/violet/teal/pink/amber/indigo)와 distinct
- Plot 2.0 docs에 이미 정의된 rose-700과 정합
- 책 표지 가죽 메타포

**2. Book = cross-entity ordered sequence (Note + Wiki MVP)**:
- 4사분면 컨테이너 모델 마지막 자리 채움
- Heading-as-divider 단일 모델 (flat + nested 자연스럽게 통합)
- N:M 다중 멤버십, 책 내 dedup
- fractional-indexing string order (sparse integer 대신 underflow 회피)
- Smart Book = AutoSource는 v2 (별도 PRD)

**3. Dual mode = "Split" 이름 회피**:
- 기존 NoteSplitOverlay (`lib/note-split-mode.ts`)와 이름 충돌
- "Dual"로 rename → "main viewport을 list+editor로 분할" 의미
- NoteSplitOverlay 우선순위 (z-40 overlay, dual mode 시각 suppressed but state 보존)

**4. Filter coverage Path A 완성 — 6 entity**:
- Files / References / Wiki Category / Tags / Inbox / Stickers
- 모든 필터 view-engine config + applyXxxFilters Stage 통일 패턴
- Plan §11.2 우선순위 모두 적용

**5. Plot 사이드바 active icon = 공간별 색상**:
- 이전: 모든 공간에서 cyan (notes 색) hardcoded
- 지금: `data-active-space` attribute 기반 6 공간 CSS 매핑

### 기술 학습

- **fractional-indexing 패턴**: sparse integer halving 대신 lexicographic key (`generateKeyBetween`). 50회 같은 위치 insert 후 underflow 회피. ~5-10 bytes 추가 storage.
- **VALID_VIEW_MODES runtime validator**: TS union만 update하면 IDB hydration 시 silent fallback. 두 곳 같이 update 필수.
- **autoSaveId pattern**: `react-resizable-panels`의 `defaultSize` controlled 시 안 작동 (uncontrolled). `autoSaveId`로 라이브러리 자체 persistence 활용.
- **SSR-safe hook**: `mounted` state guard로 hydration mismatch 회피. `transition-only` debounced toast로 resize spam 방지.
- **Pane-scoped state**: bookContext (primary/secondary 독립). Plot의 SmartSidePanel dual pane 인프라와 정합.
- **Critic agent 가치**: 두 PRD (Book + Dual) 모두 6 issues씩 정확히 잡음. PRD 신선할 때 review = mid-implementation pivot 위험 회피.

### Phase별 미완 (다음 세션 후보)

- Smart Book (Phase 5) — AutoSource resolver, 별도 PRD 필요 (~4-5h)
- /trash 페이지 books section 통합 (notes-table refactor, ~1h)
- Path B Step A — globals.css `.a-th/.a-row` 6-col grid hardcoded refactor (~1.5h)
- 나무위키 인포박스 고도화 Tier 1 — 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기 (~3-4h)
- 다중 기기 sync Phase 1 (PRD LOCKED, ~몇 세션)

### 환경 변경
- Store version 119 → 120 (v120 = Books migration)
- npm 패키지 추가: `fractional-indexing@^3.2.0`
- Plugin global install: `plot-frontend@plot-frontend` (~/claude-plugins/)

---

## 🚀 2026-05-08 (오후) — Status icons + Phase 4.3 chrome 통일 (시도→revert→정리) + Filter coverage plan (5 PR + docs sync)

**범위**: 사용자 회귀 발견 (PR 4.3a `.a-row` grid 충돌) + 즉시 fix. Phase 4 north star (filter model 통찰) 명문화. 4.3 chrome 통일은 globals.css refactor prerequisite.

### 머지된 PRs (이번 세션, 5 PR + docs sync)
- **PR #271** (claude/status-icons-metaphor): Status icons + UI 라벨 "Keystone" → "Block" + Cuboid (1×2 isometric block) + Save view button icon-only 16px (HBtn pattern). 4 atomic commits + merge resolution (origin/main 25+ commits behind).
- **PR #282** (claude/v3-phase-4-3): PR 4.3a Tags+Labels chrome 통일 시도. `.a-th` + `.a-row` 적용.
- **PR #283** (claude/v3-phase-4-3a-fix): PR #282 partial revert. `.a-row`가 globals.css에서 6-column grid 강제로 layout 깨짐 (`#Knowledge Management` 두 줄 wrap + ~90px dead space).
- **PR #284** (claude/v3-phase-4-3a-fix-2): Tags row `border-b border/50` 제거 (Notes/Labels 패턴 일관) + plan update Section 9-10 (lessons + revised roadmap).
- **PR #285** (claude/v3-phase-4-3-plan-filter-coverage): plan Section 11 — Filter coverage 분석 (entity별 도메인 + Step 1-5 series).
- **(docs sync PR)**: NEXT-ACTION / SESSION-LOG / MEMORY (이 entry) / TODO / CONTEXT 5/8 진척 반영.

### 큰 결정 (영구)

**1. Filter model 통찰 (사용자 직관)**:
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
- Filter 없는 view = 도메인 attribute 부족 (column 자체가 단순)
- column 추가 시 Filter도 자연스레 가능 (Tags color, Files type 등)
- **이 model이 PR 4.3 chrome 통일의 north star** — 단순 visual 통일이 아닌 filter/column model 통일

**2. NoteStatus enum value `keystone` 유지** (UI 라벨만 "Block"):
- internal `keystone` 그대로 (URL `/keystone`, IDB key, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier와 충돌 회피
- mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)
- 영구 결정

**3. Cuboid 컴포넌트 신규** (`components/icons/Cuboid.tsx`):
- 두 큐브가 한 면을 공유한 1×2 isometric block (직육면체)
- 단일 SVG, 11 line elements (outer hexagon 6 + Y junction 3 + cube divider 2)
- Pre-computed isometric vertices (256 viewBox + 16px padding) — 수정 금지 (격자 정렬)
- Phosphor wrapper 인터페이스 (size / weight / color / mirrored)
- IconBlock = 단순 wrapper (`<Cuboid weight="regular" />`)

**4. View modes 평가** (사용자 회의 직관):
- **Studio + Editorial**: 영구 규칙 #1 위반 ("멋진 레이아웃 / 시각적 다양성 방향 제안 금지") + TODO 폐기 항목 ("매거진 pivot 폐기 2026-04-22") 부활 → **제거 예정** (Path C)
- **Gallery**: 카드 형태 자체는 좋음. 단 (1) 편집 불가 read-only (2) 하드코딩 styling (cream 강제, Plot tokens 무시) → **polishing 후 재도입** (Path D)
- 통합 방향: Display popover `[List | Board | Gallery]` 3-segment + ViewSwitcher tab 제거

**5. `.a-th, .a-row` grid hardcoded 발견**:
- globals.css에서 `display: grid; grid-template-columns: minmax(0, 2.4fr) minmax(0, 1.3fr) 110px 90px 70px 80px;` (notes-table 6-column 강제)
- NotesTable은 inline grid로 덮어씀 → OK / 다른 view (3-element flex)는 layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임 (Path B Step A)

**6. Filter coverage 도메인 분석**:
- 명확 가치 (높음): Files (type), References (type), Wiki Category (보강), Inbox (source)
- 일관성 추가 (중간): Tags / Labels color, Stickers
- Filter 없는 게 자연스러움: Insights (analytics)
- **Step 1-5 series** — view-engine config 변경만 (chrome refactor와 독립, 병렬 PR 가능)

### v3 PRD 영향
- Phase 4.3 분해 정정: chrome 통일 prerequisite (globals.css refactor) + Filter coverage 보강 (Step 1-5)
- Phase 5 재검토: Studio/Editorial 제거 + Gallery polish 후 재도입

### 다음 우선순위 (P0)
1. **Path A Step 1** — Files type filter (가장 작고 명확) ⭐ 추천
2. **Path B Step A** — globals.css `.a-th/.a-row` refactor (chrome 통일 prerequisite)
3. **Path C** — Studio + Editorial 제거 (영구 규칙 위반 cleanup)
4. **Path A Step 2-3** — References / Wiki Category filter

### 이번 세션 기술 학습
- **PR cycle (#282 → #283 → #284)**: 시도 → revert → 정리. globals.css 구조 문제는 단순 className 추가로 해결 안 됨 — 깊은 refactor 필요. 사용자 visual feedback이 가장 빠른 진단 path.
- **NoteStatus rename 회피 결정**: 53 files atomic rename + IDB v118 + route redirect 큰 작업 회피. UI 라벨만 변경으로 90% 가치 + 10% 작업.
- **Filter model 통찰 → roadmap**: 사용자 직관 ("필터/디스플레이 다 있어야 되는 거 아니냐")이 phase 4.3 진짜 의미를 명확화. 단순 visual 통일 X, **filter/column model 통일**.
- **PR 머지 시 충돌 대응**: origin/main 25+ commits behind 시 view-header.tsx / home-view.tsx 등 자주 변경되는 파일에서 충돌. 머지 commit + 충돌 해결 + push의 표준 절차 수립.

### 아직 PR 안 한 작업물 (이번 세션 untracked, secondary)
- `docs/status-icons-preview.html` (시안 HTML) — 작업물, 정리 권장
- `docs/WIKI-REDESIGN-INSTRUCTIONS.md`, `plot-wiki-collection-mockup.html`, `plot-wiki-full-flow.html` — 3/19 작성 mockup, 별 의미 없음 (정리 또는 .gitignore)

### Plan 문서 보존
- `.omc/plans/v3-phase-4-3-decompose.md` — Section 9-11 핵심 (Lessons + Roadmap chrome + Filter coverage)
- `.omc/plans/v3-phase-4-decompose.md` — Phase 4 원본

---

## 🚀 2026-05-07 (밤) — Mockup 직접 서빙 + PanelsMenu 통합 (PR #281)

**범위**: 이전 after-work 후 사용자와 큰 토론. mockup HTML을 dev server에 직접 서빙해서 내가 직접 작동시켜 인터랙션 분석. 발견된 spec을 PR #281에 누적 5 commits로 적용.

### 큰 발견 (영구 인사이트)

**Mockup 직접 서빙 = 인터랙션 spec 추출 가능**:
- 이전엔 mockup JSX/CSS 코드만 읽음 → 인터랙션 spec 누락
- `npx serve docs/v3-mockup/ -l 3003` + preview MCP로 직접 작동 확인
- 다른 Claude 인스턴스 만들기 ≠ 빠름 (같은 한계 + 시간 두 배)
- **나에게 mockup 작동을 보여주는 것이 진짜 답**

### 추출된 mockup 인터랙션 spec
- **4-panel toggle 시스템**: actbar / sidebar / list / detail 각자 독립
- **Edge re-open button**: collapsed 시 chevron right
- **Popover preset**: "Show all" / "Hide all" 통합 menu
- **단축키**: ⌘⇧\ (actbar) / ⌘\ (sidebar) — Plot ⌘\ 충돌
- **`.a-shell` grid**: CSS var driven (`--a-actbar-w` 등) + 0.18s ease 트랜지션
- **Filter popover**: Linear-style 2-column (왼: filter type, 오: checkbox)

### PR #281 누적 (5 commits)
1. `bb3f36c` Activity bar collapse + edge re-open (분산 패턴, 5에서 통합으로 교체)
2. `a6e7a9e` Save view 단어 제거 (모든 view 플로피 icon만)
3. `3224e9d` ⌘⇧A 단축키 (actbar collapse 토글)
4. `c17c0aa` **PanelsMenu (햄버거) 신규** — mockup spec 정확 적용
   - 분산 close button (actbar X / sidebar) → 통합 햄버거 menu
   - Popover with Activity bar / Sidebar / Detail 체크박스 + Show all / Hide all preset

### 영구 결정 (이번 세션)
1. **Mockup-first 한계 패턴**: layout/cell mockup, typography/badges/spacing은 Plot 우선
2. **Mockup 직접 서빙으로 인터랙션 분석** (별도 Claude 인스턴스 X)
3. **PanelsMenu 통합** — 분산 close button 패턴 폐기, 통합 햄버거 menu
4. **단축키 정합 (Plot ↔ mockup 충돌 시 Plot 키 신규)**:
   - ⌘⇧F: sidebar (Plot 기존)
   - ⌘⇧A: activity bar (mockup ⌘⇧\ 충돌 회피)
   - ⌘B: side panel
5. **View modes / Display panel 통합 토론 → 보류** (사용자 결정: 그대로 유지)

### 사용자 통찰 (정리)
- "디자인만 가져오기, 기능은 살리자"
- "별도 Claude 만들기" 아이디어 → 한계 인정 → mockup 직접 서빙 채택
- "Save view 단어 빼라" → 모든 view 플로피 icon만
- "햄버거 menu 패턴 mockup처럼" → PanelsMenu 통합

### 다음 우선순위
- 🔴 PR #281 머지 (사용자 승인)
- 🟡 Phase 6 본 작업: Filter popover (Linear 2-column) + .a-shell grid layout
- 🟡 Phase 5.4 Graph (남은 view mode)
- 🟡 List/Detail panel collapse (PanelsMenu에 이미 있음, 시각 layout만)

---

## 🚀 2026-05-07 (저녁/밤) — v3 Phase 4.2 + Phase 5 4 PR + mockup-first 패턴 정착

**범위**: Inbox Layer 머지 후 v3 visual refresh 대규모 진행. notes-table reskin + Gallery + Studio + Editorial. 사용자와 mockup-first 한계 토론, Plot 정체성 보존 패턴 정착.

### 머지된 PRs
- **#276** v3 Phase 4.2 — notes-table.tsx reskin (.a-* row chip patterns)
- **#277** v3 Phase 5.1 — Gallery view (mockup wow factor #1, warm canvas + cards)
- **#278** v3 Phase 5.1b — Table/Board .u-mode shell wrapper
- **#279** v3 Phase 5.2 + 7 fixes — Studio (dark forced + SRS) + mockup-first 보정 패턴
- **#280 OPEN** v3 Phase 5.3 — Editorial (Source Serif 4 magazine 룩)

### 큰 사용자 통찰 (영구 결정)

**1. mockup-first의 한계 명확화**:
- 사용자: "디자인만 가져오고 싶다, 기능은 살려라"
- mockup의 layout/structure/cell 패턴은 가져오되 **이미 잘 잡힌 Plot 디자인은 보존**
- mockup이 Plot 정체성을 무단 교체하면 안 됨

**2. mockup vs Plot 결정 매트릭스 (영구)**:
| 영역 | 정책 |
|------|------|
| Layout / structure / cell / shell | mockup ✅ |
| Card / chip 패턴 (.u-card, .a-row) | mockup ✅ |
| 다크 Studio / Source Serif 4 | mockup ✅ |
| Header typography | Plot 위키 정합 (mockup .a-th__cell 폐기) |
| Status badge | Plot StatusBadge (mockup .a-stchip 폐기) |
| Memo label | Plot 보존 (사용자 명시 "무조건") |
| Default columns | mockup-friendly + Plot folder 보존 |
| spacing (gap, padding) | Plot 정체성 우선 (위키 정합) |

**3. PR #279 7 fixes (Studio 외)**:
- Header `.a-th__cell` → 위키 typography (14px medium normal-case)
- Status chip → StatusBadge rollback
- Default visibleColumns → mockup 6 + Plot folder
- gap 16→8 (위키 wiki-list.tsx gap-2 정합)
- Title cell marginLeft -8 (gap 상쇄, 체크박스에 가깝게)
- padding 16→20 (헤더+row 체크박스 정렬)

### Phase 5 view modes (4 modes)

| Mode | 핵심 |
|------|------|
| 5.1 Gallery | warm canvas + oklch hue cards + Source Serif title |
| 5.2 Studio | dark forced + SRS segments + transport bar |
| 5.3 Editorial | magazine spread + drop cap + 2-column |
| 5.4 Graph (대기) | SVG deterministic positioning |

### 인프라 완성
- `lib/v3/note-helpers.ts` — getHueFromNoteId / getCoverGradient / getExcerpt / getSpread / getWordCount / getStudioSegments / roundFillTo01 / getSubtitle / extractParagraphs / getIssueNumber
- `components/views/view-switcher.tsx` — Table/Gallery/Studio/Editorial 4 buttons
- `components/views/{gallery,studio,editorial}-view.tsx` + `*-view-shell.tsx` (parallel pattern)
- `lib/view-engine/types.ts` — ViewMode union 4 modes 확장
- `app/globals.css` — `.u-vs / .u-mode / .u-gallery* / .u-card* / .u-studio* / .u-edit*` mockup CSS 그대로 이식

### Plot Q-decisions 적용 검증
- Q4 Studio dark forced ✅
- Q5 Editorial body = extractParagraphs runtime ✅
- Q9 Gallery hue = noteId hash ✅
- Q10 Editorial subtitle = note.summary ✅
- Q11 5-mode = Notes list만 ✅
- Q12 Studio segments = SRS 진행도 ✅
- Q13 ViewSwitcher = workspace header ✅

### 다음 우선순위
- 🔴 PR #280 머지 (사용자 승인)
- 🟡 Phase 5.4 Graph (마지막 view mode)
- 🟡 Phase 6 (Filter Popover + Workspace Chrome)
- 🟡 Phase 7 (QA + cleanup)

---

## 🚀 2026-05-07 (오후) — Phase B Inbox Layer 시리즈 완성 (4 PR) + 큰 방향 전환

**범위**: 새 worktree `magical-curie-ad6175`. Inbox layer 4 PR (3 머지 + 1 OPEN). entity-based → action-based 큰 방향 전환.

### 머지된 PRs
- **#272** (3019b37) — inbox infra (action-based dismiss/snooze + reminder source) + IDB v117 + plan v2
- **#273** (edd902b) — home inbox card with reminder source
- **#274** (7169eaf) — /inbox full-page + srs/snooze-expired sources + dismiss/snooze hover button
- **#275** (OPEN, 0043597) — sidebar entry + wiki-redlink/auto-enroll sources + InboxSourceIcon dedup

### 큰 방향 전환 (영구)

**v1 plan 폐기 → v2 action-based 채택**:
- v1: entity-based "stone + 미분류" 필터 = "정리 안 된 dashboard"
- 실측 발견: createNote가 항상 Memo label 자동 부여 + onRehydrate backfill → useInbox 항상 0 항목
- 사용자 통찰: "스톤은 인박스가 아니야. 기존 인박스가 스톤으로 이름이 바뀐 건데. 아예 없던 인박스 개념을 새로 만들어내는 거야. 리니어의 인박스처럼."
- v2: action notification queue (Linear 정합) — "내가 *반응*해야 할 일들"

### 5 sources 완성 (action-based)

| Source | 데이터 | 의미 |
|--------|--------|------|
| 🔔 reminder | Note.reviewAt | 사용자 명시 due 도래 (today + overdue) |
| 🧠 srs | srsStateByNoteId.dueAt | SRS 리뷰 도래 |
| ⏰ snooze-expired | snoozedInboxItems | 사용자 snooze 만료 항목 재노출 |
| 🔗 wiki-redlink | linksOut + wikiArticles | unresolved [[wiki-link]] (refs >= 2) |
| 💡 auto-enroll | clusterSuggestions | wiki 자동 등재 제안 (status === pending) |

### 핵심 인프라
- `lib/store/slices/inbox.ts` — `InboxItemKind` type + dismiss/snooze actions (5 actions)
- `lib/hooks/use-inbox.ts` — useInbox() unified hook, 5 sources, dedup/snooze 필터
- `components/inbox/inbox-source-icon.tsx` — kind→icon 공용 매핑 (Bell/Brain/MoonStars/LinkBreak/Sparkle)
- `components/views/inbox-view.tsx` — full-page (filter tabs + hover dismiss/snooze + popover)
- IDB v117 migration (idempotent — Array.isArray 가드)

### 영구 결정
1. **Inbox = action notification queue** — entity-based 폐기. Linear 정합.
2. **dismiss/snooze identifier = (kind, sourceId)** — 안정적 키, 5 source 호환
3. **InboxItemKind ≠ EntityKind** — kind는 "왜 inbox에 있는가" (action source), entity 분류 아님
4. **wiki-redlink threshold = 2** — noise 방지
5. **clusterSuggestions filter = "pending"만** — accepted/dismissed 제외
6. **Sidebar Inbox link = Home space만** — 다른 space와 분리

### 기술 학습
- **Memo backfill 함정**: createNote가 항상 Memo 자동 부여 + onRehydrate backfill — entity-based "no label" 필터 무효화. 영구 정책으로 알려둘 것
- **VIEW_ROUTES 등록 필수**: 새 always-mounted route는 `lib/table-route.ts`의 VIEW_ROUTES에 추가 필수 (designer 누락 사례)
- **Fast Refresh hook 순서 변경**: hook 추가 시 full reload 발생 — 정상 (HMR 한계)
- **InboxItemKind 분리**: EntityKind와 명확 구분 — semantic 명확화

### Architect 검증 결과
- PR #272: APPROVED (3 Low concerns, inbox-3에서 처리)
- PR #273: APPROVED (3 Low concerns, inbox-4에서 처리)
- PR #274: APPROVED (2 Low concerns, inbox-4에서 처리)
- PR #275: APPROVED (concerns 없음)

### Phase B 시리즈 완성 🎉
Linear-style action queue 완성. dismiss/snooze/undo/popover 모두 작동. 5 sources 통합. Plot "Gentle by default" + Linear UX 패턴 정합.

### 다음 우선순위
- 🟡 Phase 4 PR 4.2+ (notes-table.tsx reskin, stone/brick/keystone 명칭)
- 🟡 Wiki template 3-layer
- 🟡 Smart Book v2 (AutoSource[5])
- 🟢 (옵션) Inbox-5: SRS review mode 진입, mobile, grouping by date

---

## 🚀 2026-05-08 (새벽) — NoteStatus rename + Inbox layer 큰 결정 (plan 작성)

**범위**: 새 worktree `note-status-rename`. PR 4.1 (Phase 4 CSS 통합) 머지 + 2 plan 작성. 작업은 다음 세션.

### 머지된 PRs
- **#267** (PR 4.1 — claude/v3-phase-4-plan): feat(v3-phase-4-1) table mode CSS 통합 (`.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-stchip` / `.a-tag` / `.a-tool`). 시각 변경 0. +487 LOC.

### Plan 파일 작성 (작업은 다음 세션)
- `.omc/plans/note-status-rename.md` — Phase A: NoteStatus 단순 atomic rename (53 files / 274 occ + IDB v116 migration)
- `.omc/plans/inbox-layer.md` — Phase B: 단일 통합 Inbox layer (4-5 PR, 새 기능)

### 큰 결정 (영구)

**1. NoteStatus 명칭 변경 (Phase A)**:
- `inbox/capture/permanent` → **`stone/brick/keystone`** (건축 메타포)
- 의미 progression 유지 (raw → processed → keystone). 색 동일 (Q3 LOCKED).
- 단일 atomic PR (분리 시 컴파일 에러). 6 commits in 1 PR.
- IDB v116 migration. route redirect (`/inbox` → `/stone` 등)

**2. Inbox 개념 분리 (Phase B)**:
- inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- 새 의미: "처리 대기" 알림함

**3. 단일 통합 Inbox** (per-entity 분산 X):
- 하나의 inbox = Notes/Wiki/Book/Reference/Files 모두 통합
- Plot 정체성 ("Gentle by default") + IKEA 전략 + Linear/Things3 패턴 정합
- per-entity 분산 = 사용자 부담 ↑

**4. Inbox 위치**: Home 안 카드 + `/inbox` full-page
- v3 11결정 #1 (7-space) 보존
- top-level activity bar 8번째 X

**5. Inbox 정의**: 하이브리드
- 자동 entity별 필터 default + 사용자 dismiss/snooze
- entity별 자동 필터:
  - Notes: stone + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 미분류
  - (옵션) SRS: scheduled review 도래

### v3 PRD 영향
- Phase 5 적용 범위 변경: `/notes, /inbox, /capture, /permanent, ...` → `/notes, /stone, /brick, /keystone, ...`. `/inbox` 제거 (별도 layer).
- v3 mockup의 inbox/capture/permanent → stone/brick/keystone로 적용. inbox layer는 mockup 외 신규 디자인.

### 다음 우선순위 (P0)
1. **🔴 Phase A**: NoteStatus rename (atomic 단일 PR, executor agent 위임 권장)
2. **🟡 Phase B**: Inbox layer (4-5 PR, Phase A 완료 후)
3. **🟢 Phase 4 재개**: PR 4.2 notes-table.tsx reskin (새 명칭 사용)

### 이번 세션 기술 학습
- **plan-only 세션 패턴**: 큰 결정사항 명확히 docs에 박은 후 다음 세션에서 작업. 작업 원칙 #4 (사용자 reproduce 정보 우선) 정합.
- **Atomic rename 원리**: 53 files / 274 occ는 분리 시 컴파일 에러. 단일 PR이 안전.
- **Per-entity vs 통합 inbox**: 단일 통합이 Plot 정체성 + UX 인지 부하 최적.

---

## 🚀 2026-05-07 (밤 늦게) — Plot v3 Phase 3 완료 (4 PR — Activity Bar / Sidebar Chrome reskin)

**범위**: 새 worktree `v3-phase-3-plan` 생성 + Phase 3 분해 plan + 4 PR 완료. Activity Bar (72px) + Sidebar (`.a-sb-*` 패턴) + Brand mark (Plot 로고 SVG) v3 mockup 적용.

### 머지된 PRs
- **98f9277** PR 3.1 — CSS 통합. `.a-actbar` / `.a-sidebar` / `.a-sb-*` (link / section / head / hint / search / scroll / foot / link__count / link__dot) / `.a-icb` / `.a-kbd` / `.a-detail` / `.a-shell` 통합. `--sidebar-fg` alias + shell vars 추가. **시각 변경 0**. +729 LOC.
- **5ac22ef** PR 3.2 — activity-bar.tsx reskin. width 44→72px, label permanent, brand mark, active 표시 변경. **Plot 6-space 색 보존** (mockup 단일 cyan → SPACE_COLORS 6색 inline override).
- **8155530** PR 3.3 — linear-sidebar.tsx reskin. NavLink + Section + 11 inline button 일괄 (`.a-sb-link[data-active]` + `.a-sb-section + head + hint`). +43/-61 (코드 18줄 감소!).
- **3761e42** PR 3.4 — brand mark을 Plot 로고 SVG 교체 (네트워크 그래프 6 nodes + 10 edges + 강조 center node = "central knowledge node" 메타포 — Zettelkasten × Palantir).

### 큰 결정 (영구)

**PR 3.4 scope 변경**:
- 원래 `.a-shell` shell layout grid → ResizablePanel + view-split + side panel과 충돌
- **결정**: brand mark SVG 교체로 전환. Shell grid는 Phase 6 (filter popover + workspace chrome)에서.

**Plot 6-space 색 보존 (activity bar)**:
- v3 mockup 단일 cyan → SPACE_COLORS 6색 inline override (color-mix bg + color + boxShadow)

**Sidebar 단일 cyan (visual confirm 후 결정)**:
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- visual confirm 후 회귀로 판단되면 fix PR

### 외부 도구 평가 (영구 결정)
- **Front-End-Design-Checklist** (passive 5.2k): ❌ 적용 X. 4 design skills과 중복

### 이번 세션 기술 학습
- **새 worktree 생성**: `git worktree add ../<name> -b claude/<branch> origin/main` + EnterWorktree (path 인자)
- **Preview tool cwd cache**: EnterWorktree 후 preview_start cwd가 이전 worktree로 cache. workaround 한계 → 사용자 manual 권장
- **CSS 클래스 통합 패턴**: v3 mockup CSS를 globals.css 끝에 그대로 이식 + 부족 token alias만 추가. **시각 변경 0** PR로 다음 PR 안전성 확보
- **className replace_all**: 동일 substring 일괄 변경. 11 inline button 중 5개 정적 즉시 처리
- **Edit minimal diff 효과**: PR 3.3 +43/-61 (코드 18줄 감소). v3 패턴이 Tailwind utility 인라인보다 짧음

### 다음 우선순위
- 🔴 **Visual confirm** (사용자 manual `npm run dev`)
- 🟡 OK면: Phase 4 (Table reskin) 또는 Phase 5 (View Switcher) / Phase 6 (Filter + Shell grid)
- ⚠️ 회귀 시: fix PR (sidebar svg 색 6-space 별 등)

### Plan 문서 보존
- `.omc/plans/v3-phase-3-decompose.md` (이번 세션)

### Phase 진행 상황
- ✅ Phase 0: cleanup (v112)
- ✅ Phase 1: token foundation
- ⏸️ Phase 2: Imperial icon kit DEFER
- ✅ **Phase 3: Activity Bar / Sidebar Chrome** (이번)
- ⏳ Phase 4-7

---

## 🚀 2026-05-07 (밤) — Group C PR-D 5/5 완성 + 4 design skills install

**범위**: PR 3 Stickers (v113) + PR 4 References (v114) + PR 5 Files (v115) + skills install. Group C PR-D 시리즈 종료.

### 머지된 PRs (이번 세션, 모두 같은 worktree)
- **a055581 v113** — PR group-c-d-3 Stickers view-engine 통합. `stickers` ViewContextKey + useStickersView thin fork (~180 LOC, cross-entity members count) + StickerMemberCountChip (Stack icon) + STICKERS_LIST_VIEW_CONFIG + ViewMode list+grid + idempotent v113 migration. 9 files +427/-92.
- **c3700ad v114** — PR group-c-d-4 References view-engine 통합. 첫 non-Note entity. `references` ViewContextKey + useReferencesView thin fork (~155 LOC, caller가 pre-filtered Reference[] 전달, enrich + sort + group) + 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip) + REFERENCES_VIEW_CONFIG + Grid mode (image preview + title + content excerpt + chips). sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지 (multi-state UI가 viewState.toggles boolean record에 안 맞음). 9 files +408/-43.
- **f210fcf v115** — PR group-c-d-5 Files view-engine 통합. media entity (Attachment image/url/file). `files` ViewContextKey + useFilesView thin fork (~135 LOC) + 2 신규 chips (FileTypeChip / FileSizeChip) + FILES_VIEW_CONFIG + Grid mode (4:3 thumbnail block + chip row) + column header sort "type" → "fileType" 명시 변환. 신규 SortField: size + fileType. 9 files +423/-39.

### 부수 fix (반복)
- `notes-table.tsx` SORT_FIELD_LABELS Record<SortField, string> exhaustive 매번 update — memberCount, fieldCount, size, fileType 추가 (PR 3/4/5). next build type error 방지.
- 로컬 type alias `SortDir` 제거 (사용처 0)

### 디자인 인프라 보강 (이번 세션)
- **0f7e2ec** — taste-skill 4개 install (project-level, `.agents/skills/`)
  - design-taste-frontend (Senior UI/UX, metric-based)
  - high-end-visual-design (agency-grade fonts/spacing/shadows)
  - redesign-existing-projects (v3 visual refresh와 정합)
  - minimalist-ui ("Gentle by default" 정합)
- universal symlink (Codex/Cursor/Copilot 등 12 agents 호환). Claude Code 자동 활성
- skills-lock.json (cross-machine sync). 새 머신: `npx skills experimental_install`로 symlink 재생성

### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + 30+ 컴포넌트 + @radix-ui 28개). v3 PRD "shadcn cascade 보존" 명시
- **onlook** (visual code editor, 25.7k stars): ❌ Plot 부적합. production app 자동 코드 변경 회귀 위험. greenfield/marketing에 적합
- **Front-End-Design-Checklist** (passive 40+ items, 5.2k stars): ❌ design-quality-gate / linear-design-mirror / 4 design skills과 중복. handoff 가이드라 1인 dev에 audience 불일치
- **huashu-design** (mockup/prototype 도구): △ Plot production code에는 적용 X. v3 mockup 단계에서만 유용

### Group C PR-D 시리즈 완성 🎉
- ✅ PR 1: Tags v110 (#261)
- ✅ PR 2: Labels v111 (#262)
- ✅ PR 3: Stickers v113 (a055581)
- ✅ PR 4: References v114 (c3700ad)
- ✅ PR 5: Files v115 (f210fcf)

5 entity 모두 view-engine pipeline + ViewHeader + viewState persist + list/grid mode 통합. thin fork 패턴 정합 (Generic 화 X 영구). Saved View가 5 entity context 자동 적용.

### 다음 우선순위 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan (Notion/Linear 하이브리드 에디터 / Type rename / 5 view modes / activity-bar reskin / Linear-style filter popover)
- 🟡 Wiki template 3-layer (Layout Preset + Content Template + Typed Infobox)
- 🟡 Smart Book v2 — AutoSource[5] (folder/category/tag/label/sticker)

### Store Version 진화 (이번 세션)
v112 → v113 (Stickers) → v114 (References) → v115 (Files)

---

## 🚀 2026-05-07 (밤) — Plot v3 Phase 2 DEFERRED (큰 방향 결정)

**범위**: Phase 2 (Imperial icon kit) 도입 **보류** 결정. PRD 상단 DECISION banner + plan 문서 ARCHIVED. partial work 그대로 유지.

### 결정 (영구)
- **Imperial 전면 도입 보류**: phosphor-icons 그대로 유지
- 직전 plan (`.omc/plans/v3-phosphor-inventory.md`) **부정확** ("2 files / 4 icons" → 실측 **119 files / 60+ icons / 87 files weight 사용**)
- 119 files = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
- phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → Imperial 도입의 시각 가치 약함
- 빌드 정상 (tsc 0 / build clean / 185 tests pass)
- lucide / 외부 라이브러리 추가 도입은 의미 없음 (phosphor 광범위)

### 처리한 작업
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` 상단 DECISION banner 추가. Status v1.1 → v1.2. §0 TL;DR Imperial 항목 strike-through
- `.omc/plans/v3-phosphor-inventory.md` ARCHIVED banner. historical reference로 보존
- CONTEXT/MEMORY 결정 기록

### 보존된 partial work (revert 안 함)
- `components/icons/imperial.tsx` + `imperial-extras.tsx` 모듈 보존
- `components/activity-bar.tsx` Imperial 마이그레이션
- `components/plot-icons.tsx` `IconWiki = WikiBook`
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` 일부
- `components/side-panel/backlink-card.tsx` weight 제거

### 다음 P0
- **Group C PR-D PR 3-5** (Stickers→Pack / References / Files view-engine 통합) 또는
- **Plot v3 Phase 3+** (PRD 후속 phases — Notion/Linear 하이브리드 에디터, Type rename 등)

---

## 🚀 2026-05-07 (저녁) — Plot v3 Phase 2 부분 진행

**범위**: Imperial icon kit 모듈 작성 + 일부 migration. 사용자 위임 거절로 부분 완료 상태에서 commit.

### 완료
- `components/icons/imperial.tsx` 신규 (Imperial 80+ icons, 1.5px stroke, currentColor, `weight: never` 의도적 typing — phosphor 잔존을 컴파일 에러로 surface)
- `components/icons/imperial-extras.tsx` 신규 (Plot 도메인: WikiBook, OntologyWide, Bookshelf 등)
- `components/activity-bar.tsx` — phosphor SSR (Graph/Books/BookOpen/SidebarSimple) → Imperial
- `components/plot-icons.tsx` — `IconWiki = BookOpen` (phosphor) → `IconWiki = WikiBook` (Imperial)
- `components/views/{note-split,wiki-merge,wiki-split}-page.tsx` — lucide → Imperial 일부
- `components/side-panel/backlink-card.tsx` — `weight="regular"` 제거 (Imperial weight: never 충돌 fix)

### 잔여 (다음 세션 0.5일)
- 5+ files / 85+ occurrences `weight=` props 잔존 (calendar-view.tsx, display-panel.tsx, filter-bar.tsx, board-workbench.tsx, color-picker-grid.tsx 외)
- lucide / iconoir / tabler / remixicon 잔존 사용처
- imperial-extras.tsx의 Plot 도메인 icon SVG 정확성 검증

### 검증
- `tsc --noEmit`: 0 errors
- `npm run build`: clean
- `npm run test`: 185 pass (0 regression)

---

## 🚀 2026-05-07 — Plot v3 Phase 1 (token foundation) 완료

**범위**: v3 design tokens 통합 + Q1-Q3, Q8 LOCKED 결정 적용 + Source Serif 4
font + `_legacy/` 폴더 마련. Phase 0 위에서 진행.

### 주요 결정 (LOCKED 적용)
- **Q1 SPACE_COLORS = B**: Plot 유지 (notes=cyan, wiki=violet, calendar=pink 등). v3 mockup 값 적용 안 함.
- **Q2 --accent = A (v3)**: light `#5E6AD2`, dark `#7C8AE7`. cascading 토큰 (`--ring`, `--sidebar-primary`, `--toolbar-active` 등) 모두 따라 변경.
- **Q3 NOTE_STATUS_HEX = A (v3 desaturated)**: inbox `#6B7280`, capture `#D97706`, permanent `#0E9384`.
- **Q8 Priority namespace = A**: `--v3-priority-{high,medium,low}` v3 mockup 값 채움 (`#DC6803`, `#5E6AD2`, `#98A2B3`). Plot `--priority-*` 5-tier 100% 보존.

### 머지 예정 PRs (Phase 1)
- **PR #NEW** Plot v3 Phase 1 — 6 commits:
  - `chore(tokens): Token Cascade Map analysis (Phase 1.1)` — `.omc/plans/v3-phase-1-cascade-map.md`. v3 신규 토큰 grep 0 hits + Plot 기존 토큰 shadcn 의존 매핑.
  - `feat(tokens): integrate v3 design tokens with alias policy (Phase 1.2)` — `app/globals.css` 3-Layer alias 정책 적용. v3 surface (`--bg`, `--fg`, `--soft-fg` 등) + space (Q1) + status (Q3) + priority (Q8) + typography + radii + motion + shadow. Plot 기존 토큰 100% 보존. `@theme inline`에 v3 토큰 노출.
  - `feat(colors): add v3 color aliases, apply Q3 desaturated status (Phase 1.3)` — `lib/colors.ts` NOTE_STATUS_HEX 변경 + 신규 export `TEXT_HIERARCHY`/`MOTION`/`RADIUS`.
  - `feat(fonts): add Source Serif 4, verify Geist (Phase 1.4)` — next/font 추가. self-reference 회피 위해 `--font-source-serif` → `@theme inline`에서 `--font-serif`로 alias.
  - `chore(_legacy): scaffold _legacy folder + import policy (Phase 1.7)` — `components/_legacy/` + README.md 4 정책.
  - `docs(plot-v3): Phase 1 token migration complete` — CONTEXT/MEMORY 업데이트.

### Token alias 정책 (3-Layer)
```
Layer 1: v3 names    (--bg, --fg, --soft-fg, --bg-elev, --space-*, --v3-priority-*)
                     ↓ same hex
Layer 2: Plot names  (--background, --foreground, --muted-foreground, --card, --priority-*)
                     ↓ expose
Layer 3: Tailwind    (@theme inline → --color-background, --color-fg-soft, etc.)
```

### 검증 결과
- `tsc --noEmit`: 0 errors
- `npm run build`: clean (33 routes prerendered)
- `npm run test`: 185 tests passed (0 regression)
- shadcn/ui Tailwind cascade: 정상 (40+ ui/* 컴포넌트 의존하는 Plot 기존 토큰 모두 보존)

### 다음
Phase 2 (Imperial icons codemod, ~0.5일 예상) — 121 phosphor import 사이트
변환. `_legacy/` 폴더 본격 사용 시작점.

---

## 🚀 2026-05-07 — Plot v3 PRD 작성 + Phase 0 cleanup

**범위**: Plot 2.0 → v3 visual refresh 리브랜드. Critic 발견 2가지 사전 정리 (C1 priority namespace / C2 ViewMode mismatch). Store v112.

### 주요 결정 (영구)
- **Plot 2.0 폐기, v3 visual refresh 채택**: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` — Notion/Linear 하이브리드 에디터 방향 + 토큰 시스템 전면 교체
- 앞 세션 11가지 결정 (7-space, Type rename 등)은 v3 PRD에 통합

### 머지 예정 PRs (#NEW — Phase 0 cleanup)
- **PR #NEW** v112 — Plot v3 Phase 0 cleanup.
  - `lib/types.ts`: SavedView.viewState.viewMode `"table"` 제거 + `"grid"` 추가 (view-engine ViewMode exact match, @migrated v112 JSDoc)
  - `lib/view-engine/defaults.ts`: normalizeViewState에 legacy `"table"` → `"list"` rawViewMode 매핑 helper
  - `lib/store/migrate.ts` + `lib/store/index.ts`: v112 마이그레이션 (savedViews viewMode `"table"` → `"list"`, idempotent)
  - `app/globals.css`: `--v3-priority-{high,medium,low}: unset` 선언 자리 마련 (`:root` + `.dark`, 값은 Phase 1)
  - tsc 0 errors / 185 tests pass / build clean

### Store version 진화 (이번 세션)
v111 (labels-list) → **v112** (SavedView viewMode "table"→"list" + --v3-priority-* namespace)

---

## 🚀 2026-05-05 — Group C PR-D 시리즈 진행 + UI hotfix + Plot 2.0 PRD 시작

**범위**: PR #261 (Tags) merged, PR #262 (Labels) created. UI hotfix 8개. **Plot 2.0 진화 PRD Phase A 완료 + 핵심 결정 11가지 확정**.

### 머지된 PRs (이번 세션)
- **#261** v110 — Group C PR-D PR 1 (Tags). `tags-list` ViewContextKey + CONTEXT_DEFAULTS, useTagsView thin fork (~165 LOC), TAGS_LIST_VIEW_CONFIG, TagNoteCountChip, ViewMode list+grid, v110 idempotent migration. 9 files +954/-83 LOC. Architect APPROVED 3 NITs (모두 fix). Preview 검증 완료 (Display popover, Grid mode, viewState persist).
- **#262** v111 — Group C PR-D PR 2 (Labels). #261 패턴 그대로 + Label 특성 (color non-nullable, 1:1 labelId, /labels 라우트 유지). useLabelsView thin fork (~155 LOC), LABELS_LIST_VIEW_CONFIG, LabelNoteCountChip. Architect APPROVED 0 NITs. Preview 검증 (Memo label 3 노트 정확). 8 files +577/-239 LOC.

### Hotfix 8개 (PR #262와 함께 묶음)
1. `status-icon.tsx` defensive guard — `NOTE_STATUS_COLORS[status]?.css ?? "currentColor"` (groupBy="status" + invalid label crash 방지, pre-existing 버그 fix)
2. `notes-table.tsx` — Index 헤더 위치 (justify-between → gap-2, Title 옆), TH `hideInactiveHint` prop (Title 컬럼만 invisible sort arrow 숨김 → wiki/templates 간격 통일)
3. `wiki-list.tsx` — Index 헤더 gap-2, checkbox `w-7 → w-8`, **wiki article icon status color** (stub=orange, article=emerald)
4. `templates-table.tsx` — Index gap-2, row `gap-3 py-2 → gap-2 py-2.5`, title cell wrapper `gap-1.5 → gap-2`
5. `labels-view.tsx` — row 체크박스 hover-only (Templates 패턴)
6. `tags-view.tsx` — list mode 체크박스 hover-only
7. `stickers-view.tsx` — row 체크박스 hover-only
8. `linear-sidebar.tsx` — **Notes 사이드바 Folders ↔ Views 순서 변경** (Views 위, Folders 아래)

### 🆕 Plot 2.0 PRD 시작 (큰 결정)

**자료**: 사용자가 ChatGPT 목업 20장 (`C:\Users\user\Desktop\플롯 UI 진화 가이드자료\`) 첨부 → Plot 진화 vision 영감

**Phase A 완료** — 코드베이스 깊이 정독 + 진화 진단:
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` 신규 — 22 slice / 8 entity / 17 ViewContextKey / 7 ViewMode 완전 매핑 + 진화 매트릭스 + Open Questions 10개
- 1차 목업: `docs/PLOT-2.0-MOCKUP.html` (5 화면 1차 prototype)
- 1차 정밀화: `docs/PLOT-2.0-NOTES.html` (designer-high 정밀화, 90점)

**확정된 11가지 결정** (영구):
1. **Activity Bar 7-space** (home/notes/wiki/calendar/ontology/library/**books NEW**)
2. **7-space 새 팔레트**: home indigo, notes cyan, wiki violet, calendar pink, ontology emerald, library amber, **books rose** (#fb7185 dark / #e11d48 light)
3. **분류 체계 4-system → 3-system**: Label → **Type** (note pool, 단일), Category → **Type** (wiki pool, DAG 다중), Tag (그대로), **Sticker → Pack** (rename + 새 시각 정체성)
4. **Type rename 방식**: UI 레이블만 변경 (코드 그대로), 나중에 별도 PR로 코드 rename
5. **Type 컬럼 Display picker**: Hidden / Icon only (default) / Text only / Icon + Text
6. **이모지 vs Custom Icon**: emoji 단일 필드 먼저 prep, `Label.icon: { type: "emoji" | "custom"; value: string }` 이중 구조로 swap 가능 (사용자 직접 디자인 진행 중)
7. **Tags 사이드바 인라인 색 dot** (큰 변화)
8. **Templates 사이드바 승격** (More section → 별도 섹션, [Note] [Wiki disabled] 탭)
9. **Timeline = ViewMode** (별도 ContextKey X), `VALID_VIEW_MODES`에 `timeline` 추가
10. **Detail Panel 5-tab**: Detail / Connections / Activity / Bookmarks / **Stats** (NEW). "Insights" 단어는 Plot 전체 분석에 보존, **Stats**는 단일 노트
11. **Focus Mode**: Default / Focus / Zen / Compact. 3-진입점 (단축키 ⌘. + 우상단 버튼 + Settings)

**Plot 2.0 핵심 영구 결정 보존**:
- "Gentle by default, powerful when needed"
- Note/Wiki 2-entity 영구 분리
- 색 정책 4사분면 (Label/Sticker→Pack 필수, Folder/Tag opt-in)
- LLM/API 미사용
- Note split = UniqueID 활용

**Phase B-D 남음**:
- Phase B: 완벽한 목업 제작 (반응형 + 토글 + 데이터 정확도) — 5-7 화면
- Phase C: 사용자 검토 + 수정
- Phase D: PRD 작성 + 작업 단위 분해 (2-4개월 구현 로드맵)

### 큰 결정 (영구, 이번 세션)
- **Plot 2.0 진화 = 95% 적용 가능** — 기능 손실 0, 80% 표면 강화 + 20% 새 layer
- **Label/Category/Sticker → Type/Pack rename** (UI 단어 변경, 데이터 모델 그대로)
- **사용자 직접 아이콘 디자인 진행 중** — 완성 시 custom icon registry로 swap (이중 구조)
- **새 7-space 팔레트** — 기존 SPACE_COLORS 재디자인 (새 술 새 부대)
- **Sticker → Pack** (Bundle 비추, Box는 Inbox/Infobox와 헷갈림, Album은 이미지 인상 강함)
- **"Insights" vs "Stats" 분리** — Plot 전체 분석=Insights, 단일 노트=Stats

### 이번 세션 기술 학습
- **TH 컴포넌트 hideInactiveHint prop** — Title cell의 invisible sort arrow가 12px width 차지 → notes Title이 wiki/templates와 다른 간격. prop 추가로 Title만 hide (다른 컬럼 hover hint 보존).
- **체크박스 hover-only 패턴**: `selectionActive || isChecked ? "visible" : "invisible group-hover:visible"` (Templates 패턴, 모든 entity에 일괄 적용).
- **사이드바 섹션 순서**: Views → Folders가 Notes에서 더 자연 (사용자 직관, 2026-05-05 결정).
- **Wiki article icon color**: 회색 + Status 컬럼 badge 분리 의도였지만 사용자가 "노트처럼 색 직접" 원함 → leading icon에도 status color 적용. WIKI_STATUS_HEX inline.
- **explore-high agent 활용 = Phase A 적합** — 22 slice + 8 entity + 디자인 토큰 + 진화 진단까지 한 번에 (코드 정독 + 미래 진단).
- **designer-high agent (Opus)** = 1.5-2시간 정밀화 (한 화면). 5 화면 다 한 번에 4-6시간.

### 다음 세션 우선순위
1. **🔴 Plot 2.0 Phase B 진행** — designer-high에게 Notes 시그니처 위임 (반응형 + 토글 + 모든 결정 반영)
2. Phase B 만족 → 같은 디자인 언어로 나머지 4 화면 (Wiki / Home / Library + Books / Focus)
3. Phase C: 검토 후 Phase D PRD 작성 + Phase 1 구현 시작 (2-3주)
4. Group C PR-D PR 3-5 (Stickers→Pack / References / Files) — Phase 1 진행 중에 동시 가능

### Plan 문서 보존
- `.omc/plans/group-c-prd-view-engine-integration.md` (PR 1, 2 완료, 3-5 남음)
- `docs/PLOT-CURRENT-STATE-FOR-2.0.md` (Plot 2.0 Phase A 보고서)
- `.omc/notepad.md` (Plot 2.0 PRD 진행 + 11가지 결정 + 다음 세션 컨텍스트)

### Store version 진화 (이번 세션)
v109 → v110 (tags-list viewState) → v111 (labels-list viewState)

---

## 🚀 2026-05-04 (오후) — Templates 데이터 모델 정리 + 색 opt-in 정책 (v108/v109)

**범위**: Templates 시리즈 마무리 + Folder/Tag 색 정책 큰 결정. 2-PR 분리 머지.

### 머지된 PRs (이번 세션)
- **#258** v108 — NoteTemplate slim. `description` / `status` / `priority` 3 필드 데이터 모델에서 제거 (이전 카드 표시 폐기 → 데이터 모델 정리 follow-up). 사이드 패널 Status/Priority row 제거, Label/Folder만 유지. `createNoteFromTemplate` default `"inbox"` / `"none"` 하드코딩. 시드 13개에서 3 필드 strip. v108 마이그레이션: 기존 templates 3 필드 idempotent strip. 부수: footnotes-footer Zustand selector 무한 루프 BUG fix (`EMPTY_REF_IDS` stable ref). templates-table row 시각 baseline notes-table와 일치 (Layout 아이콘 제거, pin만 유지). 13 files +74/-145 LOC.
- **#259** v109 — Folder/Tag 색 opt-in 정책. 자동 부여(palette cycle / pickColor 해시) 폐지 → 신규 폴더/태그는 `color: null`로 시작. 사용자가 우클릭 "Change color..."로 명시적 부여. `Folder.color` / `Tag.color` → `string | null`. helper `getEntityColor(c)` 추가 (null → STATUS_DOT_FALLBACK 회색). 30+ 표시 사용처에 fallback 일괄 적용. 사이드바 폴더 우클릭 + Tags-view row 우클릭에 Reset color 옵션. v109 마이그레이션: no-op (옵션 A — 기존 사용자 색 그대로 유지). 27 files +219/-105 LOC.

### 큰 결정 (영구, 이번 세션)
- **Templates는 카드 + 데이터 모델 모두 정리**: status/priority/description은 default 값으로서도 가치 약 (사용자가 어차피 변경) → 완전 제거. 새 노트는 inbox/none으로 시작.
- **Templates row 시각 = Notes row baseline**: 같은 list라 같은 시각. Layout entity 아이콘 = 차별화 0 → 시각 노이즈로 제거. 핀만 inline 유지 (정보 차이 있는 곳).
- **색 정책 4사분면 (LOCKED)**:
  - Label / Sticker = 색 필수 유지 (chip / hull 시각 도구)
  - Folder / Tag = **opt-in** (이름·계층이 정체성, 색은 강조 옵션)
- **Tag 본질 재정의**: 본문 hashtag로 자동 생성되는 가벼운 마커. 색 의도 0이라 자동 부여(pickColor)는 노이즈.
- **마이그레이션 옵션 A 채택**: 기존 사용자 색 그대로 유지 (의식적 reset 가능). 데이터 손실 0.
- **PR 분리 원칙 준수**: v108(Templates) → squash merge → v109(색) 별도 작업. UI + 데이터 모델 둘 다 변경하더라도 의미 단위로 묶음.

### 이번 세션 핵심 결정사항
- **footnotes-footer BUG**: zustand selector에서 매번 새 빈 array `[]` 반환 → React 19 useSyncExternalStore "infinite loop" 감지. `EMPTY_REF_IDS` stable ref 패턴으로 해결 (lib/stickers.ts `EMPTY_STICKER_ARRAY` 컨벤션 따름).
- **Templates 사이드 패널 default 의미**: 사용자가 헷갈렸음 ("이 properties 의미?") → status/priority가 default 값이라는 게 직관적이지 않음 = 제거 신호.
- **시각 매칭 검증 = DOM measure**: 같은 14px 이라도 outline vs filled, 무채색 vs status컬러 차이로 시각 무게 다름. 사용자 직관 = 디자인 시그널.
- **Tag opt-in 시각화 = leading dot**: tags-view row에 색 dot 추가하면서 우클릭 picker 진입점 마련. 색 변경 즉시 시각 피드백.
- **Folder vs Tag entity 구별**: Folder는 사용자가 의식적으로 만듬. Tag는 hashtag로 우연 생성 가능. opt-in 정책에 차이 없지만 UX 진입점은 다름 (Folder = 사이드바 우클릭, Tag = tags-view row 우클릭).

### 이번 세션 기술 학습
- **Zustand selector + React 19**: 매번 새 array/object 반환하면 useSyncExternalStore 안티패턴. 모듈 레벨 stable empty constant 패턴 정합 (이미 lib/stickers.ts:47에 있던 컨벤션).
- **executor agent 위임 효과**: v109 type error 30+ 사이트 일괄 fix를 executor에 위임 → 자동으로 helper 호출 + import 정리 + tsc 0 errors까지. multi-file 변경에 강력.
- **Worktree branch 관리**: v108 squash-merge 후 origin/branch는 squash 전 원본 commit. force push 회피하려면 새 branch checkout (Plot 워크플로우: branch per PR).
- **`gh pr merge` worktree 충돌**: `--delete-branch` 옵션이 local checkout 시도 → main worktree 점유로 실패. `--squash`만 사용하면 remote merge OK. local cleanup은 별도.
- **Color picker UI 재사용**: 이미 ColorPickerGrid 컴포넌트 + 사이드바 Folder 우클릭에 wired. v109 작업이 인프라 추가가 아니라 *기존 인프라의 default 정책 변경* + Tag entry point 추가로 minimal.

### 다음 세션 우선순위 (재정렬)

#### 🟡 큰 작업 후보 (시드 템플릿 BUG는 v108에서 해결됨)
1. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs). Templates/Folder가 본보기. **planner 권장**.
2. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
3. **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
4. **Template seed audit** — `PlotTemplate<T>` 추상화 검토

#### 🟣 마지막
5. **Note UI toolbar** (UpNote-style)
6. **House (계보 시각화)** — 토론 후 결정

#### 🟢 작은 후속 정리
- Templates grid chip 시스템 완전 통일 (PR e deviation)
- 키보드 shortcut (D/T/P 등) — 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)
- Tag 우클릭 메뉴 Rename 옵션 추가 (v109에서 Change color/Reset/Delete만 추가됨)
- Label 색 정책 재검토 — 현재 필수지만 Tag와 같은 opt-in 가능성 토론 필요

### Plan 문서 보존 / 신규
- `.omc/plans/folder-nm-migration.md` (이전, PR a/b/c 완료)
- `.omc/plans/template-b-edit-ui-unification.md` (이전, v108 정리 토대)

### Store version 진화 (이번 세션)
v107 → v108 (NoteTemplate description/status/priority strip) → v109 (Folder/Tag color nullable, no-op migration)

---

## 🚀 2026-05-04 — Folder N:M 시리즈 완성 (PR b/c)

**범위**: PR (folder-b) UI 분리 + PR (folder-c) Multi-folder UX. Folder type-strict + N:M 시리즈 3-PR 완성.

### 머지된 PRs (이번 세션)
- **#255** PR (folder-b) — UI type-strict 시각화. 신규 `folder-picker.tsx` (kind-aware, 3가지 export로 4곳 dedup) + 사이드바 Notes/Wiki Folders 분리 (kind="note" / kind="wiki") + `/folder/[id]` kind 분기 + DnD wrong-kind drop 거부 + notes board/table 다중 폴더 FolderChip ("+N more"). 8 files +744/-397 LOC, 5 commits.
- **#256** PR (folder-c) — Multi-folder UX. FolderPicker `selectMode="multi"` 활성화 (체크박스 + Apply) + Detail panel 다중 폴더 chip strip (note + wiki) + 우클릭 메뉴 / floating-action-bar "Add to folders…" + group-by-folder MultiFolderMarker (다른 폴더 카운트) + DnD Shift modifier (no shift = Add, Shift = Move). 10 files +931/-124 LOC, 5 commits, 18 신규 N:M action 테스트.

### Folder N:M 시리즈 총합 (PR a/b/c)
- **3 PRs**, 17 commits, 65+ files, **+3215 / -685 LOC**
- 데이터 N:M (PR a) → UI type-strict (PR b) → multi-folder UX (PR c)
- Test coverage: 167 → 185 (18 신규 N:M action 테스트)

### 이번 세션 핵심 결정사항
- **FolderPicker는 단일 컴포넌트 + 3가지 export** (Popover / inline-submenu / 훅) — 4곳의 chrome 차이 흡수
- **DnD modifier 시맨틱**: 일반 drop = Add (N:M 자연), Shift+drop = Move (single 시맨틱 보존). 첫 drop 시 toast로 안내.
- **MultiFolderMarker**: group-by-folder에서 다중 폴더 노트는 현재 컬럼 외 다른 폴더 수만 chip으로 표시 (전체 chip 아님 — 카드 과밀 방지)
- **Wiki bulk action**: 별도 floating bar 없음. wiki-list 우클릭 메뉴만. 향후 wiki bulk bar 만들 때 같은 패턴 transplant.
- **FolderPicker 검색 필터**: 미구현 (50+ 폴더 시점에 도입 검토)

### 이번 세션 기술 학습
- **FolderPicker 추상화 패턴**: 다양한 chrome (Popover/Submenu/inline-expand) 흡수하는 design = 단일 컴포넌트 + 다중 export. 호출 사이트가 자기 chrome 결정.
- **DnD shiftKey 감지**: dnd-kit에서 `shiftPressedRef` (global keydown/keyup listener) 패턴으로 re-render 없이 modifier 추적.
- **vitest + jsdom 미설정**: 프로젝트는 .ts 만 테스트 (component .tsx 테스트 X). 슬라이스 액션 단위 테스트로 대체.
- **multi-mode picker 디자인**: local pending Set + Apply 버튼이 single-toggle보다 명확. count summary 노출.

### 다음 세션 우선순위 (재정렬)

#### 🔴 즉시 (사용자 워크플로우 차단)
1. **BUG fix** — 시드 템플릿 더블클릭 에러. 콘솔 메시지 미수집. `template-edit-page.tsx` + `templates-table.tsx` 디버깅 필요.

#### 🟡 큰 작업 후보
2. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs). Templates/Folder가 본보기. **planner 권장**.
3. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
4. **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
5. **Template seed audit** — `PlotTemplate<T>` 추상화 검토

#### 🟣 마지막
6. **Note UI toolbar** (UpNote-style)
7. **House (계보 시각화)** — 토론 후 결정

#### 🟢 작은 후속 정리
- Templates grid chip 시스템 완전 통일 (PR e deviation)
- NoteTemplate 타입에서 description/status/priority 필드 제거
- 키보드 shortcut (D/T/P 등) — 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)

### Plan 문서 보존
- `.omc/plans/folder-nm-migration.md` (PR a/b/c 모두 완료)
- `.omc/plans/template-b-edit-ui-unification.md` (이전)

### Store version (현재 v107)
v100 → v107 (Sticker.members → Template icon/color drop → templates context → visibleColumns 단순화 → description 제거 → seed 9개 주입 → Folder kind+N:M)

---

## 🚀 2026-05-03 (저녁) — Templates 시리즈 종결 + Folder N:M 시작

**범위**: Templates 시리즈 4개 PR + Folder type-strict N:M 데이터 모델 PR (a) 1개. 총 5개 PR squash-merge.

### 머지된 PRs
- **#249** Template PR c — view-engine 통합 (list/grid + multi-select + alpha index + chip 일관성). 마이그레이션 v102→v105 (templates context 등록 + visibleColumns 단순화)
- **#250** Template PR d — seed templates 4→13 (Weekly Review/Monthly Reflection/1:1 Meeting/Standup/Reading Notes/Diary/Goal Setting/Decision Log/Project Kickoff). 신규 사용자 only.
- **#251** PR e — Linear-style properties-aware cards. 12개 도메인 chip (`property-chips.tsx`) + notes/wiki board + templates grid `visibleColumns` wiring + `+N more` overflow. ViewMode union에 "grid" 추가.
- **#252** PR f — v106 migration: 기존 사용자에게 9개 신규 시드 idempotent 주입.
- **#253** PR (folder-a) — Folder type-strict + N:M 데이터 모델 + 마이그레이션 v107. Folder.kind: "note"|"wiki", Note.folderIds[], WikiArticle.folderIds[]. 혼합 폴더 자동 분리 (`{name} (Wiki)` 클론). 45 files +634/-169 LOC.
- **#254** docs: after-work session wrap-up — notepad + worklog 동기화.

### 핵심 결정사항
- **Templates 디스플레이 properties 단순화**: status/priority/label/folder/tags/description 폐기 → Index/Updated/Created 3개만
- **Templates 본질**: 선택 도구 (vs 노트=탐색 대상). Board 모드 미지원, list+grid만.
- **NoteTemplate.status/priority/description** = "default 값"이지 카드 정체성 X. 카드 표시 폐기. 타입 필드 제거는 별도 PR.
- **Linear-style chips**: 도메인별 chip (B 옵션) + 하드 캡 3개 (A density). pinned는 always-on (toggle 없음).
- **Folder type-strict**: 노트 폴더 = 노트만 / 위키 폴더 = 위키만. 4사분면 모델 (Folder=type-strict / Sticker=type-free) 명확화.
- **혼합 폴더 자동 분리** (마이그레이션 정책): 데이터 손실 0. `{name}` (note) + `{name} (Wiki)` (wiki) 두 폴더로.
- **Templates folderId**: single 유지 (개수 적어 N:M 가치 낮음, YAGNI).

### 다음 세션 우선순위 (순서)
1. **BUG fix**: 템플릿 더블클릭 시 에러 (시드는 보이나 편집 안 됨) — 사용자 워크플로우 차단 중
2. **PR (folder-b)** — UI 분리 type-strict 시각화: 사이드바 Notes/Wiki 분리, /folder/[id] kind 분기, Folder picker kind 검증, DnD kind 검증
3. **PR (folder-c)** — Multi-folder UX: detail panel 다중 폴더 chips, multi-folder picker, DnD add vs move, group-by-folder 다중 마커
4. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
5. **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장)
6. **Smart Book v2** (AutoSource[5] + Sticker source + Hybrid manual/auto)
7. **Template seed audit** (`PlotTemplate<T>` 추상화)
8. **(마지막) Note UI toolbar** (UpNote-style)
9. **(논의)** House (계보 시각화) — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체. 마지막에 토론.

### 기술 학습
- **시드 템플릿 마이그레이션 정책** (PR d/f): 신규 사용자 only가 안전한 default. 기존 사용자는 별도 idempotent 마이그레이션 (id 충돌 시 skip).
- **Linear chip 패턴 wiring 발견**: 노트/위키 board는 이미 `visibleColumns + isVisible(key)` 가드 있었음. 진짜 문제는 ad-hoc inline span 시각. 디자인 + 누락 properties 추가가 본질.
- **wordCount derived from preview** (`note.preview.split(/\s+/).filter(Boolean).length`) — `notes-table`의 기존 패턴. 별도 store 필드 추가 X.
- **memo comparator 업데이트 의무**: BoardCard 새 prop 추가 시 (note.labelId, note.tags, note.pinned 등) memo 비교에도 추가 안 하면 update 안 됨.
- **Migration v107 혼합 폴더 알고리즘**: 데이터 기반 자동 추론 + 혼합 시 클론 분리 (id `{origId}-wiki`). 7 test cases (5 plan-required + 2 edge) all PASS.
- **N:M view-engine 영향**: `group-by-folder`는 한 노트가 여러 폴더에 속하면 N번 등장. count는 unique 처리 별도 필요 (PR c에서).
- **Templates view-engine 발견**: `useNotesView`는 `Note[]` 전용. Templates는 thin fork (`useTemplatesView`)가 정합. Generic 화는 scope 폭발.

### Plan 문서 보존
- `.omc/plans/template-b-edit-ui-unification.md` (이전 세션)
- `.omc/plans/folder-nm-migration.md` (이번 세션, PR (folder-b/c) 참고)

### Store version 진화 (이번 세션)
v102 → v103 (templates context) → v104 (visibleColumns 단순화) → v105 (description 제거) → v106 (시드 9개 주입) → v107 (Folder kind + N:M)

---

## 🚀 2026-05-03 (오후 후반) — 11 PRs 머지 거대 세션

**범위**: 디자인 결정 → 즉시 구현. 6시간 동안 11 PRs squash-merge to main.

### 머지된 PRs (순서)
- **#237** 옵션 B: 11 commits 묶음 (33 design decisions + Hull 버그 fix + Sticker 사이드바)
- **#238** Sticker v2 Phase 1 — 데이터 모델 (옵션 D2, `Sticker.members[]` cross-everything, v100→v101)
- **#239** Sticker v2 Phase 2 — Library 진입점 + cross-everything detail + cascade cleanup
- **#240** docs — 6 design decisions (Folder type-strict re-confirm + Smart Book + Template policy)
- **#241** notes 인덱스 버그 — virtualItems가 groupBy="none"에서 showAlphaIndex 무시 (1줄 fix)
- **#242** 노트 템플릿 UpNote Phase 1/3 — `{{YYYY}}` 변수 호환 + SelectFromTemplatesModal + Insert 메뉴
- **#243** Group A 색상 통일 — `KNOWLEDGE_INDEX_COLORS` const + wiki status emerald + graph wiki violet 보존
- **#244** Group A 아이콘 통일 — IconWiki→BookOpen alias (13 사이트 자동) + IconWikiStub/Article 활성화
- **#245** Group C PR-A — wiki board 도달 (showViewMode prop) + notes board visibleColumns + boardDefaultGroupBy
- **#246** Template PR a — 메타 슬림화 (icon/color 폐기, v101→v102)
- **#247** Template PR b — 편집 UI 통합 (NoteEditor 재사용 + TemplateDetailPanel 사이드 패널)

### 핵심 결정사항 (재확정 / 신규)
- **Folder type-strict + N:M** (33 §2 재확정, 마이그레이션 미구현 → 큰 PR 예정)
- **Smart Book = AutoSource[]** 5종 (folder/category/tag/label/sticker) — 엑셀 함수 패턴
- **Note template = UpNote opt A only** (메타 슬림 + 사이드 패널, Smart Template = v2 보류)
- **Wiki status 색 분리**: stub=orange, article=emerald, entity=violet (wiki entity ≠ article state)
- **Sticker = cross-everything Library only** 진입점 (33 §8 정정)
- **Plot 정체성 영구 정의**: "Gentle by default, powerful when needed"
- **작업 원칙 영구 정의**: "정확도 + 버그 위험 최소화" (10가지 규칙)

### 다음 세션 우선순위 (순서)
1. **Template PR c** — template-only views (filter/display + view-engine)
2. **Template PR d** — 시드 10-20개 clean slate
3. **Group C PR-D** — Tags/Labels/Stickers/Refs/Files view-engine 통합 (5-8 PRs, 큰 작업)
4. **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
5. **§2 Folder type-strict + N:M 마이그레이션** (큰 PR)
6. **Smart Book v2** (AutoSource + Sticker source + Hybrid manual/auto)
7. **Template seed audit** (`PlotTemplate<T>` 추상화 — 인포박스/배너/카테고리 등 통합)
8. **(마지막) Note UI toolbar** (UpNote-style, minimalist 5-6 buttons, configurable, "Organize..." multi-action)

### 기술 학습
- **IconWiki → BookOpen alias 1줄 수정 = 13 site 자동 적용** (`export { BookOpen as IconWiki }`)
- **DisplayConfig interface 두 곳 중복 정의** (display-panel.tsx + view-configs.tsx) — 향후 통합 검토
- **TemplateEditorAdapter thin fork (140 LOC) vs NoteEditorAdapter (460 LOC)** — Y.Doc/IDB body/hashtag-sync 생략으로 충분
- **architect Opus agent stalled 17분 사례** — 큰 PR (615+/317- 6 files) 검증 시 시간 weight 고려, medium 옵션 검토
- **Store: v100 → v101 (Sticker.members) → v102 (Template icon/color drop)**

### Plan 문서 보존
`.omc/plans/template-b-edit-ui-unification.md` — Template PR b planner 결과물 (다음 PR 참고)

---

## 🚀 2026-05-03 (오전) — 대규모 디자인 토론 + Hull 버그 fix

**범위**: 코드 변경 (Hull 버그 fix 3개) + 33개 디자인 결정 (앞으로 작업 방향)

### 코드 변경 (PR #237에 누적, 9 → 11 커밋)
- 90e18f1: Hull 클릭 안 되는 버그 (pointerEvents)
- 9cec76a: Hull stuck 버그 (renderTick deps)
- b65caa3: Hull 우클릭 sticker 메타 액션 (Rename / Change color / Delete)

### 핵심 디자인 결정 (33개 → 큰 그림)

#### A. 4사분면 모델 정립
```
                Unordered (collection)    Ordered (sequence)
Type-strict     Folder                    (의미 약함)
Type-free       Sticker                   Book ⭐ (신규)
```

#### B. Folder 변경 (큰 PR)
- type-strict (Note 폴더 = 노트만, Wiki 폴더 = 위키만)
- N:M 멤버십 (한 노트 → 여러 폴더)

#### C. Sticker v2 (큰 PR, cross-everything)
- 모든 entity 수용 (Note + Wiki + Tag + Label + Category + File + Reference)
- 정참조 모델 (`Sticker.members[]`)
- Universal Entity Picker UI

#### D. Book entity 신규 (v3급 PR)
- Activity Bar 7번째 (7개 OK)
- cross-entity (Note + Wiki 포괄, 단일 Book entity)
- ordered sequence (chapter 순서가 본질)
- Manual drag-drop default + Auto-sort 액션
- 시각화: Hull + Sequence edge + 별도 Reading view
- Wikilink: `[[Book]]` / `[[Book#Chapter]]`

#### E. Page entity = 폐기 (확정)
- 제텔카스텐 atomic 위배
- Book entity로 needs 충족 (atomic 보존 + sequence)

#### F. Sandbox + Save view 통합 (옵션 B)
- Save view = 보기 + 데이터 staging 함께 영구
- Sandbox = 그래프만 (노트/위키 즉시 영구)
- Wikilink = 본문에서만, Relation = 그래프에서

#### G. Relation 저장 = 본문 embed 자동 추가
- 본문 contentJson에 직접 embed (footer 추가 X)
- 사용자 첫 번째만 prompt + "기억" 옵션
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화

#### H. Sticker 진입점 = Library만 (정정)
- 이전 4 space에서 추가 → Library만으로 변경
- 다른 4 space에서 NavLink 제거 작업 필요

#### I. 사이드 패널 변경
- Detail/Connections/Activity 모두 영향
- 각 큰 PR이 자기 부분 처리 (별도 사이드 패널 PR 없음)

#### J. Linear-style entity navigation (의미 A)
- view 안 노트 간 ↑/↓ 키, 1/N 표시
- 작은 PR로 즉시 가능

#### K. 마크다운 단축키 (Obsidian 90% 수준)
- Phase 1: `---` Enter 패턴 + Highlight + Image embed
- Phase 2: Math + Heading anchor
- Phase 3: Block reference + Definition list (큰 작업)

### 다음 작업 큐 (재정렬, 우선순위 순)

**🟢 작은 polish PR (즉시)**
1. `---` Enter 패턴 + Highlight + Image embed (마크다운 Phase 1)
2. Linear-style entity navigation (↑/↓ 키)
3. Wiki "Blocks" Display Property
4. Stickers Library만 진입점 (4 space에서 NavLink revert)
5. Notes 사이드바 위계 (Notes ▼ Status 그룹)

**🟡 중간 PR**
6. NoteStatus 리네이밍 (PRD 사전 조사 완료)
7. 마크다운 Phase 2 (Math + Heading anchor)
8. Filter chip 3-part 드롭다운
9. Linear 검색창 패턴

**🔴 큰 데이터 모델 PR (의존성 큼)**
10. Folder type-strict + N:M
11. Sticker v2 (cross-everything)
12. Sandbox + Save view 통합
13. Entity-ref WikiBlock 일반화
14. 온톨로지 그래프 노드 확장 (모든 entity)

**🟣 v3급 PR (가장 마지막)**
15. Book entity (cross-entity, ordered sequence)
16. Activity Bar 7개 확장

**🎨 디자인 polish (별도)**
- 컬럼 헤더 아이콘 통일
- Status 아이콘 시리즈 (Linear 빈/반/꽉)
- Updated/Created 아이콘 분기

### Technical Learnings (이번 세션)

#### 1. Hull 클릭 안 됨 — `pointer-events: visiblePainted` 함정
- SVG default `pointer-events="visiblePainted"`는 fillOpacity 0.04~0.10을 "not painted"로 판단
- 클릭 이벤트가 통과해 SVG background로 빠짐
- 해결: `style.pointerEvents = "all"` 명시

#### 2. Hull stuck 버그 — useMemo deps 누락
- `clusterHulls` useMemo deps에 viewport `transform`만 있어서 노드 드래그 시 재계산 안 됨
- `positionsRef`는 ref라 React 추적 X
- 해결: `forceRender`의 카운터 (renderTick) 노출 + deps에 추가

#### 3. 자료구조 본질 — Set vs Sequence
- Sticker = collection (set, 무순서)
- Book = sequence (list, 순서 있음)
- 다른 자료구조 → 다른 entity 정당화

#### 4. 종이책 메타포 함정
- "한 책 = 한 종류 콘텐츠" 종이책 메타포에 갇히면 안 됨
- 디지털 책은 cross-type 자유 (Notion 페이지 패턴)
- Plot의 Sticker도 cross-everything → Book도 같은 패턴

#### 5. 사용자 통찰 = 디자인 시그널
- 사용자가 "Sticker = 글로벌 폴더 같은 것" 통찰 = 의미 분리 약하다는 신호
- 사용자가 "Detail 패널 = 본문 변화 추적/반영" 통찰 = 본문 source of truth 원칙
- 사용자 직관을 무시하지 말 것

#### 6. Page vs Book — 같은 needs, 다른 정체성 정합
- Page = sub-entity (atomic 위배)
- Book = entity 묶음 (atomic 보존)
- 같은 사용자 needs (소설 회차)지만 정체성 측면에서 Book이 정합

---

## 🚀 2026-05-02 (늦은 밤) 세션 — Index 버튼 위치 통일 + viewState.toggles 보존 (옵션 B)

**범위**: Notes/Wiki list view의 Index 토글 위치 통일. Display 패널 토글 + viewState.toggles 보존으로 saved view에 같이 저장.

### 핵심 결정사항
- **Index 위치 = Title 컬럼 헤더 옆 inline (통일)**: 데이터 영역에 인접 → "이 컬럼들을 알파벳 그룹화" 의미 명확. 위키도 동일 위치로 마이그레이션
- **viewState.toggles.showAlphaIndex**: 로컬 useState 폐기, viewState에 보존 → saved view 스냅샷에 자동 포함
- **컬럼 헤더 inline + Display 패널 두 진입점**: 같은 state (synced), Linear 패턴 모방
- **viewStateEquals에 toggles 비교 추가**: dirty 검증 범위 확장. Index 토글 변경 시 ViewHeader Save 버튼 자동 등장 (보존 일관성)
- **ViewHeader extraToolbarButtons는 글로벌 액션만**: Filter/Display/Save view만 — 데이터 액션(Index)은 컬럼으로 강등

### 코드 변경 요약
- `components/notes-table.tsx` — useState → useCallback 래퍼 (viewState.toggles 패치). ViewHeader에서 Index 버튼 제거. COLUMN_DEFS map의 title 컬럼에 `<button>Index</button>` inline. Collapse-all 버튼 등 다른 extraToolbar 항목은 유지
- `components/views/wiki-list.tsx` — `ColumnHeaders` props에 `showAlphaIndex` + `onToggleAlphaIndex` 추가. 별도 toolbar의 Index 버튼 + divider 제거. 두 위치(alphabetical view + 일반 view)의 ColumnHeaders 호출처에 props 전달
- `components/views/wiki-view.tsx` — `showAllArticles` useState 제거 → `wikiViewState.toggles?.showAlphaIndex ?? false`. setShowAllArticles 콜백이 `updateWikiViewState({ toggles: { ..., showAlphaIndex } })` 호출
- `lib/view-engine/saved-view-context.ts` — `viewStateEquals`에 `toggles` map 비교 추가 (Object.keys 비교 + 각 키 값 비교)
- `lib/view-engine/view-configs.tsx` — `NOTES_VIEW_CONFIG.displayConfig.toggles`와 `WIKI_VIEW_CONFIG.displayConfig.toggles`에 `{ key: "showAlphaIndex", label: "Alphabetical index" }` 추가

### Technical Learnings
- **변수 선언 순서 함정**: `wikiViewState`를 사용하는 hook을 그것 정의 위에 놓으면 TS error TS2448 ("used before declaration"). 의존성 그래프 따라 선언 순서 신경 써야
- **toggles 비교 = saved view 보존의 단서**: 기존 viewStateEquals에서 toggles 비교 빠뜨려서 graph 관련 toggles(showWikilinks 등)도 dirty 감지 안 됐음. 통일된 비교로 모든 toggles가 saved view에 의미 있게 보존됨
- **컬럼 헤더 inline 토글 = 데이터 액션 / ViewHeader = 글로벌 액션**: Linear 멘탈모델. Filter는 모든 데이터에 적용 → 글로벌. Index는 그룹화 모드 → 데이터 직접 액션 → 컬럼 인접

---

## 🚀 2026-05-02 (밤) 세션 — Saved Views 스냅샷 UX (Linear 패턴, 옵션 C)

**범위**: PR #237 직후 같은 워크트리에서 진행. 사용자 합의된 옵션 C 구현.

### 핵심 결정사항
- **빈 뷰 생성 → 현재 viewState 캡처로 의미 변경**: 사이드바 + 버튼이 더 이상 빈 default state를 만들지 않음. `createSavedView(name, currentViewState, space)` — 이름 받자마자 현재 활성 context의 viewState 그대로 저장
- **ViewHeader Save 버튼 신규** (Linear 패턴): 변경 감지 시 강조 색상으로 "Save" 등장. 활성 view 없을 땐 "Save view" popover로 이름 입력
- **사이드바 우클릭 메뉴 확장**: Update view (덮어쓰기) / Reset to saved (되돌리기) 2개 추가. 기존 Rename / Delete 유지
- **Dirty 검증 범위**: viewMode/sortField/sortDirection/groupBy/showEmptyGroups + filters[] + visibleColumns[]. toggles는 의도적 제외 (per-context 플래그라 SavedView 모델에 없음)
- **활성 view 자동 활성화**: save-as 모드에서 새 뷰 생성 시 setActiveViewId 호출 → 이후 편집은 dirty 추적
- **5 view 모두 적용**: notes-table, notes-board, wiki-view (list mode), ontology-view, calendar-view. wiki dashboard 모드는 의도적 hidden

### 코드 변경 요약
- **신규 helper**: `lib/view-engine/saved-view-context.ts` — `getCurrentViewContextKey(space, route)`, `getSavedViewSpaceForActivity(space)`, `viewStateEquals(a, b)`
- **신규 hook**: `lib/view-engine/use-save-view-props.ts` — `useSaveViewProps(contextKey, space)` 자동 계산
- **사이드바**: `components/linear-sidebar.tsx` — `handleNewViewSubmit` viewState 캡처로 변경, `handleUpdateView` / `handleResetView` 신규, ContextMenu 항목 4개로 확장
- **ViewHeader**: `components/view-header.tsx` — `saveViewMode` (hidden/save-as/update/clean) + `onSaveView` props 추가, FloppyDisk 아이콘 + Save 버튼 (popover/직접 호출 분기)
- **5 view 호출처**: notes-table, notes-board, wiki-view, ontology-view, calendar-view에 `useSaveViewProps` 호출 + ViewHeader prop 전달

### 다음 작업 후보 (큐)
- **NoteStatus 리네이밍 Phase 1** — `inbox/capture/permanent` → `stone/brick/keystone` + IDB v101 마이그레이션. PRD 사전 조사 완료
- **Filter chip 3-part 드롭다운 Step B** — Field/Operator/Value 모두 popover, Linear 한 술 더 뜸
- **linear-sidebar wiki space 카테고리 트리 표시** — 현재 wiki-category-page에서만 색 dot 보임
- **dead code 정리** — `components/views/wiki-sidebar.tsx`

### Technical Learnings
- **shallow viewState 비교**: filters/visibleColumns는 deep 비교 안 해도 ordering이 stable해서 index-based 비교로 충분 (filter 추가 시 항상 끝에 push)
- **save-as 자동 activate**: createSavedView 후 setActiveViewId — 사용자가 입력 후 즉시 dirty 추적 시작
- **dynamic context (notes)**: notes context는 route에 따라 inbox/capture/permanent/folder/tag/label 변동. helper가 route 분기로 처리
- **ViewHeader save 버튼 클로저 함정**: hydrated 가드 안 두면 Popover 마운트 시점이 server vs client 다름. 기존 Filter/Display 패턴 그대로 따름

---

## 🚀 2026-05-02 (오후) 세션 — docs 정리 + Saved Views 완성 + 카테고리 색 UI + Sticker 사이드바 (사이드바 polish + Sticker 1급 UI 통합 PR)

**범위**: 5개 작업 묶음 PR. PR #236 직후 fresh worktree에서 시작.

### 핵심 결정사항
- **stale docs 5개 archive로 분리**: TODO.md/NEXT-ACTION.md/SESSION-LOG.md (CONTEXT.md/MEMORY.md/worklog와 정보 중복, 매번 갱신 누락 패턴), PHASE-PLAN-wiki-enrichment.md (v75→v83 가정 깨짐), plot-discussion/ 11개 (historical, 일부 결정 뒤집힘). **single source 원칙**: 이제 CONTEXT.md + MEMORY.md만 갱신
- **PHASE-PLAN-wiki-enrichment 분할 재작성 방침**: 한 큰 PRD 대신 필요할 때 작은 단위로 (REDESIGN_INFOBOX_TIER1, REDESIGN_BANNER_NAVBOX, REDESIGN_MACROS)
- **Sticker 1급 UI 완성**: 그래프 우클릭 메뉴에서만 가능했던 sticker 생성/관리를 라벨처럼 사이드바 진입점 + /stickers 페이지로. LabelsView 패턴 1:1 복제 (754줄)
- **Saved Views Wiki/Ontology/Calendar 완성**: 기존 Notes 패턴 복제 — Notes의 viewState 복원 useEffect를 3개 view로 확장, SavedView.space 가드 추가
- **SavedView.viewMode 타입에 graph/dashboard 추가**: ontology saved view viewMode 보존 가능 (잠재 버그 사전 차단)
- **Saved Views 스냅샷 UX 결함 식별**: 현재 사이드바 + 버튼은 빈 default state 뷰만 생성. ViewHeader Save 버튼 부재 → 사용자가 현재 viewState를 스냅샷으로 저장 불가. 다음 PR로 분리 (옵션 C: ViewHeader Save + 사이드바 + 버튼 의미 변경)

### 코드 변경 요약
- **이동**: `docs/TODO.md` → `docs/.archive/`, NEXT-ACTION/SESSION-LOG/PHASE-PLAN-wiki-enrichment 동일, `docs/plot-discussion/` → `docs/.archive/plot-discussion/`
- **신규 docs**: `docs/.archive/README.md` (보관 이유 가이드)
- **타입**: `lib/types.ts:314` SavedView.viewMode union에 `"graph" | "dashboard"` 추가
- **3개 view (saved view 복원)**: `components/views/wiki-view.tsx`, `ontology-view.tsx`, `components/calendar-view.tsx`에 `useActiveViewId` import + savedView 복원 useEffect (~10줄 × 3)
- **카테고리 UI**: `components/views/wiki-category-page.tsx` 121줄 추가 — ContextMenu/ColorPickerGrid/Popover imports, CategoryFullListView에 색 dot + ContextMenu(Rename/Change color/Delete + undo), CategoryEditor에 Color Popover. `lib/store/types.ts` updateWikiCategory color 파라미터 추가
- **Sticker UI (신규)**:
  - `components/views/stickers-view.tsx` 신규 (754줄, LabelsView 복제)
  - `app/(app)/stickers/page.tsx` 신규 shell
  - `app/(app)/layout.tsx` StickersView always-mounted 등록
  - `components/linear-sidebar.tsx` More 섹션에 Stickers NavLink (Sticker Phosphor 아이콘 + count + dragContent)
  - `lib/table-route.ts` VIEW_ROUTES에 `/stickers` 추가

### 다음 작업 후보 (큐)
- **Saved Views 스냅샷 UX 개선 (옵션 C)** — ViewHeader Save 버튼 + 사이드바 + 버튼 의미 변경 (현재 viewState 캡처). 사용자 합의됨, 별도 PR
- **NoteStatus 리네이밍 Phase 1** — `inbox/capture/permanent` → `stone/brick/keystone` + IDB v101 마이그레이션. PRD 사전 조사 완료 (영향 범위 65 파일/353회). NoteTemplate.status, settings-store startView, graph-filter-adapter 인라인 리터럴, 테스트 4개, AGENTS.md까지 포함
- **Filter chip 3-part 드롭다운 Step B** — Field/Operator/Value 모두 popover, Linear 한 술 더 뜸. 사용자 명시 요청
- **카테고리 사이드바 트리** — linear-sidebar의 wiki space에 카테고리 트리 + 색 dot. 이번 PR scope 초과로 deferred
- **dead code 정리** — `components/views/wiki-sidebar.tsx` 어디서도 import 안 됨, 삭제 후보

### Technical Learnings
- **dead code 발견**: `components/views/wiki-sidebar.tsx`는 자기 자신만 정의, 어디서도 import 안 됨. 다음 정리 PR에서 삭제 후보
- **Saved View 적용 범위**: 사이드바 라우팅은 모든 space에서 동작했으나 viewState 복원은 Notes만 동작이었음. useEffect 패턴 복제만으로 해결 (~10줄/view)
- **Saved View 스냅샷 UX 결함**: + 버튼이 `createSavedView(name, undefined, space)` 호출 → 빈 default state 뷰 생성. 사용자가 "내 현재 상태를 저장" 의도로 + 누르면 빈 뷰만 생기는 문제. Linear 패턴 (ViewHeader Save 버튼)이 정답
- **single source docs 원칙**: 정보 중복 = 갱신 누락의 주범. CONTEXT.md/MEMORY.md/worklog가 같은 정보를 다른 형식으로 보존 → 별도 TODO/NEXT-ACTION/SESSION-LOG는 stale의 불가피한 운명
- **LabelsView 1:1 복제 패턴**: Sticker UI 만들 때 LabelsView 구조 그대로 복제 → 일관된 UX 자동 보장. drag-to-select, ColorPickerGrid, ContextMenu, ViewHeader 등 동일

---

## 🚀 2026-05-01 ~ 2026-05-02 세션 — Light Mode + Ontology 대규모 재설계 + Group by Hull + Sticker entity + Dashboard 3분할 (단일 PR 누적)

**범위**: 12개 큰 작업이 한 PR에 누적.

### 핵심 결정 1: "그래프 hull = 사용자 group by"

이전 멘탈모델 분열 ("Notes는 Group by, Ontology는 BFS 자동")을 깨고 통합. **Ontology = Notes/Wiki와 동일 view-engine**의 그래프 시각화 모드일 뿐.

### 핵심 결정 2: Sticker — 새 1급 entity

라벨/카테고리/태그가 의미 충돌 없이 분리되어 있는 상태에서 "임의 묶음" 슬롯이 비어있었음. Sticker가 그걸 채움:

| Entity | 대상 | 의미 |
|---|---|---|
| Label | 노트 only | 색 분류 (Linear 라벨) |
| WikiCategory | 위키 only | 분류 트리 (DAG) |
| Tag | 양쪽 | 주제/맥락 (`#zettelkasten`) |
| **Sticker** | **양쪽** | **임의 묶음 마커** (포스트잇) |

### 핵심 결정 3: 온톨로지 3분할

- **Graph** — 시각화 ("내 지식 구조가 어떻게 생겼지?")
- **Insights** — 행동 유발 ("내가 뭘 해야 하지?")
- **Dashboard** — raw stats, "사브메트릭스" ("내 지식 베이스 디테일이 궁금하다")

Stats(사이드바)는 stats에 충실, 행동 유발은 Insights로 분리.

### 새 데이터 모델 (v98 → v100)
- `WikiCategory.color: string`
- `WikiArticle.folderId?: string | null`
- `Sticker` interface 신규 + Note/WikiArticle.stickerIds (multi)
- 신규 slice: `lib/store/slices/stickers.ts` (CRUD + bulkAddSticker)
- `OntologyNode.tags/folderId/categoryIds/stickerIds` — group by lookup
- `GroupBy` 타입: `tag` / `category` / `connections` / `sticker` 추가
- `ViewMode`에 `dashboard` 추가
- v99: 카테고리 자동 색, v100: stickers: [] 보장

### 새 컴포넌트
- `components/ontology/node-context-menu.tsx` — 우클릭 메뉴 + 인라인 스티커 생성 (Linear quick-add 패턴) + 색 picker (생성 시 + 기존 스티커 변경)
- `components/ontology/ontology-dashboard-panel.tsx` — Volume/Connectivity/Health/Hubs/Tag frequency 섹션 (placeholder 수준, 다음 PR에서 확장)

### Hull 색 = entity 색 (자동 동기화)
| Group by | 색 출처 | 사용자 변경 |
|---|---|---|
| Sticker | `sticker.color` | ✅ 우클릭 메뉴 dot 클릭 (G8) |
| Label | `label.color` | ✅ 라벨 페이지 |
| Tag | `tag.color` | ✅ 태그 페이지 |
| Folder | `folder.color` | ✅ 폴더 시스템 |
| Wiki Category | `category.color` | (사이드바 UI는 다음 PR) |
| Status | NOTE_STATUS_HEX | ❌ 시스템 의미 보존 |
| Connections (legacy) | 알고리즘 기반 | ❌ entity 없음 |

→ Hull 색 변경 = entity 색 변경. 일관성 유지.

### Hull 인터랙티브
- hull = 블록 = 안의 노드들의 그룹 핸들
- `mousedown` → 멤버 multi-select + 첫 멤버 drag 트리거 → 그룹 이동
- `click` → 그룹 선택만
- `contextmenu` → 메뉴 (해당 그룹 전체 대상)

### 다중 선택 + Hull 드래그 (Mac Finder/Linear 패턴)
- **Ctrl/Cmd+click** = 노드 toggle (in/out)
- **Shift+click** = 노드 add (toggle X — 추가만)
- **Shift+drag** = marquee (영역 선택)
- 좌상단 hint: 선택 0개=단축키 안내(Kbd badge), 선택 시=카운트 + ✕

### Hull 드래그 부드럽게 (drag jitter 해소)
이전: 드래그 중 매 tick마다 hull path 재계산 → "꿈틀거림" + 사라졌다 다시 생기는 느낌.
신규: 드래그 시작 시 hull path 모양 freeze + SVG `transform=translate(dx,dy)`로 통째 이동. 멤버 노드들은 기존 group-drag 로직으로 동일 delta 적용. 드래그 종료 시 transform 해제 + 자연스러운 hull 재계산 (멤버 위치가 동일 delta로 이동했으므로 점프 없음).

### 연결 끊기 (시각 필터, 데이터 보존)
- ViewState에 `hiddenEdgeIds` / `hiddenEdgeKinds` / `isolatedNodeIds` 추가
- 우클릭 메뉴 액션: **Hide connections** (선택 노드의 모든 엣지 숨김) / **Isolate** (선택만 풀 opacity, 나머지 dim) / **Show all** (복원)
- 좌상단 amber 인디케이터: "N hidden · M isolated · Show all"
- visibleEdges 계산: filter pass + hiddenEdgeIdSet/hiddenEdgeKindSet 차단 + isolation 모드면 양 endpoint 모두 isolated이어야 통과
- 엣지 직접 우클릭은 다음 PR (path hit-area overlay 필요)
- Display popover edge type 세분화 (showWikilinks/relations/tags 토글)도 다음 PR

### Ontology 사이드바 진입점 재설계 (Wiki/Library 패턴)
이전: More 섹션에 Insights만, Dashboard는 별도 button. Overview 클릭해도 그래프로 안 돌아감.
신규: **Graph / Insights / Dashboard 셋 다 상단 navigation NavLink** (Wiki/Library와 동일 패턴). NavLink에 `onClickOverride` prop 추가 — 라우트는 모두 /ontology이지만 클릭 시 `plot:set-ontology-tab` 이벤트 fire → ontology-view에서 viewMode 전환 (graph layout/positions 보존).

### 범례 라이트모드 가시성
이전: 텍스트 색이 status별 (cyan #22d3ee 등) → 라이트 배경에서 거의 안 보임.
신규: 텍스트는 통일된 `#1e293b` (slate-800) + font-weight 500. Color 정보는 swatch (circle/hexagon)에서만 표시. Linear status badge 패턴.

### Stats 재구조 (Notes/Wiki 큰 카드 + 호버 tooltip)
이전: 작은 row만 (Nodes 9 / Edges 13) — 정보 부족.
신규: **Notes/Wiki 큰 숫자 카드** (grid-2col, font-semibold, 16px). 호버 시 native title로 status breakdown + 노트 제목 미리보기 8개. 행마다 `cursor-help` + 의미 설명. 푸터에 `N edges → Dashboard` 포인터.

### Filter chip 인라인 편집 (Step A — connectedTo direction만)
**3단계 로드맵**:
- Step A (이번 PR): connectedTo chip의 direction Popover 토글 (Both/In/Out)
- Step B (다음 PR): 모든 chip의 value 인라인 편집 (Status/Folder/Label 등)
- Step C (별도 PRD): chip의 Field 자체 swap (Connected → Status로 변경, value reset)

**구현**:
- FilterChipBar에 optional `onUpdateFilter?: (idx, rule) => void` prop
- chip render 시 `field === "connectedTo"` && `onUpdateFilter` 있으면 value를 PopoverTrigger button으로 wrap
- Popover 안: 3가지 옵션 (Both / Backlinks only / Links out only) + 현재 선택 ✓
- notes-table, notes-board에서 wire (next + idx replace)

**왜 Step A부터?**: Connection 필터는 사용자가 자주 방향 바꾸는 use case. 매번 우클릭 → submenu 가는 게 귀찮음. value 토글만 인라인이어도 핵심 가치 충족.

### 폴더 인라인 생성 (3개 진입점)
- **노트 우클릭** Move to folder → "+ New folder…" → window.prompt → 즉시 생성 + 자동 부여
- **위키 row 메뉴** FolderPickerSubmenu → "+ New folder…" 동일 흐름
- **multi-select 플로팅바** Folder popover → "+ New folder…" → bulk apply
- `createFolder` slice가 생성된 ID 반환하도록 변경 (void → string). type signature 동기화. palette 색 7개 cycle.

### Connection 필터 (in-place backlink/links 필터)
**핵심**: Ontology 그래프 가지 않고도 노트/위키 뷰 안에서 "이 노트와 연결된 entity만" 필터링.

**데이터 모델**:
- FilterField에 `connectedTo` 추가
- value 포맷: `<targetId>:<direction>` (direction = both | in | out)
- type ConnectionDirection export

**Filter 로직**:
- Notes (`lib/view-engine/filter.ts`): `note.linksOut` (this→target) + `extras.backlinksMap.get(targetId)` (target→this)로 양방향 처리. 자기 자신 제외
- Wiki (`lib/view-engine/wiki-list-pipeline.ts`): wiki linksOut가 titles라 `allArticles` extras 추가, title + aliases 매칭으로 양방향 체크

**UI**:
- 노트 우클릭 메뉴 → ContextMenuSub "Show connected" (Both / Backlinks only / Links out only)
- 위키 row 메뉴 → ShowConnectedSubmenu (FolderPickerSubmenu와 동일 인라인 expand-to-list 패턴)
- Filter chip 표시: `Connected · "노트 제목" (↔ both)`. formatFilterChip에 connectedTo 처리 추가
- 적용 시 토스트로 확인 알림

**3방향 토글 분리**:
- Both: 양방향 (default, 가장 직관)
- In (Backlinks): 이 노트를 참조하는 다른 entity만
- Out (Links out): 이 노트가 참조하는 다른 entity만

**Out of scope (다음 PR)**:
- 사이드 패널 Connections 탭 강화 (sortable + clickable list)
- Filter popover에 Connection 카테고리 (노트 picker로 직접 선택 — 우클릭 진입으로 충분히 커버됨)

### 다크모드 엣지 색 강화
EDGE_STYLE.alpha 값이 다크가 라이트보다 *낮게* 설정돼 있어 다크 모드 그래프에서 엣지가 거의 안 보였음. 수정:
- alphaRelation: dark 0.12 → 0.38 (light 0.30 유지)
- alphaWikilink: dark 0.08 → 0.30 (light 0.22 유지)
- alphaTag: dark 0.06 → 0.22 (light 0.16 유지)
다크 모드 가시성 ~3× 개선.

### 사이드바 Insights/Dashboard 아이콘 분리
이전: 둘 다 `IconInsight` (sparkle) — 시각적 구별 불가.
신규: Insights = `IconInsight` 유지 / Dashboard = `ChartBar` (이미 import되어 있던 컴포넌트).

### 폴더 = 글로벌 컨테이너 (노트+위키 공유)
**핵심 결정**: v99에서 이미 노트+위키 둘 다 folderId 가질 수 있게 데이터 모델 확장됐으나 UI는 노트만 표시. 이번에 UI까지 통합 완성.

**이름 결정 — Folder 유지**:
- Notion에는 "폴더" 자체가 없고 (Page hierarchy), Notion이 "Space"를 다른 의미로 사용 (Teamspace)
- 진짜 폴더 메타포 사용 앱: Apple Notes / Obsidian / Logseq / Evernote(Notebook)
- 친숙도 ★★★★★ + 노트앱 세계에서 폴더는 자연스러운 컨테이너
- 이름 변경 없이 의미만 확장 (학습 비용 0)

**구현**:
- 노트 row 우클릭 → "Move to folder" 서브메뉴 (Radix ContextMenuSub)
- 노트 플로팅바 → Folder popover 버튼 (bulk batchUpdateNotes)
- 위키 row 메뉴 → FolderPickerSubmenu 컴포넌트 (인라인 expand-to-list)
- 폴더 detail 페이지 `/folder/[id]` 완전 재작성 — 두 섹션 (Wiki / Notes) + "+ Add" 드롭다운
- 사이드바 폴더 카운트 = noteCount + wikiCount 합산
- layout.tsx 라우팅 fix — pathname `/folder/` 등은 isFallback 강제 (children 표시)
- createWikiArticle에 folderId? 필드 추가
- 위키 detail panel folder 셀렉터는 다음 PR

**Out of scope (다음 PR)**:
- 위키 detail panel에 폴더 셀렉터 (UI 영역 큼)
- 노트 detail panel folder display 정리
- 폴더 안에서 노트/위키 sort + group by

### 가시성 fix
- 위키 hex `#8b5cf6` → `#7c3aed` (더 진한 violet)
- light fillOpacity wiki 0.33 → 0.55, strokeWidth 2.0 → 2.4
- HULL light/dark 분기 (light fillOpacity 0.04 → 0.10, strokeOpacity 0.12 → 0.32)
- 범례 theme-aware (light = 흰 배경 + slate 텍스트)

### Phase 7 버그 fix
- `showViewMode` prop 누락 → ontology-view에서 Graph/Insights 토글 안 보였음. 1줄 수정.

### Stats 재설계 (Health → Stats)
- Density 삭제 (추상)
- Top hub: 숫자 → 노트 제목 표시
- 행동 유발 메트릭(Orphans/Untagged/Wiki coverage/Most linked)은 위, 단순 카운트(N nodes · N edges)는 푸터

### Display popover 정리
- Ontology View Mode 섹션 제거 (Graph/Insights/Dashboard는 사이드바 진입)

### Out of scope (다음 PR)
- 사이드바 Stickers 섹션 + /stickers 페이지 관리 UI
- 카테고리 사이드바 색 dot + Change color
- 위키 폴더 입력 UI
- Dashboard 추가 섹션 (time series, distribution, cluster analysis)
- 모바일 long press + 하단 액션바
- Phase 8 (계층 시각화), Phase 5 (Layout Switcher)

---

## 🚀 2026-04-30 야간 ~ 2026-05-01 새벽 세션 — Linear-style 필터/디자인 종합 개편 + 라이트모드 가시성 일괄 강화 + Ontology 그래프 통합 (PR #229~#232 4건 머지)

**범위**: 디자인/UX 종합 정비. Linear 필터 칩 패턴 + 필터 mismatch 수정 + Notes Index + 라이트모드 가시성 일괄 강화 + Ontology 그래프 WikiArticle 통합

### 완료 PR (4건)

**PR #229** — Notes/Wiki Parent·Children 컬럼 + Hierarchy 4분류 + StatusBadge border
- 이전 elated-cerf worktree의 작업 정리 commit + push + squash merge
- Notes 테이블 + Wiki 리스트에 Parent / Children 컬럼 (Display Properties 토글)
- Wiki Hierarchy 필터 4분류 (Root/Parent/Child/Solo, classifyWikiArticleRole 일관)
- StatusBadge border 추가 (다크/라이트 양쪽 가시성↑)
- 신규 ParentIcon / ChildrenIcon

**PR #230** — Linear-style 필터/디자인 종합 개편 (22 files, +425/-178)
- **필터 칩 4-part Linear 패턴**: `icon + field | op | value | ×`. `formatFilterChip` 헬퍼로 모든 case 분해
- **Order by chip 3-part**: `key | value+direction | ×`, 톤다운, py-2 균형
- **필터 시스템 mismatch 2건 수정**:
  - Pinned: view-configs `yes/no` ↔ filter.ts `true/false` → key 변경 + legacy backward compat
  - Content: `hasImage`/`hasCode`/`hasTable` 미구현 → 정규식 구현 추가
- **라벨 테두리 강화** (1.5px borderWidth + color-mix 55%) — 4곳 일관 (note-fields/notes-table/calendar-view/editor-breadcrumb)
- **Notes Index 토글** (Wiki 패턴 이식) — `groupByInitial` 기반 alphabetical view
- **Children hover tooltip** — Radix Tooltip로 자식 노트 이름 표시
- **wikiCategories 중복 제거** — 17 → 10개 (v95 → v96 마이그레이션)
- **Wiki 아이콘 통일** (BookOpen, 활동바와 일치)
- **체크박스 색상 통일** (`text-accent-foreground`)
- **드롭다운 가시성 강화** (QUICK FILTERS accent, 검색창 border, desc full opacity)
- Detail/Connections/Activity/Bookmarks 사이드 패널 라이트모드 가시성

**PR #231** — 라이트모드 가시성 일괄 강화 (78 files)
- 시스템적 sed 정비: `text-muted-foreground/20~50 → /50~70`
  - /20, /25 → /50
  - /30 → /60
  - /40, /50 → /70
- Library Needs Attention banner 강화 (border-2 amber-600/60, 텍스트 amber-600/400 font-medium)
- Wiki article "Updated 5d ago" + Aliases — `text-muted-foreground` full

**PR #232** — Ontology 그래프 라이트모드 + Wiki Article 노드 통합 + Labels/Library/Calendar (6 files)
- **Ontology 그래프 라이트모드 텍스트** — 노드 라벨 fill 하드코딩 흰색 → `var(--foreground)`. 엣지 라벨도 `var(--muted-foreground)`
- **WikiArticle 그래프 노드 통합** (사용자 지적: legacy isWiki 모델 deprecated):
  - `wiki:{id}` prefix 노드
  - parent-child hierarchy edges
  - article → note (note-ref blocks) edges
- Library Needs Attention border-2 amber-600/60
- Notes Labels 페이지: 컬럼 헤더 + 체크박스 (Notes 테이블과 통일)
- Calendar 요일 헤더 `text-foreground`

### 큰 결정 (영구)
- **필터 칩 4-part Linear 패턴 채택** (옵션 A) — `icon + field | op | value | ×` 모든 케이스
- **Quicklinks 위치**: Home prominent + 각 영역 사이드바 하단 collapsed (영역별 persist)
- **Quickfilters/Views 통합**: 시스템 quickFilter (🔒) + 사용자 SavedView (⭐) 한 섹션. 필터 드롭다운에서 Quick Filters 제거
- **사이드바 Inline Edit Mode**: 8px slide-right + DotsSix 핸들 + 👁 hide/show. 영역별 customization persist
- **WikiArticle은 그래프 노드로 통합** — legacy `isWiki` (Note에 wiki 분류) 모델 deprecated
- **체크박스 단일 패턴** — `bg-card border-zinc-400` + `bg-accent + PhCheck text-accent-foreground`. 모든 곳 통일

### 다음 즉시 액션 (우선순위 순)

**🔥 최우선 (디자인/가시성)**
1. **Library References/Tags/Files 페이지** 가시성 + 디자인 통일 (All Notes 수준)
2. **Library Filter/Display 디자인** (All Notes 수준)

**중간 (UX 신기능)**
3. **Quicklinks 구현** — globalBookmarks anchorType 확장 (folder/savedView/category 추가) + 사이드바 섹션 + Home prominent
4. **Quickfilters 통합** — view-configs.quickFilters → SavedView로 자동 시드 + `builtin: boolean` 필드
5. **사이드바 Inline Edit Mode** — DotsSix 핸들 + 드래그 + 👁 hide/show + sidebarCustomization persist (영역별)

**후순위 (Insights 정리 — 합의됨, 옵션 D)**
6. **GraphInsightsView → OntologyInsightsPanel 흡수** (graph stats 추가). 사이드바 More의 `/graph-insights` 제거
7. **InsightsView 이름 "Notes Health"** (Notes 영역 그대로 유지 — 처방 컨텍스트 보전)
8. **결정 근거**: "Single Source" 원칙은 **metrics에만** 적용. 개별 처방(Notes Issues)은 Notes 영역 유지가 컨텍스트 단절 없음

### Watch Out
- Tailwind `border-[1.5px]`은 v4에서 미적용 → `style={{ borderWidth: "1.5px" }}` 직접
- Store v96 (wikiCategories dedup). 다음은 v97 후보
- 라이트모드 새 코드 작성 시 `text-muted-foreground/30~50` 사용 자제 — `/60+` 또는 `var(--muted-foreground)` 직접

---

## 🚀 2026-04-30 오후 세션 — Sprint 1.4 완료 (4 PR 통합) + Wiki Hierarchy filter fix follow-up

**범위**: Sprint 1.4 4 PR 묶음 작업을 단일 commit으로 통합. Parent 위계 활성화 + Wiki 컬럼/차트/보드 뷰

### 완료 (Sprint 1.4 4 PR — 통합 단일 commit, ~40 파일)

**PR 1 (D) — Parent 위계 활성화 (노트 + 위키)**:
- 인프라: `lib/note-hierarchy.ts` 신규 (wiki-hierarchy 1:1 미러), `setNoteParent` action, view-engine extras에 allNotes/filterAwareRole/categoryNames
- UI: 사이드 패널 **Connections > Hierarchy 섹션** 신설 (Detail에서 Parent/Children 이동), Set parent picker, Children + Add child (multi-select picker, lazy mount), 노트 에디터 breadcrumb Parent crumb (1/2/3+ collapse), 노트 본문 footer 폐기 (NoteChildrenFooter 삭제)
- view-engine: Family / Parent / Role grouping (4 카테고리 Root/Parent/Child/Solo), Filter-aware role 토글
- Picker: NotePickerDialog/WikiPickerDialog multi-select 모드, queueMicrotask 순서, lazy mount
- UX 폴리시: CommandItem hover bg-accent → bg-hover-bg, DialogTitle/Description을 DialogContent 안으로, hover preview delay 300→500ms (Notion/Gmail 표준)

**PR 2 (B) — Wiki 컬럼 정비**:
- `WikiArticle.reads?: number` 필드 + **store v95 마이그레이션** (reads: 0 백필)
- `incrementWikiArticleReads` action + `openArticle` 시 호출
- view-engine SortField status (isWikiStub) / reads, WIKI_VIEW_CONFIG orderingOptions/properties 확장
- WikiList ColumnHeaders + ArticleTableRow에 status/reads/createdAt 컬럼

**PR 3 (C) — Wiki 차트 개선**:
- TimeSeriesPoint 5 필드 추가 (totalArticles/totalStubs/newArticles/newStubs/totalWikiEdges)
- timeseries.ts Article/Stub 분리 누적 + totalWikiEdges (wiki article 간 backlinks)
- WikiGrowthChart 리팩터 (bucketSize/dataFilter prop)
- WikiConnectivityChart 신규 (totalWikiEdges AreaChart, ResizeObserver)
- WikiInsightsChart 신규 wrapper ([Growth | Connectivity] + [Day Week Month] + Sub-tabs with count)

**PR 4 (A) — Wiki 보드 뷰**:
- WIKI_VIEW_CONFIG.supportedModes에 "board" 추가 → toggle 자동 노출
- `components/views/wiki-board.tsx` 신규 (~430 lines, Linear-style compact)
- **Multi-membership**: card key = `${articleId}::${groupKey}`, 같은 article 여러 컬럼에 unique 렌더
- Drag 분기: Category=multi-set add/remove, Parent=setWikiArticleParent, tier/linkCount/role/family/none=비활성
- 카드: 제목 + Status badge + Backlinks + Reads + Categories chip (label groupBy 시 자동 숨김)
- categoryNames extras로 raw id 누수 fix

### 큰 결정 (영구)
- **노트 parent 활성화** — 사용자 자유 트리 구조 ("유저의 마음대로"). 직전 cleanup 결정 번복
- **Hierarchy 섹션 = Connections 탭** — Detail은 메타데이터, Connections는 관계
- **본문 하단 footer 폐기** — 사이드 패널 Hierarchy가 단일 출처
- **Multi-membership 채택** (Category) — Plot 정체성
- **4 카테고리 모델** Root/Parent/Child/Solo (mutually exclusive). 코드는 일반 트리 정의 (parent X = root) 유지. UI 분류는 4 카테고리
- **Filter-aware role 디폴트 OFF** — 본질이 디폴트
- **Hover preview delay 500ms** Notion/Gmail 표준
- **위키피디아 + 나무위키 하이브리드** — 카테고리 DAG + Article 위계 single-parent tree
- **"Solo" 명칭 채택** — Orphan과 충돌 회피

### 다음 즉시 액션 (다음 세션)
1. **Wiki Hierarchy filter 4 카테고리 fix** (S, ~10분) — `_root`가 Solo 포함하는 이슈
2. **Sprint 1.5**: Outlinks 컬럼 + 위계 컬럼 (Children/Parent)
3. **follow-up**: 모든 picker lazy mount, Wiki List multi-membership 일관, Wiki 본문 footer 신규, v96 sortField 제거 단독

### Watch Out
- "Can't perform a React state update" warning = StrictMode dev only, prod 영향 없음
- Store v95 (reads). v96은 sortField/sortDirection 제거 단독
- "tier" 명칭 절대 사용 X — Stub/Article은 항상 "Status"

---

## 🚀 2026-04-30 오전 세션 — Sprint 1.3 완료 (디자인 polish + 사이드 패널 동기화 + Display Properties 동적 컬럼) + Sprint 1.4 plan 합의

**범위**: Sprint 1 후속 — 디자인 polish + 사이드 패널 + Display Properties + Wiki Article Detail typeof guard + 출시 빌드 fix

### Sprint 1.3 완료 (PR #228)

#### 12 파일 변경

**1. 아이콘 일관성 (3곳 통일 원칙)**

원칙 코드화: **공간 Overview 아이콘 = Activity Bar 아이콘 = ViewHeader 아이콘**

| 항목 | Before | After |
|------|--------|-------|
| Activity Bar Wiki | `BookOpen weight="light"` (흐림) | `BookOpen weight="regular"` |
| Activity Bar Library | `Books weight="light"` (흐림) | `Books weight="regular"` |
| Sidebar Wiki Overview | `IconWiki` | `BookOpen weight="regular"` (Activity Bar와 일치) |
| Sidebar Library Overview | `SquaresFour weight="light"` (뜬금없음) | `Books weight="regular"` |
| Sidebar References | `Books weight="light"` (Library와 충돌) | `Quotes weight="regular"` (인용 메타포) |
| ViewHeader Wiki | `IconWiki size={20}` (Activity Bar와 다름) | `BookOpen size={20} weight="regular"` |
| ViewHeader Library Overview | `SquaresFour weight="duotone"` | `Books weight="regular"` |
| ViewHeader References | `Books weight="duotone"` | `Quotes weight="regular"` |
| Library Empty State (refs) | `Books weight="duotone"` | `Quotes weight="regular"` |
| KB 카드 (Notes/Wiki/Tags/Refs/Files) | bgColor 박스만 (텍스트 0~+) | 실제 5 아이콘 채움 |
| Home INBOX section | `Tray` (사이드바와 다름) | `IconInbox` (사이드바와 일치) |

**2. Wiki Dashboard polish**
- `wikiViewMode === "dashboard"`일 때 Display + DetailPanel 토글 둘 다 숨김 (mode 분기)
- Wrapper에 `bg-secondary/20` (페이지 배경 톤) — 카드(bg-card)와 분리감 강화
- 카드들에 `shadow-sm` rest state 추가 (라이트모드 contrast)

**3. 라이트모드 Wiki List contrast**
- 컬럼 헤더: `text-2xs muted/70` → `text-note text-foreground/80` → 최종 `text-muted-foreground` (Notes 패턴 일치) + `bg-secondary/30`
- 체크박스: `border-border` → `border-zinc-400 dark:border-zinc-600 shadow-sm` (Notes row 체크박스와 일치)
- Sub-tabs (Overview/All/Articles/Stubs/Index): 비-active `/50`, `/60` → `text-muted-foreground` (full opacity, contrast 유지하며 흐림 해소)

**4. Quick Capture placeholder cycle**
- 정적 "What's on your mind?" → 5문구 cycle (3s 간격, 입력 시 정지)
- "Capture a thought…" / "Meeting notes…" / "A quotation…" / "An idea…" / "Something learned…"
- Linear 검색바 패턴

**5. 사이드 패널 동기화 (3건)**
- Wiki List 단일 select → sidePanelContext mirror (`selectedArticleIds.size === 1`)
- Notes List 단일 select → 동일 패턴 (`selectedIds.size === 1`)
- Space 전환 시 sidePanelContext null clear (Activity Bar `handleSpaceClick`) — wiki article context가 Notes로 안 따라감

**6. Wiki Article Detail Panel runtime fix**
- `article.layout.charAt is not a function` 에러 fix
- 옛 store 데이터의 layout이 `{type, columns}` object (Book Pivot 흔적)인 케이스
- `typeof article.layout === "string"` guard 2곳 추가 (line 147, 355)

**7. Wiki List Display Properties 동적 컬럼 ★ 핵심 fix**
- **사용자 직접 발견**: "Categories/Aliases 토글했는데 컬럼에 안 나옴 — 버그 아님?"
- 원인: WikiList가 hardcoded 4 컬럼 (Title/Backlinks/체크박스/Updated). visibleColumns 토글 무시
- Fix: `WikiListProps`에 `visibleColumns?: string[]` + `wikiCategories?: WikiCategory[]` 추가
- ColumnHeaders + ArticleTableRow conditional render
- Categories chip + count 패턴: 첫 chip (accent) + `+N` (Linear 식 컴팩트)
- Aliases도 동일 패턴
- hover 시 native `title` attr로 전체 표시
- `—` JSX text node escape 버그 → `{"—"}` expression으로 fix

**8. 빌드 fix (pre-existing)**
- `home-view.tsx:41 n.backlinks?.length` (Note type에 없음) — `useBacklinksIndex` hook 사용으로 정확히 fix
- 출시 빌드 통과로 NEXT-ACTION.md 알려진 이슈 1건 해소

#### 사용자 명시 결정 (Sprint 1.3 도중)

- **(b1) worktree 정리**: `naughty-khorana-7b0358` worktree 제거 (force, file lock으로 디렉토리 일부 잔존하지만 git에서 unregister) → 현재 worktree(`upbeat-kare-f30bd8`)에서 그 브랜치 체크아웃하여 작업 통합
- **위키 아이콘 다른 거로 교체 X** — BookOpen 유지하되 weight만 강화
- **카테고리 chip + count** — list view 컴팩트 우선, 전체는 Detail 패널에서 (시각적 hierarchy)

#### 학습

- **사용자 직접 버그 발견 → 즉각 fix가 정답** (Display Properties 동적 컬럼)
- **들여쓰기 차이로 replace_all 누락**: line 944 `<IconWiki size={20} />` 들여쓰기 8 spaces, 다른 두 곳은 10 spaces. replace_all이 들여쓰기까지 매칭하니 누락. 수동 직접 변경 필요했음
- **JSX text node에 em dash 직접 입력**: Edit 도구가 `—` literal string으로 저장해 버그. `{"—"}` expression이 안전
- **`article.layout` object 잔존 데이터**: Book Pivot 흔적. typeof guard로 빠른 fix, 마이그레이션은 별도 PR로
- **Plot 영구 규칙 재검토 가능**: "Wiki Gallery만 신중 검토"였던 영구 규칙, 사용자가 보드 뷰 필요하다 판단해서 재검토. group by 명확하면 검토 OK
- **Hub Tier 자동 분류 → 폐기**: "사용자 통제 없는 자동 분류는 혼선" — 좋은 비판
- **dev server preview 포트**: 처음 13497, 이후 reused: true로 3002 (실제 우리 server). 사용자 화면 = 우리 코드 반영

### Sprint 1.4 plan 합의 (2026-04-30 다음 세션, "tier" 충돌 발견 + Parent 위계 활성화 추가 후 수정 — 2주 묶음)

**A. Wiki 보드 뷰**
- `WIKI_VIEW_CONFIG.supportedModes`에 "board" 추가
- View mode toggle (List ↔ Board)
- `WikiBoard` 컴포넌트 (Notes 보드 패턴 재활용)
- **Group by 4종** (Multi-membership: article이 `categoryIds[]` 길이만큼 N번 표시 — Plot "지식 관계망" 정체성 부합):
  - default: **Category** (가변, 카테고리 이름 자체)
  - **Category Tier** ★ 신규 (1st/2nd/3rd+ depth, `WikiCategory.parentIds` 트리 깊이)
  - **Status** (Stub/Article 2-column, `isWikiStub` 기반). 옛 "Tier" 명칭 폐기 — "tier"는 코드베이스에 4가지 의미로 이미 사용 (CategoryDepth / ArticleParentDepth / wikiTierFilter / Infobox PR Tier)
  - **Parent Article** (`parentArticleId` 위계, `lib/wiki-hierarchy.ts` 인프라 재활용 — PR #218 "Tier 4c 위키 parent-child article")
- 카드: 제목 + **Status badge** (Stub/Article) + Backlinks + Updated + 옵션 Categories chip
- 카드 drag → 그룹 변경 (Category / Status / Parent)

**B. Wiki 컬럼 정비** (List + Board 카드 공유)
- **Status** 컬럼/badge (Stub/Article 자동, `isWikiStub` 기반) ★ 새 — "Tier" 명칭 폐기
- Reads 컬럼 ★ 새 — `WikiArticle.reads: number` 필드 + store 마이그레이션 **v96** (v95 = sortField deprecated 제거 단독, 분리) + `openWikiArticle` reads++ 로직. SortField `"reads"`는 [lib/view-engine/types.ts:35](lib/view-engine/types.ts:35)에 이미 정의됨
- Created 컬럼 ★ 새

**D. Parent 위계 활성화** (Note + Wiki 양쪽) ★ 신규 — A의 Group by Parent Article 의존성으로 같은 sprint
- **D1. Parent picker UI** (사이드 패널 Detail): 위키 (set 추가) + 노트 (set 신규). WikiPickerDialog / NotePickerDialog 재활용. 사이클 가드 `lib/note-hierarchy.ts` 신규 (wiki-hierarchy 패턴)
- **D2. 노트 breadcrumb + Children 섹션** (위키 이미 있음): 에디터 상단 + 본문 하단
- **D3. List 뷰 Family 그룹핑 옵션** (Notes + Wiki): view-engine `applyGrouping` family case. 같은 루트 조상 묶고 depth 들여쓰기. **List 5종 / Board 4종** 차이
- 데이터 변경 없음 (Note `parentNoteId` + WikiArticle `parentArticleId` 둘 다 single-parent tree, 이미 정의됨)

**C. Wiki 차트 개선**
- Growth 차트 Article/Stub 분리 (stacked bar + multi-line)
- 차트 sub-tabs (`All` / `Articles` / `Stubs`) — Wiki List sub-tabs와 동일 디자인
- **Knowledge Connectivity 차트 추가** ★
  - 차트 종류 토글 (`Growth` / `Connectivity`)
  - 시간별 wiki article 간 backlinks 합 시각화
  - `cumEdges` 인프라 재활용 (timeseries.ts 이미 부분 계산 중)

UI 계층:
```
[Growth | Connectivity]                    ← 차트 종류 (상위)
                       [Day Week Month]    ← 시간 단위
[All] [Articles] [Stubs]                   ← 데이터 필터 (Growth만)
```

### Sprint 1.5 plan

- **Outlinks 컬럼** (Notes + Wiki 일관 적용) — 데이터는 이미 존재, UI만 추가

### 폐기 (영구)

- Hub Tier 자동 분류 (사용자 통제 부재로 혼선)
- Folder 컬럼 (Wiki) — Categories가 그 역할
- Words 컬럼 (Wiki) — 길이로 분류 안 함

---

## 🚀 2026-04-29 (오후 후반) 세션 — **출시 준비 우선 결정. Sync는 v2.0**

**같은 세션 내 재고 — (a) → (c) 변경**:

Sync 6개 결정 + PRD 작성 후 사용자 재고: "꼭 페이즈 1부터 해야 되나? 우선은 앱부터 다듬고 출시 계획을 제대로 진행하고 싶은데?"

→ 결정 #3 **(a) Sync 포함 출시 → (c) Free 출시 후 v2.0에 Sync** (6개월~1년 후)

**이유**:
- Sync = 3~4개월 작업, 그 동안 사용자 facing 개선 멈춤 위험
- 앱 폴리시 빚 있는 채로 인프라 쌓는 건 위험
- 출시 후 실제 사용자 피드백 반영해서 sync 설계 보강 가능
- 1인 개발 부담 분산

### 출시 4-Sprint 계획 수립

**타임라인**: 자유 (끝날 때까지) — 품질 우선
**플랫폼**: 데스크톱 우선 → 회원 수 충분해지면 모바일
**모바일 전략**: PWA + TWA (Bubblewrap → Google Play Store)

**Sprint 1 (~2주): 빠른 wins**
- P1 Notes 3개 (Sub-group + Multi-sort + 날짜 상대값) 한 PR
- 필터/디스플레이 드롭다운 정리 (액티비티별 일관성)

**Sprint 2 (~3주): 핵심 폴리시**
- 노트 템플릿 시드 10~20개 (onboarding 강화)
- 온톨로지 메트릭 설명 툴팁
- 캘린더 현황 점검 + 부족분
- Views 업그레이드 (실용적으로)
- Insights 업그레이드 (실용적으로)

**Sprint 3 (~2주): 데스크톱 출시 자산**
- 도메인 결정 + 구매
- 마케팅 사이트 (별도 워크트리)
- Privacy Policy + Terms (sync 없는 버전, 한국 + GDPR)
- 데스크톱 웹 배포

**🎯 데스크톱 Free 출시**

**Sprint 4 (회원 수 충분해진 후): 모바일 추가**
- 모바일 반응형 감사
- PWA manifest + Service Worker
- Bubblewrap TWA 빌드
- Google Play Store

**Sync v2.0 (출시 후 6개월~1년)**
- SYNC-PRD.md 활성화 (PRD 보존됨)
- 사용자 피드백 반영해서 보강

### 학습

- **(a) → (c) 재고가 좋은 예** — 결정 후에도 "정말 지금 시작?" 자기 검증
- **PRD 보존이 좋은 결정** — v2.0 시점에 다시 활성화 가능, 작업 낭비 X
- **출시 → 피드백 → sync 설계 보강** = 더 나은 sync 결과 기대

---

## 🚀 2026-04-29 (오후) 세션 — **다중 기기 sync 6개 결정 LOCKED + PRD 작성**

**큰 방향 전환 확정**: Plot에 다중 기기 sync 도입 + 수익 모델. 영구 규칙 "큰 방향 전환 전 전체 설계 확정"에 따라 6개 결정 받고 PRD까지 작성한 후 Phase 진행.

### 6개 결정 (LOCKED)

| # | 항목 | 결정 | 비고 |
|---|------|------|------|
| 1 | Sync 옵션 | **B. Supabase + E2E 암호화** | 균형 (프라이버시 + 일정 + 비용) |
| 2 | 가격 | **Free / Sync $5 / Pro $10** | Obsidian 동일 |
| 3 | 출시 시점 | **(a) Sync 포함 출시** | 첫인상 sync 가치 어필 |
| 4 | CRDT/Y.Doc | **노트+메타 모두 Yjs** | 충돌 안전 최대화 |
| 5 | 결제 | **결정 보류** (Phase 4 시점) | Lemon Squeezy 잠정 |
| 6 | 인증 | **Magic link + Google + Kakao** | SMS 영구 폐기 |

### 결정 흐름

1. 사용자 의향 (이전 세션 끝): "다중 기기 sync 필요해. 옵시디언도 이걸로 유료 구독료 받잖아."
2. /before-work 실행 → SYNC-DESIGN-DECISIONS.md (이전 세션 작성한 옵션 비교) 가이드 받음
3. 사용자에게 6개 결정 받음 (옵션 / 가격 / 출시 시점 / CRDT / 결제 / 인증)
4. 옵션 1번 (Sync 옵션)에서 사용자가 비용 비교 요청 → A vs B 상세 비용 분석 제시 → B 선택
5. 인증에서 한국 OAuth (카카오, SMS) 질문 → SMS 영구 폐기 + Kakao 추가 결정
6. 6개 결정 → PRD 작성 (10 섹션, 11~15주 = 3~4개월 phase 분할)

### 산출물

- **`docs/SYNC-PRD.md`** (신규, 10 섹션):
  - Goals + Non-Goals
  - User Stories (Free / Sync / Pro)
  - Technical Architecture (Stack, 데이터 모델, E2E 흐름, Sync 프로토콜, 결제 흐름)
  - Phase 분할 (Phase 1: 인증+백업 3~4주 / Phase 2: 양방향 sync+Yjs 4~5주 / Phase 3: 다중기기+Pro 2~3주 / Phase 4: 결제+출시 2~3주)
  - Risks & Mitigations (9개 위험)
  - Open Questions (Phase 진입 전 결정 항목)
  - Success Metrics (출시 6개월 후 목표: 500+ 사용자, 3% 전환율, $75+ MRR)

- **`docs/SYNC-DESIGN-DECISIONS.md`** (갱신): 6개 결정 LOCKED 표 + 위험 재정리
- **`docs/NEXT-ACTION.md`** (갱신): Phase 1 Week-by-Week 작업 가이드 + 사전 작업 체크리스트
- **`docs/CONTEXT.md`** (갱신): 최상단에 sync 결정 + Phase 분할 추가
- **`docs/TODO.md`** (갱신): "큰 방향 sync" 섹션을 LOCKED + Phase 1 작업으로 변경

### Y.Doc 폐기 결정 (2026-04-27) 뒤집음

이전 "Wiki Y.Doc 폐기"는 **단일 사용자 + 단일 IDB** 전제. 다중 기기 sync 도입 시 CRDT(Yjs)가 충돌 해결의 표준이라 재활용 결정. 노트 본문 + 메타 모두 Yjs.

### 영구 규칙 추가 (sync 관련)

- 단일 사용자 도구 유지 — 협업 모드 안 만듦. 다중 기기만 sync.
- E2E 암호화 절대 양보 X — 사용자 노트 내용은 서버가 못 봄.
- 오프라인 우선 — sync는 옵션, 인터넷 없을 때도 동작.
- 마스터 비번 분실 = 데이터 복구 불가 — Recovery Phrase 강제 표시.

### 다음 세션 즉시 시작 (Phase 1)

1. Supabase 계정 + 프로젝트 3개 (dev/staging/prod)
2. Lemon Squeezy + Kakao Developers + Google Cloud Console 사전 준비
3. `@supabase/supabase-js` 설치 + `lib/supabase/` 신규
4. Magic link 인증 UI

---

## 🟢 2026-04-29 (오전) 세션 — v0 협업 흡수 + UI polish + dead code 정리 + P0 필터 + Row density 시도/revert (5 PR)

5개 PR 머지. 이 세션 주제는 "외부 디자인 도구(v0)와 협업 흡수 + 5 앱 필터 리서치 기반 P0 강화 + 영구 규칙(시각적 다양성 ≠ Plot 코어) 재확인".

### PR #220 (23fe1be): v0 작업 흡수
v0 cloud에서 작업한 라이트모드 contrast + Home View 리디자인 12개 파일 흡수. v0 환경 wrapper(`next.config.mjs` — `*.vusercontent.net` 도메인 / turbopack v0 캐시 / `next.user-config.mjs` 의존)는 별도 commit으로 revert. 깔끔한 PR. **워크플로우 정립**: v0가 push → Claude Code가 git worktree로 받아서 환경 잡음 제거 → PR + 머지.

### PR #221 (4f5165a): UI polish + dead code 14개
**체크박스 6 위치 통일**:
- `bg-card` (라이트 흰 배경) / `dark:bg-input/30` + `border-zinc-400` / `dark:border-zinc-600` + `shadow-sm` + `rounded-[4px]` + `hover:border-zinc-500`
- `components/ui/checkbox.tsx` (Radix base), `notes-table.tsx` (header select-all + row), `wiki-list.tsx`, `library-view.tsx`, `filter-panel.tsx`

**라이트모드 chart 색 WCAG AA 통과**:
- `--chart-2` (Inbox) #0891b2 → **#0e7490** (cyan-700, contrast 3.4 → 5.5)
- `--chart-3` (Capture) #ea580c → **#c2410c** (orange-700, 3.7 → 4.6)
- `--chart-5` (Permanent) #16a34a → **#15803d** (green-700, 3.0 → 5.0)
- `StatusShapeIcon`: `NOTE_STATUS_HEX` (hex 직접) → `NOTE_STATUS_COLORS[status].css` (CSS var) — 라이트/다크 자동 분리. 노트 row 왼쪽 작은 ○ 아이콘이 라이트모드에서 더 진해짐

**Dead code 14개 정리**:
- Notes: `orderPermanentByRecency`, `showThread`, `nestedReplies` toggle
- Wiki: `showStubs`, `showRedLinks` toggle
- Wiki Category: `showDescription` toggle, `showEmptyGroups` toggle, `tier`/`parent`/`family` grouping options
- Calendar: `showReminders` toggle
- `display-panel.tsx` "Built-in toggles" 섹션 통째 제거

**유지** (Explore가 dead 분류했으나 executor 깊이 파보니 실제 사용): `showNotes`/`showWiki` (calendar-view), `showDescription` 내부 (wiki-category-page), `showEmptyGroups` ViewState (notes-table/board), `tier`/`parent`/`family` 내부 grouping (wiki-category-page)

### PR #222 (f613532): P0 필터 강화 (5 앱 리서치 기반)
다른 노트앱 5개 (Linear/Notion/Obsidian/Capacities/Bear) 필터 시스템 리서치 후 P0 4개 도출:

- **P0-1 역링크 수 소트** — 이미 구현+노출 확인 (sort dropdown "Links" + sort.ts:46 `backlinksMap` 정렬). 사용자에게 안내만
- **P0-2 True orphan 필터** — `_orphan` value 추가 (linksOut=0 AND backlinks=0). 새 quickFilter "True orphans". 기존 "Orphans" → "Unlinked (no outbound)" 라벨 명확화
- **P0-2 보너스 "Has backlinks" 활성화** — view-configs에 옵션 있었으나 filter.ts 처리 X였던 dead config 활성화
- **P0-3 Wiki-registered 필터** — `FilterField.wikiRegistered` 추가. Note title+aliases ↔ WikiArticle title+aliases lowercase 매칭. `PipelineExtras.wikiTitles?: Set<string>` 추가
- **P0-4 부분 적용** — Has backlinks로 일부. note picker 기반은 다음 PR

**인프라 확장**: `applyFilters(notes, filters)` → `applyFilters(notes, filters, extras?)`. extras에 `backlinksMap` + `wikiTitles`. pipeline.ts / use-notes-view.ts 호출부 갱신. `wikiTitles` Set은 use-notes-view에서 wikiArticles store 구독해서 title + aliases lowercase로 합산.

### PR #223 (7423c08): Row density dropdown 통합 (시도)
**문제**: Compact mode + Show card preview 두 토글이 같은 차원(행 밀도) 별도 관리 → 충돌 가능 + 사용자 혼란.

**시도**: Notion식 Row height (Short/Medium/Tall) 패턴으로 통합. `ViewState.rowDensity?: "compact" | "standard" | "comfortable"` 새 필드. v92 migration. display-panel에 segmented 3-button control + 라인 밀도 SVG 아이콘.

### PR #224 (7472321): Row density 제거 (Linear 방식 회귀)
**사용자 피드백**: "Comfortable 모드 엉망. Linear 방식(별도 토글 X)으로 가자."

**revert**: rowDensity 필드 + segmented control + 모든 사용처 제거. v93 migration으로 rowDensity 필드 삭제. Linear 스타일 정착:
- Notes 리스트 단일 행 (40px)
- 자동 반응형 `containerWidth < 480` → 32px (모바일/좁은 화면)
- preview 없음 (Linear는 preview 토글 없음)

**의의**: "시각적 다양성 ≠ Plot 코어" 영구 규칙(2026-04-22 자각) 재확인. Notion 패턴 시도 후 Plot에 안 맞음 발견 → 즉시 revert. Plot 코어(지식 관계망)에 토글 옵션 적은 게 맞다는 학습.

### Store version
v91 → **v92** (PR #223 rowDensity 추가) → **v93** (PR #224 rowDensity 제거). Forward-only chain. 사용자 어떤 버전에서 시작해도 Linear 스타일로 정착.

### 5 앱 리서치 결과 (Plot 향후 방향)

**P0 (모두 이번 세션 완료)**: 역링크 소트 / 고아 필터 / 위키 등재 / 역방향 링크

**P1 (다음 세션)**:
- ✨ **Sub-group** (S, 인프라 있음) — Notes만. Status × Priority 같은 두 차원 그룹핑
- **Multi-sort** (S~M) — Primary + Secondary
- **날짜 상대값** (S) — "이번 주" / "지난 7일"
- **Wiki 1차 groupBy** (M, 별도 PR) — WikiList에 그룹핑 자체 X. linkCount bucket / infoboxPreset 별

**P1에서 제외**:
- Saved View — 이미 구현됨 (`lib/store/slices/saved-views.ts`). 검증만
- 그룹별 카운트 — 사이드바와 중복 ROI 낮음

**P2 (출시 후 검토)**:
- AND/OR 중첩 필터 빌더 (L, over-engineering 위험)
- Wiki Gallery 뷰 (L, Notes Gallery는 영구 규칙 위반)
- Time in status (M, noteEvents 활용 단축 가능)

**Anti-pattern (영구 폐기 권장)**:
- 뷰 타입 대량 추가 (Notion 8가지 같은) — Plot은 데이터베이스 앱 X
- AI/LLM 필터 — Plot 영구 결정 위반
- 태그별 독립 정렬 — Bear 커뮤니티 미해결, 인지 부하 ↑
- 과도한 컬럼 (Linear 15+) — Plot dimensional 부족
- Manual ordering 드래그 — 노트 수십~수백 규모에서 유지 불가

### 작업 흐름 학습

- **executor agent 위임 패턴 정립** — multi-file 변경(체크박스 6 / dead code 14 / P0 4 / Row density 통합 9 / Row density 제거 8)은 모두 executor 위임이 효율적. 명확 spec + tsc/test 자동 검증
- **dead code 정밀 분리 패턴** — Explore agent 1차 분류 후 executor가 깊이 파봐서 "UI dropdown만 dead vs state field 진짜 사용" 분리. 무자비한 삭제 X
- **HMR 캐시 이슈** — 큰 schema 변경(P0 PR / Row density 시도) 후 React Hooks 순서 에러 / Fast Refresh full reload 발생. dev server restart로 해결
- **Recharts ResponsiveContainer 회피 (계속 적용)** — React 19/Next 16에서 width 0. ResizeObserver 직접 패턴 (`wiki-growth-chart.tsx` 참고)
- **v0 + Claude Code 협업 패턴** — v0가 디자인 작업 자동 push → Claude Code가 worktree로 받아서 환경 잡음 제거 후 PR + 머지

---

## 🟢 2026-04-26 세션 — Plot 디자인 + 인사이트 대규모 (큰 세션, ~9시간)

**한 세션 9개 PR + 다수 핫픽스 — 인포박스/Navbox/배너 다채로움 + Connections 풀 강화 + Ontology Insights 허브 + Home 정체성 분리.**

### 핵심 아키텍처 결정
- **Home = 데이터 대시보드 + 빠른 진입** (Quick Capture / Stats / Recent / Quicklinks). 시간 기반 워크플로우(Inbox/Today/Snooze) 제거.
- **Ontology = Single Source of Insights** — 모든 정비 행동(Orphan/Promote/Unlinked/메트릭)은 Ontology Insights 탭으로 이전.
- **Pinned 통합 시스템** — Note.pinned + WikiArticle.pinned (NEW) + Folder.pinned + SavedView.pinned + globalBookmarks 모두 Mixed Quicklinks에 통합.

### PR 1-3: 인포박스/Navbox/배너 다채로움
- **PR 1**: Wiki Infobox type 11 프리셋 (custom/person/character/place/organization/work-film/work-book/work-music/work-game/event/concept) + Group Header 토글 + 색상 picker. Store v83.
- **PR 2**: Navbox/Navigation 풀 디자인 — 다단 헤더 / 그룹 / 색상 / 1-6 col 그리드 / 펼치기·접기 (Editorial-Imperial 스타일, 나무위키 "명 황제" 수준). Store v84. luminance 기반 자동 contrast.
- **PR 3**: Banner 4 다채로움 — 좌측 아이콘 8종 / Compact·Default·Hero / stripe 옵션 / gradient 옵션. Settings 통합 popover. Store v85.

### PR 4: Connections 상세 (블록 단위 + 인라인 스니펫)
- `extractBlockLinkContexts` walker — TipTap JSON 재귀, 4종 링크(wikilink/noteEmbed/wikiEmbed/referenceLink) + mention 노드 매칭, blockId dedupe, 140자 스니펫
- `useBacklinksWithContext` 훅 — 2단계 (title-match 동기 + IDB 비동기 contentJson 로드)
- `BacklinkCard` — Obsidian 스타일 카드 + sub 스니펫 + hover 풀 프리뷰 (`showNotePreviewById` 재사용)
- 위키 source도 contentJson scan (block 단위 추출)
- `outboundLinked`에 위키 article title 매칭 추가 (이전 누락 버그)
- `@` mention도 Connections에 잡히게 (4종 케이스 [[]] / @ × 노트 / 위키 모두 처리)

### PR 5: Discover mention + 위키 source + IDB 캐시 + hydration
- `discover-engine.ts`에 mention 가중치 추가 (W_BACKLINK 4 / shared mention 2x)
- `mention-index-store.ts` 신설 — `plot-mention-index` IDB DB (edges + sources 양방향). `getMentionSources(targetId)` O(1) 룩업
- `persistBody/removeBody` hook에 자동 wiring → 모든 노트 CRUD가 자동 인덱싱
- `view-header.tsx` 3 Popover에 hydrated guard (Radix aria-controls SSR/CSR mismatch fix)
- `<ClientOnly>` 신규 컴포넌트 추가 (재사용)

### PR 6: Ontology Insights 탭
- `lib/insights/types.ts` + `lib/insights/metrics.ts` (순수 함수 엔진)
- `useKnowledgeMetrics` 훅 (사이드바 Health + Insights 패널 단일 source)
- 새 메트릭 7종: Knowledge WAR (top 10), Concept Reach (2-hop), Hubs, Link Density, Orphan Rate, Tag Coverage, Cluster Cohesion
- `OntologyTabBar` (Graph / Insights), Graph keep-alive (display:hidden 토글)
- `OntologyInsightsPanel` — 세이버메트릭스 미니멀 (라벨 + 숫자 row만)
- `OntologyNudgeSection` 추가 — Orphan / 위키 승격 후보 / Unlinked Mention 액션 카드
- `linear-sidebar.tsx`의 Health 섹션 O(N²) 인라인 → O(1) 훅 호출

### PR 7-8: Home 정체성 분리 + 디자인 iteration
**원칙**: Home은 담백한 데이터 대시보드. 시간 기반 (Inbox/Today/Review) 제거. 정비 인사이트 → Ontology.

**Home 최종 구성** (사용자 다회 피드백 반영):
- Quick Capture (max-w-2xl 가운데)
- StatsRow (5 카드: Notes/Wiki/Tags/Refs/Files, 컬러 적용 — blue/violet/emerald/amber/rose, sub 텍스트로 Coverage/Stubs/Active/Unused/Size)
- RecentCards (4 카드, h-32, preview + meta)
- MixedQuicklinks (Note pinned + Wiki pinned + Folder pinned + SavedView pinned + Bookmark 통합 카드)
- "Improve your knowledge graph →" CTA → Ontology Insights 탭으로 점프
- max-w-5xl

**시도 후 롤백한 것들**:
- Linear 큰 리스트 (옵션 1): "디자인 별로"
- Plane 풀 미러 (Greeting + Quicklinks + Stickies + Rediscover): "너무 많음"
- Knowledge Nudge in Home: 압박감 → Ontology로 이전

### Wiki article 핀 시스템 (NEW)
- `WikiArticle.pinned: boolean` 필드 추가 (Store v87)
- `toggleWikiArticlePin` 액션 추가
- 사이드패널 wiki article detail 우상단 Pin 버튼 (PushPin 아이콘, accent 강조)
- Wiki dashboard에 PINNED 섹션 추가 (Featured Article 다음, Categories 전)
- Home Quicklinks에도 통합 표시

### 핫픽스 다수 (v86-v91)
- **v86**: `wikiArticle.infobox` undefined backfill (런타임 TypeError 해결)
- **v87**: `WikiArticle.pinned` 백필
- **v88**: 모든 위키 article 강제 unpin (잘못 박힌 핀 클린업)
- **v89**: `noteType wiki` notes dedup by title (가장 오래된 keep, 나머지 trashed)
- **v90**: `wikiArticles` 배열 dedup (별도 entity)
- **v91**: idempotent re-run (이전 마이그레이션 누락 대비)
- `createWikiStub` dedupe 가드 — 동일 title 이미 있으면 ID 재사용 (자동 등재 무한 누적 방지)
- Wiki view에 `!trashed` 필터 추가
- Slash description 영어 통일 / 루비 텍스트 base 티어에서 완전 제거 / Inline Math NodeView (Popover) 신규 / popover 정렬 (`align="start"` + collisionPadding) 통일

### Note Split 기능 (P2 must-todo 완료)
- WikiSplitPage 패턴 그대로 노트에 적용
- `lib/note-split-mode.ts` (외부 store, useSyncExternalStore)
- `components/views/note-split-page.tsx` (좌 체크리스트 / 우 새 노트 preview, heading 그룹 자동 선택)
- `splitNote` action (atomic, source content 분할 + 새 노트 생성 + persistBody 양쪽)
- 진입점 3곳: 노트 에디터 ⋯ / 리스트 우클릭 / 플로팅 액션 바
- 글로벌 마운트 (app/(app)/layout.tsx의 NoteSplitOverlay)
- 빈 컨텐츠 graceful 처리 + IDB hydration

### 나무위키 Tier 2-4 (사용자 결정으로 진행)
- **Tier 2 배너 블록** (PR 3 참조)
- **Tier 3a age + dday** 인라인 매크로 (Popover NodeView, 한국식 만 나이 + 한국어/영어 라벨 영어로 통일)
- **Tier 3b Include** — 기존 NoteEmbed/WikiEmbed에 alias + 양방향 활성화 + cycle guard (`lib/embed-cycle.ts`)
- **Tier 4a 각주 이미지** — Reference.imageUrl 필드 + footnote modal에 Image URL input + footer 썸네일. Store v81.
- **Tier 4b 루비 텍스트** — 사용자 결정으로 **완전 제거** (한국어 사용자 거의 안 씀, 노트앱 표준 X)
- **Tier 4c 위키 parent-child article** — `WikiArticle.parentArticleId` + breadcrumb + Children 섹션 + 사이클 가드 (`lib/wiki-hierarchy.ts`)

### Y.Doc P0-1 (P0 부분 진행)
- y-indexeddb 패키지 설치
- `lib/y-doc-manager.ts`에 IndexeddbPersistence 통합 + `whenReady` Promise + `getIsFresh()` post-hydration 판정
- `NoteEditorAdapter`에 `ydocReadyForNoteId` state 추가 (mount gate)
- 사이드 이슈: `plot-note-bodies` IDB v3 bump + post-open store-presence check, StarterKit duplicate extension (link/underline/gapcursor) 비활성화

### Store version: v82 → **v91**
9 마이그레이션 추가 (v83~v91). 모두 안전 (백필 또는 idempotent dedup).

---

## 🟢 2026-04-25 세션 — 코멘트 시스템 대규모 작업 + 통합 + 미니맵

**한 세션 18 커밋 — Plot 코멘트 인프라 전체 구축 + 사이드패널 통합 + 디자인 폴리시.**

### Phase 1: Comment 데이터 모델 (v77~v79)
- `Comment.status: "backlog" | "todo" | "done" | "blocker"` (Linear 스타일)
- `Comment.parentId` (1단계 답글 / threaded reply)
- `CommentAnchor` 4 종: `note`, `note-block`, `wiki`, `wiki-block`
- v77: status + parentId 필드, v78: Reflection/Thread → Comment 마이그레이션, v79: "note" → "backlog" 리네임

### Phase 2: 코멘트 UI 시스템
- **`CommentPopover`** (인라인 트리거): 위키 블록 옆 호버 → 클릭 시 popover (560px, w/ overflow-hidden 클립)
- **`CommentsByEntity`** (사이드패널 Activity 탭): 엔티티의 모든 코멘트 한 곳 — block + entity-level 통합
- **`CommentEditor`** (TipTap "comment" tier — 라이트): `[[wikilinks]]` + `#tags` + 마크다운 단축키. 툴바 X (코멘트는 가벼운 메모라는 사용자 결정)
- **`CommentBodyDisplay`**: read-only 렌더 (JSON or plain text 둘 다)
- **`StatusPicker`**: portal 기반 (z-[10011], 부모 popover 오버플로우 영향 X)
- **`MoreMenu`**: ⋯ — Reply primary, Convert to Note + Delete inside

### Phase 3: 블록 마커 + 인라인 진입점
- **`BlockCommentMarker`**: 블록 우측에 항상 보이는 말풍선 + status dot + 갯수. 클릭 시 popover trigger 역할
- **`use-block-comment-status.ts`**: `useBlockCommentStatus(anchor)` + `useCommentStatusByBlockId(blockId)`
- **위키 모든 블록 8종 대칭**: section/text/note-ref/image/url/table/navbox/navigation 모두 인라인 [💬 마커] [🔖 북마크] [⋯ 메뉴] cluster (left-full top-1 ml-2 거터)
- **`NoteCommentMarkerLayer`**: ProseMirror 블록 위 absolute overlay → 노트 본문 어디든 인라인 코멘트 (BlockDragOverlay 패턴)

### Phase 4: 통합
- **Activity 통합**: ThreadPanel/ReflectionPanel 폐기 → `CommentsByEntity` 단일 컴포넌트 (note + wiki 공용). `lib/store/slices/reflections.ts` 삭제
- **Bookmarks 통합**: `GlobalBookmark.targetKind: "note" | "wiki"` (v80 migration). 사이드패널 Bookmarks 탭 = 모든 핀 통합 표시 + Filter chips ([All/Notes/Wiki]) + Search input. SECTIONS 섹션 제거 (Detail Outline과 중복)
- **Connections 통합**: 위키에 `linkingNotes` 추가 (linksOut 기반 backlinks)
- **Pin → Bookmark 네이밍 통일**: `PushPin` → `BookmarkSimple` 아이콘. 사이드패널 PINNED 헤더 제거 (탭 이름과 중복)

### Phase 5: 위키 블록 + Navbox
- **Navbox 하이브리드** (Wiki 표준 호환): Auto/Manual 모드 토글
  - Auto: 카테고리 자동 필터 (기존)
  - Manual: WikiPickerDialog로 article 직접 선택 (Wikipedia/나무위키 표준)
  - Wiki 리서치 결과: Navbox는 100% 수동 큐레이션이 표준 — Plot은 둘 다 지원
- 모든 블록 cluster overflow-hidden 잘림 버그 수정 (wrapper 분리)

### Phase 6: 코멘트 composer 디자인 폴리시
- 본문 article 섹션 번호와 일치하는 미니맵 (Option F + G):
  - Phosphor 아이콘 통일 (이모지 전부 제거: 📄📝📎🖼️🔗📊🗺️🧭)
  - 블록 타입별 컬러 stripe (note-ref=blue, image=emerald, url=cyan, table=purple, navbox/nav=amber, callout=yellow, code=pink)
  - 섹션 = accent 색깔 번호 badge ("1", "1.1", "2.3.1") — H 아이콘 제거
  - 섹션 사이 separator + font-semibold visual 강조
- TipTap 툴바 시도 (note tier + FixedToolbar) → 사용자 피드백으로 라이트 코멘트 tier로 롤백

### TOC entry 코멘트 배지
- TOC 항목에 코멘트 갯수 배지 (`useCommentStatusByBlockId` 활용)
- 코멘트 있는 블록을 가리키는 TOC entry 즉시 인지

### 활동 바 + 클릭 네비게이션
- Activity Bar Wiki 아이콘 `IconWiki` → `BookOpen` (Notes와 시각 구분)
- Wiki 북마크 클릭 시 `setActiveRoute("/wiki")` + `navigateToWikiArticle()` (이전엔 `window.location.hash`만 변경되어 안 됐음)
- 8회 retry scroll + ring-2 highlight (1.5s)

**커밋 18개:**
1. session: TOC 세로선 제거 + comments/bookmarks WIP
2. feat(comments): Linear status + threaded + Activity 통합
3. feat(comments): 노트 인라인 마커 + 레거시 정리 + Note→Backlog
4. feat: Bookmarks + Connections 통합
5. feat(comments): TOC entry 코멘트 배지 + 통합 마무리
6. feat: Bookmark 네이밍 통일 + 노트 인라인 북마크
7. feat(bookmarks): 모든 위키 블록 cluster + Filter chips + Search
8. feat(navbox): Auto/Manual 하이브리드
9. feat(comments): TipTap 미니 에디터 통합
10. fix(comments): 풀 에디터 + 폭 조정 + 본문 스크롤
11. fix(comments): 컴팩트 툴바
12. fix(comments): 풀 FixedToolbar 복원
13. fix(comments): 툴바 가로 스크롤 작동
14. revert(comments): 풀 툴바 롤백 — 라이트 유지
15. refactor(comments): document-level 드롭다운 Phosphor 통일
16. feat(comments): document-level 드롭다운 미니맵 (Option G)
17. feat(comments): 미니맵 섹션 번호 (1, 1.1, 1.2)

**핵심 정책 결정**:
- Comment 본질: 가벼운 메모. 풀 에디터 툴바 X. 마크다운 단축키 + 위키링크 + 해시태그로 충분
- Linear 스타일 status: Backlog/Todo/Done/Blocker (Linear 정통 영감)
- Pin = Bookmark (네이밍 통일, 시각 통일 BookmarkSimple)
- Navbox: 자동(편의) + 수동(Wiki 표준) 둘 다 (하이브리드)
- 미니맵: 코드 아이콘 일관 (F) + 시각적 구조 표현 (G)

**스토어 v80 (이전 v76)**.

---

## 🟢 2026-04-24 세션 — TOC 비주얼 폴리시 + contentBlock Enter 조사

**TOC gutter 번호 계층 시각화 최종 결정**:
- 세로선(실선/점선/페이드/원+선) 전부 "별로" 피드백
- 웹 리서치(Notion/Craft/Obsidian/Bear/Wikipedia/나무위키): **본문에 부모-자식 연결선을 그리는 앱 거의 없음**. Outliner(Logseq/Workflowy)만 사용. 문서 앱은 전부 폰트 크기+들여쓰기+여백만으로 계층 표현.
- 최종: 세로선 완전 제거. 번호만 거터에 opacity 0.9 / weight 700 유지 (희미하게 바꿨다가 "잘 안 보인다" 피드백으로 롤백).
- `components/editor/EditorStyles.css`의 `[data-toc-child-depth]::after` 제거됨.

**contentBlock Enter 버그 조사 (미해결)**:
- 증상: contentBlock 안 단락 중간에서 Enter → 블록 밖으로 튀어나감
- 원인: ProseMirror `splitBlock` 기본 동작이 `$from.depth === 0 ? 1 : 2`로 split하여 contentBlock 래퍼까지 쪼갬
- 시도: `addKeyboardShortcuts` Enter 커스텀 핸들러 + `tr.split(pos, depth-cbDepth)` + `priority: 1000` — 전부 효과 없음
- 결론: **"근본적으로 안 되는 걸로 알기"로 사용자 판단**. 롤백 완료.

**리서치 레퍼런스** (세로선 구현 관련):
- Obsidian Lapel 플러그인 = gutter 텍스트 레이블 방식
- CSS counter로 TipTap 자동 번호 가능 (GitHub Discussion #914)
- Logseq bullet threading은 `:has()` 셀렉터 필요 → 퍼포먼스 이슈

---

## 🟢 2026-04-22 Hard Reset to PR #194 (최우선 읽기)

**현재 branch HEAD**: `3f2e54c` (PR #194). PR #195 ~ #213 전부 폐기.

**대결정**: 2주간(04-14 ~ 04-21) "대결정" 3회 반복 패턴 종결:
- 04-14 컬럼 템플릿 시스템
- 04-17 Page Identity Tier
- 04-21 Book Pivot

**자각**: 사용자 언어 — "매거진/뉴스페이퍼/북 등등은 개발자 자기만족". Plot 코어(지식 관계망, 팔란티어×제텔카스텐)와 직교. "위키는 그냥 냅두자" → "PR #194가 위키 정점" → hard reset.

**폐기된 PR들**:
- #211-213 Book Pivot (5 shell: magazine/newspaper/book/blank)
- #209 Page Identity Tier (Article tint, Card palette)
- #208 메타→블록 통합 (infobox/toc 블록화)
- #207 docs catchup
- #206 메타→블록 대결정 docs
- #205 컬럼 추가/삭제 버튼
- #204 컬럼 간 블록 드래그
- #203 컬럼 비율 드래그
- #202 ColumnPresetToggle
- #201 Phase 2-1B-3 cleanup (기존 렌더러 삭제)
- #200 Phase 2-1B-2
- #199 Phase 2-1B-1
- #198 Phase 2-1A (ColumnRenderer 등)
- #197 WikiTemplate + 8 built-in
- #196, #195 session docs

**유지된 PR들** (PR #194까지):
- #194 Tier 1 인포박스 전체 완료 + 위키 디자인 버그 수정
- #193, #192 Y.Doc PoC + Block Registry 단일화 + 인포박스 Tier 1-1/1-3
- #191 나무위키 리서치 + TODO 최신화
- #190 Reference Usage + Note History + Wiki Activity 정리
- #189 Expand/Collapse All + TextBlock 드래그/리사이즈
- #188 노트 References + fontSize cascade
- #187 각주/Reference UX 개선
- (전체: 하단 Completed PRs 섹션)

**⚠️ Git 주의**: 이 branch가 hard reset 상태. main은 PR #213까지 있음. `git merge origin/main -X theirs` 실행 시 롤백 자동 취소. 곧 commit + PR 해서 main에 반영 필요.

**다음 방향**: UI 일관성 감사 + 개선. 사용자 pain point "ui가 너무 이상함, 일관성 없고" 해결. 기능 추가는 당분간 보류.

**Claude memory**: `feedback_core_alignment.md`, `project_book_pivot_rollback.md`, `feedback_design_before_implementation.md`

---

## Project Overview
- **Type**: Next.js knowledge management app (Linear UI + Obsidian linking + Anki-lite review)
- **Stack**: Next.js 16, React 19, TypeScript, Zustand 5 (persist w/ IDB), TipTap 3, Tailwind v4
- **Store**: `lib/store/index.ts` — 22-slice Zustand store with versioned migration (currently v74)
- **Workflow**: Inbox -> Capture -> Permanent (3 statuses only)

## User Preferences
- Korean communication preferred (casual tone)
- Pragmatic over theoretical — values working code over perfect design
- Prefers simple solutions (YAGNI principle)
- Commit workflow: commit -> push -> PR -> squash merge to main
- Worktree-based development (branch per session)
- Design quality is top priority — Linear-level polish
- 범용 노트앱 + 제텔카스텐

## Key Patterns
- **Separate map pattern**: `srsStateByNoteId`, `viewStateByContext`, `backlinksIndex` — avoid polluting Note type
- **Store migration**: Bump version, add migration block in `migrate()` function
- **Event system**: `noteEvents` with `NoteEventType` union, bounded to MAX_EVENTS_PER_NOTE=1000
- **Attachment IDB**: Binary blob data in separate IDB (`plot-attachments`), metadata in Zustand persist
- **Alias resolution**: BacklinksIndex + graph.ts register note aliases in `titleToId` Map (no-clobber)
- **Search**: Worker-based FlexSearch with IDB persistence
- **Body separation**: Note content in separate IDB (`plot-note-bodies`), meta in Zustand persist
- **Wiki block body separation**: Text block content in `plot-wiki-block-bodies` IDB, block metadata in `plot-wiki-block-meta` IDB
- **Workspace**: Simplified dual-pane (v52) — `selectedNoteId` (primary) + `secondaryNoteId` (right editor), react-resizable-panels
- **Side Panel**: Unified `SmartSidePanel` — 4-tab: Detail(메타데이터) + Connections(Connected/Discover) + Activity(Thread/Reflection) + Bookmarks(앵커/북마크). Peek 탭 제거 (PR #176). 단일 인스턴스 + global state, useSidePanelEntity focus-following
- **Wiki sectionIndex**: `WikiSectionIndex[]` in Zustand for lightweight TOC, full blocks in IDB for scalability (v53)
- **Responsive NotesTable**: ONE grid for all sizes — ResizeObserver + minWidth thresholds
- **TipTap Editor**: Shared config factory (`components/editor/core/shared-editor-config.ts`) with 4-tier system (base/note/wiki/template). **Title 노드 폐기 (v65)** — 첫 번째 블록(H2)이 자동으로 타이틀 역할 (UpNote 스타일). title-node.ts 삭제됨. 25+ extensions.
- **Block Drag (dnd-kit)**: `components/editor/dnd/` — useBlockPositions + useBlockReorder 훅 + BlockDragOverlay 컴포넌트. ProseMirror DOM 위 투명 오버레이 레이어. 드래그 핸들(⠿) hover 시 블록 왼쪽에 표시. DOM 클론 프리뷰. GlobalDragHandle 제거됨.
- **Dropcursor Slot**: Dropcursor를 슬롯 인디케이터 스타일로 변경 (반투명 배경 + dashed 테두리)
- **EditorStyles.css CSS 변수**: globals.css가 hex 값 사용 → `hsl(var(--xxx))` 패턴 전부 `var(--xxx)` 또는 `color-mix()`로 변환 완료
- **Table BubbleMenu**: `components/editor/TableBubbleMenu.tsx` — 테이블 셀 focus 시 floating 툴바. Row/Col 추가삭제, Merge/Split, Align, Bold, 셀 배경색(7색), Header 토글, 스마트 삭제(CellSelection→행삭제, 아니면→테이블삭제)
- **Table Delete Key**: prosemirror-tables의 `CellSelection` + `deleteRow`/`deleteColumn` 직접 import. `addProseMirrorPlugins`로 tableEditing보다 먼저 실행되는 플러그인 등록. 빈 셀 선택 + Delete → 행/열 삭제.
- **Table Cell Background**: TableCell/TableHeader를 extend해서 `backgroundColor` 속성 추가. `setCellAttribute("backgroundColor", rgba)` 사용.
- **Table Tab Navigation**: 테이블 안에서 Tab → `goToNextCell()`, Shift+Tab → `goToPreviousCell()`
- **2-Level Routing**: `activeSpace` (inbox/notes/wiki/ontology/calendar) + `activeRoute`, `inferSpace()` 하위호환
- **Phosphor Icons**: Lucide→Phosphor 전체 마이그레이션 완료 (PR #104, 83파일). `components/plot-icons.tsx`는 레거시
- **Wiki Collection**: `wikiCollections: Record<string, WikiCollectionItem[]>` — per-wiki-note staging area for related material
- **Undo Manager**: `lib/undo-manager.ts` — LinkedList 기반 글로벌 Undo/Redo (capacity 50), Zustand state diff 기반
- **Sub-grouping**: `group.ts` 재귀 호출로 2단계 그룹핑. NoteGroup.subGroups에 저장. VirtualItem "subheader" 타입으로 렌더
- **Thread Nested Replies**: ThreadStep.parentId 기반 트리 구조. Thread 패널에서 들여쓰기 렌더 + Reply 버튼
- **Wiki Categories**: wiki-categories slice, DAG 트리 (parentIds[]), 2-panel 트리 에디터 (드래그 계층 편집)
- **Wiki Layout Preset**: `WikiLayout = "default" | "encyclopedia"` — article별 레이아웃 전환
- **Wiki URL Block**: `WikiBlockType` 'url' 추가, 유튜브 iframe embed + 일반 링크 카드
- **Unified Pipeline**: Filter/Display/SidePanel 통합 — 5개 space가 공유 컴포넌트 사용
- **ToggleSwitch**: `components/ui/toggle-switch.tsx` — 라이트/다크 모드 공통, off=회색 on=accent+white knob
- **ChipDropdown**: `components/ui/chip-dropdown.tsx` — 제네릭 드롭다운, DisplayPanel에서 추출
- **Graph Filter Adapter**: `lib/view-engine/graph-filter-adapter.ts` — OntologyFilters ↔ FilterRule[] 변환
- **Discover Engine**: `lib/search/discover-engine.ts` — keyword+tag+backlink+folder 4신호 로컬 추천
- **SidePanel 4탭**: Detail + Connections + Activity + Bookmarks. Context swapping 패턴 (`_savedPrimaryContext`). `useSidePanelEntity`는 `sidePanelContext`만 읽음
- **Toolbar Config**: `lib/editor/toolbar-config.ts` — 42 item IDs, normalizeLayout(), Arrange Mode (dnd-kit drag-and-drop). Settings store에 persist
- **Toolbar Primitives**: `components/editor/toolbar/toolbar-primitives.tsx` — ToolbarButton(40×40), ToolbarDivider, ToolbarGroup, ToolbarSpacer. Phosphor weight="light"
- **Editor Colors**: `lib/editor-colors.ts` — 16 TEXT_COLORS + 16 HIGHLIGHT_COLORS, 8-column grid
- **Floating TOC**: `components/editor/floating-toc.tsx` — Notion 스타일 에디터 우측 자동 사이드바. 대시 인디케이터(H2=16px, H3=10px), hover 확장(220px), scrollspy. 첫 heading(타이틀) 자동 제외. heading 2개+ 일 때만 표시
- **@Mention**: `components/editor/MentionSuggestion.tsx` — @tiptap/extension-mention 기반. 노트/위키(WikiArticle)/태그/날짜 4종 통합 검색. WikilinkSuggestion.tsx 패턴 복제. 날짜 파싱: `lib/mention-date-parser.ts`
- **Anchor/Bookmark**: `components/editor/nodes/anchor-node.tsx` (인라인) + `components/editor/nodes/anchor-divider-node.tsx` (블록 구분선). 플로팅 TOC + 사이드패널 Bookmarks 탭에 통합
- **Side-drop Columns**: 블록 드래그 시 좌/우 15% 영역 감지 → 자동 columnsBlock 생성. columnsBlock 위 드래그 시 기존 셀에 삽입 (3컬럼 방지). `block-drag-overlay.tsx`의 handleDragMove
- **Note Hover Preview**: `components/editor/note-hover-preview.tsx` — 싱글턴 컨트롤러, 300ms delay show / 200ms delay hide, portal 기반 팝오버
- **Note Reference Actions**: `lib/note-reference-actions.ts` — 통합 클릭 핸들러 (Peek/Navigate), title→id 해석, wikilink/mention 공용
- **Synced Block**: NoteEmbed `synced` 속성 토글, base 티어 인라인 TipTap (재귀 방지), 300ms 디바운스 원본 노트 저장
- **Block Resize**: `useBlockResize` 훅 + `BlockResizeHandles` 컴포넌트 (코너 4 + 엣지 2), width/height 속성, 리셋 버튼 헤더 통합
- **Move out of Column**: `editor-context-menu.tsx` — columnCell 내 블록을 columnsBlock 아래로 이동, cellNode.forEach + cellStart 계산
- **Column Resize (pixel)**: colWidth를 pixel 값으로 저장, CSS grid `fr` 단위로 변환, 양쪽 셀 동시 업데이트
- **Wiki Editor Tier**: shared-editor-config.ts wiki tier = base + SlashCommand + WikiQuote + Callout/Summary/Columns/Infobox/Anchor/ContentBlock + 키보드 단축키 + 테이블 키보드. 노트 에디터 FixedToolbar 재사용 (tier="wiki")
- **Wiki Click-Outside Close**: TextBlock 편집 시 blur 대신 document mousedown click-outside 패턴. blockRef.contains()로 드래그 핸들/툴바 내부 클릭 허용
- **Encyclopedia Edit = Default Edit**: DndContext + SortableBlockItem + WikiBlockRenderer(variant="encyclopedia"). 드래그/Split/Move/Delete/AddBlock/카테고리 전부 Default와 동일
- **WikiBlock.fontSize**: 섹션 블록 커스텀 폰트 크기 (0.8=S, 1=M, 1.2=L, 1.5=XL). style={{ fontSize: `${fontScale}em` }}
- **Contents TOC fontScale**: 대각선 리사이즈 핸들(우하단 코너). width/BASE_WIDTH 비율로 0.75~1.5 스케일. 제목+항목 fontSize 연동
- **Partial Quote**: WikiQuote 8필드 (sourceNoteId/sourceTitle/quotedText/quotedAt + originalText/sourceHash/context/comment). Peek/호버에서 텍스트 선택 → `plot:insert-wiki-quote` 커스텀 이벤트 → note-editor.tsx 리스너
- **Hover Preview Command Center**: `note-hover-preview.tsx` — 리치 HTML (generateHTML + createRenderExtensions), 메타데이터 바 (folder/time/backlinks), 액션바 (Open/Peek/Quote/⋯), 텍스트 선택 Quote
- **Wikilink Context Menu**: `wikilink-context-menu.tsx` — WikilinkDecoration contextmenu 이벤트 → `plot:wikilink-context-menu` CustomEvent → floating 메뉴
- **pendingFilters**: `table-route.ts` 외부 스토어. Home 카드 클릭 시 필터 주입 → notes-table.tsx에서 소비 후 클리어
- **Orphan Actions**: `lib/orphan-actions.ts` — discover engine 재활용, 4종 제안 (link/move/tag/delete)
- **Stub 부활**: `lib/wiki-utils.ts` isWikiStub() — 블록 ≤4개 + 모든 text block 비어있음 = stub. 상태 필드 없이 heuristic
- **WikilinkDecoration 3-way**: exists(보라색) / stub(주황색 점선) / dangling(빨간색). wikiArticles titleMap 추가, isWikiStub() 연동
- **[[드롭다운 섹션 분리**: Notes / Wiki 2섹션, Create Note + Create Wiki 2옵션. IconWiki 통일
- **Wikilink 4-way 시각 시스템**: `wikilink-exists`(보라밑줄) / `wikilink-wiki`(teal칩) / `wikilink-stub`(amber점선) / `wikilink-dangling`(gray점선). `[[wiki:Title]]` prefix로 타입 구분, `wiki:`는 bracket처럼 숨겨짐
- **호버 프리뷰 TipTap 통합**: Preview/Edit 동일 렌더링 — 항상 NoteEditorAdapter(editable 토글). generateHTML 폐기. 640px 카드
- **호버 프리뷰 Pin 시스템**: 모듈 레벨 `_pinned` + `_pinListeners`. 위키링크/멘션 클릭으로 `togglePreviewPin()`. Pin 시 accent 테두리 + PushPin 아이콘. `data-hover-preview` 가드로 프리뷰 안 재귀 방지
- **Footnote/Reference 시스템**: FootnoteRef 인라인 atom 노드 (`components/editor/nodes/footnote-node.tsx`). attrs: id/referenceId/content/comment. 문서 순서 기반 자동 번호 계산. 호버 팝오버(300ms delay, 200ms hide). 하단 FootnotesFooter 자동 렌더링 (`components/editor/footnotes-footer.tsx`). `[N]` 양방향 네비게이션 (본문↔하단). 하단 싱글클릭 인라인 편집. `[[`/`@` 드롭다운 References 섹션 통합.
- **Reference store**: `references: Record<string, Reference>` — title/content/fields(인포박스식 키-값)/tags. CRUD 3액션. `/footnote` 또는 `[[`/`@`에서 생성. Library에서 관리 예정.
- **WikiQuote 폐기**: WikiEmbed가 상위 대체. WikiQuoteExtension.ts, WikiQuoteNode.tsx, lib/quote-hash.ts 삭제. 호버 프리뷰/사이드패널 peek/note-editor 에서 Quote 관련 코드 전부 제거.
- **Smart Link / LinkCard**: `components/editor/nodes/link-card-node.tsx` — atom block, favicon+title+description+domain. URL paste → 자동 LinkCard. YouTube/Audio는 기존 확장이 처리
- **URL 감지 유틸**: `lib/editor/url-detect.ts` — detectUrlType(youtube/audio/generic), isValidUrl, extractDomain
- **UrlInputDialog**: `components/editor/url-input-dialog.tsx` — Portal 기반 공용 다이얼로그 (link/embed 2모드). window.prompt 전면 대체
- **Embed 통합**: YouTube+Audio+LinkCard를 1개 Embed 버튼으로 통합. URL 패턴 자동 감지
- **Editor Icon Barrel**: `lib/editor/editor-icons.ts` — 101개 아이콘 중앙 매핑 (Phosphor→Remix). 에디터 전용, 나머지 앱은 Phosphor 유지. 32개 에디터 파일이 이 barrel에서 import
- **Indent Extension**: `components/editor/core/indent-extension.ts` — paragraph/heading에 indent 속성 (0-8단계, 24px/단계). addGlobalAttributes로 등록. Enter 시 indent 자동 상속
- **Library Space**: 6번째 Activity Bar 공간. 사이드바 NavLink(Overview/References/Tags/Files). 서브라우트: `/library`, `/library/references`, `/library/tags`, `/library/files`. Always-mounted 패턴
- **ReferenceDetailPanel**: `components/side-panel/reference-detail-panel.tsx` — SmartSidePanel Detail 탭에서 Reference 편집. SidePanelContext `{ type: "reference", id }` 확장
- **각주→Reference 자동 연결**: footnote-node.tsx + footnotes-footer.tsx의 save()에서 referenceId 없으면 자동 createReference + 연결. content 수정 시 동기화
- **More Actions Overflow**: Pin 고정, 우클릭 Favorites (settings-store persist), 서브패널 (컬러피커/테이블 호버선택/이미지). `overflowFavorites: string[]` in settings store
- **Split View (듀얼 패널)**: 하이브리드 모델 — 좌측=메인(selectedNoteId), 우측=독립 참조(secondaryNoteId). `secondaryHistory[]` 독립 네비게이션. `secondaryRoute/secondarySpace` 독립 라우팅 (table-route.ts). `PaneContext` + `usePaneOpenNote` + `usePaneActiveRoute` 훅. `SecondaryPanelContent`가 note/wiki/뷰 렌더링. breadcrumb 드롭다운으로 6 space 전환. `setRouteInterceptForSecondary`로 우측 클릭 시 글로벌 라우트 인터셉트. 사이드바는 좌측 전용
- **SmartSidePanel Context Swapping**: `_savedPrimaryContext` 패턴. `setActivePane`/`openInSecondary`/`openNote(secondary)` 호출 시 `sidePanelContext`를 primary↔secondary 간 swap. `useSidePanelEntity`는 `sidePanelContext`만 읽음. Zustand `activePane` 구독 이슈 우회
- **Wiki Detail SmartSidePanel 통합**: 위키 내장 aside 제거, `WikiArticleDetailPanel`에 Sources/Delete 추가. 위키도 노트와 동일하게 SmartSidePanel 사용
- **Breadcrumb Note Picker**: `editor-breadcrumb.tsx` NotePickerChevron — ">" 클릭 시 검색+노트 리스트 드롭다운. StatusShapeIcon + 라벨 칩. 20개 제한
- **Reference.history**: 수정 이력 자동 기록 (created/edited/linked/unlinked). 50개/Reference 제한. Store v73 migration
- **Library Create Menu**: ViewHeader `createMenuContent` prop — + 버튼 팝오버. Reference/Tag/File 생성
- **Tags pickColor 통일**: 에디터/Tags뷰 모두 `pickColor(name)` 사용 (이름 해시 기반 자동 색상)
- **Wiki 공유 유틸**: `lib/wiki-block-utils.ts` (computeSectionNumbers/getInitialContentJson/buildVisibleBlocks) + `hooks/use-wiki-block-actions.ts` (useWikiBlockActions) + `components/wiki-editor/wiki-layout-toggle.tsx` (WikiLayoutToggle). 두 렌더러 ~300줄 중복 제거
- **Wiki 문서 레벨 각주**: `wiki-footnotes-section.tsx` — 위키백과 스타일. FootnoteRefExtension에 `addStorage({ footnoteStartOffset: 0 })`. 블록별 offset으로 문서 전체 연번. IDB에서 contentJson 로드 → footnoteRef 수집 → 통합 목록. 양방향 스크롤 (`data-wiki-footnote-id` / `data-footnote-id`). `onFootnoteCount` 콜백으로 블록별 각주 개수 리포트
- **Wiki 텍스트 블록 [[/@/# 활성화**: wiki 티어에 HashtagSuggestion, WikilinkSuggestion, WikilinkNode, WikilinkInteractionExtension, Mention, MentionInteractionExtension, Emoji 추가. 노트와 동일한 인라인 제안 기능
- **드롭다운 아이콘 통일**: MentionSuggestion 위키=IconWiki(보라/주황), WikilinkSuggestion 노트=StatusShapeIcon 색상. Stub=#f59e0b(주황), Article=#8b5cf6(보라)
- **Default 레이아웃 TOC 반응형**: aside `hidden xl:block` + `shrink` + 콘텐츠 `pb-40` (Add block 드롭다운 잘림 방지)
- **FootnoteEditModal**: `components/editor/footnote-edit-modal.tsx` — 글로벌 모달 (layout.tsx 마운트). Title+Content+URL 3필드. 이벤트 기반 API (`openFootnoteModal`/`cancelFootnoteModal`). Cancel 시 빈 각주 노드 삭제. Reference 자동 생성/동기화
- **WikiReferencesSection**: `wiki-footnotes-section.tsx` 내. WikiArticle.referenceIds 기반 불릿 목록. 모달 3모드 (search/create/edit). Library Reference와 동일 엔티티
- **footnote 에디터 티어**: `shared-editor-config.ts` `"footnote"` case. StarterKit(heading/codeBlock/horizontalRule/blockquote/list 전부 false) + Link + Underline + Placeholder
- **click-outside 가드 패턴**: `wiki-block-renderer.tsx` TextBlock — `.tippy-content, .tippy-box, [data-tippy-root], [data-radix-popper-content-wrapper], [role="menu"], [role="dialog"]` 전부 "내부"로 인식
- **각주 read-only 가드**: `footnote-node.tsx` handleClick + `footnotes-footer.tsx` openModal — `editor.isEditable` 체크. "Click to add content" 버튼도 read-only 시 숨김
- **FootnoteEditModal role="dialog"**: click-outside 가드가 모달을 인식하도록. 위키 TextBlock에서 각주 편집 시 에디터 언마운트 방지
- **위키 Footnotes/References 컴팩트 디자인**: TipTap EditorContent 폐기 → 단순 텍스트. `▶` chevron 토글 + `text-base` 헤더 + `text-[14px]` 내용. `[N]` 번호 크기 `text-[14px]` 통일
- **노트 NoteReferencesFooter (확장, PR #188)**: `footnotes-footer.tsx` 내. `note.referenceIds` store 직접 읽기 + 각주 referenceIds 중복 제거. 피커 모달 (검색/생성/편집 3모드, WikiReferencesSection 패턴 복제). `+` 버튼 + hover `×` 삭제. `plot:open-reference-picker` 이벤트로 외부 트리거 (슬래시 커맨드, Insert 메뉴). 빈 상태 숨기기 (referenceIds 있을 때만 표시). Reference 아이콘 = Book (RiBookLine)
- **em 기반 fontSize cascade (PR #188)**: 위키 타이틀/섹션/각주의 Tailwind rem/px 클래스를 em으로 전환. fontScale inline을 개별 heading에서 제거 → 섹션 wrapper `div.group/section`에 적용. 글로벌 Aa 스케일(WikiArticle.fontSize) + 개별 섹션 fontScale(WikiBlock.fontSize) CSS em cascade로 동시 동작
- **위키 텍스트 display 컴팩트 (PR #188)**: `.wiki-text-display` 클래스. `ProseMirror min-height:unset !important` + `p margin:0 !important`. 편집→읽기 전환 시 간격 점프 해소. 편집 중은 TipTap 기본 간격 유지

- **Expand/Collapse All (나무위키 패턴)**: `plot:set-all-collapsed` CustomEvent. 노트: `note-editor.tsx` chevron 버튼(PushPin 왼쪽), Details `open` attr 일괄 토글 + 이벤트 dispatch. 위키: `wiki-view.tsx` 기존 버튼에 이벤트 dispatch 추가. 리스너: `summary-node.tsx`, `footnotes-footer.tsx`(FootnotesFooter+NoteReferencesFooter), `wiki-footnotes-section.tsx`(WikiFootnotesSection+WikiReferencesSection)
- **위키 TextBlock BlockDragOverlay**: `wiki-block-renderer.tsx` WikiTextEditor에 BlockDragOverlay 래핑. `pl-8` 좌측 패딩 = 드래그 핸들 거터. 노트 에디터 TipTapEditor.tsx와 동일 패턴
- **위키 TextBlock 4코너 리사이즈**: `WikiBlock.editorWidth/editorHeight` persist (Store v75). 편집 모드에서만 적용 (읽기=full width). `block-resize-corner--tl/tr/bl/br` CSS 재활용. `⋯` 메뉴 "Reset editor size" (ArrowsIn). `useBlockResize` 훅 로직 인라인 (NodeView가 아니라 일반 React 컴포넌트라서)

## Store Slices (22 total, v94)
notes, workflow, folders, tags, labels, thread, maps, relations, ui, autopilot, templates, editor, workspace, attachments, ontology, reflections, wiki-collections, saved-views, wiki-articles, wiki-categories, references, global-bookmarks

- **Reference Usage 섹션**: `reference-detail-panel.tsx` — notes.filter + wikiArticles.filter로 사용처 목록. openNote/navigateToWikiArticle 클릭 네비게이션
- **Note History = ActivityTimeline 연결**: `side-panel-activity.tsx` — noteEvents 기반 타임라인 (기존 `activity-timeline.tsx` 재활용)
- **Wiki Activity 중복 정리**: Article Stats 삭제 (Detail Properties와 중복), Thread 메시지 삭제
- **Expand/Collapse All 항상 표시**: 접을 게 없으면 disabled + 흐릿. Details 토글 = DOM 클릭 (setNodeMarkup 대신). hasCollapsibles: details/summary/footnoteRef/referenceIds

## 나무위키 리서치 결과 (2026-04-14) — 도입 대상
- **Tier 1 인포박스 완료** 🎉: ✅ 대표 이미지+캡션 (PR #192), ✅ 헤더 색상 테마 (2026-04-14 밤), ✅ 접기/펼치기 (PR #192), ✅ 섹션 구분 행 (2026-04-14 밤), ✅ 필드 값 리치텍스트 (2026-04-14 밤)
- **Tier 2 새 블록**: 배너 블록 (배경색+제목+부제), 둘러보기 틀 (Navigation Box)
- **Tier 3 매크로**: 나이 계산 [age], D-Day [dday], Include (틀 삽입)
- **Tier 4 고급**: 상위/하위 문서 관계, 각주 이미지, 루비 텍스트
- **아키텍처 결정**: 모든 새 기능 = base 티어 (노트+위키 공용). ✅ Insert 레지스트리 단일화 완료 (PR #192, 3곳 중복 제거)

## 2026-04-14 세션 의사결정 (브레인스토밍)
- **Note/Wiki 2-entity 철학 확정** — 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. 2026-04-01 결정 재확인. 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[]). 렌더러는 위키 전용. 자세히: `docs/BRAINSTORM-2026-04-14-entity-philosophy.md`
- **템플릿 3층 모델** — Layer 1 Layout Preset (렌더러, 위키 전용) + Layer 2 Content Template (섹션 뼈대, Person/Place 등) + Layer 3 Typed Infobox. 노트 템플릿은 NoteTemplate slice 유지 (UpNote식 단순 복사).
- **노트 split = must-todo** — UniqueID extension으로 이미 가능 (top-level 노드 23종 영속 ID). 위키 splitMode UI 재활용. Medium × 2-3일 × PR 하나. 우선순위는 위키 디자인 강화 이후.
- **표류 종결** — 2026-03-30 PIVOT #1 (IKEA 전략) → 2026-04-01 ROLLBACK #2 (노션식 폐기) → 2026-04-14 FINAL (분리 유지 + 위키 디자인 강화). 향후 엔티티 통합 제안 금지.

## Completed PRs (recent)
- **PR #NEW (2026-05-07)**: Plot v3 Phase 0 cleanup (store v112)
  - `lib/types.ts`: SavedView.viewState.viewMode `"table"` → `"grid"` 교체 (view-engine ViewMode exact match)
  - `lib/view-engine/defaults.ts`: normalizeViewState legacy `"table"` → `"list"` rawViewMode helper
  - `lib/store/migrate.ts` / `lib/store/index.ts`: v112 idempotent migration
  - `app/globals.css`: `--v3-priority-{high,medium,low}: unset` `:root` + `.dark` 선언

- **PR #215 (2026-04-23)**: Wiki visual polish + Ontology rename + IDB fix
  - Graph → Ontology rename (editor-breadcrumb, linear-sidebar, view-header, secondary-panel-content, ontology-view)
  - Encyclopedia TOC: dark-only `white/XX` → design tokens (border-border-subtle / bg-secondary/20 / text-foreground/80)
  - Both modes: "최근 수정: N시간 전" updatedAt below title (`shortRelative()`)
  - Default TOC header: "Contents" uppercase → quiet "목차" (text-[11px] text-muted-foreground/50), max-w-[240px]
  - `plot-note-bodies` IDB DB_VERSION 1→2 (corrupted object store 복구)

- **PR #214 (merged 2026-04-22)**: Hard reset to PR #194 — Book Pivot 전면 롤백. PR #195-#213 폐기.

- **WIP (2026-04-14 밤, next PR)**: 인포박스 Tier 1 전체 (Tier 1-2 헤더 색상 + Default 인포박스 통합 + Tier 1-4 섹션 구분 행 + Tier 1-5 필드 리치텍스트)
  - **경로 A: TipTap `InfoboxBlockNode`** (노트 에디터 + 위키 TextBlock 내부 슬래시 `/infobox`)
    - `headerColor` attr 추가 (`string | null`, null=default `bg-secondary/30` class)
    - 헤더 div: `headerColor ? style={{ backgroundColor }} : bg-secondary/30 class`
  - **경로 B: `WikiInfobox` 컴포넌트** (위키 encyclopedia 레이아웃 상단 플로팅 인포박스)
    - `WikiArticle.infoboxHeaderColor?: string | null` 필드 추가 (optional, Migration 불필요)
    - `WikiInfobox` props에 `headerColor` + `onHeaderColorChange` 추가 — `onHeaderColorChange` 없으면 피커 자동 숨김 (read-only consumer 자동 대응)
    - `wiki-article-encyclopedia.tsx` editable 경로에서 `article.infoboxHeaderColor` + `usePlotStore.getState().updateWikiArticle({ infoboxHeaderColor })` 연결. 2개 호출 사이트 (center + left layout mode)
    - `wiki-article-reader.tsx` + `note-editor.tsx`는 변경 없음 — Note.wikiInfobox엔 color 필드 없고 onHeaderColorChange 미전달로 자동 숨김
  - **공통 (두 경로 동일)**: `HEADER_COLOR_PRESETS` 8종 (Default/Blue/Red/Green/Yellow/Orange/Purple/Pink, rgba 0.35 alpha), `hexToRgba(hex, 0.35)` 유틸, PaintBucket 버튼 (showColorPicker || headerColor → 상시, 아니면 hover-gated), 팝오버 `absolute right-2 top-[calc(100%+4px)]` 스와치 8개 + 구분선 + 커스텀 color input
  - **검증**: preview에서 (A) 노트 infobox Purple/Blue/Default, (B) 위키 Zettelkasten article encyclopedia layout에서 Edit → PaintBucket 노출 → Green 선택 → store.infoboxHeaderColor persist. `data-header-color` HTML serialize 확인
  - **경로 C: 위키 Default 레이아웃에도 인포박스 인라인 렌더** — `wiki-article-view.tsx` Aliases 뒤 + Category 앞 위치. encyclopedia와 동일 center/float-right 분기 (중앙 정렬일 때만 center, 아니면 float-right w-[280px]). editable일 때만 `onHeaderColorChange` 전달
  - **사이드바 Infobox 섹션 제거** — `wiki-article-detail-panel.tsx`의 `article.layout !== "encyclopedia"` 조건 섹션 삭제. 이전에는 Default layout 전용 사이드바 백업이었으나, 이제 Default도 본문에 인포박스 있으니 중복 제거. 검증: Default layout에서 visible infobox=1 (float-right 본문만), 사이드바 Infobox heading=false
  - **Tier 1-4 섹션 구분 행 (2026-04-14 밤)**: 나무위키식 그룹 헤더. `WikiInfoboxEntry.type?: "field" | "section"` optional + TipTap `InfoboxRow` 동일. 렌더: `type === "section"` → full-width `bg-secondary/40` + bold uppercase + value 숨김. Edit UI: 섹션 row용 넓은 input (placeholder "Section name", uppercase styling). "Add section" 버튼을 "Add field" 옆에 배치 (`flex items-center gap-4`). `handleAddSection`/`addSectionRow` 새 액션. backward compat — 기존 데이터 `type` 없으면 field 취급
  - **Tier 1-5 필드 값 리치텍스트 (2026-04-14 밤)**: 공용 `InfoboxValueRenderer` (`components/editor/infobox-value-renderer.tsx`). Tokenize 알고리즘: left-to-right 스캔, 각 위치에서 4개 matcher 중 가장 빠른 match 선택 (우선순위 image > wikilink > md-link > auto-url). 패턴: `![alt](url)` → `<img inline-block h-[1.25em]>`, `[[title]]` → wikilink (wikiArticles title/aliases → note title → dangling dashed), `[text](url)` → `<a target="_blank">`, `https?://...` → auto-link. 보안: `isSafeUrl` (http/https/data:image/ 경로만). 편집 모드는 raw text input 유지 (syntax 그대로), **읽기 모드에서만 리치 렌더** (WikiInfobox는 `!isEditing`, InfoboxBlockNode는 `!editable`). 검증: BIOGRAPHY section + Permanent Note wikilink + de.svg 국기 이미지 + Wikipedia md-link + luhmann.surge.sh auto-URL + NonExistent Article dangling 모두 정상 렌더. **Tier 1 인포박스 전체 완료** 🎉
  - **중장기 TODO (새 세션)**: `WikiInfobox` 컴포넌트 → `InfoboxBlockNode` 통합. 지금은 두 구현이 공존 (같은 프리셋/유틸 복제). 통합 시 `article.infobox` 스키마를 TipTap JSON 또는 infoboxNode 인스턴스로 전환 필요 (wiki-to-tiptap.ts, seeds, migrations 영향)

- **PR #192 (merged 2026-04-14)**: Y.Doc split-view sync PoC + Block Registry 단일화 + 인포박스 Tier 1-1/1-3
  - Y.Doc Split-View Sync PoC (`lib/y-doc-manager.ts` 싱글톤 registry + isFresh 플래그). `@tiptap/extension-collaboration` 바인딩. `?yjs=1` / `window.plotYjs(true)` / localStorage 3-way 플래그
  - Data-loss regression 2건: (1) stale Y.Doc binding — useState+useEffect → useRef + 렌더 중 동기 전환. (2) empty-content guard JSON threshold 실패 → plainText only 로 단순화
  - Block Registry 단일화 `components/editor/block-registry/` — 25+ entry 단일 source. SlashCommand.tsx (COMMANDS 배열), insert-menu.tsx (JSX 하드코드), FixedToolbar.tsx (인라인 체인 13개) 모두 registry 읽기로 마이그레이션. 새 블록 추가 = registry.ts 한 파일
  - 인포박스 Tier 1-1: 대표 이미지 + 캡션 (heroImage / heroCaption attrs, URL prompt, hover Add/Remove)
  - 인포박스 Tier 1-3: 접기/펼치기 (chevron 토글 + plot:set-all-collapsed 전역 이벤트 리슨). Atom node DOM attach 타이밍 → requestAnimationFrame 재시도 패턴
- **PR #191 (merged 2026-04-14)**: docs: 나무위키 리서치 결과 + TODO 최신화 + 아키텍처 결정
- **PR #190 (merged 2026-04-14)**: Reference Usage + Note History + Wiki Activity 정리 + chevron 비활성
  - Reference Usage 섹션 구현 (사용처 노트/위키 목록)
  - Note History ActivityTimeline 연결
  - Wiki Activity Stats 중복 제거
  - Expand/Collapse All 항상 표시 + 비활성 상태
- **PR #189 (merged 2026-04-13)**: Expand/Collapse All + 위키 TOC 버그 + TextBlock 드래그 핸들 + 4코너 리사이즈
  - 나무위키식 Expand/Collapse All (노트 chevron 버튼 + 위키 기존 버튼 확장)
  - plot:set-all-collapsed CustomEvent (Details/Summary/Footnotes/References 전부 대상)
  - TocBlockNode + TableOfContents wiki 티어 등록 (기존 버그 수정)
  - WikiTextEditor BlockDragOverlay 래핑 (에디터 내 블록 드래그 핸들)
  - WikiBlock.editorWidth/editorHeight persist + 4코너 리사이즈 핸들
  - Store v75 migration
  - Reset editor size 메뉴 (ArrowsIn)
- **PR #188 (merged 2026-04-13)**: 노트 References 시스템 + fontSize cascade + 위키 텍스트 컴팩트
  - Note.referenceIds: string[] + Store migration v74
  - NoteReferencesFooter 전면 확장 (store 연동, 피커 모달 3모드, +/× 버튼, 중복 제거)
  - /reference 슬래시 커맨드 + Insert 메뉴 Reference 항목
  - plot:open-reference-picker 이벤트 기반 API
  - 빈 상태 숨기기 (referenceIds 있을 때만 표시)
  - Reference 아이콘 = Book (RiBookLine)
  - 위키 fontSize em 전환 (rem→em, fontScale wrapper 이동)
  - 위키 텍스트 display 컴팩트 (ProseMirror min-height:unset, p margin:0)
- **PR #187 (merged 2026-04-13)**: 각주/Reference UX 개선
  - 각주 read-only 가드 (editor.isEditable 체크)
  - 위키 footnote 삽입 버그 수정 (FootnoteEditModal role="dialog")
  - 위키 Footnotes/References 컴팩트 디자인 (TipTap→텍스트, 토글, 사이즈 통일)
  - 노트 References 하단 섹션 (NoteReferencesFooter, 기본 collapsed)
  - Footnotes+References 통합 논의 (→ 다음 세션 P0)
- **PR #185 (merged 2026-04-12)**: 각주 모달 + References 하단 섹션 + footnote 티어 + 사이드패널 버그 수정
  - FootnoteEditModal (Title+Content+URL 통합 모달, 각주/레퍼런스 동일 UX)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록, 검색+생성+편집 모달)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 티어 (StarterKit 최소 + Link + Underline)
  - Reference.contentJson 추가
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
  - Reference 사이드패널 고착 버그 수정 (모달로 대체)
- **PR #183 (merged 2026-04-12)**: 위키 텍스트 블록 [[/@ 삽입 버그 수정 + 호버 프리뷰 글로벌 이동
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - async deleteRange stale range 수정
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #182 (merged 2026-04-12)**: 위키 각주 시스템 + 공유 유틸 추출 + 드롭다운 아이콘 통일
  - 위키 문서 레벨 각주 (위키백과 스타일, offset 기반 전체 연번)
  - 두 렌더러(Default/Encyclopedia) 공유 유틸 추출 (~300줄 중복 제거)
  - EncyclopediaFooter 중복 제거 (사이드바에서 이미 표시)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - MentionSuggestion/WikilinkSuggestion 아이콘 통일 (IconWiki + stub/article 색상)
  - Default 레이아웃 TOC 반응형 + 스크롤 수정
- **PR #186 (merged 2026-04-13)**: docs: CONTEXT.md + MEMORY.md 최신화 (PR #185, 각주 모달/References/Usage TODO)
- **PR #185 (merged 2026-04-12)**: 각주 모달 + References 하단 섹션 + footnote 티어
  - FootnoteEditModal (Title+Content+URL 통합 모달, 이벤트 기반 API, layout.tsx 글로벌 마운트)
  - WikiReferencesSection (위키백과 참고문헌 불릿 목록, 검색+생성+편집 모달)
  - WikiArticle.referenceIds (문서↔Reference 직접 연결)
  - footnote 에디터 티어 (StarterKit 최소 + Link + Underline)
  - Reference.contentJson 추가
  - click-outside 가드 확장 (Radix Portal + role=menu/dialog)
- **PR #184 (merged 2026-04-12)**: docs: CONTEXT.md + MEMORY.md 최신화 (PR #182-183, 위키 각주/유틸/아이콘/호버)
- **PR #183 (merged 2026-04-12)**: 위키 텍스트 블록 [[/@ 삽입 버그 수정 + 호버 프리뷰 글로벌 이동
  - tippy click-outside 가드 (드롭다운 클릭 시 에디터 닫힘 방지)
  - async deleteRange stale range 수정
  - NoteHoverPreview를 layout.tsx 글로벌로 이동
- **PR #182 (merged 2026-04-12)**: 위키 각주 시스템 + 공유 유틸 추출 + 드롭다운 아이콘 통일
  - 위키 문서 레벨 각주 (위키백과 스타일, offset 기반 전체 연번)
  - 두 렌더러(Default/Encyclopedia) 공유 유틸 추출 (~300줄 중복 제거)
  - 위키 텍스트 블록에 [[위키링크 + @멘션 + #해시태그 활성화
  - MentionSuggestion/WikilinkSuggestion 아이콘 통일
- **PR #181 (merged 2026-04-11)**: Library 리디자인 + Reference.history + Split View edge case 수정
  - Library Overview Bento Grid 리디자인 (Premium stat cards)
  - Reference.history 수정 이력 자동 기록 (created/edited/linked/unlinked, 50개 제한)
  - Store v73 migration (Reference.history backfill)
- **PR #176 (merged 2026-04-09)**: Peek-First 실험 완성 + Split-First 복귀 Phase 1
  - Peek-First 완성 (Phase 2~3.5) — wiki 지원, Empty State, 사이즈 시스템, back/forward, pin
  - 노트/위키 시각 구분 (StatusShapeIcon + wiki violet), MentionSuggestion 일관성
  - **피벗**: Peek UI가 chrome 레이어 안이라 동등한 에디터 느낌 불가능 → Split-First 복귀
  - **Phase 1**: SmartSidePanel 단일 인스턴스 + global state, Peek 탭 제거 (4탭), useSidePanelEntity
- **PR #175 (merged 2026-04-09)**: Cross-Note Bookmarks + Outline 개선 + Peek-First 아키텍처 + 워크플로우 개선
  - GlobalBookmark 시스템 (5 Phase): store slice + migration v72, extractAnchorsFromContentJson, Bookmarks 탭 2섹션(Pinned+ThisNote), WikilinkNode anchorId attr + 앵커 피커, 플로팅 TOC 핀
  - Outline 개선: TipTap JSON 기반 (markdown 파서 폐기), TOC 블록 우선 + 헤딩 fallback
  - Footnote 접기/펼치기: 기본 접힌 상태 "▶ FOOTNOTES (N)"
  - Peek-First 아키텍처 Phase 0+1: 사이드바 단일 책임 = layout.tsx, ResizablePanel id+order
  - 워크플로우: NEXT-ACTION.md + SESSION-LOG.md 도입
- **PR #174 (merged 2026-04-08)**: docs: CONTEXT.md + MEMORY.md 최신화 (v71, 21 slices, Split View)
- **PR #173 (merged 2026-04-08)**: Split View 사이드패널 분리 — primary/secondary 독립 SmartSidePanel
- **PR #172 (merged 2026-04-08)**: Split View 독립 패널 시스템 — 하이브리드 듀얼 에디터, PaneContext, secondaryHistory
- **PR #80**: Wiki system + Side Peek + soft-delete trash
- **PR #81**: 위키링크 UX 통합 — `[[` 하나로 통합
- **PR #84**: Architecture Redesign v2 Phase 1~5 완료
- **PR #85**: Phase 6 Wiki Evolution + 후속 작업 — auto-enroll, korean-utils, Graph 노드 형태, Wiki Overview 재구조, Calendar 승격, 위키 강등, Display 정리
- **PR #86**: Phase 7 Wiki Collection + Graph Insights + docs 정리
- **PR #91**: Custom Views + Calendar 리디자인 + 분포 패널 + 디자인 라이브러리
- **PR #88**: Filter & Display 시스템 v2 — Linear 철학 적용
  - FilterPanel 2단계 nested (hover 기반 side-by-side)
  - DisplayPanel 2모드 (List/Board, Table 제거)
  - List 모드 Linear식 렌더링 (status shape icon + 제목 + 칩 + 시간)
  - Status 형태 차별화 (○ Inbox / ◐ Capture / ● Permanent)
  - Priority 제거 (Pin + Labels로 대체)
  - Grouping/Sub-grouping 드롭다운 추가
  - view-configs 5뷰별 설정 분리
  - ViewState 확장 (subGroupBy, showThread, orderPermanentByRecency)
  - Links/Reads/Updated/Created 아이콘 구분자
- **PR #89**: 후속 개선 — EditorToolbar hooks 수정, Board toast, Grouping 동적 연동
- **PR #90** (WIP): 레이아웃 리팩토링 + List 디자인 품질 개선
  - List/Table 컬럼 디자인 Linear 수준으로 (선 제거, 연한 헤더, 44px 행)
  - "Order by X" 정렬 칩 (ViewHeader에 표시)
  - ViewDistributionPanel 신규 (Linear식 우측 데이터 분포 패널)
  - deprecated LayoutMode(6값) 완전 삭제
  - Research 모드 + 6개 서브프리셋 삭제
  - Zen 모드 삭제 → sidebarCollapsed + detailsOpen 독립 토글
  - WorkspaceMode 타입 삭제, store migration v44
  - Filter sub-panel hover 위치 동적 계산 (Linear식)
  - Quick Filter 클릭 연동

- **PR #101**: Board SubGroup Rows + Distribution Panel + 필터 토글
  - Board 컬럼 내 SubGroup(Rows) 렌더링 — 서브그룹 헤더 + 접기/펼치기 + COLUMN_CARD_LIMIT 유지
  - Display Panel Board 모드에 Rows + Group order 드롭다운 복원
  - Board에 ViewDistributionPanel 연결 (List와 동일한 Status/Folder/Tags/Labels 4탭)
  - Distribution 사이드바 항목 클릭 = 필터 토글 (List/Board 양쪽)
- **PR #100**: Linear Design Polish + Sub-group Order
  - 8-Phase 디자인 토큰 준수율 100% 달성 (~251건 위반 → 5건 의도적 유지)
  - globals.css에 11개 신규 시맨틱 토큰 추가 (sidebar-active, surface-overlay, hover-bg, active-bg, toolbar-active 등)
  - DESIGN-TOKENS.md에 Linear Polish Design Principles 6대 원칙 + Borderless Design 원칙 + Surface/인터랙션 토큰 문서화
  - DESIGN-TOKENS.md 다크테마 값 globals.css 실제값으로 동기화
  - linear-sidebar.tsx: 27건 rgba/hex → 시맨틱 토큰
  - view-header + filter-panel + display-panel: P0 라이트모드 깨짐 수정 (bg-[#1d1d20] → bg-surface-overlay)
  - notes-table.tsx: 24건 arbitrary value → 토큰 (text-[Npx], bg-white/, hex)
  - FixedToolbar + EditorToolbar + ColorPicker + TableMenu: 인라인 style → Tailwind (rgba(94,106,210,0.2) → bg-toolbar-active)
  - 나머지 ~20 파일: text-[Npx], bg-white/ 일괄 토큰화
  - Sub-group Order: ViewState.subGroupSortBy (default/manual/name/count) + 드롭다운 UI
  - Sub-group 드래그 순서 변경 (manual 모드)
  - Grouping/Sub-grouping 상호 배제 + 자동 리셋
  - Board 뷰에서 미지원 Rows/Group order 행 제거
  - Store migration v54→v58
- **PR #102**: 타이포그래피 밸런스 + 위키 카테고리 UX 대폭 개선
  - 위키/캘린더/스플릿 에디터 폰트 크기 조정
  - 카테고리 검색 필터, RECENT 최근 1개, 우클릭 컨텍스트 메뉴(Add subcategory/Rename/Delete)
  - 빈 공간 우클릭 "New category"
  - List 뷰 (Tree/List 전환), 전용 필터(Tier/Status), 디스플레이(Grouping/Ordering/토글/Display Properties)
  - 칼럼: Name/Parent/Tier/Articles/Stubs/Sub/Updated
  - 그룹핑: Tier별/Parent별/Family별 (Family=루트 조상 기준 계보+들여쓰기)
  - WikiCategory에 updatedAt 필드 추가 (store migration v61)
  - 카테고리 미선택 시 All Categories overview 표시
- **PR #103**: 카테고리 Board 뷰 + Notes Board 더블클릭 + 사이드바
  - Tree 모드 제거, List+Board 2모드 체제 전환
  - Board: Tier별 3칼럼(1st/2nd/3rd+), dnd-kit 드래그로 계층 이동
  - Board/List 공용 Columns/Rows/Sub-grouping 드롭다운 (Notes DisplayPanel 벤치마킹)
  - 전 칼럼 정렬 버튼 (7개: name/parent/tier/articles/stubs/sub/updated)
  - Display Properties 토글 → 실제 칼럼 표시/숨김 연동
  - Board Columns 드롭다운 → Tier/Parent/Family 보드 그룹핑 실제 반영
  - 우측 사이드바: All Overview / Category Detail / Batch Actions 3상태
  - Notes Board 더블클릭 → 에디터 열기 (싱글클릭=프리뷰)
  - Tier depth 무한 허용 (제한 해제), Board에서 3rd+ 합침
- **PR #120**: Unified Pipeline Phase 1~4 — Filter/Display/SidePanel 통합 + Design Spine + Discover 추천 엔진
- **PR #121**: Board UX — Trash→Tools, 드래그 선택, 그룹핑 컬럼 숨김, Tags 폐기, 필터 Status shape 아이콘, Mixed status 표시
- **PR #122**: Phase 7 즉시 개선 + 에디터 통합 프로젝트 플랜 수립
- **PR #123**: 에디터 Phase 1A+1B — Shared TipTap config 추출 (4-tier factory: base/note/wiki/template) + Title 노드 통합 (제목/본문 하나의 TipTap 에디터, title-node.ts 커스텀 노드, NoteEditorAdapter 변환 로직, note-editor.tsx title input 제거)
- **PR #125**: Phase 1C+ — Editor Toolbar Redesign + Side Panel 3→4탭 + Arrange Mode
  - Side Panel: Discover→Connections+Activity 분리. 4-tab (Detail/Connections/Activity/Peek). v64 migration
  - Connected/Discover 2-section model, Relations UI 삭제, Peek wiki fallback
  - Toolbar: h-14 bar, w-10 buttons, 42 items, Arrange Mode (dnd-kit), Color palette 16색
  - Editor context menu (우클릭), custom commands, InsertMenu 개선
- **PR #126**: Phase 1 커스텀 노드 + 에디터 UX 개선
  - TOC Block, Callout Block, Align 드롭다운 통합, BacklinksFooter 삭제
- **PR #128**: Title 노드 폐기 (UpNote 스타일) + 블록 드래그 인프라
  - title-node.ts 삭제, TitleDocument 제거, Store v65
  - 첫 번째 블록(H2)이 자동 타이틀 역할
  - GlobalDragHandle + AutoJoiner 설치, 커스텀 노드 not-draggable
- **PR #129**: dnd-kit 블록 리오더 + 에디터 UX 개선
  - dnd-kit Phase 1~4, GlobalDragHandle 제거, Backspace heading→paragraph
  - H 드롭다운 위치 수정, EditorStyles.css hsl(var()) 전면 수정, H2 타이틀 28px
- **PR #131 (WIP)**: 에디터 Phase 1 확장 — Columns 완성, 플로팅 TOC, @멘션, 앵커/북마크, Side-drop 개선
- **PR #130 (WIP)**: 테이블 UX 대폭 개선
  - TableBubbleMenu (Row/Col/Merge/Split/Align/Bold/Color/Header/Delete)
  - Delete 키 빈 셀 선택 → 행/열 삭제 (prosemirror-tables 직접 import)
  - Tab/Shift+Tab 셀 이동, TableCell backgroundColor extend
  - Backspace after table → table 삭제
  - 드래그 핸들 최상단 위치

- **PR #138**: 에디터 블록 UX 일괄 개선 + TOC 리디자인
  - Columns: 다크모드 테두리 opacity→rgba(255,255,255,0.2), Tab→다음 컬럼 이동
  - Toggle: persist:true, 노션식 리디자인(배경/테두리 제거, flex 레이아웃), 접기/펴기 CSS 수정
  - TOC: 자동 헤딩 수집 제거 → 수동 편집 + BlockPicker(+버튼=문서 내 블록 검색, 1클릭 추가+링크), 더블클릭 편집, 드래그 순서변경, Tab 들여쓰기, id 기반 scrollToId
  - Merge Blocks: 우클릭 메뉴, 멀티선택→hardBreak 병합. Make Block→Wrap in 리네이밍
  - Add to TOC: 우클릭 메뉴, 텍스트 선택→TOC 항목 자동 추가
  - Delete Block: 우클릭 메뉴 맨 아래, 모든 블록 적용, compound 블록(details/columns) skipTypes
  - 인포박스: 읽기모드 readOnly+버튼 숨김, Add row hover-only (group/infobox)
  - Side-drop 컬럼 자동생성 제거 (Insert 메뉴로만)
  - All Notes 사이드바 Inbox 위 추가
  - Memo 라벨 자동 부여 (createNote + rehydrate backfill)

- **PR #139**: 노트참조 통합 인터랙션 + Synced Block + 블록 리사이즈 + 컬럼 UX
  - 노트참조 통합: 호버 프리뷰 (note-hover-preview.tsx, 300ms delay, IDB body), 클릭→Peek, Ctrl+클릭→이동
  - 공통 유틸: `lib/note-reference-actions.ts` (handleWikilinkClick, handleMentionClick, resolveNoteByTitle/ById)
  - WikilinkDecoration: 드롭다운/아이콘 제거 → mouseover/click 통합 인터랙션
  - MentionInteractionExtension: ProseMirror Plugin DOM 이벤트 위임 (@mention 클릭/호버)
  - NoteEmbed → Synced Block: `synced` 속성 토글, base 티어 인라인 TipTap, 300ms 디바운스 저장
  - 블록 리사이즈: `useBlockResize` 훅 + `BlockResizeHandles` 컴포넌트 (8종 블록 적용: TOC/Columns/NoteEmbed/Infobox/Callout/Query/Summary/ContentBlock)
  - width + height 속성 추가, 코너 드래그=가로+세로, 엣지 드래그=가로만, 리셋 버튼 (헤더 통합)
  - Side-drop 컬럼 복원: 15% 엣지 감지 → 컬럼 생성, columnsBlock 위 드래그 → 기존 셀에 삽입
  - Move out of Column: 우클릭 메뉴, columnCell 내 블록 → columnsBlock 아래로 이동
  - Turn Into: atom 노드에서 숨김
  - Gapcursor 추가 (빈 컬럼 셀 클릭 가능)
  - 컬럼 구분선 드래그: pixel 기반 colWidth, 양쪽 셀 동시 업데이트, fr 단위 그리드 (잔상 이슈 잔존)
  - 에디터 max-width 제거 (text-align left/right 정확하게 동작)
  - onOpenChange로 컨텍스트 메뉴 selection 캡처 수정

- **PR #143**: 위키 TextBlock TipTap 전환 + Encyclopedia 편집 버그 수정
  - TextBlock: textarea → lazy-mount TipTap 에디터 (wiki tier = base extensions)
  - WikiBlock.contentJson 필드 추가 (TipTap JSON, content는 plaintext fallback)
  - WikiBlockBody.contentJson IDB 저장 지원
  - `useWikiBlockContentJson` 훅 신규 (IDB에서 content + contentJson 로드)
  - debounce 300ms 저장 (IDB + store 동시)
  - Encyclopedia 레이아웃 editable 버그 수정: EncyclopediaContentBlock에 isEditing prop 전달

- **PR #144 (WIP)**: Encyclopedia 폴리싱 + 위키 에디터 툴바 초안
  - Contents 박스: CSS resize → pointer drag 리사이즈 (우측 핸들, 180~600px)
  - Encyclopedia 폰트 크기 업: 섹션 H2 text-lg→xl, H3 text-note→base, H4 text-2xs→sm, Contents 항목 text-note→sm
  - WikiTextEditor 하단 고정 미니 툴바: B/I/S/Code + H2/H3 + BulletList/OrderedList/Blockquote
  - **TODO**: 나무위키/위키피디아 에디터 툴바 리서치 후 풀 에디터 수준으로 업그레이드 필요

- **PR #146**: 위키 Phase 2B 대규모 업데이트
  - TextBlock 리치 읽기 모드: `@tiptap/html` generateHTML + createRenderExtensions (렌더링 전용 확장 세트)
  - Encyclopedia 하단 참조 섹션: Sources + See Also + Article Info (위키피디아 스타일)
  - SidePanel Context 시스템: `SidePanelContext` 타입 (note | wiki), `useSidePanelEntity` 공용 훅, 4탭 위키 대응
  - WikiArticleDetailPanel 신규: 위키 문서 Detail 패널 (타입, aliases, categories, infobox, sections, dates)
  - 카테고리 UI 전면 개편: InlineCategoryTags 트리 드롭다운 피커, 검색=생성 패턴, 노드 옆 [+] 서브카테고리, 플랫 표시 (위키피디아식) + hover tooltip breadcrumb
  - 글로벌 fontSize (Aa 버튼): WikiArticle.fontSize 필드, em 기반 wrapper 적용, S/M/L/XL 통일 (0.85/1/1.15/1.3)
  - contentAlign (Left/Center): WikiArticle.contentAlign 필드, Center=max-w-4xl mx-auto
  - 섹션 전체 접기/펼치기: chevron 토글 버튼
  - 타이틀/Aliases 인라인 편집: 양쪽 레이아웃 (default + encyclopedia)
  - Add block Content 그룹: Table/Infobox/Callout/Blockquote/Toggle/Spacer (Text 블록 + 초기 contentJson)
  - Copy to new article: 비파괴적 섹션 복사 (splitWikiArticle의 copy 버전)
  - 시드 카테고리 7개 추가 (v68 마이그레이션): CS, Philosophy, Productivity 등
  - 섹션 헤딩 사이즈 업: H2 text-2xl, H3 text-xl, H4+ text-lg
  - 섹션 번호 밝기 업: text-accent/50 → text-accent/80
  - FROM NOTE 리치 렌더링: IDB body 로드 + generateHTML + note.updatedAt 실시간 반영
  - Bookmarks 탭 layout.tsx 누락 수정
  - before-work 스킬 개선: docs/plot-discussion/*.md 전체 읽기 필수화
  - Store v67 → v69

- **PR #150 (WIP)**: Home 필터 연동 + Phase 4 Partial Quote + 호버 프리뷰 리디자인 + 위키링크 컨텍스트 메뉴 + 고아 노트 제안
- **PR #151**: Stub 부활 + Create Wiki + WikilinkSuggestion 버그 수정 + Quote UX + 호버 프리뷰 Edit 모드 + [[드롭다운 WikiArticle
- **PR #152 (WIP)**: Unresolved Links 전환 + 호버 프리뷰 TipTap 통합 + Pin UX + Note/Wiki 링크 시각 구분
  - "Red Links" → "Unresolved Links" 리브랜딩 (11파일)
  - 호버 프리뷰: generateHTML 폐기 → 항상 NoteEditorAdapter (editable 토글). 640px 카드
  - Pin: 모듈 레벨 상태, 위키링크/멘션 클릭으로 토글, accent 테두리 + PushPin 아이콘
  - data-hover-preview 가드 (프리뷰 안 재귀 방지)
  - 4-way wikilink: Note=보라밑줄, Wiki=teal칩, Stub=amber점선, Dangling=gray점선
  - `[[wiki:Title]]` prefix 방식 — Wiki 선택 시 자동 삽입, `wiki:` 숨김
  - Plain text copy (⋯ 메뉴 "Copy text")
  - 호버 프리뷰 버그 수정 4건 (mouseup 누수, quote deps, pin bubbling, note assertion)

- **PR #160 (WIP)**: WikiEmbed + 변환 함수 + Wikilink atom 노드 + 브레인스토밍
  - **WikiEmbed**: 노트 안에 위키 문서 라이브 임베드 (wiki-embed-node.tsx). 전체 Embed + 부분 Embed (sectionIds 속성). WikiArticleEncyclopedia 렌더
  - **WikiPickerDialog**: 위키 아티클 선택 다이얼로그 (wiki-picker-dialog.tsx). SlashCommand "Embed Wiki" 항목
  - **위키→TipTap 변환 함수**: wikiArticleToTipTap() + wikiArticleToPlainText() (lib/wiki-to-tiptap.ts). 호버 프리뷰 ⋯ 메뉴 "Copy to note"
  - **Wiki Quote 활성화**: noteType !== "wiki" 가드 제거. 위키에서는 select-all 스킵, 드래그 선택 필수
  - **위키 호버 프리뷰 개선**: WikiArticleView → WikiArticleEncyclopedia로 교체 (인포박스+Contents 인라인 표시). 위키용 Embed 버튼 + 섹션 피커 (체크박스 TOC, 전체/부분 선택)
  - **Articles/Stubs 카운트 버그 수정**: wiki-list.tsx counts.articles에서 stubCount 차감, dashFilter==="articles" 필터 추가
  - **Wikilink atom 노드 전환**: WikilinkDecoration(텍스트 기반) → WikilinkNode(atom inline 노드). 커서 진입 불가, 찢어짐 방지. WikilinkInteractionExtension 신규 (클릭/호버/우클릭)
  - **시드 데이터 자동 복원**: onRehydrateStorage에서 notes.length === 0이면 시드 강제 주입
  - **before-work/after-work 개선**: MEMORY.md를 Source of Truth로, worktree merge 로직 추가, CONTEXT.md↔MEMORY.md 정합성 검사
  - **브레인스토밍**: docs/BRAINSTORM-2026-04-06.md — 각주, 인포박스 고도화, 나무위키 틀, Library 6번째 공간, Side Panel 풀페이지 확장, 요약 엔진 등 8개 Phase 계획
  - 호버 프리뷰 버그 수정 4건 (mouseup 누수, quote deps, pin bubbling, note assertion)

- **PR #161 (WIP)**: Footnote/Reference 시스템 + WikiQuote 폐기
  - **WikiQuote 폐기**: WikiQuoteExtension.ts, WikiQuoteNode.tsx, lib/quote-hash.ts 삭제. shared-editor-config (3곳), note-editor.tsx, note-hover-preview.tsx, side-panel-peek.tsx, wiki-article-reader.tsx, wiki-collection-sidebar.tsx에서 관련 코드 제거 (~350줄)
  - **Reference store slice**: `lib/store/slices/references.ts` 신규. `Reference` 타입 (title/content/fields[]/tags). CRUD 3액션. Store v70 migration
  - **FootnoteRef 인라인 노드**: `components/editor/nodes/footnote-node.tsx` 신규. atom inline, 자동 번호(doc 순서), 호버 팝오버(300ms delay/200ms hide, z-100), 더블클릭 편집(textarea), 빈 content 자동 편집 모드
  - **FootnotesFooter**: `components/editor/footnotes-footer.tsx` 신규. editor.on("update") 실시간 동기화, 중복 제거, `[N]` 클릭→본문 스크롤(양방향), 싱글클릭 인라인 편집(setNodeMarkup으로 attrs 직접 수정)
  - **SlashCommand Footnote 항목**: Asterisk 아이콘, nanoid(8) id, 빈 content로 삽입
  - **`[[`/`@` References 섹션**: WikilinkSuggestion + MentionSuggestion에 References 섹션 추가. 기존 Reference 검색/선택 → footnoteRef 삽입. Create Reference 항상 표시 (q.length > 0). 새 Reference 자동 생성 + referenceId 연결
  - **명칭 결정**: 에디터/유저 접점 = "Footnote", 저장소/Library = "References"

- **PR #162 (WIP)**: Smart Link + 툴바 정리 + 커스텀 다이얼로그
  - **툴바 미사용 기능 제거**: Twitch, SpellCheck, InvisibleChars, CurrentLineHighlight 전부 삭제. CurrentLineHighlight.ts 파일 삭제, settings-store에서 관련 필드 제거
  - **Smart Link — LinkCard TipTap 노드**: `components/editor/nodes/link-card-node.tsx` 신규. atom block, favicon(Google API), 더블클릭 제목/설명 편집, 새 탭 열기
  - **URL 감지 유틸**: `lib/editor/url-detect.ts` 신규 (detectUrlType: youtube/audio/generic, isValidUrl, extractDomain)
  - **URL Paste Handler**: 일반 URL 붙여넣기 → 자동 LinkCard 삽입 (YouTube/Audio는 기존 확장이 처리, 텍스트 선택 중이면 하이퍼링크)
  - **YouTube+Audio→Embed 통합**: 2버튼 → 1버튼. toolbar-config, FixedToolbar, insert-menu, insertable-blocks, SlashCommand(`/embed`) 전부 통합
  - **커스텀 URL 다이얼로그**: `components/editor/url-input-dialog.tsx` 신규. Portal 기반, link/embed 2모드, URL 타입 감지 힌트. `window.prompt` 전면 교체 (FixedToolbar, EditorToolbar, editor-context-menu, insert-menu, wiki-article-view, wiki-article-encyclopedia)
  - **Link+Embed 나란히 배치**: toolbar-config에서 embed를 link 바로 뒤로 이동
  - **전체 툴바 버튼 설명 추가**: 30개 버튼 title 속성에 "Name — description (shortcut)" 형식 영어 설명

- **PR #163**: Editor Toolbar Redesign — Remix Icon + Overflow UX + Indent + Embeds
  - **Remix Icon 전환**: Phosphor light → Remix Icon. 32개 에디터 파일 교체. `lib/editor/editor-icons.ts` 중앙 barrel 파일 (101개 매핑). 앱 나머지는 Phosphor 유지
  - **H/B 텍스트→아이콘**: `<span>H</span>` → RiHeading, `<span>B</span>` → RiBold
  - **More Actions ⋯ 오버플로우 UX**: Pin 고정 모드 (외부 클릭에도 안 닫힘), 아이콘+라벨 그리드, 우클릭 Favorites (settings store persist), 서브패널 (컬러피커/테이블 호버선택/이미지), 메뉴 340×520px
  - **Move Up/Down 버그 수정**: `isInList` 상태 추가, 리스트 바깥에서 disabled
  - **Math 기본 hidden**: inlineMath/blockMath 툴바 기본 비표시 (SlashCommand로 접근)
  - **Indent 수정**: blockquote 감쌈 → margin-left 레벨 (Notion 방식). `indent-extension.ts` 신규 (0-8단계, 24px/단계). Enter 시 indent 상속
  - **Insert 메뉴**: Embed Wiki + Footnote 항목 추가
  - **WikiPickerDialog 업그레이드**: 960px 다이얼로그, Category 필터 칩, 2줄 레이아웃 (제목+aliases), 카운터, 중복 제거
  - **Embed Note 기본 Synced**: `synced: true` 기본값. 삽입 시 전체 내용 인라인 표시
  - **WikiEmbed 높이 제한 해제**: `max-h-[500px]` 제거 → 전체 문서 펼침
  - **각주 팝오버 잘림 수정**: `left:50%+translateX(-50%)` → `left:0` 좌측 정렬
  - **Math 직접 노드 삽입**: `$...$` 텍스트 → `insertContent({ type: "inlineMath/blockMath" })` 직접 노드

- **PR #165**: Library 6th space + References UI + footnote auto-link
  - Library 6번째 Activity Bar 공간 (Overview/References/Tags/Files 사이드바 NavLink)
  - References 풀페이지 리스트 (검색/Quick Filter/정렬/멀티선택)
  - ReferenceDetailPanel — SmartSidePanel SidePanelContext "reference" 타입 확장
  - 각주→Reference 자동 연결 (save 시 createReference + referenceId 동기화)

- **PR #167**: Library Overview 리디자인 + Tags/Files 뷰
  - Library Overview — wiki-dashboard.tsx 패턴, MiniStat 3-col + 2-col ContentCard Bento Grid
  - Tags 뷰 실제 구현 (색상 dot + 노트 카운트 + 검색)
  - Files 뷰 실제 구현 (All/Images/Documents 필터)
  - Sidebar Tags/Files 활성화 (NavLink + 카운트 뱃지)
  - SmartLinkPaste 버그 수정 (view.hasFocus() 가드)

- **PR #168**: Tags Library 통합 + soft delete + 네이밍 통일
  - Notes "More"에서 Tags 제거 → `/library/tags` 리다이렉트
  - References/Files soft delete (trashed/trashedAt 필드, restoreReference, permanentlyDeleteReference)
  - "TOP TAGS" → "RECENT TAGS" + 최근 사용 노트 기준 정렬
  - Store v71 migration

- **PR #169**: Reference 하이브리드 + 호버 프리뷰 강화 + Trash/Library UX
  - referenceLink TipTap 인라인 atom 노드 (에메랄드 칩, URL 클릭, Ctrl+클릭→사이드패널)
  - `[[`/`@` 자동 분기 — 기본=footnoteRef, Shift+클릭/Enter=referenceLink
  - 호버 프리뷰 강화 — 리사이즈(우하단 드래그) + 드래그 이동(Pin 시 헤더) + Pin 버튼 + 본문 flex-1
  - Trash 뷰 References/Files 탭 추가
  - Library Files 직접 업로드 UI (ViewHeader + file input → addAttachment)
  - References hover 체크박스, Bookmark 툴바/Insert 메뉴 추가

- **PR #172**: Split View 독립 패널 시스템 — 하이브리드 듀얼 에디터
  - `PaneContext` 신규 (primary/secondary 컨텍스트 구분)
  - `secondaryHistory[]` 독립 네비게이션, `secondaryRoute/secondarySpace` 독립 라우팅 (table-route.ts 이중화)
  - `setRouteInterceptForSecondary` — 우측 클릭 시 글로벌 라우트 인터셉트
  - `SecondaryPanelContent` — note/wiki/뷰 렌더링, breadcrumb 드롭다운으로 6 space 전환
  - `usePaneOpenNote` + `usePaneActiveRoute` 훅

- **PR #173**: Split View 사이드패널 분리 — primary/secondary 독립 사이드패널
  - primary/secondary pane 각각 독립 SmartSidePanel 인스턴스
  - 사이드바는 primary(좌측) 전용 유지
  - SidePanelContext per-pane 분리

## Architecture Redesign v2 — ALL PHASES COMPLETE

**사상**: 팔란티어 × 제텔카스텐. Layer 1(Raw Data) → Layer 2(Ontology) → Layer 3(Wiki) → Layer 4(Insights). LLM/API 사용 안 함.

### 구현 Phase (7단계, 전부 완료)
1. **Foundation** — v41 (wikiStatus), v42 (workspaceMode), 2-level routing ✅
2. **Layout Automation** — WorkspaceMode 3개, auto-collapse ✅
3. **Activity Bar + Top Utility Bar** — 5-space navigation ✅
4. **Sidebar Refactor** — 컨텍스트 반응형, PlotIcons ✅
5. **Breadcrumb** — space > folder > title ✅
6. **Wiki Evolution** — auto-enroll, wikiStatus lifecycle, 초성 인덱스, Graph 노드 형태 ✅
7. **Wiki Collection** — Collection slice (v43), WikiQuote TipTap node, Extract as Note, Collection sidebar ✅

### Key Design Decisions
- **Activity Bar 6-space**: Inbox / Notes / Wiki / Calendar / Graph / Library
- **Wiki 사이드바 = Overview 단일 진입**: stat 카드 클릭으로 드릴다운
- **WikiStatus 2단계**: stub(미완성) → article(완성). Red Link = computed. draft/complete 제거 (v60)
- **위키 강등 = article→stub 1단계**: stub은 바닥(강등 없음, 삭제만)
- **Display = List/Board 2모드**: Table 제거 — List의 Display Properties가 Table 역할 (Linear 철학). List에서 컬럼 켜면 테이블처럼 보임.
- **Graph Health → /graph-insights 페이지로 분리**: 사이드바는 필터/컨트롤 패널
- **Ontology → Graph 네이밍 분리**: Ontology = 엔진, Graph = 시각화
- **Show thread = Show sub-issues 매핑**: 노트앱에서 Linear의 sub-issue → Thread로 대체
- **Order permanent by recency**: 최근 Permanent 승격 노트 우선 정렬
- **Sub-grouping 필수**: 1만개+ 노트 스케일 기준 설계, collapse/expand
- **뷰별 Display 분리**: Notes=풀스펙(2모드 List/Board), Wiki=2모드, Inbox=List only, Graph/Insights=모드 없음
- **Priority 삭제**: 노트앱에서 불필요 — Pin + Labels로 충분. 모든 뷰에서 무의미
- **Grouping collapse/expand**: 그룹 헤더 클릭으로 접기/펴기, chevron 회전 인디케이터
- **Filter 2단계 nested**: Linear식 side-by-side 패널(hover 기반)

## Current Direction (as of 2026-04-14)

### 최신 방향 (2026-04-14 확정)
- **Note/Wiki 2-entity 철학 확정** — 엔티티 통합 논의(Alpha/Beta/Gamma) 전부 폐기. 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[]). 렌더러는 위키 전용. 자세히: `docs/BRAINSTORM-2026-04-14-entity-philosophy.md`
- **위키 디자인 강화 우선** — 엔티티 통합보단 디자인 약점 해결 (`wiki-color` 프리셋 + themeColor + Hatnote/Ambox/Navbox)
- **위키 템플릿 3층 모델** — Layer 1 Layout Preset + Layer 2 Content Template + Layer 3 Typed Infobox. 노트 템플릿은 NoteTemplate slice 유지 (UpNote식)
- **노트 split = must-todo** — UniqueID extension으로 이미 가능. Medium × 2-3일. 위키 디자인 강화 이후 Phase.
- **Tier 1 인포박스 완료** 🎉 — 대표 이미지+캡션 (PR #192), 헤더 색상 테마, 접기/펼치기 (PR #192), 섹션 구분 행, 필드 값 리치텍스트
- **긴급 버그 수정 (2026-04-14)** — `wiki-view.tsx` article view 우선순위 로직. wikiViewMode가 merge/split/category면 article view 숨김 (기존 버그였음)

### 과거 방향 결정 (히스토리)
- **독립 공간 구조 유지, 노션식 통합 템플릿 폐기** (2026-04-01)
- **위키 인프라 강화 우선** — WikiEmbed, 변환 함수, 각주, 인포박스 고도화 (2026-04-06)
- **Library 6번째 공간 추가 결정** — 이미지/파일/URL 독립 엔티티 (2026-04-06)
- **에디터 아이콘 Remix Icon 전환** — Phosphor light → Remix. 에디터 전용, 나머지 Phosphor 유지 (2026-04-07)
- **P0+P1 병행 전략** — Library 뼈대 → References UI → 각주 자동 연결 → 고도화 순서 (2026-04-07)
- **Library 사이드바 NavLink 전환** — 상단 탭 제거 → 사이드바 NavLink (Overview/References/Tags/Files). Wiki 패턴 동일 (2026-04-07)
- **Reference 디테일 = SmartSidePanel** — 별도 풀페이지 에디터 없음. 사이드 패널에서 편집 충분 (2026-04-07)
- **Tags Library 통합** — 13개 앱 리서치. 태그를 2개 사이드바 섹션에 동시에 보여주는 앱 0개. Capacities 패턴 채택. Notes "More"에서 Tags 제거, `/tags` → `/library/tags` 리다이렉트 (2026-04-08)
- **References/Files soft delete** — Tags처럼 trashed 필드. 복원 가능해야 함. hard delete → 확인 다이얼로그만으론 불충분 (2026-04-08)
- **Reference = 통합 참고자료 (하이브리드)** — url 필드 있으면 Link형, 없으면 Citation형. 기본=footnoteRef, Shift=referenceLink. 위키백과 패턴 (2026-04-08)
- **호버 프리뷰 강화** — 리사이즈(400~960px) + 드래그 이동(Pin 시) + Pin 버튼 액션바 + 본문 flex-1 (2026-04-08)
- **듀얼 에디터 = 독립 뷰 (구현 완료)** — VS Code/Obsidian 패턴. 좌/우 패널이 각각 독립 네비게이션. table-route 이중화 완료
- **🎯 Split-First 복귀 (2026-04-09~10)** — Peek-First 실험 후 피벗. Peek UI가 chrome 레이어 안이라 동등한 에디터 느낌 불가 → Split view + 단일 SmartSidePanel focus-following 모델로 전환. Phase 1 완료 (PR #176). Phase 2~7 진행 중: store cleanup → peek 파일 제거 → 리네이밍 → focus tracking → 검증 → docs
- **사이드바 단일 책임 = layout.tsx (2026-04-09)** — WorkspaceEditorArea에서 사이드바 코드 전부 제거. 4가지 케이스 명확한 분기 (단독뷰/단독에디터/뷰스플릿/에디터스플릿). ResizablePanel id+order 추가로 동적 렌더링 fix
- **워크플로우 개선 (2026-04-09)** — NEXT-ACTION.md (다음 즉시 액션 1~3개) + SESSION-LOG.md (시간순 세션 기록) 도입. before-work/after-work 스킬 확장으로 크로스 머신 작업 매끄럽게

### 이번 세션 완료 (2026-04-08 오후, PR #169)
- **Trash 뷰 References/Files 탭**: TRASH_TABS 8개 확장, TrashEntityList references/files 처리
- **Library Files 직접 업로드 UI**: ViewHeader + button → file input → addAttachment + persistAttachmentBlob
- **References hover 체크박스**: Notes 패턴 (별도 칼럼, invisible group-hover:visible)
- **Bookmark 툴바/Insert 메뉴 추가**: anchorMark 삽입, 슬래시 커맨드와 통합
- **referenceLink TipTap 노드**: 인라인 atom, 에메랄드 칩, 클릭→URL, 호버 팝오버, Ctrl+클릭→사이드패널
- **Reference URL 전용 입력란**: 사이드패널 Title↔Content 사이 Globe 아이콘, Fields에서 url 키 자동 분리
- **Quick Filter "Links"**: References 뷰 4번째 필터 (url 필드 있는 Reference)
- **`[[`/`@` 자동분기**: 기본=footnoteRef, Shift+클릭/Enter=referenceLink. WikilinkItem/MentionItem에 referenceUrl + _shiftKey 추가
- **footnoteRef URL 표시**: 팝오버에 🔗 도메인 링크 + FootnotesFooter에 줄바꿈 URL (flex-wrap)
- **호버 프리뷰 버그 수정**: wikilink-node.ts의 data-hover-preview 제거 (self-matching guard 문제)
- **호버 프리뷰 강화**: 리사이즈(우하단 드래그) + 드래그 이동(Pin 시 헤더) + Pin 버튼 + 본문 flex-1
- **사이드바 Bookmarks 클릭→스크롤**: data-anchor-id 속성 + scrollIntoView 추가
- **Peek 툴바 하단 이동**: position="bottom"
- **Hydration 에러 수정**: PanelGroup 고정 id (main-layout, workspace-editor)
- **Store version**: v71 유지 (migration 변경 없음)

### 이번 세션 완료 (2026-04-07, PR #163 + #164 + #165)
- **에디터 툴바 Remix Icon 전환**: 32파일 101아이콘, 중앙 barrel, H/B 아이콘화
- **More Actions 오버플로우 UX**: Pin 고정 + Favorites(우클릭 persist) + 서브패널(컬러/테이블/이미지)
- **Indent margin-left**: blockquote 감쌈 → 24px 8단계 (indent-extension.ts)
- **Library 6번째 Activity Bar 공간**: 사이드바 NavLink(Overview/References/Tags/Files), 서브라우트 4개
- **Library Overview 대시보드**: References/Tags/Files stat 카드 + Recent 리스트
- **References 풀페이지 리스트**: 검색, Quick Filter(All/Linked/Unlinked + Field keys), 정렬(Name/Updated), 전체선택, 멀티선택 + 플로팅 액션바(Delete/Export/Add Field)
- **ReferenceDetailPanel**: SmartSidePanel 확장, SidePanelContext `"reference"` 타입, Title/Content/Fields 인라인 편집
- **각주→Reference 자동 연결**: save 시 자동 createReference + referenceId 연결, content 동기화
- **Insert 메뉴 추가**: Embed Wiki + Footnote 항목
- **WikiPickerDialog 업그레이드**: 960px, Category 필터, 2줄 레이아웃, 중복 제거
- **Embed Note 기본 Synced**, WikiEmbed 높이 제한 해제
- **각주 팝오버 좌측 잘림 수정**, Math 기본 hidden, Move Up/Down disabled
- **Wiki 전체선택 버튼 추가**

### 이번 세션 완료 (2026-04-08, PR #167 + 후속 커밋)
- **Tags Library 통합**: Notes "More"에서 Tags 제거 → `/library/tags`로 리다이렉트. TagsView 풀 CRUD Library에서 렌더
- **섹션 네이밍 통일**: "TOP TAGS" → "RECENT TAGS" + 최근 사용 노트 기준 정렬
- **References/Files soft delete**: trashed/trashedAt 필드 추가. deleteReference → soft delete, restoreReference, permanentlyDeleteReference. Attachments 동일. Store v71 migration
- **docs/TODO.md 생성**: 크로스 머신 백로그 공유용

### 이번 세션 완료 (2026-04-07 오후, PR #167)
- **SmartLinkPaste 버그 수정**: view.hasFocus() 가드 → hidden editor에 LinkCard 삽입 방지
- **window.prompt 전면 폐기**: embed-url-request.ts (CustomEvent+callback 브릿지) 신규. insertable-blocks.ts + SlashCommand.tsx → requestEmbedUrl() 콜백. note-editor.tsx에 onEmbedUrlRequest 리스너 + UrlInputDialog. library-view.tsx Add Field 인라인 다이얼로그 (Portal 기반)
- **Library Overview 리디자인**: wiki-dashboard.tsx 패턴 참고. MiniStat 3-col (References/Tags/Files) + 2-col ContentCard (Recent Refs, Top Tags, Recent Files, Unlinked Refs). max-w-5xl 센터 정렬
- **Tags 뷰 구현**: Coming soon → 실제 태그 목록 (색상 dot + 노트 카운트 정렬 + 검색)
- **Files 뷰 구현**: Coming soon → 첨부파일 목록 (All/Images/Documents 필터)
- **Sidebar Tags/Files 활성화**: disabled span → NavLink + 카운트 뱃지

### 다음 우선순위 (2026-04-11 기준)
- **P1 진행 중**:
  - ✅ Library Overview 리디자인 (위키 대시보드 스타일)
  - ✅ References DisplayPanel (정렬 + 그룹핑)
  - ✅ Reference.history (수정 이력 타임라인, store v73)
  - 🔴 위키 레이아웃 프리셋 시스템 (2개 렌더러 → 1개 통합)
- **P2**: 인사이트 허브, 각주 리치텍스트, 인포박스 고도화

### 리서치: Library 고도화 벤치마크 (2026-04-07)
- **Zotero** (github.com/zotero/zotero): 3-pane 레이아웃, Collections vs Tags 구분, item type별 필드 스키마, refs count 컬럼, VirtualizedTable
- **Paperpile**: 컴팩트 테이블 ↔ 리스트 토글, 인라인 클릭→필터, 벌크 메타데이터 편집
- **Capacities**: Object type별 사이드바 네비게이션 (Plot 패턴과 동일), per-type 프로퍼티 스키마
- **Obsidian citation plugin** (github.com/hans/obsidian-citation-plugin): 모달 검색 + 문헌 노트 자동 생성
- **tiptap-footnotes** (github.com/buttondown/tiptap-footnotes): TipTap 각주 아키텍처 비교
- **Raindrop.io**: 북마크 관리 UX, 썸네일 그리드, 스마트 태깅
- **적용 방향**: Reference type 자동 감지 (URL→Website, DOI→Paper), refs count 컬럼, 인라인 클릭→필터, Files 썸네일 그리드

### 리서치: Wiki + Library Overview 디자인 폴리싱 (2026-04-07)
- **Bento Grid 레이아웃**: 카드 크기로 중요도 인코딩 (2×2 히어로, 1×1 스탯, 2×1 리스트)
- **Premium Stat Card**: 큰 숫자(32-48px) + 트렌드 배지(+3 this week ↑) + 상세 라벨(11px uppercase)
- **"Needs Attention" 프레이밍**: Stubs → "12 Needs Attention ⚠" (Tettra/Guru 패턴)
- **Category Coverage**: 카운트→퍼센트 (89% 카테고리화 ✓) + progress bar
- **Featured Article 히어로**: 2×2 블록, 발췌 + 카테고리 칩 + 메타
- **"Did You Know?" 섹션**: 랜덤 stub에서 흥미로운 사실 발굴 (Wikipedia 포탈 패턴)
- **Activity Feed**: 플레인 리스트→아바타+액션타입+타임스탬프 구조화
- **Popular Articles**: 링크 수 기반 인기 문서 (Outline 패턴)
- **Category Color Coding**: 카테고리별 고유 색상 (BookStack 패턴)
- **벤치마크**: Wikipedia 포탈, Notion Wiki, Confluence, GitBook, Outline(github.com/outline/outline), BookStack, PatternFly, shadcn/ui Dashboard

> 상세: `docs/BRAINSTORM-2026-04-06.md`

### 이번 세션 완료 — Phase 2A 위키 에디터 풀 툴바 + Encyclopedia 편집 통일 (2026-04-02)
- **위키 에디터 리서치**: Wikipedia VisualEditor, 나무위키, Fandom, GitBook, Outline, Confluence 에디터 구조 조사
- **Phase 2A: 위키 TextBlock FixedToolbar 연결**: wiki tier에 SlashCommand/Callout/Columns 등 확장 추가, FixedToolbar를 wiki tier에서 재사용 (42아이템 풀 툴바), WikiTextToolbar(55줄) 삭제
- **TextBlock blur 버그 수정**: onBlur → document mousedown click-outside 패턴 전환. 드래그 핸들/툴바 클릭 시 에디터 안 닫힘
- **Encyclopedia 편집 기능 완전 통일**: DndContext + SortableBlockItem으로 전면 리팩토링. 드래그 리오더, 섹션 ⋯ 메뉴(Split/Move/Delete), Add Block, 카테고리 편집 — Default와 동일
- **인포박스 편집**: Encyclopedia 읽기 전용 테이블 → WikiInfobox 컴포넌트 교체 (편집 모드에서 행 추가/삭제)
- **섹션 폰트 크기 조절**: WikiBlock.fontSize 속성 + ⋯ 메뉴 S/M/L/XL 4단계 선택
- **Contents TOC 대각선 리사이즈**: 코너 핸들 + fontScale 연동 (width 비례로 글자 크기 변동)
- **WikiBlockRenderer variant prop**: "default" | "encyclopedia" — SectionBlock이 variant에 따라 스타일 분기

### 이번 세션 완료 — 버그 수정 + Design Spine 8-Phase (2026-04-01)
- **버그/미완성 수정 8건**: Wiki Dashboard placeholder, Embed Note picker, 우클릭 메뉴 4항목(Embed/Link to Note/Extract as Note/Image), Home Red Links 카운트, orphanCount 일치, internalLinkCount 연산, Discover 섹션 4카드, Wiki 3탭(All/Articles/Red Links)
- **Design Spine Phase 1~8 전부 완료**:
  - Phase 1: hover/active 토큰 통일 (hover:bg-secondary/muted → hover:bg-hover-bg)
  - Phase 2: Typography 표준화 (text-sm → text-note, 20건)
  - Phase 3: Editor CSS 토큰화 (15곳 → CSS 변수, 5개 신규 변수: --editor-code-font-size, --editor-inline-code-color, --editor-ui-sm, --editor-ui-xs, --editor-table-cell)
  - Phase 4: Editor max-width 720px + padding 48px (note-editor.tsx)
  - Phase 5: Border Radius 3단계 규칙 (rounded-sm/md/lg, 15곳)
  - Phase 6: 4px Grid + Magic Number 제거 (12곳)
  - Phase 7: Hardcoded hex 4건 → 시맨틱 토큰, 아이콘 사이즈 9건 표준화
  - Phase 8: 트랜지션 CSS 변수 (--transition-fast/default/slow) + duration 통일
- **Wiki Overview 필터 제거**: dashboard 모드에서 showFilter=false
- **Wiki noteType 필터 제거**: WIKI_VIEW_CONFIG에서 noteType 카테고리 삭제
- **커스텀 이벤트 패턴**: `plot:embed-note-pick`, `plot:link-note-pick`, `plot:extract-as-note` — SlashCommand/ContextMenu → NoteEditor 통신

### 이전 세션 완료 — 에디터 Phase 1 확장 (2026-03-30)
- **Columns Block 완성**: CSS Grid 기반, renderHTML columnCell, resize handle(드래그 너비 조절), 테이블 스타일 border
- **플로팅 TOC**: Notion 스타일 에디터 우측 자동 사이드바, scrollspy, 타이틀 제외
- **인라인 TOC 수정**: 첫 heading(타이틀) 제외 로직 추가
- **@멘션 시스템**: 노트/WikiArticle/태그/날짜 4종 통합, 카테고리별 그룹핑, 인라인 칩
- **앵커/북마크**: anchorMark(인라인) + anchorDivider(블록 구분선), TOC 통합, Bookmarks 사이드패널 탭
- **Side-drop 개선**: 포인터 좌표 기반 블록 감지, sideDropState 우선 처리
- **컬럼 구분선 개선**: muted-foreground 0.25 → 테이블 스타일 border
- **SidePanelMode 확장**: 'bookmarks' 추가 (5탭 체제)
- **Make Block 폐기 결정**: Turn Into가 대체. 래퍼 감싸기 UX 직관적이지 않음
- **디자인 방향 = Notion 블록 디자인 참고**: Linear 레이아웃 + Notion 에디터 블록 폴리싱
- **다음 (우선순위순)**:
  1. Design Spine 수립 (CSS 변수 기반, Notion 참고) → 전체 블록 폴리싱
  2. Turn Into 메뉴 (블록 타입 변환)
  3. 노트참조 통합 인터랙션 (호버+Peek+인라인펼치기)
  4. isWiki 리팩토링
  5. 웹 클리퍼 + 가져오기/내보내기

### 이번 세션 완료 — Phase 1 커스텀 노드 + 에디터 UX (2026-03-28)
- **TOC Block**: `components/editor/nodes/toc-node.tsx` — heading 자동인식 atom node
- **Callout Block**: `components/editor/nodes/callout-node.tsx` — 5 types wrapper node
- **Align 드롭다운 통합**: 3버튼 → 1개 드롭다운 + Justified
- **BacklinksFooter 삭제**: Side Panel Connections로 대체
- **다음**: URL Embed 합치기, TOC 수동앵커, Make Block(범용 래퍼), Stub 삭제, 타이틀 정렬, Summary/Columns/NoteEmbed/Infobox

### 이전 세션 완료 — Side Panel Connections + Peek 개선 (2026-03-28)
- Connections Connected/Discover 2섹션, Relations UI 삭제, Peek wiki fallback
- Breadcrumb/badge 밝기 증가, Editor context menu (우클릭)

### 이번 세션 완료 — Phase 7 즉시 개선 + 에디터 통합 플랜 (2026-03-27)
- **StatusDropdown 추가**: 플로팅바에 일괄 status 변경 드롭다운. 선택된 전체 노트 status 한 번에 변경
- **Status badges per-status**: 플로팅바에서 선택된 노트의 status별 뱃지 표시 + 클릭 시 해당 노트 목록
- **Trash 버튼 독립 배치**: renderWorkflowButtons() 밖으로 이동, 항상 표시
- **Priority 필터 완전 제거**: filter-bar.tsx에서 Priority 관련 코드 전체 삭제
- **GitMerge 버튼 색상 수정**: 투명→bg-accent, 다크 테마에서 보임
- **빈 노트 자동 삭제**: openNote() 시 이전 노트가 제목+내용 비어있으면 자동 삭제
- **리스트 우측 컬럼 폰트/아이콘 크기 + 색상 밝기 개선**
- **우측 상단 필터/디스플레이/사이드바/+ 버튼 색상 밝기 개선**
- **Board previewNoteId 수정**: SidePanel 열려있을 때 Detail/Discover 정보 표시
- **< > 글로벌 화면 네비게이션**: routeHistory에 space 전환도 기록
- **에디터 통합 프로젝트 7-Phase 플랜 수립**: `.claude/plans/editor-unification.md`
  - Phase 1: 노트 에디터 리디자인 (shared config, title 통합, toolbar, 커스텀 노드)
  - Phase 2: 위키 TextBlock TipTap 전환 (lazy mount)
  - Phase 3: 템플릿 블록 레이아웃 에디터
  - Phase 4: Partial Quote (부분 인용 + 메타데이터 8필드)
  - Phase 5: Merge/Split 풀페이지 (섹션/문단 드래그 재배치)
  - Phase 6: Merge/Split 히스토리 (필터 + Insights)
  - Phase 7: 즉시 버그/개선 (완료)

### Key Design Decisions (추가)
- **WorkspaceMode 삭제**: zen/research 모드 불필요. sidebarCollapsed + detailsOpen 독립 토글만으로 충분
- **우측 사이드바 = Details 패널**: ViewDistributionPanel 삭제 → SmartSidePanel(Details)로 통합. 사이드바 버튼으로만 열림 (Linear 패턴)
- **Calendar = Cross-Space 시간 대시보드**: 독립 공간, Notes 뷰 모드 아님. 모든 엔티티 시간 축 표시
- **Custom Views = 사이드바 Views 섹션**: Linear식 savedView. 각 공간(Notes/Wiki/Graph/Calendar)별 독립
- **Back/Forward = note history + browser history fallback**: note history 없으면 router.back() 호출
- **디자인 라이브러리 13개 도입**: Phosphor/Motion/Sonner/Resizable/Radix Colors/dnd-kit/cmdk/Vaul/Iconoir/Tabler/Remix/React Spring + DESIGN-TOKENS.md에 사용 규칙 문서화
- **Side Panel 5탭**: Detail(메타데이터) + Connections(Connected/Discover 2섹션) + Activity(Thread/Reflection) + Peek(미리보기) + Bookmarks(앵커/북마크). Relations UI 삭제. Entity-aware — space에 따라 다른 detail 컴포넌트 렌더
- **Unified Pipeline 완료**: Filter/Display/SidePanel이 ViewConfig 기반으로 space별 주입. OntologyFilterBar 삭제, Wiki category 로컬 state → viewStateByContext 이관
- **Design Spine 통합**: 토큰 위반 일괄 수정 (typography/border/hover/icon/하드코딩). 별도 Phase 없이 구조 통합에 녹임
- **Discover = AI 없는 로컬 추천**: keyword overlap + tag co-occurrence + backlink proximity + folder proximity 4신호
- **그룹핑 컬럼 자동 숨김**: groupBy 필드와 동일한 컬럼은 테이블에서 자동 제외 (중복 제거)
- **Tags 컬럼 폐기**: COLUMN_DEFS, VALID_COLUMNS에서 삭제. 쓸모없다는 판단
- **Trash = Tools 섹션**: Board workbench에서 Workflow→Tools로 이동. Workflow = 순수 상태 전환만
- **Board 드래그 선택**: 빈 공간에서 마우스 드래그로 카드 범위 선택 (data-note-id + wasDragSelectingRef)
- **필터 Status shape 아이콘**: CircleDashed(Inbox), CircleHalf(Capture), CheckCircle(Permanent)
- **Workspace 단순화**: Binary tree → 듀얼 패인. react-resizable-panels. 9개 레거시 파일 삭제
- **위키 = 유저의 확장된 세계관**: 블록 무한 확장 대응 (IDB 분리 + virtuoso + lazy load + sectionIndex)
- **Make Block 폐기**: Turn Into가 대체. 래퍼 감싸기 UX는 직관적이지 않음 (2026-03-30)
- **디자인 폴리싱 방향 = Notion**: Linear 레이아웃 유지 + 에디터 블록 디자인은 Notion 수준 참고 (2026-03-30)
- **Design Spine = CSS 변수 기반**: 블록 공통 padding/radius/border/font-size를 변수화, 하나 바꾸면 전체 반영 (2026-03-30)

### 이번 세션 완료 — 카테고리 P0 + 에디터 (2026-03-26)
- **P0 Board Select All 시각 피드백**: 카드에 hover 체크박스 + accent 하이라이트 (Notes Board 패턴 동일)
- **P0 카테고리 Delete Undo**: pushUndo + toast Undo 버튼, 부모참조/아티클참조 전체 복원
- **카테고리 사이드바 → SmartSidePanel 통합**: 내장 CategorySidePanel 280px 제거, SidePanelContext에서 카테고리 모드 감지하여 글로벌 Details 패널에 표시. Notes와 동일 패턴
- **빈 공간 클릭 선택 해제**: activeCategoryId null + expandedCatId 리셋
- **카테고리 폼 에디터**: 더블클릭 → split view (280px 리스트 + 에디터). 이름/설명 인라인 편집 (hover/focus bg 피드백), Parent 드롭다운 변경, Info 카드 (Tier/Parent/Created/Updated)
- **서브카테고리 관리**: "+ New" 인라인 생성, "Move here" 기존 카테고리 이동 (순환참조 방지), Parent Categories 조상 체인 네비게이션
- **디자인 브레인스토밍**: Linear/Plane 수준 폴리시를 위한 "Design Spine" 논의 시작. spacing/sizing/typography 표준화 방향 설정 예정

### 이번 세션 완료 — 레이아웃 리디자인 (2026-03-26)
- **TopUtilityBar 제거 + 사이드바 헤더 리디자인**: Back/Forward/Search를 사이드바 상단으로 이동 (Linear 스타일)
- **사이드바 폭 260→220px**: 컴팩트화
- **사이드바 닫기/열기 Plane식**: ActivityBar 상단 열기 버튼, 다른 space 클릭 시 사이드바 안 열림
- **ViewDistributionPanel → SmartSidePanel(Details)**: 우측 사이드바 = 노트 디테일. NoteDetailPanel 오버레이도 제거. previewNoteId store 필드 추가
- **사이드바 버튼으로만 패널 열기**: 행 클릭 시 자동 패널 열기 제거
- **Priority UI 완전 삭제**: side-panel-context + note-detail-panel에서 제거
- **ViewHeader h-14→h-[52px]**: 컴팩트 헤더, text-sm font-medium
- **컬럼 헤더/버튼 밝기 개선**: text-muted-foreground/50→풀 opacity, compact 오버라이드 제거
- **Tags/Labels/Templates 카운트**: 사이드바 More 섹션에 갯수 표시

### 이번 세션 완료 (2026-03-25)
- **Wiki Merge UX 4가지 수정**: Overview 사이드바 네비게이션 복귀 버그 수정, 하단 드롭다운 위로 열림, New Article 타이틀 직접 입력, 카테고리 사이드바 CRUD
- **카테고리 계층구조 설계 결정**: 태그/라벨은 flat, 위키 카테고리만 트리 (parentId). 카테고리 페이지 = 사이드바 최상위 항목
- **캘린더 플로팅 액션바 삭제 결정**: 불필요
- **silly-mclaren 워크트리 복구**: 세션 크래시 후 커밋+푸시+PR+머지 완료 (PR #112)

### 이번 세션 브레인스토밍 결과 (2026-03-24)
- **글로벌 탭 도입 안 함** — 멀티패널과 역할 충돌. 사이드바가 탭 역할 수행
- **View = 사이드바 프리셋** — Linear View(탭)를 사이드바 Views 섹션으로 구현. FilterRule[] + groupBy + ordering + subGroupBy + visibleColumns + viewMode 저장
- **+ 버튼 통일** — top-utility-bar "New Note" 텍스트 제거 → ViewHeader 우측 `+` 아이콘만
- **커맨드 팔레트 확장 필요** — 현재 6개 → 20+개 컨텍스트 반응형 커맨드 (Note Actions, View, Navigation, Creation)
- **풀페이지 검색 분리** — ⌘K = 검색, ⌘/ = 커맨드 팔레트
- **멀티패널 뷰 타입 확장** — Wiki/Calendar/Graph + 에디터 조합 ("참조하면서 쓰기")
- **Wiki 대시보드 반응형** — Articles/Stubs/Red Links 카드가 탭/필터 역할
- **Linear 디자인 레퍼런스** — linear-design-mirror.tar.gz + SKILL.md 참고자료 저장 완료

### 이번 세션 완료 (2026-03-24)
- **Notes List 리니어식 그리드 통합**: list+table 2개 렌더러 → grid 하나 (~220줄 삭제), 컬럼 헤더 활성화
- **Phosphor 상태 아이콘**: CircleDashed(Inbox)/CircleHalf(Capture)/CheckCircle(Permanent)
- **Tray → Inbox 전체 교체**: 5+ 파일 라벨 통일
- **Capture/Permanent → NotesTable 통합**: 독립 페이지 삭제 (~520줄), TABLE_VIEW_ROUTES 추가
- **Tags/Labels 정상화**: sort 컬럼 헤더, 검색 제거, + 버튼, 아이콘 통일
- **Board 카드 개별 선택**: hover 체크박스 추가
- **isWiki 레거시 완전 폐기**: v59 마이그레이션 (isWiki→false, 빈 스텁 trash, wikiStatus→null)
- **템플릿 UX 개선**: Grid 프리뷰 강화, 생성 후 focus 모드, placeholder 힌트
- **위키 서브섹션 UI**: AddBlockButton에 Subsection 옵션 (level 3/4)
- **폰트/opacity 표준화**: text-xs 통일, opacity /30~/60, uppercase 제거
- Store v58→v59

### 이번 세션 완료 (2026-03-22)
- **Wiki 리디자인**: 파일 분리 (1500줄→6파일), Dashboard 새 설계, List→Linear-style 테이블, ArticleReader 폴리시, 사이드바 스타일링
- **첨부파일 시스템 개선**: data URL → IDB blob 저장 (attachment:// URL 스킴)
- **시드 데이터**: Zettelkasten 튜토리얼 (9 notes, 3 wiki articles), auto-migration v46
- **카테고리 클릭 필터**: 사이드바/Dashboard 카테고리 클릭 → List 모드 + 태그 필터
- **TOC 개선**: + Section/Subsection 인라인 추가, 빈 위키에도 TOC 표시
- **Wiki stub 자동 템플릿**: Overview/Details/See Also 기본 구조
- **+ Add file**: WikiCollectionSidebar에 파일 첨부 버튼 추가
- **Infobox editable**: read mode에서도 편집 가능, 비어있을 때 "Add infobox" 표시
- **Wiki Block Editor 1~3단계 완료**:
  - WikiArticle + WikiBlock 데이터 모델 (별도 엔티티, store v48)
  - createWikiArticlesSlice (10개 액션: CRUD + 블록 조작)
  - WikiBlockRenderer (Section/Text/NoteRef/Image 4종 + AddBlockButton)
  - WikiArticleView (TOC + 블록 목록 + Infobox 사이드바)
  - 블록 인라인 편집 (Section 제목, Text textarea, NoteRef 검색/삽입, Image 업로드)
  - Section 자동 번호 매기기 (TOC ↔ 본문 동기화)
  - 시드 WikiArticle 3개 (Zettelkasten/Permanent Note/Fleeting Note)
  - Note 기반 위키 클릭 시 같은 제목 WikiArticle로 자동 라우팅
  - Section 접기/펼치기 (collapsed → 하위 블록 숨김, store persist)
  - Sources 사이드바 (note-ref/image 블록 자동 추출, 클릭 시 SidePeek 열기)
  - Context Panel: NoteRef "Open" 버튼 → SidePeekPanel로 원본 노트 열기 (편집 + FixedToolbar)

### 이번 세션 완료 (2026-03-23)
- **Smart Side Panel**: NoteInspector + SidePeekPanel → 통합 SmartSidePanel (Context/Peek 두 모드)
  - react-resizable-panels로 리사이즈 가능
  - Details에서 백링크/관련 노트 클릭 → Peek 전환
  - ReferencedInBadges MAX 3개 + "+N more" Popover
- **Workspace 단순화**: Binary tree(14 액션, 9 컴포넌트) → 듀얼 패인(5 액션, 2 컴포넌트)
  - `secondaryNoteId` + `editorTabs` + `activePane` 모델
  - "나란히 열기" 버튼 (Peek → 듀얼 에디터 승격)
  - Store v50→v52 마이그레이션
- **위키 블록 무한 확장 대응**:
  - text block content → IDB 분리 (`plot-wiki-block-bodies`)
  - block metadata → IDB 분리 (`plot-wiki-block-meta`)
  - `WikiSectionIndex` — Zustand에 경량 섹션 인덱스만 보관 (v53)
  - react-virtuoso 가상 스크롤 (>50 블록)
  - 섹션 lazy load (접힌 섹션 렌더 스킵)
- **블록 DnD**: @dnd-kit 기반 드래그 앤 드롭 순서 변경 (edit 모드)
- **Wiki stats 버그 수정**: `notes.isWiki` → `wikiArticles` 기반으로 전환
- **Wiki article 클릭 버그 수정**: Dashboard에서 `onOpenArticle` → `onOpenWikiArticle`

### 이번 세션 완료 (2026-03-24)
- **Linear UI 폴리시 3차**:
  - ViewHeader "+ New note" 중복 제거 → top-utility-bar "+" 아이콘만 남김 (컨텍스트별 라벨: Notes→New Note, Wiki→New Article)
  - top-utility-bar에서 "+ New Note" 텍스트 버튼 제거, ViewHeader `onCreateNew` → "+" 아이콘 버튼으로 통일
  - Calendar onCreateNew 복원
  - Inbox 독립 viewState (Notes와 필터/디스플레이 분리, Status 필터 카테고리 자동 숨김)
  - Wiki Show stubs 토글 실제 동작 연결 (`filteredWikiNotes`에서 `toggles.showStubs` 필터링)
  - Wiki Red Links MiniStat 클릭 → 리스트 모드 전환 + 전용 Red Links 리스트 (제목+참조수+Create 버튼)
  - Wiki 리스트 탭 바에 "Red Links" 탭 추가 (빨간색 강조)
  - Wiki STATUS↔TITLE 간격 수정 (w-[80px] → w-[100px])
  - linear-design-mirror 스킬 생성 + SKILL.md 참고 자료 저장

### 이번 세션 완료 (2026-03-23, 세션 2)
- **글로벌 색상 체계 (`lib/colors.ts`)**: 15개 파일 하드코딩 → 단일 소스. CSS 변수 추가 (`--wiki-complete`, `--priority-medium`)
- **wiki-complete 색상 분리**: permanent 초록 → violet `#8b5cf6`로 분리
- **위키 상태 아이콘 3종**: IconWikiStub(점선 책), IconWikiDraft(연필 책), IconWikiComplete(북마크 책) — Linear 스타일 아이콘+텍스트
- **그래프 nodeType 버그 수정**: WikiArticle이 원(Note)으로 나오던 버그 → 헥사곤으로 정상 표시
- **그래프 색상 수정**: inbox/capture 색상이 뒤바뀐 거 수정 + 위키 상태별 색상(violet/indigo/orange)
- **그래프 범례 재구성**: Node Types → 상태별(Inbox/Capture/Permanent) + Wiki별(Complete/Draft/Stub)
- **태그 기본 OFF + pill 형태**: 그래프에서 태그 노드 기본 숨김, 다이아몬드 → pill 캡슐 형태
- **배경색 차콜 전환**: `#09090b` → `#141417`. 카드/팝오버/보더도 elevation 계층 조정
- **그래프 노드 제한**: MAX 200개(connectionCount 순), LOD 최적화(zoom < 0.3 라벨 숨김, < 0.15 노드 숨김)
- **글로벌 라우트 히스토리**: `table-route.ts`에 히스토리 스택. Back/Forward 버튼이 페이지 간 이동 지원
- **Backspace = 뒤로가기**: 에디터 밖에서 Backspace키로 이전 페이지/노트 이동
- **"Ontology" → "Graph"**: 헤더 타이틀 변경
- **위키 클릭 버그 수정**: openArticle이 WikiArticle.id 직접 인식하도록 수정
- **Node Types 범례 한글 → 영어**: "일반 노트/위키 문서/미완성 위키" 제거

### 이번 세션 완료 (2026-03-23, 세션 3)
- **필터 드롭다운 검색창**: 모든 필터 서브드롭다운에 검색 입력 추가 (Linear식, 임계값 제거)
- **Wiki Merge 스토어**: mergeWikiArticles (A+A), mergeNotesIntoWikiArticle (B: Note[]→WikiArticle)
- **Wiki Assembly Dialog**: Note[] → WikiArticle 조립 UI (FloatingActionBar + Dialog)
- **클러스터 감지 → 자동 제안**: detectClusters() + useClusterSuggestions hook + nudge toast
- **archive 제거**: 노트에서 isArchived 필드 + Show archived 토글 + 관련 로직 전부 삭제
- **위키 리스트 토글 버그 수정**: Show stubs/Show red links 토글 동작 수정
- **위키 클릭 버그 수정**: Dashboard/Overview에서 위키 아티클 클릭 시 열기 동작 수정
- **위키 카테고리 필터 버그 수정**: 드롭다운 열리지 않던 이슈 수정

### 이번 세션 완료 (2026-03-24)
- **List/Board 토글 활성화**: Show trashed / Compact mode / Show card preview 3개 토글 실제 동작 연결
- **Nested Replies (Thread 트리 구조)**: ThreadStep에 parentId 추가 + 트리 렌더링 + Reply 버튼 + store migration v54
- **Compact + Preview 공존**: isCompact 조건 제거하여 두 토글 독립 동작
- **Board 컬럼 헤더 라벨 색상 dot**: Label/Folder 그룹핑 시 컬럼 헤더에 색상 dot 표시
- **그룹 드래그 순서 변경 (List + Board)**: dnd-kit 기반 그룹 헤더/컬럼 드래그로 순서 커스텀. viewState.groupOrder에 persist
- **Collapse All / Expand All 버튼**: ViewHeader 필터 왼쪽에 토글 버튼 추가 (그룹핑 활성일 때만)
- **Breadcrumb/Sidebar 클릭 시 에디터 닫기**: 같은 라우트 router.push 시 IDB persist 덮어쓰기 문제 해결
- **글로벌 Undo/Redo**: Ctrl+Z / Ctrl+Y + UndoManager (linked list + capacity 50) + 에디터 focused 시 비활성
- **Sub-grouping 실제 동작 구현**: group.ts 재귀 그룹핑 + subheader VirtualItem + 들여쓰기된 서브그룹 헤더 렌더링
- **Show card preview 즉시 전환**: 토글 ON/OFF 시 리스트 즉시 반영

### 이번 세션 완료 (2026-03-24, 세션 2)
- **Design Polish Phase 1~5**: Lucide→Phosphor 아이콘 통일(83파일), hardcoded hex→lib/colors.ts 중앙화, 인라인 style→Tailwind 클래스, 비표준 값 정규화
- **NoteRow CSS Grid 컬럼 기반 재설계**: flex→CSS Grid 전환, word count 타이틀 옆 배치, ViewHeader 로컬 검색 제거→글로벌 검색 통합
- **전 뷰 행 구분선 제거**: notes-table, wiki-list, wiki-view, note-list, labels-view, tags-view — "Structure felt, not seen" 철학 전면 적용

### 이번 세션 완료 (2026-03-25)
- **WikiStatus 단순화**: stub/draft/complete → stub/article 2단계. v60 마이그레이션 (draft→stub, complete→article)
- **Import Note 2단계 리디자인**: Step 1(노트 선택) → Step 2(Article/Stub/Red Link/Create new 타겟 선택). WikiArticle 조립 모델 사용
- **Red Links 리스트 통합**: 별도 페이지 제거, All 탭에 Article/Stub/Red Link 동급 표시
- **위키 삭제**: 리스트 ··· 메뉴 + 에디터 사이드바 + 우클릭 컨텍스트 메뉴
- **위키 플로팅 액션바**: 체크박스 선택 + 하단 액션바 (Delete/Promote)
- **createWikiStub → createWikiArticle 전환**: WikilinkDecoration, search-view, wiki-collection-sidebar, wiki-view 4곳
- **아이콘 통일**: Wiki 섹션 헤더 IconWiki, Graph 액티비티바 Phosphor Graph
- **머지 개선**: 높은 status 유지 (article > stub), DRAFT/COMPLETE 라벨 → STUB/ARTICLE
- **Legacy fallback**: IDB의 draft/complete 값을 Stub/Article로 표시 (StatusBadge, WikiStatusDot, wiki-dashboard 등)
- **docs 최신화**: CLAUDE.md, CONTEXT.md, MEMORY.md store v60, WikiStatus 반영
- **Wiki Merge Preview**: 2단계 다이얼로그 (타겟 선택 → 방향 스왑/제목/상태 선택 + 블록 미리보기 + Undo toast). mergeWikiArticles 개선 (infobox 머지, title/status 옵션 파라미터)
- **Wiki Split**: 에디트 모드에서 블록 체크박스 선택 → "Extract" 버튼으로 새 아티클 분리. splitWikiArticle 스토어 액션 신규
- **Wiki Unmerge**: mergedFrom 스냅샷 (WikiMergeSnapshot) + "From: X" 구분선에 Unmerge 버튼 + unmergeWikiArticle 액션
- **섹션 컨텍스트 메뉴**: hover "..." → "Move to new article" / "Delete section"
- **드래그 Split**: TOC 사이드바 하단 드롭존. 에디트 모드에서 섹션 드래그 → 드롭존에 놓으면 새 아티클로 분리
- **위키 리스트 우클릭**: Split wiki + Merge into + Delete (컨텍스트 메뉴 3개)
- **Drag Split UX 폴리시 5개**: 드롭존 시각 피드백 강화, 제목 프롬프트, 모든 블록 타입 드래그 가능, DragOverlay 미리보기, 기존 아티클 드롭 타겟
- **플로팅 드롭존**: TOC 사이드바 드롭존 → 화면 하단 플로팅 바로 이동 (드래그 시에만 출현)
- **플로팅 액션바에 Split 추가**: 단일 선택 시 Promote + Merge + Split + Delete
- **사이드바 Merge/Split 풀페이지**: 좌측 사이드바에 Merge/Split 내비 추가 + 각각 전용 풀페이지 UI (WikiMergePage, WikiSplitPage)
- Store v59→v60

### 이번 세션 완료 (2026-03-25, 세션 2)
- **Wiki 카테고리 시스템 완성**:
  - WikiLayout 프리셋 (`"default" | "encyclopedia"`) — article별 레이아웃 전환 UI
  - 카테고리 전용 페이지 (WikiViewMode `"category"` 추가, WikiCategoryPage 컴포넌트)
  - 사이드바 카테고리: flat 트리 → nav 최상위 항목 ("Categories" = Overview/Merge/Split과 동급)
  - 2-panel 카테고리 트리 에디터: 왼쪽 드래그 가능 트리 + 오른쪽 상세 패널 (breadcrumb, 설명 편집, 하위 카테고리, 소속 아티클)
  - 아티클/스텁 카테고리 할당 UI: 인라인 태그 행 + Add 드롭다운 + 새 카테고리 생성
- **Encyclopedia 레이아웃** (나무위키식):
  - 상단 분류 태그 행, float-right 인포박스, 인라인 collapsible 목차(Contents), 번호 매긴 접기/펼치기 섹션
  - 텍스트 사이즈 밸런스 개선 (h1 3xl, 인포박스 xs/sm, 목차 sm)
- **URL 블록 타입**: WikiBlockType에 'url' 추가. 유튜브 iframe embed + 일반 링크 카드. AddBlockButton에 URL 옵션
- **Merge 카테고리 반영**: handleMerge → mergeMultipleWikiArticles 교체 (categoryIds, blockOrder 전달)
- **Split status 반영**: splitWikiArticle에 status 파라미터 추가 (기존 항상 stub → 선택 가능)
- **Chevron 방향 수정**: Title/Survives 드롭다운 ChevronDown → ChevronUp (위로 열리는 드롭다운)
- Store v60→v61 (WikiArticle.layout 기본값)

### 이번 세션 완료 (2026-04-10) — Peek-First 실험 → Split-First 복귀 결정
**Peek-First 작업 (Phase 2~3.5):**
- **Phase 2**: Peek에서 Wiki 지원 — `PeekContext = {type:"note"|"wiki", id}`, 8개 호출부 업데이트
- **Phase 2.5**: Peek 자립 — 상시 탭 + Empty State(Suggested+Recent+Pinned) + Open picker + `Cmd+Shift+P` 단축키
- **Phase 3**: 사이즈 시스템 — `peekSize` 32-50%, drag, main-content 동적 계산
- **Phase 3.5**: Back/Forward history + Pin + 서브헤더 대비 개선
- Peek picker 시각 개선: 노트 워크플로우 상태 원 아이콘(`StatusShapeIcon` 공유 추출) + 위키 violet 북
- MentionSuggestion 일관성: note/wiki 색상 시스템 통일 (NOTE_STATUS_HEX + WIKI_STATUS_HEX)
- Empty State Suggested 섹션 (contextual related + fallback to 최근 수정 노트)
- 검색 결과 Notes/Wiki 그룹핑 (멘션 피커 패턴)
- Tooltip overflow fix (native title → Radix `side="bottom"`)
- FixedToolbar `variant="peek"` (violet tint)
- Wiki 편집 in Peek + 풀 infobox/TOC 렌더링
- 공유 파일: `components/status-icon.tsx` (StatusShapeIcon), `lib/peek/peek-search.ts`, `lib/peek/peek-suggestions.ts`

**피벗 결정 — Peek-First 포기, Split-First 복귀:**
- 근거: Peek UI가 사이드패널 안에 있는 한 main editor와 "같은 단층" 느낌 불가능
- 대안: Split view 복원 + **단일 SmartSidePanel이 `activePane`을 따라감** (focus-following)
- 원래 Split view의 문제(per-pane dual SmartSidePanel)는 단일 인스턴스 + `useSidePanelEntity` + `PaneProvider` 체인으로 해결
- **Phase 1 완료**: SmartSidePanel pane prop 제거 + global state, side-panel-connections `useSidePanelEntity` 적용, layout.tsx SmartSidePanel 호출부 단순화, Peek 탭 제거 (4탭 복원), tsc clean
- **Phase 2~7 대기**: Store cleanup(peek/secondarySidePanel 상태 제거) → Peek 파일 삭제 → secondary picker 재설계(peek-empty-state → secondary-open-picker) → focus tracking 강화 → 시각 피드백 → Split view 통합 검증 → 문서 업데이트
- **자산 재활용**: StatusShapeIcon, MentionSuggestion 개선, peek-search, peek-suggestions, Tooltip fix, FixedToolbar variant 시스템 전부 Split view picker로 이관 가능

### 다음 작업 후보 (우선순위 순, 2026-04-10 sync)
1. **Footnote createdAt** — 각주 생성 타임스탬프 + 하단 날짜 표시
2. **모든 각주 자동 Reference 연결** — /footnote로 만들어도 자동 Reference 생성, 독립 각주 제거
3. **Reference.history** — 수정 이력 저장 + 스티커 UI (원본/수정 비교)
4. **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)
5. **Library Activity Bar** — References + Tags(글로벌) + Files 3탭
6. **Tags 글로벌 승격** — WikiArticle에 tags 추가
7. **인포박스 고도화** — 대표 이미지, 섹션 구분, 접기/펼치기

### 완료 확인 (이전 TODO에서 제거)
- ~~Phosphor Icons 전체 마이그레이션~~ → PR #104 완료 (83파일)
- ~~Wiki Block 후속 (드래그/접기/펼치기)~~ → PR #94-95 완료
- ~~위키 카테고리 계층구조~~ → PR #112-113 완료
- ~~캘린더 플로팅 액션바~~ → 불필요 판단으로 삭제 (2026-03-25)

### docs 현황
- `docs/CONTEXT.md` — 현재 상태 + 설계 결정
- `docs/MEMORY.md` — PR 히스토리 + 아키텍처
- `docs/DESIGN-TOKENS.md` — 디자인 토큰 (색상/타이포/스페이싱/아이콘 규칙)
- 완료된 설계 문서 9개 삭제 (architecture-redesign-v2.md, wiki-collection-design.md 등)
