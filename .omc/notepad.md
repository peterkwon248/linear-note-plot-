# Session Notepad (Updated: 2026-04-21 20:00)

## Critical Context

- **Book Pivot Phase 2B-3c + 2C Step 1-4 + 2B-3 확산 + 3A-1 전부 완료** (+803/-1229 lines, 16 files). Build PASS.
- **사용자 규칙 강조 (2회)**: "과거 PR 재사용 우선" — 이번에 `WikiTextEditor` / `WikiBlockRenderer` / `AddBlockButton` 전부 export해서 Book에서 재사용. 앞으로 기능 구현 전 **먼저 기존 코드 Grep export**
- **진실의 원천**: `docs/NEXT-ACTION.md` + `docs/BRAINSTORM-2026-04-21-book-pivot.md` + `docs/BRAINSTORM-2026-04-21-book-ux-refinement.md`

## 다음 세션 시작점 (next-action Step 1)

**WikiBlockRenderer fallback을 Magazine/Newspaper/Book/Blank에 확산**

- Wiki shell만 Infobox/TOC/Pull Quote/Image/URL/Table 실제 chrome 렌더 (fallback 추가됨)
- 나머지 4 shell은 여전히 `b.type === "h2" | "p"` 분기에서 "p" fallthrough
- 수정: 각 shell의 `realBody` 매핑에서 원본 type 보존 + wiki-shell.tsx 렌더 루프 끝 fallback 패턴 복사
- 참고 파일: `components/book/shells/wiki-shell.tsx` (완료 상태)

## Active Tasks (우선순위순)

1. WikiBlockRenderer fallback — 4 shell 확산
2. Phase 3A-2: 4 shell 드래그 reorder (Blank부터, Magazine/Book은 CSS 충돌 검증)
3. AddBlockButton `nearestSectionLevel` 전달 → Subsection 옵션
4. 상단 auto CONTENTS 중복 제거
5. Seed contentJson 파싱 (앱 전역, Notes도 영향)
6. Phase 3A 본 목표: 12-col grid snap

## Blockers

없음. 모든 기존 시작한 작업 완료.

## 재사용 포인트 (기억!)

- `wiki-block-renderer.tsx:89` → `WikiBlockRenderer` export
- `wiki-block-renderer.tsx:788` → `WikiTextEditor` export (이번 세션)
- `wiki-block-renderer.tsx:1854` → `AddBlockButton` export
- `hooks/use-wiki-block-actions.ts:24` → `handleAddBlock` 타입 dispatch
- `lib/wiki-block-utils.ts` → `computeSectionNumbers`, `getInitialContentJson`
- `components/view-header.tsx` → `ViewHeader` + `SplitViewButton`
- `components/book/shared-editable.tsx` (이번 세션 신규) → 5 shell 공유 helpers

## 사용자 피드백 (영구 규칙)

- 커밋 타이밍 = 사용자 제어 (`/after-work` 때만)
- 엔티티 통합 제안 금지 (Note/Wiki 분리 영구)
- "과거 PR의 기존 컴포넌트 재사용 우선" — 새로 구현하면 "허접" 평가 (이번 세션에 2회 지적받음)
