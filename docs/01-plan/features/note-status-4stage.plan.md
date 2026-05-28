# NoteStatus 3→4단계 REPLACE: stone/brick/keystone → backlog/todo/in_progress/done

> **완성도 축 유지, 3눈금 → 4눈금 세분화 + 라벨 교체.** Linear 어휘를 빌리되 의미는 "노트 완성도"로 재정의.
> 태스크 관리 피벗 아님 — colors.ts:141 주석이 이미 brick=정리 중·keystone=완성으로 적시 → 같은 축의 진화.
> **단일 atomic PR** (partial = 컴파일 에러). 데이터모델 PR이지만 atomic rename 특성상 UI/route 함께 (note-status-rename.md 선례 #옵션A 동일).

## 0. 메타
- 상태: Locked spec (2026-05-29). 사용자 승인: 4단계 REPLACE + 라우트 rename "다 바꿔줘".
- store version: **v149 → v150** (IDB migration 필수)
- 폐기되는 LOCKED: **#118**(스톤/브릭/블록 음역 시그니처) + **#100**(브랜드 phosphor 3아이콘) — 4단계 완성도 축으로 대체.

## 1. 결정 (영구)

### 4단계 완성도 축
| 옛 (3) | 새 enum | EN | KO | 의미 |
|--------|---------|----|----|------|
| `stone` | `backlog` | Backlog | 대기 | 방금 캡처, 미분류 raw |
| — | `todo` | Todo | 준비 | 🆕 triage 끝·키울 의도, 본문 빈약 (빈 채 시작) |
| `brick` | `in_progress` | In Progress | 정리 중 | 링크·적극 가공 중 |
| `keystone` | `done` | Done | 완성 | 결정화·참조 가치 |

### 색 (NOTE_STATUS_HEX, dark canonical)
| enum | hex | 비고 |
|------|-----|------|
| `backlog` | `#94a3b8` | slate-400 (옛 stone 그대로) |
| `todo` | `#3b82f6` | blue-500 🆕 ("planned/queued", 쿨톤) — **tweakable** |
| `in_progress` | `#f59e0b` | amber-500 (옛 brick 그대로) |
| `done` | `#34d399` | emerald-400 (옛 keystone 그대로) |
ramp = slate → blue → amber → emerald (정체 → 계획 → 활성 → 완성).

### 아이콘 (Linear progress circle — #100 phosphor 건물 메타포 폐기)
| enum | phosphor |
|------|----------|
| `backlog` | `CircleDashed` |
| `todo` | `Circle` |
| `in_progress` | `CircleHalf` |
| `done` | `CheckCircle` |

### 라우트 slug
`/stone → /backlog` · `/brick → /in-progress` · `/keystone → /done` · `/todo` 🆕
- redirect 생략 (개인 앱·IDB 로컬·사이드바 네비). 필요 시 후속.

## 2. v150 IDB Migration spec (lib/store/migrate.ts)
3→4 매핑 (todo는 신규라 매핑 소스 없음):
```ts
// v150: NoteStatus 3→4 (stone→backlog, brick→in_progress, keystone→done)
const STATUS_MAP: Record<string,string> = { stone:"backlog", brick:"in_progress", keystone:"done" }
// 1) notes[].status
if (Array.isArray(state.notes)) state.notes = state.notes.map(n => ({ ...n, status: STATUS_MAP[n.status] ?? n.status }))
// 2) viewStateByContext keys (stone/brick/keystone → backlog/in_progress/done)
// 3) SavedView.space === stone/brick/keystone → mapped
// 4) 영속 autopilot 규칙 conditions/actions value (field:"status") → mapped
// 5) filterState / 기타 영속 status 리터럴 → mapped
```
idempotent 보장 (이미 backlog 등이면 no-op).

## 3. 표면적 (status 참조 43파일 — 핵심)
- **데이터모델**: `lib/types.ts:1` enum · `lib/store/migrate.ts`(v150) · `lib/store/index.ts:271`(version 150) · `lib/store/helpers.ts:67`(workflowDefaults 기본 "backlog")
- **색/문구**: `lib/colors.ts:147` NOTE_STATUS_HEX(+1) · `app/globals.css` `--status-*` CSS vars · `lib/i18n.ts:214-216,1169-1171`(status.* 키 4종 EN/KO) + `:725,1675`(ontology breakdown 4 placeholder)
- **view-engine**: `types.ts:8-10`(ViewContextKey) `:237`(STATUS_ORDER) `:254`(VALID keys) · `defaults.ts:37-39`(CONTEXT_DEFAULTS) · `group.ts:99-105`(STATUS_LABELS/KEYS) · `context-filter.ts:23-35` · `graph-filter-adapter.ts:58,72` · `saved-view-context.ts:54-56,75-81` · `view-configs.tsx:185-187`(display) `:532`(filter "Note" group)
- **필터**: `components/filter-bar.tsx`
- **디스플레이**: `components/display-panel.tsx`
- **아이콘/칩**: `components/status-icon.tsx` (3-way → 4-way circle) · StatusShape 류
- **보드**: `components/notes-board.tsx`(컬럼 3→4) · notes-table·note-fields·notes-grid·notes-timeline
- **autopilot**: `lib/autopilot/defaults.ts:6-47` (rule 값 stone/brick/keystone → mapped; todo는 default 규칙 미접촉 = 수동 단계) + `__tests__/engine.test.ts`
- **ontology**: dashboard-charts·ontology-legend·ontology-graph-canvas (status breakdown 3→4 count)
- **라우트**: `app/(app)/{stone→backlog, brick→in-progress, keystone→done}/` dir rename + `app/(app)/todo/` 신규 + 모든 내부 링크(linear-sidebar.tsx 등)

## 4. Must / Must NOT
**Must**: atomic 일관 rename · v150 migration(데이터 손실 0, idempotent) · tsc 0 · build clean · tests pass(literal 갱신) · 보드 4컬럼 · 필터/디스플레이 4옵션 · autopilot 기존 동작 보존(이름만 매핑)
**Must NOT**: 완성도 축 의미 변경(같은 progression) · todo에 default 자동규칙(수동 단계로 시작) · 색 ramp 외 임의 변경 · 다른 기능 묶기

## 5. Success
- [ ] 43파일 일관, tsc/build clean, tests pass
- [ ] /backlog /todo /in-progress /done 정상 + 사이드바 4항목
- [ ] 기존 사용자: v150 후 stone→backlog, brick→in_progress, keystone→done. todo 빈 상태. 데이터 손실 0
- [ ] autopilot 규칙 backlog→in_progress / in_progress→done 정상
- [ ] Architect verification
