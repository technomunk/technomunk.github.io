import { clamp, error, setCanvasSize } from "@lib/util"

type CanvasWithContext = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

const ANIMATION_TIME = 1_000
const ZOOM_FACTOR = 4

class PatternCreator extends HTMLElement {
    mainElement: HTMLElement
    background: CanvasWithContext
    canvas: CanvasWithContext
    color: HTMLInputElement
    saveLink: HTMLLinkElement

    pointerId: number | undefined
    rectStart: [number, number] | undefined
    history: Array<ImageData>
    historyIndex = -1

    zoomStart = 0
    zoomingOut = true

    constructor() {
        super()

        this.background = setupCanvas("background")
        this.canvas = setupCanvas("main")
        this.mainElement = this.querySelector("div#main") as HTMLDivElement
        this.color = this.querySelector("input#color") as HTMLInputElement
        this.saveLink = this.querySelector("a#save") as HTMLLinkElement
        this.canvas.context.fillStyle = this.color.value
        this.history = []
        this.setupControls()

        loadCookieToCanvas(this.canvas.context, () => {
            this.drawBackground()
            this.pushHistory()
        })

        window.addEventListener("resize", () => {
            const image = this.grabCanvasImage()
            setCanvasSize(this.canvas.canvas, this.canvas.canvas.clientWidth, this.canvas.canvas.clientHeight)
            setCanvasSize(this.background.canvas, this.background.canvas.clientWidth, this.background.canvas.clientHeight)
            this.canvas.context.putImageData(image, 0, 0)
            this.drawBackground()
            this.canvas.context.fillStyle = this.color.value
        })
    }

    setupControls() {
        this.canvas.canvas.addEventListener("pointerdown", e => {
            e.preventDefault()
            this.canvas.canvas.setPointerCapture(e.pointerId)
            this.pointerId = e.pointerId
            this.rectStart = eventCoords(e)
        })
        this.canvas.canvas.addEventListener("pointermove", e => {
            if (e.pointerId == this.pointerId) {
                e.preventDefault()
                if (this.rectStart) {
                    this.drawRect(e)
                }
            }
        })
        this.canvas.canvas.addEventListener("pointerup", e => {
            if (e.pointerId == this.pointerId) {
                this.drawRect(e)
                this.pushHistory()
                saveCanvasToCookie(this.canvas.canvas)
                this.rectStart = undefined
                this.pointerId = undefined
            }
        })

        this.color.addEventListener("change", e => {
            e.preventDefault()
            this.canvas.context.fillStyle = this.color.value
        })

        const saveButton = this.querySelector("button#save") as HTMLButtonElement
        saveButton.addEventListener("click", () => this.save())

        const clearButton = this.querySelector("button#clear") as HTMLButtonElement
        clearButton.addEventListener("click", () => {
            this.canvas.context.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
            this.pushHistory()
            this.drawBackground()
        })

        const zoomButton = this.querySelector("button#zoom") as HTMLButtonElement
        zoomButton.addEventListener("click", () => this.toggleZoom())

        window.addEventListener("keydown", e => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case "z":
                        this.undo()
                        break
                    case "y":
                        this.redo()
                        break
                }
            }
        })
    }

    undo() {
        this.historyIndex = Math.max(-1, this.historyIndex - 1)
        this.redraw()
    }

    redo() {
        this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1)
        this.redraw()
    }

    pushHistory() {
        if (++this.historyIndex == this.history.length) {
            this.history.push(this.grabCanvasImage())
        } else {
            this.history[this.historyIndex] = this.grabCanvasImage()
        }
    }

    save() {
        let data = this.canvas.canvas.toDataURL()
        this.saveLink.setAttribute("download", "kernel.png")
        this.saveLink.href = data
        this.saveLink.click()
        data = this.background.canvas.toDataURL()
        this.saveLink.setAttribute("download", "pattern.png")
        this.saveLink.href = data
        this.saveLink.click()
    }

    redraw() {
        if (this.historyIndex == -1) {
            this.canvas.context.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
        } else {
            this.canvas.context.putImageData(this.history[this.historyIndex], 0, 0)
        }

        this.drawBackground()
    }

    drawRect(event: PointerEvent) {
        let [x, y] = eventCoords(event)
        x = clamp(x, 0, this.canvas.canvas.width)
        y = clamp(y, 0, this.canvas.canvas.height)

        let w = x - this.rectStart![0]
        let h = y - this.rectStart![1]

        if (event.shiftKey) {
            w = h = Math.min(w, h)
        }

        if (this.historyIndex == -1) {
            this.canvas.context.clearRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
        } else {
            this.canvas.context.putImageData(this.history[this.historyIndex], 0, 0)
        }
        this.canvas.context.fillRect(...this.rectStart!, w, h)
        this.drawBackground()
    }

    grabCanvasImage(): ImageData {
        return this.canvas.context.getImageData(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
    }

    toggleZoom() {
        const now = performance.now()
        if (now - this.zoomStart > ANIMATION_TIME) {
            this.zoomStart = performance.now()
        }
        if (this.zoomingOut) {
            this.zoomingOut = false
            requestAnimationFrame(() => this.zoomOut())
        } else {
            this.zoomingOut = true
            this.mainElement.hidden = false
            requestAnimationFrame(() => this.zoomIn())
        }
    }

    zoomIn() {
        if (!this.zoomingOut) return
        const now = performance.now()
        const t = clamp((now - this.zoomStart) / ANIMATION_TIME)
        const zoomFactor = 1 + (1 - t) * (ZOOM_FACTOR - 1)

        this.mainElement.style.opacity = t.toString()
        this.drawBackground(zoomFactor)
        
        if (t < 1) {
            requestAnimationFrame(() => this.zoomIn())
        }
    }
    
    zoomOut() {
        if (this.zoomingOut) return
        const now = performance.now()
        const t = clamp((now - this.zoomStart) / ANIMATION_TIME)
        const zoomFactor = 1 + t * (ZOOM_FACTOR - 1)

        this.mainElement.style.opacity = (1 - t).toString()
        this.drawBackground(zoomFactor)

        if (t < 1) {
            requestAnimationFrame(() => this.zoomOut())
        } else {
            this.mainElement.hidden = true
        }
    }

    drawBackground(zoom = 1) {
        const image = (zoom == 1) ? this.grabCanvasImage() : undefined

        const cw = this.canvas.canvas.width
        const ch = this.canvas.canvas.height
        const offsetX = cw - ((this.background.canvas.width - cw) / 2) % cw
        const offsetY = ch - ((this.background.canvas.height - ch) / 2) % ch

        this.background.context.clearRect(0, 0, this.background.canvas.width, this.background.canvas.height)

        for (let y = -offsetY; y < this.background.canvas.height; y += ch / zoom) {
            for (let x = -offsetX; x < this.background.canvas.width; x += cw / zoom) {
                if (zoom == 1) {
                    this.background.context.putImageData(image!, x, y)
                } else {
                    this.background.context.drawImage(this.canvas.canvas, x, y, cw / zoom, ch / zoom)
                }
            }
        }
    }
}

function setupCanvas(id: string): CanvasWithContext {
    const canvas = document.querySelector(`canvas#${id}`) as HTMLCanvasElement
    setCanvasSize(canvas, canvas.clientWidth, canvas.clientHeight)
    const context = canvas.getContext("2d") || error("Couldn't setup 2d context")
    context.fillStyle = "black"
    return { canvas, context }
}

function eventCoords(event: PointerEvent): [number, number] {
    return [event.offsetX * window.devicePixelRatio, event.offsetY * window.devicePixelRatio]
}

function saveCanvasToCookie(canvas: HTMLCanvasElement) {
    localStorage.setItem("pattern-image", canvas.toDataURL())
}

function loadCookieToCanvas(context: CanvasRenderingContext2D, onload?: () => void) {
    const data = localStorage.getItem("pattern-image")
    if (!data) return false
    const image = new Image()
    image.src = data
    image.onload = () => {
        context.drawImage(image, 0, 0)
        onload && onload()
    }
}

customElements.define("pattern-creator", PatternCreator)
