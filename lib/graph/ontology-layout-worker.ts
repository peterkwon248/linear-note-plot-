// @ts-nocheck
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force"

interface WorkerNode extends SimulationNodeDatum {
  id: string
  connectionCount: number
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
}

type InMessage = {
  type: "LAYOUT"
  nodes: Array<{ id: string; connectionCount: number; prevX?: number; prevY?: number }>
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

      const { chargeStrength, linkDistance, collisionRadius, ticks } = msg.config

      const sim = forceSimulation<WorkerNode>(simNodes)
        .force(
          "link",
          forceLink<WorkerNode, SimulationLinkDatum<WorkerNode>>(simLinks).distance(linkDistance)
        )
        .force("charge", forceManyBody().strength(chargeStrength))
        .force("center", forceCenter(0, 0))
        .force("collide", forceCollide(collisionRadius))
        .stop()

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
