# Plot v3 Visual Refresh — Phase 1: Tokens + Base Typography

> **PRD reference**: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` (전체 컨텍스트)
> **Phase 1 목표**: v3 mockup의 design tokens를 Plot에 통합. 모든 후속 phase의 시각 변화를 자동으로 따라오게 하는 foundation.
> **선행 phase**: Phase 0 (`.omc/plans/v3-phase-0-cleanup.md`) — `--v3-priority-*` namespace declaration 자리 마련 + ViewMode 통합 완료 후 시작
> **예상 기간**: 3-5일
> **예상 PR 수**: 1-2

---

## 1. Context

Phase 1은 visual refresh의 foundation이다. 토큰 시스템이 v3에 정렬되면 후속 phase (icon, sidebar reskin, table mode 등)는 자동으로 따라온다. **시각 변화 자체는 미세** (token 이름 정리 + 일부 색 보정). 큰 시각 변화는 Phase 3+에서 발생.

### Phase 0 결과 활용

Phase 0가 완료되면 다음이 baseline으로 보장됨:
- `--v3-priority-{high,medium,low}` namespace declaration 자리 마련 (`:root` + `.dark`, 값 비어있음)
- `SavedView.viewState.viewMode` = view-engine `ViewMode` (single source of truth)
- store v112

Phase 1 Task 1.2에서 `--v3-priority-*`에 v3 mockup 값을 채워넣음. 다른 v3 토큰도 함께 통합.

### 현재 상태 (인벤토리 기반)

- `app/globals.css` — Plot 토큰 시스템 (`--background`, `--foreground`, `--accent`, `--sidebar-*`, `--priority-*` 5-tier 등)
- `lib/colors.ts` — 색 export (SPACE_COLORS, NOTE_STATUS_HEX, PRIORITY_HEX, PRESET_COLORS, etc.)
- **빌드 에러 baseline** (`.omc/plans/v3-tsc-errors-classified.md` 실측 결과):
  - `tsc --noEmit` 0건 (current pass)
  - `npm run build` clean
  - phosphor SSR 경로 사용 2 files (Phase 2에서 자동 해결, Phase 1 scope 제외)

### v3 mockup 토큰 (참조)

`C:\Users\user\AppData\Local\Temp\plot-v3-mockup\plot-v3-tokens.css` + `plot-base.css`:

핵심 토큰 (light/dark):
```
--bg, --bg-elev, --fg, --soft-fg, --muted-fg, --whisper-fg
--muted, --border, --border-strong
--hover-bg, --active-bg
--accent, --accent-soft
--sidebar-bg, --sidebar-fg, --sidebar-icon, --sidebar-muted, --sidebar-count
--sidebar-border, --sidebar-hover, --sidebar-active, --sidebar-active-text
--space-{home,notes,wiki,calendar,ontology,library,books}
--status-{inbox,capture,permanent}
--priority-{high,medium,low}
--font-sans (Geist), --font-serif (Source Serif 4), --font-mono (Geist Mono)
--r-{2,3,4,5,6,8,10,12} (radius)
--t-{fast,mid,slow} (motion)
--shadow-{sm,md,lg}
--font-{2xs,xs,sm,base,md,lg,xl,2xl,3xl}
--editor-font-size, --editor-line-height
--activity-bar-w, --sidebar-w, --header-h
```

---

## 2. 사용자 결정 사항 (모두 LOCKED)

PRD §10 Q1-Q14 모두 LOCKED. Phase 1 작업은 결정된 값을 그대로 적용.

### Q1. SPACE_COLORS 정책 — **결정: B (Plot 현재 유지) LOCKED**

| Space | Plot 현재 | v3 mockup | 적용 값 |
|-------|-----------|-----------|--------|
| home | `#5e6ad2` indigo | `#5E6AD2` indigo | `#5e6ad2` (Plot 유지, v3와 거의 동일) |
| notes | `#06b6d4` **cyan** | `#5E6AD2` indigo | **`#06b6d4` (Plot 유지)** |
| wiki | `#8b5cf6` **violet** | `#4F46E5` indigo-purple | **`#8b5cf6` (Plot 유지)** |
| ontology | `#0f766e` teal-700 | `#0E9384` teal | `#0f766e` (Plot 유지) |
| calendar | `#ec4899` **pink** | `#DC6803` orange | **`#ec4899` (Plot 유지)** |
| library | `#b45309` amber-700 | `#B54708` brown-amber | `#b45309` (Plot 유지) |

### Q2. `--accent` 색 — **결정: A (v3 `#5E6AD2`) LOCKED**

| Mode | 적용 값 |
|------|--------|
| light `--accent` | `#5E6AD2` (v3 indigo) |
| dark `--accent` | `#7C8AE7` (v3 dark indigo) |

### Q3. NOTE_STATUS 색 — **결정: A (v3 desaturated) LOCKED**

| Status | Plot 현재 | v3 mockup | 적용 값 |
|--------|-----------|-----------|--------|
| inbox | `#22d3ee` cyan saturated | `#6B7280` neutral gray | **`#6B7280`** |
| capture | `#f97316` orange | `#D97706` brown-orange | **`#D97706`** |
| permanent | `#22c55e` green | `#0E9384` teal-green | **`#0E9384`** |

### Q8. Priority 토큰 namespace — **결정: A (`--v3-priority-*` 격리) LOCKED**

| Token | 적용 값 |
|-------|--------|
| `--v3-priority-high` | (v3 mockup 값) |
| `--v3-priority-medium` | (v3 mockup 값) |
| `--v3-priority-low` | (v3 mockup 값) |
| `--priority-{high,medium,low,urgent,none}` | Plot 5-tier 그대로 보존 |

(v3 mockup 정확한 값은 `C:\Users\user\AppData\Local\Temp\plot-v3-mockup\plot-v3-tokens.css` 참조 — Task 1.1 mapping에서 확정)

---

## 3. 영향 파일

### 직접 변경

- `app/globals.css` — :root + .dark token blocks REPLACE (alias 정책 적용)
- `lib/colors.ts` — token alias 추가, 기존 export 보존
- `app/layout.tsx` — font import 검증 (Geist + Geist Mono + Source Serif 4)

### 간접 영향 (검증만 필요, 변경 X)

- 모든 `app/(app)/*/page.tsx` (사이드 효과: 새 토큰 적용된 시각 변화)
- 모든 `components/*.tsx` (변수 사용처)
- `components/plot-icons.tsx` (token 직접 사용 여부 확인)

### 빌드 에러 fix 대상

`tsc --noEmit` 10건 출력 분석 후 결정 (실행 결과 참조):
- 주로 `@phosphor-icons/react` resolution
- 일부 deprecated React 19 API
- `tsconfig.json` `moduleResolution`, `paths` 검증 필요

---

## 4. 작업 단위 분해 (executor 위임 가능)

### Task 1.1 — Token system 분석 및 alias 정책 설계 (planner / architect)

**입력**:
- `app/globals.css` 현재 :root + .dark blocks
- `plot-v3-tokens.css` + `plot-base.css`
- Phase 0 완료 baseline (`--v3-priority-*` declaration 자리 마련됨)
- 사용자 Q1-Q3, Q8 LOCKED 결정

**작업**:
1. **Token cascade chain 분석** (critic C6 해결):
   - 기존 토큰 dependency graph 매핑: 어떤 컴포넌트가 어떤 토큰을 의존하는지 grep 분석
   - 영향 토큰: `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--ring`, `--sidebar-*` (15+ tokens)
   - cascade 영향: shadcn/ui 컴포넌트 (`components/ui/*`)는 `--background` `--foreground` 등에 의존 → alias 정책으로 backward compat 보장 필수
   - 산출: `Token Cascade Map` (각 토큰 → 사용 컴포넌트 리스트)
2. **Mapping table 작성**:
   - v3 token name → Plot token name → light hex → dark hex → backward-compat alias 여부
   - 예: `--bg` (v3) ↔ `--background` (Plot) — alias 양방향 작동
   - 예: `--v3-priority-high` (v3) — Plot에 없음, 신규 추가 (Phase 0에서 declaration 자리 마련됨)
3. **Alias 정책 명문화**:
   - Layer 1: v3 토큰 (`--bg`, `--fg`, `--soft-fg`, `--v3-priority-*`)
   - Layer 2: Plot 기존 토큰 (`--background`, `--foreground`, `--priority-*`)
   - Layer 3: alias (각 layer 1 토큰을 layer 2 토큰과 동일 값으로 정의)
   - 우선순위: 각 컴포넌트는 v3 또는 Plot 토큰 중 명시적으로 사용 (혼용 금지)

**산출**:
- Token mapping table (확정 버전)
- Token Cascade Map (의존성 그래프)
- alias 정책 문서

**Acceptance**:
- 모든 v3 token이 매핑됨
- 기존 Plot token 사용처 0 영향 (alias 보장)
- shadcn/ui 컴포넌트 정상 렌더링 검증 가능 (`components/ui/*` cascade 통과)

**위임**: `architect` (opus) — token cascade 분석은 cross-file dependency tracing 필요

---

### Task 1.2 — `app/globals.css` 토큰 REPLACE

**입력**: Task 1.1의 mapping table

**작업**:
1. :root block에 v3 tokens 추가 (mapping대로)
   - typography scale (`--font-2xs` ... `--font-3xl`)
   - spacing radii (`--r-2` ... `--r-12`)
   - motion (`--t-fast` ... `--t-slow`)
   - text hierarchy 3-tier (`--soft-fg`, `--muted-fg`, `--whisper-fg`)
   - bg layers (`--bg`, `--bg-elev`)
   - sidebar tokens (이미 있는 것 + v3 신규)
   - space colors (Q1 결정 반영)
   - status / priority colors (Q3 결정 반영)
   - shadow tokens (`--shadow-sm`, `-md`, `-lg`)
2. .dark block에 dark variants 추가
3. 기존 토큰 alias 추가 (backward compat):
   - `--background` (기존) AND `--bg` (v3) → 동일 값
   - `--foreground` AND `--fg` → 동일 값
   - `--card`, `--popover` AND `--bg-elev` → 동일 값
   - `--muted-foreground` AND `--soft-fg` → 동일 값
4. 기존 Tailwind `@theme inline` 블록에 새 토큰 노출 (`--color-bg`, `--color-fg-soft`, etc.)
5. 기존 density / scrollbar / editor css는 그대로 유지

**위임**: `executor` (sonnet)

**프롬프트 (예시)**:
```
Edit app/globals.css to integrate v3 design tokens while preserving backward compatibility.

Source: C:\Users\user\AppData\Local\Temp\plot-v3-mockup\plot-v3-tokens.css + plot-base.css

Requirements:
1. Add v3 tokens to :root and .dark blocks per the mapping table provided.
2. Use alias policy: existing tokens like --background must coexist with new --bg (same value).
3. Do NOT remove any existing token. Add new tokens or alias.
4. Add new typography scale (--font-2xs ... --font-3xl).
5. Add radii (--r-2 ... --r-12).
6. Add motion (--t-fast 120ms cubic-bezier(0.2,0,0.2,1), etc.).
7. Add 3-tier text (--soft-fg, --muted-fg, --whisper-fg).
8. Add space colors per Q1 decision: [paste decision].
9. Add status/priority colors per Q3 decision: [paste decision].
10. Expose new tokens via @theme inline block.
11. Preserve all existing density, scrollbar, editor blocks.

Output: edited app/globals.css. Verify with `tsc --noEmit` clean.
```

**Acceptance**:
- 새 토큰 추가됨, 기존 토큰 보존
- alias 작동 (예: `--background` AND `--bg` 동일 값)
- `npm run build` clean
- `tsc --noEmit` clean (Task 1.5도 함께 fix)
- visual check: 페이지 렌더링 큰 변화 없음 (토큰 정리만, 색은 Q2/Q3 반영분만 변경)

---

### Task 1.3 — `lib/colors.ts` token alias 추가

**입력**: Q1-Q3 결정

**작업**:
1. SPACE_COLORS 변경 (Q1 권장 = 유지 → 변경 X) 또는 변경 (Q1 채택 시)
2. NOTE_STATUS_HEX 변경 (Q3 권장 = v3 채택)
   - `inbox: "#22d3ee" → "#6B7280"` 등
3. PRIORITY_HEX는 Plot 5-tier 유지 (변경 X)
4. PRESET_COLORS 18개 그대로 (변경 X)
5. 새 export 추가:
   - `TEXT_HIERARCHY = { soft, muted, whisper }` (CSS var alias)
   - `MOTION = { fast, mid, slow }` (CSS var alias)
   - `RADIUS = { r2, r3, ..., r12 }`
6. JSDoc comment: 기존 export는 유지, 새로운 의미는 v3 alias

**위임**: `executor-low` (haiku, 단순 edit)

**Acceptance**:
- 기존 export 유지
- 새 export 추가
- typecheck pass
- 사용처 (예: `components/activity-bar.tsx`의 `import { SPACE_COLORS } from "@/lib/colors"`) 정상

---

### Task 1.4 — Font 검증 (`app/layout.tsx`)

**입력**: 현재 `app/layout.tsx`

**작업**:
1. Geist + Geist Mono import 검증 (next/font)
2. Source Serif 4 추가 (Editorial mode 및 editor에서 사용)
3. CSS var 노출: `--font-sans`, `--font-mono`, `--font-serif`

**위임**: `executor-low` (haiku)

**Acceptance**:
- font load 정상
- `--font-sans` (Geist), `--font-mono` (Geist Mono), `--font-serif` (Source Serif 4) 모두 정의
- visual: 글꼴 변경 시각 일치

---

### Task 1.5 — 빌드 에러 분류 + fix (현재 baseline 0건 → 회귀 방지)

**입력**:
- `npx tsc --noEmit 2>&1` 출력
- `.omc/plans/v3-tsc-errors-classified.md` (baseline: 현재 0건)

**작업**:
1. **분류 단계** (critic W3 해결):
   - **A 카테고리**: Phosphor resolution (SSR 경로 등) → **Phase 2에서 자동 해결, Phase 1 scope 제외**
   - **B 카테고리**: 그 외 타입 에러 (token 관련 cascade 영향, deprecated API 등) → Phase 1 scope
   - **C 카테고리**: deprecated/warning → 정리 (선택적)
2. **현재 baseline (인벤토리 결과)**:
   - tsc --noEmit: 0 errors
   - npm run build: clean
3. **Token swap 후 회귀 확인**:
   - Task 1.2 (globals.css token swap) 후 tsc 재실행
   - 회귀가 발생하면 B 카테고리로 fix
   - A 카테고리 (phosphor) 회귀는 Phase 2로 위임

**위임**: `build-fixer` (sonnet) — token swap 후 회귀 발생 시에만 active

**프롬프트 (예시)**:
```
Verify build after Phase 1 token swap.

Project: C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\unruffled-boyd-2b9c53

Steps:
1. Run `npx tsc --noEmit 2>&1` and `npm run build`.
2. If errors found, classify:
   - A: Phosphor resolution → SKIP (Phase 2 scope)
   - B: Token-related cascade (e.g., shadcn/ui --background reference broken) → FIX
   - C: Deprecated API → optional
3. For B errors: trace token alias chain, ensure both old and new token names work.
4. Verify final: tsc --noEmit 0 errors, npm run build clean.

CONSTRAINTS:
- Do NOT change source logic.
- Do NOT touch phosphor-related errors (Phase 2 will handle).
- Only fix token alias / cascade issues.
```

**Acceptance**:
- `tsc --noEmit` 0 errors (baseline 유지 또는 회복)
- `npm run build` clean
- 모든 페이지 정상 작동 (smoke test)
- A 카테고리 에러는 Phase 1 scope 외로 명시 (Phase 2 위임)

---

### Task 1.6 — Visual smoke test

**입력**: dev server 실행

**작업**:
1. `npm run dev` (port 3002)
2. 주요 페이지 방문:
   - / (home)
   - /notes
   - /inbox
   - /capture
   - /permanent
   - /wiki
   - /tag/[id] (sample)
   - /label/[id] (sample)
   - /folder/[id] (sample)
   - /ontology
   - /calendar
   - /library
3. 각 페이지에서:
   - dark/light 모드 토글
   - 시각적 회귀 (큰 변화 X 예상, 색만 미세 보정)
   - 기능: 노트 클릭 / 사이드바 expand-collapse / 검색

**위임**: `qa-tester` (sonnet) — 인터랙티브 검증

**프롬프트 (예시)**:
```
Run visual smoke test on Plot dev server after Phase 1 token migration.

Server: http://localhost:3002

Pages to verify:
- /home, /notes, /inbox, /capture, /permanent, /wiki, /ontology, /calendar, /library
- /tag/[any-id], /label/[any-id], /folder/[any-id]

Per page:
1. Toggle dark/light mode (theme button in activity bar)
2. Verify no visual regression (colors should be preserved or only intentionally changed per Q1-Q3)
3. Verify functionality: click a note, expand/collapse sidebar, use ⌘K search

Report:
- Pages tested
- Visual regressions found (with screenshots if possible)
- Functionality regressions
- Pass/fail per page
```

**Acceptance**:
- 모든 페이지 정상 렌더링
- 기능 회귀 없음
- 시각 변화는 Q1-Q3 결정에 부합

---

### Task 1.7 — `_legacy/` 폴더 준비 (선택적, Phase 1 끝에 또는 Phase 2 시작 시)

**작업**:
1. `components/_legacy/` 디렉토리 생성 (.gitkeep)
2. `components/_legacy/README.md` 작성 (정책 문서):
   - 폴더 목적: 점진 교체 동안의 transitional 보관소
   - **Import path 정책**: `_legacy/` 안의 파일은 codemod 변환 대상에서 **제외** (glob 제외 패턴: `!components/_legacy/**`)
   - **새 작업 정책**: 새 작업 시 `_legacy/` 파일 import 금지 — main 컴포넌트 사용
   - **Deprecation 표시**: `_legacy/` 안의 파일은 파일 상단에 `// @deprecated — moved to _legacy on YYYY-MM-DD. Use [new path] instead.` 주석 필수
   - **삭제 정책**: 사용처 0 확인 후 (`grep "from \"@/components/_legacy"` 0 결과) 다음 quarter 시작 시 archive 또는 삭제
3. **이동 절차**:
   - 옮길 때는 새 파일을 만들고 기존 파일을 보존 (한 번에 다 옮기지 않음)
   - 일정 기간 (각 phase 종료 시점) co-existence 후, 사용처 0 확인되면 기존 파일을 `_legacy/`로 이동

**위임**: 직접 (간단)

**Acceptance**:
- `components/_legacy/` 폴더 존재 (`.gitkeep` 포함)
- `components/_legacy/README.md` 정책 명확 (4 정책: import 변환 제외, 새 작업 금지, deprecation 주석, 삭제 정책)
- codemod 스크립트 (Phase 2 작성 예정)에서 `_legacy/` glob 제외 패턴 사용 가능

---

## 5. Task Flow

```
[Phase 0 완료 prerequisite: --v3-priority-* declaration 자리 + store v112]
   ↓
Task 1.1 (mapping 설계 + Token Cascade Map, architect)
   ↓
Task 1.2 (globals.css, Q1/Q2/Q3/Q8 LOCKED 적용)
   ↓
Task 1.3 (colors.ts, Q3 적용)
   ↓
Task 1.4 (fonts) ─────┐
                      ├──→ Task 1.6 (smoke test, qa-tester)
Task 1.5 (build verify) ─┘
   ↓
Task 1.7 (_legacy/ 폴더 + README 정책)
```

병렬화 기회:
- Task 1.4 (fonts) + Task 1.5 (build verify) — 독립
- Task 1.2 + Task 1.3 — 순차 (1.2가 token 정의 → 1.3이 alias)

---

## 6. Acceptance Criteria (Phase 1 전체)

- [ ] Phase 0 완료 후 시작 (`--v3-priority-*` declaration 자리 마련됨, store v112)
- [ ] 사용자 Q1-Q3, Q8 LOCKED 결정 적용 완료
- [ ] `app/globals.css` v3 token 통합 (alias 정책)
- [ ] `--v3-priority-{high,medium,low}` namespace에 v3 mockup 값 채워짐
- [ ] `--priority-{high,medium,low,urgent,none}` Plot 5-tier 그대로 보존
- [ ] `--accent` light = `#5E6AD2`, dark = `#7C8AE7` (Q2 결정 적용)
- [ ] NOTE_STATUS_HEX v3 desaturated 적용 (`inbox` `#6B7280`, `capture` `#D97706`, `permanent` `#0E9384`)
- [ ] SPACE_COLORS Plot 현재 유지 (`notes` `#06b6d4`, `wiki` `#8b5cf6`, `calendar` `#ec4899` 등)
- [ ] `lib/colors.ts` token alias 추가, 기존 export 보존
- [ ] Geist + Geist Mono + Source Serif 4 font 작동
- [ ] `npm run build` clean
- [ ] `tsc --noEmit` 0 errors (baseline 유지)
- [ ] **shadcn/ui 컴포넌트 정상 렌더링 검증** (`components/ui/*` cascade 통과 — Token Cascade Map 기반)
- [ ] 모든 주요 페이지 정상 렌더링 (qa-tester 검증)
- [ ] dark/light 모드 정상
- [ ] 시각 회귀 없음 (Q1-Q3, Q8 결정에 부합한 변화 외)
- [ ] 키보드 단축키 / 기능 0 regression
- [ ] `components/_legacy/` 폴더 + README 정책 마련 (Task 1.7)
- [ ] CONTEXT.md / MEMORY.md 업데이트 (PR 후)

---

## 7. Commit Strategy

| Commit | 내용 |
|--------|------|
| `chore(tokens): Token Cascade Map analysis (Phase 1.1)` | Task 1.1 산출물 (architect 분석 결과) |
| `feat(tokens): integrate v3 design tokens with alias policy (Phase 1.2)` | Task 1.2 결과 (`--v3-priority-*` 값 채움 포함) |
| `feat(colors): add v3 color aliases, apply Q3 desaturated status (Phase 1.3)` | Task 1.3 결과 |
| `feat(fonts): add Source Serif 4, verify Geist (Phase 1.4)` | Task 1.4 결과 |
| `chore(_legacy): scaffold _legacy folder + import policy (Phase 1.7)` | Task 1.7 결과 |
| `docs(plot-v3): Phase 1 token migration complete` | CONTEXT/MEMORY 업데이트 |

**PR 분할 옵션**:
- **단일 PR**: Phase 1 전부 (token + colors + fonts + `_legacy/`)
- **2 PR**: (1) Token Cascade Map analysis (논의 base), (2) token + colors + fonts (시각 변화)

권장: **단일 PR** (Phase 0 완료 후 baseline clean — 분리 필요성 낮음). build verify는 Task 1.5에서 대응 (현재 baseline 0건 유지).

---

## 8. Risk + Mitigation

| Risk | 영향 | 완화책 |
|------|------|--------|
| alias collision (`--bg` 이미 존재 가능성) | 토큰 충돌 | grep `--bg` 사전 검사, 없으면 안전. Token Cascade Map (Task 1.1)이 사전 검증 |
| `--v3-priority-*` 채움 시 Plot `--priority-*` 5-tier 영향 | Plot 5-tier 손실 | Phase 0에서 namespace 격리됨, Task 1.2는 v3 namespace에만 값 추가 |
| tsc/build verify가 src 코드 수정 요구 | scope 초과 | Task 1.5 build-fixer 명시: A 카테고리 (phosphor) 제외, B 카테고리만 fix |
| `--accent` 변경 시 기존 컴포넌트 색 변화 | 시각 회귀 (의도된 변화) | Q2 LOCKED 결정. qa-tester smoke test에서 검증 |
| shadcn/ui cascade 깨짐 | shadcn 컴포넌트 시각 회귀 | Token Cascade Map 사전 분석 + 검증 (Task 1.1, Task 1.2 acceptance) |

---

## 9. Success Definition (Phase 1)

Phase 1이 성공이라 함은:

1. v3 token system이 globals.css에 통합되었고 (alias 정책 작동)
2. lib/colors.ts에 v3 alias가 추가되었고 (기존 export 보존)
3. font가 작동하며 (Geist + Geist Mono + Source Serif 4)
4. `npm run build` 및 `tsc --noEmit` clean이며
5. 모든 페이지가 정상 렌더링되고
6. dark/light 모드가 정상이며
7. 사용자 시각 검토를 통과한 상태.

이후 Phase 2 (Imperial icons)로 진행.

---

## 10. Handoff to Phase 2

Phase 1 완료 후:
- `docs/CONTEXT.md`에 Phase 1 완료 추가
- `docs/MEMORY.md`에 PR 히스토리 append
- `.omc/plans/v3-phase-2-imperial-icons.md` 작성 시작

Phase 2는 Imperial icon kit 전체 교체 (121 files codemod). Phase 1의 token system 위에서 진행.
