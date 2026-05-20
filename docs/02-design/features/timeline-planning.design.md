---
template: design
feature: timeline-planning
project: Plot
date: 2026-05-20
status: Draft
plan: ../../01-plan/features/timeline-planning.plan.md
---

# Timeline View + Planning Layer — Design Document

> **Summary**: Wiki에 `"timeline"` display mode(view-engine `ViewMode` 레이어)를 신설하고, WikiArticle에 경량 `plannedDate` 필드를 추가한다. **bars-first** — 모든 article = 막대 1개 (`createdAt → horizon`). horizon = `plannedDate` 우선, fallback `updatedAt`. 과거 활동과 미래 계획을 하나의 가로 막대로 통합 (Stage 1/2 폐기). Reticle 포트폴리오 플래너 시각 구조 차용.
>
> **Project**: Plot (Next.js 16 / React 19 / Zustand 5 / Store v144)
> **Date**: 2026-05-20
> **Status**: Draft v0.2 (bars-first 전환)
> **Plan**: `docs/01-plan/features/timeline-planning.plan.md`

---

## 1. Overview

### 1.1 Design Goals

- Wiki 목록 화면에 **Timeline** display mode 추가 — List/Board/Gallery의 형제.
- WikiArticle에 **`plannedDate`** 경량 필드 신설 — "이 지식을 언제 키울 계획인가".
- Timeline = 과거(이미 만든 것) + 미래(계획한 것)를 **하나의 막대**로 통합 표시. List/Board/Gallery가 구조적으로 못 하는 "장기 연속 조망 + 미래 계획"을 채운다.

### 1.2 Design Principles

- **view-engine 재활용** — Timeline은 신규 시스템이 아니라 기존 `ViewMode`에 끼는 한 모드. ordering/filter 컨트롤 재활용.
- **bars-first** — 모든 article = 막대 1개. Dots/Bars 토글 폐기. 막대 = 범위 = planning. Reticle 포트폴리오 플래너 시각 구조 차용 (도메인 % 안 베낌).
- **미래/과거 시각 구분 ❌** — TODAY 세로선이 막대를 자연 가로지름 (Reticle 패턴). 점선·opacity 분리 없음.
- **planning layer 동반 필수** — Timeline이 미래 horizon을 못 그리면 단순 lifespan 시각화로 전락. planning UI와 한 PR로 출시.
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
       ├─ 각 article → 막대 1개: createdAt → horizon
       │       (horizon = plannedDate ?? updatedAt — §3.2)
       ├─ 막대 끝점에 상태 dot (stub hollow / article filled)
       └─ TODAY 세로선 (red bold, 막대 가로지름)
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

`lib/types.ts`의 `WikiArticle` 인터페이스에 **optional 필드 1개** 추가:

```typescript
interface WikiArticle {
  // ... 기존 필드 ...
  createdAt: string             // 기존 — 막대 시작점
  updatedAt: string             // 기존 — horizon fallback
  plannedDate?: string | null   // ★ 신규 — 계획 시각 (ISO date). undefined = 계획 없음
}
```

- **타입**: `string | null` (ISO date). `undefined` = 계획 없음.
- **의도(intent) 라벨 미포함** — Open Question Q1 결정: 날짜만 (경량). 의도는 후속 Phase.
- WikiArticle에는 별도 `status` 저장 필드가 **없음** — stub/article은 파생 값(`isStub`, 콘텐츠 유무 기반). 본 설계는 status 필드에 의존하지 않음.

### 3.2 Horizon 도출 규칙 (★ bars-first 핵심)

각 article의 막대 끝점(`horizon`) 도출:

```typescript
function getHorizon(article: WikiArticle): Date {
  const planned = safeDate(article.plannedDate)
  if (planned) return planned        // 의도 우선
  const updated = safeDate(article.updatedAt)
  if (updated) return updated        // 실제 활동 fallback
  return safeDate(article.createdAt)!  // 최후 fallback (≈0폭)
}
```

**핵심 결정 (Q1 D3)**: `plannedDate` **항상 우선**. `updatedAt > plannedDate`인 edge case에서도 horizon = `plannedDate` 유지.
- 근거: "의도가 horizon을 정의"가 planning 본질. updatedAt이 plannedDate를 넘었다는 사실은 별도 시각화(예: 막대 안 텍스트 색)로 표현 가능 — 본 Phase에선 시각화 안 함.

**막대 폭 도출**:
```typescript
const days = diffDays(horizon, createdAt)
const width = Math.max(days * pxPerDay, MIN_BAR_WIDTH)  // MIN_BAR_WIDTH = 24px
```

- **0폭 (createdAt = horizon, 무편집·미계획)** — 최소폭 24px bar로 fallback. 점 fallback 안 함 (bars-first 정체성 유지).

### 3.3 Migration

- `plannedDate?`는 **순수 additive optional 필드** → 기존 persist 데이터는 자연히 `undefined`로 읽힘.
- **마이그레이션 함수 불필요, persist version bump 불필요** (v144 유지). 데이터 변환이 없으므로.
- 구현 단계에서 별도 이유 발견 시에만 재검토.

### 3.4 Store setter

`lib/store/slices/wiki-articles.ts`에 `setWikiArticlePlannedDate(id, date | null)` 추가 (기존 update 패턴 정합).

```typescript
setWikiArticlePlannedDate(id: string, date: string | null): void
```

- `date = null` → `plannedDate` 해제 (`delete article.plannedDate` 또는 `undefined`).
- `date = ISO string` → 설정/덮어쓰기.
- `updatedAt` 갱신 안 함 (plannedDate 변경은 실제 콘텐츠 활동 아님 — 의도 변경만).

---

## 4. API Specification

**N/A** — Plot은 로컬 IDB(Zustand persist) 기반. 서버/외부 API 없음.

---

## 5. UI/UX Design

### 5.1 Timeline 화면 레이아웃 (Reticle 차용)

> **bars-first 전환 (2026-05-20)**: Reticle 포트폴리오 플래너 시각 구조 차용 — 모든 article = 단일 막대, 미래/과거 시각 구분 없음, TODAY 세로선이 자연 가로지름. 도메인(수익률 %·진행률 채움)은 안 베낌, 구조만.

```
┌────────────────────────────────────────────────────────────────┐
│ (좌측 라벨)        │ ◀ May 2026 ▶                  [W│M│Q│Y]   │  컨트롤 바
├────────────────────┼────────────────────────────────────────────┤
│                    │ Apr'26    May'26    Jun'26    Jul'26       │  시간축 헤더
├────────────────────┼────────────────────────────────────────────┤
│ ◐ Article A        │   ▰▰▰▰▰●                     │             │  bar + end dot
│   May 12           │                              │             │
│ ◑ Stub B           │            ▱▱▱▱●             │             │  hollow end dot
│   May 14           │                              │             │
│ ◐ Article C        │                 ▰▰▰▰▰▰▰▰▰▰▰▰●│             │  현재 가로지름
│   May 9            │                            TODAY            │
│ …                  │                              │             │
└────────────────────┴────────────────────────────────────────────┘
                                            (세로 빨간 굵은 선 + "TODAY")
```

- **풀하이트**: 컴포넌트가 콘텐츠 영역 전체 높이를 채움. 시간축 + grid + TODAY 선 + 배경이 화면 바닥까지.
- **행 기반**: 각 WikiArticle = 가로 레인 1줄. 위에서부터 세로 쌓임 (collision-stacking 폐기).
- **좌측 라벨 컬럼 (~180px)**: status icon + title (truncate) + created date 메타 (`May 12` 형식).
- **레인 안 = 막대 1개 + 끝점 dot**:
  - 막대 = `createdAt → horizon` (`horizon = plannedDate ?? updatedAt`).
  - 막대 색 = 상태 (stub `WIKI_STATUS_HEX.stub` amber / article `WIKI_STATUS_HEX.article` emerald).
  - 막대 끝점에 dot 마커: stub = hollow ring, article = filled circle.
- **미래/과거 시각 구분 ❌** — Reticle 패턴. TODAY 선이 막대를 자연 가로지를 뿐, fill·opacity 분리 없음.
- **클릭**: 막대 클릭 → article 열기. article 많으면 세로 스크롤.

### 5.2 막대 시각 스펙

| 속성 | 값 |
|------|-----|
| height | 24px |
| corner radius (`rx`) | 6 (rounded pill) |
| fill | `WIKI_STATUS_HEX.stub` 또는 `.article` (상태 색, solid) |
| 막대 안 텍스트 | article title, 흰색 `text-2xs`, left padding 8px, truncate |
| 텍스트 표시 임계값 | 막대 폭 ≥ 60px일 때만 (이하 hide) |
| 0폭 fallback | 최소폭 24px (정사각형 가까운 pill) |
| 끝점 dot | 16px, 막대 우측 끝 + 8px 오프셋 |
| dot fill (stub) | hollow (stroke만, fill `var(--background)`) |
| dot fill (article) | solid (상태 색) |
| 막대 hover/active | 외곽 ring (현재 dots 패턴 유지) |

### 5.3 TODAY 선

- **색**: red (예: `#ef4444` 또는 destructive 토큰) — Reticle 빨강 그대로.
- **stroke-width**: 2px (`solid`, dashed 폐기).
- **풀하이트**: 헤더 아래부터 footer 위까지.
- **라벨**: 상단 우측에 `TODAY` 텍스트 (작게, 같은 빨강).

### 5.4 컨트롤 바

| 컨트롤 | 동작 |
|--------|------|
| **◀ ▶ 네비** | 보이는 기간 이동 (60% step) |
| **Period 라벨** | 클릭 → Today로 점프 |
| **줌 토글** | Week / Month / Quarter / Year (기본 **Month**) |
| **Dots/Bars 토글** | ❌ **폐기** (bars only) |

### 5.5 plannedDate 설정 UI (이번 PR 포함)

- **Wiki article detail 패널**: "Plan" 항목 — 날짜 picker (clear 가능).
- **우클릭 컨텍스트 메뉴**: "Plan for…" → 날짜 선택.
- 둘 다 `setWikiArticlePlannedDate(id, date | null)` 호출.

### 5.6 Component List

| Component | Location | 책임 |
|-----------|----------|------|
| `WikiTimelineView` | `components/views/wiki-timeline-view.tsx` (재구현, 현 dots 코드 덮어쓰기) | bars-first 렌더 — 축/줌/막대/끝점/TODAY 선 |
| `wiki-view.tsx` | 기존 (`viewMode === "timeline"` 분기 이미 있음) | 변경 없음 |
| Plan picker | Wiki detail 패널 / 우클릭 메뉴 (기존 파일 확장) | `plannedDate` 설정 |

`WikiTimelineView` props 계약 (WikiBoard/WikiList 시그니처 정합):

```typescript
interface WikiTimelineViewProps {
  articles: WikiArticle[]          // sortedFilteredWikiNotes
  viewState: ViewState             // wikiViewState
  selectedIds: Set<string>
  activeArticleId: string | null
  onOpenArticle: (id: string) => void
  onSelect: (id: string, opts: { multi?: boolean; shift?: boolean; index?: number }) => void
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
lib/types.ts                                          — WikiArticle.plannedDate? 추가
lib/store/slices/wiki-articles.ts                     — setWikiArticlePlannedDate setter
components/views/wiki-timeline-view.tsx               — bars-first 재구현 (현 dots 코드 덮어쓰기)
components/wiki-editor/wiki-article-detail-panel.tsx  — Plan 날짜 picker UI (또는 정확한 detail 패널 위치)
components/wiki-editor/*-context-menu.tsx (해당 위치) — "Plan for…" 메뉴 항목
```

**이미 완료 (이전 세션 PR #390)**:
```
lib/view-engine/types.ts              — ViewMode "timeline" 등록 ✓
lib/view-engine/view-configs.tsx      — WIKI_VIEW_CONFIG.supportedModes "timeline" ✓
lib/view-engine/defaults.ts           — defaults ✓
lib/view-engine/display-panel.tsx     — DisplayPanel 토글 ✓
components/views/wiki-view.tsx        — viewMode === "timeline" 분기 ✓
```

### 11.2 Implementation Order (1 PR, 5 단계)

1. [ ] **데이터 모델** — `WikiArticle.plannedDate?: string | null` 필드 추가 (`lib/types.ts`) + `setWikiArticlePlannedDate(id, date | null)` setter (`lib/store/slices/wiki-articles.ts`). additive optional, migration 불필요.
2. [ ] **getHorizon() helper** — `WikiTimelineView` 안 또는 `lib/wiki-utils.ts`에 `getHorizon(article)` 함수. plannedDate ?? updatedAt ?? createdAt.
3. [ ] **WikiTimelineView 재구현** — 현 dots 코드 덮어쓰기. bars-first 풀-필 rounded rect (24px h, rx 6, 상태 색 solid) + 끝점 dot + TODAY 선 red bold solid + Dots/Bars 토글 제거. 줌·줌·네비·왼쪽 라벨 컬럼·풀하이트 인프라는 현 코드에서 재활용.
4. [ ] **Plan picker UI** — Wiki article detail 패널에 "Plan" 항목 (날짜 picker, clear 가능). 우클릭 메뉴 "Plan for…". 둘 다 `setWikiArticlePlannedDate` 호출.
5. [ ] **검증** — `npm run build` + `npx tsc --noEmit` clean + 수동 스모크 (Timeline 모드 선택 / plannedDate 설정 → 막대 horizon 갱신 / TODAY 선 가로지름 / 0폭 fallback / 기존 4모드 무영향) + Architect verification (의무).

**의존성 그래프**: 1 → 2 → 3 ─┐
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 → 4 ─┴→ 5

1단계 후 3·4는 병렬 가능. 단일 PR로 squash.

---

## Open Questions — 해소 결과 (v0.2 bars-first 갱신)

| # | 질문 | 결정 |
|---|------|------|
| Q1 | `plannedDate` 날짜만 vs 날짜+의도 | **날짜만** (경량). 의도 라벨은 후속 Phase |
| Q2 | Timeline 기본 렌즈 | ~~점(밀도) + 수명막대 토글~~ → **bars only** (Dots/Bars 토글 폐기, Reticle 패턴) |
| Q3 | overdue plannedDate 처리 | **시각 처리 없음** — `plannedDate` 항상 horizon. updatedAt이 넘어도 막대 horizon은 plannedDate. Inbox 연동은 Task #2 영역, out of scope |
| Q4 | 줌 레벨 | **주 / 월 / 분기 / 년**, 기본 **월** |
| **D1 (new)** | 막대 색 | **상태 색** (stub `WIKI_STATUS_HEX.stub` amber / article `.article` emerald) — Plot 정체성 정합. label/카테고리 색은 후속 옵션 |
| **D2 (new)** | 0폭 fallback (`createdAt = horizon`) | **최소폭 24px bar** + 같은 색. 점 fallback 안 함 (bars-first 정체성) |
| **D3 (new)** | horizon edge case (`updatedAt > plannedDate`) | **plannedDate 항상 우선** — 의도가 horizon 정의. 별도 시각 차별 없음 |
| **D4 (new)** | planning UI 동시 구현? | **같이** — 1 PR (store setter + detail 패널 picker + 우클릭). planning UI 없으면 막대 dogfood 불가 |
| **D5 (new)** | 왼쪽 컬럼 메타 | **created date** (`May 12` 형식). Reticle의 ±% 자리 |
| **D6 (new)** | 미래/과거 시각 구분 | **❌ 없음** — Reticle 패턴 (TODAY 선이 막대 자연 가로지름). 점선·opacity 분리 폐기 |
| **D7 (new)** | TODAY 선 스타일 | **red solid bold (2px)** + "TODAY" 라벨. dashed muted 폐기 |
| **D8 (new)** | 끝점 dot | **항상 표시** (과거든 미래든 horizon 끝). 상태 색. stub hollow / article filled |

## 후속 확인 필요 (구현 단계)

- `lib/store/slices/wiki-articles.ts`의 create/update에서 `entityEvents` populate 여부 — Phase 1 Timeline은 `createdAt`/`updatedAt`/`plannedDate` 직접 사용이라 비차단. 단 향후 C 렌즈(성숙 타임라인) 위해 확인 가치 있음.
- `setWikiArticlePlannedDate`가 `entityEvents`에 `planned_date_set` 이벤트 발화 여부 — Phase 1 시각화엔 불필요. Activity events 후속 작업과 연동 시 추가.
- Plan picker UI를 어떤 detail 패널에 끼울지 — `wiki-article-detail-panel.tsx` 또는 `side-panel-detail.tsx` 등 정확한 위치는 구현 단계에서 확정.

---

## Next Steps

1. [ ] 사용자 / `design-validator` 리뷰
2. [ ] `/pdca do timeline-planning` — 구현 시작 (Implementation Order 따라)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | 초안 — view-engine 조사 기반 설계, Q1~Q4 해소 (dots 기본 + bars 토글) | Plot |
| 0.2 | 2026-05-20 | **bars-first 전환** — Reticle 레퍼런스 비교 후 dots-only 약하다는 판단. 막대 = `createdAt → horizon` (plannedDate ?? updatedAt). 미래/과거 시각 구분 폐기 (Reticle 패턴). 끝점 상태 dot. TODAY 선 red bold. planning UI 동시 구현 (1 PR). D1~D8 결정 추가. §1.1·1.2·2.2·3·5·11 갱신. | Plot |
