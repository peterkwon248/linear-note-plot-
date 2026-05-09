# Dual Mode (List + Editor) — Product Requirements Document

**Status**: REVISED v1.1 (2026-05-09) — Critic feedback applied
**Date**: 2026-05-09 (initial), 2026-05-09 (v1.1 revision)
**Owner**: Plot architecture

**v1.1 changes** (Critic): RENAMED "Split" → "Dual" (avoids collision with existing `NoteSplitOverlay`). Added `VALID_VIEW_MODES` array update. Flattened `dualSelection` shape (primary-pane-only MVP). SSR-safe `useEffectiveViewMode` with mount guard. Imperative resize handle for `dualRatio` rehydration. Transition-only toast (debounced). Books skip LOCKED. Mid-session deletion behavior specified.

**Memory references**:
- 4-pane layout (Activity Bar / Sidebar / Main / Detail)
- PaneContext + SmartSidePanel dual pane (v71)
- Display popover [List | Board | Gallery] 3-segment 통합 (오늘 세션)
- "Gentle by default, powerful when needed" Plot 정체성

**⚠️ Naming clarification (CRITIC HIGH-1)**:
- This PRD's **"Dual mode"** = main viewport split into list + editor (mail-client pattern)
- **`NoteSplitOverlay`** (existing, `lib/note-split-mode.ts`) = full-overlay note splitting feature, completely different concept
- The two coexist: Note Split (overlay) takes precedence over Dual mode when activated (z-40 covers all). Dual mode is suppressed visually but state preserved.

---

## 1. Overview

### Vision
Mail-client / Notion-style 3-pane mode. Main viewport을 **list + editor 좌우 분할**으로 만들어 list 보면서 selected 항목을 editor에서 동시 편집. 4-pane 레이아웃 → 5-pane처럼 보임 (실제론 Main을 둘로 쪼갠 것).

```
[BEFORE — single mode]
┌────┬──────┬──────────────────┬──────┐
│ AB │ SB   │ List OR Editor   │ Det  │
└────┴──────┴──────────────────┴──────┘

[AFTER — dual mode]
┌────┬──────┬─────────┬──────────┬──────┐
│ AB │ SB   │ List    │ Editor   │ Det  │
└────┴──────┴─────────┴──────────┴──────┘
```

### Why
- Mail/Notion 패턴 표준 — list browse + immediate edit context
- 큰 화면 활용도↑ (laptop 16"+ / desktop)
- Note ↔ Note 빠른 점프 + 수정 흐름

### Non-goals
- 작은 화면 (laptop 13" 등) 강제 사용
- URL 동기화 (per-note URL change in split)
- Books detail page split 강제 (Book 자체가 list 구조)
- 모든 entity 즉시 적용 — Phase별 (References/Files/Tags/Stickers는 의미 평가 후)

---

## 2. LOCKED Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | MVP scope | **전 entity** (Notes/Wiki MVP, References Phase 5, **Books skip — LOCKED**) | 일관성 + 사용자 요청. Books는 자체가 list 구조라 dual 의미 약함 (CRITIC LOW-8) |
| 2 | Toggle 위치 | **D + B 둘 다** — DisplayPanel "Dual" mode + ⌘⇧E 단축키 | 발견성 + power-user 친화 |
| 3 | URL 동작 | **비동기** (URL은 list route만, editor는 internal state) | brower history 깔끔, list 컨텍스트 유지 (macOS Mail 패턴) |
| 4 | 작은 화면 | **자동 fallback** (1200px 미만 시 single 복귀 + toast 알림). Toast는 **transition-only + debounced** (CRITIC MEDIUM-6) | "gentle by default" 정합 |
| 5 | Persist | **viewState.viewMode = "dual"** 자동 저장 (entity별 다름 자동) | 기존 인프라 활용 |
| 6 | Default ratio | **List 40% / Editor 60%** (drag resize 25-65% clamp, persist via `autoSaveId` not controlled — CRITIC MEDIUM-5) | mail-client 표준 |
| 7 | Empty editor pane | "노트를 선택하세요" placeholder | UX 명확 |
| 8 | Detail panel + Dual 공존 | **공존 가능** (사용자 책임) — 단, viewport 좁으면 자동 fallback에서 같이 닫힘 | 자유도 |
| 9 | `dualSelection` shape | **flat (primary-pane-only MVP)** — `dualSelection: { kind, refId } \| null` (CRITIC HIGH-3) | 단순화. secondary pane (⌘\)은 single 강제 (MVP). Phase 5+에서 평가 |
| 10 | Mid-session entity deletion | **자동 cleanup** — selected entity 삭제 시 dualSelection clear + DefaultEmptyState (CRITIC LOW-9) | 안전 |
| 11 | Note Split overlay 우선순위 | **NoteSplitOverlay (`lib/note-split-mode.ts`)가 우선** — 활성 시 Dual mode 시각 suppressed, state는 보존 | HIGH-1 충돌 회피 |

---

## 3. Data Model

### ViewMode 확장 (`lib/view-engine/types.ts`)

**TWO updates required (CRITIC HIGH-2)**:

```typescript
// (1) Line ~33: Type union
export type ViewMode = "list" | "board" | "grid" | "gallery" | "dual" | "insights" | "calendar" | "graph" | "dashboard"

// (2) Line ~232: Runtime validator array — MUST also be updated
// Without this, persisted "dual" viewMode silently falls back on hydration via normalizeViewState
export const VALID_VIEW_MODES: ViewMode[] = ["list", "board", "grid", "gallery", "dual", "insights", "calendar", "graph", "dashboard"]
```

### ViewConfig per entity
각 entity가 split mode 지원 여부:
```typescript
displayConfig: {
  supportedModes: ["list", "board", "split"],  // entity별 다름
  ...
}
```

### UI slice (`lib/store/slices/ui.ts`)

**Flat `dualSelection` (CRITIC HIGH-3)** — primary-pane-only MVP. Secondary pane (⌘\) renders single mode in dual context. Future Phase may extend.

```typescript
interface DualSelection {
  kind: "note" | "wiki"  // Books skip per LOCKED #1
  refId: string
}

interface DualState {
  // Single selection — primary pane only in MVP
  dualSelection: DualSelection | null
  // Persisted: list/editor ratio (default 0.4)
  // Note: stored for reference; ResizablePanelGroup uses autoSaveId for actual rendering
  // (controlling defaultSize doesn't re-render panel positions — CRITIC MEDIUM-5)
  dualRatio: number  // 0.25 ~ 0.65 clamped
  setDualSelection: (sel: DualSelection | null) => void
  setDualRatio: (ratio: number) => void
}
```

**Persistence**:
- `dualRatio` → store partialize (persisted)
- `dualSelection` → session-only (NOT persisted — fresh on each load)
- ResizablePanelGroup `autoSaveId="dual-list-editor"` handles its own persistence (separate from store)

### viewState (per-context)
- 이미 `viewState.viewMode` 있음 → `"split"` 추가만으로 자동 persist
- 기존 store version 변경 불필요 (string union 확장은 backward-compatible)

---

## 4. Phase Plan

| Phase | Scope | 시간 | PR |
|---|---|---|---|
| **1. Layout 인프라** | `SplitListEditor` 컴포넌트 (ResizablePanelGroup 기반), 단축키 ⌘⇧E, 작은 화면 fallback | ~2h | 1 |
| **2. Notes view 통합** | `NOTES_VIEW_CONFIG.supportedModes`에 split 추가, NotesTable+NoteEditor wiring | ~2h | 1 |
| **3. Wiki view 통합** | `WIKI_VIEW_CONFIG`에 split, wiki list + WikiArticleView wiring | ~2h | 2 |
| **4. Books view 통합** | `BooksGrid`에서 split 시 left=grid right=BookDetailPage. 의미 평가 후 채택/skip | ~1.5h | 2 |
| **5. 의미 평가 — References/Files/Tags/Stickers** | Split mode 의미 있는 entity만 추가. 의미 약하면 skip | ~1h 평가 + ~1-2h 구현 | 3 |
| **6. Polish** | DisplayPanel "Split" mode entry, toast 메시지, 키보드 ↑↓ navigation | ~1h | 3 |

**MVP = Phases 1-2 (~4h)** Notes 먼저 완성 → 사용자 검증 → Phase 3-6 점진.

---

## 5. Phase 1 Detail — Layout 인프라

### Files

**New: `components/dual/dual-list-editor.tsx`** (renamed from `split` per CRITIC HIGH-1)

```tsx
"use client"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import type { ReactNode } from "react"

interface DualListEditorProps {
  list: ReactNode
  editor: ReactNode | null
  emptyState?: ReactNode
  /** Unique id for autoSaveId persistence — different per entity if needed */
  storageId?: string
}

export function DualListEditor({ list, editor, emptyState, storageId = "dual-list-editor" }: DualListEditorProps) {
  // Use autoSaveId — react-resizable-panels manages persistence itself.
  // Don't try to control via defaultSize+setState (CRITIC MEDIUM-5).
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1"
      autoSaveId={storageId}
    >
      <ResizablePanel defaultSize={40} minSize={25} maxSize={65} className="overflow-hidden">
        {list}
      </ResizablePanel>
      <ResizableHandle className="bg-border-subtle/30 hover:bg-accent/40 transition-colors w-px" />
      <ResizablePanel defaultSize={60} className="overflow-hidden">
        {editor ?? emptyState ?? <DefaultEmptyState />}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function DefaultEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <p className="text-sm">선택된 항목 없음</p>
      <p className="text-2xs">왼쪽 list에서 항목을 선택하세요.</p>
    </div>
  )
}
```

### Viewport fallback hook (`hooks/use-effective-view-mode.ts`)

**SSR-safe + transition-only toast (CRITIC MEDIUM-4 + MEDIUM-6)**:

```typescript
"use client"
import { useEffect, useState, useRef } from "react"
import { usePlotStore } from "@/lib/store"
import { toast } from "sonner"
import type { ViewContextKey, ViewMode } from "@/lib/view-engine/types"

const FALLBACK_THRESHOLD = 1200

/**
 * Auto-fallback to "list" when viewport too narrow for "dual".
 * Returns the *effective* viewMode (caller may differ from viewState.viewMode).
 *
 * SSR-safe: returns persisted mode until mounted, then switches to viewport-aware.
 * Toast fires only on transitions (narrow ↔ wide), not every resize event.
 */
export function useEffectiveViewMode(contextKey: ViewContextKey): ViewMode {
  const viewMode = (usePlotStore((s) => s.viewStateByContext[contextKey]?.viewMode) ?? "list") as ViewMode
  const [mounted, setMounted] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const wasNarrowRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    const checkNarrow = () => {
      const narrow = window.innerWidth < FALLBACK_THRESHOLD
      setIsNarrow(narrow)
      // Toast only on transition, debounced to avoid spam during drag
      if (viewMode !== "dual") return
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        if (narrow !== wasNarrowRef.current) {
          if (narrow) toast("화면이 좁아 single mode로 전환됩니다", { duration: 3000 })
          else toast("Dual mode 복귀", { duration: 2000 })
          wasNarrowRef.current = narrow
        }
      }, 200)
    }
    checkNarrow()
    window.addEventListener("resize", checkNarrow)
    return () => {
      window.removeEventListener("resize", checkNarrow)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [viewMode])

  // Pre-mount: return persisted mode (SSR-safe, no hydration mismatch)
  if (!mounted) return viewMode
  // Post-mount: apply viewport fallback
  if (viewMode === "dual" && isNarrow) return "list"
  return viewMode
}
```

### Keyboard shortcut (`hooks/use-global-shortcuts.ts`)
- ⌘⇧E → toggle viewState.viewMode between current and `"dual"`
- 검증: 현재 ⌘⇧A actbar / ⌘⇧F sidebar / ⌘B detail / ⌘\ split-pane 과 충돌 X (Critic 확인)

### UI slice extension
- Add `dualSelection: { kind, refId } | null` (flat — primary pane only MVP per LOCKED #9)
- Add `dualRatio: number` (default 0.4) — informational only, ResizablePanelGroup uses autoSaveId

### Mid-session deletion handling (LOCKED #10)
Subscribe to entity store changes in DualListEditor consumer (e.g., NotesTableView):
```typescript
useEffect(() => {
  if (!dualSelection) return
  const { kind, refId } = dualSelection
  const entity = kind === "note" 
    ? notes.find(n => n.id === refId && !n.trashed)
    : wikiArticles.find(w => w.id === refId)
  if (!entity) {
    setDualSelection(null)  // clears → DefaultEmptyState shows
  }
}, [notes, wikiArticles, dualSelection, setDualSelection])
```

---

## 6. Phase 2 Detail — Notes view 통합

### Files

**`lib/view-engine/view-configs.tsx`**:
- NOTES_VIEW_CONFIG.displayConfig.supportedModes에 `"dual"` 추가
- WIKI_VIEW_CONFIG.displayConfig.supportedModes에 `"dual"` 추가 (Phase 3)
- BOOKS skip (LOCKED #1)

**`components/display-panel.tsx`**:
- MODE_DEFS에 `{ mode: "dual", icon: <Columns size={14} />, label: "Dual" }` 추가
- (Phosphor: `Columns`, `Rows`, `SquareSplitHorizontal` 등 후보)

**`components/notes-table-view.tsx`**:
- `useEffectiveViewMode("notes")` 사용 → effective mode 결정
- effective === "dual" 분기 추가:
```tsx
const effectiveMode = useEffectiveViewMode(contextKey)
const dualSelection = usePlotStore(s => s.dualSelection)

if (effectiveMode === "dual") {
  // Mid-session cleanup (LOCKED #10): clear dualSelection if entity gone
  // (useEffect on notes store change — see §5 Mid-session deletion handling)
  return (
    <DualListEditor
      storageId="dual-notes"
      list={<NotesTable {...props} compact onRowClick={(id) => setDualSelection({ kind: "note", refId: id })} />}
      editor={
        dualSelection?.kind === "note"
          ? <NoteEditor noteId={dualSelection.refId} />
          : null
      }
    />
  )
}
```

**`components/notes-table.tsx`** (or wherever):
- `compact` prop 추가 (split mode일 때 visibleColumns 줄임 — title + status + updated만)
- 노트 row 클릭 → setSplitSelection("primary", { kind: "note", refId }) (single mode에선 기존대로 openNote)

### Keyboard navigation
- list에서 ↑↓ → splitSelection 변경 → editor 갱신
- list에서 Enter → editor focus

---

## 7. Phase 3 Detail — Wiki view 통합

Same pattern. Wiki list + WikiArticleView. WIKI_VIEW_CONFIG.supportedModes에 split 추가.

특이사항:
- Wiki article은 frozen-by-default policy 검토 필요 (BookContext와 비슷)
- Hover preview / Pin 등 기존 기능 유지

---

## 8. Phase 4 Detail — Books view 통합 (의미 평가)

### 의문
Book = wrapper. Detail page = list of items. 즉 Book 자체가 list.
Split mode에서:
- left: BooksGrid (책 카드들)
- right: BookDetailPage (선택된 책의 item list — 즉 또 list)

→ "list of lists" 구조. 의미 약함.

### 제안
Books view는 split mode를 **명시적 skip**. Book detail에서 item 클릭 시 noteEditor로 가는 것 (Phase 4 in-book navigation)이 본질.

### Decision pending
Phase 2-3 완료 후 사용자 평가. 의미 있으면 추가, 없으면 skip.

---

## 9. Phase 5 Detail — Other entity 의미 평가

### References
- list = reference rows + editor = ReferenceDetail (현재 modal/popover)
- 의미: 명확. "여러 ref 보면서 한 ref 편집"
- → split 추가 추천

### Files
- list = file cards + editor = file viewer (image preview / PDF iframe)
- 의미: 약함. File은 view-only가 대부분
- → skip 권장

### Tags / Labels / Stickers / Inbox
- list만 있는 entity. editor 없음.
- → split 의미 X. skip

### Recommendation
- **Phase 5 적용**: References만
- **Skip**: Files, Tags, Labels, Stickers, Inbox

---

## 10. Phase 6 Detail — Polish

- DisplayPanel에 "Split" mode entry 추가 (icon + label)
- ⌘⇧E 단축키 hint (Display popover에 표시)
- Toast message: "화면이 좁아 single mode로 전환됩니다" / "Split mode 활성"
- 키보드: ↑↓ list navigation, ⌘⇧E toggle, Esc로 selection 해제
- 기존 `Detail panel + Split` 동시 활성 시 toast: "공간이 비좁을 수 있습니다"

---

## 11. Cross-Cutting

### URL 동작 (CRITIC-anticipated)
- Split mode에선 URL = list route만 (`/notes`, `/wiki`, `/books`)
- 노트/위키 클릭 → splitSelection state 변경, URL 변경 X
- 단, "노트 새 탭으로 열기" 같은 명시적 액션은 URL 변경 (`/notes/{id}` 또는 새 window)

### Persist
- `viewState.viewMode = "split"` (per-context, 기존 IDB 저장)
- `splitRatio` (global, store partialize에 포함)
- `splitSelection` (session-only, partialize에서 제외)

### PaneContext 관계
- Split mode + ⌘\ secondary pane: 공존 가능. Secondary pane도 자기 split 가능.
- 단, viewport 폭 부족 시 자동 fallback 우선순위:
  1. 1200px 미만: split mode → single
  2. 800px 미만: secondary pane도 닫힘
  3. 600px 미만: detail panel도 닫힘

### Detail panel 관계
- Split mode + Detail panel 동시 활성 가능
- 단, viewport 좁으면 detail panel 우선 닫힘 fallback (사용자 토스트 알림)

---

## 12. Verification Gates (per phase)

| Phase | Gate |
|---|---|
| 1 | Layout 컴포넌트 + 단축키 작동, viewport resize 시 fallback 검증 |
| 2 | Notes view: Display에서 Split 선택 → split 화면 노출, 노트 클릭 시 editor 갱신, 키보드 ↑↓ 작동 |
| 3 | Wiki view: 동일 패턴 작동 |
| 4 | Books view: 검토 후 skip 또는 채택 |
| 5 | References: 적용. Files/Tags/Labels/Stickers: skip 확정 |
| 6 | Toast / 단축키 hint / 동시 활성 fallback 작동 |

각 phase: `npx tsc --noEmit` clean + `npm run build` pass + Architect verification.

---

## 13. Out of Scope

- URL 동기화 (per-note URL change in split)
- Mobile / 모바일 viewport 지원 (별도 PRD)
- 3-column split (list + 2 editors)
- Custom split ratio 메모리 (per-entity)
- AI 기반 자동 next-note 추천

---

## 14. Open Questions

- ⌘⇧E 단축키 충돌? (현재 ⌘⇧A actbar / ⌘⇧F sidebar / ⌘B detail / ⌘\ split-pane — 충돌 X 추정. 검증 필요)
- "Display Properties" (visibleColumns)가 split mode에서 자동 compact 되어야 할까? (e.g., split 시 Folder/Backlinks/Words 자동 hidden)
- BookDetailPage가 Note/Wiki editor로 진입할 때 (in-book nav) split mode 어떻게? Book detail에서 book item 클릭 → editor pane에 entity? 또는 그냥 single mode 유지?
- React 19 + dnd-kit + ResizablePanel 호환성 (Edge case 검증 필요)

---

## 15. Acceptance Criteria (MVP = Phases 1-2)

- [ ] Notes view에서 Display popover → "Split" 선택 가능
- [ ] Split mode 활성 시 화면이 list (40%) + editor (60%)로 분할
- [ ] List에서 노트 클릭 → editor pane에 즉시 표시 (URL 변경 X)
- [ ] List ↑↓ 키보드로 next/prev 노트 → editor 갱신
- [ ] ⌘⇧E 단축키로 split ↔ single 토글
- [ ] viewport 1200px 미만 → 자동 single fallback + toast
- [ ] viewport 다시 커지면 split 자동 복귀 (preference persist)
- [ ] Drag resize로 비율 조정 (25% ~ 65% clamp), persist
- [ ] Detail panel + Split 동시 활성 가능 (작은 화면 우선순위 fallback)
- [ ] tsc clean + build pass + architect verification

---

## 16. References

- Plot v3 mockup: `docs/v3-mockup/`
- PaneContext / SmartSidePanel: 기존 split 인프라 (memory v71)
- Linear list+editor pattern: 사용자 2026-05-09 mockup
- Mail clients: macOS Mail (URL 비동기 reference), Gmail (URL 동기 reference)
- Phase 4 in-book navigation: `.omc/plans/book-entity-prd.md` §8
