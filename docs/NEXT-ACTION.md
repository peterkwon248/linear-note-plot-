# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.
> 항상 1~3개의 immediate next action만. 큰 그림은 docs/MEMORY.md.

---

**Last Updated**: 2026-04-10 저녁 (P2 각주 리치텍스트 + Reference 개선 직후)

## 🎯 다음 세션 시작하면 바로 할 것

### 1. **각주 Edit 버튼 동작 확인**

본문 `[1]` 호버 → 팝오버의 "Edit ✏️" 클릭 → Footer로 스크롤 + 편집 모드 자동 활성화.
이번 세션 마지막에 구현했는데 테스트 미완. `setTimeout(150ms)` 기반 — 타이밍 이슈 가능.

**파일**: `components/editor/nodes/footnote-node.tsx` (scrollToFooterAndEdit)
**확인**: 1) Edit 클릭 → Footer 스크롤 됨? 2) 해당 항목 자동 편집 모드?

### 2. **P2-2: 인포박스 고도화**

- 대표 이미지, 섹션 구분 행, 접기/펼치기
- 위키 인포박스에 이미지 + 구분 행 추가
- 브레인스토밍 필요 (나무위키/위키피디아 인포박스 레퍼런스)

### 3. **P2-3: 인사이트 허브**

- 온톨로지 Single Source of Insights
- Knowledge WAR, Link Density, Stub Conversion Rate 등

## 🧠 멘탈 상태 (잊지 말 것)

- **Store version: v76** (v72→v73 Peek 제거, v73→v74 secondaryPins, v74→v75 Reference.history, v75→v76 Reference.usedInNoteIds)
- **각주 편집 경로 통일**: 본문 팝오버 = 읽기 전용 (Edit 버튼 → Footer). Footer = 미니 TipTap + URL 전용 input. textarea 완전 제거.
- **FootnoteMiniEditor**: StarterKit inline only + Underline + Link. 툴바 없음 (나무위키 패턴 — Ctrl+B/I/U만). `immediatelyRender: false` 필수 (SSR).
- **URL 저장**: Footer URL input → Reference.fields에 url 키로 자동 sync. 기존 url 없으면 추가, 있으면 업데이트, 비우면 제거.
- **Rebuild links**: Reference Detail 패널 "Used In" 하단 "Rebuild links" 버튼 → IDB 전체 스캔 (note bodies + wiki block bodies).
- **Key 충돌 fix**: WikilinkSuggestion `${type}:${id}`, MentionSuggestion `${mentionType}:${id}`, Calendar `${noteType}:${id}`.

## ⚠️ 알려진 이슈

- **Edit 버튼 → Footer 편집 연동**: setTimeout(150ms) 기반. 느린 머신에서 타이밍 이슈 가능. autoEditId state flow도 있는데 두 메커니즘 중복 — 정리 필요.
- **각주 content JSON 포맷**: 기존 plain text와 새 TipTap JSON이 혼재. `parseContent()`/`getFootnotePlainText()`가 둘 다 처리하지만 점진적 마이그레이션 중.

## 🚧 보류 (P2, P3 — docs/TODO.md 참조)

- P2: 인포박스 고도화, 인사이트 허브
- P3: 사이드패널 리디자인, 동음이의어 해소, 커맨드 팔레트 확장
