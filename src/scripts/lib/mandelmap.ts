import { generate_image } from "./imggpu";

export class MandelMap {
    background?: CanvasImageSource;
    crossSize: number = 12;

    private canvas: HTMLCanvasElement;
    private drawContext: CanvasRenderingContext2D;
    private scale: number;

    constructor (canvas: HTMLCanvasElement, scale: number = 1.2) {
        this.canvas = canvas
        this.drawContext = canvas.getContext("2d", {alpha: false, desynchronized: true, willReadFrequently: true})!
        this.scale = scale
        this.drawContext.strokeStyle = 'blue'
        this.drawContext.lineWidth = 1.5
        this.generateBackground()
    }

    draw(coords?: [number, number]) {
        if (this.background) {
            this.drawContext.drawImage(this.background, 0, 0)
        }
        if (coords) {
            const [x, y] = this.mapCoords(coords)
            this.drawContext.beginPath()
            this.drawContext.moveTo(x, y - this.crossSize)
            this.drawContext.lineTo(x, y + this.crossSize)
            this.drawContext.moveTo(x - this.crossSize, y)
            this.drawContext.lineTo(x + this.crossSize, y)
            this.drawContext.stroke()
        }
    }

    private mapCoords(coords: [number, number]): [number, number] {
        const ratio = this.canvas.width / this.canvas.height
        const left = -ratio * this.scale, width = ratio * 2 * this.scale
        const top = -this.scale, height = 2 * this.scale
        return [(coords[0] - left) / width * this.canvas.width, this.canvas.height - (coords[1] - top) / height * this.canvas.height]

    }

    private generateBackground() {
        const ratio = this.canvas.width / this.canvas.height
        generate_image(
            "mandel",
            this.canvas.width,
            this.canvas.height,
            {
                uLim: 64,
                uPos: [0, 0],
                uDims: [ratio * this.scale, this.scale],
            }
            )
            .then(img => {this.background = img})
    }
}
