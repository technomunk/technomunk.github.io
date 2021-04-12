const PLACEHOLDER_BUFFER = new Uint8ClampedArray();

/** A view of a procedural image that can be panned or zoomed.
 * Takes a canvas element to draw the image on. Does not capture inputs, only handles drawing the actual image. 
 */
export class ProceduralImageView {

	clearStyle?: string | CanvasGradient | CanvasPattern;
	viewport: DOMRect;

	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private chunkWidth: number;
	private chunkHeight: number;

	private freeWorkers: Array<[Worker, Uint8ClampedArray]>;
	private work: Array<DrawRegionMessage>;
	private limit: number;
	private offsetX: number;
	private offsetY: number;

	private cleanRect: DOMRect | null;

	/**
	 * @param {HTMLCanvasElement} canvas The canvas to use.
	 * @param {DOMRect} viewport The viewed region of the image.
	 * @param {number} workerCount Number of background workers to use. Must be at least 1.
	 * @param {number} chunkWidth Width of a single chunk of the processed image in pixels.
	 * @param {number} chunkHeight Height of a single chunk of the processed image in pixels.
	 */
	constructor(
		canvas: HTMLCanvasElement,
		viewport?: DOMRect,
		workerCount?: number,
		chunkWidth: number = 64,
		chunkHeight: number = 64,
	) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d')!;
		this.chunkWidth = chunkWidth;
		this.chunkHeight = chunkHeight;
		if (typeof(viewport) == "undefined") {
			// Default viewport centers around -1 because the mandelbrot look better that way.
			let ratio = this.canvas.width / this.canvas.height;
			this.viewport = new DOMRect(-.8 - 1.1*ratio, -1.1, 2.2*ratio, 2.2);
		} else {
			this.viewport = viewport;
		}
		workerCount = workerCount || window.navigator.hardwareConcurrency;
		this.freeWorkers = [];
		this.work = [];
		this.limit = 30;
		this.offsetX = 0;
		this.offsetY = 0;
		this.cleanRect = null;

		for (var i = 0; i < workerCount; ++i) {
			let worker = new Worker('./scripts/draw_worker.js');
			let pixels = new Uint8ClampedArray(chunkWidth * chunkHeight * 4);
			/// Capture index
			((worker: Worker, view: ProceduralImageView, index: number) => {
				worker.onmessage = (msg: MessageEvent<DrawRegionMessage>) => {
					let pixels = new Uint8ClampedArray(msg.data.pixels);
					if (msg.data.limit == view.limit
						&& msg.data.viewport.width == view.viewport.width
						&& msg.data.viewport.height == view.viewport.height
					) {
						let image = new ImageData(pixels, msg.data.width, msg.data.height);
						view.context.putImageData(
							image,
							msg.data.pixelX + view.offsetX - msg.data.offsetX,
							msg.data.pixelY + view.offsetY - msg.data.offsetY);
					}

					let work = view.work.pop();
					if (work != null) {
						work.pixels = pixels.buffer;
						worker.postMessage(work, [work.pixels]);
					} else {
						view.freeWorkers.push([worker, pixels]);
						view.cleanRect = view.viewport;
					}
				};
			})(worker, this, i);
			this.freeWorkers.push([worker, pixels]);
		}
	}

	/** Update part of the viewed image.
	 * @param {number} limit Maximum number of iterations to use when drawing the image. 
	 * @param {DOMRect} rect The region of the image to redraw (in pixels). Defaults to the whole image if null.
	 */
	update(limit: number, rect?: DOMRect) {
		if (this.limit != limit || rect == null) {
			this.clearWork();
		}

		rect = rect || new DOMRect(0, 0, this.canvas.width, this.canvas.height);
		this.limit = limit;

		let chunksX = rect.width / this.chunkWidth,
			chunksY = rect.height / this.chunkHeight;

		if (this.clearStyle != null) {
			this.context.fillStyle = this.clearStyle;
		}

		const rectW = this.chunkWidth / this.canvas.width * this.viewport.width;
		const rectH = this.chunkHeight / this.canvas.height * this.viewport.height;

		// this.context.fillStyle = 'green';
		for (var y = 0; y < chunksY; ++y) {
			const pixelY = rect.y + y * this.chunkHeight;
			const rectY = this.viewport.y + (rect.y + y * this.chunkHeight) / this.canvas.height * this.viewport.height;

			for (var x = 0; x < chunksX; ++x) {
				const pixelX = rect.x + x * this.chunkWidth;
				const rectX = this.viewport.x + (rect.x + x * this.chunkWidth) / this.canvas.width * this.viewport.width;

				// this.context.fillRect(pixelX, pixelY, this.chunkWidth, this.chunkHeight);
				this.queueWork({
					pixels: PLACEHOLDER_BUFFER,
					width: this.chunkWidth,
					height: this.chunkHeight,
					rect: new DOMRect(rectX, rectY, rectW, rectH),
					limit: limit,
					pixelX: pixelX,
					pixelY: pixelY,
					viewport: DOMRect.fromRect(this.viewport),
					offsetX: this.offsetX,
					offsetY: this.offsetY
				});
			}
		}

		this.work.reverse();
	}

	/** Reset the viewport to default state and redraw the image with provided limit.
	 * @param {number} limit Maximum number of iterations to use when drawing the image.
	 */
	reset(limit: number) {
		this.clearWork();
		if (this.canvas.width >= this.canvas.height) {
			let ratio = this.canvas.width / this.canvas.height;
			this.viewport = new DOMRect(-ratio, -1, 2*ratio, 2);
		} else {
			let ratio = this.canvas.height / this.canvas.height;
			this.viewport = new DOMRect(-1, -ratio, 2, 2*ratio);
		}
		this.update(limit);
	}

	/** Shift thee image provided number of pixels.
	 * @param {number} x Horizontal number of pixels to shift the image by.
	 * @param {number} y Vertical number of pixels to shift the image by.
	 */
	pan(x: number, y: number) {
		this.clearWork();

		let midX = x >= 0 ? x : this.canvas.width + x,
			midY = y >= 0 ? y : this.canvas.height + y,
			quadrants: DOMRect[] = [];
		
		this.viewport.x -= x / this.canvas.width * this.viewport.width;
		this.viewport.y -= y / this.canvas.height * this.viewport.height;

		this.offsetX += x;
		this.offsetY += y;

		quadrants = [
			new DOMRect(0, 0, midX, midY),
			new DOMRect(midX, 0, this.canvas.width - midX, midY),
			new DOMRect(0, midY, midX, this.canvas.height - midY),
			new DOMRect(midX, midY, this.canvas.width - midX, this.canvas.height - midY),
		];

		// Remove the clean quadrant.
		if (x < 0 && y < 0) {
			let imageData = this.context.getImageData(-x, -y, quadrants[0].width, quadrants[0].height);
			this.context.putImageData(imageData, 0, 0);
		} else if (x >= 0 && y < 0) {
			let imageData = this.context.getImageData(0, -y, quadrants[1].width, quadrants[1].height);
			this.context.putImageData(imageData, x, 0);
		} else if (x < 0 && y >= 0) {
			let imageData = this.context.getImageData(-x, 0, quadrants[2].width, quadrants[2].height);
			this.context.putImageData(imageData, 0, y);
		} else if (x >= 0 && y >= 0) {
			let imageData = this.context.getImageData(0, 0, quadrants[3].width, quadrants[3].height);
			this.context.putImageData(imageData, x, y);
		}
	
		this.update(this.limit);
	}

	/** Zoom the image in or out around a provided point.
	 * @param {number} x The horizontal index of the pixel around which to zoom.
	 * @param {number} y The vertical index of the pixel around which to zoom.
	 * @param {number} scale The ratio by how much to zoom the picture.
	 */
	zoom(x: number, y: number, scale: number) {
		this.clearWork();

		let relX = x / this.canvas.width,
			relY = y / this.canvas.height,
			pointX = this.viewport.x + this.viewport.width * relX,
			pointY = this.viewport.y + this.viewport.height * relY;
		
		this.viewport.width *= scale;
		this.viewport.height *= scale;
		this.viewport.x = pointX - this.viewport.width * relX;
		this.viewport.y = pointY - this.viewport.height * relY;

		// Reuse the existent image while the workers are redrawing it.
		if (scale > 1) {
			let invScale = 1 / scale;
			this.context.drawImage(
				this.canvas,
				this.canvas.width * relX - this.canvas.width * relX * invScale,
				this.canvas.height * relY - this.canvas.height * relY * invScale,
				this.canvas.width * invScale,
				this.canvas.height * invScale);
		} else {
			this.context.drawImage(
				this.canvas,
				this.canvas.width * relX - this.canvas.width * relX * scale,
				this.canvas.height * relY - this.canvas.height * relY * scale,
				this.canvas.width * scale,
				this.canvas.height * scale,
				0,
				0,
				this.canvas.width,
				this.canvas.height);
		}

		this.update(this.limit);
	}

	/** Resize the view.
	 * @param {number} width The new width of the view in pixels.
	 * @param {number} height The new height of the view in pixels.
	 */
	resize(width: number, height: number) {
		this.clearWork();
		this.viewport.width *= width / this.canvas.width;
		this.viewport.height *= height / this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.update(this.limit);
	}

	/** Clear any queued work */
	private clearWork() {
		this.work.length = 0;
	}

	/** Queue a piece of work to be done. */
	private queueWork(work: DrawRegionMessage) {
		let free = this.freeWorkers.pop();
		if (free != null) {
			work.pixels = free[1].buffer;
			free[0].postMessage(work, [work.pixels]);
		} else {
			this.work.push(work);
		}
	}
}
