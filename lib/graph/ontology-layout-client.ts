export interface ForceConfig {
  chargeStrength: number
  linkDistance: number
  collisionRadius: number
  ticks: number
}

export interface LayoutNodeInput {
  id: string
  connectionCount: number
  prevX?: number
  prevY?: number
}

export interface NodePosition {
  id: string
  x: number
  y: number
}

class OntologyLayoutClient {
  private worker: Worker | null = null
  private pendingResolve: ((positions: NodePosition[]) => void) | null = null
  private pendingReject: ((error: Error) => void) | null = null

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("./ontology-layout-worker.ts", import.meta.url)
      )
      this.worker.onmessage = (e: MessageEvent) => {
        const msg = e.data
        switch (msg.type) {
          case "POSITIONS":
            if (this.pendingResolve) {
              this.pendingResolve(msg.positions)
              this.pendingResolve = null
              this.pendingReject = null
            }
            break
          case "ERROR":
            if (this.pendingReject) {
              this.pendingReject(new Error(msg.message))
              this.pendingResolve = null
              this.pendingReject = null
            }
            break
        }
      }
    }
    return this.worker
  }

  layout(
    nodes: LayoutNodeInput[],
    edges: Array<{ source: string; target: string }>,
    config: ForceConfig
  ): Promise<NodePosition[]> {
    return new Promise((resolve, reject) => {
      // Cancel any pending request
      if (this.pendingReject) {
        this.pendingReject(new Error("Cancelled"))
      }
      this.pendingResolve = resolve
      this.pendingReject = reject

      const worker = this.ensureWorker()
      worker.postMessage({
        type: "LAYOUT",
        nodes,
        edges,
        config,
      })
    })
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingResolve = null
    this.pendingReject = null
  }
}

export const ontologyLayoutClient = new OntologyLayoutClient()
