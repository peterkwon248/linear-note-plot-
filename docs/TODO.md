# Plot — TODO (2026-04-13)

## ✅ P0 — 노트 References + fontSize cascade — COMPLETE

## P1 — 위키 프리셋 + 기능 확장

- [ ] **위키 레이아웃 프리셋 통합** — Default(1172줄) + Encyclopedia(375줄) → 1개 설정 기반
- [ ] **Library FilterPanel Notes 수준** — view-engine 인프라 재사용

## P2 — 인사이트 + 고도화

- [ ] **인사이트 중앙 허브** — 온톨로지 사이드바 Insights 섹션
- [ ] **Reference Usage 섹션** — 사이드패널에 "이 Reference를 참조하는 노트/위키" 목록
- [ ] **인포박스 고도화** — 대표 이미지, 섹션 구분 행, 접기/펼치기

## P3 — 사이드패널 + 뷰 확장

- [ ] **사이드패널 리디자인** — Connections 인라인 프리뷰 (Obsidian식)
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, 북마크 커맨드
- [ ] **노트 전체 접기/펼치기 버튼** — 복잡한 노트에서 toggle/callout/TOC + footnotes/references 일괄 제어

---

## 최근 완료

- [x] **PR #188**: 노트 References 시스템 + fontSize cascade + 위키 텍스트 컴팩트
  - Note.referenceIds + Store v74 + addNoteReference/removeNoteReference
  - NoteReferencesFooter 전면 확장 (모달, +/×, 중복 제거)
  - /reference 슬래시 커맨드 + Insert 메뉴
  - 아이콘 Book (RiBookLine), 빈 상태 숨기기
  - 위키 fontSize em 전환 + fontScale wrapper 이동
  - 위키 텍스트 display ProseMirror min-height:unset + p margin:0
- [x] **PR #187**: 각주/Reference UX 개선
- [x] **PR #185**: 각주 모달 + WikiReferencesSection + footnote 티어
- [x] **PR #182-183**: 위키 각주 시스템 + 공유 유틸 + 호버 프리뷰 글로벌
- [x] **PR #181**: Library 리디자인 + Reference.history + Store v73
- [x] **PR #176-177**: Split-First 복귀 완성 + Calendar 리뉴얼
