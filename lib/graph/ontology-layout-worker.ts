// @ts-nocheck
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"
import { CLUSTER_LAYOUT } from "./ontology-graph-config"

interface WorkerNode extends SimulationNodeDatum {
  id: string
  connectionCount: number
  labelId: string | null
}

interface WorkerEdge {
  source: string
  target: string
}

interface ForceConfig {
  chargeStrength: number
  linkDistance: number
  collisionRadius: number
  ticks: number
  // Phase 2 additions
  linkStrength?: number
  centerStrength?: number
  distanceMax?: number
}

type InMessage = {
  type: "LAYOUT"
  nodes: Array<{ id: string; connectionCount: number; labelId: string | null; prevX?: number; prevY?: number }>
  edges: Array<{ source: string; target: string }>
  config: ForceConfig
}

type OutMessage =
  | { type: "POSITIONS"; positions: Array<{ id: string; x: number; y: number }> }
  | { type: "ERROR"; message: string }

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data
  if (msg.type === "LAYOUT") {
    try {
      // Build simulation nodes - use previous positions if available
      const simNodes: WorkerNode[] = msg.nodes.map((n) => ({
        id: n.id,
        connectionCount: n.connectionCount,
        labelId: n.labelId,
        x: n.prevX ?? undefined,
        y: n.prevY ?? undefined,
      }))

      const nodeIdxMap = new Map(simNodes.map((n, i) => [n.id, i]))

      // Build simulation links
      const simLinks: SimulationLinkDatum<WorkerNode>[] = msg.edges
        .map((e) => {
          const si = nodeIdxMap.get(e.source)
          const ti = nodeIdxMap.get(e.target)
          if (si === undefined || ti === undefined) return null
          return { source: si, target: ti }
        })
        .filter(Boolean) as SimulationLinkDatum<WorkerNode>[]

      const { chargeStrength, linkDistance, collisionRadius, ticks, linkStrength, centerStrength, distanceMax } = msg.config

      // Compute cluster targets based on labelId
      // Assign each unique label a position on a circle
      const labelIds = [...new Set(simNodes.map((n) => n.labelId).filter(Boolean))] as string[]
      const clusterTargets = new Map<string, { x: number; y: number }>()
      const clusterRadius = Math.max(CLUSTER_LAYOUT.baseRadius, simNodes.length * CLUSTER_LAYOUT.perNodeMultiplier)
      labelIds.forEach((lid, i) => {
        const angle = (2 * Math.PI * i) / Math.max(labelIds.length, 1)
        clusterTargets.set(lid, {
          x: Math.cos(angle) * clusterRadius,
          y: Math.sin(angle) * clusterRadius,
        })
      })

      const hasLabels = labelIds.length >= 2

      const linkF = forceLink<WorkerNode, SimulationLinkDatum<WorkerNode>>(simLinks).distance(linkDistance)
      if (linkStrength !== undefined) linkF.strength(linkStrength)

      const chargeF = forceManyBody<WorkerNode>().strength(chargeStrength)
      if (distanceMax !== undefined) chargeF.distanceMax(distanceMax)

      const sim = forceSimulation<WorkerNode>(simNodes)
        .force("link", linkF)
        .force("charge", chargeF)
        .force("center", forceCenter(0, 0).strength(centerStrength ?? 1))
        .force("collide", forceCollide(collisionRadius))

      // Add clustering forces only when multiple labels exist
      if (hasLabels) {
        sim
          .force("clusterX", forceX<WorkerNode>((d) => {
            const target = d.labelId ? clusterTargets.get(d.labelId) : null
            return target?.x ?? 0
          }).strength(CLUSTER_LAYOUT.forceStrength))
          .force("clusterY", forceY<WorkerNode>((d) => {
            const target = d.labelId ? clusterTargets.get(d.labelId) : null
            return target?.y ?? 0
          }).strength(CLUSTER_LAYOUT.forceStrength))
      }

      sim.stop()

      // Run to convergence
      for (let i = 0; i < ticks; i++) sim.tick()

      const positions = simNodes.map((n) => ({
        id: n.id,
        x: n.x ?? 0,
        y: n.y ?? 0,
      }))

      self.postMessage({ type: "POSITIONS", positions } satisfies OutMessage)
    } catch (err) {
      self.postMessage({
        type: "ERROR",
        message: err instanceof Error ? err.message : String(err),
      } satisfies OutMessage)
    }
  }
}

export {}
