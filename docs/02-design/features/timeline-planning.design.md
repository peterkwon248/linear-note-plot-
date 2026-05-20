---
template: design
feature: timeline-planning
project: Plot
date: 2026-05-20
status: Draft
plan: ../../01-plan/features/timeline-planning.plan.md
---

# Timeline View + Planning Layer — Design Document

> **Summary**: Wiki에 `"timeline"` display mode(view-engine `ViewMode` 레이어)를 신설하고, WikiArticle에 경량 `plannedDate` 필드를 추가한다. 과거 활동(createdAt/updatedAt)과 미래 계획(plannedDate)을 하나의 가로 시간축에 표시.
>
> **Project**: Plot (Next.js 16 / React 19 / Zustand 5 / Store v144)
> **Date**: 2026-05-20
> **Status**: Draft
> **Plan**: `docs/01-plan/features/timeline-planning.plan.md`

---

## 1. Overview

### 1.1 Design Goals

- Wiki 목록 화면에 **Timeline** display mode 추가 — List/Board/Gallery의 형제.
- WikiArticle에 **`plannedDate`** 경량 필드 신설 — "이 지식을 언제 키울 계획인가".
- Timeline = 과거(이미 만든 것) + 미래(계획한 것)를 **한 시간축**에. List/Board/Gallery가 구조적으로 못 하는 "장기 연속 조망 + 미래 표시"를 채운다.

### 1.2 Design Principles

- **view-engine 재활용** — Timeline은 신규 시스템이 아니라 기존 `ViewMode`에 끼는 한 모드. ordering/filter 컨트롤 재활용.
- **Gentle by default** — 기본 = 점(밀도). 수명막대 등은 토글("powerful when needed").
- **planning layer 동반 필수** — Timeline이 미래 마커를 못 그리면 "시각적 다양성"으로 전락. planning과 한 몸.
- **최소 침습** — 기존 Wiki 모드(dashboard/list/merge/split) 미변경. 신규 모드로만 추가.

---

## 2. Architecture

### 2.1 두 레이어 구조 — Timeline이 끼는 위치

```
Wiki space → components/views/wiki-view.tsx
   │
   │  WikiViewMode  (external store, lib/wiki-view-mode.ts)
   ├─ "dashboard" → WikiDashboard
   ├─ "merge"     → WikiMergePage
   ├─ "split"     → WikiSplitPage
   └─ "list" ──┐
               │  wikiViewState.viewMode  (view-engine ViewMode)
               ├─ "list"      → WikiList
               ├─ "board"     → WikiBoard
               ├─ "gallery"   → GalleryView
               └─ "timeline"  → WikiTimelineView   ★ 신규
```

**핵심**: Timeline은 **`ViewMode` 레이어**(아래)에 들어간다 — `WikiViewMode`(위, external store) 아님.
근거(explore 조사): `WikiViewMode`에 추가하면 filter/display 패널이 연동 안 됨. `ViewMode`(`wikiViewState.viewMode`)에 넣어야 `DisplayPanel`이 모드 토글 버튼을 자동 렌더.

### 2.2 Data Flow

```
WikiArticle[] (store: wikiArticles)
  → applyWikiFilters / applyWikiSort  (lib/view-engine/wiki-list-pipeline.ts) ← 기존 재활용
  → sortedFilteredWikiNotes
  → WikiTimelineView
       ├─ X축: 시간 (연속, 줌)
       ├─ 각 article → createdAt 위치에 배치 (과거)
       ├─ plannedDate 있는 article → plannedDate 위치에 마커 (미래)
       └─ "now" 세로선 = 과거 | 미래 경계
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `WikiTimelineView` | `wiki-list-pipeline.ts` | 필터/정렬된 article 목록 |
| `WikiTimelineView` | `WikiArticle.createdAt/updatedAt/plannedDate` | 시간축 배치 |
| `wiki-view.tsx` | `WikiTimelineView` | `viewMode === "timeline"` 분기 렌더 |
| view-engine `types.ts` / `view-configs.tsx` | — | `"timeline"` ViewMode 등록 |
| plannedDate 설정 UI | `wiki-articles.ts` setter | `plannedDate` 갱신 |

---

## 3. Data Model

### 3.1 WikiArticle 확장

`lib/types.ts`의 `WikiArticle` 인터페이스(현재 약 458–517줄)에 **optional 필드 1개** 추가:

```typescript
interface WikiArticle {
  // ... 기존 필드 ...
  createdAt: string        // 기존 — Timeline 과거축 소스
  updatedAt: string        // 기존 — 수명막대 렌더 시 끝점
  plannedDate?: string | null   // ★ 신규 — 계획 작업 시각 (ISO date). 미설정 = undefined
}
```

- **타입**: `string | null` (ISO date). `undefined` = 계획 없음.
- **의도(intent) 라벨 미포함** — Open Question Q1 결정: 날짜만 (경량). 의도는 후속 Phase.
- WikiArticle에는 별도 `status` 저장 필드가 **없음** — stub/article은 파생 값(`isStub`, 콘텐츠 유무 기반). 본 설계는 status 필드에 의존하지 않음.

### 3.2 Migration

- `plannedDate?`는 **순수 additive optional 필드** → 기존 persist 데이터는 자연히 `undefined`로 읽힘.
- **마이그레이션 함수 불필요, persist version bump 불필요** (v144 유지). 데이터 변환이 없으므로.
- 구현 단계에서 별도 이유 발견 시에만 재검토.

### 3.3 Store setter

`lib/store/slices/wiki-articles.ts`에 `setWikiArticlePlannedDate(id, date | null)` 추가 (기존 update 패턴 정합).

---

## 4. API Specification

**N/A** — Plot은 로컬 IDB(Zustand persist) 기반. 서버/외부 API 없음.

---

## 5. UI/UX Design

### 5.1 Timeline 화면 레이아웃

> **사용자 확정 (2026-05-20)**: Timeline은 콘텐츠 영역 **전체를 채우는 행 기반 뷰** — 얇은 띠 X. 첫 구현(dots-on-strip + collision-stacking)은 거부됨.

```
┌──────────────────────────────────────────────────┐
│ (좌측 라벨)      │ ◀ May 2026 ▶     [Dots│Bars][WMQY]│  헤더
│                 │──May12──May19──│now│──May26──────│  시간축
├─────────────────┼─────────────────────────────────┤
│ Article A 제목   │        ●                   ┊     │  레인 1
│ Article B 제목   │              ●              ┊     │  레인 2
│ Article C 제목   │                       ●     ┊     │  레인 3
│  …              │                            ┊     │  (grid·now선 풀하이트)
└─────────────────┴─────────────────────────────────┘
```

- **풀하이트**: 컴포넌트가 콘텐츠 영역 **전체 높이**를 채움. 시간축 + 세로 grid선 + "now" 선 + 배경이 화면 바닥까지 — article이 적어도 화면 전체가 타임라인 그리드로 보임.
- **행 기반**: 각 WikiArticle = 가로 레인 1줄, 위에서부터 세로로 쌓임 (collision-stacking 폐기).
- **좌측 라벨**: 각 레인 좌측에 article 제목 (Gantt 행 라벨 스타일, ~160–200px, truncate).
- **레인 안 렌더**: Dots = `createdAt` 위치 점(stub=hollow / article=filled). Bars = `createdAt`→`updatedAt` 막대.
- **미래 영역** (Stage 2): `plannedDate` 있는 article은 해당 레인 안 미래 위치에 마커. overdue(plannedDate < now)는 amber 강조 (Q3 — 시각 처리만, Inbox 연동 X).
- **클릭**: 점/막대 클릭 → 해당 article 열기. article 많으면 세로 스크롤.

### 5.2 컨트롤

| 컨트롤 | 동작 | 출처 |
|--------|------|------|
| **줌** | 주 / 월 / 분기 / 년 (기본 **월**) | Timeline 자체 (Q4 결정) |
| **렌더 토글** | 점(●, 기본) ↔ 수명막대(createdAt→updatedAt) | Timeline displayProp (A/B 렌즈) |
| **Filter** | stub/article 등 | 기존 view-engine filter 재활용 |
| **◀ ▶ 네비** | 보이는 기간 이동 | Timeline 자체 |

### 5.3 plannedDate 설정 UI

- **Wiki article detail 패널**: "Plan" 항목 (날짜 picker) — 설정/해제.
- **우클릭 컨텍스트 메뉴**: "Plan for…" → 날짜 선택.
- 둘 다 `setWikiArticlePlannedDate` 호출.

### 5.4 Component List

| Component | Location | 책임 |
|-----------|----------|------|
| `WikiTimelineView` | `components/views/wiki-timeline-view.tsx` (신규) | Timeline 전체 렌더 — 축/줌/점·막대/마커 |
| `wiki-view.tsx` | 기존 | `viewMode === "timeline"` 분기 추가 |
| plannedDate picker | Wiki detail 패널 / 컨텍스트 메뉴 (기존 파일) | `plannedDate` 설정 |

`WikiTimelineView` props 계약 (WikiBoard/WikiList 시그니처 정합):

```typescript
interface WikiTimelineViewProps {
  articles: WikiArticle[]          // sortedFilteredWikiNotes
  viewState: ViewState             // wikiViewState
  selectedIds: Set<string>
  activeArticleId: string | null
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { ... }) => void
  onUpdateViewState: (patch: Partial<ViewState>) => void
}
```

---

## 6. Error Handling

- `plannedDate` 파싱 — 잘못된 날짜 문자열 방어 (`Number.isNaN(new Date(x).getTime())` guard).
- 빈 article 목록 — Timeline empty state ("아직 표시할 항목이 없습니다").
- 모든 날짜 lookup null guard (Plot 영구 룰).

---

## 7. Security Considerations

**N/A** — 로컬 전용, 외부 입력/네트워크 없음.

---

## 8. Test Plan

| Type | Target | Tool |
|------|--------|------|
| 빌드 검증 | `npm run build` + `tsc --noEmit` | 의무 |
| 수동 스모크 | Timeline 모드 선택 / 줌 / plannedDate 설정·표시 / 기존 4모드 무영향 | 사용자 |

핵심 케이스:
- [ ] Wiki Display 패널에 "Timeline" 토글 노출 + 선택 가능
- [ ] article이 createdAt 위치에 표시
- [ ] plannedDate 설정 → 미래 영역 마커 표시
- [ ] overdue plannedDate → amber 처리
- [ ] 점 ↔ 수명막대 토글
- [ ] 줌 주/월/분기/년 전환
- [ ] 기존 dashboard/list/merge/split/board/gallery 무영향

---

## 9. Architecture Fit (Plot 구조 정합)

Plot은 generic 레이어 구조 대신 다음을 사용 — 본 기능 배치:

| 구분 | 위치 |
|------|------|
| 타입 | `lib/types.ts` (`WikiArticle.plannedDate`), `lib/view-engine/types.ts` (`ViewMode`) |
| view-engine | `lib/view-engine/view-configs.tsx` (supportedModes) |
| store | `lib/store/slices/wiki-articles.ts` (setter) |
| 컴포넌트 | `components/views/wiki-timeline-view.tsx` (신규), `components/views/wiki-view.tsx` (분기) |

영구 룰 준수: 신규 generic 추상화 없음 (Timeline은 Wiki 전용 컴포넌트로 thin하게. Notes/Books roll-out은 후속 Phase에서 별도 판단).

---

## 10. Coding Convention

`CLAUDE.md` 준수 — 파일 kebab-case, 컴포넌트 PascalCase, JSX conditional render parens 의무, lookup map null guard 의무. 신규 컨벤션 없음.

---

## 11. Implementation Guide

### 11.1 영향 파일

```
lib/types.ts                          — WikiArticle.plannedDate? 추가
lib/view-engine/types.ts              — ViewMode union에 "timeline" 추가
lib/view-engine/view-configs.tsx      — WIKI_VIEW_CONFIG.displayConfig.supportedModes에 "timeline"
lib/store/slices/wiki-articles.ts     — setWikiArticlePlannedDate setter
components/views/wiki-timeline-view.tsx — 신규 Timeline 컴포넌트
components/views/wiki-view.tsx        — viewMode === "timeline" 분기 (list 모드 else 블록 내)
(Wiki detail 패널 / 컨텍스트 메뉴)     — plannedDate picker UI
```

### 11.2 Implementation Order

1. [ ] **데이터 모델** — `WikiArticle.plannedDate?` + `setWikiArticlePlannedDate` setter
2. [ ] **view-engine 등록** — `ViewMode += "timeline"` + `WIKI_VIEW_CONFIG.supportedModes += "timeline"` (→ DisplayPanel 토글 자동 생성)
3. [ ] **WikiTimelineView 컴포넌트** — 시간축 / 줌 / 점·막대 / now선 / plannedDate 마커
4. [ ] **wiki-view.tsx 분기** — `viewMode === "timeline"` → `<WikiTimelineView>`
5. [ ] **plannedDate 설정 UI** — detail 패널 날짜 picker + 우클릭 메뉴
6. [ ] 빌드/타입 검증 + 수동 스모크

각 단계는 독립 검증 가능 — 1~2 완료 시 빈 Timeline 토글이 뜨고, 3~4에서 렌더, 5에서 미래 마커 활성화.

---

## Open Questions — 해소 결과

| # | 질문 | 결정 |
|---|------|------|
| Q1 | `plannedDate` 날짜만 vs 날짜+의도 | **날짜만** (경량). 의도 라벨은 후속 Phase |
| Q2 | Timeline 기본 렌즈 | **점(밀도)** 기본 + 수명막대 토글 |
| Q3 | overdue plannedDate 처리 | Phase 1 = **시각 처리만**(amber 마커). Inbox 연동은 Task #2 영역, out of scope |
| Q4 | 줌 레벨 | **주 / 월 / 분기 / 년**, 기본 **월** |

## 후속 확인 필요 (구현 단계)

- `lib/store/slices/wiki-articles.ts`의 create/update에서 `entityEvents` populate 여부 — Phase 1 Timeline은 `createdAt`/`updatedAt` 직접 사용이라 비차단. 단 향후 C 렌즈(성숙 타임라인) 위해 확인 가치 있음.

---

## Next Steps

1. [ ] 사용자 / `design-validator` 리뷰
2. [ ] `/pdca do timeline-planning` — 구현 시작 (Implementation Order 따라)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | 초안 — view-engine 조사 기반 설계, Q1~Q4 해소 | Plot |
