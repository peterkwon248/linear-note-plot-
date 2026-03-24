---
name: linear-design-mirror
description: "Linear 앱의 디자인 레이아웃, UI/UX, 인터랙션 패턴을 체계적으로 분석하고 Plot 앱에 적용하는 스킬. 두 가지 모드로 동작한다: (1) Analyze — 스크린샷, DevTools 캡처, URL을 받아 구조화된 디자인 패턴을 추출, (2) Apply — 축적된 패턴 지식을 참조해 구현 가이드를 생성. 트리거: 'Linear처럼', 'Linear 스타일로', 'Linear 참고해서', '이 스크린샷 분석해줘', '디자인 패턴 뽑아줘', 사이드바/리스트/커맨드팔레트/인박스 등 UI 표면 작업 시, 또는 Plot의 디자인 의사결정이 필요할 때. design-quality-gate와 함께 사용: 이 스킬이 '이렇게 해야 한다'를 정의하면, design-quality-gate가 '이대로 했는지' 검증한다."
---

# Linear Design Mirror

Linear의 디자인을 연구하고 Plot에 적용하기 위한 스킬.

## 핵심 디자인 원칙 (Layer 1 요약)

Linear의 디자인 철학을 관통하는 7가지 원칙. 모든 구현 판단의 기준이 된다.

### 1. 주의를 벌지 않은 것은 주의를 요구하지 마라
> "Don't compete for attention you haven't earned"

사이드바, 탭바, 보조 UI는 메인 콘텐츠보다 시각적으로 후퇴해야 한다. 2026.03 리프레시에서 사이드바를 더 어둡게 만든 이유: 사용자가 목적지에 도착하면 네비게이션은 배경으로 물러나야 한다.

### 2. 구조는 느껴져야지 보여서는 안 된다
> "Structure should be felt, not seen"

border와 separator를 최소화. 구분은 spacing과 subtle opacity 차이로 표현. 2026 리프레시에서 경계선을 둥글게 만들고 대비를 낮춤.

### 3. 모든 액션에 4가지 접근 경로
버튼, 키보드 단축키, 컨텍스트 메뉴, 커맨드 팔레트(⌘K). 같은 패턴을 반복해 muscle memory를 형성. 예: 라벨 추가 → L키 / 우클릭→라벨 / ⌘K→"label" / 속성 패널 클릭.

### 4. opacity로 계층, spacing으로 구분
색상이 아닌 투명도로 텍스트/아이콘 중요도를 표현 (0.35→보조 ~ 0.93→활성). 요소 간 구분은 border가 아닌 gap으로. 이것이 정보 밀도를 유지하면서 깔끔함을 만드는 핵심.

### 5. LCH 색공간 기반, 따뜻한 뉴트럴
HSL 대신 LCH (perceptually uniform). 2024 리디자인에서 차가운 블루 계열 → 따뜻한 그레이로 전환. 너무 따뜻하면 탁해 보이므로 미세 조정 필요. 커스텀 테마 JSON 구조: `{base, accent, contrast, sidebar: {base, accent, contrast}}`.

### 6. 속도는 가장 중요한 기능
모든 인터랙션 100ms 이내. 키보드 퍼스트 디자인. 오프라인 지원 + 실시간 싱크. 느린 AI 기능도 반응성 있게 느끼도록 디자인 (로딩 상태, 추론 과정 표시).

### 7. 직관과 크래프트 > 데이터와 A/B 테스트
"Does this feel right?"를 묻는다. Quality Wednesdays: 매주 수요일 각자 작은 품질 결함을 찾아 수정. MVP는 내부 전용, 반쯤 만든 경험은 출시하지 않음.

---

## 패턴 인덱스 (라우팅 가이드)

작업 내용에 따라 어떤 reference 파일을 읽을지 안내한다.

| 작업 | 참조 파일 |
|------|----------|
| 디자인 의사결정이 필요할 때 | `references/design-philosophy.md` |
| 키보드/커맨드/인터랙션 설계 | `references/interaction-patterns.md` |
| CSS 값, 토큰, 색상 스펙 | `references/implementation-specs.md` |
| 색상 시스템/테마 설계 | `references/color-system.md` |
| 사이드바 구현/수정 | `references/surfaces/sidebar.md` |
| 이슈 리스트 뷰 | `references/surfaces/issue-list.md` |
| 커맨드 팔레트 (⌘K) | `references/surfaces/command-palette.md` |
| 이슈 상세 / 에디터 | `references/surfaces/issue-detail.md` |
| 인박스 / 트리아지 | `references/surfaces/inbox-triage.md` |
| 컨텍스트 메뉴 | `references/surfaces/context-menu.md` |
| 빈 상태 / 온보딩 | `references/surfaces/empty-states.md` |
| 참고 URL 전체 목록 | `references/sources.md` |

---

## 모드 1: Analyze (새 패턴 분석)

스크린샷, DevTools 캡처, 또는 URL을 받았을 때 사용.

### 분석 워크플로우

1. **입력 식별**: 스크린샷인지, DevTools 캡처인지, URL인지 파악
2. **화면 매핑**: 어떤 UI 표면인지 식별 (사이드바, 리스트, 모달 등)
3. **패턴 추출**: `references/analysis-framework.md`의 템플릿에 따라 분석
4. **기존 지식과 대조**: 해당 surface 파일이 있으면 읽고 비교
5. **출력 생성**: 2-레이어 포맷으로 결과 제공

### 2-레이어 출력 포맷

**Layer 1: 디자인 의사결정 가이드** (경훈용)
```
## 패턴: [이름]
### 핵심 디자인 결정
- 왜 이렇게 만들었는가 (Linear의 원칙과 연결)
- 대안 대비 장점
- Plot에 적용 시 고려사항
```

**Layer 2: 구현 스펙** (Claude Code용)
```
## 구현 스펙: [이름]
### CSS/Tailwind 값
- 배경: [정확한 값]
- 텍스트: [정확한 값]  
- 간격: [정확한 값]
### 컴포넌트 구조
- [React 컴포넌트 구조 스케치]
### 상태별 스타일
- 기본/호버/활성/비활성
```

---

## 모드 2: Apply (기존 패턴으로 구현)

"Linear처럼 만들어줘", "이 패턴대로 구현해줘" 등의 요청 시.

### 적용 워크플로우

1. **요청 매핑**: 어떤 UI 표면/패턴이 필요한지 파악
2. **패턴 로드**: 해당 surface 파일 + implementation-specs.md 읽기
3. **Plot 맥락 확인**: DESIGN-TOKENS.md, 현재 코드베이스 상태 확인
4. **구현 가이드 생성**: Plot의 기존 토큰과 매핑하여 구현 방안 제시
5. **design-quality-gate 연동**: 새 토큰 필요 시 경훈에게 확인 요청

### design-quality-gate와의 관계

이 스킬이 "이렇게 해야 한다"를 정의 → design-quality-gate가 "이대로 했는지" 검증.

- 새 토큰 발견 시 → DESIGN-TOKENS.md 업데이트 제안 (design-quality-gate의 controlled-ux-designer 프로토콜 적용)
- 구현 완료 후 → design-quality-gate의 자동 체크리스트로 검증

---

## 데이터 보강 가이드

이 스킬의 references/는 점진적으로 보강된다. 경훈이 새 데이터를 제공하면 해당 파일을 업데이트.

### DevTools 캡처 방법 (경훈 액션)

Linear 앱에서 F12(DevTools) 열고 요소를 선택하여 다음을 캡처:

```
[Element] .selector-name
  color: rgba(255, 255, 255, 0.65)
  font-size: 13px
  line-height: 20px
  padding: 4px 8px
  border-radius: 6px
  transition: background 150ms ease
  
[상태] :hover
  background: rgba(255, 255, 255, 0.05)
  color: rgba(255, 255, 255, 0.85)
```

### 스크린샷 가이드

같은 UI 표면의 상태별 캡처가 가장 유용:
- 기본 상태 (아무것도 선택/호버하지 않은)
- 호버 상태
- 활성/선택 상태
- 빈 상태 (데이터 없을 때)
- 로딩 상태

---

## 주의사항

- 이 스킬은 Linear의 **디자인 패턴과 원칙**을 연구하는 것이지, Linear의 코드를 복제하는 것이 아님
- Plot은 Linear의 복제품이 아니라, Linear의 디자인 품질을 지향하는 독립적 제품
- 모든 구현은 Plot의 기존 스택 (Next.js/React/shadcn/ui/Tailwind/TipTap)에 맞게 적용
- 새 디자인 값은 반드시 경훈에게 확인 (design-quality-gate의 절대 규칙)
