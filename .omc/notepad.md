# Session Notepad (Updated: 2026-04-14 저녁)

## Critical Context

- **Tier 1 인포박스 전체 완료** 🎉 (PR #194) — 헤더 색상 + Default 통합 + 섹션 구분 행 + 필드 리치텍스트
- **엔티티 철학 영구 확정** — Note/Wiki 2-entity 유지. 앞으로 엔티티 통합 제안 금지
- **위키 템플릿 통합 모델 확정 (2026-04-14 저녁)** — 3-layer 모델 폐기. "컬럼 + 섹션 배치 = 템플릿"
- **진실의 원천 문서**: `docs/BRAINSTORM-2026-04-14-column-template-system.md`
- **빌드 green** (PR #194에서 registry.ts 에러 해결됨)

## 다음 세션 시작점 (Phase 1)

**NEXT-ACTION.md** 참조. 요약:
1. `lib/types.ts` — `ColumnStructure`, `WikiTemplate`, `WikiArticle` 확장 (layout string → 구조체, titleStyle, columnAssignments, templateId)
2. `lib/store/slices/wiki-templates.ts` 신설 — built-in 8종 정의
3. Store migration — 기존 default/encyclopedia → 템플릿 자동 변환
4. 새 위키 생성 UX — 템플릿 선택 다이얼로그

## Active Tasks (우선순위순)

### 다음 세션 1순위 (Phase 1, 3-4일)
- [ ] WikiTemplate 데이터 모델
- [ ] 기본 템플릿 8종 (Blank / Encyclopedia / Person / Place / Concept / Work / Organization / Event)
- [ ] Store migration + 새 위키 생성 다이얼로그

### Phase 2-7 대기
- Phase 2: 컬럼 렌더러 + titleStyle
- Phase 3: 편집 UX (컬럼 드래그, 추가/삭제, 중첩 3 depth)
- Phase 4: 사용자 커스텀 템플릿 편집기
- Phase 5: 나무위키 잔여 (Hatnote, Ambox, Navbox, 섹션 icon)
- Phase 6: 편집 히스토리 + 요약
- Phase 7: 노트 split 기능

## Blockers

없음. 빌드 green. 엔티티 철학/템플릿 시스템 설계 완료. Phase 1 바로 시작 가능.

## 주의사항 (Phase 1 구현 시)

- 기존 `blocks[]` 평면 구조 유지 (최소 침습). `columnAssignments`로 배치만 표시
- Store migration은 기존 문서 손상 없이 default/encyclopedia → 템플릿 변환
- Phase 1은 데이터 모델만. 렌더링은 Phase 2로 분리 (당장은 기존 렌더러 유지 OK)
- WikiInfobox의 `setWikiInfobox` (Note slice) 버그는 여전히 유효 — Phase 1에서 같이 수정

## 사용자 피드백 (영구 규칙)
- 커밋 타이밍은 사용자 통제 (`feedback_commit_timing.md`)
- 엔티티 통합 제안 금지 (`project_entity_philosophy.md`)
