import { error } from "./lib/util"
import ViewRect from "./lib/viewrect"

class Vertex {
    public static DATA_SIZE = 5

    public readonly index: number

    protected readonly _data: Array<number>
    protected readonly _newOffset: number
    protected readonly _oldOffset: number

    constructor(data: Array<number>, index: number, oldOffset: number) {
        this.index = index
        this._data = data
        this._oldOffset = oldOffset * 2
        this._newOffset = ((oldOffset + 1) & 1) * 2
    }

    public get oldX(): number {
        return this._data[this._dataIndex + this._oldOffset + 0]
    }
    public get oldY(): number {
        return this._data[this._dataIndex + this._oldOffset + 1]
    }

    public get newX(): number {
        return this._data[this._dataIndex + this._newOffset + 0]
    }
    public set newX(value: number) {
        this._data[this._dataIndex + this._newOffset + 0] = value
    }
    public get newY(): number {
        return this._data[this._dataIndex + this._newOffset + 1]
    }
    public set newY(value: number) {
        this._data[this._dataIndex + this._newOffset + 1] = value
    }

    public get pinned(): boolean {
        return this._data[this._dataIndex + 4] == 1
    }
    public set pinned(value: boolean) {
        this._data[this._dataIndex + 4] = value ? 1 : 0
    }

    protected get _dataIndex(): number {
        return this.index * Vertex.DATA_SIZE
    }
}

class Edge {
    public static DATA_SIZE = 3

    public readonly a: Vertex
    public readonly b: Vertex

    protected readonly _data: Array<number>
    protected readonly _index: number

    constructor(data: Array<number>, index: number, a: Vertex, b: Vertex) {
        this._data = data
        this._index = index
        this.a = a
        this.b = b
    }

    public get distance(): number {
        return this._data[this._dataIndex + 2]
    }
    public set distance(value: number) {
        this._data[this._dataIndex + 2] = value
    }

    protected get _dataIndex(): number {
        return this._index * Edge.DATA_SIZE
    }
}

const MILLISECONDS_PER_SECOND = 1_000

class ClothData {
    protected _vertices: Array<number> = []
    protected _oldOffset = 0

    // store a index, b index and distance
    protected _edges: Array<number> = []

    public get vertexCount(): number {
        return this._vertices.length / 5
    }

    public addVertex(x: number, y: number) {
        this._vertices.push(x, y, x, y, 0)
    }

    public getVertex(index: number): Vertex {
        return new Vertex(this._vertices, index, this._oldOffset)
    }

    public findClosestVertex(x: number, y: number): Vertex {
        if (this._vertices.length == 0) {
            throw "No vertex exists in the scene to find"
        }

        let minDist = Infinity
        let vertexIndex = 0
        for (let i = 0; i < this.vertexCount; ++i) {
            const [vx, vy] = this._getPos(i)
            const d = len2(...diff(x, y, vx, vy))
            if (d < minDist) {
                vertexIndex = i
                minDist = d
            }
        }

        return this.getVertex(vertexIndex)
    }

    public removeVertex(index: number) {
        this._vertices.splice(index * Vertex.DATA_SIZE, Vertex.DATA_SIZE)
        this.removeEdgesConnectingTo(index)
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            if (this._edges[i + 0] > index) {
                this._edges[i + 0] -= 1
            }
            if (this._edges[i + 1] > index) {
                this._edges[i + 1] -= 1
            }
        }
    }

    public *vertices(): Generator<Vertex, void> {
        for (let i = 0; i < this.vertexCount; ++i) {
            yield this.getVertex(i)
        }
    }

    public addEdge(aIndex: number, bIndex: number, slack = 0) {
        if (aIndex == bIndex) {
            throw "Can not add edge between the same vertex"
        }
        if (this.findEdge(aIndex, bIndex) != null) {
            console.log("found existing edge")
            return
        }
        const aPos = this._getPos(aIndex)
        const bPos = this._getPos(bIndex)
        this._edges.push(aIndex, bIndex, Math.sqrt(len2(...diff(...aPos, ...bPos))) + slack)
    }

    public findEdge(aIndex: number, bIndex: number): Edge | null {
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            const [a, b] = this._edges.slice(i, i + 2)
            if ((a == aIndex && b == bIndex) || (a == bIndex && b == aIndex)) {
                return new Edge(this._edges, i / Edge.DATA_SIZE, this.getVertex(a), this.getVertex(b))
            }
        }
        return null
    }

    public removeEdge(aVertex: number, bVertex: number) {
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            const [a, b] = this._edges.slice(i, i + 2)
            if (a == aVertex && b == bVertex) {
                this._edges.splice(i, 1)
                return
            }
        }
    }

    public removeEdgesConnectingTo(vertexIndex: number) {
        let endAt = this._edges.length
        for (let i = 0; i < endAt; i += Edge.DATA_SIZE) {
            const [a, b, _] = this._edges.slice(i, i + 3)
            if (a == vertexIndex || b == vertexIndex) {
                for (let l = 0; l < Edge.DATA_SIZE; ++l) {
                    this._edges[i + l] = this._edges[endAt - l - 1]
                }
                endAt -= Edge.DATA_SIZE
            }
        }

        this._edges.splice(endAt)
    }

    public *edges(): Generator<Edge, void> {
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            const [a, b] = this._edges.slice(i, i + 2)
            yield new Edge(this._edges, i / Edge.DATA_SIZE, this.getVertex(a), this.getVertex(b))
        }
    }

    protected _getPos(vertexIndex: number): [number, number] {
        const offset = vertexIndex * Vertex.DATA_SIZE + this._oldOffset
        return this._vertices.slice(offset, offset + 2) as [number, number]
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
    protected _scene = new ClothData()

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
        this._ctx.ellipse(...this.worldToCanvas(vertex.oldX, vertex.oldY), this.VERTEX_RADIUS, this.VERTEX_RADIUS, 0, 0, Math.PI * 2)
        this._ctx.fill()
    }

    protected drawEdge(edge: Edge) {
        this._ctx.beginPath()
        this._ctx.moveTo(...this.worldToCanvas(edge.a.oldX, edge.a.oldY))
        this._ctx.lineTo(...this.worldToCanvas(edge.b.oldX, edge.b.oldY))
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
                vertex.pinned = !vertex.pinned
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
            if (len2(...diff(...this.worldToCanvas(vertex.oldX, vertex.oldY), cx, cy)) < this.VERTEX_RADIUS * this.VERTEX_RADIUS * 4) {
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

function diff(ax: number, ay: number, bx: number, by: number): [number, number] {
    return [ax - bx, ay - by]
}

function mid(ax: number, ay: number, bx: number, by: number): [number, number] {
    return [(ax + bx) / 2, (ay + by) / 2]
}

function len2(x: number, y: number): number {
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
