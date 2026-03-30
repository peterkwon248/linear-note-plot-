# 디자인 품질 하네스 — Claude Code 스킬 & 오픈소스 도구

> 2026-03-30 대화 기반 정리

## 배경

하네스 엔지니어링 관점("프롬프트는 부탁, 하네스는 강제")에서 앱의 UI/UX 디자인 퀄리티를 올리기 위한 공개 도구 조사.

---

## 스킬 자동 트리거 메커니즘

- SKILL.md frontmatter에 `disable-model-invocation: true`가 **없으면** Claude Code가 작업 맥락을 보고 알아서 스킬 로드
- description에 적힌 키워드와 현재 작업이 매칭되면 자동 활성화
- **자동 트리거가 기본값**, 슬래시 커맨드는 명시적 호출용

### 현실적 한계

1. **description 품질 의존** — 애매하면 트리거 타이밍 못 잡음
2. **컨텍스트 예산 제한** — 컨텍스트 윈도우의 1%, 개별 항목 250자 캡. 스킬 많으면 description 잘림
3. **"부탁" 수준** — Claude가 "해당 안 됨" 판단하면 스킵 가능

### 진짜 강제 방법

CLAUDE.md 규칙 + PostToolUse 훅 조합이 하네스의 핵심:
```markdown
# CLAUDE.md에 추가
## 디자인 작업 자동 체크리스트
- UI 컴포넌트 생성/수정 후 반드시 /baseline-ui 실행
- CSS/Tailwind 변경 시 design-lint.sh 자동 실행
- 새 디자인 값 도입 시 .interface-design/system.md 참조 필수
```

---

## Tier 1 — 지금 바로 붙일만한 것들

### `Dammyjay93/interface-design` (GitHub ⭐4.2k)

세션 간 디자인 결정을 기억하고 일관되게 적용하는 플러그인.

- `.interface-design/system.md`에 디자인 시스템 저장, 매 세션 시작 시 자동 로드
- `/interface-design:audit <path>` — 기존 코드 검사
- `/interface-design:extract` — 기존 코드에서 패턴 추출
- Plot의 `design-quality-gate`가 "위반 검출"이라면 이건 "결정 축적 + 컨텍스트 주입" → 상호보완적

설치: `/plugin marketplace add Dammyjay93/interface-design`

### `ibelick/ui-skills` (baseline-ui + fixing-accessibility + fixing-motion-performance)

에이전트가 만든 인터페이스를 후처리로 폴리싱하는 스킬 세트.

- 체이닝 워크플로우: 빌드 → `/baseline-ui` → `/fixing-accessibility` → `/fixing-motion-performance`
- `baseline-ui`: 애니메이션 duration, 타이포 스케일, 컴포넌트 접근성, Tailwind 레이아웃 안티패턴 검증
- PostToolUse 훅에 자동화 가능

설치: `npx ui-skills add baseline-ui` (나머지도 동일 패턴)

---

## Tier 2 — 참고/부분 채용

| 스킬 | 용도 | 비고 |
|------|------|------|
| **Vercel web-design-guidelines** (⭐19k+) | 100+ UI 규칙으로 correctness 검증 | 접근성 레이어 추가 시 유용 |
| **Anthropic frontend-design** (277K+ 설치) | 미학적 방향 설정 + 강제 | 새 프로젝트(Reticle, Stria) 초기 디자인 시드용 |
| **bencium UX Designer** | 28,000자 종합 UX 가이드 | innovative(실험적) / controlled(체계적) 2변형 |
| **ui-ux-pro-max** | 50 스타일, 97 팔레트, 50 폰트 페어링 CSV DB | 디자인 초기 탐색용. Python 의존이라 하네스 체인엔 무거움 |

---

## Tier 3 — 스킬은 아니지만 하네스에 붙일 수 있는 도구

| 도구 | 역할 | 비고 |
|------|------|------|
| **Stylelint / ESLint 커스텀 룰** | hardcoded hex, inline style, 잘못된 spacing class CI 차단 | `design-lint.sh`보다 확실한 강제 |
| **Axe-core / Pa11y** | 접근성 자동 검사 (WCAG 위반 코드 레벨 차단) | 컴포넌트 단위 적용 |

---

## 추천 조합 (Plot 기준)

이미 가지고 있는 `design-quality-gate` + `linear-design-mirror` 위에 2개만 추가:

```
1. linear-design-mirror     → "어떤 디자인을 할 것인가" (패턴 추출)
2. interface-design          → "결정을 기록하고 주입" (세션 간 일관성)
3. design-quality-gate       → "위반 검출" (PostToolUse 강제)
4. baseline-ui               → "완성 후 폴리싱" (체이닝 후처리)
```

### 보안 주의

Snyk 리서치에서 테스트한 스킬의 36%에서 프롬프트 인젝션이 발견됨. 많이 깔기보단 신뢰할 수 있는 것만 소수 정예로 운용.
