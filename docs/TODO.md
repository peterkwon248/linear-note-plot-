# Plot — TODO (2026-04-27, PR #218 + 이번 세션 반영)

> CONTEXT.md(2026-04-26)가 source of truth. 이번 세션에서 group-header / attachment / 시계열 메트릭 완료.

## 🚀 출시 모드 (방향 논의 진행 중)

**사용자 의향**: Google Play Store + 마케팅 웹사이트 출시

### 결정 대기 (다음 세션 첫 액션)
- [ ] 모바일 전략: **PWA → TWA** OK?
- [ ] 출시 전 부족분 우선순위 (온톨로지 / 캘린더 / 템플릿 중)
- [ ] 웹사이트 옵션 (별도 Next.js + Vercel 추천) + 도메인
- [ ] 타임라인 (1개월 / 3개월 / 자유?)

### 결정 후 작업 후보 (제안 순서)
1. [ ] 모바일 반응형 감사 — 깨지는 페이지 매핑
2. [ ] 노트 템플릿 시드 10~20개 (가장 ROI 높음)
3. [ ] PWA manifest + Service Worker
4. [ ] 온톨로지 메트릭 설명 툴팁 + 액션 nudge 강화
5. [ ] 캘린더 현황 점검 + 부족분 구현
6. [ ] 마케팅 사이트 셋업 (별도 워크트리)
7. [ ] Privacy Policy 초안
8. [ ] 스토어 자산 + Bubblewrap TWA 빌드

---

## ✅ 2026-04-27 세션 완료

- [x] Doc sync (SESSION-LOG / NEXT-ACTION / TODO 정합성)
- [x] InfoboxBlockNode group-header 지원
- [x] Attachment drag-drop (FileHandler onDrop/onPaste)
- [x] 시계열 메트릭 + Wiki Dashboard 통합 (`computeWikiTimeSeries` + WikiGrowthChart)

---

## 🟡 P2 — 미루는 작업 (출시 결정 후 다시 검토)

- **노트 Split 검증** — `note-split-page.tsx` 만들어졌으나 실제 동작 검증 필요 (PR #218에서 신규 생성)
- **인포박스 base 티어 통합** — `WikiInfobox` → `InfoboxBlockNode` 단일화 (중장기)
- **Connections 상세** — 블록/코멘트 단위 어느 위치에서 링크되는지 (사용자가 7시간 작업으로 미룸 — 2026-04-25)
- **Red Link 선택 팝업 UX** — 클릭 → 노트/위키 분기 모달

---

## 🔵 P3 — 사이드패널 + 뷰 확장
- Connections 인라인 프리뷰 (Obsidian식)
- 동음이의어 해소 페이지
- 커맨드 팔레트 확장 (풀페이지 검색, 북마크 커맨드)

## 🟣 P4 — 지능 + 검색
- 풀페이지 검색 분리, 웹 클리퍼, 가져오기/내보내기, View v2, 리스트 가상화

---

## 🚫 폐기됨 (영구)

### 2026-04-27 폐기
- **Wiki Y.Doc 적용** — WikiBlock 배열 구조라 Note Y.Doc 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음. 안 해도 안전
- **AI provider 연결** — CLAUDE.md "LLM 없이 규칙/통계/그래프" 정체성 위반. `lib/ai/index.ts` placeholder 유지

### 2026-04-22 폐기 (Hard reset to PR #194)
- Book Pivot 5 shell (#211-213)
- Page Identity Tier (#209)
- 메타→블록 통합 (#208)
- 컬럼 시스템 (#198-#205)
- WikiTemplate 8 built-in (#197)

→ 이후 PR #215~218에서 일부는 다른 형태로 재구현 (Tier 2-4, 인포박스 11 프리셋, Navbox 풀 디자인). 컬럼/Book Pivot은 영구 폐기.

---

## 🧊 당분간 안 하는 것 (자기만족 리스크)

- **위키 시각적 다양화** — 추가 레이아웃 프리셋, 5 shell 등
- **나무위키 Top 7 나머지** — Hatnote / Ambox / 편집 히스토리
- **Wiki Y.Doc + 협업 모드** — 로컬 앱이라 우선순위 낮음

---

## 📚 참조

- `docs/CONTEXT.md` — 현재 상태 + 설계 결정 (PR #218 반영)
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처
- `docs/SESSION-LOG.md` — 시간순 세션 기록
- `docs/NEXT-ACTION.md` — 다음 즉시 액션
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
