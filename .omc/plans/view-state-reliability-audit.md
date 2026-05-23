# DP / Grouping / Ordering 신뢰성 — Audit v2 + 수정 계획

> **상태**: AUDIT 완료 / 사용자 검토 단계 / 코드 수정 X
> **작성**: 2026-05-23 (v2 — Linear 마인드셋 통합)
> **대상**: TODO P0 #1
> **본질**: "UI 노출 = 동작 보장" — Linear product 룰을 Plot에 박는다.

---

## 1. 문제 정의

사용자 신고 인용:
> "타임라인의 디스플레이 프로퍼티스가 제대로 작동을 안 함. 타임라인뿐 아니라 그리드·보드 모드에서도 가끔 벌어짐. 완벽하고 확실한 해결책 필요. 필터는 테스트해보니 웬만한 건 다 됨 — **DP / 그룹핑 / 오더링**이 문제."

진짜 problem statement:
- view-configs.tsx는 entity별로 옵션을 선언 — **mode 분기 없음**
- 결과: Wiki gallery에 노출된 `firstLetter` grouping은 코드 미지원 → 사용자가 선택해도 효과 0 = **"왜 안 돼?" 발생**
- 동시에 normalize 데이터 무결성 버그 (B1~B3) 가 persist된 viewState를 깎아먹어 "가끔 안 됨" 시그널

## 2. Product 룰 (Linear 마인드셋 from Plot 본질)

| # | 룰 | 의미 |
|---|---|---|
| L1 | **UI 노출 = 100% 동작** | 보이는 옵션은 코드가 반드시 지원. modes 선언과 코드 갭 해소는 같은 PR. |
| L2 | **Show, don't disable** | 의미 없으면 안 보여줌. disabled grayed-out 옵션 X (그게 더 noise). |
| L3 | **View is a memo, not a config** | mode 전환은 같은 데이터의 다른 viewing. 무효 옵션은 normalize가 자동 정리. |
| L4 | **Make the right thing default** | 각 mode의 default groupBy/sort를 product 결정으로 박음. 사용자 setup cost X. |
| L5 | **Self-documenting source of truth** | view-configs.tsx 한 곳에 declarative — 리뷰어가 한 줄 보고 답 얻음. |

이 5 룰이 Plot "Gentle by default, powerful when needed"와 동일 본질.

## 3. ViewState 흐름 (3 계층)

```
[Store: viewStateByContext[ctx]]   (persist, IDB)
   ↓ normalizeViewState (defaults.ts:148)
      ← 데이터 무결성 fix (B1/B2/B3/B8) 위치
      ← mode-aware 룰 추가 위치 (L3 — 무효 옵션 자동 reset)
[Hook: use-*-view.ts / wiki-list-pipeline.ts]
   ↓ filter → search → sort → group
      ← Library 5종 grouping stub (B7), wiki tier sort stub (B10)
[View component: components/views/*.tsx]
   ↓ mode 분기 (list/board/gallery/timeline/grid)
      ← timeline destructure 누락 (B4), gallery groupBy 무시 (B5/B12)
[자식 컴포넌트: BookTable, TemplatesTable, GalleryView, ...]
```

## 4. 4 Dimension audit

### 4.1 Grouping — mode-aware 강함 ⭐ 핵심

**Universal 룰** (entity 무관 메타포 의미):

| Option | list | board | gallery | grid | timeline |
|---|---|---|---|---|---|
| none | ✅ | ✅ | ✅ | ✅ | ✅ |
| status / wikiStatus / kind (entity-native enum) | ✅ | ✅⭐board-default | ✅ | ✅ | ✅⭐timeline-default |
| priority / folder / label / parent / role / tier / linkCount / pinned / triage | ✅ | ✅ | ✅ | ✅ | ✅ |
| **family** (tree indent) | ✅ | ❌(예외: categories `allowFamilyOnBoard`) | ❌ | ❌ | ❌ |
| **date** / **createdAt** (5-bucket time) | ✅ | ✅ | ✅ | ✅ | **❌** X축 시간과 중복 |
| **firstLetter** (Index) | ✅ | ❌ alphabet 컬럼 약 | ❌ 텍스트 헤더 의존 | ⚠️ entity별 판단 | ❌ 시간 무관 |
| connections/sticker/book | (graph 전용) | - | - | - | - |

**도출 4 룰**:
1. Timeline 차단: `date` / `createdAt` / `firstLetter` / `family`
2. Gallery 차단: `family` / `firstLetter`
3. Board 차단: `family` (예외 categories) / `firstLetter`
4. `firstLetter` (Index) 본질 = **list 전용** (grid는 entity별 판단)

**Entity별 default (L4)**:
- Notes board: `status` / Wiki board: `wikiStatus` / Books board: `kind` (현행)
- **Wiki timeline: `wikiStatus` default** ← 신규 룰 (Stub vs Article을 시간축에서 보는 게 가장 강력)
- Notes/Books/Templates timeline 미지원 (현재) — 차후 추가 시 entity-native enum default

### 4.2 Ordering — mode-aware 약함

Sort는 mode 무관 항상 의미 있음. `modes` 필드 거의 불필요.

**유일한 차별성**:
- Timeline default sort = `createdAt asc` (lane Y가 시간 순) — 박을 가치 있음
- Board default sort = entity별 enum-first → updatedAt (현행)

**진짜 갭**:
- B10: wiki `tier` sort = `return 0` 하드 stub
- 일부 hook sort에 entity-foreign field가 `default: 0` fail-safe → 사용자 선택 시 무시 (silent fail)

→ 코드 fix만. 룰 변경 X.

### 4.3 Display Properties (visibleColumns) — mode-aware 강함

**현실**:
- **list/board**가 메인 사용처 (chip/column toggle)
- **gallery**: 카드 슬롯 5개 고정 (cover/badge/excerpt/metaLeft/metaRight) — property selection 의미 약. 사용자가 토글해도 카드 디자인이 결정.
- **timeline**: label-column status+title+createdAt 고정 — visibleColumns prop 안 받음 (B6)
- **grid**: thumbnail + caption — limited

**룰**:
- properties[]에 기본 `modes: ["list", "board"]`
- `boardOnly` 플래그는 `modes: ["board"]`로 일반화 (Notes의 priority/label/tags 같은 케이스)
- gallery/timeline은 별도 슬롯 디자인 — properties[] 대신 mode-specific 카드/lane 디자인 결정
- 향후 timeline label-column 확장 시 그 property에 `modes: [..., "timeline"]` 추가

### 4.4 Filter Categories — mode-aware 약함

Filter는 결과 집합 줄이는 거라 mode 무관. 거의 `modes: "all"`. mode 분기 룰 없음.

**진짜 갭**:
- B8: fail-closed (tags/stickers/refs) → stale rule이 view 비우게 함
- entity별 filter는 이미 `filterCategories`로 분리 (entity-aware ✅)

→ 코드 fix만 (`default: return false` → `return true`).

## 5. 검증된 버그 (14건, file:line 검증 가능)

### 🔴 Critical (사용자 "가끔 안 됨" 핵심 원인)
| # | 위치 | 영향 | 수정 |
|---|---|---|---|
| **B1** | [types.ts:257-269](lib/view-engine/types.ts:257) (정의 line 93/97/102) | `VALID_GROUP_BY`에 `firstLetter`/`createdAt`/`wikiStatus` 누락 → normalize가 persist된 grouping을 "none"으로 떨굼 → **reload 시 그룹핑 손실** | 1줄 |
| **B2** | [types.ts:248-255](lib/view-engine/types.ts:248) | `VALID_SORT_FIELDS`에 `articles` 누락 → wiki-category articles sort reload 시 떨굼 | 1단어 |
| **B3** | [defaults.ts:17](lib/view-engine/defaults.ts:17) vs [types.ts:275-298](lib/view-engine/types.ts:275) | DEFAULT `"words"` vs VALID `"wordCount"` mismatch → normalize에서 영구 떨어짐 | 1단어 |
| **B4** | [wiki-timeline-view.tsx:60-66](components/views/wiki-timeline-view.tsx:60) | viewState prop destructure 누락 → timeline groupBy/DP/groupOrder 무시 | destructure + 동작 추가 |
| **B5** | [wiki-view.tsx:1251](components/views/wiki-view.tsx:1251), [:1514](components/views/wiki-view.tsx:1514) | wiki gallery는 wikiGroups 안 받고 `buildWikiGalleryGroups` stub/article 강제 | 시그니처 변경 + entity별 builder 통합 |
| **B8** | [use-tags-view.ts:59-72](lib/view-engine/use-tags-view.ts:59), [use-stickers-view.ts:66-79](lib/view-engine/use-stickers-view.ts:66), [use-references-view.ts:84-96](lib/view-engine/use-references-view.ts:84) | fail-closed → stale filter rule이 view 통째로 비움 | 3 hook `return false` → `return true` |

### 🟠 High (UI 노출 ≠ 동작)
| # | 위치 | 영향 |
|---|---|---|
| **B6** | [timeline-label-column.tsx:21-31](components/views/wiki-timeline/timeline-label-column.tsx:21) | visibleColumns prop 안 받음 → DP 토글 영향 0 |
| **B7** | use-tags-view.ts:108, use-labels-view.ts:88, use-stickers-view.ts:116, use-files-view.ts:120, use-references-view.ts:137 | Library 5종 hook의 grouping stub. firstLetter는 컴포넌트-사이드 (PR #403). modes 룰로 list/grid만 노출하면 코드 갭 거의 사라짐 |
| **B11** | [library-view.tsx:1597](components/views/library-view.tsx:1597) | References groupBy 이중 상태 (로컬 useState + viewState) |
| **B12** | [templates-view.tsx:565](components/views/templates-view.tsx:565) | Templates grid가 groups 무시 → grouping 효과 0 |

### 🟡 Medium
| # | 위치 | 영향 |
|---|---|---|
| **B9** | [use-files-view.ts:140-143](lib/view-engine/use-files-view.ts:140) | searchQuery stage 자체 없음 → Files 검색 0 동작 |
| **B10** | [wiki-list-pipeline.ts:298-300](lib/view-engine/wiki-list-pipeline.ts:298) | wiki tier sort = `return 0` 하드 stub |
| **B13** | [books-view.tsx:278-293](components/views/books-view.tsx:278), [use-books-view.ts:175-178](lib/view-engine/use-books-view.ts:175) | Books board groupOrder/showEmptyGroups 미연결 (의도된 TODO) |
| **B14** | [use-templates-view.ts:26-33](lib/view-engine/use-templates-view.ts:26) | isHydrated 누락 (현 미사용, 무해) |

## 6. PR 분할 (Linear 마인드셋 적용)

### PR-A — 데이터 무결성 fix (독립, 즉시 실행 가능, 1-2 시간)
- B1 VALID_GROUP_BY에 `firstLetter`/`createdAt`/`wikiStatus` 추가
- B2 VALID_SORT_FIELDS에 `articles` 추가
- B3 defaults.ts:17 "words" → "wordCount"
- B8 fail-closed → fail-open (3 hook)
- B9 use-files-view에 searchQuery stage 추가
- 검증: tsc + persist 마이그레이션 시뮬레이션
- **Linear 룰 무관, 사용자 신고 "가끔 안 됨" 해소의 8할**

### PR-B — Foundation: declarative modes 선언 + 적용
1. `lib/view-engine/view-configs.tsx` 타입 확장:
   ```ts
   type ModeList = ViewMode[] | "all"
   interface GroupingOption {
     value: GroupBy
     label: string
     modes?: ModeList            // 신규 — 없으면 "all"
   }
   interface DisplayProperty {
     key: string
     label: string
     icon?: ReactNode
     modes?: ModeList            // boardOnly: true → modes: ["board"]로 마이그레이션
   }
   interface DisplayConfig {
     ...
     defaultGroupByByMode?: Partial<Record<ViewMode, GroupBy>>  // L4
     defaultSortByMode?: Partial<Record<ViewMode, SortRule>>    // L4
   }
   ```
2. 11 ViewConfig에 §4.1/4.3 룰대로 modes 일괄 선언
3. `display-panel.tsx` / `filter-panel.tsx`가 `viewState.viewMode` 보고 filter
4. `normalizeViewState` 확장: mode-aware 룰 검사 — 무효 groupBy/visibleColumns 자동 reset
5. **결과**: UI noise 사라짐. timeline grouping 드롭다운에 `date`/`firstLetter`/`family` 안 보임. Library 5종 firstLetter는 list에서만.

⚠️ PR-B 단독으론 갭 잔존 (예: gallery에서 노출된 wikiStatus 선택 → 동작 X). 그래서 PR-B2 시퀀셜 필수.

### PR-B2 — 갭 해소 (PR-B의 선언이 동작하도록)
PR-B에서 modes에 포함된 모든 옵션이 실제 동작하게:
- **B4 timeline lane 그룹 헤더**: `laneArticles` 그룹별 lane 묶음 + label-column 헤더 sticky 렌더 + grid 가로선
- **B5 wiki gallery**: `buildWikiGalleryGroups` → `wikiGroups` 받아 entity-agnostic GalleryGroup으로 변환. Notes/Books gallery도 같은 패턴 (entity별 builder 통일)
- **B6 timeline-label-column**: visibleColumns prop 받음 + 모드별 컬럼 분기
- **B12 templates grid**: searchedGroups 전달 + grid 컴포넌트가 그룹 헤더 렌더
- **B11 references**: 로컬 groupBy state 제거, viewState.groupBy 단일화 (`type`/`fieldKey`를 GroupBy union에 추가)
- **B7 Library 5종 (선택)**: hook 통합 vs 컴포넌트-사이드 유지. modes 룰로 list/grid만 노출 → **현 컴포넌트-사이드(PR #403) 유지 OK**. hook 통합은 후속.

**예상 분량**: PR-B = ~150줄 (declarative), PR-B2 = ~400-500줄 (timeline lane + gallery builders). 시퀀셜로 묶이지만 분리.

### PR-C — Polish
- B10 wiki tier sort 구현 (buildWikiDepthMap 활용)
- B13 Books board groupOrder/showEmptyGroups 확장 (Wiki/Notes board 패턴 정합)
- B14 use-templates-view isHydrated 추가
- DP/Sort에 `defaultByMode` 룰 적용 (timeline 진입 시 sort=`createdAt asc` 자동)
- mode 전환 toast (선택 — "Grouping reset for gallery view" 등, 너무 자주 안 띄움)

### PR-D — (선택) Library 5종 hook 통합
- B7 풀해소 — apply*Grouping 시그니처 통일 + firstLetter 로직 hook 이동
- 미래 grouping 확장 (예: Tags by colorStatus) 시점에 가치 발생. 지금 즉시 가치 ↓.

## 7. Linear-style 자동 마이그레이션 (L3 구현)

`normalizeViewState`가 mode-aware 룰 검사:
```ts
// pseudo
function normalizeViewState(raw, ctx) {
  // ... 기존 단계 ...
  const config = VIEW_CONFIGS[ctx]
  const groupingOption = config.displayConfig.groupingOptions.find(o => o.value === merged.groupBy)
  const modesAllowed = groupingOption?.modes ?? "all"
  if (modesAllowed !== "all" && !modesAllowed.includes(merged.viewMode)) {
    // mode-invalid → reset to default for this mode
    merged.groupBy = config.displayConfig.defaultGroupByByMode?.[merged.viewMode] ?? "none"
  }
  // visibleColumns도 동일 — 현재 viewMode에서 modes에 없는 key 제거
  // ...
}
```

이렇게 하면 사용자가 list에서 firstLetter 그룹 후 gallery 전환 → groupBy=none 자동. UI에서 firstLetter 안 보이고, persist된 값도 정리됨. Linear-style 매끄러움.

## 8. 사용자 결정 사항 (단순화)

이제 §6 5개에서 3개로 정리:

❓ **#1. Wiki timeline default groupBy** — `wikiStatus` 추천 (Stub vs Article을 시간축에서). 동의?

❓ **#2. PR-B2 timeline lane 그룹 헤더 구현 — 한 PR로 같이 갈까, 후속으로 미룰까?**
- (a) 같이 — Linear 룰 L1 ("보이면 동작") 엄격. PR-B 머지 시점에 timeline grouping이 실제 동작. **추천**.
- (b) 후속 — PR-B는 선언만, timeline은 `[none, wikiStatus만]` 임시 노출. L1 살짝 양보. 빠른 머지.

❓ **#3. Library 5종 hook 통합 (PR-D)** — 지금 같이 갈까, 미룰까?
- 추천 미루기 — 현재 PR #403 컴포넌트-사이드가 list/grid에서 동작. modes 룰로 노출 정리하면 갭 사라짐. 미래 grouping 확장 시 풀이.

(나머지 #2/#3/#5는 modes 룰 + PR-B2로 자동 해결되어 결정 불필요.)

## 9. 검증 전략

### 자동
- `tsc --noEmit` clean
- `npm run build` clean
- 기존 Vitest 통과
- 신규 테스트: `normalizeViewState` mode-aware (구버전 viewState → gallery로 전환 시 firstLetter→none reset)

### 수동 (사용자 본인 데이터)
- B1/B2/B3: viewState reload 5회 (groupBy=firstLetter/createdAt/wikiStatus, sort=articles, DP wordCount)
- B4: Wiki timeline에서 groupBy 변경 → lane 그룹 헤더 실제 렌더
- B5: Wiki gallery에서 groupBy 변경 → GalleryGroup 헤더 정확
- B8: 구버전 stale filter rule 시뮬레이션 → view 정상

## 10. 다음 단계

1. 사용자가 §8 #1-#3 답
2. **PR-A 즉시 진행** (사용자 결정 무관, 데이터 무결성)
3. §8 답 받은 후 PR-B/B2 진행
4. PR-C는 가장 후순위 (polish)

**PR-A는 사용자 OK 신호 받으면 즉시 코드 수정 가능.** P0 #1의 "계획부터" 룰이 audit v2 완성으로 충족됨.
