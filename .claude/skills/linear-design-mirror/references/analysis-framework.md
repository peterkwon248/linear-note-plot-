# 분석 프레임워크

스크린샷, DevTools 캡처, 또는 URL을 분석할 때 사용하는 템플릿.

## 분석 체크리스트

새 패턴을 분석할 때 아래 항목을 순서대로 추출한다.
모든 항목이 매번 필요한 건 아님 — 해당 패턴에 관련된 항목만.

### 1. 레이아웃 구조
- [ ] 컨테이너 타입 (flex/grid, 방향, 중첩)
- [ ] 너비/높이 (고정/유동, 값)
- [ ] 영역 분할 비율
- [ ] 리사이즈 가능 여부
- [ ] 접기/펼치기 동작

### 2. 색상 계층
- [ ] 배경 elevation 단계 (surface-0 → surface-n)
- [ ] 텍스트 opacity 계층 (primary/secondary/tertiary)
- [ ] 강조색 사용 위치와 빈도
- [ ] 경계/구분 방식 (border? spacing? opacity 차이?)

### 3. 타이포그래피
- [ ] 폰트 패밀리 (헤딩 vs 본문)
- [ ] 크기 스케일 (각 용도별 px)
- [ ] weight 사용 패턴
- [ ] line-height, letter-spacing

### 4. 아이콘/시각 요소
- [ ] 아이콘 스타일 (stroke/fill, strokeWidth)
- [ ] 크기 규격 (용도별 px)
- [ ] 색상 처리 (단색 opacity / 다색)

### 5. 인터랙션
- [ ] 호버 상태 변화 (배경, 텍스트, 타이밍)
- [ ] 선택/활성 상태
- [ ] 포커스 표시
- [ ] 트랜지션 (duration, easing)
- [ ] 키보드 동작
- [ ] hover-reveal 요소 (마우스 올려야 보이는 것들)

### 6. 정보 밀도
- [ ] 요소 간 간격 패턴 (gap/padding)
- [ ] 한 행에 표시되는 정보량
- [ ] 축약/생략 규칙 (truncation)
- [ ] 그룹 접기/펼치기

### 7. 상태별 변화
- [ ] 빈 상태 (데이터 없음)
- [ ] 로딩 상태
- [ ] 에러 상태
- [ ] 다수 선택 상태
- [ ] 벌크 액션 바

---

## 출력 포맷

### Layer 1: 디자인 의사결정 가이드 (경훈용)

```markdown
## 패턴: [이름] — [출처 앱] [버전/날짜]

### 핵심 디자인 결정
1. [결정 사항] — [이유/원칙과의 연결]
2. ...

### 대안 대비 장점
- [이 접근] vs [대안]: [장점]

### Plot 적용 시 고려사항
- [호환되는 점]
- [조정이 필요한 점]
- [적용 우선순위: 높음/중간/낮음]
```

### Layer 2: 구현 스펙 (Claude Code용)

```markdown
## 구현 스펙: [이름]

### CSS/Tailwind 값
| 속성 | 기본 | 호버 | 활성 |
|------|------|------|------|
| background | ... | ... | ... |
| color | ... | ... | ... |
| padding | ... | - | - |
| border-radius | ... | - | - |
| transition | ... | - | - |

### 컴포넌트 구조
\`\`\`tsx
// 개략적 구조만 (전체 구현이 아님)
<Container>
  <Section>
    <Item icon={...} label={...} count={...} />
  </Section>
</Container>
\`\`\`

### 상태 관리
- 기본 → 호버: [변화 설명]
- 호버 → 활성: [변화 설명]
- 키보드 포커스: [변화 설명]

### DESIGN-TOKENS.md 매핑
| Linear 값 | Plot 토큰 | 일치 여부 |
|-----------|----------|----------|
| ... | ... | ✅/⚠️/❌ |
```

---

## DevTools 캡처 템플릿

경훈이 DevTools에서 캡처할 때 이 형식을 따르면 분석이 가장 효율적:

```
[화면] 사이드바 - 비활성 항목
[요소] .sidebar-item
  color: rgba(255, 255, 255, 0.65)
  font-size: 13px
  font-weight: 400
  font-family: Inter, sans-serif
  line-height: 20px
  padding: 4px 8px 4px 12px
  border-radius: 6px
  transition: background 150ms ease
  gap: 8px

[상태] :hover
  background: rgba(255, 255, 255, 0.05)
  color: rgba(255, 255, 255, 0.85)

[상태] .active
  background: rgba(255, 255, 255, 0.08)
  color: rgba(255, 255, 255, 0.93)

[아이콘] .sidebar-item svg
  width: 16px
  height: 16px
  stroke-width: 1.5
  color: rgba(255, 255, 255, 0.45)
```
