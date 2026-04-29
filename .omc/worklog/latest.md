---
session_date: "2026-04-30 07:00"
project: "Plot"
branch: "claude/naughty-khorana-7b0358"
pr: "#228"
duration: "~3 hours"
next_machine: true
---

# Sprint 1.3 — 디자인 polish + 사이드 패널 동기화 + Display Properties 동적 컬럼

## Summary

12 파일, store v75 유지, 출시 빌드 PASS.

**주요 변경**:
1. 아이콘 일관성 (Activity Bar / Sidebar / ViewHeader 3곳 통일 원칙)
2. Wiki Dashboard polish (Display + DetailPanel mode 분기, contrast 강화)
3. 라이트모드 Wiki List 헤더/체크박스/Sub-tabs Notes 톤 일치
4. Quick Capture 5문구 cycle (3s, 입력 시 정지)
5. 사이드 패널 동기화 (Wiki/Notes List 단일 select, Space 전환 시 clear)
6. Wiki Article Detail typeof guard (article.layout object 데이터 fix)
7. **Wiki List Display Properties 동적 컬럼** (chip + count, 사용자 직접 발견 버그 fix)
8. 출시 빌드 fix (home-view.tsx:41 backlinks → useBacklinksIndex)

## Next Session (Sprint 1.4)

**A. Wiki 보드 뷰** — supportedModes 추가, View toggle, WikiBoard 컴포넌트, Group by Category(default)/Tier/Parent, 카드 drag

**B. Wiki 컬럼** — Tier badge / Reads (v76 마이그레이션) / Created

**C. Wiki 차트 개선** — Growth Article/Stub 분리 (stacked + multi-line) + sub-tabs (All/Articles/Stubs) + **Knowledge Connectivity 차트 추가**

자세한 plan은 `docs/NEXT-ACTION.md`.

## Decisions

- Hub Tier 자동 분류 폐기 (사용자 통제 부재)
- Folder/Words 컬럼 (Wiki) 미포함
- 보드 뷰 default group by = Category
- 카테고리 chip + count 패턴
- 차트 sub-tabs = Wiki List sub-tabs와 동일 디자인 재사용

## Technical Learnings

- replace_all 들여쓰기 매칭 → 수동 변경 필요할 수 있음
- JSX text node em dash 직접 입력 금지 → `{"—"}` expression
- `article.layout` object 잔존 데이터 (Book Pivot 흔적) → typeof guard
- `useBacklinksIndex` hook으로 in-degree 정확 카운트
