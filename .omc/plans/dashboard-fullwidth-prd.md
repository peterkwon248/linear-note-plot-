# Dashboard Full-Width Redesign PRD

**Date**: 2026-05-25
**Status**: DRAFT v0.1
**Trigger**: P0 #2 + 사용자 보고 + Path A 다음 작업

## §0 Context

### 사용자 인용 (영구)

> "온톨로지의 인사이트와 대시보드는 좌우 여백이 넓지? 너무 문자가 많고 빽빽해서 한 눈에 안 들어오는데. 차트와 그래프가 더 많아질 순 없나?"

### 진단

| 페이지 | 현재 max-width | 성격 | 정통 |
|---|---|---|---|
| Home | 없음 (풀 폭) | Dashboard | ✅ |
| Ontology Dashboard | `max-w-4xl mx-auto` (~896px) | Dashboard | ❌ |
| Ontology Insights | `max-w-[640px] mx-auto` (~640px) | Dashboard | ❌ |
| Wiki Overview | `max-w-5xl mx-auto` (~1024px) | Dashboard | ❌ |
| Library Overview | `max-w-5xl mx-auto` (~1024px) | Dashboard | ❌ |

한 앱 안 dashboard 폭 일관성 0. Home만 풀 폭, 나머지는 좁음. 모순.

## §1 Goal

Dashboard / Overview 성격의 모든 페이지 = **풀 폭 (px-6, max-width 없음)** 정통화 + Ontology Dashboard에 차트 7-8개 추가.

## §2 Scope

### In
- 4 page 폭 정통화 (max-width 제거)
- Ontology Dashboard 차트 7-8개 추가 (Mosaic layout)
- Insights sidebar/본문 stats 중복 정리

### Out
- 노트/위키 article 본문 폭 변경 (기존 max-width 유지)
- Settings 페이지 폭 변경 (기존 유지)
- Dashboard 데이터 source 변경 (기존 hook 그대로)

## §3 LOCKED 영구 룰 #136

**Two-Layout Rule** (Plot 전체에 영구 적용):

```
1. Dashboard / Overview = 풀 폭 (px-6 + max-width 없음)
   적용: Home / Ontology Dashboard / Ontology Insights /
         Wiki Overview / Library Overview / (향후 모든 dashboard 성격)

2. Article 본문 = max-width 유지 (기존 패턴)
   적용: Note body / Wiki article body / Book review

3. Settings = max-width 유지 (기존 패턴)

4. 차트 = ResizeObserver + useRef (WikiInsightsChart 패턴)
   ResponsiveContainer 금지 (React 19 width-0 issue)

5. Dashboard 차트 layout = Mosaic (시각 위계 차등)
   KPI row → Hero chart → Detail grid → Health row
```

## §4 Chunk 분할

### Chunk 1 — 폭 정통화 (작음, ~10분, low risk)

4 file Edit:
- `components/ontology/ontology-dashboard-panel.tsx:81` — `max-w-4xl mx-auto` 제거
- `components/ontology/ontology-insights-panel.tsx:29` — `max-w-[640px] mx-auto` 제거
- `components/views/wiki-dashboard.tsx:99` — `max-w-5xl mx-auto` 제거
- `components/views/library-view.tsx:844` — `max-w-5xl mx-auto` 제거

모두 `px-6 py-6` 유지 (24px outer padding). 카드/grid는 그대로.

### Chunk 2 — Ontology Dashboard 차트 추가 (큼, ~60분+, PRD critic 권장)

Mosaic layout:

```
[KPI row: Notes / Wiki / Books / Edges / Density / Avg links]
[Hero chart: 주간 활동 area chart, 가로 폭]
[Detail grid: Stone/Brick/Block donut · Top Hubs bar · Categories bar · Stub/Article donut]
[Health row: Orphans / Untagged / Coverage]
```

신규 component:
- `components/ontology/charts/status-donut.tsx`
- `components/ontology/charts/weekly-activity-chart.tsx`
- `components/ontology/charts/top-hubs-bar.tsx`
- `components/ontology/charts/categories-bar.tsx`
- `components/ontology/charts/wiki-status-donut.tsx`

기술 패턴: `WikiInsightsChart`의 useRef + ResizeObserver 그대로.

### Chunk 3 — Insights 중복 정리 (선택, ~20분)

`OntologyInsightsPanel`의 좌측 sidebar stats vs 본문 OVERVIEW 중복.

옵션:
- A. sidebar stats 제거, 본문 OVERVIEW만 유지
- B. sidebar 더 강조, 본문 OVERVIEW 제거
- C. (추천) sidebar는 nav (Graph/Insights/Dashboard)만, stats는 본문 KPI에 통합

### Chunk 4 — Wiki/Library Overview 차트 추가 (선택, ~30분+)

Chunk 2 패턴 일관 적용. 각 entity 적합한 차트.

## §5 Open Questions

1. **Chunk 2 차트 priority**: 사용자 명시 7-8개 모두? 또는 5-6개 핵심?
2. **Health row 위치**: 맨 아래 (vision 패턴) vs 맨 위 KPI (이슈 우선 인지)?
3. **Hero chart 종류**: 주간 활동 line vs area vs bar? — area 추천 (시각 임팩트)
4. **Critic 검토**: chunk 2 시작 전 critic agent review?

## §6 Verification

- tsc clean
- Preview screenshot — 4 페이지 풀 폭 확인
- Mobile/narrow viewport — 풀 폭이 너무 raw 안 되는지 (px-6 충분)
- Sidebar collapsed/expanded — 자동 폭 조절 확인
- 차트 ResizeObserver — 사이드바 토글 시 차트 폭 갱신

## §7 다음 단계

**즉시**: Chunk 1 (폭 정통화) 진행. 작고 low-risk, 빠른 win.

**Chunk 2 전**: critic agent review (Mosaic layout + 차트 priority 검증).

**Chunk 3+4**: 사용자 viewport 후 결정.
