# Session Notepad (Updated: 2026-05-03 22:30)

## Critical Context

### 영구 원칙
- **디자인**: "Gentle by default, powerful when needed"
- **작업**: "정확도 + 버그 위험 최소화" (10가지 — docs/MEMORY.md)

### 오늘 (2026-05-03) 16 PRs 머지 (오전+오후+저녁)
- 오전+오후: #237~#247 (Sticker v2, Group A/C, Template a/b, 33 design decisions)
- 저녁: #249~#253 (Templates 시리즈 c/d/e + v106 migration + Folder N:M PR-a)

### Store Version 진화
v100 → v107 (Sticker.members → Template icon/color drop → templates context → visibleColumns 단순화 → description 제거 → seed 9개 주입 → Folder kind+N:M)

## Active Tasks (다음 세션 우선순위)

### 🔴 즉시
- [ ] **BUG**: 시드 템플릿 더블클릭 시 에러. 시드는 보이나 편집 안 됨. 콘솔 메시지 미수집. PR c~e 변경 추정. `template-edit-page.tsx` + `templates-table.tsx` row click 시점 디버깅.

### 🟡 PR (folder-b/c) — folder N:M 후속
- [ ] **PR (folder-b)** UI 분리: 사이드바 Notes/Wiki 분리, /folder/[id] kind 분기, FolderPicker (4곳 dedup), DnD kind 검증
- [ ] **PR (folder-c)** Multi-folder UX: chips, picker, DnD add vs move, group-by-folder N번 마커

### 🔵 worklog 큰 작업
- [ ] Wiki template 3-layer
- [ ] Group C PR-D (5-8 PRs, planner 권장)
- [ ] Smart Book v2
- [ ] Template seed audit (`PlotTemplate<T>` 추상화)

### 🟣 마지막
- [ ] Note UI toolbar (UpNote-style)

### 🟤 마지막에 논의 (보류)
- [ ] **House (계보 시각화)** — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체 가능 (House 90% 커버). 다음 토론 시 결정.

## Polished Decisions (이번 세션)
- **Templates 본질**: 선택 도구 → list+grid만, board 미지원
- **Templates 디스플레이 properties**: Index/Updated/Created 3개만 (status/priority/label/folder/tags/description 폐기)
- **NoteTemplate.status/priority/description**: default 값일 뿐. 카드 표시 폐기. 타입 필드 제거는 별도 PR.
- **Linear chip system**: 도메인별 chip + 하드 캡 3개 + "+N more". pinned는 always-on.
- **Folder type-strict + N:M**: 노트 폴더=노트만, 위키 폴더=위키만. 한 노트가 여러 폴더 가능.
- **혼합 폴더 자동 분리** (마이그레이션): `{name}` (note) + `{name} (Wiki)` 두 폴더로
- **Templates folderId**: single 유지 (YAGNI)

## Blockers
- 시드 템플릿 더블클릭 에러 (사용자 워크플로우 차단) — 다음 세션 즉시 fix

## Plans 보존
- `.omc/plans/folder-nm-migration.md` — PR (folder-b/c) 명세
- `.omc/plans/template-b-edit-ui-unification.md` — 이전 PR b
