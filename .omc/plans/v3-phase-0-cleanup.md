# Plot v3 Visual Refresh — Phase 0: Pre-flight Cleanup

> **PRD reference**: `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` (전체 컨텍스트)
> **Phase 0 목표**: Critic이 발견한 C1 (priority 토큰 namespace 충돌) + C2 (ViewMode 타입 mismatch)를 Phase 1 시작 전 사전 정리. Phase 1의 token swap이 깨끗한 baseline 위에서 진행되도록 보장.
> **예상 기간**: 0.5일
> **예상 PR 수**: 1
> **선행 phase**: 없음 (이 phase가 Phase 1 시작 전 prerequisite)

---

## 1. Context

Phase 1 (token swap) 시작 전, 두 가지 사전 정리가 필요하다 — 두 사항 모두 Phase 1에서 함께 처리 시 commit이 비대해지고 회귀 추적이 어려워지므로 별도 PR로 분리한다.

### 정리 대상

#### C1 — Priority 토큰 namespace 충돌 (사전 마련)

현재 `app/globals.css`:
- Line 39 (`:root`): `--priority-medium: #d97706;`
- Line 130 (`.dark`): `--priority-medium: #fbbf24;`
- Line 202 (`@theme inline`): `--color-priority-medium: var(--priority-medium);`

v3 mockup의 `--priority-{high,medium,low}`는 v3 desaturated 팔레트로 다른 값. Phase 1에서 **그대로 덮어쓰면 Plot 5-tier (none/low/medium/high/urgent)와 v3 3-tier (high/medium/low)가 같은 변수명으로 충돌**한다.

해결: v3 priority는 `--v3-priority-*` namespace로 격리. Plot `--priority-*`는 그대로 보존.

**Phase 0에서는 변수 declaration 자리만 마련** (`--v3-priority-high: ;` 등 빈 값). Phase 1에서 v3 mockup 값을 채워 넣음.

#### C2 — ViewMode 타입 mismatch

두 곳에서 `viewMode` 타입이 다르다:

| 위치 | 타입 | 비고 |
|------|------|------|
| `lib/view-engine/types.ts` line 30 | `"list" \| "board" \| "grid" \| "insights" \| "calendar" \| "graph" \| "dashboard"` | view-engine의 single source |
| `lib/types.ts` line 318 (`SavedView.viewState.viewMode`) | `"list" \| "table" \| "board" \| "insights" \| "calendar" \| "graph" \| "dashboard"` | `"table"` 포함, `"grid"` 누락 |

**문제**:
1. `"table"`은 view-engine `ViewMode` union에 없음 (legacy 명칭, list와 동일 의미로 추정)
2. `"grid"`는 SavedView 타입에 없음 (view-engine은 지원)
3. `normalizeViewState` (`lib/view-engine/defaults.ts:137`)는 `VALID_VIEW_MODES`에 의존하여 fallback 처리 — `"table"`이 들어오면 base.viewMode (default)로 떨어짐

**판단**: `SavedView.viewState.viewMode`를 view-engine `ViewMode`와 일치시킨다 (legacy `"table"` → `"list"` 매핑). saved view에 저장된 기존 `"table"` 값은 store migration v111 → v112에서 `"list"`로 변환.

---

## 2. 사용자 결정 사항 (확정)

이 phase는 critic 발견사항 해결만 다룸. PRD §10 Q1-Q14 결정사항은 Phase 1에서 적용.

이 phase에서 결정된 사항:
- **C1 namespace 정책**: v3 priority는 `--v3-priority-*` 네임스페이스. Plot 5-tier 그대로 유지.
- **C2 ViewMode 통합**: `SavedView.viewState.viewMode`에서 `"table"` 제거, `"grid"` 추가. 저장된 `"table"`은 마이그레이션으로 `"list"` 변환.

---

## 3. 영향 파일

### 직접 변경

- `lib/types.ts` — `SavedView.viewState.viewMode` union 정정 (line 318)
- `lib/store/migrate.ts` — v111 → v112 마이그레이션 블록 추가 (saved view viewMode `"table"` → `"list"`)
- `lib/store/index.ts` — version: 111 → 112 (line 245)
- `lib/view-engine/defaults.ts` — `normalizeViewState` 내부에 legacy `"table"` 매핑 helper 추가 (saved view 외부에서 들어오는 경우 대비)
- `app/globals.css` — `--v3-priority-{high,medium,low}` 빈 declaration 자리 마련 (값은 Phase 1)

### 검증 (변경 X)

- `lib/store/slices/saved-views.ts` — 신규 saved view 생성 시 `viewMode: "list" as const` 그대로 (변경 불필요)
- `lib/view-engine/view-configs.tsx` — `supportedModes?: ViewMode[]` (이미 view-engine 타입 사용)
- 모든 test 파일 — 0 regression 검증 대상

---

## 4. 작업 단위 분해 (executor 위임 가능)

### Task T0.1 — `SavedView.viewState.viewMode` union 정정

**입력**: `lib/types.ts` line 318

**작업**:
1. `viewMode` union 변경:
   - Before: `"list" | "table" | "board" | "insights" | "calendar" | "graph" | "dashboard"`
   - After: `"list" | "board" | "grid" | "insights" | "calendar" | "graph" | "dashboard"`
2. `"table"` 제거, `"grid"` 추가 (view-engine `ViewMode`와 일치)
3. JSDoc 추가: `@migrated v112 — legacy "table" mapped to "list"`

**위임**: `executor-low` (haiku, 단일 line edit)

**Acceptance**:
- `lib/types.ts` `SavedView.viewState.viewMode`가 view-engine `ViewMode`와 정확히 일치
- `tsc --noEmit` clean (단, T0.2 미실행 상태에서는 saved-views slice의 default value는 영향 없음 — `"list" as const`)

---

### Task T0.2 — `normalizeViewState`에 legacy `"table"` mapping helper

**입력**: `lib/view-engine/defaults.ts` line 137

**작업**:
1. `normalizeViewState` 함수 내부, viewMode 검증 직전에 legacy 매핑 helper 추가:
   ```ts
   // Legacy mapping: pre-v112 saved views may have viewMode === "table"
   // (was a synonym for "list"). Normalize before VALID_VIEW_MODES check.
   const rawViewMode = (merged.viewMode as string) === "table" ? "list" : merged.viewMode
   ```
2. 기존 `VALID_VIEW_MODES.includes(merged.viewMode)` → `VALID_VIEW_MODES.includes(rawViewMode)`
3. fallback 결과를 `rawViewMode`로 사용

**위임**: `executor-low` (haiku, 짧은 helper 추가)

**Acceptance**:
- pre-v112 데이터에 `viewMode: "table"`이 있어도 `"list"`로 정상 해석
- `tsc --noEmit` clean
- 기존 view-engine 테스트 0 regression

---

### Task T0.3 — Store migration v111 → v112

**입력**: `lib/store/migrate.ts`, `lib/store/index.ts`

**작업**:
1. `lib/store/index.ts` line 245: `version: 111` → `version: 112`
2. `lib/store/migrate.ts`에 v112 마이그레이션 블록 append:
   ```ts
   // v112: SavedView.viewMode legacy "table" → "list"
   // Critic finding C2: align SavedView with view-engine ViewMode
   if (state.savedViews && Array.isArray(state.savedViews)) {
     state.savedViews = (state.savedViews as Record<string, unknown>[]).map((v) => {
       const viewState = v.viewState as Record<string, unknown> | undefined
       if (viewState && (viewState.viewMode as string) === "table") {
         return {
           ...v,
           viewState: { ...viewState, viewMode: "list" },
           updatedAt: v.updatedAt ?? new Date().toISOString(),
         }
       }
       return v
     })
   }
   ```
3. Migration은 idempotent: 두 번 실행해도 안전 (이미 `"list"`인 view는 변환하지 않음)

**위임**: `executor` (sonnet, 마이그레이션 코드는 신중)

**Acceptance**:
- 기존 saved view 데이터에 `viewMode: "table"`이 있으면 v112 마이그레이션 후 `"list"`로 변환됨
- `viewMode: "list"`인 view는 그대로 유지
- 두 번 실행해도 결과 동일 (idempotent)
- `tsc --noEmit` clean
- store version: 112

---

### Task T0.4 — `app/globals.css`에 `--v3-priority-*` namespace 자리 마련

**입력**: `app/globals.css`

**작업**:
1. `:root` block에 빈 declaration 추가 (Phase 1에서 채움):
   ```css
   /* v3 priority tokens — values to be filled in Phase 1 (separate from Plot --priority-* 5-tier) */
   --v3-priority-high: ;
   --v3-priority-medium: ;
   --v3-priority-low: ;
   ```
2. `.dark` block에도 동일 declaration 추가 (값은 Phase 1)
3. `@theme inline` block은 변경 X (Phase 1에서 노출)
4. 기존 `--priority-{high,medium,low,urgent,none}` 토큰 그대로 보존 (Plot 5-tier)

**위임**: `executor-low` (haiku, CSS 5줄 추가)

**Acceptance**:
- `--v3-priority-{high,medium,low}` 변수가 `:root`와 `.dark`에 declaration만 존재 (값 비어있음)
- `--priority-{high,medium,low,urgent,none}` Plot 5-tier 그대로
- CSS 빌드 통과 (`npm run build` clean)
- 기존 컴포넌트 0 시각 변화 (빈 변수는 무시됨)

---

### Task T0.5 — Test verification

**입력**: 기존 test suite

**작업**:
1. `npm run test` — Vitest 전체 실행
2. view-engine tests 통과 확인 (saved view normalize, migration 등)
3. saved-view tests 통과 확인 (`lib/store/slices/saved-views.ts` 사용처)
4. `npx tsc --noEmit` 0 errors
5. `npm run build` clean

**위임**: `qa-tester` (sonnet) 또는 직접

**Acceptance**:
- 모든 기존 테스트 PASS (0 regression)
- 빌드/타입체크 clean
- 마이그레이션 idempotent 확인 (2회 실행 시 동일 결과)

---

## 5. Task Flow

```
T0.1 (SavedView union 정정)
   ↓
T0.2 (normalizeViewState helper)  ←── 의존성: T0.1과 독립
   ↓
T0.3 (migration v111 → v112)
   ↓
T0.4 (--v3-priority-* declaration)  ←── 독립 (CSS만)
   ↓
T0.5 (test verification)
```

병렬화 기회:
- T0.1 + T0.4 — 완전 독립 (TS vs CSS)
- T0.2는 T0.1 후 (혹은 동시에 — 같은 view-engine 모듈)
- T0.3은 T0.1 후 (마이그레이션이 새 union 사용)
- T0.5는 마지막

---

## 6. Acceptance Criteria (Phase 0 전체)

- [ ] `SavedView.viewState.viewMode` union이 view-engine `ViewMode`와 정확히 일치 (legacy `"table"` 제거, `"grid"` 추가)
- [ ] `normalizeViewState`에 legacy `"table"` → `"list"` mapping helper 작동
- [ ] Store migration v111 → v112 idempotent 작동 (saved view viewMode `"table"` → `"list"` 변환)
- [ ] `app/globals.css`에 `--v3-priority-{high,medium,low}` declaration 자리 마련 (`:root` + `.dark`, 값은 Phase 1)
- [ ] `--priority-{high,medium,low,urgent,none}` Plot 5-tier 그대로 보존
- [ ] `npm run build` clean
- [ ] `tsc --noEmit` 0 errors
- [ ] `npm run test` (Vitest) all pass — 기존 테스트 0 regression
- [ ] 기존 saved view 사용 시각 회귀 0건
- [ ] CONTEXT.md / MEMORY.md 업데이트 (PR 후, store v112 명시)

---

## 7. Commit Strategy

| Commit | 내용 |
|--------|------|
| `chore(view-engine): align SavedView ViewMode with view-engine union (Phase 0.1)` | T0.1 + T0.2 결과 |
| `feat(store): migrate v111 → v112 (SavedView viewMode "table" → "list") (Phase 0.2)` | T0.3 결과 |
| `chore(tokens): reserve --v3-priority-* namespace declarations (Phase 0.3)` | T0.4 결과 |
| `docs(plot-v3): Phase 0 cleanup complete — ready for Phase 1` | CONTEXT/MEMORY 업데이트 |

**PR 분할**: **단일 PR** 권장 (4 commits squash). Phase 0은 "사전 정리" 단일 단위.

---

## 8. Risk + Mitigation

| Risk | 영향 | 완화책 |
|------|------|--------|
| 마이그레이션 시 사용자가 `"table"` saved view 가짐 | 자동 `"list"` 변환 — 사용자 혼란 가능 | release note 명시: "saved view 'table' mode now displays as 'list'. Use 'grid' for tile layout if desired." |
| `--v3-priority-*` 빈 declaration이 CSS 파서에 invalid 처리될 가능성 | 빌드 실패 | 각 declaration 끝에 sentinel value (예: `unset`) 사용. e.g. `--v3-priority-high: unset;` |
| view-engine 테스트가 legacy `"table"` 입력 케이스 미커버 | normalizeViewState helper 회귀 가능 | T0.2에 legacy `"table"` 입력 → `"list"` 출력 케이스 단위 테스트 추가 |
| Migration이 saved views가 없는 fresh state에 잘못 작동 | undefined 접근 에러 | `Array.isArray(state.savedViews)` 가드 (T0.3 코드에 포함) |

---

## 9. Success Definition (Phase 0)

Phase 0가 성공이라 함은:

1. `SavedView.viewState.viewMode` 타입이 view-engine `ViewMode`와 single source of truth로 통합되었고
2. 기존 saved view 데이터가 v112 마이그레이션을 통해 안전하게 변환되었으며 (`"table"` → `"list"`)
3. `normalizeViewState`가 legacy 입력에 대한 fallback을 제공하고
4. `--v3-priority-*` namespace가 사전 마련되어 Phase 1 token swap 시 충돌 없이 진행 가능하며
5. 기존 `--priority-{high,medium,low,urgent,none}` Plot 5-tier가 100% 보존되었고
6. 모든 기존 테스트가 0 regression이며
7. 빌드/타입체크가 clean인 상태.

이후 Phase 1 (token swap)으로 진행. Phase 1은 Phase 0 결과를 baseline으로 삼아, `--v3-priority-*`에 v3 mockup 값을 채워 넣고 다른 v3 토큰을 통합한다.

---

## 10. Handoff to Phase 1

Phase 0 완료 후:
- `docs/CONTEXT.md`에 Phase 0 완료 추가 (store v112 명시)
- `docs/MEMORY.md`에 PR 히스토리 append (Completed PRs 섹션)
- Phase 1 plan (`.omc/plans/v3-phase-1-tokens-typography.md`)에서 Phase 0 결과 참조
- Phase 1 Task 1.2 (`globals.css` token swap)에서 `--v3-priority-{high,medium,low}` 변수에 v3 mockup 값 채워넣기 (PRD §5.2 결정 Q8 반영)
