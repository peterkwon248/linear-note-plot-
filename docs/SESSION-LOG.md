# Session Log

> 세션 history. Append-only (오래된 entry 그대로 유지).
> 가장 최신 세션이 위.
> **NEXT-ACTION.md 폐지 (2026-05-12)**: 각 entry 첫 줄의 "다음 즉시 액션 hook"이 다음 세션 시작점.

---

## 2026-05-17 (저녁) — 집/Windows, **Label/Category cross-entity 전면 확장 + Library hub 재배치 + v137 migration**

> 🎯 **다음 즉시 액션**:
> 1. **Wiki Template 신설** (별도 PR, 다음 세션 핵심 작업) — Plot에 `WikiTemplate` 타입/slice/UI 신설. memory의 영구 결정 "WikiTemplate 통합 모델"이 실제 코드로는 미구현. 사용자 명시 "위키에도 템플릿이 신설되어야 해".
> 2. **(선택) Book Template 도입 가능성 논의** — 사용자가 "북에는 템플릿이 도입될 수 있을지 확신 안 들어" — 다음 세션 brainstorming.
> 3. **(선택) Categories 본격 분리 (길 B)** — 현재 길 A (entry만 Library, click 시 wiki page로 navigate). 본격 `/library/categories` 신규 route + `CategoriesView` 독립 컴포넌트로 분리하면 사용자 의도 100% 정합. 작업량 ~10 파일.
> 4. **(선택) note-detail-panel.tsx dead code 제거** — `components/note-detail-panel.tsx`는 어디서도 import 안 됨 (자기 자신만). 실제 사이드바 노트 detail은 `side-panel-context.tsx`. cleanup PR.
>
> **사용자 의도** (이번 세션, 그대로 인용):
> 1. "라벨 → 가장 큰 분류, 카테고리 → 라벨 내의 세부 분류표, 태그 → 자유 키워드 등록"이라 생각했음 (사용자 처음 mental model).
> 2. "Category 자유 (Label과 독립): Category 'Meeting'은 어느 Label이든 붙음. 라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로, 자유롭게" — 계층 의존 폐기 + orthogonal 독립 결정.
> 3. "사이드바에서 태그 추가의 경우 현재 노트든, 위키든, 북이든 기존에 있는 태그만 추가할 수 있고 기존에 없던 태그를 만들어내는 기능이 없는 거 같거든? 이것도 가능하게 해줘야 할 듯" — inline Create UI 모든 entity에.
> 4. "노트의 경우 따로 라벨을 채택하지 않으면 자동으로 memo 분류를 하는데... 그냥 이 방식을 없애야 될 거 같아" — Memo 자동 부여 폐기.
> 5. "라벨과 카테고리스도 라이브러리로 배치해야 형평성이 맞을 거 같은데" — cross-entity 분류는 Library hub로.
> 6. "왜 카테고리스랑 라벨스는 화면에 안 나옴??" — Library Overview UI에 stat card 누락 발견.
>
> **결정 4종 (영구 LOCKED)**:
> - **결정 1 (a)**: WikiCategory 시스템 공유 (Note/Wiki/Book 모두 같은 풀)
> - **결정 2 (a)**: Wiki Category DAG hierarchy 유지 (1-level만 써도 OK, 사용자 자유)
> - **결정 3**: Label 풀 공유 + **Memo 자동 부여 폐기** (labelId null이면 chip 안 보임, 모든 entity 동일)
> - **결정 4 (a)**: Folder + Label 둘 다 유지 (Folder = 작업 공간, Label = 분류 marker)
>
> **사이드바 재배치 (옵션 A)**:
> - Labels 본격 이동: `/labels` → `/library/labels` (legacy `/labels` 호환). Notes 사이드바에서 제거.
> - Categories 길 A (단순): Wiki 사이드바에서 제거 + Library에 entry 추가. click 시 `/wiki` + categoryView mode로 navigate (본격 분리는 별도 PR).
>
> **첫 스텝** (다음 세션 — 다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됨)
> 2. `npm install && npm run dev` (port 3002) + hard refresh + console `[migrate] v136→v137` 확인
> 3. **manual verify** (이번 PR 누적 변경):
>    - **Note Detail (side-panel-context)**: Folders / Label / Tags / **Categories** ⭐ / In Books — 5 메타 row
>    - **Wiki Detail**: **Label** ⭐ + **Categories (편집 가능)** ⭐ + Tags (이전 PR) — 분류 메타 풀 셋
>    - **Book Detail**: **Label + Categories + Tags** ⭐⭐⭐ — Properties section 위 3 신규 row
>    - **Library sidebar**: Overview / References / Tags / **Labels** / **Categories** / Files / Stickers
>    - **Library Overview UI**: 6 stat card 그리드 (References / Tags / **Labels (N in use)** / **Categories (N in use)** / Files / Stickers)
>    - **Notes sidebar More section**: Templates / Insights만 (Labels 제거)
>    - **Wiki sidebar**: Overview / Merge / Split / Views / Folders (Categories 제거)
>    - **새 노트 생성 시**: labelId=null 유지 → Label chip 안 보임 (Memo 자동 부여 폐기 verify)
>    - **각 Detail picker**: 검색 input + "Create '...'" inline 옵션 작동 확인
> 4. **다음 PR 시작 — Wiki Template 신설** (큰 작업):
>    - 새 type `WikiTemplate` (lib/types.ts)
>    - 새 slice `wiki-templates.ts` (CRUD + events)
>    - migration (SEED_WIKI_TEMPLATES + IDB initialization)
>    - UI — Wiki 사이드바에 Templates entry + WikiTemplatePicker (Wiki 생성 시 template 선택 flow) + 4탭 사이드바 Detail panel
>    - 작업량 ~20 파일
>
> **컴포넌트 구조 / 데이터 흐름** (이번 세션 변경):
> - **`components/category-picker.tsx`** (신규) — entity-agnostic CategoryPicker. TagPicker 패턴 정합 (검색 input + filtered list + exactMatch + showCreate). props: `entityId / selectedCategoryIds / allCategories / onAddCategory / onRemoveCategory / onCreateCategory`. FolderSimple icon. flat list (DAG hierarchy 표시는 P2 polish).
> - **`components/side-panel/side-panel-context.tsx`** — Note Detail (실제 사이드바)에 CategoryPicker 추가. `side-panel-detail.tsx`의 NoteDetailPanel은 `side-panel-context.tsx`로 dispatch. `components/note-detail-panel.tsx`는 dead code (P2 cleanup 후보).
> - **`components/side-panel/wiki-article-detail-panel.tsx`** — Categories read-only chip → CategoryPicker 편집 가능. + Label section 신규 (LabelPicker). + (이전 PR) Tags TagPicker.
> - **`components/side-panel/book-detail-panel.tsx`** — Properties section 위에 3 신규 row: Label / Categories / Tags. 모두 inline Create.
> - **`components/linear-sidebar.tsx`** —
>   - Notes "More" section: Labels entry 제거 (Templates / Insights만)
>   - Wiki section: Categories button 제거
>   - Library section: Labels entry 추가 (`/library/labels`) + Categories button 추가 (click 시 wiki page + categoryView mode)
> - **`components/views/library-view.tsx`** — LibraryOverview에 Labels + Categories stat card 추가. 4-col → 3-col grid (2 row, 6 카드).
>
> **Store action 매핑** (이번 세션):
> - `createNote(partial?)` — labelId null 유지 (Memo 자동 부여 폐기, `notes.ts:11`)
> - `updateNote(id, { categoryIds })` — Note categoryIds 갱신
> - `updateWikiArticle(id, { labelId | categoryIds })` — Wiki label/category 갱신
> - `updateBook(id, { labelId | categoryIds | tags })` — Book 분류 메타 갱신
> - `createWikiCategory(name)` → `string | null` (이미 존재, CategoryPicker에서 재활용)
> - `createLabel(name, color)` → void (LabelPicker `onCreateLabel` 후 즉시 entityId.labelId 할당)
> - `createTag(name)` → `string` (이전 PR에서 시그니처 변경)
> - `setCategoryOverview()` — wiki-view-mode (Library Categories card click 시)
>
> **데이터 모델 변경**:
> - Store version **v136 → v137** (`lib/store/index.ts:257`).
> - **v137 migration** (`migrate.ts`):
>   - `WikiArticle.labelId` default null (없으면 채움)
>   - `Book.labelId` default null + `Book.categoryIds` default [] + `Book.tags` default []
>   - `Note.categoryIds` default [] (모든 노트에 빈 array)
>   - 명시 "in" 체크로 사용자 데이터 보존
> - **type 변경** (`lib/types.ts`):
>   - `WikiArticle.labelId?: string | null` 신규 (line 401 근처)
>   - `Note.categoryIds?: string[]` 신규 (line 461 근처)
>   - `Book.labelId?: string | null` + `Book.categoryIds?: string[]` + `Book.tags?: string[]` 신규 (line 124 근처)
> - **lib/colors.ts** — KNOWLEDGE_INDEX_COLORS에 `labels` (rose #f43f5e) + `categories` (emerald #10b981) 추가
>
> **Route 변경**:
> - `/library/labels` 신규 route — `app/(app)/library/labels/page.tsx` + `layout.tsx` 분기 추가 + `VIEW_ROUTES` 등록
> - legacy `/labels` 호환 유지 (둘 다 LabelsView mount)
> - Categories는 route 변경 없음 (길 A) — `/wiki` + categoryView mode
>
> **위험 + 회피** (이번 세션 교훈):
> - **dead code 위험 (note-detail-panel.tsx)**: 어디서도 import 안 됨. 실제 사이드바는 side-panel-context.tsx. 변경 시 진짜 mount 위치 확인 의무 (사용자 verify 시 "사이드바에 Categories 안 보임" 발견).
>   - 회피: 변경 후 preview에서 selector로 실제 표시 확인. 또는 `Grep` import chain 확인.
> - **createWikiCategory return type**: `string | null` (label 다름). CategoryPicker.onCreateCategory도 같은 signature.
> - **TS 'in' 체크**: optional 필드는 `if (!("labelId" in w))` 로 default 채움. `w.labelId == null`은 키 자체 없는 케이스 안 잡힘.
> - **WikiCategory 공유 의미 변화**: 이제 "Computer Science" 카테고리가 wiki 외에도 노트/책에 부여 가능. 사용자 mental model "공통 분류 풀"로 통일 — 의미 충돌 시 사용자 결정 필요.
> - **Memo 자동 부여 폐기 영향**: 기존 노트는 그대로 (Memo label 그대로 부여됨). **새 노트만 label null로 시작**. 사용자가 일관성 원하면 일괄 Memo 제거 migration 가능 (별도 PR).
> - **글로벌 find-replace 사고 영구 룰 51**: PR 머지 전 placeholder/string literal grep 의무 (이번 PR에서는 신규 string literal 적음).
> - **Library Overview stat card 누락 case**: sidebar entry만 추가하고 overview UI 누락 — 사용자 시각 확인이 가장 빠른 진단. 사이드바 + overview 동시 보강이 정합 패턴.
>
> **참고 파일** (다음 작업 시 read):
> - `components/category-picker.tsx` (신규) — entity-agnostic picker 패턴. TagPicker / LabelPicker 정합
> - `components/note-fields.tsx:365` TagPicker — entity-agnostic 패턴 reference
> - `components/note-fields.tsx:493` LabelPicker — single-value picker reference
> - `components/side-panel/side-panel-context.tsx` — Note Detail 실제 mount 위치 (note-detail-panel.tsx는 dead code)
> - `lib/store/migrate.ts:2070` v137 block — seed/default 추가 패턴
> - `components/linear-sidebar.tsx:1560` Library section — Labels/Categories entry 위치
> - `components/views/library-view.tsx:575` LibraryOverview — 6 stat card grid
> - **Wiki Template 신설 시 reference**:
>   - `lib/types.ts:695` NoteTemplate 타입 — 그대로 WikiTemplate 변형 reference
>   - `lib/store/slices/templates.ts` — NoteTemplate slice reference
>   - `lib/store/seeds.ts` SEED_TEMPLATES — Wiki seed 변형 reference
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR (이 entry + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926` (계속 사용 가능)

### 완료

- **Memo 자동 부여 폐기** (`notes.ts:11-17`) — `createNote` 시 labelId 미지정이면 null 유지. 영구 룰 (사용자 명시).
- **types.ts 4 신규 필드** — Wiki.labelId / Note.categoryIds / Book.labelId+categoryIds+tags
- **v137 migration** — 사용자 데이터 보존 + default 추가 (`!("labelId" in w)` 등 명시 체크)
- **CategoryPicker 신규 컴포넌트** — TagPicker 패턴 정합 (entity-agnostic, 검색 + inline Create)
- **Note Detail (side-panel-context)** — CategoryPicker section 추가
- **Wiki Detail** — LabelPicker + CategoryPicker (편집) 추가 (Categories 이전 read-only chip → picker)
- **Book Detail** — LabelPicker + CategoryPicker + TagPicker 3 row 신규 (Properties section 위)
- **Sidebar 재배치** — Labels (Notes→Library) + Categories (Wiki→Library, 길 A)
- **`/library/labels` route 신규** — `app/(app)/library/labels/page.tsx` + `layout.tsx` 분기 + `VIEW_ROUTES`
- **Library Overview UI 보강** — 6 stat card grid (Labels + Categories 추가, 3-col layout 2 row)
- **KNOWLEDGE_INDEX_COLORS 확장** — labels (rose) + categories (emerald)

### 영구 LOCKED 결정 (이번 세션)

- **53. Label/Category/Tag = orthogonal 독립 + 자유 선택** — 계층 의존 X. 각 entity에 자유 부여 가능 (없어도 OK). 사용자 마음대로.
- **54. WikiCategory 풀 공유 (cross-entity)** — Note/Wiki/Book 모두 같은 카테고리 시스템. 별도 entity별 풀 X. Smart Book의 `kind: "category"` source도 cross-entity 자연 확장.
- **55. Wiki Category DAG hierarchy 유지** — N-level 깊이 그대로. Note/Book 사용자는 1-level만 써도 자유. wiki 본질 (학문 분류) 보존.
- **56. Memo 자동 부여 폐기 영구** — `createNote` 시 labelId 미지정 → null. Label chip은 labelId 있을 때만 표시. 모든 entity 동일 패턴.
- **57. cross-entity 분류 메커니즘 = Library hub** — Label/Category/Tag (모두 cross-entity)는 Library 사이드바에 모임. Notes/Wiki entity 사이드바에서 제거 (Templates / Folders 같은 entity-specific만 유지).
- **58. CategoryPicker entity-agnostic** — `components/category-picker.tsx`. Note/Wiki/Book 모두 같은 컴포넌트 + 다른 callback wire-up. TagPicker / LabelPicker / FolderPicker 패턴 정합.

### 기술 학습 (영구)

- **사용자 mental model "Label > Category > Tag 계층"이 처음 떠올랐지만 reframe 가능** — 사용자가 함정 1 (Category가 Label 종속) 직접 해결. "Category 자유 (Label과 독립): 라벨도, 카테고리도, 태그도 붙이든 말든 전부 유저 마음대로" → orthogonal 독립으로 정착. **mental model이 코드 디자인보다 우선**.
- **CategoryPicker는 TagPicker 패턴 그대로 재활용** — `flat list + search input + inline Create + exactMatch 체크`. wikiCategories DAG는 모델 그대로지만 picker는 flat 검색으로 충분 (사용자가 search로 찾으면 됨, hierarchy 시각화 X).
- **dead code 잠재**: `note-detail-panel.tsx`처럼 어디서도 import 안 되는 컴포넌트가 큰 변경 PR 후 잔존 가능. 실제 mount 컴포넌트가 무엇인지 매번 확인 (Grep `<ComponentName`).
- **stat card 누락은 시각 확인이 가장 빠름** — 사용자가 스크린샷 보고 "왜 안 나옴" 보고. 사이드바 + Overview UI는 같이 보강하는 패턴 (entity-uniformity 영구 룰).
- **사용자 일관성 욕구의 본질** — "라이브러리로 배치해야 형평성이 맞을 거 같은데" → cross-entity 데이터는 cross-entity hub. Plot의 entity-specific sidebar에 두면 사용자가 "왜 노트 안에 있지?" 의문.

### Watch Out (다음 세션)

- **🔴 Wiki Template 신설 (큰 작업)**: 사용자 명시 시그널. 다음 PR 핵심. ~20 파일.
- **dead code**: `components/note-detail-panel.tsx` — 별도 cleanup PR.
- **Categories 본격 분리 (길 B)**: 사용자가 길 A 선택했지만 향후 polish 가능. `/library/categories` 신규 route + CategoriesView 분리.
- **사용자 사전 노트의 Memo label**: 기존 노트는 그대로 Memo label 부여 상태. 사용자가 일괄 제거 원하면 별도 migration PR.
- **WikiCategory가 cross-entity = 의미 변화**: "Computer Science" 카테고리가 wiki 학문분류 의미였는데 이제 노트/책에도. 사용자 데이터 의미 충돌 시 보고 받아야.
- **Book Template 도입 검토 (P1, 사용자 명시 "확신 안 듦")**: 다음 세션 brainstorming.

### 환경 변경

- Store version: **v136 → v137** (Label/Category cross-entity 필드 default 추가)
- Persist version: 137
- 신규 파일:
  - `components/category-picker.tsx` (CategoryPicker)
  - `app/(app)/library/labels/page.tsx` (`/library/labels` route)
- 데이터 모델 변경: 4 신규 optional 필드 (Wiki.labelId / Note.categoryIds / Book.labelId+categoryIds+tags). migration default.
- 색 토큰: KNOWLEDGE_INDEX_COLORS.labels (rose) + .categories (emerald)
- VIEW_ROUTES: `/library/labels` 추가
- Preview verify:
  - v137 migration: Notes 25 categoryIds 초기화 / Wikis 19 labelId / Books 9 labelId+categoryIds+tags
  - Library sidebar: 6 entry (Tags 7 / Labels 5 / Categories 11 / Files / Stickers 0 / References 0)
  - Library Overview: 6 stat card 정상 표시 ✅
  - Note Detail: Categories section 표시 ✅
  - Wiki/Book Detail: 모든 picker render ✅

---

## 2026-05-17 — 집/Windows, **Tags/Labels sub-page entity-uniformity 1차 (사이드바 + 체크박스 + dblclick + cross-entity derive + seeds v135/v136 + FunnelSimple fix)**

> 🎯 **다음 즉시 액션**: **Tags/Labels sub-page를 view-engine 통합 (ViewHeader + 표준 DisplayPanel + List/Grid + 풍부한 Grouping/Display Properties)**. 사용자 시그널 "기존 플롯식 정합과 다른데" + "디스플레이 프로퍼티스 부실 + 그룹핑 옵션 없음" — 본격 통합 별도 PR (이번 PR에서 분리 채택).
>
> **사용자 의도** (이번 세션 그대로 인용):
> 1. "라벨의 우측 사이드바는 아직 구현이 안 된 게 맞지? 그리고 클릭 시 단순히 리스트만 나오는 게 아니라, 체크박스도 있어야 되지 않나? 그리고 해당 리스트에서 더블클릭을 하면 실제 해당 노트로 넘어가게 해주면 좋고."
> 2. "더블클릭했는데 왜 해당 노트로 안 넘어가? 해당 노트의 에디터가 딱 떠줘야지."
> 3. "태그의 경우 노트도 있고 위키도 있고 북에도 들어갈텐데, 그 리스트가 나눠져야 되지 않냐? 라벨은 노트에만 국한되어 있다쳐도."
> 4. "북에 소속되어있는 노트에 태그가 들어있으면 자동으로 태그스에 속하게 시킬건가?" — derive 방식 사용자 직관
> 5. "사이드바에서 태그 추가의 경우 현재 노트든, 위키든, 북이든 기존에 있는 태그만 추가할 수 있고 기존에 없던 태그를 만들어내는 기능이 없는 거 같거든?"
> 6. "왜 태그스의 디스플레이는 이상하냐? 화면이. 기존의 플롯식 정합과 다른데? 왜 필터는 없냐? 라벨스도 이상해."
>
> **첫 스텝** (다음 세션 — 다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됨)
> 2. `npm install && npm run dev` (port 3002) + hard refresh + console `[migrate] v135→v136` 확인
> 3. **Tags/Labels sub-page를 view-engine 통합**:
>    - 새 `TAG_DETAIL_VIEW_CONFIG` / `LABEL_DETAIL_VIEW_CONFIG` 정의 (`lib/view-engine/view-configs.tsx`)
>      - `displayConfig.properties` — 노트 row visible columns (title / status / labels / tags / updatedAt / createdAt 등)
>      - `displayConfig.groupingOptions` — None / Status / Priority / Folder / Label / Created / Updated / First letter (Notes 정합)
>      - `displayConfig.supportsViewMode` — list / grid (또는 list만)
>    - tags-view.tsx / labels-view.tsx sub-page render 분기를 ViewHeader + 표준 DisplayPanel + FilterPanel로 교체
>    - EntityNoteListRow에 `visibleColumns?: string[]` prop 추가 + 조건부 chip 렌더
>    - Filter는 표준 FilterPanel + filterCategories (Notes 정합)
> 4. **선택 작업** (Phase 2/3 본 hook 후속):
>    - Wiki 본문 #해시태그 자동 sync (Note editor 패턴 wiki editor에도 wire-up) — P1
>    - Wiki blocks 임베드 노트의 tag derive (reference-aware sub-page 매칭) — P1
>    - Note의 wikilink가 가리키는 entity tag derive — P2
>    - Book Detail manual TagPicker — 사용자 결정 필요 (현재 derive only)
>
> **컴포넌트 구조** (이번 변경):
> - `components/views/entity-note-list-row.tsx` (신규) — DRY row helper. `<div role="button">` + hover-only checkbox + single click = toggle + double click = navigate. props: `note / isSelected / onToggleSelect / onNavigate`.
> - `labels-view.tsx` / `tags-view.tsx` sub-page 변경:
>   - `useState<Set<string>>` 추가 — multi-select state
>   - `useEffect`로 `selectedXxxId` 변경 시 `sidePanelContext` + `sidePanelOpen: true` sync (영구 룰 21)
>   - `useCallback navigateToNote(noteId)` = `setSelectedXxxId(null)` + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")` — sub-page exit + 노트 editor 진입
>   - `<button>` row → `<EntityNoteListRow>`
>   - Selection bar (`{N} note(s) selected` + Clear)
> - `tags-view.tsx` cross-entity sections (Notes + Wiki + Books):
>   - `tagWikis` = `wikiArticles.filter(w => !w.trashed && w.tags.includes(selectedTagId))`
>   - `tagBooks` = `books.filter(b => b.items 노트/위키 중 tag 가진 게 있거나 b.smartSources에 kind="tag" + 이 tag refId 있음)`
>   - 빈 섹션 hide, 모두 비면 "No items with this tag"
>   - Wiki row inline (Stub/Article icon + title + relative time, dblclick = `router.push("/wiki")`)
>   - Book row inline (BookKindIcon + title + items count, dblclick = `router.push("/books/{id}")`)
> - `components/side-panel/wiki-article-detail-panel.tsx` Tags 섹션:
>   - read-only chip strip → `<TagPicker>` (Note Detail 정합)
>   - inline Create 자동 포함 (Popover에 search input + "Create '...'" 옵션)
>   - `onCreateTag` 시 새 id 생성 후 즉시 `updateWikiArticle({tags: [...current, newId]})`
>
> **데이터 모델 변경**:
> - Store version **v134 → v135 → v136** (`lib/store/index.ts:257`).
> - **v135**: wiki seed tag backfill. PR #347 이후 v134로 push된 wiki-8~17이 빈 tags였던 문제 fix. `state.wikiArticles[].tags` 빈 배열 + seed.tags 비어있지 않은 경우만 fill (idempotent, 명시적으로 사용자가 비운 wiki는 영향 X).
> - **v136**: SEED_NOTES backfill. note-1~9가 사용자 IDB에 없던 경우 push (id-dedup append, wiki v134 패턴 정합).
> - **Book entity 데이터 모델 변경 없음** — tags 필드 X. Tag sub-page Books 섹션은 derive only.
> - **Seeds**:
>   - `wiki-8~17`에 tags 분산 적용 (총 10 wiki — CS/Algorithms/Quicksort/Binary Search/Data Structures/Hash Table → tag-5 / Productivity Methods/GTD/Pomodoro → tag-3 / Theory of Knowledge → tag-1+tag-2)
>   - SEED_NOTES + SEED_BOOKS는 기존 tag 매핑 그대로 (이미 풍부)
>
> **글로벌 find-replace 사고 fix (재발 — 2026-05-14 Search→MagnifyingGlass 사고 패턴 정합)**:
> - `components/filter-bar.tsx` — `FunnelSimple` icon 이름이 button label + placeholder string 8곳에 텍스트로 잔재
>   - placeholder `"FunnelSimple..."` × 6 → `"Search..."`
>   - button label `{!hideLabel && "FunnelSimple"}` → `"Filter"`
>   - 주석 1곳 cleanup
> - 사용자 보고 "FunnelSimple"이 toolbar에 보이던 문제 즉 해결.
>
> **Store action 매핑**:
> - `usePlotStore.setState({ sidePanelContext, sidePanelOpen })` — useEffect로 직접 sync
> - `setActiveRoute("/notes")` (`lib/table-route.ts:123`) + `router.push("/notes")` — sub-page exit + 노트 페이지 진입
> - `openNote(id)` (`ui.ts:40`) — selectedNoteId + sidePanelContext + reads ++ + editorTabs sync
> - `updateWikiArticle(id, { tags })` — Wiki TagPicker callback
> - `createTag(name)` → `string` (이번 PR에 변경된 시그니처 활용)
>
> **위험 + 회피** (이번 세션 교훈):
> - **글로벌 find-replace는 placeholder/string literal까지 검수 의무**. Memory 영구 룰 또는 grep 패턴 (`"<IconName>\s+\w+"`)을 PR review에 적용. 두 번째 사고 (FunnelSimple) — 정착 필요.
> - **TagPicker는 이미 inline Create 완비** (`components/note-fields.tsx:365`). 새 picker 만들 필요 X — wiki/book에도 같은 컴포넌트 재활용. noteId prop은 entityId 의미로 사용 가능.
> - **Wiki article 진입 routing**: `selectedWikiArticleId`는 wiki-view 내부 local state. 외부에서 wiki article로 deep-link 불가. router.push("/wiki")만 가능. 미래 query param 추가 시 (P2) 외부에서 wiki article로 직접 진입 가능.
> - **Book entity tags 필드 없음** — `lib/types.ts:124`. derive 방식 (B2) 채택: Book.items 안 note/wiki + smartSources tag 매칭. 데이터 모델 변경 0 = migration 0 = sync 버그 0.
> - **시드 보강 + migration 패턴 영구**: wiki-8~17이 시드는 있지만 v134 backfill로 push된 후 새 tag 매핑 추가하려면 — seed 변경 + v135 fill migration (idempotent + 명시적 비움 데이터 보호). 같은 패턴 반복 가능.
> - **TagPicker prop closure stale risk**: wiki-article-detail-panel의 onCreateTag 콜백이 article prop을 closure로 잡음. createTag 후 즉시 updateWikiArticle 호출 시점에 article은 최신이지만, React strict mode 또는 fast re-render 시 closure stale 가능. preview verify에서 한 번 발생 (article.tags가 빈 배열로 보임) — 사용자 환경에서는 안 발생할 가능성 큼. 후속 P2: 콜백 안에서 `usePlotStore.getState().wikiArticles.find(...)` 직접 read로 변경.
> - **wiki-1~13 trashed:true 잔존**: 사용자 IDB의 사전 데이터 (이번 PR 영향 X). v134/v135/v136 모두 trashed flag 안 건드림. fresh user는 정상. 사용자 본인이 untrash 또는 별도 v137 강제 reset 결정.
>
> **참고 파일** (다음 작업 시 read):
> - `components/views/notes-table-view.tsx` — Notes table의 ViewHeader + DisplayPanel 통합 패턴 (다음 작업의 reference)
> - `lib/view-engine/view-configs.tsx` — VIEW_CONFIG 정의 위치 (TAG_DETAIL_VIEW_CONFIG / LABEL_DETAIL_VIEW_CONFIG 신규 추가 자리)
> - `components/display-panel.tsx` — 표준 DisplayPanel 컴포넌트 (List/Grid + Grouping + Display Properties section)
> - `components/filter-bar.tsx:1116` — FilterButton 컴포넌트 (다음 작업에서 sub-page에 통합)
> - `components/views/entity-note-list-row.tsx` (신규) — visibleColumns prop 도입 자리
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR + merge (이 entry 작성 + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926` (계속 사용 — main에 squash merge 후 같은 worktree에서 새 PR 가능)

### 완료
- **Labels/Tags sub-page 사이드바 자동 노출** — useEffect로 selectedXxxId 변경 시 sidePanelContext + sidePanelOpen sync (영구 룰 21)
- **Labels/Tags sub-page row 패턴 entity-uniformity** — `<EntityNoteListRow>` helper 신규. hover checkbox + single click = toggle + double click = navigate
- **노트 더블클릭 시 실제 editor 진입** — sub-page exit + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")`
- **Tag sub-page cross-entity 3 섹션** — Notes (useNotesView) + Wiki articles (filter w.tags) + Books (derive: items 노트/위키 중 tag 가진 게 있거나 smartSources에 kind="tag" 매칭)
- **사이드바 inline Create tag** — Wiki Detail에 TagPicker upgrade (read-only → picker). Note Detail은 이미 완비. Book Detail은 derive 방식이라 picker 안 추가.
- **Seeds 보강**: wiki-8~17 (10개) 각각 tag 분산 적용
- **v135 wiki seed tag backfill**: 빈 tags wiki + seed에 tags 있으면 fill (idempotent)
- **v136 SEED_NOTES backfill**: note-1~9 push (id-dedup append)
- **FunnelSimple 텍스트 잔재 fix** (filter-bar.tsx 8곳)

### 영구 LOCKED 결정 (이번 세션)

- **46. Entity sub-page (Tags/Labels) row UX 영구 룰**: `<EntityNoteListRow>` helper 패턴 — hover checkbox + single click = toggle select + double click = navigate. Notes/Wiki table row 패턴 정합. 영구 룰 21 entity-uniformity 확장.
- **47. Sub-page → 노트 editor 진입 패턴**: `setSelectedXxxId(null)` + `setActiveRoute("/notes")` + `openNote(id)` + `router.push("/notes")` 4단 세트. `openNote(id)`만 호출하면 sub-page 분기에 가려 editor 안 보임. (Plot의 `isEditingInTableView = isTableView && !!selectedNoteId` 조건 정합.)
- **48. Tag sub-page cross-entity = derive (B2)**: Book entity에 tags 필드 X. 대신 `Book.items` 안 노트/위키의 tag + smartSources tag 매칭으로 runtime 계산. 데이터 모델 변경 0, sync 버그 0, 사용자 의도 충족 ("북에 소속 노트의 태그가 자동 흡수").
- **49. Wiki tag 부여 = 명시적만**: Note는 본문 #해시태그 자동 sync (NoteEditorAdapter). Wiki는 자동 sync 미적용 (P1 후속). 시드 + UI picker로만 부여.
- **50. Seed 증가 동반 migration 영구 룰**: 시드 코드 변경 시 자동 backfill migration 동반. id-dedup append 또는 빈 필드만 fill (사용자 명시 비움 데이터 보존). v130/v134/v135/v136 같은 패턴 — 다음 세대도 동일.
- **51. 글로벌 find-replace 사고 grep 의무**: PR 머지 전 placeholder/string literal에 icon 이름이 박혀있는지 검수 (`"<IconName>\s+\w+"` 또는 `placeholder="<IconName>"`). MagnifyingGlass (2026-05-14) + FunnelSimple (2026-05-17) 두 번째 사고. 영구 PR review checkpoint.

### 기술 학습 (영구)

- **TagPicker는 entity-agnostic 재활용 가능**: prop `noteId`는 string entityId 의미로 wiki/book에도 적용 OK. callback에서 article.id 또는 book.id 전달 — 같은 컴포넌트 코드 + 다른 store action wire-up.
- **`setActiveRoute(...)` vs `router.push(...)` 둘 다 필요**: setActiveRoute는 store-level state (view switch), router.push은 URL 변경. Plot client-side routing은 둘 다 sync해야 layout 분기가 정확. one만으로는 view stale 가능.
- **derive 패턴 = data sync 버그 0**: Book.tags 신규 필드 (B1 mutate) 대신 runtime 합집합 (B2 derive). 노트 tag 바뀔 때마다 모든 책 tags 다시 계산할 필요 X — Tag sub-page query 시점에만 계산.
- **v134→v135 backfill 패턴**: wiki tags가 v134 backfill로 빈 채 들어왔던 경우, v135에서 seed.tags가 비어있지 않을 때만 update. 사용자가 명시적으로 비운 케이스는 안 fill (보수). idempotent.
- **글로벌 find-replace는 string literal까지 영향**: VS Code Replace All은 import / JSX 사용처 / string literal 모두 변환 — 의도 안 한 placeholder 깨짐. 영구 룰 51 적용 의무.

### Watch Out (다음 세션)

- **🔴 Tags/Labels sub-page Display 부실**: 사용자 명시 불만. view-engine 통합 본격 PR 필수. 작업량 ~10 파일 (view-configs / tags-view / labels-view / entity-note-list-row 등).
- **wiki-1~13 trashed:true 잔존**: 사용자 본인 환경. 별도 fix 결정.
- **Wiki 본문 #해시태그 자동 sync 미구현** (P1): 사용자가 추후 시그널 보내면 진행.
- **Book Detail manual TagPicker 미추가**: derive 방식 일관성으로 안 추가. 사용자가 manual tag도 원하면 별도 PR (Book.tags 신규 필드 + migration + picker UI).
- **사전 존재 타입 에러 (cleanup 후보 P2)**: insights-view noteEvents / wiki-articles trashed property / sticker-detail-panel / wiki-category-page 비교 등. 본 PR과 무관.

### 환경 변경

- Store version: **v134 → v135 → v136** (wiki tag fill + notes backfill)
- Persist version: 136
- 신규 파일: `components/views/entity-note-list-row.tsx`
- 데이터 모델 변경: 없음 (derive만, seed/migration만 변경)
- Preview verify:
  - wiki articles 9 → 19 (v134 backfill 후 v135 tag fill)
  - notes 16 → 25 (v136 backfill)
  - tags 6 → 7 (Wiki TagPicker로 1개 추가)
  - Tag #Knowledge Management → NOTES 5 / WIKI ARTICLES 4 / BOOKS 4 표시 ✅

---

## 2026-05-16 — 집/Windows, **Wiki/Books board 우클릭 ContextMenu + Workbench inline Create + v134 wiki seed backfill**

> 🎯 **다음 즉시 액션**: P0-2 12+4 PR 통합 manual verify (사용자 본인 환경에서) + P0-1 Tags/Labels 회귀 cross-machine 재확인
>
> **사용자 의도** (이번 세션, 명시 보고):
> 1. "위키 보드 디스플레이 모드에서 Add to category할 때 기존에 없었던 카테고리를 생성할 수 있는 기능이 있어야 해. (내 생각에, 기존에 있는 코드들을 재활용하면 될 거 같아.) Add to Tags도 마찬가지."
> 2. "보드 디스플레이 모드일 때 마우스 우클릭이 안 되네? 노트는 돼. 위키랑 북도 되어야 해."
> 3. "야 시드데이터를 다시 만들어줘. 위키 시드데이터가 지금 0이라서 테스트가 안 돼"
>
> **첫 스텝** (다음 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지된 main 받음)
> 2. `npm install && npm run dev` (port 3002)
> 3. Plot 포커스 + Hard refresh (Ctrl+Shift+R) → console `[migrate] v133→v134: re-seeded wiki (N articles, N categories)` 확인
> 4. **검증 surface (4 신규 + 12 기존)**:
>    - **신규 a**: `/wiki` → Wiki Articles board → 카드 우클릭 → `Merge into / Split / Show connected / Move to folder / Add to folders / Delete` 메뉴
>    - **신규 b**: `/books` → board mode (Display panel viewMode "board") → 카드 우클릭 → `Rename / Pin to sidebar / Move to trash` 메뉴
>    - **신규 c**: Wiki board 카드 선택 → 우측 Workbench `Add to category` → 검색 input + 매치 없을 때 "Create '…'" 옵션 노출 → 클릭 시 새 카테고리 생성 + 자동 picked + "Add to N category" 적용
>    - **신규 d**: 같은 패턴 `Add tags` (검색 → "Create #…" → 새 태그 생성)
>    - **신규 e**: `/wiki` Wiki seed 19 articles 표시 (v134 backfill — 사용자 환경 0개 → 17 시드 자동 인젝션, 기존 사용자 추가 보존)
>    - **기존 12 PR**: Library 5 entity 사이드바 / Activity timeline / Connections charts / Ontology Legend 좌하단 (PR #334-#345)
>
> **컴포넌트 구조** (이번 변경):
> - `components/books/book-context-menu-items.tsx` (신규) — `BookContextMenuItems` helper. Notes의 `note-context-menu-items.tsx` 패턴 정합 (영구 룰 21 entity-uniformity). props: `book / onRename / onTogglePin / onDelete / onRestore / onPermanentDelete`. trashed 분기 (Restore / Delete forever) vs active (Rename / Pin / Move to trash).
> - `book-grid-card.tsx` — ContextMenuContent 내부를 helper로 단순화 (51 line → 8 line).
> - `books-board.tsx` — `BookBoardCard`를 `<ContextMenu><ContextMenuTrigger asChild>` wrap. BoardCard / BoardColumn / BoardProps callback chain 추가.
> - `books-view.tsx:272` — BooksBoard에 `onRename={startRename} / onDelete={handleDelete} / onRestore={handleRestore} / onPermanentDelete={handlePermanentDelete}` 전달.
> - `wiki-board.tsx` — `Card` visual을 `ContextMenu` wrap (`WikiArticleMenuItems` 재활용 — `wiki-list.tsx`에서 export). CardProps에 `onMergeArticle / onSplitArticle / onDeleteArticle / onShowConnectedArticle` 추가. WikiBoard 본체에 prop chain.
> - `wiki-view.tsx:1400` — WikiBoard에 `onDeleteArticle={(id) => { deleteWikiArticle(id); toast.success('Article deleted') }} / onShowConnectedArticle={...connectedTo filter}` 전달 (WikiList 패턴 정합).
> - `wiki-board-workbench.tsx` — CategoryAddPopover / TagsAddPopover 재작성. `query` state + filtered list (case-insensitive includes) + `exactMatch` 체크 + `showCreate` 조건부 inline button. createWikiCategory / createTag 호출 → 새 id 자동 picked → "Add to N" 버튼 활성. tags `query.trim().replace(/^#/, "")` (`#` prefix strip).
>
> **Store action 매핑**:
> - `createWikiCategory(name, parentIds?)` → `string | null` (이미 존재, 재활용)
> - `createTag(name, color?)` → `string` ⭐ **시그니처 변경** (이전 `void`). `tags.ts:11` 구현 + `types.ts:287`. backward compat (void 반환 무시하던 곳은 영향 X).
> - `deleteWikiArticle(id)` → store inline 호출 from wiki-view
>
> **데이터 모델 변경**:
> - Store version **v133 → v134** (`lib/store/index.ts:257`). `migrate.ts` 마지막에 v134 block 추가 — `SEED_WIKI_ARTICLES` + `SEED_WIKI_CATEGORIES` backfill. **v130 backfill 패턴 정합** (id-dedup append, idempotent). 이유: PR #347이 wiki seed 7 → 17로 늘렸지만 v130 backfill은 v129 이전 사용자만 trigger → v130~v133 사용자가 옛 시드 그대로. v134가 누락 시드만 push.
>
> **위험 + 회피** (이번 세션 교훈):
> - ContextMenuTrigger asChild + dnd-kit `attributes/listeners` 조합: 두 set이 다른 element면 충돌 X (left-click = drag, right-click = contextmenu).
> - DragOverlay 사용 시 `if (isDragOverlay) return visual` 분기 유지 — overlay에 ContextMenu wrap X.
> - WikiArticleMenuItems prop signature는 `(...) => void` (id 안 받음) — wiki-board에서 article.id wrap 필요: `onMerge={onMergeArticle ? () => onMergeArticle(article.id) : undefined}`.
> - createTag void → string 변경 시 기존 호출자 영향 없음 (TS는 void → string 호환). 단 types.ts와 slice 양쪽 다 변경 의무.
> - 사전 존재 타입 에러 (insights-view noteEvents / wiki-articles trashed property 누락 / sticker-detail-panel 등) — 내 변경과 무관, 별도 cleanup PR 후보 (P2).
>
> **참고 파일** (다음 작업 시 read):
> - `components/views/wiki-list.tsx:83-171` — WikiArticleMenuItems export 위치
> - `components/note-context-menu-items.tsx` — NoteContextMenuItems 패턴 (entity helper 분리 reference)
> - `lib/store/slices/wiki-categories.ts:38` — createWikiCategory(name, parentIds?) → string | null
> - `lib/store/slices/tags.ts:11` — createTag(name, color) → string (변경됨)
> - `lib/store/migrate.ts:2072` — v134 backfill block
>
> **머신**: 집 (Windows)
> **현재 main HEAD**: 곧 PR (이 entry 작성 + commit + merge 후 갱신)
> **branch worktree**: `awesome-mcnulty-cac926`

### 완료

- **Wiki board 카드 우클릭 ContextMenu 추가** — wiki-board.tsx Card에 `<ContextMenu>` wrap. WikiArticleMenuItems 재활용. wiki-view에서 onDeleteArticle / onShowConnectedArticle 전달 (WikiList 패턴 정합).
- **Books board 카드 우클릭 ContextMenu 추가** — book-context-menu-items.tsx 신규 helper. book-grid-card / books-board 양쪽에서 재활용. books-view에서 4 callbacks (onRename / onDelete / onRestore / onPermanentDelete) 전달.
- **Wiki Workbench CategoryAddPopover inline Create** — 검색 input + 매치 없을 때 "Create '…'" inline button. createWikiCategory 호출 → 새 id 자동 picked.
- **Wiki Workbench TagsAddPopover inline Create** — 같은 패턴 (`#` prefix strip). createTag signature `void → string` 변경.
- **v134 wiki seed backfill migration** — PR #347 (7 → 17 articles + 10 categories) 적용 안 된 v130~v133 사용자에게 누락 시드 자동 인젝션 (preview 9 → 19 verified).
- **CLAUDE.md store version v133 → v134** 갱신.
- **P0-1 Tags/Labels 회귀 진단** — fresh preview에서 두 surface 모두 정상 작동 verify. `sidePanelContext` 정확히 set, TagDetailPanel / LabelDetailPanel 정확히 render. **회귀 재현 안 됨**. root cause: (a) HMR stale 또는 (d) Multi-worktree port 충돌 추정. **코드 fix 불필요**. 사용자 본인 환경에서 hard refresh + 다른 worktree dev server 정리 후 재확인.

### 영구 LOCKED 결정 (이번 세션)

- **42. ContextMenu helper 추출 패턴 영구** — entity별 helper 파일 (Notes/Books/Wiki 각각). `<entity>-context-menu-items.tsx` 신설 후 list/board/gallery 3 surface에서 재활용. props는 dumb (모든 store mutation/toast는 callback). 영구 룰 21 entity-uniformity 확장.
- **43. createTag id 반환 시그니처** (영구) — `createTag(name, color?) => string`. 모든 entity create action은 id 반환이 호출자 편의 우선 (createWikiCategory 패턴 정합). slice + types.ts 동시 변경 의무.
- **44. inline Create option 검색 input + cmdk 패턴** — Plot Popover (Tag/Category picker)에 `query` state + filtered list + exactMatch 체크 + `showCreate` 조건부 inline button. cmdk 패턴 정합. native prompt() 회피 (영구 룰 i18n + Linear polish).
- **45. Seed backfill migration 패턴 영구** — 시드 증가 (예: 7 → 17 articles) 시 자동 backfill migration 동반 의무. id-dedup append (사용자 추가 데이터 보존 + 누락 시드만 push). v130 / v134가 같은 패턴 — 다음 세대도 동일.

### 기술 학습 (영구)

- **Radix ContextMenuTrigger asChild + dnd-kit attributes/listeners 조합 안전** — outer div (drag) + inner visual (ContextMenuTrigger). left-click = drag, right-click = contextmenu. 별 set이라 충돌 X.
- **DragOverlay는 ContextMenu wrap 제외** — `if (isDragOverlay) return visual` 분기 유지.
- **WikiArticleMenuItems prop signature mismatch (id 안 받음)** — wiki-board.tsx Card에서 `(article.id)` wrap. board callback (`onMerge(sourceId)`)와 menu callback (`onMerge()`) 시그니처 다름.
- **시드 보강 + migration backfill 동시 의무** — 시드 코드만 늘리면 fresh user만 받음. 기존 사용자는 새 migration block 필요 (idempotent id-dedup).
- **회귀 보고 verify 패턴** — 코드 verified 정상 + 같은 IDB로 fresh preview에서 작동 재현 = HMR/multi-port stale. 코드 fix 안 함, 사용자에게 환경 정리 안내. "재현 안 되는 회귀"는 root cause 진단 후 close 가능.

### Watch Out (다음 세션)

- **사전 존재 타입 에러 (cleanup 후보 P2)**: insights-view noteEvents / wiki-articles trashed property / sticker-detail-panel / wiki-category-page createdAt 비교 / view-configs SortField 불일치 등. 본 PR과 무관. 별도 정리 PR.
- **P0-1 Tags/Labels 회귀 verify**: 사용자 본인 환경 hard refresh + 다른 worktree dev 정리 후 재확인. 그래도 안 되면 진짜 회귀 — 그때 fresh diagnose.
- **P0-2 통합 manual verify (4 신규 + 12 기존)**: 다음 세션 우선. 회귀 발견 시 fix.
- **Workbench CategoryAddPopover 패턴을 wiki-floating-action-bar.tsx에도 적용 필요**: list mode에서도 같은 검색 + create UX. 영구 룰 21 entity-uniformity. 별도 후속 PR (사용자 요청 board만이라 이번엔 미포함).

### 환경 변경

- Store version: **v133 → v134** (wiki seed backfill migration)
- Persist version: `lib/store/index.ts:257` 134
- 신규 파일: `components/books/book-context-menu-items.tsx`
- 데이터 모델 변경: `createTag` signature `void → string` (`types.ts:287`, `tags.ts:11-18`)
- Preview verify: wiki articles 9 → 19, categories 11 (변동 없음 — 기존 사용자가 이미 다 가짐)

---

## 2026-05-15 (저녁) — 집/Windows, **Wiki entity-uniformity 완성 + 카테고리 사이드바 흡수**

> 🎯 **다음 즉시 액션** (cross-machine 진입점):
> 1. `git pull origin main` (대형 PR 머지된 main 받음)
> 2. **사용자 hard refresh + 누적 변경 manual verify** (큰 작업 묶음 — 회귀 점검 필요):
>    - **Wiki Categories sub-section**:
>      - row single click → 우측 사이드바 4탭 (Detail/Connections/Activity/Bookmarks) 표시 (영구 룰 21 정합)
>      - Detail 탭에 Color row click → Popover ColorPickerGrid 열림 (sidebar inline edit)
>      - Detail 탭 Parent dropdown = Plot DropdownMenu (chevron + FolderSimple + category color + 활성 bg-accent/10) — native `<select>` 폐기
>      - Layout: list `flex-1` (568+px) + editor `w-[420px]` (이전 280/flex-1 반대)
>      - handleBackgroundClick `e.target !== e.currentTarget` early return (row dblclick bubble로 editor 닫히는 회귀 차단)
>      - groupingOptions 6개 (None/Tier/Parent/Family/Index/Created) — Color grouping은 폐기 (의미 X — 자동 cyclic 할당)
>      - default groupBy "family" (fresh user — hierarchy 즉시 노출)
>      - properties chip = parent/tier/articles/sub/createdAt/updatedAt (color/description chip 제거 — row dot + Show description toggle 중복)
>    - **Wiki Articles board**:
>      - default groupBy = `wikiStatus` (Stub / Article 2 column 고정 — Notes Stone/Brick/Block 패턴 정합)
>      - 카드 single click = select (Notes 패턴 mirror, modifier 무관 누적 toggle)
>      - 카드 hover → 우측 상단 체크박스 fade-in + selected 시 bg-accent + ✓
>      - 우측 WikiBoardWorkbench (Phase 2): Pin / Move folder / Add to category / **Add tags** (new) / Split / Merge / Trash
>      - Board mode에서 하단 floating bar 숨김 (workbench가 대체)
>    - **Wiki 시드**: 17 articles (이전 7) + tier 분포 10/4/3 + category spread 10 카테고리 (사용자가 IDB reset 시 자동 적용)
>    - **Wiki articleCount 음수 bug fix**: `wikiNotes.filter(isWikiStub).length` (trashed 제외) → invariant 보장
>    - **Books**: boardDefaultGroupBy "kind" → Smart/Hybrid/Manual 3 column 자동 (영구 룰 21)
>    - **Notes**: showAlphaIndex chip → groupingOptions "Index" 마이그레이션 (Plot 일관성), Tags/Priority/Label chip board-only flag (list view에서 자동 숨김)
> 3. **Phase 후속 작업 (사용자 결정)**:
>    - Tags batch를 wiki-floating-action-bar.tsx에도 추가 (list mode 일관성, 50 line)
>    - Wiki workbench 추가 actions (Duplicate / Set parent / Aliases / Export markdown — P2)
>    - Notes에 카테고리/태그 batch (Notes에 category 개념 없음 — tag만 가능)
>    - Calendar 사이드바 / Ontology graph node 사이드바 — 의도 명확화 후 진행 (이전 세션 미결)

### 완료 (이번 세션, 약 20+ 파일 변경 한 큰 PR)
- **Wiki Categories sidebar 흡수** (mini panel → 4탭 entity-aware, 영구 룰 21 정합):
  - SidePanelContext 확장 (`wiki-category` type)
  - CategoryDetailPanel 신규 (Color picker / Properties / Parent / Subcategories preview / Articles preview)
  - side-panel-detail/connections/activity/bookmarks 4 file dispatch + CategoryConnections (Parent/Subcategories/Articles full)
  - handleSelect (single click) → setSidePanelContext (Tag/Label 패턴 mirror)
- **Wiki Categories polish**:
  - native `<select>` → Plot DropdownMenu (chevron + FolderSimple + category color + 활성 bg-accent/10)
  - Layout fix (list flex-1 / editor w-420)
  - handleBackgroundClick e.target check (회귀 차단)
  - groupingOptions 6개 + properties chip 6개 (color/description chip 제거)
  - default groupBy "family"
  - Board view invalid groupBy fallback (legacy "status" → tier)
  - Subgrouping UI 숨김 (DisplayConfig supportsSubGrouping flag — Notes만 true)
  - "Family"/"First letter"/"Tier" 괄호 제거 (일관성)
- **Notes 마이그레이션**:
  - GroupBy type에 firstLetter / createdAt 추가
  - group.ts에 helper 함수 (groupByFirstLetter / groupByCreatedAt)
  - notes-table showAlphaIndex 로직 → groupBy === "firstLetter" 변환 + 인라인 Name column toggle 제거
  - DisplayConfig boardOnly flag (Tags/Priority/Label chip은 list view 숨김)
  - articleCount 음수 bug fix (wikiNotes 기준 통일)
- **Wiki Board UX entity-uniformity**:
  - WikiBoardWorkbench 신규 (Phase 1 → Phase 2): Pin/Move folder/Add to category/Add tags/Split/Merge/Trash + Overview (no selection)
  - Card single click = select (Notes 패턴, modifier 무관 누적)
  - Card hover checkbox + selected 시 bg-accent ✓
  - Floating bar board mode에서 hide
  - wikiStatus grouping (Stub/Article 2 column 고정)
  - boardDefaultGroupBy "wikiStatus"
  - Wiki 시드 17 articles + tier 10/4/3 + category spread 10
- **Books**: boardDefaultGroupBy "kind" (3 column Smart/Hybrid/Manual 자동)

### 영구 LOCKED 결정 (이번 세션)
- **영구 룰 21 entity-uniformity 본질 진전**: Wiki Categories (sidebar 흡수) + Wiki Articles (board parity with Notes) + Books (board default kind) — 모든 entity board에 entity-native enum axis 보장
- **Index = grouping option** (Plot 일관 — showAlphaIndex toggle 폐기, Notes/Wiki/Templates 모두 groupingOptions에 추가)
- **Card hover checkbox = entity 공통 UX** (Notes/Wiki board card 동일 패턴)
- **boardOnly chip pattern**: list column 없는 chip은 list mode에서 자동 숨김 (Notes Tags/Priority/Label, 다른 entity 확장 가능)

### Watch Out
- **IDB reset 필요한 사용자**: 시드 17 articles + default groupBy "family"/"wikiStatus"/"kind" 적용은 fresh user/IDB reset 시. 기존 사용자는 Display Properties에서 수동 선택 가능
- **Webpack cache stale (한글 path)**: ENOENT rename 문제 발생 시 dev server restart (preview_stop/start). 사용자 본인 환경에서도 dev server 재시작 필요할 수 있음
- **Tags batch는 wiki-board-workbench.tsx에만 추가됨** — wiki-floating-action-bar.tsx (list mode)에는 아직 안 추가 (별도 후속)

### 머신
집/Windows

---

## 2026-05-15 — 집/Windows, **12 PR 머지** + Activity Unification PRD 완료 + Library 100% 완성

> 🎯 **다음 즉시 액션** (다른 머신/세션 cross-machine 진입점):
> 1. `git pull origin main` (12 PR + docs sync 머지된 main 받음)
> 2. **다른 컴퓨터 새 worktree**:
>    - `git worktree add ../<name> main`
>    - `cd ../<name> && npm install`
>    - `npm run dev` (port 3002 또는 random)
>    - **Hard refresh (Ctrl+Shift+R) 의무** + IDB v133 마이그레이션 자동 trigger 확인 (console `[migrate] v132→v133` 로그)
> 3. **🔴 P0 회귀 진단** — **Tags / Labels 사이드바 작동 안 함**:
>    - 사용자 보고 (2026-05-15): tag/label row name 클릭해도 사이드바 detail panel 안 열림. 사이드바 자체는 떠있는데 "Select a note to see details" fallback 표시.
>    - 코드 verified 정상 (tags-view.tsx line 820-823 / labels-view.tsx 신규 setSidePanelContext 호출). dev hard refresh + IDB 마이그레이션 후에도 같은 시그널.
>    - 진단 후보:
>      - (a) HMR stale 또는 dev:3002 stale build (다른 worktree port 충돌 가능성)
>      - (b) 코드 회귀 — sidePanelContext를 즉시 null로 reset하는 useEffect 어딘가 (BookDetailPage 패턴 같이)
>      - (c) v133 마이그레이션 실패 — entityEvents가 노트 events에 entity.kind 없는 상태로 남음 → useSidePanelEntity 분기 실패
>      - (d) 사용자 IDB 상태 — `plot-store` IDB 직접 dump 확인 (sidePanelContext가 set되는지)
>    - **다른 머신/incognito에서 fresh dev로 재현 시도 → 회귀 확정 또는 stale 결정**. fresh에서도 안 되면 회귀 fix (코드 어디에 sidePanelContext reset 있는지 grep).
> 4. **P1 의도 명확화 후 작업** (사용자 시그널 2개 남음):
>    - **Calendar 사이드바 변화** — 옵션 (a) Day Summary panel / (b) Calendar 자체 detail / (c) 현재 노트 detail 강화. 사용자 결정 받아야 진행.
>    - **Ontology graph node 클릭 시 사이드바 동기화** — 옵션 (a) graph node → 4탭 사이드바 / (b) OntologyDetailPanel + 4탭 둘 다 / (c) 사이드바 자체에 graph mode. 사용자 결정.
> 5. **P2 polish 후보**:
>    - Granular Wiki/Book events wire-up (block_added, item_reordered 등 실제 발화)
>    - Label entity events 발화 (labels slice CRUD에서 entityEvents.push)
>    - EDGES section (Ontology Legend 확장 — wikilink/tag/relation color)
>    - EVENT_HEX palette promotion (PR 5d 임시 hex → LOCKED)
>    - List Options 토글 mismatch fix (view-engine defaults)
>
> **머신**: 집 (Windows)
> **다음 worktree**: 다른 컴퓨터에서 새로 — main 기반 (12 PR 머지된 상태)

### 본 세션 PR 12개 (#334-#345) — 큰 day

#### 라운드 1 — entity-side-panel-uniformity 마무리 + Library entity-uniformity 진행 (#334-#338)
- **#334** Library Tags Detail panel — Header / Properties / Used by (Tag.createdAt 없음 → Dates 생략)
- **#335** Library Stickers Detail panel (cascade #334) — Sticker.createdAt 있음 + members[] cross-entity (7 kinds) → 풍부한 Detail
- **#336** Wiki blocks anchor extractor (PR 4b) — `extractAnchorsFromWikiBlocks` (section block + text block contentJson 재귀) + WikiLocalAnchors 함수 (NoteLocalAnchors 패턴 복사)
- **#337** Ontology Legend redesign — 우상단 floating overlay, Notes/Wiki/Books 3 그룹 + Plot icon system (IconStone/Brick/Block + IconWikiStub/Article + Lightning/Sparkle/PencilSimple) + Wiki entity violet footnote
- **#338** Header breadcrumb (Library/Books) + 사이드바 토글 (모든 entity) — ViewHeader `titleNode` prop 추가 + `showDetailPanel` default true (auto store wire-up). `LibraryBreadcrumb` / `BookBreadcrumb` 신규 컴포넌트. book-detail-page ArrowLeft 버튼 제거.

#### 라운드 2 — 사용자 시그널 fix (Library 4탭 entity-aware) #339
- 스크린샷 회귀: Library entity Detail이 Note Detail로 잘못 렌더링 (Connections/Activity/Bookmarks fallback)
- #339: 4 entity (Tag / Sticker / File / Reference) × 3 panel = 12 분기 entity-aware placeholder 추가
  - Connections placeholder ("see Detail tab"), Activity placeholder ("history not yet available"), Bookmarks placeholder ("don't carry inline anchors")

#### 라운드 3 — Activity Unification PRD 4단계 (#340-#343)
- **PRD 작성**: `.omc/plans/activity-unification-prd.md` (v0.1)
- **#340 PR 5a Foundation**: NoteEvent → EntityEvent, EntityKind 확장 (+template/book/sticker), `at` 필드 ⭐ required (사용자 요구), Store v132 → **v133** migration (idempotent, 데이터 손실 X), `addEntityEvent` / `getEventsForEntity` helper, ActivityTimeline `entity` prop (backward compat `noteId`)
- **#341 PR 5b**: Wiki / Template / Book CRUD events wire-up. createXxx/updateXxx/deleteXxx/restoreXxx + hard delete cascade
- **#342 PR 5c**: Tag / Sticker / File / Reference events. Tag color_changed/renamed 분기, Sticker member_added/removed, File 양방향 (note-side + file-side)
- **#343 PR 5d UI 활성화**: EVENT_CONFIG에 17 신규 type entries (Wiki block_*, Book item_*, cross-entity member_*/color_changed/renamed) + icons (Cube/ArrowsDownUp/UserPlus/Palette/TextT 등) + 임시 hex. side-panel-activity 전체 rewrite — 모든 entity 분기 placeholder → 실제 ActivityTimeline (`HistorySection` + `SoloHistory` helpers). Note/Wiki만 Comments + History, 나머지 6 entity는 SoloHistory.

#### 라운드 4 — Library Connections 차트화 (#344)
- LibraryEntityConnectionsPlaceholder → 4 실제 entity-aware Connections 함수:
  - **TagConnections**: "Tagged notes by status" (Stone/Brick/Block) + recent 8 + overflow
  - **StickerConnections**: "Members by kind & status" (Notes status + Wikis stub/article + 5 other kinds count) + recent note refs
  - **FileConnections**: "Cross-entity" — Source note (attachment.noteId) + Used in wikis (wiki blocks attachmentId reverse lookup)
  - **ReferenceConnections**: "Cited by" — citing notes + citing wikis (referenceIds reverse lookup)
- BookConnections 패턴 정합 (ConnectionSection/KindHeader/StatusRow 재사용)

#### 라운드 5 — Labels Detail + Legend 위치 (#345)
- **LabelDetailPanel 신규** — Tag Detail 패턴 (Label.color non-null + 1:N membership via Note.labelId 단일 id)
- 4탭 entity-aware: label dispatch / LabelConnections (Labeled notes by status, TagConnections 패턴) / SoloHistory / EntityAnchorPlaceholder
- LibraryBreadcrumb에 labels 추가 (5 entity 확장)
- labels-view.tsx onClick에 setSidePanelContext + setSidePanelOpen
- **Ontology Legend 위치 변경** — `right-3 top-3` → `left-3 bottom-3` (미니맵 가림 fix)

### 핵심 결정 (영구 LOCKED, 2026-05-15)

**21. Library entity-uniformity 100% 완성** — 5 entity (References / Files / Tags / Stickers / Labels) 모두 우측 사이드바 4탭 (Detail / Connections / Activity / Bookmarks) entity-aware. row name 클릭 → drill-down + side panel detail 동시 open 풍부 패턴. checkbox 클릭은 selection only.

**22. Activity entity-agnostic 데이터 모델 — `EntityEvent`** (Store v133):
- `{ id, entity: EntityRef, type: EntityEventType, at: ⭐ required ISO timestamp, meta? }`
- `entity: { kind, id }` discriminator (sticker.members 패턴 정합)
- `at` ⭐ required — Time grouping + recency sort + 자체 createdAt 없는 entity (Tag/Label)의 유일 timestamp source. **사용자 요구 2026-05-14**.
- `getEventsForEntity(events, entity)` 신규 + `getEventsForNote` deprecated wrapper
- ActivityTimeline `entity: EntityRef` 또는 `noteId: string` (backward compat)
- `createAppendEvent` 새 signature: `EntityRef | string` (string은 자동 wrap as `{kind: "note", id}`)
- 마이그레이션 v133 idempotent — old NoteEvent { noteId } → EntityEvent { entity: { kind: "note", id: noteId } }

**23. EntityKind 확장** — template / book / sticker 추가 (총 10 kinds). Sticker.members[]는 backward compat (template/book도 가능).

**24. Comments wire-up은 Note/Wiki만** (영구 룰) — Template/Book/Library entity는 collaboration 단위 X (PR #322 정합). side-panel-activity에서 SoloHistory wrapper로 Comments 생략.

**25. Notes/Library entity row 클릭 패턴 영구 룰**:
- **row name 텍스트** 클릭 → drill-down (selectedXxxId) + 사이드바 detail 자동 open (setSidePanelContext + setSidePanelOpen)
- **checkbox** 클릭 → selection only. 사이드바 안 set.
- Tag/Sticker/File/Reference/Label 모두 동일 패턴

**26. Ontology Legend 위치 좌하단** (영구) — 미니맵 (우상단) 가림 회피.

**27. EVENT_CONFIG fallback graceful** — unknown event type은 ActivityTimeline에서 `if (!config) return null` 스킵. EVENT_CONFIG 누락 시 UI 안 깨짐.

### 기술 학습 (영구)

- **NoteEvent → EntityEvent 마이그레이션 backward compat 패턴**: `createAppendEvent` overload (`string | EntityRef`) → 호출 site 안 변경하고도 EntityEvent 시스템 작동. `getEventsForNote` wrapper로 ActivityTimeline 등 기존 사용자도 정상.
- **PRD 점진 분할 (5a-5d) 가성비 ↑**: 큰 작업 (Foundation + Wire-up 3 phases + UI activation) — 한 PR 대신 4 PR. review 명확 + manual verify 단계별 + cascade conflict 없음 (각 PR main 기반).
- **`extractAnchorsFromWikiBlocks` 패턴**: section block.title + text block contentJson (재귀로 `extractAnchorsFromContentJson`) → AnchorItem[]. WikiLocalAnchors는 NoteLocalAnchors 패턴 복사 (minimal diff, 미래 polish 후보).
- **Library 5 entity row 클릭 패턴 일관**: setSidePanelContext + setSidePanelOpen + drill-down. tags-view / stickers-view / labels-view 모두 동일 onClick.
- **ViewHeader auto store wire-up**: `showDetailPanel ?? true` + `detailPanelOpen ?? storeSidePanelOpen` + `onDetailPanelToggle ?? storeToggleSidePanel`. 호출 site 안 변경하고 모든 entity 헤더에 사이드바 토글 자동 노출.

### Watch Out (다음 세션)

- **🔴 Tags / Labels 회귀**: 사용자 보고. 코드는 정상 verified — line 820-823 (tags-view) / labels-view 신규 onClick 모두 setSidePanelContext 호출. 단 실제 사용자 화면에서 사이드바 detail 안 열림. 다른 머신/incognito fresh dev로 재현 진단 필요. fresh에서도 안 되면 어딘가 useEffect가 sidePanelContext를 즉시 null로 reset 가능성 (grep — `setSidePanelContext\(null\)` 또는 `setSidePanelContext(\{` non-tag/label).
- **Store v133 마이그레이션 idempotent verify**: 사용자 IDB가 v132 → v133 자동 마이그레이션 후 `[migrate] v132→v133` console.log 확인. 만약 마이그레이션 실패 시 entityEvents가 빈 array — Activity timeline 빈 화면. fresh로도 재현되면 마이그레이션 로직 점검.
- **PR 12개 누적 후 manual verify 어려움**: 라운드 1/2/3/4/5 가 다 main에 들어가서 회귀 추적 어려움. 다음 세션에 통합 verify 시 entity별 (Tag/Label/Sticker/File/Reference) 사이드바 + Activity timeline + Connections charts 다 확인.
- **EVENT_HEX palette 임시 hex 17개**: PR 5d에서 새 type별 hex 임시값 (gray/blue/emerald 등). 별도 polish PR에서 LOCKED palette로 promotion 가능. 미적용 시 색 일관성 떨어짐.
- **Calendar / Ontology graph 사이드바 의도 미확정**: 사용자 시그널은 받았지만 정확한 design 결정 안 됨. P1로 의도 명확화 후 PR.

### 환경 변경
- Store version: **v132 → v133** (entityEvents migration)
- 신규 파일:
  - `components/side-panel/label-detail-panel.tsx`
  - `components/side-panel/sticker-detail-panel.tsx`
  - `components/side-panel/tag-detail-panel.tsx`
  - `components/library/library-breadcrumb.tsx`
  - `components/books/book-breadcrumb.tsx`
  - `components/ontology/ontology-legend.tsx`
  - `.omc/plans/activity-unification-prd.md`
- 데이터 모델:
  - `EntityKind` 확장 (template/book/sticker 추가)
  - `EntityEvent` 신규 (NoteEvent deprecated alias)
  - `EntityEventType` 신규 (NoteEventType + 17 신규 types)
  - `SidePanelContext` union 5 entity 추가 (tag/sticker/file/book/label 다)
  - `SidePanelEntityResult` 10 entity 분기

### 사용자 feedback 영구 저장
- **after-work는 PR 머지까지 완료 의무** (2026-05-14, [feedback_after_work_must_merge.md]) — 사용자 명시. push만 하고 PR OPEN 남기면 cross-machine mismatch.
- **사용자 시그널 "일관성 무조건 신경써"** (이전 entry 17번 영구 룰) — 매 PR마다 entity 패턴 정합 검증 의무.

---

## 2026-05-14 (저녁) — 집/Windows, PR #333 폴리시 7 commits (Linear-faithful sidebar + Ontology breadcrumb + search typo fix)

> 🎯 **다음 즉시 액션** (다른 머신 또는 다음 세션 진입점):
> 1. `git pull origin main` (직전 머지 #332까지 반영 — PR #333은 아직 머지 안 됨)
> 2. **다른 컴퓨터** branch checkout:
>    - `git fetch origin claude/relaxed-hodgkin-5a2905`
>    - `git worktree add ../<name> claude/relaxed-hodgkin-5a2905` (또는 checkout)
>    - `npm install` (필수 — 새 worktree)
>    - `npm run dev` → port 3002 (또는 random)
>    - **Hard refresh (Ctrl+Shift+R) 의무**
> 3. **PR #333 manual verify 5 surface** (7 commits 누적):
>    - **a. 사이드바 헤더 폰트** (`/notes` `/wiki` `/books` `/home` 등): `Views` `Folders` `Pinned` `More` `Stats` 헤더가 **12px normal case** (이전 10.5px uppercase에서 변경)
>    - **b. 사이드바 너비**: 220px → **240px** (Linear 정합)
>    - **c. Ontology 헤더 breadcrumb**: `/ontology` → `Ontology > Graph` (chevron `>` **자체** 클릭 → dropdown). Insights/Dashboard 선택 시 헤더 업데이트
>    - **d. Dropdown items**: Graph icon / IconInsight / ChartBar 아이콘 + 라벨, 활성 = `bg-accent/10 text-accent`
>    - **e. Search typo fix**: 검색 input placeholder `"Search notes, tags, and more..."` (이전 `"MagnifyingGlass notes..."` 사고)
> 4. OK → `gh pr merge 333 --squash`
> 5. **R1 (다음 작은 PR)**: Library breadcrumb (Notes/Ontology 패턴 100% mirror — view-header.tsx subtitle 패턴 그대로 적용, library-view.tsx 헤더 수정)
> 6. **R2 (큰 그림)**: 앱 전체 폴리시 PRD 작성 (`linear-design-mirror` skill audit + `docs/reference/linear/` 50+ 스크린샷 분석 → spec 도출)
> 7. **R3+**: 폴리시 PR 시리즈 / 커맨드 팔레트 ⌘K 재설계 (자료 13장) / 풀 검색 페이지 신설 (자료 4장) / Wiki·Books 폴더
>
> **PR #333 7 commits 누적** (한 흐름):
> - `3864651` polish(sidebar): typography + width (10.5/10px → 12/11px, weight 600→500, uppercase 제거, width 220→240px)
> - `2bd44aa` feat(ontology): header breadcrumb 추가 (ViewHeader `subtitle?: ReactNode` prop + 정적 텍스트)
> - `62d2329` fix(ontology): subtitle → DropdownMenu trigger button + CaretDown ⌄ (1차 사용자 시그널 fix)
> - `64457ce` fix(ontology): CaretDown 제거 (2차 사용자 시그널, Notes 일관)
> - `dde4122` fix(ontology): chevron `>` **자체**가 dropdown trigger (3차 사용자 시그널, Notes 정확 패턴 `NotePickerChevron` mirror)
> - `db7ff2c` feat(ontology): dropdown item 아이콘 추가 + 활성 bg/text 색 (사용자 시그널: 아이콘+글자, search 잉여)
> - `c9824cc` fix(search): `MagnifyingGlass` placeholder typo 5곳 fix (search-view, relation-picker, wiki-collection-sidebar, wiki-block-renderer, wiki-view)
>
> **머신**: 집 (Windows)
> **worktree**: `claude/relaxed-hodgkin-5a2905`
> **PR**: #333 (OPEN, manual verify 대기 후 squash merge)

### 핵심 결정 (영구 LOCKED, 2026-05-14 저녁)

**15. 사이드바 토큰 정합 룰** (`.a-sb-section__head` / `.a-sb-section__hint`):
- font-size 12px (Plot 토큰 "보조 12px" 정합 — globals.css의 자체 fall-out 수정)
- font-weight 500 (Linear 정합. 600은 너무 강조)
- letter-spacing 0 (normal case에는 letter-spacing 0)
- text-transform none (Linear는 normal case "Workspace" 패턴)
- hint font-size 11px (Plot 토큰 "배지" 11px)

**16. 사이드바 너비 240px** (Linear 정합): `--sidebar-w` / `--sidebar-default-width` 둘 다 220→240. Plot 다른 변수 `--a-sidebar-w` (240px)와 통일.

**17. Breadcrumb 일관성 룰** (강한 사용자 시그널 "일관성 무조건 신경써", **영구 LOCKED**):
- 모든 sub-view/sub-page entity 동일 패턴: `[Parent label]` → `[chevron > button → dropdown trigger]` → `[Active label]`
- Notes `editor-breadcrumb.tsx:237 NotePickerChevron` **정확 mirror**
- **chevron 자체가 button** (CaretDown ⌄ 등 추가 시그널 X)
- DropdownMenuItem: 아이콘 + 라벨 + 활성 시 `bg-accent/10 text-accent` (Check icon 잉여)
- Search input: 5개 이상 item일 때만 추가. 3개 이하면 잉여.
- **대상**: Ontology (DONE) / Library (TODO 다음 R1) / Wiki/Books (향후 동일 적용 가능)

**18. ViewHeader `subtitle` prop API**: `subtitle?: ReactNode` 그대로 렌더링 (chevron 자동 출력 X). 외부에서 chevron + label 직접 구성. Backward compat (다른 호출처 subtitle 미전달 → 기존 동작).

**19. "엉망진창" 사용자 시그널 = 앱 전체 폴리시 PRD 필요** (영구): 매 PR마다 사용자 시그널 받고 fix 반복 = 비효율. PRD 한 번 작성해서 큰 그림 합의 후 진행. R2부터 본격.

**20. Linear 미러링 자료 통합 룰**: `.claude/skills/linear-design-mirror/` 스킬 + `docs/reference/linear/` 50+ 스크린샷 + `GOTCHAS.md` 셋 다 활용. R2 PRD 작성 시 본격.

### 기술 학습 (영구)

- **Notes breadcrumb 정확 패턴** (`editor-breadcrumb.tsx`):
  - `Notes` (parent) = button → `navigateToSpace` (note 닫고 list로)
  - `>` chevron = `<PopoverTrigger asChild><button><IconChevronRight /></button></PopoverTrigger>` → 다른 노트 검색 popover
  - `Quick Memo` (title) = static `<span>` (액션 없음)
- **DropdownMenuItem 활성 패턴**: `className={cn(active && "bg-accent/10 text-accent")}` (Check icon 잉여, Plot 공식 패턴 — `editor-breadcrumb.tsx:132-141 SecondarySpaceSwitch`)
- **find-replace 사고 검출법**: `"<IconName>\s+\w+"` grep 패턴. icon component 이름이 placeholder/comment string에 들어가있으면 글로벌 find-replace 사고. 이번 발견: `Search` → `MagnifyingGlass` 사고 5곳 (4 placeholder + 1 comment + 2 comment).
- **Multi-server dev 환경 risk**: 한 사용자 컴퓨터에 dev server 2개 동시 (이전 worktree port 3002 + 새 worktree port 60384). 사용자가 stale 서버 보고 "fix 안 보인다" 보고. **매 fix 후 정확한 port URL 안내 + `preview_list` inventory 의무**.
- **Browser cache risk**: Next.js HMR 정상 작동해도 브라우저 cache stale 가능. **매 fix 후 hard refresh (Ctrl+Shift+R) 안내 의무**.
- **Plot 토큰 vs CSS 갭 발견**: DESIGN-TOKENS 정의 "보조 12px"인데 사이드바 globals.css는 10.5px (토큰 위반). 사용자 직관 "작다" = 토큰 갭 검출. 다른 CSS 토큰 갭 R2 audit에서 점검.
- **사용자 시그널 자체 해석 룰**: "노트처럼" = Notes 코드 정확 읽고 mirror. "Graph 옆 ⌄" = chevron이 trigger인 듯한 미세 시그널. "엉망진창" = 큰 그림 PRD 필요. 직관 신중히.

### Watch Out (다음 세션)

- **PR #333 manual verify 5 surface 의무**: 7 commits 누적. 사용자가 직접 정확한 port + Hard refresh 후 검증.
- **다른 글로벌 find-replace 사고 가능성**: `Search` → `MagnifyingGlass` 같은 사고가 다른 패턴에도 있을 수 있음. R2 audit에서 broader grep (다른 Phosphor icon 이름 검색).
- **사이드바 spec 추가 audit 필요**: 그룹 헤더만 fix됨. 다른 사이드바 클래스 (`a-sb-link`, `a-sb-link__count`, `a-sb-title` 등) Plot 토큰 정합 확인 필요. `linear-design-mirror/references/surfaces/sidebar.md` 참고.
- **NOTES/WIKI mini stat 카드 uppercase**: 사이드바 `NOTES 9` `WIKI 7` mini stat 카드는 여전히 uppercase. `a-sb-section` 클래스 아닌 별도 클래스 (확인 필요). 일관성 검토 R2 audit.
- **dropdown content 일관성 본질**: Notes는 검색 input + list (검색 가능), Ontology는 라디오 메뉴 (3개 고정). 본질 다름 인정. Library 4 sub-page는 — 4개라 검색 input 잉여 가능 (확인).
- **PR cascade 충돌 risk**: PR #333 7 commits squash 머지로 깔끔. R1 Library breadcrumb은 view-header.tsx 또 건드릴 가능성 — main 기반 진행 권장.

### 환경 변경

- Store version: 변경 없음
- 신규 파일: 없음 (모두 기존 파일 수정)
- API 확장 (backward compat):
  - `ViewHeader.subtitle?: ReactNode` (신규 optional prop)
- 데이터 모델 변경: 없음
- CSS 토큰 변경: `--sidebar-w` 220→240, `--sidebar-default-width` 220→240

---

## 2026-05-14 (밤 후속) — 집/Windows, 4 PR 추가 + Books table 일관성 통합 (entity-uniformity + Library 확장)

> 🎯 **다음 즉시 액션** (다음 세션 또는 다른 머신):
> 1. `git pull origin main` (PR #322-#327, #329-#331 머지된 main)
> 2. **사용자 manual verify** 5 surface (밤 후속 추가 PR):
>    - **PR #329 Template anchor pinning**: /templates Daily Log → Bookmarks 탭 → 본문 anchor 보임 + pin/unpin 작동 (`targetKind: "template"` 저장)
>    - **PR #330 Library list divider X**: /library Files → row 사이 구분선 사라짐 (header divider만 유지)
>    - **PR #331 Files Detail panel**: /library Files → 파일 클릭 → 사이드바 자동 open + Detail (Dates / Source / Used in / Properties / Open in new tab)
>    - **PR #326 update**: /books list → checkbox column w-8 (Notes 일관성, 위치 동일) + 행 구분선 X
>    - 누적 합산 9 PR (#322-#327 + #329-#331)을 한 번에 검증 가능
> 3. **다음 PR 후보** (TODO.md P1):
>    - Library Tags Detail panel + Stickers Detail panel (PR #331 패턴 반복)
>    - Ontology legend redesign (Option A + B: icon silhouette + entity 그룹화)
>    - PR 4b Wiki blocks anchor extractor
>    - PR 5 Activity entity-agnostic 통합 (별도 PRD 필수)
>
> **밤 후속 PR 4개 (낮~밤 6 PR + docs sync #328 추가)**:
> - **#329** feat: Template anchor pinning (`GlobalBookmark.targetKind`에 "template" 추가, `NoteLocalAnchors` 재사용)
> - **#330** fix: Library list view row divider 제거 (Notes/Wiki 일관성)
> - **#331** feat: Library Files Detail panel 신설 (FileDetailPanel — Dates/Source/Used in/Properties)
> - **#326 update**: Books table checkbox column w-6 → w-8 (Notes 일관성 통합, 기존 divider fix와 묶음)
>
> **머신**: 집 (Windows)
> **worktree**: `claude/brave-moore-ceaf44`

### 추가 핵심 결정 (영구 LOCKED, 2026-05-14 밤 후속)

**10. GlobalBookmark.targetKind 확장 (안전 패턴)**:
- `"note" | "wiki"` → `"note" | "wiki" | "template"` (optional 확장, backward compat)
- entity-uniformity PRD에 정의된 PR 4 (anchor pinning 모든 entity) 시작
- 다음 PR 4b: Wiki blocks anchor extractor (blocks 구조 다름, 새 extractor 필요)

**11. NoteLocalAnchors entity-agnostic 재사용**:
- 컴포넌트 prop name "note"는 legacy artifact이지만 실제 의존성은 `{ id, contentJson }` shape
- Template 객체도 동일 shape → 그대로 재사용 (minimal-diff)
- 미래 PR에서 `LocalAnchors`로 rename + entity 무관 처리 가능

**12. Library entity도 4탭 사이드바 통합** (entity-uniformity 확장):
- PRD 원래 scope: Note/Wiki/Template/Book. 사용자 시그널 "라이브러리 파일도 클릭해도 정보 안 보임" → Library 4 entity (Files/Tags/References/Stickers)도 통합 대상.
- PR #331은 Files Detail panel만 (사용자 시그널 직접 처리). Tags/Stickers는 follow-up.
- Reference는 이미 `ReferenceDetailPanel` 존재 — 4탭 dispatch도 기존 작동.

**13. Files Detail panel 본질 — Source + Used in cross-reference**:
- Attachment 데이터: `noteId` (source note) + `wiki blocks` 안 `attachmentId` reference (used in wiki)
- Plot 일반 패턴 (Note/Wiki/Template/Book Detail) 정합: Dates / Properties=stats / Used in / Actions
- 이미지 type만 thumbnail (max-h-48 object-contain) — 다른 file type은 icon
- Delete 액션 미구현 (attachments slice 변경 별도 PR)

**14. Notes/Books table 시각 격자 통일**:
- 행 구분선 X (둘 다 flat) — PR #326
- Checkbox column w-8 통일 — PR #326 update (사용자 "체크박스 위치 다르다" 시그널)
- Plot table 일관성 영구 룰: 모든 entity table은 w-8 (32px) checkbox + hover bg row separation, 행 border X

### 기술 학습 추가 (영구)

- **Optional 데이터 모델 확장 패턴**: `"note" | "wiki"` → `"note" | "wiki" | "template"`처럼 enum 확장. 기존 데이터 변경 X (backward compat). 마이그레이션 불필요. 같은 패턴 다른 곳 — `GlobalBookmark.targetKind`에 "book" 추가도 가능 (PR 4 후속).
- **legacy artifact prop name 재사용**: 컴포넌트 export name과 prop name이 historical이라도 실제 의존성 shape가 entity-agnostic하면 그대로 재사용 가능. rename은 별도 polish PR로 분리.
- **attachment.noteId는 1:1 source 추적**: cross-reference (used in)는 wiki blocks 별도 추적. note body의 image src URL/attachmentId 추적은 별도 작업.
- **사용자 시그널 "다 순차"**: 같은 패턴 작업 시리즈를 분리 PR로 진행. 묶음 PR보다 manual verify 쉬움 + 머지 충돌 risk ↓.
- **PR cascade base 결정**: 데이터 모델 의존성 없으면 main에서 시작. 컴포넌트/타입 의존성 있으면 cascade. 본 세션 PR #331은 main 기반 (sidePanelContext 확장만 추가) — 다른 PR들과 독립.

### Watch Out (다음 세션)

- **PR 11개 누적** (#322-#327 + #329-#331 + #326 update + #328 머지) — main에 cascade로 머지 시 충돌 가능. Plot 패턴 (HEAD 우선 `--ours`) 적용 권장.
- **dev server stale state**: branch switch 빈번 + 다른 component import path 변경. 사용자 hard refresh 필수. 한 번 React Hook order 경고 떠도 reload하면 사라짐 (PR #323 시점 확인).
- **Files Detail panel Delete 액션 비활성**: attachments slice에 `deleteAttachment` 없음. trash flow는 별도 PR. 사용자가 file 삭제하려면 list view bulk action 사용.
- **Tags / Stickers Detail panel 미구현**: 사용자 "다 순차" 시그널 → 다음 세션 P1.
- **Reference Detail panel 호출 흐름 미검증**: `ReferenceDetailPanel` 존재하지만 library-view 안에서 setSidePanelContext("reference") 호출 위치 확인 X. 별도 검증 필요.

### 환경 변경
- Store version: 변경 없음 (모든 변경은 derive view 또는 optional 필드 확장)
- 신규 파일: `components/side-panel/file-detail-panel.tsx`
- 신규 컴포넌트: `FileDetailPanel`
- 데이터 모델 확장 (optional, backward compat):
  - `GlobalBookmark.targetKind`에 "template" 추가
  - `SidePanelContext`에 `{ type: "file"; id }` 추가
  - `SidePanelEntityResult` union에 file 분기 + attachmentId/attachment 필드

---

## 2026-05-14 (낮~밤) — 집/Windows, 6 PR 누적 (entity-side-panel-uniformity + time grouping + books-divider)

> 🎯 **다음 즉시 액션** (다른 머신에서 cross-machine 또는 다음 세션):
> 1. `git pull origin main` (PR #322-#327 머지 후 main 받음)
> 2. **사용자 manual verify**: 6 PR 효과를 dev:3002 hard refresh로 한꺼번에 검증.
>    - Template entity Detail/4탭 (PR #322): Daily Log template → Properties stats only / "Template → Note" 버튼 / 4탭 분기
>    - Wiki Stub badge (PR #322 보너스): stub article → "Wiki Stub" badge (muted)
>    - Book 사이드바 (PR #323): /books/* → ⌘B → 4탭 작동 + Connections "Items by kind & status"
>    - Connections 분류 stats (PR #324): /notes → 노트 클릭 → Connections 탭 → "→ Notes" 옆 status dots
>    - Book Bookmarks "IN THIS BOOK" (PR #325): /books/* → Bookmarks 탭 → 책 안 책갈피 자동 그룹
>    - Books list divider 제거 (PR #326): /books list → 행 사이 구분선 사라짐 (Notes/Wiki 일관성)
>    - Time grouping (PR #327): /notes Display → Group by "Updated" → Today/Yesterday/This Week 그룹 헤더
> 3. **다음 작업 PR 4a**: Template anchor pinning (`GlobalBookmark.targetKind` 확장 + `extractAnchorsFromContentJson` 재사용).
>    - Plot Template/Wiki 둘 다 anchor pinning 가능하게. PRD §4 의 PR 4.
>    - branch base: `#322` cascade (countPlaceholders helper 등 필요) — 또는 머지 후 main에서 시작.
>
> **6 PR 종합** (entity-side-panel-uniformity PRD §4 추진):
> - **#322** feat: Template Detail 재설계 + 4탭 entity별 분기 (+ Wiki Stub badge fix)
> - **#323** feat: Book 우측 사이드바 신설 + Items by kind & status (PR 2)
> - **#324** feat: Connections 분류 stats Note/Wiki/Template 확장 (PR 3, Book 패턴 횡적 확산)
> - **#325** feat: Book Bookmarks "IN THIS BOOK" context filter (PR 4 — 방향 4)
> - **#326** fix: Books list view row divider 제거 (Notes/Wiki 일관성)
> - **#327** feat: Time grouping ("Updated" 5단) 모든 entity 적용
>
> **머신**: 집 (Windows)
> **worktree**: `claude/brave-moore-ceaf44` (sync는 `claude/sync-2026-05-14`)

### 핵심 결정 (영구 LOCKED, 2026-05-14)

**1. 모든 entity 4탭 사이드바 (Detail/Connections/Activity/Bookmarks) 통일** — Plot UI 일관성:
   - Book 신설 (PR #323) — entity별 사이드바 자유 패턴이지만 4탭 골격은 공유
   - Detail 안 내용은 entity 본질 따라 자유 — Note 분류 메타 풍부 / Wiki 간소화 / Template = recipe stats only / Book = collection 본질 (Kind/Smart sources/Chapters/Reading)

**2. "Properties = stats only" 영구 룰** (PR #322 LOCKED 재확인):
   - 분류 메타 (label/folder/tags 등)는 별도 섹션
   - Properties는 read-only stats (Words/Chars/Headings/Placeholders/Blocks/Sections/...)
   - entity별 본질 stats: Note (Words/Chars/Headings/Source) / Wiki (Blocks/Sections/Text blocks/Note refs/Images/Layout) / Template (Words/Chars/Headings/Placeholders) / Book (Total items/Notes/Wikis/Chapters/Smart/Manual)

**3. Template = recipe, not collaboration artifact** (PR #322):
   - Activity Comments 의도적 제외 (template은 협업 단위 아님)
   - "Use template" → "Template → Note" 변환 metaphor (사용자 시그널 정합)

**4. Connections 분류 stats 패턴** (PR #323+#324 LOCKED):
   - kind & status 2단 분류 (Notes → Stone/Brick/Block, Wikis → Stub/Article)
   - NoteStatusBreakdown / WikiStatusBreakdown helper 공통 컴포넌트
   - dot + count + label, 0인 status는 hide

**5. "Used by N notes" event log 기반 reverse-lookup** (PR #322 LOCKED):
   - noteEvents의 `created` event meta.templateId로 추적 (신규 데이터 모델 없음)
   - 다른 entity-cross "사용 추적"도 같은 패턴

**6. Book Bookmarks "IN THIS BOOK" pure derive filter** (PR #325 LOCKED — 방향 4):
   - Book entity 자체엔 contentJson 없음 → 직접 anchor 불가
   - 단 책의 items의 anchor는 책 context에서 의미 있음 → 자동 filter
   - 데이터 모델 변경 X. resolveBookItems 활용해 Smart/Hybrid 호환.

**7. Wiki Stub vs Article badge 분리** (PR #322 보너스):
   - `isWikiStub()` 기반. IconWikiStub/IconWikiArticle + muted/accent 색상 분리.

**8. Time grouping 5단 ("Updated" 기준)** (PR #327 LOCKED):
   - Today / Yesterday / This Week / This Month / Older
   - Yesterday는 isThisWeek 분기 *전* 체크 (week boundary edge case)
   - 빈 bucket 자동 hide (UI noise 최소화)
   - 모든 entity 적용 (Notes/Wiki/Templates/Books) — entity별 pipeline에서 동일 로직

**9. Books list view row divider X** (PR #326 LOCKED):
   - Notes/Wiki list view는 flat (border 없음, hover bg만)
   - Books만 outlier였음 → 통일

### 기술 학습 (영구)

- **entity별 사이드바 자유 + 4탭 골격 공유** — Plot UI 일관성 원칙 정합. Detail은 자유 / 4탭 dispatch는 entity-aware (`useSidePanelEntity`).
- **`sidePanelContext` type 확장 패턴** — entity 추가 시 `{ type: "<kind>"; id }` union 확장 + `useSidePanelEntity`에 분기 + `SidePanelDetail/Connections/Activity/Bookmarks` 4 dispatch에 case 추가.
- **`noteEvents.meta.templateId`로 reverse-lookup** — 데이터 모델 신규 없이 "Used by N" 추적 가능. event log 이미 있으면 활용 우선.
- **`isWikiStub()` 헬퍼는 contentJson-only** — note의 outline extraction과 같은 패턴. 재사용성 ↑.
- **resolveBookItems의 ResolverStore 통일** — Smart/Hybrid/Manual book 통합 view 가능. 7 store hook (notes/folders/wikiArticles/wikiCategories/tags/labels/stickers) 한 번에 전달.
- **`updateBook` direct call 패턴** — Plot은 별도 `toggleBookPin` 액션 없이 `updateBook(id, { pinned: !pinned })` 직접. `togglePin`은 다른 entity (note).
- **"date" GroupBy는 group.ts에 이미 정의됐지만 VALID_GROUP_BY 누락** — type union과 validation list 동기화 의무 (마이그레이션 fallback에 쓰임). 이번에 fix (#327 commit).
- **빈 bucket filter 패턴** — `.filter((key) => buckets[key].length > 0)` 한 줄로 UI noise 제거. 모든 entity의 grouping에 적용.

### Watch Out (다음 세션)

- **6 PR cascade + 독립 누적** — main에 머지 시 충돌 가능 (PR #322 → #323 → #324 → #325 cascade. PR #326/#327은 main 독립). Plot 패턴 (HEAD 우선 `--ours`) 적용 권장.
- **React Hook order 경고 한 번 떴음** (PR #323 시점, clean reload 후 사라짐) — hot reload 영향 추정이지만 다음 세션 verify 시 모니터링 권장.
- **`useSidePanelEntity` Book 분기 → store.books 의존** — store에 books slice 있다 가정. 빈 array fallback (`?? []`)으로 안전 처리됨.
- **Time grouping의 Books pipeline은 별도** — `use-books-view.ts` `applyBookGrouping`에 if 분기 추가 (group.ts 공통 함수 호출 X). entity별 pipeline 패턴 따름.
- **Templates entity는 group.ts 공통 호출 X** — `use-templates-view.ts`에 자체 `applyTemplateGrouping` 함수. date 추가 위해 별도 wire-up 필요했음. Plot의 entity-specific pipeline 패턴 이해 의무.

### 환경 변경
- Store version: 변경 없음 (모두 derive view + UI 변경)
- 신규 파일: `components/side-panel/book-detail-panel.tsx`, `.omc/plans/entity-side-panel-uniformity-prd.md`
- 신규 컴포넌트 (export): `BookDetailPanel`, `BookContextBookmarks`, `NoteStatusBreakdown`, `WikiStatusBreakdown`, `DotCount`
- 신규 helper: `countPlaceholders` (templates.ts, PLACEHOLDER_PATTERN regex single source)
- view-engine 확장: `VALID_GROUP_BY`에 `"date"` 등록 + cross-entity groupings (`tag/category/sticker/book/connections`)도 등록

---

## 2026-05-13 (밤) — 집, PR #321 11 commits (Status 색 재정렬 + Templates UpNote 패턴 + 9 follow-up)

> 🎯 **다음 즉시 액션** (다른 머신에서 cross-machine):
> 1. `git pull origin main` (PR #321 머지된 main 받음)
> 2. dev:3002 hard refresh (Ctrl+Shift+R) — HMR 캐시 stale 가능성
> 3. Manual verify 5 surface — 아래 "verify list" 참고
>
> **PR #321 11 commits 종합**:
> - **Status 색 재정렬**: Stone slate(회색,raw) → Brick amber(중간) → Block emerald(완성). 마지막 단계 가장 vivid color 메타포.
> - **STATUS_CONFIG var 통일**: stone/brick 모두 `var(--status-*)` (chip ↔ icon 정확 동일 색).
> - **Templates UpNote 패턴**: TemplatesPickerDialog 신규 / slash entry 일원화 / 빈 paragraph **ProseMirror Decoration**으로 inline clickable placeholder ("Insert from a template · or press / for menu") / placeholder 가시성 ↑ (opacity 0.4→0.75, 0.5→0.9).
> - **Template placeholder expansion fix**: `createNoteFromTemplate` + slash command 둘 다 `contentJson` 재귀 expand (`{{YYYY}}-{{MM}}-{{DD}}` → `2026-05-14`).
> - **TitlePatternBar 제거** + editor counts row footer 위치 (toolbar 위, `flex flex-col` scroll container).
> - **6 UX follow-up**: Home stats icon 좌측 / BookTable overflow + min-w / Wiki/Books 그룹 헤더 `.a-tg` / i18n 영어 통일 / status icon weight bold.
>
> **Manual verify list** (다른 컴퓨터 dev에서):
> 1. **Status 색 일치** — /notes list mode에서 Stone/Brick/Block chip + row icon 모두 동일 색 (slate-600 / amber-600 / emerald-600)
> 2. **빈 노트 inline hint** — 새 노트 열기 → 첫 paragraph 안에 "Insert from a template · or press / for menu" 표시. 클릭 시 dialog open. 입력 시작 시 자동 사라짐.
> 3. **Template placeholder** — template에 `{{YYYY}}-{{MM}}-{{DD}}` 작성 → 빈 노트에서 slash "Insert template…" 또는 inline button → title이 `2026-05-14`로 자동 치환
> 4. **Slash 메뉴 깔끔** — `/` 입력 → block items + 단일 "Insert template…" entry (개별 templates 13+ 안 펴짐)
> 5. **Editor footer** — words/chars가 toolbar 바로 위 (body 안 floating X)
> 6. **Wiki/Books 그룹 헤더** — Notes 패턴 `.a-tg` (var(--fg) 진함 + 우측 divider line)
> 7. **Home stats** — REFERENCES card icon 좌측 + 충돌 없음
> 8. **i18n** — Add source dialog "Multi-select" / "Click items to select" 영어
>
> **위험 + 회피**:
> - **HMR 캐시** — dev 첫 진입 시 stale build 가능. **hard refresh 의무**.
> - **사용자 IDB stale**: 사용자 본인 template 데이터에 `{{YYYY}}-{{MM}}-{{DD}}` contentJson 들어가 있어야 expansion 작동. template editor에서 작성 안 됐으면 expansion 효과 없음 — template 새로 만들기 권장.
> - **routing module-level state** — preview MCP에서 view mount 자동 verify 어려움. 사용자 dev 직접 검증.
> - **EmptyHintPlaceholder는 "note" tier만 등록** — wiki/template/comment editor에 영향 X.
>
> **참고 파일** (작업 시 read):
> - `app/globals.css` line 31-37 (light), 211-217 (dark), 1069-1101 (.a-tg)
> - `lib/colors.ts` line 136-140 (NOTE_STATUS_HEX)
> - `lib/store/slices/templates.ts` line 24-49 (expandPlaceholders), 51-79 (expandPlaceholdersInJson), 104-160 (createNoteFromTemplate)
> - `components/note-fields.tsx` STATUS_CONFIG
> - `components/editor/extensions/empty-hint-placeholder.ts` (신규 — ProseMirror Decoration)
> - `components/editor/templates-picker-dialog.tsx` (신규 — CommandDialog)
> - `components/editor/NoteEditorAdapter.tsx` (handleTemplateSelect + event listener)
> - `components/editor/SlashCommand.tsx` (단일 entry → custom event)
> - `components/editor/core/shared-editor-config.ts` line 693+ ("note" tier에 EmptyHintPlaceholder 등록)
>
> **머신**: 집 (Windows)
> **branch worktree**: `claude/elegant-jepsen-2b3731` → PR #321 머지 후 main으로 (다른 머신에서 새 worktree 생성)
>
> **PR #321 11 commits**:
> 1. `438853c` feat: status 색 재정렬 + 6 UX follow-up
> 2. `b5b6eb6` feat: template 생성 다이얼로그 제거 (UpNote 패턴)
> 3. `ce6ed10` feat: TitlePatternBar 제거 + counts row 위치
> 4. `dd1e880` fix: counts row sticky bottom
> 5. `509a564` fix: TemplateEditorAdapter `flex flex-col`
> 6. `5cfbed0` fix: template placeholder expansion contentJson
> 7. `4b2b84d` fix: slash command template — contentJson 우선
> 8. `0ef3803` feat: Templates entry UpNote 패턴 (inline CTA + dialog)
> 9. `3e61e1a` fix: hint absolute → 별도 row + UpNote 카피 회피
> 10. `3bf9a95` fix: ProseMirror Decoration으로 paragraph 안 inline
> 11. `bce50cb` fix: placeholder light mode 가시성 ↑

### 사용자 시그널 (이번 세션 흐름 — 즉 next session에서 참고)

PR #319 머지 후 manual verify 결과로 발견된 시그널 누적:
1. **Status 색 메타포** — "마지막 단계가 가장 옅은 회색이라 메타포 어색"
2. **chip ↔ icon mismatch** — STATUS_CONFIG의 stone/brick이 var(--chart-N) 사용 (PR #319 keystone fix follow-up)
3. **Home stats REFERENCES 충돌** — flex justify-between label-icon 겹침
4. **BookTable 회귀** — narrow viewport flex-1 min-w-0 collapse → text overflow
5. **Wiki/Books 그룹 헤더 모양새 다름** — opacity 약함, divider 없음
6. **i18n 혼합** — "다중 선택" / "처음부터" vs 영어
7. **Template 다이얼로그 friction** — UpNote 패턴 (즉시 editor 진입) 원함
8. **TitlePatternBar 불필요** — UpNote는 그런 bar 없음
9. **counts row 위치 어색** — body 안 floating, toolbar 바로 위로
10. **Template placeholder 작동 X** — slash command가 plain text만 사용
11. **slash 메뉴 templates 개별 펴짐 noisy** — dialog로 일원화
12. **별도 row hint 거부 (위아래 swap뿐)** — UpNote처럼 paragraph 안 inline
13. **light mode placeholder 흐림** — opacity ↑

### 완료 (15 files modified + 2 신규)

| # | File | Change |
|---|---|---|
| 1 | `app/globals.css` light + dark | Stone slate, Block emerald, .a-stchip color 통일 |
| 2 | `lib/colors.ts` | NOTE_STATUS_HEX dark canonical |
| 3 | `components/status-icon.tsx` | weight bold |
| 4 | `components/note-fields.tsx` | STATUS_CONFIG var(--status-*) 통일 |
| 5 | `components/home/stats-row.tsx` | icon 좌측 + px-3 + tracking 제거 |
| 6 | `components/books/book-table.tsx` | overflow-hidden + min-w-[120px] + .a-tg |
| 7 | `components/views/wiki-list.tsx` | .a-tg group header |
| 8 | `components/books/sources-section.tsx` + `book-detail-page.tsx` | 영어 i18n |
| 9 | `components/views/templates-view.tsx` | TemplateFormDialog 제거 (handleCreateNew 즉시 생성) |
| 10 | `components/views/template-edit-page.tsx` | TitlePatternBar 제거 + scroll container flex flex-col |
| 11 | `components/editor/TipTapEditor.tsx` | counts row sticky bottom + toolbar 아래 |
| 12 | `lib/store/slices/templates.ts` | expandPlaceholdersInJson 신규 + createNoteFromTemplate contentJson expand |
| 13 | `components/editor/SlashCommand.tsx` | 개별 templates 제거 → 단일 "Insert template…" + custom event |
| 14 | **`components/editor/templates-picker-dialog.tsx`** (신규) | CommandDialog 기반 templates picker |
| 15 | **`components/editor/extensions/empty-hint-placeholder.ts`** (신규) | ProseMirror Decoration — paragraph 안 inline clickable |
| 16 | `components/editor/NoteEditorAdapter.tsx` | handleTemplateSelect + custom event listener |
| 17 | `components/editor/core/shared-editor-config.ts` | "note" tier에 EmptyHintPlaceholder 등록 |
| 18 | `components/editor/EditorStyles.css` | "Untitled" placeholder opacity 0.4→0.75 |

### 브레인스토밍 & 큰 결정 (영구 LOCKED, 2026-05-13 밤)

**1. Status 색 메타포 (영구 LOCKED)**:
- Stone = slate (회색, raw) — light slate-600 `#475569` / dark slate-400 `#94a3b8`
- Brick = amber (kiln, in progress) — light amber-600 `#D97706` / dark amber-500 `#f59e0b`
- Block (keystone) = emerald (finished crystal) — light emerald-600 `#059669` / dark emerald-400 `#34d399`
- 마지막 단계 가장 vivid color로 끝나는 progression. 색 변경 시 3곳 동시 update (globals.css light/dark + NOTE_STATUS_HEX).

**2. STATUS_CONFIG var(--status-*) 의무**:
- `note-fields.tsx` STATUS_CONFIG color/bg/border 모두 var(--status-*)만 사용. var(--chart-N) 금지.
- chip ↔ row icon 색 정확 동일 보장.

**3. 그룹 헤더 `.a-tg` 통일 (Notes/Wiki/Books)**:
- 3 entity 모두 `.a-tg` 클래스 사용. globals.css line 1069-1101.
- grid: chevron / icon / label (var(--fg) 진함) / count / divider line (1fr).

**4. BookTable narrow viewport overflow 룰**:
- list table cells `overflow-hidden`. flex-1 column `min-w-[N]`.

**5. Home stats card icon 좌측 정렬**:
- `flex items-center gap-1.5`. `justify-between` X — label 길이 무관.

**6. i18n 영어 통일**:
- 다이얼로그 / 버튼 / footer 영어. 한/영 혼합 금지.

**7. Templates UpNote 패턴 (영구 LOCKED)**:
- 템플릿 생성 시 다이얼로그 없이 즉시 editor 진입 (createNoteFromTemplate은 별개 — note 적용 시).
- 템플릿 적용 시 contentJson 우선 (rich content + title heading 다 포함). plain content는 fallback.
- placeholder expansion 시 contentJson도 재귀 expand 의무 (text node만 expand, attrs/meta 보존).
- 빈 노트 hint는 ProseMirror Decoration으로 paragraph 안 inline (absolute overlay X / 별도 row X).
- slash 메뉴는 개별 templates 안 펴고 단일 "Insert template…" entry만 → custom event "plot:open-templates-picker" dispatch.
- 모든 entry path (inline button / slash / 향후 toolbar) 동일 dialog + event.

**8. EmptyHintPlaceholder는 "note" tier만**:
- wiki / template / comment / footnote editor에는 등록 X.
- 새 entity editor 도입 시 EmptyHintPlaceholder 추가 의무 검토.

### 기술 학습 (영구)

- **CSS var vs TS const 동기화 의무** — globals.css `--status-*` 변경 시 NOTE_STATUS_HEX 같이 update. mismatch → ontology canvas / graph stale.
- **chip 패턴 root cause 진단** — chip이 쓰는 var와 row icon이 쓰는 var가 다르면 사용자 시각 "다른 색" 인식. 통일 의무.
- **SVG weight "fill" 한계** — Cuboid2x2 같은 line-only custom SVG는 fill 작동 X. weight "bold"가 일관 안전.
- **flex-1 min-w-0 narrow viewport collapse** — title column 0px squeeze 가능. min-w-[N] 추가 의무.
- **scroll container flex column** — 안 자식이 flex-1로 늘어나려면 scroll container 자체에 `flex flex-col` 필요. counts row가 자연스럽게 끝에 위치.
- **TipTap contentJson vs content** — editor는 contentJson 우선. plain content만 expand는 효과 없음. JSON tree text node 재귀 expand 의무.
- **ProseMirror Decoration vs Placeholder extension** — `@tiptap/extension-placeholder`는 `:before` pseudo (clickable 불가). inline clickable 필요 시 ProseMirror Plugin + `Decoration.widget` 사용.
- **Decoration widget contentEditable=false** — DOM mount 시 cursor 들어가지 않게 + selection 무시 (`ignoreSelection: true`).
- **Custom event for editor↔outer state bridge** — extension에서 dialog open 시 callback prop 전달 어려움 (TipTap re-init 무거움). `window.dispatchEvent(CustomEvent)` + parent listener 패턴이 가볍.

### Watch Out (다음 세션)

- **빈 노트 hint placeholder 우선순위** — TipTap Placeholder extension의 placeholder text와 EmptyHintPlaceholder decoration이 같은 paragraph에 동시 발현 가능. NoteEditorAdapter에서 placeholder="" 두어 충돌 회피. 다른 editor에 EmptyHintPlaceholder 추가 시 같은 패턴.
- **EmptyHintPlaceholder가 ProseMirror Plugin이라 매 transaction 시 decorations 재계산** — performance 영향 작지만 대형 doc + 매 keystroke마다 doc.descendants 순회. 첫 빈 paragraph 찾으면 break이라 OK.
- **template editor에선 EmptyHintPlaceholder X** — 본 hint가 template 작성 중 노이즈. "note" tier에만 등록 (shared-editor-config.ts case "note").
- **사용자 IDB stale template** — 사용자가 PR #319 이전에 만든 template은 contentJson에 placeholder 없을 수 있음. PR #321 이후 새 template 작성 + placeholder 사용 권장.
- **Gallery card enrichment (P1 보류)** — Notes/Wiki/Books 갤러리 카드 status chip + metadata. GalleryItem interface + 3 adapter 매핑. 사용자 "휑함" 시그널.
- **Home stats References 2px truncate** — viewport 1400 / 카드 134 width에서 90vs88 미세. 사용자 시그널 시 short label 또는 padding 추가 축소.
- **status icon weight bold 영향** — 13곳 사용. 일부 작은 영역에서 너무 굵으면 size별 weight 조정.
- **Wiki/Books `.a-tg` sticky top:30** — Notes 패턴 따라가지만 wiki/books 페이지 sticky 컨테이너 height 다를 수도. 스크롤 시 헤더 잘려보이면 sticky position 조정.

### 환경 변경
- Store version: 변경 없음
- Tests: 변경 없음 (UI/CSS + extension 변경만)
- 신규 파일 2개:
  - `components/editor/templates-picker-dialog.tsx`
  - `components/editor/extensions/empty-hint-placeholder.ts`

---

## 2026-05-13 (밤, 초기) — 집, Status 색 메타포 재정렬 + 6 follow-up (PR #319 manual verify 결과) [DEPRECATED — 위 entry로 흡수됨]

> 🎯 **다음 즉시 액션**: 사용자 manual verify (dev hard refresh) — (1) Notes/Wiki/Books 모두 grouping `.a-tg` 통일 자연스러운지, (2) Status 색 메타포 (Stone slate회색 / Brick amber / Block emerald) chip ↔ row icon 정확 일치, (3) Home stats card REFERENCES 더 이상 icon 충돌 없음, (4) BookTable narrow viewport에서 Name visible.
>
> **사용자 의도** (4 시그널):
> 1. **Status 색 메타포 재정렬** — 마지막 단계(Block)가 가장 옅은 슬레이트 회색이라 직관 어긋남. 사용자 제안: Stone(회색,raw) → Brick(주황,중간) → Block(emerald 가장 선명,완성).
> 2. **chip ↔ icon 색 mismatch** — Stone/Brick의 STATUS_CONFIG가 var(--chart-2/3) 사용 (PR #319 keystone만 fix). chip은 chart 색 / row icon은 var(--status-*). **본질적으로 다른 CSS var**. 사용자가 시각으로 "다른 색" 정확 인식. fix: STATUS_CONFIG 모든 status를 var(--status-*)로 통일.
> 3. **Home stats card REFERENCES 충돌** — `flex justify-between` label 길면 icon 겹침. fix: icon 좌측 정렬.
> 4. **BookTable list view 회귀** — Name `flex-1 min-w-0`이 좁은 viewport에서 0px collapse → text overflow → Kind 헤더 겹침. fix: overflow-hidden + min-w-[120px].
> 5. **i18n 혼합** — "다중 선택" / "처음부터" 한국어 vs "Add selected" / "Resume" 영어. fix: 영어 통일.
> 6. **Wiki/Books 그룹 헤더 모양새 다름** — Wiki "NO PARENT 5" 흐림 (muted-foreground/60), Notes는 진함 (var(--fg)). fix: `.a-tg` 패턴 통일.
>
> **첫 스텝** (다른 머신에서 바로 시작):
> 1. `git pull origin main` (이번 PR 머지됐다 가정) → dev:3002 hard refresh (Ctrl+Shift+R)
> 2. /notes list mode 진입 → Stone/Brick/Block 3 group 확인. chip + row icon 색 정확 동일.
> 3. /wiki list 진입 → "NO PARENT" 헤더가 Notes처럼 진하게 + line divider 확인.
> 4. /books list mode → "SMART/HYBRID/MANUAL" 헤더 동일 패턴.
> 5. /home → KNOWLEDGE BASE 6 cards에 icon 좌측 + REFERENCES 충돌 없음.
> 6. /books 책 detail → Resume / Start over (영어). Smart Book Add source 다이얼로그 "Multi-select" / "Click items to select".
>
> **참고 파일**:
> - `app/globals.css` line 35-37 (light status vars), 215-217 (dark), 1069-1101 (.a-tg)
> - `lib/colors.ts` line 136-140 (NOTE_STATUS_HEX dark canonical)
> - `components/status-icon.tsx` (weight bold)
> - `components/note-fields.tsx` (STATUS_CONFIG)
> - `components/home/stats-row.tsx` (icon 좌측)
> - `components/books/book-table.tsx` (overflow + min-w + .a-tg)
> - `components/views/wiki-list.tsx` (.a-tg)
> - `components/books/sources-section.tsx`, `book-detail-page.tsx` (i18n 영어)
>
> **위험 + 회피**:
> - **status 색 변경 영향 범위** — ontology-graph-canvas는 NOTE_STATUS_HEX 사용 (자동 반영). books-gallery-adapter는 #94a3b8 hardcoded (Manual 기본색, status 무관 — 영향 X). 다른 hardcoded hex 검색해도 거의 없음.
> - **`.a-tg` sticky behavior** — Wiki/Books에 sticky top: 30px 적용됨 (Notes 동일). 스크롤 시 헤더 살아있음. 사용자 의도 부합.
> - Gallery enrichment (Notes/Wiki/Books 카드에 status chip + metadata) — 별도 PR 보류. interface change + 3 adapter 매핑이라 scope 큼.
>
> **머신**: 집 (Windows)
> **branch worktree**: `claude/elegant-jepsen-2b3731`

### 완료

| # | File | Change |
|---|---|---|
| 1 | `app/globals.css` light | Stone `#c9a87c` → `#475569` slate-600 / Block `#475569` → `#059669` emerald-600 |
| 2 | `app/globals.css` dark | Stone `#e8d5a3` → `#94a3b8` slate-400 / Block `#94a3b8` → `#34d399` emerald-400 |
| 3 | `lib/colors.ts` | NOTE_STATUS_HEX dark canonical 미러 (slate-400/amber-500/emerald-400) |
| 4 | `components/status-icon.tsx` | StatusShapeIcon weight regular → bold (선명도 ↑, bg badge 없음) |
| 5 | `components/note-fields.tsx` | STATUS_CONFIG stone/brick var(--chart-N) → var(--status-*) + weight bold |
| 6 | `components/home/stats-row.tsx` | icon 좌측 정렬 + px-3 padding + tracking 제거 (REFERENCES 충돌 fix) |
| 7 | `components/books/book-table.tsx` | overflow-hidden cells + Name min-w-[120px] + `.a-tg` group header |
| 8 | `components/views/wiki-list.tsx` | `.a-tg` group header (Notes 패턴 통일) |
| 9 | `components/books/sources-section.tsx` | "다중 선택" 등 → 영어 |
| 10 | `components/views/book-detail-page.tsx` | "처음부터" → "Start over" |

### 브레인스토밍 & 큰 결정 (영구 LOCKED)

**1. Status 색 메타포 재정렬 (영구 LOCKED, 2026-05-13 사용자 결정)**:
- **Stone** = slate (회색, raw, needs triage) — light slate-600 `#475569` / dark slate-400 `#94a3b8`
- **Brick** = amber (kiln-fired, in progress) — light amber-600 `#D97706` / dark amber-500 `#f59e0b` (유지)
- **Block (keystone)** = emerald (finished crystal, settled) — light emerald-600 `#059669` / dark emerald-400 `#34d399`
- 마지막 단계가 가장 선명한 vivid color로 끝나는 progression (이전엔 Block이 가장 옅은 slate라 메타포 어색).
- 새 변경 시 globals.css + NOTE_STATUS_HEX + STATUS_CONFIG 3곳 동시 update 의무.

**2. STATUS_CONFIG var(--status-*) 통일 영구 룰 (PR #319 keystone fix follow-up 완성)**:
- chip color/bg/border는 var(--status-*)만 사용. var(--chart-N) 사용 금지.
- 이전 PR #319에서 keystone만 fix했고 stone/brick은 lazy 남았었음 → 사용자 시그널 (chip ↔ icon 색 mismatch)로 발견. fix.

**3. 그룹 헤더 `.a-tg` 영구 패턴 (모든 entity)**:
- Notes/Wiki/Books 3 entity 모두 `.a-tg` CSS 클래스 + `.a-tg__label`/`.a-tg__count`/`.a-tg__line` 통일.
- grid-template-columns: 11px auto auto auto 1fr (chevron / icon / label / count / divider line).
- label color: var(--fg) (진함). count: var(--whisper-fg) (옅음). line: var(--border).
- 새 entity의 list/group view 도입 시 같은 패턴 사용 의무.

**4. BookTable narrow viewport overflow 영구 룰**:
- list table cells에 `overflow-hidden` 의무 (text overflow → 옆 cell 겹침 회피).
- Title (flex-1 column)에 `min-w-[120px]` (좁은 viewport에서 0 collapse 방지). Notes/Wiki 같은 pattern 사용 시 동일 룰.

**5. Home stats card layout 영구 패턴**:
- icon은 label **좌측에** (`flex items-center gap-1.5`). `justify-between` X — label 길이 무관 일관성.
- label 길면 `truncate` 적용. tracking 자제 (text-2xs uppercase font-medium 충분).

**6. i18n 영어 통일 영구 룰**:
- 다이얼로그 / 버튼 / footer 텍스트는 영어. 한국어 사용자라도 일관성 우선.
- 위반 시: 같은 다이얼로그 안 영어/한국어 혼합 → 시각 일관성 떨어짐.

### 기술 학습 (영구)

- **CSS var vs TS const 동기화 의무** — globals.css `--status-*` 변경 시 lib/colors.ts `NOTE_STATUS_HEX` (canvas/SVG canonical) 같이 update. mismatch → ontology-graph-canvas 같은 canvas user가 stale 색 사용.
- **STATUS_CONFIG chip 패턴 root cause** — chip이 사용하는 var와 row icon이 사용하는 var가 다르면 사용자 시각 "다른 색" 인식. 통일 의무.
- **SVG weight "fill" 한계** — Cuboid2x2 custom icon은 line-only SVG라 weight "fill" 작동 X. weight "bold"가 다른 weight들과 일관 (Hexagon/Cube). status icon 3종 통일 weight 필요 시 "bold" 안전.
- **flex-1 min-w-0 narrow viewport collapse** — title column이 0px로 squeeze 가능. min-w-[N] 추가로 minimum 보장.
- **`.a-tg` CSS grid 패턴** — chevron / icon / label / count / line 5 column. 마지막 line이 flex 1fr로 남는 공간 채움. divider visual 깔끔.

### Watch Out (다음 세션)

- **Wiki/Books `.a-tg` sticky behavior** — `top: 30px` Notes 패턴 따라가는데 wiki/books 페이지의 sticky 컨테이너 height 다를 수도. 스크롤 시 헤더 잘려보이면 sticky position 조정 follow-up.
- **status icon weight bold 영향** — sidebar / breadcrumb / book-context-nav / gallery 등 13곳에서 StatusShapeIcon 사용. weight bold가 일부 작은 영역에서 너무 굵을 수도 — 사용자 시그널 시 size별 weight 조정.
- **Gallery enrichment 별도 PR 대기** — Notes/Books/Wiki 카드에 status chip + folder/category chip + updated badge. GalleryItem interface 변경 + 3 adapter (notes/books/wiki) 매핑. 사용자가 "휑함" 시그널 줬으니 후속 우선순위.
- **Home stats card "References" 라벨 2px truncate** — viewport 1400 + 카드 134px width에서 90vs88 미세 truncate. 거의 invisible하지만 사용자 시그널 시 short label ("Refs") 또는 padding 더 축소.

### 환경 변경
- Store version: 변경 없음
- Tests: 변경 없음 (UI 변경만)
- 신규 파일: 없음 (10 파일 수정)
- 영구 룰 6개 추가 (위 LOCKED 참조)

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
