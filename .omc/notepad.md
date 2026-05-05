# Session Notepad (Updated: 2026-05-05)

## 🆕 Plot UI 진화 가이드 분석 (2026-05-05, 사용자 첨부 목업 20장)

**자료 위치**: `C:\Users\user\Desktop\플롯 UI 진화 가이드자료\` (KakaoTalk_*.png × 20)

**출처**: 사용자 ↔ ChatGPT 대화 + 목업 (ChatGPT가 100% 코드 미파악 상태에서 작성)

### 핵심 결론: 95% 적용 가능
> 기능 손실 0. Plot 4층 아키텍처(Data/View/Sidebar/Editor)는 단단함. 목업의 변화는 80% 표면 강화 + 20% 새 레이어 추가.

### 목업의 7가지 관통 패턴
1. 4-컬럼 레이아웃 (ActivityBar / Sidebar / Main / **Detail Panel 항상 우측**)
2. 사이드바 섹션: Status → Folders → Views → **Tags 인라인 색 dot** → More
3. Notes 테이블 압축 + 컬럼 chip(Type/Status/Folder/Tags/Updated)
4. Detail Panel 강화: Properties + Activity + **Connected Notes 미니 그래프 + 통계 차트**
5. View System (Display Modes): Table / Board / Calendar / **Timeline** / Graph
6. **Focus Modes**: Default / Focus(좌측 숨김) / Zen / Compact
7. Library 카드/그리드 강화

### 정정한 잘못된 단정 (사용자 지적 후)
- ❌ "Books = 스티커/세이브드뷰로 대체 가능" → ✅ **Books는 진짜 새 엔티티 (페이지 모음집/슬라이드 형식). 4-6주 작업, 보류 X**
- ❌ "emerald/orange가 Plot 색 정체성" → ✅ **이건 Status 한정 색. Plot 전체 색감 영구 결정 없음. 목업 색 자유 도입 가능**
- ❌ "이모지 Type 컬럼은 노트/위키 2-entity와 충돌" → ✅ **Label에 emoji 필드 추가 (방법 B)로 1-2일이면 가능**

### 적용 가능성 3-Tier 분류

#### 🟢 Tier 1 — 즉시 (2-3주, 5-8 PR)
- Notes 테이블 density 압축 (`isCompact` 확장)
- Status badge 색 강화 (라이트모드 가시성)
- Tag chip 인라인 (PropertyChipRow 활용)
- **사이드바 Tags 섹션 인라인 색 dot** (큰 효과)
- Detail Panel 통계/차트 미니 (Words/Reads/Activity sparkline — `noteEvents` 활용)
- Connected Notes 미니 그래프 (`backlinksIndex` 활용)
- Wiki TOC 좌측 목차 (TipTap heading 추출)
- **Label.emoji 추가** (방법 B)

#### 🟡 Tier 2 — 중간 (3-5주, 6-10 PR)
- Focus Mode 시스템 (Default / Focus / Zen / Compact 통합)
- Activity Bar 접기/펼치기
- Library 카드/그리드 강화
- Home 대시보드 강화 (위젯 시스템, 목업 5)
- DetailPanel 정보 카테고리 확장

#### 🔴 Tier 3 — 큰 작업 (별도 PRD)
- **Timeline View 신규** (`noteEvents` 데이터 → `ViewMode = "timeline"` 추가)
- 3-Layer Architecture (Data / View / Focus) — Focus Layer 도입
- **Books 엔티티 신규** (4-6주, 페이지 모음 + 슬라이드 뷰 + 표지 + 진도 추적)

### 권장 진행 순서
1. **현재 진행 중**: Group C PR-D (PR 1 머지, PR 2 검증 완료, PR 3-5 남음) + 미커밋 hotfix 8개
2. **다음**: Plot UI 진화 PRD 별도 작성 → Phase 1 시작
3. 한 번에 다 X. 2-4개월 단계별.

### Books 엔티티 진짜 설계 (보류 X)
- 데이터: `Book { id, title, cover, pageIds[], readingProgress }`
- UX: 페이지 추가/순서/제거 + 슬라이드 뷰 (한 페이지씩) + 책 전체 보기
- 표지: 이미지 업로드 또는 자동 생성
- 읽기 모드: 좌→우 페이지 넘김, 진도, 책갈피
- 표시: 사이드바 또는 라이브러리 안 새 섹션

### 솔직한 5% 한계 (목업 100% 따르지 않을 부분)
- 목업의 보라/파랑 강조 색 — Plot 정체성 보호 차원에서 선택적
- 이모지 Type 컬럼 — 라벨로 대체 (방법 B)

### 🆕 Type 컬럼 디스플레이 결정 (2026-05-05 사용자 확정)
- **A 선택**: 이모지 default + 토글 (Display Properties에 4-mode picker: Hidden / Icon only / Text only / Icon+Text)
- **권장**: Title만 큰 텍스트로 도드라지게 + 나머지(Type/Status/Folder)는 시각 마커
- **근거**: Linear/Plane/Reflect/Notion 검증된 패턴. Plot 정체성 "Gentle by default"

### 🚨 중요 — 사용자 직접 디자인 진행 중 (2026-05-05)
- **사용자가 아이콘 / 뱃지 / 로고 전부 새로 디자인 중**
- 완성되면 Plot 앱에 임포트 예정
- **함의**: 단순 `emoji?: string`이 아닌 **이중 구조 필요**
  ```ts
  icon?: {
    type: "emoji" | "custom"  // 이모지 or Plot 자체 아이콘
    value: string              // emoji string OR icon registry ID
  }
  ```
- import 워크플로우 (예상):
  1. SVG/PNG 완성
  2. `public/plot-icons/` 또는 `components/plot-icons.tsx` 등록
  3. 아이콘 레지스트리 매핑 (`PLOT_ICONS = { memo: <MemoIcon />, ... }`)
  4. Label 생성/편집 UI에 "이모지 / Plot 아이콘" 탭 분리
- **주의**: 사용자 디자인 완성 시점에 같이 작업 시작. 그 전까지 emoji 단일 필드만 prep 가능

---

# Session Notepad (Updated: 2026-05-04)

## Critical Context

### 영구 원칙
- **디자인**: "Gentle by default, powerful when needed"
- **작업**: "정확도 + 버그 위험 최소화" (10가지 — docs/MEMORY.md)

### 최근 세션 머지된 PRs
- **2026-05-03**: #237~#247 (오전+오후), #249~#254 (저녁) — Templates 시리즈 + Folder N:M PR (a)
- **2026-05-04 (오늘)**: #255 (folder-b UI), #256 (folder-c Multi-folder UX) — **Folder N:M 시리즈 완성**

### Store Version (현재 v107)
v100 → v107 (Sticker.members → Template icon/color drop → templates context 4단계 → seed 주입 → Folder kind+N:M)

## Active Tasks (다음 세션 우선순위)

### 🔴 즉시 (사용자 워크플로우 차단)
- [ ] **BUG**: 시드 템플릿 더블클릭 시 에러. 시드는 보이나 편집 안 됨. 콘솔 메시지 미수집. PR c~e 변경 추정. `template-edit-page.tsx` + `templates-table.tsx` row click 시점 디버깅.

### 🟡 큰 작업 후보
- [ ] **Group C PR-D** — Tags/Labels/Stickers/References/Files view-engine 통합 (5-8 PRs, planner 권장)
- [ ] **Wiki template 3-layer** (Layout Preset + Content Template + Typed Infobox)
- [ ] **Smart Book v2** — AutoSource[5] (folder/category/tag/label/sticker)
- [ ] **Template seed audit** — `PlotTemplate<T>` 추상화

### 🟣 마지막
- [ ] **Note UI toolbar** (UpNote-style) — Pin/Focus/Version 5-6 핵심 버튼

### 🟤 마지막에 논의 (보류)
- [ ] **House (계보 시각화)** — Claude 의견: 별도 entity 불필요, Graph view에 lineage mode + sidebar 단축 링크로 대체 가능. 다음 토론 시 결정.

### 🟢 작은 후속 정리
- [ ] Templates grid chip 시스템 완전 통일 (PR e deviation)
- [ ] NoteTemplate 타입에서 description/status/priority 필드 제거
- [ ] 키보드 shortcut (D/T/P) — 노트 + templates 통합
- [ ] Wiki bulk action bar (필요해지면)
- [ ] FolderPicker 검색 필터 (50+ 폴더 시점)

## Polished Decisions (Folder N:M 시리즈)
- **Folder type-strict + N:M**: 노트 폴더=노트만, 위키 폴더=위키만. 한 노트가 여러 폴더 가능.
- **혼합 폴더 자동 분리**: `{name}` (note) + `{name} (Wiki)` 두 폴더로 (마이그레이션 v107)
- **DnD modifier**: 일반 drop = Add (N:M 자연), Shift+drop = Move (single 시맨틱 보존)
- **MultiFolderMarker**: 다중 폴더 시 다른 폴더 카운트만 chip으로 (전체 chip은 카드 과밀)
- **FolderPicker**: 단일 컴포넌트 + 3가지 export로 4곳 chrome 차이 흡수
- **Templates folderId**: single 유지 (개수 적어 N:M 가치 낮음)

## Blockers
- 시드 템플릿 더블클릭 에러 (사용자 워크플로우 차단) — 다음 세션 즉시 fix

## Plans 보존
- `.omc/plans/folder-nm-migration.md` (PR a/b/c 모두 완료, 참고용)
- `.omc/plans/template-b-edit-ui-unification.md` (이전 PR b)
