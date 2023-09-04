import ImageGenerator from "./imggpu"
import { error } from "./util"

const mandelShader = require('../../shader/mandel.fs')

export default class MandelMap {
    background?: CanvasImageSource
    onSelect?: (coord: [number, number]) => void
    crossSize = 12
    viewRect: DOMRect = new DOMRect(-1.3, -1.1, 2.2, 2.2)

    private canvas: HTMLCanvasElement
    private drawContext: CanvasRenderingContext2D
    private generator: ImageGenerator

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.drawContext = canvas.getContext("2d", { alpha: false, desynchronized: true, willReadFrequently: true }) ?? error("Could not get draw context")
        this.drawContext.strokeStyle = 'blue'
        this.drawContext.lineWidth = 1.5

        this.viewRect.x *= canvas.width / canvas.height
        this.viewRect.width *= canvas.width / canvas.height

        this.generator = new ImageGenerator()
        this.generateBackground()

        this.canvas.addEventListener("pointerdown", event => this.handlePointer(event))
        this.canvas.addEventListener("pointermove", event => this.handlePointer(event))
        this.canvas.addEventListener("pointerup", event => this.handlePointer(event))
    }

    draw(coords?: [number, number]): void {
        if (this.background) {
            this.drawContext.drawImage(this.background, 0, 0)
        }
        if (coords) {
            const [x, y] = this.complexToCanvas(coords)
            this.drawContext.beginPath()
            this.drawContext.moveTo(x, y - this.crossSize)
            this.drawContext.lineTo(x, y + this.crossSize)
            this.drawContext.moveTo(x - this.crossSize, y)
            this.drawContext.lineTo(x + this.crossSize, y)
            this.drawContext.stroke()

        }
    }

    private handlePointer(event: PointerEvent) {
        if (!this.onSelect || event.pressure < .1)
            return
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        this.onSelect(this.canvasToComplex([x, y]))
    }

    private complexToCanvas(coords: [number, number]): [number, number] {
        const nx = (coords[0] - this.viewRect.left) / this.viewRect.width
        const ny = (this.viewRect.bottom - coords[1]) / this.viewRect.height
        return [nx * this.canvas.width, ny * this.canvas.height]
    }

    private canvasToComplex(coords: [number, number]): [number, number] {
        const nx = coords[0] / this.canvas.width
        const ny = coords[1] / this.canvas.height

        return [this.viewRect.left + nx * this.viewRect.width, this.viewRect.bottom - ny * this.viewRect.height]
    }

    private generateBackground() {
        this.background = this.generator.draw(
            mandelShader,
            this.canvas.width,
            this.canvas.height,
            {
                uLim: 64,
                uPos: [this.viewRect.left, this.viewRect.top],
                uStep: [this.viewRect.width / this.canvas.width, this.viewRect.height / this.canvas.height],
            },
        )
    }
}
