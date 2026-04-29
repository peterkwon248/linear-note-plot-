# Session Notepad (Updated: 2026-04-30 07:00)

## Critical Context

- **Sprint 1.3 완료**: PR #228 머지. 디자인 polish + 사이드 패널 + Display Properties 동적 컬럼 + 출시 빌드 fix (12 파일). Store v75 유지.
- **다음 세션은 다른 컴퓨터에서 진행 예정** — `git pull origin main` → 새 worktree → `npm install` → NEXT-ACTION.md 읽고 시작
- **Plot 영구 규칙 재해석**: "시각적 다양성 ≠ Plot 코어"는 유효하지만, 명확한 그룹 차원이 있으면 검토 가능. Wiki 보드 뷰가 그 예 (Category 기준).

## Active Tasks (Sprint 1.4 — 다음 세션 즉시 시작)

- [ ] **Wiki 보드 뷰** — supportedModes에 "board" 추가, View mode toggle, WikiBoard 컴포넌트 (Notes 보드 패턴 재활용), Group by Category(default)/Tier/Parent
- [ ] **Wiki 컬럼 정비** — Tier badge / Reads (마이그레이션 v76) / Created
- [ ] **Wiki 차트 개선** — Growth Article/Stub 분리 (stacked + multi-line) + sub-tabs (All/Articles/Stubs) + Knowledge Connectivity 차트 추가

## Polished Decisions (이번 세션)

- **Hub Tier 자동 분류 폐기** — 사용자 통제 부재로 혼선. Stub/Article 2단계 + Backlinks 정렬로 충분
- **Folder/Words 컬럼 (Wiki) 미포함** — Categories가 그 역할 / 위키는 길이로 분류 안 함
- **카테고리 chip + count 패턴** — list view 컴팩트 우선, 전체는 Detail 패널
- **차트 sub-tabs (All/Articles/Stubs)** = Wiki List sub-tabs와 동일 디자인 (학습 부담 0)

## Blockers

- 없음. Sprint 1.4 진행 가능.

## Known Gotchas (다음 세션 주의)

- **JSX text node에 em dash 직접 입력 금지** — Edit 도구가 literal로 저장해 `—` 표시 버그. 항상 `{"—"}` expression으로
- **replace_all은 들여쓰기 매칭** — 들여쓰기 다른 동일 코드는 누락. 한 곳씩 수동 변경 필요할 수 있음
- **`article.layout` object 데이터 잔존** (Book Pivot 흔적) — typeof guard 적용했으나 마이그레이션 PR 별도 필요
