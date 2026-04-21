
## 2026-04-14 — 알려진 이슈

**빌드 실패 (pre-existing, PR #192 때부터)**
- `components/editor/block-registry/registry.ts:63` — `RemixiconComponentType`가 `BlockIcon`에 assignable X
- 20건 반복 (같은 패턴, heading 1/2/3, list, quote, callout, divider 등)
- Turbopack build 실패, webpack dev는 pass
- 해결 방법: `icon: TextHOne as BlockIcon` cast 추가 or `BlockIcon` 타입 정의 확장 (types.ts)
- build-fixer 에이전트 위임 가능 (minimal diff)

**Hydration mismatch (기존 이슈)**
- AppLayout 트리에서 hydration mismatch 경고
- 기능에 영향 없음, runtime warning 수준
- React 19 strict mode 특성 or 서버/클라이언트 불일치

**`WikiInfobox.setWikiInfobox` 호출 버그 (BRAINSTORM 선행 0.1)**
- `components/editor/wiki-infobox.tsx:17` `setWikiInfobox`(Note slice) 호출
- Encyclopedia 레이아웃에서 WikiArticle ID를 Note ID로 잘못 전달 가능성
- 저장 실패 가능. 수정 필요 (다음 세션)

## 2026-04-21 후반 — 알려진 이슈

**상단 auto CONTENTS와 TOC block 중복 표시**
- `components/book/shells/wiki-shell.tsx` 의 hardcoded `realToc` (최상단 CONTENTS 패널) + 실제 TOC block 동시에 존재하면 같은 섹션 목록이 2곳 보임
- 기능 영향 없음, 시각적 중복만
- 해결: TOC block 있을 때 auto CONTENTS 숨기기 or 아예 제거

**Seed contentJson null (앱 전역)**
- `[[wiki:Plot]]` `@mention` `#tag` 같은 마크업이 Book + Notes 전역에서 plain text로 렌더됨
- seed 데이터에 contentJson 없이 plaintext content만 저장
- Notes의 Welcome to Plot 노트도 `# Welcome to Plot` raw markdown 보임 (같은 증상)
- 해결: seed 로드 시점에 plaintext → TipTap nodes 변환 helper 필요 (또는 seed 자체에 contentJson 포함)

**Magazine CSS columns + dnd-kit transform 미검증**
- `columnCount: 2/3` 안에서 dnd-kit의 absolute `transform` 동작 테스트 안 함
- Phase 3A-2로 분리, 검증 후 적용
