# Architectural Decisions

## 2026-03-16
- **Activity UI 삭제, event 인프라 유지**: noteEvents 배열 + datalog 헬퍼 + appendEvent는 Insights 뷰에서 재사용 예정
- **activity-timeline.tsx 유지**: note-inspector의 History 섹션에서 개별 노트 활동 이력 표시에 사용
- **고아 코드 대량 정리**: -3,258줄. 기능 추가 전에 정리하는 것이 코드베이스 건강에 좋음 ("기능 5개의 98점" 철학)

## 2026-03-19 (Architecture Redesign v2)
- **Activity Bar 도입**: Tier 1 (Inbox/Notes/Wiki/Ontology) 4개 공간. Search는 상단 유틸리티 바 (Linear 참조)
- **LayoutMode 삭제 → WorkspaceMode 3개**: default(auto-collapse)/zen/research. Workspace Tree가 유일한 진실
- **Wiki 자동 등재**: 신호 기반 하이브리드. 높은 확신(red link refCount>=2, 태그 3+, backlinks>=3)=자동, 낮은 확신(공기어/TF-IDF)=제안
- **Wiki 병렬 라이프사이클**: status(inbox/capture/permanent)와 wikiStatus(stub/draft/complete)는 독립 축. 어느 status에서든 위키 진입 가능
- **Inbox = 워크플로우**: 필터가 아님. NotesTable 상태 탭 제거. FilterBar status 필터로 대체
- **2-Level Routing**: activeSpace + activeRoute. inferSpace()로 하위호환 유지
- **Breadcrumb**: NoteEditor Back 버튼 교체. activeSpace > folder > title
- **자동 등재 시 기존 노트 convert**: createWikiStub가 아니라 convertToWiki 사용 (중복 방지)
