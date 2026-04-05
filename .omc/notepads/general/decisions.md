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

## 2026-03-22 (Wiki Block Editor)
- **Wiki = Assembly Model**: 위키는 노트와 별도 엔티티(WikiArticle). 노트는 원재료, 위키는 노트를 블록으로 참조하여 아티클 조립. isWiki 노트 기반에서 전환.
- **에디터 자동 결정**: isWiki/WikiArticle 여부로 에디터 타입 자동 결정. "New Node" 선택 UI 없음 — 인지과부하 방지.
- **Section 번호 = JS 계산**: CSS counter 대신 useMemo + O(n) 순회. TOC와 100% 동기화 보장. 성능 문제 없음 (200블록 = 마이크로초).
- **convertToWiki 삭제 예정**: 노트→위키 전환 개념 없어짐. auto-enroll은 빈 WikiArticle 생성 + 관련 노트 추천으로 전환.

## 2026-04-05 (Unresolved Links + 호버 프리뷰 + Note/Wiki 링크 구분)
- **Red Link → Unresolved Links**: 위키피디아 용어 탈피, gray 점선으로 시각적 톤 다운. Wiki UI에서 Red Links 완전 제거 → Home 통합
- **호버 프리뷰 항상 TipTap**: generateHTML 폐기 → NoteEditorAdapter(editable 토글). Preview/Edit 동일 렌더링, 크기 변화 0
- **[[wiki:Title]] prefix**: Note/Wiki 링크 구분. wiki: prefix는 bracket처럼 font-size:0 숨김. 드롭다운에서 Wiki 선택 시 자동 삽입
- **4-way wikilink 시각 시스템**: exists(보라밑줄), wiki(teal칩), stub(amber점선), dangling(gray점선). Wiki 우선 (wiki-only일 때 teal)
- **호버 프리뷰 Pin = 모듈 레벨**: _pinned + _pinListeners. PreviewCard와 WikilinkDecoration/MentionInteraction 양쪽에서 접근 가능
- **위키 호버 프리뷰 방향**: wiki-article-view를 640px 카드에 임베드. 블록 5개 이하=바로 전체, 6개+=목차형 먼저
