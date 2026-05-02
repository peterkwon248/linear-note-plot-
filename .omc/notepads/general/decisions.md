# Architectural Decisions

## 2026-05-03 — 대규모 디자인 토론 (Plot v3 방향)

### Plot 정체성 영구 정의
- **"Gentle by default, powerful when needed"** — 모든 디자인 결정 척도

### 4사분면 컨테이너 모델
- View (동적 + type-strict) / Folder (수동 + type-strict)
- Sticker (수동 + cross-entity) / Book (수동 + cross-entity + ordered)
- Search = 일회성 도구 (컨테이너 X)

### 큰 데이터 모델 변경 결정 (큰 PR 예정)
- **Folder type-strict + N:M** — 노트/위키 폴더 분리, 다중 멤버십
- **Sticker v2 cross-everything** — 모든 entity 수용 (Note+Wiki+Tag+Label+Category+File+Reference)
- **Book entity 신규** — cross-entity ordered sequence (Activity Bar 7번째)
- **Page entity 폐기** — 제텔카스텐 atomic 위배, Book이 더 정합

### Sandbox + Save view 통합 (옵션 B)
- Save view = 보기 + 데이터 staging 함께 영구
- Sandbox = 그래프만 (노트/위키 즉시 영구 — 노트앱 표준 보존)
- Wikilink = 본문에서만, Relation = 그래프에서

### Relation 저장 = 본문 embed 자동 추가
- 본문 contentJson에 직접 embed (footer 추가 X — 사용자 우려 반영)
- 사용자 첫 번째만 prompt + "기억" 옵션
- 위키: 자동 "See also" 섹션 + entity-ref WikiBlock 일반화

### 사이드 패널 변경 분배
- Detail/Connections/Activity 모두 영향
- 각 큰 PR이 자기 부분 처리 (별도 사이드 패널 PR 없음)
- 원칙: entity 단위 dashboard 유지

### Sticker 진입점 = Library만 (정정)
- 이전 4 space에서 추가 → Library만으로 변경 (cross-cutting 인덱스 결로 정합)

### 그 외 결정
- Linear-style entity navigation (의미 A) 채택, Page는 폐기
- 마크다운 단축키 Obsidian 90% 수준 도입 (Phase 1+2+3 분할)
- All Notes 명칭 유지 (Overview로 변경 X)
- Notes 사이드바 위계 = Notes ▼ Status 그룹 (Inbox/Capture/Permanent/Pinned)
- Wiki "Blocks" Display Property 추가 (Words 자리)

### 자료구조 본질 — Sticker vs Book
- Sticker = collection (set, 무순서)
- Book = sequence (list, 순서 있음)
- 자료구조 차이 → 다른 entity 정당화

### Note + Wiki cross-entity 자유 인정
- 종이책 메타포 함정 회피
- 디지털 책 = cross-type 자유 (Notion 페이지 패턴)

---

## 2026-04-30 (Sprint 1.3 + Sprint 1.4 plan)

- **Hub Tier 자동 분류 폐기** — 사용자 통제 부재로 혼선 위험. Stub/Article 2단계만 유지. Backlinks 정렬로 hub-like 식별 가능. "사용자 명시 마킹 없는 자동 분류는 혼선" 영구 규칙 추가
- **공간(space) 아이콘 3곳 통일 원칙 코드화** — Activity Bar 아이콘 = Sidebar Overview 아이콘 = ViewHeader 아이콘. 모든 공간(Wiki/Library/Notes/etc.)에 적용
- **References 아이콘 분리** — Library와 동일 `Books` 사용했었음. 인용 메타포에 맞춰 `Quotes`로 분리 (3곳: Sidebar nav / ViewHeader / Empty state)
- **Folder 컬럼 (Wiki) 영구 미포함** — Categories가 wiki에서 그 역할. Folder 자체가 wiki 메타포에 어울리지 않음
- **Words 컬럼 (Wiki) 영구 미포함** — 위키는 길이로 분류 안 함. Block count는 Detail 패널에 이미 있음
- **Plot 영구 규칙 재해석** — "시각적 다양성 ≠ Plot 코어"는 유효하지만, 명확한 그룹 차원이 있고 사용자 가치 판단하면 보드 뷰 등 검토 가능. Wiki 보드 뷰가 그 예 (Category 기준)
- **카테고리 chip + count 패턴** — list view 컴팩트 (첫 chip + `+N`), Detail 패널은 전체 chip pill. 시각적 hierarchy: 컴팩트 list ↔ 상세 detail
- **차트 sub-tabs (All/Articles/Stubs)** = Wiki List sub-tabs와 동일 디자인 재사용 (학습 부담 0). 같은 공간 내 동일 컨트롤 패턴
- **사이드 패널 자동 동기화** — list view에서 단일 체크박스 선택 시 sidePanelContext mirror (Wiki/Notes 둘 다). Space 전환 시 clear (stale context 방지)
- **출시 빌드 fix는 PR 범위 안에 포함** — 작은 빌드 에러는 별도 PR로 미루지 말고 함께 처리. NEXT-ACTION.md 알려진 이슈 1건 (home-view.tsx:41 backlinks) 이 세션에서 해소

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

## 2026-04-14 (Reference Usage + Activity 정리 + 나무위키 리서치)
- **Reference Usage = 사이드패널 Detail 탭에 구현**: Connections 탭이 아닌 Detail 탭의 InspectorSection. notes.filter + wikiArticles.filter로 referenceIds 스캔
- **Wiki Activity = Stats 중복 제거**: Detail Properties와 동일한 정보 삭제. Activity = "시간축 (뭐가 변했나)", Detail = "현재 상태 (지금 뭐가 있나)" 역할 분리
- **Note History = ActivityTimeline 재활용**: 이미 존재하는 컴포넌트 연결만으로 해결. 새 코드 불필요
- **Expand/Collapse All 항상 표시 + 비활성**: 접을 게 없어도 버튼 보임 (PushPin도 핀 안 해도 항상 보이는 것과 같은 논리). 비활성 시 흐릿 + disabled
- **Details 토글 = DOM 클릭 방식**: setNodeMarkup이 Details NodeView와 동기화 안 될 수 있어서 extension 자체 토글 버튼 프로그래밍 클릭으로 변경
- **인포박스 고도화 = 나무위키 수준 목표 (다음 세션)**: 대표 이미지+캡션, 헤더 색상 테마, 접기/펼치기, 섹션 구분 행. 배너 블록 = 새 블록 타입 (노트 Insert + 위키)

## 2026-04-13 (Expand/Collapse All + 위키 TextBlock 개선)
- **나무위키 패턴 채택**: Expand/Collapse All은 섹션 + 내부 collapsible + footer 전부 대상. 토글 1개 버튼 (하나라도 접히면 Expand, 전부 펼치면 Collapse)
- **CustomEvent 브로드캐스트 선택**: `plot:set-all-collapsed` 단일 이벤트. prop drilling보다 깔끔 (collapsible 요소가 TipTap NodeView/Footer/Wiki 섹션 등 다른 컴포넌트 트리에 분산)
- **위키 TextBlock 리사이즈 = persist + 편집 전용**: WikiBlock.editorWidth/Height store에 저장하되 편집 모드에서만 적용. 읽기 모드는 항상 full width → 모든 섹션 균일한 폭 보장
- **4코너 핸들**: 우하단만이 아니라 4코너 전부 → 어느 방향으로든 자유롭게 조절 가능
- **위키 TOC = wiki 티어에 등록 필요**: TocBlockNode + TableOfContents가 note 티어에만 있던 기존 버그. Insert 메뉴는 schema 체크 없이 무조건 표시 → silent fail 패턴

## 2026-04-05 (Unresolved Links + 호버 프리뷰 + Note/Wiki 링크 구분)
- **Red Link → Unresolved Links**: 위키피디아 용어 탈피, gray 점선으로 시각적 톤 다운. Wiki UI에서 Red Links 완전 제거 → Home 통합
- **호버 프리뷰 항상 TipTap**: generateHTML 폐기 → NoteEditorAdapter(editable 토글). Preview/Edit 동일 렌더링, 크기 변화 0
- **[[wiki:Title]] prefix**: Note/Wiki 링크 구분. wiki: prefix는 bracket처럼 font-size:0 숨김. 드롭다운에서 Wiki 선택 시 자동 삽입
- **4-way wikilink 시각 시스템**: exists(보라밑줄), wiki(teal칩), stub(amber점선), dangling(gray점선). Wiki 우선 (wiki-only일 때 teal)
- **호버 프리뷰 Pin = 모듈 레벨**: _pinned + _pinListeners. PreviewCard와 WikilinkDecoration/MentionInteraction 양쪽에서 접근 가능
- **위키 호버 프리뷰 방향**: wiki-article-view를 640px 카드에 임베드. 블록 5개 이하=바로 전체, 6개+=목차형 먼저

## 2026-04-14 — Entity Philosophy 확정

**Note/Wiki 2-entity 유지, 엔티티 통합 영구 폐기**

- 2026-03-30 PIVOT #1 (IKEA 전략) → 2026-04-01 ROLLBACK #2 (노션식 폐기) → 2026-04-14 FINAL: 분리 유지 + 위키 디자인 강화
- Alpha (완전 통합) / Beta (절충) / Gamma (역할 태그) 모두 폐기
- 차별점의 원천 = 데이터 구조 (TipTap JSON vs WikiBlock[])
- **렌더러(Layout Preset)는 위키 전용** — 노트에 주면 차별점 희석됨
- 사용자 명시: "지금 방식도 마음에 든다, 단지 위키 디자인이 약할 뿐"

**위키 템플릿 3층 모델**

- Layer 1: Layout Preset (default/encyclopedia/wiki-color, 렌더러)
- Layer 2: Content Template (섹션 뼈대, Person/Place/Concept 등 타입별)
- Layer 3: Typed Infobox (Layer 2의 인포박스 부분 독립화)
- 노트 템플릿 = NoteTemplate slice 유지 (UpNote식, title+content 복사, 자유 구조)

**노트 split UX 결정**

- WikiSplitPage 패턴 그대로 (`components/views/wiki-split-page.tsx` 502줄 복사)
- 2-column Original/New + 체크박스 + Shift+Click 범위 선택 + Title 입력
- 사용자 명시 요청


## 2026-04-25 — 코멘트 시스템 대규모 결정사항

### Comment 본질 = 가벼운 메모
- 풀 에디터 툴바 X. 라이트 TipTap "comment" tier만
- 마크다운 단축키 + `[[wikilinks]]` + `#hashtag`로 충분
- 노트/위키는 풀 에디터 (상세 작성 필요), 코멘트는 가볍게 — 역할 분리

### 노트/위키 대칭 (B 옵션)
- 모든 블록에서 인라인 코멘트 가능
- 위키 모든 블록 8종에 cluster (section/text/note-ref/image/url/table/navbox/navigation)
- 노트는 BlockDragOverlay 패턴으로 ProseMirror 블록 위 absolute overlay

### Linear 스타일 status
- Backlog (CircleDashed) / Todo (Circle, blue) / Done (CheckCircle, green) / Blocker (Warning, red)
- 4개 고정. 사용자 커스터마이징 X (단순성 유지)

### Pin = Bookmark 통일
- `PushPin` → `BookmarkSimple` 아이콘 (시각 통일)
- 사이드패널 PINNED 헤더 제거 (탭 이름 "Bookmarks"와 중복)
- 내부 함수명 `pinBookmark`/`unpinBookmark`는 유지 (호출 site 많음 — 별도 리팩터)

### Navbox 하이브리드 (Wiki 표준 호환)
- 리서치 결과: Wikipedia/나무위키 모두 100% 수동 큐레이션이 표준
- Plot은 Auto(편의) + Manual(표준) 둘 다 지원
- `navboxMode: "category" | "manual"` + `navboxArticleIds[]` 필드

### 미니맵 디자인 (Option F + G)
- F: 코드 전체 Phosphor 아이콘 일관성 (이모지 전부 제거)
- G: 시각적 구조 표현 (블록 타입별 컬러 stripe)
- 섹션 번호 badge (1, 1.1, 1.2): H 아이콘 대체 + 본문 article과 일치

### 사이드패널 통합 원칙
- Activity: 코멘트 단일 시스템 (Thread/Reflection 폐기)
- Bookmarks: 모든 핀 한 곳에 (note + wiki targetKind)
- Connections: 양방향 backlinks (위키 incoming wikilink 추가)

## 2026-04-26 (큰 세션, 9 PR)
- **Home 정체성 분리**: 시간 기반 (Inbox/Today/Snooze) Home에서 제거. Plot 정체성은 제텔카스텐 = 연결. 시간 관리는 워크플로우 앱 영역.
- **Ontology = Single Source of Insights**: 모든 정비 행동/메트릭/Nudge Ontology Insights 탭으로 이전. Home은 본업, Ontology는 가끔 들어가는 분석 허브.
- **Pinned 통합 시스템**: Note + WikiArticle + Folder + SavedView + Bookmark 모두 Home Mixed Quicklinks 카드 그리드. WikiArticle.pinned 신설 (Note와 대칭).
- **루비 텍스트 제거**: 한국어 사용자 fit X, 노트앱 표준 X (Notion/Bear/Capacities/Tana 모두 안 함). 차별화에도 무관.
- **Plane 풀 미러 거부**: Stickies + Manage widgets + Greeting 시도 후 "너무 많음" 롤백. Plot 정체성에 fit하는 부분만 채택.
- **자동 등재 dedupe 가드**: createWikiStub에 동일 title 검사 — 무한 누적 방지. 자동 등재가 매 사이클 같은 redLink 발견 시 중복 폭발 버그 fix.

## 2026-05-01

### Filter/Design 패턴
- **필터 칩 4-part Linear 패턴** (옵션 A): `icon + field | op | value | ×` 모든 케이스
- **Order by chip 3-part**: `key | value+direction | ×` (operator 없음)
- **체크박스 단일 패턴**: `bg-card border-zinc-400` + `bg-accent + PhCheck text-accent-foreground`
- **라벨 테두리**: `1.5px borderWidth` + `color-mix 55%` (다크/라이트 양쪽)

### Quicklinks 위치 (다음 PR 합의)
- Home 사이드바: prominent 섹션 (Pinned 옆/대체)
- 각 영역 사이드바 (Notes/Wiki/Calendar/Ontology/Library): 하단에 collapsed `Quicklinks` 섹션
- 펼친 상태는 영역별 persist
- 키보드 shortcut으로 어디서든 즉시 점프 (⌘K 또는 ⌘1~9)

### Quickfilters/Views 통합 (다음 PR 합의)
- 사이드바 "Views" 섹션 유지 (이름 변경 X)
- 시스템 quickFilter (🔒 편집 불가) + 사용자 SavedView (⭐ 편집 가능) 한 섹션
- 필터 드롭다운의 ✨ Quick Filters 섹션 제거
- `SavedView { builtin: boolean, context: notes/wiki/ontology/library }` 모델

### 사이드바 Inline Edit Mode (다음 PR 합의)
- DotsSix 핸들 (12px) + 8px slide-right transition (200ms)
- 섹션 단위만 재배열 (자식 항목 X)
- 👁 hide/show 토글
- "Done" 버튼 또는 외부 클릭으로 종료 (즉시 persist, Save 단계 X)
- `sidebarCustomization.byContext`로 영역별 분리

### WikiArticle 그래프 통합
- legacy `isWiki` 모델 (Note에 wiki 분류) deprecated
- `buildOntologyGraphData`에 WikiArticle 별도 노드 (`wiki:{id}` prefix)
- parent-child hierarchy + note-ref edges
