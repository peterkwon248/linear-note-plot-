# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/TODO.md.

---

**Last Updated**: 2026-04-09 저녁 (회사)

## 🎯 다음 세션 시작하면 바로 할 것

### Phase 2: Peek가 Wiki 표시 가능하게 만들기

**파일**: `components/side-panel/side-panel-peek.tsx`

**첫 스텝:**
1. `peekContext` 타입을 `{ type: "note" | "wiki", id }`로 확장 (현재 noteId 단일 필드)
2. `WikiArticleView`를 좁은 폭 모드로 임베드 (좁아도 인포박스 + 섹션 잘 보이게)
3. `openSidePeek` 액션을 `openSidePeek({ type, id })`로 변경
4. wiki sources 클릭 시 `openSidePeek({ type: "wiki", id })` 호출 가능하게

**테스트:**
- 위키링크 우클릭 → "Open in Peek"
- 위키 article이 좁은 사이드패널에 잘 표시되는지

---

## 🧠 멘탈 상태 (잊지 말 것)

- **Phase 0+1 완료**: 사이드바 단일 책임 = layout.tsx
- WorkspaceEditorArea는 [Editor]/[Editor]|[Editor]만 책임 (사이드바 코드 0줄)
- Outline 개선 완료: TOC 블록 우선 + 헤딩 fallback
- 크로스노트 북마크 5 Phase 완료 (PR 미생성, 이번 세션 마지막에 한꺼번에)

## ⚠️ Peek-First 마이그레이션 큰 결정사항

- **Split View → Peek로 흡수** (Phase 2~5에 걸쳐 진행)
- Peek 지원: **Note + Wiki만**, Calendar/Ontology 제외
- Library 단일 Reference는 사이드패널 Detail로 충분
- **호버 프리뷰는 유지** (Peek와 별개 개념: 호버=일시적, Peek=지속)
- 사이즈 시스템: Min(280px) / Mid(480px) / Max(50%) + Drag

## 📋 Phase 진행 상황

- [x] Phase 0: 멀티 패널 사이드바 버그 fix
- [x] Phase 1: layout.tsx 단일 책임 정리
- [ ] **Phase 2: Peek가 Wiki 지원 ← 다음**
- [ ] Phase 3: 사이즈 시스템 (Min/Mid/Max)
- [ ] Phase 4: Peek 독립 네비게이션 (history)
- [ ] Phase 5: Split View 폐기

## 🚧 보류 (나중에)

- **Reference.history** — 데이터 모델 + UI 작업 중이었음. Peek 마이그레이션 후 복귀
- Library Bento Grid 리디자인
- Library FilterPanel
