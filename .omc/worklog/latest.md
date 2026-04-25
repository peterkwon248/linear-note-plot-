---
session_date: "2026-04-25"
project: "linear-note-plot"
working_directory: "C:\\Users\\user\\Desktop\\linear-note-plot-\\.claude\\worktrees\\practical-kepler-a53649"
duration_estimate: "긴 세션 — 18 커밋, 코멘트 시스템 대규모"
---

## Completed Work

### Comment 시스템 전체 구축 (Phase 1-3)
- 데이터 모델: status (Backlog/Todo/Done/Blocker) + parentId + CommentAnchor 4종
- Store v77/v78/v79 마이그레이션
- `CommentPopover` (인라인) + `CommentsByEntity` (사이드패널) + `CommentEditor` (TipTap 라이트 tier)
- `BlockCommentMarker` (항상 보이는 말풍선 + status dot + count)
- Open/Resolved 필터 탭 + Status 칩 + 인라인 편집 + 1단계 답글 + Convert to Note
- 포털 기반 StatusPicker (z-index 충돌 해결)
- ⋯ 메뉴 (Reply primary, Convert/Delete inside)

### 노트/위키 대칭 인라인 코멘트
- 위키 모든 블록 8종 (section/text/note-ref/image/url/table/navbox/navigation)에 [💬][🔖][⋯] cluster
- `NoteCommentMarkerLayer`: ProseMirror 블록 위 absolute overlay (BlockDragOverlay 패턴)
- 블록 cluster overflow-hidden 잘림 버그 수정

### 사이드패널 통합
- Activity: Thread/Reflection → CommentsByEntity 흡수 (`reflections.ts` slice 삭제)
- Bookmarks: targetKind ("note"|"wiki") + Filter chips + Search input + SECTIONS 제거
- Connections: 위키에 incoming wikilink 추가
- Pin → Bookmark 네이밍 통일 (BookmarkSimple)

### Navbox 하이브리드
- Auto/Manual 모드 토글 (Wiki 리서치: 100% 수동이 표준 → Plot 둘 다 지원)
- WikiPickerDialog 활용한 manual mode

### TOC entry 코멘트 배지
- `useCommentStatusByBlockId` 훅
- TOC 항목에 status dot + 갯수

### 미니맵 (Option F + G — Document-level 드롭다운)
- Phosphor 아이콘 통일 (이모지 전부 제거)
- 블록 타입별 컬러 stripe (note-ref=blue, image=emerald, url=cyan 등)
- 섹션 번호 badge (1, 1.1, 1.2 형식 — H 아이콘 대체)
- 본문 article 섹션 번호와 일치

### 활동 바 + nav fix
- Activity Bar Wiki 아이콘 BookOpen으로 변경 (Notes와 시각 구분)
- 북마크 클릭 nav 수정: setActiveRoute + navigateToWikiArticle + 8회 retry scroll

### 코멘트 컴포저 디자인 폴리시 (사이클 많음)
- TipTap 풀 에디터 시도 → 사용자 피드백으로 라이트로 롤백
- 폭 720→560→480→560 시행착오
- min-w-0 fix (flex item 폭 제어)
- 결론: "코멘트는 가벼운 메모" — 툴바 없이 마크다운 단축키만

## In Progress
- 없음 (이번 세션 클린)

## Remaining Tasks
- [ ] 미니맵 G 진화 — 좌측/우측 영역 항상 보이는 미니맵 (별도 세션)
- [ ] Connections 상세 (어느 블록/코멘트에서 링크되는지 — 7시간 작업)
- [ ] TipTap 미니 에디터 추가 발전 (필요시)

## Key Decisions
- **Comment 본질 = 가벼운 메모**: 풀 에디터 툴바 X. 라이트 TipTap tier (마크다운 + 위키링크 + 해시태그)
- **노트/위키 대칭 (B 옵션)**: 모든 블록에서 인라인 코멘트 가능
- **Linear 스타일 status**: Backlog/Todo/Done/Blocker
- **Pin = Bookmark 통일**: 시각 + 네이밍 (BookmarkSimple 아이콘)
- **Navbox 하이브리드**: 자동(편의) + 수동(Wiki 표준) 둘 다
- **미니맵 디자인**: F (코드 아이콘 일관) + G (시각 구조) 조합
- **섹션 번호**: H 아이콘 → accent 번호 badge (본문 article과 일치)

## Technical Learnings
- **min-w-0 + flex-1**: flex item이 contents 따라 부모를 확장하는 문제 해결 키. 특히 popover 내부에서 toolbar overflow 잘림 원인이었음
- **Radix Popover overflow**: 기본 visible. `overflow-hidden` 명시 필요
- **글로벌 scrollbar-color: transparent**: globals.css가 scrollbar 색을 투명으로 깔았음. 명시적 색깔 필요한 경우 별도 클래스
- **FixedToolbar.embedded prop**: 자체 sticky/overflow 비활성화 → 외곽 wrapper로 스크롤 위임
- **Wiki Navbox 표준**: Wikipedia/나무위키 모두 100% 수동 큐레이션. 자동은 비표준 (Plot은 둘 다 지원)
- **Comment popover 박스 사이즈**: 사용자 피드백으로 720→480→560으로 변동. 결국 "툴바 없이 라이트"가 best fit
- **섹션 번호 매기기 알고리즘**: depth별 counters[] 배열 + lastSectionDepth 추적

## Blockers / Issues
- 없음. 모든 사이클 깔끔히 마무리.

## Environment & Config
- Node 20+, Next.js 16, TypeScript, Zustand 5, TipTap 3, Tailwind v4
- Branch: `claude/practical-kepler-a53649`
- Store: 22 slices, **v80** (이전 v76)
- Build: `npm run build` (이번 세션 통과)

## Notes for Next Session
- **위키에서 코멘트 시스템 검증** — 인라인 marker 클릭 / 사이드바 Activity → Comments / 답글 / Convert to Note 등 전체 플로우
- **노트에서도 인라인 코멘트 검증** — NoteCommentMarkerLayer 작동 확인
- **북마크 통합 검증** — note + wiki 핀이 한 곳에 표시
- **Navbox** — Auto/Manual 토글 검증
- **미니맵** — 섹션 번호 + 컬러 stripe 시각 효과 검증
- **다음 큰 작업 후보**: Connections 상세 추적 (7시간), 미니맵 G 진화, TipTap 미니 에디터 추가 기능

## Files Modified
- 신규: `components/comments/comment-popover.tsx`, `comments-by-entity.tsx`, `comment-editor.tsx`, `block-comment-marker.tsx`, `use-block-comment-status.ts`
- 신규: `components/wiki-editor/wiki-block-inline-actions.tsx`, `navbox-block.tsx`, `navigation-block.tsx`, `category-tree-picker.tsx`
- 신규: `components/editor/note-comment-marker-layer.tsx`
- 신규: `lib/store/slices/comments.ts`
- 수정: `lib/types.ts` (CommentAnchor + Comment), `lib/store/index.ts` (v80), `lib/store/migrate.ts` (v77-80), `lib/store/types.ts`
- 수정: 위키 모든 블록 컴포넌트 (cluster + articleId 전달)
- 수정: `components/side-panel/side-panel-bookmarks.tsx`, `side-panel-connections.tsx`, `side-panel-activity.tsx`
- 수정: `components/editor/FixedToolbar.tsx` (embedded prop)
- 수정: `components/activity-bar.tsx` (Wiki icon BookOpen)
- 수정: `components/editor/nodes/toc-node.tsx` (TocCommentBadge)
- 삭제: `components/editor/reflection-panel.tsx`, `thread-panel.tsx`, `lib/store/slices/reflections.ts`
- 문서: `docs/MEMORY.md`, `docs/CONTEXT.md` 갱신
