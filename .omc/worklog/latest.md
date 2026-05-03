---
session_date: "2026-05-04"
project: "Plot"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/fervent-nash-44e7da"
duration_estimate: "~3 시간, 2 PRs squash-merged (folder N:M 시리즈 완성)"
---

## Completed Work

2 PRs squash-merged to main (Folder N:M 시리즈 PR b/c 완성):

- **PR #255** PR (folder-b) — UI type-strict 시각화. 신규 `folder-picker.tsx` (kind-aware, 3가지 export로 4곳 dedup) + 사이드바 Notes/Wiki Folders 분리 + `/folder/[id]` kind 분기 + DnD wrong-kind drop 거부 + notes board/table 다중 폴더 FolderChip. 8 files +744/-397 LOC.
- **PR #256** PR (folder-c) — Multi-folder UX. FolderPicker `selectMode="multi"` (체크박스 + Apply) + Detail panel 다중 폴더 chip strip + "Add to folders…" 우클릭 메뉴 + group-by-folder MultiFolderMarker + DnD Shift modifier (Add vs Move). 10 files +931/-124 LOC, 18 신규 N:M 액션 테스트.

**Folder N:M 시리즈 총합 (PR a/b/c #253/#255/#256)**: 17 commits, 65+ files, +3215/-685 LOC, 18 신규 테스트.

## In Progress
- 없음 (모든 작업 머지 완료)

## Remaining Tasks (다음 세션 — 우선순위 순)

### 🔴 즉시 (사용자 워크플로우 차단)
- [ ] **BUG**: 시드 템플릿 더블클릭 시 에러. 시드 13개는 정상 보이지만 더블클릭 편집 안 됨. 정확한 콘솔 메시지 미수집. PR c~e 변경 중 어딘가 원인. `template-edit-page.tsx` + `templates-table.tsx` row click 시점부터 디버깅. **사용자에게 콘솔 메시지 요청 필요.**

### 🟡 큰 작업 후보
- [ ] **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장). Templates/Folder가 본보기. 가장 자연스러운 다음 큰 작업.
- [ ] **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox) — 위키 데이터 모델 위 별도 설계 필요
- [ ] **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
- [ ] **Template seed audit** — `PlotTemplate<T>` 추상화 검토

### 🟣 마지막 (출시 폴리시)
- [ ] **Note UI toolbar** (UpNote-style) — Pin/Focus/Version 5-6 핵심 버튼

### 🟤 마지막에 논의 (보류)
- [ ] **House (계보 시각화)** — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체. 다음 토론 시 결정.

### 🟢 작은 후속 정리
- [ ] Templates grid chip 시스템 완전 통일 (PR e deviation 정리)
- [ ] NoteTemplate 타입에서 description/status/priority 필드 제거 + 마이그레이션
- [ ] 키보드 shortcut (D/T/P) — 노트 + templates 통합
- [ ] Wiki bulk action bar (필요해지면)
- [ ] FolderPicker 검색 필터 (50+ 폴더 시점)

## Key Decisions (이번 세션)
- **FolderPicker 추상화 패턴**: 단일 컴포넌트 + 3가지 export (Popover content / inline-submenu / 훅) — 호출 사이트가 자기 chrome 결정. 4곳 dedup.
- **DnD modifier 시맨틱**: 일반 drop = Add (N:M 자연), Shift+drop = Move (이전 single 시맨틱 보존). 첫 drop 시 toast 안내.
- **MultiFolderMarker**: group-by-folder에서 다중 폴더 노트의 다른 폴더 카운트만 chip으로 (전체 chip은 카드 과밀, "+N" 패턴).
- **multi-mode picker UI**: local pending Set + Apply 버튼 (count summary). single-toggle보다 명확.
- **Wiki bulk action**: 별도 bar 없음 결정. wiki-list 우클릭 메뉴만. 향후 만들 때 같은 패턴.

## Technical Learnings
- **DnD shiftKey 감지**: `shiftPressedRef` (global keydown/keyup listener) 패턴으로 re-render 없이 modifier 추적. 카드 update 영향 X.
- **vitest jsdom 미설정**: 프로젝트는 .ts 만 (component .tsx 테스트 X). 슬라이스 액션 단위 테스트로 대체.
- **Linear 패턴 cross-cutting 적용**: PR e의 chip overflow ("+N") 패턴이 PR (folder-b) 다중 FolderChip + PR (folder-c) MultiFolderMarker에 자연 transplant.
- **Memo equality 업데이트 의무 재확인**: BoardCard / NoteRow의 새 prop (groupKey 등) 추가 시 memo 비교에도 추가 안 하면 update 안 됨.
- **Inline create + auto-check**: FolderPicker multi 모드에서 "+ New folder" 클릭 시 자동 pre-check → create-then-apply 한 번에.

## Blockers / Issues
- **시드 템플릿 더블클릭 에러** (사용자 워크플로우 차단): 이전 세션부터 미해결. 정확한 콘솔 메시지 미수집. 다음 세션 즉시 fix 필요.

## Environment & Config
- **Worktree**: `C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/fervent-nash-44e7da`
- **Main HEAD**: PR #256 머지 직후
- **Store version**: v107 (변경 없음, 이번 세션은 UI만)
- **Build**: tsc clean, npm run build clean (33 routes), npm run test 185/185 pass
- **Local main checkout 실패** (gh pr merge --delete-branch 시): 이전과 동일. 서버 머지 정상.

## Notes for Next Session
- **새 worktree 시작 권장** — fervent-nash-44e7da는 일단락. 다음은 클린 worktree.
- **다음 작업 우선순위**: 1순위 = 더블클릭 BUG fix (사용자에게 콘솔 메시지 요청), 2순위 = Group C PR-D (planner 위임)
- **Plan 문서 참고**: `.omc/plans/folder-nm-migration.md` (PR a/b/c 완료된 참고용)
- **Group C PR-D는 큰 작업**: 5-8 PRs로 분할. planner 활용 필수. Templates/Folder 시리즈가 본보기.

## Files Modified (이번 세션 전체)

### PR #255 (folder-b UI 분리, 8 files +744/-397)
- 신규: `components/folder-picker.tsx`
- 변경: linear-sidebar, app/(app)/folder/[id]/page.tsx, notes-board, notes-table, floating-action-bar, side-panel-context, views/wiki-list

### PR #256 (folder-c Multi-folder UX, 10 files +931/-124)
- 신규: `lib/store/__tests__/folders-nm-actions.test.ts` (18 테스트)
- 변경: folder-picker (multi 모드), side-panel-context, wiki-article-detail-panel, note-detail-panel, notes-table, floating-action-bar, views/wiki-list, notes-board, property-chips
