import ImageGenerator from "./imggpu";
import mandelShader from "bundle-text:/src/shaders/mandel.fs"
import { GestureDecoder } from "./gesture";

export default class MandelMap {
    background?: CanvasImageSource
    onSelect?: (coord: [number, number]) => void
    crossSize: number = 12

    private canvas: HTMLCanvasElement
    private drawContext: CanvasRenderingContext2D
    private scale: number
    private generator: ImageGenerator
    private allowSelection: boolean

    constructor(canvas: HTMLCanvasElement, scale: number = 1.2) {
        this.canvas = canvas
        this.drawContext = canvas.getContext("2d", { alpha: false, desynchronized: true, willReadFrequently: true })!
        this.scale = scale
        this.drawContext.strokeStyle = 'blue'
        this.drawContext.lineWidth = 1.5
        this.generator = new ImageGenerator()
        this.generateBackground()
        this.allowSelection = false

        this.canvas.addEventListener("pointerdown", () => this.allowSelection = true)
        this.canvas.addEventListener("pointermove", event => this.handleMove(event))
        this.canvas.addEventListener("pointerup", event => { this.handleMove(event); this.allowSelection = false })
    }

    draw(coords?: [number, number]) {
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

    private handleMove(event: PointerEvent) {
        if (!this.allowSelection || !this.onSelect) {
            return
        }
        const rect = this.canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        this.onSelect(this.canvasToComplex([x, y]))
    }

    private complexToCanvas(coords: [number, number]): [number, number] {
        const ratio = this.canvas.width / this.canvas.height
        const left = -ratio * this.scale, width = ratio * 2 * this.scale
        const top = this.scale, height = 2 * this.scale
        const nx = (coords[0] - left) / width
        const ny = (top - coords[1]) / height
        return [nx * this.canvas.width, ny * this.canvas.height]
    }

    private canvasToComplex(coords: [number, number]): [number, number] {
        const nx = coords[0] / this.canvas.width
        const ny = coords[1] / this.canvas.height
        const ratio = this.canvas.width / this.canvas.height
        const left = -ratio * this.scale, width = ratio * 2 * this.scale
        const top = this.scale, height = 2 * this.scale

        return [left + nx * width, top - ny * height]
    }

    private generateBackground() {
        const ratio = this.canvas.width / this.canvas.height
        this.background = this.generator.draw(
            mandelShader,
            this.canvas.width,
            this.canvas.height,
            {
                uLim: 64,
                uPos: [0, 0],
                uDims: [ratio * this.scale, this.scale],
            },
        )
    }
}
