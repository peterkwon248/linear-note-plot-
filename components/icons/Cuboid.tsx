import { forwardRef, type SVGProps } from "react"

export type CuboidWeight = "thin" | "light" | "regular" | "bold" | "duotone" | "fill"

interface CuboidProps extends Omit<SVGProps<SVGSVGElement>, "weight"> {
  size?: number | string
  weight?: CuboidWeight
  color?: string
  /** mirror for RTL — matches Phosphor's `mirrored` prop */
  mirrored?: boolean
}

// Phosphor weight → stroke-width (256 viewBox 기준)
const WEIGHT_STROKE: Record<CuboidWeight, number> = {
  thin: 8,
  light: 12,
  regular: 16,
  bold: 24,
  duotone: 16,
  fill: 16,
}

// Pre-computed isometric vertices (width=2, depth=1, height=1)
// 256 viewBox 안에 16px 패딩으로 fit. 이 값들은 수정하지 말 것.
const V = {
  A: [16.0, 148.53],     // front-bottom-left
  B: [165.33, 230.67],   // front-bottom-right
  C: [240.0, 189.6],     // back-bottom-right
  D: [16.0, 66.4],       // front-top-left
  Ev: [165.33, 148.53],  // inner front-top vertex (Y junction)
  F: [90.67, 25.33],     // back-top-left
  G: [240.0, 107.47],    // back-top-right
  Mfb: [90.67, 189.6],   // mid front-bottom (cube divider)
  Mft: [90.67, 107.47],  // mid front-top
  Mbt: [165.33, 66.4],   // mid back-top
} as const

const EDGES: Array<[keyof typeof V, keyof typeof V]> = [
  // outer hexagon outline
  ["F", "G"], ["G", "C"], ["C", "B"], ["B", "A"], ["A", "D"], ["D", "F"],
  // Y at inner front-top vertex
  ["Ev", "D"], ["Ev", "B"], ["Ev", "G"],
  // cube divider (front face vertical + top face diagonal)
  ["Mfb", "Mft"], ["Mft", "Mbt"],
]

export const Cuboid = forwardRef<SVGSVGElement, CuboidProps>(function Cuboid(
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
