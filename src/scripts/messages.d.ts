/** A message sent to Worker telling them to draw a region of the image.
 */
interface DrawRegionMessage {
	image?: ImageData,
	rect: DOMRect,
	limit: number,
	viewport: DOMRect,
	offsetX: number,
	offsetY: number,
	pixelX: number,
	pixelY: number,
}
