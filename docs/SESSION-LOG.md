# Plot — Session Log

> 시간순 chronological 세션 기록 (append-only). 직전 세션 멘탈 상태 복원용.
> 가장 최근이 위에. 오래된 세션은 아래로 밀려남.
> Session entry 형식: 날짜 + 머신 + 완료 + 결정 + 다음

---

## 2026-04-09 오후~저녁 (회사)

### 완료
- **크로스노트 북마크 5 Phase** 전부 구현
  - GlobalBookmark store slice + migration v72
  - extractAnchorsFromContentJson 공용 유틸
  - Bookmarks 탭 2섹션 (Pinned + This Note) + Ctrl+Shift+B
  - WikilinkNode anchorId attr + 2단계 앵커 피커
  - 플로팅 TOC 핀 + 앵커 우클릭 Pin to Bookmarks
- **FootnotesFooter 접기/펼치기** — 기본 접힌 상태, [N] 클릭 시 자동 펼침
- **Wiki Sources 클릭 fix** — openNote + setActiveRoute로 네비게이션 정상화
- **Outline 개선** — TipTap JSON 기반, TOC 블록 우선, 헤딩 fallback, 클릭 스크롤
- **ReferencedInBadges dedupe** — 위키 article ID 기준 중복 제거 + secondary 컴팩트 모드
- **Peek-First 아키텍처 Phase 0+1** — 사이드바 단일 책임 (layout.tsx)
  - WorkspaceEditorArea에서 사이드바 코드 전부 제거
  - layout.tsx가 모든 케이스 처리 (단독/스플릿/뷰스플릿/에디터스플릿)
  - hasSplit/hasViewSplit/showSidePanel 명확한 분기

### 브레인스토밍 & 큰 결정
- **Outline = 단순 구조 시각화** — 앵커는 별개 Bookmarks 탭으로 분리
- **사이드바 아키텍처 = A안 (layout.tsx 단일 책임)** — 여러 위치 렌더링 충돌 해결
- 🎯 **Split View 폐기 + Peek 확장 (Peek-First 마이그레이션)** — 가장 큰 방향 결정
  - Phase 0~5로 단계적 진행
  - Peek 지원: Note + Wiki만 (Calendar/Ontology 제외)
  - 사이즈 시스템: Min/Mid/Max + Drag
  - 호버 프리뷰는 유지 (Peek와 별개)
- **워크플로우 개선 결정** — NEXT-ACTION.md + SESSION-LOG.md 도입

### 다음
- **Phase 2: Peek가 Wiki 표시 가능하게** (NEXT-ACTION.md 참조)

### Watch Out
- Reference.history 작업 중간에 멈춤 — Peek 마이그레이션 후 복귀
- 단독 에디터 사이드바 버그 디버깅에 시간 많이 씀 — root cause는 여러 곳에서 사이드바 렌더링 시도 + react-resizable-panels의 id+order 누락

### 머신
회사

---

## 2026-04-08 (이전 세션)

PR #169~171 작업 — Library 고도화, Reference 하이브리드 통합, Trash 뷰 확장 등.
상세는 docs/MEMORY.md PR 목록 참조.
