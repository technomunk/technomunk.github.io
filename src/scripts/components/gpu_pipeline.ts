import { error } from "@lib/util"

type CanvasWithContext = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

class GPUPipeline extends HTMLElement {
    vertices: Array<[number, number]> = [[-.5, -.5], [0, .5], [.5, -.5]]

    vertex: CanvasWithContext
    primitive: CanvasWithContext
    raster: CanvasWithContext
    fragment: CanvasWithContext

    pointSize = 8
    pixelSize = 8

    constructor() {
        super()

        this.vertex = this._setupCanvas("vertex")
        this.primitive = this._setupCanvas("primitive")
        this.raster = this._setupCanvas("raster")
        this.fragment = this._setupCanvas("fragment")

        this.draw()
    }

    draw() {
        this._drawVertex()
        this._drawPrimitive()
        this._drawRaster()
        this._drawFragment()
    }

    _setupCanvas(canvas_id: string): CanvasWithContext {
        const canvas = this.querySelector(`canvas#${canvas_id}`) as HTMLCanvasElement
        const context = canvas.getContext("2d") || error(`Could not get context for canvas#${canvas_id}`)
        context.fillStyle = "black"
        context.strokeStyle = "black"
        return { canvas, context }
    }

    _drawVertex() {
        for (const [rx, ry] of this.vertices) {
            const [x, y] = relativeToElement(rx, ry, this.vertex.canvas)
            this.vertex.context.beginPath()
            this.vertex.context.ellipse(x, y, this.pointSize, this.pointSize, 0, 0, 2 * Math.PI)
            this.vertex.context.fill()
        }
    }

    _drawPrimitive() {
        for (let i = 0; i < this.vertices.length; ++i) {
            const [x1, y1] = relativeToElement(...this.vertices[i], this.primitive.canvas)
            const [x2, y2] = relativeToElement(...this.vertices[(i + 1) % this.vertices.length], this.primitive.canvas)

            this.primitive.context.beginPath()
            this.primitive.context.moveTo(x1, y1)
            this.primitive.context.lineTo(x2, y2)
            this.primitive.context.stroke()
        }
    }

    _drawRaster() {
        for (let y = 0; y < this.raster.canvas.height; y += this.pixelSize) {
            for (let x = 0; x < this.raster.canvas.width; x += this.pixelSize) {
                const [rx, ry] = elementToRelative(x + this.pixelSize / 2, y + this.pixelSize / 2, this.raster.canvas)
                if (isInsideTriangle(rx, ry, this.vertices)) {
                    this.raster.context.beginPath()
                    this.raster.context.rect(x, y, this.pixelSize, this.pixelSize)
                    this.raster.context.fill()
                }
            }
        }
    }

    _drawFragment(colorFn: (x: number, y: number) => string = uv) {
        for (let y = 0; y < this.fragment.canvas.height; y += this.pixelSize) {
            for (let x = 0; x < this.fragment.canvas.width; x += this.pixelSize) {
                const [rx, ry] = elementToRelative(x + this.pixelSize / 2, y + this.pixelSize / 2, this.fragment.canvas)
                if (isInsideTriangle(rx, ry, this.vertices)) {
                    this.fragment.context.fillStyle = colorFn(rx, ry)
                    this.fragment.context.beginPath()
                    this.fragment.context.rect(x, y, this.pixelSize, this.pixelSize)
                    this.fragment.context.fill()
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
function relativeToElement(x: number, y: number, element: HTMLElement): [number, number] {
    const rect = element.getBoundingClientRect()
    return [(x + 1) / 2 * rect.width, (1 - y) / 2 * rect.height]
}

function elementToRelative(x: number, y: number, element: HTMLCanvasElement): [number, number] {
    const rect = element.getBoundingClientRect()
    return [x / rect.width * 2 - 1, 1 - y / rect.height * 2]
}

function uv(x: number, y: number): string {
    return `rgb(${x * 255}, ${y * 255}, 255)`
}

customElements.define("gpu-pipeline", GPUPipeline)
