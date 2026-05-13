# Smart Book v2 — Chapter Ordering + Hull Edge + Reading Polish

**Status**: LOCKED v1.0 (2026-05-13, all 13 Open Questions resolved)
**Date**: 2026-05-13
**Owner**: Plot architecture
**Parent PRD**: `.omc/plans/smart-book-prd.md` (v1.1 LOCKED — Phase A-F 완료, 5 AutoSource kind active)
**Sibling PRD**: `.omc/plans/ontology-hull-prd.md` (Hull rendering — Phase I/J 본 PRD에서 분리)

**Revision history**:
- v0.1 (2026-05-13): Initial outline draft — sections 시동, Open Questions (사용자 의사결정 받을 항목)
- v1.0 (2026-05-13): LOCKED — Phase I/J(Hull/Sequence edge)는 `ontology-hull-prd.md`로 분리. 본 PRD scope = Phase G(chapter ordering) + H(reading view) + K(picker UX). 13 Open Questions 모두 추천값으로 resolved.

**Memory references**:
- Smart Book Phase A-F 완료 (PR #312-#317, 2026-05-12 밤)
- Smart Book v1 PRD §6 Non-goals (v2 후보 항목들)
- TODO.md P1 "Smart Book v2 — chapter 정렬 / Hull + Sequence edge 시각화 + Reading view"
- 영구 디자인 원칙: "Gentle by default, powerful when needed"
- INVARIANT (v1 §2): AutoSource는 공급원, BookItem kind = note/wiki/chapter-heading만

---

## 1. Overview

### 1.1 Vision

Smart Book v1이 *"공급원에서 자동 채워지지만 ordered + cross-entity"* 의 기본 가치를 확립했다면, **v2는 사용자 큐레이션 워크플로우의 깊이를 추가한다**:

1. **Chapter 정렬 자유도** — auto items가 source 내부 `updatedAt desc`로 고정되어 있어 사용자가 의도한 흐름(예: "기초 → 중급 → 심화") 표현 어려움. Manual drag default + Auto-sort option으로 양방향 자유.
2. **Hull + Sequence edge in Ontology graph** — 책의 멤버를 그래프에서 시각적으로 묶고(hull) 순서(sequence edge)로 표시. 책의 *spatial* 표현.
3. **Reading view polish** — Phase A의 BookWikiReader / NoteEditor read mode가 작동하지만 책 메타(progress / chapter context / next chapter preview)는 부족.

**Why v2, not v1.x patch**: 위 3 features 모두 데이터 모델 확장 (e.g., `BookItem.userOrder`, `Book.hullStyle`) 또는 store API 신규 (e.g., `reorderAutoItem`) 필요. v1 INVARIANT 보존 + additive 확장.

### 1.2 Non-goals (v2도 제외)

v1 §6 Non-goals 중 v2에도 명시적 제외:
- ❌ AND / NOT semantics (multi-source OR/union만, AND/NOT은 v3)
- ❌ Smart Book 안에 Smart Book 중첩
- ❌ Source filter (e.g., folder + "tag X 있는 것만") — v3
- ❌ Multi-source dedup 정책 변경 (첫 source 우선만, v3)

v2 신규 non-goal:
- ❌ Auto chapter heading rename (auto-generated 유지, 사용자 정렬만 자유)
  - 단, **사용자가 manual로 만든 chapter-heading은 이미 rename 가능** (v1 동작 유지)
- ❌ Cross-book chapter (한 chapter가 여러 책에 속함)
- ❌ Chapter nested (chapter 안의 sub-chapter)

---

## 2. INVARIANT (v1 §2 그대로 유지)

```
Book.items의 element kind = "note" | "wiki" | "chapter-heading" 만.
AutoSource는 "어디서 가져올지(공급원)"이지 멤버 kind가 아니다.
모든 source는 자신이 가진 entity 중 note/wiki만 filter해서 Book.items에 추가한다.
```

v2 신규 INVARIANT 추가:
- **사용자 정렬은 source 내부에서만** — auto chapter heading은 항상 source 순서대로 (LOCKED 후보 #1, 사용자 의사결정).
- **Hull은 derived state** — `Book.items` 변경 시 자동 재계산, 별도 state X.

---

## 3. Scope Phases (LOCKED v1.0)

| Phase | Scope | 예상 시간 | 의존성 |
|-------|-------|----------|--------|
| **G. Chapter ordering — manual drag for auto items** | Auto items에 `userOrder?` 필드 추가 + drag-to-reorder + Auto-sort toggle | ~3-5h | None |
| **H. Reading view enhancement** | Progress indicator + chapter context + Resume 버튼 + 책 메타 표시 | ~3-4h | G |
| **K. AutoSource picker UX 강화** | 5-tab dialog 너비 확장 + cross-tab search + bulk select | ~2-3h | None |

**제거됨 (별도 PRD로 분리)**:
- ~~I. Hull rendering~~ → `ontology-hull-prd.md` (Book + Folder + Sticker 3-source hull display toggle)
- ~~J. Sequence edge~~ → `ontology-hull-prd.md` Phase 2

**v2 총 scope**: Phase G + H + K (~8-12h, 3-4 sessions). 순서 권장: G → H → K (사용자 큐레이션 핵심 우선, picker polish 마지막).

---

## 4. Phase G Detail — Chapter Ordering for Auto Items

### 4.1 사용자 시나리오

```
Before (v1):
1. 사용자가 Smart Book에 "Algorithms" folder source 추가
2. 본문: 📁 Algorithms → [정렬 알고리즘, 그래프 알고리즘, 동적 계획법] (updatedAt desc 자동)
3. 사용자 의도: "기초 → 중급 → 심화" 흐름 만들고 싶음
4. 현재는 manual로 변환(Convert to manual) 후에야 reorder 가능. 그러나 그러면 source 자동 동기화 잃음.

After (v2 Phase G):
1. 같은 setup
2. Auto items도 drag handle 표시 (현재 hidden) → drag로 reorder
3. 사용자가 "동적 계획법" → "정렬" → "그래프" 순서로 drag
4. 새 노트가 folder에 추가되면 auto 추가, 그러나 사용자가 reorder한 기존 items 순서는 보존
5. (옵션) Toolbar의 "Auto-sort" 토글 → 다시 updatedAt desc로 reset
```

### 4.2 데이터 모델 변경

```typescript
// lib/types.ts (변경)
export interface BookItem_Note {
  kind: "note"
  id: string
  refId: string
  order: string  // fractional-indexing
  userOrder?: string  // 🆕 v2: 사용자 manual reorder 시 set, auto items도 set 가능
}
// 동일 패턴으로 BookItem_Wiki, BookItem_ChapterHeading
```

**Resolver 영향**:
- 현재: `manualItems + autoItems sorted by order`
- v2: `manualItems + autoItems` 각각 `userOrder ?? order` 기준 sort
- Auto items의 `userOrder`는 store API로 set/clear (Auto-sort 토글 시 clear)

### 4.3 Store API

```typescript
// lib/store/slices/books.ts (NEW)
reorderAutoItem: (bookId: string, sourceRefId: string, autoItemId: string, newOrder: string) => void
clearAutoUserOrder: (bookId: string, sourceRefId: string) => void  // Auto-sort 토글 시
```

### 4.4 UI 변경

- `BookItemRow` auto row의 drag handle hidden → **visible**
- `disabled: item.source === "auto"` → **disabled false**, 단 sortable scope는 *same source 내부*만
- SourcesSection의 각 source row에 "Auto-sort" 작은 토글 (default off = manual order 보존)
- Toast: "Reordered within {source.name}" / "Reset to auto-sort"

### 4.5 LOCKED candidates (사용자 의사결정 필요)

- 📌 **Open Question Q1**: 정렬 scope — auto items reorder는 **same source 내부**만? 아니면 다른 source의 auto items와 섞을 수 있음?
  - Option A (same source only): mental model 깔끔, source = chapter 단위 보존
  - Option B (cross-source): 사용자 자유도 ↑, 단 dedup 정책 + chapter heading 위치 모호
  - **추천: A** (v1 §LOCKED #5c "Auto bottom" 패턴 정합)

- 📌 **Open Question Q2**: Auto-sort 토글 위치 — SourcesSection 각 row 인라인? 아니면 source 우클릭 메뉴?
  - **추천: 인라인 (눈에 잘 보이게)**

- 📌 **Open Question Q3**: Auto-sort 토글 시 사용자 reorder 손실 — confirm dialog? 아니면 silent + undo toast?
  - **추천: silent + undo toast** (5초 undo 가능)

---

## 5. Phase H Detail — Reading View Enhancement

### 5.1 사용자 시나리오

```
Current (v1):
- BookWikiReader / NoteEditor read mode에서 ← → 또는 ⌘[ ⌘]로 다음/이전 페이지
- BookContextNav의 TOC dropdown으로 jump
- 책 title + counter "N / M"

Missing:
- 진행률 시각화 (가로 progress bar)
- 현재 chapter context (속한 source heading 표시)
- 다음 chapter 미리보기 (다음 chapter heading 이름)
- 책 메타 (총 시간 estimate, 마지막 읽은 페이지)
```

### 5.2 데이터 모델 변경

```typescript
// lib/types.ts (변경)
export interface Book {
  // ...existing
  lastReadItemId?: string  // 🆕 v2: 마지막 본 페이지 (resume 위치)
  lastReadAt?: string  // 🆕 v2
}
```

### 5.3 UI 변경

- Header progress bar (1px 가로, accent color) — `current / total`
- Current chapter context badge 표시 (위 BookContextNav 옆): "in 📁 Algorithms (3 of 7)"
- Next chapter heading preview (책 끝에서 두 번째 페이지 도달 시 footer hint)
- BookDetailPage에 "Resume" 버튼 (`lastReadItemId` 있으면)

### 5.4 LOCKED candidates

- 📌 **Open Question Q4**: 진행률 표시 위치 — header 아래 가로 bar (Linear / 위키 reading 풀스타일)? 또는 BookContextNav 안 inline mini bar?
  - **추천: header 아래 1px subtle bar** (gentle by default)

- 📌 **Open Question Q5**: Resume 자동 vs 명시적 — 사용자가 책 detail 진입 시 자동으로 lastRead로 점프? 또는 "Resume from {chapter}" 버튼만 표시?
  - **추천: 명시적 버튼** (자동 점프는 의도 무시 위험)

---

## 6. Phase I Detail — Hull in Ontology Graph

### 6.1 사용자 시나리오

```
Sticker는 이미 hull 시각화 있음 (member entities를 색깔 hull로 묶음).
Book도 동일 패턴 — Book.items의 note/wiki entities를 hull로 묶음.

Use case:
- 사용자가 "Algorithms" 책에 노트 10개 추가
- Ontology graph에서 이 10개 노트가 같은 hull (책 색)로 묶여 표시됨
- 사용자가 책 단위 지식 클러스터 시각화 — 그래프에 의미 부여
```

### 6.2 데이터 모델 변경

```typescript
// lib/types.ts (변경)
export interface Book {
  // ...existing
  color?: string | null  // 🆕 hull 색 (existing field 활용 또는 신규)
  hullStyle?: "filled" | "outline" | "none"  // 🆕 v2: graph display 옵션
}
```

### 6.3 Ontology Graph 통합

- Sticker hull 패턴 재사용 (`components/ontology-graph/hull-renderer.tsx` 추정)
- Book entity도 hull source로 등록
- Display panel에 "Show Book hulls" toggle

### 6.4 LOCKED candidates

- 📌 **Open Question Q6**: Hull style 기본값 — outline (subtle)? 또는 filled (visible)?
  - **추천: outline** (gentle by default)

- 📌 **Open Question Q7**: Hull 색 — Book.color 사용? 또는 violet (Smart Book) / muted (Manual book) 자동 분기?
  - **추천: Book.color 우선, 없으면 BookKind 색**

- 📌 **Open Question Q8**: 다중 Book이 같은 entity 포함 시 hull 어떻게? overlap? 또는 우선순위?
  - **추천: outline overlap 허용 (Sticker 패턴 정합)**

---

## 7. Phase J Detail — Sequence Edge

### 7.1 사용자 시나리오

```
Book.items의 순서를 그래프에서 시각화:
- Hull 내부 노트들 사이에 화살표 (entity_1 → entity_2 → entity_3)
- 책의 narrative flow를 그래프에서 직접 봄

Optional rendering — Display panel toggle (정보 밀도 ↑)
```

### 7.2 LOCKED candidates

- 📌 **Open Question Q9**: Edge style — solid arrow (강조)? 또는 dashed (subtle)?
  - **추천: dashed thin** (gentle, Hull과 시각 분리)

- 📌 **Open Question Q10**: Edge 표시는 default off / opt-in toggle? 또는 hull과 함께 on?
  - **추천: opt-in toggle** (정보 밀도 자유)

---

## 8. Phase K Detail — AutoSource Picker UX 강화

### 8.1 Pain points (v1 manual verify에서 발견 예상)

- 5-tab dialog 너비 `sm:max-w-md` (~448px) — 5 tab icon-only 답답
- 검색 시 활성 tab만 검색 (cross-tab 검색 X)
- 한 번에 1개 source만 추가 (bulk 선택 X)

### 8.2 변경 후보

- Dialog 너비 `sm:max-w-lg` (~512px) 또는 `sm:max-w-xl`
- Cross-tab unified search (모든 tab 결과 통합)
- Bulk select (Cmd+Click multi-select + "Add 3 sources" 버튼)

### 8.3 LOCKED candidates

- 📌 **Open Question Q11**: Dialog 너비 확장 vs cross-tab search — 둘 다? 또는 하나?
  - **추천: 둘 다 (UX 누적 개선)**

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| `BookItem.userOrder` migration이 기존 책 깨뜨림 | 데이터 손실 | v2 migration은 additive (idempotent: `userOrder ??= undefined`) |
| Auto-sort 토글이 사용자 reorder 실수 reset | UX | undo toast 5초 + confirm dialog 옵션 |
| Hull rendering 성능 (책 100권 × 노트 1000개) | UI lag | Hull culling (viewport 안만 render) + opacity 분기 |
| BookContextNav header 너무 비좁아짐 | UX | progress bar는 header 아래 별도 라인 |

---

## 10. Open Questions 모두 LOCKED (v1.0, 2026-05-13)

13개 모두 사용자 합의 (추천값 그대로):

| # | 결정 사항 | LOCKED |
|---|---|---|
| Q1 | Auto items reorder scope | **A: same source 내부만** |
| Q2 | Auto-sort 토글 위치 | **SourcesSection row 인라인** |
| Q3 | Auto-sort 토글 시 reorder 손실 | **silent + undo toast 5초** |
| Q4 | 진행률 위치 | **header 아래 1px subtle bar** |
| Q5 | Resume | **명시적 "Resume from {chapter}" 버튼** |
| Q6 | Hull style 기본값 | **outline** (→ ontology-hull-prd.md로 이전) |
| Q7 | Hull 색 | **Book.color 우선 + BookKind fallback** (→ ontology-hull-prd.md) |
| Q8 | Multi-Book overlap hull | **overlap 허용** (→ ontology-hull-prd.md) |
| Q9 | Sequence edge style | **dashed thin** (→ ontology-hull-prd.md Phase 2) |
| Q10 | Sequence edge default | **opt-in toggle** (→ ontology-hull-prd.md Phase 2) |
| Q11 | Picker dialog 강화 | **너비 확장 + cross-tab search 둘 다** |
| Q12 | v2 MVP scope | **G + H + K** (Hull/Sequence 별도 PRD 분리) |
| Q13 | Phase G 데이터 모델 | **`userOrder` 신규 필드** (auto/manual 의도 명확) |

---

## 11. Cross-references

- `.omc/plans/smart-book-prd.md` v1.1 (Parent PRD)
- `docs/TODO.md` P1 "Smart Book v2 — chapter 정렬 / Hull + Sequence edge 시각화 + Reading view"
- `docs/MEMORY.md` Smart Book INVARIANT (v1 LOCKED 12개)
- `docs/SESSION-LOG.md` 2026-05-12 (밤) Smart Book Phase A-F 완성

---

## 12. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-05-13 | v0.1 draft outline (Phase G/H/I/J/K + 13 Open Questions) |
