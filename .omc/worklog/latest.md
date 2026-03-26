---
session_date: "2026-03-27 00:30"
project: "Plot (linear-note-plot)"
working_directory: "C:\Users\user\Desktop\linear-note-plot-"
duration_estimate: "~3 hours"
---

## Completed Work (PR #120 — merged to main)

### Phase 1: 타입 계약 + Design Spine + 공유 컴포넌트
- ViewContextKey에 wiki, wiki-category, graph, calendar 추가
- FilterField에 graph/wiki 전용 필드, GroupBy에 tier/parent/family 추가
- ToggleSwitch, ChipDropdown 공유 컴포넌트 추출
- Design Spine: 12개 파일 typography/border/hover/icon/하드코딩 일괄 수정

### Phase 2: Filter 통합
- graph-filter-adapter.ts: OntologyFilters ↔ FilterRule[] 양방향 변환
- Graph → ViewHeader + FilterPanel 교체, ontology-filter-bar.tsx 삭제

### Phase 3: Display 통합
- Wiki category: 14개 useState → viewStateByContext + DisplayPanel
- Calendar/Graph: viewStateByContext + DisplayPanel 연동
- WIKI_CATEGORY_VIEW_CONFIG 신규, SortField 확장

### Phase 4: Side Panel 통합
- SidePanelMode: detail | discover | peek (v63 migration)
- side-panel-detail.tsx: Entity-aware Detail 라우터
- discover-engine.ts: keyword+tag+backlink+folder 4신호 로컬 추천
- SmartSidePanel 3탭 UI (Detail + Discover + Peek)

## Remaining Tasks
- [ ] Phase 5: AI-Ready Smart Export
- [ ] 사이드바 뷰 (생성/편집/삭제)
- [ ] 템플릿 리디자인
- [ ] 라이브러리 (이미지/URL/파일)
- [ ] 커맨드 팔레트 확장 (6→20+개)
- [ ] 풀페이지 검색 분리
- [ ] Space별 Detail 컴포넌트 (Wiki/Graph/Calendar)
- [ ] Discover Web Worker 최적화

## Key Decisions
- 통합 파이프라인: 데이터 모델 안 건드림, UI 패턴만 통일
- Design Spine 별도 Phase 안 함: 구조 통합에 녹임
- Discover = AI 없는 로컬 추천
- SidePanel 3탭: Detail + Discover + Peek

## Technical Learnings
- viewStateByContext 새 키 추가 시 ?? buildViewStateForContext() 방어 필요
- ToggleSwitch: bg-border 다크모드 안 보임 → bg-muted-foreground/40
- on knob: bg-background 다크모드 검정 → bg-white 고정
