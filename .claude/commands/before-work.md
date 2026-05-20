# before-work: Pull latest + Restore mental state (project-level, git tracked)

> ⚠️ **이 명령어는 *다른 컴퓨터에서 작업을 이어받기 위한* 크로스-머신 동기화 명령어다.**
> - 진짜 source of truth = **git tracked `docs/*.md`**. Local memory(`~/.claude/.../memory/`)는 *그것의 캐시*.
> - Local memory가 없거나 stale이어도 docs를 source로 mental state를 복원해야 한다.
> - 다른 컴퓨터에서 처음 시작 시 local memory가 비어있는 게 정상 — 단계 7이 그걸 채운다.
>
> **NEXT-ACTION.md 폐지 (2026-05-12)**: 정보 중복 (NEXT-ACTION ↔ TODO P0 ↔ SESSION-LOG 끝 "다음" 3중복) 해소.
> 다음 액션은 **TODO.md P0** + **SESSION-LOG 최신 entry의 "다음 hook"** 두 곳만 본다.
>
> **글로벌 `~/.claude/commands/before-work.md`는 폐지**. 이 project-level 정의가 단일 진실.

크로스 머신 워크플로우. 가장 중요한 건 **즉시 다음 액션 복원**.

## Steps

### 1. Git sync
- Run `git pull origin main` to fetch and merge latest main changes
- **Worktree인 경우**: `git merge origin/main`으로 worktree 브랜치에도 반영
- 충돌 자동 해결:
  - Import 충돌: 합집합 (more imports)
  - 버전 번호 (e.g., persist version): 더 높은 값
  - 코드 충돌: origin/main 우선
- 충돌 해결 후: stage + `merge: sync with origin/main` 커밋
- **Uncommitted 체크**: `git status` 실행. 직전 머신에서 commit 안 한 변경이 있으면 사용자에게 큰소리로 알림

### 1.5. 환경 셋업 (dependencies + dev server)
- **`npm install`** — **매번 실행**. cross-machine / 새 worktree에선 `node_modules`가 비었거나, package.json에 새 패키지가 추가됐는데 미설치일 수 있음 (node_modules 폴더가 존재해도 특정 패키지만 누락 가능 — "폴더 존재" 체크로는 못 잡음). 이미 최신이면 npm install은 빠르게 no-op. 에러 나면 무시하고 진행 — 빌드 시점에 다시 잡힘.
- **`npm run dev`** — dev 서버를 **background**로 실행 (preview MCP `preview_start "dev"` 우선, 없으면 background Bash. port 3002). 아래 컨텍스트 복원 단계가 도는 동안 미리 컴파일되도록 먼저 띄운다.
- 둘 다 한 뒤 단계 2로 진행. 최종 Report에 dev 서버 URL(`localhost:3002`) 포함.

### 2. 머신 변경 감지 (가장 빠르게 알림)
- `docs/SESSION-LOG.md` 최신 entry의 머신 표기 확인
- 다른 머신이면 사용자에게 **큰 글씨로 알림**: "직전은 {이전 머신}, 지금은 {현재 머신}"
- IDB/local-only 데이터(노트 콘텐츠, 인증 토큰, 환경별 설정 등)는 머신마다 분리됨을 인지

### 3. 🎯 SESSION-LOG.md 최신 1~2 entry 읽기 (mental state 복원)
**다른 모든 것보다 우선**. 직전 세션의 흐름 + 결정 + 다음 hook 파악.

- `docs/SESSION-LOG.md`의 가장 최근 entry 1~2개 read
- 각 entry 구조:
  - **"다음 즉시 액션" 1~2줄 hook** (entry 가장 위, `> 🎯 다음 즉시 액션: ...`)
  - 완료한 작업
  - 브레인스토밍 & 큰 결정 (영구)
  - 기술 학습 (영구)
  - Watch Out (다음 세션 주의사항)
  - 환경 변경 (store version, tests, 신규 파일)
  - 머신
- 비어있거나 entry 없으면 직전 after-work 누락 신호 → 사용자에게 보고 + 수동 복원 모드로

### 4. 🔴 TODO.md P0 섹션 읽기 (즉시 액션 source)
- `docs/TODO.md` 가장 위 P0 섹션 read
- P0 = 다음 세션 즉시 작업 후보
- 비어있으면 직전 after-work 누락 또는 모든 P0 완료 신호

### 5. Project context 읽기 (꼼꼼히)
- `docs/MEMORY.md` — Source of Truth. PR history, architecture notes, phase status, current direction
- `docs/CONTEXT.md` — Current features, design decisions, 작업 원칙
- `CLAUDE.md` — Project conventions, stack info, store version

### 6. 정합성 확인
- **TODO.md P0 ↔ SESSION-LOG 최신 entry "다음 hook" ↔ MEMORY.md "다음 우선순위"** 정합성
  - 모두 다르면 모순 — MEMORY.md 기준으로 다른 두 파일 맞춤
  - 완료된 항목이 P0/hook에 남아있으면 코드 직접 확인 후 정리
- **stale 시그널 발견 시**: 코드 ground truth > docs. commit log 또는 코드 grep으로 검증

### 7. Local memory rehydrate from docs (보조 캐시 채우기)
- Read local memory: `~/.claude/projects/.../memory/MEMORY.md`
- **docs/MEMORY.md를 master로** 동기화. local이 비어있거나 stale이면 docs에서 재생성.
- 동기화 항목: 현재 진행 방향, P0/P1/P2 우선순위, Key Design Decisions, Store version, 완료된 기능
- docs에 없는 로컬 전용 정보(Architecture, Cross-Machine Workflow 등)는 유지
- `currentDate`를 오늘 날짜로 갱신
- ⚠️ 다른 컴퓨터에서 처음 시작이면 local memory가 비어있는 게 정상 — 이 단계가 채운다. local 없다고 에러로 멈추지 말 것.

### 8. 최종 Report

```
🎯 NEXT ACTION (TODO.md P0 + SESSION-LOG hook 통합)
─────────────
{P0 최상단 1~2줄 + SESSION-LOG hook 검증}

📅 직전 세션 (요약 3줄)
- {SESSION-LOG.md 최근 entry 핵심}

📊 우선순위
- P0: {TODO.md P0 1줄}
- 진행 중 Phase: {있으면}

✅ 동기화
- Pull: {clean / conflicts resolved}
- TODO ↔ SESSION-LOG ↔ MEMORY 정합성: {OK / 정정함}
- Local memory: {rehydrated from docs / OK}

⚠️ 경고 (있으면)
- Uncommitted changes: {파일 목록}
- 머신 변경: {이전 → 현재}
- 직전 after-work 누락 의심: {SESSION-LOG 비어있거나 TODO P0 stale}
```
