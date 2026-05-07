# Session Log

> 세션 history. Append-only (오래된 entry 그대로 유지).
> 가장 최신 세션이 위.

---

## 2026-05-07 (밤) — 집

### 완료
- **Plot v3 Phase 2 DEFERRED 결정** (commit 3b84d7e)
  - PRD 상단 DECISION banner 추가, Status v1.1 → v1.2
  - `.omc/plans/v3-phosphor-inventory.md` ARCHIVED 표시
  - CONTEXT/MEMORY 결정 기록
- **PR group-c-d-3** Stickers view-engine 통합 v113 (commit a055581, 9 files +427/-92)
  - useStickersView thin fork (cross-entity members count, note/wiki active check)
  - StickerMemberCountChip (Stack icon)
  - list+grid mode + DisplayPanel
- **PR group-c-d-4** References view-engine 통합 v114 (commit c3700ad, 9 files +408/-43)
  - useReferencesView thin fork (caller가 pre-filtered 전달, enrich + sort)
  - 3 신규 chips (RefTypeChip / RefFieldCountChip / RefImageChip)
  - sort + viewMode → viewState. quickFilter / fieldKey filter / search 로컬 유지
- **4 design skills install** (commit 0f7e2ec, 5 files)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - project-level (`.agents/skills/`)
  - cross-machine: `npx skills experimental_install`
- **PR group-c-d-5** Files view-engine 통합 v115 (commit f210fcf, 9 files +423/-39)
  - useFilesView thin fork (Attachment 전용)
  - 2 신규 chips (FileTypeChip / FileSizeChip)
  - column header sort: "type" → "fileType" 명시 변환
  - Grid mode JSX (4:3 thumbnail block + chip row)
- **Group C PR-D 시리즈 완성** (5/5 entity view-engine 통합)
- 외부 레포 평가 (적용 X 결정): onlook, Front-End-Design-Checklist
- shadcn-ui 적용 확인 (이미 깊이 적용됨)

### 브레인스토밍 & 큰 결정 (영구)

#### Plot v3 Phase 2 DEFER (큰 방향 결정)
- **결정**: Imperial icon kit 전면 도입 보류. phosphor-icons 그대로 유지
- **근거**:
  - 직전 plan (`v3-phosphor-inventory.md`) stale ("2 files / 4 icons" → 실측 119 files / 60+ icons / 87 files weight 사용)
  - 119 files codemod = 단일 PR 안전성 위배 (작업 원칙 #2 최소 diff)
  - phosphor regular ↔ Imperial 시각 위화감 미미 (둘 다 1.5px stroke Linear-style) → 도입의 시각 가치 약함
  - 빌드 정상 (tsc 0 / build clean / 185 tests pass)
  - lucide / 외부 라이브러리 추가 도입 의미 없음 (phosphor 광범위)
- **partial work 보존** (revert 안 함): activity-bar / plot-icons IconWiki / view 일부 / backlink-card
- **재개 조건**: 정확한 인벤토리 + imperial-extras shim 매핑 coverage 검증 + 단일 책임 PR 분할

#### 외부 도구 평가 (영구 결정)
- **shadcn-ui**: ✅ 이미 적용 (components.json + components/ui/* 30+). v3 PRD "shadcn cascade 보존" 정책 명시
- **taste-skill** (Leonxlnx, 15.8k): ⭐ install. Plot 정합 4개만. universal symlink (Codex/Cursor/Copilot 등 12 agents 호환)
  - design-taste-frontend / high-end-visual-design / redesign-existing-projects / minimalist-ui
  - 안 install: industrial-brutalist-ui, brandkit, gpt-taste(GSAP), imagegen-*, image-to-code, stitch-design-taste, full-output-enforcement
- **huashu-design** (alchaincyf, 12.3k): △ mockup/prototype 도구. Plot production code에 직접 적용 X. v3 mockup 단계에서만 유용
- **onlook** (onlook-dev, 25.7k): ❌ visual code editor. Plot production app에 자동 코드 변경 회귀 위험. greenfield/marketing 사이트에 적합
- **Front-End-Design-Checklist** (thedaviddias, 5.2k): ❌ passive markdown handoff 가이드. design-quality-gate / linear-design-mirror / 4 design skills과 중복. 1인 dev에 audience 불일치

### 다음 세션 (NEXT-ACTION.md 참조)
- 🔴 **Plot v3 Phase 3+** 분해 plan 작성 → 첫 PR 작업
- 또는 Wiki template 3-layer / Smart Book v2

### Watch Out
- **PR 3-5 build에서 SORT_FIELD_LABELS exhaustive 이슈 반복** — view-engine SortField 추가 시 `notes-table.tsx` Record<SortField, string>에 동일 추가 필요 (PR마다). 이번 세션에 memberCount, fieldCount, size, fileType 모두 추가.
- **tsc --noEmit 통과 ≠ next build 통과** — incremental cache 차이로 build에서 type error 발견 가능. 항상 build까지 검증.
- **Plot v3 Phase 2 partial work** — activity-bar 등 Imperial 사용 중인 컴포넌트는 그대로. 새 코드도 phosphor 또는 Imperial 자유 (둘 다 1.5px stroke 정합).

### 머신
집 (Windows)

### 누적 commits (이번 세션)
1. `3b84d7e` — docs(v3): defer Phase 2 (Imperial icon kit) — phosphor 유지
2. `a055581` — feat(group-c-d-3): Stickers view-engine 통합 (v113)
3. `c3700ad` — feat(group-c-d-4): References view-engine 통합 (v114)
4. `0f7e2ec` — chore(skills): install 4 taste-skill design skills
5. `f210fcf` — feat(group-c-d-5): Files view-engine 통합 (v115) — Group C PR-D 완성

---
