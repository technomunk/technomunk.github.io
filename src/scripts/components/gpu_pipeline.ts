import { makeSVGMovable } from "@lib/draggable"
import { error, setCanvasSize } from "@lib/util"

type CanvasWithContext = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}
type Vertex = [number, number]

class GPUPipeline extends HTMLElement {
    vertex: SVGElement
    primitive: CanvasWithContext
    raster: CanvasWithContext
    fragment: CanvasWithContext

    pixelSize = 8

    constructor() {
        super()

        this.vertex = this._setupVertexControls()
        this.primitive = this._setupCanvas("primitive")
        this.raster = this._setupCanvas("raster")
        this.fragment = this._setupCanvas("fragment")

        window.addEventListener("load", () => this.resizeCanvases())
        window.addEventListener("resize", () => this.resizeCanvases())
    }

    resizeCanvases() {
        setCanvasSize(this.primitive.canvas, this.vertex.clientWidth, this.vertex.clientHeight)
        setCanvasSize(this.raster.canvas, this.vertex.clientWidth, this.vertex.clientHeight)
        setCanvasSize(this.fragment.canvas, this.vertex.clientWidth, this.vertex.clientHeight)
        console.log("resizing")
        this.draw()
    }

    draw() {
        const vertices = this._collectVertices()
        this._drawLines(vertices)
        this._drawPixels(vertices)
    }

    _setupVertexControls(): SVGElement {
        const vertex = this.querySelector("svg") || error("Could not find vertices element") 
        for (const child of vertex.querySelectorAll("circle")) {
            makeSVGMovable(child, () => this.draw())
        }
        return vertex
    }

    _setupCanvas(canvas_id: string): CanvasWithContext {
        const canvas = this.querySelector(`canvas#${canvas_id}`) as HTMLCanvasElement
        const context = canvas.getContext("2d") || error(`Could not get context for canvas#${canvas_id}`)
        return { canvas, context }
    }

    _collectVertices(): Array<Vertex> {
        const vertices: Array<Vertex> = []
        for (const child of this.vertex.children) {
            vertices.push([parseFloat(child.getAttribute("cx") || "0"), parseFloat(child.getAttribute("cy") || "0")])
        }
        return vertices
    }

    _drawLines(vertices: Array<Vertex>) {
        this.primitive.context.clearRect(0, 0, this.primitive.canvas.width, this.primitive.canvas.height)
        this.primitive.context.strokeStyle = "black"
        for (let i = 0; i < vertices.length; ++i) {
            const [x1, y1] = relativeToCanvas(...vertices[i], this.primitive.canvas)
            const [x2, y2] = relativeToCanvas(...vertices[(i + 1) % vertices.length], this.primitive.canvas)
            
            this.primitive.context.beginPath()
            this.primitive.context.moveTo(x1, y1)
            this.primitive.context.lineTo(x2, y2)
            this.primitive.context.stroke()
        }
    }
    
    _drawPixels(vertices: Array<Vertex>, colorFn: (x: number, y: number) => string = uv) {
        this.raster.context.clearRect(0, 0, this.raster.canvas.width, this.raster.canvas.height)
        this.raster.context.strokeStyle = "#666"
        this.fragment.context.clearRect(0, 0, this.fragment.canvas.width, this.fragment.canvas.height)

        const [minRX, minRY, maxRX, maxRY] = minmax(vertices)
        const [minX, minY] = relativeToCanvas(minRX, minRY, this.raster.canvas)
        const [maxX, maxY] = relativeToCanvas(maxRX, maxRY, this.raster.canvas)

        for (let y = minY - minY % this.pixelSize; y < maxY; y += this.pixelSize) {
            for (let x = minX - minX % this.pixelSize; x < maxX; x += this.pixelSize) {
                const [rx, ry] = canvasToRelative(x + this.pixelSize / 2, y + this.pixelSize / 2, this.raster.canvas)
                if (isInsideTriangle(rx, ry, vertices)) {
                    this.raster.context.strokeRect(x, y, this.pixelSize, this.pixelSize)

                    this.fragment.context.fillStyle = colorFn(rx, ry)
                    this.fragment.context.fillRect(x, y, this.pixelSize, this.pixelSize)
                }
            }
        }
    }
    
    _drawFragment(vertices: Array<Vertex>, colorFn: (x: number, y: number) => string = uv) {
        this.fragment.context.clearRect(0, 0, this.primitive.canvas.width, this.primitive.canvas.height)
        for (let y = 0; y < this.fragment.canvas.height; y += this.pixelSize) {
            for (let x = 0; x < this.fragment.canvas.width; x += this.pixelSize) {
                const [rx, ry] = canvasToRelative(x + this.pixelSize / 2, y + this.pixelSize / 2, this.fragment.canvas)
                if (isInsideTriangle(rx, ry, vertices)) {
                }
            }
        }
    }
}

function isInsideTriangle(x: number, y: number, triangle: Array<[number, number]>): boolean {
    const [x1, y1] = triangle[0]
    const [x2, y2] = triangle[1]
    const [x3, y3] = triangle[2]

    const b1 = (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2) > 0
    const b2 = (x - x3) * (y2 - y3) - (x2 - x3) * (y - y3) > 0
    const b3 = (x - x1) * (y3 - y1) - (x3 - x1) * (y - y1) > 0

    return b1 === b2 && b2 === b3
}

function relativeToCanvas(x: number, y: number, canvas: HTMLCanvasElement): [number, number] {
    return [x * canvas.width, y * canvas.height]
}

function canvasToRelative(x: number, y: number, canvas: HTMLCanvasElement): [number, number] {
    return [x / canvas.width, y / canvas.height]
}

function minmax(vertices: Array<Vertex>): [number, number, number, number] {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of vertices) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
    }
    return [minX, minY, maxX, maxY]
}

function uv(x: number, y: number): string {
    return `rgb(${x * 255}, ${y * 255}, 255)`
}

customElements.define("gpu-pipeline", GPUPipeline)
