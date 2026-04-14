# Session Notepad (Updated: 2026-04-14 22:00)

## Critical Context
- PR #189 + #190 merged. Store v75
- **Y.Doc Split-View Sync PoC = SUCCESS (2026-04-14)** — 두 pane 실시간 bidirectional sync 작동 확인
- **Data-loss regression 추가 수정 (2026-04-14 밤)**: stale Y.Doc binding + 가드 임계값 문제 두 건 해결. PoC가 진짜로 안전해짐.
- **Insert 레지스트리 단일화 완료 (2026-04-14 밤)**: `components/editor/block-registry/` 생성. 3곳 중복 제거, 25+ entry 단일 source. B 인포박스 고도화 사전 작업 끝.
- 다음 세션: B 인포박스/나무위키 블록 Tier 1 (대표 이미지, 헤더 배너, 접기/펼치기, 섹션 구분) + Tier 2 배너/둘러보기 틀

## Y.Doc PoC — 해결된 버그들 (본 구현 시 주의)
1. **`history: false` → `undoRedo: false`** (shared-editor-config.ts): TipTap 3.x StarterKit는 `history`가 아니라 `undoRedo`로 리네임됨. Collaboration extension의 `"comes with its own history support and is not compatible with @tiptap/extension-undo-redo"` 경고가 결정적 힌트.
2. **`fragment.length === 0` seed guard 제거** (NoteEditorAdapter.tsx): Collaboration extension이 editor 생성 시점에 이미 빈 paragraph 1개를 XmlFragment에 pre-populate함. `onEditorReady` 시점에는 `fragment.length === 1`이라 seed가 영원히 skip됨. Y.Doc registry의 `isFresh` 플래그가 "첫 acquirer" 권위 있는 signal.
3. **Empty-content data loss guard** (NoteEditorAdapter.tsx handleChange): Fresh Y.Doc + 빈 editor → onUpdate fires empty → 저장된 실제 content를 "" 로 덮어쓰는 race. `ydoc && looksEmpty && storeHasContent` 시 save 거부하는 방어 가드 추가. `note-9` (Fleeting Note) 데이터 손실 사고로 발견 → backup에서 복구.
4. **`window.__plotStore` dev-only 노출** (lib/store/index.ts): PoC 테스팅 편의. NODE_ENV !== "production" 가드.
5. **Stale Y.Doc binding on note switch (2026-04-14 밤)** — `useState(ydoc) + useEffect(() => setYdoc(acquireYDoc(...)))` 패턴이 한 렌더 사이클 동안 stale Y.Doc을 노출. note.id가 A→B로 바뀌면 TipTapEditor가 `key={note.id+...}`로 remount되지만, 그 첫 렌더의 `ydoc` state는 아직 A의 Y.Doc. 새 editor가 A의 Y.Doc에 바인딩된 채 `handleEditorReady → setContent(B의 initialContent)`을 실행 → A의 공유 Y.Doc 내용을 B의 내용으로 덮어씀. 다른 pane이 CRDT로 전파된 이 내용을 받아 handleChange→save → A의 store entry에 B 내용이 영구 저장됨. **Fix**: `useRef` 3개(`ydocRef`, `ydocNoteIdRef`, `ydocIsFreshRef`)로 교체하고 **렌더 중 동기적으로** `ydocNoteIdRef.current !== note.id` 비교 → release old + acquire new. unmount cleanup은 별도 `useEffect`로. 증상: primary pane에서 다른 노트로 이동하면 secondary pane이 자동으로 같은 노트로 "따라오는 것처럼 보임" — 실제로는 secondary의 Y.Doc이 primary 내용으로 오염된 것.
6. **가드의 JSON byte-length 임계값 실패 (2026-04-14 밤)** — #3 방어 가드의 `looksEmpty` 판정이 `JSON.stringify(json).length < 80`을 포함. Collaboration extension이 pre-populate한 빈 paragraph가 UUID-bearing `id` attr + textAlign/indent attrs 때문에 JSON 약 125자 → 임계값 넘어서 `looksEmpty = false` → 가드 우회 → 빈 content 저장. 여기에 `ui.ts`의 auto-delete (title+content 둘 다 빈 노트는 openNote/setSelectedNoteId 시 삭제) 가 겹쳐 note가 아예 소멸. **Fix**: `looksEmpty = !plainText.trim()` 으로 단순화. `editor.getText()`는 텍스트 노드 없으면 무조건 빈 문자열 반환 (node attrs와 무관). `storeHasContent` 판정에 `note.title` 도 추가해 타이틀만 있는 노트도 보호.

## Y.Doc 본 구현 시 고려사항 (다음 세션)
- 현재는 in-memory PoC — 페이지 리로드 시 Y.Doc 폐기. `note.contentJson` 경로는 여전히 저장하므로 user data 손실 X, 하지만 CRDT history 유실
- y-indexeddb 붙여서 Y.Doc 영속화 → offline undo history + collab 준비
- Wiki도 동일 패턴 적용 가능 (WikiEditorAdapter에 acquireYDoc("wiki", id))
- 방어 가드 (handleChange empty-refuse) 는 본 구현에도 유지 — 다른 race condition 방어에도 유용

## Block Registry 구조 (2026-04-14 밤)
- `components/editor/block-registry/` — types.ts / registry.ts / index.ts
- `BlockRegistryEntry`: id, label, description, aliases, icon, surfaces, group, tier, execute(ctx)
- `surfaces: ("slash" | "insertMenu")[]` — 어느 UI에 노출될지. "toolbar" 는 없음 (FixedToolbar는 `getBlock(id)` 로 직접 참조)
- `tier: "base" | "note" | "wiki"` — "모든 새 기능 = base" 결정 반영
- `execute({ editor, range?, noteId? })` — range 있으면 slash path (deleteRange + blank attrs), 없으면 click path (example attrs)
- 예: math-inline 은 slash에서 `latex=" "`, 메뉴 클릭에서 `latex="E = mc^2"`
- 25개 built-in entry + SlashCommand에서 template 동적 추가
- 첨부 (Image/File) 는 registry 제외 — ref 기반 file input + noteId 의존성 특수

## Block Registry 사용처 (3곳 통합)
- **SlashCommand.tsx**: `getBlocksForSurface("slash").filter(matchesQuery)` + templates
- **insert-menu.tsx**: `BLOCK_REGISTRY.filter(e => e.surfaces.includes("insertMenu"))` + GROUP_ORDER 정렬 + 첨부 하드코드 (Image, File)
- **FixedToolbar.tsx**: `getBlock("divider").execute({ editor })` 등 직접 참조. allItems 배열 + 인라인 ToolbarButton 총 13개 체인 코드 제거
- 새 블록 추가: registry.ts에 entry 추가 → 두 메뉴에 자동 노출. toolbar에 퀵액세스 원하면 FixedToolbar에서 getBlock(id) 호출 추가
- 검증 완료: Callout (344→2590 HTML), Divider (hr 0→1), Toggle (details 0→1), Slash popup 25개 항목 렌더

## 나무위키 리서치 결과 — 도입할 기능 (노트+위키 공용)

## 나무위키 리서치 결과 — 도입할 기능 (노트+위키 공용)

### Tier 1 — 인포박스 고도화
- 대표 이미지 + 캡션 (인포박스 최상단)
- 헤더 배너 (배경색 테마 + 제목/부제목)
- 인포박스 접기/펼치기
- 섹션 구분 행 (정보 그루핑)

### Tier 2 — 새 블록 타입 (base 티어 = 노트+위키 공용)
- 배너 블록 (배경색 + 제목 + 부제, TipTap 커스텀 노드)
- 둘러보기 틀 / Navigation Box (관련 문서 그룹, 접기 가능)

### Tier 3 — 유틸리티 매크로 (인라인)
- 나이 계산 [age(YYYY-MM-DD)]
- D-Day [dday(날짜)]
- Include (다른 문서 내용 삽입)

### Tier 4 — 고급
- 상위/하위 문서 관계
- 각주 이미지 (FootnoteEditModal에 이미지 첨부)
- 루비 텍스트

## 아키텍처 결정 (다음 세션 적용)
- **모든 새 기능 = base 티어**: 노트+위키 둘 다 사용 가능하게
- **Insert 레지스트리 단일화**: Insert/MoreActions/SlashCommand 3곳 중복 → 단일 레지스트리에서 읽기
- **인포박스 = 노트에서도 동일 고도화**: 위키 전용이 아님

## Active Tasks
- [x] **Y.Doc Split-View Sync PoC** — 두 pane 실시간 bidirectional sync 작동 (2026-04-14)
- [x] **Y.Doc 데이터 손실 regression fix** — stale binding + JSON threshold 두 건 (2026-04-14 밤)
- [x] **Insert 레지스트리 단일화** — `block-registry/` 25 entry, 3곳 통합 완료 (2026-04-14 밤)
- [ ] **PHASE-PLAN 리뷰 + PoC 결과 반영** — y-indexeddb 영속화 계획, Wiki도 동일 패턴 적용 여부
- [ ] 인포박스 고도화 Phase 1 (대표 이미지, 헤더 배너, 접기, 섹션 구분)
- [ ] 배너 블록 (base 티어 TipTap 노드) — 이제 registry 한 곳에 entry 추가하면 slash + insert menu 자동 노출
- [ ] 둘러보기 틀 / Navigation Box (base 티어)
- [ ] 인사이트 허브

## Blockers
- 없음 (PoC 성공으로 이전 블로커 해소)

## Known Side Issues (본 작업 시 처리)
- `plot-note-bodies` IDB object store 누락 → "Body save failed: NotFoundError" 반복 경고. 초기화 로직 점검 필요.
- TipTap `[link, underline, gapCursor]` duplicate extension names 경고 — StarterKit + 별도 추가 extension 충돌 추정.
