---
session_date: "2026-05-03 22:30"
project: "Plot"
working_directory: "C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/fervent-nash-44e7da"
duration_estimate: "~5 시간, 5 PRs squash-merged"
---

## Completed Work

5 PRs squash-merged to main:

- **PR #249** Template PR c — view-engine 통합 (list/grid + multi-select + alpha index + chip 일관성). 마이그레이션 v102→v105.
- **PR #250** Template PR d — seed templates 4→13. 신규 사용자 only.
- **PR #251** PR e — Linear-style properties-aware cards. 12개 도메인 chip + visibleColumns wiring + overflow.
- **PR #252** PR f — v106 migration: 기존 사용자에게 9개 신규 시드 idempotent 주입.
- **PR #253** PR (folder-a) — Folder type-strict + N:M 데이터 모델 + 마이그레이션 v107. 45 files +1540/-164 LOC.

## In Progress
- 없음 (모든 PR 머지 완료)

## Remaining Tasks (다음 세션 — 우선순위 순)

### 🔴 즉시 (사용자 워크플로우 차단)
- [ ] **BUG**: 시드 템플릿 더블클릭 시 에러. 시드 13개는 정상 보이지만 더블클릭 편집 안 됨. 정확한 콘솔 메시지 미수집. PR c~e 변경 중 어딘가 원인. `template-edit-page.tsx` + `templates-table.tsx`의 row 클릭 → setSelectedTemplateId 시점부터 디버깅.

### 🟡 PR (folder-b/c) — folder N:M 후속
- [ ] **PR (folder-b)** UI 분리: 사이드바 Notes/Wiki 분리, `/folder/[id]` kind 분기, FolderPicker 컴포넌트 (4곳 dedup), DnD cross-kind drop 거부.
- [ ] **PR (folder-c)** Multi-folder UX: Detail panel 다중 폴더 chips + add/remove, multi-folder picker, DnD add vs move, group-by-folder N번 등장 시각 마커.

### 🔵 worklog 큰 작업
- [ ] **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
- [ ] **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장)
- [ ] **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
- [ ] **Template seed audit** — `PlotTemplate<T>` 추상화

### 🟣 마지막 (출시 폴리시)
- [ ] **Note UI toolbar** (UpNote-style) — Pin/Focus/Version 5-6 핵심 버튼

### 🟤 마지막에 논의 (보류)
- [ ] **House (계보 시각화)** — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체 가능. 다음 토론 시 결정.

## Key Decisions
- **Templates 본질**: 선택 도구 (vs 노트=탐색 대상). list+grid만, board 미지원.
- **Templates 디스플레이 properties 단순화**: status/priority/label/folder/tags/description 폐기 → Index/Updated/Created 3개만.
- **NoteTemplate.status/priority/description**: "default 값"이지 카드 정체성 X. 카드 표시 폐기. 타입 필드 제거는 별도 PR.
- **Linear-style chips**: 도메인별 chip + 하드 캡 3개 + "+N more". pinned는 always-on.
- **Folder type-strict + N:M**: 노트 폴더=노트만, 위키 폴더=위키만. 한 노트가 여러 폴더 가능. 4사분면 모델 (Folder=type-strict / Sticker=type-free) 명확화.
- **혼합 폴더 자동 분리**: 데이터 손실 0. `{name}` (note) + `{name} (Wiki)` 두 폴더로.
- **Templates folderId**: single 유지 (개수 적어 N:M 가치 낮음).
- **시드 마이그레이션 정책**: 신규 사용자 default + 기존 사용자 별도 idempotent (id 충돌 시 skip).

## Technical Learnings
- **Linear chip 패턴 wiring 발견**: 노트/위키 board는 이미 visibleColumns + isVisible(key) 가드 있었음. 진짜 문제는 ad-hoc inline span 시각.
- **wordCount derived from preview** (`note.preview.split(/\s+/).filter(Boolean).length`) — notes-table 기존 패턴.
- **memo comparator 업데이트 의무**: 새 prop 추가 시 비교에도 추가 안 하면 update 안 됨.
- **Migration v107 혼합 폴더 알고리즘**: 데이터 기반 자동 추론 + 혼합 시 클론 분리 (id `{origId}-wiki`).
- **N:M view-engine 영향**: group-by-folder는 다중 폴더 시 N번 등장. count는 unique 처리 별도 필요 (PR c에서).
- **Templates view-engine**: useNotesView는 Note[] 전용. Templates는 thin fork (useTemplatesView)가 정합.
- **TemplateGroupSection sticky 함정**: virtualized 아닌 list에 sticky 쓰면 row 겹침. notes-table은 absolute transform.
- **DisplayConfig 중복 정의**: PR e에서 view-configs.tsx single source로 통합.
- **Templates grid의 "본문 미리보기" 가치**: 짧은 템플릿엔 결정적, 긴 템플릿엔 약함. List default + Grid 옵션 유지.

## Blockers / Issues
- **시드 템플릿 더블클릭 에러** (사용자 워크플로우 차단): PR e 머지 후 발견. 정확한 콘솔 메시지 미수집. 다음 세션 즉시 fix 필요.
- **Templates grid chip 시스템 미통일** (PR e deviation): footer는 inline span 유지. 별도 작은 PR 후보.

## Environment & Config
- **Worktree**: `C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/fervent-nash-44e7da`
- **Main HEAD**: PR #253 머지 직후
- **Store version**: v107 (Folder kind + N:M)
- **Build**: tsc clean, npm run build clean (33 routes), npm run test 167/167 pass
- **Local main checkout 실패** (gh pr merge --delete-branch 시): main worktree가 다른 곳에 있어서. 서버 머지는 정상.

## Notes for Next Session
- **새 worktree 시작 권장** — fervent-nash-44e7da 일단락.
- **다음 작업 우선순위**: 1순위 = 더블클릭 BUG fix, 2순위 = PR (folder-b) UI 분리
- **Plan 문서 참고**: `.omc/plans/folder-nm-migration.md` (PR b/c 명세)
- **Group C PR-D 시작 전 planner 활용 권장** (5-8 PRs 분할)

## Files Modified (이번 세션 전체)

### PR #249 (templates view-engine, 11 files +1351/-458)
- 신규: `templates-floating-action-bar.tsx`, `templates-table.tsx`, `use-templates-view.ts`

### PR #250 (seed templates, 1 file +156/-7)
- `lib/store/seeds.ts` 9개 신규 시드 추가

### PR #251 (Linear cards, 5 files +732/-82)
- 신규: `components/property-chips.tsx`

### PR #252 (v106 migration, 2 files +18/-1)
- `lib/store/migrate.ts` v106 + version bump

### PR #253 (folder N:M PR-a, 44 files +1540/-164)
- 신규: `lib/store/__tests__/migrate-v107.test.ts`, `.omc/plans/folder-nm-migration.md`
- Major: `lib/types.ts`, `lib/store/{migrate, slices/folders, slices/notes, slices/wiki-articles, slices/templates}.ts`, `lib/view-engine/*`, 30+ read-sites
