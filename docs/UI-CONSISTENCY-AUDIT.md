# UI 일관성 Audit — Notes 모범답안 vs 5뷰

> **작성일**: 2026-04-29 (Sprint 1 두 번째 작업)
> **목적**: Activity Bar 6개 공간의 필터/디스플레이 일관성 점검 + Phase plan 도출
> **핵심 원칙 (사용자 통찰)**: 각 뷰의 성격이 다르므로 **Notes를 그대로 복사가 아니라 미세한 조율이 핵심**

---

## 0. 핵심 원칙 — "통일할 것 vs 차별화할 것"

각 Activity Bar 공간은 **다른 성격의 데이터**를 다루므로 일관성과 차별화를 정확히 분리해야 한다.

### ✅ 통일해야 할 것 (모든 뷰)

| 영역 | 이유 |
|------|------|
| **UI 컴포넌트 패턴** (ChipDropdown, FilterPanel, DisplayPanel) | 사용자 기대 일관성. 같은 인터랙션 = 같은 결과 |
| **State 인프라** (`viewStateByContext` + `setViewState`) | 영속성. 새로고침 후 설정 유지 |
| **사이드 패널 트리거 위치** (ViewHeader의 필터/디스플레이 아이콘) | 발견성 |
| **키보드 단축키 + 인터랙션** | 학습 비용 절감 |

### ⚠️ 차별화해야 할 것 (뷰별 성격에 맞게)

| 영역 | Notes 의미 | 다른 뷰 의미 | 결정 |
|------|-----------|-------------|------|
| **"정렬"** | 다중 정렬 chain (linear list 정렬) | Calendar=날짜 소스 선택 / Graph=layout hint / Library Tags=tag 목록 정렬 | 뷰별 의미에 맞춰 단순화 또는 재해석 |
| **"필터"** | 워크플로우(status) + 메타(folder/labels/tags) | Wiki=category/parent/backlinks / Calendar=layer toggle / Graph=노드 타입 | 뷰별 옵션 차별화 |
| **"그룹핑"** | status / folder / labels | Wiki=tier/linkCount bucket / Calendar=날짜(자동) / Graph=구조(자동) | Calendar/Graph는 그룹핑 없음 |
| **"View modes"** | List / Board | Wiki=List만 / Calendar=Month/Week/Agenda / Graph=Graph/Insights | 뷰 고유 view mode 인정 |
| **"Display properties"** | visibleColumns (status/folder/links/words/updated/created) | Wiki=다른 컬럼 / Library=다른 컬럼 / Graph/Calendar=무관 | 뷰별 정의 |

**결론**: 인프라/UI 패턴은 100% 통일, 옵션/의미는 뷰별 차별화. **"미세한 조율"의 핵심은 무엇이 통일이고 무엇이 차별화인지 명확히 분리하는 것**.

---

## 1. Notes view 황금 표준 (요약)

Notes view는 `lib/view-engine/` 인프라를 완전히 활용하는 **유일한 뷰**.

**ViewState 모델** ([lib/view-engine/types.ts:77-98](lib/view-engine/types.ts:77-98)):
- `filters: FilterRule[]`, `sortFields: SortRule[]` (다중 정렬 chain, max 3)
- `groupBy/subGroupBy: GroupBy`, `subGroupSortBy: GroupSortBy`
- `viewMode`, `visibleColumns`, `toggles`, `groupOrder/subGroupOrder`

**5단계 파이프라인** ([lib/view-engine/use-notes-view.ts](lib/view-engine/use-notes-view.ts)):
Stage 1 applyContext → Stage 2 applyFilters → Stage 3 applySearch → Stage 4 applySort → Stage 5 applyGrouping. 각 stage 독립 `useMemo`.

**영속성**: `viewStateByContext: Record<ViewContextKey, ViewState>`가 Zustand persist로 IDB 저장. `setViewState(contextKey, patch)` 한 메서드로 업데이트.

**UI 컴포넌트**:
- [components/display-panel.tsx](components/display-panel.tsx) — Grouping + Sub-grouping + Multi-sort chain + List/Board options + Display properties
- [components/filter-panel.tsx](components/filter-panel.tsx) — Linear-style 좌우 분리 패널 (카테고리 → 값 sub-panel)
- 모든 드롭다운: `ChipDropdown` 패턴 통일

**View config**: [lib/view-engine/view-configs.tsx](lib/view-engine/view-configs.tsx)의 `NOTES_VIEW_CONFIG` — 필터 카테고리 10종, quickFilters 5개, displayConfig (ordering/grouping/toggles/properties)

---

## 2. 5뷰 차이 매핑

### 갭 분류 코드

- **(a) 단순 누락** — 그대로 추가 가능 (인프라 적용)
- **(b) 뷰별 의미 차이** — adapter/config 조정 필요
- **(c) 의도된 차이** — 뷰 성격상 다름. 그대로 둠

### 현황 표

| 뷰 | Filter | Sort | Group | Display | View modes | UI 패턴 | 갭 |
|----|--------|------|-------|---------|------------|---------|-----|
| **Wiki (list)** | `wikiFilters` 로컬 useState | `wikiViewState.sortFields` 로컬, **하드코딩 sort 오버라이드** | 로컬 | 로컬 (새로고침 리셋) | list 고정 | FilterPanel/DisplayPanel 사용하나 store 미연결 | (a)+(b) |
| **Wiki (category)** | `categoryFilters` 로컬 | `catViewState.sortField` store 연결 | store 연결 | store 연결 | list/board | 모범답안에 가장 근접 | (b) |
| **Calendar** | `calendarFilters` 로컬 | `calViewState.sortField` = "날짜 소스" | 없음 (날짜 자동) | store 연결 (toggle) | month/week/agenda | FilterPanel/DisplayPanel 사용 | (b)+(c) |
| **Library References** | 자체 `quickFilter` 인라인 | 로컬 단일 | 로컬 | 자체 popover | list 고정 | view-engine 완전 미사용 | (a)+(b) |
| **Library Tags** | 로컬 `tagSortBy` | 로컬 | 없음 | 자체 popover | list 고정 | useNotesView 부분 사용 | (a) |
| **Library Files** | 로컬 `filter` | 없음 | 없음 | 없음 | list 고정 | ViewHeader만 사용 | (a) |
| **Library Overview** | 없음 | 없음 | 없음 | 없음 | dashboard | 자체 대시보드 | (c) |
| **Inbox (HomeView)** | 없음 | 없음 | 없음 | 없음 | dashboard | 정적 대시보드 | (c) |
| **Ontology graph** | `graphFilters` 로컬 | store 연결 | 없음 (그래프 구조) | store 연결 (toggle) | graph/insights 탭 | FilterPanel/DisplayPanel + adapter | (b)+(c) |
| **Ontology insights** | 없음 | 없음 | 없음 | 미연결 (config dead) | insights 탭 | 자체 구현 | (c) |

---

## 3. 뷰별 상세 분석

### 3.1 Wiki (list mode) — 🚨 최우선 갭

**핵심 문제 3개**:

1. **로컬 ViewState** ([wiki-view.tsx:137-152](components/views/wiki-view.tsx:137)): 새로고침 시 sort/group/display 모두 리셋. `viewStateByContext["wiki"]` 미연결.

2. **하드코딩 sort 오버라이드** ([wiki-view.tsx:314-322](components/views/wiki-view.tsx:314)): `sortedFilteredWikiNotes`가 항상 `updatedAt desc`로 정렬. UI에서 sort 변경해도 무반응 — **무효 UI 버그**.

3. **이중 filter state** ([wiki-view.tsx:137 + 145](components/views/wiki-view.tsx:137)): `wikiFilters`와 `wikiViewState.filters` 두 곳 → `FilterPanel`엔 `wikiFilters`만 전달, `wikiViewState.filters`는 dead.

**Wiki의 성격 차이 (의도)**:

- **Status 개념 다름**: Notes(inbox/capture/permanent) vs Wiki(stub/article — 런타임 파생). 같은 "status" 라벨이지만 의미 완전 다름
- **Sort 옵션 차이**: Notes는 priority/links/words 등, Wiki는 title/linkCount/category가 의미. priority는 wiki에서 무의미
- **Group 옵션 차이**: Notes는 status/folder/labels, Wiki는 tier/linkCount bucket/parentArticleId가 의미
- **위계 구조**: Wiki만 parent-child article 관계 보유 (Notes 폴더와 다름)

**해결 방향**:
1. `wikiViewState` 로컬 → `viewStateByContext["wiki"]`로 통합
2. 하드코딩 sort 제거 → `wikiViewState.sortFields` 기반 동적 sort
3. `wikiFilters` 제거 → `wikiViewState.filters`로 통합
4. `WIKI_VIEW_CONFIG.filterCategories` 확장 — wiki 성격에 맞게 (category/parent/backlinks/날짜)
5. `WIKI_VIEW_CONFIG.displayConfig.orderingOptions` 정리 — title/updatedAt/createdAt/linkCount만 (priority 제외)

**예상 공수**: 중간 (WikiArticle ≠ Note 타입, sort/filter adapter 필요)

---

### 3.2 Wiki (category mode)

**연결 상태**: `catViewState`는 `viewStateByContext["wiki-category"]`에 올바르게 연결 ([wiki-view.tsx:83-88](components/views/wiki-view.tsx:83)).

**갭** (`b`):
- `WikiCategoryPage` props가 `ViewState`를 6개 alias로 분해 전달 ([wiki-view.tsx:1136-1148](components/views/wiki-view.tsx:1136)). `subGroupBy`, `sortFields` 확장 시 props 추가 필요한 fragile 구조
- `WIKI_CATEGORY_VIEW_CONFIG.displayConfig.groupingOptions`에 `none`만 있음 ([view-configs.tsx:211](lib/view-engine/view-configs.tsx:211)) — 그룹핑 사실상 비활성

**해결 방향**:
1. `WikiCategoryPage` props → `ViewState` 직접 전달
2. `groupingOptions`에 `tier`/`parent` 추가 (의미 있는 카테고리 그루핑)

---

### 3.3 Calendar — 의도된 차이가 가장 많은 뷰

**연결 상태**: `calViewState`는 `viewStateByContext["calendar"]` 연결 ([calendar-view.tsx:663-668](components/views/calendar-view.tsx:663)).

**갭**:
- (a) `calendarFilters` 로컬 state ([calendar-view.tsx:659](components/views/calendar-view.tsx:659)) → 새로고침 시 필터 리셋
- (c) `calViewState.sortField` = "날짜 소스 선택" (createdAt vs updatedAt) — **sort가 아니라 filter source 선택**. Notes의 sort 의미와 완전 다름
- (c) groupBy 의미 없음 — 날짜 자체가 그룹핑

**Calendar의 성격 차이 (의도)**:

- **"정렬"이 의미 없음**: 캘린더에 표시되는 노트는 날짜 셀로 자동 배치. 다중 정렬 무의미
- **"날짜 소스" 개념**: 캘린더만의 unique한 설정. createdAt 기준 vs updatedAt 기준 — 이건 sort가 아니라 "캘린더에 어떤 날짜로 표시할지"
- **"View modes" 다름**: Month/Week/Agenda — calendar-specific
- **"Layer 시스템"**: Notes/Wiki/Reminders/Tags 토글 — 다른 뷰엔 없음

**해결 방향**:
1. `calendarFilters` 제거 → `calViewState.filters` 통합 (영속성)
2. `calViewState.sortField`를 명시적으로 "Date source" toggle로 분리 (sortField에 두면 의미 혼란)
3. View mode (month/week/agenda) 토글은 calendar-specific 그대로 유지 — 통일하지 않음

**예상 공수**: 작음 (filter 연결만)

---

### 3.4 Library References — 🚨 view-engine 완전 미사용

**문제**: 전체 자체 구현 ([library-view.tsx:920+](components/library-view.tsx:920)):
- `sortBy`, `sortDir` 로컬 useState — 자체 타입 정의 (라이트뷰엔진 SortField와 별도)
- `groupBy: "none"/"type"/"fieldKey"` 로컬
- `quickFilter + activeFieldKeys` — 커스텀 필터 인라인 패널 ([library-view.tsx:1167-1222](components/library-view.tsx:1167))
- `DisplayPanel` 컴포넌트 미사용, 자체 인라인 패널 ([library-view.tsx:1224-1296](components/library-view.tsx:1224))
- ChipDropdown 대신 수동 button — UI 일관성 없음

**Reference의 성격 차이 (의도)**:

- **데이터 모델**: Note ≠ Reference. URL/citation 구분, fields 자유 키-값
- **Sort 옵션**: title/createdAt/updatedAt만 의미 (priority/links/words 무의미)
- **Filter 옵션**: type (URL/citation), fieldKey (사용자 정의 필드) — Notes에 없음
- **Group 옵션**: type / fieldKey — Reference 고유

**해결 방향**:
1. `ViewContextKey`에 `"library-references"` 추가 + Reference 전용 view-engine adapter
2. 자체 인라인 패널 → `DisplayPanel` + `FilterPanel` 교체
3. `LIBRARY_REFERENCES_VIEW_CONFIG` 신규 — Reference 성격에 맞게 (type/fieldKey/날짜)

**예상 공수**: 큼 (Reference 전용 adapter + config + 마이그레이션)

---

### 3.5 Library Tags + Files

**Tags** ([tags-view.tsx:141-142](components/views/tags-view.tsx:141)): `tagSortBy`, `hideEmptyTags` 로컬. 태그 상세는 `useNotesView("tag")` 사용. 태그 목록 자체는 view-engine 미사용.

**Files** ([library-view.tsx:815-916](components/library-view.tsx:815)): `filter: "all"/"image"/"document"`만. ViewHeader만 사용.

**성격 차이 (의도)**:
- Tags 목록은 sort만 의미 (group/filter는 다른 차원). 단순 sort dropdown이면 충분
- Files는 type filter만 필요. multi-sort 무의미

**해결 방향**:
1. Tags: `DisplayPanel` 가벼운 버전 (sort dropdown만) + `viewStateByContext["library-tags"]` 영속성
2. Files: `QuickFilterButton` 패턴 통일 ([library-view.tsx:60-87](components/library-view.tsx:60)에 이미 있음)

**예상 공수**: 작음

---

### 3.6 Inbox (HomeView)

**현황**: view-engine 완전 미사용. 정적 대시보드 (Recent Activity, Inbox Preview, Most Connected 위젯).

**의도된 차이 (c)**: 대시보드는 filter/sort/group 개념 자체가 부적절. 진입점 역할.

**갭**: `INBOX_VIEW_CONFIG` 정의만 있고 dead code ([view-configs.tsx:265-288](lib/view-engine/view-configs.tsx:265-288)) — `/inbox` route의 NotesTableView에 연결 확인 필요

**해결 방향**: HomeView는 그대로. `INBOX_VIEW_CONFIG`가 어디에 연결되어야 하는지 추적 후 dead code 제거 또는 연결.

---

### 3.7 Ontology

**Graph**: `graphViewState` store 연결 양호 ([ontology-view.tsx:54-59](components/views/ontology-view.tsx:54-59)). 단 `graphFilters` 로컬 ([ontology-view.tsx:37](components/views/ontology-view.tsx:37)) → 영속성 갭.

**Graph 성격 차이 (의도)**:
- **"정렬"**: layout hint (강조 우선순위) — list sort와 의미 다름. orderingOptions에 `links`, `title` 2개만 ([view-configs.tsx:251-254](lib/view-engine/view-configs.tsx:251-254))
- **"그룹핑"**: 그래프 구조 자체. groupBy 무의미
- **"Display"**: 노드 시각화. visibleColumns 무관

**Insights**: `INSIGHTS_VIEW_CONFIG` 정의만 있고 미연결 — dead code

**해결 방향**:
1. `graphFilters` 제거 → `graphViewState.filters` 통합
2. Insights config 정리 — 연결 또는 dead 제거

---

## 4. Phase plan 권장

### Phase 1: Wiki (Sprint 1 두 번째 작업, 이번 PR)

**범위**:
1. `wikiViewState` 로컬 → `viewStateByContext["wiki"]` 통합
2. `sortedFilteredWikiNotes` 하드코딩 제거 → `wikiViewState.sortFields` 기반 동적 sort
3. `wikiFilters` 제거 → `wikiViewState.filters` 통합
4. `WIKI_VIEW_CONFIG` 정리 — wiki 성격에 맞는 옵션 (priority 제거, linkCount/parent/backlinks 추가 검토)
5. v95 migration 필요시 (sortFields default for wiki context)

**제외** (별도 PR):
- Wiki category mode props 리팩터링 (Phase 2-3에 묶기)
- WikiArticle sort adapter (이번에 인라인 처리 OK)

### Phase 2: Calendar filter 영속성

**범위**:
1. `calendarFilters` 로컬 → `calViewState.filters` 통합
2. `calViewState.sortField`의 "Date source" 역할 명시화 (toggles로 이동 또는 주석)

**예상 공수**: 작음

### Phase 3: Ontology graph filter 영속성

**범위**:
1. `graphFilters` 로컬 → `graphViewState.filters` 통합
2. `graph-filter-adapter.ts` 연결점 검증

**예상 공수**: 매우 작음

### Phase 4: Library References view-engine 통합

**범위**:
1. `ViewContextKey`에 `"library-references"` 추가
2. Reference 전용 view-engine adapter
3. 자체 인라인 패널 → `DisplayPanel` + `FilterPanel` 교체
4. `LIBRARY_REFERENCES_VIEW_CONFIG` 신규

**예상 공수**: 큼 (별도 PR 권장)

### Phase 5: Library Tags + Files UI 통일

**범위**:
1. Tags: `DisplayPanel` 가벼운 버전 + 영속성
2. Files: `QuickFilterButton` 통일

**예상 공수**: 작음

### Phase 6 (정리): Wiki category mode + Inbox/Insights dead config

**범위**:
1. `WikiCategoryPage` props → `ViewState` 직접 전달
2. `INBOX_VIEW_CONFIG` / `INSIGHTS_VIEW_CONFIG` 연결 검토 또는 제거

**예상 공수**: 작음

---

## 5. 영구 차이 (의도, 통일하지 않음)

| 뷰 | 카테고리 | 이유 |
|----|---------|------|
| Calendar | 다중 정렬 | 날짜 자동 배치, sort 무의미 |
| Calendar | groupBy | 날짜가 자체 그룹 |
| Calendar | View modes | month/week/agenda는 calendar-specific |
| Calendar | "Date source" 개념 | calendar 고유 |
| Calendar | Layer 시스템 (Notes/Wiki/Reminders 토글) | calendar 고유 |
| Ontology graph | Sort | layout hint, list sort 무의미 |
| Ontology graph | Group/Sub-group | 그래프 구조 자체 |
| Ontology graph | Display properties | 컬럼 개념 X, 노드 시각화만 |
| Inbox HomeView | Filter/Sort/Group | 대시보드, 진입점 |
| Library Overview | Filter/Sort/Group | 대시보드 |
| Library Files | 다중 정렬 | 단순 type filter만 의미 |
| Wiki | priority sort | wiki에 priority 개념 없음 |
| Wiki | Sub-group | 위계가 다름 (parent-child article ≠ folder/labels) |

---

## 6. Anti-patterns 발견 (영구 폐기 권장)

1. **이중 filter state (Wiki list)** — `wikiFilters` + `wikiViewState.filters` 둘 다 존재. Phase 1에서 제거.

2. **하드코딩된 sort가 ViewState 오버라이드 (Wiki list)** — `sortedFilteredWikiNotes`가 항상 `updatedAt desc`. UI sort 변경 무반응. Phase 1에서 제거.

3. **DisplayConfig 정의만 있고 미연결 (dead code)** — `INBOX_VIEW_CONFIG` ([view-configs.tsx:265-288](lib/view-engine/view-configs.tsx:265-288)), `INSIGHTS_VIEW_CONFIG` ([view-configs.tsx:289-312](lib/view-engine/view-configs.tsx:289-312)). Phase 6에서 처리.

4. **Library References 커스텀 sort 타입 재정의** — [library-view.tsx:55-56](components/library-view.tsx:55-56)에서 `SortField` 로컬 재정의. view-engine 타입 shadow. Phase 4에서 통합.

5. **WikiCategoryPage props indirection** — `ViewState`를 6 alias로 분해 전달 ([wiki-view.tsx:1136-1148](components/views/wiki-view.tsx:1136-1148)). Phase 6에서 정리.

---

## 7. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-04-29 | 초안 작성 (Sprint 1 두 번째 작업, Wiki Phase 1 적용 동시 진행) |
