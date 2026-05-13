# Ontology Hull 3-source + Filter Status 분리

**Status**: DRAFT v0.1 (awaiting user review)
**Date**: 2026-05-13
**Owner**: Plot architecture
**Sibling PRD**: `.omc/plans/smart-book-v2-prd.md` (Phase I/J 본 PRD로 이동)

**Memory references**:
- 2026-05-12 Ontology view 현재 상태 (graph mode + insights mode)
- Sticker hull 이미 존재 (`components/ontology-graph/hull-renderer.tsx` 추정)
- Folder N:M (Note.folderIds, WikiArticle.folderIds)
- Smart Book v2 PRD §6-7 (Hull/Sequence 디테일 일부 reference)
- 사용자 요청 (2026-05-13): Hull은 Sticker + Folder + Book 3-source toggle / Status는 entity별 nested 분리

---

## 1. Overview

### Vision

Ontology graph의 시각적 깊이 + filter 정확성 강화:

1. **Hull 3-source display toggles** — 현재 Sticker만 hull. Folder + Book도 동일 패턴. 사용자가 Display 패널에서 켜고 끔. 책 = 지식 클러스터 / 폴더 = 그룹 컨테이너 / 스티커 = 임시 묶음 — 3 패턴 모두 시각화.
2. **Filter Status entity별 분리** — 현재 Filter > Status에 Stone/Brick/Block (Note 전용)만 표시. cross-entity 그래프인데 Wiki status (stub/article) / Book kind (smart/manual/hybrid) 분리 안 됨. **Nested 구조** (Status > Note/Wiki/Book sub-section).
3. **Sequence edge** (Phase 2, optional) — Hull 내부 책 순서를 화살표로 표시.

### Why now

- Smart Book Phase A-F 완료 (책의 데이터 모델 정착)
- 사용자가 Ontology graph Filter/Display 캡쳐 (2026-05-13) 보내며 명시 시그널
- Sticker hull 이미 작동 — 같은 패턴 확장만 필요 (작은 scope)

### Non-goals
- ❌ Hull source 신규 추가 (Tag/Label hull) — Folder + Book + Sticker 3개만
- ❌ Cross-source hull (Book과 Folder가 겹친 entity hull) — overlap 허용만, 별도 visualisation X
- ❌ Hull 안의 노드 수 제한 — 100+ 노드 hull은 그대로 (Phase 2 culling 검토)
- ❌ Filter Status 외 다른 카테고리 entity별 분리 (Tags / Label / Relations는 기존 유지)

---

## 2. INVARIANT

```
Hull = "노드들이 한 컨테이너(Book/Folder/Sticker)에 속함을 시각적 둘레로 표시"
Hull은 derived state — Book.items / Folder.notes / Sticker.members 변경 시 자동 재계산
Hull on/off는 rendering style (Display Toggle), 어느 hull 보여줄지 (Filter)는 별도 layer
```

---

## 3. LOCKED Decisions (v0.1 draft, 사용자 확인 필요)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Hull source 종류 | **Sticker + Folder + Book 3개** | 사용자 요청. Tag/Label hull은 v3. |
| 2 | Hull on/off 위치 | **Display 패널 (Show X hulls toggle)** | rendering style 토글. Filter X (data 줄이기 아님) |
| 3 | Hull style 기본값 | **outline** (gentle by default) | 정보 밀도 낮게 시작, 사용자가 원하면 filled로 |
| 4 | Hull 색 | **entity의 color 필드 우선 (Book.color / Folder.color / Sticker.color), 없으면 entity-specific 기본색 fallback** | 사용자가 의도한 색 존중 |
| 5 | Multi-source overlap | **overlap 허용** (같은 노드가 Book hull + Folder hull 둘 다 속할 수 있음, 둘 다 표시) | Sticker 기존 패턴 정합, 시각 복잡도는 outline 옵션으로 mitigate |
| 6 | Hull empty 처리 | **0-member hull 자동 hide** (orphan 둘레 어색) | Smart Book §LOCKED #10 v1.2 패턴 정합 |
| 7 | Status filter 분리 구조 | **Option B Nested**: Filter > Status > Note(stone/brick/block) + Wiki(stub/article) + Book(smart/manual/hybrid) | Status 의미 보존 + entity별 sub-section 명확. Linear의 nested filter (Filter-Project properties-Project status) 패턴 정합 |
| 8 | Status filter 미선택 default | **모든 entity status 통과** (Filter 미적용 == 모두 표시) | 직관적, 사용자가 명시적으로 선택해야 filter 작동 |
| 9 | Sequence edge (Phase 2) | **dashed thin + opt-in toggle** | gentle, 정보 밀도 자유 |
| 10 | "어느 hull만 보이게" Filter (Phase 2) | **MVP에는 안 함** (모든 hull 켜진 카테고리는 다 보임). v2 Filter에 "Show hulls for: [pick books/folders/stickers]" 추가 검토 | 작은 MVP 우선, follow-up |

---

## 4. Phase Breakdown

| Phase | Scope | 예상 시간 | 의존성 |
|-------|-------|----------|--------|
| **1. Status filter entity별 nested** | Filter > Status에 Note/Wiki/Book sub-section + 분리 logic | ~2-3h | None |
| **2. Hull 3-source display toggles** | Show book hulls / Show folder hulls toggle 추가 (Sticker hull 패턴 재사용) | ~3-5h | None |
| **3. Sequence edge (optional)** | Hull 내부 책 순서 dashed arrow + opt-in toggle | ~3-5h | 2 |
| **4. "어느 hull만" Filter (follow-up)** | Filter에 entity 단위 hull picker | ~2-3h | 2 |

**MVP**: Phase 1 + 2 (~5-8h). Phase 3 + 4는 사용자 verify 후 우선순위 재평가.

---

## 5. Phase 1 Detail — Status Filter Entity별 Nested

### 5.1 현재 상태
- `Filter > Status` — Stone/Brick/Block (Note status enum)
- Wiki status (stub/article) / Book kind (smart/manual/hybrid)는 별도 filter 없음
- Ontology graph는 cross-entity인데 Status filter는 Note만 작동 (Wiki/Book 노드는 영향 X)

### 5.2 변경 후
```
Filter > Status
├─ Note   ▾  □ stone  □ brick  □ block
├─ Wiki   ▾  □ stub   □ article
└─ Book   ▾  □ smart  □ manual  □ hybrid
```

### 5.3 데이터 모델 변경
없음 (filter logic만). FilterRule 타입은 이미 entity-specific value 받음.

### 5.4 UI/UX
- FilterPanel의 Status 카테고리 expand 시 3 sub-section
- 각 sub-section은 collapsible (Linear 패턴)
- "Note > stone" 체크 시 → Note 노드 중 status=stone만 표시 + Wiki/Book 노드는 영향 X
- Default = 미선택 (모두 표시)

### 5.5 Edge cases
- 사용자가 Note 필터만 적용 → Wiki/Book 노드는 다 표시 (의도된 동작)
- "Note=stone" + "Wiki=article" 동시 적용 → 두 entity 각각 filter, 합치는 graph에 OR 표시
- Book kind는 derived value (smart vs manual vs hybrid는 `getBookKind(book)` 패턴 — Smart Book v1)

---

## 6. Phase 2 Detail — Hull 3-source Display Toggles

### 6.1 현재 상태
- Sticker hull 이미 작동 (그래프에서 sticker 멤버 노드들 색 구름)
- Folder hull / Book hull 없음

### 6.2 변경 후 — Display 패널 새 toggle 3개
```
Display > List Options
├─ Show note nodes        (existing)
├─ Show wiki nodes        (existing)
├─ Show tag nodes         (existing)
├─ Show wikilinks         (existing, default on)
├─ Show labels            (existing)
├─ Show book hulls        🆕 (default off, gentle by default)
├─ Show folder hulls      🆕 (default off)
└─ Show sticker hulls     🆕 (existing? default on or off — 사용자 확인)
```

### 6.3 데이터 모델 변경

```typescript
// lib/types.ts (변경)
export interface Book {
  // ...existing
  hullStyle?: "outline" | "filled" | "none"  // 🆕 default "outline"
}
export interface Folder {
  // ...existing
  hullStyle?: "outline" | "filled" | "none"  // 🆕
}
```

Sticker는 이미 hull 작동 — `hullStyle` 추가만.

### 6.4 Hull 색 우선순위 (LOCKED #4)
```
1. entity.color (사용자 설정)
2. fallback:
   - Book: BookKind 색 (Smart=violet / Manual=neutral / Hybrid=amber)
   - Folder: folder kind 색 (note=blue / wiki=purple)
   - Sticker: 기존 sticker.color (이미 있음)
```

### 6.5 Edge cases
- 같은 노드가 Book + Folder + Sticker 모두 속함 → 3 outline 겹침 (LOCKED #5 overlap 허용)
- 100+ 노드 hull (큰 책) → outline 자체는 가벼움, filled만 viewport culling 검토 (Phase 2)
- Hull 멤버 0개 → hull 자체 hide (LOCKED #6)

---

## 7. Phase 3 Detail — Sequence Edge (Optional)

### 7.1 Scope
- Book.items 순서를 그래프에서 화살표로 표시 (entity_1 → entity_2 → entity_3)
- dashed thin (LOCKED #9), opt-in toggle (Display 패널)

### 7.2 변경
```
Display > List Options
└─ Show book sequence  🆕 (opt-in, default off)
```

Folder / Sticker는 sequence 없음 (ordering field 없음). Book만.

### 7.3 사용자 verify 후 우선순위 재평가
- MVP에서 제외 가능 (Phase 1+2 후 사용자 사용 패턴 보고 결정)

---

## 8. Phase 4 Detail — Hull Filter (Follow-up)

### 8.1 사용자 시나리오
```
Display "Show book hulls" 켜져있음 → 모든 책 hull 표시
→ 책 100권이면 시각 복잡
→ Filter에서 "Show hulls for books: [My Reading, Algorithms]" 선택 → 2 책만 hull 표시
```

### 8.2 변경
Filter 카테고리 신규: "Visible hulls" — entity 단위 picker
- Books / Folders / Stickers 각각 multi-select
- 미선택 = all visible

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| 100+ hull overlap → 시각 chaos | UX 저하 | outline default + opacity 분기 + Filter Phase 4로 줄이기 |
| Folder hull과 sticker hull 색 충돌 | 시각 혼동 | 사용자가 entity.color 명시 설정 시 그게 우선 (LOCKED #4) |
| Status filter nested UI 복잡도 ↑ | 학습 비용 | sub-section default collapsed, Linear 패턴 정합 |
| Existing Sticker hull 동작 회귀 | 사용자 데이터 영향 X | 코드 변경 시 회귀 테스트 + sticker hull 그대로 |
| Book.hullStyle / Folder.hullStyle migration | 데이터 호환성 | additive optional 필드, default outline 적용 시 자동 |

---

## 10. Cross-references

- `.omc/plans/smart-book-v2-prd.md` v1.0 (Sibling — Phase I/J 본 PRD로 이동)
- `.omc/plans/smart-book-prd.md` v1.1 (Parent — Smart Book Phase A-F)
- `docs/MEMORY.md` Sticker hull 패턴 (existing)
- `docs/reference/linear/` — Filter / Display 캡쳐 (Plot UI 정합 참조)

---

## 11. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-05-13 | v0.1 draft (Smart Book v2 Phase I/J 분리 + Status entity별 nested) |
