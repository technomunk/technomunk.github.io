/** A message sent to Worker telling them to draw a region of the image.
 */
interface DrawRegionMessage {
	/** The pixels to be filled by the worker. */
	pixels: ArrayBuffer,
	/** Number of horizontal pixels in the image. */
	width: number,
	/** Number of vertical pixels in the image. */
	height: number,
	/** The rectangle of the Mandelbrot set to draw. */
	rect: DOMRect,
	/** The limit of calculations. */
	limit: number,

	pixelX: number,
	pixelY: number,

	viewport: DOMRect,
	offsetX: number,
	offsetY: number,
}
