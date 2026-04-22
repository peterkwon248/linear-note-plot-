# Session Notepad (Updated: 2026-04-14 22:13)

## Critical Context
- **Tier 1 인포박스 전체 완료** 🎉 — 헤더 색상 + Default 통합 + 섹션 구분 행 + 필드 리치텍스트. 이번 세션 10파일 수정 + 3 신규
- **엔티티 철학 영구 확정** — Note/Wiki 2-entity 유지. 렌더러는 위키 전용. `docs/BRAINSTORM-2026-04-14-entity-philosophy.md`에 상세. 앞으로 엔티티 통합 제안 금지
- **빌드 실패 상태 (pre-existing)** — `registry.ts:63` RemixiconComponentType 에러. 이번 세션 변경과 무관. 커밋 스킵됨. 다음 세션에서 먼저 수정 필요

## Active Tasks (우선순위순)

### 다음 세션 즉시
- [ ] **빌드 에러 수정** — `registry.ts:63` 20건 RemixiconComponentType cast 추가 or BlockIcon 타입 확장. build-fixer 에이전트 권장
- [ ] **커밋** — 이번 세션 모든 변경 (10 수정 + 3 신규) 커밋

### P2 — 위키 디자인 강화 (다음 세션 1순위)
- [ ] 인포박스 편집 엉킴 수정 (Easy) — float-right + 본문 heading 클릭 간섭
- [ ] `wiki-color` 레이아웃 프리셋 (Medium) — 나무위키식 상단 전폭
- [ ] themeColor cascade (B-2, Medium × High) — `WikiArticle.themeColor?: {light, dark}`
- [ ] Hatnote (A-1, Easy × High) — 상단 italic 안내
- [ ] Ambox 자동 배너 (A-3, Easy × Medium) — stub/orphan 자동 감지

### P2 — 타입 인포박스 (C-3, Layer 2)
- [ ] Person/Place/Concept/Work/Organization/Event 6종 스키마
- [ ] 새 위키 생성 시 타입 선택 다이얼로그

### Must-TODO
- [ ] **노트 split 기능** — WikiSplitPage 패턴 복사. `memory/project_note_split_todo.md`에 스케치. Medium × 2-3일

## Blockers
- 빌드 실패 (위 Critical Context 참조). 내 세션 변경과 무관한 pre-existing 이슈라 다음 세션에서 수정 후 커밋 예정

## Last Session Highlights (Y.Doc PoC 관련, 여전히 유효)
- Y.Doc Split-View Sync PoC 작동 (PR #192). 본 구현은 다음 세션 후보
- Insert 레지스트리 단일화 완료 (`components/editor/block-registry/`) — 그러나 registry.ts 자체가 TypeScript 에러를 내고 있음 (Turbopack build 실패)
