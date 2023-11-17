import { clamp, error, setCanvasSize } from "@lib/util"

type CanvasWithContext = {
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D
}

class PatternCreator {
    background: CanvasWithContext
    canvas: CanvasWithContext
    color: HTMLInputElement
    saveButton: HTMLButtonElement
    saveLink: HTMLLinkElement

    pointerId: number | undefined
    rectStart: [number, number] | undefined
    lastImage: ImageData

    constructor() {
        this.background = setupCanvas("background")
        this.canvas = setupCanvas("main")
        this.color = document.querySelector("input#color") as HTMLInputElement
        this.saveButton = document.querySelector("button#save") as HTMLButtonElement
        this.saveLink = document.querySelector("a#save") as HTMLLinkElement
        this.canvas.context.fillStyle = this.color.value
        this.lastImage = this.grabCanvasImage()
        this.setupControls()

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
            this.lastImage = this.grabCanvasImage()
            this.rectStart = eventCoords(e)
        })
        this.canvas.canvas.addEventListener("pointermove", e => {
            if (e.pointerId == this.pointerId) {
                e.preventDefault()
                if (this.rectStart) {
                    let [x, y] = eventCoords(e)
                    x = clamp(x, 0, this.canvas.canvas.width)
                    y = clamp(y, 0, this.canvas.canvas.height)
                    this.drawRect(x, y)
                }
            }
        })
        this.canvas.canvas.addEventListener("pointerup", e => {
            if (e.pointerId == this.pointerId) {
                this.drawRect(...eventCoords(e))
                this.lastImage = this.grabCanvasImage()
                this.rectStart = undefined
                this.pointerId = undefined
            }
        })

        this.color.addEventListener("change", e => {
            e.preventDefault()
            this.canvas.context.fillStyle = this.color.value
        })

        this.saveButton.addEventListener("click", () => this.save())
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

    drawRect(x: number, y: number) {
        this.canvas.context.putImageData(this.lastImage, 0, 0)
        this.canvas.context.fillRect(...this.rectStart!, x - this.rectStart![0], y - this.rectStart![1])

        this.drawBackground()
    }

    grabCanvasImage(): ImageData {
        return this.canvas.context.getImageData(0, 0, this.canvas.canvas.width, this.canvas.canvas.height)
    }

    drawBackground() {
        const image = this.grabCanvasImage()

        console.log(Math.floor(this.background.canvas.width / image.width))

        const offsetX = image.width - ((this.background.canvas.width - image.width) / 2) % image.width
        const offsetY = image.height - ((this.background.canvas.height - image.height) / 2) % image.height

        for (let y = -offsetY; y < this.background.canvas.height; y += image.height) {
            for (let x = -offsetX; x < this.background.canvas.width; x += image.width) {
                this.background.context.putImageData(image, x, y)
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

window.onload = () => {
    new PatternCreator()
}
