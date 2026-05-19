# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-19 (저녁/밤) — 7 PR squash 머지 (P0 1-4 + P1 3개) 완료. Tags filter 위치/Labels split view 진단까지. TS 부채 10건 → 0 (PR #376).

---

## 🔴 P0 — 즉시 (cross-machine 진입점, 2026-05-19 저녁/밤)

### 1. **🔴 Tags/Labels sub-page view-engine 통합** (~10 파일, 사용자 결정 받음)

사용자 보고 (2026-05-19 밤): "태그스는 필터위치가 이상해. 라벨스나 위키 노트 등과 맞춰줘야 하고."

진단 결과:
- Tags sub-page (`tags-view.tsx:551-623`) ↔ Labels sub-page (`labels-view.tsx:519-591`) **layout 100% 동일** (inline `<div>` + FilterButton + flex-1 + Display popover)
- **둘 다 inline custom layout** — Notes/Wiki 표준 `ViewHeader` 패턴과 다름
- Tags list 메인 view는 `ViewHeader` 사용 (`tags-view.tsx:760-784`) — sub-page만 inline

**범위**:
- 신규 `LABEL_DETAIL_VIEW_CONFIG` + `TAG_DETAIL_VIEW_CONFIG` (view-configs.tsx)
- `tags-view.tsx` + `labels-view.tsx` sub-page 전면 재작성 — ViewHeader + DisplayPanel + FilterPanel
- FilterChipBar / Selection bar / 기타 row 정합화
- 회귀 verify 부담 (~10 파일 + 사용자 manual smoke 의무)
- Notes/Wiki sub-page의 ViewHeader 사용 example 먼저 참고

PR #379 (split view quick fix)로 가장 큰 불편은 해결. filter popover 정합화는 이 PR에서 자연 해결.

### 2. **🟡 Calendar 사이드바 변화** (사용자 의도 미확정)

이전 세션 시그널 (2026-05-15): "Calendar의 우측 사이드바도 뭔가 변화가 필요해. 좋은 의미로."

옵션:
- **(a) Day Summary panel** — 선택한 날짜의 notes 통계 (status breakdown + activity heatmap + recent events)
- **(b) Calendar 자체 detail** — 월간 통계 (notes created/updated 합계)
- **(c) 현재 노트 detail 강화** — 기존 fallback 위에 calendar context

사용자 결정 후 진행.

### 3. **🟡 Ontology graph node 사이드바 동기화** (사용자 의도 미확정)

이전 세션 시그널: "온톨로지에도 사이드바가 없다"

현재: Graph node 클릭 → `OntologyDetailPanel` 표시. 4탭 사이드바와 별개.

옵션:
- **(a) Graph node → 4탭 사이드바 동기화** (note→note detail, wiki→wiki detail). 추천
- **(b) 둘 다** — OntologyDetailPanel + 4탭 사이드바
- **(c) 사이드바에 Graph mode**

### 4. **🟡 Activity events 후속** (Granular wire-up + Label entity events)

- **Granular Wiki/Book events**: PR 5b/5c에 entity CRUD만 wire-up. internal action (block_added/removed/reordered, item_added/removed/reordered) wire-up 누락. PR 5d EVENT_CONFIG entries는 있지만 발화 X.
- **Label entity events**: labels slice의 createLabel/updateLabel/deleteLabel/restoreLabel에서 entityEvents.push (tags.ts 패턴 정합)

### 5. **🟡 Tags/Labels 사이드바 회귀 재진단** (2026-05-15 보고, 검증 미완)

- 다른 머신/incognito fresh dev로 재현
- HMR stale vs 코드 회귀 vs IDB v133 마이그레이션 실패 후보

### 6. **🟢 사용자 IDB stale WikiTemplate description** (선택, backfill migration)

PR #365 seeds.ts 영어 통일은 fresh init만 적용. v143 → v144 backfill 가능.

---

## ✅ 최근 완료 (2026-05-19 저녁/밤) — 7 PR squash 머지 누적

### PR #373 — P0 #1: light mode hex contrast fix (squash merged 2431bd6)
- `lib/tinted-bg.ts` `useTintedText` inline regex 제거 + `lib/wiki-color-contrast::shouldUseLightText` delegate
- 18 PRESET_COLORS algorithm unit test (preview_eval): BLACK 글씨 7개 (Amber/Yellow/Lime/Green/Emerald/Teal/Cyan) + WHITE 글씨 11개
- 단일 파일 ~10줄, 보너스 효과: TipTap infobox-node.tsx도 같이 fix

### PR #374 — P0 #2: group header tint cascade (squash merged 0bde0ad)
- PR-E2 자연 follow-up. infobox group header (예: "ADDITIONAL INFO")도 themeColor cascade 포함
- `data-group-header` + `data-custom-color` attribute + Tailwind arbitrary selector + `color-mix(15%)`
- 영구 룰 #82 opt-in 정합 (custom color 우선)

### PR #375 — P0 #3: WikiTemplate detail panel hero edit UI (squash merged 5086c60)
- PR-C 후속 polish. wiki-template-detail-panel.tsx에 "Hero image" InspectorSection 신설
- figure preview + Edit/Remove buttons / "+ Add hero image" dashed border button
- InfoboxHeroPicker mount (PR-C와 정확 동일 시그니처)

### PR #376 — P0 #4: TS debt + dead code + doc comment + encyclopedia hatnotes (squash merged dfd10cf)
- TS 부채 10건 → **0 errors** (npx tsc --noEmit clean)
- dead code 삭제: `components/note-detail-panel.tsx` (679줄)
- doc comment 3건 정정 (PR-E1 architect non-blocking)
- WikiArticleEncyclopedia에 WikiHatnotes mount 추가 (PR-E1 잔재)
- 11 파일 +38/-704

### PR #377 — P1: Wiki Template insert via AddBlockButton (squash merged 047875a)
- PR #358 후속. "From template…" entry를 AddBlockButton menu에 추가
- WikiTemplatePicker `mode: "create" | "insert"` prop + `onTemplateChosen` callback
- prepend / append 위치 결정 (top "+" / bottom "+")
- 기존 `getWikiTemplateBlocksExpanded` + `updateWikiArticle({blocks})` 재사용 (신규 store action 불필요)

### PR #378 — P1: TagDetailPanel cross-entity 강화 (squash merged aaf4a13)
- 기존 minimal (Notes only) → cross-entity 풀구조
- Connections section: Notes by status breakdown (Stone/Brick/Block chips) + Wiki count + Books count
- Properties: Notes / Wikis / Books / Color
- Used by: 3 entity 통합 list with entity icons (Notes click navigable)
- PR #331 Files Detail 패턴 정합

### PR #379 — P1 quick fix: Labels/Tags split view auto-close (squash merged f7429d6)
- 사용자 보고 "라벨스의 경우 자꾸 스플릿뷰로 나오거든? 이거 버그같은데"
- 원인: split view UI state (secondaryNoteId / activePane) Zustand persist. 이전 split view 상태 잔존
- 해결: labels-view + tags-view mount once 시 `closeSecondary()` 강제 호출
- 2 파일 +20

---

## ✅ 이전 완료 (2026-05-19 저녁) — PR #370 polish + PR #371 themeColor

### PR #370 — Hatnote dialog Type Select polish (squash merged 91c8eca, +4/-4)

사용자 보고 "Type 안에 글자들이 너무 박스 안에서 빼곡한 느낌" 응답. PR #368 (PR-E1) follow-up.
- `hatnote-edit-dialog.tsx` SelectItem: 제목 + description 2-line → 제목 한 줄만 (Linear dropdown 정합)
- Select 바로 아래 `<p>` muted text로 선택된 type description 한 줄 표시
- Conflict resolve: PR #368 main 머지 후 같은 파일 변경이 line-level conflict → HEAD 우선 (`git merge origin/main` + manual marker 제거) 패턴

### PR #371 — themeColor cascade system (squash merged a5e6ef8, +356/-27, 11 files, 1 new)

**A. 데이터 모델**:
- `WikiArticle.themeColor?: string | null` (단일 hex, `{light,dark}` 객체 X — `useTintedBg` hook이 분기 자동 처리)
- 신규 setter `setWikiArticleThemeColor` + Persist v142→v143 sentinel

**B. Cascade 메커니즘**:
- Root container (`wiki-article-view` + `wiki-article-encyclopedia` 두 경로) 에 `--wiki-theme-color` CSS variable inject
- **Infobox header**: `effectiveHeaderColor = headerColor ?? themeColor ?? null` fallback
- **Hatnote**: `border-l-2` + `borderLeftColor: var(--wiki-theme-color, transparent)`
- **Section h2**: SectionBlock에 `data-h2` attribute + root container의 Tailwind arbitrary selector로 **opt-in** (themeColor 없으면 영향 0, 영구 룰 #67 정합)

**C. Picker**:
- 신규 `components/wiki-editor/wiki-theme-color-picker.tsx` Dialog
- PRESET_COLORS 18색 hex grid + custom `<input type="color">` + Clear 옵션
- Infobox footer "Theme color…" 액션 (Save as preset… 옆)
- `canChangeThemeColor` gate — Wiki only

**영구 룰 추가**: #81 (themeColor 단일 hex + CSS variable cascade 패턴) + #82 (디자인 cascade opt-in 의무, 영구 룰 #67 강화) + #83 (Component prop 확장 optional + back-compat 의무)

---

## ✅ 이전 완료 (2026-05-19) — PR-E1 Hatnotes + Preset I/O

### PR #368 — Hatnotes + Preset import/export (PR-E1, Phase 5+ first wave, squash merged 56ecb24)

**A. Hatnote** (Wikipedia/나무위키 표준 5 type)
- 5 라벨 영어: Part of / Subtopics / Not to be confused with / Main article / See also
- `WikiArticle.hatnotes?: Hatnote[]` optional + 신규 컴포넌트 `wiki-hatnotes.tsx` (render) + `hatnote-edit-dialog.tsx` (type Select + text + WikiPicker target)
- title 아래 / `<InlineCategoryTags>` 위 mount (Wikipedia 정합)
- `WikiPickerDialog excludeIds={[articleId]}` self-reference cycle 차단

**B. Preset import/export JSON** (PR-D 자연 후속)
- 신규 `lib/wiki-infobox-presets-io.ts` (envelope `{ version, exportedAt, presets }` + raw array 양쪽 호환 + SSR-safe download)
- 신규 `import-preset-dialog.tsx` (textarea + file upload + live parse preview + collision count surface)
- Infobox footer "Export presets…" / "Import presets…" 액션
- Import 정책: 항상 fresh id (no replace) — collision은 preview 표시만

**검증**
- `npx tsc --noEmit`: 0 new errors (10 pre-existing 부채만)
- Architect: APPROVED (3 minor non-blocking)

**영구 룰 추가**: #79 (Hatnote 5 type 정합) + #80 (JSON export envelope 패턴)

---

## ✅ 이전 완료 (2026-05-18 저녁) — fix bundle + PR-D + PR-C

### PR #365 — fix bundle (squash merged, 4 commits)
- **WikiTemplate seed description i18n 영어 통일** (PR #358 잔재, 8 description)
- **EmptyHintPlaceholder trigger 강화** — heading 무시, paraCount===1 + !paraHasText만 hint
- **EmptyHint UpNote 스타일** — position absolute / font inherit / solid underline / placeholder opacity / cursor 자연 위치
- **block-drag-overlay regular block side-drop column 자동 생성 폐기** — 영구 룰 #8 정합

### PR #363 — UserInfoboxPreset (PR-D, Phase 4, squash merged)
- Save as preset / dropdown My Presets 섹션 / cross-entity Note / hover delete / persist v139→v140
- 영구 룰 #70-#73

### PR #367 — Hero Image (PR-C, Phase 3, squash merged, 원래 PR #366)
- InfoboxHero type + 3 entity optional 필드 cross-entity
- WikiInfobox hero slot (figure + caption + alt + hover edit/remove)
- 신규 `infobox-hero-picker.tsx`
- 5 caller wire + v140→v141 sentinel migration
- 영구 룰 #74-#78

---

## ✅ 이전 완료 (2026-05-18 오후) — 대규모

### PR #361 — Infobox UX 종합 강화 (7 commit, squash merged d95b61b)
- **Preset switching 3-way dialog** (Cancel / Preserve matching / Replace all)
- **Group-header collapse pubsub fix** (사용자 보고 "토글 작동 X")
- **"+ Add field" inline group-aware** (사용자 보고 "Genre 아래 추가")
- **Drag-to-reorder** (dnd-kit + ephemeral `_id`)
- **Panel toggle 중복 fix** (사용자 보고 "스플릿뷰랑 사이드바 더 나옴")
- **Infobox edit mode auto-expand** (22→30%, Done 시 user layout 복원)
- **가로 스크롤 + SidePanel auto-expand 38%** (extreme narrow viewport fallback)

### PR #362 — Infobox preset 풍부화 + Note cross-entity (3 commit, squash merged 43fcd44)
- **5 preset 풍부화** (Person 16/Place 14/Org 12/Software 12/Animal 16)
- **11 preset 풍부화** (Character/Concept/Work×4/Event/School/Food/Vehicle/Sport Team — 총 16개)
- **Note cross-entity** (Note.infoboxPreset + infoboxHeaderColor 신규 필드, note-editor wire)

### PR #363 — UserInfoboxPreset (open, 1 commit, ~562 줄)
- **"Save as preset…" 시스템** (slice + dialog + dropdown "My Presets" 섹션)
- **WikiInfoboxPreset = builtin | (string & {}) widen**
- **getPresetDefinitionUnified** (builtin + user 통합 lookup)
- **Persist v139 → v140** (userInfoboxPresets `[]` + Array defense)

## ✅ 이전 완료 (2026-05-18 오전)
- **PR #357** — Wiki Delete = hard → soft delete 패턴 (Note 2단 정합). WikiArticle.trashed/trashedAt 정식 type + trashWikiArticle action + v138 migration + 7곳 호출처 swap + bulk undo simplified (toggle)
- **PR #358** — Wiki Template 신설 (NoteTemplate 정합 + Wiki 본질 확장). 8 seed (Empty/Concept/Person/Place/Reference/Tutorial/Project Log/Book Note) + WikiArticle.templateId + v139 migration + onRehydrateStorage defense + Wiki 사이드바 Templates entry + /wiki/templates page + WikiTemplatesView grid + WikiTemplateDetailPanel 4탭 + WikiTemplatePicker dialog
- **PR #359** — Infobox preset 6 신규 (School/Animal/Software/Food/Vehicle/Sport Team, 나무위키 정합) + 신규 color tokens (cyan/lime/pink/brown) + Preset dropdown 잘림 fix (createPortal + fixed positioning + viewport flip)

## ✅ 완료 (2026-05-17 밤)
- **PR #352** — `/books` row click 시 사이드바 즉시 전환 (BookDetailPage useEffect 대기 X)
- **PR #353** — `book-table` checkbox 체크 시 sidebar transition (notes-table:561 패턴 정합)
- **PR #354** — Trash All view에 Display panel groupBy 정합 (하드코딩 해제)
- **PR #355** — Trash row icon entity-native (Wiki Stub/Article + Book kind + Tag/Label color dot)

## ✅ 완료 (2026-05-17 저녁)
- **Label/Category/Tag = orthogonal 독립** — 사용자 mental model 정착, 계층 의존 폐기
- **Memo 자동 부여 폐기** — `createNote` 시 labelId null 유지
- **Wiki/Book에 labelId + Note/Book에 categoryIds + Book.tags 신규 필드**
- **v137 migration** — default 값 추가 (사용자 데이터 보존)
- **CategoryPicker 신규 entity-agnostic 컴포넌트**
- **Note/Wiki/Book Detail 모두 Label + Category + Tag picker** (inline Create 자동)
- **Sidebar 재배치** — Labels (Notes→Library) + Categories (Wiki→Library, 길 A)
- **`/library/labels` 신규 route** + legacy `/labels` 호환
- **Library Overview 6 stat card** (Labels + Categories 추가, 3-col grid)
- **KNOWLEDGE_INDEX_COLORS** — labels (rose) + categories (emerald)

## ✅ 완료 (2026-05-17 낮)
- **Labels/Tags sub-page 사이드바 자동 노출** — useEffect로 selectedXxxId 변경 시 sidePanelContext sync (영구 룰 21)
- **Labels/Tags sub-page row entity-uniformity** — `EntityNoteListRow` helper (hover checkbox + single click toggle + dblclick navigate)
- **노트 더블클릭 시 실제 editor 진입** — sub-page exit + setActiveRoute + openNote + router.push 4단 세트
- **Tag sub-page cross-entity 3 섹션** — Notes + Wiki articles (filter) + Books (derive: items + smartSources)
- **Wiki Detail TagPicker upgrade** — read-only chip strip → 표준 TagPicker (inline Create 자동 포함)
- **Seeds 보강** — wiki-8~17 (10개)에 tag 분산 적용
- **v135 wiki seed tag backfill** — 빈 tags + seed tags 있을 때만 fill (idempotent)
- **v136 SEED_NOTES backfill** — note-1~9 push (id-dedup append)
- **FunnelSimple 텍스트 잔재 fix** — filter-bar.tsx placeholder 6곳 + button label 1곳 + 주석 1곳 (글로벌 find-replace 사고 재발)

## ✅ 완료 (2026-05-16)
- Wiki board 카드 우클릭 ContextMenu (WikiArticleMenuItems 재활용)
- Books board 카드 우클릭 ContextMenu (BookContextMenuItems helper 추출)
- Wiki Workbench Add to category/tags inline Create + createTag signature `void → string`
- v134 wiki seed backfill migration
- P0-1 Tags/Labels 회귀 진단 (fresh preview 정상, HMR/multi-port stale 추정)

---

## 🟡 P1 — 이전 세션 잔여 (오전 P0이었으나 PR-D 우선으로 demote, 2026-05-18 오후)

### Wiki Template slash insert (PR #358 후속 polish, ~3 파일)
사용자 결정 받음: "slash insert + 생성 picker 둘 다". PR #358에 생성 picker만 구현됨. slash insert는 분리.

**범위 (~3 파일)**:
- `components/wiki-editor/wiki-article-view.tsx` 또는 toolbar에 "+ Add block" / "From wiki template…" menu entry 추가
- WikiTemplatePicker에 `mode: "create" | "insert"` prop 추가 — insert mode 시 `getWikiTemplateBlocksExpanded(id)` 호출 후 callback에 blocks 전달
- wiki-article-view에서 blocks 받으면 `updateWikiArticle({ blocks: [...existing, ...templateBlocks] })` 또는 `addWikiBlock` 반복 호출

**위험 + 회피**:
- WikiTemplatePicker가 wiki-view에 이미 mount. wiki-article-view에도 별도 instance — store/local state 분리 필요
- blocks splice 시 sectionIndex / linksOut 재계산 의무 (updateWikiArticle 자동 처리)
- block ids 충돌 — getWikiTemplateBlocksExpanded가 이미 genId 부여

### Library Tags Detail panel (~5 파일, PR #331 Files Detail 패턴 정합)
영구 룰 "Library entity 4탭 사이드바" 적용.

**범위**:
- TagDetailPanel 강화: Header (color dot + name) + Dates + Properties (Used by N notes / N wikis / N books) + Connections (cross-entity stat charts) + Actions (Rename / Merge / Delete)
- 현재 TagDetailPanel 있지만 minimal — Library entity-uniformity 영구 룰 확장

### Book Template 도입 가능성 논의 (선택)
사용자 명시 "북에는 템플릿이 도입될 수 있을지 없을지 확신이 안 들어" — brainstorming 시작.

**검토 사항**: Book의 본질은 큐레이션 묶음 (items[] + smartSources). Template = recipe 메타포 → Book에 적용 시 의미?

> 옛 P0 #2 "나무위키 Infobox Tier 2-4 본격 고도화"는 **PRD `.omc/plans/wiki-infobox-tier-2-4-prd.md`로 분리 + Phase 1/2/4 완료** (PR #361/#362/#363). Phase 3 (Hero Image)는 P0 #2에 명시.

### 3. (선택) **Tags/Labels sub-page view-engine 통합** (이전 세션 P0 잔여)
사용자 보고: "왜 태그스의 디스플레이는 이상하냐? 기존의 플롯식 정합과 다른데? 왜 필터는 없냐? 디스플레이 프로퍼티스 부실 + 그룹핑 옵션 없음"

**범위**:
- `lib/view-engine/view-configs.tsx`에 `TAG_DETAIL_VIEW_CONFIG` / `LABEL_DETAIL_VIEW_CONFIG` 신규 정의
  - `displayConfig.properties` — 노트 row visible columns (title / status / labels / tags / updatedAt / createdAt)
  - `displayConfig.groupingOptions` — None / Status / Priority / Folder / Label / Created / Updated / First letter (Notes 정합)
  - `displayConfig.supportsViewMode` — list (grid도?)
  - `filterCategories` — Notes 정합
- `tags-view.tsx` / `labels-view.tsx` sub-page render — inline custom Popover 폐기, ViewHeader + 표준 DisplayPanel + FilterPanel 사용
- `EntityNoteListRow`에 `visibleColumns?: string[]` prop 추가 + 조건부 chip 렌더
- 작업량 ~10 파일

### 2. 시작 절차
```bash
git pull origin main   # 이번 PR 머지된 main
npm install && npm run dev   # port 3002
# Hard refresh + console [migrate] v135→v136 확인
# /library/tags → tag 클릭 → sub-page에서 Filter/Display 부족 시각 확인 후 작업 시작
```

### 2. 4 신규 surface + 12 기존 PR 통합 manual verify
- [ ] **신규 a**: `/wiki` → Wiki Articles board → 카드 우클릭 → 메뉴 정상
- [ ] **신규 b**: `/books` → board mode → 카드 우클릭 → 메뉴 정상
- [ ] **신규 c**: Wiki board 카드 선택 → 우측 Workbench `Add to category` → 검색 + Create 옵션 + 새 카테고리 생성 확인
- [ ] **신규 d**: 같은 패턴 `Add tags` (검색 + Create)
- [ ] **신규 e**: `/wiki` Wiki seed 19 articles 표시 (v134)
- [ ] **기존 12 PR**: Library 5 entity 사이드바 / Activity timeline / Connections charts / Ontology Legend 좌하단

### 3. P0-1 Tags/Labels 회귀 재확인
사용자 본인 환경에서:
1. 모든 dev server 종료 (다른 worktree 정리)
2. 이 worktree만 dev (port 3002 단독)
3. Hard refresh + console v134 마이그레이션 로그 확인
4. `/library/tags` / `/labels` row name 클릭 → 사이드바 detail 표시 verify

→ 정상이면 P0-1 close (코드 fix 없음).
→ 여전히 안 되면 그때 fresh diagnose (sidePanelContext reset useEffect grep).

---

## 🟡 P0 (이전 세션 잔여) — Wiki entity-uniformity 완성 + Category sidebar 흡수

### 다음 머신에서 manual verify (cross-machine)

```bash
git pull origin main
# 새 worktree 또는 기존 fresh main
npm install && npm run dev
# Plot 포커스 + Hard refresh (Ctrl+Shift+R)
# 사용자 IDB reset 필요 시 console:
# indexedDB.databases().then(dbs => dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name))); localStorage.clear(); location.reload();
```

**verify 체크리스트** (누적 변경 → 회귀 점검):
- [ ] **Wiki Categories**: row single click → 우측 4탭 사이드바 (Detail/Connections/Activity/Bookmarks) 표시. Color row click → Popover ColorPickerGrid. Parent dropdown = Plot DropdownMenu (chevron + folder + color).
- [ ] **Wiki Categories layout**: list `flex-1` (시원시원) + editor `w-[420px]` (이전 280 압축 회귀)
- [ ] **Wiki Categories grouping**: dropdown 6 옵션 (None / Tier / Parent / Family / Index / Created). 기본 family.
- [ ] **Wiki Articles board**: default Stub/Article 2 column 자동 (groupBy "wikiStatus"). 카드 single click select. hover 시 우측 상단 체크박스. multi-select 누적.
- [ ] **WikiBoardWorkbench**: selection 시 Pin / Move folder / Add to category / Add tags / Split / Merge / Trash 7 actions. floating bar 안 보임 (board mode).
- [ ] **Wiki 시드 17 articles** (fresh user/IDB reset 시)
- [ ] **Books board**: default Smart/Hybrid/Manual 3 column 자동 (groupBy "kind")
- [ ] **Notes**: Tags/Priority/Label chip은 list mode에서 숨김 + board mode에서 표시. groupingOptions에 "Index" 추가.

### 🟡 P0-2 — Wiki articleCount 음수 회귀 (트랙시 stub 발생 시)

- 이전 사용자 환경 음수 보고 → Fix: `wikiNotes` (trashed-filtered) 기준 통일. invariant: articleCount + stubCount = wikiNotes.length ≥ 0.
- 사용자 본인 브라우저에서 reload 후 확인.

### 🟡 이전 P0 잔여 — Tags / Labels 사이드바 회귀 (이전 세션 미진단)

- 기존 P0 — fresh main 받은 후 다시 재현 확인 권장.

---

## 🔴 P0 — 즉시 (다른 머신 cross-machine 진입점)

### 다음 머신에서 시작 절차

```bash
# 1. main 받기 (12 PR + docs sync 모두 머지된 상태)
git pull origin main

# 2. 새 worktree (다른 컴퓨터)
git worktree add ../<name> main
cd ../<name>

# 3. install + dev
npm install
npm run dev    # port 3002 또는 random

# 4. Plot 페이지 포커스 후 Hard refresh (Ctrl+Shift+R) 의무
# 5. Console에서 [migrate] v132→v133 로그 확인 (자동 마이그레이션 trigger)
```

### 🔴 P0-1 회귀 진단 — Tags / Labels 사이드바 작동 안 함

**사용자 보고** (2026-05-15): tag/label row name 클릭해도 사이드바 detail panel 안 열림. 사이드바 자체는 떠있는데 "Select a note to see details" fallback 표시.

**코드 verified 정상**:
- `components/views/tags-view.tsx` line 813-825: row name `<button onClick>` 에 `setSelectedTagId + usePlotStore.setState({ sidePanelContext: { type: "tag", id: tag.id }, sidePanelOpen: true })`
- `components/views/labels-view.tsx` line 718-732 (PR #345 신규): 같은 패턴
- `lib/store/types.ts` SidePanelContext에 `{type: "tag" | "label"}` union 포함
- `components/side-panel/use-side-panel-entity.ts` tag / label 분기 + state.tags/labels lookup
- `components/side-panel/side-panel-detail.tsx` tag → TagDetailPanel / label → LabelDetailPanel dispatch

**재현 단계** (다른 머신/incognito fresh dev):
1. `npm run dev` + hard refresh
2. `/library/tags` 또는 `/labels` 진입
3. row name 텍스트 (`#Knowledge Management` 또는 `Idea` 등) 클릭 (checkbox 아님)
4. 우측 사이드바에 TagDetailPanel/LabelDetailPanel 표시되는지

**진단 후보 (우선순위)**:
- **(a) HMR stale** — 사용자 dev:3002에서 PR #345 코드가 hot reload 안 됨. 다른 머신 fresh dev로 재현 안 되면 stale 확정 → no-op (사용자 hard refresh 또는 dev restart)
- **(b) IDB v133 마이그레이션 실패** — `[migrate] v132→v133` console.log 없으면 마이그레이션 trigger 안 됨. entityEvents 빈 array + 사이드바 dispatch 영향 없음 (Detail은 tag entity lookup이라 events 무관) — 그래도 마이그레이션 실패 시 dev 안정성 문제
- **(c) 코드 회귀** — 어딘가 `setSidePanelContext`를 즉시 null로 reset하는 useEffect. 후보:
  - `components/views/book-detail-page.tsx` useEffect (`readingEntityId` 분기 — Library 페이지에는 적용 안 돼야)
  - `components/workspace/*` 또는 layout (active route 변경 시 sidePanelContext reset?)
  - 검색 명령: `grep -rn "setSidePanelContext.*null\|sidePanelContext.*null" components/` 또는 `setSidePanelContext({` 다른 위치
- **(d) Multi-worktree dev port 충돌** — 사용자가 이전 worktree dev:3002 stale + 새 worktree port (random). 사용자가 옛 port 보고 있을 수도. `preview_list` 또는 chrome devtools로 정확한 port 확인.

**fix 후 (회귀 확정 시)**: PR 하나로 `setSidePanelContext` reset 위치 fix + grep로 비슷한 패턴 다 점검.

### 🔴 P0-2 통합 manual verify (12 PR 누적)

cross-machine fresh dev에서 entity별 4탭 사이드바 통합 검증. 라운드 4-5에 들어간 변경이 다른 PR과 충돌 없는지:

- [ ] **Tags** — row name 클릭 → TagDetailPanel (color dot, note count, Used by) + Connections "Tagged notes by status" + Activity (events) + Bookmarks (anchor placeholder)
- [ ] **Stickers** — row name 클릭 → StickerDetailPanel (createdAt Dates, kind breakdown) + Connections "Members by kind & status" + Activity + Bookmarks
- [ ] **Files** — file 클릭 → FileDetailPanel + Connections "Cross-entity" (source + used in)
- [ ] **References** — 클릭 → ReferenceDetailPanel + Connections "Cited by" (citing notes/wikis)
- [ ] **Labels** — row name 클릭 → LabelDetailPanel + Connections "Labeled notes by status"
- [ ] **Books** — `Books > [book]` breadcrumb + chevron 클릭 → 책 picker. ArrowLeft 사라짐. 사이드바 4탭
- [ ] **Library headers** — `Library > Tags/Files/References/Stickers/Labels` breadcrumb + 사이드바 토글 버튼 (헤더 우측 SidebarSimple icon)
- [ ] **Notes** — Activity 탭 기존 timeline + 새 events (어디 추가) 다 나타남. EVENT_CONFIG 신규 type icons 적절
- [ ] **Wiki** — block_added events 안 보여도 OK (granular wire-up P2). 단 createWikiArticle/update/trash events 보임
- [ ] **Template** — Activity Comments 없음 (의도) + History timeline
- [ ] **Ontology Legend** — 좌하단 floating overlay (우상단 아님). 미니맵 안 가림.

### 🟡 P1 — 의도 명확화 후 작업

#### 1. Calendar 사이드바 변화 (사용자 의도 미확정)
사용자 시그널 (2026-05-15): "Calendar의 우측 사이드바도 뭔가 변화가 필요해. 좋은 의미로."

옵션:
- **(a) Day Summary panel** — 선택한 날짜의 notes 통계 (status breakdown + activity heatmap + recent events)
- **(b) Calendar 자체 detail** — 월간 통계 (notes created/updated 합계, 활동 패턴)
- **(c) 현재 노트 detail 강화** — 기존 fallback 위에 calendar context (예: "Created on this day")

사용자 결정 후 진행. `sidePanelContext`에 `{type: "day"; date: string}` 추가 또는 다른 패턴.

#### 2. Ontology graph node 클릭 시 사이드바 동기화 (사용자 의도 미확정)
사용자 시그널: "온톨로지에도 사이드바가 없다"

현재: Graph node 클릭 → `OntologyDetailPanel` (별도 panel) 표시. 4탭 사이드바와 별개.

옵션:
- **(a) Graph node → 4탭 사이드바 동기화** — node가 note면 note detail, wiki면 wiki detail. OntologyDetailPanel 폐기 또는 graph-only 정보로 축소. 추천.
- **(b) 둘 다** — OntologyDetailPanel + 4탭 사이드바 (selection 유지)
- **(c) 사이드바 자체에 Graph mode** — 노드 선택 시 4탭 사이드바가 graph node detail로 변환

추천 (a) — 모든 entity 사이드바 4탭 일관성.

---

## 🟡 P1 — Activity Unification 후속 (granular events)

### 3. Granular Wiki/Book events wire-up
PR 5b/5c는 entity CRUD만. internal action (block_added/removed/reordered, item_added/removed/reordered, smart_source_added/removed, converted_to_manual, chapter_added)은 wire-up 안 됨. PR 5d에 EVENT_CONFIG entries는 있지만 발화 X. 후속 PR — 각 slice의 internal action에서 `appendEvent`.

### 4. Label entity events 발화 (PR 5e)
labels slice의 createLabel/updateLabel/deleteLabel/restoreLabel/+ membership actions에서 entityEvents.push. tags.ts 패턴 정합. Activity unification 보충.

---

## 🟡 P1 — UI polish 후보

### 5. EVENT_HEX palette promotion
PR 5d에서 17 신규 event types에 임시 hex 매핑 (#5e6ad2, #10b981, #8b5cf6, etc.). EVENT_HEX LOCKED palette에 정식 entry로 promotion 필요. lib/colors.ts EVENT_HEX 확장.

### 6. EDGES section (Ontology Legend 확장)
현재 OntologyLegend는 Notes/Wiki/Books 3 그룹만. EDGES section 추가 — wikilink / tag / relation type별 색 swatch + 라벨. RELATION_HEX (이미 정의됨) 활용.

### 7. List Options 토글 mismatch (Ontology display panel)
사용자 시그널 (이전 기록): "List Options 토글 mismatch — 디폴트 OFF인데 graph는 모두 표시. 토글 한 번 켰다 꺼야 sync"
- `view-engine/defaults.ts` 또는 GRAPH_VIEW_CONFIG defaults 점검.

---

## 🟣 P2 — 작은 정리

- LibraryEntityConnectionsPlaceholder 함수 — PR #344에서 제거됨 (placeholder X, 실제 컴포넌트로 교체). 만약 어딘가 import 남아있으면 unused warning.
- `EntityHistoryPlaceholder` (side-panel-activity) — PR 5d에서 제거됨. 같은 검증.
- NoteLocalAnchors + WikiLocalAnchors → 단일 `LocalAnchors` 컴포넌트로 통합 (`{ entityId, anchors }` prop). 코드 중복 ~50줄 줄임.
- ActivityTimeline `noteId` prop @deprecated — call site 점진 마이그레이션 (`entity={{ kind: "note", id }}`).
- Reference.history (reference-internal mark/edit detail) vs entityEvents 중복 — 통합 검토. 단 history는 detail 풍부 (action + detail 텍스트) — 별개 유지가 합리적.

---

## 🟣 P2 — 이전 후보 (PR #333 시점)

---

## 🟡 P1 — 큰 그림 정비 (R2부터)

### R2. 앱 전체 폴리시 PRD 작성

**필수**: `linear-design-mirror` skill audit + `docs/reference/linear/` 50+ 스크린샷 분석

PRD scope:
- 사이드바 spec 추가 audit (`a-sb-link`, `a-sb-link__count`, `a-sb-title` 토큰 정합)
- NOTES/WIKI mini stat 카드 uppercase 일관성 검토
- 트랜지션 통일 (150ms Plot vs 160ms Linear)
- 텍스트 밝기 (Plot 0.65 → Linear 0.82)
- 다른 글로벌 find-replace 사고 검출 (broad grep)
- 화면 풀폭 (PR-3 9 화면 max-w 제거)
- Breadcrumb 일관성 확장 (Wiki/Books/Library도 적용 여부)

진행 전 `.omc/plans/linear-mirror-polish-prd.md` 작성:
- audit 결과
- 폴리시 PR 분할안 (각 PR 본질 + 범위 + 검증 방법)
- 사용자 합의 후 R3부터 시리즈 진행

### R3+. 폴리시 PR 시리즈 (PRD 결과 순서대로)

R2 PRD 결과에 따라 분할:
- (예) Breadcrumb 일관성 확장 PR (Library/Wiki/Books)
- (예) 화면 풀폭 9 화면 PR (max-w 제거 + grid 반응형)
- (예) 토큰 정합 PR (사이드바/typography spec audit)
- (예) 트랜지션 통일 PR
- (예) 텍스트 밝기 PR

### 커맨드 팔레트 ⌘K Linear 식 재설계 (R4 또는 별도)

- `docs/reference/linear/커맨드팔레트*` 13장 분석
- 현재 Plot ⌘K vs Linear ⌘K 갭 spec 도출
- PRD `.omc/plans/command-palette-redesign-prd.md` 작성
- Linear scroll 12 surface 패턴 부분 적용 (Plot 본질에 맞게)

### 풀 검색 페이지 신설 (R5 또는 별도)

- `docs/reference/linear/메인화면-Search*.png` 4장 분석
- 새 라우트 `/search` 또는 expanded view
- Display/Filter/Ordering 옵션 + 결과 리스트
- 백엔드: 기존 SearchClient 재사용

---

## 🟡 P1 — 이전 PR verify 잔여 (사용자 manual verify 안 된 경우만)

이전 9 PR (#322-#327, #329-#331) 사용자 manual verify:

1. **Template Detail 재설계** (#322) — /templates Daily Log 클릭 → Detail에 Dates / Outline / Properties=stats / Actions
2. **Wiki Stub badge** (#322 보너스) — /wiki Working Memory → "Wiki Stub" muted badge
3. **Book 사이드바 4탭** (#323) — /books * → ⌘B → 4탭 (Detail/Connections/Activity/Bookmarks)
4. **Connections status dots** (#324) — /notes 노트 클릭 → Connections 탭 → status dots
5. **Book Bookmarks IN THIS BOOK** (#325) — /books * → Bookmarks 탭
6. **Books list divider X + checkbox w-8** (#326) — /books list mode → 행 구분선 X
7. **Time grouping** (#327) — /notes Display → Group by "Updated"
8. **Template anchor pinning** (#329) — /templates Daily Log → Bookmarks 탭
9. **Library Files Detail panel** (#330 + #331) — /library Files → 파일 클릭

→ 이번 세션 스크린샷에서 일부 surface는 보임 (사이드바 등). 명시 OK는 못 받음 — 다음 세션 확인.

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
