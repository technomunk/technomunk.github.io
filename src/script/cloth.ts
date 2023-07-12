import { error } from "./lib/util"
import ViewRect from "./lib/viewrect"

type P2 = [number, number]
type Vertex = {
    readonly index: number,
    readonly oldPos: [number, number],
    readonly newPos: [number, number],
    readonly pinned: boolean,
}
type Edge = {
    vertexA: Vertex,
    vertexB: Vertex,
    distance: number,
}

const MILLISECONDS_PER_SECOND = 1_000

class Scene {
    protected _flipIndex = 0

    protected _positions: [Array<P2>, Array<P2>] = [[], []]
    protected _velocities: [Array<P2>, Array<P2>] = [[], []]
    protected _pinned: Array<boolean> = []
    protected _vertexCount = 0

    // store a index, b index and distance
    protected _edges: Array<[number, number, number]> = []

    public get vertexCount(): number {
        return this._vertexCount
    }

    public addVertex(x: number, y: number) {
        this._positions[0].push([x, y])
        this._positions[1].push([x, y])
        this._velocities[0].push([x, y])
        this._velocities[1].push([x, y])
        this._pinned.push(false)
        this._vertexCount += 1
    }

    public getVertex(index: number): Vertex {
        const unflipIndex = (this._flipIndex + 1) & 1
        return {
            index,
            oldPos: this._positions[this._flipIndex][index],
            newPos: this._positions[unflipIndex][index],
            pinned: this._pinned[index]
        }
    }

    public findClosestVertex(x: number, y: number): Vertex {
        if (this._vertexCount < 1) {
            throw "No vertex exists in the scene to find"
        }

        const pos: P2 = [x, y]
        let minDist = Infinity
        let vertexIndex = 0
        for (let i = 0; i < this._vertexCount; ++i) {
            const d = len2(diff(this._positions[this._flipIndex][i], pos))
            if (d < minDist) {
                vertexIndex = i
                minDist = d
            }
        }

        return this.getVertex(vertexIndex)
    }

    public removeVertex(index: number) {
        this._positions[0].splice(index, 1)
        this._positions[1].splice(index, 1)
        this._velocities[0].splice(index, 1)
        this._velocities[1].splice(index, 1)
        this._pinned.splice(index, 1)
        this._vertexCount -= 1
        this.removeEdges(index)
        for (const edge of this._edges) {
            if (edge[0] > index) {
                edge[0] -= 1
            }
            if (edge[1] > index) {
                edge[1] -= 1
            }
        }
    }

    public pinVertex(index: number, pinned: boolean) {
        this._pinned[index] = pinned
    }

    public *vertices(): Generator<Vertex, void> {
        for (let i = 0; i < this._vertexCount; ++i) {
            yield this.getVertex(i)
        }
    }

    public addEdge(aIndex: number, bIndex: number) {
        if (aIndex == bIndex) {
            throw "Can not add edge between the same vertex"
        }
        if (this.findEdge(aIndex, bIndex) != null) {
            console.log("found existing edge")
            return
        }
        const aPos = this._positions[this._flipIndex][aIndex]
        const bPos = this._positions[this._flipIndex][bIndex]
        this._edges.push([aIndex, bIndex, Math.sqrt(len2(diff(aPos, bPos)))])
    }

    public findEdge(aIndex: number, bIndex: number): Edge | null {
        for (const [a, b, d] of this._edges) {
            if ((a == aIndex && b == bIndex) || (a == bIndex && b == aIndex)) {
                return {
                    vertexA: this.getVertex(a),
                    vertexB: this.getVertex(b),
                    distance: d,
                }
            }
        }
        return null
    }

    public removeEdge(aVertex: number, bVertex: number) {
        for (let i = 0; i < this._edges.length; ++i) {
            const [a, b, _] = this._edges[i]
            if (a == aVertex && b == bVertex) {
                this._edges.splice(i, 1)
                return
            }
        }
    }

    public removeEdges(vertexIndex: number) {
        let endAt = this._edges.length
        for (let i = 0; i < endAt; ++i) {
            const [a, b, _] = this._edges[i]
            if (a == vertexIndex || b == vertexIndex) {
                this._edges[i] = this._edges[endAt - 1]
                endAt -= 1
            }
        }

        this._edges.splice(endAt)
    }

    public *edges(): Generator<Edge, void> {
        for (const [a, b, dist] of this._edges) {
            yield {
                vertexA: this.getVertex(a),
                vertexB: this.getVertex(b),
                distance: dist,
            }
        }
    }
}

class ClothSim {
    public static CONTEXT_SETTINGS: CanvasRenderingContext2DSettings = {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
    }
    public SPRING_TENSION = 2
    public GRAVITY = .4
    public DAMPENING = 8
    public MAX_SPRING_FORCE = 5
    public WIND_STRENGTH = .2
    public VERTEX_RADIUS = 8

    protected _canvas: HTMLCanvasElement
    protected _ctx: CanvasRenderingContext2D

    protected _view: ViewRect
    protected _scene = new Scene()

    protected _selectedVertex: number | null = null
    protected _lastAnimationTime = performance.now()

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas
        this._ctx = canvas.getContext("2d", ClothSim.CONTEXT_SETTINGS) ?? error("Could not create rendering context")

        const ratio = this._canvas.width / this._canvas.height
        if (this._canvas.width > this._canvas.height) {
            this._view = new ViewRect(0, 0, 10 * ratio, 10)
        } else {
            this._view = new ViewRect(0, 0, 10, 10 / ratio)
        }

        this.setupControls()
    }

    public draw() {
        this._ctx.fillStyle = "white"
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)

        this._ctx.fillStyle = "black"
        this._ctx.strokeStyle = "black"
        this._ctx.lineWidth = 2

        for (const edge of this._scene.edges()) {
            this.drawEdge(edge)
        }

        for (const vertex of this._scene.vertices()) {
            this.drawVertex(vertex)
        }
    }

    public animate(now: number) {
        const timeDelta = Math.min(.2, (now - this._lastAnimationTime) / MILLISECONDS_PER_SECOND)
        this._lastAnimationTime = now
        this.simStep(timeDelta)
        this.draw()
        requestAnimationFrame((t) => this.animate(t))
    }

    public resize(width: number, height: number) {
        const widthToHeight = width / height
        this._view.height *= height / this._canvas.height
        this._view.width = this._view.height * widthToHeight

        this._canvas.width = width
        this._canvas.height = height

        this.draw()
    }

    public simStep(timeDelta: number) {
        const simIndex = (this.drawIndex + 1) & 1
        for (let i = 0; i < this.vertices.count; ++i) {
            this.simVertex(simIndex, i, timeDelta)
        }
        console.log("Simulation ran")
        this.drawIndex = simIndex
    }

    public canvasToWorld(x: number, y: number): [number, number] {
        x /= this._canvas.width
        y /= this._canvas.height
        return this._view.relativeToActual(x, y)
    }

    public worldToCanvas(x: number, y: number): [number, number] {
        [x, y] = this._view.actualToRelative(x, y)
        return [this._canvas.width * x, this._canvas.height * (1 - y)]
    }

    protected drawVertex(vertex: Vertex) {
        if (vertex.index == this._selectedVertex) {
            this._ctx.fillStyle = vertex.pinned ? "purple" : "blue"
        } else {
            this._ctx.fillStyle = vertex.pinned ? "black" : "gray"
        }
        this._ctx.beginPath()
        this._ctx.ellipse(...this.worldToCanvas(...vertex.oldPos), this.VERTEX_RADIUS, this.VERTEX_RADIUS, 0, 0, Math.PI * 2)
        this._ctx.fill()
    }

    protected drawEdge(edge: Edge) {
        this._ctx.beginPath()
        this._ctx.moveTo(...this.worldToCanvas(...edge.vertexA.oldPos))
        this._ctx.lineTo(...this.worldToCanvas(...edge.vertexB.oldPos))
        this._ctx.stroke()
    }

    protected setupControls() {
        this._canvas.addEventListener("click", (e) => this.processClick(e))
    }

    protected processClick(e: MouseEvent) {
        let vertex = this.selectedVertex(e.x, e.y)
        if (e.ctrlKey) {
            if (vertex == null) {
                return
            } else {
                this._scene.pinVertex(vertex.index, !vertex.pinned)
            }
        } else {
            let vertexCreated = false
            if (vertex == null) {
                this._scene.addVertex(...this.canvasToWorld(e.x, e.y))
                vertex = this._scene.getVertex(this._scene.vertexCount - 1)
                vertexCreated = true
            }

            if (e.shiftKey) {
                this.addEdge(vertex)
            } else if (!vertexCreated) {
                this._scene.removeVertex(vertex.index)
            }

            if (vertexCreated) {
                this._selectedVertex = this._scene.vertexCount - 1
            }
        }

        this.draw()
    }

    protected addEdge(vertex: Vertex) {
        if (this._selectedVertex) {
            if (this._selectedVertex == vertex.index) {
                this._selectedVertex = null
                return
            }
            this._scene.addEdge(this._selectedVertex, vertex.index)
        }
        this._selectedVertex = vertex.index
    }

    protected modifyEdge(e: MouseEvent) {
        let vertex = this.selectedVertex(e.x, e.y)
        if (vertex == null) {
            this._scene.addVertex(...this.canvasToWorld(e.x, e.y))
            vertex = this._scene.getVertex(this._scene.vertexCount - 1)
        }

        if (this._selectedVertex == null) {
            this._selectedVertex = vertex.index
        } else if (this._selectedVertex != vertex.index) {
            this._scene.addEdge(this._selectedVertex, vertex.index)
            this._selectedVertex = vertex.index
        } else {
            this._selectedVertex = null
        }
        this.draw()

    }

    protected modifyVertex(e: MouseEvent) {
        const vertex = this.selectedVertex(e.x, e.y)
        if (vertex != null) {
            this._scene.removeVertex(vertex.index)
        } else {
            this._scene.addVertex(...this.canvasToWorld(e.x, e.y))
            this._selectedVertex = this._scene.vertexCount - 1
        }

        this.draw()
    }

    protected selectedVertex(cx: number, cy: number): Vertex | null {
        const [wx, wy] = this.canvasToWorld(cx, cy)
        if (this._scene.vertexCount > 0) {
            const vertex = this._scene.findClosestVertex(wx, wy)
            if (len2(diff(this.worldToCanvas(...vertex.oldPos), [cx, cy])) < this.VERTEX_RADIUS * this.VERTEX_RADIUS * 4) {
                return vertex
            }
        }

        return null
    }

    protected simVertex(simIndex: number, index: number, timeDelta: number) {
        const oldPos = this.posOf(index)
        const newPos = this.vertices.pos[simIndex][index]
        if (this.vertices.pinned[index]) {
            newPos[0] = oldPos[0]
            newPos[1] = oldPos[1]
            return
        }

        // integrate position
        const oldVel = this.vertices.vel[this.drawIndex][index]
        newPos[0] = oldPos[0] + oldVel[0]
        newPos[1] = oldPos[1] + oldVel[1]

        // integrate velocity
        let ax = 0, ay = 0

        // spring tension
        for (const edge of this.vertices.edges[index]) {
            const np = this.posOf(edge.index)
            const delta = diff(np, oldPos)
            const distance = Math.sqrt(len2(delta))
            const d = distance - edge.dist

            const nx = delta[0] / distance
            const ny = delta[1] / distance

            ax += nx * timeDelta * Math.min(d * this.SPRING_TENSION, this.MAX_SPRING_FORCE)
            ay += ny * timeDelta * Math.min(d * this.SPRING_TENSION, this.MAX_SPRING_FORCE)
        }

        // integrate gravity
        ay -= timeDelta * this.GRAVITY

        // add random wind
        ax += Math.sin(performance.now() / MILLISECONDS_PER_SECOND / Math.PI - oldPos[1] / 5) * this.WIND_STRENGTH * timeDelta

        // integrate dampening
        ax -= oldVel[0] * this.DAMPENING * timeDelta
        ay -= oldVel[1] * this.DAMPENING * timeDelta

        // dampen velocity
        const newVel = this.vertices.vel[simIndex][index]
        newVel[0] = oldVel[0] + ax
        newVel[1] = oldVel[1] + ay
    }
}

function diff(a: P2, b: P2): [number, number] {
    return [a[0] - b[0], a[1] - b[1]]
}

function len2([x, y]: P2): number {
    return x * x + y * y
}


function initialize(): void {
    const canvas: HTMLCanvasElement = document.querySelector("canvas#main-canvas") ?? error("Could not find main canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cs = new ClothSim(canvas)
    window.addEventListener("resize", () => cs.resize(window.innerWidth, window.innerHeight))
    requestAnimationFrame(() => cs.draw())
}

window.onload = initialize
