# Ontology Graph Redesign PRD

**작성일:** 2026-05-01
**상태:** DRAFT — User 검토 필요
**범위:** Plot Ontology Graph view 시각/동작 재설계
**작업 시간:** 3.5시간 (Phase 1~4) / 5.5시간 (Phase 5 포함)

---

## 1. 목적 & 배경

### 한 줄 요약
**현재 graph view는 노드가 너무 작게 보이고, 60+개의 휴리스틱 매직넘버가 코드 전반에 흩어져 있어 튜닝/유지보수가 불가능한 상태이다.**

### 재설계 동기
1. **시각적 식별성 부족**: 노드 5~10개의 작은 그래프에서 fit-to-view 후 노드가 점에 가까운 크기로 보임 (radius 10~22px이지만 scale 0.4 floor에 곱해지면 시각적으로 4~9px). Plot의 "팔란티어 × 제텔카스텐" 컨셉상 그래프는 시그니처 뷰여야 한다.
2. **휴리스틱 자기 표절**: `lib/graph.ts:50~53`에서 nodeCount 100/30/15 4단 분기, `nodeRadius` 10+2*conn, MIN_SCALE 0.05, FIT_MIN_SCALE 0.4, scale 0.3/0.7 LOD 등 출처 없는 숫자가 코드 전반에 박혀있다.
3. **레퍼런스 부재**: Obsidian, d3-force, vasturiano(force-graph) 등 검증된 디폴트와 비교한 적이 없다. 자체 fine-tuning만 반복.
4. **테마 가시성 부분만 해결**: 라이트모드 fillOpacity 0.33 분기는 추가됐지만 시스템 차원에서 일관성이 없음.

### 본 PRD가 다루는 범위
- Force simulation 파라미터 외부화 + 레퍼런스 기반 재튜닝
- Initial fit-to-view 정책 재설계 (소규모 그래프 = 노드 큼직하게)
- Node sizing formula 교체 (sqrt 기반)
- LOD 임계값 재조정 (Obsidian textFadeMultiplier 패턴)
- Magic number → 단일 config 파일로 통합
- 라이트/다크모드 가시성 정책 일관화
- 부채 정리 (dead code, `any` 캐스팅, minimap 필터 불일치)

### 본 PRD가 다루지 않는 범위 (Out of Scope)
- WebGL 렌더러 도입 (현재 SVG로 충분, 200+ 노드는 cap)
- Time-travel / 그래프 히스토리 재생
- Property graph (Cypher-like) 쿼리 시스템
- Saved graph layouts (multiple named layouts)
- 그래프 export (PNG/SVG/JSON)
- 노드 ↔ 노드 직접 엣지 만들기 UI

---

## 2. 현재 상태 분석 (Audit 요약)

### 2.1 Magic Number 인벤토리 (50+개)

| 위치 | 상수 | 현재값 | 분류 |
|------|------|--------|------|
| `lib/graph.ts:50` | chargeStrength | -80/-120/-180/-250 | force |
| `lib/graph.ts:51` | linkDistance | 40/50/60/80 | force |
| `lib/graph.ts:52` | collisionRadius | 20/25/30 | force |
| `lib/graph.ts:53` | ticks | nodeCount * 4 (120~300) | force |
| `lib/graph.ts:164` | tagUsageCount min | 5 | data filter |
| `canvas.tsx:75~79` | MIN_SCALE / MAX_SCALE / ZOOM_STEP / LABEL_TRUNCATE / MAX_VISIBLE_NODES | 0.05 / 3.0 / 0.15 / 18 / 200 | viewport |
| `canvas.tsx:184~186` | nodeRadius | 10 + conn*2, max 22 | sizing |
| `canvas.tsx:213` | FIT_MIN_SCALE | 0.4 | fit policy |
| `canvas.tsx:1064~1066` | LOD: showLabels / showEdgeLabels | scale ≥ 0.3 / > 0.7 | LOD |
| `canvas.tsx:1395, 1413, 1442` | dark/light fillOpacity | 0.08/0.33 등 | theme |
| `canvas.tsx:1758, 1822` | minimap selected color | rgba(94,106,210,*) (인라인) | minimap |
| `worker.ts:74` | clusterRadius | max(150, nodes * 3) | cluster |
| `worker.ts:100,104` | clusterX/Y strength | 0.15 | cluster |

### 2.2 가장 큰 부채 5가지

1. **`getNodeFill` dead branch** (`canvas.tsx:290~301`) — 분기 의미 없음
2. **`(node as any).nodeType` 캐스팅 3회** — 타입 안전성 깨짐
3. **`clusterHulls` memo가 ref에 의존** — React 패턴 위반
4. **미니맵 selected color 하드코딩** — 색상 시스템 누락
5. **미니맵 edges 필터 불일치** — `graph.edges` 전체 사용

### 2.3 잘 된 점 (보존)

- Web Worker 사전 layout (warm-start)
- graphFingerprint memo 기반 sim 재초기화
- Viewport culling (200+ 노드 perf)
- Node cap (top-N by connectionCount)
- Marquee + Multi-select + Group drag
- Persisted positions
- Cluster hulls (Catmull-Rom smooth)
- Parallel edge fan-out
- Status-pair gradient palette
- Theme-aware edge color

---

## 3. 업계 베스트 프랙티스 (Research 요약)

### 3.1 Reference Defaults

| 출처 | Force | Distance | Strength | Initial fit | Node sizing | LOD |
|------|-------|----------|----------|-------------|-------------|-----|
| **Obsidian Graph** | repel **16.41** | link **198** | link **0.44** | scale ≈ **0.396** | sqrt(degree) × **1.49** | textFadeMultiplier **-1.6** |
| **d3-force defaults** | manyBody **-30** | link **30** | link auto (= 1/√n) | warmupTicks 안 호출 | nodeRelSize **4** | - |
| **vasturiano/force-graph** | manyBody **-30** | link **30** | - | `cooldownTime 15000`, `zoomToFit(400, 10)` | sqrt(val) | dynamic LOD |

### 3.2 Adaptive 권장

| 노드 수 | manyBody | linkDistance | 렌더러 |
|---------|----------|--------------|--------|
| <50 | -30 ~ -100 | 30 ~ 80 | SVG |
| 50~300 | -100 ~ -300 | 80 ~ 150 | Canvas |
| 300~1000 | -200 ~ -500 | 50 ~ 100 | Canvas |
| 1000+ | - | - | WebGL |

---

## 4. 설계 원칙 (Design Principles)

1. **검증된 디폴트 우선** (Defaults Over Heuristics) — Obsidian/d3/vasturiano 검증값이 직접 튜닝보다 우선
2. **Adaptive by Node Count** — 4-tier (small <20, medium 20~80, large 80~200, xlarge 200+)
3. **Magic Number = Config 파일** — `lib/graph/ontology-graph-config.ts` 단일 파일
4. **Theme Visibility Symmetric** — 라이트/다크 동등 가시성, 단일 헬퍼로 캡슐화
5. **Preserve User State** — 드래그 위치, 줌 레벨 보존
6. **Linear-Level Polish** — 60fps at 200 nodes, 200ms 이하 transition

---

## 5. Spec — Concrete Numbers

### 5.1 Force Configuration

**신규 파일:** `lib/graph/ontology-graph-config.ts`

```ts
import { GRAPH_NODE_HEX, SPACE_COLORS } from "@/lib/colors"

export type SizeTier = "small" | "medium" | "large" | "xlarge"

export function classifyTier(nodeCount: number): SizeTier {
  if (nodeCount < 20) return "small"
  if (nodeCount < 80) return "medium"
  if (nodeCount < 200) return "large"
  return "xlarge"
}

export const FORCE_CONFIG = {
  small: {
    chargeStrength: -150,
    linkDistance: 120,
    linkStrength: 0.5,
    collisionPadding: 4,
    centerStrength: 0.5,
    distanceMax: undefined,
  },
  medium: {
    chargeStrength: -250,
    linkDistance: 80,
    linkStrength: 0.4,
    collisionPadding: 4,
    centerStrength: 0.4,
    distanceMax: undefined,
  },
  large: {
    chargeStrength: -400,
    linkDistance: 60,
    linkStrength: 0.3,
    collisionPadding: 3,
    centerStrength: 0.3,
    distanceMax: 600,
  },
  xlarge: {
    chargeStrength: -500,
    linkDistance: 50,
    linkStrength: 0.25,
    collisionPadding: 3,
    centerStrength: 0.3,
    distanceMax: 500,
  },
} as const

export const SIM_CONFIG = {
  alphaDecay: 0.03,
  velocityDecay: 0.4,
  alphaMin: 0.001,
  alphaInitial: 0.01,
  warmupTicks: 150,
  cooldownTime: 8000,
} as const

export const NODE_SIZE = {
  base: 4,
  multiplier: 2.5,
  min: 4,
  max: 20,
  shape: { note: 1.0, wiki: 1.15, tag: 0.55 },
} as const

export function nodeRadius(linkCount: number): number {
  const r = NODE_SIZE.base + NODE_SIZE.multiplier * Math.sqrt(linkCount)
  return Math.max(NODE_SIZE.min, Math.min(NODE_SIZE.max, r))
}

export const FIT_CONFIG = {
  small:  { padding: 60,  minScale: 1.0,  maxScale: 1.8 },
  medium: { padding: 50,  minScale: 0.7,  maxScale: 1.4 },
  large:  { padding: 40,  minScale: 0.5,  maxScale: 1.0 },
  xlarge: { padding: 30,  minScale: 0.35, maxScale: 0.8 },
  transitionMs: 400,
} as const

export const LOD = {
  nodeMinZoom: 0.15,
  labelFadeStart: 0.35,
  labelFadeEnd:   0.65,
  edgeLabelMinZoom: 0.7,
  edgeFadeStart:  0.10,
  edgeFadeEnd:    0.20,
} as const

export const VIEWPORT = {
  zoomMin: 0.05,
  zoomMax: 3.0,
  zoomStep: 0.15,
  panStep: 60,
  cullPadding: 60,
} as const

export const NODE_THEME = {
  dark: {
    fillOpacity: { note: 0.08, wiki: 0.07, tag: 0.10 },
    strokeWidth: { note: 1.3, wiki: 1.5, tag: 1.3 },
    labelOpacity: { default: 0.85, tag: 0.7, dimmed: 0.3 },
  },
  light: {
    fillOpacity: { note: 0.33, wiki: 0.33, tag: 0.33 },
    strokeWidth: { note: 1.8, wiki: 2.0, tag: 1.8 },
    labelOpacity: { default: 0.95, tag: 0.8, dimmed: 0.4 },
  },
} as const

export const HULL = {
  minNodes: 3,
  padding: 30,
  fillOpacity: 0.04,
  strokeOpacity: 0.12,
  strokeWidth: 1,
  smoothingTension: 0.3,
} as const

export const TAG_NODE_MIN_USAGE = 5
export const MAX_VISIBLE_NODES = 200

export const MINIMAP = {
  width: 200,
  height: 130,
  padding: 20,
  viewportExpand: 2.5,
  selectedColor: SPACE_COLORS.home,
  selectedColorAlpha: 0.85,
  bgFillDark:  "rgba(0, 0, 0, 0.5)",
  bgFillLight: "rgba(255, 255, 255, 0.5)",
  edgeStrokeDark:  "rgba(255, 255, 255, 0.1)",
  edgeStrokeLight: "rgba(30, 41, 59, 0.2)",
  outsideDimDark:  "rgba(0, 0, 0, 0.3)",
  outsideDimLight: "rgba(255, 255, 255, 0.4)",
  nodeAlphaDefault: 0.75,
  nodeAlphaSelected: 1.0,
  nodeFillAlphaMul: 0.15,
  borderWidth: 1.5,
} as const

export const CLUSTER_LAYOUT = {
  minLabelsForClustering: 2,
  baseRadius: 150,
  perNodeMultiplier: 3,
  forceStrength: 0.15,
} as const
```

### 5.2 Initial View Policy

| Tier | Padding | minScale | maxScale | 의도 |
|------|---------|----------|----------|------|
| small (<20) | 60 | **1.0** | 1.8 | 노드 실제 픽셀 크기로 (radius 4~20px 그대로) |
| medium (20~80) | 50 | 0.7 | 1.4 | 라벨은 보임 (LOD 0.35 ↑) |
| large (80~200) | 40 | 0.5 | 1.0 | LOD 라벨 fade 시작 |
| xlarge (200+) | 30 | 0.35 | 0.8 | 전체 토폴로지 |

**현재 vs. 목표:**
- 현재: `FIT_MIN_SCALE = 0.4` 고정 → 노드 5개여도 0.4까지 zoom out → radius 22px × 0.4 = **8.8px**
- 목표: small tier minScale 1.0 → radius 20px × 1.0 = **20px** → **2.3배 크게**

### 5.3 Node Sizing

```ts
// 현재: radius = Math.min(10 + conn*2, 22)
// 목표: radius = Math.max(4, Math.min(20, 4 + 2.5 * Math.sqrt(linkCount)))
```

| linkCount | 현재 | 목표 | 비고 |
|-----------|------|------|------|
| 0 | 10 | 4 | 고립 노드는 작게 (의도적) |
| 1 | 12 | 6.5 | |
| 4 | 18 | 9 | |
| 6 | 22 (cap) | 10 | |
| 16 | 22 | 14 | |
| 64 | 22 | 20 (cap) | |

**왜 작아지는데 더 잘 보이나?**
1. 동시에 fit minScale 1.0 → 픽셀 크기 보존
2. Hub vs leaf 노드 크기 차이가 명확 (현재는 6 conn 이상 모두 22px → 정보 압축)
3. sqrt 패턴: 면적 ∝ degree (인지에 자연스러움)

### 5.4 LOD (Level of Detail)

| 항목 | 현재 | 목표 | 패턴 |
|------|------|------|------|
| 노드 cull | scale < 0.05 | **scale < 0.15** | 0.05~0.15는 클러스터 헐만 |
| 노드 라벨 fade | binary at 0.3 | **smooth 0.35 → 0.65** | `opacity = clamp((s-0.35)/0.30, 0, 1)` |
| 엣지 라벨 | binary at 0.7 | scale ≥ 0.7 (유지) | 그대로 |
| 엣지 자체 fade | 항상 보임 | **scale 0.10 → 0.20 fade** | zoom-out에서 fade |
| 클러스터 헐 | 항상 보임 | 그대로 | zoom out anchor |

### 5.5 Camera & Animation

- **Initial fit:** CSS transition 400ms ease-out
- **Reset view:** 동일 400ms ease-out
- **Search → auto-center (옵션):** 매칭 1개일 때 center + zoom 1.5
- **Drag/pan/wheel zoom:** transition off (즉시 반응)

### 5.6 색상 정책

- SPACE_COLORS / ENTITY_COLORS 활용 (이미 도입)
- `NODE_THEME.{dark|light}` 단일 헬퍼로 분기 통합
- 미니맵 selected color → `SPACE_COLORS.home` import (인라인 hex 제거)

### 5.7 (선택) Layout Switcher

- Force / Hierarchical / Radial 토글
- Phase 5에 위치, 사용자 결정 보류 가능
- +2시간

---

## 6. 보존할 좋은 패턴

| 패턴 | 변경 |
|------|------|
| Web Worker layout | warmupTicks 150 고정 (현재 가변) |
| Viewport culling | `cullPadding` config 참조 |
| graphFingerprint memo | 그대로 |
| Multi-select + group drag | 그대로 |
| LOD 3단계 컨셉 | 임계값 재튜닝 |
| Cluster hulls | dependency array 수정 |
| Persisted positions | 그대로 |
| Marquee selection | 그대로 |
| Parallel edge fan-out | spreadFactor → config |
| Theme-aware edge style | 숫자 → config |

---

## 7. Out of Scope

- WebGL renderer
- Time-travel
- Property graph extension
- Cypher-like 쿼리
- Saved layouts (multiple named)
- Graph export
- 노드-노드 직접 엣지 UI
- 수동 cluster 정의
- 3D layout

---

## 8. 마이그레이션 / 구현 계획

### Phase 1 — Config 외부화 (1시간) — Refactor only

- **NEW:** `lib/graph/ontology-graph-config.ts` (모든 상수 + nodeRadius + classifyTier)
- **MOD:** `lib/graph.ts` (computeForceConfig 내부에서 FORCE_CONFIG 참조)
- **MOD:** `components/ontology/ontology-graph-canvas.tsx` (모든 magic constant → config)
- **MOD:** `lib/graph/ontology-layout-worker.ts` (74, 100, 104 → config)

**Verify:** `npm run build` 통과 + 시각적 변화 없음

### Phase 2 — Force 튜닝 + Initial Fit (1시간)

- `computeFitTransform` tier 분기 추가
- sim setup에 `linkStrength`, `centerStrength`, `distanceMax` 적용
- Worker는 `warmupTicks: 150` 고정

**Verify:** 노드 5개 → fit 후 radius ≥ 12px / 노드 100개 → 60fps / persisted positions warm-start

### Phase 3 — 노드 시각 + LOD (1시간)

- `nodeRadius` config 적용 (호출부는 그대로)
- LOD smooth fade 헬퍼 추가
- `NODE_THEME` 분기 통합 (`getNodeRenderProps` 헬퍼)
- Shape 비율 검증

**Verify:** 라이트모드 가시성 / smooth fade / 줌 0.05에서 클러스터 헐만 보임

### Phase 4 — 부채 정리 (30분)

- `getNodeFill` 제거
- `(node as any)` 캐스팅 제거 (3곳)
- `clusterHulls` memo dependency 수정
- 미니맵 selected color → `SPACE_COLORS.home`
- 미니맵 `edges={visibleEdges}` 동기화

**Verify:** `tsc --noEmit` / `as any` 0건 / 미니맵 필터 동기화

### Phase 5 — (선택) Layout Switcher (2시간)

- store에 `ontologyLayoutMode` 추가 + 마이그레이션 v76
- worker에 layout 분기
- UI: 3-button toggle

**User 결정 필요. 보류 가능.**

### 총 시간

| Phase | 시간 | 누적 |
|-------|------|------|
| 1. Config 외부화 | 1.0h | 1.0h |
| 2. Force + Fit | 1.0h | 2.0h |
| 3. 노드 + LOD | 1.0h | 3.0h |
| 4. 부채 정리 | 0.5h | 3.5h |
| 5. Layout Switcher (선택) | 2.0h | 5.5h |

---

## 9. 성공 지표

### 기능적 (Pass/Fail)

- [ ] 노드 5~10개 → fit 후 visible radius ≥ 12px
- [ ] 라이트모드 가시성 = 다크모드 수준
- [ ] 노드 100+ → 60fps
- [ ] Magic number 통합 (config 파일 1곳)
- [ ] Build/test 통과

### 정성적

- [ ] Hub vs leaf 노드 크기 차이 명확
- [ ] 줌 시 라벨 smooth fade
- [ ] 검색 시 자동 center (옵션)
- [ ] 미니맵 필터 동기화
- [ ] `as any` 0건

### 비기능적

- [ ] Initial layout latency ≤ 800ms
- [ ] Pan/zoom transition smooth (400ms)

---

## 10. 위험 / 트레이드오프

1. **노드 sizing 변경 위화감** → fit minScale 1.0으로 시각 크기 유지
2. **warmupTicks 150 고정으로 큰 그래프 수렴 부족** → MAX_VISIBLE_NODES 200 cap으로 거의 발생 안 함
3. **clusterHulls memo 제거 perf** → BFS + Graham scan O(n log n), n=200 < 5ms
4. **theme-aware 분기 누락** → 단일 헬퍼로 강제

---

## 11. Open Questions for User

### Q1. Phase 5 (Layout Switcher) 포함?
- (a) Phase 1~4만 (3.5h)
- (b) Phase 5 포함 (5.5h)
- **Oracle 권장:** (a). 사용자 피드백 후 별도 PR로.

### Q2. Search → Auto-center?
- (a) 매칭 1개일 때 자동 center + zoom 1.5
- (b) 현재처럼 dim만
- **Oracle 권장:** (a). 검색 1차 목적이 "찾기"이므로.

### Q3. clusterHulls 재계산 정책?
- (a) 매 렌더 재계산
- (b) sim 종료 후 1회
- (c) tick counter state로 명시 invalidate
- **Oracle 권장:** (a). n=200 기준 < 5ms.

### Q4. Tag node 출현 임계값?
- (a) 5 유지
- (b) 3
- (c) 사용자 설정
- **Oracle 권장:** (a) 유지.

### Q5. MAX_VISIBLE_NODES?
- (a) 200 유지
- (b) 300으로 상향
- **Oracle 권장:** (a).

### Q6. 기존 테스트 영향?
- `lib/graph.ts` unit test 존재 여부 확인 필요
- Phase 1 시작 전 grep으로 확인

### Q7. Persisted positions migration?
- Phase 5 진행 시 v75 → v76 (`ontologyLayoutMode` 추가)
- **Oracle 권장:** Phase 5 보류 시 마이그레이션 없음

---

## 부록 A — 파일 변경 매트릭스

| 파일 | P1 | P2 | P3 | P4 | P5 |
|------|----|----|----|----|----|
| `lib/graph/ontology-graph-config.ts` | NEW | - | - | - | MOD |
| `lib/graph.ts` | MOD | MOD | - | - | - |
| `components/ontology/ontology-graph-canvas.tsx` | MOD | MOD | MOD | MOD | MOD |
| `lib/graph/ontology-layout-worker.ts` | MOD | MOD | - | - | MOD |
| `lib/store/slices/ontology.ts` | - | - | - | - | MOD |
| `lib/store/migrate.ts` | - | - | - | - | MOD |
| `components/views/ontology-view.tsx` | - | - | - | - | MOD |
| `components/ontology/layout-switcher.tsx` | - | - | - | - | NEW |

---

**END OF PRD**
