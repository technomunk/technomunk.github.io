const PLACEHOLDER_BUFFER = new Uint8ClampedArray();

/** Make sure the value is inside the provided range.
 * @param val The value.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 * @returns The number within the allowed range that is the closest to the provided value.
 */
function clamp(val: number, min: number, max: number): number {
	if (val < min) {
		return min;
	}
	if (val > max) {
		return max;
	}
	return val;
}

/** Check whether [ca, ca + cw] fully contains [a, a + aw].
 * @param a The beginning of the contained range.
 * @param aw The width of the contained range.
 * @param b The beginning of the containing range.
 * @param bw The width of the containing range.
 * @returns 
 */
function isFullyContained(a: number, aw: number, ca: number, cw: number) {
	let b = a + aw,
		cb = ca + cw;
	return (a >= ca) && (a <= cb)
		&& (b >= ca) && (b <= cb);
}

/** A view of a procedural image that can be panned or zoomed.
 * Takes a canvas element to draw the image on. Does not capture inputs, only handles drawing the actual image. 
 */
export class ProceduralImageView {

	public viewport: DOMRect;
	
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private chunkWidth: number;
	private chunkHeight: number;

	private freeWorkers: Array<[Worker, Uint8ClampedArray]>;
	private work: Array<DrawRegionMessage>;

	private updateInProgress = false;
	private updateQueued = false;
	
	private prefill = false;

	private offsetX = 0;
	private offsetY = 0;

	/// Disassembled clean rectangle for easy manipulation.
	private cleanX = 0;
	private cleanY = 0;
	private cleanW = 0;
	private cleanH = 0;

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
			let worker = new Worker('./dw.js');
			let pixels = new Uint8ClampedArray(chunkWidth * chunkHeight * 4);
			((worker: Worker, view: ProceduralImageView) => {
				worker.onmessage = (msg: MessageEvent<DrawRegionMessage>) => {
					let pixels = new Uint8ClampedArray(msg.data.pixels);
					if (msg.data.zoomW === this.viewport.width
						&& msg.data.zoomH === this.viewport.height
					) {
						view.context.putImageData(
							new ImageData(pixels, msg.data.width, msg.data.height),
							msg.data.pixelX + view.offsetX - msg.data.offsetX,
							msg.data.pixelY + view.offsetY - msg.data.offsetY);
					}
					let work = view.work.pop();
					if (work != null) {
						work.pixels = pixels.buffer;
						worker.postMessage(work, [work.pixels]);
					} else {
						view.freeWorkers.push([worker, pixels]);
						view.updateInProgress = false;
						if (view.updateQueued) {
							view.update();
						} else {
							view.cleanX = 0;
							view.cleanY = 0;
							view.cleanW = view.canvas.width;
							view.cleanH = view.canvas.height;
						}
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

	public set limit(value) {
		this.config.limit = value;
	}

	public get escapeRadius() {
		return this.config.escapeRadius;
	}

	public set escapeRadius(value) {
		this.config.escapeRadius = value;
	}

	public get fillStyle() {
		return this.prefill ? this.context.fillStyle : null;
	}

	public set fillStyle(value) {
		if (value != null) {
			this.prefill = true;
			this.context.fillStyle = value;
		} else {
			this.prefill = false;
		}
	}

	/** Update the displayed image using current config, effectively redrawing it.
	 */
	public update() {
		// Mark the clean rect as empty
		this.cleanW = 0;
		this.cleanH = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.updateDirty();
	}

	/** Perform update of only the dirty parts of the image.
	 *
	 * Useful after panning or zooming out, where part of the image is known to be correct.
	 */
	public updateDirty() {
		this.clearWork();
		this.updateQueued = false;
		this.updateInProgress = true;
		
		let chunksX = Math.ceil(this.canvas.width / this.chunkWidth),
			chunksY = Math.ceil(this.canvas.height / this.chunkHeight);

		const rectW = this.chunkWidth / this.canvas.width * this.viewport.width;
		const rectH = this.chunkHeight / this.canvas.height * this.viewport.height;

		for (var y = 0; y < chunksY; ++y) {
			const pixelY = y * this.chunkHeight;
			const rectY = this.viewport.y + (y * this.chunkHeight) / this.canvas.height * this.viewport.height;
			const cleanRow = isFullyContained(pixelY, this.chunkHeight, this.cleanY, this.cleanH);

			for (var x = 0; x < chunksX; ++x) {
				const pixelX = x * this.chunkWidth;
				if (cleanRow && isFullyContained(pixelX, this.chunkWidth, this.cleanX, this.cleanW)) {
					continue;
				}

				const rectX = this.viewport.x + (x * this.chunkWidth) / this.canvas.width * this.viewport.width;
				if (this.prefill) {
					this.context.fillRect(pixelX, pixelY, this.chunkWidth, this.chunkHeight);
				}
				this.queueWork({
					pixels: PLACEHOLDER_BUFFER,
					width: this.chunkWidth,
					height: this.chunkHeight,
					rect: new DOMRect(rectX, rectY, rectW, rectH),
					config: this.config,
					pixelX: pixelX,
					pixelY: pixelY,
					offsetX: this.offsetX,
					offsetY: this.offsetY,
					zoomW: this.viewport.width,
					zoomH: this.viewport.height,
				});
			}
		}

		this.work.reverse();
	}

	/** Update the image in the near future.
	 * 
	 * The update will be dispatched after the currently running one is finished or
	 * immediately if there are no running updates.
	 */
	public queueUpdate() {
		if (this.updateInProgress) {
			this.updateQueued = true;
		} else {
			this.update();
		}
	}

	/** Shift thee image provided number of pixels.
	 * @param {number} dx Horizontal number of pixels to shift the image by.
	 * @param {number} dy Vertical number of pixels to shift the image by.
	 */
	public pan(dx: number, dy: number) {
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

		// Move the clean image to correct spot.
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

		this.offsetX += dx;
		this.offsetY += dy;
		this.cleanX += dx;
		this.cleanY += dy;
		this.clampCleanRect();
	
		this.updateDirty();
	}

	/** Zoom the image in or out around a provided point.
	 * @param {number} x The horizontal index of the pixel around which to zoom.
	 * @param {number} y The vertical index of the pixel around which to zoom.
	 * @param {number} scale The ratio by how much to zoom the picture.
	 */
	public zoom(x: number, y: number, scale: number) {
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
		let fillStyle = this.context.fillStyle;
		this.viewport.width *= width / this.canvas.width;
		this.viewport.height *= height / this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.context.fillStyle = fillStyle;
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

	/** Make sure the clean rectangle has valid values. */
	private clampCleanRect() {
		if (this.cleanX < 0) {
			this.cleanW += this.cleanX;
			this.cleanX = 0;
		}
		if (this.cleanY < 0) {
			this.cleanH += this.cleanY;
			this.cleanY = 0;
		}
		if (this.cleanW + this.cleanX > this.canvas.width) {
			this.cleanW = this.canvas.width - this.cleanX;
		}
		if (this.cleanH + this.cleanY > this.canvas.height) {
			this.cleanH = this.canvas.height - this.cleanY;
		}
		if (this.cleanW < 0) {
			this.cleanW = 0;
		}
		if (this.cleanH < 0) {
			this.cleanH = 0;
		}
	}
}
