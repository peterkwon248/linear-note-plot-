# Group C PR-D — Tags / Labels / Stickers / References / Files view-engine 통합

> 5개 entity를 view-engine + Linear PropertyChip + 통일 패턴으로 정렬. 본보기 = Templates 시리즈 (PR e / template-c) + Folder N:M 시리즈 (PR a/b/c).

---

## 0. Plan 메타데이터

- **상태**: Draft (인터뷰 환경 제약으로 사용자 확인 없이 영구 결정 + 사전 조사 기반으로 추론. § 11 "Reverse-able Decisions" 참고)
- **현재 store version**: v109 (Folder/Tag color nullable)
- **본 PR 시리즈 store version 진화**: v110 → v111 → v112 → v113 (5 PR 중 일부만 bump)
- **본보기 PR**: #249 (template-c, view-engine 통합), #251 (PR e, PropertyChip), #258 (v108 slim), #253-256 (Folder N:M)
- **Plot 정체성**: "Gentle by default, powerful when needed"
- **작업 원칙**: 정확도 + 버그 위험 최소화 (영구) — 변경 전 코드 정확히 이해, 최소 diff, 빌드/타입 검증 의무, UI + 데이터 모델 분리 PR

---

## 1. Context

### 1.1 Original Request

> Plot "Group C PR-D" 통합 플래닝. Tags/Labels/Stickers/References/Files 5개 entity를 view-engine + Linear-style PropertyChip + 통일 패턴으로 통합. 5-8 PR 로드맵 작성.

### 1.2 사전 조사 검증 결과 (코드 직접 확인 후 사실 갱신)

| Entity | 현재 라우트 | view-engine 통합 상태 (실측) | ViewHeader | viewMode UI | PropertyChip | 작업 추정 |
|---|---|---|---|---|---|---|
| **Tags** | `/library/tags` (`/tags` → redirect) | `useNotesView("tag", ...)` — **태그 안 노트 리스트만 통합**. 태그 자체 카드 리스트는 직접 store | ✅ | ? (정확히 미확인) | ❌ | **S+M** (entity 카드 리스트도 view-engine으로) |
| **Labels** | `/labels` (독립, `/library` 밖) | `useNotesView("label", ...)` — **레이블 안 노트 리스트만 통합**. 레이블 자체 카드 리스트는 직접 store | ✅ | ? | ❌ | **S+M** (Tags와 동일 패턴) |
| **Stickers** | `/stickers` (독립, "Library 소속 의미론" 영구 결정. URL brevity 위해 라우트 분리) | useNotesView/Templates **둘 다 사용 안 함**. 직접 store | ✅ | ? | ❌ | **M** (ViewContextKey 신규 + thin fork) |
| **References** | `/library/references` | 직접 store. `useNotesView` 미사용 | ✅ | ❌ (list 고정) | ❌ | **M** (Reference 전용 thin fork — Note 타입 아님) |
| **Files** | `/library/files` | 직접 store. `FilesSortField` 로컬 정의 | ✅ | ❌ (list 고정) | ❌ | **M** (Attachment 전용 thin fork — Note 타입 아님) |

**파일 크기**: library-view.tsx 1748줄 (References + Files 동거), tags-view 782, labels-view 931, stickers-view 846, templates-view 637.

### 1.3 사용자 영구 결정 (이 plan이 수정할 수 없음, memory + 코드 인용)

| 결정 | 근거 | 본 plan 적용 |
|---|---|---|
| **Stickers 라우트 = `/stickers` 영구 유지** | `lib/table-route.ts:100-102` "Stickers — cross-everything index, lives in Library per 33-design-decisions §8. Routed at /stickers (not /library/stickers) for URL brevity." | Stickers 라우트 마이그레이션 PR 없음 |
| **Templates 본질 = 선택 도구 → board 미지원, list+grid만** | PR #251 (PR e), MEMORY.md "Templates 본질: 선택 도구 (vs 노트=탐색 대상). Board 모드 미지원, list+grid만" | 같은 사고법 적용 (§ 4 entity 본질별 viewMode) |
| **thin fork 패턴 정합. Generic 화는 scope 폭발** | MEMORY.md "Templates view-engine 발견: useNotesView는 Note[] 전용. Templates는 thin fork (useTemplatesView)가 정합. Generic 화는 scope 폭발" | 5개 entity 모두 thin fork (`useTagsView`, `useLabelsView`, `useStickersView`, `useReferencesView`, `useFilesView`) |
| **PR 분리 원칙: UI + 데이터 모델 분리, 의미 단위로 묶음** | 영구 작업 원칙 #6 | UI 변경과 데이터 모델 (마이그레이션) 분리. Entity 단위로 묶음 |
| **색 정책 4사분면 LOCKED** | v109 (#259) | Label/Sticker chip = 색 필수, Folder/Tag chip = opt-in (`getEntityColor` fallback) |
| **마이그레이션 옵션 A 기본**: 기존 사용자 데이터 보존 | v109 마이그레이션 정책 | 신규 ViewContextKey 등록 시 viewStateByContext 기본값만 주입 (idempotent) |
| **PR e PropertyChip 패턴 12개**: domain-specific, h-5/text-2xs, hard cap 3개 + "+N more" | `components/property-chips.tsx` 헤더 주석 | `RefTypeChip`, `FileTypeChip`, `FileSizeChip` 추가는 같은 패턴 따름 |

### 1.4 Research Findings

- **`lib/view-engine/types.ts`**: ViewContextKey union, ViewMode union ("list/board/grid/insights/calendar/graph/dashboard"), VALID_VIEW_CONTEXT_KEYS array. 신규 키 추가 시 양쪽 모두 갱신 필요.
- **`lib/view-engine/defaults.ts`**: `CONTEXT_DEFAULTS` 맵에서 entity별 viewMode/sort/groupBy/visibleColumns 기본값 정의. `buildDefaultViewStates()`가 마이그레이션 시 호출됨.
- **`lib/view-engine/use-templates-view.ts`** (263줄, 본보기): "Scope guard: deliberately does NOT reuse applyFilters / applySort / applyGrouping from the notes pipeline — those are typed against Note and would require generic refactoring (=scope creep). Thin templates-only implementations live here." — **본 plan의 thin fork 5개 모두 이 코멘트를 헤더에 주석으로 명시**.
- **`components/property-chips.tsx`**: ChipShell 공통, StatusChip/PriorityChip/FolderChip/LabelChip/TagChip 등. v109 `getEntityColor` 사용. 신규 chip은 같은 패턴.
- **`lib/types.ts`**: Reference (id, title, content, fields, tags, history) / Attachment (id, noteId, name, type: "image"|"url"|"file", url, mimeType, size). Sticker (members: EntityRef[], EntityKind = note/wiki/tag/label/category/file/reference 7종). 7개 EntityKind 발견 (사전 조사의 7과 일치).

---

## 2. Work Objectives

### 2.1 Core Objective

5개 entity (Tags, Labels, Stickers, References, Files) 의 list view를 **Templates 시리즈와 동일한 수준의 일관성**으로 끌어올린다 — view-engine 통합, ViewHeader 사용, viewState persist, PropertyChip 활용, entity 본질에 맞는 viewMode 차등.

### 2.2 Deliverables (PR별 분할은 § 4)

1. 5개 entity 각각 thin fork hook (`useTagsView`, `useLabelsView`, `useStickersView`, `useReferencesView`, `useFilesView`)
2. 5개 entity view 컴포넌트가 ViewHeader + view-engine 통합 (검색/정렬/그룹/필터/viewMode 모두 viewState 저장)
3. PropertyChip이 적용된 entity 카드 (각 entity 본질에 맞는 chip 조합 — § 5)
4. ViewContextKey enum + VALID_VIEW_CONTEXT_KEYS 갱신 (`tags-list`, `labels-list`, `stickers`, `references`, `files`)
5. CONTEXT_DEFAULTS에 5개 entity 기본값 정의 (viewMode, sort, groupBy, visibleColumns)
6. 신규 PropertyChip 변형 (`RefTypeChip`, `FileTypeChip`, `FileSizeChip`)
7. 새 SortField/GroupBy/FilterField가 필요한 경우 view-engine types.ts 확장 (FileSortField는 size, type 추가 필요)
8. 마이그레이션 (PR당 store version bump 필요한 곳만)

### 2.3 Definition of Done

- 모든 5개 entity가 ViewHeader + viewState persist
- `useNotesView` / 직접 store 패턴이 사라지고 thin fork hook 사용
- 각 entity 본질에 맞는 viewMode 옵션이 노출됨 (§ 5)
- PropertyChip이 적용된 카드가 list/grid 모드에서 동일한 시각 무게로 보임
- viewState가 페이지 reload 후에도 보존됨 (zustand persist + 마이그레이션 idempotent)
- `npm run build` + `tsc --noEmit` 0 errors
- 시드 entity가 있는 신규 사용자 / 기존 사용자 모두 데이터 손실 0
- 각 PR 단위로 squash merge 가능 (이전 PR 미머지 상태에서 다음 PR 작업 시작 OK)
- Architect verification 통과

---

## 3. Must Have / Must NOT Have

### 3.1 Must Have

- [x] thin fork 5개 (Generic 추출 X)
- [x] PR 분리 원칙: 의미 단위 (entity 단위)로 묶음
- [x] 마이그레이션 idempotent (옵션 A: 기존 사용자 데이터 보존)
- [x] ViewMode 옵션은 entity 본질에 따라 차등 (모두 list+board+grid 강제 X)
- [x] PropertyChip은 PR e 12개 패턴 따라 추가 (domain-specific, h-5)
- [x] Stickers 라우트 = `/stickers` 영구 유지 (변경 X)
- [x] Sticker.color = 필수 / Tag.color, Label.color 정책은 v109 그대로 유지
- [x] 빌드/타입 검증 의무

### 3.2 Must NOT Have

- [ ] **Generic `useEntityView<T>` hook 추출** — Templates 시리즈에서 영구 거부됨 (scope 폭발)
- [ ] **Stickers `/stickers` → `/library/stickers` 마이그레이션** — 영구 결정 (URL brevity)
- [ ] **Labels `/labels` → `/library/labels` 마이그레이션** — 별도 PR 가치 약, 영구 정책 결정 없음, scope 외
- [ ] **viewMode "all" 강제** — entity 본질 무시
- [ ] **사이드바 진입점 변경** (Tags 빼고. 이미 `/tags` → `/library/tags` redirect 존재)
- [ ] **5개 entity 동시 1 PR** — Big Bang은 작업 원칙 #2 "최소 diff" 위반
- [ ] **데이터 모델 폐기/변경 (Sticker.members 구조 변경 등)** — 본 plan 범위 외
- [ ] **사이드 패널 detail 컴포넌트 신규 작성** — 기존 detail 패널이 entity별로 이미 존재. PropertyChip 적용 정도만.
- [ ] **`AGENTS.md` / `CLAUDE.md` 변경** — view-engine 통합은 가이드 문서 수정 가치 약

---

## 4. PR 로드맵 (5 PR 권장 — 점진적 + entity 단위)

> **결정 근거**: § 1.3 "PR 분리 원칙: UI + 데이터 모델 분리, 의미 단위로 묶음" + § 1.3 "thin fork 패턴 정합" + § 11 사용자가 다른 분할을 원하면 PR 단위로 묶기/쪼개기만 변경하면 됨.

### PR 분리 원칙

각 PR은 **하나의 entity 범위**에서 다음 5단계를 모두 포함:
1. ViewContextKey/CONTEXT_DEFAULTS 등록 (필요 시)
2. thin fork hook 구현
3. view 컴포넌트가 thin fork hook + ViewHeader 사용으로 전환
4. PropertyChip 카드 적용 (해당 entity 본질에 맞는 chip 조합)
5. 마이그레이션 (idempotent, 필요 시 store version bump)

같은 entity 안에서는 hook과 view 컴포넌트가 강하게 결합되어 있어 분리 시 PR 1이 PR 2 없이는 의미 X. **entity 단위가 의미 최소 단위**.

### PR 순서 (의존성 + 사용자 체감 가치)

```
PR (group-c-d-1) Tags     [S+M]  ← Templates 본보기 + 부분 통합 상태와 가장 가까움. 빠른 win
   ↓
PR (group-c-d-2) Labels   [S+M]  ← Tags와 거의 동일 패턴. 두 번째 PR에서 패턴 안정화
   ↓
PR (group-c-d-3) Stickers [M]    ← cross-entity members 처리로 가장 unique. 새 ViewContextKey
   ↓
PR (group-c-d-4) References [M]  ← Note 아닌 첫 entity. Reference 전용 SortField 도입
   ↓
PR (group-c-d-5) Files    [M]    ← FileType/FileSize 신규 PropertyChip + size 정렬
```

### PR 1: `group-c-d-1` Tags (S+M)

- **Goal**: 태그 자체 카드 리스트도 view-engine 통합 (현재 태그 안 노트 리스트만 통합됨)
- **변경 파일**:
  - `lib/view-engine/types.ts` — `tags-list` ViewContextKey 추가, VALID_VIEW_CONTEXT_KEYS에 추가
  - `lib/view-engine/defaults.ts` — `tags-list` CONTEXT_DEFAULTS 추가 (viewMode: "list", sort: name asc, groupBy: none, visibleColumns: ["title", "noteCount", "color", "updatedAt"])
  - `lib/view-engine/use-tags-view.ts` — **신규** thin fork (Tag entity 전용 filter/search/sort/group). useTemplatesView를 본보기로
  - `components/views/tags-view.tsx` — `useNotesView("tag")`는 detail 노트 리스트에 유지. **태그 자체 카드 리스트**는 새 `useTagsView`로 전환. 기존 ViewHeader 그대로
  - `components/property-chips.tsx` — 신규 `TagNoteCountChip` (해당 태그가 attached된 노트 수 카운트). 기존 TagChip 재사용
- **마이그레이션**: store version bump 필요 (v109 → v110). `viewStateByContext.tags-list` 기본값 주입. idempotent (이미 있으면 skip).
- **viewMode 결정**: **list + grid** (Templates 본보기 그대로). 사용자 직관 시그널 + 색 opt-in이라도 noteCount + 색 dot으로 grid 의미 있음. board는 status/priority 없으니 부적절.
  - **Reverse가능**: § 11. 추후 사용자가 board 원하면 추가 (group/sort 옵션 + ViewHeader prop)
- **카드 PropertyChip**: TagChip (자기 자신) + TagNoteCountChip (count) + TimestampChip (updatedAt). Folder/Label chip은 부적절 (태그는 cross-folder).
- **사이드 패널 영향**: 태그 detail panel의 "이 태그가 붙은 노트들" 부분은 변화 없음 (이미 `useNotesView("tag")` 사용 중). 카드 리스트 클릭 시 detail 진입 동작 보존.
- **테스트 전략**: 슬라이스 단위 vitest는 미해당 (view 통합은 hook 단위 useMemo 의존). 빌드 + 타입 검증 + 수동 verify (sort 변경, 검색, viewState reload).
- **로드 LOC 추정**: +250 / -120 (use-tags-view.ts 신규 ~200줄 + tags-view 패치)

### PR 2: `group-c-d-2` Labels (S+M)

- **Goal**: PR 1과 동일 패턴 적용 (Labels 자체 카드 리스트 view-engine 통합)
- **변경 파일**:
  - `lib/view-engine/types.ts` — `labels-list` ViewContextKey 추가
  - `lib/view-engine/defaults.ts` — `labels-list` CONTEXT_DEFAULTS 추가 (viewMode: "list", sort: name asc, groupBy: none, visibleColumns: ["title", "noteCount", "color", "updatedAt"])
  - `lib/view-engine/use-labels-view.ts` — **신규** thin fork (PR 1의 use-tags-view.ts 패턴 그대로 복사 + Label 타입으로)
  - `components/views/labels-view.tsx` — `useNotesView("label")` 유지 + 새 `useLabelsView` 도입
  - `components/property-chips.tsx` — `LabelNoteCountChip` (TagNoteCountChip와 시각만 다름, 데이터 source 다름)
- **마이그레이션**: store version bump (v110 → v111). `viewStateByContext.labels-list` 기본값 주입. idempotent.
- **viewMode 결정**: **list + grid** (PR 1과 동일 사고법). 색 필수 → grid에서 색 그룹핑 강력. Templates 본보기 일관. board는 status 없으니 부적절. **Reverse가능**: § 11. 추후 board 추가는 한 줄.
- **카드 PropertyChip**: LabelChip (자기 자신, 색 필수) + LabelNoteCountChip + TimestampChip. Folder chip 부적절.
- **사이드 패널 영향**: 동일 (label detail 패널 변화 없음).
- **로드 LOC 추정**: +220 / -100 (PR 1 패턴 복사라 빠름)
- **PR 1 의존**: 강함. PR 1 머지 전에 PR 2 작업 시작은 OK이나 PR 1의 fork 패턴이 머지 후 기준점이 되어야 PR 2 리뷰 일관됨.

### PR 3: `group-c-d-3` Stickers (M)

- **Goal**: cross-entity 구조를 가진 Sticker view-engine 통합
- **변경 파일**:
  - `lib/view-engine/types.ts` — `stickers` ViewContextKey 추가 (`stickers-list`이 아니라 `stickers` — Stickers 자체가 entity index)
  - `lib/view-engine/defaults.ts` — `stickers` CONTEXT_DEFAULTS 추가 (viewMode: "list", sort: updatedAt desc, groupBy: "memberKind"? — 7 EntityKind 그룹화 옵션 결정 필요)
  - `lib/view-engine/use-stickers-view.ts` — **신규** thin fork (Sticker 타입 전용. cross-entity members[] 카운트 정렬/필터)
  - `components/views/stickers-view.tsx` — 직접 store 사용 → useStickersView로 전환. ViewHeader 그대로 활용
  - `components/property-chips.tsx` — `StickerMemberCountChip` (members.length), `StickerKindChip[]` (members에 포함된 kind 분포 mini-bar)
- **마이그레이션**: store version bump (v111 → v112). `viewStateByContext.stickers` 기본값 주입. idempotent.
- **viewMode 결정**: list + grid. **Sticker는 색 필수 + 시각 정체성 강함** (graph hull로 활용) → grid가 board보다 정합 (status가 없음). board는 status 카테고리 있을 때만 의미.
  - **Reverse가능**: 추후 board (members 첫 번째 kind 기준?) 도입 검토는 한 줄 변경
- **카드 PropertyChip**: 자기 자신 색 dot (Sticker.color, 필수) + StickerMemberCountChip + StickerKindChip 분포 + TimestampChip. 7 kind이 fit하기엔 너무 많음 → mini-bar (icon만)
- **groupBy 옵션**: `none`, `byMemberKind` (Sticker 안 첫 dominant kind?). **추후 결정 보류** — 첫 시도는 `groupBy: "none"`만 노출.
- **사이드 패널 영향**: Sticker detail panel은 SmartSidePanel에 이미 있음 → 변화 없음. 카드 리스트 진입 동작만 보존.
- **로드 LOC 추정**: +320 / -180 (cross-entity fork 로직 + 신규 chip 변형)
- **새 chip pattern 결정**: StickerKindChip을 PropertyChip으로 만들지, mini-bar 컴포넌트로 만들지 — 첫 시도는 mini-bar (chip 한 줄에 7 icon은 과밀)

### PR 4: `group-c-d-4` References (M)

- **Goal**: References (Note 아닌 entity) view-engine 통합. Reference 전용 SortField 도입
- **변경 파일**:
  - `lib/view-engine/types.ts` — `references` ViewContextKey 추가. SortField에 `fieldCount`, `tagCount` 추가 (Reference 메타). FilterField에 `hasFields`, `hasImage` 추가
  - `lib/view-engine/defaults.ts` — `references` CONTEXT_DEFAULTS 추가 (viewMode: "list", sort: updatedAt desc, groupBy: none, visibleColumns: ["title", "fieldCount", "tags", "updatedAt"])
  - `lib/view-engine/use-references-view.ts` — **신규** thin fork (Reference 타입 전용)
  - `components/views/library-view.tsx` — references 섹션 (line 553-866 + 1227-1463 ViewHeader). `useReferencesView` 도입. QuickFilterBar는 viewState.toggles로 통합
  - `components/property-chips.tsx` — `RefTypeChip` (도메인 chip — image/web/text 등 type 표시), `RefFieldCountChip`, `RefImageChip`
- **마이그레이션**: store version bump (v112 → v113). `viewStateByContext.references` 기본값 주입. idempotent.
- **viewMode 결정**: list + grid. **Reference는 image + content + fields 시각이 강함** → grid 카드가 정합. board는 status 없으니 부적절.
  - **Reverse가능**: 추후 board (linked/unlinked 기준?) 검토는 한 줄
- **카드 PropertyChip**: RefTypeChip + RefFieldCountChip + (image 있으면) RefImageChip + TagChip×N + TimestampChip
- **QuickFilterBar 통합**: 현재 `quickFilter` (all/linked/unlinked/links) 로컬 state → `viewState.filters` 또는 `viewState.toggles`로 마이그레이션 (영구 persist). 사용자 직관 시그널 무시 X. 첫 시도는 toggles (UI 그대로 유지, persist만 추가)
- **사이드 패널 영향**: ReferenceDetailPanel은 이미 있음 → 카드 클릭 → openReferencePanel 동작 보존
- **로드 LOC 추정**: +400 / -250 (library-view.tsx 두 entity 동거 → references 섹션만 분리)
- **추후 follow-up 후보**: library-view.tsx 1748줄 분할 (`library-references-view.tsx` + `library-files-view.tsx`로). 본 PR scope 외 — 주석으로 TODO만 남김.

### PR 5: `group-c-d-5` Files (M)

- **Goal**: Files (Attachment) view-engine 통합. FileType/FileSize 신규 PropertyChip + size 정렬
- **변경 파일**:
  - `lib/view-engine/types.ts` — `files` ViewContextKey 추가. SortField에 `size`, `fileType` 추가 (이미 FilesSortField 로컬 정의 있음 → 통합)
  - `lib/view-engine/defaults.ts` — `files` CONTEXT_DEFAULTS 추가 (viewMode: "list", sort: updatedAt desc, groupBy: "fileType", visibleColumns: ["title", "fileType", "size", "createdAt"])
  - `lib/view-engine/use-files-view.ts` — **신규** thin fork (Attachment 타입 전용)
  - `components/views/library-view.tsx` — files 섹션 (line 870-1226). useFilesView 도입
  - `components/property-chips.tsx` — `FileTypeChip` (image/url/file with icon), `FileSizeChip` (formatted size)
- **마이그레이션**: store version bump (v113 → v114). `viewStateByContext.files` 기본값 주입. **추가**: 기존 visibleColumns에 `size`/`fileType`이 없는 사용자에게 idempotent 추가 (옵션 A).
- **viewMode 결정**: list + grid. **Files는 image preview가 강함** → grid 정합 (썸네일 카드). board는 status 없으니 부적절.
  - **Reverse가능**: 추후 board (type 기준?) 검토 시 한 줄
- **카드 PropertyChip**: FileTypeChip + FileSizeChip + TimestampChip. 이미지면 thumbnail (chip 아닌 카드 본체)
- **사이드 패널 영향**: 파일 클릭 → 미리보기 패널 (library-view.tsx 내부) 동작 보존
- **로드 LOC 추정**: +380 / -220
- **PR 4 의존**: 약함. library-view.tsx 같은 파일이라 머지 충돌 가능 → PR 4 머지 후 rebase 필요. 그래도 작업 시작은 동시 가능.

---

## 5. Entity 본질별 viewMode 결정 행렬 (영구 — 본 plan이 정의)

> **결정 사고법**: PR e/template-c "Templates 본질 = 선택 도구 → board 미지원" 와 같은 사고법으로 5개 entity를 분류.

| Entity | 본질 | list | grid | board | 결정 근거 |
|---|---|---|---|---|---|
| Tags | 본문 hashtag 자동 생성 마커 (v109 결정 인용) | ✅ | ✅ | ❌ | Templates 본보기 (list+grid). 색 opt-in이라도 noteCount + 색 dot으로 grid 의미 있음. 사용자 직관 시그널. |
| Labels | Note 한정 색 카테고리 (필수 색) | ✅ | ✅ | ❌ | 색 필수 → grid에서 색 그룹핑 강력. Tag와 동일 사고법 적용 (Templates 본보기) |
| Stickers | cross-entity 묶음 마커 (필수 색, graph hull) | ✅ | ✅ | ❌ | 색 + 시각 정체성 강 → grid (썸네일 카드) 정합. status 없음 → board 부적절 |
| References | 인포박스 + 이미지 + content (rich entity) | ✅ | ✅ | ❌ | image 있을 때 grid가 강력. linked/unlinked는 toggle 충분 |
| Files | image preview / file type (미디어 entity) | ✅ | ✅ | ❌ | 이미지 썸네일 → grid 자연. type 분포는 groupBy로 |

**Reverse 시점**: § 11 결정. 사용자 요구 시 board 추가는 hook의 group/sort 확장 + ViewHeader의 showViewMode prop + CONTEXT_DEFAULTS 한 줄.

---

## 6. PropertyChip 적용 행렬

| Entity 카드 | 자기 정체성 chip | count chip | meta chip | 시간 chip | 색 정책 |
|---|---|---|---|---|---|
| Tag 카드 | TagChip (자기) | **TagNoteCountChip (신규)** | — | TimestampChip | opt-in (v109) |
| Label 카드 | LabelChip (자기) | **LabelNoteCountChip (신규)** | — | TimestampChip | 필수 |
| Sticker 카드 | 색 dot + 이름 | **StickerMemberCountChip (신규)** | **StickerKindChip mini-bar (신규)** | TimestampChip | 필수 |
| Reference 카드 | 제목 (text) | **RefFieldCountChip (신규)** | **RefTypeChip (신규)** + **RefImageChip (신규)** + TagChip×N | TimestampChip | (색 없음) |
| File 카드 | 이름 + 썸네일 | — | **FileTypeChip (신규)** + **FileSizeChip (신규)** | TimestampChip | (색 없음) |

**hard cap**: PR e 패턴 그대로. PropertyChipRow maxVisible=3 + "+N more". 자기 정체성 chip은 cap 외 (항상 표시).

**신규 chip 7개 추가** (PR 분산):
- PR 1: TagNoteCountChip
- PR 2: LabelNoteCountChip  
- PR 3: StickerMemberCountChip + StickerKindChip mini-bar (2)
- PR 4: RefTypeChip + RefFieldCountChip + RefImageChip (3 — RefImageChip은 단순 boolean 표시)
- PR 5: FileTypeChip + FileSizeChip (2)

= 총 9개 chip 추가 (마이크로 단위 → PR 분산이라 부담 작음)

---

## 7. ViewContextKey + CONTEXT_DEFAULTS 변경 (영구 신규)

```ts
// lib/view-engine/types.ts (신규 키 추가)
export type ViewContextKey =
  | "all" | "pinned" | "inbox" | "capture" | "permanent"
  | "unlinked" | "review" | "folder" | "tag" | "label" | "trash"
  | "savedView" | "wiki" | "wiki-category" | "graph" | "calendar"
  | "templates"
  // ↓ Group C PR-D 신규
  | "tags-list"      // /library/tags — Tag entity index
  | "labels-list"    // /labels — Label entity index
  | "stickers"       // /stickers — Sticker entity index
  | "references"     // /library/references — Reference entity index
  | "files"          // /library/files — Attachment entity index
  | `query-${string}`

// VALID_VIEW_CONTEXT_KEYS에도 5개 추가
```

```ts
// lib/view-engine/defaults.ts (신규 entries)
"tags-list":   { viewMode: "list", ...ctx("title", "asc"), groupBy: "none",
                 visibleColumns: ["title", "noteCount", "color", "updatedAt"] },
"labels-list": { viewMode: "list", ...ctx("title", "asc"), groupBy: "none",
                 visibleColumns: ["title", "noteCount", "color", "updatedAt"] },
"stickers":    { viewMode: "list", ...ctx("updatedAt"), groupBy: "none",
                 visibleColumns: ["title", "memberCount", "kind", "updatedAt"] },
"references":  { viewMode: "list", ...ctx("updatedAt"), groupBy: "none",
                 visibleColumns: ["title", "fieldCount", "tags", "updatedAt"] },
"files":       { viewMode: "list", ...ctx("updatedAt"), groupBy: "fileType",
                 visibleColumns: ["title", "fileType", "size", "createdAt"] },
```

**주의**: SortField/GroupBy/FilterField에 신규 값 추가도 필요:
- SortField: `name` (alias of title), `noteCount`, `memberCount`, `fieldCount`, `size`, `fileType`
- GroupBy: `fileType` (Files 한정)
- FilterField: `hasFields`, `hasImage` (Reference 한정), `fileType` (Files 한정)

각 PR에서 자신이 필요한 key만 추가.

---

## 8. 마이그레이션 전략 (PR별)

| PR | Store version | 마이그레이션 내용 | 옵션 |
|---|---|---|---|
| PR 1 | v109 → v110 | `viewStateByContext["tags-list"]` 기본값 주입 (없으면 add) | A (idempotent) |
| PR 2 | v110 → v111 | `viewStateByContext["labels-list"]` 기본값 주입 | A |
| PR 3 | v111 → v112 | `viewStateByContext["stickers"]` 기본값 주입 | A |
| PR 4 | v112 → v113 | `viewStateByContext["references"]` 기본값 주입 | A |
| PR 5 | v113 → v114 | `viewStateByContext["files"]` 기본값 주입 + 기존 Library/Files 사용자의 visibleColumns에 `fileType`/`size` 추가 (idempotent skip if present) | A + 옵션 B 제한적 |

**옵션 A**: 기존 사용자 데이터 보존 (no-op처럼 동작). v109 패턴 그대로.
**옵션 B 제한적**: PR 5만 — 사용자가 수동으로 사이즈/타입 정렬을 봤을 때 visibleColumns에 column이 없으면 정렬 무의미 → idempotent 추가가 합리적. 데이터 없는 사용자는 영향 0.

---

## 9. Task Flow and Dependencies

```
[PR 1: Tags]
    ↓ (강한 의존: thin fork 패턴 정착)
[PR 2: Labels]
    ↓ (약한 의존: Stickers는 다른 entity 구조)
[PR 3: Stickers]
    ↓ (병렬 가능: PR 4와 PR 5는 같은 library-view.tsx 파일이라 직렬이 안전)
[PR 4: References]
    ↓ (강한 의존: 같은 파일 머지 충돌)
[PR 5: Files]
```

**병렬 작업 vs 직렬 작업**:
- PR 1 → PR 2: 패턴 정착 후 진행 권장 (직렬)
- PR 2 → PR 3: 구조 다름 → 병렬 작업 가능 (단 코드 리뷰는 직렬)
- PR 3 → PR 4: 독립
- PR 4 → PR 5: 같은 파일 (library-view.tsx 1748줄) → **직렬 강제**

총 예상 LOC: +1570 / -870 = **+700 net**, 5 PRs, ~15 commits, ~3-5일 (1 PR당 0.5-1일)

---

## 10. 상세 TODOs

### PR 1 — Tags

- [ ] **T1.1** `lib/view-engine/types.ts`: `tags-list` ViewContextKey 추가, VALID_VIEW_CONTEXT_KEYS에 추가, SortField에 `name`, `noteCount` 추가, VALID_SORT_FIELDS 갱신
  - 수용: tsc 0 errors. 기존 contextKey 동작 보존
- [ ] **T1.2** `lib/view-engine/defaults.ts`: `tags-list` CONTEXT_DEFAULTS 항목 추가
  - 수용: `buildDefaultViewStates()` 호출 시 새 키 포함
- [ ] **T1.3** `lib/view-engine/use-tags-view.ts` 신규 작성 (use-templates-view.ts 패턴 그대로 + Tag 타입). 5단계 (filter/search/sort/group): `tag.name` 정렬, `name`/`color`/`tagged-count`/`tags` 필터
  - 수용: jest는 미해당. tsc 0 errors. test로 useNotesView/useTemplatesView와 stage 분리 구조 동일
- [ ] **T1.4** `components/property-chips.tsx`: TagNoteCountChip 추가 (PR e ChipShell 패턴)
  - 수용: ChipShell + h-5/text-2xs/leading-none. icon: PhHash, value: count
- [ ] **T1.5** `components/views/tags-view.tsx`: `useNotesView("tag")` 유지 (detail의 노트 리스트). 태그 자체 카드 리스트는 `useTagsView()` 사용으로 전환. ViewHeader showSort/showGroup/showFilter 그대로 활용. 카드에 PropertyChipRow 도입
  - 수용: `npm run build` 0 errors. 기존 click → detail 진입 동작 보존. viewState reload 보존
- [ ] **T1.6** Store migration: v109 → v110. `viewStateByContext["tags-list"]`이 없으면 default 주입. idempotent (있으면 skip)
  - 수용: 마이그레이션 vitest (가능하면) 또는 신규/기존 사용자 양쪽 verify
- [ ] **T1.7** 빌드 + tsc 검증. 사이드 패널 동작 verify

### PR 2 — Labels

- [ ] **T2.1** `lib/view-engine/types.ts`: `labels-list` ViewContextKey 추가
- [ ] **T2.2** `lib/view-engine/defaults.ts`: `labels-list` CONTEXT_DEFAULTS 항목 추가
- [ ] **T2.3** `lib/view-engine/use-labels-view.ts` 신규 작성 (PR 1의 use-tags-view.ts 패턴 그대로 + Label 타입)
- [ ] **T2.4** `components/property-chips.tsx`: LabelNoteCountChip 추가
- [ ] **T2.5** `components/views/labels-view.tsx`: 패턴 적용
- [ ] **T2.6** Store migration: v110 → v111
- [ ] **T2.7** 빌드 + tsc 검증

### PR 3 — Stickers

- [ ] **T3.1** `lib/view-engine/types.ts`: `stickers` ViewContextKey 추가, SortField에 `memberCount` 추가
- [ ] **T3.2** `lib/view-engine/defaults.ts`: `stickers` CONTEXT_DEFAULTS 항목 추가 (viewMode: "list", grid는 toggleable)
- [ ] **T3.3** `lib/view-engine/use-stickers-view.ts` 신규 작성. Sticker.members[].length 카운트 sort/filter. EntityKind 분포 helper
- [ ] **T3.4** `components/property-chips.tsx`: StickerMemberCountChip + StickerKindChip mini-bar (icon만, 7 EntityKind)
- [ ] **T3.5** `components/views/stickers-view.tsx`: 직접 store → useStickersView. ViewHeader showViewMode (list/grid) 노출. 카드 디자인 grid에 적합한 것으로
- [ ] **T3.6** Store migration: v111 → v112
- [ ] **T3.7** 빌드 + tsc 검증. graph hull 색 일관성 verify

### PR 4 — References

- [ ] **T4.1** `lib/view-engine/types.ts`: `references` ViewContextKey 추가, SortField에 `fieldCount`, `tagCount` 추가, FilterField에 `hasFields`, `hasImage` 추가
- [ ] **T4.2** `lib/view-engine/defaults.ts`: `references` CONTEXT_DEFAULTS 항목 추가
- [ ] **T4.3** `lib/view-engine/use-references-view.ts` 신규 작성 (Reference 타입 전용)
- [ ] **T4.4** `components/property-chips.tsx`: RefTypeChip + RefFieldCountChip + RefImageChip
- [ ] **T4.5** `components/views/library-view.tsx`: References 섹션 (line 553-866 + 1227-1463). `quickFilter` 로컬 state → `viewState.toggles`로 마이그레이션. useReferencesView 도입
- [ ] **T4.6** Store migration: v112 → v113
- [ ] **T4.7** 빌드 + tsc 검증. ReferenceDetailPanel 동작 verify

### PR 5 — Files

- [ ] **T5.1** `lib/view-engine/types.ts`: `files` ViewContextKey 추가, SortField에 `size`, `fileType` 추가, GroupBy에 `fileType` 추가, FilterField에 `fileType` 추가
- [ ] **T5.2** `lib/view-engine/defaults.ts`: `files` CONTEXT_DEFAULTS 항목 추가 (viewMode: "list", default groupBy: `fileType`)
- [ ] **T5.3** `lib/view-engine/use-files-view.ts` 신규 작성 (Attachment 타입 전용. size/type 정렬)
- [ ] **T5.4** `components/property-chips.tsx`: FileTypeChip + FileSizeChip
- [ ] **T5.5** `components/views/library-view.tsx`: Files 섹션 (line 870-1226). 로컬 `FilesSortField` → view-engine SortField 통합. useFilesView 도입
- [ ] **T5.6** Store migration: v113 → v114. visibleColumns 옵션 B 제한적 (size/fileType idempotent 추가)
- [ ] **T5.7** 빌드 + tsc 검증. 파일 미리보기 패널 동작 verify

---

## 11. Reverse-able Decisions (인터뷰 부재로 추론한 부분)

> 이 plan은 사용자 명시적 답변 없이 영구 결정 + 사전 조사 + Plot 일관성 원칙으로 추론. 사용자가 다음 결정을 뒤집고 싶을 때 어디를 바꾸면 되는지 명시.

| 결정 | 추론 근거 | 뒤집고 싶을 때 |
|---|---|---|
| **PR 순서 = entity 단위 점진적 (5 PR)** | 작업 원칙 #6 "PR 분리: 의미 단위로 묶음" + Templates/Folder 시리즈 PR 분리 패턴 | "인프라 먼저" 옵션 B 채택 시 → PR 0 추가 (ViewContextKey 5개 + CONTEXT_DEFAULTS 5개 한 PR로). 본 plan PR 1-5의 T*.1, T*.2, T*.6 항목은 PR 0으로 이동. |
| **Stickers 라우트 = `/stickers` 유지** | 코드 인용 (`lib/table-route.ts:100-102` design-decisions §8) | 영구 결정. 본 plan 범위 외. 별도 plan 필요 |
| **Labels 라우트 = `/labels` 유지** | 영구 정책 결정 없음. 보수: 현 상태 유지 | "Labels를 Library로 이동" → 별도 PR (group-c-d-0?) 추가. Tags `/tags` → `/library/tags` redirect 패턴 그대로 적용 |
| **viewMode list+grid (모든 5 entity)** | 사용자 직관 시그널 ("템플릿처럼 그리드가 있으면 좋지 않나") + Templates 본보기 + 색/시각 정체성 활용. Plot 정체성 "Gentle by default, powerful when needed" — list가 default, grid는 옵션 | board 추가는 group/sort 옵션 + ViewHeader prop. 사용자 요구 시 |
| **Generic hook 추출 X (5 thin fork)** | MEMORY.md "Generic 화는 scope 폭발" 영구 결정 | 영구. 본 plan 범위 외 |
| **Sticker groupBy = "none" 1차** | mini-bar 너무 복잡 → 단순화 | 추후 `byMemberKind` 추가는 group.ts 한 함수 |
| **PR 4-5 직렬 (같은 파일)** | library-view.tsx 머지 충돌 회피 | "library-view.tsx 분할"을 별도 PR로 먼저 → PR 4-5 병렬 가능. scope 외 |
| **Reference QuickFilter → viewState.toggles** | persist + view-engine 일관성 | viewState.filters로 변경하면 saved view 호환 가능. 1차는 toggles (UI 그대로) |
| **마이그레이션 옵션 A (idempotent skip)** | v109 패턴 영구 | 옵션 B (덮어쓰기)는 사용자 viewState 손실 → 거부 |
| **Files 기본 groupBy = `fileType`** | image/url/file 분포가 직관적 | "none" 기본도 OK. 한 줄 |

---

## 12. Commit Strategy

각 PR 내부에서 commit은 **소단위 의미 묶음**으로 분리:

```
PR 1 commits 예시:
  1. types: add tags-list ViewContextKey + name/noteCount sort fields
  2. defaults: tags-list CONTEXT_DEFAULTS
  3. view-engine: useTagsView thin fork
  4. property-chips: TagNoteCountChip
  5. views/tags-view: integrate useTagsView + PropertyChipRow
  6. store: v110 migration (idempotent tags-list defaults)
```

**커밋 메시지 컨벤션** (영구 작업 원칙 #10): "무엇 / 왜 / 검증" 명시.
PR title: `feat(group-c-d-1): Tags view-engine 통합 (v110)`

---

## 13. Success Criteria

### PR 별 acceptance

- 각 PR 별: `npm run build` 0 errors + `tsc --noEmit` 0 errors + Architect verification + 기존 사용자 데이터 손실 0 + 카드 click → detail 진입 동작 보존 + viewState reload 보존
- 사이드바 진입점: Tags `/library/tags`, Labels `/labels`, Stickers `/stickers`, References `/library/references`, Files `/library/files` — 모두 변화 없음 (영구 결정 보존)

### 시리즈 전체 acceptance

- 5개 entity 모두 ViewHeader + view-engine pipeline 사용
- 직접 store → thin fork hook 전환 100%
- PropertyChip이 entity 본질에 맞는 조합으로 카드 적용
- Linear-level polish (작업 원칙 #1: 정확도 + 디자인 시그널 무시 X)
- Saved View가 5 entity context에도 가능 (자동 — saved-view-context.ts가 ViewContextKey 기반)
- store version 진화: v109 → v110 → v111 → v112 → v113 → v114 (5 step)

### Architect verification 기준

각 PR 제출 시 Architect agent에 다음 검증 요청:
1. thin fork hook이 use-templates-view.ts 패턴과 구조적으로 동일한가
2. PropertyChip 신규 추가가 PR e 패턴 (ChipShell, h-5, text-2xs, getEntityColor)을 따르는가
3. 마이그레이션이 idempotent인가 (옵션 A)
4. ViewContextKey/SortField/GroupBy/FilterField 신규 항목이 VALID_* 배열에도 추가됐는가
5. 사용자 영구 결정 (§ 1.3) 어느 것도 위반하지 않았는가

### 빠뜨리지 말 것

- after-work 시: docs/MEMORY.md + docs/CONTEXT.md 갱신 의무 (CRITICAL — memory에 명시)
- 시리즈 종료 시: Plan 5 PRs 모두 머지된 후 docs/MEMORY.md "Group C PR-D 완성" 섹션 추가 (Folder N:M, Templates 시리즈 패턴 참조)

---

## 14. Risks & Mitigations

| 리스크 | 영향 | 완화 |
|---|---|---|
| `library-view.tsx` 1748줄 — PR 4/5 머지 충돌 | 작업 시간 증가 | 직렬 강제 + rebase. 추후 follow-up으로 파일 분할 (별도 plan) |
| Sticker.members EntityKind 분포 chip 너무 복잡 | 디자인 노이즈 | 1차는 mini-bar (icon만). 사용자 직관 시그널 보고 chip으로 발전 가능 |
| Reference QuickFilter 로컬 state → toggles 마이그레이션 후 사용자가 quick filter 쓰던 패턴 깨짐 | UX 회귀 | viewState.toggles persist로 복원. 첫 reload 후 사용자 unaware |
| 5 PR 직렬 진행 시 시간 비용 | 3-5일 소요 | 본 plan은 1 PR/세션 권장 — 매 세션 끝에 docs 갱신 |
| Generic hook 유혹 (5 thin fork이 비슷해 보여서 추출하고 싶어짐) | 영구 결정 위반 | 코드 헤더 주석에 "Scope guard" 명시 (use-templates-view 패턴) |
| 사용자가 Labels 라우트 통합을 원했을 가능성 | 1 PR 추가 필요 | § 11 Reverse-able. PR (group-c-d-0)으로 추가 가능 |

---

## 15. Out of Scope (명시적 제외)

- ❌ `library-view.tsx` 파일 분할 (1748줄 → references-view + files-view) — follow-up 별도 plan
- ❌ Generic `useEntityView<T>` hook 추출 — 영구 거부
- ❌ Stickers `/stickers` → `/library/stickers` 마이그레이션 — 영구 결정 (URL brevity)
- ❌ Sticker.members 데이터 모델 변경 — 본 plan 범위 외
- ❌ Reference 색 정책 도입 — 영구 정책 결정 없음
- ❌ Tag 우클릭 메뉴 Rename 옵션 — MEMORY.md 별도 follow-up 등록됨
- ❌ Smart Book v2 AutoSource (folder/category/tag/label/sticker) — 별도 큰 plan
- ❌ 사이드 패널 detail 컴포넌트 신규 작성 — 기존 패널 활용

---

## 부록 A — 본보기 PR 인용

- **PR #249** (template-c) — view-engine 통합 + multi-select + alpha index. `useTemplatesView` 패턴 정의. Migration v102 → v105.
- **PR #251** (PR e) — Linear-style PropertyChip 12개. ChipShell 패턴. ViewMode union "grid" 추가.
- **PR #258** (v108) — NoteTemplate slim. data model + UI 분리 PR 패턴.
- **PR #259** (v109) — 색 opt-in 정책. `getEntityColor` helper.
- **PR #253-256** (Folder N:M a/b/c) — UI vs 데이터 모델 분리 PR 시리즈 패턴.

## 부록 B — 핵심 코드 위치 (절대 경로)

- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\view-engine\types.ts`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\view-engine\defaults.ts`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\view-engine\use-templates-view.ts` (본보기)
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\view-engine\use-notes-view.ts`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\property-chips.tsx`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\view-header.tsx` (showViewMode/showSort/showGroup/showFilter prop)
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\views\tags-view.tsx`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\views\labels-view.tsx`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\views\stickers-view.tsx`
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\views\library-view.tsx` (References + Files 동거)
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\components\views\templates-view.tsx` (본보기)
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\types.ts` (Sticker, Reference, Attachment, EntityRef)
- `C:\Users\user\Desktop\linear-note-plot-\.claude\worktrees\trusting-kirch-4eb5f8\lib\table-route.ts` (inferSpace 영구 결정 인용)
