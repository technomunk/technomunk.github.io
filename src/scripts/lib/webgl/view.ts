/** A view rectangle of something. The x and y coordinates refer to the center point. */
export class ViewRect {
    x: number
    y: number
    width: number
    height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    public get minX(): number {
        return this.x - this.width / 2
    }

    public get maxX(): number {
        return this.x + this.width / 2
    }

    public get minY(): number {
        return this.y - this.height / 2
    }

    public get maxY(): number {
        return this.y + this.height / 2
    }

    /** Convert normalized (relative) coordinate to actual ones at that point in view
     * @param x horizontal coordinate (left to right)
     * @param y vertical coordinate (top to bottom)
     */
    public relativeToActual(x: number, y: number): [number, number] {
        return [(x - .5) * this.width, (.5 - y) * this.height]
    }

    /** Convert actual coordinates to normalized (relative) to this view
     * @param x horizontal coordinate
     * @param y vertical coordinate
     * @returns normalized coordinates relative to top left corner of the view
     */
    public actualToRelative(x: number, y: number): [number, number] {
        return [(x - this.x) / this.width + .5, .5 + (y - this.y) / this.height]
    }
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas

/** Helper class for connecting a canvas with a view-rect */
export class CanvasViewAdapter<TCanvas extends AnyCanvas> {
    readonly view: ViewRect
    readonly canvas: TCanvas

    constructor(view: ViewRect, canvas: TCanvas) {
        this.view = view
        this.canvas = canvas
    }
    /** Convert pixel (canvas screen) coordinates to underlying view coordinates.
         * @param x the horizontal coordinate (left to right)
         * @param y the vertical coordinate (top to bottom)
         * @returns [x, y]
         */
    pixelToCoord(x: number, y: number): [number, number] {
        return this.view.relativeToActual(x / this.canvas.width, y / this.canvas.height)
    }

    /** Convert underlying view coordinates to pixel (canvas screen) coordinates.
     * @param x the horizontal coordinate 
     * @param y the vertical coordinate
     */
    coordToPixel(x: number, y: number): [number, number] {
        const [nx, ny] = this.view.actualToRelative(x, y)
        return [this.canvas.width * nx, this.canvas.height * ny]
    }

    /** Resize the renderer and the canvas to provided pixel counts.
     * @param width of the resulting canvas.
     * @param height of the resulting canvas.
     */
    resizeCanvas(width: number, height: number) {
        const widthToHeight = width / height
        this.view.height *= height / this.canvas.height
        this.view.width = this.view.height * widthToHeight
        this.canvas.width = width
        this.canvas.height = height
    }

    /** Pan the image provide number of pixels to the side.
     * @param dx horizontal number of pixels the image should be shifted by.
     * @param dy vertical number of pixels the image should be shifted by.
     */
    pan(dx: number, dy: number) {
        const rx = dx / this.canvas.width * this.view.width
        const ry = dy / this.canvas.height * this.view.height
        this.view.x -= rx
        this.view.y += ry
    }

    /** Scale the rendered image by provided proportion around the provided pixel.
     * @param x horizontal index of the pixel around which to scale.
     * @param y vertical index of the pixel around which to scale.
     * @param scale the multiplier of the width and height of the complex plane being rendered.
     */
    zoom(x: number, y: number, scale: number) {
        this.view.x += (x / this.canvas.width - .5) * (this.view.width - this.view.width * scale)
        this.view.y += (.5 - y / this.canvas.height) * (this.view.height - this.view.height * scale)
        this.view.width *= scale
        this.view.height *= scale
    }
}
