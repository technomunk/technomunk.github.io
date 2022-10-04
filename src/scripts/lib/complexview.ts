import ViewRect from "./viewrect"

export type DrawConfigValue = number | [number, number] | [number, number, number] | [number, number, number, number]
export type DrawConfig = {
    [key: string]: DrawConfigValue
}

export default abstract class ComplexPlaneView extends HTMLCanvasElement {
	/** The region of the complex plane being rendered. */
	view: ViewRect = new ViewRect(0, 0, 2, 2)

	constructor(view?: ViewRect) {
		super()
		if (view) {
			this.view = view
		}
	}

	abstract draw(): void

	/** Convert pixel (canvas screen) coordinates to underlying view coordinates.
	 * @param x the horizontal coordinate (left to right)
	 * @param y the vertical coordinate (top to bottom)
	 * @returns [x, y]
	 */
	pixelToCoord(x: number, y: number): [number, number] {
		return this.view.relativeToActual(x / this.width, y / this.height)
	}

	/** Convert underlying view coordinates to pixel (canvas screen) coordinates.
	 * @param x the horizontal coordinate 
	 * @param y the vertical coordinate
	 */
	coordToPixel(x: number, y: number): [number, number] {
		const [nx, ny] = this.view.actualToRelative(x, y)
		return [this.width * nx, this.height * ny]
	}

	/** Resize the renderer and the canvas to provided pixel counts.
	 * @param width of the resulting canvas.
	 * @param height of the resulting canvas.
	 */
	protected resizeCanvas(width: number, height: number) {
		const widthToHeight = width / height
		this.view.height *= height / this.height
		this.view.width = this.view.height * widthToHeight
		this.width = width
		this.height = height
	}

	/** Pan the image provide number of pixels to the side.
	 * @param dx horizontal number of pixels the image should be shifted by.
	 * @param dy vertical number of pixels the image should be shifted by.
	 */
	pan(dx: number, dy: number) {
		const rx = dx / this.width * this.view.width
		const ry = dy / this.height * this.view.height
		this.view.x -= rx
		this.view.y += ry
		this.draw()
	}

	/** Scale the rendered image by provided proportion around the provided pixel.
	 * @param x horizontal index of the pixel around which to scale.
	 * @param y vertical index of the pixel around which to scale.
	 * @param scale the multiplier of the width and height of the complex plane being rendered.
	 */
	zoom(x: number, y: number, scale: number) {
		this.view.x += (x / this.width - .5) * (this.view.width - this.view.width * scale)
		this.view.y += (.5 - y / this.height) * (this.view.height - this.view.height * scale)
		this.view.width *= scale
		this.view.height *= scale
		this.draw()
	}
}
