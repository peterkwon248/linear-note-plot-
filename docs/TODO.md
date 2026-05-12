# TODO

> 우선순위 기반 작업 목록. **P0 = 다음 세션 즉시 시작점** (NEXT-ACTION.md 폐지, 2026-05-12).
> 완료 항목은 즉시 삭제 또는 "완료" 섹션으로 이동.

**마지막 갱신**: 2026-05-12 (Board/Gallery polish + Split view fix + hotfix 4 PR cascade)

---

## 🔴 P0 — 즉시 (다음 세션)

### Trash "All" 통합 view 신규 ⭐⭐⭐ — 다음 세션 최우선
**사용자 의도** (이번 세션 명시): *"ALL은 모든 entity의 trashed 통합 표시. 노트든 위키든 태그든 라벨이든 삭제된 것들은 전부 ALL에 나와야"*.

**현재 상태**: count 통합 (`trashTabCounts.all = sum`), display는 notes만 (notes-table.tsx) → "1개라는데 아무것도 안 보임" 모순.

#### Sub-tasks (단계별)

**Step 1**: `components/views/trash-all-view.tsx` 신규 (~150-200 LOC)
- Props: 없음 (store hook으로 모든 entity 직접)
- imports: `usePlotStore`, entity restore actions, entity icons, ContextMenu
- 8 entity별 데이터 추출:
  ```ts
  const notesTrashed = usePlotStore(s => s.notes.filter(n => n.trashed))
  const wikiTrashed = usePlotStore(s => s.wikiArticles.filter(w => w.trashed))
  const booksTrashed = usePlotStore(s => s.books.filter(b => b.trashed))
  const tagsTrashed = usePlotStore(s => s.tags.filter(t => t.trashed))
  const labelsTrashed = usePlotStore(s => s.labels.filter(l => l.trashed))
  const templatesTrashed = usePlotStore(s => s.templates.filter(t => t.trashed))
  const refsTrashed = Object.values(usePlotStore(s => s.references)).filter(r => r.trashed)
  const attachmentsTrashed = usePlotStore(s => s.attachments.filter(a => a.trashed))
  ```

**Step 2**: entity별 section render (빈 section hide)
```tsx
<TrashAllView>
  {notesTrashed.length > 0 && <Section title="Notes" count={notesTrashed.length}>
    {notesTrashed.map(n => <TrashRow kind="note" item={n} />)}
  </Section>}
  {/* ... 7 entity 동일 패턴 ... */}
</TrashAllView>
```

**Step 3**: TrashRow 통합 layout (entity 무관)
```tsx
<TrashRow kind item>
  <span className="icon">{entityIcon(kind)}</span>
  <span className="entity-badge">{kindLabel}</span>
  <span className="title">{item.title || item.name}</span>
  <button onClick={() => restore(kind, item.id)}>Restore</button>
  <button onClick={() => deleteForever(kind, item.id)}>Delete forever</button>
</TrashRow>
```

**Step 4**: Store action 매핑 helper
```ts
function restore(kind, id) {
  const s = usePlotStore.getState()
  switch (kind) {
    case "note": s.toggleTrash(id); break
    case "wiki": s.updateWikiArticle(id, { trashed: false } as any); break
    case "book": s.restoreBook(id); break
    case "tag": s.restoreTag(id); break
    case "label": s.restoreLabel(id); break
    case "template": s.restoreTemplate(id); break
    case "reference": s.restoreReference(id); break
    case "attachment": s.restoreAttachment(id); break
  }
}
```
delete forever는 entity별 hard-delete action 존재 여부 확인 (lib/store/slices/*.ts). 없으면 trashed=true 유지 + toast.

**Step 5**: notes-table.tsx 분기
```tsx
if (isTrashView && trashFilter === "all") {
  return <TrashAllView />
}
```

**Step 6**: `trashTabCounts.all` 보강 (notes-table.tsx:408)
- wikiArticles 누락 — `trashedWiki.length` 추가
- `all: trashed.length + trashedWiki.length + trashedBooks.length + ...`

#### 위험 + 회피
- JSX conditional render: `{cond && (<X />)}` parens (이번 세션 hotfix 패턴)
- Store action 시그니처: 각 entity restore signature `(id: string) => void` 가정. 확인 후 진행.
- Empty state: 모든 entity trashed.length === 0 시 "Trash is empty" 표시
- entity별 icon: notes (Hexagon/Cube/Cuboid2x2 status icon), wiki (IconWikiArticle/Stub), books (BookOpen), tags (Hash), labels (LabelIcon), templates (FileText), references (BookmarkSimple), attachments (Paperclip) — 각 entity별 fallback

#### 참고 파일
- `components/notes-table.tsx:398-418` — trashTabCounts logic (count source)
- `lib/store/slices/{notes,wikiArticles,books,tags,labels,templates,references,attachments}.ts` — restore + delete actions
- `components/note-context-menu-items.tsx` — Trash 메뉴 패턴 (notes context)
- `components/views/wiki-list.tsx` — wiki trashed handling
- `components/books/book-table.tsx` — book trashed handling (ContextMenu)

### Wiki UX cherry-pick 사용자 manual verify
이번 세션 통합된 변경 — 시각 확인 필요:
- `/wiki` list mode 우클릭 → cursor 추적 OK
- Wiki 1+ row 선택 → 하단 플로팅바 6 액션 (Pin/Move/Add to category/Merge/Split/Delete)
- `/wiki` gallery mode 우클릭 → ContextMenu 나타남

### Notes 4 surface ContextMenu manual verify
- `/notes` list mode 우클릭 → 13 items
- `/notes` board mode 우클릭 → 동일 13 items
- `/notes` gallery mode 우클릭 → 동일 13 items
- board mode 카드 선택 → 우측 BoardWorkbench "Organize" 섹션 (Pin/Move/Split)

### Notes board drag/empty column manual verify
- 카드 drag → drop 시 smooth animation (220ms cubic-bezier)
- 카드를 다른 status로 옮긴 후 원래 column 유지 (drop target)
- Stone/Brick/Block 3 column 항상 표시

### Books grid/board/gallery pin 위치 점검 (이번 세션 list만 fix)
- grid mode: cover icon 큰 layout — pin 위치 자연스러운가
- board mode: card layout
- gallery mode: entity-agnostic adapter — pin 표시 여부
- 회귀 발견 시 list pattern 정합화

### #2 Status icon stale — 사용자 reproduce 정보 필요
보드에서 drag로 status 변경 후 어디선가 leading icon이 옛 status로 stale. 코드 분석 시 모든 leading icon = `note.status` 기반 + React memo trigger 정상. root cause 명확치 않아 skip.

다음 세션에 사용자 시그널 받기:
- 어느 view? (board / list / gallery / sidebar / preview pane / detail panel)
- 어느 element? (카드 leading icon / top color band / status badge / group header)
- drag 직후 vs page reload 후 stale?
- 스크린샷

### Block 색 + Gallery click parity + Split view 사용자 manual verify
이번 세션 PR #305-#308 변경 — 시각 확인:
- /notes Block status 카드/아이콘 → slate (회색 톤) 표시
- /notes gallery → single click preview / double click 편집 / cmd-click select + 하단 floating bar / hover checkbox
- /notes split view → secondary pane은 board column만 (workbench 안 보임, drop target 정상)
- /notes 페이지 reload 후 — Board mode에 Stone/Brick/Block 3 column 모두 표시

### STATUS_CONFIG 패턴 다른 lookup map에 적용
이번 세션 hotfix (#308) — `STATUS_CONFIG[status]` null guard 추가. 다른 lookup map에 동일 패턴 적용 후보:
- PRIORITY_CONFIG (priority lookup)
- BOARD_DEFAULT_GROUP (effectiveTab lookup)
- 기타 Record<X, Y> 타입 모든 access 점검

### 글로벌 commands 수동 삭제 (양 머신)
```bash
rm ~/.claude/commands/before-work.md
rm ~/.claude/commands/after-work.md
```
NEXT-ACTION 의존 옛 정의 제거. project-level (git tracked) 새 정의가 단일 진실.

---

## 🔵 보류

### Manual verify Books 4 viewMode + 회귀 fix
다음 세션 시작 시 진행. 7 step 절차 (아래).

```
1. Grid mode 정상 (cover emoji + 카드, 우클릭 메뉴)
2. Search "Search books" → title/description 실시간 필터링
3. List mode → BookListRow chip (Kind/ItemCount/SourceKind/Pin/Time)
4. Filter popover 4 categories (Kind/SmartSource/Pin/Updated)
5. Pinned-first sort → reload 후 유지
6. viewState persist (viewMode/sort/filter)
7. Board mode → column drag + card drag (pinned toggle / kind confirm)
8. Gallery mode → entity-agnostic GalleryView (accent kind-based)
```

회귀 발견 시 즉시 fix → 추가 commit.

### (verify 통과 시) Wiki 그룹 헤더 아이콘 (~30분)
- WikiList/WikiBoard 미적용 (Notes Table/Board/Gallery는 5-11에서 통일됨, Books는 5-12)
- 자투리 시간 정리 후보

---

## 🟡 P1 — 큰 작업 후보

### Smart Book v2 — AutoSource picker UX 강화
- folder/category/tag/label/sticker source picker 풀 도입
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화

### Wiki view-engine board 도입
- Plot 일관성 (Notes/Books와 동일 viewMode 토글)
- WikiList → WikiBoard 라우트 통합

### Notes/Wiki/Books 통합 entity-agnostic ListRow/BoardCard 패턴
- Books의 BookListRow + BookGridCard 패턴 일반화
- generic 추출 없이도 reuse 패턴 (`renderListRow` prop) 도입

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

---

## 🟡 P1 — 큰 작업 후보

### Wiki template 3-layer
- Layout Preset + Content Template + Typed Infobox
- Wiki domain. v3 Phase 3+와 독립

### Smart Book v2 — AutoSource[5]
- folder / category / tag / label / sticker 자동 source
- Book entity 신규 (v3 7번째 space, rose 팔레트 #fb7185 dark / #e11d48 light)
- chapter 정렬 (Manual drag default + Auto-sort)
- Hull + Sequence edge 시각화 + Reading view

### Note UI toolbar (UpNote-style)
- 미루기 — 별도 큰 작업

### House (계보 시각화)
- 미루기 — 토론 필요

---

## 🟣 P2 — 작은 후속 정리

- Templates grid chip 시스템 완전 통일 (PR e deviation)
- 키보드 shortcut (D/T/P 등) 노트 + templates 통합
- Wiki bulk action bar (필요해지면)
- FolderPicker 검색 필터 (50+ 폴더 시점)
- Tag 우클릭 메뉴 Rename 옵션 추가
- Label 색 정책 재검토 (Tag opt-in 가능성)
- ReferencesView quickFilter / fieldKey filter → viewState.filters lift (PR 4 follow-up)
- FilesView type filter (all/image/document) → viewState.filters lift (PR 5 follow-up — Path A Step 1과 정합)
- File grid mode 실제 image preview (blob URL 처리, PR 5 follow-up)
- `docs/status-icons-preview.html` 등 mockup HTML untracked 파일 정리 (.gitignore 또는 삭제)

---

## ⏸️ 보류 / 영구 폐기

### Plot v3 Phase 2 (Imperial icon kit) — DEFERRED
- 119 files codemod scope 비대 + 시각 위화감 미미
- partial work (activity-bar 등) 그대로 보존
- 재개 조건: 정확한 인벤토리 + 매핑 coverage 검증 + 단일 책임 PR 분할

### onlook (visual code editor) — 적용 X
- production app 자동 코드 변경 회귀 위험
- greenfield/marketing 사이트에 적합

### Front-End-Design-Checklist — 적용 X
- design-quality-gate + linear-design-mirror + 4 design skills과 중복
- handoff 가이드 (디자이너↔개발자), 1인 dev audience 불일치

### Plot 2.0 브랜딩 — v3 visual refresh로 리브랜드
- 11가지 결정은 v3 PRD에 통합 보존

### 매거진/뉴스페이퍼/북 Pivot — 폐기 (2026-04-22)
- ✅ Studio/Editorial view modes 제거 완료 (Store v119, 2026-05-09)
### Dual mode — 폐기 (2026-05-11)
- Split view + list mode + editor pane으로 충분. v122 migration으로 자동 fix.
### AI provider 연결 — 정체성 위반 (2026-04-27)
### Notion식 Row density toggle — Linear 코어 (PR #224 revert)
### Page entity 신규 — atomic 위배 (2026-05-03)
### Generic `useEntityView<T>` hook 추출 — 영구 거부 (scope 폭발)

---

## ✅ 최근 완료

### 2026-05-12 (오후) — Board/Gallery polish + Split view fix + hotfix (4 PR cascade)
- ✅ **PR #305** (앞서 entry — ContextMenu DRY + Wiki UX cherry-pick + 워크플로우 재편)
- ✅ **PR #306**: Split view secondary pane workbench hide (`usePane()` 분기)
- ✅ **PR #307**: Block 색 slate (Plot 메타포 정합) + Gallery click parity (preview/open/select + 하단 FloatingActionBar)
- ✅ **PR #308**: Hotfix — notes-board JSX parser (parens 명시) + FloatingActionBar `STATUS_CONFIG` null guard
- 5 사용자 보고 처리: Block 색 ✅ / Gallery click ✅ / Split view ✅ / 7개 표시 ✅(PR #305) / Status icon stale ⏭️(reproduce 정보 필요)

### 2026-05-12 (낮~오후) — ContextMenu DRY + Wiki UX cherry-pick + Board polish + 워크플로우 재편 (Store v129 → v130)
- ✅ Dev server fix (npm install — node_modules 누락)
- ✅ Books list mode pin 위치 fix (title 옆, flex-1 제거)
- ✅ Notes Source filter values icon 추가 (Manual/Web Clip/Import)
- ✅ **NEXT-ACTION.md 영구 폐지** + before-work/after-work project-level 재편
- ✅ Split view popover에 Books 옵션 추가 (BookOpen icon, 영구 결정)
- ✅ Wiki seed 4개 확장 + v130 backfill migration (verify 데이터 다양성)
- ✅ **Cherry-pick `42c6e59`** — Wiki UX 3 issues (우클릭 cursor / 플로팅바 Pin+Move+Category / Gallery 우클릭)
- ✅ **ContextMenu DRY refactor** — `note-context-menu-items.tsx` helper + list/board/gallery 3 surfaces 통일 (Linear principle)
- ✅ **BoardWorkbench 보강** — Pin/Folder/Split 액션 추가 (list FloatingActionBar parity)
- ✅ Notes board polish — drag transition fix + 빈 status column 항상 표시 (Kanban) + smooth drop animation (220ms cubic-bezier)
- ✅ 시각 폴리시 — group header 폰트 (11→13) + row metadata 폰트 (12→13, muted→fg)
- Pin indicator 위치 = title 옆 (영구 결정 재확인, elastic-darwin의 status chip 옆 변경 폐기)

### 2026-05-12 (저녁~밤, 거대) — Books polish 6 PR + emoji 폐기 + Pin 통일 (Store v126 → v129)
- ✅ **PR #296** (v127): SEED_BOOKS migration backfill (기존 사용자에도 inject)
- ✅ **PR #297** (v128): Polish 1 — SEED emoji 제거 + Display properties Sources/Pin toggle + groupBy "status" stale validation
- ✅ **PR #298** (v129): emoji 영구 폐기 + Phosphor BookKindIcon 통일 (Plot icon 시스템)
- ✅ **PR #299**: Polish 2 — BookKindChip 색 (StatusBadge 패턴) + Filter Kind values icon + Save view 통일 (Trash chip 제거)
- ✅ **PR #300**: Pin 통일 — Books FloatingBar + Notes 우클릭 + Notes FloatingActionBar Pin
- ✅ **PR #301**: Pin indicator (Notes/Wiki title 옆 inline)

### 2026-05-12 (마라톤) — Books view-engine 풀 통합 4 viewMode (Store v122 → v126)
- ✅ **PR 1 (v123)**: 인프라 + grid 보존. useBooksView thin fork. 시각 변경 0
- ✅ **PR 2 (v124)**: list mode + sort/group/filter UI + 3 chip (BookItemCount/BookKind/BookSourceKind mini-bar). ViewHeader Search/Filter/Display 활성화. pinned-first sort
- ✅ **PR 3 (v125)**: board mode Option A (column drag + card drag, dnd-kit). groupBy kind/pinned. card drag UX: pinned 즉시 toggle / kind smart→manual confirm / manual→smart toast hint
- ✅ **PR 4 (v126)**: gallery mode (entity-agnostic adapter). 2026-05-11 GalleryView 재사용. kind-based accent color
- ✅ launch.json `npx next` 전환 (한글 경로 안전성)
- ✅ Plan `.omc/plans/books-view-engine-integration.md` 작성

### 2026-05-11 (마라톤) — 책 split view + Dual mode 폐기 + 갤러리 entity-agnostic (PR #291)

### 2026-05-10 (마라톤) — Smart Book Phase A + 책 reading flow (PR #290)

### 2026-05-09 (마라톤) — Book entity + Dual mode + Filter Path A 완전 종결 (PR #289)

### 2026-05-08 (오후) — Status icons + Phase 4.3 plan 보강 (5 PR + docs sync)
- ✅ **PR #271**: Status icons + UI 라벨 "Block" + Cuboid (1×2 isometric block) + Save view 16px (HBtn pattern)
- ✅ **PR #282**: PR 4.3a Tags+Labels chrome 통일 시도
- ✅ **PR #283**: PR #282 partial revert (`.a-row` grid 6-col 강제 충돌)
- ✅ **PR #284**: Tags row border-b 제거 + plan Section 9-10 (lessons + roadmap)
- ✅ **PR #285**: plan Section 11 Filter coverage 분석 (Step 1-5)
- ✅ **(이 PR)** docs sync — NEXT-ACTION / SESSION-LOG / MEMORY / TODO / CONTEXT

### 2026-05-07 (밤 늦게) — Plot v3 Phase 3 (4 PR)
- ✅ PR 3.1 (98f9277): CSS 통합 — `.a-actbar` / `.a-sidebar` / `.a-sb-*` (시각 변경 0)
- ✅ PR 3.2 (5ac22ef): activity-bar.tsx reskin (width 72px / label / brand mark / per-space 6색 inline)
- ✅ PR 3.3 (8155530): linear-sidebar.tsx reskin
- ✅ PR 3.4 (3761e42): brand mark = Plot 로고 SVG (네트워크 그래프) → 후 PR #270으로 mockup 패턴 P glyph 복귀

### 2026-05-07 (밤) — Group C PR-D 시리즈 5/5 완성
- ✅ Tags v110 / Labels v111 / Stickers v113 / References v114 / Files v115

### Plot v3 Phase 2 DEFER 결정 (3b84d7e)
### 4 design skills install (0f7e2ec)
