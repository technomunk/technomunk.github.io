import { error } from "@lib/util"

type CanvasElement = SVGSVGElement

interface Tool {
    onDown(event: PointerEvent): void
    onMove(event: PointerEvent): void
    onUp(event: PointerEvent): void
    onKey(event: KeyboardEvent): void

    activate(canvas: CanvasElement): void
    deactivate(canvas: CanvasElement): void
}

class SelectTool implements Tool {
    protected pointerId: number | undefined
    protected selection: SVGGraphicsElement | undefined

    activate(canvas: CanvasElement) {
        this.pointerId = undefined
        this.selection = undefined

        for (const child of canvas.getElementsByTagNameNS("http://www.w3.org/2000/svg", "*")) {
            child.style.cursor = "pointer"
        }
    }
    
    deactivate(canvas: CanvasElement) {
        this.deselect()
        for (const child of canvas.getElementsByTagNameNS("http://www.w3.org/2000/svg", "*")) {
            child.style.cursor = ""
        }
    }

    onDown(event: PointerEvent): void {
        this.deselect()
        if (event.target == null || event.target instanceof SVGSVGElement) return
        this.select(event.target as SVGGraphicsElement)
    }
    onMove(event: PointerEvent): void {

    }
    onUp(event: PointerEvent): void {

    }
    onKey(event: KeyboardEvent): void {
        if (event.key == "delete") {
            this.selection?.remove()
        }
    }

    select(element: SVGGraphicsElement) {
        element.setAttribute("tabindex", "0")
        element.style.outline = ".5vmin blue dashed"
        element.style.outlineOffset = ".1vmin"
        element.focus()
        this.selection = element
    }

    deselect() {
        if (!this.selection) return
        this.selection.removeAttribute("tabindex")
        this.selection.style.outline = ""
        this.selection.style.outlineOffset = ""
        this.selection = undefined
    }
}

class RectTool implements Tool {
    readonly canvas: CanvasElement

    protected startX = 0
    protected startY = 0

    protected pointerId: number | undefined
    protected rect: SVGRectElement | undefined

    activate(): void {}
    deactivate(): void {
        if (this.rect && this.pointerId != undefined) {
            this.rect.releasePointerCapture(this.pointerId)
            this.rect = undefined
        }
        this.pointerId = undefined
    }

    constructor(canvas: CanvasElement) {
        this.canvas = canvas
    }

    onDown(event: PointerEvent) {
        if (this.pointerId === undefined) {
            this.canvas.setPointerCapture(event.pointerId)
            this.pointerId = event.pointerId
            this.setupRect(event)
        }

    }
    onMove(event: PointerEvent) {
        if (this.pointerId != event.pointerId) return
        if (this.rect != undefined) {
            const [x, y, w, h] = this.calcRectTo(event)
            this.rect.setAttribute("x", x.toString())
            this.rect.setAttribute("y", y.toString())
            this.rect.setAttribute("width", w.toString())
            this.rect.setAttribute("height", h.toString())
        }

    }
    onUp(event: PointerEvent) {
        if (this.pointerId != event.pointerId) return

        this.canvas.releasePointerCapture(this.pointerId)
        this.pointerId = undefined

        if (this.rect != undefined) {
            const [x, y, w, h] = this.calcRectTo(event)
            this.rect.setAttribute("x", x.toString())
            this.rect.setAttribute("y", y.toString())
            this.rect.setAttribute("width", w.toString())
            this.rect.setAttribute("height", h.toString())
        }
        this.rect = undefined
    }

    onKey(event: KeyboardEvent): void {
        
    }

    calcRectTo(event: PointerEvent): [number, number, number, number] {
        const [ex, ey] = grabEventPosition(event)
        const x = Math.min(ex, this.startX)
        const y = Math.min(ey, this.startY)
        return [x, y, Math.abs(this.startX - ex), Math.abs(this.startY - ey)]
    }

    // TODO:
    // calcSquareTo(event: PointerEvent): [number, number, number] {
    // }

    protected setupRect(event: PointerEvent) {
        this.rect = createRect(this.canvas)
        const [x, y] = grabEventPosition(event)
        this.startX = x
        this.startY = y

        this.rect.setAttribute("x", x.toString())
        this.rect.setAttribute("y", y.toString())
        this.rect.setAttribute("width", "0")
        this.rect.setAttribute("height", "0")
        this.rect.setAttribute("fillStyle", "#000")
    }
}

class SVGEditor extends HTMLElement {
    canvas: CanvasElement

    tools: { [key: string]: Tool }
    activeTool: Tool

    constructor() {
        super()

        this.canvas = this.querySelector("svg#canvas") as CanvasElement
        this.tools = {
            "select": new SelectTool(),
            "rect": new RectTool(this.canvas),
        }
        this.activeTool = this.tools["rect"]

        this._setupControls()

        const image = localStorage.getItem("svg-image")
        if (image) {
            this.canvas.innerHTML = image
        }
    
        this.canvas.setAttribute("viewBox", `0 0 ${this.canvas.clientWidth} ${this.canvas.viewBox}`)
        this.canvas.addEventListener("resize", () => {
            this.canvas.setAttribute("viewBox", `0 0 ${this.canvas.clientWidth} ${this.canvas.viewBox}`)
        })
    }

    _setupControls() {
        this.canvas.addEventListener("pointerdown", e => this._handlePointerDown(e))
        this.canvas.addEventListener("pointermove", e => this._handlePointerMove(e))
        this.canvas.addEventListener("pointerup", e => this._handlePointerUp(e))

        window.addEventListener("keydown", e => {
            let newTool: Tool | undefined
            switch (e.key) {
                case "s":
                    newTool = this.tools["select"]
                    break
                case "r":
                    newTool = this.tools["rect"]
                    break
            }
            if (newTool && newTool != this.activeTool) {
                this.activeTool.deactivate(this.canvas)
                this.activeTool = newTool
                this.activeTool.activate(this.canvas)
            }
        })
    }

    _handlePointerDown(event: PointerEvent) {
        this.activeTool.onDown(event)
    }
    _handlePointerMove(event: PointerEvent) {
        this.activeTool.onMove(event)
    }
    _handlePointerUp(event: PointerEvent) {
        this.activeTool.onUp(event)
        localStorage.setItem("svg-image", this.canvas.innerHTML)
    }
}

function grabEventPosition(event: PointerEvent): [number, number] {
    return [event.offsetX, event.offsetY]
}

function getSVGCanvas(element: CanvasElement | SVGGraphicsElement): SVGElement {
    return element.ownerSVGElement || element
}

function createRect(canvas: SVGElement): SVGRectElement {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    canvas.appendChild(rect)
    return rect
}

customElements.define("svg-editor", SVGEditor)
