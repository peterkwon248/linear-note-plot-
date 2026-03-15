# Plot — 온톨로지 뷰 설계

참고: Palantir Foundry Ontology (https://www.palantir.com/docs/kr/foundry/ontology/)
실제 코드 기반: knowledge-map-canvas.tsx, graph.ts, slices/maps.ts
작성일: 2026-03-13

## 1. 온톨로지 뷰란 무엇인가

### 한 줄 정의

내 노트 전체의 의미적 관계망을 자동으로 탐색하는 공간

### 팔란티어 온톨로지에서 빌려온 개념

팔란티어는 온톨로지를 "세계의 분류. 디지털 에셋 위에 놓인 풍부한 의미적 레이어"로 정의한다.
핵심은 데이터(노트)가 단순 저장소가 아니라 의미와 관계를 가진 객체가 되는 것.

| 팔란티어 개념 | Plot 대응 |
|--------------|----------|
| 오브젝트 유형 | Label (메모, 리서치, 레퍼런스...) |
| 오브젝트 | 개별 Note |
| 속성 | title, tags, status, reviewAt... |
| 링크 유형 | Relations 타입 (refutes, extends, related) |
| 링크 | note_relations 테이블의 개별 레코드 |
| 오브젝트셋 | 필터링된 노트 묶음 (#투자 태그 노트들) |

## 2. WIKI와 온톨로지 뷰의 관계

둘은 다른 레이어다. 혼동하면 안 된다.

```
WIKI          → 콘텐츠 레이어  "무엇을 담고 있나"
온톨로지 뷰   → 탐색 레이어    "어떻게 연결되어 있나"
```

### WIKI
- status = 'reference'인 노트들의 집합
- 내용이 있음 (본문, 정의, 설명)
- 나무위키처럼 항목으로 탐색
- 예) "PER" 항목 → PER의 정의, 계산법, 내 생각

### 온톨로지 뷰
- 전체 노트(WIKI 포함 + 일반 노트)의 Relations + Backlinks 시각화
- 내용보다 구조를 보는 것
- 예) "PER" ──extends──→ "FCF 가치평가"

### 포함 관계

```
온톨로지 뷰에서 #투자 필터 걸면:
  → 일반 노트도 나오고
  → WIKI의 "PER", "가치투자" 항목도 같이 나온다

WIKI가 온톨로지의 일부로 포함되는 것. WIKI가 온톨로지가 되는 게 아님.
```

## 3. KnowledgeMap vs 온톨로지 뷰

### 한 줄 차이

```
KnowledgeMap  = 내가 고른 노트들의 위키링크 연결망  (수동 큐레이션)
온톨로지 뷰   = 전체 노트의 의미적 관계망           (자동 탐색)
```

### 실제 코드로 보는 차이

**KnowledgeMap (현재 구현)**
```ts
interface KnowledgeMap {
  noteIds: string[]   // 내가 직접 고른 노트 ID 목록
}

// 엣지 소스: 오직 [[위키링크]]만
function buildAdjacencyList(notes) {
  for (const linkTitle of note.linksOut) {
    adj.get(note.id).add(targetId)  // 타입 없음, 전부 동일
  }
}
```

**온톨로지 뷰 (새로 만들 것)**
```ts
// 엣지 소스: Relations + Backlinks 둘 다
const edges = [
  ...note_relations,    // 타입 있음 (refutes/extends/related)
  ...backlinks,         // 자동 수집, 타입 없음
]

// 노트 선별: 필터 기반 자동
const visibleNotes = notes.filter(n =>
  matchesTags(n, selectedTags) &&
  matchesLabel(n, selectedLabel)
)
```

### 7가지 차원 비교

| 차원 | KnowledgeMap | 온톨로지 뷰 |
|------|-------------|------------|
| 노트 선별 | 수동 (직접 추가) | 자동 (필터 기반) |
| 엣지 소스 | 위키링크만 | Relations + Backlinks |
| 엣지 의미 | 없음 (전부 동일) | 있음 (refutes/extends/related) |
| 엣지 방향 | 양방향 | Relations는 단방향 |
| 필터 | Status, Linked-only | Tags, Label, Status, Relations 타입 |
| 탐색 | 정적 (고정된 맵) | 동적 (Search Around) |
| 유지 비용 | 높음 (수동 관리) | 낮음 (자동 반영) |

### 왜 둘 다 필요한가

대체 관계가 아니다.

```
KnowledgeMap  → "내가 만든 지식 지도"   결과물, 아웃풋
온톨로지 뷰   → "내 지식의 실제 구조"   탐색 도구
```

실제 워크플로:
```
온톨로지 뷰에서 탐색
  → 흥미로운 연결 발견
  → 해당 노트들을 KnowledgeMap에 큐레이션
  → KnowledgeMap을 정리된 뷰로 활용
```

팔란티어도 같은 이유로 Object Views(큐레이션)와 Object Explorer(탐색)를 둘 다 제공한다.

## 4. KnowledgeMap 업그레이드 필요

온톨로지 뷰가 생기면 KnowledgeMap도 맞춰서 업그레이드해야 한다.
같은 앱 안에서 두 뷰가 다른 정보를 보여주면 모순이 생긴다.

### 업그레이드 항목

**엣지 소스 확장**
```
현재: [[위키링크]]만
이후: [[위키링크]] + Relations 둘 다
```

**엣지 시각화**
```
현재: 전부 동일한 선
이후:
  refutes  → 빨간 실선  #EF4444
  extends  → 초록 실선  #22C55E
  related  → 회색 실선  #6B7280
  위키링크 → 회색 점선  #6B7280 (dashed)
```

**필터 확장**
```
현재: Status, Linked-only
이후: + Tags, Label, Relations 타입
```

### KnowledgeMap과의 역할 구분 유지

업그레이드 후에도 핵심 차이는 유지:
```
KnowledgeMap  → 내가 고른 노트들 안에서 Relations까지 보여줌
온톨로지 뷰   → 전체 노트 대상 자동 탐색
```

노트 선별 방식(수동 vs 자동)이 둘을 구분하는 열쇠.

### 구현 순서

```
1단계: Relations 구현
2단계: KnowledgeMap에 Relations 엣지 추가 (graph.ts 수정)
3단계: KnowledgeMap 필터 확장
4단계: 온톨로지 뷰 구현 (KnowledgeMap 코드 재활용)
```

KnowledgeMap 업그레이드가 온톨로지 뷰 구현의 전 단계가 된다.

## 5. 사이드바 위치

디스플레이 설정 내부 옵션이 아니다. 독립적인 탐색 공간으로 사이드바 섹션 할당.

```
📥 Inbox
📝 Notes
📚 WIKI
🔭 Ontology       ← 독립 섹션
─────────────────
📈 Activity
🏷 Tags
🔖 Labels
─────────────────
[Folders 섹션]
[Pinned 섹션]
[Recent 섹션]
```

각 섹션의 렌즈:
```
Inbox      → 흘러들어오는 것
Notes      → 전체 노트 목록
WIKI       → reference 노트 항목 탐색
Ontology   → 전체 노트의 관계망 탐색
```

## 6. UI 상세 설계

### 6-1. 메인 화면

팔란티어 Object Explorer 개인용 버전:

```
┌─────────────────────────────────────────────────────────┐
│  ONTOLOGY                                               │
│                                                         │
│  [필터 바]                                               │
│  Tags: [#투자 ×] [#사주]   Label: [리서치 ×]             │
│  Relations: [전체 ▼]        Status: [전체 ▼]             │
│                                                         │
│  [뷰 전환]  ◉ 그래프  ○ 리스트  ○ 테이블                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  PER 분석법 ──extends──→ FCF 가치평가            │   │
│  │       │                                         │   │
│  │   refutes                                       │   │
│  │       ↓                                         │   │
│  │  PBR 우선론  ←─backlink── 삼성전자 분석           │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 6-2. 노드 클릭 시 우측 패널

팔란티어 Object Views 참고:

```
┌──────────────────────────────┐
│ PER 분석법                    │
│ Label: 리서치                 │
│ Status: permanent             │
│                              │
│ [본문 미리보기]                │
│ 주가수익비율(PER)은...         │
│                              │
│ RELATIONS (2)                │
│  ↩ refutes → PBR 우선론       │
│  ↗ extends → FCF 가치평가     │
│                              │
│ BACKLINKS (3)                │
│  ← 삼성전자 분석              │
│  ← 워런 버핏 어록             │
│  ← 투자 원칙 정리             │
│                              │
│ REFLECTIONS (1)              │
│  마지막 회고: 3개월 전         │
│                              │
│ TAGS                         │
│  #투자  #가치투자              │
│                              │
│              [노트 열기 →]    │
└──────────────────────────────┘
```

### 6-3. 세 가지 뷰 모드

**그래프 뷰 (기본)**
- 노드: 노트
- 엣지: Relations (색상으로 타입 구분) + Backlinks (회색 점선)
- 노드 크기: backlink 수 비례 (많이 참조될수록 크게)
- 노드 색상: Label 타입별 구분

**리스트 뷰**
```
노트명 | Relations 수 | Backlinks 수 | 마지막 회고 | 수정일
정렬: 연결 많은 순 / 최근 수정순 / 가나다순
```

**테이블 뷰**
```
노트명 | Label | Tags | Relations | Backlinks | Reflections | 수정일
PER 분석법 | 리서치 | #투자 | 2 | 3 | 1 | 2026-03-12
```

### 6-4. 엣지 색상 규칙

```
refutes  (반박)  → #EF4444  빨간 실선
extends  (파생)  → #22C55E  초록 실선
related  (관련)  → #6B7280  회색 실선
backlink         → #6B7280  회색 점선 (dashed)
```

## 7. 팔란티어 기능 → Plot 구현 매핑

| 팔란티어 기능 | Plot 온톨로지 뷰 |
|-------------|----------------|
| Object Explorer 검색 | 노트 검색 + 복합 필터 |
| Search Around (링크 순회) | 노드에서 Relations/Backlinks 타고 탐색 |
| 오브젝트셋 필터링 | Tags/Label/Status 복합 필터 |
| 탐색 뷰 전환 | 그래프 / 리스트 / 테이블 |
| Object Views (360도 뷰) | 노드 클릭 시 우측 패널 |
| 링크 유형별 시각화 | Relations 타입별 색상 구분 |

팔란티어에 없는 Plot 고유 기능:
```
Reflections  → 노드에 "마지막 회고: 3개월 전" 표시
Thread       → Thread 있는 노트 노드에 별도 표시
review_at    → 리뷰 예정 노트 하이라이트
```

## 8. 기술 구현

### 데이터 소스

```ts
const ontologyData = {
  nodes: filteredNotes,           // 필터 조건에 맞는 노트
  edges: [
    ...note_relations,            // Relations (타입 있음)
    ...backlinks,                 // Backlinks (자동, 타입 없음)
  ],
  filters: {
    tags: string[],
    label: string | null,
    status: NoteStatus | 'all',
    relationType: 'all' | 'refutes' | 'extends' | 'related',
  }
}
```

### 기존 코드 재활용

```
connections-graph.tsx   → 기존: 단순 backlink 그래프
knowledge-map-canvas.tsx → 기존: 수동 큐레이션 맵
ontology-view.tsx        → 신규: 위 둘을 확장/통합
```

graph.ts의 buildForceGraph, buildAdjacencyList를 Relations 포함하도록 확장.

## 9. 구현 전제 조건

```
필수:
  Relations 구현 완료      ← 없으면 KnowledgeMap + 필터와 동일
  노트 30개 이상           ← 연결망이 형성되어야 탐색할 게 생김

권장:
  Tags 적극 사용           ← 필터의 기반
  WIKI 항목 일부 구축      ← 온톨로지 뷰에서 anchor 역할
```

## 10. 로드맵

```
Phase 4: Relations 구현 + KnowledgeMap 업그레이드

Phase 5-A: 온톨로지 뷰 기본
  - 그래프 뷰 (Relations 타입별 색상)
  - 기본 필터 (Tags, Label, Status)
  - 노드 클릭 시 우측 패널

Phase 5-B: 탐색 기능 강화
  - Search Around (노드에서 연결 타고 탐색)
  - 리스트 뷰 / 테이블 뷰
  - 연결 수 기반 노드 크기

Phase 5-C: Plot 고유 기능
  - Reflections 마지막 회고 날짜 노드에 표시
  - review_at 하이라이트
  - Thread 있는 노트 표시
  - WIKI 항목 노드 별도 스타일
```

## 11. 최종 요약

```
WIKI          → 콘텐츠 레이어  (무엇을 담고 있나)
KnowledgeMap  → 큐레이션 레이어 (내가 보여주고 싶은 것)
온톨로지 뷰   → 탐색 레이어   (어떻게 연결되어 있나)
```

팔란티어가 기업의 데이터를 온톨로지로 만들어 탐색하듯,
Plot은 개인의 생각을 온톨로지로 만들어 탐색한다.
