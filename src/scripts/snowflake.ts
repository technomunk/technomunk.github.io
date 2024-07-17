import { Choice, error } from "@lib/util"

class SnowflakeGenerator {
    static CONTEXT_SETTINGS: CanvasRenderingContext2DSettings = {
        alpha: false,
        willReadFrequently: false,
    }
    static DIRECTIONS: Choice<[number, number]> = new Choice(
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    )
    readonly ctx: CanvasRenderingContext2D
    readonly octx: OffscreenCanvasRenderingContext2D

    protected _x: number
    protected _y: number

    protected _deposited = 0

    protected _image: ImageData

    constructor(canvas: HTMLCanvasElement, width: number = 255, height: number = 255) {
        this.ctx = canvas.getContext("2d", SnowflakeGenerator.CONTEXT_SETTINGS) || error("Couldn't set up drawing")
        this.ctx.imageSmoothingEnabled = false
        this.octx = new OffscreenCanvas(width, height).getContext("2d", SnowflakeGenerator.CONTEXT_SETTINGS) || error("Couldn't set up drawing")
        this._image = this.octx.createImageData(width, height)
        this._x = Math.round(this._image.width / 2)
        this._y = Math.round(this._image.height / 2)

        this._depositParticle()
    }

    loop() {
        this._updateParticle()
        this._draw()
        if (this._deposited < this._image.width * this._image.height * .5) {
            requestAnimationFrame(() => this.loop())
        }
    }

    protected _draw() {
        this.octx.putImageData(this._image, 0, 0)
        const ratio = Math.floor(Math.min(this.ctx.canvas.width / this._image.width, this.ctx.canvas.height / this._image.height))
        this.ctx.drawImage(
            this.octx.canvas,
            this.ctx.canvas.width / 2 - this._image.width * ratio / 2,
            this.ctx.canvas.height / 2 - this._image.height * ratio / 2,
            this._image.width * ratio,
            this._image.height * ratio,
        )
    }

    /** Deposit the current particle into the snowflake and set up a new one */
    protected _depositParticle() {
        this._drawPixel(this._x, this._y, 255, 255, 255)
        this._deposited += 1
        this._newParticle()
    }

    protected _drawPixel(x: number, y: number, r: number, g: number, b: number) {
        const index = this._image.width * 4 * y + 4 * x
        this._image.data[index + 0] = r
        this._image.data[index + 1] = g
        this._image.data[index + 2] = b
        this._image.data[index + 3] = 255
    }

    protected _isSnow(x: number, y: number) {
        const index = this._image.width * 4 * y + 4 * x
        return this._image.data[index] > 100
    }

    protected _newParticle() {
        do {
            this._x = Math.floor(Math.random() * this._image.width)
            this._y = Math.floor(Math.random() * this._image.height)
        } while (this._isSnow(this._x, this._y))
    }

    protected _updateParticle() {
        const [dx, dy] = SnowflakeGenerator.DIRECTIONS.random()
        const nx = this._x + dx
        const ny = this._y + dy

        if (nx < 0 || nx >= this._image.width || ny < 0 || nx >= this._image.height) {
            return
        }

        if (this._isSnow(nx, ny)) {
            this._depositParticle()
        } else {
            this._drawPixel(this._x, this._y, 0, 0, 0)
            this._x = nx
            this._y = ny
            this._drawPixel(this._x, this._y, 255, 255, 255)
        }
    }
}

function setup() {
    const canvas = document.querySelector("canvas#snow") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const g = new SnowflakeGenerator(canvas, 16, 16)
    g.loop()
}

window.addEventListener("load", setup, { once: true })
