# Session Notepad (Updated: 2026-04-14 07:30)

## Critical Context
- PR #189 + #190 merged. Store v75
- 다음 세션: 인포박스 고도화 (나무위키 수준) + 배너 블록 + Insert 레지스트리

## 나무위키 리서치 결과 — 도입할 기능 (노트+위키 공용)

### Tier 1 — 인포박스 고도화
- 대표 이미지 + 캡션 (인포박스 최상단)
- 헤더 배너 (배경색 테마 + 제목/부제목)
- 인포박스 접기/펼치기
- 섹션 구분 행 (정보 그루핑)

### Tier 2 — 새 블록 타입 (base 티어 = 노트+위키 공용)
- 배너 블록 (배경색 + 제목 + 부제, TipTap 커스텀 노드)
- 둘러보기 틀 / Navigation Box (관련 문서 그룹, 접기 가능)

### Tier 3 — 유틸리티 매크로 (인라인)
- 나이 계산 [age(YYYY-MM-DD)]
- D-Day [dday(날짜)]
- Include (다른 문서 내용 삽입)

### Tier 4 — 고급
- 상위/하위 문서 관계
- 각주 이미지 (FootnoteEditModal에 이미지 첨부)
- 루비 텍스트

## 아키텍처 결정 (다음 세션 적용)
- **모든 새 기능 = base 티어**: 노트+위키 둘 다 사용 가능하게
- **Insert 레지스트리 단일화**: Insert/MoreActions/SlashCommand 3곳 중복 → 단일 레지스트리에서 읽기
- **인포박스 = 노트에서도 동일 고도화**: 위키 전용이 아님

## Active Tasks
- [ ] 인포박스 고도화 Phase 1 (대표 이미지, 헤더 배너, 접기, 섹션 구분)
- [ ] 배너 블록 (base 티어 TipTap 노드)
- [ ] Insert 레지스트리 리팩토링 (insert-menu.tsx + SlashCommand.tsx + FixedToolbar.tsx 통합)
- [ ] 인사이트 허브

## Blockers
- 없음
