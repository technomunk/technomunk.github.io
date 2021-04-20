/** A message sent to Worker telling them to draw a region of the image.
 */
interface DrawRegionMessage {
	/** The pixels to be filled by the worker. */
	pixels: ArrayBuffer,
	/** The canvas-space tile to fill. */
	tile: DOMRect,
	/** The amount by which to divide tile rectangle to get intended complex numbers. */
	zoom: number
	config: DrawConfig,
}
