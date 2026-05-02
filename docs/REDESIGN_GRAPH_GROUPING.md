# Graph Grouping Redesign — Group by 통합 PRD

**작성일:** 2026-05-02
**상태:** APPROVED — 같은 PR에서 즉시 구현
**PR 통합:** Sprint 2026-05-01 ~ 2026-05-02

---

## 1. 목적

> **Ontology 그래프의 hull(그물망)을 사용자가 만든 라벨/태그/카테고리/폴더와 직접 연동시킨다.**

기존: BFS connected component (자동, 사용자 의도 0%)
신규: Group by 시스템 (사용자가 라벨/태그 부여 → 그래프 hull 즉시 반영)

### 해결할 문제
1. **숨은 알고리즘**: 왜 묶였는지 사용자가 알 수 없음
2. **명시적 그룹 부재**: "이 묶음" 표현 방법 X
3. **노트 vs 위키 분리**: 두 entity를 같은 묶음으로 못 봄
4. **mental model 분열**: Notes 뷰는 Group by 있는데 Ontology만 다른 시스템
5. **라이트 모드 가시성**: hull이 거의 안 보임

### 핵심 통찰 (사용자 발화)
> "필터와 디스플레이의 노드 시각화 = 온톨로지의 그래프 아닌가?"

**맞음.** Ontology = Notes/Wiki와 같은 데이터의 그래프 시각화 모드일 뿐. 같은 view-engine 패턴(Filter + Display + Group by) 그대로 따라야 함.

---

## 2. 설계 원칙

1. **새 entity 만들지 않는다** — 라벨/태그/카테고리/폴더 활용
2. **사용자가 이미 아는 액션이 그래프에 닿게** — 라벨 부여 = 그래프 hull 멤버십
3. **Notes/Ontology Group by 옵션 동일** — 같은 컴포넌트, 같은 동작
4. **노트+위키 통합 그룹은 태그/폴더로** — 두 entity 공통 분류축
5. **Backward compat** — 기존 BFS는 "Connections (legacy)" 옵션으로 유지

---

## 3. 데이터 모델 변경 (Phase A)

### A1. WikiCategory에 color 추가

```ts
// lib/types.ts
export interface WikiCategory {
  id: string
  name: string
  parentIds: string[]
  description?: string
  color: string                  // NEW — hull 색
  createdAt: string
  updatedAt: string
}
```

### A2. Folder에 color + 위키 멤버십 확장

```ts
// lib/types.ts
export interface Folder {
  id: string
  name: string
  parentId: string | null
  color: string                  // NEW
  // ... 기타
}

// WikiArticle에 folderId 추가
export interface WikiArticle {
  // ... existing
  folderId?: string | null       // NEW — 위키도 폴더 멤버
}
```

### A3. Store v75 → v76 마이그레이션

- 기존 카테고리에 자동 색 할당 (palette 순환)
- 기존 폴더에 자동 색 할당
- 위키에 `folderId: null` default

---

## 4. Group by 시스템 (Phase B)

### B1. GRAPH_VIEW_CONFIG.displayConfig.groupingOptions

```ts
groupingOptions: [
  { value: "none",        label: "None" },
  { value: "tag",         label: "Tag" },           // 노트+위키 통합 가능
  { value: "label",       label: "Label" },          // 노트만
  { value: "category",    label: "Wiki Category" },  // 위키만
  { value: "folder",      label: "Folder" },         // 노트+위키 통합
  { value: "status",      label: "Status" },         // 노트만
  { value: "connections", label: "Connections (legacy)" }, // BFS 보존
]
```

### B2. Hull 로직 재작성

```ts
// components/ontology/ontology-graph-canvas.tsx
function computeGroupedHulls(groupBy: string, nodes, edges) {
  if (groupBy === "none") return []
  if (groupBy === "connections") return computeBfsHulls(nodes, edges)  // legacy

  // 신규: group key별로 노드 묶음
  const groups = new Map<string, Node[]>()
  for (const node of nodes) {
    const keys = getGroupKeys(node, groupBy)  // 다중 멤버십 가능
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(node)
    }
  }

  return Array.from(groups.entries())
    .filter(([_, members]) => members.length >= HULL.minNodes)
    .map(([key, members]) => ({
      id: `group-${groupBy}-${key}`,
      color: resolveGroupColor(groupBy, key),  // entity color
      path: smoothHullPath(expandHull(convexHull(members.map(getPos)))),
    }))
}
```

### B3. Hull 색 = group entity의 color

| Group by | Color source |
|----------|--------------|
| tag      | `tags.find(t => t.id === key).color` |
| label    | `labels.find(l => l.id === key).color` |
| category | `wikiCategories.find(c => c.id === key).color` (Phase A1 신규) |
| folder   | `folders.find(f => f.id === key).color` (Phase A2 신규) |
| status   | `STATUS_COLORS[key]` (이미 있음) |

---

## 5. UX 변경 (Phase C)

### C1. 카테고리/폴더 사이드바 색 dot + 우클릭 메뉴
- 라벨 사이드바와 동일 컴포넌트 패턴
- "Change color" 메뉴 항목

### C2. Hull 가시성 fix (light/dark 분리)

```ts
// lib/graph/ontology-graph-config.ts
export const HULL = {
  // ... existing
  fillOpacity:   { dark: 0.04, light: 0.10 },   // 0.04 → 0.10 in light
  strokeOpacity: { dark: 0.12, light: 0.30 },   // 0.12 → 0.30 in light
  strokeWidth:   { dark: 1,    light: 1.5 },
}
```

### C3. 위키 노드 가시성 boost (light)

```ts
// NODE_THEME.light.fillOpacity.wiki: 0.33 → 0.40
// NODE_THEME.light.strokeWidth.wiki: 2.0 → 2.2
// NODE_SIZE.shape.wiki: 1.15 → 1.25  (hexagon 약간 더 크게)
```

---

## 6. 사용자 시나리오

### 시나리오 1 — 일기 노트 묶기
1. 사이드바 라벨 `+` → 이름 "일기", 색 노랑
2. 일기 노트 30개에 라벨 부여
3. 그래프 → Display → Group by **Label**
4. 노란 hull 30개 노트 둘러쌈

### 시나리오 2 — 회사 프로젝트 (노트+위키)
1. 노트 50개 + 위키 3개 모두에 `#회사프로젝트` 태그
2. 그래프 → Display → Group by **Tag**
3. 한 hull에 노트 50 + 위키 3 통합

### 시나리오 3 — 폴더로 작업 컨텍스트
1. "Plot 디자인" 폴더 만들고 색 보라
2. 노트 + 위키를 폴더 안으로 (Phase A2 후 위키도 가능)
3. Group by **Folder** → 보라 hull

---

## 7. Backward Compat

- 기존 사용자 데이터 영향 X (마이그레이션 자동)
- 기존 그래프 보던 사용자: default Group by = "connections" (현재 동작 유지)
- 새 사용자: default Group by = "tag" 권장

---

## 8. 구현 순서 (이 PR 안)

| Phase | 시간 | 내용 |
|-------|------|------|
| A1 | 30m | WikiCategory.color |
| A2 | 1h  | Folder.color + WikiArticle.folderId |
| A3 | 1h  | v76 마이그레이션 |
| B1 | 30m | GRAPH_VIEW_CONFIG.groupingOptions |
| B2 | 2h  | Hull 로직 재작성 |
| B3 | 1h  | Hull 색 resolver |
| C1 | 1h  | 카테고리/폴더 색 UI (사이드바) |
| C2 | 30m | HULL light/dark + 위키 노드 boost |
| D  | 1h  | 빌드 + tsc + 시각 검증 |
| **합계** | **~9h** | |

(원래 추정 11~15h에서 압축 — 폴더 위키 멤버십 UI는 백엔드만 우선 + 다음 PR에서 입력 UI 마무리)

---

**END OF PRD**
