# Linear 색상 시스템

## LCH 색공간

Linear는 HSL 대신 LCH(Lightness, Chroma, Hue) 색공간을 사용한다.
LCH의 장점: perceptually uniform — 빨간색과 노란색이 같은 lightness 50이면 인간의 눈에 실제로 비슷한 밝기로 보인다. HSL에서는 이것이 보장되지 않는다.

## 커스텀 테마 JSON 구조

Linear의 테마는 이 형식으로 정의된다:

```json
{
  "base": [L, C, H, alpha],      // 메인 배경 색상 (LCH)
  "accent": [L, C, H, alpha],    // 강조 색상 (LCH)
  "contrast": 30,                 // 대비도 (0-100)
  "sidebar": {
    "base": [L, C, H, alpha],    // 사이드바 배경 (메인과 별도)
    "accent": [L, C, H, alpha],  // 사이드바 강조색
    "contrast": 30                // 사이드바 대비도
  }
}
```

핵심: 사이드바가 메인 영역과 독립적인 색상 시스템을 가질 수 있다.
이것이 "사이드바를 몇 노치 더 어둡게"를 가능하게 한다.

예시 (Catppuccin Mocha 테마):
```json
{
  "base": [16.02, 13.10, 282.51, 1],
  "accent": [71.79, 46.50, 305.26, 1],
  "contrast": 30,
  "sidebar": {
    "base": [13.89, 10.50, 283.78, 1],  // 메인보다 L값이 낮아 더 어둡다
    "accent": [71.79, 46.50, 305.26, 1],
    "contrast": 30
  }
}
```

## 2024 → 2026 색상 전환

### 이전 (2024 이전)
- 차가운 블루 계열 (cool, blue-ish hue)
- chrome(파란색)이 색상 시스템 계산에 많이 사용됨

### 이후 (2024-2026)
- 따뜻한 뉴트럴 그레이 (warmer gray)
- chrome 사용을 제한하여 더 중립적이고 timeless한 외관
- Inter Display를 헤딩에, 일반 Inter를 본문에 사용
- 텍스트/뉴트럴 아이콘의 대비 향상: 라이트모드에서 더 어둡게, 다크모드에서 더 밝게

### 색상 조정의 어려움
"너무 따뜻하면 탁해 보인다(muddy)" — 미세 조정이 필요.
해결: Claude Code로 dev toolbar 안에 색상 도구를 만들어, 개별 디자인 토큰의 hue/chroma/lightness를 실시간으로 실험.
확정 후 JSON으로 Figma 플러그인에 직접 임포트.

## 다크모드 디자인 원칙 (James Robinson 가이드 기반)

### perceptual saturation은 비선형
- 인간의 시각은 밝은 쪽의 미세한 차이에 더 민감
- "middle gray"는 50%가 아니라 약 18% 반사율
- 톤 스케일은 선형이 아닌 quad/quint 커브여야 함
- 어두운 색상은 높은 채도를 견디면서도 중립적으로 보임

### 다크모드에서의 elevation
- 라이트모드: 그림자로 depth 표현
- 다크모드: 그림자가 보이지 않으므로 **밝기**로 elevation 표현
- 더 높은 z-layer = 더 밝은 배경
- edge lighting: 요소 경계에 미묘한 하이라이트로 차원감

### Linear의 ⌘K 모달 사례
- 모달 배경이 메인 배경보다 약간 밝음 → 전경(foreground)임을 전달
- 리스트 항목 하이라이트는 모달 배경 대비 차이가 훨씬 큼
- 리스트 항목에는 edge lighting 없음 → 같은 z-plane의 상태 변화임을 전달
- 결론: edge lighting 유무로 "새 레이어 vs 같은 레이어의 상태"를 구분

### "100% 검정은 너무 검다"
순수 검정(#000) 대신 아주 약간의 색조를 가진 매우 어두운 색상을 사용.
브랜드 색상에서 1-10% lightness를 사용하면 조화로운 팔레트.

## Plot 현재 토큰과의 매핑

Plot의 기존 사이드바 색상 토큰:
```
비활성 텍스트: rgba(255,255,255, 0.65)
비활성 아이콘: rgba(255,255,255, 0.45)
호버 텍스트:   rgba(255,255,255, 0.85)
활성 텍스트:   rgba(255,255,255, 0.93)
활성 배경:     rgba(255,255,255, 0.08)
호버 배경:     rgba(255,255,255, 0.05)
카운트/보조:   rgba(255,255,255, 0.35)
사이드바 bg:   #1c1c20
```

이 값들은 이미 Linear의 opacity 계층 접근법과 매우 유사.
차이점: Linear은 LCH 기반으로 base 색상에서 파생하지만, Plot은 직접 rgba를 지정.
향후 고려: Plot도 LCH 기반 색상 생성 시스템으로 전환하면 테마 기능 구현이 용이.

## Radix UI 사용

Linear은 Radix UI를 UI 라이브러리로 사용한다.
Plot은 shadcn/ui를 사용하는데, shadcn/ui 자체가 Radix UI 위에 구축되어 있으므로 기술적으로 호환.
