export type ImageType = "mandel" | "julia";

/** Configuration used when rendering the julia set. */
export interface JuliaConfig {
	limit: number,
	escapeR: number,
	seed: [number, number],
}

/** Procedural image renderer. */
export interface Renderer {
	/** The region of the complex plane being rendered. */
	rect: DOMRect;

	/** Resize the renderer and the canvas to provided pixel counts.
	 * @param width of the resulting canvas.
	 * @param height of the resulting canvas.
	 */
	resize(width: number, height: number): void;

	/** Pan the image provide number of pixels to the side.
	 * @param dx horizontal number of pixels the image should be shifted by.
	 * @param dy vertical number of pixels the image should be shifted by.
	 */
	pan(dx: number, dy: number): void;

	/** Scale the rendered image by provided proportion around the provided pixel.
	 * @param x horizontal index of the pixel around which to scale.
	 * @param y vertical index of the pixel around which to scale.
	 * @param scale the multiplier of the width and height of the complex plane being rendered.
	 */
	zoom(x: number, y: number, scale: number): void;

	/** Queue the render of the image with provided configuration.
	 * @param config 
	 */
	draw(config: JuliaConfig): void;
}
