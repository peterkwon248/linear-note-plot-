# Plot — TODO (2026-04-08)

## 🔴 P0 — 최우선 (다음 세션)

- [ ] **듀얼 에디터 좌우 고정** — Side by side에서 우측 에디터 내 링크 클릭 시 좌측 노트가 교체되는 버그. `openNote`가 항상 `selectedNoteId`를 변경하기 때문. 호출 컨텍스트(사이드바/에디터/호버프리뷰)에 따라 좌/우 라우팅 분기 필요. 사이드패널도 듀얼 모드에서 열려야 함
- [ ] **FootnotesFooter 접기/펼치기** — 기본 접힌 상태, `[1]` 클릭 시 자동 펼침. "▶ FOOTNOTES (2)" 토글
- [ ] **referenceLink 노드 최종 검증** — `[[`/`@` 드롭다운에서 Shift+클릭 시 referenceLink 삽입 동작 확인. 일반 클릭은 footnoteRef

## P1

- [ ] **크로스노트 북마크** — GlobalBookmark store slice, 사이드패널 Bookmarks 탭 리뉴얼 (전체 노트 북마크), Ctrl+Shift+B 단축키, 자동 라벨 추출
- [ ] **Library + Wiki Overview Bento Grid 리디자인** — Premium stat card, Featured Article, Activity Feed
- [ ] **Library FilterPanel Notes 수준** — view-engine 인프라 재사용, 2단계 nested 필터
- [ ] **createdAt + Reference.history** — 각주 타임스탬프 + 수정 이력

## P2

- [ ] **인사이트 중앙 허브** — 온톨로지 사이드바 Insights 섹션
- [ ] **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)
- [ ] **인포박스 고도화** — 대표 이미지, 섹션 구분 행, 접기/펼치기

## P3

- [ ] **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식), Peek 사이드바에서 직접 Quote 삽입
- [ ] **호버 프리뷰 → Peek 통합 검토** — 역할 중복 정리, 사이드패널 Peek 탭 vs 호버 프리뷰 Pin
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드, J/K 네비게이션

## 완료 (이번 세션, 2026-04-08 오후)

- [x] Trash 뷰에 References/Files 탭 추가
- [x] Library Files 직접 업로드 UI (+ 버튼)
- [x] Library Tags CRUD 검증
- [x] Hydration 에러 수정 (PanelGroup 고정 id)
- [x] References hover 체크박스 (Notes 패턴)
- [x] Bookmark 툴바/Insert 메뉴/슬래시 커맨드 전체 접근
- [x] referenceLink TipTap 노드 (인라인 외부 링크)
- [x] Reference URL 전용 입력란 (사이드패널)
- [x] Quick Filter "Links" (References 뷰)
- [x] `[[`/`@` 자동분기 (기본=footnoteRef, Shift=referenceLink)
- [x] footnoteRef 팝오버 + 하단에 URL 링크
- [x] 호버 프리뷰 버그 수정 (wikilink data-hover-preview 제거)
- [x] 호버 프리뷰 리사이즈 + 드래그 이동
- [x] 호버 프리뷰 Pin 버튼 액션바 추가
- [x] 호버 프리뷰 본문 flex-1 (카드 크기에 따라 늘어남)
- [x] 사이드바 Bookmarks 클릭 → 스크롤 이동
- [x] anchor 노드에 data-anchor-id 속성 추가
- [x] Peek 툴바 하단 이동
- [x] 듀얼 에디터 사이드패널 토글 버튼

## 완료 (이번 세션, 2026-04-08 오전)

- [x] SmartLinkPaste 버그 수정 (view.hasFocus() 가드)
- [x] window.prompt 전면 폐기 (embed-url-request.ts CustomEvent 브릿지)
- [x] Library Overview 리디자인 (MiniStat + ContentCard)
- [x] Tags/Files 뷰 Coming soon → 실제 구현
- [x] Tags를 Library로 통합 (Notes "More"에서 제거)
- [x] 섹션 네이밍 "Recent"로 통일
- [x] References/Files soft delete (store v71)
- [x] Sidebar Tags/Files 활성화 + 카운트 뱃지
