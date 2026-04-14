
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
