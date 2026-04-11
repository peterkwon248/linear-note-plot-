# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-10 (Peek-First 실험 → Split-First 복귀, Phase 1 완료 직후)

## 🎯 다음 세션 시작하면 바로 할 것

### P1-4: 위키 레이아웃 프리셋 시스템

**배경**: Default와 Encyclopedia 2개의 별도 렌더러(wiki-article-view.tsx ~800줄, wiki-article-encyclopedia.tsx ~700줄)를 1개 설정 기반 렌더러로 통합.

**구체 작업:**
1. 프리셋 설정 객체 정의: `{ tocPosition, infobox, footer, sectionNumbers }`
2. `WikiArticleRenderer` 통합 컴포넌트 생성
3. 기존 2개 컴포넌트의 렌더링 로직을 설정 기반 조건부 렌더로 변환
4. `WikiArticle.layout` 타입 확장 가능하게

**참고 파일:**
- `components/wiki-editor/wiki-article-view.tsx` (~800줄)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (~700줄)
- `lib/types.ts` — WikiArticle.layout

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Phase 1 완료**: `SmartSidePanel`이 단일 인스턴스. `pane` prop 없음. global state. `useSidePanelEntity`가 `usePane()` → `activePane`을 따라감
- **Peek 탭은 이미 UI에서 제거됨** — 4탭 (Detail/Connections/Activity/Bookmarks)
- **`side-panel-connections.tsx`만 `useSidePanelEntity` 적용됨** — Detail/Activity/Bookmarks는 이전부터 이미 적용
- **side-panel-peek.tsx는 아직 살아있음** — smart-side-panel.tsx의 `showPeek` 블록 참조. Phase 3-1에서 해당 블록 제거 후 파일 삭제
- **`openSidePeek` 호출부 6곳 남음**: note-reference-actions, wikilink-context-menu, note-hover-preview, side-panel-connections, wiki-block-renderer, note-embed-node
- **Peek-First 자산 재활용 목록** (MEMORY.md 참조): StatusShapeIcon, MentionSuggestion 개선, peek-search, peek-suggestions, Tooltip fix, FixedToolbar variant
- **tsc는 현재 clean** — 이번 after-work 체크포인트는 안전한 복귀 지점

## ⚠️ 구현 전 주의사항

- **Phase 2 순서 중요**: types.ts 먼저 → ui.ts 슬라이스 → index.ts 초기값 → migrate.ts. tsc 연쇄 에러 하나씩 잡으면서 진행
- **`useSidePanelEntity`는 이미 PR #173에서 구현됨** — 재발명 금지. `components/side-panel/use-side-panel-entity.ts` 참조
- **Split view는 이미 layout.tsx에 존재** — `hasSplit`, `secondaryNoteId`, `hasViewSplit` 로직. Peek 위에 얹혀 있었을 뿐
- **오늘 작업 dead code 위험**: store 정리하면서 일부 오늘 추가한 wikilink 편집 관련 코드가 의미 없어질 수 있음. 보수적으로 판단

## 🚧 보류 (나중에)

- ✅ **Reference.history** — 수정 이력 타임라인 (2026-04-11 완료)
- ✅ **Library Overview 리디자인** — 위키 대시보드 스타일 (2026-04-11 완료)
- Library FilterPanel (Notes 수준으로 확장) — P2+로 보류
- `@` 멘션에 Reference 지원 (지금은 이미 있음 — 확인됨. 이 항목 폐기)
