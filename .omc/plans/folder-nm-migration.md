# Folder Type-Strict + N:M Migration

**Branch**: `claude/folder-type-strict-nm` (new, from `origin/main`)
**Worktree**: `C:/Users/user/Desktop/linear-note-plot-/.claude/worktrees/fervent-nash-44e7da`
**Status**: Plan ready — awaiting confirmation
**Estimated Complexity**: HIGH (data model + migration + UI)
**Estimated PRs**: 3 (a/b/c) over 1-2 days

---

## Context

### Original Request
사용자 합의된 작업이므로 인터뷰 단축, 명세 확정 + 마이그레이션 신중함 + PR 분할 전략에 집중.

### Pre-Decided Spec (worklog + 33 design decisions)
1. **Folder type-strict**: `Folder.kind: "note" | "wiki"` 필드 추가 — 한 폴더는 한 종류만 수용
2. **N:M membership**: `Note.folderId: string | null` → `Note.folderIds: string[]`. 한 노트가 여러 폴더에 동시 소속 가능
3. **Wiki도 동일**: `WikiArticle.folderId?` (PR #236 임시) → `WikiArticle.folderIds: string[]`
4. **임시 cross-everything UX 롤백**: PR #236에서 만든 통합 `/folder/[id]` 페이지(노트+위키 동시 표시) → kind에 따라 분리
5. **메타포**: "텍스트 파일만 수용하는 폴더" — Note 폴더는 노트만, Wiki 폴더는 위키만

### Re-Confirmation Rationale (2026-05-03 33 design decisions §2)
사용자가 cross-everything의 단기 자유도보다 4-사분면 모델(Folder=type-strict / Sticker=type-free) + 사이드바 일관성 + Sticker entity 가치를 더 중요하게 봄. cross-entity 통합은 Sticker가 담당(`Sticker.members: EntityRef[]` 옵션 D2), Folder는 한 영역 1차 정리 도구로 회귀.

### Codebase Mapping (이미 수행)
**Type 정의** (`lib/types.ts`):
- `Folder` (line 380-389): id, name, color, parentId, lastAccessedAt, pinned, pinnedOrder, createdAt — **kind 필드 없음**
- `Note.folderId: string | null` (line 333) — single-folder 모델
- `WikiArticle.folderId?: string | null` (line 285) — PR #236 임시 추가, 기본 null

**folderId 사용처 (53 files, 주요만)**:
- **Store actions**: `lib/store/slices/folders.ts` (CRUD + cascade), `lib/store/slices/notes.ts` (line 35-37, 321, 410, 502 — createNote/duplicateNote/createChildNote default), `lib/store/slices/wiki-articles.ts` (line 39 — createWikiArticle), `lib/store/slices/templates.ts`
- **Migration**: `lib/store/migrate.ts` line 207-231 (v?: project→folder), 1297-1347 (v98 dedup + v99 wikiArticles.folderId 도입)
- **View engine**: `lib/view-engine/filter.ts` (line 147), `context-filter.ts` (line 53), `group.ts` (line 191-198), `sort.ts` (line 28-29), `use-notes-view.ts` (line 38, 82), `use-templates-view.ts` (line 50, 184), `types.ts` (line 157 — `extras.folderId`)
- **Tests**: `lib/view-engine/__tests__/pipeline.test.ts` (8+ usages)
- **UI**: `components/linear-sidebar.tsx` (line 245, 396-410, 486-488, 511, 691-696 — Folders section, count combines note+wiki), `components/notes-board.tsx` (line 156, 162, 234-237 — group by folder, FolderChip), `components/notes-table*.tsx`, `components/note-list.tsx`, `components/note-detail-panel.tsx` (line 156, 164), `components/views/templates-view.tsx`, `components/views/wiki-list.tsx`, `components/views/search-view.tsx`, `components/views/ontology-view.tsx`, `components/calendar-view.tsx`, `components/floating-action-bar.tsx`, `components/editor-breadcrumb.tsx`, `components/editor/note-hover-preview.tsx`, `components/editor/nodes/query-node.tsx`, `components/side-panel/*.tsx`, `components/home/mixed-quicklinks.tsx`, `components/ontology/ontology-graph-canvas.tsx`
- **Routes**: `app/(app)/folder/[id]/page.tsx` (현재 통합 페이지 — note+wiki 동시 표시)
- **기타**: `lib/backlinks.ts`, `lib/graph.ts`, `lib/orphan-actions.ts`, `lib/table-route.ts`, `lib/search/discover-engine.ts`, `lib/autopilot/conditions.ts`, `lib/store/seeds.ts`, `lib/store/selectors.ts`, `lib/store/types.ts`, `hooks/use-relation-suggestions.ts`

**Sidebar wiki context**: 별도 Folders section **없음** (`components/linear-sidebar.tsx:1014`). PR #236에서 위키도 같은 폴더에 매달려 있었지만 사이드바에는 노출되지 않음 — `/folder/[id]` 페이지 안에서만 보임.

**현재 store version**: 106 (`lib/store/index.ts:245`)

---

## Work Objectives

### Core Objective
폴더 데이터 모델을 type-strict + N:M으로 전환하면서 (a) PR #236 임시 cross-everything UX를 깔끔하게 롤백하고, (b) 사용자 데이터 0% 손실, (c) 한 PR당 1시간 내 리뷰 가능한 단위로 분할.

### Deliverables
1. **PR (a) — 데이터 모델 + 마이그레이션** (no UI change beyond what's required for compile)
   - `Folder.kind: "note" | "wiki"` 필드 추가
   - `Note.folderId` → `Note.folderIds: string[]`
   - `WikiArticle.folderId` → `WikiArticle.folderIds: string[]`
   - Store version v107 마이그레이션
   - 모든 store actions가 N:M 처리
   - 모든 read 사이트가 `folderIds[0]` 또는 `folderIds.includes()` 패턴으로 적응
   - View engine filter/group/sort 업데이트
   - 테스트 fixture 업데이트
   - Build/test clean
2. **PR (b) — UI 분리 (type-strict 시각화)**
   - Sidebar `Notes > Folders`: kind="note" 폴더만 표시
   - Sidebar `Wiki > Folders`: kind="wiki" 폴더만 표시 (신규 섹션)
   - `/folder/[id]` 페이지: kind에 따라 노트만 또는 위키만 표시 (분기)
   - 폴더 생성 modal: kind 선택 (현재 활성 space에 따라 default)
   - 노트/위키 생성 시 folder picker가 본인 kind만 표시
   - "+ Add" 버튼 (`/folder/[id]`): kind에 맞는 항목만 (Note 폴더는 "New note"만, Wiki 폴더는 "New wiki article"만)
3. **PR (c) — Multi-folder UX (N:M 진가 활용)**
   - 노트 detail panel: "이 노트의 폴더" 칩 다중 표시 + add/remove
   - 우클릭 메뉴: "Add to folder…" (다중 선택 picker)
   - 위키 동일
   - Folder count 의미 명확화 (sidebar "3 notes" 정의: `notes.filter(n => n.folderIds.includes(folder.id))`)

### Definition of Done
- [ ] tsc clean (`npm run build`)
- [ ] Vitest pass (`npm run test`)
- [ ] 기존 사용자 store 로드 시 마이그레이션 idempotent하게 동작 (재로드 no-op)
- [ ] 기존 폴더의 모든 노트/위키 멤버십 100% 보존
- [ ] PR #236에서 한 폴더에 노트+위키 둘 다 넣어둔 경우도 손실 없이 분리됨
- [ ] 사이드바 Folders section이 kind별로 정확히 분리됨
- [ ] 노트/위키 생성 시 wrong-kind 폴더 선택 불가
- [ ] 노트가 2개 이상 폴더에 속해도 모든 view (list/board/table)에서 정확히 표시
- [ ] Architect verification PASS

---

## Must Have / Must NOT Have

### Must Have
- **마이그레이션 idempotent**: 같은 store를 N번 로드해도 1번 로드와 결과 동일
- **Backward compat**: 기존 `Note.folderId` 가진 store도 v107 마이그레이션 거쳐 정상 동작
- **Strict typing**: `Folder.kind` 없는 폴더 = compile error (default 없음, 마이그레이션이 필수 채움)
- **Cascade**: 폴더 삭제 시 모든 `Note.folderIds`/`WikiArticle.folderIds`에서 제거
- **Sidebar count 정확성**: kind="note" 폴더의 count = 그 폴더 id를 `folderIds`에 포함한 비-trash 노트 수
- **Drag & drop**: Note→Note 폴더만, Wiki→Wiki 폴더만 (cross-kind drop은 시각적 reject)

### Must NOT Have
- ~~기존 데이터 무지성 삭제~~ — 마이그레이션이 모든 멤버십 보존
- ~~"통합 폴더" 모드 유지~~ — 33 §2 결정대로 폐기
- ~~Folder.kind를 사용자가 나중에 변경 가능~~ (v107에서 결정 후 immutable. kind 변경 = 새 폴더 만들기. 추후 PR에서 재고)
- ~~한 PR에 모든 변경 몰아넣기~~ — 3개 PR 분할 필수 (리뷰 가능성)
- ~~`folderId` (single) 필드를 backward compat용으로 남기기~~ — 깨끗하게 `folderIds`만. 과도기 dual-field는 버그 온상

---

## Task Flow & Dependencies

```
PR (a) 데이터 모델 + 마이그레이션
        |
        +--> PR (b) UI 분리 (type-strict 시각화)
                    |
                    +--> PR (c) Multi-folder UX
```

PR (a)는 PR (b/c)의 strict prerequisite. PR (b)와 (c)는 (a) 머지 후 직렬로 진행 (충돌 위험 큰 영역 공유).

---

## PR (a) — Data Model + Migration

### Scope
타입 변경, store actions 모든 사이트 업데이트, 마이그레이션 v107, view engine filter/group/sort, 테스트. **UI 변경은 컴파일 통과에 필요한 최소만** (기존 single-folder UI는 일단 `folderIds[0]` 폴백으로 동작).

### Detailed Tasks

#### 1. Type Changes (`lib/types.ts`)
- `Folder.kind: "note" | "wiki"` 추가 (line 380-389)
  - Optional 아님. 마이그레이션이 모든 기존 폴더에 채움.
- `Note.folderId: string | null` → `Note.folderIds: string[]` (line 333)
- `WikiArticle.folderId?: string | null` → `WikiArticle.folderIds: string[]` (line 285)
- `NoteTemplate.folderId: string | null` (line 550) → `NoteTemplate.folderIds: string[]` (템플릿도 동일하게 N:M? — **제안: 일단 single 유지** (템플릿은 "새 노트의 default folder" 의미, 다중일 때 의미 모호). 만약 N:M 가도 OK이면 별도 결정 필요. **권장: PR (a)에서는 single 유지, 추후 별도 PR.**)
- `ActiveView.folder.folderId` (line 562) — 변경 없음 (URL의 단일 폴더 의미)
- `NoteFilter.folder` (line 575) — 변경 없음

**Acceptance**:
- `tsc` 즉시 fail → 타입 강제로 모든 사용처 발견
- types.ts diff: 정확히 위 3개 + (선택적) 템플릿

#### 2. Store Migration (`lib/store/migrate.ts`)
**v107 block** (v106 다음에 append):

```ts
// v107: Folder type-strict + N:M membership migration.
//
// 1. Folder.kind: "note" | "wiki" 도입 — 마이그레이션 시 데이터 기반 자동 추론
// 2. Note.folderId (single) → Note.folderIds (array)
// 3. WikiArticle.folderId (PR #236 임시) → WikiArticle.folderIds (array)
// 4. PR #236에서 노트+위키 혼합 폴더는 자동 분리 (위키만 별도 "{name} (Wiki)" 폴더로)
//
// Default kind 추론 규칙 (per folder):
//   - 그 폴더에 속한 비-trash note 수 N, wiki 수 W
//   - W === 0  → kind = "note"
//   - N === 0  → kind = "wiki"
//   - N >  0 && W > 0 → kind = "note" (dominant) + 위키들을 별도 "{name} (Wiki)" 폴더로 이동
//
// Idempotent: 이미 kind가 있는 폴더는 건너뜀. 이미 folderIds[]인 노트/위키도 건너뜀.

if (Array.isArray(state.folders)) {
  const folders = state.folders as any[]
  const notes = (state.notes ?? []) as any[]
  const wikis = (state.wikiArticles ?? []) as any[]

  // 1. Note.folderId → folderIds (idempotent)
  for (const n of notes) {
    if (Array.isArray(n.folderIds)) continue  // already migrated
    n.folderIds = n.folderId ? [n.folderId] : []
    delete n.folderId
  }

  // 2. WikiArticle.folderId → folderIds (idempotent)
  for (const w of wikis) {
    if (Array.isArray(w.folderIds)) continue
    w.folderIds = (typeof w.folderId === "string" && w.folderId.length > 0) ? [w.folderId] : []
    delete w.folderId
  }

  // 3. Folder.kind 추론 + 혼합 폴더 분리
  const noteFoldersIndex = new Map<string, number>()  // folderId → note count
  const wikiFoldersIndex = new Map<string, number>()  // folderId → wiki count
  for (const n of notes) {
    if (n.trashed) continue
    for (const fid of (n.folderIds ?? [])) {
      noteFoldersIndex.set(fid, (noteFoldersIndex.get(fid) ?? 0) + 1)
    }
  }
  for (const w of wikis) {
    for (const fid of (w.folderIds ?? [])) {
      wikiFoldersIndex.set(fid, (wikiFoldersIndex.get(fid) ?? 0) + 1)
    }
  }

  const newFolders: any[] = []
  const wikiFolderClones = new Map<string, string>()  // original folderId → cloned wiki folderId

  for (const f of folders) {
    if (typeof f.kind === "string") {
      newFolders.push(f)
      continue
    }
    const N = noteFoldersIndex.get(f.id) ?? 0
    const W = wikiFoldersIndex.get(f.id) ?? 0

    if (W === 0) {
      // Pure note folder (or empty)
      newFolders.push({ ...f, kind: "note" })
    } else if (N === 0) {
      // Pure wiki folder
      newFolders.push({ ...f, kind: "wiki" })
    } else {
      // Mixed: keep original as Note folder, clone for wikis
      newFolders.push({ ...f, kind: "note" })
      const cloneId = `${f.id}-wiki`
      newFolders.push({
        ...f,
        id: cloneId,
        name: `${f.name} (Wiki)`,
        kind: "wiki",
        createdAt: f.createdAt ?? new Date().toISOString(),
      })
      wikiFolderClones.set(f.id, cloneId)
    }
  }
  state.folders = newFolders

  // 4. 혼합 폴더에 속했던 위키들의 folderIds를 cloned wiki 폴더로 rewrite
  if (wikiFolderClones.size > 0) {
    for (const w of wikis) {
      w.folderIds = (w.folderIds as string[]).map(
        (fid) => wikiFolderClones.get(fid) ?? fid
      )
    }
  }
}
```

**Acceptance**:
- v106 store 로드 → state.folders 모두 `kind` 가짐, state.notes 모두 `folderIds[]` 가짐, `folderId` 필드 삭제됨
- 같은 store v107 마이그레이션 재실행 → no-op (모든 if-가드 통과)
- 혼합 폴더 1개에 노트 3개, 위키 2개 있던 경우: 마이그레이션 후 폴더 2개("Foo", "Foo (Wiki)") + 노트 3개 → "Foo", 위키 2개 → "Foo (Wiki)"
- **manual test**: 일부러 혼합 폴더 1개 만들어둔 후 v107 마이그레이션 트리거하고 결과 검증

#### 3. Store Actions Update

**`lib/store/slices/folders.ts`**:
- `createFolder(name, color, opts)` — `kind: "note" | "wiki"` 필수 파라미터로 변경 (3번째 파라미터에서 분리)
  ```ts
  createFolder: (name: string, kind: "note" | "wiki", color: string, opts?: Partial<Folder>) => string
  ```
  모든 호출처(현재 1곳: `linear-sidebar.tsx:493`) 업데이트
- `deleteFolder(id)` cascade 변경:
  ```ts
  notes: state.notes.map((n: Note) =>
    n.folderIds.includes(id)
      ? { ...n, folderIds: n.folderIds.filter((fid: string) => fid !== id) }
      : n
  ),
  wikiArticles: state.wikiArticles.map((w: WikiArticle) =>
    w.folderIds.includes(id)
      ? { ...w, folderIds: w.folderIds.filter((fid: string) => fid !== id) }
      : w
  ),
  ```
- 새 액션 (PR (c)에서 사용):
  - `addNoteToFolder(noteId, folderId)` — kind 검증 + dedup
  - `removeNoteFromFolder(noteId, folderId)`
  - `addWikiToFolder(articleId, folderId)`
  - `removeWikiFromFolder(articleId, folderId)`

**`lib/store/slices/notes.ts`**:
- `createNote(partial)` (line 30+): `folderId` 단일 인자 → `folderIds: string[]`. activeView가 folder면 그 폴더 id 자동 포함. **kind 검증**: 그 폴더가 wiki kind면 에러/무시(noteType="wiki"인 경우만 허용).
- `duplicateNote` (line 321), `createChildNote` (line 410), `splitNote` (line 502): `folderId` → `folderIds` 복사
- ⚠ `noteType: "wiki"` 노트(legacy)는 wiki kind 폴더에 넣어야 하는지? — **제안**: noteType="wiki"인 Note도 wiki kind 폴더에만. 단, wiki entity는 `WikiArticle`이 우선이고 `Note.noteType="wiki"`는 leftover patterns이므로 noteType 무시하고 모두 note kind에. (이 부분은 PR (b)에서 한 번 더 결정 필요.)

**`lib/store/slices/wiki-articles.ts`**:
- `createWikiArticle({title, ..., folderId})` (line 14-44) → `folderIds: string[]`. `folderId` partial 호출처 (`/folder/[id]/page.tsx:123, 167`) 업데이트.

**`lib/store/slices/templates.ts`**:
- 템플릿이 single folderId 유지로 결정한다면 변경 없음. 단, 템플릿의 folderId는 "새 노트의 default folder" 의미이므로 wiki kind 폴더 가리키면 안 됨 — 검증 추가.

**Acceptance**: 모든 액션 caller가 kind-aware. tsc clean.

#### 4. View Engine Updates

**`lib/view-engine/filter.ts:147`**:
```ts
// before:
const fid = note.folderId ?? ""
// after — folder filter는 "이 폴더에 속한 노트" 의미이므로 includes 사용:
const matched = (op === "in" || op === "eq")
  ? note.folderIds.includes(value)
  : !note.folderIds.includes(value)
```

**`lib/view-engine/context-filter.ts:53`**:
```ts
// before:
(n) => (showTrashed || !n.trashed) && n.folderId === extras?.folderId
// after:
(n) => (showTrashed || !n.trashed) && (extras?.folderId ? n.folderIds.includes(extras.folderId) : n.folderIds.length === 0)
```
(주: `extras.folderId`는 URL 쿼리에서 오는 단일 폴더 컨텍스트라 `extras.folderId` 자체는 single 유지)

**`lib/view-engine/group.ts:191-198`** — group by folder:
```ts
// before:
const folderId = note.folderId
if (!folderId) { /* "no folder" bucket */ }
const bucket = map.get(folderId)
// after — N:M이므로 한 노트가 여러 그룹에 동시 표시:
if (note.folderIds.length === 0) {
  const bucket = map.get("__none__") ?? []
  bucket.push(note)
  map.set("__none__", bucket)
} else {
  for (const fid of note.folderIds) {
    const bucket = map.get(fid) ?? []
    bucket.push(note)
    map.set(fid, bucket)
  }
}
```
**중요**: 이러면 한 노트가 group by folder에서 N번 나타남. **사용자 의도 확인 필요** — 디폴트 권장은 "다중 표시(N번)"이지만 "primary folder만(folderIds[0])" 옵션도 가능.
**제안 (보수적)**: 다중 표시. 한 노트가 여러 폴더에 걸쳐있다는 사실 자체가 중요한 정보. UX에서 시각적 마커("이 노트는 N개 폴더에 있음")로 보강. 만약 혼란스러우면 view config에서 toggle 제공. 일단 다중으로 가고 PR (c)에서 토글 검토.

**`lib/view-engine/sort.ts:28-29`** — sort by folder (alphabetical first folder name):
```ts
// before:
const aFolder = a.folderId ?? ""
const bFolder = b.folderId ?? ""
// after — sort key는 첫 번째 폴더 (안정성):
const aFolder = a.folderIds[0] ?? ""
const bFolder = b.folderIds[0] ?? ""
```

**`lib/view-engine/use-templates-view.ts`**: 템플릿이 single folder 유지면 변경 없음.

**`lib/view-engine/types.ts:157`** — `extras.folderId?: string` 변경 없음 (URL 컨텍스트는 single).

#### 5. Read-site 적응 (모든 UI는 일단 컴파일 위한 최소 변경)

PR (a)에서는 UI 변경 없이 컴파일만 통과시키는 게 목표. 패턴:
- `note.folderId === folderId` → `note.folderIds.includes(folderId)`
- `note.folderId` (display) → `note.folderIds[0] ?? null` (PR (b)에서 다중 칩으로)
- `notes.filter(n => n.folderId === fid)` → `notes.filter(n => n.folderIds.includes(fid))`

**구체적 사이트 (모두 read-only patch)**:
- `components/linear-sidebar.tsx:694-696` — `notesInFolder` count
- `components/notes-board.tsx:353` — FolderChip resolution (`folderIds[0]` 우선, PR (b)에서 다중)
- `components/notes-board.tsx:606` — memo equality check `folderIds` array compare
- `components/notes-table.tsx`, `notes-table-view.tsx`, `note-list.tsx` — 동일
- `components/note-detail-panel.tsx:164` — `noteFolder` resolution: `folderIds[0]`
- `components/views/wiki-list.tsx`, `templates-view.tsx`, `search-view.tsx`, `ontology-view.tsx`, `calendar-view.tsx`, `floating-action-bar.tsx`, `editor-breadcrumb.tsx`, `editor/note-hover-preview.tsx`, `editor/nodes/query-node.tsx`, `home/mixed-quicklinks.tsx`, `ontology/ontology-graph-canvas.tsx`, `side-panel/*` — 모두 동일 패턴
- `app/(app)/folder/[id]/page.tsx:60, 66` — `folderNotes`/`folderWikis` 필터:
  ```ts
  notes.filter(n => !n.trashed && n.folderIds.includes(id))
  wikiArticles.filter(w => w.folderIds.includes(id))
  ```
- `lib/backlinks.ts`, `lib/graph.ts`, `lib/orphan-actions.ts`, `lib/search/discover-engine.ts`, `lib/autopilot/conditions.ts`, `lib/store/seeds.ts`, `lib/store/selectors.ts`, `hooks/use-relation-suggestions.ts` — 동일
- `lib/autopilot/conditions.ts` — `has_folder` condition: `note.folderIds.length > 0`

#### 6. Tests Update
**`lib/view-engine/__tests__/pipeline.test.ts`**:
- `makeNote()` factory의 `folderId: null` → `folderIds: []`
- 테스트 케이스의 `folderId: 'folder-zebra'` → `folderIds: ['folder-zebra']`
- group by folder 테스트: 다중 표시 expectation 수정 (한 노트가 N개 폴더에 있을 때 N번 등장)
- 신규 테스트 추가:
  - 노트가 2개 폴더에 동시 소속 시 group by folder가 정확히 양쪽에 표시
  - filter by folder가 `includes` 시맨틱

**`lib/autopilot/__tests__/engine.test.ts`**, **`lib/analysis/__tests__/engine.test.ts`**:
- 동일하게 fixture 업데이트

**신규 테스트 (`lib/store/__tests__/migrate-v107.test.ts`)** (있으면 추가, 없으면 새 파일):
- 케이스 1: 노트만 있는 폴더 → kind="note"
- 케이스 2: 위키만 있는 폴더 → kind="wiki"
- 케이스 3: 혼합 폴더 → "Foo" (note kind) + "Foo (Wiki)" (wiki kind), 위키들이 후자로 이동
- 케이스 4: 빈 폴더 → kind="note" (default)
- 케이스 5: idempotent — 마이그레이션 2회 적용 후 결과 동일

#### 7. Acceptance Criteria for PR (a)
- [ ] `npm run build` clean
- [ ] `npm run test` all pass (기존 + 신규 v107 테스트)
- [ ] 기존 store load: 노트/위키/폴더 멤버십 100% 보존
- [ ] 혼합 폴더 자동 분리 동작 확인 (manual + unit)
- [ ] 사이드바 Folders count 정확
- [ ] `/folder/[id]` 페이지 정상 표시 (이전 통합 UI 그대로 — PR (b)에서 분리)
- [ ] tsc 에러 0
- [ ] Architect verification PASS

---

## PR (b) — UI 분리 (Type-Strict 시각화)

### Scope
PR (a)가 머지된 상태에서, type-strict UX를 시각화. 사이드바 분리 + folder picker kind 필터링 + `/folder/[id]` 페이지 분기.

### Detailed Tasks

#### 1. Sidebar — kind별 Folders section
**`components/linear-sidebar.tsx`**:
- `Notes context` (line 783-1010): `Folders` section을 `folders.filter(f => f.kind === "note")`로 한정
- `Wiki context` (line 1014+): 신규 `Folders` section 추가 (`folders.filter(f => f.kind === "wiki")`)
- "+ New folder" 버튼: 컨텍스트 맞춰 kind 자동 결정
  - Notes context의 +버튼 → `createFolder(name, "note", color)`
  - Wiki context의 +버튼 → `createFolder(name, "wiki", color)`
- `notesInFolder(folderId)` 함수 분리:
  - Notes context: `notes.filter(n => n.folderIds.includes(folderId) && !n.trashed).length`만
  - Wiki context: `wikiArticles.filter(w => w.folderIds.includes(folderId)).length`만
  - **현재 line 691-697의 두 합산 로직 폐기**

#### 2. `/folder/[id]` 페이지 분기
**`app/(app)/folder/[id]/page.tsx`**:
- `folder.kind === "note"`면 노트 섹션만, 위키 섹션 숨김
- `folder.kind === "wiki"`면 위키 섹션만, 노트 섹션 숨김
- "+ Add" popover 옵션도 kind에 따라:
  - kind="note" → "New note"만
  - kind="wiki" → "New wiki article"만
- Header subtitle: "3 notes" 또는 "5 wikis" (단일 메트릭)
- 페이지 주석/JSDoc 업데이트 (PR #236 통합 모델 폐기 명시)

#### 3. Folder Picker 필터링
**`FolderPickerSubmenu`** (`components/views/wiki-list.tsx:72`):
- 이미 wiki 컨텍스트만 사용하므로 prop으로 `kind: "note" | "wiki"` 받기 → kind에 맞는 폴더만 표시
- 노트용 folder picker (`components/views/notes-list.tsx`나 `floating-action-bar.tsx` 등)도 동일하게 `kind="note"` 필터

**검색 사이트** (`components/floating-action-bar.tsx`, `components/note-detail-panel.tsx`, etc.):
- "Move to folder" 메뉴: 노트면 kind="note" 폴더만, 위키면 kind="wiki" 폴더만

#### 4. Drag & Drop kind 검증
- Note → Folder drop: target folder.kind === "note" 검증, 아니면 visual reject
- Wiki → Folder drop: target folder.kind === "wiki" 검증
- 사이드바 folder section은 kind별로만 표시되므로 drop target도 자동으로 분리됨

#### 5. Notes board / table FolderChip
- 한 노트가 여러 폴더에 속하면 모든 칩 표시 (현재는 `folderIds[0]`만, PR (b)에서 모두)
- `components/notes-board.tsx:386`의 FolderChip을 `folderIds.map`으로 변경
- 칩 너무 많으면 "+N more" 줄임

#### 6. Tests
- `linear-sidebar` 컴포넌트 테스트 (있으면): kind별 분리 검증
- `/folder/[id]` 페이지 테스트 (있으면): kind에 따라 섹션 분기 검증

#### Acceptance
- [ ] 사이드바 Notes context Folders → kind="note"만
- [ ] 사이드바 Wiki context Folders → kind="wiki"만 (신규)
- [ ] `/folder/[id]` 페이지 kind에 따라 분기
- [ ] Folder picker가 wrong kind 절대 표시 안 함
- [ ] DnD가 cross-kind drop 차단
- [ ] tsc clean, test pass
- [ ] Architect verification PASS

---

## PR (c) — Multi-folder UX (N:M 진가)

### Scope
N:M 모델의 사용자 면 가치 부여. PR (a)에서 type/store는 N:M이지만 UX는 single-folder 그대로. PR (c)에서 진짜 N:M UX.

### Detailed Tasks

#### 1. Detail Panel — 다중 폴더 칩
- `components/note-detail-panel.tsx`: "Folders" 영역에 `note.folderIds.map(fid => <Chip ...>)` + add 버튼 + 각 칩에 remove
- 위키 detail panel 동일

#### 2. Multi-folder Picker
- 우클릭 메뉴 / "Organize" → "Add to folders…" multi-select picker
- 현재 폴더 멤버십을 체크박스로 표시, 다중 토글
- store action: `setNoteFolders(noteId, folderIds[])` 신규 (전체 set 교체)

#### 3. Group by Folder UX 개선
- 다중 폴더 노트가 group by folder에서 N번 표시되는 것에 시각적 마커 추가
  - 예: 노트 카드에 작은 "📁 +2" 표시 = "이 노트는 다른 2개 폴더에도 있음"
- 또는 view config에 toggle "Show duplicated across folders" — 사용자 선택

#### 4. Drag & Drop "Add to" vs "Move to"
- 노트를 sidebar 폴더에 drop:
  - 기본: "이 폴더에 추가" (기존 폴더는 유지) — N:M의 자연스러운 시맨틱
  - Shift+drag: "이 폴더로 이동" (기존 폴더 모두 제거하고 이 폴더만)
  - 시각적 힌트: drag 중 modifier 안내 토스트

#### 5. Tests
- multi-folder 시나리오 e2e (가능하면): 노트 1개 → 2개 폴더 → 양쪽 사이드바 카운트 +1, group by folder 양쪽 표시

#### Acceptance
- [ ] 노트 detail에 다중 폴더 칩 + add/remove 동작
- [ ] Multi-folder picker 동작
- [ ] DnD add vs move 모드 구분
- [ ] tsc clean, test pass
- [ ] Architect verification PASS

---

## Commit Strategy

각 PR은 1개 squash 커밋으로 main에 머지. PR 내부 commit은 작은 단위로:

**PR (a)** 권장 commit 분할:
1. `feat(types): add Folder.kind + N:M folderIds[] schema`
2. `feat(migrate): v107 — folder kind inference + N:M migration with mixed-folder split`
3. `refactor(store): folder/note/wiki actions for N:M membership`
4. `refactor(view-engine): filter/group/sort for folderIds[]`
5. `refactor(ui): adapt all read-sites to folderIds[] (no UX change)`
6. `test: v107 migration cases + view-engine N:M`

**PR (b)** 권장:
1. `feat(sidebar): split Folders section by kind in Notes/Wiki contexts`
2. `feat(folder-page): branch by folder.kind (notes-only or wikis-only)`
3. `feat(picker): kind-filtered folder pickers + DnD validation`
4. `refactor(folder-chip): show all folders per note (multi-chip)`

**PR (c)** 권장:
1. `feat(detail-panel): multi-folder chips with add/remove`
2. `feat(picker): multi-folder selection picker`
3. `feat(dnd): add-vs-move modifier for folder drop`
4. `feat(group-by-folder): visual marker for cross-folder notes`

---

## Success Criteria

### Hard requirements (PASS = ship)
- 마이그레이션 idempotent + 데이터 0% 손실
- tsc clean, test pass (기존 + 신규)
- 기존 사용자 시나리오 5개 manual 검증:
  1. v106 store + 노트 50개 + 폴더 5개 (모두 노트만) → kind="note" 자동 부여, 사이드바 정상
  2. v106 store + PR #236으로 노트+위키 혼합 폴더 1개 → "Foo" + "Foo (Wiki)" 자동 분리
  3. v107에서 새 폴더 만들기 (Notes context) → kind="note", Wiki context에 안 보임
  4. 노트 1개 → 폴더 2개에 추가 (PR (c) 후) → 양쪽 카운트 +1
  5. Wiki kind 폴더로 노트 drop 시도 → 거부됨

### Soft requirements (nice-to-have)
- Group by folder의 다중 표시 UX가 직관적
- 마이그레이션 console.log로 변환 통계 출력 ("v107: 5 folders inferred kind, 1 mixed folder split")

---

## Open Questions / Risks

### Resolved (plan에 default 채택)
1. **Default kind 정책** → **데이터 기반 자동 추론 + 혼합 폴더 자동 분리** 채택. 가장 무겁지만 데이터 100% 보존, UX 깔끔. 빈 폴더는 "note" 디폴트(메이저리티 케이스).
   - 대안 비교:
     - "전부 note 고정" — 단순하나 PR #236으로 위키 넣어둔 폴더가 빈 폴더처럼 보이는 회귀 발생
     - "추론만 (혼합은 dominant 우선)" — 위키 또는 노트 잃음. 거부.
     - "사용자 prompt" — UX 부담. 거부 (단, 마이그레이션 후 토스트로 "5개 폴더 변환됨, 그 중 1개 분리됨" 알림 권장).
2. **혼합 폴더 처리** → 위키들을 "{name} (Wiki)" 신규 폴더로 자동 분리. 사용자 노티 토스트 권장.
3. **사이드바 분리 vs 통합** → kind별 완전 분리. Wiki context에 신규 Folders section. 33 §2 결정대로.
4. **Group by folder의 다중 표시** → 다중 표시 (한 노트가 N개 폴더에 있으면 N번 등장). 시각적 마커로 보강. 토글은 PR (c) 검토.
5. **N:M의 UX 부담** → Detail panel 다중 칩 + Multi-folder picker로 명확히. PR (c).
6. **Templates의 N:M 여부** → **single 유지** (PR (a) 변경 없음). 템플릿의 folder = "새 노트의 default folder"로 의미 명확. 다중일 때 의미 모호. 추후 별도 결정.
7. **noteType="wiki" Note의 폴더 kind** → 무시하고 "note" kind 폴더에. WikiArticle entity가 우선이고 noteType="wiki"는 leftover.

### Risks (mitigation 포함)
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 마이그레이션 v107 버그로 데이터 손실 | Medium | unit test 5케이스 + manual test + idempotent 가드 + 마이그레이션 전 Zustand persist 백업 안내 docs |
| Group by folder의 다중 표시가 사용자 혼란 | Medium | 시각적 마커(칩에 "+N more") + PR (c)에서 toggle 검토 |
| 기존 코드 53 files 모두 수정 시 누락 | High | tsc strict mode가 강제로 발견 (folderId 필드 삭제 → compile error) |
| `extras.folderId` (URL 컨텍스트)와 `note.folderIds` 혼용 혼란 | Low | 네이밍 컨벤션 명확화 — URL 컨텍스트는 항상 single, entity 멤버십은 항상 array |
| Templates folderId single 유지가 N:M 모델과 inconsistent | Low | docs에 "템플릿의 folder = default for new notes" 의미 명시. 추후 별도 PR. |
| PR (a) 머지 후 PR (b) 시작 전 사용자가 기존 single-folder UX로 동작 (UX 회귀 의심) | Low | PR description에 "PR (b)에서 UI 분리 예정" 명시 + 기존 UX 그대로 동작하도록 PR (a)는 read-side `folderIds[0]` 폴백 |

---

## Files Modified (Estimated)

### PR (a) — ~30 files
- `lib/types.ts` (3 type changes)
- `lib/store/migrate.ts` (v107 block ~80 lines)
- `lib/store/slices/folders.ts`, `notes.ts`, `wiki-articles.ts`, `templates.ts` (action signatures)
- `lib/store/seeds.ts`, `selectors.ts`, `types.ts` (folderId references)
- `lib/view-engine/{filter,context-filter,group,sort}.ts`, `use-notes-view.ts`, `use-templates-view.ts`, `types.ts`
- `lib/view-engine/__tests__/pipeline.test.ts`
- `lib/{backlinks,graph,orphan-actions,table-route}.ts`, `lib/search/discover-engine.ts`, `lib/autopilot/conditions.ts`, `lib/autopilot/__tests__/engine.test.ts`, `lib/analysis/__tests__/engine.test.ts`
- `hooks/use-relation-suggestions.ts`
- `components/notes-board.tsx`, `notes-table.tsx`, `notes-table-view.tsx`, `note-list.tsx`, `note-detail-panel.tsx`, `floating-action-bar.tsx`, `editor-breadcrumb.tsx`
- `components/views/{wiki-list,templates-view,search-view,ontology-view}.tsx`, `calendar-view.tsx`
- `components/side-panel/*`
- `components/home/mixed-quicklinks.tsx`, `components/ontology/ontology-graph-canvas.tsx`
- `components/editor/note-hover-preview.tsx`, `components/editor/nodes/query-node.tsx`
- `components/linear-sidebar.tsx` (count func + createFolder call signature)
- `app/(app)/folder/[id]/page.tsx` (folderNotes/Wikis filter)
- 신규: `lib/store/__tests__/migrate-v107.test.ts` (있으면)

### PR (b) — ~6-8 files
- `components/linear-sidebar.tsx` (Wiki context Folders section 신규 + Notes context kind filter)
- `app/(app)/folder/[id]/page.tsx` (kind 분기)
- `components/views/wiki-list.tsx` (FolderPickerSubmenu kind prop)
- `components/notes-board.tsx`, `note-list.tsx`, `notes-table.tsx` (FolderChip multi)
- `components/floating-action-bar.tsx`, `note-detail-panel.tsx` (folder picker kind filter)
- DnD validation 사이트 (notes-board, notes-table, etc.)

### PR (c) — ~5 files
- `components/note-detail-panel.tsx` (multi-folder chips)
- `components/views/wiki-detail-panel.tsx` (있다면)
- 새 `components/multi-folder-picker.tsx`
- `components/notes-board.tsx` (cross-folder marker)
- `lib/store/slices/notes.ts`, `wiki-articles.ts` (`setNoteFolders`/`setWikiFolders`)
- DnD modifier 처리

---

## Handoff to Implementation

이 plan이 OK라면:
- PR (a)부터 시작 권장 — 가장 큰 영향, 타입이 후속 PR 모두 강제 정의
- PR (a) 하나에 5-7시간 (실제 코드 + 마이그레이션 검증 + 테스트)
- PR (b/c)는 각 2-4시간

플랜 OK 시 다음 명령:
```
/oh-my-claudecode:start-work folder-nm-migration
```
