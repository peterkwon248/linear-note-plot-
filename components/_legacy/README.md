# `_legacy/` — Transitional Component Holding Area

> Plot v3 visual refresh의 점진 교체 (gradual replacement) 전용 폴더.
> Phase 1 (token foundation) 직후 마련됨. Phase 2+ 에서 본격 사용.

## 목적

v3 visual refresh가 진행되는 동안 (Phase 2: Imperial icon codemod ~ Phase 5+),
구버전 컴포넌트와 신버전 컴포넌트가 일정 기간 **공존(co-existence)**해야 한다.
이 폴더는 그 transitional 기간의 보관소다.

이동 절차:
1. 새 v3 버전 컴포넌트를 `components/`의 정식 경로에 작성한다.
2. 일정 기간 (해당 phase 종료 시점까지) 두 버전이 공존하며 사용처를 점진 이동.
3. 사용처가 0으로 줄면 (`grep "from \"@/components/old-name\""` 0 결과) 구버전을
   `_legacy/`로 이동.
4. 다음 quarter 시작 시 archive (별도 branch) 또는 삭제.

## 4 정책 (필수 준수)

### 1. Codemod 변환 제외

`_legacy/` 안의 파일은 **codemod 자동 변환 대상에서 제외**된다.

- 이유: legacy 컴포넌트는 의도적으로 옛 API/패턴을 유지해야 하므로 (예: 기존
  phosphor 아이콘 import, 옛 토큰 이름 사용) 자동 변환되면 안 됨.
- 적용: codemod 스크립트 (Phase 2부터 작성)에서 glob 제외 패턴 사용:
  ```
  !components/_legacy/**
  !components/**/_legacy/**
  ```
- jscodeshift / ts-morph / sed 어떤 도구든 동일.

### 2. 새 작업 시 import 금지

`_legacy/` 안의 파일을 **새로 작성하는 코드에서 import 금지**.

- 이유: legacy는 graveyard로 향하는 중간 정거장. 새 코드는 항상 main 컴포넌트를
  사용해야 함.
- 검증: PR 리뷰 시 `from "@/components/_legacy"` 가 새 작업에 새로 추가되었는지
  확인.
- ESLint 룰 추가 권장 (Phase 2+):
  ```
  no-restricted-imports: ["error", {
    patterns: [{
      group: ["@/components/_legacy/*"],
      message: "Do not import from _legacy/. Use the v3 component instead."
    }]
  }]
  ```

### 3. Deprecation 주석 필수

`_legacy/`로 이동하는 파일은 **상단에 deprecation 주석을 필수로 추가**한다.

형식:
```ts
// @deprecated — moved to _legacy on YYYY-MM-DD.
// Use [new component path] instead.
// Removal target: YYYY-Qn (next quarter after sites = 0).
```

예시:
```ts
// @deprecated — moved to _legacy on 2026-05-07.
// Use @/components/v3/icon-system instead.
// Removal target: 2026-Q3.
```

### 4. 삭제 정책 (Removal Policy)

이동 후 다음 조건이 모두 충족되면 archive 또는 삭제:
1. 사용처 0 확인: `grep -r "from \"@/components/_legacy/<name>\"" .` 0 결과
2. **다음 quarter 시작 시점**까지 대기 (rollback 여유 기간)
3. archive: `git tag legacy-<name>-<date>` 후 `git rm`
4. 또는 별도 archive branch (`legacy/<phase>`) 로 이동 후 main에서 삭제

`.gitkeep` 파일은 폴더가 비어 있어도 보존되도록 유지 (`_legacy/` 자체는 영구
보존, 단 안의 파일은 위 정책에 따라 삭제).

## 현재 상태

- 폴더 생성: 2026-05-07 (Phase 1 마무리 시점)
- 안에 들어 있는 파일: 없음
- 다음 사용 시점: Phase 2 (Imperial icons codemod) — 121 phosphor import 사이트
  변환 시 이전 paint 패턴이 남은 컴포넌트가 있다면 여기로 이동.

## 관련 문서

- `.omc/plans/v3-phase-1-tokens-typography.md` — Phase 1 Task 1.7
- `.omc/plans/v3-phase-1-cascade-map.md` — Token cascade 분석
- `docs/PLOT-V3-VISUAL-REFRESH-PRD.md` — 전체 visual refresh 컨텍스트
