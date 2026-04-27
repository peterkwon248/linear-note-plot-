# 🎯 Next Action

> **이 파일은 before-work가 가장 먼저 읽고, after-work가 마지막에 갱신한다.**
> 다음 세션 시작 시 "지금 바로 뭐 해야 하지?"의 답.

---

**Last Updated**: 2026-04-27 — Doc sync + group-header + attachment drag-drop + 시계열 메트릭 (4건) + Play Store 출시 방향 논의 (결정 대기)

---

## 🎯 다음 세션 즉시 시작 — 사용자 결정 4개부터

이전 세션에서 Plot 앱을 **Google Play Store + 마케팅 웹사이트**로 출시하려는 큰 방향이 떠올랐다. 결정 안 받고 코드 X.

### 받아야 할 결정
1. **모바일 전략**: PWA → TWA(Trusted Web Activity) OK? Capacitor / RN 재작성 X 추천
2. **출시 전 우선순위 (사용자 지적 부족 영역)**:
   - 온톨로지 — 메트릭 설명 / 액션 nudge / 시각화 중 어디?
   - 캘린더 — 현황 점검 + 부족분 구현
   - 노트/위키 템플릿 — 노트 시드 템플릿 10~20개 (가장 ROI 높을 듯)
3. **웹사이트**: 별도 Next.js (`plot-website` 워크트리) + Vercel 추천. 도메인 후보 결정
4. **타임라인**: 출시 목표 시점

→ 위 4개 결정 받기 전 어떤 코드도 시작 X. 사용자 영구 규칙 "큰 방향 전환 전 전체 설계 확정" 준수.

### 결정 후 가능한 작업 순서 (제안)
1. **모바일 반응형 감사** — 어느 페이지가 모바일에서 깨지는지 매핑 (조용히 시작 가능)
2. **노트 템플릿 시드 10개 추가** — 가장 ROI 높음, 코드 변경 작음
3. **PWA manifest + Service Worker** — TWA 등록 전제
4. **온톨로지 액션 nudge 강화** — 메트릭 설명 툴팁
5. **캘린더 현황 점검 + 부족분**
6. **마케팅 사이트 셋업** — 별도 워크트리
7. **Privacy Policy 초안** — TWA 제출 필수
8. **스토어 자산 + Bubblewrap 빌드**

---

## ✅ 2026-04-27 세션 완료 작업

### 코드 변경
1. **Doc sync** — SESSION-LOG/NEXT-ACTION/TODO를 PR #218 시점으로 정합성 회복 + Wiki Y.Doc/AI provider 영구 폐기 결정 반영
2. **InfoboxBlockNode group-header 지원** — 노트 인포박스에 "group-header" row 타입 + collapse + color picker (8 프리셋 + custom hex) + "Add group" 버튼. 위키 인포박스와 일관성 회복. `lib/types.ts:27` `WikiInfoboxEntry.type` 정의 활용
3. **Attachment drag-drop 연결** — `shared-editor-config.ts` FileHandler onDrop/onPaste 구현. 이미지 → image 노드, 파일 → download 링크 자동 삽입. `EditorConfigOptions.noteId` 추가, TipTapEditor에서 전달. E2E 검증 완료 (paste 2개 → attachments slice +2)
4. **시계열 메트릭 + Wiki Dashboard 통합** — `lib/insights/timeseries.ts` (`computeWikiTimeSeries`, day/week/month 버킷), `components/wiki-editor/wiki-growth-chart.tsx` (recharts AreaChart + BarChart, ResizeObserver 패턴), `wiki-dashboard.tsx`에 통합. **Preview headless 환경에서는 viewport=0이라 차트 렌더 검증 못 함 — 실제 브라우저 직접 확인 필요**

### 폐기 확정
- **Wiki Y.Doc 적용** — WikiBlock 배열 구조라 Note Y.Doc 패턴 직접 적용 불가. 블록 단위라 race 표면적 작음. 안 해도 안전. CONTEXT.md "위험" 표기가 자연스러운 신호였음
- **AI provider 연결** — CLAUDE.md "LLM 없이 규칙/통계/그래프" 정체성 위반. `lib/ai/index.ts`는 placeholder 유지

---

## 🟢 잊지 말 것

### Plot 코어 정체성
- Plot = 노트 + 위키 + **지식 관계망** (팔란티어 × 제텔카스텐)
- LLM 없이 **규칙/통계/그래프 알고리즘**
- 시각적 다양성 ≠ Plot 코어
- "멋진 레이아웃 / 시각적 다양성" 방향 제안 금지 (2026-04-22 자각 유지)

### 영구 규칙 (2026-04-22 도돌이표 자각에서 도출)
- 큰 방향 전환 전 전체 설계 확정
- Phase 쪼개기 전에 "진짜 이 방향이 맞나?" 자문
- "유연한 템플릿", "시각적 다양성" 방향 제안 금지
- 기능 제안 전 "Plot 코어에 부합하나?" 자문

### 출시 방향 핵심 사실
- Plot은 100% 클라이언트 (서버 없음, LLM 없음) → PWA/TWA에 매우 적합
- Recharts 2.15 이미 설치됨 (시계열 차트 활용 가능)
- 모바일 hover UI는 fix 필요 (현재 hover-only 메뉴 많음)

---

## 🟡 알려진 이슈 (pre-existing, 기능 영향 없음)

- TipTap duplicate extension warnings (link/underline/gapCursor)
- Hydration mismatch (Radix UI aria-controls ID, suppressHydrationWarning으로 가림)
- ResponsiveContainer (recharts) — React 19/Next 16 환경에서 width 0 발생 → ResizeObserver 패턴으로 우회 (이번 세션 fix)

---

## 📚 필수 참고
- `docs/CONTEXT.md` — Source of truth (PR #218 + 이번 세션 반영)
- `docs/MEMORY.md` — 전체 PR 히스토리 + 아키텍처
- `docs/TODO.md` — 우선순위 (P0/P1/P2/P3)
- `docs/DESIGN-TOKENS.md` — 디자인 토큰
