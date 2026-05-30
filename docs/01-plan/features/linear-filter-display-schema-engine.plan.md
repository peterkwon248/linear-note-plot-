# A3.2 스키마 엔진(keystone) 구현 설계

> Track A / A3.2. **승인 완료(2026-05-30)** — 구현 single source.
> 입력: `linear-filter-display-mirror.spec.md`(A2 LOCKED), 현 view-engine 구조 정독(architect Opus 분석).
> **D2 확정**: Wiki✅ priority / Books = Kind+Priority (사용자 승인). spec 라인75(A1 잠정 Wiki✖/Books✖)는 폐기.

---

## 0. 사전 조사 — 설계 전제 (검증 완료)

1. **소비 경로는 이미 schema-ish다.** 카논 = `FilterPanel`(`categories: FilterCategory[]`) + `DisplayPanel`(`config: DisplayConfig`). 3 엔티티 동일 패턴:
   - `components/notes-table.tsx:1211-1219, 1229-1233` (Notes)
   - `components/views/wiki-view.tsx:1070-1090` (Wiki)
   - `components/views/books-view.tsx:257-265` (Books)
   → **어댑터가 `FilterCategory[]`/`DisplayConfig`만 정확히 뱉으면 소비 컴포넌트 0 수정.** (drop-in 근거)
2. **동적 값 hydration은 이미 `useMemo`로 분리.** `notes-table.tsx:888-906` — `NOTES_VIEW_CONFIG.filterCategories.map(...)`로 folder/label/tags/status `values`/`count`를 런타임 store에서 채움. **"static config + runtime hydrate" 2단 구조가 기존 관행.** `options.source:"dynamic"`은 이를 형식화한 것.
3. **`filter-bar.tsx`의 `FilterMenuItems`는 죽은(레거시) 경로.** 1265줄이 Notes 필터를 하드코딩(view-configs 안 읽음). 카논 뷰는 `FilterPanel` 사용 → 안 건드림. **A3.3에서 폐기 대상.**
4. **실행 레이어(`lib/view-engine/filter.ts`)는 `field` 문자열 switch** (`applyFilters` 40+ case). 스키마는 **UI 생성만**, 필터 실행은 기존 그대로. PropertyDef `key`가 실행 case와 매칭되는 게 핵심 제약(§6).
5. **타입 union 완비.** `types.ts`: `FilterField`(40+)/`SortField`/`GroupBy`/`ViewMode`. PropertyDef는 **새 union 안 만들고** 기존 union을 슬롯에서 재참조 (= L4 안 함 = Plot 정체성).
6. **priority widget = 화살표** (`note-fields.tsx:85-114` `PRIORITY_CONFIG`, ArrowUp/Right/Down). spec §3 3-막대 SVG로 교체 = A4. 스키마가 `icon`을 PropertyDef에 담아 교체를 한 곳으로 모음.

**결론**: 리빌드 아님 = **"config 생성 방식의 역전"**. 지금은 사람이 `FilterCategory[]`를 손으로 씀 → 앞으로 `PropertyDef[]`를 쓰고 어댑터가 생성. **출력 타입(소비 계약) 불변.**

---

## 1. `PropertyDef` 타입

```ts
// lib/view-engine/schema/property-def.ts (신규)
import type { ReactNode } from "react"
import type { FilterField, SortField, GroupBy, ViewMode } from "../types"

/** 6-카테고리 공유 축 (spec A2). filter divider 그룹 + display 섹션 정렬의 의미 단위. */
export type PropertyCategory =
  | "workflow"        // status, priority, kind, pinned
  | "classification"  // folder, label, tags, category
  | "relations"       // links, parent, children, connectedTo
  | "metrics"         // wordCount, reads, itemCount
  | "time"            // createdAt, updatedAt
  | "content"         // hasImage/code/table, aliases, title

/** 위젯 타입 = filter 서브패널 + display 셀 렌더 분기 (FlowBase 타입별 switch 이식). */
export type PropertyValueType =
  | "enum" | "entityRef" | "dateBucket" | "numberBucket" | "boolean" | "special"

export type PropertyOptionSource =
  | { kind: "static"; values: PropertyOption[] }
  | { kind: "dynamic"; hydratorKey: HydratorKey }

export interface PropertyOption {
  key: string
  label: string
  labelKey?: string         // i18n (기존 FilterValue.labelKey)
  color?: string            // NOTE_STATUS_HEX 등
  icon?: ReactNode          // 옵션별 아이콘
  group?: string            // sub-section 헤더 (Ontology Status Note&Wiki/Book)
}

export type HydratorKey = "folder" | "label" | "tag" | "category" | "sticker"

export interface PropertyDef {
  key: FilterField          // 실행 case + viewState 매칭. 기존 union에서만.
  category: PropertyCategory
  label: string
  labelKey?: string
  icon: ReactNode           // chrome 아이콘 (filter 행 좌측 16px, strokeWidth 1.5)
  valueType: PropertyValueType

  isFilterable?: boolean
  isDisplayable?: boolean
  isGroupable?: boolean
  isSortable?: boolean

  options?: PropertyOptionSource  // enum/entityRef
  buckets?: FilterBucket[]        // dateBucket/numberBucket

  groupBy?: GroupBy         // 생략 시 key 캐스팅
  sortField?: SortField     // 생략 시 key 캐스팅
  columnKey?: string        // display→visibleColumns 키 (생략 시 key)

  filterModes?: ViewMode[] | "all"
  displayModes?: ViewMode[] | "all"
  groupModes?: ViewMode[] | "all"
  sortModes?: ViewMode[] | "all"
}

export interface FilterBucket {
  key: string               // "today"/"stale"/"5+"
  label: string
  labelKey?: string
  operator: "eq" | "gt" | "lt"
  value: string             // "24h"/"30d"/"4"
  group?: string            // "Updated"/"Stale"/"Created" sub-header
}

/** 뷰-레벨 설정(PropertyDef로 안 녹는 것) — 기존 DisplayConfig 잔여 필드 보존. */
export interface ViewDefaults {
  supportedModes?: ViewMode[]
  toggles: import("../view-configs").DisplayToggle[]
  extraGroupings?: import("../view-configs").GroupingOption[]  // family/role/firstLetter (group-only)
  boardDefaultGroupBy?: GroupBy
  defaultGroupByByMode?: Partial<Record<ViewMode, GroupBy>>
  defaultSortByMode?: Partial<Record<ViewMode, SortField>>
  supportsSubGrouping?: boolean
  allowFamilyOnBoard?: boolean
}

export interface EntitySchema {
  entity: "notes" | "wiki" | "books"
  properties: PropertyDef[]
  viewDefaults: ViewDefaults
  quickFilters: import("../view-configs").QuickFilter[]  // 스키마화 X, 동거
}
```

---

## 2. 엔티티별 `PropertyDef[]` 매핑

범례: F=isFilterable, D=isDisplayable, G=isGroupable, S=isSortable.

### 2-A. Notes (Tier1 풀)
| category | key | label | valueType | options | F | D | G | S | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| workflow | `status` | Status | enum | static(4) | ✅ | ✅ | ✅ | ✅ | NOTE_STATUS_HEX, circle |
| workflow | `priority` | Priority | enum | static(5) | ✅ | ✅(board) | ✅ | ✅ | **A4 3-막대**. none/urgent/high/med/low |
| workflow | `pinned` | Pinned | boolean | static(2) | ✅ | — | ✅ | — | |
| classification | `folder` | Folder | entityRef | dynamic(folder) | ✅ | ✅ | ✅ | — | N:M, count hydrate |
| classification | `label` | Label | entityRef | dynamic(label) | ✅ | ✅(board) | ✅ | ✅ | color dot |
| classification | `tags` | Tags | entityRef | dynamic(tag) | ✅ | ✅(board) | ✅ | — | |
| relations | `links` | Links | numberBucket | buckets(any/5+/10+/none/orphan) | ✅ | ✅ | ✅ | ✅ | |
| relations | `parent` | Parent | special | — | — | ✅ | ✅ | — | family 별개 |
| relations | `children` | Children | special | — | — | ✅ | — | — | |
| relations | `wikiRegistered` | Wiki | boolean | static(2) | ✅ | — | — | — | note↔wiki |
| relations | `connectedTo` | Connected | special | runtime | ✅ | — | — | — | 특수(§6) |
| metrics | `reads`/`wordCount` | Words | numberBucket | buckets(<50/200+/500+) | ✅ | ✅ | — | ✅ | |
| time | `updatedAt` | Updated | dateBucket | buckets(today/week/stale) | ✅ | ✅ | ✅ | ✅ | |
| time | `createdAt` | Created | dateBucket | buckets | ✅ | ✅ | ✅ | ✅ | |
| content | `content` | Content | enum | static(image/code/table) | ✅ | — | — | — | |
| content | `title` | Title/Index | special | — | ✅(untitled) | — | ✅(firstLetter) | ✅ | firstLetter 파생 |

### 2-B. Wiki (Tier1 풀) — **priority ✅ 포함 (D2 확정)**
| category | key | label | valueType | options | F | D | G | S | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| workflow | `status` | Status | enum | static(4) | ✅ | ✅ | ✅ | ✅ | v151 4단계, Notes 공유 |
| workflow | `priority` | Priority | enum | static(5) | ✅ | ✅(board) | ✅ | ✅ | **D2 확정: Wiki도 status축 → 포함** |
| classification | `category` | Category | entityRef | dynamic(category) | ✅ | ✅ | ✅ | — | WikiCategory |
| relations | `links` | Backlinks | numberBucket | buckets(any/5+/10+/none/orphan) | ✅ | ✅ | ✅ | ✅ | |
| relations | `wikiTier` | Hierarchy | enum | static(root/parent/child/solo) | ✅ | — | ✅ | ✅ | |
| relations | `parent`/`children` | Parent/Children | special | — | — | ✅ | ✅ | ✅ | |
| metrics | `reads` | Reads | numberBucket | — | — | ✅ | — | ✅ | |
| time | `updatedAt`/`createdAt` | Updated/Created | dateBucket | buckets | ✅ | ✅ | ✅ | ✅ | |
| content | `title` | Aliases | special | static(aliased/unaliased) | ✅ | ✅ | ✅(firstLetter) | — | |

### 2-C. Books (Tier2 중간) — **Kind + Priority (D2 확정)**
| category | key | label | valueType | options | F | D | G | S | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| workflow | `kind` | Kind | enum | static(smart/manual/hybrid) | ✅ | ✅ | ✅ | — | status 없음 → Kind=board축 |
| workflow | `priority` | Priority | enum | static(5) | ✅ | ✅ | ✅ | — | **D2 확정: Kind+Priority** |
| workflow | `pinned` | Pin | boolean | static(2) | ✅ | ✅ | ✅ | — | |
| classification | `sourceType` | Smart source | enum | static(folder/category/tag/label/sticker/none) | ✅ | ✅ | — | — | |
| metrics | `itemCount` | Items | numberBucket | — | — | ✅ | — | ✅ | Book.items.length |
| time | `updatedAt`/`createdAt` | Updated/Created | dateBucket | buckets | ✅ | — | ✅ | ✅ | |
| content | `title` | Index | special | — | — | — | ✅(firstLetter) | ✅ | |

---

## 3. 어댑터 (PropertyDef[] → 기존 출력 타입)

목표: **drop-in.** 출력 = 기존 `FilterCategory[]`/`DisplayConfig` 모양 그대로 → 소비 컴포넌트 변경 0.

```ts
// lib/view-engine/schema/adapter.ts (신규)
export type HydratorMap = Partial<Record<HydratorKey, () => PropertyOption[]>>

export function toFilterCategories(schema: EntitySchema, hydrators?: HydratorMap): FilterCategory[]
export function toDisplayConfig(schema: EntitySchema): DisplayConfig
export function toViewConfig(schema: EntitySchema, hydrators?: HydratorMap): ViewConfig
```

**로직 개요**:
```
toFilterCategories: for prop where isFilterable:
  values = enum/boolean → options.values
           entityRef    → hydrators[prop.options.hydratorKey]?.() ?? []
           date/numberBucket → buckets.map(b → {key, label, group})
  push { key, label, labelKey, icon, values }
  # category 순서(workflow→...→content) = divider 의미 그룹 (A3.3)

toDisplayConfig:
  ordering = props.filter(isSortable).map(p → {value: p.sortField ?? p.key, label, modes: p.sortModes})
  grouping = [{value:"none", label}, ...props.filter(isGroupable).map(p → {value: p.groupBy ?? p.key, ...}),
              ...viewDefaults.extraGroupings]
  properties = props.filter(isDisplayable).map(p → {key: p.columnKey ?? p.key, label, icon, modes: p.displayModes})
  return { orderingOptions, groupingOptions, properties, toggles: viewDefaults.toggles, ...viewDefaults }
```

**동등성 보장 = 안전망**: `toViewConfig(NOTES_SCHEMA)` === 기존 `NOTES_VIEW_CONFIG`를 스냅샷 테스트로 증명 후에만 스왑. icon은 ReactNode라 **icon 제외 구조 비교** + icon은 존재 여부만 (D4).

---

## 4. 마이그레이션 단계

| 단계 | 작업 | 리스크 | 롤백 |
|---|---|---|---|
| **M0** | `schema/` + PropertyDef/EntitySchema 타입 + 어댑터 (소비처 연결 X) | **0** | 파일 삭제 |
| **M1** | `NOTES_SCHEMA` + `toViewConfig` 결과 == 기존 동등성 스냅샷 테스트 (연결 X) | 낮음 | 테스트 삭제 |
| **M2** | `NOTES_VIEW_CONFIG = toViewConfig(NOTES_SCHEMA, ...)` **교체**. notes-table useMemo → HydratorMap 리팩 | 중간 | revert 1커밋(export 1줄) |
| **M3** | Wiki → `WIKI_SCHEMA` (M1+M2 반복) | 중간 | 동일 |
| **M4** | Books → `BOOKS_SCHEMA` | 낮음 | 동일 |
| **M5** | (A3.3) `filter-bar.tsx` `FilterMenuItems` 레거시 제거/스키마화 | 낮음(죽은코드) | — |

**공존 전략**: M0~M1 기존 config 100% 유지(병렬 진실). M2 = export 1줄 스왑. 엔티티 독립(부분 실패 격리). **Library/Tags/Files/Stickers/Templates/Calendar/Inbox/Graph는 스키마화 안 함**(Tier3 경량 = 손작성 유지).

**검증 게이트(M2~M4)**: ①`npm run build` tsc 0 ②어댑터 동등성 스냅샷 ③store-eval filter/group/sort 동작 ④사용자 실화면 1회(필터 드롭다운 카테고리/값/카운트 정합).

---

## 5. 파일 구조

```
lib/view-engine/
├── types.ts                # 기존 union — 불변
├── view-configs.tsx        # 점진적 toViewConfig 호출로 대체 (Tier3 잔류)
└── schema/                 # ★ 신규
    ├── property-def.ts     # 타입 + 능력 플래그
    ├── adapter.ts          # toFilterCategories/toDisplayConfig/toViewConfig
    ├── hydrators.ts        # HydratorKey/HydratorMap
    ├── icons.tsx           # PropertyDef 아이콘 (view-configs에서 이관, priority bar A4도 여기)
    ├── entities/{notes,wiki,books}.schema.tsx
    └── __tests__/adapter-equivalence.test.ts
```
`.tsx` 필수(icon = JSX).

---

## 6. 결정 사항 & 특수 케이스

| ID | 사안 | 결론 |
|---|---|---|
| **D1** | quickFilters/viewDefaults 스키마화? | **외부 동거** — 뷰 단위라 property에 안 맞음. 기존 타입 그대로. |
| **D2** | Wiki/Books priority | **✅ 확정: Wiki✅ / Books=Kind+Priority** (사용자 승인). spec 라인75 폐기. |
| **D3** | family/role/firstLetter (group-only) | `viewDefaults.extraGroupings`로 보존. |
| **D4** | 어댑터 동등성 테스트 icon 비교 | icon 제외 구조 비교 + icon 존재 여부만. |
| **D5** | dynamic 옵션 주입 | **HydratorMap 콜백 주입**(뷰가 useMemo 제공) — notes-table:889 패턴과 동형, store 결합 0. |
| **D6** | i18n labelKey | 기존 `labelKey`+`t()` 그대로. 변경 0. |
| **D7** | 폰트 | **A3.2와 무관**(폰트=Pretendard 별도 적용 완료). |

**특수 케이스 수용**:
- **QuickFilter**: 컨테이너 `quickFilters` 동거(스키마화 X).
- **connectedTo**: `valueType:"special"` PropertyDef, 런타임 chip(어댑터 values 생성 X), isFilterable만.
- **family grouping**: extraGroupings(D3).
- **Ontology Status sub-group**: `PropertyOption.group` → 어댑터가 `FilterValue.group` 패스스루.
- **isSingleStatusTab status 숨김**(notes-table:909): 어댑터 출력 후 뷰가 `.filter()` — **어댑터 외부 처리 유지**(스키마=전체 정의, 컨텍스트 필터링=소비처).
- **mode-aware modes**: PropertyDef.{group,display}Modes로 1:1. DisplayPanel 변경 0.

**잔여 리스크**:
- **Graph(Ontology) 스키마화 안 함** — status entity별 sub-group + hullEntity 동적 = Tier 모델 밖. 손작성 유지.
- **filter.ts 동기화**: PropertyDef.key가 실행 case와 안 맞으면 "보이는데 동작 안 함". → key는 반드시 기존 `FilterField` union(타입 강제). 새 축은 filter.ts case 동반 추가(스키마 단독으론 실행 안 생김 = 안전장치).

---

## 한 줄 요약
**리빌드 아님 = config 생성의 역전.** 출력 계약 불변 / 소비 컴포넌트 0 수정 / export 1줄 스왑으로 엔티티 독립 마이그·롤백. `PropertyDef[]` 1개가 filter/display/group/sort 4중복을 단일 진실로 모으고, 어댑터 동등성 스냅샷 테스트가 안전망.
