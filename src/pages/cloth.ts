import { GestureDecoder } from "./lib/gesture"
import { error } from "./lib/util"
import ViewRect from "./lib/viewrect"

class Vertex {
    public static readonly DATA_SIZE = 7
    public static readonly PINNED_OFFSET = 6

    public readonly index: number

    protected readonly _data: Array<number>
    protected readonly _oldOffset: number
    protected readonly _curOffset: number
    protected readonly _newOffset: number

    constructor(data: Array<number>, index: number, oldOffset: number) {
        this.index = index
        this._data = data
        this._oldOffset = oldOffset * 2
        this._curOffset = ((oldOffset + 1) % 3) * 2
        this._newOffset = ((oldOffset + 2) % 3) * 2
    }

    public get oldX(): number {
        return this._data[this._dataIndex + this._oldOffset + 0]
    }
    public get oldY(): number {
        return this._data[this._dataIndex + this._oldOffset + 1]
    }

    public get curX(): number {
        return this._data[this._dataIndex + this._curOffset + 0]
    }
    public get curY(): number {
        return this._data[this._dataIndex + this._curOffset + 1]
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
        return this._data[this._dataIndex + 6] == 1
    }
    public set pinned(value: boolean) {
        this._data[this._dataIndex + Vertex.PINNED_OFFSET] = value ? 1 : 0
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

    public static describe(a: number, b: number): string {
        return `${Math.min(a, b)} ${Math.max(a, b)}`
    }

    protected get _dataIndex(): number {
        return this._index * Edge.DATA_SIZE
    }
}

class ClothData {
    protected _vertices: Array<number> = []
    protected _oldOffset = 0

    // store a index, b index and distance
    protected _edges: Array<number> = []

    public get vertexCount(): number {
        return this._vertices.length / Vertex.DATA_SIZE
    }
    public get edgeCount(): number {
        return this._edges.length / Edge.DATA_SIZE
    }

    public addVertex(x: number, y: number, pinned = false) {
        this._vertices.push(x, y, x, y, x, y, pinned ? 1 : 0)
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
        let updatedEdges = 0
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            if (this._edges[i + 0] > index) {
                this._edges[i + 0] -= 1
                ++updatedEdges
            }
            if (this._edges[i + 1] > index) {
                this._edges[i + 1] -= 1
                ++updatedEdges
            }
        }
    }

    public removeVerticesAlongLine(ax: number, ay: number, bx: number, by: number, radius: number) {
        const toRemove = []
        for (let i = 0; i < this.vertexCount; ++i) {
            const [x, y] = this._getPos(i)
            if (distToLine(x, y, ax, ay, bx, by) < radius) {
                toRemove.push(i)
            }
        }
        // TODO: as this is a bulk operation, it can be optimized to have at least linear time
        for (const i of toRemove) {
            this.removeVertex(i)
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
            console.debug("found existing edge")
            return
        }
        const aPos = this._getPos(aIndex)
        const bPos = this._getPos(bIndex)
        this._edges.push(aIndex, bIndex, Math.sqrt(len2(...diff(...aPos, ...bPos))) + slack)
    }

    public addBulkEdges(edges: Array<number>, slack = 0) {
        const seen: Set<string> = new Set()
        for (let i = 0; i < this._edges.length; i += Edge.DATA_SIZE) {
            seen.add(Edge.describe(this._edges[i + 0], this._edges[i + 1]))
        }

        for (let i = 0; i < edges.length; i += 2) {
            const a = edges[i + 0]
            const b = edges[i + 1]
            const desc = Edge.describe(a, b)
            if (!seen.has(desc)) {
                const aPos = this._getPos(a)
                const bPos = this._getPos(b)
                this._edges.push(Math.min(a, b), Math.max(a, b), Math.sqrt(len2(...diff(...aPos, ...bPos))) + slack)
                seen.add(desc)
            }
        }
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
                this._edges.splice(i, Edge.DATA_SIZE)
                return
            }
        }
    }

    public removeEdgesConnectingTo(vertexIndex: number) {
        let endAt = this._edges.length
        for (let i = 0; i < endAt; i += Edge.DATA_SIZE) {
            const [a, b, _] = this._edges.slice(i, i + 3)
            if (a == vertexIndex || b == vertexIndex) {
                this._edges.copyWithin(i, endAt - Edge.DATA_SIZE, endAt)
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

    public updatePositions() {
        this._oldOffset = (this._oldOffset + 1) % 3
    }

    public get oldPosOffset(): number {
        return this._oldOffset * 2
    }
    public get curPosOffset(): number {
        return ((this._oldOffset + 1) % 3) * 2
    }
    public get newPosOffset(): number {
        return ((this._oldOffset + 2) % 3) * 2
    }

    protected _getPos(vertexIndex: number): [number, number] {
        const offset = vertexIndex * Vertex.DATA_SIZE + this.curPosOffset
        return this._vertices.slice(offset, offset + 2) as [number, number]
    }
}

class ClothView {
    public readonly area: ViewRect
    public data: ClothData
    public vertexRadius = 8

    protected _canvas: HTMLCanvasElement
    protected _selectedVertex: number | null = null

    protected _isDirty = false

    constructor(canvas: HTMLCanvasElement, data: ClothData) {
        this.data = data
        this._canvas = canvas

        const ratio = this._canvas.width / this._canvas.height
        if (this._canvas.width > this._canvas.height) {
            this.area = new ViewRect(0, 0, 10 * ratio, 10)
        } else {
            this.area = new ViewRect(0, 0, 10, 10 / ratio)
        }
        this._setupControls()
    }

    public resize(width: number, height: number) {
        const widthToHeight = width / height
        this.area.height *= height / this._canvas.height
        this.area.width = this.area.height * widthToHeight

        this._canvas.width = width
        this._canvas.height = height
    }

    public canvasToWorld(x: number, y: number): [number, number] {
        x /= this._canvas.width
        y /= this._canvas.height
        return this.area.relativeToActual(x, y)
    }

    public worldToCanvas(x: number, y: number): [number, number] {
        [x, y] = this.area.actualToRelative(x, y)
        return [this._canvas.width * x, this._canvas.height * (1 - y)]
    }

    protected _setupControls() {
        this._canvas.addEventListener("click", (e) => this._processClick(e))
    }

    protected _processClick(e: MouseEvent) {
        let vertex = this._getSelectedVertex(e.x, e.y)
        if (e.ctrlKey) {
            if (vertex == null) {
                return
            } else {
                vertex.pinned = !vertex.pinned
                this._isDirty = true
            }
        } else {
            let vertexCreated = false
            this._isDirty = true
            if (vertex == null) {
                this.data.addVertex(...this.canvasToWorld(e.x, e.y))
                vertex = this.data.getVertex(this.data.vertexCount - 1)
                vertexCreated = true
            }

            if (e.shiftKey) {
                this._addEdge(vertex)
            } else if (!vertexCreated) {
                this.data.removeVertex(vertex.index)
            }

            if (vertexCreated) {
                this._selectedVertex = this.data.vertexCount - 1
            }
        }

        if (this._isDirty) {
            this.onUpdate()
            this._isDirty = false
        }
    }

    protected _addEdge(vertex: Vertex) {
        if (this._selectedVertex) {
            if (this._selectedVertex == vertex.index) {
                this._selectedVertex = null
                this._isDirty = true
                return
            }
            this.data.addEdge(this._selectedVertex, vertex.index)
        }
        this._selectedVertex = vertex.index
        this._isDirty = true
    }

    protected _getSelectedVertex(cx: number, cy: number): Vertex | null {
        const [wx, wy] = this.canvasToWorld(cx, cy)
        if (this.data.vertexCount > 0) {
            const vertex = this.data.findClosestVertex(wx, wy)
            if (len2(...diff(...this.worldToCanvas(vertex.oldX, vertex.oldY), cx, cy)) < this.vertexRadius * this.vertexRadius * 4) {
                return vertex
            }
        }

        return null
    }

    protected onUpdate() { }
}

class ClothRenderer extends ClothView {
    public static CONTEXT_SETTINGS: CanvasRenderingContext2DSettings = {
        alpha: false,
        desynchronized: true,
        willReadFrequently: false,
    }

    public vertexStyles = {
        pinned: "black",
        unpinned: "grey",
    }
    public selectedVertexRadius = 1.3

    protected _ctx: CanvasRenderingContext2D

    constructor(canvas: HTMLCanvasElement, data: ClothData) {
        super(canvas, data)
        this._ctx = canvas.getContext("2d", ClothRenderer.CONTEXT_SETTINGS) ?? error("Could not create rendering context")
    }

    public draw(showVertices = true) {
        this._ctx.fillStyle = "white"
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)
        this._ctx.fill()

        this._ctx.strokeStyle = "black"
        for (const edge of this.data.edges()) {
            this._drawEdge(edge)
        }

        if (showVertices) {
            for (const vertex of this.data.vertices()) {
                this._drawVertex(vertex)
            }
        }
    }

    override onUpdate() {
        this.draw()
    }

    protected _drawEdge(edge: Edge) {
        this._ctx.beginPath()
        this._ctx.moveTo(...this.worldToCanvas(edge.a.oldX, edge.a.oldY))
        this._ctx.lineTo(...this.worldToCanvas(edge.b.oldX, edge.b.oldY))
        this._ctx.stroke()
    }

    protected _drawVertex(vertex: Vertex) {
        this._ctx.fillStyle = vertex.pinned ? this.vertexStyles.pinned : this.vertexStyles.unpinned
        this._ctx.beginPath()
        this._ctx.ellipse(...this.worldToCanvas(vertex.oldX, vertex.oldY), this.vertexRadius, this.vertexRadius, 0, 0, Math.PI * 2)
        this._ctx.fill()

        if (vertex.index == this._selectedVertex) {
            this._ctx.beginPath()
            this._ctx.ellipse(...this.worldToCanvas(vertex.oldX, vertex.oldY), this.vertexRadius * this.selectedVertexRadius, this.vertexRadius * this.selectedVertexRadius, 0, 0, Math.PI * 2)
            this._ctx.stroke()
        }
    }
}

class ClothSim {
    public dampeningFactor = 0.95
    public gravity = -.3
    public windStrength = .5
    public windPeriod = 1_000 * Math.PI


    public simulate(timeStep: number, data: ClothData) {
        for (const vertex of data.vertices()) {
            this._simVertex(vertex, timeStep)
        }

        for (const edge of data.edges()) {
            this._simEdge(edge, timeStep)
        }

        data.updatePositions()
    }

    protected _simVertex(vertex: Vertex, timeStep: number) {
        if (vertex.pinned) {
            vertex.newX = vertex.curX
            vertex.newY = vertex.curY
            return
        }

        let velX = vertex.curX - vertex.oldX
        let velY = vertex.curY - vertex.oldY
        if (timeStep < 0) {
            velX *= -1
            velY *= -1
        }

        velX += Math.sin(performance.now() / this.windPeriod + vertex.curY) * this.windStrength * timeStep
        velY += this.gravity * timeStep

        velX *= this.dampeningFactor
        velY *= this.dampeningFactor

        vertex.newX = vertex.curX + velX
        vertex.newY = vertex.curY + velY
    }

    protected _simEdge(edge: Edge, timeStep: number) {
        if (edge.a.pinned && edge.b.pinned) {
            return
        }

        let [dx, dy] = diff(edge.a.curX, edge.a.curY, edge.b.curX, edge.b.curY)
        const dist = Math.sqrt(len2(dx, dy))
        if (dist < edge.distance) {
            return
        }

        dx /= dist
        dy /= dist
        let delta = dist - edge.distance
        if (!edge.a.pinned && !edge.b.pinned) {
            delta *= .5
        }

        if (!edge.a.pinned) {
            edge.a.newX -= dx * delta
            edge.a.newY -= dy * delta
        }
        if (!edge.b.pinned) {
            edge.b.newX += dx * delta
            edge.b.newY += dy * delta
        }
    }

}

class ClothScene {
    public readonly data: ClothData
    public readonly renderer: ClothRenderer
    public readonly simulator: ClothSim

    public simTimeStep = .01
    public paused = false

    protected _animFrame = 0

    constructor(canvas: HTMLCanvasElement) {
        this.data = ClothScene.generateExampleScene(50, 25)
        this.renderer = new ClothRenderer(canvas, this.data)
        this.simulator = new ClothSim()

        this._setupSimControls()

        this._simulateAndDraw()
    }

    protected _simulateAndDraw() {
        this.simulator.simulate(this.simTimeStep, this.data)
        this.renderer.draw(this.paused)

        if (!this.paused) {
            requestAnimationFrame(() => this._simulateAndDraw())
        }
    }

    protected static generateExampleScene(columns: number, rows: number, width = 8, height = 8, xOffset = 0, yOffset = 1,): ClothData {
        const minX = -width * .5
        const minY = -height * .5

        const data = new ClothData()
        for (let y = 0; y < rows; ++y) {
            for (let x = 0; x < columns; ++x) {
                data.addVertex(
                    minX + (x / columns) * width + xOffset,
                    minY + (y / rows) * height + yOffset,
                    y == (rows - 1) && (x & 3) == 0,
                )
            }
        }

        const edges = new Array()
        for (let y = 0; y < rows; ++y) {
            for (let x = 0; x < columns; ++x) {
                const index = (y * columns) + x
                const left = index - 1
                const right = index + 1
                const top = ((y - 1) * columns) + x
                const bottom = ((y + 1) * columns) + x

                if (x > 0) {
                    edges.push(index, left)
                }
                if (x + 1 < columns) {
                    edges.push(index, right)
                }
                if (y > 0) {
                    edges.push(index, top)
                }
                if (y + 1 < rows) {
                    edges.push(index, bottom)
                }
            }
        }
        data.addBulkEdges(edges)

        return data
    }

    protected _setupSimControls() {
        document.addEventListener("keypress", (e) => this._handleKeyPress(e))
    }

    protected _handleKeyPress(e: KeyboardEvent) {
        switch (e.key) {
            case " ":
                this.paused = !this.paused
                if (!this.paused) {
                    requestAnimationFrame(() => this._simulateAndDraw())
                }
                break
            case "+":
                this.paused = true
                this.simulator.simulate(this.simTimeStep, this.data)
                requestAnimationFrame(() => this.renderer.draw(true))
                break
            case "-":
                this.paused = true
                this.simulator.simulate(-this.simTimeStep, this.data)
                requestAnimationFrame(() => this.renderer.draw(true))
                break
            default:
                console.debug(e)
        }
    }
}

function diff(ax: number, ay: number, bx: number, by: number): [number, number] {
    return [ax - bx, ay - by]
}

function mid(ax: number, ay: number, bx: number, by: number): [number, number] {
    return [(ax + bx) / 2, (ay + by) / 2]
}

function distToLine(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
    const denominator = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay))
    const divisor = Math.sqrt(len2(...diff(ax, ay, bx, by)))
    return denominator / divisor
}

function len2(x: number, y: number): number {
    return x * x + y * y
}


function initialize(): void {
    const canvas: HTMLCanvasElement = document.querySelector("canvas#main-canvas") ?? error("Could not find main canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cs = new ClothScene(canvas)
    window.addEventListener("resize", () => cs.renderer.resize(window.innerWidth, window.innerHeight))
}

window.onload = initialize
