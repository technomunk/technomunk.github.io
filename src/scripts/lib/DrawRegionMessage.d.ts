/** A message sent to Worker telling them to draw a region of the image.
 */
interface DrawRegionMessage {
	/** The pixels to be filled by the worker. */
	pixels: ArrayBuffer,
	/** The canvas-space tile to fill. */
	tile: DOMRect,
	/** The rectangle of the Mandelbrot set to draw. */
	view: DOMRect,
	config: DrawConfig,
}
