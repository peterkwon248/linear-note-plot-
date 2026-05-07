# NEXT-ACTION

> **다음 세션 즉시 시작할 액션.** 다른 컴퓨터에서 작업 이어받기 위한 source of truth.
> before-work는 이 파일을 가장 먼저 읽는다.

**마지막 갱신**: 2026-05-07 (밤)
**머신**: 집 (Windows, 메인 진행)
**현재 Phase**: Plot v3 Phase 0/1 ✅, Phase 2 ⏸️ deferred. Group C PR-D 5/5 ✅.
**Store version**: v115

---

## 🎯 다음 즉시 액션 (우선순위 순)

### 🔴 Option A — Plot v3 Phase 3+ 시작 (추천)

**왜**: v3 PRD 흐름 자연. Phase 0/1 완료 + Phase 2 deferred 후 Phase 3+가 다음.

**첫 스텝**:
1. `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` Phase 3+ 영역 정독
2. 후보 phases 식별:
   - **Notion/Linear 하이브리드 에디터** (TipTap 25+ ext 위에 새 UX layer)
   - **Type rename PR** (Label/Category/Sticker → Type/Pack UI 레이블만 변경, 코드 그대로)
   - **5 view modes 신규** (Table/Gallery/Studio/Editorial/Graph segmented switcher)
   - **activity-bar reskin** (a-actbar 패턴)
   - **Linear-style filter popover** (2-column popover)
3. Phase 3는 큰 작업 → ralplan 또는 plan으로 분해 plan 작성 후 진행
4. 분해 후 첫 PR 작업

### 🟡 Option B — Wiki template 3-layer
- Layout Preset + Content Template + Typed Infobox
- Wiki domain 작업
- v3 Phase 3+와 독립

### 🟡 Option C — Smart Book v2
- AutoSource[5] (folder/category/tag/label/sticker)
- Book entity 신규 (Plot v3 7번째 space 예정 — rose 팔레트)

---

## 🧠 잊지 말 것 (이번 세션 핵심 결정)

### Plot v3 Phase 2 DEFERRED (영구 결정, 2026-05-07 밤)
- Imperial icon kit 전면 도입 **보류**
- phosphor-icons 그대로 유지
- partial work (activity-bar Imperial / plot-icons IconWiki = WikiBook / view 일부) **revert 안 함, 보존**
- 근거: 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) + 119 files codemod = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
- 재개 조건: 정확한 인벤토리 + imperial-extras shim 매핑 coverage 검증 + 단일 책임 PR 분할
- 기록: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` 상단 DECISION banner + `.omc/plans/v3-phosphor-inventory.md` ARCHIVED

### Group C PR-D 시리즈 5/5 완성 (이번 세션 핵심 결과물)
- 5 entity (Tags / Labels / Stickers / References / Files) 모두 view-engine 통합
- 각 thin fork hook + DisplayPanel + list+grid mode + idempotent migration
- thin fork 패턴 영구 (Generic 화는 scope 폭발 — MEMORY.md 영구 결정)

### 디자인 인프라 보강 (이번 세션)
- 4 design skills install (project-level, `.agents/skills/`)
  - design-taste-frontend (Senior UI/UX, metric-based)
  - high-end-visual-design (agency-grade)
  - redesign-existing-projects (v3 visual refresh와 정합)
  - minimalist-ui ("Gentle by default" 정합)
- skills-lock.json (cross-machine sync). 새 머신: `npx skills experimental_install`로 symlink 재생성

### 평가 후 적용 X 결정
- **onlook** (visual code editor): production app 자동 코드 변경 회귀 위험. greenfield/marketing 사이트에 적합. Plot에는 X
- **Front-End-Design-Checklist** (passive 40+ items): design-quality-gate + linear-design-mirror + 4 design skills과 중복. handoff 가이드라 1인 dev에 부적합

### shadcn-ui 확인
- ✅ 이미 깊이 적용됨 (components.json "new-york" + components/ui/* 30+ + @radix-ui 28개)
- v3 PRD에 "shadcn cascade 보존" 정책 명시 (line 28)

---

## 📊 현재 Phase 진행 상황

### Plot v3 visual refresh
- ✅ Phase 0: cleanup (v112) — ViewMode "table"→"list", --v3-priority-* namespace
- ✅ Phase 1: token foundation (v3 tokens, accent #5E6AD2, status desaturated, Source Serif 4, `_legacy/` scaffold)
- ⏸️ Phase 2: Imperial icons codemod **DEFERRED**
- ⏳ Phase 3+: PRD 후속 phases (분해 plan 필요)

### Group C PR-D (view-engine 통합 5/5)
- ✅ PR 1: Tags v110 (#261)
- ✅ PR 2: Labels v111 (#262)
- ✅ PR 3: Stickers v113 (a055581)
- ✅ PR 4: References v114 (c3700ad)
- ✅ PR 5: Files v115 (f210fcf)

### Store version 진화 (이번 세션)
- v112 (이전) → v113 (Stickers) → v114 (References) → v115 (Files)

---

## ⏸️ 보류 / 영구 폐기

- **Imperial icon kit 전면 도입** — Phase 2 DEFERRED (위 참조)
- **onlook visual editor** — Plot에 부적합
- **Front-End-Design-Checklist** — 중복

---

## 🔧 작업 환경

- worktree: `.claude/worktrees/magical-austin-019d72`
- branch: `claude/magical-austin-019d72`
- dev server: port 3002 (webpack mode, Next.js 16.1.6)
- node_modules: 정상 install
- 디자인 skills: project-level (`.agents/skills/`)
