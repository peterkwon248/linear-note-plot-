# Session Log

> 세션 history. Append-only (오래된 entry 그대로 유지).
> 가장 최신 세션이 위.
> **NEXT-ACTION.md 폐지 (2026-05-12)**: 각 entry 첫 줄의 "다음 즉시 액션 hook"이 다음 세션 시작점.

---

## 2026-05-13 (오후~저녁) — 집, Lineage 시각화 (PR #320 5 commits) + Template UpNote-style 회귀 fix (PR #320 commit 6 cascade)

> 🎯 **다음 즉시 액션**: **PR #320 squash merge** (사용자 책임, 다른 컴퓨터에서 가능) + 머지 후 dev:3002 hard refresh에서 6 surface manual verify. 가장 큰 surface: (1) Ontology Display > Group by = Family → hull, (2) 노드 우클릭/Shift+click → Lineage Focus mode (opacity 0.15 dim), (3) Wiki article detail → Lineage section (ancestors breadcrumb + descendants), (4) Filter Visible hulls placeholder, (5) Search nodes typeahead dropdown, (6) Templates 페이지 → TitlePatternBar 사라짐 + word/char 하단 위치.
>
> **사용자 의도**: P1 "House (계보 시각화)"를 Family Hull + Lineage Focus + Wiki sidebar로 분산 구현 → P1에서 제거 완료. 추가로 사용자가 "Visible hulls 별로", "검색창 typeahead 필요", "Template title pattern 이상해" 시그널 후 즉시 fix cascade.
>
> **첫 스텝** (다른 컴퓨터에서 바로 시작):
> 1. `git pull origin main` (PR #320 squash merge 후 가정) 또는 `git fetch && git checkout claude/condescending-mclaren-bb8475`
> 2. `npm install` (새 worktree 시 필수)
> 3. `npm run dev` → http://localhost:3002 hard refresh (Ctrl+Shift+R)
> 4. PR #320 6 surface verify (위 6개)
> 5. PR #319 (이미 머지된 60c7e98) 6 surface도 같이 verify 가능 (Smart Book v2 G/H/K + Ontology Hull P1-4 + Block 색)
>
> **확인 포인트**:
> - Family Hull: notes(parentNoteId chain) + wikis(parentArticleId chain) MAX_DEPTH 20 cycle guard. Hull color = root entity의 label.color or categoryIds[0].color → fallback palette
> - Lineage Focus mode: 우클릭 메뉴 "Show lineage" + Shift+click. ESC/빈 공간 클릭/Shift+focused 재클릭 모두 해제
> - Wiki sidebar: Ancestors breadcrumb + Descendants 직속 children. navigateToWikiArticle 클릭 navigation
> - Filter Visible hulls placeholder: groupBy 안 정한 상태에서 "Choose a Group by in Display first" 안내 (이전 빈 sub-menu 회귀)
> - Search typeahead: 매칭 노드 상위 10개 + "+N more". onMouseDown (input blur race 회피)
> - Template UpNote-style: TitlePatternBar 사라짐. 본문 첫 줄에 "Weekly - {date}" → 노트 title = "Weekly - 2026-05-13". word/char counter 하단
>
> **구멍 가능성**:
> - bulk select 모드 UX, chapter context badge null cases, 100+ entity hull 성능 (PR #319 보고됨, 본 PR 무관)
> - Template 회귀 fix는 작은 변경이지만 기존 사용자 template 사용 시 fallback chain (template.name → legacy template.title → "Untitled") 동작 확인 필요
> - dnd-kit collision normalize (notes/books/wiki 3 board 완료) — 새 board 도입 시 동일 패턴 적용 의무
>
> **참고 파일**:
> - `.claude/plans/editor-unification.md` (Phase 1B 완료 + 본 PR title-pattern 회귀 fix)
> - `.omc/plans/title-node-removal.md` (Phase 1B DoD 6/6)
> - `lib/store/slices/templates.ts:78` `expandContentJsonPlaceholders` deep traverse helper (text 필드만 변수 치환)
> - `components/views/template-edit-page.tsx` (TitlePatternBar 제거 + wrapper flex flex-col fix)
> - `components/ontology/ontology-graph-canvas.tsx` (family hull switch + Lineage Focus opacity + 우클릭 메뉴)
> - `components/side-panel/wiki-article-detail-panel.tsx` (Lineage section: ancestors breadcrumb + descendants list)
>
> **위험 + 회피**:
> - PR #320 scope 6 commits (lineage 5개 + template fix 1개) — squash merge 권장
> - 영구 작업 원칙 #1 위반 사례 (title-node-removal Phase 1B 시 template 시스템 호환 검증 누락 → 본 PR에서 fix). 향후 새 패턴 도입 시 NoteEditorAdapter handleChange 호환 검증 의무.
>
> **머신**: 집 (Windows) → 다른 컴퓨터로 이어받기 예정
> **현재 main HEAD**: PR #319 머지된 60c7e98
> **branch worktree**: `condescending-mclaren-bb8475` (이번 세션, 머지 후 cleanup 가능)

### 완료 (PR #320, 6 commits cascade)

| # | sha | scope |
|---|---|---|
| 1 | `e17b54a` | docs: TODO.md stale 정리 — 중복 P1 헤더 + PR #319/#315/v122-v126 완료 항목 이동 |
| 2 | `8ae0a07` | feat(wiki): article detail Lineage sidebar — Ancestors breadcrumb + Descendants list |
| 3 | `b195a04` | feat(ontology): Family Hull (groupBy) + Lineage Focus mode (우클릭/Shift+click, opacity 0.15 dim) |
| 4 | `e410635` | fix(filter): empty sub-menu placeholder — Visible hulls "선택 후 노출" 안내 |
| 5 | `1fc827c` | feat(ontology): search typeahead dropdown — 매칭 노드 title 목록 + 클릭 시 select |
| 6 | `1c8cc3c` | fix(template): TitlePatternBar 제거 + UpNote-style 자유식 + contentJson 변수 치환 + word/char 위치 fix |

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

**1. House (계보 시각화) → 분산 구현으로 결정**:
- 별도 entity 폐기 (docs/MEMORY.md 1619 라인 결정)
- Family groupBy = List/Board (이미 wiki/notes view에 구현)
- Family Hull = Ontology graph (본 PR 1)
- Lineage Focus mode = Ontology graph (본 PR 3)
- Wiki Lineage Sidebar = Wiki article detail (본 PR 2)
- P1 #5 House 항목 완료 처리

**2. Title pattern UI 영구 폐기 (UpNote-style 일관)**:
- TitlePatternBar 컴포넌트 + PLACEHOLDER_VARS chip strip 제거
- Title은 항상 첫 블록 텍스트 (notes/templates/모든 곳 일관)
- 변수 치환 ({date}/{{YYYY}}/...)은 본문 어디서나 작동 (expandContentJsonPlaceholders deep traverse)
- 새 영구 룰: 별도 title 필드 도입 금지 (UpNote-style 위배). NoteEditorAdapter handleChange 호환 의무.

**3. Lineage Focus trigger 결정**:
- 우클릭 메뉴 "Show lineage" (Tree icon, Visual filters 그룹)
- Shift+click (Ctrl/Cmd+click multi-select 분기 앞에 배치)
- Double-click 충돌 회피 (`handleNodeDblClick` 이미 openNote)
- 해제: ESC + 빈 공간 클릭 + Shift+focused 재클릭 (toggle)

**4. Lineage opacity 0.15 결정**:
- Smart Book sequence opacity 패턴 정합
- Edge dim 없음 — node dim만으로 충분 ("Gentle by default")
- transition 180ms ease-out

**5. Family Hull color resolution**:
- root entity의 label.color (notes) or categoryIds[0].color (wikis)
- 둘 다 없으면 fallback palette (CLUSTER_COLORS)
- Smart Book Hull P2 `book.color` 패턴 정합

**6. ViewHeader searchDropdownContent prop 일반화**:
- ontology 전용 X. 향후 Notes/Wiki/Books 등에서도 같은 typeahead UX 재사용 가능
- 영구 #2 최소 diff + 재사용성

**7. Filter empty sub-menu placeholder 패턴**:
- Hide (메뉴 자체 제거) 대신 안내 메시지 노출 (UI 일관성 + 사용자 안내)
- hullEntity 특수 케이스만 special 안내, 일반 카테고리는 "No options available."

### 기술 학습 (영구)

- **UpNote-style title 일관 규칙**: Title은 항상 첫 블록 텍스트로 동기화. 별도 title pattern 필드/UI 도입 시 NoteEditorAdapter handleChange 호환 검증 의무. 본 PR title-pattern 회귀 fix가 영구 룰 #1 위반 사례 (template 시스템 호환 검증 누락).
- **expandContentJsonPlaceholders deep traverse 패턴**: contentJson nested 구조에서 text 필드만 재귀 치환. notes의 markdown text와 별개로 contentJson 변수 치환 가능. paragraph/heading/table cell 등 어디서나 작동.
- **Lineage path computation 패턴**: ancestor chain (parent walk up) + descendant subtree (recursive children walk down). MAX_DEPTH=20 cycle guard. group.ts + wiki-list-pipeline.ts와 동일 규칙.
- **node-context-menu 확장 패턴**: prop callback (onShowLineage) + UI item (Tree icon, Visual filters 그룹). 패턴 그대로 다른 액션 추가 가능.
- **ViewHeader 일반화 패턴**: search input 옆에 absolute positioned content slot (`searchDropdownContent`). caller가 typeahead/suggestion/preview 등 자유롭게 정의. Notes/Wiki/Books 등 다른 view에 재사용 가능.
- **filter-panel 빈 values 처리**: ternary로 분기 — 일반 fallback "No options available." + hullEntity 특수 안내. 메뉴 항목 자체 hide 대신 사용자에게 활성화 방법 노출.
- **Template 회귀 fix 패턴**: TitlePatternBar 제거 + expandContentJsonPlaceholders 추가 + wrapper `flex flex-col`. 일반 노트 (note-editor.tsx:680) 패턴 정합.

### Watch Out (다음 세션 주의사항)

- **PR #320 squash merge 후 docs/MEMORY.md current main HEAD 갱신** (60c7e98 → squash sha)
- **기존 사용자 template** 호환: `template.title` 필드는 deprecate (auto-sync stop). createNoteFromTemplate fallback chain (template.name → template.title → "Untitled") 동작 확인. 데이터 손실 0.
- **다음 P1 main 4개 (TODO.md)** — 추천 순위: 1 Wiki template Layout/Content Preset (Plot 정체성) > 3 Partial Quote (Zettelkasten) > 2 entity-agnostic ListRow (일관성) > 4 Note Merge 풀페이지 + History (큰 작업)
- **새 worktree → npm install 의무** (영구 룰 후보, 이번 세션도 fractional-indexing not found 발생)
- **hydration mismatch radix id** — main pre-existing, 본 PR 무관, 별도 fix 후보

---

## 2026-05-13 — 집, Smart Book v2 풀 완성 + Ontology Hull P1-4 + 137 Linear refs + 11 follow-up (PR #319, 17 commits 단일 mega-PR)

> 🎯 **다음 즉시 액션**: **PR #319 squash merge** (사용자 책임) + 머지 후 dev:3002에서 manual verify. 가장 큰 surface: (1) `/library` Books → 책 → "Add source" 다중 선택 모드 + Auto-sort toggle + Resume 버튼 + chapter context badge. (2) Ontology → Display > Group by = Book → hull / Filter > Status nested 8 values (Note/Wiki/Book) / Visible hulls picker / Show book sequence dashed arrow.
>
> **사용자 의도**: Smart Book v2 (chapter ordering / reading view / picker UX) + Ontology Hull 3-source + 그 모든 follow-up까지 한 큰 PR로 통합 완성. "잔여 follow-up까지 다 해" 명시.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `git pull origin main` (PR #319 머지된 상태 가정) → `npm install` (새 worktree 시 필수, 본 세션 시작 시 발생 사례 — 영구 룰 후보)
> 2. `npm run dev` → hard refresh (Ctrl+Shift+R) IDB stale 회피
> 3. `/library` Books → 임의 책 → "Add source" 다이얼로그
>    - 다중 선택 토글 → 5 tab cross-tab search → "Add N selected" footer
>    - 본문 auto items drag → cross-source reject toast (Q1 LOCKED) → Auto-sort 버튼 + 5초 undo toast
>    - 책 detail header: lastReadItemId 있으면 "Resume" + 옆 "처음부터"
> 4. 페이지 reading → BookContextNav 옆 mini progress bar + "· {kind icon} {sourceName} (N/M)" chapter badge (md+ only)
> 5. Ontology graph
>    - Filter > Status → 3 sub-section header (NOTE/WIKI/BOOK) + 8 values 모두 icon (Hexagon/Cube/Cuboid2x2/IconWikiStub/IconWikiArticle/Lightning/PencilSimple/Sparkle)
>    - Display > Group by = Book → hull + book.color fallback. Smart Book auto items도 hull 멤버 (resolveBookItems via bookMembership prop)
>    - Display > "Show book sequence" 토글 → dashed thin arrow 책 reading order
>    - Filter > "Visible hulls" → 특정 entity만 hull 표시
>    - Legend 박스: "Block" 표시 (이전엔 "Keystone" 잔존, 본 세션 fix)
>    - Notes Table Block badge: slate color (이전엔 green `--chart-5` 잘못 사용)
>
> **확인 포인트**:
> - dnd-kit collision 패턴 — wiki-board / notes-board / books-board 3 board 모두 normalize 의무 (PR #311/#319 패턴 정합). 새 board 추가 시 영구 룰.
> - status 색은 `var(--status-{stone|brick|keystone})`만 — `var(--chart-N)`는 chart 시각화 전용 (LOCKED 색 변경 따라가지 않음). Stone/Brick도 같은 정리 가능 (사용자 시그널 후).
>
> **구멍 가능성**:
> - bulk select 모드 — Cmd+Click 처리 cmdk와 충돌이라 explicit 토글로 우회 (사용자 UX 자연도 verify 필요)
> - Phase H chapter context badge — sourceRefId clustering 기반이라 manual items without sourceRefId는 null (badge hide). PRD §5.3 예시 "in 📁 Algorithms"와 약간 다른 design.
> - Ontology Book hull membership — resolveBookItems 비용 O(books × items). books 100+ 시 culling 필요 (현재 acceptable).
> - chapter heading auto-generated 사용자 rename 불가 (PRD §6 명시). 사용자 시그널 시 v2.5 follow-up.
>
> **참고 파일**:
> - `.omc/plans/smart-book-v2-prd.md` v1.0 LOCKED (Phase G/H/K, 13 Q resolved)
> - `.omc/plans/ontology-hull-prd.md` v0.1 draft (Phase 1/2/3/4 모두 구현)
> - `docs/reference/linear/README.md` (137 captures 14 카테고리 인덱스)
>
> **위험 + 회피**:
> - PR #319 17 commits scope 매우 넓음 — squash merge 권장, title 머지 시 broader scope로 update
> - 새 worktree 첫 setup 시 `npm install` 필수 (본 세션 시작 시 stale dev server로 fractional-indexing not found 에러 발생) — before-work 단계에 node_modules 체크 자동화 후보
> - hydration mismatch (radix _R_xxx_ id) main pre-existing — 본 PR 무관, 별도 fix 후보
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #319 머지 전 (45798d7)
> **branch worktree**: `brave-ardinghelli-209f9b` (이번 세션, 머지 후 cleanup 가능)

### 완료 (PR #319, 17 commits 단일 mega-PR)

| # | sha | scope |
|---|---|---|
| 1 | `c96a5fe` | books-board normalize (Bug #1) + BookItemRow 5-source icon (Bug #2) |
| 2 | `0eaa13f` | wiki-board normalize (Bug #3, 같은 dnd-kit collision risk 패턴) |
| 3 | `d9e921d` | TrashAllView header select-all checkbox (tri-state) — 사용자 "전부 삭제" 요청 |
| 4 | `65f1733` | docs: Linear 참고자료 137 captures + README 카테고리 인덱스 |
| 5 | `f023701` | Smart Book v2 PRD v1.0 LOCKED + Ontology Hull PRD v0.1 draft + Phase G-1 (core) |
| 6 | `e6e332c` | Phase G-2 (UI: auto entity drag + Auto-sort toggle + 5초 undo toast) |
| 7 | `4e79d26` | Phase H (lastRead + Resume 버튼 + BookContextNav mini progress bar) |
| 8 | `46786a9` | Phase K (dialog 너비 확장 + cross-tab unified search) |
| 9 | `fead7c9` | Ontology Hull Phase 1+2 (Status cross-entity + Book hull groupBy) |
| 10 | `964b257` | Phase H follow-up — chapter context badge |
| 11 | `18583b4` | Ontology Hull Phase 1 follow-up — Status sub-section headers |
| 12 | `3201ea7` | Phase K follow-up — bulk select (multi-mode 토글 + footer) |
| 13 | `c5f975f` | Ontology Hull Phase 2 follow-up — Smart auto items in hull |
| 14 | `43fe2e3` | Ontology Hull Phase 4 — Visible hulls picker filter |
| 15 | `7270254` | Ontology Hull Phase 3 — Book sequence dashed arrow |
| 16 | `0c4c644` | fix: legend Keystone → Block + Filter Status Wiki/Book icon 일관성 |
| 17 | `44bef87` | fix: Block 색 var(--chart-5) green → var(--status-keystone) slate 통일 |

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

**1. Smart Book v2 PRD v1.0 LOCKED 12 결정** — 모두 추천값 그대로:
- Auto items reorder = same-source 내부만 (cross-source 시 reject toast)
- Auto-sort 토글 = SourcesSection row 인라인 + 5초 undo toast
- 진행률 = header 아래 1px subtle (이번엔 BookContextNav inline mini 36px로 변형 적용)
- Resume = 명시적 버튼 (자동 점프 X)
- Hull style outline / Book.color 우선 / overlap 허용 / dashed thin sequence / opt-in toggle / 5-tab picker 너비 + cross-tab search
- userOrder 신규 필드 + autoUserOrders map (Book에 store)

**2. Ontology Hull PRD v0.1 모든 LOCKED 결정**:
- Hull = display rendering style (filter X)
- 3 source: Sticker + Folder + Book (Tag/Label hull은 v3)
- Status nested (Option B): Status > Note/Wiki/Book sub-section
- Single hull source select 시스템 그대로 (multi-source 동시 toggle은 v3)
- Smart Book auto items 포함 (resolveBookItems via bookMembership prop)

**3. PRD 2개 분리 결정** — Smart Book v2 = Book entity 위주 / Ontology Hull = Ontology graph 위주. scope 명확, 독립 구현.

**4. Block 색 var 일관성 영구 룰** — status 색은 `var(--status-{stone|brick|keystone})`만. `var(--chart-N)`는 chart 시각화 전용 — LOCKED 색 변경 (teal→slate 2026-05-12 같은) 따라가지 않으므로 status에 mapping 금지.

**5. dnd-kit collision normalize 모든 board 영구 룰** — `useSortable("col-${key}")` + `useDroppable(key)` 이중 binding 시 over.id 비결정 반환. handler에서 `overId.startsWith("col-") ? overId.slice(4) : overId` 의무. notes/books/wiki 3 board 모두 적용 완료.

**6. Filter values icon 일관성 영구 룰** — Status filter 같은 cross-entity values는 각 entity의 chip/badge에 쓰이는 icon 그대로 재사용 (color dot 단독 사용 X). 사용자 시각 식별 의미 보존.

**7. Chapter context derive 패턴** — useBookContextNav 안에서 sourceRefId clustering (auto items + Tweak B로 매칭된 manual items). sourceRefId 없는 manual은 chapter context null (badge hide). UI caller가 5 store lookup으로 source name + glyph 표시.

**8. resolveBookItems 활용 패턴** — Smart Book auto items가 다른 view (Ontology hull / Book Detail Resume button 등)에서도 참여하려면 ontology-view에서 useMemo로 미리 compute → 자식 컴포넌트에 prop으로 override 전달. canvas가 store coupling 없이 props-driven 유지.

**9. `npm install` 첫 setup 영구 룰 후보** — 새 worktree 시 node_modules 없음 → dev server 시작 시 fractional-indexing 등 module not found. before-work 단계에 자동 체크 + install 또는 명시적 안내.

### 기술 학습 (영구)

- **dnd-kit DOM ref 이중 binding 회피** — collision detection 비결정 → 일관성 위해 모든 board 컴포넌트에 normalize 의무. 새 board 도입 시 동일 패턴 적용.
- **cmdk CommandItem + modifier key** — onSelect는 keyboard/mouse 공통, mouse event detail 없음 → multi-select 도입 시 explicit toggle mode (cmdk와 호환). modifier key 직접 처리 어려움.
- **FilterValue group field 패턴** — `group?: string` optional. FilterPanel이 group 변경 시점 detect → uppercase tracking label sub-header. nested UI 효과를 flat data shape로 달성.
- **PRD 분리 trigger** — 한 PRD scope이 다른 도메인 (Smart Book v2 안 Ontology Hull I/J) 침범 시 사용자 한마디로 분리 ("그러면 북스만으로도 묶고 그래야 될 듯"). PRD draft 시점에 분리 가능성 미리 명시.
- **Hull picker filter 패턴** — view-engine FilterCategory의 values runtime hydration. groupBy 따라 다른 entity list (sticker/book/folder/...) 동적 update. filter rule field name "hullEntity" + visibleHullKeys Set 추출 → canvas hull computation filter.
- **Sequence edge SVG marker pattern** — `<defs><marker id="book-seq-arrow">` 한 번 정의 + `markerEnd="url(#book-seq-arrow)"` 모든 paths reuse. `currentColor` inherit으로 각 line stroke 색 자동 매칭.
- **var(--chart-N) vs var(--status-*) 분리** — chart는 시각화 전용 (D3 등), status는 LOCKED 색. 잘못된 mapping이 LOCKED 색 변경 (이번 teal→slate) 따라가지 않는 회귀 원인.
- **Resolver 재사용 (외부 view)** — resolveBookItems가 pure function이라 ontology-view 등 다른 view에서도 호출 가능. 다만 store coupling 회피 위해 caller가 useMemo로 compute → prop으로 전달.

### Watch Out (다음 세션 주의사항)

- **사용자 manual verify가 마지막 단계** — PR #319 17 commits 코드는 다 됐지만 실제 사용성 verify 안 됨. 머지 후 hard refresh로 다음 큰 surface 5개 점검 (위 "첫 스텝" 참조)
- **bulk select 모드 UX** — Cmd+Click 충돌로 explicit 토글 우회. 사용자가 직관적인지 verify 필요. 자연 안 들면 modifier 기반 또는 별도 checkbox column 도입 follow-up
- **chapter context badge null cases** — manual items without sourceRefId는 badge hide. 사용자가 "왜 어떤 페이지는 chapter 표시되고 어떤 페이지는 안 되지?" 직관 깨질 수 있음 — 향후 manual chapter rename 또는 auto sourceRefId tagging 강화
- **Ontology hull 100+ entity 성능** — books/folders/stickers 다 합쳐서 100+ 시 hull computation 느려질 수 있음. Phase 4 hull picker filter로 부분적 mitigate, 본격 culling 미구현
- **node_modules 누락 패턴** — 새 worktree 첫 시작 시 자동 check + install 권장 (before-work 룰 후보)

### 환경 변경
- Store version: 변경 없음 (Phase G-1 데이터 모델 additive optional)
- Tests: 39 → 43 (Phase G-1 +4: userOrder priority / fallback / per-source scoping / empty map)
- 신규 파일:
  - `.omc/plans/smart-book-v2-prd.md`
  - `.omc/plans/ontology-hull-prd.md`
  - `docs/reference/linear/README.md` + 137 PNG
- 신규 store API: setLastRead / reorderAutoItem / clearAutoUserOrder
- 신규 types: BookItem.userOrder + Book.autoUserOrders + Book.lastReadItemId + Book.lastReadAt + FilterValue.group + FilterField "hullEntity" + GroupBy "book"
- 신규 view config: hullEntity filter category + showBookSequence toggle
- 영구 룰: status 색 var(--status-*) only / dnd-kit normalize all boards / filter values icon 일관성 / chapter context sourceRefId clustering / resolver 재사용 패턴

---

## 2026-05-12 (밤) — 집, Smart Book 전체 완성 (Phase A-F) + 4 polish PR (6 PR 누적)

> 🎯 **다음 즉시 액션**: Smart Book 5 source kind manual verify + buglist 수집 — 5 AutoSource 모두 활성됐으니 실제 사용자 워크플로우로 검증 + UX 구멍 발견 시 P0 follow-up.
>
> **사용자 의도**: 어제 작업한 Phase A (folder)만 사용해본 상태. Phase B-F는 코드 완성 + 단위 test pass 했지만 사용자 manual verify 안 됨. PRD §4 12 LOCKED 결정이 실제 UX와 맞는지 검증 필요.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `/library` Books → 임의 book 열기 (예: "Reading Journal" 또는 신규 생성) → "Add source" 클릭 → 5 tab 순회 (Folder / Category / Tag / Label / Sticker)
> 2. 각 tab에서 entity 1개씩 추가 → 본문 list에 해당 heading + items auto-resolve 확인
> 3. 같은 entity가 여러 source에 매칭될 때 first-source 하위에만 표시 (dedup) 확인
> 4. "Convert to manual" 클릭 → confirm → 모든 auto items가 manual items로 변환 + smartSources 비워짐 확인
> 5. Tag/Label/Sticker trash → 책 본문 auto items 자동 사라짐 (lazy detection). restore → 자동 revive
> 6. **Books list mode grouping** (PR #317 fix) — Display panel Grouping = Kind / Pinned 변경 시 group section header 표시 확인
>
> **확인 포인트**:
> - 5 tab 시각 일관성 (icon / preview count format / empty state)
> - SourcesSection chip 표시 vs 본문 chapter heading icon (📁/📚/#/🏷/✨) 매핑 일관
> - manual 노트가 tag source와 매칭될 때 sourceRefId tag (subtle badge로 UI 표시되는지 — 현재 미구현 가능성, BookItemRow 확인 필요)
> - Convert to manual 후 새 source 추가 시 freeze 작동 (앞서 변환된 items 안 흔들림)
>
> **구멍 가능성** (예상):
> - Empty book 상태에서 source 추가 → flow 자연스러운지
> - 5 tab 5 source picker dialog 좁아서 답답하지 않은지 (sm:max-w-md = ~448px)
> - 같은 source 재추가 dedup guard 토스트 표시 검증
> - sticker source는 sticker 자체에 멤버 없으면 silent skip — 사용자 confusion 가능 (UI에 "0 members" preview 있음)
> - `WikiArticle.tags` 필드가 실제 wiki seed에 있는지 (현재 wiki-4/5/7만 tag-2 매칭) — empty state로 더 다양한 시나리오 필요
>
> **참고 파일**:
> - `lib/books/resolver.ts` — 5 case + emit helper
> - `components/books/sources-section.tsx` — 5 tab dialog
> - `components/views/book-detail-page.tsx` — caller (store wire)
> - `lib/books/__tests__/resolver.test.ts` — 39 tests (각 case별)
> - `.omc/plans/smart-book-prd.md` — PRD spec (LOCKED 12개)
>
> **위험 + 회피**:
> - dev server :3002 stale build 가능성 (앞 세션 패턴) → 방문 시 hard refresh (Ctrl+Shift+R)
> - dnd-kit 패턴 (notes-board pattern) — Books도 같은 collision risk 있는지 cross-check (books-board.tsx)
> - 옛 IDB에 book.smartSources 형식 다를 수 있음 — migrate.ts 확인
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #317 merge 후
> **branch worktree**: `condescending-yonath-23775a` (다음 세션 새 worktree 권장)

### 완료 (6 PR 누적)

**1. polish PR #312 — BoardCard chip overflow + Wiki 그룹 헤더 아이콘 + lookup null guard**
- `components/property-chips.tsx:709` PropertyChipRow row container `overflow-hidden` 1줄 추가. chip wrapper + ChipShell `shrink-0`이라 row가 카드 폭 초과 시 chip이 박스 밖으로 빠져나오던 케이스 차단. Linear 패턴 (한 줄 + clip)
- `components/views/wiki-shared.tsx` — `WikiGroupHeaderIcon` 신규 (family/parent/role → Tree, tier → Stack, linkCount → Link, label → category color dot)
- `wiki-list.tsx:889` group header + `wiki-board.tsx:124` column header에 icon 적용 (Notes Table/Board/Gallery + Books와 정합)
- `note-fields.tsx` PRIORITY_CONFIG[value]에 `?? .none` fallback 2곳, `board-workbench.tsx` STATUS_CONFIG[status]에 `if (!cfg) return null` (PR #308 hotfix 패턴 확산)

**2. feat PR #313 — TrashEntityList multi-select (entity별 탭)**
- PR #311 TrashAllView 패턴을 books/tags/labels/templates/references/files 탭에도 동일하게 적용
- `notes-table.tsx` TrashEntityList: selectedIds Set state + hover-only row checkbox + isSelected 시 bg-accent/10 + 하단 floating bar (Restore / Delete forever / Clear)
- handleBulkRestore / handleBulkDelete (entity별 store action dispatch) + singularNoun helper

**3. feat PR #314 — Smart Book Phase B (Wiki Category source)**
- PRD §4 Phase B (~1-2h). Folder(A) → Category(B) 확장
- `ResolverStore`에 wikiArticles + wikiCategories optional 추가 (Phase A 호환)
- resolver `case "category"`: DAG (`WikiArticle.categoryIds?` array, any-match) → 📚 heading + wiki items
- `sources-section.tsx`: "Add folder" → "Add source" 단일 진입점 + Dialog 안에 Tabs (Folder / Category)
- ResolvedSource 단일 list에 두 kind 시각 통합 (folder icon vs category color dot + "FOLDER"/"CATEGORY" 태그)
- +10 category tests (DAG dedup, excludeIds, manual shadowing, stale ref, trashed wiki, empty skip, mixed folder+category, deterministic id)

**4. feat PR #315 — Smart Book Phase C+D+E (Tag/Label/Sticker, all 5 kinds active)**
- 3 source kind 한 번에 (~5h estimate, 1 PR로 통합)
- `emitSection` helper 추출 → folder/category/tag/label/sticker 모두 동일 흐름 (~80 line dedup)
- `noteIsCandidate` / `wikiIsCandidate` predicates 단일화
- **tag** (cross-entity) — Note.tags + WikiArticle.tags 같은 section 안에 mixed sort → `# {tag.name}` heading
- **label** (notes only) — `Note.labelId === refId` → `🏷 {label.name}`
- **sticker** (7-kind → 2-kind filter) — `members.kind === "note" || "wiki"`만 → `✨ {sticker.name}`
- Manual items `sourceRefId` tagging 5 kind 모두 probe (note: folder→label→tag→sticker / wiki: category→tag→sticker)
- UI: 5-col grid Tabs (icon-only, title hint), 5 candidate builder + preview count
- +11 tests (cross-entity, DAG, manual shadowing, label notes-only, sticker filter, mixed source dedup)

**5. feat PR #316 — Smart Book Phase F (trash guard + Convert to manual)**
- **Trash guard (LOCKED #11 lazy detection)**: tag/label/sticker source에 `if (!entity || entity.trashed) continue` 추가. trashed → silent skip, restore → 자동 revive
- WikiCategory + Folder는 hard-delete only라 기존 stale-ref guard로 충분
- **Convert to manual**: 새 button (sources 있을 때만). resolveBookItems → auto items 추출 → fresh uuid + clean BookItem shape → book.items append + smartSources/excludeIds clear. window.confirm 가드
- +4 trash guard tests (39 → 59/59 total resolver+utils pass)

**6. fix PR #317 — BookTable list mode grouping 무시 버그**
- 사용자 보고 (스크린샷): Display panel Grouping=Kind 선택 시 books list mode가 flat list만 표시 → 회귀 (board/gallery는 이미 groups 처리)
- `BookTable` props에 `groups?: BookGroup[]` + `groupBy?: GroupBy` optional 추가
- `isGrouped` 분기 + group section header (sticky band, top-9) + 내부 BookRow
- kind → BookKindIcon, pinned → PushPin/PushPinSlash
- `books-view.tsx` list mode에 `groups + groupBy` 전달

### 브레인스토밍 & 큰 결정 (영구)

**1. Smart Book 5 AutoSource INVARIANT 확정 (영구 LOCKED)** — PRD §2 그대로:
- BookItem.kind = `note` | `wiki` | `chapter-heading` 만
- AutoSource는 **공급원**이지 멤버 kind가 아님
- label/tag/sticker entity 자체가 책 페이지가 되는 게 X — label로 분류된 note들이 들어감
- Sticker는 7-kind 중 note/wiki만 추출 (다른 kind 무시)
- 사용자 헷갈림 가능 포인트로 PRD에 명시 — 다음 세션 사용자가 직접 사용해보면서 INVARIANT 체감 가능

**2. Phase A-F 전체 한 세션 완성 (incremental → 통합 PR 전략)** — PRD §4가 "각 phase 1 PR씩" 권장했지만 동일 패턴이라 C+D+E (1 PR) + F (1 PR) 통합 더 효율적. 사용자가 "전부 다 진행해"로 통합 승인. 시간 ~5h 추정, 실제 ~3h.

**3. `emitSection` helper 추출 → resolver pure function이 5 source 모두 동일 흐름** — Phase B만 있을 땐 inline OK였지만 5 source 추가하면서 dedup 압박. 추출 후 +25% 코드 가독성, 동시에 buggy edge case 줄어듦 (heading/items/seenAutoRefIds 업데이트 한 곳에서).

**4. Convert to manual button은 sources 있을 때만 표시** — 항상 표시하면 사용자 confusion (clicking unrelated thing). conditional render UX 더 자연스러움.

**5. Books list mode가 board/gallery와 패턴 갈리던 회귀 발견 — 사용자 시그널이 가장 빠른 진단** — 사용자 스크린샷 한 장으로 다음 워크플로우 잡음. 다음 작업 원칙 #8 ("사용자 직관 = 디자인 시그널") 재확인.

### 기술 학습 (영구)

**1. ResolverStore 새 필드는 optional + `?? []` fallback 패턴 안전** — Phase B 추가 시 test files 14곳 mock store 수정 부담. ResolverStore.wikiArticles?: WikiArticle[] (optional) + resolver 내부에서 `(store.wikiArticles ?? [])` 사용으로 Phase A-only caller (folder source만 쓰는 testー) silent compatible. 매번 phase 확장 시 같은 패턴 추천.

**2. `emit helper + predicate helper 분리`로 5-case 흐름 통일** — pure function 안에 case문 5개가 비슷한 코드 80% 중복일 때 helper 추출은 단순 짧음이 아니라 *논리 단일화* (heading + items + seenAutoRefIds 업데이트 한 곳에서). LOCKED #10 v1.2 (empty source silent skip) 같은 미묘한 룰도 단일 지점에서 보장.

**3. 5 tab UI grid 패턴** — Tabs grid-cols-5 + icon-only tabs (title hint) — 좁은 dialog (`sm:max-w-md`)에 5 tab 깔끔. Label은 길면 잘림 → tooltip으로 보완. 미래 6 tab 이상이면 dropdown 또는 segmented control 재검토.

**4. `groups + groupBy` props 누락 회귀 — view mode별 일관성 의무** — Notes/Wiki/Books 3 entity × 4 view mode (list/board/gallery/grid) 16 조합 중 한 곳 패턴 누락 = 사용자 직관 깨짐. 새 viewMode 추가 시 *모든 entity의 모든 view mode에 같은 prop 흐름 적용* 영구 룰. board/gallery만 적용하고 list 누락 같은 버그가 또 발생할 가능성 있음 (Wiki view-engine board 도입 시 회피).

**5. nanoid import는 npm package에서** — `import { nanoid } from "nanoid"` (already in `package.json`). uuid 생성에 사용. Convert to manual에서 fresh book item id 만들 때.

**6. PR #312-#317 6 PR 연속 squash merge — main conflict 패턴 정착** — 각 PR 머지 직후 다음 PR base가 stale (main 머지 결과 c5c5936→...). `git merge origin/main --no-ff` 후 `--ours`로 resolve 패턴 안정. tsconfig.tsbuildinfo + .omc/continuation-count.json 등 auto-gen 파일은 무조건 ours.

**7. Plot routing이 module-level state (`_activeRoute` in `lib/table-route.ts`)** — preview MCP로 wiki list/board 시각 검증 어려운 이유. `setActiveView('books')` 만으로는 view mount 안 됨. layout.tsx의 `isViewRoute` + `mountedViews` 로직 거쳐야. 시각 verify는 사용자가 dev server에서 직접 하는 게 더 효율적.

### Watch Out (다음 세션 주의사항)

- **Smart Book manual verify가 사용자 책임** — 5 source kind 코드 다 작성됐지만 사용자가 실제 워크플로우로 점검 안 했음. dev server :3002 새로고침 후 첫 verify에서 UX 구멍 나올 가능성 ↑
- **Convert to manual은 destructive (smartSources clear)** — undo path 없음. window.confirm 가드 있지만 사용자가 실수로 Yes 누르면 영구 변환. 다음 세션 사용자가 첫 시도 시 confirm dialog 명확한지 점검
- **5 tab dialog 너비 부족 우려** — sm:max-w-md = ~448px. 5 col icon tabs 빡빡할 수 있음. 사용자 시도 후 조정
- **사용자가 보고한 BoardCard chip overflow는 fix 됐지만 다른 view mode (Notes list mode chip / Books list mode)에 동일 issue 있을 수 있음** — 추가 보고 시 같은 패턴 (`overflow-hidden` row container) 적용
- **Smart Book FAQ — "왜 5 source가 다 필요해?"** — 사용자가 의문 제기. folder + category로 80% 가치, 다른 3은 edge case. 사용자가 사용 안 하면 Phase D/E는 dormant (UI 일관성으로 유지)

### 환경 변경
- Store version: 변경 없음 (Smart Book Phase A에서 이미 v121, B+은 idempotent additive)
- Tests: 55 → 59 (+4 trash guard)
- 신규 파일: 없음 (모두 기존 파일 확장)
- 사용자 IDB stale data: 없음

---

## 2026-05-12 (저녁) — 집, Trash All + Status-icon-stale root fix + Wiki pin + 9 fix mega-PR (Store v130 → v132)

> 🎯 **다음 즉시 액션**: BoardCard chip overflow fix — 사용자 보고 *"박스 밖으로 `#Productivity` 글자가 빠져나오는 연출이 있는데 이러면 안 됨. 박스 밖으로 빠져나가면 안 돼."*
>
> **사용자 의도** (스크린샷 동봉): board mode 카드 (예: "Build a Personal Wiki")의 tag/category chips row에서 마지막 chip (`#Productivity`)이 카드 box 우측 경계를 넘어 돌출. 박스 안에 contained 되어야 함.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `components/notes-board.tsx`에서 BoardCard (또는 BoardCardInner) 컴포넌트의 chips row 위치 찾기 (line ~400-600 추정, tag/category chip 렌더 부분)
> 2. chip row container에 `overflow-hidden min-w-0` + chip element 자체에 `truncate max-w-[...]` 적용
> 3. 정책 결정 (사용자 결정 필요):
>    - **A: Truncate** — 한 줄 유지, 잘림 (`…`). 카드 height 일정. Linear 패턴 정합. 추천.
>    - **B: Wrap** — 여러 줄. 정보량 ↑, 카드 height variable.
>
> **참고 파일**:
> - `components/notes-board.tsx` — BoardCard chips 위치
> - `components/notes-table.tsx` — list mode chip 패턴 (정합 비교)
> - `components/views/wiki-list.tsx:462` — wiki list tags column `w-[140px] shrink-0 ... overflow-hidden` 패턴
>
> **위험 + 회피**:
> - 다른 view mode (grid/gallery)에 같은 BoardCard 사용 여부 확인 (회귀 회피)
> - list mode chip은 별도 layout — 독립
> - chip text 너무 짧으면 truncate 의미 없음 — `max-w` 적당히
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 이번 PR merge 후 (Store v132)
> **branch worktree**: `quirky-colden-bcf3de` (다음 세션 같은 worktree 또는 새 worktree)

### 완료 (9 fix 통합 PR, Store v130 → v132)

**1. Trash "All" 통합 view 신규** — `components/views/trash-all-view.tsx` (~300 LOC 신규).
- 8 entity (Notes/Wiki/Books/Tags/Labels/Templates/References/Files) trashed 통합 표시
- entity별 section header (빈 section auto-hide), 통합 row layout `[icon][Kind badge][title][color dot?][trashed time][Restore][Delete forever]`
- Notes는 status별 `StatusShapeIcon` (stone/brick/keystone)
- `permanentlyDelete*` confirm dialog (TrashEntityList 패턴 정합)
- `notes-table.tsx`: import + `storeWikiArticles` 변수 + `trashTabCounts.all`에 wikiArticles 합산 보강 (count 모순 해소) + `trashFilter === "all"` 분기에 `<TrashAllView />` mount

**2. Status icon stale root cause 발견 + 3-layer fix** — SESSION-LOG의 "#2 Status icon stale" 보고 (이전 세션 reproduce 부족으로 skip).
- **root cause**: `notes-board.tsx:277-283` column outer DOM에 `useSortable("col-${key}")` + `useDroppable("${key}")` 동시 bind. dnd-kit collision detection이 sortable id를 우선 반환할 때 `targetKey = "col-stone"`이 그대로 status로 저장됨 → StatusShapeIcon (else→Cuboid/Block) + StatusBadge (`?? STATUS_CONFIG.brick` fallback → "Brick") mismatch
- **Fix #1 root prevention**: `notes-board.tsx:968` — `const targetKey = overId.startsWith("col-") ? overId.slice(4) : overId`. card drag 시 overId의 `col-` prefix strip
- **Fix #2 memo safety**: `notes-board.tsx:668` — BoardCard memo에 `prev.note.status === next.note.status` 추가 (board view drag 직후 leading icon stale 방지)
- **Fix #3 data recovery**: `migrate.ts` v131 — VALID_STATUSES Set 외 모든 status를 valid enum으로 복구. legacy enum (inbox/capture/permanent) re-map + `col-` prefix strip + stone fallback. Idempotent. Store 130 → 131

**3. v132 folderIds garbage cleanup** — 같은 dnd-kit root cause가 folderIds에도 garbage (`col-folder-1`, `col-_no_folder` 등) 저장 가능 (사용자가 본 toast "Added to col-_no_folder"). v132 마이그레이션 — `state.folders` Set 외 folderId 제거. notes + wikiArticles 둘 다 처리. Store 131 → 132

**4. Board drag default = Move semantic 반전** (작업 원칙 #8 사용자 직관 = 디자인 시그널) — 사용자 의도 *"옮기면 진짜로 속성이 바뀌어야 / 스테이터스일 땐 옮겨진 스테이터스로 / 폴더일 땐 옮겨진 폴더로"*.
- 이전: folder drop default = Add (N:M, 기존 유지 + 새 folder 추가) / Shift+drop = Move
- 변경: folder drop default = Move (folderIds 교체) / Shift+drop = Add
- status / priority / triage는 single-valued라 자동 Move (불변)
- toast description도 반전 ("Drop without Shift to move instead" / "Hold Shift to add (keep existing folders) instead")

**5. Books row checkbox hover-only** — `book-table.tsx:405-414` BookRow checkbox cell wrapper에 `checked ? "visible" : "invisible group-hover:visible"`. notes/wiki 패턴 정합. 사용자 보고 *"북스의 경우, 구분선 아래 북스 네임들 왼쪽에 체크박스들은 왜 눈에 보이게 체크가 되어있는 거지?"*

**6. Trash row multi-select + bulk action bar** — `trash-all-view.tsx` 확장 (~80 LoC 추가).
- `selectedKeys` Set state (`${kind}-${id}` 형식 — kind별 id collision 회피)
- row checkbox column (notes/wiki 패턴: hover-only, selected/selectionActive 시 visible)
- `handleRestoreSilent` / `handleDeleteSilent` helper (bulk action용, 단일 aggregated toast)
- 하단 floating bulk action bar (selection 활성 시): `N selected` + Restore + Delete forever + Clear (X)
- 사용자 보고 *"트래쉬의 경우 왜 체크박스가 없는 거야? 체크박스가 있어야지."*

**7. Wiki pin 위치 title 옆** — `wiki-list.tsx:426-435` title span의 `flex-1` 제거 + PushPin `className` `mx-1` → `ml-1`. Books `book-table.tsx:497-502` 패턴 정합. SESSION-LOG 영구 결정 PR #301 ("Pin 위치 = title 옆") 재실현. 사용자 보고 *"위키의 즐겨찾기 pin의 경우 title 우측에 있어야 하는데, 왜 스테이터스 칩 왼쪽에 있냐고. 북마크가 아니라 pin이었어!!"*

**8. Wiki "북마크 이상" 진단** — wiki-view trashed filter (line 372: `wikiArticles.filter((a) => !(a as { trashed?: boolean }).trashed)`) 정상 작동.
- preview_eval로 port 61869 `/wiki` 직접 verify → trashed=true 7개 wiki **표시 안 됨** (filter 적용 ✓)
- 사용자가 본 7개 = **port 3002 (crazy-raman-838a0c 이전 worktree) stale build** 화면
- pin icon mismatch (Atomic Notes / Linked Notes pin 표시)도 같은 stale build 영향. 데이터 검증 결과 모두 `pinned: false`

**9. tsc + production build 매 fix마다 clean 검증** — 작업 원칙 #3 의무.

### 브레인스토밍 & 큰 결정 (영구)

#### 1. dnd-kit 동일 DOM 이중 binding 위험 패턴 (영구 LOCKED)
- `useSortable("col-${key}")`와 `useDroppable("${key}")`를 같은 ref에 bind하면 collision detection이 어느 id 반환할지 비결정
- card drop 시 `over.id`가 sortable id (`col-stone`) 또는 droppable id (`stone`) 중 하나
- handler에서 무조건 prefix strip — `overId.startsWith("col-") ? overId.slice(4) : overId`
- **교훈**: dnd-kit DOM ref 합치기 신중. id format prefix 일관 + handler normalize.

#### 2. Board drag = Move semantic (default) — 사용자 직관 우선
- 영구 결정 변경 (2026-05-12 저녁): 이전 N:M 패턴 (default=Add, Shift=Move) → 직관 패턴 (default=Move, Shift=Add)
- 근거: "옮기면 옮겨져야"가 자연 사용자 모델. N:M power user는 Shift modifier 학습 가능.
- 작업 원칙 #8 (사용자 직관 = 디자인 시그널). 이전 결정 (PR (c))을 폐기하고 새 결정 LOCKED.

#### 3. row checkbox 패턴 — 모든 entity 일관 (영구 LOCKED)
- notes / wiki / books / trash 모두 동일: hover-only 또는 selected/selectionActive 시 visible
- 패턴: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`
- 단일 source of truth: notes-table NoteRow / wiki-list ArticleRow / book-table BookRow / trash-all-view TrashRow

#### 4. Pin 위치 = title 옆 (영구 결정 #301 재확인)
- elastic-darwin-382a48의 status chip 옆 이동 (`1d8b30f`)은 폐기
- 모든 entity 표준: notes (notes-table) / wiki (wiki-list) / books (book-table) 동일
- 핵심 패턴: title span의 `flex-1` 제거 + pin `ml-1 shrink-0` (Books book-table.tsx:497-502이 reference 구현)

#### 5. Migration 패턴 — root prevention + data recovery (작업 원칙 #5 정합)
- 코드 fix만으로는 이미 corrupted된 IDB 데이터 정리 X
- root prevention (코드) + data recovery (migration) 2-layer 필수
- v131 / v132 둘 다 idempotent (valid 데이터 pass through). 재실행 안전.

#### 6. Wiki "북마크 이상" 사용자 표현 명확화
- 사용자가 "위키 북마크"라 한 것은 **pin icon (즐겨찾기) 위치 문제** 였음 (북마크 = bookmark가 아님)
- 사용자 표현 신중히 해석 — 단어 의미 추측 시 사용자에게 확인이 효율적

#### 7. Dev server 다중 worktree 환경 stale build 위험 (영구 학습)
- port 3002 (이전 worktree crazy-raman) + port 61869 (이번 worktree quirky-colden) 동시 실행
- 사용자가 port 3002 화면 보고 있어서 fix 안 보임 → mismatch 보고
- 매 fix 후 사용자에게 정확한 port URL 안내 필수. `preview_list` 로 dev server inventory 확인

### 기술 학습 (영구)

- **dnd-kit collision detection**: `useSortable`은 내부적으로 `useDroppable` 포함. 같은 DOM ref에 둘 다 bind 시 over.id가 어느 id 반환할지 비결정 (sortable id 우선 가능). handler에서 id normalize 필수.
- **Zustand persist `partialize`**: notes의 content/contentJson 제거 후 저장 (line 264). body는 별도 IDB store (`plot-note-bodies`). migration 시 state.notes에 content/contentJson 없을 수 있음 — preview 검증에 영향 없음.
- **`(item as any).field` 패턴**: TypeScript optional field 접근 시 안전. WikiArticle.trashed는 필수 필드이지만 future-proof 보존 패턴.
- **preview_eval로 IDB 직접 dump**: `indexedDB.open("plot-zustand")` + `tx.objectStore("kv").getAll()` 로 store 전체 dump. zustand persist storage 검증에 효과적.
- **사용자 IDB-aware migration**: SEED 코드 vs 사용자 데이터 분리. SEED는 새 enum만 사용해도, 사용자 IDB는 옛 enum (또는 garbage) 잔존 가능. migration이 root cause 진단 + recovery 둘 다 담당.
- **multi-server preview troubleshooting**: 사용자가 본 화면 ≠ AI가 verify한 화면 일 수 있음. port URL 명시 + `preview_list` 로 inventory 확인.
- **Hover-only checkbox class 패턴**: `selectionActive || isSelected ? "visible" : "invisible group-hover:visible"`. 부모에 `group` className 필수. notes/wiki/books/trash 일관.
- **floating bulk action bar (sticky bottom)**: `sticky bottom-4 z-20 mx-auto w-fit ... backdrop-blur shadow-lg`. selection 활성 시 mount, clearSelection X 버튼 포함. notes FloatingActionBar / wiki WikiFloatingActionBar / trash TrashAllView 동일 패턴.

### Watch Out (다음 세션 주의사항)

- **BoardCard chip overflow fix scope**: BoardCard가 board mode + grid mode (또는 다른 viewMode) 공유 컴포넌트일 가능성. fix 시 다른 viewMode 회귀 확인 필요.
- **사용자 IDB v132 migration 적용 후 데이터 검증**: 사용자가 page reload 시 `[migrate] v130→v131` + `[migrate] v131→v132` console log 확인. 만약 누락된 notes 발견되면 silent migration이 어떤 garbage를 stone fallback으로 치환했는지 확인 (사용자 알림 필요할 수도).
- **TrashEntityList multi-select 미적용**: entity별 trash 탭 (books/tags/labels/...) 은 그대로. 사용자가 entity별 multi-select 원하면 follow-up PR.
- **Board drag Move semantic 변경 사용자 학습 필요**: 이전 default = Add 익숙한 사용자는 처음 drag 시 기존 folder 제거에 놀랄 수 있음. toast description ("Hold Shift to add" hint)으로 안내.
- **dnd-kit DOM ref 합치기 다른 곳에도 점검 가능**: books-board.tsx 등 같은 패턴 사용. 같은 mismatch 잠재.
- **migrate.ts v131/v132 silent 변환 로그 위치**: 사용자가 reload 후 console에서 확인. dev tools 안 열면 못 봄. toast 알림 추가 후보.
- **이전 worktree (crazy-raman-838a0c) port 3002 dev server**: 사용자가 여전히 사용 중이면 stale build 본다. 새 worktree로 이전 권장.

### 환경 변경

- Store version: v130 → **v132** (NoteStatus garbage cleanup + folderIds garbage cleanup)
- 신규 파일: `components/views/trash-all-view.tsx` (~300 LOC + multi-select 80 LOC)
- 수정 파일: `components/notes-board.tsx` (overId strip + memo + Move semantic 반전), `components/notes-table.tsx` (TrashAllView import + storeWikiArticles + trashTabCounts.all 보강 + 분기 mount), `lib/store/migrate.ts` (v131 + v132 추가), `lib/store/index.ts` (version 132), `components/books/book-table.tsx` (checkbox hover-only), `components/views/wiki-list.tsx` (pin 위치 title 옆)
- Tests: 미실행 (작업 원칙 #3은 build/tsc만 의무, tests는 follow-up). 단 코드 변경은 unit test 영향 없을 추정.

---

## 2026-05-12 (오후) — 집, Board/Gallery polish + Split view fix + hotfix (4 PR cascade)

> 🎯 **다음 즉시 액션**: Trash "All" 통합 view 신규 컴포넌트 구현.
>
> **사용자 의도** (이번 세션 명시): *"ALL은 모든 entity의 trashed 통합 표시. 노트든 위키든 태그든 라벨이든 삭제된 것들은 전부 ALL에 나와야"*. 현재 코드 = count 통합, display는 notes만 (모순 — 사용자가 "All에 1인데 아무것도 없어" 본 이유).
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `components/views/trash-all-view.tsx` 신규 파일 작성
> 2. `notes-table.tsx`의 `isTrashView && trashFilter === "all"` 분기에 TrashAllView mount
>
> **컴포넌트 구조**:
> ```
> <TrashAllView>
>   {/* entity별 section, 빈 section은 hide */}
>   <Section title="Notes" count={notesTrashed.length}>
>     {notesTrashed.map(n => <TrashRow note kind="note" />)}
>   </Section>
>   <Section title="Wiki Articles" count={wikiTrashed.length}>...</Section>
>   <Section title="Books" count={booksTrashed.length}>...</Section>
>   <Section title="Tags">...</Section>
>   <Section title="Labels">...</Section>
>   <Section title="Templates">...</Section>
>   <Section title="References">...</Section>
>   <Section title="Files">...</Section>
> </TrashAllView>
> ```
>
> **TrashRow layout** (단일 통합 — entity 무관):
> ```
> [icon] [entity badge] [title]                    [Restore] [Delete forever]
> ```
>
> **Store action 매핑** (entity별 restore + delete forever):
> | Entity | Restore | Delete forever |
> |--------|---------|----------------|
> | Note | `toggleTrash(id)` | `deleteNote(id)` |
> | WikiArticle | `updateWikiArticle(id, { trashed: false })` | `deleteWikiArticle(id)` |
> | Book | `restoreBook(id)` | (store action 없음, 사용자에게 toast로 안내) |
> | Tag | `restoreTag(id)` | (별도 — 또는 trashed=true 유지) |
> | Label | `restoreLabel(id)` | (별도) |
> | Template | `restoreTemplate(id)` | (별도) |
> | Reference | `restoreReference(id)` | (별도) |
> | Attachment | `restoreAttachment(id)` | (별도) |
>
> 각 entity의 hard-delete action 존재 여부는 `lib/store/slices/*.ts`에서 확인. 없으면 trashed=true 유지 + 사용자에게 안내.
>
> **데이터 source**:
> - `state.notes.filter(n => n.trashed)`
> - `state.wikiArticles.filter(w => w.trashed)`
> - `state.books.filter(b => b.trashed)`
> - `state.tags.filter(t => t.trashed)`
> - `state.labels.filter(l => l.trashed)`
> - `state.templates.filter(t => t.trashed)`
> - `Object.values(state.references).filter(r => r.trashed)`
> - `state.attachments.filter(a => a.trashed)`
>
> **trashTabCounts.all 보강** (notes-table.tsx:408): 현재 wikiArticles 누락. wiki도 추가.
>
> **위험 + 회피**:
> - JSX conditional render: 모든 `{cond && <X .../>}` → `{cond && (<X />)}` (이번 세션 hotfix 교훈)
> - lookup map: `STATUS_CONFIG`처럼 entity-specific lookup도 null guard
> - 각 entity의 `restoreXxx` 시그니처 차이 — `(id: string) => void` 일관 가정
>
> **참고 파일**:
> - notes-table.tsx 의 `trashTabCounts` (line 398-418) — count 통합 logic
> - lib/store/slices/{notes,wiki,books,tags,labels,templates,references,attachments}.ts — restore action
> - components/note-context-menu-items.tsx — Trash/Delete forever action 패턴 참고 (notes-table)
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR #309 머지 후 (docs sync)
> **branch worktree**: `crazy-raman-838a0c` (다음 세션 같은 worktree 사용 가능, 또는 새 worktree)

### 완료 (4 PR + 5 user-reported issues)

**PR #305** ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (이전 entry 참조)

**PR #306** Split view secondary pane workbench hide
- `usePane()` 사용. `pane === "secondary"`일 때 BoardWorkbench hide.
- viewport 절반에서 column 잘림 + workbench 안 보임 UX 부자연 해소.
- primary pane: 그대로 (workbench 시그니처 보존).

**PR #307** Block 색 slate + Gallery click parity + 하단 FloatingActionBar
- **Block 색**: teal `#0E9384/2dd4bf` → slate `#475569/94a3b8` (Plot 건축 메타포 정합 — stone beige + brick orange + block slate earthy progression).
- **Gallery click parity** (list/board와 동일 muscle memory):
  - Single click → preview pane
  - Double click → 편집 모드
  - cmd/ctrl-click 또는 selection 활성 중 click → toggle multi-select
  - Hover 시 카드 우상단 checkbox UI
  - Selection 활성 시 하단 FloatingActionBar mount
- 5 파일 변경: notes-table-view (callback wiring), gallery-view-shell (selection state + FloatingActionBar), gallery-view (props 확장 + GalleryCard checkbox), property-chips (이미)

**PR #308** Hotfix — notes-board JSX parser + FloatingActionBar cfg null guard
- **JSX parser fix**: PR #306의 `{!isSecondaryPane && <BoardWorkbench .../>}` 가 webpack/swc parser에서 "unterminated regexp literal"로 오해석 → 페이지 빈 화면. parens 명시화 `(<BoardWorkbench ... />)`로 해결.
- **TypeError null guard**: `STATUS_CONFIG[status]` undefined 시 `cfg.bg` crash → `if (!cfg) return null` graceful skip.

**5 사용자 보고 처리**:
- ✅ Block 아이콘 색 (#1) → PR #307
- ⏭️ Status icon stale (#2) → root cause 정보 부족, skip (사용자 reproduce 필요)
- ✅ 보드/갤러리 7개 (#3) → PR #305 (빈 status column 항상 표시 fix)
- ✅ 갤러리 click → selection (#4) → PR #307
- ✅ 스플릿 뷰 보드 잘림 (#5) → PR #306

### 브레인스토밍 & 큰 결정 (영구)

**1. Block 색 = slate (Plot 건축 메타포 LOCKED)**: teal 폐기. 자연석 (stone beige) → 가공 벽돌 (brick orange) → 완성 granite block (slate) earthy progression. chart-5 accent와 시각 분리 + status "settled" 의미 보존.

**2. Gallery click 패턴 = list/board parity (Linear principle LOCKED)**:
- Single click = preview (list/board와 동일 muscle memory)
- Double click = open (편집 — 명시적 의도)
- cmd/ctrl-click 또는 selection 중 click = multi-select toggle
- Hover → checkbox UI
- Selection 활성 시 → 하단 FloatingActionBar (list 정합)
- 모든 view mode가 동일 패턴 = 학습 부담 0

**3. Split view 보드 = secondary pane workbench hide**:
- viewport 절반에서 workbench `flex-1` grow가 column 잘림
- primary pane만 workbench (시그니처 패널 유지)
- secondary pane은 board column만 (drop target 보존, batch action은 primary로 유도)

**4. STATUS_CONFIG 패턴 — lookup map null guard 의무**:
- `STATUS_CONFIG[status]` 등 lookup이 corruption/옛 enum/빈 값으로 undefined 가능
- 모든 caller에 `if (!cfg) return null` graceful skip — crash 대신
- 다른 lookup map 동일 패턴 검토 후보 (PRIORITY_CONFIG, STATUS_LABELS, BOARD_DEFAULT_GROUP)

**5. JSX `{condition && <X .../>}` 위험 패턴**:
- webpack/swc parser가 `/>}` 시퀀스를 regex literal로 오해석 (잠재적 버그)
- parens 명시화 `{condition && (<X ... />)}` 가 안전
- 향후 conditional JSX는 무조건 parens.

### 기술 학습 (영구)

- **JSX parser ambiguity**: webpack/swc는 `/>}` 를 regex literal 시작으로 오해석 가능. parens가 expression boundary 명확화. dev server "unterminated regexp literal" 에러 = 같은 패턴 의심.
- **STATUS_CONFIG runtime corruption**: store의 normalize는 type-level 보호. 단 user IDB의 stale enum / data corruption은 runtime에 cfg undefined. 모든 lookup access에 null guard.
- **Gallery selection 진입 패턴 (Linear principle 정합)**: cmd/ctrl-click + hover checkbox + selection 활성 중 일반 click도 toggle = 3 entry points. selection 종료 = ESC 또는 X 버튼 또는 빈 영역 click.
- **GalleryCard onClick 시그니처 변경**: `() => void` → `(e: React.MouseEvent | React.KeyboardEvent) => void` (modifier key 검출). 외부 caller signature 영향 — 사용자 callback도 event arg 받도록.
- **dropAnimation cubic-bezier 220ms**: 즉시 snap (default) → 부드러운 transition. easing `(0.18, 0.67, 0.6, 1.0)` overshoot-light, sideEffects `defaultDropAnimationSideEffects + active opacity 0.4`.
- **빈 status group의 Kanban 의미**: drop target 유지 필수. `groupBy === "status"` 분기로 dynamic group (folder/label)과 격리.

### Watch Out (다음 세션 주의사항)

- **#2 Status icon stale**: 사용자가 본 시그널의 정확한 reproduce 정보 필요 (어느 view / 어느 element / drag 직후 vs reload 후). store status 값은 정상 (stone/brick/keystone) — corruption은 다른 layer 의심.
- **PR cascade 시 conflict 빈번**: 매 PR squash 머지 후 다음 PR base가 diverge. `git fetch + merge origin/main` + build artifact (.omc/continuation-count.json, docs/.pdca-status.json, tsconfig.tsbuildinfo) `--ours` resolve 패턴 정착.
- **JSX expression 위험 패턴 회피**: 모든 conditional render는 parens (`{cond && (<X />)}`). HMR에서 dev parser 에러 시 같은 패턴 의심.
- **Gallery selection state는 GalleryViewShell 안만**: Wiki Gallery (gallery-view 직접 사용)는 selection prop optional이라 back-compat. Notes Gallery만 multi-select 활성.
- **STATUS_CONFIG null guard pattern**: 다른 lookup map (PRIORITY_CONFIG 등)도 동일 패턴 적용 후보. 다음 PR로 점검.

### 환경 변경

- Store version v130 (이번 세션 변경 없음)
- Tests: 255/255 (변화 없음 추정)
- 신규 파일: 없음
- 4 PR squash merged (#305-#308)
- 사용자 IDB에 wiki-1/2/3 trashed=true (이전 세션에서 발견, 사용자 결정 대기 — restore or 영구 삭제)

---

## 2026-05-12 (낮~오후) — 집, ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편

> 🎯 **다음 즉시 액션**: Trash "All" 통합 view 구현 (notes/wiki/books/tags/labels/templates/refs/files 통합 list — sample fix needed, ~150-200 LOC).
> **머신**: 집 (Windows)
> **현재 main HEAD**: PR 진행 예정 (이번 세션 변경 squash)

### 완료 (11 작업)

**1. Dev server fix** — `node_modules` 누락 → `npm install` (395 packages). 신규 worktree 진입 시 표준 사전 작업.

**2. Books list mode pin 위치 fix** — title span의 `flex-1` 제거 → 짧은 title 옆 즉시 pin (이전: cell 우측 끝, Kind chip 옆으로 밀림). 측정 검증: gap title→pin 4px / pin→Kind 555px+.

**3. Notes Source filter values 아이콘 추가** — Manual (PencilSimple) / Web Clip (Globe) / Import (DownloadSimple). PR #299의 Books Kind filter icon 패턴 정합. notes-table SourceIcon helper와 동일 매핑.

**4. NEXT-ACTION.md 영구 폐지** — 정보 3중복 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG 끝 "다음") 해소.
- 다음 세션 즉시 액션 = **SESSION-LOG entry 첫 줄 hook + TODO P0**
- `~/.claude/commands/before-work.md` + `after-work.md` (글로벌, 머신마다 vergent) → `.claude/commands/` (project-level, git tracked) 이전 + 재편
- docs 4곳 (CONTEXT/MEMORY/SYNC-PRD/TODO)에서 NEXT-ACTION 참조 정리

**5. Split view popover에 Books 옵션 추가** — view-header.tsx `SECONDARY_SPACE_CONFIG`에 7번째 entity. icon = `BookOpen` (영구 결정: Sidebar entity identity = BookOpen, Library의 phosphor `Books` icon과 시각 구별). 분산된 다른 list (ALL_SPACES, DEFAULT_ROUTES, editor-breadcrumb) 모두 7-space 정합 확인.

**6. Wiki seed 4개 확장 + v130 backfill migration** — Cherry-pick verify 위해 다양성 추가. wiki-4 (Linked Notes, pinned, Knowledge Mgmt) / wiki-5 (Atomic Notes, pinned, multi-category) / wiki-6 (Working Memory, stub — isWikiStub 분기 verify) / wiki-7 (Sönke Ahrens, note-ref backlink). 기존 사용자 IDB에도 inject (id-dedup append, Books v127 패턴).

**7. Cherry-pick `42c6e59` — Wiki UX 3 issues fix** (ludimast가 어제 저녁 elastic-darwin branch에 작업, PR 미생성). 깔끔한 cherry-pick (Pin 위치 변경 1d8b30f는 자동 제외 — title 옆 영구 결정 보존).
- **Wiki 우클릭 메뉴 cursor 추적** (Radix `<ContextMenu>` wrapper로 교체)
- **WikiFloatingActionBar에 Pin/Move/Add to category 액션 3개 추가** (기존 Merge/Split/Delete만 → 6개)
- **GalleryView 우클릭 핸들러 추가** (`renderContextMenu` render-prop + `GalleryCard` forwardRef)
- DRY helper `WikiArticleMenuItems` (row/DotsThree popover/gallery 3 surface 공유)

**8. ContextMenu DRY refactor — Notes 측 동일 패턴** (helper extraction + 3 surface mount). Linear principle (모든 surface에서 동일 action set).
- `components/note-context-menu-items.tsx` 신규 helper (320 LOC) — 13 items (status별 conditional + Remind submenu + Pin + Open + Merge + Split + Link + Show connected + Move to folder + Add to folders + Open in Split View)
- notes-table.tsx: ContextMenu body → helper call (refactor, 시각 변경 0)
- notes-board.tsx: 3-item 메뉴 → 13-item (helper mount + 누락 callback wiring)
- gallery-view-shell.tsx: `renderContextMenu` prop으로 helper mount (Notes Gallery 우클릭 신규)

**9. BoardWorkbench보강 — Pin/Folder/Split 액션 추가** (Linear principle parity with list-mode FloatingActionBar). 우측 패널 시그니처 보존 + 신규 "Organize" 섹션 (mixed→pin batch, Move to folder picker, Split conditional for 1-selected).

**10. Notes board UX polish** (3 fix)
- Drag jitter fix: card className `transition-all` → `transition-colors` (transform/opacity 제외 = dnd-kit 프레임 업데이트와 충돌 X)
- 빈 status column 항상 표시: `groupBy === "status"`이면 `notes.length === 0`이라도 render (Kanban 패턴 — drop target 유지)
- Smooth drop animation: `<DragOverlay dropAnimation={{ duration: 220, easing: cubic-bezier, fadeOut }}>`

**11. 시각 폴리시** (`app/globals.css`)
- `.a-tg__label` font-size 11px → 13px (그루핑 헤더 키움, status icon은 이미 있음)
- notes-table subheader inline override 10.5px → 12px
- `.a-row__cell` font 12px / muted-fg → 13px / fg (메타데이터 선명)
- `.a-row__links` / `.a-row__words` / `.a-row__updated` font 11.5px / soft-fg → 12.5px / fg

### 브레인스토밍 & 큰 결정 (영구)

**1. NEXT-ACTION.md 영구 폐지 (2026-05-12 LOCKED)**:
- 정보 3중복 해소 (TODO P0 + SESSION-LOG hook = 단일 진실 두 source)
- 글로벌 commands → project-level (git tracked) 이전. 두 머신 자동 동기화.
- 새 before-work: SESSION-LOG 최신 entry + TODO P0 읽기. 새 after-work: SESSION-LOG entry 첫 줄에 "다음 즉시 액션 hook" 통합.

**2. Pin indicator 위치 = title 옆 (name 오른쪽) 영구 결정 재확인**:
- 직전 세션 끝 "status chip 옆"으로 정정된 줄 알았으나 실제 PR #301 commit message 영구 결정 = "title 옆 우측 (status chip / label chip 안 침범)"
- `elastic-darwin-382a48` branch의 `1d8b30f` (status chip 옆 이동)은 사용자 폐기 결정
- = title 옆 inline pin = 모든 entity (Notes/Wiki/Books) 표준

**3. Multi-select UI 패턴 (Linear principle + Plot 도메인 분리)**:
- **List mode** → 하단 FloatingActionBar (compact)
- **Board mode** → 우측 BoardWorkbench (시그니처 패널, 풍부)
- **Gallery mode** → 하단 FloatingActionBar (compact, 향후 신규 PR)
- **공통 action set** (Pin/Folder/Trash 등)은 mode 무관 동일. **presentation만 mode-specific**.

**4. ContextMenu DRY 패턴 (Linear principle)**:
- 모든 surface (list row / board card / gallery card)가 동일 13-item 메뉴 (status별 conditional 포함)
- `note-context-menu-items.tsx` helper가 단일 source
- callback wiring은 caller-specific (store action 직접 호출)

**5. Kanban 패턴 — 빈 status column 항상 표시**:
- 카드를 drag로 다른 column에 옮긴 후 원래 column이 비어도 column 유지 (drop target)
- `groupBy === "status"`일 때만 (folder/label 등 dynamic group은 기존 동작)

**6. Books entity identity icon 분기**:
- ActivityBar / Sidebar의 entity space = `BookOpen` (영구 결정, PR #298)
- ViewHeader Secondary popover의 Books entry = `BookOpen` (이번 세션 추가)
- Library의 phosphor `Books` (책 모음 메타포)와 시각 구별

**7. Trash "All" tab 의미 = 통합 (모든 entity)**:
- 현재 코드 = count 통합, display는 notes만 (모순 + 사용자 혼란)
- 다음 세션 P0: 통합 view 컴포넌트 신규 (entity별 section, ~150-200 LOC)

### 기술 학습 (영구)

- **transition-all과 dnd-kit transform 충돌**: card의 `transition-all`이 transform property도 transition 처리 → 매 프레임 업데이트마다 부드럽게 따라가려다 jitter. `transition-colors`로 제한이 정답.
- **DragOverlay dropAnimation**: dnd-kit 기본 동작은 즉시 snap. `dropAnimation={{ duration, easing, sideEffects: defaultDropAnimationSideEffects(...) }}` 명시로 부드러운 drop polish.
- **Cherry-pick id-dedup pattern**: SEED backfill에 `existingIds = new Set(...)` + 누락분만 push (Books v127 → Wiki v130 동일 패턴). 사용자 IDB의 기존 데이터 보존.
- **dnd-kit + transition-colors 조합**: Tailwind `transition-all`은 흔히 hover effect 위해 쓰이지만, dnd 컴포넌트에는 위험. specific transition class (`transition-colors`, `transition-shadow`) 권장.
- **빈 group의 default hide 부작용**: kanban 패턴은 빈 column이 drop target. 단 dynamic group (folder/label)에는 자연스러운 hide. groupBy 분기 필수.
- **Helper extraction 시 dual signature**: helper가 store action을 직접 호출 X (caller flexibility). callback prop으로 받음. 단 helper 내부에서 항상 동일한 store action (예: `usePlotStore.getState().openInSecondary`)는 직접 호출 OK.
- **Cherry-pick으로 다른 머신 작업 통합**: `git cherry-pick -n <commit>`으로 staging만 하고 검토 후 우리 변경과 함께 commit. 1d8b30f (Pin 위치 폐기 변경)이 base여도 그 변경분이 묻어들어오지 않음 (auto-merge가 conflict 없이 처리).

### Watch Out (다음 세션 주의사항)

- **Trash 통합 view 작업 시**: entity별 restore action 분기 (toggleTrash for notes, updateWikiArticle for wiki, restoreBook/Tag/Label/Template/Reference/Attachment). delete forever는 deleteNote / deleteWikiArticle / ... 또는 store에 hard-delete 없는 entity는 trashed=true 유지 + 별도 처리.
- **사용자 IDB의 wiki-1/2/3 trashed=true**: 사용자가 이전 세션에 의도적 trashed 또는 코드 버그. 다음 세션에 사용자가 restore 또는 영구 삭제 결정.
- **Books grid/board/gallery pin 위치**: list mode만 이번 세션 fix. grid는 cover icon 큰 layout, board는 카드, gallery는 entity-agnostic adapter. 사용자 manual verify 후 필요 시 추가 fix.
- **글로벌 commands 양 머신 수동 삭제**: `rm ~/.claude/commands/before-work.md` + `after-work.md` (두 머신 모두). 안 하면 글로벌과 project-level 충돌 (이번 세션 /after-work가 글로벌 정의로 invoked됐던 이유).
- **`elastic-darwin-382a48` 브랜치**: cherry-pick 후 main 통합 완료. 브랜치 자체는 폐기 (사용자 의도 외 status chip 옆 Pin 변경 포함).
- **Notes board drop animation cubic-bezier**: 220ms 가 너무 길거나 짧으면 사용자 manual verify로 조정 후보.
- **Trash count vs display 모순 잔존**: trashTabCounts.all = 모든 entity 합 (1) but display = notes만 (0). 사용자가 "1인데 아무것도 없어" 시그널. 통합 view fix 시점에 해소.

### 환경 변경

- Store version v129 → **v130** (Wiki seed backfill — id-dedup append)
- Tests: 255/255 (변화 없음 추정 — 코드 변경에 unit test 영향 없음)
- 신규 파일: `components/note-context-menu-items.tsx` (DRY helper)
- 삭제 파일: `docs/NEXT-ACTION.md` (영구 폐지)
- Project-level commands: `.claude/commands/before-work.md` + `after-work.md` (새 정의)

---

## 2026-05-12 (저녁~밤) — 집, 거대한 세션 (10 PR 시리즈 + polish)

### 완료

직전 entry "2026-05-12 (오후)"의 PR #291/#292 (시리즈 시작)에 이어 거대한 polish + extension 세션. 사용자 manual verify 흐름과 강하게 결합 — 매 verify 후 회귀 시 즉시 fix → commit → 머지 반복.

**PR 시리즈 10 (Store v122 → v129)**:
- PR #292 — view-engine 4 viewMode 통합 (grid/list/board/gallery)
- PR #293 — BookTable column-rich + checkbox (NotesTable 정합)
- PR #294 — Kind-shape carries meaning (Lightning/Sparkle/PencilSimple + 색)
- PR #295 — SEED_BOOKS 8 demo books (manual verify 가능 데이터)
- PR #296 — v127 migration backfill (기존 사용자 books 있어도 seed inject)
- PR #297 — Polish 1: SEED emoji 제거 + Display properties 확장 (Sources/Pin column toggle) + groupBy "status" stale validation
- PR #298 — **emoji 영구 폐기** + Phosphor BookKindIcon 통일 (Plot icon 시스템 정합)
- PR #299 — Polish 2: BookKindChip 색 (StatusBadge 패턴) + Filter Kind values icon + Save view 버튼 통일 (Trash chip 제거)
- PR #300 — Pin 통일: Books floating action bar 신규 + Notes 우클릭 메뉴 + Notes FloatingActionBar Pin
- PR #301 — Notes/Wiki title 옆 inline pinned indicator (Books 정합)

**부속**:
- Plan: `.omc/plans/books-view-engine-integration.md`
- launch.json: `node next/dist/bin/next` → `npx next` (한글 경로 안전성)
- Plot icon 시스템 = Phosphor outline only (color emoji 영구 X)
- 4 store migrations (v126→v127→v128→v129)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. 사용자 결정 4가지 (AskUserQuestion)
- PR 분할: C 점진 4 PR
- viewMode default: grid (cover emoji 활용)
- default sort: updatedAt desc
- default groupBy: none

#### 2. Option A — Plot 일관성 풀 (Books dnd-kit)
- column drag/reorder + card drag/drop
- card drag UX 분기:
  - pinned: 즉시 toggle (안전)
  - kind smart/hybrid → manual: confirm dialog (destructive)
  - kind manual → smart/hybrid: toast hint (BookDetailPage 안내)

#### 3. Books 자체 정체성 — kind 유지 (status 도입 X)
사용자 brainstorm 끝 통찰: "config에 status 빼고 kind 넣기" — BOOKS_VIEW_CONFIG가 이미 그렇게 됨 + normalizeViewState books-specific validation으로 stale "status" 자동 reset. **Books에 status 추가 거부** — kind 자체로 충분.

#### 4. emoji 영구 폐기 (Plot icon 시스템)
- Apple/Unicode color emoji는 Plot 미니멀리즘 + Phosphor outline 시스템과 mismatch
- BookKindIcon이 cover 책임 (kind 표현)
- Book.coverEmoji 타입 필드 보존 (round-trip), UI 안 읽음
- 미래 Phosphor icon picker 시 Book.coverIcon 신규 필드

#### 5. Pin 통일 = 모든 entity 표준
- 우클릭 메뉴 + 플로팅 바 + inline indicator
- Wiki도 inline indicator 적용. 단 Wiki 우클릭/플로팅 Pin은 follow-up

#### 6. Books DisplayPanel groupingOptions = [none/kind/pinned]
- normalizeViewState books-specific validation (CONTEXT_VALID_GROUP_BY map)
- stale "status" 자동 reset to "none"

#### 7. Notes/Wiki/Books cover/leading icon 시스템
- Notes leading: StatusShapeIcon (Hexagon/Cube/Cuboid2x2)
- Books cover/leading: BookKindIcon (Lightning/Sparkle/PencilSimple)
- Wiki: IconWikiStub/IconWikiArticle
- 모두 phosphor outline + 색 (kind/status별 차별)
- Sidebar entity identity = 단일 icon (Books=BookOpen, Wiki=BookOpen with color 등) — kind 차별 안 함

### 다음 (NEXT-ACTION.md 참조)

🔴 **Pin indicator 위치 fix** — Notes/Wiki는 현재 title 옆이지만 사용자 시그널은 **status chip 옆**. notes-table row + wiki-list row의 status column 안 또는 옆.
🟡 **Wiki 우클릭 메뉴 + 플로팅 바 Pin** — PR #300 follow-up.
🟢 **Books view-engine 시리즈 manual verify** — 회귀 발견 시 즉시 fix.

### Watch Out

- **emoji UI 분기 제거됐지만 데이터는 보존** — `Book.coverEmoji` 필드는 IDB round-trip 위해 보존. 미래 picker UI 도입 시 `Book.coverIcon` 신규 필드 사용 (emoji 재활성화 X).
- **사용자 manual verify 시 stale viewState**: Store v128 migration이 books-specific groupBy validation 재실행. 사용자가 한 번 reload 후 stale "status" → "none" 자동 fix.
- **Trash chip 제거** — trashed 책 보려면 `/trash` 페이지로 (2026-05-10에 Books 통합됨). ViewHeader actions에서 trash chip 안 노출 (Save view 버튼만).
- **v3 mockup CSS class `u-*` 영구 폐기** — 갤러리 entity-agnostic 패턴 (2026-05-11)이 이미 정합.
- **conflicts 빈번 발생**: PR 순차 squash 머지 시 같은 worktree의 base가 squash commit과 diverge. 매 PR마다 `git fetch origin main && git merge origin/main` 필요. 보통 `git checkout --ours` resolve로 충분 (HEAD 우선).

### 머신
집 (Windows)

### 누적 commits

10 squash PR (#292-#301). 모두 main에 squash 머지. branch는 머지 후 worktree 사용 중이라 `--delete-branch` skip (remote 잔류, 수동 정리 가능).

---

## 2026-05-12 (오후) — 집

### 완료 (1 통합 PR, 4 PR 시리즈)

**Books view-engine 풀 통합 4 viewMode** (Store v122 → v126, ~1200 net LOC):

- **PR 1** (v123) — 인프라 + grid 보존
  - `lib/view-engine/types.ts`: `"books"` ViewContextKey + VALID_VIEW_CONTEXT_KEYS
  - `lib/view-engine/defaults.ts`: CONTEXT_DEFAULTS.books (grid + updatedAt desc + none groupBy)
  - `lib/view-engine/use-books-view.ts` **신규** — thin fork hook (use-templates-view 패턴)
  - `components/views/books-view.tsx`: BooksGrid → useBooksView 통합. showTrashed → viewState.toggles
  - 시각 변경 0 (grid 모드 보존)

- **PR 2** (v124) — list mode + sort/group/filter UI + 3 PropertyChip
  - SortField `itemCount`, FilterField `kind`/`sourceType` 추가
  - `view-configs.tsx`: **BOOKS_VIEW_CONFIG** 신규 (filter 4 cats + display config)
  - `property-chips.tsx`: **3 신규 chip** (BookItemCountChip + BookKindChip + BookSourceKindChip mini-bar)
  - `book-list-row.tsx` **신규** — list 모드 row
  - `book-grid-card.tsx` **신규** (refactor — grid card 별도 분리)
  - `books-view.tsx`: ViewHeader showSearch/showFilter/showDisplay 활성화 + viewMode list 분기 + EmptyBooks helper
  - pinned-first sort 활성화

- **PR 3** (v125) — board mode (Option A: column drag + card drag)
  - GroupBy `kind`/`pinned` 추가 + VALID_GROUP_BY 확장
  - `use-books-view.ts`: applyBookGrouping에 kind (Smart/Hybrid/Manual) + pinned 분기
  - `view-configs.tsx`: supportedModes에 "board" + groupingOptions kind/pinned
  - `books-board.tsx` **신규** (320 LOC, dnd-kit) — BoardColumn + BoardCard + drag handler
  - card drag UX:
    - pinned column: 즉시 toggle + 토스트
    - kind column smart/hybrid → manual: **confirm dialog** (smartSources 제거)
    - kind column manual → smart/hybrid: **toast hint** ("Configure on detail page")
  - column drag/reorder + groupOrder persist (Notes/Wiki 패턴)

- **PR 4** (v126) — gallery mode (entity-agnostic adapter)
  - `books-gallery-adapter.tsx` **신규** — Book → GalleryItem 매핑
  - accent color kind-based (Smart=violet / Hybrid=amber / Manual=slate)
  - badge + cover icon + metaLeft (source kinds) + metaRight (count + time)
  - `view-configs.tsx`: supportedModes에 "gallery"
  - 2026-05-11 entity-agnostic GalleryView 재사용

**부속 작업**:
- `.omc/plans/books-view-engine-integration.md` (~600 line plan 작성)
- `.claude/launch.json`: `node next/dist/bin/next` → **`npx next`** (한글 경로 안전성)
- 4 store migration 주석 (v123/v124/v125/v126 boundary)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. 사용자 결정 4가지 (AskUserQuestion 2026-05-12)
- **PR 분할**: C 점진 4 PR (안전 + 매 단계 visual confirm 가능)
- **viewMode default**: grid 유지 (cover emoji 활용 강함, 기존 사용자 reload 시 변화 0)
- **default sort**: updatedAt desc 유지
- **default groupBy**: none (보수, UI에는 옵션 노출)

#### 2. Option A — Plot 일관성 풀 (column drag + card drag)
- Notes/Wiki와 동일 dnd-kit 패턴 — 사용자 직관 부담 0
- card drag의 의미 분기:
  - pinned: 즉시 toggle (안전)
  - kind smart→manual: confirmation (destructive)
  - kind manual→smart: toast hint (가이드)

#### 3. thin fork 패턴 영구 (Generic 추출 X)
- `useBooksView`가 8번째 thin fork hook (use-templates-view 패턴)
- Notes pipeline의 applyFilters/Sort/Grouping은 Note 타입 전용 — Books는 격리
- "Scope guard" 헤더 주석 명시

#### 4. Smart Book INVARIANT 보존
- resolver/BookDetailPage/SourcesSection 동작 변화 0
- view-engine 통합은 Books **list view 자체**만 변경

#### 5. 마이그레이션 옵션 A 영구 (idempotent skip)
- v123 (books context 자동 seed via VALID_VIEW_CONTEXT_KEYS expansion)
- v124-v126 (types union 확장만 — 데이터 변경 X)

#### 6. Books PropertyChip 3종 + accent color kind-based
- BookKindChip 색 옵션 결정: PR 2에서 neutral muted-foreground (1차 보수)
- gallery accent color: Smart=violet `#7C8AE7` / Hybrid=amber `#f59e0b` / Manual=slate `#94a3b8`

### 다음 (NEXT-ACTION.md 참조)

🔴 **Manual verify Books 4 viewMode** + 회귀 fix (사용자 manual 절차 7 step)
🟡 Wiki 그룹 헤더 아이콘 (~30분 후보)
🟢 다음 큰 트랙 brainstorm (Smart Book v2 / Wiki view-engine board)

### Watch Out

- **kind column card drag**: 데이터 손실 가능성 (smartSources 제거). confirm dialog 필수. test 시 confirm 동작 확인.
- **groupOrder persist 일관성**: NotesBoard와 동일 패턴 (`useSortable` + `horizontalListSortingStrategy`). 회귀 시 NotesBoard 비교.
- **`.next/dev` stale type 캐시**: build 시 종종 발생. `rm -rf .next/dev .next/cache` 후 재빌드. 또는 dev server 재시작.
- **launch.json npx next 전환 영향**: 좀 전 일시적 dev server crash → npx 기반으로 회복. 한글 경로 안전성 ↑.
- **사용자 manual verify dnd-kit drag**: preview tools로 자동 click drag 어려움 — 사용자 직접 시각 확인 필수.
- **gallery groupBy=none && groups.length<=1**: BooksGalleryAdapter는 flat items 렌더 (조건 fall-through). 단순 list로 보이게.

### 머신
집 (Windows)

### 누적 commits (이번 세션)
시리즈 단일 통합 PR (4 PR 통합 squash 머지 후 main에 반영):
- types/defaults/use-books-view (PR 1, v123)
- view-configs/property-chips/book-list-row/book-grid-card/books-view (PR 2, v124)
- books-board/books-view dnd-kit (PR 3, v125)
- books-gallery-adapter/books-view gallery (PR 4, v126)
- launch.json `npx next` 전환
- plan + docs sync

---

## 2026-05-08 (오후) — 집

### 완료 (5 PR 머지)
- **PR #271**: Status icons + UI 라벨 "Keystone" → "Block" + Cuboid (1×2 isometric block) + Save view button icon-only 16px (HBtn pattern)
  - 5 commits: Cuboid component / IconBlock rename / 12-site label rename + chip icon Hexagon/Cube/Cuboid 통일 / Save view reskin / merge resolution (origin/main 25+ commits behind 충돌)
  - 충돌 해결: view-header.tsx (HEAD HBtn 채택) / home-view.tsx (origin/main IconInbox 채택) + IconInbox export 복원
- **PR #282**: PR 4.3a Tags+Labels chrome 통일 (시도) — `.a-th` + `.a-row` 적용
- **PR #283**: PR #282 partial revert — `.a-row`가 globals.css에서 6-column grid 강제로 layout 깨짐. tags/labels 원복.
- **PR #284**: Tags row border-b 제거 (Notes/Labels 패턴 일관) + plan update Section 9-10
- **PR #285**: plan Section 11 Filter coverage 분석 (entity별 도메인 + Step 1-5)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. Filter model 통찰 (사용자 직관)
```
LIST/TABLE: column = passive attribute view, Filter button = active narrow
BOARD:      column = grouping attribute, Filter button = other axis
GRID:       card chip = attribute viz, Filter button = chip narrow
```
- Filter 없는 view = 도메인 attribute 부족 (column 자체가 단순)
- column 추가 시 Filter도 자연스레 가능 (Tags color, Files type 등)
- 이 model이 PR 4.3 chrome 통일의 north star

#### 2. NoteStatus enum value `keystone` 유지 (영구)
- UI 라벨만 "Block"로 (Cuboid 1×2 isometric block 아이콘)
- internal `keystone` 그대로 (URL `/keystone`, IDB, type literal)
- 이유: AddBlock / BlockTree / ContentBlock 등 기존 `block` identifier와 충돌 회피
- mismatch는 디버그 콘솔 + URL bar에 한정 (사용자 영향 X)

#### 3. View modes 평가 (Studio / Editorial / Gallery)
- **Studio + Editorial**: 영구 규칙 위반 ("멋진 레이아웃 / 시각적 다양성 방향 제안 금지") + TODO 폐기 항목 ("매거진/뉴스페이퍼/북 Pivot — 폐기 2026-04-22") 부활. **제거 예정**.
- **Gallery**: 카드 형태는 좋음. 단 (1) 편집 불가 (2) 하드코딩 styling (cream 강제). **polishing 후 재도입** — 일단 보류.
- 통합 방향: Display popover `[List | Board | Gallery]` 3-segment (ViewSwitcher tab 제거)

#### 4. `.a-th, .a-row` grid hardcoded 발견
- globals.css에서 6-column grid template 강제 (notes-table 전용)
- NotesTable은 inline grid로 덮어씀 → OK / 다른 view (3-element flex)는 layout 깨짐
- **refactor 필요**: chrome-only 분리 (height/border/sticky/bg/font-size) + grid는 consumer 책임

#### 5. Filter coverage 도메인 분석 (entity별)
- 명확 가치: Files (type), References (type), Wiki Category (보강), Inbox (source)
- 일관성 추가: Tags / Labels color
- Filter 없는 게 자연스러움: Insights (analytics)
- Step 1-5 series — view-engine config 변경만, chrome refactor와 독립 (병렬 PR 가능)

### 다음 세션 (NEXT-ACTION.md 참조)
- Path A 추천: Step 1 Files type filter (가장 작고 명확)
- Path B: Step A globals.css refactor (chrome 통일 prerequisite)
- Path C: Studio/Editorial cleanup

### Watch Out
- **`.a-th, .a-row` 사용 주의**: 다른 view에 적용 시 grid 6-col 강제로 layout 깨짐. globals.css refactor 후에만 적용.
- **PR 머지 시 origin/main 25+ commits behind 충돌 가능**: 머지 전 conflict 점검 (특히 view-header.tsx, home-view.tsx 등 main에서 자주 변경되는 파일)
- **IconInbox export 분리 vs IconStone**: 옛 inbox status 가 stone으로 rename되면서 IconStone 추가됐지만, 별도 inbox-layer 메타포로 IconInbox는 main에서 유지 — merge 시 분리해야 함

### 머신
집 (Windows)

### 누적 commits (이번 세션, 5 PR + docs sync)
1. PR #271 — feat(icons): Cuboid + IconBlock + label + Save view + merge fix (4 atomic commits + 1 merge commit)
2. PR #282 — feat(v3-phase-4-3a): tags+labels chrome 시도 (2 commits)
3. PR #283 — fix(v3-phase-4-3a): partial revert (1 commit)
4. PR #284 — fix(v3-phase-4-3a): border-b 제거 + plan Section 9-10 (1 commit)
5. PR #285 — docs(plan): Section 11 Filter coverage (1 commit)
6. PR (이) — docs sync NEXT-ACTION/SESSION-LOG/MEMORY/TODO/CONTEXT

---

## 2026-05-08 (새벽) — 집

### 완료
- **새 worktree** `note-status-rename` 생성 (origin/main 28b7474 기반, Phase 4.1 머지 후)
- **PR 4.1 (Phase 4 CSS 통합) 머지** — `.a-table` / `.a-row` / `.a-th` / `.a-tg` / `.a-stchip` / `.a-tag` / `.a-tool` 등 v3 table chrome 클래스 globals.css 통합. 시각 변경 0. PR #267.
- **2 plan 파일 작성** (작업은 다음 세션):
  - `.omc/plans/note-status-rename.md` (Phase A — atomic rename, 53 files / 274 occ)
  - `.omc/plans/inbox-layer.md` (Phase B — 단일 통합 Inbox layer)
- **NoteStatus rename + Inbox layer 큰 방향 결정** (영구)

### 브레인스토밍 & 큰 결정 (영구)

#### 1. NoteStatus 명칭 변경 (Phase A, 별도 plan)
- **결정**: inbox/capture/permanent → **stone/brick/keystone** (건축 메타포)
- **근거**: Plot 정체성 (Zettelkasten × Palantir) 정합. raw stone → processed brick → keystone (anchor) progression. 일반적 (Notion/Obsidian inbox/capture/permanent)에서 차별화.
- **scope**: 53 files / 274 occurrences + IDB v116 migration + route redirect
- **PR 구조**: 단일 atomic PR (rename은 분리 시 컴파일 에러). 6 commits in 1 PR.

#### 2. Inbox 개념 분리 (Phase B, 별도 plan)
- **결정**: inbox는 NoteStatus enum이 아니라 **별도 layer** (Linear / Things3 패턴)
- 새 의미: "처리 대기" 알림함 — 자동 필터 + 사용자 dismiss
- 기존 status 3개 (stone/brick/keystone)는 workflow stage. inbox는 별개 layer.

#### 3. 단일 통합 Inbox (per-entity 분산 X)
- **결정**: 하나의 inbox = 모든 entity (Notes / Wiki / Book / Reference / Files) 통합
- **근거**:
  - Plot 정체성 ("Gentle by default") — 사용자 한 곳만 봄
  - Linear / Things3 / Notion 패턴 정합
  - IKEA 전략 (앱이 자동 분류) — 사용자 부담 ↓
  - 확장성 — 새 entity 추가 시 자동 통합
- per-entity inbox 분산 = 사용자가 6+ inbox 관리. 부담.

#### 4. Inbox 위치: Home 안 카드 + `/inbox` full-page
- **결정**: home 안 카드 (Quick Capture / Stats 옆) + `/inbox` 별도 full-page
- **근거**: v3 11결정 #1 (7-space) 보존. Plot home dashboard 정체성 정합.
- top-level (Activity Bar 8번째 space) X — 7-space 위배

#### 5. Inbox 정의: 하이브리드 (자동 + dismiss)
- **결정**: 자동 entity별 필터 default + 사용자 dismiss/snooze 가능
- **자동 필터**:
  - Notes: stone + 미분류
  - Wiki: stub status
  - Reference: 미링크
  - Files: 미분류
  - (옵션) SRS: scheduled review 도래
- **사용자 dismiss** = Linear archive 패턴

### 다음 (NEXT-ACTION.md 참조)
- 🔴 Phase A: NoteStatus rename (atomic 단일 PR — executor agent 위임 권장)
- 🟡 Phase B: Inbox layer (4-5 PR — Phase A 완료 후)
- 🟢 Phase 4 재개: PR 4.2 notes-table.tsx reskin (새 명칭 사용)

### Watch Out
- **Atomic rename 위험**: 53 files / 274 occ를 분리 시 중간 PR 컴파일 에러. 단일 PR 유지 필수.
- **IDB v116 migration**: 기존 사용자 노트 status field rewrite. idempotent 보장 + no data loss.
- **Route redirect**: `/inbox` `/capture` `/permanent` 사용자 북마크. server-side redirect 필요.
- **v3 PRD Phase 5 적용 범위 변경**: `/inbox` 제거 (별도 layer). PRD 명시 update 필요.
- **inbox layer가 v3 mockup과 conceptual mismatch**: visual 호환은 되지만 의미 다름. mockup은 status, Plot inbox는 알림함.

### 머신
집 (Windows)

### 누적 commits (이번 세션, 1 PR + plan)
- ✅ **PR #267** 머지 (claude/v3-phase-4-plan): feat(v3-phase-4-1) table mode CSS 통합 (시각 변경 0). 1 commit (`19d2038`).
- 📝 plan 2개 (commit 예정 in this after-work)

---

## 2026-05-07 (밤 늦게) — 집

### 완료
- **새 worktree** `v3-phase-3-plan` 생성 (origin/main 41aab17 기반)
- **Plot v3 Phase 3 4 PR 모두 완료** (Activity Bar / Sidebar Chrome reskin)
  - **98f9277** PR 3.1: CSS 통합 (`.a-actbar` / `.a-sidebar` / `.a-sb-*` / `.a-icb` / `.a-kbd` / `.a-detail` 모두 globals.css에 통합. 시각 변경 0). +729 LOC.
  - **5ac22ef** PR 3.2: activity-bar.tsx reskin — width 44→72px / label permanent / brand mark / per-space color inline override (Plot 6색 보존)
  - **8155530** PR 3.3: linear-sidebar.tsx reskin — NavLink + Section + 11 inline button 일괄 (`.a-sb-link[data-active]` + `.a-sb-section + head + hint`). +43/-61 (코드 18줄 감소!)
  - **3761e42** PR 3.4: brand mark을 Plot 로고 SVG 교체 (네트워크 그래프 6 nodes + 10 edges + 강조 center node = "central knowledge node" 메타포)
- **Phase 3 분해 plan** `.omc/plans/v3-phase-3-decompose.md` 작성
- **외부 도구 평가** Front-End-Design-Checklist (적용 X — design-quality-gate / 4 design skills과 중복)

### 브레인스토밍 & 큰 결정 (영구)

#### PR 3.4 scope 변경 결정 (영구)
- 원래 plan = `.a-shell` shell layout grid 적용
- 그러나 ResizablePanel + custom resize drag + view-split + dynamic side panel과 충돌
- 큰 마이그레이션 = 작업 원칙 #2 (최소 diff) 위배 + 회귀 위험 (split view 등)
- **결정**: PR 3.4 = brand mark SVG 교체로 전환 (Phase 3 마무리 + 즉시 visual gain)
- Shell grid는 **Phase 6**에서 filter popover + workspace chrome + detail panel과 함께 도입

#### Plot 6-space 색 보존 (activity bar)
- v3 mockup `.a-ab--space[data-active]`는 단일 `--space-notes` (cyan)
- Plot SPACE_COLORS 6색 (home indigo / notes cyan / wiki violet / calendar pink / ontology emerald / library amber)
- **결정**: activity-bar.tsx inline style로 6색 보존 (color-mix bg + color + boxShadow inset)

#### Sidebar는 단일 cyan (활성 svg 색) 임시
- v3 `.a-sb-link[data-active] svg { color: var(--space-notes); }` 단일 cyan
- Plot 기존: `text-sidebar-active-text` (varied)
- visual confirm 후 회귀로 판단되면 fix PR 작성 (사이드바 svg 색 6-space 별 inline override)

### 다음 (NEXT-ACTION.md 참조)
- 🔴 **Visual confirm** (사용자 manual `npm run dev`) — Phase 3 큰 시각 변화 검증
- 🟡 OK면: **Phase 4** (Table Mode Reskin — Notes / Tags / Labels list) 또는 Phase 5 / Phase 6
- ⚠️ 회귀 발견 시: fix PR (사이드바 svg 색 6-space 별 등)

### Watch Out
- **Preview tool cwd cache**: 새 worktree에서 EnterWorktree + preview_start 시 cwd가 이전 worktree로 cache. workaround: ExitWorktree(keep) → EnterWorktree → preview_start. 또는 manual.
- **Sidebar svg 색**: v3 mockup CSS가 단일 cyan. Plot 기존 sidebar-active-text (varied)에서 cyan로 변경됨 — visual 회귀 가능
- **Brand mark SVG**: 28x28 brand container 안에 20x20 SVG. 사용자 첨부 디자인을 단순화 (6 nodes / 10 edges). 디테일 부족하면 사용자 동의 후 수정

### 머신
집 (Windows)

### 누적 commits (이번 세션, 4개 PR)
1. `98f9277` — feat(v3-phase-3-1): activity bar / sidebar chrome CSS 통합 (시각 변경 0)
2. `5ac22ef` — feat(v3-phase-3-2): activity-bar.tsx v3 mockup 패턴 적용
3. `8155530` — feat(v3-phase-3-3): linear-sidebar.tsx v3 mockup 패턴 적용
4. `3761e42` — feat(v3-phase-3-4): brand mark을 Plot 로고 SVG로 교체 (네트워크 그래프)

---

## 2026-05-07 (밤) — 집

### 완료
- **Plot v3 Phase 2 DEFERRED 결정** (commit 3b84d7e)
  - PRD 상단 DECISION banner 추가, Status v1.1 → v1.2
  - `.omc/plans/v3-phosphor-inventory.md` ARCHIVED 표시
  - CONTEXT/MEMORY 결정 기록
- **PR group-c-d-3** Stickers view-engine 통합 v113 (commit a055581, 9 files +427/-92)
  - useStickersView thin fork (cross-entity members count, note/wiki active check)
  - StickerMemberCountChip (Stack icon)
  - list+grid mode + DisplayPanel
- **PR group-c-d-4** References view-engine 통합 v114 (commit c3700ad, 9 files +408/-43)
  - useReferencesView thin fork (caller가 pre-filtered 전달, enrich + sort)
  - 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip)
  - sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지
- **4 design skills install** (commit 0f7e2ec, 5 files)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - project-level (`.agents/skills/`)
  - cross-machine: `npx skills experimental_install`
- **PR group-c-d-5** Files view-engine 통합 v115 (commit f210fcf, 9 files +423/-39)
  - useFilesView thin fork (Attachment 전용)
  - 2 신규 chips (FileTypeChip / FileSizeChip)
  - column header sort: "type" → "fileType" 명시 변환
  - Grid mode JSX (4:3 thumbnail block + chip row)
- **Group C PR-D 시리즈 완성** (5/5 entity view-engine 통합)
- 외부 레포 평가 (적용 X 결정): onlook, Front-End-Design-Checklist
- shadcn-ui 적용 확인 (이미 깊이 적용됨)

### 브레인스토밍 & 큰 결정 (영구)

#### Plot v3 Phase 2 DEFER (큰 방향 결정)
- **결정**: Imperial icon kit 전면 도입 보류. phosphor-icons 그대로 유지
- **근거**:
  - 직전 plan (`v3-phosphor-inventory.md`) stale ("2 files / 4 icons" → 실측 119 files / 60+ icons / 87 files weight 사용)
  - 119 files codemod = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
  - phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → 도입의 시각 가치 약함
  - 빌드 정상 (tsc 0 / build clean / 185 tests pass)
  - lucide / 외부 라이브러리 추가 도입 의미 없음 (phosphor 광범위)
- **partial work 보존** (revert 안 함): activity-bar / plot-icons IconWiki / view 일부 / backlink-card
- **재개 조건**: 정확한 인벤토리 + imperial-extras shim 매핑 coverage 검증 + 단일 책임 PR 분할

#### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + components/ui/* 30+). v3 PRD "shadcn cascade 보존" 정책 명시
- **taste-skill** (Leonxlnx, 15.8k): ⭐ install. Plot 정합 4개만. universal symlink (Codex/Cursor/Copilot 등 12 agents 호환)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - 안 install: industrial-brutalist-ui, brandkit, gpt-taste(GSAP), imagegen-*, image-to-code, stitch-design-taste, full-output-enforcement
- **huashu-design** (alchaincyf, 12.3k): △ mockup/prototype 도구. Plot production code에 직접 적용 X. v3 mockup 단계에서만 유용
- **onlook** (onlook-dev, 25.7k): ❌ visual code editor. Plot production app에 자동 코드 변경 회귀 위험. greenfield/marketing 사이트에 적합
- **Front-End-Design-Checklist** (thedaviddias, 5.2k): ❌ passive markdown handoff 가이드. design-quality-gate / linear-design-mirror / 4 design skills과 중복. 1인 dev에 audience 불일치

### 다음 세션 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan 작성 → 첫 PR 작업
- 또는 Wiki template 3-layer / Smart Book v2

### Watch Out
- **PR 3-5 build에서 SORT_FIELD_LABELS exhaustive 이슈 반복** — view-engine SortField 추가 시 `notes-table.tsx` Record<SortField, string>에 동일 추가 필요 (PR마다). 이번 세션에 memberCount, fieldCount, size, fileType 모두 추가.
- **tsc --noEmit 통과 ≠ next build 통과** — incremental cache 차이로 build에서 type error 발견 가능. 항상 build까지 검증.
- **Plot v3 Phase 2 partial work** — activity-bar 등 Imperial 사용 중인 컴포넌트는 그대로. 새 코드도 phosphor 또는 Imperial 자유 (둘 다 1.5px stroke 정합).

### 머신
집 (Windows)

### 누적 commits (이번 세션)
1. `3b84d7e` — docs(v3): defer Phase 2 (Imperial icon kit) — phosphor 유지
2. `a055581` — feat(group-c-d-3): Stickers view-engine 통합 (v113)
3. `c3700ad` — feat(group-c-d-4): References view-engine 통합 (v114)
4. `0f7e2ec` — chore(skills): install 4 taste-skill design skills
5. `f210fcf` — feat(group-c-d-5): Files view-engine 통합 (v115) — Group C PR-D 완성

---
