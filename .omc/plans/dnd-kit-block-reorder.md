# Plan: dnd-kit 기반 블록 리오더링

## Context

### Original Request
TipTap 에디터의 ProseMirror 네이티브 드래그를 dnd-kit 기반 블록 리오더링으로 교체.
최상위 블록만 대상, 드래그 핸들 + 실시간 프리뷰 + ProseMirror 트랜잭션 기반 커밋.

### Research Findings

**현재 구조:**
- `shared-editor-config.ts`: `GlobalDragHandle` (tiptap-extension-global-drag-handle) + `Dropcursor` 등록
- `TipTapEditor.tsx`: `EditorContent` 호스트, `handleDOMEvents`로 plot 전용 drag 타입 필터링
- `EditorStyles.css`: `.drag-handle`, `.drop-cursor`, `.ProseMirror.dragging` 스타일
- 커스텀 블록 노드 7종: toc, callout, summary, columns, note-embed, infobox, content-block
- 문서 스키마: `title block+` (TitleDocument) -- title은 항상 첫 번째
- dnd-kit 이미 설치됨: `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`
- `toolbar/arrange-mode.tsx`에서 dnd-kit 사용 패턴 존재 (참고용)

**핵심 기술 과제:**
1. ProseMirror DOM vs React DOM 소유권 충돌
2. 블록 위치/크기 정보 추출 (ProseMirror -> dnd-kit)
3. 드래그 완료 시 ProseMirror transaction으로 노드 이동
4. DragOverlay에서 ProseMirror 노드 렌더링
5. title 노드 리오더 제외
6. 텍스트 드래그 선택 + 외부 파일 드롭 유지

### Design Decision: 방향 A (Overlay Layer)

**선택 이유:**
- dnd-kit의 SortableContext는 React가 DOM을 관리해야 함 -> ProseMirror DOM에 직접 바인딩 불가
- Overlay Layer는 ProseMirror DOM 위에 투명 레이어를 띄워 dnd-kit이 독립적으로 동작
- ProseMirror의 DOM 소유권을 침해하지 않음
- 드래그 핸들 클릭 시에만 오버레이 활성화 -> 텍스트 선택/외부 드롭 영향 없음

**대안 (방향 B)과의 비교:**
- 방향 B는 보이지 않는 sortable 리스트 + CSS transform 조합 -> 위치 동기화가 복잡
- 방향 A는 실제 블록 위치를 직접 overlay에 매핑 -> 더 직관적

---

## Work Objectives

### Core Objective
GlobalDragHandle + ProseMirror 네이티브 드래그를 제거하고, dnd-kit 기반 블록 리오더링 시스템으로 교체한다.

### Deliverables
1. `BlockDragOverlay` 컴포넌트 -- EditorContent 위에 투명 드래그 레이어
2. `useBlockPositions` 훅 -- ProseMirror doc에서 블록 위치/크기 추출
3. `useBlockReorder` 훅 -- dnd-kit 이벤트 -> ProseMirror 트랜잭션 변환
4. 드래그 핸들 UI (hover 시 블록 왼쪽 표시)
5. GlobalDragHandle + Dropcursor 제거
6. CSS 업데이트

### Definition of Done
- [ ] 최상위 블록(title 제외)을 드래그 핸들로 리오더 가능
- [ ] 드래그 중 실시간 프리뷰 (다른 블록 밀림)
- [ ] 드래그 중 원래 위치에 반투명 원본 표시
- [ ] 드롭 시 ProseMirror 트랜잭션으로 문서 변경
- [ ] 텍스트 선택 + 드래그 정상 동작
- [ ] 외부 파일 드롭 (FileHandler) 정상 동작
- [ ] title 노드는 항상 첫 번째 유지
- [ ] 키보드 접근성 (방향키로 블록 이동)

---

## Guardrails

### Must Have
- ProseMirror가 문서의 source of truth (dnd-kit은 시각적 레이어만)
- 드롭 시 반드시 ProseMirror `tr`로 노드 이동 (직접 DOM 조작 금지)
- title 노드 리오더 불가
- 기존 텍스트 드래그, 외부 파일 드롭 동작 유지
- Undo/Redo 지원 (ProseMirror tr 기반이므로 자동)

### Must NOT Have
- 중첩 블록 내부 리오더 (Callout 안의 paragraph 등) -- 이번 스코프 아님
- 크로스 에디터 드래그 (에디터 간 블록 이동) -- 이번 스코프 아님
- 모바일 터치 최적화 -- 데스크톱 우선, 터치는 dnd-kit 기본 지원으로 충분

---

## Task Flow

```
Phase 1 (Foundation)
  ├── Task 1.1: useBlockPositions 훅
  └── Task 1.2: useBlockReorder 훅
        ↓
Phase 2 (UI Layer)
  ├── Task 2.1: BlockDragOverlay 컴포넌트
  ├── Task 2.2: DragHandle 컴포넌트
  └── Task 2.3: DragOverlay 렌더링
        ↓
Phase 3 (Integration)
  ├── Task 3.1: TipTapEditor 통합
  ├── Task 3.2: GlobalDragHandle + Dropcursor 제거
  └── Task 3.3: CSS 마이그레이션
        ↓
Phase 4 (Polish)
  ├── Task 4.1: 애니메이션 + 접근성
  └── Task 4.2: 엣지 케이스 + 테스트
```

---

## Phase 1: Foundation (훅 레이어)

### Task 1.1: `useBlockPositions` 훅

**파일:** `components/editor/dnd/use-block-positions.ts` (신규)

**목적:** ProseMirror doc에서 최상위 블록들의 position(doc 내 offset)과 DOM rect를 추출.

**핵심 로직:**
```
1. editor.state.doc.forEach((node, offset, index) => ...) 로 최상위 노드 순회
2. index === 0 이면 title -> 스킵
3. 각 블록의 { id, nodeType, docPos, nodeSize } 를 배열로 반환
4. DOM rect는 editor.view.nodeDOM(docPos) 로 가져옴
5. editor 트랜잭션 발생 시 (doc 변경) 자동 재계산
   - useEditorState selector 또는 editor.on('transaction') 사용
```

**반환 타입:**
```ts
interface BlockPosition {
  id: string          // UniqueID 또는 fallback (index 기반)
  nodeType: string    // 'paragraph', 'heading', 'callout-block', ...
  docPos: number      // ProseMirror doc 내 절대 위치
  nodeSize: number    // 노드 크기 (tr.delete/insert에 필요)
  domRect: DOMRect | null  // 시각적 위치 (오버레이 매핑용)
}
```

**주의사항:**
- UniqueID extension이 이미 등록되어 있으므로 `node.attrs.id` 사용 가능
- 단, UniqueID types에 커스텀 블록 노드가 빠져있을 수 있음 -> 확인 필요
- fallback: `block-${index}` 형태의 임시 ID

**Acceptance Criteria:**
- [ ] title 제외한 최상위 블록 목록 정확히 반환
- [ ] doc 변경 시 자동 업데이트
- [ ] DOM rect 정확히 계산

---

### Task 1.2: `useBlockReorder` 훅

**파일:** `components/editor/dnd/use-block-reorder.ts` (신규)

**목적:** dnd-kit의 onDragEnd에서 호출. 블록의 원래 위치 -> 새 위치로 ProseMirror 트랜잭션 발행.

**핵심 로직:**
```ts
function reorderBlock(editor: Editor, fromPos: number, fromSize: number, toIndex: number, blocks: BlockPosition[]) {
  const { tr } = editor.state
  const node = editor.state.doc.nodeAt(fromPos)
  if (!node) return

  // Step 1: 원본 노드 복사
  const slice = node.copy(node.content)

  // Step 2: 삽입 위치 계산
  // toIndex 기준으로 blocks[toIndex].docPos 를 참조하되,
  // fromIndex < toIndex 일 때 삭제 후 offset 보정 필요

  // Step 3: 트랜잭션 — delete 후 insert (단일 tr)
  // 중요: delete 먼저 하면 이후 위치가 바뀌므로 mapping 사용
  // 방법 A: tr.delete(from, from+size).insert(mappedTo, slice)
  // 방법 B: tr.step(ReplaceStep) 2번 (더 안전)

  editor.view.dispatch(tr)
}
```

**ProseMirror 트랜잭션 전략 (상세):**

블록 이동은 "원본 삭제 + 대상 위치 삽입"이다. 단일 tr 안에서 수행해야 Undo가 한 번에 됨.

```ts
// fromIndex -> toIndex 이동
if (fromIndex < toIndex) {
  // 아래로 이동: 먼저 insert, 후 delete (offset 안 꼬임)
  tr.insert(targetPos + targetNode.nodeSize, movingNode)
  tr.delete(fromPos, fromPos + movingNode.nodeSize)
} else {
  // 위로 이동: 먼저 delete, 후 insert
  tr.delete(fromPos, fromPos + movingNode.nodeSize)
  tr.insert(targetPos, movingNode)
}
```

실제로는 `tr.mapping`을 사용하는 게 더 안전:
```ts
tr.delete(fromPos, fromPos + nodeSize)
const mappedTarget = tr.mapping.map(insertPos)
tr.insert(mappedTarget, node)
```

**Acceptance Criteria:**
- [ ] 블록 위/아래 이동 정확히 동작
- [ ] 단일 tr로 수행 (Undo 1회로 복원)
- [ ] 연속 리오더 안정적 동작

---

## Phase 2: UI Layer (시각적 컴포넌트)

### Task 2.1: `BlockDragOverlay` 컴포넌트

**파일:** `components/editor/dnd/block-drag-overlay.tsx` (신규)

**목적:** EditorContent 위에 투명한 DndContext + SortableContext 오버레이를 배치.

**구조:**
```tsx
<div style={{ position: 'relative' }}>
  {/* ProseMirror EditorContent -- 원래 위치 */}
  <EditorContent editor={editor} />

  {/* dnd-kit 오버레이 레이어 */}
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
  >
    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
      {/* 각 블록 위치에 투명 sortable 영역 + 드래그 핸들 */}
      {blocks.map(block => (
        <SortableBlockSlot key={block.id} block={block} />
      ))}
    </SortableContext>

    {/* 드래그 중 표시되는 복제본 */}
    <DragOverlay>
      {activeBlock && <BlockPreview block={activeBlock} editor={editor} />}
    </DragOverlay>
  </DndContext>
</div>
```

**SortableBlockSlot 컴포넌트:**
- `position: absolute`로 해당 블록의 DOM rect에 매핑
- 드래그 핸들만 클릭 가능 (나머지 영역은 `pointer-events: none`)
- useSortable로 transform/transition 제공
- 드래그 중일 때 해당 블록 DOM 요소에 `opacity: 0.4` 적용 (반투명 원본)

**pointer-events 전략:**
```
기본 상태:
  오버레이 전체 -> pointer-events: none (에디터 클릭/타이핑 통과)
  드래그 핸들만 -> pointer-events: auto

드래그 중:
  오버레이 전체 -> pointer-events: auto (dnd-kit이 제어)
  에디터 -> pointer-events: none (텍스트 선택 방지)

드래그 완료:
  기본 상태로 복귀
```

**Acceptance Criteria:**
- [ ] 에디터 타이핑/클릭에 간섭 없음
- [ ] 드래그 핸들 hover 시 표시
- [ ] 블록 위치와 정확히 겹침

---

### Task 2.2: DragHandle 컴포넌트

**파일:** `components/editor/dnd/drag-handle.tsx` (신규)

**목적:** 블록 왼쪽에 hover 시 나타나는 드래그 핸들.

**디자인 (현재 GlobalDragHandle과 동일):**
- 24x24px, border-radius 4px
- "⠿" 아이콘 (또는 Phosphor DotsSixVertical)
- hover 시 배경 색상
- cursor: grab / grabbing

**위치 계산:**
- 블록 DOM rect의 left - 32px, top + (height/2 - 12)
- 에디터 컨테이너 기준 상대 좌표

**Acceptance Criteria:**
- [ ] 블록 hover 시 왼쪽에 핸들 표시
- [ ] 핸들 hover out 시 숨김 (약간의 딜레이)
- [ ] 현재 GlobalDragHandle과 동일한 시각적 결과

---

### Task 2.3: DragOverlay 렌더링

**파일:** `components/editor/dnd/block-preview.tsx` (신규)

**목적:** 드래그 중 커서를 따라다니는 블록 프리뷰.

**렌더링 전략:**
```
Option A: DOM 클론 (권장)
  - editor.view.nodeDOM(docPos) 의 outerHTML을 cloneNode(true)로 복사
  - DragOverlay 안에 dangerouslySetInnerHTML로 렌더
  - 장점: ProseMirror 렌더링 결과 그대로 복제, 커스텀 노드 NodeView도 정확히 보임
  - 단점: React 이벤트 핸들러 없음 (드래그 중이라 불필요)

Option B: ProseMirror 노드를 직접 JSON -> React로 재렌더
  - 너무 복잡, 각 노드 타입별 렌더러 필요 -> 비추

Option C: 스크린샷 캡처
  - html2canvas 등 -> 너무 무거움 -> 비추
```

**DOM 클론 구현:**
```tsx
function BlockPreview({ block, editor }: { block: BlockPosition, editor: Editor }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    const dom = editor.view.nodeDOM(block.docPos) as HTMLElement
    if (dom) {
      const clone = dom.cloneNode(true) as HTMLElement
      setHtml(clone.outerHTML)
    }
  }, [block.docPos])

  return (
    <div
      className="block-drag-preview"
      style={{ width: block.domRect?.width, opacity: 0.85, pointerEvents: 'none' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

**Acceptance Criteria:**
- [ ] 드래그 중 프리뷰가 커서를 따라다님
- [ ] 원본 블록과 시각적으로 동일
- [ ] 약간의 그림자 + 스케일 효과 (드래그 중임을 표시)

---

## Phase 3: Integration (기존 코드 연결)

### Task 3.1: TipTapEditor 통합

**파일:** `components/editor/TipTapEditor.tsx` (수정)

**변경 내용:**
1. `EditorContent`를 `BlockDragOverlay`로 감싸기
2. editor 인스턴스를 BlockDragOverlay에 전달

**Before:**
```tsx
<div ref={editorWrapRef} className="flex-1">
  <EditorContent editor={editor} className="w-full" />
</div>
```

**After:**
```tsx
<div ref={editorWrapRef} className="flex-1">
  <BlockDragOverlay editor={editor}>
    <EditorContent editor={editor} className="w-full" />
  </BlockDragOverlay>
</div>
```

**Acceptance Criteria:**
- [ ] 기존 에디터 기능 모두 정상 동작
- [ ] 드래그 리오더 동작
- [ ] handleDOMEvents의 plot 전용 drag 타입 필터링 유지

---

### Task 3.2: GlobalDragHandle + Dropcursor 제거

**파일:** `components/editor/core/shared-editor-config.ts` (수정)

**변경 내용:**
1. `import GlobalDragHandle` 제거
2. `GlobalDragHandle.configure(...)` 블록 제거
3. `Dropcursor` 설정 변경 -- 블록 드래그용 dropcursor는 불필요하나,
   텍스트/이미지 드래그 시 dropcursor는 여전히 유용할 수 있음
   -> Dropcursor는 유지하되 `tiptap-extension-global-drag-handle` 패키지만 제거
4. `import AutoJoiner` 제거 (GlobalDragHandle과 세트)

**패키지 제거:**
```bash
npm uninstall tiptap-extension-global-drag-handle tiptap-extension-auto-joiner
```

**Acceptance Criteria:**
- [ ] GlobalDragHandle import 제거
- [ ] AutoJoiner import 제거
- [ ] 빌드 에러 없음
- [ ] Dropcursor는 텍스트/이미지 드래그용으로 유지

---

### Task 3.3: CSS 마이그레이션

**파일:** `components/editor/EditorStyles.css` (수정)

**변경 내용:**
1. `.drag-handle` 관련 CSS 제거 (GlobalDragHandle용)
2. `.drop-cursor` CSS -- Dropcursor가 유지되면 유지, 아니면 제거
3. `.ProseMirror.dragging` 관련 CSS 제거
4. 새 CSS 추가:

```css
/* ── Block Drag Overlay ──────────────────────────────── */
.block-drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.block-drag-overlay.is-dragging {
  pointer-events: auto;
}

/* 드래그 핸들 */
.block-drag-handle {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 11;
}

.block-drag-handle:hover,
.block-drag-handle.visible {
  opacity: 1;
}

.block-drag-handle::after {
  content: "\u2800\u28FF";  /* braille dots */
  font-size: 14px;
  color: hsl(var(--muted-foreground) / 0.4);
  line-height: 1;
}

.block-drag-handle:hover::after {
  color: hsl(var(--muted-foreground));
}

.block-drag-handle:hover {
  background: hsl(var(--hover-bg));
}

.block-drag-handle:active {
  cursor: grabbing;
}

/* 드래그 중 원본 블록 반투명 */
.ProseMirror [data-block-dragging="true"] {
  opacity: 0.4;
  transition: opacity 150ms ease;
}

/* 드래그 프리뷰 */
.block-drag-preview {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 4px 8px;
  pointer-events: none;
  transform: scale(1.02);
}

/* sortable 슬롯 이동 애니메이션 */
.sortable-block-slot {
  transition: transform 200ms ease;
}
```

**Acceptance Criteria:**
- [ ] 레거시 drag-handle CSS 제거
- [ ] 새 블록 드래그 CSS 적용
- [ ] 시각적으로 이전과 동일한 핸들 모양

---

## Phase 4: Polish (애니메이션 + 엣지 케이스)

### Task 4.1: 애니메이션 + 접근성

**변경 내용:**
1. dnd-kit의 `KeyboardSensor` 등록 -- 방향키로 블록 이동 (접근성)
2. `restrictToVerticalAxis` modifier 적용 -- 수평 이동 방지
3. 드래그 시작/종료 애니메이션 (scale, shadow transition)
4. 드래그 중 스크롤: dnd-kit `AutoScrollActivator` 또는 커스텀 스크롤 로직

**Acceptance Criteria:**
- [ ] 키보드로 블록 이동 가능
- [ ] 수직 방향만 이동
- [ ] 부드러운 애니메이션

---

### Task 4.2: 엣지 케이스 처리

**체크리스트:**
- [ ] 빈 문서 (title만 있는 경우) -- 드래그 대상 없음, 에러 없이 처리
- [ ] 블록 1개만 있는 경우 -- 리오더 불필요, 핸들만 표시
- [ ] 매우 긴 블록 (이미지, 긴 코드블록) -- DragOverlay 크기 제한
- [ ] 드래그 중 에디터 외부로 벗어남 -- onDragCancel 처리
- [ ] 드래그 중 Ctrl+Z -- 무시 또는 안전하게 처리
- [ ] 동시에 여러 에디터 인스턴스 (split view) -- DndContext 격리
- [ ] 커스텀 atom 노드 (TocBlock 등, selectable:true) -- 핸들 정상 표시
- [ ] Callout 같은 wrapper 노드 (content:"block+") -- 전체 블록으로 취급
- [ ] title 노드 위로 블록 이동 시도 -- 차단 (title은 항상 index 0)

**Acceptance Criteria:**
- [ ] 위 엣지 케이스 모두 크래시 없이 동작

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ProseMirror DOM 위치와 오버레이 위치 불일치 (스크롤, 리사이즈) | 핸들 위치 어긋남 | ResizeObserver + scroll listener로 위치 재계산 |
| DragOverlay의 DOM 클론이 커스텀 NodeView 스타일 못 가져옴 | 프리뷰 깨짐 | 클론 시 computed style 복사, 또는 EditorStyles.css 클래스 유지 확인 |
| dnd-kit SortableContext의 transform이 ProseMirror DOM에 영향 | 렌더링 깨짐 | 오버레이는 별도 레이어, ProseMirror DOM에는 CSS class만 토글 |
| FileHandler의 onDrop과 dnd-kit onDrop 충돌 | 파일 드롭 안 됨 | 드래그 핸들에서 시작된 드래그만 dnd-kit 처리, 외부 드래그는 패스스루 |
| 성능: 블록 많을 때 (100+) position 재계산 비용 | 느려짐 | throttle + IntersectionObserver로 visible 블록만 계산 |
| split view에서 DndContext 충돌 | 드래그 오작동 | 에디터별 고유 DndContext id 부여 |

---

## Commit Strategy

```
commit 1: feat: add useBlockPositions + useBlockReorder hooks (Phase 1)
commit 2: feat: add BlockDragOverlay + DragHandle + BlockPreview components (Phase 2)
commit 3: feat: integrate dnd-kit block reorder into TipTapEditor (Phase 3)
commit 4: refactor: remove GlobalDragHandle + AutoJoiner + legacy CSS (Phase 3)
commit 5: feat: add keyboard accessibility + animations + edge cases (Phase 4)
```

---

## File Summary

| Action | File |
|--------|------|
| CREATE | `components/editor/dnd/use-block-positions.ts` |
| CREATE | `components/editor/dnd/use-block-reorder.ts` |
| CREATE | `components/editor/dnd/block-drag-overlay.tsx` |
| CREATE | `components/editor/dnd/drag-handle.tsx` |
| CREATE | `components/editor/dnd/block-preview.tsx` |
| MODIFY | `components/editor/TipTapEditor.tsx` |
| MODIFY | `components/editor/core/shared-editor-config.ts` |
| MODIFY | `components/editor/EditorStyles.css` |
| DELETE (dep) | `tiptap-extension-global-drag-handle` |
| DELETE (dep) | `tiptap-extension-auto-joiner` |

**총 5개 신규 파일, 3개 수정, 2개 패키지 제거**

---

## Success Criteria

1. 최상위 블록을 드래그 핸들로 자유롭게 리오더 가능
2. 드래그 중 실시간 프리뷰로 최종 배치 확인 가능
3. Undo/Redo로 리오더 되돌리기 가능
4. 텍스트 선택, 외부 파일 드롭 등 기존 기능 영향 없음
5. 키보드 접근성 지원
6. 빌드 에러 없음, 성능 저하 없음
