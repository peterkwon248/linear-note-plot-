# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-13 (PR #188 완료 — 노트 References + fontSize cascade + 위키 텍스트 컴팩트)

## 🎯 다음 세션 시작하면 바로 할 것

### P1: 위키 레이아웃 프리셋 통합

**배경**: Default(1172줄)와 Encyclopedia(375줄) 2개의 별도 렌더러를 1개 설정 기반 렌더러로 통합.

**구체 작업:**
1. 프리셋 설정 객체 정의: `{ tocPosition, infobox, footer, sectionNumbers }`
2. `WikiArticleRenderer` 통합 컴포넌트 생성
3. 기존 2개 컴포넌트의 렌더링 로직을 설정 기반 조건부 렌더로 변환
4. 기존 wiki-article-view.tsx / wiki-article-encyclopedia.tsx 제거

**참고 파일:**
- `components/wiki-editor/wiki-article-view.tsx` (1172줄, Default)
- `components/wiki-editor/wiki-article-encyclopedia.tsx` (375줄, Encyclopedia)
- `components/wiki-editor/wiki-footnotes-section.tsx` (513줄, 공유)
- `lib/wiki-block-utils.ts` + `hooks/use-wiki-block-actions.ts` (공유 유틸)

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Store v74** — 22 slices. v74 = Note.referenceIds 추가
- **PR #188까지 완료** — 노트 References 시스템 + fontSize cascade + 위키 텍스트 컴팩트
- **tsc clean, build 성공** — 안전한 출발 지점
- **Footnotes/References = 분리 유지** — 합치지 않기로 확정 (PR #187에서 논의 후 번복)
- **불릿 Reference = note.referenceIds 메타데이터** — 에디터 노드 아님, `[[`/`@`에서 안 넣음
- **Reference 아이콘 = Book (RiBookLine)** — Bookmark/BookOpen/Article과 구분
- **em 기반 fontSize cascade 완료** — 글로벌 Aa + 개별 섹션 fontScale 둘 다 동작
- **위키 텍스트 블록 display 컴팩트** — ProseMirror min-height:unset + p margin:0

## ⚠️ 구현 전 주의사항

- Default(1172줄)가 Encyclopedia(375줄)보다 훨씬 큼
- 위키 각주/참고 시스템(PR #182-188)이 두 렌더러에 이미 통합되어 있음
- em 기반 폰트 클래스 전환 완료 — 통합 렌더러에서도 em 유지

## 🚧 보류 (나중에)

- Library FilterPanel — P1
- 노트 전체 접기/펼치기 버튼 — P3 (섹션 2개뿐이라 지금은 overkill)
- 인사이트 중앙 허브 — P2
- 인포박스 고도화 — P2
