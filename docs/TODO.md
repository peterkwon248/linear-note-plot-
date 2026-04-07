# Plot — TODO (2026-04-08)

## 이번 맥락에서 남은 것

- [ ] **Trash 뷰에 References/Files 표시** — 현재 Trash는 노트만 표시. trashed References/Files도 리스트 + 복원/영구삭제 버튼 필요. soft delete 인프라는 완료 (store v71)
- [ ] **Library Files 직접 업로드 UI** — Files 뷰에서 업로드 버튼 + 파일 선택 (현재 에디터 삽입으로만 가능)
- [ ] **Library Tags 동작 검증** — TagsView 이식 완료, CRUD 동작 확인 필요

## P1

- [ ] **editor-icons.ts 누락 export** — CaretRight, ArrowLineRight, ArrowLineLeft, ArrowUp, ArrowDown 등. Next.js dev "5 Issues" 원인. `components/editor/editor-context-menu.tsx`에서 import하는데 barrel에 없음

## P2

- [ ] **인사이트 중앙 허브** — 온톨로지 사이드바 Insights 섹션
- [ ] **Library FilterPanel 고도화** — Notes 수준 2단계 nested 필터 (view-engine 인프라 재사용)
- [ ] **각주 리치 텍스트** — plain text → 인라인 서식 + 위키링크 (미니 TipTap)

## P3

- [ ] **TOC 수동 앵커** — Floating TOC에서 수동 앵커 지원
- [ ] **Make Block** — 범용 블록 래퍼 + 드래그 핸들
- [ ] **커맨드 팔레트 확장** — 풀페이지 검색, J/K 네비게이션

## 완료 (이번 세션, 2026-04-08)

- [x] SmartLinkPaste 버그 수정 (view.hasFocus() 가드)
- [x] window.prompt 전면 폐기 (embed-url-request.ts CustomEvent 브릿지)
- [x] Library Overview 리디자인 (MiniStat + ContentCard)
- [x] Tags/Files 뷰 Coming soon → 실제 구현
- [x] Tags를 Library로 통합 (Notes "More"에서 제거)
- [x] 섹션 네이밍 "Recent"로 통일
- [x] References/Files soft delete (store v71)
- [x] Sidebar Tags/Files 활성화 + 카운트 뱃지
