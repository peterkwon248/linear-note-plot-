import { forwardRef, type SVGProps } from "react"

export type Cuboid2x2Weight = "thin" | "light" | "regular" | "bold" | "duotone" | "fill"

interface Cuboid2x2Props extends Omit<SVGProps<SVGSVGElement>, "weight"> {
  size?: number | string
  weight?: Cuboid2x2Weight
  color?: string
  /** mirror for RTL — matches Phosphor's `mirrored` prop */
  mirrored?: boolean
}

// Phosphor weight → stroke-width (256 viewBox 기준)
const WEIGHT_STROKE: Record<Cuboid2x2Weight, number> = {
  thin: 8,
  light: 12,
  regular: 16,
  bold: 24,
  duotone: 16,
  fill: 16,
}

// Pre-computed isometric vertices (width=2, depth=2, height=1)
// 256 viewBox 안에 16px 패딩으로 fit. 이 값들은 수정하지 말 것.
const V = {
  A: [16.0, 158.8],     // front-bottom-left (i=0, j=0, k=0)
  B: [128.0, 220.4],    // front-bottom-right (i=2, j=0, k=0) — 가장 아래
  C: [240.0, 158.8],    // back-bottom-right (i=2, j=2, k=0) — 가장 오른쪽
  Dt: [16.0, 97.2],     // front-top-left (i=0, j=0, k=1)
  Et: [128.0, 158.8],   // inner front-top vertex Y (i=2, j=0, k=1)
  Ft: [128.0, 35.6],    // back-top-left (i=0, j=2, k=1) — 가장 위
  Gt: [240.0, 97.2],    // back-top-right (i=2, j=2, k=1)
  Mfb: [72.0, 189.6],   // mid front-bottom — width divider 시작
  Mft: [72.0, 128.0],   // mid front-top — width divider 끝
  Mbt: [184.0, 66.4],   // mid back-top — width divider 윗면 끝
  Tlf: [72.0, 66.4],    // top, j=1 left — depth divider 윗면 시작
  Trf: [184.0, 128.0],  // top, j=1 right — depth divider 윗면 끝
  Srb: [184.0, 189.6],  // right side, j=1 bottom — depth divider 우측면 끝
} as const

const EDGES: Array<[keyof typeof V, keyof typeof V]> = [
  // outer hexagon outline
  ["Ft", "Gt"], ["Gt", "C"], ["C", "B"], ["B", "A"], ["A", "Dt"], ["Dt", "Ft"],
  // Y at inner front-top vertex
  ["Et", "Dt"], ["Et", "B"], ["Et", "Gt"],
  // width divider (i=1): 앞면 세로 + 윗면 사선
  ["Mfb", "Mft"], ["Mft", "Mbt"],
  // depth divider (j=1): 윗면 사선 + 우측면 세로
  ["Tlf", "Trf"], ["Trf", "Srb"],
]

export const Cuboid2x2 = forwardRef<SVGSVGElement, Cuboid2x2Props>(function Cuboid2x2(
  { size = "1em", weight = "regular", color = "currentColor", mirrored = false, style, ...rest },
  ref,
) {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={WEIGHT_STROKE[weight]}
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{
        ...(mirrored ? { transform: "scaleX(-1)" } : null),
        ...style,
      }}
      {...rest}
    >
      {EDGES.map(([a, b], i) => (
        <line key={i} x1={V[a][0]} y1={V[a][1]} x2={V[b][0]} y2={V[b][1]} />
      ))}
    </svg>
  )
})
