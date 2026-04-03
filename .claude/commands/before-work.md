# before-work: Pull latest from main + Read context

Sync with main and load **ALL** project context for the session.

## Steps

### 1. Sync Latest Code

```bash
git pull origin main
```

- 충돌 시 자동 해결: import→superset, version→higher, code→origin/main 우선
- 해결 후 커밋: `merge: sync with origin/main`

### 2. Install Dependencies

```bash
npm install  # background — 다른 컴퓨터에서 패키지 추가됐을 수 있음
```

### 3. Read ALL Project Context (CRITICAL)

**반드시 모든 파일을 끝까지 읽을 것. 절대 스킵하거나 요약으로 넘기지 않는다.**

#### 3-1. Core docs (필수)
- `docs/CONTEXT.md` — 아키텍처, 완료 기능, TODO 우선순위, 디자인 결정
- `docs/MEMORY.md` — PR 히스토리, 키 패턴, store 슬라이스, 아키텍처 상세

#### 3-2. Discussion docs (필수 — 이게 프로젝트의 "뇌")
`docs/plot-discussion/*.md` 파일을 **전부** 읽는다:
- 앱 레이아웃/Activity Bar 설계
- 디자인 품질 하네스 도구
- 코드베이스 현황 평가 + 디자인 병목 진단
- 빠진 기능 목록 (Tier 1~4)
- 앱 정체성 피벗 (노트앱→개인 워크스페이스)
- 투두 시스템 & 워크플로우 설계
- 기능 카탈로그 (~200개): 에디터, 네비게이션/검색/뷰, 지식/워크플로우, 시스템/커스터마이징
- 경쟁 포지셔닝 (Anytype/AFFiNE/Obsidian)
- Home 대시보드 + 투두 남은 작업

#### 3-3. Project instructions
- `CLAUDE.md` — 스택, 컨벤션, 빌드 명령

### 4. Report Briefing

간결하게 보고:
- Pull 결과 (새 커밋 수, 충돌 여부)
- 현재 store version, slice 수
- **P0 TODO** (CONTEXT.md 기준)
- Discussion docs에서 현재 방향과 관련된 핵심 컨텍스트
- 알려진 버그/미완성 (18-HOME-DASHBOARD-TODO.md 등)

### 5. Ask Direction

사용자에게 이번 세션에서 뭘 할지 물어본다.
