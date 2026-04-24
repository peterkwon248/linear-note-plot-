---
session_date: "2026-04-24 15:00"
project: "linear-note-plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\practical-kepler-a53649"
duration_estimate: "~3h (prior continuation + this session)"
---

## Completed Work
- TOC gutter 번호 계층 시각화 최종 결정: 세로선 완전 제거, 번호만 유지 (`components/editor/EditorStyles.css`)
- 웹 리서치로 업계 표준 확인 (Notion/Craft/Obsidian/Bear/Wikipedia — 연결선 없음이 표준)
- docs/MEMORY.md 세션 기록 추가

## In Progress
- (prior session) 북마크 확장: `GlobalBookmark` anchorType에 'block' 추가 + scrollIntoView 확장 — store 변경 상태로 대기

## Remaining Tasks
- [ ] Wiki 블록 인라인 💬 + 📌 아이콘 + 팝오버 UI (`components/comments/` 이미 작성, 렌더 검증 필요)
- [ ] 노트 블록 메뉴(BlockMenu)에 Comment + Bookmark 항목 추가
- [ ] Activity 탭 3섹션 리팩터 (Threads / Comments / History)
- [ ] 섹션 ... 메뉴에 Add comment + Bookmark 연동 (wiki)
- [ ] Preview로 comments/bookmarks end-to-end 검증

## Key Decisions
- **TOC 세로선 전면 제거**: 4-5차례 디자인 시도(실선/점선/페이드/원+선) 전부 "별로" → 리서치 결과 업계 표준은 "선 없음" → 폰트+들여쓰기만으로 계층 표현. Notion/Craft/Bear/나무위키/위키피디아 모두 이 방식.
- **번호 opacity 0.4 롤백 → 0.9 유지**: 희미하면 가독성 저하.
- **contentBlock Enter 버그 포기**: `splitBlock` 기본 depth=2 동작 때문에 래퍼 탈출. 커스텀 핸들러 + priority 1000 + 수동 `tr.split(pos, depth-cbDepth)` 전부 효과 없음. 사용자 판단으로 종결.

## Technical Learnings
- **ProseMirror splitBlock**: `$from.depth === 0 ? 1 : 2` — 항상 2단계 쪼개기 때문에 defining wrapper가 paragraph의 부모라도 같이 split됨. `defining: true` 만으론 안쪽 split 보장 안 됨.
- **업계 계층 표현 패턴**: Obsidian Lapel = gutter 텍스트 레이블(H1/H2/H3), CSS counter로 auto-numbering 가능 (TipTap GitHub Discussion #914), Logseq bullet threading은 `:has()` 셀렉터 필요해서 퍼포먼스 이슈.

## Blockers / Issues
- **contentBlock Enter**: 안에서 Enter로 블록 확장 불가. 포기. 향후 필요 시 ProseMirror 커스텀 command로 `tr.split`을 더 정교하게 제어하거나 `isolating: true` 실험 필요.

## Environment & Config
- Branch: `claude/practical-kepler-a53649`
- Dev server: http://localhost:1588 (running)
- Build: npm run build 통과 (Next.js 16)
- Store version: v75 → v76 (comments slice 추가 중)

## Notes for Next Session
- `components/comments/comment-popover.tsx` 이미 작성됨 — 실제 노트/위키 렌더 검증 필요
- `components/wiki-editor/navbox-block.tsx`, `navigation-block.tsx`, `category-tree-picker.tsx` 신규 — 사용처 연결 확인
- `lib/store/slices/comments.ts` 신규 — v76 migration 확인
- `components/editor/nodes/toc-node.tsx` — 대규모 변경(+400 lines), 동작 검증
- `components/wiki-editor/wiki-article-view.tsx` -400 lines — encyclopedia view 재구조화, 리그레션 체크

## Files Modified
- `components/editor/EditorStyles.css` — TOC 세로선 제거
- `components/editor/nodes/content-block-node.tsx` — Enter 핸들러 시도 후 롤백
- `components/editor/nodes/toc-node.tsx` — (prior) TOC 대규모 변경
- `components/editor/editor-context-menu.tsx` — (prior) Add to TOC
- `components/editor/nodes/infobox-node.tsx`, `wiki-infobox.tsx` — (prior)
- `components/wiki-editor/wiki-article-view.tsx`, `wiki-article-encyclopedia.tsx`, `wiki-block-renderer.tsx` — (prior)
- `components/editor/dnd/block-drag-overlay.tsx` — (prior)
- `lib/store/index.ts`, `migrate.ts`, `types.ts`, `lib/types.ts` — comments + GlobalBookmark
- `hooks/use-wiki-block-actions.ts` — (prior)
- 신규: `components/comments/`, `lib/store/slices/comments.ts`, `components/wiki-editor/{navbox,navigation,category-tree-picker}.tsx`
- `docs/MEMORY.md` — 세션 기록
