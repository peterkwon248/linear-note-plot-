# Archived Documentation

이 디렉토리에 있는 파일들은 **historical archive**입니다. 현재 가이드/authoritative 문서가 아닙니다.

## 보관 이유

- **TODO.md, NEXT-ACTION.md, SESSION-LOG.md** (2026-04-30~)
  - `docs/CONTEXT.md` + `docs/MEMORY.md` + `~/.claude/.omc-worklog/`와 정보 중복
  - PR #228~#236 9건에서 갱신 누락 → single source 원칙 위배
  - 현재 진행 상황은 CONTEXT.md/MEMORY.md를 참조

- **PHASE-PLAN-wiki-enrichment.md** (2026-04 작성)
  - v75→v83+ 마이그레이션을 가정했으나 현재 v100 — 데이터 모델 가정 깨짐
  - "나무위키 리서치 기능" 비전은 유효하나, 필요 시 작은 단위 PRD로 분할 재작성 예정
  - 코드에 banner/navbox 타입은 일부 살아있음 (v84/v85 마이그레이션 마커)

- **plot-discussion/** (2026-03-30~31)
  - 초기 비전·아키텍처 토론 trail
  - 일부 결정 뒤집힘: entity 통합→분리(BRAINSTORM-2026-04-14-entity-philosophy), 5 spaces→6 spaces (Library 추가)
  - 의사결정 추적 가치만 보존

## 현재 authoritative 문서

- `docs/CONTEXT.md` — 작업 이력 + 결정사항 + 다음 작업 큐
- `docs/MEMORY.md` — PR 히스토리 + 패턴 + 아키텍처 상세
- `docs/REDESIGN_*.md` — 활성 PRD
- `docs/SYNC-*.md` — 출시 후 반영 예정 (의도적 보류)
- `docs/BRAINSTORM-*.md` — 영구 규칙으로 채택된 결정사항
- `docs/UI-CONSISTENCY-AUDIT.md` — Phase 1 분석 (활성)
