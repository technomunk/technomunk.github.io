import { error } from "./lib/util"
import ViewRect from "./lib/viewrect"

type VertexPos = [number, number]
type Edge = { index: number, dist: number }
type Vertices = {
    pos: [Array<VertexPos>, Array<VertexPos>]
    vel: [Array<VertexPos>, Array<VertexPos>]
    edges: Array<Array<Edge>>,
    pinned: Array<boolean>,
    count: number
}

const MILLISECONDS_PER_SECOND = 1_000

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

    protected canvas: HTMLCanvasElement
    protected ctx: CanvasRenderingContext2D

    protected view: ViewRect
    protected vertices: Vertices
    protected drawIndex = 0
    protected lastAnimationTime = performance.now()

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = canvas.getContext("2d", ClothSim.CONTEXT_SETTINGS) ?? error("Could not create rendering context")

        const ratio = this.canvas.width / this.canvas.height
        if (this.canvas.width > this.canvas.height) {
            this.view = new ViewRect(0, 0, 10 * ratio, 10)
        } else {
            this.view = new ViewRect(0, 0, 10, 10 / ratio)
        }

        // this.vertices = {
        //     count: 2,
        //     pos: [[[0, 1], [0, -1]], [[0, 1], [0, -1]]],
        //     vel: [[[0, 0], [.01, 0]], [[0, 0], [.01, 0]]],
        //     pinned: [true, false],
        //     edges: [[], [{index: 0, dist: 2}]],
        // }

        const vertexColumns = 9
        const vertexRows = 3
        const vertexCount = vertexColumns * vertexRows

        this.vertices = {
            count: vertexCount,
            pos: [new Array(vertexCount), new Array(vertexCount)],
            vel: [new Array(vertexCount), new Array(vertexCount)],
            pinned: new Array(vertexCount),
            edges: new Array(vertexCount),
        }

        for (let y = 0; y < vertexRows; ++y) {
            for (let x = 0; x < vertexColumns; ++x) {
                const index = y * vertexColumns + x
                this.vertices.pos[0][index] = [(x - 4), (y + 2)]
                this.vertices.pos[1][index] = [(x - 4), (y + 2)]
                if (x == 0) {
                    this.vertices.edges[index] = [{ index: index + 1, dist: 1 }]
                    this.vertices.pinned[index] = true
                } else if (x == vertexColumns - 1) {
                    this.vertices.edges[index] = [{ index: index - 1, dist: 1 }]
                    this.vertices.pinned[index] = true
                } else {
                    if (y == vertexRows >> 1) {
                        this.vertices.edges[index] = [{ index: index - 1, dist: 1 }, { index: index + 1, dist: 1 }]
                    } else {
                        this.vertices.edges[index] = [{ index: index - 1, dist: 1 }, { index: index + 1, dist: 1 }]
                    }
                    this.vertices.pinned[index] = false
                }
            }
        }

        for (let i = 0; i < this.vertices.count; ++i) {
            this.vertices.vel[0][i] = [0, 0]
            this.vertices.vel[1][i] = [0, 0]
        }
    }

    public draw() {
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = "black"
        this.ctx.strokeStyle = "black"
        this.ctx.lineWidth = 2

        for (let i = 0; i < this.vertices.count; ++i) {
            const [x, y] = this.canvasOf(i)
            // this.ctx.beginPath()
            // this.ctx.ellipse(x, y, 5, 5, 0, 0, Math.PI * 2)
            // this.ctx.fill()

            for (const edge of this.vertices.edges[i]) {
                if (edge.index < i) {
                    continue
                }
                this.ctx.beginPath()
                this.ctx.moveTo(x, y)
                this.ctx.lineTo(...this.canvasOf(edge.index))
                this.ctx.stroke()
            }
        }
    }

    public animate(now: number) {
        const timeDelta = Math.min(.2, (now - this.lastAnimationTime) / MILLISECONDS_PER_SECOND)
        this.lastAnimationTime = now
        this.simStep(timeDelta)
        this.draw()
        requestAnimationFrame((t) => this.animate(t))
    }

    public resize(width: number, height: number) {
        const widthToHeight = width / height
        this.view.height *= height / this.canvas.height
        this.view.width = this.view.height * widthToHeight

        this.canvas.width = width
        this.canvas.height = height

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

    protected worldToCanvas(x: number, y: number): [number, number] {
        [x, y] = this.view.actualToRelative(x, y)
        return [this.canvas.width * x, this.canvas.height * (1 - y)]
    }

    protected canvasOf(index: number): [number, number] {
        return this.worldToCanvas(...this.posOf(index))
    }

    protected posOf(index: number): [number, number] {
        return this.vertices.pos[this.drawIndex][index]
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

function diff(a: VertexPos, b: VertexPos): [number, number] {
    return [a[0] - b[0], a[1] - b[1]]
}

function len2([x, y]: VertexPos): number {
    return x * x + y * y
}


function initialize(): void {
    const canvas: HTMLCanvasElement = document.querySelector("canvas#main-canvas") ?? error("Could not find main canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const cs = new ClothSim(canvas)
    window.addEventListener("resize", () => cs.resize(window.innerWidth, window.innerHeight))
    document.addEventListener("keypress", (e) => {
        if (e.key == " ") {
            requestAnimationFrame(() => cs.animate(performance.now()))
        }
    })
    requestAnimationFrame(() => cs.animate(performance.now()))
}

window.onload = initialize
