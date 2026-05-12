# after-work: Save mental state + Commit + Push + PR + Merge (project-level, git tracked)

> ⚠️ **이 명령어는 *다른 컴퓨터에서 작업을 이어받기 위한* 크로스-머신 동기화 명령어다.**
> - 진짜 source of truth = **git tracked `docs/*.md`**. Local memory(`~/.claude/.../memory/`)는 *보조 캐시*일 뿐.
> - 어느 단계도 스킵하지 말 것. 단계 0~3(docs 갱신)을 빼면 다른 머신에서 컨텍스트 복원 불가.
> - 단계 8(Merge)는 이 명령어 정의의 일부. 별도 사용자 승인 묻지 않는다 (force push, --no-verify 같은 destructive 행위만 별도 확인).
>
> **NEXT-ACTION.md 폐지 (2026-05-12)**: SESSION-LOG entry 가장 위에 "다음 즉시 액션 hook" 1~2줄로 통합.
> TODO.md P0 + SESSION-LOG hook 두 곳이 다음 세션 즉시 시작점.
>
> **글로벌 `~/.claude/commands/after-work.md`는 폐지**. 이 project-level 정의가 단일 진실.

세션을 마무리할 때 다음 머신/세션이 매끄럽게 이어질 수 있도록 멘탈 상태를 git tracked docs에 저장하고 git 워크플로우 완료.

## Steps

### 0. Bootstrap (필수 docs 파일 누락 시 skeleton 생성)
프로젝트 루트에 다음 파일이 누락되어 있으면 minimal skeleton 작성 (전부 git tracked이어야 함):
- `docs/SESSION-LOG.md` — 세션 history (append-only)
- `docs/MEMORY.md` — Source of Truth (PR history, phase status, current direction)
- `docs/CONTEXT.md` — Current features, design decisions
- `docs/TODO.md` — 우선순위 (P0/P1/P2/P3)

생성한 게 있으면 사용자에게 보고. 이 파일들이 없으면 다른 컴퓨터에서 컨텍스트 복원 불가.

⚠️ `docs/NEXT-ACTION.md`는 폐지됨 (2026-05-12). 생성 X. 만약 있다면 그 내용을 SESSION-LOG hook + TODO P0로 흡수 후 삭제.

### 1. 🎯 SESSION-LOG.md에 새 entry 추가 (가장 중요, 스킵 금지)
`docs/SESSION-LOG.md`의 **최상단에** 새 entry 추가. **entry 첫 줄에 "다음 즉시 액션 hook"** — 다음 세션 시작점.

사용자에게 묻기:
- "다음에 가장 먼저 할 작업은?" (1~3개) → hook
- "잊지 말아야 할 결정사항?" → "브레인스토밍 & 큰 결정" 섹션

Entry 구조:

```markdown
## YYYY-MM-DD 시간대 (머신)

> 🎯 **다음 즉시 액션**: {1~2줄 hook — TODO.md P0와 정합}
> **머신**: {집 / 회사}
> **현재 main HEAD**: {PR 번호 또는 commit}

### 완료
- {완료한 작업 목록 + PR 번호}

### 브레인스토밍 & 큰 결정 (영구)
- {중요 결정사항 + 이유 — MEMORY.md에도 push}

### 기술 학습 (영구)
- {재발 방지 사례 / 패턴 / 함정 — MEMORY.md에도 push}

### Watch Out (다음 세션 주의사항)
- {미들 작업 / 회귀 가능성 / IDB migration 등}

### 환경 변경
- Store version: {v??? → v???}
- Tests: {N/N pass}
- 신규 파일: {목록}
```

오래된 entry는 그대로 유지 (append-only).

### 2. TODO.md 정리
- **완료된 P0 항목**: "✅ 최근 완료" 섹션으로 이동 (날짜 + PR 번호 명시)
- **새 발견 P0**: 가장 위에 추가
- **stale 항목 발견 시**: 코드 ground truth로 검증 후 제거 또는 정정
- P1/P2 새 항목은 그대로 append
- 첫 줄 "마지막 갱신": 오늘 날짜로

### 3. 핵심 docs 업데이트 (스킵 금지)
- **`docs/MEMORY.md`** — Source of Truth. 완료된 작업을 PR 목록에 append, 현재 진행 방향 / 다음 우선순위 갱신, 큰 결정 (영구) 섹션 추가
- **`docs/CONTEXT.md`** — Completed Features 최근 5개만 유지, 완료 항목 삭제, 큰 결정 추가
- **`CLAUDE.md`** — Stack/convention/store version 변경 시만

각 파일을 read 후 edit. **스킵 금지**.

### 4. Local memory sync (보조 캐시)
- `~/.claude/projects/.../memory/MEMORY.md` 갱신
- **docs/MEMORY.md를 master로** 동기화. 충돌 시 docs 우선.
- 사람이 다른 컴퓨터에서 시작할 때 local memory가 없을 수 있음을 인지 — 진짜 컨텍스트는 docs에 박는 게 핵심
- `currentDate` 갱신

### 5. Commit (docs 변경이 staged 되었는지 검증)
- `.env`, credentials, `node_modules`, `tsconfig.tsbuildinfo` 제외
- **단계 1~3에서 갱신한 모든 docs 파일이 staging에 포함되어야 함**. `git status`로 검증. 누락 시 *진짜 갱신할 게 없었는지* 재확인 후 진행.
- 변경 파일 staging 후 descriptive 메시지로 commit
- 메시지에 주요 변경사항 + Co-Authored-By 포함

### 6. Push
- `git push origin <current-branch>`
- 새 브랜치면 `git push -u origin <branch>`

### 7. PR
- 기존 PR 있는지 확인 (`gh pr list --head <branch>`)
- 없으면 `gh pr create --base main` + 모든 커밋 요약
- 있으면 스킵

### 8. Merge (스킵 금지 — 명령어 정의의 일부)
- `gh pr merge --squash --delete-branch`
- worktree 충돌로 `--delete-branch` 실패 시 flag 빼고 재시도 후 수동 정리
- 머지 충돌 시 force-merge 하지 말고 사용자에게 보고
- ⚠️ CLAUDE.md의 일반 안전 원칙("PR 머지는 명시 승인 필요")으로 이 단계를 빼지 말 것. 사용자가 `/after-work`를 호출한 시점에 머지가 명시 승인된 것으로 간주.

### 9. 최종 Report

```
✅ AFTER-WORK COMPLETE

📝 저장된 멘탈 상태 (git tracked, 다른 컴퓨터에서 복원 가능)
- SESSION-LOG.md: 새 entry 추가됨 (다음 즉시 액션 hook 포함)
- TODO.md: P0 정리됨

📚 Docs 업데이트
- MEMORY.md: {추가된 항목}
- CONTEXT.md: {변경사항}

🔀 Git 워크플로우
- Commit: {메시지}
- Push: ✅
- PR: {URL}
- Merge: ✅ to main

🎯 다음 세션 시작 시 (다른 컴퓨터에서도 OK)
{SESSION-LOG entry 첫 줄의 "다음 즉시 액션 hook"}
```
