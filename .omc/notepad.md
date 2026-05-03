# Session Notepad (Updated: 2026-05-04)

## Critical Context

### 영구 원칙
- **디자인**: "Gentle by default, powerful when needed"
- **작업**: "정확도 + 버그 위험 최소화" (10가지 — docs/MEMORY.md)

### 최근 세션 머지된 PRs
- **2026-05-03**: #237~#247 (오전+오후), #249~#254 (저녁) — Templates 시리즈 + Folder N:M PR (a)
- **2026-05-04 (오늘)**: #255 (folder-b UI), #256 (folder-c Multi-folder UX) — **Folder N:M 시리즈 완성**

### Store Version (현재 v107)
v100 → v107 (Sticker.members → Template icon/color drop → templates context 4단계 → seed 주입 → Folder kind+N:M)

## Active Tasks (다음 세션 우선순위)

### 🔴 즉시 (사용자 워크플로우 차단)
- [ ] **BUG**: 시드 템플릿 더블클릭 시 에러. 시드는 보이나 편집 안 됨. 콘솔 메시지 미수집. PR c~e 변경 추정. `template-edit-page.tsx` + `templates-table.tsx` row click 시점 디버깅.

### 🟡 큰 작업 후보
- [ ] **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장)
- [ ] **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
- [ ] **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
- [ ] **Template seed audit** — `PlotTemplate<T>` 추상화

### 🟣 마지막
- [ ] **Note UI toolbar** (UpNote-style) — Pin/Focus/Version 5-6 핵심 버튼

### 🟤 마지막에 논의 (보류)
- [ ] **House (계보 시각화)** — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체 가능. 다음 토론 시 결정.

### 🟢 작은 후속 정리
- [ ] Templates grid chip 시스템 완전 통일 (PR e deviation)
- [ ] NoteTemplate 타입에서 description/status/priority 필드 제거
- [ ] 키보드 shortcut (D/T/P) — 노트 + templates 통합
- [ ] Wiki bulk action bar (필요해지면)
- [ ] FolderPicker 검색 필터 (50+ 폴더 시점)

## Polished Decisions (Folder N:M 시리즈)
- **Folder type-strict + N:M**: 노트 폴더=노트만, 위키 폴더=위키만. 한 노트가 여러 폴더 가능.
- **혼합 폴더 자동 분리**: `{name}` (note) + `{name} (Wiki)` 두 폴더로 (마이그레이션 v107)
- **DnD modifier**: 일반 drop = Add (N:M 자연), Shift+drop = Move (single 시맨틱 보존)
- **MultiFolderMarker**: 다중 폴더 시 다른 폴더 카운트만 chip으로 (전체 chip은 카드 과밀)
- **FolderPicker**: 단일 컴포넌트 + 3가지 export로 4곳 chrome 차이 흡수
- **Templates folderId**: single 유지 (개수 적어 N:M 가치 낮음)

## Blockers
- 시드 템플릿 더블클릭 에러 (사용자 워크플로우 차단) — 다음 세션 즉시 fix

## Plans 보존
- `.omc/plans/folder-nm-migration.md` (PR a/b/c 모두 완료, 참고용)
- `.omc/plans/template-b-edit-ui-unification.md` (이전 PR b)
