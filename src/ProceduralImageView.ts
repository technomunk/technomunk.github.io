const PLACEHOLDER_BUFFER = new Uint8ClampedArray();

/** A view of a procedural image that can be panned or zoomed.
 * Takes a canvas element to draw the image on. Does not capture inputs, only handles drawing the actual image. 
 */
export class ProceduralImageView {

	public clearStyle?: string | CanvasGradient | CanvasPattern;
	public viewport: DOMRect;
	
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private chunkWidth: number;
	private chunkHeight: number;

	private freeWorkers: Array<[Worker, Uint8ClampedArray]>;
	private work: Array<DrawRegionMessage>;

	private config = {
		limit: 30,
		escapeRadius: 4,
	};

	/**
	 * @param {HTMLCanvasElement} canvas The canvas to use.
	 * @param {DOMRect} viewport The viewed region of the image.
	 * @param {number} workerCount Number of background workers to use. Must be at least 1.
	 * @param {number} chunkWidth Width of a single chunk of the processed image in pixels.
	 * @param {number} chunkHeight Height of a single chunk of the processed image in pixels.
	 */
	public constructor(
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
		this.viewport = viewport || this.defaultViewport;
		workerCount = workerCount || window.navigator.hardwareConcurrency;
		this.freeWorkers = [];
		this.work = [];

		for (var i = 0; i < workerCount; ++i) {
			let worker = new Worker('./scripts/draw_worker.js');
			let pixels = new Uint8ClampedArray(chunkWidth * chunkHeight * 4);
			((worker: Worker, view: ProceduralImageView) => {
				worker.onmessage = (msg: MessageEvent<DrawRegionMessage>) => {
					let pixels = new Uint8ClampedArray(msg.data.pixels);
					let image = new ImageData(pixels, msg.data.width, msg.data.height);
					view.context.putImageData(image, msg.data.pixelX, msg.data.pixelY);
					let work = view.work.pop();
					if (work != null) {
						work.pixels = pixels.buffer;
						worker.postMessage(work, [work.pixels]);
					} else {
						view.freeWorkers.push([worker, pixels]);
					}
				};
			})(worker, this);
			this.freeWorkers.push([worker, pixels]);
		}
	}

	/** Get default viewport for the current canvas. */
	public get defaultViewport() {
		if (this.canvas.width >= this.canvas.height) {
			let ratio = this.canvas.width / this.canvas.height;
			return new DOMRect(-ratio, -1, 2*ratio, 2);
		} else {
			let ratio = this.canvas.height / this.canvas.height;
			return new DOMRect(-1, -ratio, 2, 2*ratio);
		}
	}

	public get limit() {
		return this.config.limit;
	}

	public set limit(value: number) {
		this.config.limit = value;
	}

	public get escapeRadius() {
		return this.config.escapeRadius;
	}

	public set escapeRadius(value: number) {
		this.config.escapeRadius = value;
	}

	/** Update part of the viewed image.
	 * @param {number} limit Maximum number of iterations to use when drawing the image. 
	 * @param {DOMRect} rect The region of the image to redraw (in pixels). Defaults to the whole image if null.
	 */
	public update(rect?: DOMRect) {
		if (rect == null) {
			this.clearWork();
		}

		rect = rect || new DOMRect(0, 0, this.canvas.width, this.canvas.height);

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
					config: this.config,
					pixelX: pixelX,
					pixelY: pixelY,
				});
			}
		}

		this.work.reverse();
	}

	/** Shift thee image provided number of pixels.
	 * @param {number} dx Horizontal number of pixels to shift the image by.
	 * @param {number} dy Vertical number of pixels to shift the image by.
	 */
	public pan(dx: number, dy: number) {
		this.clearWork();

		let midX = dx >= 0 ? dx : this.canvas.width + dx,
			midY = dy >= 0 ? dy : this.canvas.height + dy,
			quadrants: DOMRect[] = [];
		
		this.viewport.x -= dx / this.canvas.width * this.viewport.width;
		this.viewport.y -= dy / this.canvas.height * this.viewport.height;

		quadrants = [
			new DOMRect(0, 0, midX, midY),
			new DOMRect(midX, 0, this.canvas.width - midX, midY),
			new DOMRect(0, midY, midX, this.canvas.height - midY),
			new DOMRect(midX, midY, this.canvas.width - midX, this.canvas.height - midY),
		];

		// Remove the clean quadrant.
		if (dx < 0 && dy < 0) {
			let imageData = this.context.getImageData(-dx, -dy, quadrants[0].width, quadrants[0].height);
			this.context.putImageData(imageData, 0, 0);
		} else if (dx >= 0 && dy < 0) {
			let imageData = this.context.getImageData(0, -dy, quadrants[1].width, quadrants[1].height);
			this.context.putImageData(imageData, dx, 0);
		} else if (dx < 0 && dy >= 0) {
			let imageData = this.context.getImageData(-dx, 0, quadrants[2].width, quadrants[2].height);
			this.context.putImageData(imageData, 0, dy);
		} else if (dx >= 0 && dy >= 0) {
			let imageData = this.context.getImageData(0, 0, quadrants[3].width, quadrants[3].height);
			this.context.putImageData(imageData, dx, dy);
		}
	
		this.update();
	}

	/** Zoom the image in or out around a provided point.
	 * @param {number} x The horizontal index of the pixel around which to zoom.
	 * @param {number} y The vertical index of the pixel around which to zoom.
	 * @param {number} scale The ratio by how much to zoom the picture.
	 */
	public zoom(x: number, y: number, scale: number) {
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

		this.update();
	}

	/** Resize the view.
	 * @param {number} width The new width of the view in pixels.
	 * @param {number} height The new height of the view in pixels.
	 */
	public resize(width: number, height: number) {
		this.viewport.width *= width / this.canvas.width;
		this.viewport.height *= height / this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.update();
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
