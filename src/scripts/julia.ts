import { error } from "@lib/util"
import FragmentRenderer from "@lib/webgl/fragment"
import { ViewRect, CanvasViewAdapter } from "@lib/webgl/view"

import JULIA_SHADER from "@shader/julia.fs"
import MANDELBROT_SHADER from "@shader/mandelbrot.fs"

const MANDELBROT_CONTEXT_SETTINGS = {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
}

type JuliaConfig = {
    limit: number,
    seed: [number, number],
}

class JuliaRenderer {
    readonly renderer: FragmentRenderer
    readonly adapter: CanvasViewAdapter<HTMLCanvasElement>

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new FragmentRenderer(canvas)
        this.renderer.setShader(JULIA_SHADER)
        this.adapter = new CanvasViewAdapter(new ViewRect(0, 0, 2.0, 2.0), canvas)
    }

    get view(): ViewRect {
        return this.adapter.view
    }
    get canvas(): HTMLCanvasElement {
        return this.adapter.canvas
    }

    draw(config: JuliaConfig) {
        this.renderer.draw({
            uPos: [this.view.minX, this.view.minY],
            uStep: [this.view.width / this.canvas.width, this.view.height / this.canvas.height],
            uLim: config.limit,
            uSeed: config.seed,
        })
    }

    resize(width: number, height: number) {
        this.adapter.resizeCanvas(width, height)
        this.renderer.updateSize()
    }
}

class MandelbrotView {
    readonly canvas: HTMLCanvasElement
    readonly context: CanvasRenderingContext2D
    readonly background: CanvasImageSource
    readonly view: ViewRect = new ViewRect(-.5, 0, 3.3, 2.2)

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.context = this.canvas.getContext("2d", MANDELBROT_CONTEXT_SETTINGS) || error("Failed to get mandelbrot rendering context")
        this.background = new OffscreenCanvas(canvas.width, canvas.height)
        const renderer = new FragmentRenderer(this.background)
        renderer.drawWithShader(
            MANDELBROT_SHADER,
            {
                uLim: 32,
                uPos: [this.view.minX, this.view.minY],
                uStep: [this.view.width / canvas.width, this.view.height / canvas.height],
            }
        )
    }

    draw() {
        this.context.drawImage(this.background, 0, 0)
    }
}


class JuliaView extends HTMLCanvasElement {
    readonly renderer: JuliaRenderer
    readonly config: JuliaConfig = { limit: 32, seed: [0, .7885] }

    constructor() {
        super()

        this.renderer = new JuliaRenderer(this)

        this._setup()
    }

    drawFrame() {
        this.renderer.draw(this.config)
    }

    protected _setup() {
        this.updateViewRatio()
    }

    updateViewRatio() {
        const ratio = this.width / this.height
        this.renderer.view.width = ratio * this.renderer.view.height
    }
}

class JuliaWithMandelbrotMap {
    readonly julia: JuliaView
    readonly mandelbrot: MandelbrotView

    constructor(julia: JuliaView, mandelbrot: HTMLCanvasElement) {
        this.julia = julia
        this.mandelbrot = new MandelbrotView(mandelbrot)
    }

    drawFrame() {
        this.julia.drawFrame()
        this.mandelbrot.draw()
    }

    requestFrame() {
        requestAnimationFrame(() => this.drawFrame())
    }

    resizeAndDraw(width: number, height: number) {
        this.julia.renderer.resize(width, height)
        this.requestFrame()
    }

    static setup() {
        const julia = document.querySelector("#view-julia") as JuliaView
        julia.renderer.resize(window.innerWidth, window.innerHeight)
        julia.renderer.view.height = 2
        julia.updateViewRatio()
    
        const mandelbrot = document.querySelector("canvas#map") as HTMLCanvasElement
        const adapter = new JuliaWithMandelbrotMap(julia, mandelbrot)
    
        window.addEventListener("resize", () => adapter.resizeAndDraw(window.innerWidth, window.innerHeight))
        adapter.requestFrame()
    }
}

customElements.define("julia-view", JuliaView, { extends: "canvas" })
window.addEventListener("load", JuliaWithMandelbrotMap.setup, { once: true })
