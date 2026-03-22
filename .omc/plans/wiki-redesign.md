# Wiki Redesign Plan

## Goal
Wiki 페이지 전체 리디자인 — Dashboard/List/ArticleReader 3개 모드 모두.
Calendar 리디자인 수준의 디자인 퀄리티 (Linear-level polish).

## Design Direction
- **Dashboard**: 완전히 새로 설계 (Notion/Wikipedia 하이브리드)
- **List**: Calendar-style ViewHeader + FilterPanel 통합
- **ArticleReader**: 3-column 레이아웃 폴리시
- **사이드바**: 현재 구성(Categories/Recent/RedLinks/StubsBySource) 유지, 스타일링만 개선
- **파일 분리**: 1,500줄 단일 파일 → 모드별 분리

## Architecture: File Split

현재: `wiki-view.tsx` (1,500줄, 모든 것이 한 파일)

목표:
```
components/views/
  wiki-view.tsx          — 라우터 (모드 분기 + 공통 state)
  wiki-dashboard.tsx     — Dashboard 모드 (새 설계)
  wiki-list.tsx          — List 모드 (ViewHeader 통합)
  wiki-article-reader.tsx — Article 읽기/편집 (기존 로직 이전)
  wiki-sidebar.tsx       — 공통 오른쪽 사이드바 (스타일링 개선)
  wiki-stat-cards.tsx    — 공유 stat cards 컴포넌트
```

## Phase 1: File Split + ViewHeader 통합 (Infrastructure)

### 1-1. wiki-view.tsx 분리
- Dashboard/List/ArticleReader를 별도 파일로 추출
- 공통 state (notes, filters, search)는 wiki-view.tsx에서 관리, props로 전달
- 공통 사이드바를 wiki-sidebar.tsx로 추출

### 1-2. ViewHeader 통합
- Calendar처럼 `<ViewHeader>` 사용
- WIKI_VIEW_CONFIG의 filterCategories 완성 (wikiStatus, tags, labels, backlinks)
- FilterPanel 연동: `wikiFilters: FilterRule[]` state
- DisplayPanel: wiki-specific 옵션 (viewMode toggle, sort, density)
- ViewDistributionPanel은 이미 WIKI_VIEW_CONFIG에 skeleton 있음 → 활성화

### 1-3. 검증
- 3개 모드 전환 정상 동작
- FilterPanel으로 필터링 동작
- 빌드 클린

## Phase 2: Dashboard 완전 새 설계

### 2-1. 디자인 컨셉
Wikipedia Main Page + Notion Gallery 하이브리드:
- **Hero 제거** → 간결한 헤더 (타이틀 + 검색)
- **Stat Cards**: Calendar NotePill 스타일 — 작고 밀도 높은 카드, `rounded-[5px]`
- **Featured Article**: 랜덤 또는 최근 수정된 complete 위키 하이라이트
- **Quick Access Grid**: 카테고리별 진입점 (태그 기반)
- **Activity Feed**: 최근 변경/생성된 위키 타임라인
- **Red Links / Stubs**: 액션 가능한 섹션 (기여 독려)

### 2-2. 레이아웃
```
┌─────────────────────────────────────────────────┬──────────┐
│ ViewHeader (Filter │ Display │ DetailPanel)      │          │
├─────────────────────────────────────────────────┤          │
│                                                 │ Sidebar  │
│  ┌─────────────────────┬──────────────────┐    │ (현재    │
│  │ Featured Article    │ Quick Stats      │    │  구성    │
│  │ (large card)        │ (4 mini cards)   │    │  유지)   │
│  ├─────────────────────┴──────────────────┤    │          │
│  │ Categories (tag grid)                   │    │          │
│  ├─────────────────────┬──────────────────┤    │          │
│  │ Recent Changes      │ Needs Attention  │    │          │
│  │ (timeline)          │ (stubs/redlinks) │    │          │
│  └─────────────────────┴──────────────────┘    │          │
└─────────────────────────────────────────────────┴──────────┘
```

### 2-3. 스타일링 규칙 (Calendar 벤치마크)
- section label: `text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40`
- card: `rounded-lg border border-border/40 bg-card/50 px-3 py-2.5`
- active card: `border-accent/30 bg-accent/10 ring-1 ring-accent/25`
- item text: `text-[13px]`
- count: `text-2xs tabular-nums text-muted-foreground/50`
- badge: `rounded px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide`
- 빈 상태: `flex flex-col items-center gap-3 py-20 text-center`

## Phase 3: List 모드 리디자인

### 3-1. 구조 변경
- ViewHeader 통합 (Phase 1에서 완료)
- Stat cards → Phase 2에서 만든 wiki-stat-cards.tsx 재사용
- Tabs (All/Complete/Draft/Stub) → Calendar mode tabs 스타일로 교체
- ArticleRow → Calendar NotePill 수준의 밀도/폴리시
- Index 뷰 (초성 그룹) → 스타일링 개선

### 3-2. ArticleRow 리디자인
- 현재: 기본적인 flex row
- 목표: Linear issue row 수준 — status dot + title + meta (date, backlinks count) + labels
- hover: `bg-white/[0.03]`
- status dot: wikiStatus 색상 (stub=yellow, draft=blue, complete=green)

## Phase 4: ArticleReader 폴리시

### 4-1. Read Mode
- 3-column 레이아웃 유지
- WikiTOC (좌측): 스타일링 개선, sticky behavior 확인
- Content (중앙): 최대 폭 제한, 타이포그래피 개선
- Right sidebar (WikiInfobox + Categories + Quality track): 카드 스타일 통일

### 4-2. Edit Mode
- WikiCollectionSidebar (우측): Calendar sidebar 수준 스타일링
- Related/Collected/RedLinks 섹션: section label + item 스타일 통일

### 4-3. 전환 애니메이션
- Read ↔ Edit 모드 전환 시 부드러운 transition
- 사이드바 슬라이드 인/아웃

## Phase 5: 사이드바 스타일링 개선

### 5-1. 공통 사이드바 (Dashboard/List 공유)
- 현재 인라인 JSX → wiki-sidebar.tsx로 추출
- Categories: tag badge 스타일 → Calendar badge 패턴 (`rounded px-1 py-px text-[9.5px]`)
- Recent: 아이템 행 → `py-[7px] hover:bg-white/[0.03]`
- Red Links: 경고 색상 + 클릭 가능 아이템
- Stubs by Source: 소스별 그룹핑 개선

### 5-2. 섹션 헤더 통일
- `text-[11px] font-medium uppercase tracking-wide text-muted-foreground/40`
- 접기/펼치기 기능 (ChevronDown)

## Execution Order

1. **Phase 1** (Infrastructure) — 파일 분리 + ViewHeader, 가장 먼저. 이후 모든 작업의 기반.
2. **Phase 5** (사이드바) — 가장 간단. 빠른 성과.
3. **Phase 3** (List) — ViewHeader 통합 효과가 바로 보임.
4. **Phase 2** (Dashboard) — 가장 큰 변화. 시간 많이 필요.
5. **Phase 4** (ArticleReader) — 마지막. 기존 로직이 복잡.

## Constraints
- 기능 변경 없음 — 순수 UI/UX 리디자인
- wiki-auto-enroll.ts, wiki-view-mode.ts, store slices 변경 없음
- 기존 WikiTOC, WikiInfobox, WikiCategories, WikiDisambig, WikiRelatedDocs 컴포넌트는 스타일링만 수정
- WikiCollectionSidebar (에디터 사이드바)는 별도 (Phase 4-2)
- Build clean 유지 (각 Phase 끝에 tsc --noEmit)

## Estimated Complexity
- Phase 1: Medium (파일 분리 + ViewHeader 배관)
- Phase 2: High (새 디자인 + 컴포넌트 작성)
- Phase 3: Low-Medium (스타일링 위주)
- Phase 4: Medium (3-column 레이아웃 폴리시)
- Phase 5: Low (스타일링만)
