# Plot — TODO (2026-04-22, PR #194 hard reset 이후)

> **2026-04-22 대결정**: Hard reset to PR #194 (3f2e54c). PR #195 ~ #213 전부 폐기.
> 다음 방향 = UI 일관성 개선 + 진짜 pain point 해결.

## 🎯 진짜 우선순위

### 🥇 UI 일관성 감사 + 개선 (2026-04-22 확정)

**사용자 pain point**: "ui가 너무 이상함. 일관성 없고"

- [ ] `docs/DESIGN-AUDIT.md` 5-Phase Design Spine 재검토
- [ ] 가장 거슬리는 UI 3-5개 구체화 (사용자 직접 지적)
- [ ] `anthropic-skills:design-quality-gate` 스킬 + `designer` 에이전트 활용
- [ ] Phase별 개선 (각 Phase = 1 PR, 작게)

### 🥈 (보류) 노트 Split 기능

사용자 본인 must-todo 명시

- [ ] `components/views/note-split-page.tsx` 신규 (WikiSplitPage 패턴 복사)
- [ ] `lib/store/slices/notes.ts`에 `splitNote` 액션
- 기술적 가능: UniqueID extension으로 top-level 노드 영속 ID 보유

### 🥉 (보류) Y.Doc 본 구현

- [ ] y-indexeddb 영속화
- [ ] Wiki 동일 패턴 (WikiEditorAdapter + acquireYDoc)
- [ ] 방어 가드 유지 (empty-refuse)

### (보류) Red Link 선택 팝업 UX

- [ ] Red Link 클릭 → 모달 (노트/위키 분기)

---

## 🧊 당분간 안 하는 것 (자기만족 리스크)

- **위키 시각적 다양화** — 레이아웃 프리셋, 템플릿 확장, 5 shell 등
- **나무위키 Top 7 나머지** — Hatnote / Ambox / 편집 히스토리 / 타입 인포박스 스키마
- **위키 공간 뷰 모드 추가** — Category Board / Gallery / Graph 등
- **새 블록 타입** — 배너 / Navbox / 매크로
- **위키 레이아웃 프리셋 통합** — Default/Encyclopedia 2개 → 1개 (PR #197-#208에서 시도하다 Book Pivot으로 확장되어 롤백됨)

**이유**: 2026-04-22 자각 — 2주간 "대결정" 3회 반복, 구현 직후 전부 폐기.
기능 추가 중단, UI 일관성 개선 우선.

---

## 🚫 폐기됨 (영구)

- **Book Pivot 5 shell** (#211-213) — 2026-04-22 hard reset
- **Page Identity Tier** (#209) — 2026-04-22 hard reset
- **메타→블록 통합** (infobox/toc 블록화, #208) — 2026-04-22 hard reset
- **컬럼 시스템** (ColumnRenderer, WikiColumnMenu 등, #198-#205) — 2026-04-22 hard reset
- **WikiTemplate + 8 built-in** (#197) — 2026-04-22 hard reset

---

## 📚 참조

- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처 (PR #194 시점)
- `docs/CONTEXT.md` — 현재 상태 + 설계 결정 (PR #194 시점)
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
- `docs/DESIGN-AUDIT.md` — 전수 디자인 감사 (있으면)
