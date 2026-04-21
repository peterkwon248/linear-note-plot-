# Book UX Refinement — 2026-04-21 (세션 후반)

> **맥락**: 같은 날 오전에 Book Pivot 대결정(`BRAINSTORM-2026-04-21-book-pivot.md`) → Phase 1A~2B-2a까지 구현 → **실제 동작 보면서 UX 재검토**.
>
> **이 문서의 범위**: Phase 2B-3 착수 전 UX 방향 재정렬. 기존 Phase 2~7 로드맵은 유효하되, 구체 구현 방식(Shell display 패턴 / Grid Editor 폐기 / Inline editor 성숙)을 확정.

---

## 🔴 이번 세션에서 내린 결정 (3가지)

### 결정 1 — **Inline Editor "Add Block" UX 성숙**

**문제**: 현재 BookInlineEditor는 TipTap wiki-tier만 붙인 미니멀. 블록 사이 `+` 버튼, 드래그 핸들, Turn Into 메뉴 등 Plot 기존 위키의 편집 풍부함이 없음.

**결정**: Phase 2B-3에서 Plot 기존 `wiki-block-renderer` 패턴을 **BookInlineEditor + WikiShell**에 이식.

**살릴 요소**:
- 블록 사이 hover `+` 버튼 (Insert Below)
- 좌측 드래그 핸들(⠿) → 메뉴 (Turn Into / Insert Below / Duplicate / Move / Delete)
- 슬래시 커맨드(`/`) — TipTap wiki tier에 이미 있음 (확인 완료)
- block-menu.tsx primitives (PR #209에서 살려놓음) 재활용

**버릴 요소**:
- FixedToolbar (너무 무거움 — Book은 깔끔한 읽기 중심)
- Resize handles (Book shell은 자유 리사이즈보다 grid snap이 어울림)

---

### 결정 2 — **Shell 선택 = "Display 버튼" 팝오버**

**문제**: 현재 BookEditor 상단에 Wiki/Magazine/Newspaper/Book/Blank 5개 영구 버튼. Plot 원칙 위반 (chrome minimalism, "Don't compete for attention you haven't earned").

**결정**: Notes의 Display 버튼과 **동일 패턴** 적용.

**새 구조**:
```
View Header (상단 오른쪽)
├── [Filter]
├── [Display ▾]       ← 새로 추가
│    └ 팝오버
│       ├ Shell: ◉ Wiki ◯ Magazine ◯ Newspaper ◯ Book ◯ Blank
│       ├ Render: ◉ Scroll ◯ Flipbook
│       ├ Theme: [default ▾]  (classic/modern/editorial/bauhaus)
│       ├ Decoration: ☐ Ribbon ☐ Bookmark ☐ Ornament
│       └ [Save as My Shell...]
└── [More ⋯]
```

- BookEditor 자체 top bar 제거
- Plot 기존 ViewHeader 패턴 재사용
- Tweak Panel 내용 → Display 팝오버로 통합

---

### 결정 3 — **Grid Editor 모드 폐기, Inline 드래그로 통합 (안 A)**

**문제**: 현재 Grid Editor는 별도 mode + 하드코딩 4블록. 사용자 멘탈 모델 "모드 전환해서 편집"은 Plot과 안 맞음 (Plot은 always-mounted, 인라인 편집).

**결정**: Grid Editor **모드 삭제**. 대신 **각 블록에 드래그 핸들** → 인라인에서 자연스럽게 레이아웃 재배치.

**핵심 원칙**:
- 드래그는 **shell-aware**: 현재 shell의 grid 구조에 따라 다르게 동작
- 드래그 중에만 grid overlay 표시 (평소엔 chrome 없음)
- "Layout Mode 토글" 없음 — 드래그 자체가 모드 전환

**구현 챌린지 (정리)**:

| Shell | Grid | 드래그 동작 |
|---|---|---|
| Wiki | 1-col 플로우 | 세로 reorder만 |
| Magazine | 2-col 플로우 | 세로 reorder + spanColumns/dropcap 특수 배치 |
| Newspaper | 6-col 엄격 | 세로 + 6-col snap |
| Book | 1-col centered | 세로 reorder만 |
| Blank | 12-col grid | 세로 + 12-col snap (가장 자유) |

---

## 🗺 Phase 2B-3 ~ 3A 재편 로드맵

기존 Phase 2B-3 (Infobox/TOC 실데이터)은 **후순위로 밀림** — 위 3개 결정이 더 긴급.

### Phase 2B-3 (신규, Inline Editor 성숙)

- **2B-3a**: 블록 사이 hover `+` 버튼 (Insert Below)
- **2B-3b**: 좌측 드래그 핸들 + 메뉴 (Turn Into / Duplicate / Delete)
- **2B-3c**: Section heading 인라인 편집 (contentEditable input 재활용)
- **2B-3d**: Plot 기존 `addWikiBlock` / `removeWikiBlock` / `updateWikiBlock` 연결

### Phase 2C (Display 버튼 이관)

- **2C-1**: ViewHeader에 Display 팝오버 추가
- **2C-2**: Shell 선택을 Display로 이관 (상단 5 버튼 제거)
- **2C-3**: Tweak Panel 내용 → Display 팝오버로 통합 (Shell + Render + Theme + Decoration)
- **2C-4**: BookEditor 자체 top bar 제거
- **2C-5**: My Shell savable preset (Display 팝오버 하단)

### Phase 3A (Grid Drag 통합)

- **3A-1**: 세로 reorder only (shell-agnostic, Plot `BlockDragOverlay` 재사용) — **1-2일**
- **3A-2**: `WikiBlock.col?/span?/row?` optional 필드 추가 (migration v81) — **반나절**
- **3A-3**: Blank shell grid drag (12-col snap + overlay) — **2-3일**
- **3A-4**: Newspaper shell 6-col drag — **1-2일**
- **3A-5**: Magazine shell spanColumns/dropcap 드래그 — **2-3일**
- **3A-6**: Grid Editor mode 코드 삭제 — **반나절**

### Phase 4+ (기존 로드맵 유지)

- Phase 4: Flipbook 구현 (이미 zip에서 복사됨, 데이터 연결만)
- Phase 5: Decoration Layer 전면
- Phase 6: Chrome 블록 성숙 + Infobox/TOC 실데이터 (**원래 2B-3이었던 것**)
- Phase 7: 노트 Split + Y.Doc + 인사이트 허브

---

## 🎯 다음 세션 즉시 액션

**Step 1**: Phase 2B-3a 착수 — 블록 사이 hover `+` 버튼
- 파일: `components/book/shells/wiki-shell.tsx` (우선 wiki만, 나머지 shell은 Phase 2B-3 말미에 확산)
- 패턴: Plot 기존 `wiki-block-renderer.tsx` 의 AddBlock 영역 참고
- 액션: `usePlotStore(s => s.addWikiBlock)` 직접 호출

**Step 2**: 2B-3b 드래그 핸들 추가

**Step 3**: Grid Editor mode 제거 전 Display 팝오버 설계 (Phase 2C 진입 타이밍)

---

## ⚠️ Risk / Watch Out

### R1. Display 팝오버가 Plot 기존 View 패턴과 매끄럽게 이어질까?

`components/view-header.tsx` + `DisplayPanel` 같은 기존 컴포넌트 재사용 가능 여부 확인 필요. 없으면 커스텀.

### R2. WikiBlock에 col/span/row 추가 시 기존 Plot 위키 렌더러 영향?

기존 `wiki-article-renderer.tsx`는 ColumnStructure layout만 참조. 새 필드는 optional이라 무시됨 — 안전. 다만 Book shell로 스위치했을 때 사용자가 배치 바꾸면 기존 Plot 위키 화면에서도 반영되는지 확인.

### R3. 드래그 UX가 작은 화면에서 동작?

터치 이벤트 처리, 좁은 viewport에서 12-col 축소 로직 필요. MVP는 데스크탑만.

### R4. Inline Editor에 Full TipTap 기능 전부 쓰면 Book의 "깔끔한 읽기" 감성 손상?

Plot 위키는 FixedToolbar가 에디터 하단에 상주 — Book은 안 맞음. **Toolbar 없는 wiki tier**를 어떻게 만들지 결정 필요 (createEditorExtensions에 flag 추가?). 지금 BookInlineEditor는 이미 toolbar 없이 쓰고 있음 ✅.

### R5. 드래그 핸들이 디자인 죄("카디널 죄": hover-reveal 곳곳)를 재범할 가능성

원칙: **선택된 블록에만 chrome**. 호버로 드래그 핸들 띄우되, 다른 블록은 조용히. 모든 블록에 핸들 상주 금지.

---

## 🧭 철학적 체크포인트

### "Pick shell / Edit blocks / Decorate" 3-move는 여전히 유효?

- **Pick shell** → Display 팝오버로 OK
- **Edit blocks** → Inline editor로 OK, 드래그 핸들도 여기 포함
- **Decorate** → Display 팝오버 통합

즉 3-move가 **UI 레이어로는 통합**됨 (하나의 Display 팝오버 안에서 모두 가능). 사용자 멘탈 모델은 여전히 3단계지만 UI 물리적 분리 없음.

이건 **ARCHITECTURE.md와 약간 다른 해석**이지만 Plot UX 철학에 더 맞음 ("Settings are not a design failure", "Don't compete for attention").

---

## 📚 참고

- `docs/BRAINSTORM-2026-04-21-book-pivot.md` — 이 세션의 루트 결정
- `docs/design-system/ui_kits/plot-book/ARCHITECTURE.md` — 4-layer + 3-move 원본 설계
- `components/wiki-editor/wiki-block-renderer.tsx` — 기존 Plot 위키 블록 편집 패턴 (재사용 대상)
- `components/editor/dnd/block-drag-overlay.tsx` — 드래그 인프라 재사용
- `components/book/book-inline-editor.tsx` — Phase 2B-2a에서 신규 (확장 대상)
- `components/book/shells/wiki-shell.tsx` — EditableParagraph 통합 (Phase 2B-2b)
